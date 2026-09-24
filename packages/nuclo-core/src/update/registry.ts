/**
 * Shared types and registries for reactive nodes.
 * Single source of truth — imported by reactive-text.ts and reactive-attributes.ts.
 *
 * Registry structure: the iteration sets only hold WeakRefs; the entries live
 * in WeakMaps keyed by the node, one flat object per node (its WeakRef plus
 * its reactive state). Storing entries in a strongly-held map would pin the
 * node in memory forever; with WeakMap storage the whole entry is collectible
 * as soon as the node is unreachable.
 *
 * Dead WeakRefs left in the iteration sets are pruned by the notify passes as
 * they iterate (deref() === undefined, or node disconnected). Registration is
 * the hottest path in list-heavy renders (one text node + often one element
 * per row), so no per-node FinalizationRegistry is used here: its register()
 * cost per row outweighs keeping the sets tidy between updates, and a stale
 * husk is just an empty WeakRef until the next update() sweeps it.
 */

export type TextResolver = () => unknown;

/**
 * A reactive text node. Resolver results render with the DSL's text
 * semantics: nullish and non-primitive values render as "".
 */
export interface ReactiveTextEntry {
  ref: WeakRef<Text>;
  resolver: TextResolver;
  lastValue: string;
}

export type AttributeResolver = () => unknown;

/**
 * Writes a resolved value to the element. A shared module-level function
 * (not a per-registration closure), so a reactive attribute costs no closure.
 */
export type AttributeApplier = (element: Element, key: string, value: unknown) => void;

export interface AttributeResolverRecord {
  key: string;
  resolver: AttributeResolver;
  apply: AttributeApplier;
  lastValue: unknown;
}

export interface ReactiveElementEntry {
  ref: WeakRef<Element>;
  /**
   * Flat keyed array rather than a Map: elements almost always carry one or
   * two reactive attributes, so linear key lookup on registration beats a Map
   * allocation per element, and the per-update flush iterates with a plain
   * index loop (no iterator/destructuring allocations).
   */
  attributeResolvers: AttributeResolverRecord[];
}

/** Iteration set of weak references to reactive text nodes. */
export const reactiveTextNodes = new Set<WeakRef<Text>>();

/** O(1) lookup of a reactive text node's entry. */
export const reactiveTextNodesByNode = new WeakMap<Text, ReactiveTextEntry>();

/** Iteration set of weak references to reactive elements. */
export const reactiveElements = new Set<WeakRef<Element>>();

/** O(1) lookup of a reactive element's entry. */
export const reactiveElementsByNode = new WeakMap<Element, ReactiveElementEntry>();

/**
 * Registers a reactive text node. Re-registration (e.g. repeated hydration)
 * replaces the resolver and last value in place.
 */
export function registerReactiveTextNode(node: Text, resolver: TextResolver, lastValue: string): void {
  const existing = reactiveTextNodesByNode.get(node);
  if (existing) {
    existing.resolver = resolver;
    existing.lastValue = lastValue;
    return;
  }
  const ref = new WeakRef(node);
  reactiveTextNodes.add(ref);
  reactiveTextNodesByNode.set(node, { ref, resolver, lastValue });
}

/** Returns the element's reactive entry, creating and registering it on first use. */
export function registerReactiveElement(element: Element): ReactiveElementEntry {
  let entry = reactiveElementsByNode.get(element);
  if (!entry) {
    const ref = new WeakRef(element);
    entry = { ref, attributeResolvers: [] };
    reactiveElements.add(ref);
    reactiveElementsByNode.set(element, entry);
  }
  return entry;
}

/** Unregisters a reactive text node (called when nuclo removes it). */
export function cleanupReactiveTextNode(node: Text): void {
  const entry = reactiveTextNodesByNode.get(node);
  if (entry) {
    reactiveTextNodes.delete(entry.ref);
    reactiveTextNodesByNode.delete(node);
  }
}

/** Unregisters a reactive element (called when nuclo removes it). */
export function cleanupReactiveElement(element: Element): void {
  const entry = reactiveElementsByNode.get(element);
  if (entry) {
    reactiveElements.delete(entry.ref);
    reactiveElementsByNode.delete(element);
  }
}
