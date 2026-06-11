/**
 * Shared types and registries for reactive nodes.
 * Single source of truth — imported by reactiveText.ts and reactiveAttributes.ts.
 *
 * Registry structure: the iteration sets only hold WeakRefs; the actual info
 * records live in WeakMaps keyed by the node. Info records may strongly
 * reference the node (e.g. attribute applyValue closures capture the
 * element), so storing them in a strongly-held map would pin the node in
 * memory forever. With WeakMap storage the whole record is collectible as
 * soon as the node is unreachable, and the FinalizationRegistry prunes the
 * leftover WeakRef from the iteration set. The notify passes also prune
 * dead/disconnected entries as they iterate.
 */

export type TextResolver = () => Primitive;

export interface ReactiveTextNodeInfo {
  resolver: TextResolver;
  lastValue: string;
}

export type AttributeResolver = () => unknown;

export interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
  lastValue: unknown;
}

export interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
}

/**
 * Iteration set of weak references to reactive text nodes.
 */
export const reactiveTextNodes = new Set<WeakRef<Text>>();

/**
 * WeakMap for O(1) lookups of reactive text node info by node reference.
 */
export const reactiveTextNodesByNode = new WeakMap<Text, { ref: WeakRef<Text>; info: ReactiveTextNodeInfo }>();

/**
 * Iteration set of weak references to reactive elements.
 */
export const reactiveElements = new Set<WeakRef<Element>>();

/**
 * WeakMap for O(1) lookups of reactive element info by element reference.
 */
export const reactiveElementsByNode = new WeakMap<Element, { ref: WeakRef<Element>; info: ReactiveElementInfo }>();

const textNodeFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<WeakRef<Text>>((ref) => { reactiveTextNodes.delete(ref); })
  : null;

const elementFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<WeakRef<Element>>((ref) => { reactiveElements.delete(ref); })
  : null;

/**
 * Registers a reactive text node in both lookup structures.
 */
export function registerReactiveTextNode(node: Text, info: ReactiveTextNodeInfo): void {
  const existing = reactiveTextNodesByNode.get(node);
  if (existing) {
    // Re-registration (e.g. repeated hydration): replace the info in place.
    existing.info.resolver = info.resolver;
    existing.info.lastValue = info.lastValue;
    return;
  }
  const ref = new WeakRef(node);
  reactiveTextNodes.add(ref);
  reactiveTextNodesByNode.set(node, { ref, info });
  textNodeFinalizer?.register(node, ref);
}

/**
 * Registers a reactive element in both lookup structures.
 */
export function registerReactiveElement(element: Element, info: ReactiveElementInfo): void {
  const ref = new WeakRef(element);
  reactiveElements.add(ref);
  reactiveElementsByNode.set(element, { ref, info });
  elementFinalizer?.register(element, ref);
}

/**
 * Removes a reactive text node's WeakRef entry from the iteration set.
 */
export function removeReactiveTextNodeRef(ref: WeakRef<Text>): void {
  reactiveTextNodes.delete(ref);
}

/**
 * Removes a reactive element's WeakRef entry from the iteration set.
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
