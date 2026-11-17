// Design patterns corpus: modern TypeScript patterns (dependency injection, repository, pub/sub, middleware pipeline,
// retry with async/await, reducer / store, plugin registry, result types, event sourcing).

// ───── Dependency injection ─────

interface Clock {
  now(): number;
}
interface IdGenerator {
  next(prefix: string): string;
}
interface Mailer {
  send(to: string, subject: string): void;
}

class FixedClock implements Clock {
  constructor(private t: number) {}
  now(): number {
    return (this.t += 1000);
  }
}

class SequentialIds implements IdGenerator {
  private n = 0;
  next(prefix: string): string {
    return `${prefix}-${++this.n}`;
  }
}

class OutboxMailer implements Mailer {
  readonly outbox: string[] = [];
  send(to: string, subject: string): void {
    this.outbox.push(`${to}: ${subject}`);
  }
}

class SignupService {
  constructor(
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly mailer: Mailer,
  ) {}

  signup(email: string): { id: string; at: number } {
    if (!email.includes("@")) throw new Error(`invalid email: ${email}`);
    const id = this.ids.next("user");
    this.mailer.send(email, `welcome ${id}`);
    return { id, at: this.clock.now() };
  }
}

/** A tiny container: factories by token, singletons cached. */
class Container {
  private readonly factories = new Map<string, () => unknown>();
  private readonly singletons = new Map<string, unknown>();
  register(token: string, factory: () => unknown): void {
    this.factories.set(token, factory);
  }
  resolve(token: string): unknown {
    if (this.singletons.has(token)) return this.singletons.get(token);
    const f = this.factories.get(token);
    if (!f) throw new Error(`no provider for ${token}`);
    const v = f();
    this.singletons.set(token, v);
    return v;
  }
}

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function dependencyInjection(): string[] {
  try {
    return dependencyInjectionLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function dependencyInjectionLines(): string[] {
  const mailer = new OutboxMailer();
  const service = new SignupService(new FixedClock(1_700_000_000_000), new SequentialIds(), mailer);
  const users = ["ann@example.com", "bob@example.com"].map((e) => service.signup(e));
  let error = "";
  try {
    service.signup("nope");
  } catch (e) {
    error = (e as Error).message;
  }
  const container = new Container();
  let built = 0;
  container.register("greeting", () => {
    built++;
    return "hello";
  });
  const g1 = container.resolve("greeting");
  const g2 = container.resolve("greeting");
  let missing = "";
  try {
    container.resolve("db");
  } catch (e) {
    missing = (e as Error).message;
  }
  return [
    users.map((u) => `${u.id}@${u.at}`).join(" "),
    `outbox ${mailer.outbox.join(" | ")}`,
    `error ${error}`,
    `container ${typeof g1 === "string" ? g1 : "?"} ${typeof g1 === "string" && typeof g2 === "string" && g1 === g2} built ${built} ${missing}`,
  ];
}

// ───── Repository ─────

interface Entity {
  id: number;
}

interface Product extends Entity {
  name: string;
  price: number;
  tags: string[];
}

type NewProduct = Omit<Product, "id">;

interface ProductRepository {
  add(item: NewProduct): Product;
  get(id: number): Product | undefined;
  update(id: number, patch: Partial<NewProduct>): boolean;
  remove(id: number): boolean;
  all(): Product[];
}

class InMemoryProducts implements ProductRepository {
  private readonly rows = new Map<number, Product>();
  private nextId = 1;
  add(item: Omit<Product, "id">): Product {
    const row: Product = { id: this.nextId++, name: item.name, price: item.price, tags: [...item.tags] };
    this.rows.set(row.id, row);
    return row;
  }
  get(id: number): Product | undefined {
    return this.rows.get(id);
  }
  update(id: number, patch: Partial<Omit<Product, "id">>): boolean {
    const row = this.rows.get(id);
    if (!row) return false;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.price !== undefined) row.price = patch.price;
    if (patch.tags !== undefined) row.tags = patch.tags;
    return true;
  }
  remove(id: number): boolean {
    return this.rows.delete(id);
  }
  all(): Product[] {
    return [...this.rows.values()];
  }
  where(pred: (p: Product) => boolean): Product[] {
    return this.all().filter(pred);
  }
}

export function repository(): string[] {
  const repo = new InMemoryProducts();
  repo.add({ name: "lamp", price: 30, tags: ["home"] });
  const desk = repo.add({ name: "desk", price: 250, tags: ["home", "office"] });
  repo.add({ name: "pen", price: 2.5, tags: ["office"] });
  repo.update(desk.id, { price: 199.99 });
  const updatedMissing = repo.update(99, { name: "ghost" });
  repo.remove(1);
  const office = repo.where((p) => p.tags.includes("office")).map((p) => `${p.name}:${p.price}`);
  return [
    `all ${repo.all().map((p) => `${p.id}.${p.name}`).join(" ")}`,
    `office ${office.join(" ")} missing update ${updatedMissing} get(1) ${repo.get(1)?.name ?? "gone"}`,
    `total ${repo.all().reduce((s, p) => s + p.price, 0)}`,
  ];
}

// ───── Pub / sub with topics and wildcards ─────

class PubSub {
  private subs: { pattern: string; id: number; fn: (topic: string, data: string) => void }[] = [];
  private seq = 0;
  subscribe(pattern: string, fn: (topic: string, data: string) => void): number {
    this.subs.push({ pattern, id: ++this.seq, fn });
    return this.seq;
  }
  unsubscribe(id: number): void {
    this.subs = this.subs.filter((s) => s.id !== id);
  }
  publish(topic: string, data: string): number {
    let n = 0;
    for (const s of this.subs) {
      if (PubSub.matches(s.pattern, topic)) {
        s.fn(topic, data);
        n++;
      }
    }
    return n;
  }
  static matches(pattern: string, topic: string): boolean {
    const p = pattern.split(".");
    const t = topic.split(".");
    for (let i = 0; i < p.length; i++) {
      if (p[i] === "#") return true;
      if (i >= t.length) return false;
      if (p[i] !== "*" && p[i] !== t[i]) return false;
    }
    return p.length === t.length;
  }
}

export function pubSub(): string[] {
  const bus = new PubSub();
  const got: string[] = [];
  bus.subscribe("orders.*", (t, d) => got.push(`A ${t}=${d}`));
  const b = bus.subscribe("orders.created", (t, d) => got.push(`B ${t}=${d}`));
  bus.subscribe("#", (t) => got.push(`audit ${t}`));
  bus.subscribe("users.*.login", (t, d) => got.push(`C ${d}`));
  const counts = [bus.publish("orders.created", "#1"), bus.publish("users.42.login", "ann"), bus.publish("orders.paid.late", "#2")];
  bus.unsubscribe(b);
  counts.push(bus.publish("orders.created", "#3"));
  return [...got, `counts ${counts.join(",")}`];
}

// ───── Middleware pipeline (Express / Koa style) ─────

interface Req {
  path: string;
  headers: Record<string, string>;
  user?: string;
}
interface Res {
  status: number;
  body: string;
  log: string[];
}
type Next = () => void;
type Middleware = (req: Req, res: Res, next: Next) => void;

function compose(middlewares: Middleware[]): (req: Req, res: Res) => void {
  return (req, res) => {
    const dispatch = (i: number): void => {
      const mw = middlewares[i];
      if (!mw) return;
      mw(req, res, () => dispatch(i + 1));
    };
    dispatch(0);
  };
}

const logger: Middleware = (req, res, next) => {
  res.log.push(`→ ${req.path}`);
  next();
  res.log.push(`← ${res.status}`);
};

const auth: Middleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (token === undefined) {
    res.status = 401;
    res.body = "unauthorized";
    return;
  }
  req.user = token.replace("Bearer ", "");
  next();
};

const router: Middleware = (req, res) => {
  if (req.path === "/me") {
    res.status = 200;
    res.body = `hello ${req.user}`;
  } else {
    res.status = 404;
    res.body = "not found";
  }
};

export function middleware(): string[] {
  const app = compose([logger, auth, router]);
  const requests: Req[] = [
    { path: "/me", headers: { authorization: "Bearer ann" } },
    { path: "/me", headers: {} },
    { path: "/admin", headers: { authorization: "Bearer bob" } },
  ];
  return requests.map((req) => {
    const res: Res = { status: 0, body: "", log: [] };
    app(req, res);
    return `${res.status} ${res.body} [${res.log.join(" ")}]`;
  });
}

// ───── Reducer / store (Redux style) ─────

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface AppState {
  todos: Todo[];
  filter: "all" | "active" | "done";
  nextId: number;
}

type Action =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number }
  | { type: "remove"; id: number }
  | { type: "filter"; filter: AppState["filter"] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "add":
      return { ...state, todos: [...state.todos, { id: state.nextId, text: action.text, done: false }], nextId: state.nextId + 1 };
    case "toggle":
      return { ...state, todos: state.todos.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) };
    case "remove":
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "filter":
      return { ...state, filter: action.filter };
  }
}

class Store {
  private listeners: ((s: AppState) => void)[] = [];
  constructor(private state: AppState) {}
  getState(): AppState {
    return this.state;
  }
  dispatch(a: Action): void {
    const next = reducer(this.state, a);
    if (next === this.state) return;
    this.state = next;
    for (const l of this.listeners) l(next);
  }
  subscribe(l: (s: AppState) => void): void {
    this.listeners.push(l);
  }
}

const visible = (s: AppState): Todo[] => s.todos.filter((t) => (s.filter === "all" ? true : s.filter === "done" ? t.done : !t.done));

export function reducerStore(): string[] {
  const store = new Store({ todos: [], filter: "all", nextId: 1 });
  let renders = 0;
  store.subscribe(() => renders++);
  const before = store.getState();
  const actions: Action[] = [
    { type: "add", text: "write tests" },
    { type: "add", text: "fix bug" },
    { type: "add", text: "ship" },
    { type: "toggle", id: 2 },
    { type: "remove", id: 1 },
    { type: "filter", filter: "active" },
  ];
  actions.forEach((a) => store.dispatch(a));
  const s = store.getState();
  return [
    `todos ${s.todos.map((t) => `${t.id}:${t.text}${t.done ? "✓" : ""}`).join(", ")}`,
    `visible(${s.filter}) ${visible(s).map((t) => t.text).join(",")} renders ${renders}`,
    `immutable ${before.todos.length} ${before !== s}`,
  ];
}

// ───── Plugin registry ─────

interface Plugin {
  name: string;
  priority?: number;
  transform(text: string): string;
}

class PluginHost {
  private readonly plugins: Plugin[] = [];
  use(p: Plugin): this {
    if (this.plugins.some((x) => x.name === p.name)) throw new Error(`plugin ${p.name} already registered`);
    this.plugins.push(p);
    this.plugins.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return this;
  }
  run(text: string): string {
    return this.plugins.reduce((acc, p) => p.transform(acc), text);
  }
  get names(): string[] {
    return this.plugins.map((p) => p.name);
  }
}

class TrimPlugin implements Plugin {
  name = "trim";
  priority?: number = 10;
  transform(text: string): string {
    return text.trim();
  }
}

// It calls code that can throw (a RangeError from BigInt / bigint `%`, or the app's own errors): a check made at
// load time catches what it doesn't expect, as an error natively can't leave a top-level initializer.
export function pluginRegistry(): string[] {
  try {
    return pluginRegistryLines();
  } catch (e) {
    return [`unexpected ${(e as Error).message}`];
  }
}

function pluginRegistryLines(): string[] {
  const host = new PluginHost();
  host
    .use(new TrimPlugin())
    .use({ name: "shout", transform: (t) => t.toUpperCase() })
    .use({ name: "exclaim", priority: -1, transform: (t) => `${t}!` })
    .use({ name: "squash", priority: 5, transform: (t) => t.split(" ").filter((w) => w.length > 0).join(" ") });
  let dup = "";
  try {
    host.use({ name: "shout", transform: (t) => t });
  } catch (e) {
    dup = (e as Error).message;
  }
  return [`order ${host.names.join(" > ")}`, host.run("   hello    plugin   world  "), dup];
}

// ───── Result type and event sourcing ─────

type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const err = <T>(error: string): Result<T> => ({ ok: false, error });

function parseAge(s: string): Result<number> {
  const n = Number(s);
  if (s.trim() === "" || Number.isNaN(n)) return err(`not a number: "${s}"`);
  if (!Number.isInteger(n) || n < 0 || n > 150) return err(`out of range: ${n}`);
  return ok(n);
}

type AccountEvent = { kind: "opened"; owner: string } | { kind: "deposited"; amount: number } | { kind: "withdrew"; amount: number };

function replay(events: AccountEvent[]): { owner: string; balance: number; history: string[] } {
  return events.reduce(
    (acc, e) => {
      switch (e.kind) {
        case "opened":
          return { ...acc, owner: e.owner, history: [...acc.history, "open"] };
        case "deposited":
          return { ...acc, balance: acc.balance + e.amount, history: [...acc.history, `+${e.amount}`] };
        case "withdrew":
          return { ...acc, balance: acc.balance - e.amount, history: [...acc.history, `-${e.amount}`] };
      }
    },
    { owner: "", balance: 0, history: [] as string[] },
  );
}

export function resultsAndEvents(): string[] {
  const ages = ["42", "abc", "", "-3", "12.5", "150"].map(parseAge).map((r) => (r.ok ? `ok(${r.value})` : `err(${r.error})`));
  const acct = replay([{ kind: "opened", owner: "ann" }, { kind: "deposited", amount: 100 }, { kind: "withdrew", amount: 30.5 }, { kind: "deposited", amount: 0.25 }]);
  return [ages.join(" "), `${acct.owner} ${acct.balance} ${acct.history.join(" ")}`];
}
