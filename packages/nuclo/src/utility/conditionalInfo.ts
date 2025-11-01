export interface ConditionalInfo<TTagName extends ElementTagName = ElementTagName> {
  condition: () => boolean;
  tagName: TTagName;
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>;
}

interface NodeWithConditionalInfo extends Node {
  _conditionalInfo?: ConditionalInfo;
}

/**
 * Registry of all nodes that have conditional info attached.
 * This enables O(nConditionals) updates instead of a full DOM tree walk.
 */
const activeConditionalNodes = new Set<Node>();

/**
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo<TTagName extends ElementTagName>(
  node: Node,
  info: ConditionalInfo<TTagName>
): void {
  (node as NodeWithConditionalInfo)._conditionalInfo = info;
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

export function getConditionalInfo(node: Node): ConditionalInfo | null {
  return (node as NodeWithConditionalInfo)._conditionalInfo ?? null;
}
