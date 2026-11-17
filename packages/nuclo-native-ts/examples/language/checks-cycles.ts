/**
 * Reference cycles (README "Memory"): what Swift (ARC) and Rust (Rc) could never free is rejected; these patterns
 * compile because no object can reach itself, or (closures kept in a field of the object they capture, and only
 * called through it) because the closure takes the object as a parameter instead of keeping it.
 */

// ───────────── A closure in a field of the object it captures, only ever called through that field ─────────────

class CyCounter {
  n = 0;
  readonly step: number;
  tick: () => void;
  add: (by: number) => number;
  onReset: ((was: number) => string) | null = null;
  constructor(step: number) {
    this.step = step;
    this.tick = () => {
      this.n += this.step;
    };
    this.add = (by: number) => {
      this.n += by;
      return this.n;
    };
  }
  armReset(label: string): void {
    this.onReset = (was: number) => {
      const before = this.n;
      this.n = 0;
      return `${label} ${was}→${this.n} (was ${before})`;
    };
  }
  twice(): void {
    this.tick();
    this.tick();
  }
}

class CyBox {
  readonly counter: CyCounter;
  constructor(step: number) {
    this.counter = new CyCounter(step);
  }
}

class CyMeter {
  readings: number[] = [];
  scale = 2;
  record: (v: number) => void;
  // A function from outside, which doesn't capture the object: stored as it is.
  format: (v: number) => string;
  constructor(format: (v: number) => string) {
    this.format = format;
    this.record = (v: number) => {
      // Nested closures see the object too.
      this.readings.push(v);
      this.readings = this.readings.map((r) => r * this.scale).filter((r) => r < 1000);
    };
  }
}

function cyUnit(v: number): string {
  return `${v} u`;
}

interface CyPanel {
  title: string;
  render: (() => string) | null;
}

export function cyOwnedClosures(): string[] {
  const c = new CyCounter(3);
  c.tick();
  c.twice();
  const ticked = c.n;
  const added = c.add(10);
  const before = c.onReset?.(1) ?? "no reset yet";
  c.armReset("reset");
  const reset = c.onReset?.(c.n) ?? "none";
  const box = new CyBox(5);
  box.counter.tick();
  box.counter.tick();
  const meter = new CyMeter(cyUnit);
  meter.record(4);
  meter.record(100);
  meter.record(300);
  const shown = meter.readings.map((r) => meter.format(r)).join(", ");
  const meter2 = new CyMeter((v: number) => `${v}!`);
  meter2.record(1);
  const panel: CyPanel = { title: "stats", render: null };
  panel.render = () => `${panel.title}: ${ticked}`;
  const counters: CyCounter[] = [];
  for (let i = 1; i <= 3; i++) counters.push(new CyCounter(i));
  for (const k of counters) k.twice();
  return [
    `after tick, twice: ${ticked}; add(10) = ${added}; now ${c.n}`,
    before,
    reset,
    `box counter ${box.counter.n}`,
    `meter ${shown}; meter2 ${meter2.format(meter2.readings[0] ?? 0)}`,
    panel.render?.() ?? "no render",
    `counters ${counters.map((k) => k.n).join(" ")}`,
  ];
}

// ───────────── Linked structures where every link points at an older object ─────────────

class CyNode {
  next: CyNode | null = null;
  constructor(readonly value: number) {}
  prepend(value: number): CyNode {
    const node = new CyNode(value);
    node.next = this;
    return node;
  }
}

function cyListOf(values: number[]): CyNode | null {
  let head: CyNode | null = null;
  for (let i = values.length - 1; i >= 0; i--) {
    const node = new CyNode(values[i]!);
    node.next = head;
    head = node;
  }
  return head;
}

function cyShow(head: CyNode | null): string {
  const out: number[] = [];
  for (let at = head; at !== null; at = at.next) out.push(at.value);
  return out.join("→");
}

interface CyCell {
  label: string;
  rest: CyCell | null;
}

function cyCons(label: string, rest: CyCell | null): CyCell {
  return { label: label, rest: rest };
}

export function cyLists(): string[] {
  const list = new CyNode(3).prepend(2).prepend(1);
  const built = cyListOf([10, 20, 30, 40]);
  let cells: CyCell | null = null;
  for (const word of ["c", "b", "a"]) cells = cyCons(word, cells);
  const labels: string[] = [];
  for (let at = cells; at !== null; at = at.rest) labels.push(at.label);
  return [cyShow(list), cyShow(built), labels.join(" "), `shared tail: ${cyShow(new CyNode(0).prepend(-1).next)}`];
}

// ───────────── Trees: children made before (or as) they are added ─────────────

interface CyEntry {
  name: string;
  size: number;
  children: CyEntry[];
}

function cyFile(name: string, size: number): CyEntry {
  return { name: name, size: size, children: [] };
}

function cyFolder(name: string, children: CyEntry[]): CyEntry {
  return { name: name, size: 0, children: children };
}

function cyTotal(e: CyEntry): number {
  return e.children.reduce((sum, c) => sum + cyTotal(c), e.size);
}

class CyTree {
  readonly kids: CyTree[];
  constructor(readonly label: string, kids: CyTree[] = []) {
    this.kids = kids.slice();
  }
  add(kid: CyTree): CyTree {
    this.kids.push(kid);
    return this;
  }
  grow(label: string): CyTree {
    const kid = new CyTree(label);
    this.kids.push(kid);
    return kid;
  }
  describe(): string {
    return this.kids.length ? `${this.label}(${this.kids.map((k) => k.describe()).join(" ")})` : this.label;
  }
}

export function cyTrees(): string[] {
  const parts: CyEntry[] = [];
  for (let i = 1; i <= 3; i++) parts.push(cyFile(`part${i}`, i * 100));
  const root = cyFolder("root", [cyFile("a.txt", 5), cyFolder("parts", parts), cyFolder("empty", [])]);
  // A subtree is made with its children; leaves are added to an existing tree.
  const tree = new CyTree("t", [new CyTree("x"), new CyTree("y", [new CyTree("z")])]);
  tree.add(new CyTree("u"));
  const leaf = tree.grow("w").grow("v");
  return [`${cyTotal(root)} bytes in ${root.children.length} entries`, tree.describe(), leaf.label, tree.add(new CyTree("s")).describe()];
}

// ───────────── Closures that keep other objects ─────────────

interface CyLog {
  lines: string[];
}

class CyBus {
  private listeners: ((msg: string) => void)[] = [];
  on(listener: (msg: string) => void): void {
    this.listeners.push(listener);
  }
  emit(msg: string): number {
    for (const l of this.listeners) l(msg);
    return this.listeners.length;
  }
}

export function cyClosures(): string[] {
  const log: CyLog = { lines: [] };
  const bus = new CyBus();
  bus.on((m: string) => log.lines.push(`a:${m}`));
  const counter = new CyCounter(1);
  bus.on((m: string) => {
    counter.tick();
    log.lines.push(`b:${m}#${counter.n}`);
  });
  const sent = bus.emit("hi") + bus.emit("yo");
  let last = "";
  const remember = (m: string) => {
    last = m;
  };
  bus.on(remember);
  bus.emit("bye");
  return [log.lines.join(" "), `${sent} deliveries, last ${last}`];
}

// ───────────── Back-pointers to the owner, read while the owner drives (weak natively) ─────────────

class CyCart {
  items: CyItem[] = [];
  total = 0;
  log: string[] = [];
  add(name: string, price: number): void {
    const item = new CyItem(name, price);
    item.cart = this;
    this.items.push(item);
  }
  addGift(name: string): void {
    this.items.push(new CyItem(name, 0, this));
  }
  reprice(): number {
    this.total = 0;
    for (const item of this.items) item.report();
    this.items.forEach((item) => item.note("seen"));
    return this.total;
  }
  drop(name: string): void {
    this.items = this.items.filter((i) => i.name !== name);
  }
}

class CyItem {
  cart: CyCart | null = null;
  constructor(
    readonly name: string,
    readonly price: number,
    owner: CyCart | null = null,
  ) {
    this.cart = owner;
  }
  report(): void {
    if (this.cart !== null) this.cart.total += this.price;
    this.note("priced");
  }
  note(what: string): void {
    this.cart?.log.push(`${this.name} ${what}`);
  }
}

class CyDir {
  parent: CyDir | null = null;
  children: CyDir[] = [];
  constructor(readonly name: string) {}
  mkdir(name: string): void {
    const dir = new CyDir(name);
    dir.parent = this;
    this.children.push(dir);
  }
  child(name: string): CyDir | null {
    return this.children.find((c) => c.name === name) ?? null;
  }
  list(): string[] {
    const out: string[] = [];
    for (const c of this.children) for (const line of c.describe()) out.push(line);
    return out;
  }
  describe(): string[] {
    return [`${this.parent?.name ?? "-"}/${this.name}`, ...this.list()];
  }
}

export function cyBackPointers(): string[] {
  const cart = new CyCart();
  cart.add("tea", 3);
  cart.add("cup", 5);
  cart.addGift("card");
  const first = cart.reprice();
  cart.drop("tea");
  const second = cart.reprice();
  const root = new CyDir("root");
  root.mkdir("src");
  root.mkdir("docs");
  const src = root.child("src");
  if (src !== null) src.mkdir("lib");
  return [`${first} then ${second}; ${cart.items.length} items`, cart.log.join(", "), root.list().join(" ")];
}

// ───────────── Many short-lived objects of the patterns above (a native leak test runs this in a loop) ─────────────

export function cyChurn(rounds: number): number {
  let total = 0;
  for (let i = 0; i < rounds; i++) {
    const c = new CyCounter(1);
    c.twice();
    c.armReset("r");
    total += c.add(1) + (c.onReset?.(0) ?? "").length;
    const meter = new CyMeter(cyUnit);
    meter.record(i % 7);
    total += meter.readings.length;
    const panel: CyPanel = { title: "p", render: null };
    panel.render = () => panel.title;
    total += (panel.render?.() ?? "").length;
    total += cyShow(new CyNode(3).prepend(2).prepend(1)).length + cyShow(cyListOf([1, 2])).length;
    total += new CyTree("t", [new CyTree("a")]).add(new CyTree("b")).kids.length;
    const cart = new CyCart();
    cart.add("x", 1);
    cart.addGift("y");
    total += cart.reprice() + cart.log.length;
    const dir = new CyDir("r");
    dir.mkdir("a");
    const a = dir.child("a");
    if (a !== null) a.mkdir("b");
    total += dir.list().length;
  }
  return total;
}

export function cyLeakCheck(): string[] {
  return [`churn ${cyChurn(100)}`];
}
