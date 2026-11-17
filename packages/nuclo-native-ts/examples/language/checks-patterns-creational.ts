// Design patterns corpus: creational (factory method, abstract factory, builder, prototype, singleton),
// each written class-based and function / object-literal based.

// ───── Factory method ─────

interface Notifier {
  readonly channel: string;
  send(to: string, text: string): string;
}

class EmailNotifier implements Notifier {
  readonly channel = "email";
  send(to: string, text: string): string {
    return `mailto:${to} «${text}»`;
  }
}

class SmsNotifier implements Notifier {
  readonly channel = "sms";
  constructor(private readonly maxLength = 20) {}
  send(to: string, text: string): string {
    const body = text.length > this.maxLength ? `${text.slice(0, this.maxLength - 1)}…` : text;
    return `sms:${to} ${body}`;
  }
}

abstract class AlertService {
  protected abstract createNotifier(): Notifier;

  alert(user: string, message: string): string {
    const notifier = this.createNotifier();
    return `[${notifier.channel}] ${notifier.send(user, message.toUpperCase())}`;
  }
}

class EmailAlerts extends AlertService {
  protected createNotifier(): Notifier {
    return new EmailNotifier();
  }
}

class SmsAlerts extends AlertService {
  protected override createNotifier(): Notifier {
    return new SmsNotifier(12);
  }
}

type NotifierKind = "email" | "sms" | "push";

function createNotifier(kind: NotifierKind): Notifier {
  switch (kind) {
    case "email":
      return new EmailNotifier();
    case "sms":
      return new SmsNotifier();
    case "push":
      return { channel: "push", send: (to, text) => `push→${to}: ${text}` };
  }
}

const registry: Record<string, () => Notifier> = {
  email: () => new EmailNotifier(),
  sms: () => new SmsNotifier(8),
};

export function factoryMethod(): string[] {
  const services: AlertService[] = [new EmailAlerts(), new SmsAlerts()];
  const kinds: NotifierKind[] = ["email", "sms", "push"];
  return [
    ...services.map((s) => s.alert("ann", "disk almost full")),
    ...kinds.map((k) => createNotifier(k).send("bob", "build #42 passed on main")),
    `registry ${Object.keys(registry).map((k) => registry[k]!().send("cid", "hello there, friend")).join(" | ")}`,
    `unknown ${registry["fax"] ? registry["fax"]().channel : "no factory"}`,
  ];
}

// ───── Abstract factory ─────

interface Button {
  render(): string;
}
interface Checkbox {
  render(checked: boolean): string;
}
interface UiFactory {
  readonly theme: string;
  button(label: string): Button;
  checkbox(): Checkbox;
}

class LightFactory implements UiFactory {
  readonly theme = "light";
  button(label: string): Button {
    return { render: () => `[ ${label} ]` };
  }
  checkbox(): Checkbox {
    return { render: (checked) => (checked ? "[x]" : "[ ]") };
  }
}

class DarkFactory implements UiFactory {
  readonly theme = "dark";
  button(label: string): Button {
    return { render: () => `▐ ${label.toUpperCase()} ▌` };
  }
  checkbox(): Checkbox {
    return { render: (checked) => (checked ? "■" : "□") };
  }
}

const asciiFactory: UiFactory = {
  theme: "ascii",
  button: (label) => ({ render: () => `<${label}>` }),
  checkbox: () => ({ render: (checked) => (checked ? "+" : "-") }),
};

function settingsForm(f: UiFactory): string {
  const ok = f.button("Save");
  const box = f.checkbox();
  return `${f.theme}: ${box.render(true)} wifi ${box.render(false)} bluetooth ${ok.render()}`;
}

export function abstractFactory(): string[] {
  return [new LightFactory(), new DarkFactory(), asciiFactory].map(settingsForm);
}

// ───── Builder ─────

interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly query: [string, string][];
  readonly body?: string;
  readonly timeoutMs: number;
}

class RequestBuilder {
  private method = "GET";
  private headers: Record<string, string> = {};
  private query: [string, string][] = [];
  private body?: string;
  private timeoutMs = 30_000;

  constructor(private readonly url: string) {}

  post(body: string): this {
    this.method = "POST";
    this.body = body;
    return this.header("content-type", "application/json");
  }

  header(name: string, value: string): this {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  param(key: string, value: string | number | boolean): this {
    this.query.push([key, String(value)]);
    return this;
  }

  timeout(ms: number): this {
    if (ms <= 0) throw new Error(`invalid timeout ${ms}`);
    this.timeoutMs = ms;
    return this;
  }

  build(): HttpRequest {
    if (!this.url.startsWith("http")) throw new Error(`bad url ${this.url}`);
    const headers: Record<string, string> = {};
    for (const k in this.headers) headers[k] = this.headers[k]!;
    return { method: this.method, url: this.url, headers, query: [...this.query], body: this.body, timeoutMs: this.timeoutMs };
  }
}

function describeRequest(r: HttpRequest): string {
  const encode = (s: string) => s.replaceAll("%", "%25").replaceAll(" ", "%20").replaceAll("&", "%26").replaceAll("=", "%3D");
  const qs = r.query.map(([k, v]) => `${encode(k)}=${encode(v)}`).join("&");
  const headers = Object.keys(r.headers).sort().map((k) => `${k}: ${r.headers[k]}`).join("; ");
  return `${r.method} ${r.url}${qs ? `?${qs}` : ""} {${headers}} body=${r.body ?? "none"} timeout=${r.timeoutMs}`;
}

/** Functional builder: each step returns a new immutable configuration. */
interface Pizza {
  size: "S" | "M" | "L";
  crust: string;
  toppings: string[];
}

interface PizzaBuilder {
  size(size: Pizza["size"]): PizzaBuilder;
  crust(crust: string): PizzaBuilder;
  top(...toppings: string[]): PizzaBuilder;
  done(): Pizza;
}

const pizza = (p: Pizza = { size: "M", crust: "thin", toppings: [] }): PizzaBuilder => ({
  size: (size) => pizza({ ...p, size }),
  crust: (crust) => pizza({ ...p, crust }),
  top: (...toppings) => pizza({ ...p, toppings: [...p.toppings, ...toppings] }),
  done: () => p,
});

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function builder(): string[] {
  try {
    return builderLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function builderLines(): string[] {
  const get = new RequestBuilder("https://api.example.com/search").param("q", "red shoes").param("page", 2).param("exact", true).header("Accept", "text/html").timeout(5000).build();
  const post = new RequestBuilder("https://api.example.com/items").post('{"name":"x"}').header("X-Trace", "abc").build();
  const errors: string[] = [];
  const attempt = (make: () => HttpRequest) => {
    try {
      make();
    } catch (e) {
      errors.push((e as Error).message);
    }
  };
  attempt(() => new RequestBuilder("ftp://nope").build());
  attempt(() => new RequestBuilder("https://x").timeout(-1).build());
  const margherita = pizza().size("L").top("tomato", "mozzarella").top("basil").done();
  const plain = pizza().crust("thick").done();
  return [
    describeRequest(get),
    describeRequest(post),
    `errors ${errors.join(" / ")}`,
    `pizza ${margherita.size} ${margherita.crust} ${margherita.toppings.join("+")} / ${plain.size} ${plain.crust} ${plain.toppings.length}`,
  ];
}

// ───── Prototype ─────

interface Shape {
  kind: string;
  x: number;
  y: number;
  color: string;
  tags: string[];
}

function cloneShape(s: Shape): Shape {
  return { ...s, tags: [...s.tags] };
}

class Enemy {
  constructor(
    public name: string,
    public hp: number,
    public position: { x: number; y: number },
    public loot: string[],
  ) {}

  clone(): Enemy {
    return new Enemy(this.name, this.hp, { ...this.position }, [...this.loot]);
  }

  toString(): string {
    return `${this.name}(${this.hp}hp @${this.position.x},${this.position.y} loot=${this.loot.join("/") || "-"})`;
  }
}

class PrototypeRegistry {
  private readonly prototypes = new Map<string, Enemy>();
  register(key: string, proto: Enemy): void {
    this.prototypes.set(key, proto);
  }
  spawn(key: string, x: number, y: number): Enemy | undefined {
    const proto = this.prototypes.get(key);
    if (!proto) return undefined;
    const e = proto.clone();
    e.position.x = x;
    e.position.y = y;
    return e;
  }
}

export function prototype(): string[] {
  const base: Shape = { kind: "circle", x: 0, y: 0, color: "red", tags: ["ui"] };
  const copy = cloneShape(base);
  copy.x = 10;
  copy.tags.push("copy");
  const shallow = { ...base };
  shallow.tags.push("shared!");
  const reg = new PrototypeRegistry();
  reg.register("orc", new Enemy("Orc", 30, { x: 0, y: 0 }, ["axe"]));
  reg.register("bat", new Enemy("Bat", 5, { x: 0, y: 0 }, []));
  const orc1 = reg.spawn("orc", 3, 4)!;
  const orc2 = reg.spawn("orc", 7, 1)!;
  orc2.loot.push("gold");
  orc2.hp -= 12;
  return [
    `base ${base.x} ${base.tags.join(",")} copy ${copy.x} ${copy.tags.join(",")}`,
    `${orc1.toString()} ${orc2.toString()} ${reg.spawn("bat", 1, 1)?.toString()} ${reg.spawn("dragon", 0, 0)?.toString() ?? "no dragon"}`,
    `distinct ${orc1 !== orc2} ${orc1.position !== orc2.position}`,
  ];
}

// ───── Singleton ─────

class Logger {
  private static instance: Logger | null = null;
  private static created = 0;
  private readonly lines: string[] = [];

  private constructor(readonly prefix: string) {
    Logger.created++;
  }

  static get(): Logger {
    if (Logger.instance === null) Logger.instance = new Logger("app");
    return Logger.instance;
  }

  static get instances(): number {
    return Logger.created;
  }

  log(msg: string): number {
    return this.lines.push(`${this.prefix}#${this.lines.length + 1} ${msg}`);
  }

  dump(): string {
    return this.lines.join(" | ");
  }
}

/** Module-level singleton through a closure (the "module pattern"). */
const config = (() => {
  const values = new Map<string, string>([["env", "test"]]);
  let reads = 0;
  return {
    get(key: string): string | undefined {
      reads++;
      return values.get(key);
    },
    set(key: string, value: string): void {
      values.set(key, value);
    },
    reads(): number {
      return reads;
    },
  };
})();

let lazyCache: number[] | undefined;
function primesTable(): number[] {
  lazyCache ??= [2, 3, 5, 7, 11, 13];
  return lazyCache;
}

export function singleton(): string[] {
  const a = Logger.get();
  const b = Logger.get();
  a.log("boot");
  b.log("ready");
  config.set("region", "eu");
  return [
    `same ${a === b} instances ${Logger.instances} ${a.dump()}`,
    `config ${config.get("env")} ${config.get("region")} ${config.get("missing") ?? "-"} reads ${config.reads()}`,
    `lazy ${primesTable() === primesTable()} ${primesTable().length}`,
  ];
}
