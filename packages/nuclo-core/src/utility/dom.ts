import { logError } from "./errorHandler";
import { removeAllListeners } from "./on";
import {
  cleanupReactiveTextNode,
  cleanupReactiveElement,
} from "../core/reactiveCleanup";
import { unregisterConditionalNode } from "./conditionalInfo";

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/**
 * Creates an HTML element.
 * Wrapper for document.createElement with type safety.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
): HTMLElementTagNameMap[K] | null;
export function createElement(tagName: string): ExpandedElement | null;
export function createElement(tagName: string): ExpandedElement | null {
  return globalThis.document
    ? (document.createElement(tagName) as ExpandedElement)
    : null;
}

/**
 * Creates an element in the given namespace (typically for SVG elements).
 * Wrapper for `document.createElementNS` with tag-literal inference for SVG.
 *
 * When the namespace is the SVG namespace and `tagName` is a known SVG tag
 * (`keyof SVGElementTagNameMap`), the return type is narrowed to the
 * corresponding element subtype. The string fallback remains for custom
 * namespaces.
 *
 * @template TTagName SVG tag literal (SVG overload only).
 */
export function createElementNS<TTagName extends keyof SVGElementTagNameMap>(
  namespace: typeof SVG_NAMESPACE,
  tagName: TTagName,
): SVGElementTagNameMap[TTagName] | null;
export function createElementNS(
  namespace: string,
  tagName: string,
): ExpandedElement | null;
export function createElementNS(
  namespace: string,
  tagName: string,
): ExpandedElement | null {
  return globalThis.document
    ? (document.createElementNS(namespace, tagName) as ExpandedElement)
    : null;
}

/**
 * Creates a text node with the given content.
 * Wrapper for document.createTextNode.
 */
export function createTextNode(text: string): Text | null {
  return globalThis.document ? document.createTextNode(text) : null;
}

/**
 * Creates a document fragment.
 * Wrapper for document.createDocumentFragment.
 */
export function createDocumentFragment(): DocumentFragment | null {
  return globalThis.document ? document.createDocumentFragment() : null;
}

function safeAppendChild(parent: Element | Node, child: Node): boolean {
  try {
    parent.appendChild(child);
    return true;
  } catch (error) {
    logError("Failed to append child node", error);
    return false;
  }
}

/**
 * Recursively removes event listeners, reactive resolvers, and conditional registrations
 * from a node and its descendants. Called on removal to prevent leaks when elements
 * exit the DOM. Caches childNodes and length locally — the live NodeList has a
 * non-trivial access cost per iteration.
 */
function cleanupEventListeners(node: Node): void {
  const nodeType = node.nodeType;
  if (nodeType === 1 /* ELEMENT_NODE */) {
    const element = node as HTMLElement;
    removeAllListeners(element);
    cleanupReactiveElement(element);
    unregisterConditionalNode(element);
  } else if (nodeType === 3 /* TEXT_NODE */) {
    cleanupReactiveTextNode(node as Text);
  } else if (nodeType === 8 /* COMMENT_NODE */) {
    unregisterConditionalNode(node);
  }

  const children = node.childNodes;
  if (!children) return;
  for (let i = 0, n = children.length; i < n; i++) {
    cleanupEventListeners(children[i]);
  }
}

export function safeRemoveChild(child: Node): boolean {
  if (!child?.parentNode) return false;
  try {
    // Clean up all event listeners before removing the element
    cleanupEventListeners(child);
    child.parentNode.removeChild(child);
    return true;
  } catch (error) {
    logError("Failed to remove child node", error);
    return false;
  }
}

function safeInsertBefore(
  parent: Node,
  newNode: Node,
  referenceNode: Node | null,
): boolean {
  try {
    parent.insertBefore(newNode, referenceNode);
    return true;
  } catch (error) {
    logError("Failed to insert node before reference", error);
    return false;
  }
}

export function createComment(text: string): Comment | null {
  return globalThis.document ? globalThis.document.createComment(text) : null;
}

export function createConditionalComment(
  tagName: string,
  suffix = "hidden",
): Comment | null {
  return globalThis.document
    ? globalThis.document.createComment(`conditional-${tagName}-${suffix}`)
    : null;
}

export function createMarkerPair(
  prefix: string,
  id: number | string,
): { start: Comment; end: Comment } {
  const endComment = createComment(`${prefix}-end`);
  if (!endComment)
    throw new Error("Failed to create comment: document not available");
  const startComment = createComment(`${prefix}-start-${id}`);
  if (!startComment)
    throw new Error("Failed to create comment: document not available");
  return { start: startComment, end: endComment };
}

export function clearBetweenMarkers(
  startMarker: Comment,
  endMarker: Comment,
): void {
  let current = startMarker.nextSibling;
  while (current && current !== endMarker) {
    const next = current.nextSibling;
    safeRemoveChild(current);
    current = next;
  }
}

export function insertNodesBefore(nodes: Node[], referenceNode: Node): void {
  const parent = referenceNode.parentNode;
  if (!parent) return;
  for (let i = 0, n = nodes.length; i < n; i++) {
    safeInsertBefore(parent, nodes[i], referenceNode);
  }
}

export function appendChildren(
  parent: Element | Node,
  ...children: Array<Element | Node | string | null | undefined>
): Element | Node {
  if (!parent) return parent;

  for (let i = 0, n = children.length; i < n; i++) {
    const child = children[i];
    if (child == null) continue;
    if (typeof child === "string") {
      const textNode = createTextNode(child);
      if (textNode) safeAppendChild(parent, textNode);
      continue;
    }
    safeAppendChild(parent, child as Node);
  }

  return parent;
}

export function isNodeConnected(node: Node | null | undefined): boolean {
  if (!node) return false;
  return node.isConnected === true;
}

/**
 * Safely replaces an old node with a new node in the DOM.
 * Returns true on success, false on failure (and logs the error).
 */
export function replaceNodeSafely(oldNode: Node, newNode: Node): boolean {
  if (!oldNode?.parentNode) return false;
  try {
    oldNode.parentNode.replaceChild(newNode, oldNode);
    return true;
  } catch (error) {
    logError("Error replacing conditional node", error);
    return false;
  }
}
