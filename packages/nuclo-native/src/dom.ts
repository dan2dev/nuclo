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
 *   ["insert", parentId, id, beforeId]   beforeId 0 = append; also moves
 *   ["remove", id]                   detach and destroy the subtree
 *   ["set",    id, key, value]       text, value, checked, placeholder, disabled, src…
 *   ["style",  id, key, value]       camelCase CSS subset
 *   ["listen", id, type]             click | input | change
 */

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
    const container = this.live && this instanceof NElement && this.kind === "view";
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
  for (let c = node.firstChild; c; c = c.nextSibling) unrealize(c);
}

/** Creates a detached subtree on the host, parents before children. */
function realize(node: NNode) {
  if (node.live) return;
  node.live = true;
  if (!(node instanceof NElement)) {
    ops.push(["create", node.nid, "text"], ["set", node.nid, "text", node.textContent]);
    return;
  }
  live.set(node.nid, node);
  ops.push(["create", node.nid, node.kind]);
  const style = { ...TAG_STYLE[node.localName], ...node.styles };
  for (const key in style) ops.push(["style", node.nid, key, style[key]]);
  for (const key in node.attrs) ops.push(["set", node.nid, key, node.attrs[key]]);
  for (const type of node.listeners.keys()) ops.push(["listen", node.nid, type]);
  if (node.kind !== "view") {
    ops.push(["set", node.nid, "text", node.textContent]);
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
    if (node instanceof NElement && node.kind !== "view") {
      if (node.live) ops.push(["set", node.nid, "text", node.textContent]);
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
    if (this.live) ops.push(["set", this.nid, "text", this.#data]);
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

  get kind() {
    return this.attrs.type === "checkbox" ? "checkbox" : kindOf(this.localName);
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
  if (!ops.length) return;
  const batch = ops;
  ops = [];
  (g.__nuclo_host as (json: string) => void)(JSON.stringify(batch));
}

/** Host → JS: a native event on a widget. `value` carries an input's text or a checkbox's state. */
g.__nuclo_event = (id: number, type: string, value?: string | boolean) => {
  const el = live.get(id);
  if (!el) return;
  if (value !== undefined) el.attrs[typeof value === "boolean" ? "checked" : "value"] = value;
  const event = { type, target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} };
  for (const listener of [...(el.listeners.get(type) ?? [])]) listener.call(el, event);
  flush();
};
