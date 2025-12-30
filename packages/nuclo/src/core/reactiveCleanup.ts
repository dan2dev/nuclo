/**
 * Cleanup utilities for reactive nodes.
 * This module is separate to avoid circular dependencies between reactive modules and DOM utilities.
 */

type TextResolver = () => Primitive;

interface ReactiveTextNodeInfo {
  resolver: TextResolver;
  lastValue: string;
}

type AttributeResolver = () => unknown;

interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
  lastValue: unknown;
}

interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
}

/**
 * Stores weak references to reactive text nodes to prevent memory leaks.
 */
export const reactiveTextNodes = new Map<WeakRef<Text>, ReactiveTextNodeInfo>();

/**
 * Stores weak references to reactive elements to prevent memory leaks.
 */
export const reactiveElements = new Map<WeakRef<Element>, ReactiveElementInfo>();

/**
 * Manually removes reactive text node info for a specific text node.
 * This should be called when a text node is removed from the DOM to prevent memory leaks.
 */
export function cleanupReactiveTextNode(node: Text): void {
  // Find and remove the WeakRef that points to this text node
  for (const [ref] of reactiveTextNodes) {
    const textNode = ref.deref();
    if (textNode === node) {
      reactiveTextNodes.delete(ref);
      break;
    }
  }
}

/**
 * Manually removes reactive element info for a specific element.
 * This should be called when an element is removed from the DOM to prevent memory leaks.
 */
export function cleanupReactiveElement(element: Element): void {
  // Find and remove the WeakRef that points to this element
  for (const [ref] of reactiveElements) {
    const el = ref.deref();
    if (el === element) {
      reactiveElements.delete(ref);
      break;
    }
  }
}
