import { NucloNode } from './Node';

/**
 * Lightweight style object for SSR — prototype methods instead of Object.defineProperty per element.
 * Stores CSS properties as own properties and provides cssText/setProperty/getPropertyValue via prototype.
 */
class SSRStyle {
  [key: string]: unknown;

  get cssText(): string {
    const entries = Object.entries(this);
    if (entries.length === 0) return '';
    return entries.map(([k, v]) => `${k}: ${v}`).join('; ');
  }

  setProperty(name: string, value: string): void {
    (this as Record<string, unknown>)[name] = value;
  }

  getPropertyValue(name: string): string {
    return ((this as Record<string, unknown>)[name] as string) || '';
  }
}

// Lightweight classList for SSR — prototype methods instead of per-element closures
class SSRClassList {
  private _el: NucloElement;
  constructor(el: NucloElement) { this._el = el; }

  private tokens(): string[] { return this._el.className.split(' ').filter(Boolean); }

  add(...tokens: string[]): void {
    const classes = this.tokens();
    for (const t of tokens) if (t && !classes.includes(t)) classes.push(t);
    this._el.className = classes.join(' ');
  }
  remove(...tokens: string[]): void {
    this._el.className = this.tokens().filter(c => !tokens.includes(c)).join(' ');
  }
  contains(token: string): boolean { return this.tokens().includes(token); }
  toggle(token: string, force?: boolean): boolean {
    const on = force ?? !this.contains(token);
    if (on) this.add(token); else this.remove(token);
    return on;
  }
  replace(oldToken: string, newToken: string): boolean {
    if (!this.contains(oldToken)) return false;
    this.remove(oldToken); this.add(newToken); return true;
  }
  item(index: number): string | null { return this.tokens()[index] ?? null; }
  get length(): number { return this.tokens().length; }
  get value(): string { return this._el.className; }
  set value(v: string) { this._el.className = v; }
  toString(): string { return this._el.className; }
  supports(_token: string): boolean { return false; }
  forEach(cb: (value: string, key: number, parent: DOMTokenList) => void): void {
    this.tokens().forEach((token, i) => cb(token, i, this as unknown as DOMTokenList));
  }
  [Symbol.iterator](): IterableIterator<string> { return this.tokens().values(); }
  entries(): IterableIterator<[number, string]> { return this.tokens().entries(); }
  keys(): IterableIterator<number> { return this.tokens().keys(); }
  values(): IterableIterator<string> { return this.tokens().values(); }
}

export class NucloElement extends NucloNode {
  tagName: string;
  children: unknown[];
  className: string = '';
  textContent: string = '';
  parentNode: unknown = null;
  id: string = '';
  namespaceURI?: string;

  // style/classList are allocated lazily: the vast majority of SSR elements
  // never touch either (className is stored on the .className string, and the
  // serializer reads the backing field directly), so eagerly constructing an
  // SSRStyle + SSRClassList per element would be pure allocation churn.
  private _style?: CSSStyleDeclaration;
  private _classList?: DOMTokenList;

  // attributes is allocated lazily too — most elements carry their identity on
  // .className/.id (separate string fields) and never call setAttribute. Reads
  // short-circuit on the undefined backing map without allocating; the
  // serializer reads _attributes directly. The public getter still lazily
  // materializes a Map for any external `el.attributes` consumer.
  private _attributes?: Map<string, string>;

  get attributes(): Map<string, string> {
    return (this._attributes ??= new Map<string, string>());
  }
  set attributes(value: Map<string, string>) {
    this._attributes = value;
  }

  get style(): CSSStyleDeclaration {
    return (this._style ??= new SSRStyle() as unknown as CSSStyleDeclaration);
  }
  set style(value: CSSStyleDeclaration) {
    this._style = value;
  }

  get classList(): DOMTokenList {
    return (this._classList ??= new SSRClassList(this) as unknown as DOMTokenList);
  }
  set classList(value: DOMTokenList) {
    this._classList = value;
  }

  constructor(tagName: string) {
    super();
    this.tagName = tagName.toLowerCase();
    this.nodeType = 1; // ELEMENT_NODE
    this.nodeName = tagName.toUpperCase();
    this.children = [];
  }

  /** Every node, elements, text and comments alike (children holds them all). */
  get childNodes(): NodeListOf<ChildNode> {
    return this.children as unknown as NodeListOf<ChildNode>;
  }

  appendChild<T extends Node>(child: T): T {
    // Spec behaviour: appending a DocumentFragment moves its children into this
    // node and leaves the fragment empty. The list runtime relies on this to
    // batch row insertions.
    if ((child as any)?.nodeType === 11) {
      // Detach the fragment's backing array before iterating (instead of
      // slicing it) — the fragment is emptied either way, and reassigning
      // first means the loop never has to allocate a copy just to guard
      // against the array it's about to discard.
      const kids = (child as any).childNodes as Node[];
      (child as any).childNodes = [];
      if ((child as any).children) (child as any).children = [];
      for (let i = 0; i < kids.length; i++) this.appendChild(kids[i]);
      return child;
    }
    this.children.push(child);
    if (typeof child === 'object' && child !== null && 'parentNode' in child) {
      (child as { parentNode: unknown }).parentNode = this;
    }
    return child;
  }
  
  setAttribute(name: string, value: string): void {
    (this._attributes ??= new Map<string, string>()).set(name, value);
    if (name === 'class') {
      this.className = value;
    } else if (name === 'id') {
      this.id = value;
    }
  }

  getAttribute(name: string): string | null {
    return this._attributes?.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this._attributes?.delete(name);
    if (name === 'class') {
      this.className = '';
    }
  }

  hasAttribute(name: string): boolean {
    return this._attributes?.has(name) ?? false;
  }
  
  insertBefore<T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode === null) {
      return this.appendChild(newNode);
    }
    // Spec behaviour: inserting a DocumentFragment moves its children (in order)
    // before the reference node and empties the fragment.
    if ((newNode as any)?.nodeType === 11) {
      const kids = (newNode as any).childNodes as Node[];
      (newNode as any).childNodes = [];
      if ((newNode as any).children) (newNode as any).children = [];
      for (let i = 0; i < kids.length; i++) this.insertBefore(kids[i], referenceNode);
      return newNode;
    }
    const index = this.children.indexOf(referenceNode);
    if (index !== -1) {
      this.children.splice(index, 0, newNode);
      if (typeof newNode === 'object' && newNode !== null && 'parentNode' in newNode) {
        (newNode as { parentNode: unknown }).parentNode = this;
      }
    }
    return newNode;
  }
  
  removeChild<T extends Node>(child: T): T {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      if (typeof child === 'object' && child !== null && 'parentNode' in child) {
        (child as { parentNode: unknown }).parentNode = null;
      }
    }
    return child;
  }

  replaceChild<T extends Node>(newChild: Node, oldChild: T): T {
    const index = this.children.indexOf(oldChild);
    if (index !== -1) {
      this.children[index] = newChild;
      if (typeof newChild === 'object' && newChild !== null && 'parentNode' in newChild) {
        (newChild as { parentNode: unknown }).parentNode = this;
      }
      if (typeof oldChild === 'object' && oldChild !== null && 'parentNode' in oldChild) {
        (oldChild as { parentNode: unknown }).parentNode = null;
      }
    }
    return oldChild;
  }
  
  // SSR never dispatches events: listeners are accepted and dropped, and
  // queries find nothing (serialize with renderToString instead).
  addEventListener(_type: string, _listener: EventListener): void {}
  removeEventListener(_type: string, _listener: EventListener): void {}
  dispatchEvent(_event: Event): boolean {
    return true;
  }
  querySelector(_selector: string): Element | null {
    return null;
  }
  querySelectorAll(_selector: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }
}
