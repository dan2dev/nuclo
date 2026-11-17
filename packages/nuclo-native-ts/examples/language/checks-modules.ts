/**
 * Modules: two modules declaring the same top-level names (types, classes, functions, variables) are distinct
 * native declarations, and imports (renamed, `import * as`) reach the one they name. Every target prints what
 * TypeScript prints.
 */
import * as other from "./modules-other.ts";
import { Row as OtherRow, describe as otherDescribe, type Point as OtherPoint, bump as otherBump, wrap as otherWrap, Card as OtherCard } from "./modules-other.ts";

// The same names as modules-other.ts, with other members and values.
interface Point { x: number; y: number }
interface Named { name: string; greet(): string }
type Pair = { left: number; right: number };
enum Level { Low = 1, High = 2 }

class Row {
  static made = 0;
  #secret: number;
  constructor(public readonly id: number) {
    Row.made += 10;
    this.#secret = id * 3;
  }
  show(): string { return `row ${this.id} ${this.#secret}`; }
}

class Box<T> {
  constructor(public value: T) {}
  get(): string { return `box [${this.value}]`; }
}

const Card = class {
  title = "card";
  pages = 3;
};

let count = 0;
function bump(): number {
  count += 5;
  return count;
}
const [first, second] = [1, 2];
const label = "label";

function describe(p: Point): string { return `(${p.x}, ${p.y})`; }
function twice(n: number): number { return n * 2; }
function wrap<T>(v: T): string { return `[${v}]`; }
function* steps(): Generator<number> { yield 1; yield 2; yield 3; }

class Greeter implements Named {
  constructor(public name: string) {}
  greet(): string { return `hello ${this.name}`; }
}

export function modTypes(): string[] {
  const p: Point = { x: 1, y: 2 };
  const q: OtherPoint = { x: 3, y: 4, label: "q" };
  const r: other.Point = { x: 5, y: 6, label: "r" };
  const pair: Pair = { left: 1, right: 2 };
  const otherPair = other.pairOf();
  const named: Named[] = [new Greeter("ann"), { name: "lit", greet: () => "hey" }];
  return [
    `${describe(p)} ${otherDescribe(q)} ${other.describe(r)}`,
    `${Object.keys(p).join(",")} ${Object.keys(q).join(",")}`,
    `${pair.left + pair.right} ${otherPair.left + otherPair.right}`,
    named.map((n) => n.greet()).join(" | "),
    other.namedOf("bo").greet(),
    `${Level.High} ${other.Level.Low} ${other.level()}`,
  ];
}

export function modClasses(): string[] {
  const rows = [new Row(1), new Row(2)];
  const others = [new OtherRow("a"), new other.Row("b")];
  const mixed: (Row | OtherRow)[] = [rows[0]!, others[0]!];
  const kinds = mixed.map((m) => (m instanceof Row ? `mine ${m.id + 1}` : `theirs ${m.id}!`));
  return [
    rows.map((r) => r.show()).join(" / "),
    others.map((r) => r.show()).join(" / "),
    `${Row.made} ${OtherRow.made} ${other.Row.made}`,
    kinds.join(", "),
    `${new Box(2).get()} ${new other.Box("s").get()} ${new Box<string>("t").get()}`,
    `${new Card().title} ${new Card().pages} ${new OtherCard().title}`,
  ];
}

export function modValues(): string[] {
  bump();
  otherBump();
  const nums = [1, 2].map(twice);
  const otherNums = [1, 2].map(other.twice);
  const shorthand = { count, label };
  return [
    `${count} ${bump()} ${otherBump()} ${other.bump()}`,
    `${first} ${second} ${other.first} ${other.second}`,
    `${label} ${other.label} ${shorthand.count} ${shorthand.label}`,
    `${nums.join(",")} ${otherNums.join(",")}`,
    `${wrap(1)} ${wrap("x")} ${otherWrap(1)} ${other.wrap(true)}`,
    `${[...steps()].join(",")} ${[...other.steps()].join(",")}`,
  ];
}
