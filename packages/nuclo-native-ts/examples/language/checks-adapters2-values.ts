// Object.freeze of literals and Opt<T> (null vs undefined) (adapters2).

import { type Opt, opt, optNull, optUndefined } from "../../src/adapters.ts";

interface Config {
  readonly name: string;
  readonly retries: number;
  readonly tags: readonly string[];
}

const DEFAULTS = Object.freeze({ name: "app", retries: 3, tags: Object.freeze(["a", "b"]) });
const PRIMES = Object.freeze([2, 3, 5, 7]);

function describe(c: Config): string {
  return `${c.name}/${c.retries}/${c.tags.join("+")}`;
}

function sum(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

export function ad2Freeze(): string[] {
  const out: string[] = [];
  out.push(describe(DEFAULTS), `${sum(PRIMES)} ${PRIMES.length} ${PRIMES.indexOf(5)}`);
  const copy = { ...DEFAULTS, retries: DEFAULTS.retries + 1 };
  out.push(`${copy.retries} ${DEFAULTS.retries} ${[...PRIMES, 11].join(",")}`);
  const span = Object.freeze({ from: 1, to: 2 });
  out.push(`${span.from + span.to}`);
  return out;
}

function show(o: Opt<number>): string {
  return `${o.state} ${o.isNull()} ${o.isUndefined()} ${o.isNullish()} ${o.typeOf()} ${o} ${o.or(-1)} ${o.get() ?? "none"}`;
}

/** A field that is missing (undefined), explicitly cleared (null) or set. */
interface Patch {
  name: Opt<string>;
  age: Opt<number>;
}

function apply(p: Patch, current: string[]): string {
  const name = p.name.isUndefined() ? current[0] : p.name.isNull() ? "(cleared)" : p.name.or("");
  const age = p.age.isUndefined() ? current[1] : p.age.isNull() ? "(cleared)" : `${p.age.or(0)}`;
  return `${name} ${age}`;
}

export function ad2Opt(): string[] {
  const out = [show(opt(4.5)), show(opt(0)), show(optNull<number>()), show(optUndefined<number>())];
  const current = ["ann", "30"];
  out.push(apply({ name: opt("bob"), age: optUndefined<number>() }, current));
  out.push(apply({ name: optNull<string>(), age: opt(31) }, current));
  const texts: Opt<string>[] = [opt("x"), optNull<string>(), optUndefined<string>(), opt("")];
  out.push(texts.map((t) => `${t.typeOf()}:${t}`).join(" "));
  return out;
}
