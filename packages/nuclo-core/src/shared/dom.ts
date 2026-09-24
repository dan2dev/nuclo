import { logError } from "./errors";
import { removeAllListeners } from "../element/events";
import { cleanupReactiveTextNode, cleanupReactiveElement } from "../update/registry";
import { disposeElementLifecycle, hasActiveLifecycleRegistrations } from "../element/lifecycle";

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Recursively removes all event listeners and reactive subscriptions from a node and its descendants
 * to prevent memory leaks when elements are removed from the DOM.
 */
function cleanupNodeTree(node: Node): void {
  // Clean up the node itself based on its type. Order-independent bookkeeping
  // (listeners, reactive registrations) runs up front; onDestroy is fired
  // below, after descendants — see the comment there.
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    removeAllListeners(element);
    cleanupReactiveElement(element);
  } else if (node.nodeType === Node.TEXT_NODE) {
    cleanupReactiveTextNode(node as Text);
  }

  // Recursively clean up all child nodes
  // Destroy callbacks can mutate the live childNodes collection. Snapshot
  // only when hooks exist; ordinary cleanup needs no additional allocation.
  const children = hasActiveLifecycleRegistrations() ? Array.from(node.childNodes) : node.childNodes;
  for (let i = 0; i < children.length; i++) {
    cleanupNodeTree(children[i]);
  }

  // Fire onDestroy last — after every descendant's onDestroy has already run
  // (post-order) — so a parent's teardown can rely on its children having
  // already released whatever they were using (e.g. a subscription or timer
  // the parent owns and children only read from). This mirrors onMount's own
  // order, which is naturally parent-before-child (registration order is
  // construction order: a parent's own onMount/{onMount} modifier is applied
  // before its child factories are even invoked) — so mount is top-down,
  // destroy is bottom-up, the same LIFO discipline nested resource scopes
  // always use. No-op unless this exact element registered a callback.
  if (node.nodeType === Node.ELEMENT_NODE) {
    disposeElementLifecycle(node as HTMLElement);
  }
}

/**
 * Fires onDestroy for a subtree that list()'s bulk clear/replace is about to
 * drop without walking through cleanupNodeTree()/safeRemoveChild(). Callers
 * skip it entirely unless hasActiveLifecycleRegistrations(), so the fast path
 * stays fast when lifecycle hooks aren't in use.
 *
 * Same post-order (children, then self) as cleanupNodeTree() above, for the
 * same reason — see the comment there.
 */
export function disposeLifecyclesInSubtree(node: Node): void {
  const children = Array.from(node.childNodes);
  for (let i = 0; i < children.length; i++) {
    disposeLifecyclesInSubtree(children[i]);
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    disposeElementLifecycle(node as Element);
  }
}

export function safeRemoveChild(child: Node): boolean {
  if (!child?.parentNode) return false;
  try {
    // Clean up all event listeners before removing the element
    cleanupNodeTree(child);
    // A destroy callback may already have removed the node.
    child.parentNode?.removeChild(child);
    return true;
  } catch (error) {
    logError('Failed to remove child node', error);
    return false;
  }
}

function safeInsertBefore(parent: Node, newNode: Node, referenceNode: Node | null): boolean {
  try {
    parent.insertBefore(newNode, referenceNode);
    return true;
  } catch (error) {
    logError('Failed to insert node before reference', error);
    return false;
  }
}

export function createMarkerPair(prefix: string, id: number): { start: Comment; end: Comment } {
  return { start: document.createComment(`${prefix}-start-${id}`), end: document.createComment(`${prefix}-end`) };
}

export function clearBetweenMarkers(startMarker: Comment, endMarker: Comment): void {
  let current = startMarker.nextSibling;
  while (current && current !== endMarker) {
    const next = current.nextSibling;
    safeRemoveChild(current);
    current = next;
  }
}

export function insertNodesBefore(nodes: Node[], referenceNode: Node): void {
  const parent = referenceNode.parentNode;
  if (parent) {
    for (let i = 0; i < nodes.length; i++) {
      safeInsertBefore(parent, nodes[i], referenceNode);
    }
  }
}

/**
 * Creates a scoped DOM insertion context that temporarily redirects appendChild
 * to insertBefore at a specific reference node. This is useful for inserting
 * content at specific positions in the DOM tree.
 *
 * @param host - The host element
 * @param referenceNode - The node before which new nodes should be inserted
 * @param callback - Function to execute with the scoped context
 * @returns The result of the callback
 */
export function withScopedInsertion<T, THost extends Element | object>(
  host: THost,
  referenceNode: Node,
  callback: () => T
): T {
  const parent = host as unknown as Node & ParentNode;
  const originalAppend = Object.getOwnPropertyDescriptor(parent, "appendChild");
  const originalInsert = parent.insertBefore;

  // Temporarily override appendChild to insert before the reference node
  // TypeScript doesn't like this override but it's safe at runtime
  (parent as unknown as Record<string, unknown>).appendChild = function(node: Node): Node {
    return originalInsert.call(parent, node, referenceNode);
  };

  try {
    return callback();
  } finally {
    // Restore original method
    if (originalAppend) Object.defineProperty(parent, "appendChild", originalAppend);
    else Reflect.deleteProperty(parent, "appendChild");
  }
}
