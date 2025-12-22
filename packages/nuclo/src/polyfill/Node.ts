/**
 * Base Node class for instanceof checks in Node.js polyfill
 */
export class NucloNode {
  nodeType: number = 1; // ELEMENT_NODE
  nodeName: string = '';
  nodeValue: string | null = null;
  parentNode: unknown = null;
  private _childNodes: Node[] = [];
  textContent: string = '';
  
  get childNodes(): NodeListOf<ChildNode> {
    const nodes = this._childNodes;
    return {
      ...nodes,
      length: nodes.length,
      item: (index: number) => (nodes[index] as ChildNode) || null,
      [Symbol.iterator]: function* () {
        for (const node of nodes) {
          yield node as ChildNode;
        }
      },
      forEach: (callback: (value: ChildNode, key: number, parent: NodeListOf<ChildNode>) => void) => {
        for (let i = 0; i < nodes.length; i++) {
          callback(nodes[i] as ChildNode, i, this.childNodes);
        }
      },
      entries: function* () {
        for (let i = 0; i < nodes.length; i++) {
          yield [i, nodes[i] as ChildNode] as [number, ChildNode];
        }
      },
      keys: function* () {
        for (let i = 0; i < nodes.length; i++) {
          yield i;
        }
      },
      values: function* () {
        for (const node of nodes) {
          yield node as ChildNode;
        }
      }
    } as unknown as NodeListOf<ChildNode>;
  }
}
