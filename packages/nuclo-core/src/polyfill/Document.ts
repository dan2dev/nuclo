import { NucloElement } from './Element';
import { NucloText } from './Text';

/**
 * Lightweight DocumentFragment for SSR — prototype methods instead of per-instance closures.
 */
class SSRDocumentFragment {
  nodeType: number = 11;
  nodeName: string = '#document-fragment';
  childNodes: Node[] = [];
  children: Element[] = [];
  textContent: string = '';

  get firstChild(): Node | null {
    return this.childNodes.length > 0 ? this.childNodes[0] : null;
  }

  get lastChild(): Node | null {
    return this.childNodes.length > 0 ? this.childNodes[this.childNodes.length - 1] : null;
  }

  appendChild<T extends Node>(child: T): T {
    this.childNodes.push(child);
    if ((child as any).nodeType === 1) {
      this.children.push(child as unknown as Element);
    }
    (child as any).parentNode = this;
    return child;
  }

  insertBefore<T extends Node>(newNode: T, refNode: Node | null): T {
    if (!refNode) return this.appendChild(newNode);
    const index = this.childNodes.indexOf(refNode);
    if (index !== -1) {
      this.childNodes.splice(index, 0, newNode);
      if ((newNode as any).nodeType === 1) {
        const elementIndex = this.children.indexOf(refNode as Element);
        if (elementIndex !== -1) {
          this.children.splice(elementIndex, 0, newNode as unknown as Element);
        }
      }
    }
    (newNode as any).parentNode = this;
    return newNode;
  }

  removeChild<T extends Node>(child: T): T {
    const index = this.childNodes.indexOf(child);
    if (index !== -1) this.childNodes.splice(index, 1);
    if ((child as any).nodeType === 1) {
      const elementIndex = this.children.indexOf(child as unknown as Element);
      if (elementIndex !== -1) this.children.splice(elementIndex, 1);
    }
    (child as any).parentNode = null;
    return child;
  }

  replaceChild<T extends Node>(newChild: T, oldChild: Node): T {
    const index = this.childNodes.indexOf(oldChild);
    if (index !== -1) {
      this.childNodes[index] = newChild;
      if ((oldChild as any).nodeType === 1 && (newChild as any).nodeType === 1) {
        const elementIndex = this.children.indexOf(oldChild as Element);
        if (elementIndex !== -1) {
          this.children[elementIndex] = newChild as unknown as Element;
        }
      }
    }
    (newChild as any).parentNode = this;
    (oldChild as any).parentNode = null;
    return newChild;
  }

  querySelector(): null { return null; }
  querySelectorAll(): NodeListOf<Element> { return [] as unknown as NodeListOf<Element>; }
}

export class NucloDocument {
  head: ExpandedElement;
  body: ExpandedElement;

  constructor() {
    this.head = new NucloElement('head') as unknown as ExpandedElement;
    this.body = new NucloElement('body') as unknown as ExpandedElement;
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
  
  createDocumentFragment(): DocumentFragment {
    return new SSRDocumentFragment() as unknown as DocumentFragment;
  }
  
  // SSR never dispatches events: listeners are accepted and dropped, and
  // queries find nothing.
  querySelector(_selector: string): Element | null {
    return null;
  }

  querySelectorAll(_selector: string): NodeListOf<Element> {
    return [] as unknown as NodeListOf<Element>;
  }

  addEventListener(_type: string, _listener: EventListener, _options?: boolean | AddEventListenerOptions): void {}

  removeEventListener(_type: string, _listener: EventListener, _options?: boolean | AddEventListenerOptions): void {}

  dispatchEvent(_event: Event): boolean {
    return true;
  }

  contains(_node: Node): boolean {
    return false;
  }
}

export const document = globalThis.document || new NucloDocument();