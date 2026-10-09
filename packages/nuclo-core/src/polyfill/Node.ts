/** The child list of a node that can have none (text, comments). */
export const NO_CHILDREN: never[] = [];

/**
 * A node's neighbour in its parent's child array.
 *
 * Computed on each read rather than kept as pointers: appendChild is the
 * hottest path in renderToString() and would pay for pointer upkeep on every
 * node, while a sibling walk on a server is rare and short — a region
 * replacing its `empty` content, or a latest region taking a second view.
 */
export function siblingOf(node: object, offset: 1 | -1): Node | null {
  const parent = (node as { parentNode: { childNodes?: ArrayLike<Node> } | null }).parentNode;
  const kids = parent?.childNodes;
  if (!kids) return null;
  const i = Array.prototype.indexOf.call(kids, node);
  return i === -1 ? null : (kids[i + offset] ?? null);
}

/**
 * Base Node class for instanceof checks in Node.js polyfill
 */
export class NucloNode {
  nodeType = 1; // ELEMENT_NODE
  nodeName = '';
  nodeValue: string | null = null;
  parentNode: unknown = null;
  textContent = '';

  get childNodes(): NodeListOf<ChildNode> {
    return NO_CHILDREN as unknown as NodeListOf<ChildNode>;
  }

  get nextSibling(): Node | null {
    return siblingOf(this, 1);
  }

  get previousSibling(): Node | null {
    return siblingOf(this, -1);
  }
}

/** A comment: nuclo's own markers (`marker` set) and the app's. */
export class NucloComment extends NucloNode {
  data: string;
  marker: boolean;

  constructor(data: string, marker: boolean) {
    super();
    this.nodeType = 8; // COMMENT_NODE
    this.nodeName = '#comment';
    this.data = data;
    this.textContent = data;
    this.nodeValue = data;
    this.marker = marker;
  }
}
