// Edge cases: odds and ends (coercions, compound assignments, closures, recursion). Names start with `ed`.

function edN(n: number): number {
  return n;
}

/** Coercions the strict config allows, and compound assignments on every kind. */
export function edCoerce(): string[] {
  let s = "a";
  s += 1;
  s += true;
  s += edN(0.5);
  let n = edN(10);
  n /= 4;
  n **= 2;
  n %= 4;
  let i = 7;
  i <<= 2;
  i >>= 1;
  i >>>= 0;
  i |= 1;
  i &= 0xff;
  i ^= 0b101;
  let u: number | undefined;
  u ??= 3;
  let t = "";
  t ||= "set";
  let f = true;
  f &&= edN(1) > 2;
  return [`${s} ${n} ${i} ${u} ${t} ${f}`, `${+"3" + 1} ${-"2"} ${+true} ${typeof s} ${typeof n} ${typeof f}`];
}

/** Closures: counters, accumulators, partial application, captured loop state, recursion through closures. */
export function edClosures(): string[] {
  const counter = (): (() => number) => {
    let c = 0;
    return () => ++c;
  };
  const a = counter();
  const b = counter();
  a();
  a();
  b();
  const add = (x: number) => (y: number) => x + y;
  const add5 = add(5);
  const compose = (f: (x: number) => number, g: (x: number) => number) => (x: number) => f(g(x));
  const memo = (fn: (n: number) => number): ((n: number) => number) => {
    const cache: Record<string, number> = {};
    return (n: number) => {
      const k = String(n);
      const hit = cache[k];
      if (hit !== undefined) return hit;
      const v = fn(n);
      cache[k] = v;
      return v;
    };
  };
  let calls = 0;
  const square = memo((n) => {
    calls++;
    return n * n;
  });
  square(4);
  square(4);
  square(5);
  return [`${a()} ${b()} ${add5(1)} ${add(1)(2)} ${compose(add5, (x) => x * 2)(3)} ${calls} ${square(4)}`];
}
