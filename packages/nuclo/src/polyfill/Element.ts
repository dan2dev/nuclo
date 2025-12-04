export class NucloElement implements Partial<ExpandedElement> {
  tagName: any;
  children?: any;
  attributes?: any;
  className: string = '';
  classList: DOMTokenList;
  textContent: string = '';
  innerHTML: string = '';
  parentNode: any = null;
  rawMods?: any;
  mods?: any;
  style: CSSStyleDeclaration;
  id: string = '';
  namespaceURI?: string;
  sheet?: CSSStyleSheet | null;
  private _listeners: Map<string, Set<EventListener>>;
  
  constructor(tagName: string) {
    this.tagName = tagName.toLowerCase();
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
    (child as any).parentNode = this;
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
      (newNode as any).parentNode = this;
    }
    return newNode;
  }
  
  removeChild<T extends Node>(child: T): T {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      (child as any).parentNode = null;
    }
    return child;
  }
  
  replaceChild<T extends Node>(newChild: Node, oldChild: T): T {
    const index = this.children.indexOf(oldChild);
    if (index !== -1) {
      this.children[index] = newChild;
      (newChild as any).parentNode = this;
      (oldChild as any).parentNode = null;
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
    if ((event as any).bubbles && this.parentNode && typeof this.parentNode.dispatchEvent === 'function') {
      this.parentNode.dispatchEvent(event);
    }
    return true;
  }
  
  querySelector(_selector: string): Element | null {
    return null;
  }
  
  querySelectorAll(_selector: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }
}
