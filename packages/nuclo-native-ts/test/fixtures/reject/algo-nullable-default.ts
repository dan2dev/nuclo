// expect: A default for a parameter that may be null
// code: NUCLO1004
class Node2 {
  constructor(public left: Node2 | null = null) {}
}
class Tree {
  root: Node2 | null = new Node2();
  height(node: Node2 | null = this.root): number {
    return node ? 1 + this.height(node.left) : 0;
  }
}
export const h = new Tree().height();
