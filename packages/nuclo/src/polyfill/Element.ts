import { NucloNode } from './Node';

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
  private _listeners: Map<string, Set<EventListener>>;
  
  get innerHTML(): string {
    // Serialize children to HTML
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
    this._listeners = new Map();
    const self = this;
    
    // Simple style implementation
    const styleProps: Record<string, string> = {};
    this.style = new Proxy({} as CSSStyleDeclaration, {
      get: (_target, prop: string) => {
        if (prop === 'setProperty') {
          return (name: string, value: string) => {
            styleProps[name] = value;
          };
        }
        if (prop === 'getPropertyValue') {
          return (name: string) => styleProps[name] || '';
        }
        if (prop === 'cssText') {
          return Object.entries(styleProps)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        }
        return styleProps[prop];
      },
      set: (_target, prop: string, value: string) => {
        styleProps[prop] = value;
        return true;
      }
    });
    
    // Initialize sheet for style elements
    if (tagName.toLowerCase() === 'style') {
      const cssRules: CSSRule[] = [];
      this.sheet = {
        cssRules: cssRules as unknown as CSSRuleList,
        insertRule: (rule: string, index?: number) => {
          const idx = index ?? cssRules.length;
          // Parse basic CSS rules (simplified)
          const mockRule = {
            cssText: rule,
            selectorText: rule.split('{')[0].trim(),
            style: {} as CSSStyleDeclaration,
            type: 1 // CSSRule.STYLE_RULE
          } as unknown as CSSRule;
          cssRules.splice(idx, 0, mockRule);
          return idx;
        },
        deleteRule: (index: number) => {
          cssRules.splice(index, 1);
        }
      } as unknown as CSSStyleSheet;
    }
    
    // Simple classList implementation
    this.classList = {
      add: (...tokens: string[]) => {
        tokens.forEach(token => {
          if (token && !self.className.split(' ').includes(token)) {
            self.className = self.className ? `${self.className} ${token}` : token;
          }
        });
      },
      remove: (...tokens: string[]) => {
        const classes = self.className.split(' ').filter((c: string) => c);
        self.className = classes.filter((c: string) => !tokens.includes(c)).join(' ');
      },
      toggle: (token: string, force?: boolean) => {
        const hasClass = self.className.split(' ').includes(token);
        if (force === undefined) {
          if (hasClass) {
            self.classList.remove(token);
            return false;
          } else {
            self.classList.add(token);
            return true;
          }
        } else if (force) {
          self.classList.add(token);
          return true;
        } else {
          self.classList.remove(token);
          return false;
        }
      },
      contains: (token: string) => {
        return self.className.split(' ').includes(token);
      },
      replace: (oldToken: string, newToken: string) => {
        const classes = self.className.split(' ').filter((c: string) => c);
        const index = classes.indexOf(oldToken);
        if (index !== -1) {
          classes[index] = newToken;
          self.className = classes.join(' ');
          return true;
        }
        return false;
      },
      item: (index: number) => {
        const classes = self.className.split(' ').filter((c: string) => c);
        return classes[index] || null;
      },
      get length() {
        return self.className.split(' ').filter((c: string) => c).length;
      },
      toString: () => self.className,
      [Symbol.iterator]: function* () {
        const classes = self.className.split(' ').filter((c: string) => c);
        for (const cls of classes) {
          yield cls;
        }
      },
      forEach: (callback: (value: string, key: number, parent: DOMTokenList) => void) => {
        const classes = self.className.split(' ').filter((c: string) => c);
        classes.forEach((cls, i) => callback(cls, i, self.classList));
      },
      entries: function* () {
        const classes = self.className.split(' ').filter((c: string) => c);
        for (let i = 0; i < classes.length; i++) {
          yield [i, classes[i]] as [number, string];
        }
      },
      keys: function* () {
        const classes = self.className.split(' ').filter((c: string) => c);
        for (let i = 0; i < classes.length; i++) {
          yield i;
        }
      },
      values: function* () {
        const classes = self.className.split(' ').filter((c: string) => c);
        for (const cls of classes) {
          yield cls;
        }
      },
      value: self.className,
      supports: () => false
    } as unknown as DOMTokenList;
  }
  
  appendChild<T extends Node>(child: T): T {
    this.children.push(child);
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
  
  addEventListener(type: string, listener: EventListener): void {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type)!.add(listener);
  }
  
  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this._listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }
  
  dispatchEvent(event: Event): boolean {
    const listeners = this._listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
    // Bubble to parent if event.bubbles is true
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
