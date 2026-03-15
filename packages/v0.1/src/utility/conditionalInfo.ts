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
 * Uses WeakRef to prevent memory leaks - allows garbage collection of removed nodes.
 * This enables O(nConditionals) updates instead of a full DOM tree walk.
 */
const activeConditionalNodes = new Set<WeakRef<Node>>();

/**
 * Attach conditional info to a node and register it.
 */
export function storeConditionalInfo<TTagName extends ElementTagName>(
  node: Node,
  info: ConditionalInfo<TTagName>
): void {
  (node as NodeWithConditionalInfo)._conditionalInfo = info as ConditionalInfo<keyof HTMLElementTagNameMap>;
  activeConditionalNodes.add(new WeakRef(node));
}

/**
 * Explicit unregister helper (optional use on teardown if needed).
 */
export function unregisterConditionalNode(node: Node): void {
  // Find and remove the WeakRef that points to this node
  for (const ref of activeConditionalNodes) {
    if (ref.deref() === node) {
      activeConditionalNodes.delete(ref);
      break;
    }
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
      // Node was garbage collected
      toDelete.push(ref);
    } else {
      nodes.push(node);
    }
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeConditionalNodes.delete(ref);
  }

  return nodes;
}

export function hasConditionalInfo(node: Node): boolean {
  return Boolean((node as NodeWithConditionalInfo)._conditionalInfo);
}

export function getConditionalInfo(node: Node): ConditionalInfo<keyof HTMLElementTagNameMap> | null {
  return (node as NodeWithConditionalInfo)._conditionalInfo ?? null;
}
