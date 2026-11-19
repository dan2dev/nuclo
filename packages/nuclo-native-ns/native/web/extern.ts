// The renderer of ui.ns and store.ns for the web: the bodies of their `extern` declarations, over nuclo
// itself (nuclo-core: global tag builders, createCss, list, when, update, render). The build copies this
// file next to the .ns files, in build/web/src.
//
// The native runtimes lay every box out as a flex column (Yoga's defaults), from the parent's top-left
// corner: the global styles below make the DOM do the same, so a screen has the same frames everywhere.
// Navigation is the platform's own: one stack per tab in the History API (back, forward, reload, deep
// links), an app bar with back on a phone, a tab bar at the bottom (a side rail from 720 px), and modals
// as bottom sheets that follow the finger.

import "nuclo";
import { createCss, globalStyle, list as nlist, update as nupdate, render as nrender, when as nwhen, type StyleResult as NStyleResult } from "nuclo";
import { clone, eq } from "../../../runtime/nns_runtime.ts";
import type { Look, Mod, Attributes, Style, Tab } from "../out/ui.ts";
import type { Row } from "../out/store.ts";

type Child = Parameters<typeof div>[number];
export type View = ReturnType<typeof div>;
export type StyleResult = { cls: NStyleResult };

// ---- global styles: the box model of the native runtimes ---------------------------

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Inter, 'Helvetica Neue', sans-serif";
globalStyle("html, body", { margin: 0, height: "100%", overflow: "hidden", fontFamily: FONT, fontSize: "16px", lineHeight: 1.25, color: "#000000", backgroundColor: "#ffffff", WebkitFontSmoothing: "antialiased", WebkitTapHighlightColor: "transparent", overscrollBehavior: "none" } as never);
globalStyle("body", { display: "flex", flexDirection: "column" });
globalStyle(":where(.nn, .nn *)", { boxSizing: "border-box", margin: 0, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, flexShrink: 0, position: "relative", userSelect: "none" } as never);
globalStyle(":where(.nn input, .nn textarea)", { userSelect: "text", font: "inherit", color: "inherit", border: "none", outline: "none", backgroundColor: "transparent", padding: "8px", resize: "none" } as never);
globalStyle(":where(.nn button)", { border: "none", backgroundColor: "transparent", font: "inherit", cursor: "pointer", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8px 14px", color: "#2563eb" } as never);
globalStyle(":where(.nn img)", { objectFit: "cover", WebkitUserDrag: "none", backgroundColor: "rgba(127,127,127,0.12)" } as never);
globalStyle(":where(.nn h1)", { fontSize: "32px", fontWeight: 700 });
globalStyle(":where(.nn h2)", { fontSize: "22px", fontWeight: 700 });
globalStyle(":where(.nn h3)", { fontSize: "19px", fontWeight: 700 });
globalStyle(":where(.nn small)", { fontSize: "12px" });
globalStyle(":where(.nn strong)", { fontWeight: 700 });
globalStyle(":where(.nn p, .nn span, .nn small, .nn strong, .nn h1, .nn h2, .nn h3)", { display: "block", whiteSpace: "pre-wrap", overflowWrap: "anywhere" } as never);
globalStyle(":where(.nn *)::-webkit-scrollbar", { width: 0, height: 0 } as never);
// The platform's switch: a track and a thumb.
globalStyle(":where(.nn input[type=checkbox])", { appearance: "none", width: "51px", height: "31px", padding: 0, borderRadius: "16px", backgroundColor: "rgba(120,120,128,0.32)", transition: "background-color 200ms", cursor: "pointer", flexShrink: 0 } as never);
globalStyle(":where(.nn input[type=checkbox])::after", { content: "''", position: "absolute", top: "2px", left: "2px", width: "27px", height: "27px", borderRadius: "14px", backgroundColor: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", transition: "transform 220ms cubic-bezier(.3,1.4,.6,1)" } as never);
globalStyle(":where(.nn input[type=checkbox]:checked)", { backgroundColor: "var(--nn-accent, #34c759)" } as never);
globalStyle(":where(.nn input[type=checkbox]:checked)::after", { transform: "translateX(20px)" } as never);

/** The breakpoints of `md` and `lg`, as in ui.ns. */
const { css: themed } = createCss({ screens: { md: "(min-width: 720px)", lg: "(min-width: 1080px)" } });

// ---- styles ------------------------------------------------------------------------

const weights: Record<string, number> = { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 };
const easings: Record<string, string> = { spring: "cubic-bezier(0.34, 1.4, 0.64, 1)", linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out" };
const px = (v: number) => `${v}px`;

type CssProps = Record<string, string | number>;

function transform(t: { translateX?: number | null; translateY?: number | null; scale?: number | null; rotate?: number | null }): string | null {
  const parts: string[] = [];
  if (t.translateX != null || t.translateY != null) parts.push(`translate(${t.translateX ?? 0}px, ${t.translateY ?? 0}px)`);
  if (t.rotate != null) parts.push(`rotate(${t.rotate}deg)`);
  if (t.scale != null) parts.push(`scale(${t.scale})`);
  return parts.length ? parts.join(" ") : null;
}

function lookProps(l: Look): CssProps {
  const o: CssProps = {};
  if (l.backgroundColor != null) o.backgroundColor = l.backgroundColor;
  if (l.color != null) o.color = l.color;
  if (l.borderColor != null) o.borderColor = l.borderColor;
  if (l.opacity != null) o.opacity = l.opacity;
  if (l.scale != null) o.transform = `scale(${l.scale})`;
  if (l.flexDirection != null) o.flexDirection = l.flexDirection;
  if (l.flex != null) o.flex = `${l.flex} ${l.flex} 0%`;
  if (l.gap != null) o.gap = px(l.gap);
  if (l.padding != null) o.padding = px(l.padding);
  if (l.px != null) { o.paddingLeft = px(l.px); o.paddingRight = px(l.px); }
  if (l.py != null) { o.paddingTop = px(l.py); o.paddingBottom = px(l.py); }
  if (l.width != null) o.width = px(l.width);
  if (l.maxWidth != null) o.maxWidth = px(l.maxWidth);
  if (l.height != null) o.height = px(l.height);
  if (l.fontSize != null) o.fontSize = px(l.fontSize);
  if (l.display != null) o.display = l.display === "none" ? "none" : "flex";
  return o;
}

function styleProps(s: Style): CssProps {
  const o: CssProps = {};
  const set = (k: string, v: unknown, f: (v: never) => string | number = (v) => v) => { if (v != null) o[k] = f(v as never); };
  set("flexDirection", s.flexDirection);
  set("alignItems", s.alignItems);
  set("alignSelf", s.alignSelf);
  set("justifyContent", s.justifyContent);
  set("flexWrap", s.flexWrap);
  // A native box grows by weight from no basis, and never shrinks below its content.
  set("flex", s.flex, (v: number) => (v > 0 ? `${v} ${v} 0%` : "none"));
  set("gap", s.gap, px);
  set("padding", s.padding, px);
  set("paddingLeft", s.pl ?? s.px, px);
  set("paddingRight", s.pr ?? s.px, px);
  set("paddingTop", s.pt ?? s.py, px);
  set("paddingBottom", s.pb ?? s.py, px);
  set("margin", s.margin, px);
  set("marginTop", s.mt ?? s.my, px);
  set("marginBottom", s.mb ?? s.my, px);
  set("marginLeft", s.ml ?? s.mx, px);
  set("marginRight", s.mr ?? s.mx, px);
  set("width", s.width, px);
  set("width", s.widthPct, (v: number) => `${v}%`);
  set("height", s.height, px);
  set("minWidth", s.minWidth, px);
  set("maxWidth", s.maxWidth, px);
  set("minHeight", s.minHeight, px);
  set("maxHeight", s.maxHeight, px);
  set("aspectRatio", s.aspectRatio, (v: number) => `${v}`);
  if (s.overflow === "scroll") {
    if (s.flexDirection === "row") { o.overflowX = "auto"; o.overflowY = "hidden"; } else { o.overflowY = "auto"; o.overflowX = "hidden"; }
    o.overscrollBehavior = "contain";
  } else set("overflow", s.overflow);
  set("position", s.position);
  set("top", s.top, px);
  set("right", s.right, px);
  set("bottom", s.bottom, px);
  set("left", s.left, px);
  set("zIndex", s.zIndex);
  set("display", s.display, (v: string) => (v === "none" ? "none" : "flex"));
  set("backgroundColor", s.backgroundColor);
  set("color", s.color);
  set("opacity", s.opacity);
  set("borderRadius", s.borderRadius, px);
  if (s.borderWidth != null) { o.borderWidth = px(s.borderWidth); o.borderStyle = "solid"; o.borderColor = "transparent"; }
  set("borderColor", s.borderColor);
  if (s.borderTopWidth != null) { o.borderTopWidth = px(s.borderTopWidth); o.borderTopStyle = "solid"; }
  if (s.borderBottomWidth != null) { o.borderBottomWidth = px(s.borderBottomWidth); o.borderBottomStyle = "solid"; }
  if ((s.borderTopWidth != null || s.borderBottomWidth != null) && s.borderColor == null) o.borderColor = "transparent";
  if (s.shadowRadius != null) o.boxShadow = `0 ${s.shadowOffsetY ?? 0}px ${s.shadowRadius}px ${s.shadowColor ?? "rgba(0,0,0,0.25)"}`;
  set("fontSize", s.fontSize, px);
  set("fontWeight", s.fontWeight, (v: string) => weights[v] ?? v);
  set("fontStyle", s.fontStyle);
  set("fontFamily", s.fontFamily, (v: string) => (v === "sans-serif" ? FONT : v));
  set("lineHeight", s.lineHeight, px);
  set("letterSpacing", s.letterSpacing, px);
  set("textAlign", s.textAlign);
  set("textDecoration", s.textDecoration);
  set("textTransform", s.textTransform);
  if (s.numberOfLines != null) {
    if (s.numberOfLines === 1) Object.assign(o, { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
    else Object.assign(o, { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: s.numberOfLines, overflow: "hidden" });
  }
  set("objectFit", s.objectFit);
  set("pointerEvents", s.pointerEvents);
  const t = transform(s);
  if (t) o.transform = t;
  if (s.transition != null) {
    const e = easings[s.easing ?? "ease"] ?? "ease";
    o.transition = ["opacity", "transform", "background-color", "color", "border-color", "border-radius", "width", "height"].map((p) => `${p} ${s.transition}ms ${e}`).join(", ");
  }
  return o;
}

/** The parts of a style that need a class: the states and the breakpoints. */
const hasParts = (s: Style) => s.pressed != null || s.hover != null || s.md != null || s.lg != null;

const memo = new Map<string, NStyleResult>();

function classOf(s: Style): NStyleResult {
  const key = JSON.stringify(s);
  let c = memo.get(key);
  if (!c) {
    const o: Record<string, unknown> = styleProps(s);
    if (s.pressed) o.active = lookProps(s.pressed);
    if (s.hover) o["@media (hover: hover)"] = { "&:hover": lookProps(s.hover) };
    if (s.md) o.md = lookProps(s.md);
    if (s.lg) o.lg = lookProps(s.lg);
    c = themed(o as Parameters<typeof themed>[0]);
    memo.set(key, c);
  }
  return c;
}

export const css = (style: Style): StyleResult => ({ cls: classOf(style) });

// ---- gestures: the platform's recognizers, over Pointer Events ---------------------------

const SLOP = 8;
const LONG_PRESS = 500;

/** A node modifier that recognizes the gestures of `a` on the element (one parameter: nuclo calls it with the element). */
function gestures(a: Attributes) {
  return (el: HTMLElement) => {
    const pointers = new Map<number, { x: number; y: number }>();
    let start: { x: number; y: number; t: number } | null = null;
    let panning = false;
    let panned = false;
    let last = { x: 0, y: 0, t: 0, vx: 0, vy: 0 };
    let longTimer = 0;
    let pinchStart = 0;
    let lastTap = 0;
    if (a.onPan || a.onPinch) el.style.touchAction = "none";
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, pageX: e.clientX, pageY: e.clientY };
    };
    const pan = (state: string, e: PointerEvent) => {
      const p = local(e);
      a.onPan?.({ state, dx: e.clientX - start!.x, dy: e.clientY - start!.y, vx: last.vx, vy: last.vy, x: p.x, y: p.y });
    };
    const spread = () => {
      const [p, q] = [...pointers.values()];
      return Math.hypot(p!.x - q!.x, p!.y - q!.y);
    };
    el.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && a.onPinch) {
        pinchStart = spread();
        a.onPinch({ state: "start", scale: 1 });
        return;
      }
      if (pointers.size > 1) return;
      start = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp, vx: 0, vy: 0 };
      panning = panned = false;
      a.onPointerDown?.(local(e));
      if (a.onLongPress) {
        const p = local(e);
        longTimer = window.setTimeout(() => { longTimer = 0; panned = true; a.onLongPress!(p); }, LONG_PRESS);
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && a.onPinch && pinchStart > 0) {
        a.onPinch({ state: "move", scale: spread() / pinchStart });
        return;
      }
      if (!start) return;
      const dt = Math.max(1, e.timeStamp - last.t);
      last = { x: e.clientX, y: e.clientY, t: e.timeStamp, vx: ((e.clientX - last.x) / dt) * 1000, vy: ((e.clientY - last.y) / dt) * 1000 };
      if (!panning && Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP) {
        if (longTimer) { clearTimeout(longTimer); longTimer = 0; }
        if (a.onPan) {
          panning = panned = true;
          try { el.setPointerCapture(e.pointerId); } catch { /* a pointer the browser does not track (a synthetic one) */ }
          pan("start", e);
        }
      } else if (panning) pan("move", e);
    });
    const finish = (e: PointerEvent, state: "end" | "cancel") => {
      if (!pointers.delete(e.pointerId)) return;
      if (longTimer) { clearTimeout(longTimer); longTimer = 0; }
      if (pinchStart > 0) {
        if (pointers.size < 2) { pinchStart = 0; a.onPinch?.({ state: "end", scale: 1 }); start = null; }
        return;
      }
      if (panning) { if (e.timeStamp - last.t > 80) last.vx = last.vy = 0; pan(state, e); }
      else if (state === "end" && start) {
        a.onPointerUp?.(local(e));
        if (a.onDoubleClick) {
          if (e.timeStamp - lastTap < 300) { lastTap = 0; a.onDoubleClick(local(e)); } else lastTap = e.timeStamp;
        }
      }
      panning = false;
      start = null;
    };
    el.addEventListener("pointerup", (e) => finish(e, "end"));
    el.addEventListener("pointercancel", (e) => finish(e, "cancel"));
    // A click that ends a drag or a long press is not a click, as on the native platforms.
    el.addEventListener("click", (e) => { if (panned) { e.stopPropagation(); e.preventDefault(); panned = false; } }, true);
    if (a.onLongPress) el.addEventListener("contextmenu", (e) => e.preventDefault());
    if (a.onPinch) {
      let scale = 1;
      let idle = 0;
      el.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        if (!idle) { scale = 1; a.onPinch!({ state: "start", scale }); } else clearTimeout(idle);
        scale *= Math.exp(-e.deltaY / 100);
        a.onPinch!({ state: "move", scale });
        idle = window.setTimeout(() => { idle = 0; a.onPinch!({ state: "end", scale }); }, 150);
      }, { passive: false });
    }
  };
}

// ---- builders ----------------------------------------------------------------------

function attributes(a: Attributes): Child[] {
  const o: Record<string, unknown> = {};
  if (a.className) { const f = a.className; o.className = () => f().cls.className; }
  if (a.value) o.value = a.value;
  if (a.checked) o.checked = a.checked;
  if (a.src != null) { o.src = a.src; o.loading = "lazy"; o.decoding = "async"; o.draggable = false; }
  if (a.placeholder != null) o.placeholder = a.placeholder;
  if (a.label != null) o["aria-label"] = a.label;
  if (a.inputType != null) o.type = a.inputType;
  if (a.onClick) { const f = a.onClick; o.onClick = () => f(); }
  if (a.onInput) { const f = a.onInput; o.onInput = (e: Event) => f((e.target as HTMLInputElement).value); }
  if (a.onChange) { const f = a.onChange; o.onChange = (e: Event) => f((e.target as HTMLInputElement).checked); }
  if (a.onKeyDown) { const f = a.onKeyDown; o.onKeyDown = (e: KeyboardEvent) => f(e.key); }
  if (a.onScroll) {
    const f = a.onScroll;
    o.onScroll = (e: Event) => { const t = e.target as HTMLElement; f({ top: t.scrollTop, height: t.scrollHeight, viewport: t.clientHeight }); };
  }
  if (a.onDestroy) { const f = a.onDestroy; o.onDestroy = () => f(); }
  const out: Child[] = [o as Child];
  if (a.onPan || a.onPinch || a.onLongPress || a.onDoubleClick || a.onPointerDown || a.onPointerUp) out.push(gestures(a) as never);
  return out;
}

type Builder = (...mods: unknown[]) => View;
const tags: Record<string, Builder> = { div, h1, h2, h3, p, span, small, strong, button, input, textarea, img } as never;

export function el(tag: string, mods: Mod[]): View {
  const children: unknown[] = [];
  if (tag === "checkbox") children.push({ type: "checkbox" });
  for (const m of mods) {
    switch (m.tag) {
      case "Part": children.push(m.v0); break;
      case "Text": children.push(m.v0); break;
      case "TextOf": { const f = m.v0; children.push(() => f()); break; }
      case "Class": children.push(m.v0.cls); break;
      case "ClassOf": { const f = m.v0; children.push({ className: () => f().cls.className }); break; }
      case "Attrs": children.push(...attributes(m.v0)); break;
    }
  }
  return (tags[tag] ?? (tag === "checkbox" ? input : div))(...children);
}

/**
 * nuclo matches rows by identity. An item equal to the snapshot of the last call keeps that snapshot, so
 * its row stays; a changed item gets a new snapshot, so its row is made again (as native.rs). The item at
 * the same index is tried first: an unchanged list costs one comparison per row.
 */
/** A copy of a record or a list; a string, a number, or a boolean is its own copy. */
const copy = <T>(x: T): T => (x !== null && typeof x === "object" ? clone(x) : x);

export function list<T>(items: () => T[], render: (item: T, index: number) => View): View {
  let last: ({ v: T } | null)[] = [];
  return nlist(() => {
    const old = last;
    last = items().map((x, i) => {
      const same = old[i];
      if (same && eq(same.v, x)) { old[i] = null; return same; }
      const j = old.findIndex((o) => o != null && eq(o.v, x));
      if (j >= 0) { const o = old[j]!; old[j] = null; return o; }
      return { v: copy(x) };
    });
    return last as { v: T }[];
  }, (snap, i) => render(copy(snap.v), i)) as unknown as View;
}

/** The branch is built each time it opens, as on the native platforms. */
export const when = (cond: () => boolean, show: () => View): View => nwhen(cond, ((parent: never, i: never) => (show() as never as (p: never, i: never) => never)(parent, i)) as never) as unknown as View;

export const update = () => nupdate();

// ---- navigation: stacks per tab over the History API ----------------------------------

export type Route = { pattern: string; parts: string[]; title: (id: string) => string; view: (id: string) => View; kind: string };

export function route(pattern: string, title: (id: string) => string, view: (id: string) => View, kind: string): Route {
  return { pattern, parts: pattern.split("/"), title, view, kind };
}

type Entry = { path: string; route: Route; id: string; el: HTMLElement; title: string };

let routes: Route[] = [];
let tabs: Tab[] = [];
let stacks: Entry[][] = [];
let active = 0;
let modal: Entry | null = null;
let shell: HTMLElement;
let content: HTMLElement;
let tabBar: HTMLElement;
let sheetLayer: HTMLElement;
/** The depth of history entries this app pushed: popstate is a back while it is above 0. */
let depth = 0;

function match(path: string): { route: Route; id: string } | null {
  const segs = path.split("/");
  for (const r of routes) {
    if (r.parts.length !== segs.length) continue;
    let id = "";
    let ok = true;
    r.parts.forEach((p, i) => { if (p.startsWith(":")) id = segs[i]!; else if (p !== segs[i]) ok = false; });
    if (ok) return { route: r, id };
  }
  return null;
}

function tabOf(path: string) {
  let best = -1;
  tabs.forEach((t, i) => { if (path === t.path || (t.path !== "/" && path.startsWith(t.path + "/"))) best = i; });
  return best;
}

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  search: "M10.5 3a7.5 7.5 0 1 0 4.55 13.46L20 21.4 21.4 20l-4.94-4.95A7.5 7.5 0 0 0 10.5 3zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z",
  grid: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
  heart: "M12 20.5S3 15 3 8.8A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 9 2.4C21 15 12 20.5 12 20.5z",
  person: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z",
  settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 5-1.9-.3a6.8 6.8 0 0 1-.6 1.5l1.1 1.6-1.6 1.6-1.6-1.1c-.5.3-1 .5-1.5.6l-.3 1.9h-2.3l-.3-1.9a6.8 6.8 0 0 1-1.5-.6l-1.6 1.1-1.6-1.6 1.1-1.6a6.8 6.8 0 0 1-.6-1.5l-1.9-.3v-2.3l1.9-.3c.1-.5.3-1 .6-1.5L5.1 7.4 6.7 5.8l1.6 1.1c.5-.3 1-.5 1.5-.6l.3-1.9h2.3l.3 1.9c.5.1 1 .3 1.5.6l1.6-1.1 1.6 1.6-1.1 1.6c.3.5.5 1 .6 1.5l1.9.3z",
};

function screenEl(e: { route: Route; id: string }, title: string, isModal: boolean): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "nn nn-screen";
  if (e.route.kind === "push" && !isModal) {
    const bar = document.createElement("div");
    bar.className = "nn-bar";
    const back = document.createElement("button");
    back.className = "nn-back";
    back.setAttribute("aria-label", "Back");
    back.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    back.onclick = () => window.history.back();
    const t = document.createElement("div");
    t.className = "nn-title";
    t.textContent = title;
    bar.append(back, t, document.createElement("span"));
    wrap.append(bar);
  }
  const body = document.createElement("div");
  body.className = "nn nn-body";
  wrap.append(body);
  nrender(e.route.view(e.id) as never, body);
  return wrap;
}

function animate(el: HTMLElement, from: string, to: string, ms = 340) {
  el.animate([{ transform: from }, { transform: to }], { duration: ms, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" });
}

function showTop(animateIn: "push" | "pop" | null, leaving?: HTMLElement) {
  const stack = stacks[active]!;
  stacks.forEach((s, i) => s.forEach((e, j) => (e.el.style.display = i === active && j === s.length - 1 ? "flex" : "none")));
  const top = stack[stack.length - 1]!;
  top.el.querySelector(".nn-back")?.toggleAttribute("hidden", stack.length < 2);
  if (animateIn === "push") animate(top.el, "translateX(100%)", "translateX(0)");
  if (animateIn === "pop" && leaving) {
    leaving.style.display = "flex";
    leaving.style.zIndex = "2";
    const a = leaving.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: 300, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" });
    animate(top.el, "translateX(-25%)", "translateX(0)", 300);
    a.onfinish = () => leaving.remove();
  }
  tabBar.querySelectorAll<HTMLElement>(".nn-tab").forEach((t, i) => t.classList.toggle("on", i === active));
  document.title = top.title;
}

function open(path: string, fromHistory = false): boolean {
  const m = match(path);
  if (!m) return false;
  const title = m.route.title(m.id);
  if (m.route.kind === "modal") {
    if (modal) closeModal(true);
    const el = screenEl(m, title, true);
    modal = { path, ...m, el, title };
    presentSheet(el);
  } else {
    if (modal) closeModal();
    // A tab's root: that tab, at its root (as a tap on the tab).
    const t = tabs.findIndex((tab) => tab.path === path);
    if (t >= 0) {
      active = t;
      while (stacks[t]!.length > 1) stacks[t]!.pop()!.el.remove();
      showTop(null);
    } else {
      const el = screenEl(m, title, false);
      content.append(el);
      stacks[active]!.push({ path, ...m, el, title });
      showTop("push");
    }
  }
  if (!fromHistory) { depth++; window.history.pushState({ depth }, "", `#${path}`); }
  nupdate();
  return true;
}

function presentSheet(el: HTMLElement) {
  sheetLayer.replaceChildren();
  const backdrop = document.createElement("div");
  backdrop.className = "nn-backdrop";
  backdrop.onclick = () => window.history.back();
  const sheet = document.createElement("div");
  sheet.className = "nn nn-sheet";
  const grab = document.createElement("div");
  grab.className = "nn-grab";
  sheet.append(grab, el);
  sheetLayer.append(backdrop, sheet);
  sheetLayer.style.display = "flex";
  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
  sheet.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 380, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" });
  // The sheet follows the finger from its grabber, and goes when it is let go far or fast enough.
  let y0 = -1;
  grab.onpointerdown = (e) => { y0 = e.clientY; try { grab.setPointerCapture(e.pointerId); } catch { /* synthetic */ } sheet.style.transition = "none"; };
  grab.onpointermove = (e) => { if (y0 >= 0) sheet.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; };
  grab.onpointerup = (e) => {
    const dy = e.clientY - y0;
    y0 = -1;
    sheet.style.transition = "transform 260ms cubic-bezier(0.2, 0.9, 0.25, 1)";
    if (dy > sheet.clientHeight / 4) window.history.back();
    else sheet.style.transform = "translateY(0)";
  };
}

function closeModal(now = false) {
  const m = modal!;
  modal = null;
  const sheet = sheetLayer.querySelector<HTMLElement>(".nn-sheet");
  const backdrop = sheetLayer.querySelector<HTMLElement>(".nn-backdrop");
  if (now || !sheet) { sheetLayer.replaceChildren(); sheetLayer.style.display = "none"; return; }
  const y = new DOMMatrix(getComputedStyle(sheet).transform).m42;
  sheet.animate([{ transform: `translateY(${y}px)` }, { transform: "translateY(100%)" }], { duration: 260, easing: "ease-in", fill: "forwards" }).onfinish = () => {
    if (!modal) { sheetLayer.replaceChildren(); sheetLayer.style.display = "none"; }
  };
  backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" });
  void m;
}

/** One step back: the modal, else the top screen of the tab. */
function pop(): boolean {
  if (modal) { closeModal(); nupdate(); return true; }
  const stack = stacks[active]!;
  if (stack.length < 2) return false;
  const leaving = stack.pop()!;
  showTop("pop", leaving.el);
  nupdate();
  return true;
}

export function navigate(rs: Route[], ts: Tab[]) {
  routes = rs;
  tabs = ts;
  document.body.classList.add("nn");
  shell = document.createElement("div");
  shell.className = "nn nn-shell";
  content = document.createElement("div");
  content.className = "nn nn-content";
  tabBar = document.createElement("nav");
  tabBar.className = "nn nn-tabs";
  tabs.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "nn-tab";
    b.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26"><path d="${ICONS[t.icon] ?? ICONS.grid}" fill="currentColor"/></svg><span>${t.title}</span>`;
    b.onclick = () => {
      if (i === active) { while (stacks[active]!.length > 1) stacks[active]!.pop()!.el.remove(); showTop(null); content.querySelector<HTMLElement>(".nn-screen[style*='flex'] .nn-body > *")?.scrollTo({ top: 0, behavior: "smooth" }); }
      else { active = i; showTop(null); }
      window.history.replaceState({ depth }, "", `#${stacks[active]!.at(-1)!.path}`);
      nupdate();
    };
    tabBar.append(b);
  });
  sheetLayer = document.createElement("div");
  sheetLayer.className = "nn nn-sheets";
  shell.append(tabBar, content);
  document.body.append(shell, sheetLayer);
  stacks = tabs.map((t) => {
    const m = match(t.path)!;
    const title = m.route.title(m.id);
    const el = screenEl(m, title, false);
    content.append(el);
    return [{ path: t.path, ...m, el, title }];
  });
  showTop(null);
  window.history.replaceState({ depth: 0 }, "", window.location.hash || `#${tabs[0]!.path}`);
  window.addEventListener("popstate", (e) => {
    const d = (e.state?.depth as number | undefined) ?? 0;
    if (d < depth) { depth = d; if (!pop()) window.history.go(-1); }
    else { depth = d; open(window.location.hash.slice(1), true); }
  });
  // A deep link: the tab that owns it, then the screen.
  const start = window.location.hash.slice(1);
  if (start && !tabs.some((t) => t.path === start)) {
    const t = tabOf(start);
    if (t >= 0) { active = t; showTop(null); }
    open(start);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && (modal || stacks[active]!.length > 1)) window.history.back();
  });
}

export const go = (path: string) => { open(path); };
export const back = () => window.history.back();

export function reset(path: string) {
  const t = tabOf(path);
  if (modal) closeModal(true);
  if (t < 0) return;
  active = t;
  while (stacks[t]!.length > 1) stacks[t]!.pop()!.el.remove();
  showTop(null);
  window.history.replaceState({ depth }, "", `#${path}`);
  nupdate();
}

export function overlay(view: () => View) {
  const layer = document.createElement("div");
  layer.className = "nn nn-overlay";
  document.body.append(layer);
  nrender(view() as never, layer);
}

// ---- platform ------------------------------------------------------------------------

export const later = (ms: number, f: () => void) => { window.setTimeout(f, ms); };
export const haptic = (kind: string) => { navigator.vibrate?.(kind === "success" ? [10, 40, 10] : kind === "medium" ? 15 : 8); };
export const platform = () => "web";
export const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

export function theme(dark: boolean, accent: string, background: string) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.setProperty("--nn-accent", accent);
  root.style.setProperty("--nn-bg", background);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", background);
}

// ---- storage: localStorage (the browser has no SQLite) -----------------------------------

const key = (table: string) => `nns:${table}`;
const read = (table: string): Row[] => { try { return JSON.parse(localStorage.getItem(key(table)) ?? "[]") as Row[]; } catch { return []; } };
const write = (table: string, rows: Row[]) => { try { localStorage.setItem(key(table), JSON.stringify(rows)); } catch { /* full or blocked: the rows stay in memory only */ } };

export function dbPut(table: string, id: string, fields: string[]) {
  const rows = read(table);
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows[i] = { id, fields: [...fields] }; else rows.unshift({ id, fields: [...fields] });
  write(table, rows);
}
export const dbAll = (table: string): Row[] => read(table);
export const dbDelete = (table: string, id: string) => write(table, read(table).filter((r) => r.id !== id));
export const dbClear = (table: string) => { try { localStorage.removeItem(key(table)); } catch { /* blocked */ } };
export const dbInfo = () => `localStorage · ${Object.keys(localStorage).filter((k) => k.startsWith("nns:")).length} tables`;
