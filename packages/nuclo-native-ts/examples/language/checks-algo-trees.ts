// Algorithms corpus: trees (BST insert/delete, AVL, trie, segment tree, Fenwick tree, traversals).

class TreeNode {
  constructor(
    public value: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

class BinarySearchTree {
  root: TreeNode | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  insert(value: number): boolean {
    if (!this.root) {
      this.root = new TreeNode(value);
      this.count++;
      return true;
    }
    let cur = this.root;
    while (true) {
      if (value === cur.value) return false;
      if (value < cur.value) {
        if (!cur.left) {
          cur.left = new TreeNode(value);
          break;
        }
        cur = cur.left;
      } else {
        if (!cur.right) {
          cur.right = new TreeNode(value);
          break;
        }
        cur = cur.right;
      }
    }
    this.count++;
    return true;
  }

  has(value: number): boolean {
    let cur = this.root;
    while (cur) {
      if (value === cur.value) return true;
      cur = value < cur.value ? cur.left : cur.right;
    }
    return false;
  }

  delete(value: number): void {
    const removeFrom = (node: TreeNode | null, v: number): TreeNode | null => {
      if (node === null) return null;
      if (v < node.value) node.left = removeFrom(node.left, v);
      else if (v > node.value) node.right = removeFrom(node.right, v);
      else {
        this.count--;
        if (!node.left) return node.right;
        if (!node.right) return node.left;
        let succ = node.right;
        while (succ.left) succ = succ.left;
        node.value = succ.value;
        this.count++;
        node.right = removeFrom(node.right, succ.value);
      }
      return node;
    };
    this.root = removeFrom(this.root, value);
  }

  min(): number | undefined {
    let cur = this.root;
    if (!cur) return undefined;
    while (cur.left) cur = cur.left;
    return cur.value;
  }

  height(node: TreeNode | null): number {
    return node ? 1 + Math.max(this.height(node.left), this.height(node.right)) : 0;
  }
}

function inorder(node: TreeNode | null, out: number[] = []): number[] {
  if (node) {
    inorder(node.left, out);
    out.push(node.value);
    inorder(node.right, out);
  }
  return out;
}

function preorderIterative(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: TreeNode[] = root ? [root] : [];
  while (stack.length) {
    const n = stack.pop()!;
    out.push(n.value);
    if (n.right) stack.push(n.right);
    if (n.left) stack.push(n.left);
  }
  return out;
}

function inorderIterative(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: TreeNode[] = [];
  let cur = root;
  while (cur || stack.length > 0) {
    while (cur) {
      stack.push(cur);
      cur = cur.left;
    }
    const n = stack.pop()!;
    out.push(n.value);
    cur = n.right;
  }
  return out;
}

function postorder(node: TreeNode | null): number[] {
  return node ? [...postorder(node.left), ...postorder(node.right), node.value] : [];
}

function levelOrder(root: TreeNode | null): number[][] {
  const levels: number[][] = [];
  let level = root ? [root] : [];
  while (level.length) {
    levels.push(level.map((n) => n.value));
    level = level.flatMap((n) => [n.left, n.right]).filter((n): n is TreeNode => n !== null);
  }
  return levels;
}

function isValidBst(node: TreeNode | null, lo = -Infinity, hi = Infinity): boolean {
  if (!node) return true;
  if (node.value <= lo || node.value >= hi) return false;
  return isValidBst(node.left, lo, node.value) && isValidBst(node.right, node.value, hi);
}

function lowestCommonAncestor(root: TreeNode | null, a: number, b: number): number | null {
  let cur = root;
  while (cur) {
    if (a < cur.value && b < cur.value) cur = cur.left;
    else if (a > cur.value && b > cur.value) cur = cur.right;
    else return cur.value;
  }
  return null;
}

export function bst(): string[] {
  const tree = new BinarySearchTree();
  const inserted = [50, 30, 70, 20, 40, 60, 80, 35, 45, 65, 30].map((v) => tree.insert(v));
  const lines = [
    `inserted ${inserted.map((b) => (b ? "y" : "n")).join("")} size ${tree.size} height ${tree.height(tree.root)}`,
    `inorder ${inorder(tree.root).join(" ")}`,
    `inorder iter ${inorderIterative(tree.root).join(" ")}`,
    `preorder ${preorderIterative(tree.root).join(" ")}`,
    `postorder ${postorder(tree.root).join(" ")}`,
    `levels ${levelOrder(tree.root).map((l) => l.join(",")).join(" | ")}`,
    `has 45:${tree.has(45)} 46:${tree.has(46)} min ${tree.min()} valid ${isValidBst(tree.root)}`,
    `lca(35,45)=${lowestCommonAncestor(tree.root, 35, 45)} lca(20,65)=${lowestCommonAncestor(tree.root, 20, 65)}`,
  ];
  tree.delete(20);
  tree.delete(30);
  tree.delete(50);
  tree.delete(999);
  lines.push(`after delete ${inorder(tree.root).join(" ")} size ${tree.size} root ${tree.root?.value}`);
  const bad = new TreeNode(10);
  bad.left = new TreeNode(5);
  bad.left.right = new TreeNode(12);
  lines.push(`invalid ${isValidBst(bad)} empty min ${new BinarySearchTree().min() ?? "none"}`);
  return lines;
}

// ───── AVL tree (functional style: insert returns the new subtree root) ─────

// Persistent (immutable) AVL tree: every change builds new nodes from old ones.
interface AvlNode {
  readonly key: number;
  readonly height: number;
  readonly left: AvlNode | null;
  readonly right: AvlNode | null;
}

const h = (n: AvlNode | null): number => n?.height ?? 0;

function mk(key: number, left: AvlNode | null, right: AvlNode | null): AvlNode {
  return { key, height: 1 + Math.max(h(left), h(right)), left, right };
}

function rotateRight(y: AvlNode): AvlNode {
  const x = y.left!;
  return mk(x.key, x.left, mk(y.key, x.right, y.right));
}

function rotateLeft(x: AvlNode): AvlNode {
  const y = x.right!;
  return mk(y.key, mk(x.key, x.left, y.left), y.right);
}

function balanced(node: AvlNode): AvlNode {
  const balance = h(node.left) - h(node.right);
  if (balance > 1) return rotateRight(h(node.left!.left) >= h(node.left!.right) ? node : mk(node.key, rotateLeft(node.left!), node.right));
  if (balance < -1) return rotateLeft(h(node.right!.right) >= h(node.right!.left) ? node : mk(node.key, node.left, rotateRight(node.right!)));
  return node;
}

function avlInsert(node: AvlNode | null, key: number): AvlNode {
  if (!node) return mk(key, null, null);
  if (key < node.key) return balanced(mk(node.key, avlInsert(node.left, key), node.right));
  if (key > node.key) return balanced(mk(node.key, node.left, avlInsert(node.right, key)));
  return node;
}

function avlKeys(n: AvlNode | null): string {
  return n ? `(${avlKeys(n.left)} ${n.key} ${avlKeys(n.right)})`.replaceAll("( ", "(").replaceAll(" )", ")") : "";
}

export function avl(): string[] {
  let root: AvlNode | null = null;
  for (let i = 1; i <= 15; i++) root = avlInsert(root, i);
  let zig: AvlNode | null = null;
  for (const k of [30, 10, 20, 5, 4, 3, 25, 27, 26]) zig = avlInsert(zig, k);
  return [
    `sequential root ${root?.key} height ${h(root)}`,
    `shape ${avlKeys(root)}`,
    `zigzag ${avlKeys(zig)} height ${h(zig)}`,
  ];
}

// ───── Trie ─────

class TrieNode {
  children = new Map<string, TrieNode>();
  terminal = false;
  count = 0;
}

class Trie {
  private readonly root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word.split("")) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
      node.count++;
    }
    node.terminal = true;
  }

  private walk(prefix: string): TrieNode | undefined {
    let node: TrieNode | undefined = this.root;
    for (let i = 0; i < prefix.length && node; i++) node = node.children.get(prefix.charAt(i));
    return node;
  }

  has(word: string): boolean {
    return this.walk(word)?.terminal ?? false;
  }

  countPrefix(prefix: string): number {
    return this.walk(prefix)?.count ?? 0;
  }

  complete(prefix: string): string[] {
    const start = this.walk(prefix);
    const out: string[] = [];
    const dfs = (n: TrieNode, acc: string) => {
      if (n.terminal) out.push(acc);
      for (const [ch, child] of [...n.children].sort(([a], [b]) => (a < b ? -1 : 1))) dfs(child, acc + ch);
    };
    if (start) dfs(start, prefix);
    return out;
  }
}

export function trie(): string[] {
  const t = new Trie();
  for (const w of ["car", "card", "care", "cared", "cart", "dog", "dot", "do", "zebra"]) t.insert(w);
  return [
    `has car:${t.has("car")} ca:${t.has("ca")} do:${t.has("do")} cars:${t.has("cars")}`,
    `prefix ca=${t.countPrefix("ca")} do=${t.countPrefix("do")} x=${t.countPrefix("x")}`,
    `complete car → ${t.complete("car").join(",")}`,
    `complete d → ${t.complete("d").join(",")} / q → [${t.complete("q").join(",")}]`,
  ];
}

// ───── Segment tree (range sum + point update) and Fenwick tree ─────

class SegmentTree {
  private readonly tree: number[];
  private readonly n: number;

  constructor(values: number[], private readonly combine: (a: number, b: number) => number, private readonly identity: number) {
    this.n = values.length;
    this.tree = new Array<number>(2 * this.n).fill(identity);
    for (let i = 0; i < this.n; i++) this.tree[this.n + i] = values[i]!;
    for (let i = this.n - 1; i > 0; i--) this.tree[i] = combine(this.tree[2 * i]!, this.tree[2 * i + 1]!);
  }

  set(index: number, value: number): void {
    let i = index + this.n;
    this.tree[i] = value;
    for (i >>= 1; i >= 1; i >>= 1) this.tree[i] = this.combine(this.tree[2 * i]!, this.tree[2 * i + 1]!);
  }

  /** Combines [l, r). */
  query(l: number, r: number): number {
    let resL = this.identity;
    let resR = this.identity;
    for (l += this.n, r += this.n; l < r; l >>= 1, r >>= 1) {
      if (l & 1) resL = this.combine(resL, this.tree[l++]!);
      if (r & 1) resR = this.combine(this.tree[--r]!, resR);
    }
    return this.combine(resL, resR);
  }
}

class FenwickTree {
  private readonly bit: number[];
  constructor(size: number) {
    this.bit = new Array<number>(size + 1).fill(0);
  }
  add(i: number, delta: number): void {
    for (i++; i < this.bit.length; i += i & -i) this.bit[i]! += delta;
  }
  prefix(i: number): number {
    let s = 0;
    for (i++; i > 0; i -= i & -i) s += this.bit[i]!;
    return s;
  }
  range(l: number, r: number): number {
    return this.prefix(r) - (l > 0 ? this.prefix(l - 1) : 0);
  }
}

export function rangeQueries(): string[] {
  const values = [5, 2, 8, 1, 9, 3, 7, 4, 6];
  const sum = new SegmentTree(values, (a, b) => a + b, 0);
  const min = new SegmentTree(values, (a, b) => Math.min(a, b), Infinity);
  const max = new SegmentTree(values, (a, b) => (a > b ? a : b), -Infinity);
  const fen = new FenwickTree(values.length);
  values.forEach((v, i) => fen.add(i, v));
  const before = `sum[2,6)=${sum.query(2, 6)} min[0,9)=${min.query(0, 9)} max[3,5)=${max.query(3, 5)} min[4,4)=${min.query(4, 4)}`;
  sum.set(4, -10);
  min.set(4, -10);
  fen.add(4, -19);
  return [
    before,
    `after sum[2,6)=${sum.query(2, 6)} min[0,9)=${min.query(0, 9)} min[5,9)=${min.query(5, 9)}`,
    `fenwick prefix ${values.map((_, i) => fen.prefix(i)).join(",")}`,
    `fenwick range[2..5]=${fen.range(2, 5)} [0..0]=${fen.range(0, 0)} agree=${fen.range(2, 5) === sum.query(2, 6)}`,
  ];
}

// ───── Generic tree utilities (n-ary, serialization) ─────

interface Category {
  name: string;
  children: Category[];
}

const cat = (name: string, ...children: Category[]): Category => ({ name, children });

function depthFirst(c: Category, depth = 0): string[] {
  return [`${"  ".repeat(depth)}${c.name}`, ...c.children.flatMap((k) => depthFirst(k, depth + 1))];
}

function countLeaves(c: Category): number {
  return c.children.length === 0 ? 1 : c.children.reduce((acc, k) => acc + countLeaves(k), 0);
}

function findPath(c: Category, target: string): string[] | undefined {
  if (c.name === target) return [c.name];
  for (const child of c.children) {
    const sub = findPath(child, target);
    if (sub) return [c.name, ...sub];
  }
  return undefined;
}

function serialize(node: TreeNode | null): string {
  return node ? `${node.value}(${serialize(node.left)},${serialize(node.right)})` : "#";
}

function deserialize(text: string): TreeNode | null {
  let pos = 0;
  const parse = (): TreeNode | null => {
    if (text.charAt(pos) === "#") {
      pos++;
      return null;
    }
    let end = pos;
    while (text.charAt(end) !== "(") end++;
    const node = new TreeNode(Number(text.slice(pos, end)));
    pos = end + 1;
    node.left = parse();
    pos++; // ","
    node.right = parse();
    pos++; // ")"
    return node;
  };
  return parse();
}

function mirror(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  const m = new TreeNode(node.value);
  m.left = mirror(node.right);
  m.right = mirror(node.left);
  return m;
}

export function naryTrees(): string[] {
  const root = cat("root", cat("a", cat("a1"), cat("a2", cat("a2x"))), cat("b"), cat("c", cat("c1")));
  const bt = new BinarySearchTree();
  [4, 2, 6, 1, 3, 5, 7].forEach((v) => bt.insert(v));
  const text = serialize(bt.root);
  const back = deserialize(text);
  return [
    ...depthFirst(root),
    `leaves ${countLeaves(root)} path ${findPath(root, "a2x")?.join("/")} missing ${findPath(root, "zz") === undefined}`,
    `serialized ${text}`,
    `roundtrip ${serialize(back) === text} mirror ${inorder(mirror(back)).join("")}`,
  ];
}
