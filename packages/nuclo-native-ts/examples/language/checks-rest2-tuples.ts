// rest2: tuples with optional and rest elements, and tuples indexed by a computed index.

type R2Opt = [number, string?];
type R2Rest = [string, ...number[]];

interface R2Item {
  id: number;
}

function r2Describe(t: R2Opt): string {
  const label = t[1];
  return `${t[0]}:${label ?? "none"}:${t.length}`;
}

function r2Sum(t: R2Rest): string {
  let total = 0;
  for (let i = 1; i < t.length; i++) {
    const v = t[i];
    if (typeof v === "number") total += v;
  }
  return `${t[0]}=${total} (${t.length})`;
}

export function r2VarTuples(): string[] {
  const out: string[] = [];
  const a: R2Opt = [1];
  const b: R2Opt = [2, "two"];
  const c: R2Opt = [3, undefined];
  out.push(r2Describe(a), r2Describe(b), r2Describe(c));
  out.push(`${a} | ${b} | ${c}`);
  a[1] = "late";
  out.push(r2Describe(a), `${a}`);
  const r: R2Rest = ["sum", 1, 2, 3.5];
  out.push(r2Sum(r), r2Sum(["empty"]), `${r}`);
  r.push(10);
  out.push(r2Sum(r), `${r.length}`);
  const all = [...b, ...b];
  out.push(all.join("/"));
  const [n0, s1] = b;
  const [head, ...tail] = r;
  out.push(`${n0 + 1} ${s1 ?? "?"} ${head} ${tail.length}`);
  return out;
}

export function r2TupleIndex(): string[] {
  const out: string[] = [];
  const pair: [number, string] = [7, "seven"];
  for (const i of [0, 1, 2, 0.5, -1]) {
    const v = pair[i];
    out.push(`${i} -> ${v === undefined ? "undefined" : typeof v} ${v ?? "-"}`);
  }
  const triple: [string, number, boolean] = ["x", 2, true];
  const at = (k: 0 | 1 | 2): string | number | boolean => triple[k];
  out.push(`${at(0)} ${at(1)} ${at(2)}`);
  const entry: [string, R2Item, number[], number | null] = ["a", { id: 1 }, [1, 2], null];
  out.push(`${entry}`);
  return out;
}
