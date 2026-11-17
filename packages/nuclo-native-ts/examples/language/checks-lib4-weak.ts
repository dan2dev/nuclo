/** lib4: WeakMap, WeakSet, WeakRef (keys by identity, held weakly). Every top-level name starts with `l4`. */

class L4Node {
  constructor(public name: string) {}
}

interface L4Meta {
  visits: number;
  tag: string;
}

/** Cached per object, without keeping the object alive. */
const l4Cache = new WeakMap<L4Node, L4Meta>();

function l4Meta(n: L4Node): L4Meta {
  const hit = l4Cache.get(n);
  if (hit) {
    hit.visits++;
    return hit;
  }
  const made: L4Meta = { visits: 1, tag: n.name.toUpperCase() };
  l4Cache.set(n, made);
  return made;
}

export function l4WeakMaps(): string[] {
  const out: string[] = [];
  const a = new L4Node("a");
  const b = new L4Node("b");
  const twin = new L4Node("a");
  const wm = new WeakMap<L4Node, number>();
  wm.set(a, 1).set(b, 2);
  out.push(`${wm.get(a)} ${wm.get(b)} ${wm.get(twin)} ${wm.has(a)} ${wm.has(twin)}`);
  wm.set(a, 10);
  out.push(`${wm.get(a)} ${wm.delete(a)} ${wm.delete(a)} ${wm.has(a)} ${wm.get(a) ?? "none"}`);
  // Many short-lived keys: their entries go away natively too (nothing observable, nothing kept).
  let sum = 0;
  for (let i = 0; i < 2000; i++) {
    const k = new L4Node(`k${i}`);
    wm.set(k, i);
    sum += wm.get(k) ?? 0;
  }
  out.push(`sum ${sum} ${wm.get(b)} ${String(wm)}`);
  for (const n of [a, b, a, a, twin]) out.push(`${n.name} ${l4Meta(n).visits} ${l4Meta(n).tag}`);
  const arrays = new WeakMap<number[], string>();
  const xs = [1, 2];
  const ys = [1, 2];
  arrays.set(xs, "xs");
  out.push(`${arrays.get(xs)} ${arrays.get(ys) ?? "-"} ${arrays.has(ys)}`);
  xs.push(3);
  out.push(`${arrays.get(xs)} after push`);
  return out;
}

export function l4WeakSets(): string[] {
  const out: string[] = [];
  const seen = new WeakSet<L4Node>();
  const nodes = [new L4Node("x"), new L4Node("y"), new L4Node("x")];
  const order: string[] = [];
  for (const n of [nodes[0]!, nodes[1]!, nodes[0]!, nodes[2]!, nodes[1]!]) {
    if (seen.has(n)) continue;
    seen.add(n);
    order.push(n.name);
  }
  out.push(order.join(","));
  out.push(`${seen.delete(nodes[0]!)} ${seen.has(nodes[0]!)} ${seen.has(nodes[1]!)} ${seen.delete(new L4Node("z"))} ${String(seen)}`);
  const records = new WeakSet<Record<string, number>>();
  const r: Record<string, number> = { a: 1 };
  records.add(r);
  out.push(`${records.has(r)} ${records.has({ a: 1 })}`);
  return out;
}

export function l4WeakRefs(): string[] {
  const out: string[] = [];
  const held = new L4Node("held");
  const ref = new WeakRef(held);
  const back = ref.deref();
  out.push(`${back === held} ${back?.name ?? "gone"}`);
  // A target nothing else holds is kept until the current job ends, as JavaScript keeps it.
  const fresh = new WeakRef(new L4Node("fresh"));
  out.push(fresh.deref()?.name ?? "gone");
  const refs: WeakRef<L4Node>[] = [];
  for (let i = 0; i < 3; i++) refs.push(new WeakRef(new L4Node(`n${i}`)));
  out.push(refs.map((r) => r.deref()?.name ?? "-").join(","));
  out.push(String(ref));
  return out;
}
