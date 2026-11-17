// Remaining rejected constructs (rest): built-in functions as values, reduce without an initial value.

function apply2(f: (a: number, b: number) => number, a: number, b: number): number {
  return f(a, b);
}

function each(xs: number[], f: (x: number) => number): string {
  return xs.map((x) => f(x)).join(" ");
}

export function rsBuiltinValues(): string[] {
  const out: string[] = [];
  out.push(["1", "2.5", "x", "", " 7 "].map(Number).join(","));
  // map's index is parseInt's radix, as in JavaScript.
  out.push(["10", "10", "10", "10"].map(parseInt).join(","));
  out.push(["1.5e3", "abc", "-0.25x"].map(parseFloat).join(","));
  out.push([0, 1, -2, NaN].map(Boolean).join(","));
  out.push(["", "a"].map(Boolean).join(","));
  out.push([1, 2.5, -0, 1e21].map(String).join("|"));
  out.push([true, false].map(String).join("|"));
  out.push([1.5, -1.5, 2.5, -0.4].map(Math.round).join(","));
  out.push([1.5, -1.5].map(Math.floor).join(",") + " " + [1.2, -1.2].map(Math.ceil).join(",") + " " + [1.7, -1.7].map(Math.trunc).join(","));
  out.push([4, 2, -9].map(Math.abs).join(",") + " " + [4, 2].map(Math.sqrt).join(","));
  out.push([0, 1].map(Math.cos).map((x) => x.toFixed(6)).join(","));
  out.push(`${apply2(Math.max, 3, 9)} ${apply2(Math.min, 3, 9)} ${apply2(Math.pow, 2, 10)} ${apply2(Math.atan2, 1, 1).toFixed(6)}`);
  out.push(each([1, 4, 9], Math.sqrt) + " / " + each([-1, 0, 2], Math.sign));
  out.push([1, NaN, Infinity].map(isFinite).join(",") + " " + [1, NaN].map(isNaN).join(","));
  out.push([1, 1.5, 2 ** 53].map(Number.isInteger).join(",") + " " + [2 ** 53, 2 ** 53 - 1].map(Number.isSafeInteger).join(","));
  out.push(["7", "08", "z"].map(Number.parseFloat).join(","));
  const present = ["a", "", "b"].filter(Boolean);
  out.push(present.join("+"));
  const nums = [3, 0, 5].filter(Boolean);
  out.push(nums.join("+"));
  const toNum: (s: string) => number = Number;
  out.push(`${toNum("42") + 1}`);
  const sorted = [3, 1, 2].sort((a, b) => Math.sign(a - b));
  out.push(sorted.join(""));
  out.push([[1, 2], [3]].map((xs) => xs.map(String).join("-")).join(" "));
  return out;
}

export function rsReduceFirst(): string[] {
  const out: string[] = [];
  out.push(`${[1, 2, 3, 4].reduce((a, b) => a + b)} ${[5].reduce((a, b) => a * b)} ${["a", "b", "c"].reduce((a, b) => a + b)}`);
  out.push(`${["a", "b", "c"].reduceRight((a, b) => a + b)} ${[2, 3, 4].reduceRight((a, b) => a - b)}`);
  out.push(`${[3, 9, 2].reduce((a, b) => Math.max(a, b))}`);
  const words = ["pear", "fig", "banana"];
  out.push(words.reduce((a, b) => (b.length > a.length ? b : a)));
  const empty: number[] = [];
  try {
    out.push(`${empty.reduce((a, b) => a + b)}`);
  } catch (e) {
    out.push(`caught ${e instanceof TypeError} ${(e as Error).name}`);
  }
  try {
    out.push(`${empty.reduceRight((a, b) => a + b)}`);
  } catch (e) {
    out.push(`caught right ${e instanceof TypeError}`);
  }
  let calls = 0;
  const total = [10, 20, 30].reduce((a, b) => {
    calls++;
    return a + b;
  });
  out.push(`${total} calls ${calls}`);
  return out;
}
