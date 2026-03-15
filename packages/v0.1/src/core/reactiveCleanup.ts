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
 * Stores weak references to reactive text nodes for iteration during updates.
 */
export const reactiveTextNodes = new Map<WeakRef<Text>, ReactiveTextNodeInfo>();

/**
 * WeakMap for O(1) lookups of reactive text node info by node reference.
 */
export const reactiveTextNodesByNode = new WeakMap<Text, { ref: WeakRef<Text>; info: ReactiveTextNodeInfo }>();

/**
 * Stores weak references to reactive elements for iteration during updates.
 */
export const reactiveElements = new Map<WeakRef<Element>, ReactiveElementInfo>();

/**
 * WeakMap for O(1) lookups of reactive element info by element reference.
 */
export const reactiveElementsByNode = new WeakMap<Element, { ref: WeakRef<Element>; info: ReactiveElementInfo }>();

/**
 * Registers a reactive text node in both lookup structures.
 */
export function registerReactiveTextNode(node: Text, info: ReactiveTextNodeInfo): void {
  const ref = new WeakRef(node);
  reactiveTextNodes.set(ref, info);
  reactiveTextNodesByNode.set(node, { ref, info });
}

/**
 * Registers a reactive element in both lookup structures.
 */
export function registerReactiveElement(element: Element, info: ReactiveElementInfo): void {
  const ref = new WeakRef(element);
  reactiveElements.set(ref, info);
  reactiveElementsByNode.set(element, { ref, info });
}

/**
 * Removes a reactive text node's WeakRef entry from the iteration map.
 */
export function removeReactiveTextNodeRef(ref: WeakRef<Text>): void {
  reactiveTextNodes.delete(ref);
}

/**
 * Removes a reactive element's WeakRef entry from the iteration map.
 */
export function removeReactiveElementRef(ref: WeakRef<Element>): void {
  reactiveElements.delete(ref);
}

/**
 * Manually removes reactive text node info for a specific text node.
 * This should be called when a text node is removed from the DOM to prevent memory leaks.
 */
export function cleanupReactiveTextNode(node: Text): void {
  const entry = reactiveTextNodesByNode.get(node);
  if (entry) {
    reactiveTextNodes.delete(entry.ref);
    reactiveTextNodesByNode.delete(node);
  }
}

/**
 * Manually removes reactive element info for a specific element.
 * This should be called when an element is removed from the DOM to prevent memory leaks.
 */
export function cleanupReactiveElement(element: Element): void {
  const entry = reactiveElementsByNode.get(element);
  if (entry) {
    reactiveElements.delete(entry.ref);
    reactiveElementsByNode.delete(element);
  }
}
