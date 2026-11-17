/**
 * The 23 GoF design patterns, plus a few common ones, written in the TypeScript subset that
 * nuclo-native-ts compiles to Swift, Kotlin and Rust: no classes, `this`, generics, enums or
 * unions other than `T | null` and string literals. Objects are interfaces whose methods are
 * function-typed fields, and private state is a local captured by those closures.
 *
 * Every demo returns the lines it prints, so the same text can be compared across targets.
 */

// ───────────────────────────── Creational ─────────────────────────────

// Singleton: one lazily created instance behind an accessor.
interface AppConfig {
  name: string;
  reads: number;
}
let configInstance: AppConfig | null = null;
function getConfig(): AppConfig {
  if (configInstance === null) configInstance = { name: "nuclo", reads: 0 };
  configInstance.reads += 1;
  return configInstance;
}
export function singleton(): string[] {
  configInstance = null;
  const a = getConfig();
  const b = getConfig();
  return [`same instance: ${a === b}`, `${b.name} read ${b.reads} times`];
}

// Factory Method: the creator decides which product to make.
interface Transport {
  name: string;
  deliver: (km: number) => string;
}
interface Logistics {
  createTransport: () => Transport;
}
function planDelivery(logistics: Logistics, km: number): string {
  const transport = logistics.createTransport();
  return `${transport.name}: ${transport.deliver(km)}`;
}
const roadLogistics: Logistics = {
  createTransport: () => ({ name: "truck", deliver: (km: number) => `${km} km by road, ${Math.ceil(km / 80)} h` }),
};
const seaLogistics: Logistics = {
  createTransport: () => ({ name: "ship", deliver: (km: number) => `${km} km by sea, ${Math.ceil(km / 30)} h` }),
};
export function factoryMethod(): string[] {
  return [planDelivery(roadLogistics, 400), planDelivery(seaLogistics, 400)];
}

// Abstract Factory: a family of related products from one factory.
interface Widget {
  render: () => string;
}
interface WidgetKit {
  kitName: string;
  button: (label: string) => Widget;
  checkbox: (on: boolean) => Widget;
}
const materialKit: WidgetKit = {
  kitName: "material",
  button: (label: string) => ({ render: () => `[${label.toUpperCase()}]` }),
  checkbox: (on: boolean) => ({ render: () => (on ? "☑" : "☐") }),
};
const cupertinoKit: WidgetKit = {
  kitName: "cupertino",
  button: (label: string) => ({ render: () => `(${label})` }),
  checkbox: (on: boolean) => ({ render: () => (on ? "◉" : "○") }),
};
function buildForm(kit: WidgetKit): string {
  return `${kit.kitName}: ${kit.button("Save").render()} ${kit.checkbox(true).render()} remember me`;
}
export function abstractFactory(): string[] {
  return [buildForm(materialKit), buildForm(cupertinoKit)];
}

// Builder: a fluent builder whose steps return the builder itself.
interface Pizza {
  size: string;
  toppings: string[];
  extraCheese: boolean;
}
interface PizzaBuilder {
  size: (size: string) => PizzaBuilder;
  topping: (topping: string) => PizzaBuilder;
  cheese: () => PizzaBuilder;
  build: () => Pizza;
}
function pizzaBuilder(): PizzaBuilder {
  let size = "medium";
  const toppings: string[] = [];
  let cheese = false;
  // A builder can't return `this`, so its steps return the object through a holder set once it exists.
  let holder: PizzaBuilder | null = null;
  const me = (): PizzaBuilder => holder!;
  const builder: PizzaBuilder = {
    size: (s: string) => {
      size = s;
      return me();
    },
    topping: (t: string) => {
      toppings.push(t);
      return me();
    },
    cheese: () => {
      cheese = true;
      return me();
    },
    build: () => ({ size: size, toppings: toppings.slice(), extraCheese: cheese }),
  };
  holder = builder;
  return builder;
}
function describePizza(pizza: Pizza): string {
  return `${pizza.size} pizza with ${pizza.toppings.join(", ")}${pizza.extraCheese ? " and extra cheese" : ""}`;
}
export function builder(): string[] {
  const pizza = pizzaBuilder().size("large").topping("mushroom").topping("olive").cheese().build();
  const plain = pizzaBuilder().topping("tomato").build();
  return [describePizza(pizza), describePizza(plain)];
}

// Prototype: new objects are deep copies of registered prototypes.
interface Monster {
  kind: string;
  hp: number;
  skills: string[];
}
function cloneMonster(proto: Monster): Monster {
  return { kind: proto.kind, hp: proto.hp, skills: proto.skills.slice() };
}
const monsterPrototypes: Record<string, Monster> = {
  goblin: { kind: "goblin", hp: 30, skills: ["stab"] },
  dragon: { kind: "dragon", hp: 500, skills: ["fly", "breathe fire"] },
};
function spawn(kind: string): Monster | null {
  const proto = monsterPrototypes[kind];
  return proto ? cloneMonster(proto) : null;
}
export function prototypePattern(): string[] {
  const boss = spawn("dragon");
  const missing = spawn("unicorn");
  if (boss === null) return ["no dragon"];
  boss.hp += 250;
  boss.skills.push("roar");
  const proto = monsterPrototypes["dragon"];
  return [
    `clone: ${boss.kind} hp ${boss.hp}, ${boss.skills.join(" / ")}`,
    `prototype untouched: hp ${proto ? proto.hp : 0}, ${proto ? proto.skills.length : 0} skills`,
    `unknown kind gives ${missing === null ? "null" : "a monster"}`,
  ];
}

// ───────────────────────────── Structural ─────────────────────────────

// Adapter: a Fahrenheit sensor used where a Celsius thermometer is expected.
interface Thermometer {
  celsius: () => number;
}
interface FahrenheitSensor {
  readFahrenheit: () => number;
}
function adaptSensor(sensor: FahrenheitSensor): Thermometer {
  return { celsius: () => Math.round(((sensor.readFahrenheit() - 32) * 5) / 9) };
}
function report(thermometer: Thermometer): string {
  return `${thermometer.celsius()} °C`;
}
export function adapter(): string[] {
  const legacy: FahrenheitSensor = { readFahrenheit: () => 98.6 };
  return [`legacy sensor reads 98.6 °F`, `adapted: ${report(adaptSensor(legacy))}`];
}

// Bridge: shapes (abstraction) and renderers (implementation) vary independently.
interface Renderer {
  circle: (radius: number) => string;
}
interface Shape {
  draw: () => string;
  scale: (factor: number) => void;
}
const vectorRenderer: Renderer = { circle: (r: number) => `vector circle r=${r}` };
const rasterRenderer: Renderer = { circle: (r: number) => `raster circle ${Math.round(r * 2)}×${Math.round(r * 2)} px` };
function circleShape(radius: number, renderer: Renderer): Shape {
  let r = radius;
  return {
    draw: () => renderer.circle(r),
    scale: (factor: number) => {
      r = r * factor;
    },
  };
}
export function bridge(): string[] {
  const a = circleShape(5, vectorRenderer);
  const b = circleShape(5, rasterRenderer);
  a.scale(2.5);
  b.scale(2.5);
  return [a.draw(), b.draw()];
}

// Composite: files and folders answer the same questions recursively.
interface FsEntry {
  name: string;
  bytes: number;
  children: FsEntry[];
}
function file(name: string, bytes: number): FsEntry {
  return { name: name, bytes: bytes, children: [] };
}
function folder(name: string, children: FsEntry[]): FsEntry {
  return { name: name, bytes: 0, children: children };
}
function totalBytes(entry: FsEntry): number {
  let sum = entry.bytes;
  for (const child of entry.children) sum += totalBytes(child);
  return sum;
}
function describeTree(entry: FsEntry, indent: string): string[] {
  const lines = [`${indent}${entry.name} (${totalBytes(entry)} B)`];
  for (const child of entry.children) {
    for (const line of describeTree(child, `${indent}  `)) lines.push(line);
  }
  return lines;
}
export function composite(): string[] {
  const root = folder("src", [file("main.ts", 1200), folder("ui", [file("button.ts", 300), file("list.ts", 450)]), file("README.md", 80)]);
  return describeTree(root, "");
}

// Decorator: wrappers that add behaviour while keeping the interface.
interface Coffee {
  cost: () => number;
  describe: () => string;
}
const espresso: Coffee = { cost: () => 2, describe: () => "espresso" };
function withMilk(coffee: Coffee): Coffee {
  return { cost: () => coffee.cost() + 0.5, describe: () => `${coffee.describe()} + milk` };
}
function withSyrup(coffee: Coffee, flavor: string): Coffee {
  return { cost: () => coffee.cost() + 0.75, describe: () => `${coffee.describe()} + ${flavor} syrup` };
}
// A function decorator: wraps a function and counts its calls.
let squareCalls = 0;
function counted(fn: (n: number) => number): (n: number) => number {
  return (n: number) => {
    squareCalls += 1;
    return fn(n);
  };
}
export function decorator(): string[] {
  const order = withSyrup(withMilk(withMilk(espresso)), "vanilla");
  squareCalls = 0;
  const square = counted((n: number) => n * n);
  const sum = square(3) + square(4);
  return [`${order.describe()}: $${order.cost().toFixed(2)}`, `square(3) + square(4) = ${sum}, ${squareCalls} calls`];
}

// Facade: one call drives several subsystems.
interface Amplifier {
  on: () => string;
  volume: (level: number) => string;
}
interface Projector {
  on: () => string;
  input: (source: string) => string;
}
interface Lights {
  dim: (percent: number) => string;
}
const amp: Amplifier = { on: () => "amp on", volume: (level: number) => `volume ${level}` };
const projector: Projector = { on: () => "projector on", input: (source: string) => `input ${source}` };
const lights: Lights = { dim: (percent: number) => `lights ${percent}%` };
function watchMovie(title: string): string[] {
  return [lights.dim(10), projector.on(), projector.input("hdmi"), amp.on(), amp.volume(7), `playing “${title}”`];
}
export function facade(): string[] {
  return [watchMovie("Arrival").join(" → ")];
}

// Flyweight: shared intrinsic state, cheap extrinsic state per object.
interface TreeKind {
  species: string;
  texture: string;
}
interface Tree {
  x: number;
  y: number;
  kind: TreeKind;
}
const treeKinds: Record<string, TreeKind> = {};
let treeKindsCreated = 0;
function treeKind(species: string): TreeKind {
  const cached = treeKinds[species];
  if (cached) return cached;
  treeKindsCreated += 1;
  const kind: TreeKind = { species: species, texture: `${species}.png` };
  treeKinds[species] = kind;
  return kind;
}
export function flyweight(): string[] {
  const forest: Tree[] = [];
  const species = ["oak", "pine", "birch"];
  for (let i = 0; i < 300; i++) {
    const name = species[i % 3] ?? "oak";
    forest.push({ x: i * 2, y: i * 3, kind: treeKind(name) });
  }
  const first = forest[0];
  const fourth = forest[3];
  const shared = first && fourth ? first.kind === fourth.kind : false;
  return [`${forest.length} trees, ${treeKindsCreated} tree kinds`, `trees 0 and 3 share one kind: ${shared}`];
}

// Proxy: a lazy, access-checked stand-in for an expensive object.
interface Document {
  read: (user: string) => string;
}
let documentsLoaded = 0;
function loadDocument(name: string): Document {
  documentsLoaded += 1;
  return { read: (user: string) => `${user} reads ${name}` };
}
function documentProxy(name: string, allowed: string[]): Document {
  let real: Document | null = null;
  return {
    read: (user: string) => {
      if (!allowed.includes(user)) return `${user}: access denied`;
      if (real === null) real = loadDocument(name);
      return real.read(user);
    },
  };
}
export function proxy(): string[] {
  documentsLoaded = 0;
  const doc = documentProxy("salaries.xlsx", ["ana", "rui"]);
  const before = documentsLoaded;
  const lines = [doc.read("eve"), doc.read("ana"), doc.read("rui")];
  lines.push(`loaded ${before} times before use, ${documentsLoaded} after`);
  return lines;
}

// ───────────────────────────── Behavioral ─────────────────────────────

// Chain of Responsibility: each handler handles the request or passes it on.
interface Approver {
  approve: (amount: number) => string;
}
function approver(role: string, limit: number, next: Approver | null): Approver {
  return {
    approve: (amount: number) => {
      if (amount <= limit) return `${role} approves $${amount}`;
      if (next !== null) return next.approve(amount);
      return `nobody can approve $${amount}`;
    },
  };
}
export function chainOfResponsibility(): string[] {
  const chain = approver("team lead", 1000, approver("manager", 10000, approver("director", 100000, null)));
  return [chain.approve(500), chain.approve(7500), chain.approve(50000), chain.approve(1000000)];
}

// Command: requests as objects, with undo.
interface Command {
  label: string;
  execute: () => void;
  undo: () => void;
}
interface TextBuffer {
  text: string;
}
function appendCommand(buffer: TextBuffer, suffix: string): Command {
  return {
    label: `append “${suffix}”`,
    execute: () => {
      buffer.text = buffer.text + suffix;
    },
    undo: () => {
      buffer.text = buffer.text.slice(0, buffer.text.length - suffix.length);
    },
  };
}
function upperCommand(buffer: TextBuffer): Command {
  let before = "";
  return {
    label: "uppercase",
    execute: () => {
      before = buffer.text;
      buffer.text = buffer.text.toUpperCase();
    },
    undo: () => {
      buffer.text = before;
    },
  };
}
export function command(): string[] {
  const buffer: TextBuffer = { text: "" };
  const history: Command[] = [];
  const run = (cmd: Command) => {
    cmd.execute();
    history.push(cmd);
  };
  run(appendCommand(buffer, "hello"));
  run(appendCommand(buffer, " world"));
  run(upperCommand(buffer));
  const lines = [`after 3 commands: “${buffer.text}”`];
  const last = history.pop();
  if (last) {
    last.undo();
    lines.push(`undo ${last.label}: “${buffer.text}”`);
  }
  const previous = history.pop();
  if (previous) {
    previous.undo();
    lines.push(`undo ${previous.label}: “${buffer.text}”`);
  }
  return lines;
}

// Interpreter: a tiny expression language, as a tree tagged with a string literal kind.
interface Expr {
  kind: "num" | "var" | "add" | "mul";
  value: number;
  name: string;
  left: Expr | null;
  right: Expr | null;
}
function num(value: number): Expr {
  return { kind: "num", value: value, name: "", left: null, right: null };
}
function ref(name: string): Expr {
  return { kind: "var", value: 0, name: name, left: null, right: null };
}
function add(left: Expr, right: Expr): Expr {
  return { kind: "add", value: 0, name: "", left: left, right: right };
}
function mul(left: Expr, right: Expr): Expr {
  return { kind: "mul", value: 0, name: "", left: left, right: right };
}
function evaluate(expr: Expr, vars: Record<string, number>): number {
  switch (expr.kind) {
    case "num":
      return expr.value;
    case "var":
      return vars[expr.name] ?? 0;
    case "add":
      return evaluate(expr.left!, vars) + evaluate(expr.right!, vars);
    case "mul":
      return evaluate(expr.left!, vars) * evaluate(expr.right!, vars);
  }
}
function show(expr: Expr): string {
  switch (expr.kind) {
    case "num":
      return `${expr.value}`;
    case "var":
      return expr.name;
    case "add":
      return `(${show(expr.left!)} + ${show(expr.right!)})`;
    case "mul":
      return `${show(expr.left!)} * ${show(expr.right!)}`;
  }
}
export function interpreter(): string[] {
  const program = add(mul(num(2), ref("x")), mul(ref("y"), add(ref("x"), num(1))));
  const vars: Record<string, number> = { x: 3, y: 4 };
  return [`${show(program)} where x = 3, y = 4`, `= ${evaluate(program, vars)}`];
}

// Iterator: a uniform way to walk different sequences.
interface NumberIterator {
  hasNext: () => boolean;
  next: () => number;
}
function range(from: number, to: number, step: number): NumberIterator {
  let current = from;
  return {
    hasNext: () => current < to,
    next: () => {
      const value = current;
      current += step;
      return value;
    },
  };
}
function fibonacci(count: number): NumberIterator {
  let a = 0;
  let b = 1;
  let produced = 0;
  return {
    hasNext: () => produced < count,
    next: () => {
      const value = a;
      const sum = a + b;
      a = b;
      b = sum;
      produced += 1;
      return value;
    },
  };
}
function collect(iterator: NumberIterator): string {
  const values: string[] = [];
  while (iterator.hasNext()) values.push(`${iterator.next()}`);
  return values.join(" ");
}
export function iterator(): string[] {
  return [`range(0, 20, 5): ${collect(range(0, 20, 5))}`, `fibonacci(10): ${collect(fibonacci(10))}`];
}

// Mediator: colleagues talk through a hub instead of to each other.
interface ChatUser {
  name: string;
  inbox: string[];
}
interface ChatRoom {
  join: (user: ChatUser) => void;
  send: (from: ChatUser, text: string) => void;
}
function chatRoom(): ChatRoom {
  const members: ChatUser[] = [];
  return {
    join: (user: ChatUser) => {
      members.push(user);
    },
    send: (from: ChatUser, text: string) => {
      for (const member of members) {
        if (member !== from) member.inbox.push(`${from.name}: ${text}`);
      }
    },
  };
}
export function mediator(): string[] {
  const room = chatRoom();
  const ana: ChatUser = { name: "ana", inbox: [] };
  const rui: ChatUser = { name: "rui", inbox: [] };
  const eve: ChatUser = { name: "eve", inbox: [] };
  room.join(ana);
  room.join(rui);
  room.join(eve);
  room.send(ana, "hi all");
  room.send(rui, "hey ana");
  return [`ana got: ${ana.inbox.join(" | ")}`, `rui got: ${rui.inbox.join(" | ")}`, `eve got: ${eve.inbox.join(" | ")}`];
}

// Memento: snapshots of an object's state, restored without exposing its internals.
interface EditorMemento {
  content: string;
  cursor: number;
}
interface Editor {
  type: (text: string) => void;
  show: () => string;
  save: () => EditorMemento;
  restore: (memento: EditorMemento) => void;
}
function editor(): Editor {
  let content = "";
  let cursor = 0;
  return {
    type: (text: string) => {
      content = content + text;
      cursor = content.length;
    },
    show: () => `“${content}” cursor ${cursor}`,
    save: () => ({ content: content, cursor: cursor }),
    restore: (memento: EditorMemento) => {
      content = memento.content;
      cursor = memento.cursor;
    },
  };
}
export function memento(): string[] {
  const ed = editor();
  ed.type("Dear Sir,");
  const draft = ed.save();
  ed.type(" you are fired.");
  const lines = [`typed: ${ed.show()}`];
  ed.restore(draft);
  lines.push(`restored: ${ed.show()}`);
  return lines;
}

// Observer: subscribers are notified of changes and can unsubscribe.
interface Subscription {
  id: number;
  notify: (value: number) => void;
}
interface Observable {
  subscribe: (notify: (value: number) => void) => () => void;
  set: (value: number) => void;
}
function observable(): Observable {
  // Functions have no identity natively (Swift closures can't be compared), so each listener gets an id.
  let subscriptions: Subscription[] = [];
  let nextId = 0;
  return {
    subscribe: (notify: (value: number) => void) => {
      nextId += 1;
      const id = nextId;
      subscriptions.push({ id: id, notify: notify });
      return () => {
        subscriptions = subscriptions.filter((s) => s.id !== id);
      };
    },
    set: (value: number) => {
      for (const s of subscriptions) s.notify(value);
    },
  };
}
export function observer(): string[] {
  const log: string[] = [];
  const temperature = observable();
  const unsubscribeDisplay = temperature.subscribe((v: number) => {
    log.push(`display shows ${v}°`);
  });
  temperature.subscribe((v: number) => {
    if (v > 30) log.push(`alarm: ${v}° is too hot`);
  });
  temperature.set(21);
  temperature.set(35);
  unsubscribeDisplay();
  temperature.set(40);
  return log;
}

// State: behaviour changes with the object's state object.
interface Order {
  state: OrderState;
  history: string[];
}
interface OrderState {
  name: string;
  next: (order: Order) => void;
  cancel: (order: Order) => void;
}
function moveTo(order: Order, state: OrderState) {
  order.history.push(`${order.state.name} → ${state.name}`);
  order.state = state;
}
const delivered: OrderState = {
  name: "delivered",
  next: (order: Order) => {
    order.history.push("already delivered");
  },
  cancel: (order: Order) => {
    order.history.push("can't cancel a delivered order");
  },
};
const cancelled: OrderState = {
  name: "cancelled",
  next: (order: Order) => {
    order.history.push("order is cancelled");
  },
  cancel: (order: Order) => {
    order.history.push("already cancelled");
  },
};
const shipped: OrderState = {
  name: "shipped",
  next: (order: Order) => moveTo(order, delivered),
  cancel: (order: Order) => {
    order.history.push("too late to cancel, it shipped");
  },
};
const placed: OrderState = {
  name: "placed",
  next: (order: Order) => moveTo(order, shipped),
  cancel: (order: Order) => moveTo(order, cancelled),
};
export function state(): string[] {
  const a: Order = { state: placed, history: [] };
  a.state.next(a);
  a.state.cancel(a);
  a.state.next(a);
  a.state.next(a);
  const b: Order = { state: placed, history: [] };
  b.state.cancel(b);
  b.state.next(b);
  return [`order A: ${a.history.join("; ")}`, `order B: ${b.history.join("; ")}`];
}

// Strategy: interchangeable algorithms chosen at run time.
interface PricingStrategy {
  name: string;
  price: (subtotal: number, items: number) => number;
}
const regularPricing: PricingStrategy = { name: "regular", price: (subtotal: number, items: number) => subtotal };
const salePricing: PricingStrategy = { name: "20% off", price: (subtotal: number, items: number) => subtotal * 0.8 };
const bulkPricing: PricingStrategy = {
  name: "bulk",
  price: (subtotal: number, items: number) => (items >= 10 ? subtotal - items : subtotal),
};
function checkout(strategy: PricingStrategy, subtotal: number, items: number): string {
  return `${strategy.name}: $${strategy.price(subtotal, items).toFixed(2)}`;
}
export function strategy(): string[] {
  const strategies = [regularPricing, salePricing, bulkPricing];
  return strategies.map((s) => checkout(s, 120, 12));
}

// Template Method: a fixed algorithm with steps (and an optional hook) supplied by the caller.
interface ReportSteps {
  title: () => string;
  rows: () => string[];
  footer: (() => string) | null;
}
function renderReport(steps: ReportSteps): string[] {
  const lines = [`# ${steps.title()}`];
  for (const row of steps.rows()) lines.push(`- ${row}`);
  const footer = steps.footer;
  lines.push(footer !== null ? footer() : "(no footer)");
  return lines;
}
export function templateMethod(): string[] {
  const sales = renderReport({ title: () => "Sales", rows: () => ["north 120", "south 80"], footer: () => "total 200" });
  const team = renderReport({ title: () => "Team", rows: () => ["ana", "rui"], footer: null });
  const lines: string[] = [];
  for (const line of sales) lines.push(line);
  for (const line of team) lines.push(line);
  return lines;
}

// Visitor: new operations over shapes without changing them (double dispatch).
interface ShapeVisitor {
  circle: (radius: number) => string;
  rect: (width: number, height: number) => string;
}
interface Visitable {
  accept: (visitor: ShapeVisitor) => string;
}
function circleNode(radius: number): Visitable {
  return { accept: (visitor: ShapeVisitor) => visitor.circle(radius) };
}
function rectNode(width: number, height: number): Visitable {
  return { accept: (visitor: ShapeVisitor) => visitor.rect(width, height) };
}
const areaVisitor: ShapeVisitor = {
  circle: (r: number) => `circle area ${(Math.PI * r * r).toFixed(1)}`,
  rect: (w: number, h: number) => `rect area ${w * h}`,
};
const svgVisitor: ShapeVisitor = {
  circle: (r: number) => `<circle r="${r}"/>`,
  rect: (w: number, h: number) => `<rect width="${w}" height="${h}"/>`,
};
export function visitor(): string[] {
  const shapes = [circleNode(2), rectNode(3, 4)];
  const lines: string[] = [];
  for (const shape of shapes) lines.push(`${shape.accept(areaVisitor)}  ${shape.accept(svgVisitor)}`);
  return lines;
}

// ───────────────────────────── Beyond GoF ─────────────────────────────

// Module: private state behind an immediately created closure.
interface Counter {
  increment: () => number;
  reset: () => void;
}
const idGenerator: Counter = ((): Counter => {
  let count = 0;
  return {
    increment: () => {
      count += 1;
      return count;
    },
    reset: () => {
      count = 0;
    },
  };
})();
export function modulePattern(): string[] {
  idGenerator.reset();
  const ids = [idGenerator.increment(), idGenerator.increment(), idGenerator.increment()];
  return [`ids: ${ids.map((id) => `${id}`).join(", ")}`, "the count itself is unreachable from outside"];
}

// Null Object: a do-nothing implementation instead of null checks.
interface Logger {
  log: (message: string) => void;
}
// An array parameter can't be mutated natively (Swift copies it), so the logger writes into an object it was given.
interface LogSink {
  lines: string[];
}
function memoryLogger(sink: LogSink): Logger {
  return {
    log: (message: string) => {
      sink.lines.push(`log: ${message}`);
    },
  };
}
const silentLogger: Logger = { log: (message: string) => {} };
function transfer(amount: number, logger: Logger): string {
  logger.log(`transfer of $${amount}`);
  return `transferred $${amount}`;
}
export function nullObject(): string[] {
  const sink: LogSink = { lines: [] };
  sink.lines.push(transfer(50, memoryLogger(sink)));
  sink.lines.push(transfer(70, silentLogger));
  return sink.lines;
}

// Dependency Injection: a service receives its collaborators instead of creating them.
interface TimeSource {
  now: () => string;
}
interface UserStore {
  find: (id: number) => string | null;
}
interface Greeter {
  greet: (id: number) => string;
}
function greeter(store: UserStore, clock: TimeSource): Greeter {
  return {
    greet: (id: number) => {
      const name = store.find(id);
      return name !== null ? `good ${clock.now()}, ${name}` : `user ${id} not found`;
    },
  };
}
export function dependencyInjection(): string[] {
  const users: Record<string, string> = { "1": "ana", "2": "rui" };
  const store: UserStore = { find: (id: number) => users[`${id}`] ?? null };
  const morning = greeter(store, { now: () => "morning" });
  const evening = greeter(store, { now: () => "evening" });
  return [morning.greet(1), evening.greet(2), morning.greet(9)];
}

// Publish / Subscribe: an event bus keyed by topic.
interface EventBus {
  on: (topic: string, handler: (payload: string) => void) => void;
  emit: (topic: string, payload: string) => number;
}
interface TopicHandlers {
  handlers: ((payload: string) => void)[];
}
function eventBus(): EventBus {
  const topics: Record<string, TopicHandlers> = {};
  return {
    on: (topic: string, handler: (payload: string) => void) => {
      const existing = topics[topic];
      if (existing) existing.handlers.push(handler);
      else topics[topic] = { handlers: [handler] };
    },
    emit: (topic: string, payload: string) => {
      const entry = topics[topic];
      if (!entry) return 0;
      for (const handler of entry.handlers) handler(payload);
      return entry.handlers.length;
    },
  };
}
export function publishSubscribe(): string[] {
  const lines: string[] = [];
  const bus = eventBus();
  bus.on("order", (id: string) => {
    lines.push(`email: order ${id} confirmed`);
  });
  bus.on("order", (id: string) => {
    lines.push(`stock: reserve items for ${id}`);
  });
  const delivered = bus.emit("order", "#42");
  const nobody = bus.emit("refund", "#7");
  lines.push(`"order" reached ${delivered} handlers, "refund" reached ${nobody}`);
  return lines;
}

// Specification: business rules as composable predicates.
interface Product {
  name: string;
  price: number;
  inStock: boolean;
}
interface Spec {
  test: (product: Product) => boolean;
}
function cheaperThan(limit: number): Spec {
  return { test: (p: Product) => p.price < limit };
}
const inStock: Spec = { test: (p: Product) => p.inStock };
function both(a: Spec, b: Spec): Spec {
  return { test: (p: Product) => a.test(p) && b.test(p) };
}
function not(spec: Spec): Spec {
  return { test: (p: Product) => !spec.test(p) };
}
export function specification(): string[] {
  const products: Product[] = [
    { name: "pen", price: 2, inStock: true },
    { name: "lamp", price: 40, inStock: true },
    { name: "mug", price: 8, inStock: false },
    { name: "desk", price: 300, inStock: true },
  ];
  const bargain = both(cheaperThan(50), inStock);
  const names = (spec: Spec) =>
    products
      .filter((p) => spec.test(p))
      .map((p) => p.name)
      .join(", ");
  return [`bargains: ${names(bargain)}`, `not bargains: ${names(not(bargain))}`];
}
