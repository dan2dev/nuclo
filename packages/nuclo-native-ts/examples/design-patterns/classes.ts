/**
 * Five behavioral patterns again, written the class-based way: classes that `implements` an
 * interface or `extends` an (abstract) base class, `this`, getters, `override` and `super`. A
 * value of a class goes wherever an interface it implements is expected, and the call dispatches
 * to its own method on every target, as it does in JavaScript.
 */

// Strategy: the checkout delegates pricing to an interchangeable strategy object.
interface PriceRule {
  price(base: number): number;
  label(): string;
}
class RegularPrice implements PriceRule {
  price(base: number): number {
    return base;
  }
  label(): string {
    return "regular";
  }
}
class SalePrice implements PriceRule {
  constructor(private readonly percent: number) {}
  price(base: number): number {
    return (base * (100 - this.percent)) / 100;
  }
  label(): string {
    return `${this.percent}% off`;
  }
}
class Checkout {
  constructor(private strategy: PriceRule) {}
  use(strategy: PriceRule): void {
    this.strategy = strategy;
  }
  total(items: number[]): string {
    let sum = 0;
    for (const item of items) sum += this.strategy.price(item);
    return `${this.strategy.label()}: ${sum.toFixed(2)}`;
  }
}
export function strategyClasses(): string[] {
  const checkout = new Checkout(new RegularPrice());
  const items = [20, 5.5, 14.5];
  const regular = checkout.total(items);
  checkout.use(new SalePrice(25));
  const sale = checkout.total(items);
  // An object literal is a strategy too: any value with the interface's members.
  checkout.use({ price: (base: number) => Math.min(base, 10), label: () => "capped at 10" });
  return [regular, sale, checkout.total(items)];
}

// Observer: subscribers register with a source, which notifies each one.
interface Subscriber {
  notify(event: string): void;
}
class EventSource {
  private subscribers: Subscriber[] = [];
  subscribe(subscriber: Subscriber): void {
    this.subscribers.push(subscriber);
  }
  unsubscribe(subscriber: Subscriber): void {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }
  emit(event: string): void {
    for (const s of this.subscribers) s.notify(event);
  }
  get size(): number {
    return this.subscribers.length;
  }
}
class LogSubscriber implements Subscriber {
  readonly lines: string[] = [];
  constructor(private readonly prefix: string) {}
  notify(event: string): void {
    this.lines.push(`${this.prefix}:${event}`);
  }
}
class CountingSubscriber implements Subscriber {
  count = 0;
  constructor(source: EventSource) {
    source.subscribe(this);
  }
  notify(_event: string): void {
    this.count++;
  }
}
export function observerClasses(): string[] {
  const source = new EventSource();
  const log = new LogSubscriber("log");
  source.subscribe(log);
  const counter = new CountingSubscriber(source);
  const shouted: string[] = [];
  source.subscribe({
    notify(event: string) {
      shouted.push(event.toUpperCase());
    },
  });
  source.emit("open");
  source.emit("save");
  source.unsubscribe(log);
  source.emit("close");
  return [log.lines.join(", "), `counter saw ${counter.count}, ${source.size} still subscribed, shouted ${shouted.join(" ")}`];
}

// State: the light delegates to its current state object, which picks the next one.
interface LightState {
  readonly color: string;
  next(light: TrafficLight): void;
}
class RedLight implements LightState {
  readonly color = "red";
  next(light: TrafficLight): void {
    light.change(new GreenLight());
  }
}
class GreenLight implements LightState {
  readonly color = "green";
  next(light: TrafficLight): void {
    light.change(new YellowLight());
  }
}
class YellowLight implements LightState {
  readonly color = "yellow";
  next(light: TrafficLight): void {
    light.change(new RedLight());
  }
}
class TrafficLight {
  private state: LightState = new RedLight();
  changes = 0;
  change(state: LightState): void {
    this.state = state;
    this.changes++;
  }
  advance(): string {
    this.state.next(this);
    return this.state.color;
  }
  get color(): string {
    return this.state.color;
  }
}
export function stateClasses(): string[] {
  const light = new TrafficLight();
  const seen = [light.color];
  for (let i = 0; i < 4; i++) seen.push(light.advance());
  return [seen.join(" → "), `${light.changes} changes`];
}

// Visitor: double dispatch over a small expression tree.
interface TermVisitor {
  visitNum(num: Num): string;
  visitAdd(add: Add): string;
  visitMul(mul: Mul): string;
}
interface Term {
  accept(visitor: TermVisitor): string;
}
class Num implements Term {
  constructor(readonly value: number) {}
  accept(visitor: TermVisitor): string {
    return visitor.visitNum(this);
  }
}
class Add implements Term {
  constructor(
    readonly left: Term,
    readonly right: Term,
  ) {}
  accept(visitor: TermVisitor): string {
    return visitor.visitAdd(this);
  }
}
class Mul implements Term {
  constructor(
    readonly left: Term,
    readonly right: Term,
  ) {}
  accept(visitor: TermVisitor): string {
    return visitor.visitMul(this);
  }
}
class PrintVisitor implements TermVisitor {
  visitNum(num: Num): string {
    return `${num.value}`;
  }
  visitAdd(add: Add): string {
    return `(${add.left.accept(this)} + ${add.right.accept(this)})`;
  }
  visitMul(mul: Mul): string {
    return `${mul.left.accept(this)} × ${mul.right.accept(this)}`;
  }
}
class EvalVisitor implements TermVisitor {
  visitNum(num: Num): string {
    return `${num.value}`;
  }
  visitAdd(add: Add): string {
    return `${Number(add.left.accept(this)) + Number(add.right.accept(this))}`;
  }
  visitMul(mul: Mul): string {
    return `${Number(mul.left.accept(this)) * Number(mul.right.accept(this))}`;
  }
}
export function visitorClasses(): string[] {
  const term: Term = new Mul(new Add(new Num(1.5), new Num(2)), new Num(4));
  return [`${term.accept(new PrintVisitor())} = ${term.accept(new EvalVisitor())}`];
}

// Template Method: the base class fixes the algorithm, subclasses fill in (or override) steps.
abstract class Exporter {
  static exports = 0;
  run(rows: string[]): string {
    Exporter.exports++;
    return [this.header(), ...rows.map((r) => this.row(r)), this.footer()].join(this.separator());
  }
  protected abstract header(): string;
  protected abstract row(value: string): string;
  protected footer(): string {
    return "end";
  }
  protected separator(): string {
    return " / ";
  }
}
class CsvExporter extends Exporter {
  protected header(): string {
    return "name";
  }
  protected row(value: string): string {
    return value;
  }
  protected override separator(): string {
    return ",";
  }
}
class HtmlExporter extends Exporter {
  protected header(): string {
    return "<ul>";
  }
  protected row(value: string): string {
    return `<li>${value}</li>`;
  }
  protected override footer(): string {
    return "</ul>";
  }
}
class MarkdownExporter extends CsvExporter {
  protected override header(): string {
    return `# ${super.header()}`;
  }
  protected override row(value: string): string {
    return `- ${super.row(value)}`;
  }
  protected override separator(): string {
    return " ";
  }
}
export function templateMethodClasses(): string[] {
  const rows = ["ana", "rui"];
  const exporters: Exporter[] = [new CsvExporter(), new HtmlExporter(), new MarkdownExporter()];
  return [...exporters.map((e) => e.run(rows)), `${Exporter.exports} exports`];
}
