import { NucloNode } from './Node';
import { isBrowser } from '../utility/environment';

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

  add(...tokens: string[]): void {
    const classes = this._el.className ? this._el.className.split(' ').filter(Boolean) : [];
    for (const t of tokens) if (t && !classes.includes(t)) classes.push(t);
    this._el.className = classes.join(' ');
  }
  remove(...tokens: string[]): void {
    if (!this._el.className) return;
    this._el.className = this._el.className.split(' ').filter(c => c && !tokens.includes(c)).join(' ');
  }
  contains(token: string): boolean {
    return !!this._el.className && this._el.className.split(' ').includes(token);
  }
  toggle(token: string, force?: boolean): boolean {
    const has = this.contains(token);
    if (force === undefined) { if (has) { this.remove(token); return false; } this.add(token); return true; }
    if (force) { this.add(token); return true; }
    this.remove(token); return false;
  }
  replace(oldToken: string, newToken: string): boolean {
    if (!this.contains(oldToken)) return false;
    this.remove(oldToken); this.add(newToken); return true;
  }
  item(index: number): string | null { return (this._el.className.split(' ').filter(Boolean)[index]) ?? null; }
  get length(): number { return this._el.className ? this._el.className.split(' ').filter(Boolean).length : 0; }
  get value(): string { return this._el.className; }
  set value(v: string) { this._el.className = v; }
  toString(): string { return this._el.className; }
  supports(_token: string): boolean { return false; }
  forEach(cb: (value: string, key: number, parent: DOMTokenList) => void): void {
    const classes = this._el.className.split(' ').filter(Boolean);
    for (let i = 0; i < classes.length; i++) cb(classes[i], i, this as unknown as DOMTokenList);
  }
  [Symbol.iterator](): Iterator<string> {
    const classes = this._el.className.split(' ').filter(Boolean);
    let i = 0;
    return { next(): IteratorResult<string> { return i < classes.length ? { value: classes[i++], done: false } : { value: '', done: true }; } };
  }
  entries(): Iterator<[number, string]> {
    const classes = this._el.className.split(' ').filter(Boolean);
    let i = 0;
    return { next(): IteratorResult<[number, string]> { return i < classes.length ? { value: [i, classes[i++]], done: false } : { value: [0, ''], done: true }; } };
  }
  keys(): Iterator<number> {
    const len = this.length; let i = 0;
    return { next(): IteratorResult<number> { return i < len ? { value: i++, done: false } : { value: 0, done: true }; } };
  }
  values(): Iterator<string> { return this[Symbol.iterator](); }
}

interface TextNode {
  nodeType: 3;
  textContent: string;
}

interface CommentNode {
  nodeType: 8;
  data: string;
}

function isElementNode(node: unknown): node is NucloElement {
  return typeof node === 'object' && node !== null && 'tagName' in node;
}

function isTextNode(node: unknown): node is TextNode {
  return typeof node === 'object' && node !== null && 'nodeType' in node && (node as { nodeType: number }).nodeType === 3;
}

function isCommentNode(node: unknown): node is CommentNode {
  return typeof node === 'object' && node !== null && 'nodeType' in node && (node as { nodeType: number }).nodeType === 8;
}

export class NucloElement extends NucloNode {
  tagName: string;
  children: unknown[];
  attributes: Map<string, string>;
  className: string = '';
  classList: DOMTokenList;
  textContent: string = '';
  private _innerHTML: string = '';
  parentNode: unknown = null;
  rawMods?: unknown[];
  mods?: unknown[];
  style: CSSStyleDeclaration;
  id: string = '';
  namespaceURI?: string;
  sheet?: CSSStyleSheet | null;
  private _listeners: Map<string, Set<EventListener>> | null;

  get innerHTML(): string {
    return this.serializeChildren();
  }

  set innerHTML(value: string) {
    this._innerHTML = value;
  }
  
  private serializeChildren(): string {
    let html = '';
    for (const child of this.children) {
      if (isElementNode(child)) {
        html += this.serializeElement(child);
      } else if (isTextNode(child)) {
        html += child.textContent || '';
      } else if (isCommentNode(child)) {
        html += `<!--${child.data || ''}-->`;
      }
    }
    return html;
  }
  
  private serializeElement(element: NucloElement): string {
    const tag = element.tagName.toLowerCase();
    let html = `<${tag}`;
    
    // Add attributes
    if (element.id) {
      html += ` id="${element.id}"`;
    }
    if (element.className) {
      html += ` class="${element.className}"`;
    }
    if (element.attributes) {
      for (const [name, value] of element.attributes) {
        if (name !== 'id' && name !== 'class') {
          html += ` ${name}="${value}"`;
        }
      }
    }
    
    html += '>';
    
    // Add children
    if (element.children && element.children.length > 0) {
      for (const child of element.children) {
        if (isElementNode(child)) {
          html += this.serializeElement(child);
        } else if (isTextNode(child)) {
          html += child.textContent || '';
        } else if (isCommentNode(child)) {
          html += `<!--${child.data || ''}-->`;
        }
      }
    }
    
    html += `</${tag}>`;
    return html;
  }
  
  constructor(tagName: string) {
    super();
    this.tagName = tagName.toLowerCase();
    this.nodeType = 1; // ELEMENT_NODE
    this.nodeName = tagName.toUpperCase();
    this.children = [];
    this.attributes = new Map<string, string>();

    if (!isBrowser) {
      // ── SSR path: minimal allocations, no Proxy, no event listeners ──
      this._listeners = null;

      // Prototype-based style — zero Object.defineProperty calls per element
      this.style = new SSRStyle() as unknown as CSSStyleDeclaration;

      // Prototype-based classList — zero closures per element
      this.classList = new SSRClassList(this) as unknown as DOMTokenList;
      // sheet stays undefined — not needed in SSR
    } else {
      // ── Browser path: full-featured Proxy style + DOMTokenList ──
      this._listeners = new Map();

      const styleProps: Record<string, string> = {};
      this.style = new Proxy({} as CSSStyleDeclaration, {
        get: (_target, prop: string) => {
          if (prop === 'setProperty') return (name: string, value: string) => { styleProps[name] = value; };
          if (prop === 'getPropertyValue') return (name: string) => styleProps[name] || '';
          if (prop === 'cssText') return Object.entries(styleProps).map(([k, v]) => `${k}: ${v}`).join('; ');
          return styleProps[prop];
        },
        set: (_target, prop: string, value: string) => { styleProps[prop] = value; return true; },
      });

      // CSSStyleSheet mock for style elements (browser only)
      if (this.tagName === 'style') {
        const cssRules: CSSRule[] = [];
        this.sheet = {
          cssRules: cssRules as unknown as CSSRuleList,
          insertRule: (rule: string, index?: number) => {
            const idx = index ?? cssRules.length;
            let mockRule: CSSRule;
            if (rule.trim().startsWith('@')) {
              const innerRules: CSSRule[] = [];
              const conditionText = rule.replace(/^@\w+\s+/, '').replace(/\s*\{[\s\S]*\}$/, '').trim();
              mockRule = {
                cssText: rule, conditionText,
                media: { mediaText: conditionText } as MediaList,
                cssRules: innerRules as unknown as CSSRuleList,
                insertRule: (innerRule: string, innerIndex?: number) => {
                  const innerIdx = innerIndex ?? innerRules.length;
                  innerRules.splice(innerIdx, 0, { cssText: innerRule, selectorText: innerRule.split('{')[0].trim(), style: {} as CSSStyleDeclaration, type: 1 } as unknown as CSSRule);
                  return innerIdx;
                },
                deleteRule: (i: number) => { innerRules.splice(i, 1); },
                type: 4,
              } as unknown as CSSRule;
            } else {
              mockRule = { cssText: rule, selectorText: rule.split('{')[0].trim(), style: {} as CSSStyleDeclaration, type: 1 } as unknown as CSSRule;
            }
            cssRules.splice(idx, 0, mockRule);
            return idx;
          },
          deleteRule: (index: number) => { cssRules.splice(index, 1); },
        } as unknown as CSSStyleSheet;
      }

      this.classList = createClassList(this);
    }
  }
  
  appendChild<T extends Node>(child: T): T {
    this.children.push(child);
    if (isBrowser && (this as any)['_childNodes']) {
      (this as any)['_childNodes'].push(child);
    }
    if (typeof child === 'object' && child !== null && 'parentNode' in child) {
      (child as { parentNode: unknown }).parentNode = this;
    }
    return child;
  }
  
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'class') {
      this.className = value;
    } else if (name === 'id') {
      this.id = value;
    }
  }
  
  getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }
  
  removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name === 'class') {
      this.className = '';
    }
  }
  
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  
  insertBefore<T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode === null) {
      return this.appendChild(newNode);
    }
    const index = this.children.indexOf(referenceNode);
    if (index !== -1) {
      this.children.splice(index, 0, newNode);
      if (isBrowser && (this as any)['_childNodes']) {
        const childNodesIndex = (this as any)['_childNodes'].indexOf(referenceNode);
        if (childNodesIndex !== -1) {
          (this as any)['_childNodes'].splice(childNodesIndex, 0, newNode);
        }
      }
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
      if (isBrowser && (this as any)['_childNodes']) {
        const cnIndex = (this as any)['_childNodes'].indexOf(child);
        if (cnIndex !== -1) {
          (this as any)['_childNodes'].splice(cnIndex, 1);
        }
      }
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
      if (isBrowser && (this as any)['_childNodes']) {
        const cnIndex = (this as any)['_childNodes'].indexOf(oldChild);
        if (cnIndex !== -1) {
          (this as any)['_childNodes'][cnIndex] = newChild;
        }
      }
      if (typeof newChild === 'object' && newChild !== null && 'parentNode' in newChild) {
        (newChild as { parentNode: unknown }).parentNode = this;
      }
      if (typeof oldChild === 'object' && oldChild !== null && 'parentNode' in oldChild) {
        (oldChild as { parentNode: unknown }).parentNode = null;
      }
    }
    return oldChild;
  }
  
  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners) return;
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this._listeners?.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this._listeners?.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    }
    if (event.bubbles && this.parentNode && typeof this.parentNode === 'object' && 'dispatchEvent' in this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(event);
    }
    return true;
  }
  
  querySelector(selector: string): Element | null {
    // Simple implementation - supports basic selectors
    // #id, .class, tagName
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.querySelectorById(id);
    } else if (selector.startsWith('.')) {
      const className = selector.slice(1);
      return this.querySelectorByClass(className);
    } else {
      // Tag name selector
      return this.querySelectorByTag(selector);
    }
  }
  
  private querySelectorById(id: string): Element | null {
    // Check self
    if (this.id === id) {
      return this as unknown as Element;
    }
    // Check children recursively
    for (const child of this.children) {
      if (isElementNode(child)) {
        if (child.id === id) {
          return child as unknown as Element;
        }
        const found = child.querySelector(`#${id}`);
        if (found) return found;
      }
    }
    return null;
  }
  
  private querySelectorByClass(className: string): Element | null {
    // Check self
    if (this.classList.contains(className)) {
      return this as unknown as Element;
    }
    // Check children recursively
    for (const child of this.children) {
      if (isElementNode(child)) {
        if (child.classList?.contains(className)) {
          return child as unknown as Element;
        }
        const found = child.querySelector(`.${className}`);
        if (found) return found;
      }
    }
    return null;
  }
  
  private querySelectorByTag(tagName: string): Element | null {
    const lowerTag = tagName.toLowerCase();
    // Check self
    if (this.tagName.toLowerCase() === lowerTag) {
      return this as unknown as Element;
    }
    // Check children recursively
    for (const child of this.children) {
      if (isElementNode(child)) {
        if (child.tagName.toLowerCase() === lowerTag) {
          return child as unknown as Element;
        }
        const found = child.querySelector(tagName);
        if (found) return found;
      }
    }
    return null;
  }
  
  querySelectorAll(selector: string): NodeListOf<Element> {
    const results: Element[] = [];
    
    if (selector.startsWith('#')) {
      const found = this.querySelector(selector);
      if (found) results.push(found);
    } else if (selector.startsWith('.')) {
      const className = selector.slice(1);
      this.querySelectorAllByClass(className, results);
    } else {
      const tagName = selector.toLowerCase();
      this.querySelectorAllByTag(tagName, results);
    }
    
    return results as unknown as NodeListOf<Element>;
  }
  
  private querySelectorAllByClass(className: string, results: Element[]): void {
    if (this.classList.contains(className)) {
      results.push(this as unknown as Element);
    }
    for (const child of this.children) {
      if (isElementNode(child)) {
        if (child.classList?.contains(className)) {
          results.push(child as unknown as Element);
        }
        child.querySelectorAllByClass(className, results);
      }
    }
  }
  
  private querySelectorAllByTag(tagName: string, results: Element[]): void {
    if (this.tagName.toLowerCase() === tagName) {
      results.push(this as unknown as Element);
    }
    for (const child of this.children) {
      if (isElementNode(child)) {
        if (child.tagName.toLowerCase() === tagName) {
          results.push(child as unknown as Element);
        }
        child.querySelectorAllByTag(tagName, results);
      }
    }
  }
}

function createClassList(owner: NucloElement): DOMTokenList {
  const getClasses = () => owner.className.split(' ').filter((c) => c);
  const setClasses = (classes: string[]) => {
    owner.className = classes.join(' ');
  };

  const classList = {
    add: (...tokens: string[]) => {
      const classes = getClasses();
      for (const token of tokens) {
        if (token && !classes.includes(token)) {
          classes.push(token);
        }
      }
      setClasses(classes);
    },
    remove: (...tokens: string[]) => {
      if (tokens.length === 0) return;
      setClasses(getClasses().filter((c) => !tokens.includes(c)));
    },
    toggle: (token: string, force?: boolean) => {
      const hasClass = classList.contains(token);
      if (force === undefined) {
        if (hasClass) {
          classList.remove(token);
          return false;
        }
        classList.add(token);
        return true;
      }
      if (force) {
        classList.add(token);
        return true;
      }
      classList.remove(token);
      return false;
    },
    contains: (token: string) => getClasses().includes(token),
    replace: (oldToken: string, newToken: string) => {
      const classes = getClasses();
      const index = classes.indexOf(oldToken);
      if (index === -1) return false;
      classes[index] = newToken;
      setClasses(classes);
      return true;
    },
    item: (index: number) => getClasses()[index] || null,
    get length() {
      return getClasses().length;
    },
    toString: () => owner.className,
    [Symbol.iterator]: function* () {
      yield* getClasses();
    },
    forEach: (callback: (value: string, key: number, parent: DOMTokenList) => void) => {
      const classes = getClasses();
      for (let i = 0; i < classes.length; i++) {
        callback(classes[i], i, classList as unknown as DOMTokenList);
      }
    },
    entries: function* () {
      const classes = getClasses();
      for (let i = 0; i < classes.length; i++) {
        yield [i, classes[i]] as [number, string];
      }
    },
    keys: function* () {
      const classes = getClasses();
      for (let i = 0; i < classes.length; i++) {
        yield i;
      }
    },
    values: function* () {
      yield* getClasses();
    },
    get value() {
      return owner.className;
    },
    set value(value: string) {
      owner.className = value;
    },
    supports: (_token: string) => false
  };

  return classList as unknown as DOMTokenList;
}
