export interface ConditionalInfo<TTagName extends ElementTagName = ElementTagName> {
  condition: () => boolean;
  tagName: TTagName;
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>;
  isSvg: boolean;
}

interface NodeWithConditionalInfo extends Node {
  _conditionalInfo?: ConditionalInfo<keyof HTMLElementTagNameMap>;
}

/**
 * Registry of all nodes that have conditional info attached.
 * This enables O(nConditionals) updates instead of a full DOM tree walk.
 * Note: Uses Set (not WeakSet) because we need iteration support.
 * Cleanup happens automatically during update cycles when nodes are disconnected.
 */
const activeConditionalNodes = new Set<Node>();

/**
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo<TTagName extends ElementTagName>(
  node: Node,
  info: ConditionalInfo<TTagName>
): void {
  (node as NodeWithConditionalInfo)._conditionalInfo = info as ConditionalInfo<keyof HTMLElementTagNameMap>;
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
  return Boolean((node as NodeWithConditionalInfo)._conditionalInfo);
}

export function getConditionalInfo(node: Node): ConditionalInfo<keyof HTMLElementTagNameMap> | null {
  return (node as NodeWithConditionalInfo)._conditionalInfo ?? null;
}
