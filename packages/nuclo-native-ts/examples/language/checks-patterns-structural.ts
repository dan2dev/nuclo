// Design patterns corpus: structural (adapter, bridge, composite, decorator, facade, flyweight, proxy).

// ───── Adapter ─────

interface PaymentGateway {
  pay(amountCents: number, currency: string): { ok: boolean; ref: string };
}

/** A legacy SDK with an incompatible API (amounts in units, callbacks-free status codes). */
class LegacyPayPal {
  private seq = 100;
  makePayment(amount: number, cur: string): number {
    if (amount <= 0) return -1;
    return cur === "USD" || cur === "EUR" ? this.seq++ : 0;
  }
}

class PayPalAdapter implements PaymentGateway {
  constructor(private readonly legacy: LegacyPayPal) {}
  pay(amountCents: number, currency: string): { ok: boolean; ref: string } {
    const code = this.legacy.makePayment(amountCents / 100, currency);
    return code > 0 ? { ok: true, ref: `PP-${code}` } : { ok: false, ref: code === 0 ? "unsupported currency" : "invalid amount" };
  }
}

/** Function adapter: adapt a (celsius) reader to a (fahrenheit) interface. */
type Thermometer = () => number;
const celsiusSensor = (readings: number[]): Thermometer => {
  let i = 0;
  return () => readings[i++ % readings.length]!;
};
const toFahrenheit =
  (t: Thermometer): Thermometer =>
  () =>
    (t() * 9) / 5 + 32;

export function adapter(): string[] {
  const gateway: PaymentGateway = new PayPalAdapter(new LegacyPayPal());
  const results = [gateway.pay(1999, "USD"), gateway.pay(500, "JPY"), gateway.pay(0, "EUR"), gateway.pay(250, "EUR")];
  const f = toFahrenheit(celsiusSensor([0, 37, -40, 100]));
  return [
    results.map((r) => `${r.ok ? "ok" : "fail"}:${r.ref}`).join(" "),
    `fahrenheit ${[f(), f(), f(), f(), f()].join(" ")}`,
  ];
}

// ───── Bridge ─────

interface Device {
  readonly name: string;
  volume: number;
  on: boolean;
}

abstract class Remote {
  constructor(protected readonly device: Device) {}
  toggle(): string {
    this.device.on = !this.device.on;
    return `${this.device.name} ${this.device.on ? "on" : "off"}`;
  }
  volumeUp(): string {
    this.device.volume = Math.min(100, this.device.volume + 10);
    return `${this.device.name} vol ${this.device.volume}`;
  }
  abstract describe(): string;
}

class BasicRemote extends Remote {
  describe(): string {
    return `basic → ${this.device.name}`;
  }
}

class AdvancedRemote extends Remote {
  mute(): string {
    this.device.volume = 0;
    return `${this.device.name} muted`;
  }
  describe(): string {
    return `advanced → ${this.device.name} (${this.device.on ? "on" : "off"}, ${this.device.volume})`;
  }
}

export function bridge(): string[] {
  const tv: Device = { name: "TV", volume: 95, on: false };
  const radio: Device = { name: "Radio", volume: 30, on: true };
  const basic = new BasicRemote(tv);
  const adv = new AdvancedRemote(radio);
  const advTv = new AdvancedRemote(tv);
  return [basic.toggle(), basic.volumeUp(), basic.volumeUp(), adv.mute(), adv.toggle(), basic.describe(), adv.describe(), advTv.describe()];
}

// ───── Composite ─────

abstract class FsNode {
  constructor(readonly name: string) {}
  abstract size(): number;
  abstract lines(indent?: string): string[];
  count(): number {
    return 1;
  }
}

class FileNode extends FsNode {
  constructor(
    name: string,
    private readonly bytes: number,
  ) {
    super(name);
  }
  size(): number {
    return this.bytes;
  }
  lines(indent = ""): string[] {
    return [`${indent}${this.name} (${this.bytes})`];
  }
}

class DirNode extends FsNode {
  private readonly children: FsNode[] = [];
  add(node: FsNode): DirNode {
    this.children.push(node);
    return this;
  }
  size(): number {
    return this.children.reduce((sum, c) => sum + c.size(), 0);
  }
  override count(): number {
    return 1 + this.children.reduce((n, c) => n + c.count(), 0);
  }
  lines(indent = ""): string[] {
    return [`${indent}${this.name}/ [${this.size()}]`, ...this.children.flatMap((c) => c.lines(indent + "  "))];
  }
  find(pred: (n: FsNode) => boolean): string[] {
    const out: string[] = [];
    for (const c of this.children) {
      if (pred(c)) out.push(c.name);
      if (c instanceof DirNode) out.push(...c.find(pred).map((n) => `${c.name}/${n}`));
    }
    return out;
  }
}

/** Composite as plain data: a menu tree of object literals. */
interface MenuItem {
  label: string;
  price?: number;
  items?: MenuItem[];
}

function menuTotal(m: MenuItem): number {
  return (m.price ?? 0) + (m.items ?? []).reduce((s, i) => s + menuTotal(i), 0);
}

export function composite(): string[] {
  const src = new DirNode("src").add(new FileNode("main.ts", 900)).add(new FileNode("util.ts", 300)).add(new DirNode("empty"));
  const root = new DirNode("root").add(new FileNode("readme.md", 120)).add(src).add(new DirNode("assets").add(new FileNode("logo.png", 4096)));
  const menu: MenuItem = { label: "combo", items: [{ label: "burger", price: 5.5 }, { label: "sides", items: [{ label: "fries", price: 2.25 }, { label: "salad", price: 3 }] }, { label: "drink", price: 1.75 }] };
  return [
    ...root.lines(),
    `total ${root.size()} nodes ${root.count()} big ${root.find((n) => n.size() > 500).join(",")}`,
    `menu ${menuTotal(menu)}`,
  ];
}

// ───── Decorator ─────

interface DataSource {
  write(data: string): string;
  read(stored: string): string;
}

class PlainSource implements DataSource {
  write(data: string): string {
    return data;
  }
  read(stored: string): string {
    return stored;
  }
}

abstract class SourceDecorator implements DataSource {
  constructor(protected readonly inner: DataSource) {}
  write(data: string): string {
    return this.inner.write(data);
  }
  read(stored: string): string {
    return this.inner.read(stored);
  }
}

class ReverseDecorator extends SourceDecorator {
  override write(data: string): string {
    return super.write(data.split("").reverse().join(""));
  }
  override read(stored: string): string {
    return super.read(stored).split("").reverse().join("");
  }
}

class RleDecorator extends SourceDecorator {
  override write(data: string): string {
    let out = "";
    for (let i = 0; i < data.length; ) {
      let j = i;
      while (j < data.length && data.charAt(j) === data.charAt(i) && j - i < 9) j++;
      out += `${j - i}${data.charAt(i)}`;
      i = j;
    }
    return super.write(out);
  }
  override read(stored: string): string {
    const s = super.read(stored);
    let out = "";
    for (let i = 0; i + 1 < s.length; i += 2) out += s.charAt(i + 1).repeat(Number(s.charAt(i)));
    return out;
  }
}

/** Function decorators: logging, timing-free counting, retry-free caching. */
function withLogging<T, R>(name: string, fn: (x: T) => R, log: string[]): (x: T) => R {
  return (x: T): R => {
    const result = fn(x);
    log.push(`${name}(${String(x)}) = ${String(result)}`);
    return result;
  };
}

function withLogging2(name: string, fn: (a: number, b: number) => number, log: string[]): (a: number, b: number) => number {
  return (a, b) => {
    const result = fn(a, b);
    log.push(`${name}(${a}, ${b}) = ${result}`);
    return result;
  };
}

function cached(fn: (n: number) => number): { call: (n: number) => number; misses: () => number } {
  const cache = new Map<number, number>();
  let misses = 0;
  return {
    call: (n) => {
      let v = cache.get(n);
      if (v === undefined) {
        misses++;
        v = fn(n);
        cache.set(n, v);
      }
      return v;
    },
    misses: () => misses,
  };
}

export function decorator(): string[] {
  const stack: DataSource = new ReverseDecorator(new RleDecorator(new PlainSource()));
  const stored = stack.write("aaabccccdd");
  const log: string[] = [];
  const add = withLogging2("add", (a: number, b: number) => a + b, log);
  const greet = withLogging("greet", (who: string) => `hi ${who}`, log);
  add(2, 3);
  add(0.1, 0.2);
  greet("ann");
  const slowSquare = cached((n) => n * n);
  const squares = [3, 4, 3, 3, 5, 4].map((n) => slowSquare.call(n));
  return [
    `stored ${stored} read ${stack.read(stored)} plain ${new PlainSource().write("x")}`,
    ...log,
    `cached ${squares.join(",")} misses ${slowSquare.misses()}`,
  ];
}

// ───── Facade ─────

class Inventory {
  private stock = new Map<string, number>([["apple", 5], ["pear", 0], ["fig", 2]]);
  reserve(item: string, qty: number): boolean {
    const have = this.stock.get(item) ?? 0;
    if (have < qty) return false;
    this.stock.set(item, have - qty);
    return true;
  }
  left(item: string): number {
    return this.stock.get(item) ?? 0;
  }
}

class Billing {
  private readonly prices: Record<string, number> = { apple: 0.5, pear: 0.75, fig: 1.2 };
  charge(item: string, qty: number): number {
    return Math.round((this.prices[item] ?? 0) * qty * 100) / 100;
  }
}

class Shipping {
  private next = 1;
  schedule(address: string): string {
    return `SHP-${String(this.next++).padStart(3, "0")} → ${address}`;
  }
}

class OrderFacade {
  private readonly inventory = new Inventory();
  private readonly billing = new Billing();
  private readonly shipping = new Shipping();

  placeOrder(item: string, qty: number, address: string): string {
    if (!this.inventory.reserve(item, qty)) return `✗ ${item}×${qty}: out of stock (${this.inventory.left(item)} left)`;
    const total = this.billing.charge(item, qty);
    return `✓ ${item}×${qty} $${total.toFixed(2)} ${this.shipping.schedule(address)}`;
  }
}

export function facade(): string[] {
  const shop = new OrderFacade();
  return [shop.placeOrder("apple", 3, "1 Main St"), shop.placeOrder("pear", 1, "2 Oak Ave"), shop.placeOrder("fig", 2, "3 Elm Rd"), shop.placeOrder("apple", 3, "4 Pine Ln")];
}

// ───── Flyweight ─────

interface GlyphStyle {
  readonly font: string;
  readonly size: number;
  readonly bold: boolean;
}

class StyleFactory {
  private readonly pool = new Map<string, GlyphStyle>();
  created = 0;
  get(font: string, size: number, bold = false): GlyphStyle {
    const key = `${font}|${size}|${bold}`;
    let style = this.pool.get(key);
    if (!style) {
      style = { font, size, bold };
      this.pool.set(key, style);
      this.created++;
    }
    return style;
  }
  get poolSize(): number {
    return this.pool.size;
  }
}

interface Glyph {
  char: string;
  x: number;
  style: GlyphStyle;
}

export function flyweight(): string[] {
  const styles = new StyleFactory();
  const text = "Hello, flyweight world";
  const glyphs: Glyph[] = text.split("").map((char, i) => ({ char, x: i * 7, style: i < 5 ? styles.get("serif", 12, true) : styles.get("serif", 12) }));
  const heading = styles.get("sans", 24, true);
  const shared = glyphs.filter((g) => g.style === glyphs[0]!.style).length;
  return [
    `glyphs ${glyphs.length} styles ${styles.poolSize} created ${styles.created} shared-first ${shared}`,
    `same object ${styles.get("serif", 12) === glyphs[10]!.style} heading ${heading.font}/${heading.size}/${heading.bold}`,
    `widths ${glyphs.filter((g) => g.char !== " ").map((g) => g.style.size * (g.style.bold ? 1.1 : 1)).reduce((a, b) => a + b, 0).toFixed(1)}`,
  ];
}

// ───── Proxy ─────

interface ImageService {
  load(path: string): string;
}

class DiskImages implements ImageService {
  loads = 0;
  load(path: string): string {
    this.loads++;
    return `<${path}:${path.length * 1024}B>`;
  }
}

class CachingProxy implements ImageService {
  private readonly cache = new Map<string, string>();
  hits = 0;
  constructor(private readonly real: ImageService) {}
  load(path: string): string {
    const cached = this.cache.get(path);
    if (cached !== undefined) {
      this.hits++;
      return cached;
    }
    const v = this.real.load(path);
    this.cache.set(path, v);
    return v;
  }
}

class AccessProxy implements ImageService {
  constructor(
    private readonly real: ImageService,
    private readonly allowed: (path: string) => boolean,
  ) {}
  load(path: string): string {
    if (!this.allowed(path)) throw new Error(`access denied: ${path}`);
    return this.real.load(path);
  }
}

/** A lazy virtual proxy: the expensive object is made on first use. */
class LazyValue<T> {
  private value: T | undefined;
  private made = false;
  constructor(private readonly make: () => T) {}
  get(): T {
    if (!this.made) {
      this.value = this.make();
      this.made = true;
    }
    return this.value!;
  }
  get initialized(): boolean {
    return this.made;
  }
}

export function proxy(): string[] {
  const disk = new DiskImages();
  const cache = new CachingProxy(disk);
  const guarded: ImageService = new AccessProxy(cache, (p) => !p.startsWith("/private"));
  const out: string[] = [];
  for (const p of ["/img/a.png", "/img/b.png", "/img/a.png", "/private/key.png", "/img/a.png"]) {
    try {
      out.push(guarded.load(p));
    } catch (e) {
      out.push(`! ${(e as Error).message}`);
    }
  }
  let computed = 0;
  const lazy = new LazyValue(() => {
    computed++;
    return [1, 2, 3].map((x) => x * 10);
  });
  const before = lazy.initialized;
  const sum = lazy.get().reduce((a, b) => a + b, 0) + lazy.get().length;
  return [out.join(" "), `disk loads ${disk.loads} cache hits ${cache.hits}`, `lazy ${before}→${lazy.initialized} sum ${sum} computed ${computed}`];
}
