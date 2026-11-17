/**
 * Reference cycles the runtime's cycle collector frees (README "Memory"): mutable linked structures written the way
 * TypeScript developers write them (relinking, back-pointers, objects pointing at each other). Swift and Rust track
 * these classes' objects and free the cycles nothing else reaches; Kotlin and the web have a garbage collector.
 * Every top-level name starts with Cy2 / cy2.
 */

// ───────────── Doubly linked list ─────────────

class Cy2Node {
  prev: Cy2Node | null = null;
  next: Cy2Node | null = null;
  constructor(public value: number) {}
}

class Cy2List {
  head: Cy2Node | null = null;
  tail: Cy2Node | null = null;
  size = 0;

  push(value: number): Cy2Node {
    const node = new Cy2Node(value);
    if (this.tail === null) {
      this.head = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
    }
    this.tail = node;
    this.size++;
    return node;
  }

  unshift(value: number): Cy2Node {
    const node = new Cy2Node(value);
    if (this.head === null) {
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
    }
    this.head = node;
    this.size++;
    return node;
  }

  insertAfter(at: Cy2Node, value: number): Cy2Node {
    const node = new Cy2Node(value);
    node.prev = at;
    node.next = at.next;
    if (at.next !== null) at.next.prev = node;
    else this.tail = node;
    at.next = node;
    this.size++;
    return node;
  }

  remove(node: Cy2Node): void {
    if (node.prev !== null) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next !== null) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
    this.size--;
  }

  reverse(): void {
    let cur = this.head;
    this.tail = cur;
    let last: Cy2Node | null = null;
    while (cur !== null) {
      const next = cur.next;
      cur.next = last;
      cur.prev = next;
      last = cur;
      cur = next;
    }
    this.head = last;
  }

  values(): number[] {
    const out: number[] = [];
    for (let n = this.head; n !== null; n = n.next) out.push(n.value);
    return out;
  }

  valuesBack(): number[] {
    const out: number[] = [];
    for (let n = this.tail; n !== null; n = n.prev) out.push(n.value);
    return out;
  }
}

export function cy2LinkedList(): string[] {
  const list = new Cy2List();
  const nodes: Cy2Node[] = [];
  for (let i = 1; i <= 8; i++) nodes.push(list.push(i * 10));
  const out = [`built ${list.values().join(",")} size ${list.size}`];
  list.remove(nodes[0]!);
  list.remove(nodes[4]!);
  list.remove(nodes[7]!);
  out.push(`removed ends and middle: ${list.values().join(",")} back ${list.valuesBack().join(",")}`);
  list.insertAfter(nodes[3]!, 45);
  list.unshift(5);
  list.insertAfter(list.tail!, 99);
  out.push(`inserted: ${list.values().join(",")} size ${list.size}`);
  list.reverse();
  out.push(`reversed: ${list.values().join(",")} back ${list.valuesBack().join(",")}`);
  // A removed node is unlinked; the others still point at each other.
  out.push(`removed node links: ${nodes[4]!.prev === null && nodes[4]!.next === null} kept ${nodes[5]!.prev!.value}<-${nodes[5]!.value}->${nodes[5]!.next!.value}`);
  while (list.head !== null) list.remove(list.head);
  out.push(`emptied: [${list.values().join(",")}] size ${list.size} tail ${list.tail === null}`);
  return out;
}

// ───────────── Generic deque on a doubly linked list ─────────────

class Cy2DequeNode<T> {
  prev: Cy2DequeNode<T> | null = null;
  next: Cy2DequeNode<T> | null = null;
  constructor(public item: T) {}
}

class Cy2Deque<T> {
  private front: Cy2DequeNode<T> | null = null;
  private back: Cy2DequeNode<T> | null = null;
  length = 0;

  pushBack(item: T): void {
    const n = new Cy2DequeNode<T>(item);
    n.prev = this.back;
    if (this.back !== null) this.back.next = n;
    else this.front = n;
    this.back = n;
    this.length++;
  }

  pushFront(item: T): void {
    const n = new Cy2DequeNode<T>(item);
    n.next = this.front;
    if (this.front !== null) this.front.prev = n;
    else this.back = n;
    this.front = n;
    this.length++;
  }

  popFront(): T | undefined {
    const n = this.front;
    if (n === null) return undefined;
    this.front = n.next;
    if (this.front !== null) this.front.prev = null;
    else this.back = null;
    this.length--;
    return n.item;
  }

  popBack(): T | undefined {
    const n = this.back;
    if (n === null) return undefined;
    this.back = n.prev;
    if (this.back !== null) this.back.next = null;
    else this.front = null;
    this.length--;
    return n.item;
  }
}

export function cy2Deque(): string[] {
  const words = new Cy2Deque<string>();
  for (const w of ["b", "c", "d"]) words.pushBack(w);
  words.pushFront("a");
  const nums = new Cy2Deque<number>();
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) nums.pushBack(i);
    else nums.pushFront(i);
  }
  const drained: string[] = [];
  let w = words.popBack();
  while (w !== undefined) {
    drained.push(w);
    w = words.popFront();
  }
  const ns: number[] = [];
  for (let n = nums.popFront(); n !== undefined; n = nums.popFront()) ns.push(n);
  return [`words ${drained.join(" ")} left ${words.length}`, `numbers ${ns.join(" ")} left ${nums.length} pop ${nums.popBack() ?? "none"}`];
}

// ───────────── Binary search tree with parent links: insert, delete (relinking) ─────────────

class Cy2TreeNode {
  left: Cy2TreeNode | null = null;
  right: Cy2TreeNode | null = null;
  parent: Cy2TreeNode | null = null;
  constructor(public key: number) {}
}

class Cy2Bst {
  root: Cy2TreeNode | null = null;
  count = 0;

  insert(key: number): void {
    const node = new Cy2TreeNode(key);
    let parent: Cy2TreeNode | null = null;
    let cur = this.root;
    while (cur !== null) {
      parent = cur;
      cur = key < cur.key ? cur.left : cur.right;
    }
    node.parent = parent;
    if (parent === null) this.root = node;
    else if (key < parent.key) parent.left = node;
    else parent.right = node;
    this.count++;
  }

  find(key: number): Cy2TreeNode | null {
    let cur = this.root;
    while (cur !== null && cur.key !== key) cur = key < cur.key ? cur.left : cur.right;
    return cur;
  }

  min(node: Cy2TreeNode): Cy2TreeNode {
    let n = node;
    while (n.left !== null) n = n.left;
    return n;
  }

  successor(node: Cy2TreeNode): Cy2TreeNode | null {
    if (node.right !== null) return this.min(node.right);
    let n = node;
    let p = node.parent;
    while (p !== null && n === p.right) {
      n = p;
      p = p.parent;
    }
    return p;
  }

  private transplant(u: Cy2TreeNode, v: Cy2TreeNode | null): void {
    if (u.parent === null) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    if (v !== null) v.parent = u.parent;
  }

  delete(key: number): boolean {
    const z = this.find(key);
    if (z === null) return false;
    if (z.left === null) this.transplant(z, z.right);
    else if (z.right === null) this.transplant(z, z.left);
    else {
      const y = this.min(z.right);
      if (y.parent !== z) {
        this.transplant(y, y.right);
        y.right = z.right;
        y.right.parent = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
    }
    z.left = null;
    z.right = null;
    z.parent = null;
    this.count--;
    return true;
  }

  inorder(): number[] {
    const out: number[] = [];
    if (this.root === null) return out;
    for (let n: Cy2TreeNode | null = this.min(this.root); n !== null; n = this.successor(n)) out.push(n.key);
    return out;
  }

  height(node: Cy2TreeNode | null): number {
    return node === null ? 0 : 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  /** Every child's parent link points back at it. */
  consistent(node: Cy2TreeNode | null): boolean {
    if (node === null) return true;
    if (node.left !== null && node.left.parent !== node) return false;
    if (node.right !== null && node.right.parent !== node) return false;
    return this.consistent(node.left) && this.consistent(node.right);
  }
}

export function cy2Bst(): string[] {
  const t = new Cy2Bst();
  for (const k of [50, 30, 70, 20, 40, 60, 80, 35, 45, 65]) t.insert(k);
  const out = [`inorder ${t.inorder().join(",")} height ${t.height(t.root)} ok ${t.consistent(t.root)}`];
  for (const k of [20, 30, 50, 99, 70]) out.push(`delete ${k}: ${t.delete(k)} → ${t.inorder().join(",")} root ${t.root?.key ?? "-"} ok ${t.consistent(t.root)}`);
  const s = t.find(40);
  out.push(`successor of 40: ${s === null ? "-" : (t.successor(s)?.key ?? "none")} count ${t.count}`);
  for (const k of t.inorder()) t.delete(k);
  out.push(`emptied: root ${t.root === null} count ${t.count}`);
  return out;
}

// ───────────── AVL tree: rotations relink nodes in place ─────────────

class Cy2Avl {
  left: Cy2Avl | null = null;
  right: Cy2Avl | null = null;
  height = 1;
  constructor(public key: number) {}
}

function cy2H(n: Cy2Avl | null): number {
  return n === null ? 0 : n.height;
}

function cy2Fix(n: Cy2Avl): void {
  n.height = 1 + Math.max(cy2H(n.left), cy2H(n.right));
}

function cy2RotateRight(y: Cy2Avl): Cy2Avl {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  cy2Fix(y);
  cy2Fix(x);
  return x;
}

function cy2RotateLeft(x: Cy2Avl): Cy2Avl {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  cy2Fix(x);
  cy2Fix(y);
  return y;
}

function cy2Balance(n: Cy2Avl): Cy2Avl {
  cy2Fix(n);
  const b = cy2H(n.left) - cy2H(n.right);
  if (b > 1) {
    if (cy2H(n.left!.left) < cy2H(n.left!.right)) n.left = cy2RotateLeft(n.left!);
    return cy2RotateRight(n);
  }
  if (b < -1) {
    if (cy2H(n.right!.right) < cy2H(n.right!.left)) n.right = cy2RotateRight(n.right!);
    return cy2RotateLeft(n);
  }
  return n;
}

function cy2AvlInsert(n: Cy2Avl | null, key: number): Cy2Avl {
  if (n === null) return new Cy2Avl(key);
  if (key < n.key) n.left = cy2AvlInsert(n.left, key);
  else n.right = cy2AvlInsert(n.right, key);
  return cy2Balance(n);
}

function cy2AvlRemove(n: Cy2Avl | null, key: number): Cy2Avl | null {
  if (n === null) return null;
  if (key < n.key) n.left = cy2AvlRemove(n.left, key);
  else if (key > n.key) n.right = cy2AvlRemove(n.right, key);
  else {
    if (n.left === null) return n.right;
    if (n.right === null) return n.left;
    let m = n.right;
    while (m.left !== null) m = m.left;
    n.key = m.key;
    n.right = cy2AvlRemove(n.right, m.key);
  }
  return cy2Balance(n);
}

function cy2AvlKeys(n: Cy2Avl | null, out: number[]): number[] {
  if (n !== null) {
    cy2AvlKeys(n.left, out);
    out.push(n.key);
    cy2AvlKeys(n.right, out);
  }
  return out;
}

export function cy2AvlTree(): string[] {
  let root: Cy2Avl | null = null;
  for (let i = 1; i <= 31; i++) root = cy2AvlInsert(root, i);
  const out = [`31 ascending: root ${root!.key} height ${root!.height}`];
  for (const k of [16, 8, 24, 1, 31, 12]) root = cy2AvlRemove(root, k);
  out.push(`after removes: root ${root?.key} height ${root?.height} keys ${cy2AvlKeys(root, []).join(",")}`);
  let zig: Cy2Avl | null = null;
  for (const k of [10, 5, 7, 3, 4, 2, 1]) zig = cy2AvlInsert(zig, k);
  out.push(`zig-zag: root ${zig!.key} left ${zig!.left?.key} right ${zig!.right?.key} keys ${cy2AvlKeys(zig, []).join(",")}`);
  return out;
}

// ───────────── Trie: children in a Map, a parent link to walk back up ─────────────

class Cy2Trie {
  children = new Map<string, Cy2Trie>();
  parent: Cy2Trie | null = null;
  end = false;
  constructor(public ch: string) {}
}

class Cy2Dictionary {
  root = new Cy2Trie("");
  words = 0;

  add(word: string): Cy2Trie {
    let node = this.root;
    for (const c of word.split("")) {
      let next = node.children.get(c);
      if (next === undefined) {
        next = new Cy2Trie(c);
        next.parent = node;
        node.children.set(c, next);
      }
      node = next;
    }
    if (!node.end) this.words++;
    node.end = true;
    return node;
  }

  find(word: string): Cy2Trie | null {
    let node: Cy2Trie | undefined = this.root;
    for (const c of word.split("")) {
      node = node.children.get(c);
      if (node === undefined) return null;
    }
    return node;
  }

  /** The word a node ends, read back up through the parents. */
  wordOf(node: Cy2Trie): string {
    let s = "";
    for (let n: Cy2Trie | null = node; n !== null && n.parent !== null; n = n.parent) s = n.ch + s;
    return s;
  }

  remove(word: string): boolean {
    const node = this.find(word);
    if (node === null || !node.end) return false;
    node.end = false;
    this.words--;
    // Prune the branch nothing else uses.
    let n: Cy2Trie = node;
    while (n.parent !== null && !n.end && n.children.size === 0) {
      const p: Cy2Trie = n.parent;
      p.children.delete(n.ch);
      n.parent = null;
      n = p;
    }
    return true;
  }

  withPrefix(prefix: string): string[] {
    const start = this.find(prefix);
    const out: string[] = [];
    const walk = (n: Cy2Trie) => {
      if (n.end) out.push(this.wordOf(n));
      for (const k of [...n.children.keys()].sort()) walk(n.children.get(k)!);
    };
    if (start !== null) walk(start);
    return out;
  }

  nodes(n: Cy2Trie = this.root): number {
    let c = 1;
    for (const child of n.children.values()) c += this.nodes(child);
    return c;
  }
}

export function cy2Trie(): string[] {
  const d = new Cy2Dictionary();
  const tea = d.add("tea");
  for (const w of ["ten", "to", "inn", "in", "tea", "team", "i"]) d.add(w);
  const out = [`words ${d.words} nodes ${d.nodes()} te* ${d.withPrefix("te").join(",")} back from node: ${d.wordOf(tea)}`];
  out.push(`remove team ${d.remove("team")} remove tex ${d.remove("tex")} nodes ${d.nodes()} t* ${d.withPrefix("t").join(",")}`);
  out.push(`remove inn ${d.remove("inn")} in ${d.find("in")?.end} nodes ${d.nodes()} all ${d.withPrefix("").join(",")}`);
  return out;
}

// ───────────── Composite with parent pointers ─────────────

abstract class Cy2Item {
  parent: Cy2Folder | null = null;
  constructor(public name: string) {}
  abstract size(): number;
  path(): string {
    return this.parent === null ? this.name : `${this.parent.path()}/${this.name}`;
  }
}

class Cy2File extends Cy2Item {
  constructor(name: string, public bytes: number) {
    super(name);
  }
  size(): number {
    return this.bytes;
  }
}

class Cy2Folder extends Cy2Item {
  items: Cy2Item[] = [];
  add(item: Cy2Item): Cy2Folder {
    if (item.parent !== null) item.parent.remove(item);
    item.parent = this;
    this.items.push(item);
    return this;
  }
  remove(item: Cy2Item): void {
    this.items = this.items.filter((i) => i !== item);
    item.parent = null;
  }
  size(): number {
    return this.items.reduce((s, i) => s + i.size(), 0);
  }
  find(name: string): Cy2Item | null {
    for (const i of this.items) {
      if (i.name === name) return i;
      if (i instanceof Cy2Folder) {
        const f = i.find(name);
        if (f !== null) return f;
      }
    }
    return null;
  }
}

export function cy2Composite(): string[] {
  const root = new Cy2Folder("root");
  const docs = new Cy2Folder("docs");
  const src = new Cy2Folder("src");
  root.add(docs).add(src);
  docs.add(new Cy2File("a.md", 120)).add(new Cy2File("b.md", 80));
  const main = new Cy2File("main.ts", 300);
  src.add(main).add(new Cy2File("util.ts", 50));
  const out = [`sizes root ${root.size()} docs ${docs.size()} src ${src.size()}`, `path ${main.path()}`];
  // Moving an item relinks it to its new parent.
  docs.add(main);
  out.push(`moved: ${main.path()} docs ${docs.size()} src ${src.size()} src items ${src.items.length}`);
  root.remove(src);
  out.push(`detached src: ${src.path()} root ${root.size()} found util ${root.find("util.ts") === null ? "no" : "yes"} found main ${root.find("main.ts")?.path()}`);
  return out;
}

// ───────────── A graph of objects with adjacency arrays ─────────────

class Cy2Vertex {
  edges: Cy2Vertex[] = [];
  constructor(public id: string) {}
}

function cy2Connect(a: Cy2Vertex, b: Cy2Vertex): void {
  a.edges.push(b);
  b.edges.push(a);
}

function cy2Reach(from: Cy2Vertex): string[] {
  const seen = new Set<Cy2Vertex>([from]);
  const queue: Cy2Vertex[] = [from];
  const order: string[] = [];
  while (queue.length > 0) {
    const v = queue.shift()!;
    order.push(v.id);
    for (const w of v.edges) {
      if (!seen.has(w)) {
        seen.add(w);
        queue.push(w);
      }
    }
  }
  return order;
}

export function cy2Graph(): string[] {
  const vs = new Map<string, Cy2Vertex>();
  for (const id of ["a", "b", "c", "d", "e", "f", "g"]) vs.set(id, new Cy2Vertex(id));
  const v = (id: string) => vs.get(id)!;
  for (const pair of ["ab", "bc", "ca", "cd", "ef", "fg", "ge"]) cy2Connect(v(pair.charAt(0)), v(pair.charAt(1)));
  const loop = v("d");
  cy2Connect(loop, loop);
  const out = [`from a: ${cy2Reach(v("a")).join("")} from e: ${cy2Reach(v("e")).join("")} d's edges ${v("d").edges.map((w) => w.id).join("")}`];
  // Cut c–d, join d to e: components change.
  v("c").edges = v("c").edges.filter((w) => w !== v("d"));
  v("d").edges = v("d").edges.filter((w) => w !== v("c"));
  cy2Connect(v("d"), v("e"));
  out.push(`after rewiring: from a: ${cy2Reach(v("a")).join("")} from d: ${cy2Reach(v("d")).join("")}`);
  // Parents by object key: a Map whose keys and values are the graph's objects.
  const parent = new Map<Cy2Vertex, Cy2Vertex>();
  const stack = [v("e")];
  parent.set(v("e"), v("e"));
  while (stack.length > 0) {
    const x = stack.pop()!;
    for (const y of x.edges) {
      if (!parent.has(y)) {
        parent.set(y, x);
        stack.push(y);
      }
    }
  }
  const pathTo = (id: string) => {
    const p: string[] = [];
    for (let x = v(id); ; x = parent.get(x)!) {
      p.push(x.id);
      if (parent.get(x) === x) break;
    }
    return p.join("<");
  };
  out.push(`dfs tree: ${pathTo("d")} ${pathTo("g")}`);
  return out;
}

// ───────────── Observers: subject and observers point at each other ─────────────

class Cy2Subject {
  observers = new Set<Cy2Observer>();
  value = 0;
  constructor(public name: string) {}
  attach(o: Cy2Observer): void {
    this.observers.add(o);
    o.subjects.push(this);
  }
  detach(o: Cy2Observer): void {
    this.observers.delete(o);
    o.subjects = o.subjects.filter((s) => s !== this);
  }
  set(v: number): void {
    this.value = v;
    for (const o of this.observers) o.notify(this);
  }
}

class Cy2Observer {
  subjects: Cy2Subject[] = [];
  log: string[] = [];
  constructor(public name: string) {}
  notify(s: Cy2Subject): void {
    this.log.push(`${s.name}=${s.value}`);
  }
  total(): number {
    return this.subjects.reduce((t, s) => t + s.value, 0);
  }
}

export function cy2Observers(): string[] {
  const temp = new Cy2Subject("temp");
  const wind = new Cy2Subject("wind");
  const a = new Cy2Observer("a");
  const b = new Cy2Observer("b");
  temp.attach(a);
  temp.attach(b);
  wind.attach(a);
  temp.set(20);
  wind.set(7);
  temp.detach(b);
  temp.set(22);
  return [`a ${a.log.join(" ")} total ${a.total()}`, `b ${b.log.join(" ")} total ${b.total()} subjects ${b.subjects.length}`, `temp observers ${temp.observers.size} wind ${wind.observers.size}`];
}

// ───────────── Records that point at each other ─────────────

interface Cy2Person {
  name: string;
  friends: Cy2Person[];
  best: Cy2Person | null;
}

function cy2Befriend(a: Cy2Person, b: Cy2Person): void {
  a.friends.push(b);
  b.friends.push(a);
}

export function cy2Records(): string[] {
  const ann: Cy2Person = { name: "ann", friends: [], best: null };
  const bob: Cy2Person = { name: "bob", friends: [], best: null };
  const cy: Cy2Person = { name: "cy", friends: [], best: null };
  cy2Befriend(ann, bob);
  cy2Befriend(bob, cy);
  ann.best = bob;
  bob.best = ann;
  cy.best = cy;
  const names = (p: Cy2Person) => p.friends.map((f) => f.name).join("+");
  return [`ann ${names(ann)} bob ${names(bob)} cy ${names(cy)}`, `bests ${ann.best?.name} ${bob.best?.best?.name} ${cy.best?.best?.name} friend of friend ${ann.friends[0]!.friends[1]!.name}`];
}

// ───────────── Fields typed by an interface, and fields that are never null ─────────────

interface Cy2Container {
  label: string;
  children: Cy2Widget[];
}

class Cy2Widget {
  owner: Cy2Container | null = null;
  constructor(public label: string) {}
  where(): string {
    return this.owner === null ? this.label : `${this.owner.label}>${this.label}`;
  }
}

class Cy2Panel implements Cy2Container {
  children: Cy2Widget[] = [];
  constructor(public label: string) {}
  adopt(w: Cy2Widget): void {
    if (w.owner !== null) w.owner.children = w.owner.children.filter((c) => c !== w);
    w.owner = this;
    this.children.push(w);
  }
}

/** A ring whose link is never null: a new member points at itself until it is linked in. */
class Cy2Loop {
  next: Cy2Loop;
  constructor(public id: number) {
    this.next = this;
  }
  insert(after: Cy2Loop): void {
    this.next = after.next;
    after.next = this;
  }
}

interface Cy2Seat {
  row: number;
  guest: Cy2Guest;
}

class Cy2Guest {
  seat: Cy2Seat | null = null;
  constructor(public name: string) {}
}

export function cy2Shapes(): string[] {
  const left = new Cy2Panel("left");
  const right = new Cy2Panel("right");
  const ok = new Cy2Widget("ok");
  const cancel = new Cy2Widget("cancel");
  left.adopt(ok);
  left.adopt(cancel);
  right.adopt(ok);
  const loop = new Cy2Loop(1);
  for (let i = 2; i <= 4; i++) new Cy2Loop(i).insert(loop);
  const ids: number[] = [];
  let at = loop;
  for (let i = 0; i < 6; i++) {
    ids.push(at.id);
    at = at.next;
  }
  const ann = new Cy2Guest("ann");
  const seat: Cy2Seat = { row: 3, guest: ann };
  ann.seat = seat;
  const bob = new Cy2Guest("bob");
  seat.guest = bob;
  bob.seat = seat;
  ann.seat = null;
  return [
    `${ok.where()} ${cancel.where()} left ${left.children.map((c) => c.label).join(",")} right ${right.children.length}`,
    `loop ${ids.join(",")} self ${new Cy2Loop(9).next.id}`,
    `seat ${seat.row} holds ${seat.guest.name} back ${bob.seat?.guest.name} ann ${ann.seat === null}`,
  ];
}

// ───────────── LRU cache: a Map and a doubly linked list with sentinels ─────────────

class Cy2Entry {
  prev: Cy2Entry | null = null;
  next: Cy2Entry | null = null;
  constructor(public key: string, public value: number) {}
}

class Cy2Lru {
  private map = new Map<string, Cy2Entry>();
  private head = new Cy2Entry("<head>", 0);
  private tail = new Cy2Entry("<tail>", 0);
  evicted: string[] = [];

  constructor(public capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private unlink(e: Cy2Entry): void {
    e.prev!.next = e.next;
    e.next!.prev = e.prev;
  }

  private pushFront(e: Cy2Entry): void {
    e.next = this.head.next;
    e.prev = this.head;
    this.head.next!.prev = e;
    this.head.next = e;
  }

  get(key: string): number | undefined {
    const e = this.map.get(key);
    if (e === undefined) return undefined;
    this.unlink(e);
    this.pushFront(e);
    return e.value;
  }

  put(key: string, value: number): void {
    const e = this.map.get(key);
    if (e !== undefined) {
      e.value = value;
      this.unlink(e);
      this.pushFront(e);
      return;
    }
    if (this.map.size === this.capacity) {
      const last = this.tail.prev!;
      this.unlink(last);
      this.map.delete(last.key);
      this.evicted.push(last.key);
    }
    const fresh = new Cy2Entry(key, value);
    this.map.set(key, fresh);
    this.pushFront(fresh);
  }

  keys(): string[] {
    const out: string[] = [];
    for (let e = this.head.next!; e !== this.tail; e = e.next!) out.push(e.key);
    return out;
  }
}

export function cy2Lru(): string[] {
  const c = new Cy2Lru(3);
  c.put("a", 1);
  c.put("b", 2);
  c.put("c", 3);
  const a = c.get("a");
  c.put("d", 4);
  c.put("b", 20);
  c.put("e", 5);
  const missing = c.get("c");
  c.put("a", 10);
  return [`order ${c.keys().join("")} evicted ${c.evicted.join("")} a ${a} c ${missing ?? "gone"} a now ${c.get("a")} d ${c.get("d") ?? "gone"}`];
}

// ───────────── A cycle that becomes garbage while another stays referenced ─────────────

class Cy2Ring {
  next: Cy2Ring | null = null;
  constructor(public id: number) {}
}

/** Kept between calls: the ring reachable from here stays alive while every other ring becomes garbage. */
let cy2Kept: Cy2Ring | null = null;

function cy2MakeRing(from: number, length: number): Cy2Ring {
  const first = new Cy2Ring(from);
  let last = first;
  for (let i = 1; i < length; i++) {
    const r = new Cy2Ring(from + i);
    last.next = r;
    last = r;
  }
  last.next = first;
  return first;
}

function cy2RingIds(start: Cy2Ring, steps: number): string {
  const ids: number[] = [];
  let r = start;
  for (let i = 0; i < steps; i++) {
    ids.push(r.id);
    r = r.next!;
  }
  return ids.join(",");
}

/** Builds `rounds` rings of every structure above and drops them (a leak test calls it in a loop); returns a checksum. */
export function cy2Churn(rounds: number): number {
  let sum = 0;
  for (let r = 0; r < rounds; r++) {
    const ring = cy2MakeRing(r * 10, 3 + (r % 4));
    if (r === 3) cy2Kept = ring;
    sum += ring.next!.next!.id;
    const list = new Cy2List();
    for (let i = 0; i < 5; i++) list.push(i);
    list.remove(list.head!.next!);
    sum += list.size;
    const t = new Cy2Bst();
    for (const k of [5, 2, 8, 1, 9, 3]) t.insert(k + r);
    t.delete(5 + r);
    sum += t.count;
    const d = new Cy2Dictionary();
    d.add("ab");
    d.add("ac");
    sum += d.nodes();
    const f = new Cy2Folder("f");
    f.add(new Cy2File("x", 1)).add(new Cy2Folder("g"));
    sum += f.size();
    const a = new Cy2Vertex("a");
    const b = new Cy2Vertex("b");
    cy2Connect(a, b);
    cy2Connect(b, b);
    const s = new Cy2Subject("s");
    s.attach(new Cy2Observer("o"));
    const lru = new Cy2Lru(2);
    for (const k of ["a", "b", "c", "a"]) lru.put(k, r);
    sum += lru.keys().length;
    const panel = new Cy2Panel("p");
    panel.adopt(new Cy2Widget("w"));
    const loop = new Cy2Loop(r);
    new Cy2Loop(r + 1).insert(loop);
    const g = new Cy2Guest("g");
    g.seat = { row: r, guest: g };
    sum += loop.next.id + panel.children.length;
    const p: Cy2Person = { name: "p", friends: [], best: null };
    p.best = p;
    cy2Befriend(p, { name: "q", friends: [], best: p });
  }
  return sum;
}

export function cy2Garbage(): string[] {
  const sum = cy2Churn(20);
  const kept = cy2Kept!;
  // Relinking the kept ring: drop one member (it becomes garbage on its own), add a new one.
  const dropped = kept.next!;
  kept.next = dropped.next;
  const added = new Cy2Ring(99);
  added.next = kept.next;
  kept.next = added;
  return [`churn ${sum}`, `kept ring ${cy2RingIds(kept, 8)}`, `dropped ${dropped.id} still points at ${dropped.next!.id}`];
}
