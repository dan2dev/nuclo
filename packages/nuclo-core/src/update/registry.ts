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

// ─── Conditional elements ────────────────────────────────────────────────────
// Same idea as above, but for nodes created by conditional rendering: the
// registry remembers each node's condition + modifiers so update() can
// re-evaluate and swap the element in place.

export interface ConditionalInfo<TTagName extends ElementTagName = ElementTagName> {
	condition: () => boolean;
	tagName: TTagName;
	modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>;
	isSvg: boolean;
}

// WeakMap replaces the _conditionalInfo expando property — zero `any`, no DOM pollution, auto-GC.
const conditionalInfoMap = new WeakMap<Node, ConditionalInfo<ElementTagName>>();

/**
 * Registry of all nodes that have conditional info attached.
 * Uses WeakRef to prevent memory leaks — allows garbage collection of removed nodes.
 * This enables O(nConditionals) updates instead of a full DOM tree walk.
 */
const activeConditionalNodes = new Set<WeakRef<Node>>();

/**
 * Reverse lookup for O(1) unregister — maps node to its WeakRef in the active set.
 */
const refByNode = new WeakMap<Node, WeakRef<Node>>();

/**
 * Prunes dead WeakRefs from the active set as soon as their node is
 * collected, instead of waiting for the next getActiveConditionalNodes() pass.
 */
const conditionalNodeFinalizer = typeof FinalizationRegistry !== "undefined"
	? new FinalizationRegistry<WeakRef<Node>>((ref) => { activeConditionalNodes.delete(ref); })
	: null;

/**
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo<TTagName extends ElementTagName>(
	node: Node,
	info: ConditionalInfo<TTagName>
): void {
	conditionalInfoMap.set(node, info as ConditionalInfo<ElementTagName>);
	const ref = new WeakRef(node);
	activeConditionalNodes.add(ref);
	refByNode.set(node, ref);
	conditionalNodeFinalizer?.register(node, ref);
}

/**
 * Explicit unregister helper (optional use on teardown if needed).
 * O(1) via reverse lookup WeakMap.
 */
export function unregisterConditionalNode(node: Node): void {
	conditionalInfoMap.delete(node);
	const ref = refByNode.get(node);
	if (ref) {
		activeConditionalNodes.delete(ref);
		refByNode.delete(node);
	}
}

/**
 * Returns an array of currently tracked conditional nodes that are still alive.
 * Automatically cleans up garbage-collected nodes.
 */
export function getActiveConditionalNodes(): Node[] {
	const nodes: Node[] = [];
	const toDelete: WeakRef<Node>[] = [];

	for (const ref of activeConditionalNodes) {
		const node = ref.deref();
		if (node === undefined) {
			toDelete.push(ref);
		} else {
			nodes.push(node);
		}
	}

	for (const ref of toDelete) {
		activeConditionalNodes.delete(ref);
	}

	return nodes;
}

export function getConditionalInfo(node: Node): ConditionalInfo<ElementTagName> | null {
	return conditionalInfoMap.get(node) ?? null;
}
