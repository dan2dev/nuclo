// rest2: hand-written iterator objects (`{ next() { … } }`) and classes whose `[Symbol.iterator]()` returns one.

class R2Bag {
  items: string[] = ["a", "b", "c"];
  [Symbol.iterator](): Iterator<string> {
    let i = 0;
    const items = this.items;
    return { next: () => (i < items.length ? { value: items[i++]!, done: false } : { value: undefined, done: true }) };
  }
}

class R2Range {
  constructor(
    readonly from: number,
    readonly to: number,
  ) {}
  [Symbol.iterator](): Iterator<number> {
    let cur = this.from;
    const end = this.to;
    return {
      next() {
        if (cur > end) return { value: undefined, done: true };
        const v = cur;
        cur += 1;
        return { value: v, done: false };
      },
    };
  }
}

function r2Countdown(n: number): Iterator<number> {
  let left = n;
  return { next: () => (left > 0 ? { value: left--, done: false } : { value: undefined, done: true }) };
}

export function r2Iterators(): string[] {
  const out: string[] = [];
  const bag = new R2Bag();
  const seen: string[] = [];
  for (const s of bag) seen.push(s);
  out.push(seen.join(","), [...bag].join("|"), Array.from(bag).length.toString());
  const r = new R2Range(2, 5);
  let sum = 0;
  for (const v of r) {
    if (v === 4) continue;
    sum += v;
  }
  out.push(`${sum} ${[...r].join(" ")}`);
  for (const v of r) {
    out.push(`first ${v}`);
    break;
  }
  const [a, b] = r;
  out.push(`${a} ${b}`);
  const it = r2Countdown(3);
  let step = it.next();
  while (!step.done) {
    out.push(`step ${step.value}`);
    step = it.next();
  }
  out.push(`after ${it.next().done}`);
  bag.items.push("d");
  out.push([...bag].join(""));
  return out;
}
