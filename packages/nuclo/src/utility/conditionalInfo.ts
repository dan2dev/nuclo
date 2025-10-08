export interface ConditionalInfo {
  condition: () => boolean;
  tagName: string;
  modifiers: Array<NodeMod<any> | NodeModFn<any>>;
}

/**
 * Registry of all nodes that have conditional info attached.
 * This enables O(nConditionals) updates instead of a full DOM tree walk.
 */
const activeConditionalNodes = new Set<Node>();

/**
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo(
  node: Node,
  info: ConditionalInfo
): void {
  (node as any)._conditionalInfo = info;
  activeConditionalNodes.add(node);
}

/**
 * Explicit unregister helper (optional use on teardown if needed).
 */
export function unregisterConditionalNode(node: Node): void {
  activeConditionalNodes.delete(node);
}

/**
 * Returns a readonly view of currently tracked conditional nodes.
 */
export function getActiveConditionalNodes(): ReadonlySet<Node> {
  return activeConditionalNodes;
}

export function hasConditionalInfo(node: Node): boolean {
  return Boolean((node as any)._conditionalInfo);
}

export function getConditionalInfo(node: Node): ConditionalInfo | null {
  return ((node as any)._conditionalInfo as ConditionalInfo | undefined) ?? null;
}
