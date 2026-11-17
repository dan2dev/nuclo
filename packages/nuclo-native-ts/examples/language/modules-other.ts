/**
 * The other module of checks-modules.ts: the same top-level names, declared again for other types and values.
 * TypeScript scopes them per module; natively each is its own declaration (`Row__modules_other`).
 */

export interface Point { x: number; y: number; label: string }
export interface Named { name: string; greet(): string }
export type Pair = { left: string; right: string };
export enum Level { Low = "low", High = "high" }

export class Row {
  static made = 0;
  #secret: string;
  constructor(public readonly id: string) {
    Row.made++;
    this.#secret = `other:${id}`;
  }
  show(): string { return `other row ${this.id} ${this.#secret}`; }
}

export class Box<T> {
  constructor(public value: T) {}
  get(): string { return `other box ${this.value}`; }
}

export const Card = class {
  title = "other card";
};

let count = 100;
export function bump(): number { return ++count; }
export const [first, second] = ["o1", "o2"];
export const label = "other label";

export function describe(p: Point): string { return `${p.label}@${p.x},${p.y}`; }
export function twice(n: number): number { return n * 2 + 0.5; }
export function wrap<T>(v: T): string { return `other<${v}>`; }
export function* steps(): Generator<string> { yield "o-a"; yield "o-b"; }

export function namedOf(name: string): Named {
  return { name, greet() { return `hi from other ${this.name}`; } };
}
export function pairOf(): Pair { return { left: "L", right: "R" }; }
export function level(): Level { return Level.High; }
