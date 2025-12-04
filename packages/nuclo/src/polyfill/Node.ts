/**
 * Base Node class for instanceof checks in Node.js polyfill
 */
export class NucloNode {
  nodeType: number = 1; // ELEMENT_NODE
  nodeName: string = '';
  nodeValue: string | null = null;
  parentNode: Node | null = null;
  childNodes: Node[] = [];
  textContent: string = '';
}
