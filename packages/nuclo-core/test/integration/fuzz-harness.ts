/// <reference path="../../types/index.d.ts" />
/**
 * Model-based differential fuzz harness.
 *
 * A seeded generator produces a random component spec (nested elements, static
 * / reactive text, attributes, classNames, inline style, when() chains, keyed
 * list()s with nested lists, primitive lists, SVG, click handlers, lifecycle
 * hooks) plus a mutable state object. The spec is rendered two ways:
 *
 *   - build():  the real thing — nuclo tag builders closing over the state;
 *   - model():  an independent, string-only reference renderer.
 *
 * After every operation (render / renderToString+hydrate / update() /
 * forceUpdate()) the live DOM is normalized by snap() and must equal the
 * model's output for the current state. Because the oracle never touches
 * nuclo, it also catches bugs a "compare against a fresh nuclo render" check
 * would share (e.g. list row-template divergences on first render).
 *
 * Generator rules that keep the comparison free of *documented* limitations:
 *   - hydrate()/forceUpdate() reuse elements positionally and keep attributes
 *     the new tree no longer sets, so every element of a given tag carries the
 *     same attribute keys (per-seed "tag plan"); only values vary.
 *   - Only <button> is clickable and only <article> has lifecycle hooks, with
 *     one registration flavor per seed, for the same reason.
 *   - No tags with HTML-parser fix-ups (p, li, table…): SSR output must parse
 *     back to the same tree.
 *   - Attribute/style resolvers never return null (null means "leave as is").
 */
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { NucloDocument } from "../../src/polyfill/Document";
import { NucloElement } from "../../src/polyfill/Element";
import { NucloNode } from "../../src/polyfill/Node";
import "../../src";

// ─── PRNG ────────────────────────────────────────────────────────────────────

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng: Rng, n: number): number => Math.floor(rng() * n);
const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[int(rng, arr.length)]!;
const chance = (rng: Rng, p: number): boolean => rng() < p;

// ─── State ───────────────────────────────────────────────────────────────────

export interface Item {
  readonly id: number;
  readonly kind: 0 | 1;
  label: string;
  flag: boolean;
  kids: Item[];
}

export interface State {
  texts: Array<string | number | null | undefined>;
  flags: boolean[];
  classes: string[];
  attrs: string[];
  colors: string[];
  /** Read once, while the tree is built — only forceUpdate() refreshes them. */
  statics: Array<string | number>;
  sflags: boolean[];
  lists: Item[][];
  prims: Array<Array<number | string>>;
  nextId: number;
}

const SLOTS = 4;
const TEXT_POOL: ReadonlyArray<string | number | null | undefined> = [
  "", " ", "a", "hello", "x < y & z", "\"quoted\" 'single'", "  padded  ", 0, 42, -1.5, null, undefined, "</div>", "&amp;",
];
const STATIC_POOL: ReadonlyArray<string | number> = ["s1", "", " ", "static & <b>", 3, "S", "two words"];
const CLASS_POOL = ["", "a", "a b", "b c", "c", "a  b", "d-1 e_2"] as const;
const ATTR_POOL = ["", "v", "va lue", "\"q\"", "<&>", "long-value-0123456789"] as const;
const COLOR_POOL = ["red", "blue", "", "green"] as const;
const LABEL_POOL = ["one", "two", "", "three & <3", " ", "four"] as const;

function newItem(rng: Rng, state: State, depth: number): Item {
  const kids: Item[] = [];
  if (depth < 2 && chance(rng, 0.35)) {
    const n = int(rng, 4);
    for (let i = 0; i < n; i++) kids.push(newItem(rng, state, depth + 1));
  }
  return { id: state.nextId++, kind: int(rng, 2) as 0 | 1, label: pick(rng, LABEL_POOL), flag: chance(rng, 0.5), kids };
}

export function genState(rng: Rng, maxListSize = 6): State {
  const state: State = {
    texts: [], flags: [], classes: [], attrs: [], colors: [], statics: [], sflags: [], lists: [], prims: [], nextId: 1,
  };
  for (let i = 0; i < SLOTS; i++) {
    state.texts.push(pick(rng, TEXT_POOL));
    state.flags.push(chance(rng, 0.5));
    state.classes.push(pick(rng, CLASS_POOL));
    state.attrs.push(pick(rng, ATTR_POOL));
    state.colors.push(pick(rng, COLOR_POOL));
    state.statics.push(pick(rng, STATIC_POOL));
    state.sflags.push(chance(rng, 0.5));
    const items: Item[] = [];
    const n = int(rng, maxListSize + 1);
    for (let j = 0; j < n; j++) items.push(newItem(rng, state, 0));
    state.lists.push(items);
    state.prims.push(randomPrims(rng));
  }
  return state;
}

function randomPrims(rng: Rng): Array<number | string> {
  const n = int(rng, 7);
  const out: Array<number | string> = [];
  for (let i = 0; i < n; i++) out.push(chance(rng, 0.8) ? int(rng, 4) : pick(rng, ["x", "y"]));
  return out;
}

function allItems(state: State): Item[] {
  const out: Item[] = [];
  const walk = (items: Item[]): void => {
    for (const item of items) {
      out.push(item);
      walk(item.kids);
    }
  };
  for (const items of state.lists) walk(items);
  return out;
}

/** One random keyed-list operation; returns the (possibly new) array. */
function mutateItems(rng: Rng, state: State, items: Item[], depth: number): Item[] {
  const a = chance(rng, 0.5) ? items : items.slice();
  const n = a.length;
  switch (int(rng, 16)) {
    case 0: a.push(newItem(rng, state, depth)); break;
    case 1: a.unshift(newItem(rng, state, depth)); break;
    case 2: a.splice(int(rng, n + 1), 0, newItem(rng, state, depth)); break;
    case 3: if (n) a.splice(int(rng, n), 1); break;
    case 4: if (n) a.splice(int(rng, n), 1 + int(rng, 3)); break;
    case 5: if (n > 1) { const i = int(rng, n), j = int(rng, n); const t = a[i]!; a[i] = a[j]!; a[j] = t; } break;
    case 6: a.reverse(); break;
    case 7: for (let i = n - 1; i > 0; i--) { const j = int(rng, i + 1); const t = a[i]!; a[i] = a[j]!; a[j] = t; } break;
    case 8: a.length = 0; break;
    case 9: { const m = int(rng, 5); a.length = 0; for (let i = 0; i < m; i++) a.push(newItem(rng, state, depth)); break; }
    case 10: if (n) a[int(rng, n)] = newItem(rng, state, depth); break;
    case 11: if (n) a.splice(int(rng, n + 1), 0, a[int(rng, n)]!); break; // duplicate reference
    case 12: if (n) a.push(a.shift()!); break;
    case 13: a.sort((x, y) => x.id - y.id); break;
    case 14: { const m = 8 + int(rng, 40); for (let i = 0; i < m; i++) a.push(newItem(rng, state, 2)); break; }
    case 15: if (n > 2) { const moved = a.splice(int(rng, n), 1)[0]!; a.splice(int(rng, a.length + 1), 0, moved); } break;
  }
  return a;
}

/** Mutates state that reactive resolvers read — update() must reflect it. */
export function mutateReactive(rng: Rng, state: State): void {
  const ops = 1 + int(rng, 4);
  for (let o = 0; o < ops; o++) {
    const k = int(rng, SLOTS);
    switch (int(rng, 10)) {
      case 0: state.texts[k] = pick(rng, TEXT_POOL); break;
      case 1: state.flags[k] = !state.flags[k]; break;
      case 2: state.classes[k] = pick(rng, CLASS_POOL); break;
      case 3: state.attrs[k] = pick(rng, ATTR_POOL); break;
      case 4: state.colors[k] = pick(rng, COLOR_POOL); break;
      case 5:
      case 6: state.lists[k] = mutateItems(rng, state, state.lists[k]!, 0); break;
      case 7: state.prims[k] = randomPrims(rng); break;
      case 8:
      case 9: {
        const items = allItems(state);
        if (!items.length) break;
        const item = pick(rng, items);
        const what = int(rng, 3);
        if (what === 0) item.label = pick(rng, LABEL_POOL);
        else if (what === 1) item.flag = !item.flag;
        else item.kids = mutateItems(rng, state, item.kids, 2);
        break;
      }
    }
  }
}

/** Mutates state captured at build time — only forceUpdate() may reflect it. */
export function mutateStatics(rng: Rng, state: State): void {
  const ops = 1 + int(rng, 3);
  for (let o = 0; o < ops; o++) {
    const k = int(rng, SLOTS);
    if (chance(rng, 0.5)) state.statics[k] = pick(rng, STATIC_POOL);
    else state.sflags[k] = !state.sflags[k];
  }
}

// ─── Spec ────────────────────────────────────────────────────────────────────

type ValueSrc =
  | { f: "const"; v: string }
  | { f: "static"; k: number }
  | { f: "reactive"; k: number }
  | { f: "item" };

type ClassSrc =
  | { f: "static"; v: string }
  | { f: "reactive"; k: number }
  | { f: "both"; v: string; k: number; rev: boolean }
  | { f: "cx"; k: number }
  | { f: "item"; v: string };

type Cond = { f: "flag"; k: number } | { f: "sflag"; k: number } | { f: "item" } | { f: "const"; v: boolean };

interface ElSpec {
  t: "el";
  id: number;
  tag: string;
  title?: ValueSrc;
  data?: ValueSrc;
  cls?: ClassSrc;
  /**
   * Content written by an attribute instead of children: `textContent` on
   * every <code>, `innerHTML` on every <samp>. Static sources read
   * state.statics[k] at build time, reactive ones state.texts/attrs[k].
   */
  content?: { kind: "text" | "html"; f: "static" | "reactive" | "item"; k: number };
  /** Reactive: color from state.colors[k]; otherwise the constant `v`. */
  style?: { reactive: true; k: number } | { reactive: false; v: string };
  mods: Mod[];
}

type Mod =
  | ElSpec
  | { t: "text"; v: string | number }
  | { t: "stext"; k: number }
  | { t: "rtext"; k: number }
  | { t: "itext" }
  | { t: "iid" }
  | { t: "null" }
  | { t: "cond"; k: number; mod: Mod }
  | { t: "when"; groups: Array<{ cond: Cond; content: Mod[] }>; otherwise: Mod[] | null }
  | { t: "list"; id: number; src: { f: "state"; k: number } | { f: "kids" }; rows: [ElSpec, ElSpec] }
  | { t: "plist"; k: number }
  | { t: "svg"; k: number };

interface TagPlan { title: boolean; data: boolean; style: boolean }

export interface AppSpec {
  root: ElSpec;
  clickFlavor: 1 | 2;
  lcFlavor: 1 | 2;
}

export interface GenOptions {
  /** Generate <article> elements with mount/destroy hooks. */
  lifecycle: boolean;
  maxDepth?: number;
}

const CONTAINER_TAGS = ["div", "span", "section", "em", "header"] as const;

/** innerHTML snippets and what they parse to, in snap()/model() notation. */
const HTML_POOL = ["", "<b>x</b>", "plain &amp; simple", "<i>a</i><u>b</u>tail"] as const;
const HTML_POOL_MODEL = ["", '<b>"x"</b>', '"plain & simple"', '<i>"a"</i><u>"b"</u>"tail"'] as const;

function contentText(content: NonNullable<ElSpec["content"]>, state: State, item: Item | null): string {
  if (content.f === "item") return item!.label;
  if (content.f === "static") return String(state.statics[content.k]);
  const v = state.texts[content.k];
  return v == null ? "" : String(v);
}

function contentHtmlIndex(content: NonNullable<ElSpec["content"]>, state: State, item: Item | null): number {
  const basis = content.f === "item" ? item!.label : content.f === "static" ? String(state.statics[content.k]) : state.attrs[content.k]!;
  return basis.length % HTML_POOL.length;
}

interface Gen {
  rng: Rng;
  nextId: number;
  plans: Map<string, TagPlan>;
  maxDepth: number;
  lifecycle: boolean;
}

function planFor(g: Gen, tag: string): TagPlan {
  let plan = g.plans.get(tag);
  if (!plan) {
    plan = tag === "input"
      ? { title: false, data: false, style: false }
      : { title: chance(g.rng, 0.3), data: chance(g.rng, 0.3), style: chance(g.rng, 0.2) };
    g.plans.set(tag, plan);
  }
  return plan;
}

function genValueSrc(g: Gen, inRow: boolean): ValueSrc {
  const r = g.rng();
  if (r < 0.4) return { f: "const", v: pick(g.rng, ATTR_POOL) };
  if (r < 0.6) return { f: "static", k: int(g.rng, SLOTS) };
  if (r < 0.8 || !inRow) return { f: "reactive", k: int(g.rng, SLOTS) };
  return { f: "item" };
}

function genClassSrc(g: Gen, inRow: boolean): ClassSrc | undefined {
  const r = g.rng();
  if (r < 0.35) return undefined;
  if (r < 0.5) return { f: "static", v: pick(g.rng, CLASS_POOL) };
  if (r < 0.65) return { f: "reactive", k: int(g.rng, SLOTS) };
  if (r < 0.8) return { f: "both", v: pick(g.rng, CLASS_POOL), k: int(g.rng, SLOTS), rev: chance(g.rng, 0.5) };
  if (r < 0.9 || !inRow) return { f: "cx", k: int(g.rng, SLOTS) };
  return { f: "item", v: pick(g.rng, ["on", "sel x"]) };
}

function genEl(g: Gen, depth: number, inRow: boolean, listDepth: number, simple = false): ElSpec {
  const r = g.rng();
  let tag: string;
  if (r < 0.1) tag = "button";
  else if (r < 0.15 && !simple) tag = "input";
  else if (r < 0.19 && !simple) tag = "code";
  else if (r < 0.22 && !simple) tag = "samp";
  else if (r < 0.3 && g.lifecycle && !simple) tag = "article";
  else tag = pick(g.rng, CONTAINER_TAGS);

  const plan = planFor(g, tag);
  const spec: ElSpec = { t: "el", id: g.nextId++, tag, mods: [] };
  if (plan.title) spec.title = simple ? { f: "const", v: pick(g.rng, ATTR_POOL) } : genValueSrc(g, inRow);
  if (plan.data) spec.data = simple ? { f: "const", v: pick(g.rng, ATTR_POOL) } : genValueSrc(g, inRow);
  if (plan.style) {
    spec.style = chance(g.rng, 0.5)
      ? { reactive: true, k: int(g.rng, SLOTS) }
      : { reactive: false, v: pick(g.rng, COLOR_POOL) };
  }
  if (tag !== "input") {
    spec.cls = simple
      ? pick<ClassSrc | undefined>(g.rng, [undefined, { f: "static", v: "row" }, { f: "item", v: "on" }, { f: "reactive", k: int(g.rng, SLOTS) }])
      : genClassSrc(g, inRow);
  }

  if (tag === "input") return spec;
  if (tag === "code" || tag === "samp") {
    const r2 = g.rng();
    spec.content = {
      kind: tag === "code" ? "text" : "html",
      f: inRow && r2 < 0.3 ? "item" : r2 < 0.6 ? "static" : "reactive",
      k: int(g.rng, SLOTS),
    };
    return spec;
  }
  if (tag === "button") {
    spec.mods = genLeafMods(g, inRow);
    return spec;
  }
  spec.mods = simple ? genSimpleRowMods(g, depth) : genMods(g, depth + 1, inRow, listDepth, int(g.rng, 5));
  return spec;
}

function genLeafMods(g: Gen, inRow: boolean): Mod[] {
  const mods: Mod[] = [];
  const n = int(g.rng, 3);
  for (let i = 0; i < n; i++) mods.push(genTextMod(g, inRow));
  return mods;
}

function genTextMod(g: Gen, inRow: boolean): Mod {
  const r = g.rng();
  if (inRow && r < 0.3) return { t: "itext" };
  if (inRow && r < 0.45) return { t: "iid" };
  if (r < 0.6) return { t: "text", v: pick(g.rng, TEXT_POOL.filter((v): v is string | number => v != null)) };
  if (r < 0.72) return { t: "stext", k: int(g.rng, SLOTS) };
  if (r < 0.95) return { t: "rtext", k: int(g.rng, SLOTS) };
  return { t: "null" };
}

/** Rows the list() row-template engine can clone: text, events, plain children. */
function genSimpleRowMods(g: Gen, depth: number): Mod[] {
  const mods: Mod[] = [];
  const n = 1 + int(g.rng, 4);
  for (let i = 0; i < n; i++) {
    if (depth < 2 && chance(g.rng, 0.35)) mods.push(genEl(g, depth + 1, true, 9, true));
    else mods.push(genTextMod(g, true));
  }
  return mods;
}

function genMods(g: Gen, depth: number, inRow: boolean, listDepth: number, count: number): Mod[] {
  const mods: Mod[] = [];
  const deep = depth >= g.maxDepth;
  for (let i = 0; i < count; i++) {
    const r = g.rng();
    if (deep || r < 0.4) {
      mods.push(genTextMod(g, inRow));
    } else if (r < 0.62) {
      mods.push(genEl(g, depth, inRow, listDepth));
    } else if (r < 0.68) {
      mods.push({ t: "cond", k: int(g.rng, SLOTS), mod: chance(g.rng, 0.5) ? genTextMod(g, inRow) : genEl(g, depth, inRow, listDepth) });
    } else if (r < 0.82) {
      mods.push(genWhen(g, depth, inRow, listDepth));
    } else if (r < 0.93 && listDepth < 2) {
      mods.push(genList(g, depth, inRow, listDepth));
    } else if (r < 0.97) {
      mods.push({ t: "plist", k: int(g.rng, SLOTS) });
    } else {
      mods.push({ t: "svg", k: int(g.rng, SLOTS) });
    }
  }
  return mods;
}

function genCond(g: Gen, inRow: boolean): Cond {
  const r = g.rng();
  if (inRow && r < 0.4) return { f: "item" };
  if (r < 0.75) return { f: "flag", k: int(g.rng, SLOTS) };
  if (r < 0.92) return { f: "sflag", k: int(g.rng, SLOTS) };
  return { f: "const", v: chance(g.rng, 0.5) };
}

function genWhen(g: Gen, depth: number, inRow: boolean, listDepth: number): Mod {
  const groups: Array<{ cond: Cond; content: Mod[] }> = [];
  const n = 1 + int(g.rng, 3);
  for (let i = 0; i < n; i++) {
    groups.push({ cond: genCond(g, inRow), content: genMods(g, depth + 1, inRow, listDepth, 1 + int(g.rng, 3)) });
  }
  const otherwise = chance(g.rng, 0.5) ? genMods(g, depth + 1, inRow, listDepth, 1 + int(g.rng, 2)) : null;
  return { t: "when", groups, otherwise };
}

function genList(g: Gen, depth: number, inRow: boolean, listDepth: number): Mod {
  const simple = chance(g.rng, 0.5);
  const row0 = genEl(g, depth + 1, true, listDepth + 1, simple);
  // Heterogeneous lists pick the row shape by item.kind; homogeneous lists
  // share one shape (what the row-template engine is built for).
  const row1 = chance(g.rng, 0.3) ? genEl(g, depth + 1, true, listDepth + 1, simple && chance(g.rng, 0.5)) : row0;
  const src = inRow && chance(g.rng, 0.6) ? ({ f: "kids" } as const) : ({ f: "state", k: int(g.rng, SLOTS) } as const);
  return { t: "list", id: g.nextId++, src, rows: [row0, row1] };
}

export function genApp(rng: Rng, opts: GenOptions): AppSpec {
  const g: Gen = { rng, nextId: 1, plans: new Map(), maxDepth: opts.maxDepth ?? 3, lifecycle: opts.lifecycle };
  const root: ElSpec = { t: "el", id: g.nextId++, tag: "div", mods: [] };
  root.cls = genClassSrc(g, false);
  root.mods = genMods(g, 1, false, 0, 2 + int(rng, 5));
  return { root, clickFlavor: chance(rng, 0.5) ? 1 : 2, lcFlavor: chance(rng, 0.5) ? 1 : 2 };
}

// ─── build(): spec → nuclo tree ──────────────────────────────────────────────

export interface Hooks {
  /** uid of every click handler invocation, in call order. */
  clicks: string[];
  mounted: Set<Element>;
  destroyed: Set<Element>;
  cleanedUp: Set<Element>;
  violations: string[];
}

export function makeHooks(): Hooks {
  return { clicks: [], mounted: new Set(), destroyed: new Set(), cleanedUp: new Set(), violations: [] };
}

interface Env {
  state: State;
  item: Item | null;
  path: string;
  hooks: Hooks;
  app: AppSpec;
}

type Builder = (...mods: unknown[]) => unknown;
const tagBuilder = (name: string): Builder => (globalThis as unknown as Record<string, Builder>)[name]!;

const tokens = (v: string): string[] => v.split(" ").filter(Boolean);

function buildValue(src: ValueSrc, env: Env): unknown {
  switch (src.f) {
    case "const": return src.v;
    case "static": return String(env.state.statics[src.k]);
    case "reactive": { const { state } = env; return () => state.attrs[src.k]; }
    case "item": { const item = env.item!; return () => item.label; }
  }
}

function buildCond(cond: Cond, env: Env): boolean | (() => boolean) {
  switch (cond.f) {
    case "flag": { const { state } = env; return () => state.flags[cond.k]!; }
    case "sflag": return env.state.sflags[cond.k]!;
    case "item": { const item = env.item!; return () => item.flag; }
    case "const": return cond.v;
  }
}

function buildEl(s: ElSpec, env: Env): unknown {
  const { state, hooks } = env;
  const args: unknown[] = [];
  const attrs: Record<string, unknown> = {};
  let extra: unknown = null;

  if (s.title) attrs.title = buildValue(s.title, env);
  if (s.data) attrs["data-a"] = buildValue(s.data, env);
  if (s.style) {
    const style = s.style;
    attrs.style = style.reactive ? () => ({ color: state.colors[style.k] }) : { color: style.v };
  }
  if (s.tag === "input") {
    attrs.type = "checkbox";
    const k = s.id % SLOTS;
    attrs.checked = () => state.flags[k];
  }
  if (s.content) {
    const content = s.content;
    const item = env.item;
    const key = content.kind === "text" ? "textContent" : "innerHTML";
    const read = content.kind === "text"
      ? () => contentText(content, state, item)
      : () => HTML_POOL[contentHtmlIndex(content, state, item)];
    attrs[key] = content.f === "static" ? read() : read;
  }
  const cls = s.cls;
  if (cls) {
    switch (cls.f) {
      case "static": attrs.className = cls.v; break;
      case "reactive": attrs.className = () => state.classes[cls.k]; break;
      case "both":
        if (cls.rev) { attrs.className = () => state.classes[cls.k]; extra = { className: cls.v }; }
        else { attrs.className = cls.v; extra = { className: () => state.classes[cls.k] }; }
        break;
      case "cx": extra = () => ({ className: state.classes[cls.k]! }); break;
      case "item": { const item = env.item!; attrs.className = () => (item.flag ? cls.v : ""); break; }
    }
  }

  const uid = `${s.id}@${env.path}`;
  if (s.tag === "button" && env.app.clickFlavor === 2) attrs.onClick = () => { hooks.clicks.push(uid); };
  if (s.tag === "article" && env.app.lcFlavor === 2) {
    attrs.onMount = (el: Element) => onMounted(hooks, el);
    attrs.onDestroy = (el: Element) => onDestroyed(hooks, el);
  }

  let hasAttrs = false;
  for (const _ in attrs) { hasAttrs = true; break; }
  if (hasAttrs) args.push(attrs);
  if (extra) args.push(extra);
  if (s.tag === "button" && env.app.clickFlavor === 1) args.push(on("click", () => { hooks.clicks.push(uid); }));
  if (s.tag === "article" && env.app.lcFlavor === 1) {
    args.push(on("mount", (el: Element) => onMounted(hooks, el)));
    args.push(on("destroy", (el: Element) => onDestroyed(hooks, el)));
  }
  for (const m of s.mods) args.push(buildMod(m, env));
  return tagBuilder(s.tag)(...args);
}

function onMounted(hooks: Hooks, el: Element): () => void {
  if (hooks.mounted.has(el)) hooks.violations.push("mount fired twice for one element");
  if (!el.isConnected) hooks.violations.push("mount fired on a disconnected element");
  hooks.mounted.add(el);
  return () => {
    if (hooks.cleanedUp.has(el)) hooks.violations.push("mount cleanup ran twice");
    hooks.cleanedUp.add(el);
  };
}

function onDestroyed(hooks: Hooks, el: Element): void {
  if (!hooks.mounted.has(el)) hooks.violations.push("destroy fired for an element that never mounted");
  if (hooks.destroyed.has(el)) hooks.violations.push("destroy fired twice for one element");
  hooks.destroyed.add(el);
}

function buildMod(m: Mod, env: Env): unknown {
  const { state } = env;
  switch (m.t) {
    case "el": return buildEl(m, env);
    case "text": return m.v;
    case "stext": return state.statics[m.k];
    case "rtext": return () => state.texts[m.k];
    case "itext": { const item = env.item!; return () => item.label; }
    case "iid": return `#${env.item!.id}`;
    case "null": return null;
    case "cond": return state.sflags[m.k] ? buildMod(m.mod, env) : null;
    case "when": {
      const first = m.groups[0]!;
      let builder = when(buildCond(first.cond, env), ...(first.content.map((c) => buildMod(c, env)) as never[]));
      for (let i = 1; i < m.groups.length; i++) {
        const group = m.groups[i]!;
        builder = builder.when(buildCond(group.cond, env), ...(group.content.map((c) => buildMod(c, env)) as never[]));
      }
      if (m.otherwise) builder = builder.else(...(m.otherwise.map((c) => buildMod(c, env)) as never[]));
      return builder;
    }
    case "list": {
      const src = m.src;
      const owner = env.item;
      const provider = src.f === "state" ? () => state.lists[src.k]! : () => owner!.kids;
      return list(provider, (item: Item) =>
        buildEl(m.rows[item.kind], { ...env, item, path: `${env.path}/${m.id}:${item.id}` }) as never);
    }
    case "plist": return list(() => state.prims[m.k]!, (n) => span({ className: "prim" }, String(n)));
    case "svg":
      return svgSvg(
        { viewBox: "0 0 10 10" },
        defsSvg(linearGradientSvg({ id: `g${m.k}` }, stopSvg({ offset: "0" }))),
        circleSvg({ r: () => String(state.attrs[m.k]!.length) }),
        when(() => state.flags[m.k]!, rectSvg({ width: "1" }), clipPathSvg({ id: `c${m.k}` })),
      );
  }
}

export function buildApp(app: AppSpec, state: State, hooks: Hooks): () => never {
  return () => buildEl(app.root, { state, item: null, path: "", hooks, app }) as never;
}

// ─── model(): spec → expected normalized markup ──────────────────────────────

export interface Expected {
  html: string;
  /** uid of every <button>, in document order. */
  buttons: string[];
  articles: number;
}

interface MEnv { state: State; item: Item | null; path: string }
type Part = { text: string } | { html: string };

const esc = (v: string): string => JSON.stringify(v);

function modelValue(src: ValueSrc, env: MEnv): string {
  switch (src.f) {
    case "const": return src.v;
    case "static": return String(env.state.statics[src.k]);
    case "reactive": return env.state.attrs[src.k]!;
    case "item": return env.item!.label;
  }
}

function modelCond(cond: Cond, env: MEnv): boolean {
  switch (cond.f) {
    case "flag": return env.state.flags[cond.k]!;
    case "sflag": return env.state.sflags[cond.k]!;
    case "item": return env.item!.flag;
    case "const": return cond.v;
  }
}

function joinParts(parts: Part[]): string {
  let out = "";
  let text = "";
  for (const part of parts) {
    if ("text" in part) text += part.text;
    else {
      if (text) { out += esc(text); text = ""; }
      out += part.html;
    }
  }
  if (text) out += esc(text);
  return out;
}

function openTag(tag: string, attrs: Array<[string, string]>, props = ""): string {
  attrs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  let out = `<${tag}`;
  for (const [k, v] of attrs) out += ` ${k}=${esc(v)}`;
  return out + props + ">";
}

function modelEl(s: ElSpec, env: MEnv, exp: Expected): string {
  const { state } = env;
  const attrs: Array<[string, string]> = [];
  if (s.title) attrs.push(["title", modelValue(s.title, env)]);
  if (s.data) attrs.push(["data-a", modelValue(s.data, env)]);
  if (s.style) {
    const color = s.style.reactive ? state.colors[s.style.k] : s.style.v;
    if (color) attrs.push(["style", `color: ${color}`]);
  }
  const cls = s.cls;
  if (cls) {
    const set = new Set<string>();
    if (cls.f === "static" || cls.f === "both") for (const t of tokens(cls.v)) set.add(t);
    if (cls.f === "reactive" || cls.f === "both" || cls.f === "cx") for (const t of tokens(state.classes[cls.k]!)) set.add(t);
    if (cls.f === "item" && env.item!.flag) for (const t of tokens(cls.v)) set.add(t);
    if (set.size) attrs.push(["class", Array.from(set).sort().join(" ")]);
  }
  let props = "";
  if (s.tag === "input") {
    attrs.push(["type", "checkbox"]);
    props = ` .checked=${state.flags[s.id % SLOTS]}`;
  }
  if (s.tag === "button") exp.buttons.push(`${s.id}@${env.path}`);
  if (s.tag === "article") exp.articles++;
  const parts: Part[] = [];
  if (s.content) {
    if (s.content.kind === "text") parts.push({ text: contentText(s.content, state, env.item) });
    else parts.push({ html: HTML_POOL_MODEL[contentHtmlIndex(s.content, state, env.item)]! });
  }
  for (const m of s.mods) modelMod(m, env, parts, exp);
  return `${openTag(s.tag, attrs, props)}${joinParts(parts)}</${s.tag}>`;
}

function modelMod(m: Mod, env: MEnv, parts: Part[], exp: Expected): void {
  const { state } = env;
  switch (m.t) {
    case "el": parts.push({ html: modelEl(m, env, exp) }); break;
    case "text": parts.push({ text: String(m.v) }); break;
    case "stext": parts.push({ text: String(state.statics[m.k]) }); break;
    case "rtext": { const v = state.texts[m.k]; parts.push({ text: v == null ? "" : String(v) }); break; }
    case "itext": parts.push({ text: env.item!.label }); break;
    case "iid": parts.push({ text: `#${env.item!.id}` }); break;
    case "null": break;
    case "cond": if (state.sflags[m.k]) modelMod(m.mod, env, parts, exp); break;
    case "when": {
      const group = m.groups.find((g) => modelCond(g.cond, env));
      const content = group ? group.content : m.otherwise;
      if (content) for (const c of content) modelMod(c, env, parts, exp);
      break;
    }
    case "list": {
      const items = m.src.f === "state" ? state.lists[m.src.k]! : env.item!.kids;
      for (const item of items) {
        parts.push({ html: modelEl(m.rows[item.kind], { state, item, path: `${env.path}/${m.id}:${item.id}` }, exp) });
      }
      break;
    }
    case "plist":
      for (const n of state.prims[m.k]!) parts.push({ html: `<span class="prim">${esc(String(n))}</span>` });
      break;
    case "svg": {
      let inner = `<defs><linearGradient id="g${m.k}"><stop offset="0"></stop></linearGradient></defs>`;
      inner += `<circle r="${state.attrs[m.k]!.length}"></circle>`;
      if (state.flags[m.k]) inner += `<rect width="1"></rect><clipPath id="c${m.k}"></clipPath>`;
      parts.push({ html: `<svg viewBox="0 0 10 10">${inner}</svg>` });
      break;
    }
  }
}

export function model(app: AppSpec, state: State): Expected {
  const exp: Expected = { html: "", buttons: [], articles: 0 };
  exp.html = modelEl(app.root, { state, item: null, path: "" }, exp);
  return exp;
}

// ─── snap(): DOM → normalized markup ─────────────────────────────────────────

/**
 * Serializes a DOM subtree in the model's format: comments dropped (nuclo's
 * text/list/when markers are bookkeeping), adjacent text merged, empty text
 * dropped, attributes sorted, class tokens sorted + deduped, style
 * declarations sorted, empty class/style omitted. `props` adds the checked
 * property of inputs (property state, not attribute state).
 */
export function snap(node: Node, props = true): string {
  let out = "";
  let text = "";
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 3) {
      text += child.nodeValue ?? "";
    } else if (child.nodeType === 1) {
      if (text) { out += esc(text); text = ""; }
      out += snapEl(child as Element, props);
    }
  }
  if (text) out += esc(text);
  return out;
}

function snapEl(el: Element, props: boolean): string {
  const tag = el.localName;
  const attrs: Array<[string, string]> = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i]!;
    let value = attr.value;
    if (attr.name === "class") {
      value = Array.from(new Set(tokens(value))).sort().join(" ");
      if (!value) continue;
    } else if (attr.name === "style") {
      value = value.split(";").map((d) => d.trim()).filter(Boolean).sort().join("; ");
      if (!value) continue;
    } else if (attr.name === "checked") {
      continue; // compared as a property
    }
    attrs.push([attr.name, value]);
  }
  const extra = tag === "input" && props ? ` .checked=${(el as HTMLInputElement).checked}` : "";
  return `${openTag(tag, attrs, extra)}${snap(el, props)}</${tag}>`;
}

// ─── Scenario runner ─────────────────────────────────────────────────────────

export type Mode = "client" | "hydrate" | "hydrate-mismatch";

export interface RunOptions extends GenOptions {
  rounds?: number;
  /** Upper bound for the initial size of each top-level list (default 6). */
  maxListSize?: number;
  /** Called with the app's container right before it is removed from the document. */
  onTeardown?: (container: Element) => void;
  /**
   * Which DOM renderToString() builds the server tree on: the test's real DOM
   * ("dom", SSR under jsdom) or nuclo's own SSR polyfill ("polyfill", what a
   * Node/Bun/Deno server uses). Default "dom".
   */
  ssr?: "dom" | "polyfill";
}

/**
 * Runs `fn` with the DOM globals swapped for nuclo's SSR polyfill, so
 * renderToString() produces exactly the markup a server would — which the
 * same test can then parse and hydrate with the real DOM.
 */
export function withServerGlobals<T>(fn: () => T): T {
  const g = globalThis as Record<string, unknown>;
  const names = ["document", "Node", "Element", "HTMLElement"] as const;
  const saved = names.map((name) => Object.getOwnPropertyDescriptor(g, name));
  const values = [new NucloDocument(), NucloNode, NucloElement, NucloElement];
  names.forEach((name, i) => Object.defineProperty(g, name, { value: values[i], configurable: true, writable: true }));
  try {
    return fn();
  } finally {
    names.forEach((name, i) => {
      const descriptor = saved[i];
      if (descriptor) Object.defineProperty(g, name, descriptor);
      else delete g[name];
    });
  }
}

function fail(seed: number, mode: string, step: string, message: string): never {
  throw new Error(`[fuzz seed=${seed} mode=${mode}] ${step}: ${message}`);
}

/**
 * Every element nuclo built, in document order. Markup inside a <samp> comes
 * from its `innerHTML` attribute, which is re-parsed whenever it is assigned —
 * those nodes are not expected to keep their identity.
 */
function elements(container: Element): Element[] {
  const out: Element[] = [];
  const walk = (el: Element): void => {
    for (let child = el.firstElementChild; child; child = child.nextElementSibling) {
      out.push(child);
      if (child.localName !== "samp") walk(child);
    }
  };
  walk(container);
  return out;
}

function sameElements(a: Element[], b: Element[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Runs one seeded scenario end to end. Throws (with the seed, mode and step in
 * the message) on the first divergence between the live DOM and the model.
 */
export function runSeed(seed: number, kind: Mode, opts: RunOptions): void {
  const polyfill = opts.ssr === "polyfill";
  const mode = polyfill ? `${kind}/polyfill` : kind;
  const rng = mulberry32(seed);
  const app = genApp(rng, opts);
  const state = genState(rng, opts.maxListSize);
  const hooks = makeHooks();
  const App = buildApp(app, state, hooks);
  const rounds = opts.rounds ?? 6;

  const container = document.createElement("div");
  document.body.appendChild(container);

  const check = (step: string): void => {
    const expected = model(app, state);
    const actual = snap(container);
    if (actual !== expected.html) {
      fail(seed, mode, step, `DOM diverged from the model\n  expected: ${expected.html}\n  actual:   ${actual}`);
    }
    // Every button fires exactly its own, current handler — once.
    // getElementsByTagName, not querySelectorAll: jsdom caches selector
    // matches on the document, which would pin removed trees (memory tests).
    const buttons = Array.from(container.getElementsByTagName("button"));
    for (let i = 0; i < buttons.length; i++) {
      hooks.clicks.length = 0;
      buttons[i]!.dispatchEvent(new Event("click"));
      if (hooks.clicks.length !== 1 || hooks.clicks[0] !== expected.buttons[i]) {
        fail(seed, mode, step, `button #${i} fired [${hooks.clicks.join(", ")}], expected [${expected.buttons[i]}]`);
      }
    }
    if (hooks.violations.length) fail(seed, mode, step, `lifecycle violations: ${hooks.violations.join("; ")}`);
    // Lifecycle: live <article>s are exactly the mounted-and-not-destroyed set.
    const articles = Array.from(container.getElementsByTagName("article"));
    let live = 0;
    for (const el of hooks.mounted) if (!hooks.destroyed.has(el)) live++;
    if (articles.length !== expected.articles || live !== articles.length) {
      fail(seed, mode, step, `lifecycle: ${articles.length} <article> in DOM, model has ${expected.articles}, ${live} mounted-and-not-destroyed`);
    }
    for (const el of articles) {
      if (!hooks.mounted.has(el) || hooks.destroyed.has(el)) fail(seed, mode, step, "a connected <article> is not in the mounted state");
    }
    if (hooks.cleanedUp.size !== hooks.destroyed.size) {
      fail(seed, mode, step, `mount cleanups (${hooks.cleanedUp.size}) != destroys (${hooks.destroyed.size})`);
    }
  };

  try {
    if (kind === "client") {
      render(App, container);
    } else {
      const ssrHooks = makeHooks();
      const ssrApp = buildApp(app, state, ssrHooks);
      const html = polyfill ? withServerGlobals(() => renderToString(ssrApp)) : renderToString(ssrApp);
      if (ssrHooks.mounted.size || ssrHooks.clicks.length) fail(seed, mode, "ssr", "renderToString ran lifecycle/event callbacks");
      container.innerHTML = html;
      // Property state (checked) is only serialized by the polyfill; a
      // real-DOM SSR pass sets the property, which is not an attribute.
      const expected = polyfill ? model(app, state).html : model(app, state).html.replace(/ \.checked=(true|false)/g, "");
      const parsed = snap(container, polyfill);
      if (parsed !== expected) {
        fail(seed, mode, "ssr", `SSR HTML diverged from the model\n  expected: ${expected}\n  actual:   ${parsed}\n  html:     ${html}`);
      }
      if (kind === "hydrate-mismatch") {
        for (let i = 0; i < 3; i++) mutateReactive(rng, state);
        mutateStatics(rng, state);
        hydrate(App, container);
      } else {
        const before = elements(container);
        hydrate(App, container);
        if (!sameElements(before, elements(container))) fail(seed, mode, "hydrate", "hydrate() did not reuse every server-rendered element");
      }
    }
    check("initial");

    for (let r = 0; r < rounds; r++) {
      mutateReactive(rng, state);
      update();
      check(`update #${r}`);
    }

    // update() with nothing changed is a no-op.
    let before = elements(container);
    update();
    if (!sameElements(before, elements(container))) fail(seed, mode, "idle update", "update() replaced elements without a state change");
    check("idle update");

    // forceUpdate() picks up build-time ("static") values too.
    mutateStatics(rng, state);
    if (chance(rng, 0.5)) mutateReactive(rng, state);
    forceUpdate();
    check("forceUpdate");

    // forceUpdate() with nothing changed reuses every element in place.
    before = elements(container);
    forceUpdate();
    if (!sameElements(before, elements(container))) fail(seed, mode, "idle forceUpdate", "forceUpdate() replaced elements without a state change");
    check("idle forceUpdate");

    // Reactivity is intact after the forced rebuild.
    for (let r = 0; r < rounds; r++) {
      mutateReactive(rng, state);
      if (chance(rng, 0.15)) {
        mutateStatics(rng, state);
        forceUpdate();
      } else {
        update();
      }
      check(`post-force #${r}`);
    }
  } finally {
    opts.onTeardown?.(container);
    container.remove();
  }
}
