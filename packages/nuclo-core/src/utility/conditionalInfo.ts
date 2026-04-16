export interface ConditionalInfo<
  TTagName extends ElementTagName = ElementTagName,
> {
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
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo<TTagName extends ElementTagName>(
  node: Node,
  info: ConditionalInfo<TTagName>,
): void {
  conditionalInfoMap.set(node, info as ConditionalInfo<ElementTagName>);
  const ref = new WeakRef(node);
  activeConditionalNodes.add(ref);
  refByNode.set(node, ref);
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

export function hasConditionalInfo(node: Node): boolean {
  return conditionalInfoMap.has(node);
}

export function getConditionalInfo(
  node: Node,
): ConditionalInfo<ElementTagName> | null {
  return conditionalInfoMap.get(node) ?? null;
}
