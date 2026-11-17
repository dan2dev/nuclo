// Remaining rejected constructs (rest): optional calls of computed functions, and more.

interface RsHooks {
  onSave?: (n: number) => string;
  onLoad?: () => void;
}

let rsCount = 0;
function rsMaker(give: boolean): ((x: number) => number) | undefined {
  rsCount++;
  return give ? (x) => x * 2 : undefined;
}

export function rsOptionalCalls(): string[] {
  const out: string[] = [];
  const handlers: Record<string, () => string> = { a: () => "ran a" };
  out.push(`${handlers["a"]?.() ?? "none"} ${handlers["b"]?.() ?? "none"}`);
  const list: ((s: string) => string)[] = [(s) => s.toUpperCase()];
  out.push(`${list[0]?.("x") ?? "-"} ${list[3]?.("y") ?? "-"}`);
  out.push(`${rsMaker(true)?.(21) ?? -1} ${rsMaker(false)?.(21) ?? -1} calls ${rsCount}`);
  const hooks: RsHooks[] = [{ onSave: (n) => `saved ${n}` }, {}];
  for (const h of hooks) out.push(h.onSave?.(7) ?? "no hook");
  let loaded = 0;
  const hs: RsHooks[] = [{ onLoad: () => { loaded++; } }, {}];
  hs[0]!.onLoad?.();
  hs[1]!.onLoad?.();
  rsMaker(true)?.(1);
  out.push(`loaded ${loaded} calls ${rsCount}`);
  let args = 0;
  const side = (): number => ++args;
  handlers["zz"]?.();
  rsMaker(false)?.(side());
  out.push(`args ${args}`);
  return out;
}

export function rsHypot(): string[] {
  const out: string[] = [];
  out.push(`${Math.hypot(1, 2, 3)} ${Math.hypot(3, 4, 12)} ${Math.hypot(1e200, 1e200, 1e200)} ${Math.hypot(1e-200, 2e-200, 3e-200)}`);
  out.push(`${Math.hypot(1, 2, 3, 4)} ${Math.hypot(0.1, 0.2, 0.3, 0.4, 0.5)} ${Math.hypot(-0, 0, -0, 0)} ${Math.hypot(1e300, 1e300, 1, 1)}`);
  out.push(`${Math.hypot(NaN, 1, Infinity)} ${Math.hypot(NaN, 1, 2)} ${Math.hypot(1, 2, 3, -Infinity, NaN)} ${Math.hypot(1, NaN, 2, 3)}`);
  const xs = [0.7, -1.3, 2.9, 1e-5, 33.25];
  out.push(`${Math.hypot(...xs)} ${Math.hypot(...xs.slice(0, 3))} ${Math.hypot(...xs.slice(0, 2))} ${Math.hypot(...xs.slice(0, 1))} ${Math.hypot(...xs.slice(9))}`);
  let seed = 11;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return (seed / 2147483648 - 0.5) * 10 ** Math.floor((seed % 97) / 4 - 12);
  };
  let h = 0;
  for (let i = 0; i < 300; i++) h += Math.hypot(rnd(), rnd(), rnd()) + Math.hypot(rnd(), rnd(), rnd(), rnd(), rnd());
  out.push(`${h}`);
  return out;
}

export function rsUri(): string[] {
  const out: string[] = [];
  const s = "a b&c=d/é?€😀#~*'()!;,:@$+";
  out.push(encodeURIComponent(s));
  out.push(encodeURI(s));
  out.push(decodeURIComponent(encodeURIComponent(s)) === s ? "round trip" : "differs");
  out.push(decodeURI("%41%2F%3f%E2%82%AC%23x") + " " + decodeURIComponent("%41%2F%3f%E2%82%AC%23x"));
  out.push(encodeURIComponent(42) + " " + encodeURIComponent(true));
  for (const bad of ["%", "%zz", "%E2%82", "%C0%80", "%ED%A0%80", "%F4%90%80%80", "%80"]) {
    try {
      out.push(`ok ${decodeURIComponent(bad)}`);
    } catch (e) {
      out.push(`${bad}: ${e instanceof URIError} ${(e as Error).name}`);
    }
  }
  const params: Record<string, string> = { q: "fish & chips", page: "2", lang: "pt-BR" };
  out.push(Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]!)}`).join("&"));
  return out;
}

// Names the runtimes use (`Task`, `Result`, `Node`, `Range`, `Var`, `it`…) are renamed natively, not rejected.
class Task {
  constructor(readonly title: string, public done = false) {}
  toggle(): Task {
    return new Task(this.title, !this.done);
  }
}
interface Result {
  ok: boolean;
  value: number;
}
enum Node {
  Leaf,
  Branch,
}
type Range = { from: number; to: number };
class Var<T> {
  constructor(public value: T) {}
}
function Style(n: number): string {
  return `style ${n}`;
}

export function rsReservedNames(): string[] {
  const out: string[] = [];
  const t = new Task("write").toggle();
  out.push(`${t.title} ${t.done}`);
  const r: Result = { ok: true, value: 3 };
  const range: Range = { from: 1, to: 4 };
  out.push(`${r.ok} ${r.value} ${range.to - range.from} ${Node.Branch} ${JSON.stringify(r)}`);
  const v = new Var<string>("x");
  v.value += "y";
  out.push(`${v.value} ${Style(2)}`);
  const it = [1, 2, 3];
  const self = it.map((x) => x * 2);
  out.push(`${self.join()}`);
  class Timer {
    ticks = 0;
  }
  const tm = new Timer();
  tm.ticks++;
  out.push(`ticks ${tm.ticks}`);
  return out;
}

function rsParse(text: string): number {
  const n = Number(text);
  if (Number.isNaN(n)) throw new Error(`bad ${text}`);
  return n;
}
// A top-level value whose initializer can throw (it doesn't here): uncaught would stop the program, as in JavaScript.
const rsLimit = rsParse("10");
let rsTable: number[] = ["1", "2", "3"].map((s) => rsParse(s) * rsLimit);

export function rsThrowingGlobals(): string[] {
  rsTable = [...rsTable, rsLimit];
  return [`${rsLimit} ${rsTable.join(",")}`];
}
