// Remaining rejected constructs (rest): Object.fromEntries / Object.assign where the shapes are known.

interface RsPoint {
  x: number;
  y: number;
  label: string;
}
interface RsDelta {
  x: number;
  y: number;
}

export function rsObjectStatics(): string[] {
  const out: string[] = [];
  const pairs: [string, number][] = [["b", 2], ["a", 1], ["b", 3], ["10", 0], ["2", 9]];
  const rec = Object.fromEntries(pairs);
  out.push(JSON.stringify(rec), Object.keys(rec).join(","));
  const prices: Record<string, number> = { apple: 1.5, pear: 2 };
  const doubled = Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, v * 2]));
  out.push(JSON.stringify(doubled));
  const byLen = Object.fromEntries(["aa", "b", "ccc"].map((w) => [w.length, w] as [number, string]));
  out.push(JSON.stringify(byLen));
  const strs: string[][] = [["k", "v"], ["q", "w"]];
  out.push(JSON.stringify(Object.fromEntries(strs.map((p) => [p[0]!, p[1]!] as [string, string]))));
  const target: Record<string, number> = { a: 1 };
  const merged = Object.assign(target, { b: 2 } as Record<string, number>, { a: 5, c: 3 } as Record<string, number>);
  out.push(`${JSON.stringify(merged)} ${merged === target}`);
  const p: RsPoint = { x: 1, y: 2, label: "p" };
  const d: RsDelta = { x: 10, y: 20 };
  const same = Object.assign(p, d);
  out.push(`${p.x} ${p.y} ${p.label} ${same === p}`);
  Object.assign(p, { x: 7, y: 8 } as RsDelta);
  out.push(`${p.x},${p.y}`);
  return out;
}

type RsState = "idle" | "running" | "done";
type RsEvent = "start" | "finish" | "reset";
const rsTransitions: Record<RsState, Record<RsEvent, RsState>> = {
  idle: { start: "running", finish: "idle", reset: "idle" },
  running: { start: "running", finish: "done", reset: "idle" },
  done: { start: "done", finish: "done", reset: "idle" },
};

export function rsRecordKeys(): string[] {
  const out: string[] = [];
  let s: RsState = "idle";
  const trail: string[] = [s];
  for (const e of ["start", "start", "finish", "reset", "finish"] as RsEvent[]) {
    s = rsTransitions[s][e];
    trail.push(s);
  }
  out.push(trail.join(">"));
  const defaults: Record<string, number> = { width: 10, height: 5, "2": 0 };
  const key = "depth";
  const n = 7;
  const width = 99;
  const merged: Record<string, number> = { ...defaults, height: 6, [key]: 3, [n]: 1, width };
  out.push(JSON.stringify(merged), Object.keys(merged).join(","));
  const copy: Record<string, number> = { ...defaults };
  copy["width"] = 0;
  out.push(`${defaults["width"]} ${copy["width"]} ${JSON.stringify({ ...copy, ...merged } as Record<string, number>)}`);
  return out;
}
