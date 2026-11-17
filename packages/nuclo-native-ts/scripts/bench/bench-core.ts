// CPU benchmark of generated code (scripts/bench/run.ts compiles it per target, optimized, and compares with bun).
// Each case returns a checksum (every target must print bun's); `run` keeps the fastest of three timings (ms).

interface Item {
  id: number;
  label: string;
  weight: number;
}

interface Shape {
  area(): number;
}

class Sq implements Shape {
  constructor(readonly side: number) {}
  area(): number {
    return this.side * this.side;
  }
}

class Circ implements Shape {
  constructor(readonly r: number) {}
  area(): number {
    return 3.14159 * this.r * this.r;
  }
}

interface ListNode {
  value: number;
  next: ListNode | null;
}

interface Row {
  id: number;
  name: string;
  score: number;
  tags: string[];
}

interface RowIn {
  id: number;
  name: string;
  score: number;
  tags: string[];
}

class Vec2 {
  constructor(
    public x: number,
    public y: number,
  ) {}
  add(o: Vec2): Vec2 {
    return new Vec2(this.x + o.x, this.y + o.y);
  }
}

// 1 at run time; the optimizer can't know it, so no loop is folded at compile time.
let scale = 1;

function intLoop(): number {
  let acc = 0;
  for (let i = 0; i < 20000000 * scale; i++) acc = (acc + i * 3) % 1000003;
  return acc;
}

function doubleMath(): number {
  let acc = 0.5;
  for (let i = 0; i < 5000000; i++) acc += Math.sqrt(i) * 0.001 + Math.sin(i * 0.01);
  return Math.round(acc);
}

function fib(n: number): number {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}

function recursion(): number {
  return fib(29 + scale);
}

function arrays(): number {
  const xs: number[] = [];
  for (let i = 0; i < 1000000; i++) xs.push(i % 1000);
  const doubled = xs.map((x) => x * 2);
  const big = doubled.filter((x) => x > 1000);
  return big.reduce((a, x) => a + x, 0);
}

function indexLoop(): number {
  const xs: number[] = [];
  for (let i = 0; i < 100000; i++) xs.push((i * 7) % 1000);
  let acc = 0;
  for (let round = 0; round < 30; round++) {
    for (let i = 0; i < xs.length; i++) {
      xs[i] = (xs[i]! + round) % 1000;
      acc += xs[i]!;
    }
  }
  return acc + xs.indexOf(999) + (xs.includes(5) ? 1 : 0);
}

function sortItems(): number {
  const items: Item[] = [];
  let seed = 7;
  for (let i = 0; i < 200000; i++) {
    seed = (seed * 31 + 11) % 100003;
    items.push({ id: i, label: `item${seed}`, weight: seed });
  }
  items.sort((a, b) => a.weight - b.weight);
  let sum = 0;
  for (let i = 0; i < items.length; i += 1000) sum += items[i]!.id;
  return sum;
}

function records(): number {
  const m: Record<string, number> = {};
  for (let i = 0; i < 200000; i++) m[`k${i}`] = i;
  let sum = 0;
  for (let i = 0; i < 200000; i += 2) sum += m[`k${i}`] ?? 0;
  for (let i = 0; i < 200000; i += 3) delete m[`k${i}`];
  for (let i = 0; i < 200000; i++) if (`k${i}` in m) sum += 1;
  return sum;
}

function mapStr(): number {
  const m = new Map<string, number>();
  for (let i = 0; i < 200000; i++) m.set(`k${i}`, i);
  let sum = 0;
  for (let i = 0; i < 200000; i += 2) sum += m.get(`k${i}`) ?? 0;
  for (let i = 0; i < 200000; i += 3) m.delete(`k${i}`);
  for (let i = 0; i < 200000; i++) if (m.has(`k${i}`)) sum += 1;
  for (const [k, v] of m) sum += k.length + v;
  return sum;
}

function mapNum(): number {
  const m = new Map<number, number>();
  for (let i = 0; i < 1000000; i++) m.set((i * 7919) % 1000003, i);
  let sum = 0;
  for (let i = 0; i < 1000000; i++) sum += m.get(i) ?? 1;
  for (let i = 0; i < 1000000; i += 2) m.delete(i);
  return sum + m.size;
}

function setNum(): number {
  const s = new Set<number>();
  for (let i = 0; i < 1000000; i++) s.add(i % 50000);
  let hits = 0;
  for (let i = 0; i < 1000000; i++) if (s.has(i % 70000)) hits++;
  return hits + s.size;
}

function setStr(): number {
  const words: string[] = [];
  for (let i = 0; i < 5000; i++) words.push(`w${i % 3000}`);
  let total = 0;
  for (let round = 0; round < 40; round++) {
    const s = new Set<string>();
    for (const w of words) s.add(w);
    for (const w of words) if (s.has(w)) total++;
    total += s.size;
  }
  return total;
}

function strings(): number {
  const parts: string[] = [];
  for (let i = 0; i < 200000; i++) parts.push(`row ${i}:${i % 7}`);
  const joined = parts.join(",");
  const back = joined.split(",");
  let total = 0;
  for (const s of back) total += s.length;
  return total;
}

function strConcat(): number {
  let total = 0;
  for (let round = 0; round < 20; round++) {
    let s = "";
    for (let i = 0; i < 20000; i++) s += String.fromCharCode(97 + (i % 26));
    total += s.length + s.charCodeAt(round * 7);
  }
  return total;
}

function strScan(): number {
  const text = "the quick brown fox jumps over the lazy dog ".repeat(2000);
  let total = 0;
  for (let round = 0; round < 10; round++) {
    let at = 0;
    while (true) {
      const i = text.indexOf("fox", at);
      if (i < 0) break;
      total += i;
      at = i + 1;
    }
    total += text.toUpperCase().length + text.split(" ").length + text.slice(round, round + 50).trim().length;
  }
  return total;
}

function numFormat(): number {
  let total = 0;
  for (let i = 0; i < 100000; i++) {
    const x = i * 1.37;
    total += String(x).length + x.toFixed(2).length + i.toString(16).length + x.toPrecision(6).length + x.toExponential(3).length;
  }
  return total;
}

function json(): number {
  const rows: Row[] = [];
  for (let i = 0; i < 20000; i++) rows.push({ id: i, name: `name ${i}`, score: i * 0.5, tags: ["a", `t${i % 10}`] });
  let total = 0;
  for (let round = 0; round < 3; round++) {
    const text = JSON.stringify(rows);
    try {
      const back = JSON.parse(text) as RowIn[];
      total += text.length + back.length + back[round]!.tags.length + back[round]!.score;
    } catch {
      total = -1;
    }
  }
  return total;
}

function dates(): number {
  const d = new Date(Date.UTC(2020, 0, 1));
  let total = 0;
  for (let i = 0; i < 200000; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    total += d.getUTCDay() + d.getUTCMonth() + (d.getUTCFullYear() % 7);
  }
  return total + d.toISOString().length;
}

function typedArrays(): number {
  const f = new Float64Array(1000000);
  const n = new Int32Array(1000000);
  const b = new Uint8Array(1000000);
  for (let i = 0; i < f.length; i++) {
    f[i] = i * 0.5;
    n[i] = i % 1000;
    b[i] = i & 255;
  }
  let total = 0;
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < f.length; i++) total += f[i]! + n[i]! + b[i]!;
  }
  return total;
}

function closures(): number {
  const fns: ((x: number) => number)[] = [];
  for (let k = 0; k < 10; k++) fns.push((x: number) => (x + k) & 1023);
  let acc = 0;
  for (let i = 0; i < 5000000; i++) acc = fns[i % 10]!(acc + i);
  return acc;
}

function dispatch(): number {
  const shapes: Shape[] = [];
  for (let i = 0; i < 1000; i++) shapes.push(i % 2 === 0 ? new Sq(i % 10) : new Circ(i % 10));
  let total = 0;
  for (let round = 0; round < 5000; round++) {
    for (const s of shapes) total += s.area();
  }
  return Math.round(total);
}

function allocation(): number {
  let head: ListNode | null = null;
  for (let i = 0; i < 1000000; i++) {
    const node: ListNode = { value: i % 100, next: head };
    head = node;
  }
  let sum = 0;
  let cur = head;
  while (cur !== null) {
    sum += cur.value;
    cur = cur.next;
  }
  return sum;
}

function objects(): number {
  let v = new Vec2(0, 0);
  const step = new Vec2(1, 2);
  for (let i = 0; i < 3000000; i++) v = v.add(step);
  return v.x + v.y;
}

// Cyclic structures (the cycle collector tracks these classes natively): a doubly linked list and a binary search
// tree with parent links, relinked in place.
class DNode {
  prev: DNode | null = null;
  next: DNode | null = null;
  constructor(public value: number) {}
}

function linkedList(): number {
  let head: DNode | null = null;
  let tail: DNode | null = null;
  const marked: DNode[] = [];
  for (let i = 0; i < 300000; i++) {
    const n = new DNode(i % 1000);
    n.prev = tail;
    if (tail !== null) tail.next = n;
    else head = n;
    tail = n;
    if (i % 3 === 0) marked.push(n);
  }
  for (const n of marked) {
    if (n.prev !== null) n.prev.next = n.next;
    else head = n.next;
    if (n.next !== null) n.next.prev = n.prev;
    else tail = n.prev;
    n.prev = null;
    n.next = null;
  }
  let sum = 0;
  for (let n = head; n !== null; n = n.next) sum += n.value;
  for (let n = tail; n !== null; n = n.prev) sum -= n.value >> 1;
  return sum;
}

class TNode {
  left: TNode | null = null;
  right: TNode | null = null;
  parent: TNode | null = null;
  constructor(public key: number) {}
}

/** The last tree built: kept alive, so the collection after the benchmark also scans a live heap. */
let keptTree: TNode | null = null;

function treeRelink(): number {
  let root: TNode | null = null;
  let seed = 12345;
  const keys: number[] = [];
  for (let i = 0; i < 100000; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const key = seed % 1000000;
    keys.push(key);
    const node = new TNode(key);
    let parent: TNode | null = null;
    let cur = root;
    while (cur !== null) {
      parent = cur;
      cur = key < cur.key ? cur.left : cur.right;
    }
    node.parent = parent;
    if (parent === null) root = node;
    else if (key < parent.key) parent.left = node;
    else parent.right = node;
  }
  // Delete every other key (CLRS, relinking parents and children).
  for (let i = 0; i < keys.length; i += 2) {
    let z = root;
    while (z !== null && z.key !== keys[i]!) z = keys[i]! < z.key ? z.left : z.right;
    if (z === null) continue;
    let y: TNode | null = null;
    if (z.left !== null && z.right !== null) {
      y = z.right;
      while (y.left !== null) y = y.left;
      z.key = y.key;
      z = y;
    }
    const child: TNode | null = z.left !== null ? z.left : z.right;
    if (child !== null) child.parent = z.parent;
    if (z.parent === null) root = child;
    else if (z === z.parent.left) z.parent.left = child;
    else z.parent.right = child;
    z.parent = null;
  }
  let sum = 0;
  const stack: TNode[] = [];
  let cur = root;
  while (cur !== null || stack.length > 0) {
    while (cur !== null) {
      stack.push(cur);
      cur = cur.left;
    }
    const n = stack.pop()!;
    sum = (sum + n.key) % 1000000007;
    cur = n.right;
  }
  keptTree = root;
  return sum;
}

function run(name: string, f: () => number): string {
  let best = 1e18;
  let check = 0;
  for (let k = 0; k < 3; k++) {
    const t0 = Date.now();
    check = f();
    const ms = Date.now() - t0;
    if (ms < best) best = ms;
  }
  return `${name} ${best} ${check}`;
}

export function benchCore(): string[] {
  scale = Date.now() > 0 ? 1 : 2;
  return [
    run("intLoop", intLoop),
    run("doubleMath", doubleMath),
    run("recursion", recursion),
    run("arrays", arrays),
    run("indexLoop", indexLoop),
    run("sortItems", sortItems),
    run("records", records),
    run("mapStr", mapStr),
    run("mapNum", mapNum),
    run("setNum", setNum),
    run("setStr", setStr),
    run("strings", strings),
    run("strConcat", strConcat),
    run("strScan", strScan),
    run("numFormat", numFormat),
    run("json", json),
    run("dates", dates),
    run("typedArrays", typedArrays),
    run("closures", closures),
    run("dispatch", dispatch),
    run("allocation", allocation),
    run("objects", objects),
    run("linkedList", linkedList),
    run("treeRelink", treeRelink),
  ];
}

export interface Check {
  name: string;
  lines: string[];
}

function allChecks(): Check[] {
  try {
    return [{ name: "core", lines: benchCore() }];
  } catch {
    return [{ name: "core", lines: ["threw"] }];
  }
}

export const checks: Check[] = allChecks();
