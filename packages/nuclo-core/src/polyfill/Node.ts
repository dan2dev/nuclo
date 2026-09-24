const NO_CHILDREN: never[] = [];

/**
 * Base Node class for instanceof checks in Node.js polyfill
 */
export class NucloNode {
  nodeType: number = 1; // ELEMENT_NODE
  nodeName: string = '';
  nodeValue: string | null = null;
  parentNode: unknown = null;
  textContent: string = '';

  get childNodes(): NodeListOf<ChildNode> {
    return NO_CHILDREN as unknown as NodeListOf<ChildNode>;
  }
}
