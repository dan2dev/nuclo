// Algorithms corpus: data structures (linked lists, deque, ring buffer, priority queue, LRU cache, bloom filter, sparse matrix).

class ListNode<T> {
  constructor(
    public value: T,
    public next: ListNode<T> | null = null,
  ) {}
}

function listFrom<U>(items: U[]): LinkedList<U> {
  const list = new LinkedList<U>();
  for (let i = items.length - 1; i >= 0; i--) list.prepend(items[i]!);
  return list;
}

class LinkedList<T> {
  head: ListNode<T> | null = null;
  length = 0;

  prepend(value: T): this {
    this.head = new ListNode(value, this.head);
    this.length++;
    return this;
  }

  append(value: T): this {
    if (!this.head) this.head = new ListNode(value);
    else {
      let cur = this.head;
      while (cur.next) cur = cur.next;
      cur.next = new ListNode(value);
    }
    this.length++;
    return this;
  }

  remove(value: T): boolean {
    let prev: ListNode<T> | null = null;
    for (let cur = this.head; cur; prev = cur, cur = cur.next) {
      if (cur.value !== value) continue;
      if (prev) prev.next = cur.next;
      else this.head = cur.next;
      this.length--;
      return true;
    }
    return false;
  }

  reverse(): void {
    let prev: ListNode<T> | null = null;
    let cur = this.head;
    while (cur) {
      const next: ListNode<T> | null = cur.next;
      cur.next = prev;
      prev = cur;
      cur = next;
    }
    this.head = prev;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let n = this.head; n; n = n.next) out.push(n.value);
    return out;
  }

  middle(): T | undefined {
    let slow = this.head;
    let fast = this.head;
    while (fast && fast.next) {
      slow = slow!.next;
      fast = fast.next.next;
    }
    return slow?.value;
  }
}

function mergeSorted(a: ListNode<number> | null, b: ListNode<number> | null): ListNode<number> | null {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    if (a.value <= b.value) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}

export function singlyLinked(): string[] {
  const list = listFrom([3, 1, 4, 1, 5, 9, 2, 6]);
  const out = [`list ${list.toArray().join("->")} len ${list.length} middle ${list.middle()}`];
  list.append(7).prepend(0);
  out.push(`append/prepend ${list.toArray().join(",")}`);
  out.push(`remove 1:${list.remove(1)} 42:${list.remove(42)} 0:${list.remove(0)} → ${list.toArray().join(",")} len ${list.length}`);
  list.reverse();
  out.push(`reversed ${list.toArray().join(",")}`);
  const merged = mergeSorted(listFrom([1, 3, 5, 7]).head, listFrom([2, 3, 6, 8, 10]).head);
  const values: number[] = [];
  for (let n = merged; n; n = n.next) values.push(n.value);
  out.push(`merged ${values.join(",")}`);
  const words = listFrom(["x", "y"]);
  words.reverse();
  out.push(`strings ${words.toArray().join("")} empty middle ${new LinkedList<number>().middle() ?? "none"}`);
  return out;
}

// ───── Doubly linked list as an index-based pool, and a deque ─────

class Deque<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private count = 0;

  constructor(capacity = 4) {
    this.buf = new Array<T | undefined>(capacity).fill(undefined);
  }

  get size(): number {
    return this.count;
  }

  private grow(): void {
    const old = this.buf;
    this.buf = new Array<T | undefined>(old.length * 2).fill(undefined);
    for (let i = 0; i < this.count; i++) this.buf[i] = old[(this.head + i) % old.length];
    this.head = 0;
  }

  pushBack(v: T): void {
    if (this.count === this.buf.length) this.grow();
    this.buf[(this.head + this.count) % this.buf.length] = v;
    this.count++;
  }

  pushFront(v: T): void {
    if (this.count === this.buf.length) this.grow();
    this.head = (this.head - 1 + this.buf.length) % this.buf.length;
    this.buf[this.head] = v;
    this.count++;
  }

  popFront(): T | undefined {
    if (this.count === 0) return undefined;
    const v = this.buf[this.head];
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) % this.buf.length;
    this.count--;
    return v;
  }

  popBack(): T | undefined {
    if (this.count === 0) return undefined;
    const i = (this.head + this.count - 1) % this.buf.length;
    const v = this.buf[i];
    this.buf[i] = undefined;
    this.count--;
    return v;
  }

  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this.count; i++) out.push(this.buf[(this.head + i) % this.buf.length]!);
    return out;
  }
}

/** Sliding window maximum with a monotonic deque of indices. */
function slidingMax(xs: number[], k: number): number[] {
  const dq = new Deque<number>();
  const out: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    while (idx.length && idx[0]! <= i - k) idx.shift();
    while (idx.length && xs[idx[idx.length - 1]!]! <= xs[i]!) idx.pop();
    idx.push(i);
    dq.pushBack(i);
    if (i >= k - 1) out.push(xs[idx[0]!]!);
  }
  return out;
}

interface DNode {
  key: string;
  prev: number;
  next: number;
}

/** A doubly linked list whose links are indices into an array. */
class IndexList {
  nodes: DNode[] = [{ key: "<sentinel>", prev: 0, next: 0 }];

  insertAfter(at: number, key: string): number {
    const id = this.nodes.length;
    const next = this.nodes[at]!.next;
    this.nodes.push({ key, prev: at, next });
    this.nodes[at]!.next = id;
    this.nodes[next]!.prev = id;
    return id;
  }

  unlink(id: number): void {
    const { prev, next } = this.nodes[id]!;
    this.nodes[prev]!.next = next;
    this.nodes[next]!.prev = prev;
  }

  forward(): string[] {
    const out: string[] = [];
    for (let i = this.nodes[0]!.next; i !== 0; i = this.nodes[i]!.next) out.push(this.nodes[i]!.key);
    return out;
  }

  backward(): string[] {
    const out: string[] = [];
    for (let i = this.nodes[0]!.prev; i !== 0; i = this.nodes[i]!.prev) out.push(this.nodes[i]!.key);
    return out;
  }
}

export function dequeAndDoubly(): string[] {
  const d = new Deque<number>(2);
  for (let i = 1; i <= 5; i++) d.pushBack(i);
  d.pushFront(0);
  d.pushFront(-1);
  const front = d.popFront();
  const back = d.popBack();
  const list = new IndexList();
  const a = list.insertAfter(0, "a");
  const c = list.insertAfter(a, "c");
  list.insertAfter(a, "b");
  list.insertAfter(c, "d");
  list.unlink(a);
  const empty = new Deque<string>();
  return [
    `deque ${d.toArray().join(",")} size ${d.size} popped ${front}/${back}`,
    `empty pops ${empty.popFront() ?? "none"} ${empty.popBack() ?? "none"}`,
    `sliding max ${slidingMax([1, 3, -1, -3, 5, 3, 6, 7], 3).join(",")}`,
    `doubly ${list.forward().join("")} back ${list.backward().join("")}`,
  ];
}

// ───── Ring buffer, priority queue, LRU cache ─────

class RingBuffer {
  private readonly data: Float64Array;
  private start = 0;
  private len = 0;
  constructor(readonly capacity: number) {
    this.data = new Float64Array(capacity);
  }
  push(x: number): number | undefined {
    let evicted: number | undefined;
    if (this.len === this.capacity) {
      evicted = this.data[this.start];
      this.start = (this.start + 1) % this.capacity;
      this.len--;
    }
    this.data[(this.start + this.len) % this.capacity] = x;
    this.len++;
    return evicted;
  }
  average(): number {
    let s = 0;
    for (let i = 0; i < this.len; i++) s += this.data[(this.start + i) % this.capacity]!;
    return this.len ? s / this.len : 0;
  }
  values(): number[] {
    return Array.from({ length: this.len }, (_, i) => this.data[(this.start + i) % this.capacity]!);
  }
}

interface Job {
  name: string;
  priority: number;
  seq: number;
}

class PriorityQueue {
  private heap: Job[] = [];
  private counter = 0;

  enqueue(name: string, priority: number): void {
    this.heap.push({ name, priority, seq: this.counter++ });
    this.up(this.heap.length - 1);
  }

  dequeue(): Job | undefined {
    if (!this.heap.length) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) {
      this.heap[0] = last;
      this.down(0);
    }
    return top;
  }

  peek(): Job | undefined {
    return this.heap[0];
  }

  private before(a: Job, b: Job): boolean {
    return a.priority !== b.priority ? a.priority > b.priority : a.seq < b.seq;
  }

  private up(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.before(this.heap[i]!, this.heap[p]!)) return;
      [this.heap[i], this.heap[p]] = [this.heap[p]!, this.heap[i]!];
      i = p;
    }
  }

  private down(i: number): void {
    const n = this.heap.length;
    for (;;) {
      let best = i;
      for (const c of [2 * i + 1, 2 * i + 2]) if (c < n && this.before(this.heap[c]!, this.heap[best]!)) best = c;
      if (best === i) return;
      [this.heap[i], this.heap[best]] = [this.heap[best]!, this.heap[i]!];
      i = best;
    }
  }
}

class LRUCache<K, V> {
  private readonly map = new Map<K, V>();
  hits = 0;
  misses = 0;
  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) {
      this.misses++;
      return undefined;
    }
    const v = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, v);
    this.hits++;
    return v;
  }

  put(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      for (const oldest of this.map.keys()) {
        this.map.delete(oldest);
        break;
      }
    }
    this.map.set(key, value);
  }

  keys(): K[] {
    return [...this.map.keys()];
  }
}

export function buffersAndCaches(): string[] {
  const ring = new RingBuffer(3);
  const evicted = [1, 2, 3, 4, 5].map((x) => ring.push(x * 1.5));
  const pq = new PriorityQueue();
  pq.enqueue("low", 1);
  pq.enqueue("high", 5);
  pq.enqueue("mid", 3);
  pq.enqueue("high2", 5);
  pq.enqueue("mid2", 3);
  const peeked = pq.peek()?.name;
  const order: string[] = [];
  for (let t = pq.dequeue(); t; t = pq.dequeue()) order.push(`${t.name}(${t.priority})`);
  const lru = new LRUCache<string, number>(2);
  lru.put("a", 1);
  lru.put("b", 2);
  const a = lru.get("a");
  lru.put("c", 3);
  const b = lru.get("b");
  lru.put("a", 10);
  lru.put("d", 4);
  return [
    `ring ${ring.values().join(",")} avg ${ring.average()} evicted ${evicted.map((e) => (e === undefined ? "-" : String(e))).join(",")}`,
    `pq peek ${peeked} order ${order.join(" ")}`,
    `lru get a=${a} b=${b ?? "miss"} c=${lru.get("c") ?? "miss"} a=${lru.get("a")} keys ${lru.keys().join(",")} hits ${lru.hits} misses ${lru.misses}`,
  ];
}

// ───── Bloom filter with bit operations, bit set, sparse matrix ─────

class BloomFilter {
  private readonly bits: Uint32Array;
  constructor(
    private readonly size: number,
    private readonly hashes: number,
  ) {
    this.bits = new Uint32Array(Math.ceil(size / 32));
  }

  private hash(s: string, seed: number): number {
    let h = 2166136261 ^ seed;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % this.size;
  }

  add(s: string): void {
    for (let k = 0; k < this.hashes; k++) {
      const bit = this.hash(s, k * 0x9e3779b9);
      this.bits[bit >>> 5] = this.bits[bit >>> 5]! | (1 << (bit & 31));
    }
  }

  mightContain(s: string): boolean {
    for (let k = 0; k < this.hashes; k++) {
      const bit = this.hash(s, k * 0x9e3779b9);
      if ((this.bits[bit >>> 5]! & (1 << (bit & 31))) === 0) return false;
    }
    return true;
  }

  popcount(): number {
    let n = 0;
    for (const word of this.bits) {
      let w = word;
      while (w) {
        w &= w - 1;
        n++;
      }
    }
    return n;
  }
}

class BitSet {
  private words: number[] = [];
  set(i: number): this {
    while (this.words.length <= i >> 5) this.words.push(0);
    this.words[i >> 5]! |= 1 << (i & 31);
    return this;
  }
  has(i: number): boolean {
    return ((this.words[i >> 5] ?? 0) & (1 << (i & 31))) !== 0;
  }
  union(other: BitSet): BitSet {
    const r = new BitSet();
    const n = Math.max(this.words.length, other.words.length);
    for (let i = 0; i < n; i++) r.words.push((this.words[i] ?? 0) | (other.words[i] ?? 0));
    return r;
  }
  toArray(): number[] {
    const out: number[] = [];
    this.words.forEach((w, wi) => {
      for (let b = 0; b < 32; b++) if (w & (1 << b)) out.push(wi * 32 + b);
    });
    return out;
  }
}

class SparseMatrix {
  private readonly cells = new Map<string, number>();
  constructor(
    readonly rows: number,
    readonly cols: number,
  ) {}

  set(r: number, c: number, v: number): void {
    const key = `${r},${c}`;
    if (v === 0) this.cells.delete(key);
    else this.cells.set(key, v);
  }

  get(r: number, c: number): number {
    return this.cells.get(`${r},${c}`) ?? 0;
  }

  get nonZero(): number {
    return this.cells.size;
  }

  multiply(other: SparseMatrix): SparseMatrix {
    const out = new SparseMatrix(this.rows, other.cols);
    for (const [key, v] of this.cells) {
      const [r, k] = key.split(",").map((s) => Number(s)) as [number, number];
      for (let c = 0; c < other.cols; c++) {
        const w = other.get(k, c);
        if (w !== 0) out.set(r, c, out.get(r, c) + v * w);
      }
    }
    return out;
  }

  toString(): string {
    const lines: string[] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: number[] = [];
      for (let c = 0; c < this.cols; c++) row.push(this.get(r, c));
      lines.push(row.join(" "));
    }
    return lines.join(" / ");
  }
}

export function bitsAndSparse(): string[] {
  const bloom = new BloomFilter(256, 3);
  const words = ["apple", "banana", "cherry", "date", "elderberry"];
  words.forEach((w) => bloom.add(w));
  const probes = ["apple", "cherry", "fig", "grape", "kiwi", "lemon", "mango"];
  const a = new BitSet().set(1).set(5).set(40);
  const b = new BitSet().set(5).set(63).set(64);
  const m = new SparseMatrix(3, 3);
  m.set(0, 0, 2);
  m.set(1, 2, -1);
  m.set(2, 1, 4);
  m.set(2, 2, 0);
  const id = new SparseMatrix(3, 3);
  for (let i = 0; i < 3; i++) id.set(i, i, 3);
  return [
    `bloom ${probes.map((p) => `${p}:${bloom.mightContain(p) ? "maybe" : "no"}`).join(" ")} bits ${bloom.popcount()}`,
    `all added found ${words.every((w) => bloom.mightContain(w))}`,
    `bitset ${a.union(b).toArray().join(",")} has40 ${a.has(40)} has41 ${a.has(41)} has999 ${a.has(999)}`,
    `sparse ${m.toString()} nnz ${m.nonZero}`,
    `sparse×3I ${m.multiply(id).toString()} ${m.multiply(m).toString()}`,
  ];
}
