/**
 * The native DOM: just enough DOM for nuclo to run unmodified, with every
 * mutation of the live tree recorded as an op for the platform host.
 *
 * Only nodes attached under document.body exist on the host ("live"). Trees
 * nuclo builds off-document, list templates and comment markers cost nothing
 * natively: they are realized in one pass when they get attached.
 *
 * Ops (the whole host contract):
 *   ["create", id, kind]             kind: view | text | button | input | checkbox | image | video
 *                                    navigation (router.ts): tabs | stack | screen
 *   ["insert", parentId, id, beforeId]   beforeId 0 = append; also moves
 *   ["remove", id]                   detach and destroy the subtree
 *   ["set",    id, key, value]       text, value, checked, placeholder, disabled, src…
 *                                    screen: title · stack: title, icon (its tab) · tabs: selected
 *   ["style",  id, key, value]       computed paint (style.ts, paint()): backgroundColor, color, opacity,
 *                                    fontSize, fontWeight, fontFamily, textAlign, borderRadius,
 *                                    borderWidth "t r b l", borderColor, overflow, display, and a
 *                                    text's, button's or input's padding "t r b l"; "" resets one
 *   ["listen", id, type]             click | input | change
 *
 *   ["frame",  id, x, y, w, h]       the node's box, relative to its parent's (layout.ts); a layout
 *                                    root's is [0, 0, w, content height]
 *
 * Layout: hosts do none. They report each layout root's size (the body, or each
 * screen) and their device pixels per unit with __nuclo_event(rootId, "resize", "w h scale"), and measure leaves on
 * request: __nuclo_measure(id, maxWidth) → "w h", the content size of a text,
 * button or image with the bundled font (maxWidth -1: unconstrained). After each
 * batch JS lays out what changed in every sized root (a clean subtree keeps its
 * layout: see tree() and layout.ts) and sends the frames that moved, as a second batch.
 * In a long list, rows far from what the screen shows leave the host (cull), and rows that arrive many at once
 * never all reach it (startsParked).
 *
 * Navigation: at the end of a batch the host compares each stack's screens with
 * the previous batch. A new top screen is a push, a removed top screen a pop,
 * both animated the platform's way. A tabs or stack inserted into the body is
 * the window's root navigation.
 *
 * Events (host → JS): __nuclo_event(id, type, value?)
 *   click · input (value: text) · change (value: checked): they bubble as in the DOM (dispatch)
 *   scroll on a layout root (value: "y h", its scroll offset and visible height)
 *   pop on a stack (value: depth left) after the user went back natively
 *   select on the tabs (value: index)
 *   load (value: src; the id is not read) when a remote image a host fetched has arrived
 *
 * A layout root listening for "end" gets it from JS when its content's end comes
 * within half its visible height, once per content height: infinite lists load more on it.
 *
 * Device data (battery…) has its own two calls: see device.ts. Timers and requests are a call each, answered
 * by an event (timers.ts, fetch.ts).
 */

import "./host";
import { type Frame, type LayoutNode, insets, layout } from "./layout";
import { INHERITED, Sheet, type Styles, compute, declarations, length, mediaMatches, paint } from "./style";
import { settle } from "./fetch";
import { fire } from "./timers";

/** One host op (see the contract above): the first item tells the rest apart. */
export type Op =
  | ["create", id: number, kind: string]
  | ["insert", parent: number, id: number, before: number]
  | ["remove", id: number]
  | ["set", id: number, key: string, value: unknown]
  | ["style", id: number, key: string, value: string]
  | ["listen", id: number, type: string]
  | ["frame", id: number, x: number, y: number, w: number, h: number];
type Listener = (this: NElement, event: unknown) => void;

let ops: Op[] = [];
let nextId = 1;
const live = new Map<number, NElement>();
/** The live screens: with the router, the layout roots. */
const screens = new Set<NElement>();

const TEXT_TAGS = new Set("span p h1 h2 h3 h4 h5 h6 label strong em b i small a".split(" "));

/** Kinds that hold child widgets. */
const CONTAINERS = new Set(["view", "screen", "stack", "tabs"]);

function kindOf(tag: string) {
  if (tag === "button") return "button";
  if (tag === "input" || tag === "textarea") return "input";
  if (tag === "img") return "image";
  if (tag === "video") return "video";
  return TEXT_TAGS.has(tag) ? "text" : "view";
}

// ── Styles ───────────────────────────────────────────────────────────────

/** nuclo's stylesheet (css(), globalStyle()), as text: index.ts hands it over. */
let stylesheet = () => "";
export function useStylesheet(source: () => string) {
  stylesheet = source;
}
let cssText = "";
let sheet = new Sheet("");
const matching = new Set<string>();
let matchKey = "";
/** Nodes whose computed style may have changed: resolved, top-down, before the next batch. */
const restyled = new Set<NNode>();

/** The window's size for @media: the body's, else a screen's. */
function viewport() {
  const size = sizes.get(1) ?? [...sizes.values()][0];
  return size ? [size[0], size[1]] : [0, 0];
}

function restyleAll(node: NNode) {
  restyled.add(node);
  for (let c = node.firstChild; c; c = c.nextSibling) if (c.live) restyleAll(c);
}

/** Resolves the restyled nodes (and the children their inherited properties reach) and queues the paint they changed. */
function styleAll() {
  const text = stylesheet();
  if (text !== cssText) {
    cssText = text;
    sheet = new Sheet(text);
    matchKey = "-";
    shared = new WeakMap();
  }
  const [w, h] = viewport();
  const key = sheet.medias.map((m) => (mediaMatches(m, w, h) ? 1 : 0)).join("");
  if (key !== matchKey) {
    matchKey = key;
    shared = new WeakMap();
    matching.clear();
    sheet.medias.forEach((m, i) => key[i] === "1" && matching.add(m));
    restyleAll(body);
  }
  if (!restyled.size) return;
  const depth = (node: NNode) => {
    let d = 0;
    for (let n = node.parentNode; n; n = n.parentNode) d++;
    return d;
  };
  for (const node of [...restyled].sort((a, b) => depth(a) - depth(b))) if (restyled.has(node)) resolveStyle(node);
}

const differs = (a: Styles, b: Styles) => {
  let n = 0;
  for (const k in a) {
    if (a[k] !== b[k]) return true;
    n++;
  }
  for (const _ in b) if (--n < 0) return true;
  return false;
};

/**
 * Computed styles by the parent's and what the node declares: nodes that declare the same under the same style
 * share one object, never changed once made. A list's rows resolve their styles once, and layout parses them once.
 */
let shared = new WeakMap<Styles, Map<string, Styles>>();
const unparented: Styles = {};

/** A node's computed style, from its parent's and its own declarations. */
function computedOf(node: NNode) {
  const parent = node.parentNode?.computed;
  const el = node instanceof NElement ? node : null;
  const className = el ? String(el.attrs.class ?? "") : "";
  let key = "";
  if (el) {
    key = `${el.localName}\n${className}`;
    for (const k in el.styles) key += `\n${k}:${el.styles[k]}`;
  }
  let byKey = shared.get(parent ?? unparented);
  if (!byKey) shared.set(parent ?? unparented, (byKey = new Map()));
  let found = byKey.get(key);
  if (!found) {
    // ponytail: emptied when full; a style animated through many values under one parent would fill it.
    if (byKey.size >= 512) byKey.clear();
    found = compute(parent, el ? sheet.cascade(el.localName, className, (m) => matching.has(m), Object.entries(el.styles)) : []);
    byKey.set(key, found);
  }
  return found;
}

function resolveStyle(node: NNode) {
  restyled.delete(node);
  const before = node.computed;
  const next = computedOf(node);
  node.computed = next;
  if (!before || (next !== before && differs(next, before))) {
    touch(node);
    resized = true; // lay out again even when the host gets no op
  }
  if (node.live) {
    const kind = node instanceof NElement ? node.kind : "text";
    const box: LayoutNode = { id: node.nid, kind, style: next, children: [] };
    const want = paint(next, kind, kind === "view" || kind === "screen" ? undefined : insets(box));
    const had = node.painted ?? {};
    for (const k in want) if (want[k] !== had[k]) ops.push(["style", node.nid, k, want[k]!]);
    for (const k in had) if (!(k in want)) ops.push(["style", node.nid, k, ""]);
    node.painted = want;
  }
  // Inherited properties reach the children (a leaf's own text is not a node on the host).
  if (!before || INHERITED.some((k) => next[k] !== before[k])) {
    for (let c = node.firstChild; c; c = c.nextSibling) if (c.live) resolveStyle(c);
  }
}

class NNode {
  // The DOM's node type constants: code that reads Node.ELEMENT_NODE (nuclo's builds do) finds them.
  static readonly ELEMENT_NODE = 1;
  static readonly TEXT_NODE = 3;
  static readonly COMMENT_NODE = 8;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;
  nid = nextId++;
  nodeType = 1;
  parentNode: NNode | null = null;
  firstChild: NNode | null = null;
  lastChild: NNode | null = null;
  nextSibling: NNode | null = null;
  previousSibling: NNode | null = null;
  /** Realized on the host. */
  live = false;
  /** Its subtree changed since it was last laid out; its ancestors are dirty too (touch). */
  dirty = true;
  /** Its layout node as of the last layout, reused while it is clean: layout.ts skips clean subtrees. */
  box?: LayoutNode;
  /** In a live container but off the host, far from the screen's visible part (cull); laid out as a box of its last size. */
  parked = false;
  /** Its computed style (style.ts) and the paint properties the host has. */
  computed?: Styles;
  painted?: Styles;
  /**
   * A container's laid-out children, in box.children order: cull finds them by index. Children that come and go
   * are spliced in and out, so the next layout takes up only what changed (edited); unset when that lost track.
   */
  kids?: NNode[];
  /** Where it last was in its parent's kids: looked for from there (indexIn). */
  at = 0;
  /** The kids that came, went or changed since the last layout lie in [from, to); the rest are as box.children has them. */
  edited?: [number, number];
  /** A long list being culled: the children that may be on the host lie in kept, which follows inserts and removes. */
  kept?: [number, number];
  /** A list longer than its screen keeps (cull): far children are parked, and new ones start parked. */
  culled = false;
  /** Parked since it was inserted, at a guessed size (guess): laid out when it first comes near the screen. */
  guessed = false;
  /** A culled list's guess for a new child's box, and the layout it was made from. */
  guess?: [from: LayoutNode, style: Styles | undefined];

  get isConnected(): boolean {
    return this.live || (this.parentNode?.isConnected ?? false);
  }

  get childNodes() {
    const out: NNode[] = [];
    for (let c = this.firstChild; c; c = c.nextSibling) out.push(c);
    return out;
  }

  get textContent(): string {
    let text = "";
    for (let c = this.firstChild; c; c = c.nextSibling) if (c.nodeType !== 8) text += c.textContent;
    return text;
  }

  set textContent(value: string) {
    while (this.firstChild) this.removeChild(this.firstChild);
    if (value) this.appendChild(new NText(value));
  }

  appendChild<T extends NNode>(node: T): T {
    return this.insertBefore(node, null);
  }

  insertBefore<T extends NNode>(node: T, ref: NNode | null): T {
    if (node.nodeType === 11) {
      while (node.firstChild) this.insertBefore(node.firstChild, ref);
      return node;
    }
    if (node === ref) return node;
    // A live node going to another live container moves; anything else leaving
    // the live tree is destroyed on the host.
    const container = this.live && this instanceof NElement && CONTAINERS.has(this.kind);
    if (node.parentNode) unlink(node, !(node.live && container));

    node.parentNode = this;
    node.nextSibling = ref;
    node.previousSibling = ref ? ref.previousSibling : this.lastChild;
    if (node.previousSibling) node.previousSibling.nextSibling = node;
    else this.firstChild = node;
    if (ref) ref.previousSibling = node;
    else this.lastChild = node;

    if (!container) touchText(this);
    else if (node.nodeType !== 8) {
      touch(this);
      // One already on the host is moving: it stays there.
      const usual = !node.live && startsParked(this) && (guess(this) ?? unknownSize(this));
      // A row that says how tall it is (windowed.ts) is parked at that, not at the usual size.
      const told = usual && node instanceof NElement && Number(node.attrs["data-height"]);
      const size = usual && told ? { ...usual, height: String(told) } : usual;
      if (size) {
        // Starts parked, as a box of the list's usual row: created and laid out only when it comes near what
        // shows (cull), a row at a time, not a page at once.
        node.parked = node.guessed = true;
        node.box = { id: node.nid, kind: "view", style: size, children: [] };
        parked.add(node.nid);
        resized = true;
        entered(this, node);
        return node;
      }
      realize(node);
      entered(this, node);
      let before = node.nextSibling;
      while (before && !before.live) before = before.nextSibling;
      ops.push(["insert", this.nid, node.nid, before ? before.nid : 0]);
    }
    return node;
  }

  removeChild<T extends NNode>(node: T): T {
    if (node.parentNode === this) unlink(node, true);
    return node;
  }

  replaceChild<T extends NNode>(node: NNode, old: T): T {
    this.insertBefore(node, old);
    return this.removeChild(old);
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  cloneNode(_deep?: boolean): NNode {
    return new NNode();
  }
}

/** Marks a node and its ancestors for layout; stops at one already marked, whose ancestors are. */
function touch(node: NNode | null) {
  for (; node && !node.dirty; node = node.parentNode) {
    node.dirty = true;
    if (node.parentNode) changed(node.parentNode, node);
  }
}

/** Where `node` is in its parent's kids, looked for around where it last was; -1 when it is not near there. */
function indexIn(parent: NNode, node: NNode) {
  const kids = parent.kids!;
  for (let d = 0; d <= 64; d++) {
    if (kids[node.at + d] === node) return (node.at += d);
    if (kids[node.at - d] === node) return (node.at -= d);
  }
  return -1;
}

/** Lost track of a container's kids: its next layout reads all its children again. */
function forget(parent: NNode) {
  parent.kids = parent.edited = parent.kept = undefined;
}

/** A child's box is to be taken anew by its parent's next layout. */
function changed(parent: NNode, node: NNode) {
  if (!parent.kids) return;
  const i = indexIn(parent, node);
  if (i < 0) return forget(parent);
  const e = parent.edited;
  if (!e) parent.edited = [i, i + 1];
  else [e[0], e[1]] = [Math.min(e[0], i), Math.max(e[1], i + 1)];
}

/** A child came (`by` 1) or went (-1) at kids[i]: the edited range covers it, and the kept range follows. */
function spliced(parent: NNode, i: number, by: 1 | -1, live: boolean) {
  const e = parent.edited;
  if (!e) parent.edited = [i, by > 0 ? i + 1 : i];
  else [e[0], e[1]] = [Math.min(e[0], i), by > 0 ? Math.max(e[1], i) + 1 : i < e[1] ? e[1] - 1 : i];
  const k = parent.kept;
  if (!k) return;
  // A parked child only moves the range; one on the host is in it.
  if (by > 0 && live) [k[0], k[1]] = [Math.min(k[0], i), Math.max(k[1], i) + 1];
  else [k[0], k[1]] = [i < k[0] ? k[0] + by : k[0], i < k[1] ? k[1] + by : k[1]];
}

/** A child (on the host, or parked) is in its container: into the kids, before the next sibling that is one. */
function entered(parent: NNode, node: NNode) {
  const kids = parent.kids;
  if (!kids) return;
  let next = node.nextSibling;
  while (next && (next.nodeType === 8 || (!next.live && !next.parked))) next = next.nextSibling;
  const i = next ? indexIn(parent, next) : kids.length;
  if (i < 0) return forget(parent);
  kids.splice(i, 0, node);
  node.at = i;
  spliced(parent, i, 1, node.live);
}

function unlink(node: NNode, destroy: boolean) {
  const parent = node.parentNode!;
  touch(parent);
  if (parent.kids && node.nodeType !== 8) {
    const i = indexIn(parent, node);
    if (i < 0) forget(parent);
    else {
      parent.kids.splice(i, 1);
      spliced(parent, i, -1, false);
    }
  }
  if (node.previousSibling) node.previousSibling.nextSibling = node.nextSibling;
  else parent.firstChild = node.nextSibling;
  if (node.nextSibling) node.nextSibling.previousSibling = node.previousSibling;
  else parent.lastChild = node.previousSibling;
  node.parentNode = node.nextSibling = node.previousSibling = null;
  if (node.parked) {
    node.parked = false;
    parked.delete(node.nid);
    parkedAt.delete(node.nid);
    node.box = undefined;
    node.guessed = false;
  }
  if (!destroy) return;
  if (node.live) {
    ops.push(["remove", node.nid]);
    unrealize(node);
  } else touchText(parent);
}

function unrealize(node: NNode) {
  if (!node.live) return;
  node.live = false;
  // Realized again later, the host has no frames for it: lay it out anew, with nothing reused.
  node.dirty = true;
  node.box = undefined;
  forget(node);
  screens.delete(node as NElement);
  bulky.delete(node);
  unsized.delete(node);
  sizes.delete(node.nid);
  live.delete(node.nid);
  sent.delete(node.nid);
  measured.delete(node.nid);
  scrolled.delete(node.nid);
  ended.delete(node.nid);
  for (let c = node.firstChild; c; c = c.nextSibling) unrealize(c);
}

/** A column takes this many new children in one render as they come; a list's worth more start parked (startsParked). */
const BULK = 24;
/** The children each container took since the last layout. */
const taken = new Map<NNode, number>();
/** Columns that started parking on that count alone: the next cull() makes lists of them, or brings all back. */
const bulky = new Set<NNode>();
/** Lists whose new children are parked at `UNKNOWN`: none of theirs was laid out to go by. */
const unsized = new Set<NNode>();
/** A new child's box until one of its list is laid out: cull() then takes the rest to be as tall (resize). */
const UNKNOWN: Styles = { height: "48" };

/**
 * Whether a new child of `list` starts parked, off the host: in a list being culled; and in a column that takes a
 * list's worth of children in one render (a thousand rows that arrive together), where creating them all only to
 * park most would cost the host thousands of views it never shows. cull() brings back the ones near the screen,
 * and all of them when the column turns out to fit.
 * ponytail: a column goes by its last layout, so a list rendered in the same pass as its container is still
 * created whole; its computed style would tell, when that shows up.
 */
function startsParked(list: NNode) {
  if (list.culled) return true;
  if (!list.box?.ys) return false;
  const n = (taken.get(list) ?? 0) + 1;
  taken.set(list, n);
  if (n <= BULK) return false;
  list.culled = true;
  bulky.add(list);
  return true;
}

function unknownSize(list: NNode) {
  unsized.add(list);
  return UNKNOWN;
}

/** The box a culled list's new child starts as: the mean size of the list's children as last laid out. */
function guess(list: NNode) {
  const box = list.box;
  if (!box) return undefined;
  if (list.guess?.[0] !== box) {
    let height = 0;
    let width = 0;
    let n = 0;
    for (let i = 0; i < (box.hs?.length ?? 0); i++) {
      if (Number.isNaN(box.hs![i])) continue;
      height += box.hs![i]!;
      width = box.ws![i]!;
      n++;
    }
    list.guess = [box, n ? { width: String(width), height: String(height / n) } : undefined];
  }
  return list.guess[1];
}

/** Text as CSS shows it (white-space: normal): whitespace runs are one space, none at the ends. Non-breaking spaces stay, as in CSS. */
const shown = (text: string | null) => (text ?? "").replace(/[ \t\n\r\f]+/g, " ").replace(/^ | $/g, "");

/** Creates a detached subtree on the host, parents before children. */
function realize(node: NNode) {
  if (node.live) return;
  node.live = true;
  node.dirty = true;
  if (node.parked) {
    node.parked = false;
    parked.delete(node.nid);
    node.box = undefined;
  }
  node.painted = undefined;
  restyled.add(node);
  if (!(node instanceof NElement)) {
    ops.push(["create", node.nid, "text"], ["set", node.nid, "text", shown(node.textContent)]);
    return;
  }
  live.set(node.nid, node);
  if (node.kind === "screen") {
    screens.add(node);
    presize(node.nid);
  }
  ops.push(["create", node.nid, node.kind]);
  for (const key in node.attrs) if (key !== "class" && key !== "style") ops.push(["set", node.nid, key, node.attrs[key]]);
  for (const type of node.listeners?.keys() ?? []) ops.push(["listen", node.nid, type]);
  if (!CONTAINERS.has(node.kind)) {
    ops.push(["set", node.nid, "text", shown(node.textContent)]);
    return;
  }
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 8) continue;
    realize(c);
    ops.push(["insert", node.nid, c.nid, 0]);
  }
}

/** Text changed under a leaf widget (button, label…): resend its whole text. */
function touchText(node: NNode | null) {
  for (; node; node = node.parentNode) {
    if (node instanceof NElement && !CONTAINERS.has(node.kind)) {
      if (node.live) ops.push(["set", node.nid, "text", shown(node.textContent)]);
      touch(node);
      return;
    }
  }
}

class NCharacterData extends NNode {
  #data: string;

  constructor(data: string) {
    super();
    this.#data = data;
  }

  get data() {
    return this.#data;
  }

  set data(value: string) {
    this.#data = String(value);
    if (this.live) {
      ops.push(["set", this.nid, "text", shown(this.#data)]);
      touch(this);
    } else touchText(this.parentNode);
  }

  get nodeValue() {
    return this.#data;
  }

  set nodeValue(value: string) {
    this.data = value;
  }

  override get textContent() {
    return this.#data;
  }

  override set textContent(value: string) {
    this.data = value;
  }
}

class NText extends NCharacterData {
  override nodeType = 3;
  nodeName = "#text";

  override cloneNode() {
    return new NText(this.data);
  }
}

class NComment extends NCharacterData {
  override nodeType = 8;
  nodeName = "#comment";

  override cloneNode() {
    return new NComment(this.data);
  }
}

class NFragment extends NNode {
  override nodeType = 11;
  nodeName = "#document-fragment";
}

/** Each element's style values, back to the element: one proxy handler serves them all. */
const styleOwner = new WeakMap<object, NElement>();
const styleHandler: ProxyHandler<Record<string, string>> = {
  set(styles, key: string, value: unknown) {
    setStyle(styles, key, value);
    return true;
  },
  deleteProperty(styles, key: string) {
    setStyle(styles, key, "");
    return true;
  },
  get(styles, key: string) {
    switch (key) {
      case "setProperty":
        return (name: string, value: unknown) => setStyle(styles, name, value);
      case "removeProperty":
        return (name: string) => setStyle(styles, name, "");
      case "getPropertyValue":
        return (name: string) => styles[name] ?? "";
      case "cssText":
        return Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join("; ");
      default:
        return styles[key] ?? "";
    }
  },
};

/** One inline style property: "" (or null) removes it. Resolved with the rest before the next batch. */
function setStyle(styles: Record<string, string>, key: string, value: unknown) {
  const v = value == null ? "" : String(value);
  if (key === "cssText") {
    for (const k in styles) delete styles[k];
    for (const [k, val] of declarations(v)) styles[k] = val;
  } else if (v === "") {
    if (!(key in styles)) return;
    delete styles[key];
  } else if (styles[key] === v) return;
  else {
    styles[key] = v;
    // A radius clips the children, as the web build's inline styles do.
    if (key === "borderRadius") styles.overflow = "hidden";
  }
  const el = styleOwner.get(styles)!;
  if (el.live) restyled.add(el);
}

class NElement extends NNode {
  localName: string;
  tagName: string;
  nodeName: string;
  namespaceURI: string;
  attrs: Record<string, unknown> = {};
  styles: Record<string, string> = {};
  /** Made on the first listener: most elements have none. */
  listeners?: Map<string, Set<Listener>>;
  style: Record<string, string> = new Proxy(this.styles, styleHandler);

  constructor(tag: string, namespaceURI = "http://www.w3.org/1999/xhtml") {
    super();
    styleOwner.set(this.styles, this);
    this.localName = tag.toLowerCase();
    this.tagName = this.nodeName = tag.toUpperCase();
    this.namespaceURI = namespaceURI;
  }

  get kind(): string {
    if (this.attrs.type === "checkbox") return "checkbox";
    return (this.attrs["data-native"] as string) || kindOf(this.localName);
  }

  setAttribute(key: string, value: unknown) {
    if (key === "style") return void setStyle(this.styles, "cssText", value);
    if (this.attrs[key] === value) return;
    this.attrs[key] = value;
    if (key === "data-window") windows.set(String(value), this);
    if (key === "data-before" || key === "data-after") touch(this);
    if (key === "class") {
      if (this.live) restyled.add(this);
      return;
    }
    if (this.live) {
      ops.push(["set", this.nid, key, value]);
      touch(this);
    }
  }

  getAttribute(key: string) {
    return key in this.attrs ? String(this.attrs[key]) : null;
  }

  hasAttribute(key: string) {
    return key in this.attrs;
  }

  removeAttribute(key: string) {
    if (key === "style") return void setStyle(this.styles, "cssText", "");
    if (!(key in this.attrs)) return;
    delete this.attrs[key];
    if (key === "class") {
      if (this.live) restyled.add(this);
      return;
    }
    if (this.live) {
      ops.push(["set", this.nid, key, null]);
      touch(this);
    }
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners ??= new Map();
    let set = this.listeners.get(type);
    if (!set) {
      this.listeners.set(type, (set = new Set()));
      if (this.live) ops.push(["listen", this.nid, type]);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners?.get(type)?.delete(listener);
  }

  override cloneNode(deep?: boolean) {
    const clone = new NElement(this.localName, this.namespaceURI);
    Object.assign(clone.attrs, this.attrs);
    Object.assign(clone.styles, this.styles);
    if (deep) for (let c = this.firstChild; c; c = c.nextSibling) clone.appendChild(c.cloneNode(true));
    return clone;
  }
}

// Properties nuclo assigns directly (`key in el`), so values keep their type.
for (const [prop, attr] of [
  ["className", "class"],
  ["id", "id"],
  ["value", "value"],
  ["checked", "checked"],
  ["disabled", "disabled"],
  ["placeholder", "placeholder"],
  ["src", "src"],
  ["type", "type"],
]) {
  Object.defineProperty(NElement.prototype, prop, {
    get(this: NElement) {
      return this.attrs[attr] ?? "";
    },
    set(this: NElement, value: unknown) {
      this.setAttribute(attr, value);
    },
  });
}

const body = new NElement("body");
body.live = true;
live.set(body.nid, body); // nid 1: the host's root view

const g = globalThis as Record<string, unknown>;
g.window ??= globalThis;
g.Node = NNode;
g.Element = g.HTMLElement = NElement;
g.Text = NText;
g.Comment = NComment;
g.DocumentFragment = NFragment;
const head = new NElement("head");
g.document = {
  body,
  head,
  createElement: (tag: string) => new NElement(tag),
  createElementNS: (ns: string, tag: string) => new NElement(tag, ns),
  createTextNode: (data: string) => new NText(String(data)),
  createComment: (data: string) => new NComment(data),
  createDocumentFragment: () => new NFragment(),
  getElementById: (id: string) => {
    const find = (node: NNode): NElement | null => {
      if (node instanceof NElement && node.attrs.id === id) return node;
      for (let c = node.firstChild; c; c = c.nextSibling) {
        const found = find(c);
        if (found) return found;
      }
      return null;
    };
    return find(head) ?? find(body);
  },
};
// Engines older than ES2021 (e.g. some QuickJS builds) lack WeakRef.
g.WeakRef ??= class {
  #target: object;
  constructor(target: object) {
    this.#target = target;
  }
  deref() {
    return this.#target;
  }
};

/** Sends the pending ops to the host as one batch. */
export function flush() {
  styleAll();
  const batch = ops;
  ops = [];
  if (batch.length) {
    // A new text or font changes a leaf's size.
    for (const op of batch) if (op[0] === "set" || op[0] === "style") measured.delete(op[1]);
    send(batch);
  }
  if (!batch.length && !resized) return;
  resized = false;
  const frames = relayout();
  taken.clear();
  if (frames.length) send(frames);
  for (const laidOut of hooks.laidOut) laidOut();
  if (cull()) flush();
  reachEnds();
}

/** True while the host applies a batch: a scroll it reports then waits for the batch's end. */
let sending = false;

function send(batch: Op[]) {
  sending = true;
  try {
    const host = globalThis.__nuclo_host;
    if (!host) throw new Error("nuclo-native: no __nuclo_host; the bundle runs inside a native host");
    host(JSON.stringify(batch));
  } finally {
    sending = false;
  }
}

// ── Layout ───────────────────────────────────────────────────────────────

/** Each layout root's size, as its host reported it (or, until it has, the window's: presize). */
const sizes = new Map<number, [number, number, number]>();
/** The window's size, from a host that knows it before its views are laid out (device "window"); null: not asked yet. */
let windowSize: [number, number, number] | undefined | null = null;

/**
 * A new layout root is taken to be the window's size, where the host tells it ("w h scale", as a resize carries it),
 * until the host reports the root's own: the first screen is then laid out in the turn that renders it, not a frame
 * and a round trip later, and @media rules match from the start.
 */
function presize(id: number) {
  if (sizes.has(id)) return;
  if (windowSize === null) {
    const [w, h, scale] = String(globalThis.__nuclo_device?.("window") ?? "").split(" ").map(Number);
    windowSize = w && h ? [w, h, scale || 0] : undefined;
  }
  if (!windowSize) return;
  sizes.set(id, [...windowSize]);
  resized = true;
}
/** The frames hosts have, by node. */
const sent = new Map<number, Frame>();
/** Host measurements by node, then by max width. */
const measured = new Map<number, Map<number, { w: number; h: number }>>();
let resized = false;
presize(1);

// ── Windowed lists (windowed.ts) ─────────────────────────────────────────

/** Each windowed list's container, by its `data-window`. */
const windows = new Map<string, NElement>();
/** Called after a scroll was reported, and after a layout. */
export const hooks = { scrolled: new Set<() => void>(), laidOut: new Set<() => void>() };

/**
 * Where its screen's visible part is in a windowed list's container: [y, height]. Undefined until the container is
 * laid out; null when it is not in the document (not yet, or no more: then it is forgotten here).
 */
export function windowPlace(id: string): [y: number, h: number] | undefined | null {
  const el = windows.get(id);
  if (!el) return undefined;
  if (!el.isConnected) return null;
  let y = 0;
  let node: NNode = el;
  for (; node !== body && !screens.has(node as NElement); node = node.parentNode!) {
    const frame = sent.get(node.nid);
    if (!frame) return undefined;
    y += frame[1];
  }
  const size = sizes.get(node.nid);
  if (!size) return undefined;
  const [top, h] = scrolled.get(node.nid) ?? [0, size[1]];
  return [top - y, h];
}

/** The heights of a windowed list's container's children as laid out; undefined for one never laid out. */
export const windowHeights = (id: string) =>
  windows.get(id)?.kids?.map((kid) => (sent.get(kid.nid) ?? parkedAt.get(kid.nid))?.[3]) ?? [];

export const forgetWindow = (id: string) => void windows.delete(id);

/** The frames sent to the host (for checks: see check.ts). */
export const sentFrames = (): ReadonlyMap<number, Frame> => sent;
/** The largest device pixels per unit any layout root reported (1 before any did). */
export const deviceScale = () => Math.max(1, ...[...sizes.values()].map((size) => size[2]));

/** The layout tree, rebuilt only along dirty paths: a clean node keeps its node object, and with it layout's cache. */
function tree(node: NNode): LayoutNode {
  if (!node.dirty && node.box) return node.box;
  node.dirty = false;
  const el = node instanceof NElement ? node : null;
  const kind = el ? el.kind : "text";
  let children: LayoutNode[] = [];
  const prev = node.box;
  let span: [number, number] | undefined;
  if (el && CONTAINERS.has(kind)) {
    // A parked child is the box it last had: nothing of it is measured or sent.
    const boxOf = (c: NNode) => (c.parked ? c.box! : tree(c));
    const [from, to] = node.edited ?? [0, 0];
    node.edited = undefined;
    const kids = node.kids;
    const old = prev?.children;
    const tail = old && kids ? to + old.length - kids.length : -1;
    if (old && kids && tail >= from) {
      // Only the edited kids: a long list with one row replaced takes up that row.
      children = old.slice(0, from);
      for (let i = from; i < to; i++) children.push(boxOf(kids[i]!));
      children = children.concat(old.slice(tail));
      span = [from, to];
    } else {
      const all: NNode[] = (node.kids = []);
      for (let c = node.firstChild; c; c = c.nextSibling) {
        if ((!c.live && !c.parked) || c.nodeType === 8) continue;
        c.at = all.length;
        all.push(c);
        children.push(boxOf(c));
      }
    }
  }
  // A windowed list's rows before and after its window are its padding (windowed.ts). Not through its style: its
  // rows' styles are shared under it, and one more of it for every place the window has been would keep them all.
  const style = el?.attrs["data-window"]
    ? { ...node.computed, paddingTop: `${el.attrs["data-before"]}px`, paddingBottom: `${el.attrs["data-after"]}px` }
    : (node.computed ?? {});
  if (prev) prev.prev = undefined; // Only the last one: no chain of old nodes.
  // The same computed style parses the same: keep what layout read from it.
  const parsed = prev?.style === style ? prev.parsed : undefined;
  const box: LayoutNode = (node.box = { id: node.nid, kind, style, children, prev, parsed, span });
  // Hosts that size by content (host.ts) are asked with it, not by node.
  if ((kind === "text" || kind === "button") && globalThis.__nuclo_text_size) box.content = shown(node.textContent);
  else if (kind === "image" && globalThis.__nuclo_image_size) box.content = String(el!.attrs.src ?? "");
  return box;
}

/** Content sizes by what was measured: rows repeat texts and images. */
const contentSizes = new Map<string, { w: number; h: number }>();

function measureContent(node: LayoutNode, content: string, key: number) {
  const image = node.kind === "image";
  const s = node.style;
  const size = length(s.fontSize) ?? 14;
  const bold = s.fontWeight === "bold" || parseInt(s.fontWeight ?? "") >= 600;
  const system = s.fontFamily === "system";
  const id = image ? `i${content}` : `${size} ${bold} ${system} ${key} ${content}`;
  let found = contentSizes.get(id);
  if (!found) {
    const reply = image ? globalThis.__nuclo_image_size!(content) : globalThis.__nuclo_text_size!(content, size, bold, system, key);
    const [w, h] = String(reply).split(" ").map(Number);
    // ponytail: emptied when full; an LRU if one screen ever holds this many distinct texts.
    if (contentSizes.size >= 20000) contentSizes.clear();
    contentSizes.set(id, (found = { w: w || 0, h: h || 0 }));
  }
  return found;
}

function measure(node: LayoutNode, maxWidth: number) {
  const key = Number.isFinite(maxWidth) ? Math.round(maxWidth * 100) / 100 : -1;
  if (node.content !== undefined) return measureContent(node, node.content, key);
  let cache = measured.get(node.id);
  if (!cache) measured.set(node.id, (cache = new Map()));
  let size = cache.get(key);
  if (!size) {
    const reply = String(globalThis.__nuclo_measure?.(node.id, key) ?? "");
    const [w, h] = reply.split(" ").map(Number);
    cache.set(key, (size = { w: w || 0, h: h || 0 }));
  }
  return size;
}

/** Lays out every sized root; returns frame ops for what moved. */
function relayout(): Op[] {
  if (typeof globalThis.__nuclo_measure !== "function") return [];
  // With the router, each screen is a root (its content scrolls); otherwise the body is.
  let navigation = false;
  for (let c = body.firstChild; c; c = c.nextSibling) {
    if (c instanceof NElement && (c.kind === "tabs" || c.kind === "stack")) navigation = true;
  }
  const roots = navigation ? screens : [body];
  const out: Op[] = [];
  layoutUnparked(out);
  for (const root of roots) {
    const size = sizes.get(root.nid);
    if (!size) continue;
    const { frames, height } = layout(tree(root), size[0], navigation ? undefined : size[1], measure, size[2]);
    // The root's own box: a screen's is its scrollable content.
    frames.set(root.nid, [0, 0, size[0], height]);
    moved(frames, out);
  }
  return out;
}

/** Adds frame ops for the frames that moved since they were sent. Parked nodes have none: where they are is kept. */
function moved(frames: Map<number, Frame>, out: Op[]) {
  for (const [id, box] of frames) {
    if (parked.has(id)) {
      parkedAt.set(id, box);
      continue;
    }
    for (let i = 0; i < 4; i++) box[i] = Math.round(box[i] * 10000) / 10000;
    const old = sent.get(id);
    if (old && old[0] === box[0] && old[1] === box[1] && old[2] === box[2] && old[3] === box[3]) continue;
    sent.set(id, box);
    out.push(["frame", id, ...box]);
  }
}

// ── Scrolling ────────────────────────────────────────────────────────────

/** Each layout root's scroll offset and visible height, as its host reported them. */
const scrolled = new Map<number, [number, number]>();
/** The content height each root last got "end" at. */
const ended = new Map<number, number>();

// ── Long lists ───────────────────────────────────────────────────────────

/** Ids of parked nodes: laid out, never sent. */
const parked = new Set<number>();
/** Where each parked node is (its last frame, unrounded once laid out parked): it comes back there. */
const parkedAt = new Map<number, Frame>();
/** Nodes back on the host since the last layout, with their parent and index. */
const unparked: [NNode, NNode, number][] = [];

/**
 * Keeps the host's views near what each screen shows. In a column of content height (a list) taller than the
 * window, children more than a screen past the visible part are parked: removed from the host, laid out as a box of
 * their last size. They come back within a screen of it. A row added to such a list starts parked, at a guessed
 * size, and is created and laid out when it first comes near; a single render of thousands of rows still creates
 * them all once.
 * Returns whether it changed anything (the caller flushes).
 */
function cull() {
  const start = ops.length;
  resizedGuesses = false;
  for (const screen of screens) {
    const size = sizes.get(screen.nid);
    if (!size) continue;
    const [y, h] = scrolled.get(screen.nid) ?? [0, size[1]];
    if (h <= 0) continue;
    keep(screen, y - h, y + 2 * h, h);
  }
  // A column that parked its new children as a list would (startsParked) and that no screen's culling reached,
  // under one that fits or is no column: it is no list, and shows them all.
  for (const list of bulky) {
    for (let c = list.firstChild; c; c = c.nextSibling) {
      if (!c.parked) continue;
      realize(c);
      let before = c.nextSibling;
      while (before && !before.live) before = before.nextSibling;
      ops.push(["insert", list.nid, c.nid, before ? before.nid : 0]);
      // Never laid out: its list places it.
      c.guessed = true;
      unparked.push([c, list, -1]);
    }
    list.culled = false;
    list.kept = undefined;
    unsized.delete(list);
  }
  bulky.clear();
  return ops.length > start || resizedGuesses;
}

/** cull() gave parked children another size (resize): the caller lays out again, though the host got no op. */
let resizedGuesses = false;

/**
 * The children of `list` parked at the unknown size are taken to be as tall as those laid out since, so the list is
 * about as tall as it will be when they show.
 */
function resize(list: NNode, kids: NNode[], hs: number[], ws: number[]) {
  let height = 0;
  let width = 0;
  let n = 0;
  kids.forEach((kid, i) => {
    if (kid.guessed || Number.isNaN(hs[i])) return;
    height += hs[i]!;
    width = ws[i]!;
    n++;
  });
  if (!n) return;
  unsized.delete(list);
  const size = { width: String(width), height: String(height / n) };
  for (const kid of kids) {
    if (kid.box?.style !== UNKNOWN) continue;
    kid.box = { id: kid.nid, kind: "view", style: size, children: [] };
    changed(list, kid);
  }
  touch(list);
  resized = resizedGuesses = true;
}

/** Children of `node` within [top, bottom] (its coordinates) are on the host; those `margin` further out leave it. */
function keep(node: NNode, top: number, bottom: number, margin: number) {
  const box = node.box;
  const kids = node.kids;
  if (!node.live || !box?.ys || !box.hs || !kids) return;
  const { ys, hs } = box;
  const n = kids.length;
  bulky.delete(node);
  if ((box.placed?.[2] ?? 0) <= bottom - top + 2 * margin) {
    // It fits: a list that shrank brings everything back.
    if (node.culled) kids.forEach((kid, i) => kid.parked && unpark(node, i));
    node.kept = undefined;
    node.culled = false;
    unsized.delete(node);
    return;
  }
  node.culled = true;
  if (unsized.has(node)) resize(node, kids, hs, box.ws!);
  /** The first child whose box ends past `y`, or (`end` false) starts past it. */
  const find = (y: number, end: boolean) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((end ? ys[mid] + hs[mid] : ys[mid]) <= y) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const [showFrom, showTo] = [find(top, true), find(bottom, false)];
  const [keepFrom, keepTo] = [find(top - margin, true), find(bottom + margin, false)];
  // Live children lie in the last kept range, unless children came or went since.
  const [from, to] = node.kept ?? [0, n];
  let settled = true;
  for (let i = showFrom; i < showTo; i++) {
    if (!kids[i].parked) continue;
    if (kids[i].guessed) settled = false;
    unpark(node, i);
  }
  // Where the rest lies is a guess until the guessed sizes just brought back are laid out: nothing leaves on it.
  if (!settled) {
    node.kept = [Math.min(from, showFrom), Math.max(to, showTo)];
    return;
  }
  for (let i = from; i < to; i++) if ((i < keepFrom || i >= keepTo) && kids[i].live) park(node, i, hs[i]);
  node.kept = [keepFrom, keepTo];
  for (let i = showFrom; i < showTo; i++) keep(kids[i], top - ys[i], bottom - ys[i], margin);
}

/** Takes the parent's child `i` off the host. Its box keeps its size, so the parent's layout stands as it is. */
function park(parent: NNode, i: number, height: number) {
  const node = parent.kids![i];
  const frame = sent.get(node.nid);
  if (!frame) return;
  ops.push(["remove", node.nid]);
  unrealize(node);
  parkedAt.set(node.nid, frame);
  node.parked = true;
  parked.add(node.nid);
  node.dirty = false;
  node.box = { id: node.nid, kind: "view", style: { width: String(frame[2]), height: String(height) }, children: [] };
  parent.box!.children[i] = node.box;
}

/** Puts the parent's child `i` back on the host; relayout() lays it out on its own (layoutUnparked). */
function unpark(parent: NNode, i: number) {
  const node = parent.kids![i];
  realize(node);
  let before = node.nextSibling;
  while (before && !before.live) before = before.nextSibling;
  ops.push(["insert", parent.nid, node.nid, before ? before.nid : 0]);
  unparked.push([node, parent, i]);
}

/**
 * Lays out the nodes unparked since the last layout on their own, at the width they had: one that comes back at
 * its height leaves its list as it is. One that changed size, or whose list changed anyway, is laid out with it.
 */
function layoutUnparked(out: Op[]) {
  for (const [node, parent, i] of unparked.splice(0)) {
    const frame = parkedAt.get(node.nid);
    parkedAt.delete(node.nid);
    const box = parent.box;
    // One parked at a guessed size was never laid out: its list places it, and moves the rows after it.
    const guessed = node.guessed;
    node.guessed = false;
    // Laid out with its list: the list takes its box anew.
    const withList = () => {
      touch(parent);
      if (node.parentNode === parent) changed(parent, node);
    };
    if (guessed || !node.live || node.parentNode !== parent || parent.dirty || !frame || !box?.ws || !box.hs) {
      withList();
      continue;
    }
    let root: NNode = parent;
    while (root.parentNode && !screens.has(root as NElement)) root = root.parentNode;
    const { frames, height } = layout(tree(node), box.ws[i], undefined, measure, sizes.get(root.nid)?.[2] ?? 0);
    // Its subtree's frames stand either way (they are relative to it, at the width it had): its list, laid out
    // again, keeps them. Sent frames are rounded (moved), so the height it had is compared within that.
    if (Math.abs(height - frame[3]) > 1e-4) {
      frames.delete(node.nid);
      withList();
    } else {
      box.children[i] = node.box!;
      frames.set(node.nid, frame);
    }
    moved(frames, out);
  }
}

/** Sends "end" to each listening root whose content's end is within half its visible height, once per content height. */
function reachEnds() {
  for (const [id, size] of sizes) {
    const el = live.get(id);
    const content = sent.get(id)?.[3];
    if (!el?.listeners?.has("end") || content === undefined || ended.get(id) === content) continue;
    const [y, h] = scrolled.get(id) ?? [0, size[1]];
    if (y + h * 1.5 < content) continue;
    ended.set(id, content);
    // Loading more grows the content; still short of filling the screen, the next flush loads again.
    dispatch(el, "end", false);
  }
}

// ── Events ───────────────────────────────────────────────────────────────

/**
 * Runs an event's listeners as the DOM does: the element's, then each ancestor's (`bubbles`), until one stops it.
 * The host reports an event on the view that listens for it, so `target` is that element, not a child inside it.
 */
function dispatch(el: NElement, type: string, bubbles = true) {
  let stopped = false;
  const event = {
    type,
    target: el,
    currentTarget: el as NNode,
    bubbles,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      stopped = true;
    },
  };
  for (let node: NNode | null = el; node && !stopped; node = bubbles ? node.parentNode : null) {
    const listeners = node instanceof NElement ? node.listeners?.get(type) : undefined;
    if (!listeners) continue;
    const at = node as NElement;
    event.currentTarget = at;
    for (const listener of [...listeners]) listener.call(at, event);
  }
  flush();
}

/** Host → JS: a native event on a widget. `value` carries an input's text or a checkbox's state. */
globalThis.__nuclo_event = (id, type, value) => {
  if (type === "resize") {
    const [w, h, scale] = String(value).split(" ").map(Number);
    sizes.set(id, [w || 0, h || 0, scale || 0]);
    resized = true;
    flush();
    return;
  }
  if (type === "scroll") {
    const [y, h] = String(value).split(" ").map(Number);
    scrolled.set(id, [y || 0, h || 0]);
    if (sending) return;
    for (const scrolled of hooks.scrolled) scrolled();
    if (cull()) flush();
    reachEnds();
    return;
  }
  if (type === "timer") {
    fire(id);
    flush();
    return;
  }
  // A request's answer: what the app does with it runs when its promise does, and flushes for itself (update()).
  if (type === "fetch") return settle(id, String(value));
  // A remote image arrived (value: its src): it has a natural size now, so the images showing it are laid out again.
  if (type === "load") {
    contentSizes.delete(`i${value}`);
    for (const el of live.values()) if (el.attrs.src === value && el.kind === "image") touch(el);
    resized = true;
    flush();
    return;
  }
  const el = live.get(id);
  if (!el) return;
  if (value !== undefined) el.attrs[typeof value === "boolean" ? "checked" : "value"] = value;
  dispatch(el, type);
};
