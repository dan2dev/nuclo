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
 * batch JS lays every sized root out and sends the frames that changed, as a
 * second batch.
 *
 * Navigation: at the end of a batch the host compares each stack's screens with
 * the previous batch. A new top screen is a push, a removed top screen a pop,
 * both animated the platform's way. A tabs or stack inserted into the body is
 * the window's root navigation.
 *
 * Events (host → JS): __nuclo_event(id, type, value?)
 *   click · input (value: text) · change (value: checked)
 *   pop on a stack (value: depth left) after the user went back natively
 *   select on the tabs (value: index)
 *
 * Device data (battery…) has its own two calls: see device.ts.
 */

import { type Frame, type LayoutNode, layout } from "./layout";

type Op = [string, number, ...unknown[]];
type Listener = (this: NElement, event: unknown) => void;

let ops: Op[] = [];
let nextId = 1;
const live = new Map<number, NElement>();

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

  get isConnected() {
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

function unlink(node: NNode, destroy: boolean) {
  const parent = node.parentNode!;
  if (node.previousSibling) node.previousSibling.nextSibling = node.nextSibling;
  else parent.firstChild = node.nextSibling;
  if (node.nextSibling) node.nextSibling.previousSibling = node.previousSibling;
  else parent.lastChild = node.previousSibling;
  node.parentNode = node.nextSibling = node.previousSibling = null;
  if (!destroy) return;
  if (node.live) {
    ops.push(["remove", node.nid]);
    unrealize(node);
  } else touchText(parent);
}

function unrealize(node: NNode) {
  if (!node.live) return;
  node.live = false;
  live.delete(node.nid);
  sent.delete(node.nid);
  measured.delete(node.nid);
  for (let c = node.firstChild; c; c = c.nextSibling) unrealize(c);
}

/** Text as CSS shows it (white-space: normal): whitespace runs are one space, none at the ends. */
const shown = (text: string | null) => (text ?? "").replace(/[ \t\n\r\f]+/g, " ").trim();

/** Creates a detached subtree on the host, parents before children. */
function realize(node: NNode) {
  if (node.live) return;
  node.live = true;
  if (!(node instanceof NElement)) {
    ops.push(["create", node.nid, "text"], ["set", node.nid, "text", shown(node.textContent)]);
    return;
  }
  live.set(node.nid, node);
  ops.push(["create", node.nid, node.kind]);
  const style = { ...TAG_STYLE[node.localName], ...node.styles };
  for (const key in style) ops.push(["style", node.nid, key, style[key]]);
  for (const key in node.attrs) ops.push(["set", node.nid, key, node.attrs[key]]);
  for (const type of node.listeners.keys()) ops.push(["listen", node.nid, type]);
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
    if (this.live) ops.push(["set", this.nid, "text", shown(this.#data)]);
    else touchText(this.parentNode);
  }

  get nodeValue() {
    return this.#data;
  }

  set nodeValue(value: string) {
    this.data = value;
  }

  get textContent() {
    return this.#data;
  }

  set textContent(value: string) {
    this.data = value;
  }
}

class NText extends NCharacterData {
  nodeType = 3;
  nodeName = "#text";

  cloneNode() {
    return new NText(this.data);
  }
}

class NComment extends NCharacterData {
  nodeType = 8;
  nodeName = "#comment";

  cloneNode() {
    return new NComment(this.data);
  }
}

class NFragment extends NNode {
  nodeType = 11;
  nodeName = "#document-fragment";
}

class NElement extends NNode {
  localName: string;
  tagName: string;
  nodeName: string;
  namespaceURI: string;
  attrs: Record<string, unknown> = {};
  styles: Record<string, string> = {};
  listeners = new Map<string, Set<Listener>>();
  style = new Proxy(this.styles, {
    set: (styles, key: string, value: string) => {
      if (styles[key] === value) return true;
      styles[key] = value;
      if (this.live) ops.push(["style", this.nid, key, value]);
      return true;
    },
  });

  constructor(tag: string, namespaceURI = "http://www.w3.org/1999/xhtml") {
    super();
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
    if (this.live) ops.push(["set", this.nid, key, value]);
  }

  getAttribute(key: string) {
    return key in this.attrs ? String(this.attrs[key]) : null;
  }

  hasAttribute(key: string) {
    return key in this.attrs;
  }

  removeAttribute(key: string) {
    delete this.attrs[key];
    if (this.live) ops.push(["set", this.nid, key, null]);
  }

  addEventListener(type: string, listener: Listener) {
    let set = this.listeners.get(type);
    if (!set) {
      this.listeners.set(type, (set = new Set()));
      if (this.live) ops.push(["listen", this.nid, type]);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  cloneNode(deep?: boolean) {
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
  constructor(private target: object) {}
  deref() {
    return this.target;
  }
};

/** Sends the pending ops to the host as one batch. */
export function flush() {
  const batch = ops;
  ops = [];
  const host = g.__nuclo_host as (json: string) => void;
  if (batch.length) {
    // A new text or font changes a leaf's size.
    for (const op of batch) if (op[0] === "set" || op[0] === "style") measured.delete(op[1]);
    host(JSON.stringify(batch));
  }
  if (!batch.length && !resized) return;
  resized = false;
  const frames = relayout();
  if (frames.length) host(JSON.stringify(frames));
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

function tree(node: NNode): LayoutNode {
  const el = node instanceof NElement ? node : null;
  const kind = el ? el.kind : "text";
  const children: LayoutNode[] = [];
  if (el && CONTAINERS.has(kind)) {
    for (let c = node.firstChild; c; c = c.nextSibling) if (c.live && c.nodeType !== 8) children.push(tree(c));
  }
  return { id: node.nid, kind, style: el ? { ...TAG_STYLE[el.localName], ...el.styles } : {}, children };
}

function measure(node: LayoutNode, maxWidth: number) {
  let cache = measured.get(node.id);
  if (!cache) measured.set(node.id, (cache = new Map()));
  const key = Number.isFinite(maxWidth) ? Math.round(maxWidth * 100) / 100 : -1;
  let size = cache.get(key);
  if (!size) {
    const reply = String((g.__nuclo_measure as (id: number, max: number) => string)(node.id, key) ?? "");
    const [w, h] = reply.split(" ").map(Number);
    cache.set(key, (size = { w: w || 0, h: h || 0 }));
  }
  return size;
}

/** Lays out every sized root; returns frame ops for what moved. */
function relayout(): Op[] {
  if (typeof g.__nuclo_measure !== "function") return [];
  // With the router, each screen is a root (its content scrolls); otherwise the body is.
  let navigation = false;
  for (let c = body.firstChild; c; c = c.nextSibling) {
    if (c instanceof NElement && (c.kind === "tabs" || c.kind === "stack")) navigation = true;
  }
  const roots = navigation ? [...live.values()].filter((el) => el.kind === "screen") : [body];
  const out: Op[] = [];
  for (const root of roots) {
    const size = sizes.get(root.nid);
    if (!size) continue;
    const { frames, height } = layout(tree(root), size[0], navigation ? undefined : size[1], measure, size[2]);
    // The root's own box: a screen's is its scrollable content.
    frames.set(root.nid, [0, 0, size[0], height]);
    for (const [id, frame] of frames) {
      const box = frame.map((v) => Math.round(v * 10000) / 10000) as Frame;
      const old = sent.get(id);
      if (old && old.every((v, i) => v === box[i])) continue;
      sent.set(id, box);
      out.push(["frame", id, ...box]);
    }
  }
  return out;
}

/** Host → JS: a native event on a widget. `value` carries an input's text or a checkbox's state. */
g.__nuclo_event = (id: number, type: string, value?: string | boolean) => {
  if (type === "resize") {
    const [w, h, scale] = String(value).split(" ").map(Number);
    sizes.set(id, [w || 0, h || 0, scale || 0]);
    resized = true;
    flush();
    return;
  }
  const el = live.get(id);
  if (!el) return;
  if (value !== undefined) el.attrs[typeof value === "boolean" ? "checked" : "value"] = value;
  const event = { type, target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} };
  for (const listener of [...(el.listeners.get(type) ?? [])]) listener.call(el, event);
  flush();
};
