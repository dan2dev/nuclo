import { NucloElement } from './Element';
import { NucloText } from './Text';

export class NucloDocument {
  head: ExpandedElement;
  body: ExpandedElement;
  private _listeners: Map<string, Set<EventListener>>;
  
  constructor() {
    this.head = new NucloElement('head') as unknown as ExpandedElement;
    this.body = new NucloElement('body') as unknown as ExpandedElement;
    this._listeners = new Map();
  }
  
  createElement(tagName: string, _options?: unknown): ExpandedElement {
    return new NucloElement(tagName) as unknown as ExpandedElement;
  }
  
  createElementNS(namespace: string, tagName: string, _options?: unknown): ExpandedElement {
    const element = new NucloElement(tagName) as unknown as ExpandedElement;
    (element as any).namespaceURI = namespace;
    return element;
  }
  
  createTextNode(data: string): Text {
    return new NucloText(data) as unknown as Text;
  }
  
  createComment(data: string): Comment {
    const comment = {
      nodeType: 8,
      nodeName: '#comment',
      data,
      textContent: data,
      nodeValue: data,
      parentNode: null,
      nextSibling: null,
      previousSibling: null
    };
    return comment as unknown as Comment;
  }
  
  querySelector(selector: string): Element | null {
    // Simple implementation - only supports ID selector for #nuclo-styles
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (id === 'nuclo-styles' && this.head.children) {
        for (const child of this.head.children) {
          if ((child as any).id === id) {
            return child as unknown as Element;
          }
        }
      }
    }
    return null;
  }
  
  querySelectorAll(_selector: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
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
    return true;
  }
  
  contains(_node: Node): boolean {
    return false;
  }
}

export const document = globalThis.document || new NucloDocument();