/**
 * The native DOM: just enough DOM for nuclo to run unmodified, with every
 * mutation of the live tree recorded as an op for the platform host.
 *
 * Only nodes attached under document.body exist on the host ("live"). Trees
 * nuclo builds off-document, list templates and comment markers cost nothing
 * natively: they are realized in one pass when they get attached.
 *
 * Ops (the whole host contract):
 *   ["create", id, kind]             kind: view | text | button | input | checkbox | image
 *                                    navigation (router.ts): tabs | stack | screen
 *   ["insert", parentId, id, beforeId]   beforeId 0 = append; also moves
 *   ["remove", id]                   detach and destroy the subtree
 *   ["set",    id, key, value]       text, value, checked, placeholder, disabled, src…
 *                                    screen: title · stack: title, icon (its tab) · tabs: selected
 *   ["style",  id, key, value]       camelCase CSS subset
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
 * In a long list, rows far from what the screen shows leave the host (cull).
 *
 * Navigation: at the end of a batch the host compares each stack's screens with
 * the previous batch. A new top screen is a push, a removed top screen a pop,
 * both animated the platform's way. A tabs or stack inserted into the body is
 * the window's root navigation.
 *
 * Events (host → JS): __nuclo_event(id, type, value?)
 *   click · input (value: text) · change (value: checked)
 *   scroll on a layout root (value: "y h", its scroll offset and visible height)
 *   pop on a stack (value: depth left) after the user went back natively
 *   select on the tabs (value: index)
 *
 * A layout root listening for "end" gets it from JS when its content's end comes
 * within half its visible height, once per content height: infinite lists load more on it.
 *
 * Device data (battery…) has its own two calls: see device.ts.
 */

import "./host";
import { type Frame, type LayoutNode, layout } from "./layout";

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
const TAG_STYLE: Record<string, Record<string, string>> = {
  h1: { fontSize: "32px", fontWeight: "bold" },
  h2: { fontSize: "24px", fontWeight: "bold" },
  h3: { fontSize: "20px", fontWeight: "bold" },
  strong: { fontWeight: "bold" },
  b: { fontWeight: "bold" },
};

/** Kinds that hold child widgets. */
const CONTAINERS = new Set(["view", "screen", "stack", "tabs"]);

function kindOf(tag: string) {
  if (tag === "button") return "button";
  if (tag === "input" || tag === "textarea") return "input";
  if (tag === "img") return "image";
  return TEXT_TAGS.has(tag) ? "text" : "view";
}

class NNode {
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
  /** A container's laid-out children, in box.children order: cull finds them by index. */
  kids?: NNode[];
  /** A long list being culled: the children that may be on the host lie in kept. Inserts and removes reset it. */
  kept?: [number, number];

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
      this.kept = undefined;
      realize(node);
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
  for (; node && !node.dirty; node = node.parentNode) node.dirty = true;
}

function unlink(node: NNode, destroy: boolean) {
  const parent = node.parentNode!;
  touch(parent);
  parent.kept = undefined;
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
  screens.delete(node as NElement);
  live.delete(node.nid);
  sent.delete(node.nid);
  measured.delete(node.nid);
  scrolled.delete(node.nid);
  ended.delete(node.nid);
  culledAt.delete(node.nid);
  for (let c = node.firstChild; c; c = c.nextSibling) unrealize(c);
}

/** Text as CSS shows it (white-space: normal): whitespace runs are one space, none at the ends. */
const shown = (text: string | null) => (text ?? "").replace(/[ \t\n\r\f]+/g, " ").trim();

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
  if (!(node instanceof NElement)) {
    ops.push(["create", node.nid, "text"], ["set", node.nid, "text", shown(node.textContent)]);
    return;
  }
  live.set(node.nid, node);
  if (node.kind === "screen") screens.add(node);
  ops.push(["create", node.nid, node.kind]);
  const style = { ...TAG_STYLE[node.localName], ...node.styles };
  for (const key in style) ops.push(["style", node.nid, key, style[key]]);
  for (const key in node.attrs) ops.push(["set", node.nid, key, node.attrs[key]]);
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
  set(styles, key: string, value: string) {
    if (styles[key] === value) return true;
    styles[key] = value;
    const el = styleOwner.get(styles)!;
    if (el.live) {
      ops.push(["style", el.nid, key, value]);
      touch(el);
    }
    return true;
  },
};

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
    if (this.attrs[key] === value) return;
    this.attrs[key] = value;
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
    delete this.attrs[key];
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
g.document = {
  body,
  head: new NElement("head"),
  createElement: (tag: string) => new NElement(tag),
  createElementNS: (ns: string, tag: string) => new NElement(tag, ns),
  createTextNode: (data: string) => new NText(String(data)),
  createComment: (data: string) => new NComment(data),
  createDocumentFragment: () => new NFragment(),
  getElementById: () => null,
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
  if (frames.length) send(frames);
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

/** Each layout root's size, as its host reported it. */
const sizes = new Map<number, [number, number, number]>();
/** The frames hosts have, by node. */
const sent = new Map<number, Frame>();
/** Host measurements by node, then by max width. */
const measured = new Map<number, Map<number, { w: number; h: number }>>();
let resized = false;

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
  const children: LayoutNode[] = [];
  if (el && CONTAINERS.has(kind)) {
    const kids: NNode[] = (node.kids = []);
    for (let c = node.firstChild; c; c = c.nextSibling) {
      if ((!c.live && !c.parked) || c.nodeType === 8) continue;
      kids.push(c);
      // A parked child is the box it last had: nothing of it is measured or sent.
      children.push(c.parked ? c.box! : tree(c));
    }
  }
  const style = el ? { ...TAG_STYLE[el.localName], ...el.styles } : {};
  const prev = node.box;
  if (prev) prev.prev = undefined; // Only the last one: no chain of old nodes.
  return (node.box = { id: node.nid, kind, style, children, prev });
}

function measure(node: LayoutNode, maxWidth: number) {
  let cache = measured.get(node.id);
  if (!cache) measured.set(node.id, (cache = new Map()));
  const key = Number.isFinite(maxWidth) ? Math.round(maxWidth * 100) / 100 : -1;
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
/** Each screen's scroll offset at its last cull. */
const culledAt = new Map<number, number>();

/**
 * Keeps the host's views near what each screen shows. In a column of content height (a list) taller than the
 * window, children more than a screen past the visible part are parked: removed from the host, laid out as a box of
 * their last size. They come back within a screen of it. A page appended to a list is realized, measured and laid
 * out, then parked if it is far; a single render of thousands of rows still creates them all once.
 * Returns whether it changed anything (the caller flushes).
 */
function cull(scrolling = false) {
  const start = ops.length;
  for (const screen of screens) {
    const size = sizes.get(screen.nid);
    if (!size) continue;
    const [y, h] = scrolled.get(screen.nid) ?? [0, size[1]];
    // What shows stays within a screen of the last pass until it has moved half a screen: check again then.
    const last = culledAt.get(screen.nid);
    if (h <= 0 || (scrolling && last !== undefined && Math.abs(y - last) < h / 2)) continue;
    culledAt.set(screen.nid, y);
    keep(screen, y - h, y + 2 * h, h);
  }
  return ops.length > start;
}

/** Children of `node` within [top, bottom] (its coordinates) are on the host; those `margin` further out leave it. */
function keep(node: NNode, top: number, bottom: number, margin: number) {
  const box = node.box;
  const kids = node.kids;
  if (!node.live || !box?.ys || !box.hs || !kids) return;
  const { ys, hs } = box;
  const n = kids.length;
  if ((box.placed?.[2] ?? 0) <= bottom - top + 2 * margin) {
    // It fits: a list that shrank brings everything back.
    if (node.kept) kids.forEach((kid, i) => kid.parked && unpark(node, i));
    node.kept = undefined;
    return;
  }
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
  for (let i = from; i < to; i++) if ((i < keepFrom || i >= keepTo) && kids[i].live) park(node, i, hs[i]);
  for (let i = showFrom; i < showTo; i++) if (kids[i].parked) unpark(node, i);
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
    if (!node.live || node.parentNode !== parent || parent.dirty || !frame || !box?.ws || !box.hs) {
      touch(parent);
      continue;
    }
    let root: NNode = parent;
    while (root.parentNode && !screens.has(root as NElement)) root = root.parentNode;
    const { frames, height } = layout(tree(node), box.ws[i], undefined, measure, sizes.get(root.nid)?.[2] ?? 0);
    if (height !== box.hs[i]) {
      touch(parent);
      continue;
    }
    box.children[i] = node.box!;
    frames.set(node.nid, frame);
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
    dispatch(el, "end");
  }
}

// ── Events ───────────────────────────────────────────────────────────────

function dispatch(el: NElement, type: string) {
  const event = { type, target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} };
  for (const listener of [...(el.listeners?.get(type) ?? [])]) listener.call(el, event);
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
    if (cull(true)) flush();
    reachEnds();
    return;
  }
  const el = live.get(id);
  if (!el) return;
  if (value !== undefined) el.attrs[typeof value === "boolean" ? "checked" : "value"] = value;
  dispatch(el, type);
};
