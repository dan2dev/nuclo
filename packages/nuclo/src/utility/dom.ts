import { isBrowser } from "./environment";

function safeAppendChild(parent: Element | Node, child: Node): boolean {
  if (!parent || !child) return false;
  try {
    parent.appendChild(child);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveChild(child: Node): boolean {
  if (!child?.parentNode) return false;
  try {
    child.parentNode.removeChild(child);
    return true;
  } catch {
    return false;
  }
}

function safeInsertBefore(parent: Node, newNode: Node, referenceNode: Node | null): boolean {
  if (!parent || !newNode) return false;
  try {
    parent.insertBefore(newNode, referenceNode);
    return true;
  } catch {
    return false;
  }
}

function createTextNodeSafely(text: string | number | boolean): Text | null {
  if (!isBrowser) return null;
  try {
    return document.createTextNode(String(text));
  } catch {
    return null;
  }
}

function createCommentSafely(text: string): Comment | null {
  if (!isBrowser) return null;
  try {
    return document.createComment(text);
  } catch {
    return null;
  }
}

export function createMarkerComment(prefix: string): Comment {
  if (!isBrowser) {
    throw new Error("Cannot create comment in non-browser environment");
  }
  const comment = createCommentSafely(`${prefix}-${Math.random().toString(36).slice(2)}`);
  if (!comment) {
    throw new Error("Failed to create comment");
  }
  return comment;
}

export function createMarkerPair(prefix: string): { start: Comment; end: Comment } {
  const endComment = createCommentSafely(`${prefix}-end`);
  if (!endComment) {
    throw new Error("Failed to create end comment");
  }
  return {
    start: createMarkerComment(`${prefix}-start`),
    end: endComment
  };
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
    nodes.forEach(node => safeInsertBefore(parent, node, referenceNode));
  }
}

export function appendChildren(
  parent: Element | Node,
  ...children: Array<Element | Node | string | null | undefined>
): Element | Node {
  if (!parent) return parent;

  children.forEach((child) => {
    if (child != null) {
      let nodeToAppend: Node;

      if (typeof child === "string") {
        const textNode = createTextNodeSafely(child);
        if (textNode) {
          nodeToAppend = textNode;
        } else {
          return;
        }
      } else {
        nodeToAppend = child as Node;
      }

      safeAppendChild(parent, nodeToAppend);
    }
  });

  return parent;
}

export function isNodeConnected(node: Node | null | undefined): boolean {
  if (!node) return false;
  return typeof node.isConnected === "boolean" ? node.isConnected : document.contains(node);
}
