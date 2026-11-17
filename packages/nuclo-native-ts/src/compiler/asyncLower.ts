/**
 * Async functions, lowered in the IR so every target runs the same code with JavaScript's job order (see the runtimes'
 * `JsPromise`): the function returns `async.run(step)`, which makes its promise and runs `step` at once, as JavaScript
 * runs an async function's body up to its first `await`. `step` is a closure taking the promise (`co`): a `switch` on
 * the state variable, one case per stretch of the body between two awaits. `await p` registers the function's
 * resumption on `p` (`async.await`: one microtask after `p` settles, as JavaScript's Await) and returns; the next case
 * starts with `async.check` (throws `p`'s error where the `await` was). Errors go to the `catch` of the `try` the
 * state is in (a table, as regenerator does); `finally` blocks around awaits record how they were entered.
 *
 * Statements without an `await` stay as they are, inside their state. The locals of the body that live across an
 * `await` are declared before `step` (renamed apart; a type with no zero value is stored as an optional and read
 * unwrapped): `step` captures them, and closures in the body share them. `step` never captures its promise (it gets
 * it as its argument), so a pending promise that nothing references is freed with everything its step holds.
 *
 * The front-end writes `await p` as an `await` expression; it checked that nothing evaluated before an `await` in its
 * statement could observe the suspension (see transpile.ts `checkAwait`), so the awaits of a statement are taken out
 * of it, in evaluation order, and run first.
 */
import type { Expr, Param, Stmt, Ty } from "./ir.ts";

export interface AsyncInput {
  body: Stmt[];
  /** T of the function's `Promise<T>`. */
  ret: Ty;
  params: Param[];
  fresh: (base: string) => string;
  error: (message: string) => void;
}

type Await = Extract<Expr, { e: "await" }>;

const id = (name: string): Expr => ({ e: "id", name });
const int = (v: number): Expr => ({ e: "int", v: String(v) });
const set = (name: string, value: Expr): Stmt => ({ s: "assign", target: id(name), op: "=", value });
const op = (name: string, args: Expr[], extra: Partial<Extract<Expr, { e: "op" }>> = {}): Expr => ({ e: "op", op: name as never, args, ...extra });
const promiseTy = (of: Ty): Ty => ({ k: "promise", of }) as Ty;

/** Its zero value: what a hoisted local starts at (none: the local is stored as an optional). */
export function zeroOf(ty: Ty): Expr | undefined {
  switch (ty.k) {
    case "int":
      return int(0);
    case "double":
      return { e: "double", v: "0.0" };
    case "num":
      return { e: "numCast", x: { e: "int", v: "0" }, from: { k: "int" }, to: ty };
    case "string":
      return { e: "str", v: "" };
    case "bool":
      return { e: "bool", v: false };
    case "array":
      return { e: "arr", of: ty.of, items: [] };
    case "map":
      return { e: "dict", of: ty.of, entries: [] };
    case "jsmap":
    case "jsset":
      return { e: "op", op: "mc.new", args: [], ty };
    case "optional":
      return { e: "nil" };
    default:
      return undefined;
  }
}

/** Whether something under `node` (not in a nested function) matches. */
function some(node: unknown, test: (n: Record<string, unknown>) => boolean | undefined): boolean {
  if (Array.isArray(node)) return node.some((n) => some(n, test));
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  const hit = test(n);
  if (hit !== undefined) return hit;
  return Object.values(n).some((v) => some(v, test));
}

const nested = (n: Record<string, unknown>) => n.e === "lambda" || n.s === "fn";
export const hasAwait = (x: unknown) => some(x, (n) => (n.e === "await" ? true : nested(n) ? false : undefined));
const hasReturn = (x: unknown) => some(x, (n) => (n.s === "return" ? true : nested(n) ? false : undefined));
/** A `try … finally` holding a `return` (natively the promise would settle before the finally block ran). */
const finallyReturn = (x: unknown) => some(x, (n) => (n.s === "try" && n.finally ? hasReturn(n) || undefined : nested(n) ? false : undefined));
/** A `break` in the middle of a switch case (a Kotlin `when` / Rust `match` would leave the loop around it instead). */
const switchBreak = (x: unknown) =>
  some(x, (n) => {
    if (nested(n)) return false;
    if (n.s !== "switch") return undefined;
    const s = n as Extract<Stmt, { s: "switch" }>;
    const breaks = (stmts: Stmt[]): boolean =>
      stmts.some((t) => (t.s === "break" && !t.label) || (t.s === "if" && (breaks(t.then) || breaks(t.else ?? []))) || (t.s === "try" && (breaks(t.body) || breaks(t.catchBody))) || (t.s === "block" && breaks(t.body)));
    return [...s.cases.map((c) => c.body), s.default ?? []].some(breaks) || undefined;
  });

interface Hoisted {
  name: string;
  ty: Ty;
  /** Stored as an optional (its type has no zero value): reads unwrap it. */
  boxed: boolean;
  /** Declared inside a loop the machine takes apart: a closure must not capture it (the turns would share it). */
  loop: boolean;
}

interface TryFrame {
  phase: "body" | "catch" | "finally";
  catchLabel?: number;
  catchVar?: Hoisted;
  finLabel?: number;
  /** How the finally block was entered (0 normally, 1 a return, 2 an error, 3 a jump), the error, the jump's target. */
  fk?: string;
  fe?: string;
  ft?: string;
}

interface Breakable {
  brk: number;
  cont?: number;
  tries: number;
  /** A labelled loop's label. */
  label?: string;
}

export function lowerAsync(m: AsyncInput): Stmt[] {
  const decls: Extract<Stmt, { s: "let" }>[] = [];
  const fns: Stmt[] = [];
  const co = m.fresh("co");
  const st = m.fresh("st");
  decls.push({ s: "let", name: st, ty: { k: "int" }, init: int(0), mutable: true });
  const hoist = (base: string, ty: Ty, loop = false): Hoisted => {
    const zero = zeroOf(ty);
    const h: Hoisted = { name: m.fresh(base), ty, boxed: !zero, loop };
    decls.push({ s: "let", name: h.name, ty: zero ? ty : { k: "optional", of: ty }, init: zero ?? { e: "nil" }, mutable: true });
    return h;
  };
  const read = (h: Hoisted): Expr => (h.boxed ? { e: "unwrap", x: id(h.name) } : id(h.name));
  let rv: Hoisted | undefined;
  const retVal = () => (rv ??= hoist("rv", m.ret));

  // Scopes: a name is a hoisted local of the machine, or a native binding (params, locals of kept statements, closures').
  const scopes: Map<string, Hoisted | null>[] = [new Map(m.params.map((p) => [p.name, null]))];
  const lookup = (name: string): Hoisted | null | undefined => {
    for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i]!.has(name)) return scopes[i]!.get(name);
    return undefined;
  };
  const scoped = <T>(f: () => T): T => {
    scopes.push(new Map());
    try {
      return f();
    } finally {
      scopes.pop();
    }
  };
  let loopDepth = 0;

  // ---- Rewriting kept code: names, and the ways out of it (return, break / continue to a loop the machine took apart).
  interface Ways {
    /** Inside a kept loop (its own break / continue), or a kept switch (its break). */
    loop: boolean;
    sw: boolean;
    lambda: boolean;
    /** The labels of the kept loops and blocks around. */
    labels?: string[];
  }
  const labelled = (w: Ways, s: { label?: string }) => (s.label ? [...(w.labels ?? []), s.label] : w.labels);
  const rx = (x: Expr, w: Ways): Expr => {
    switch (x.e) {
      case "id": {
        const h = lookup(x.name);
        if (!h) return x;
        if (w.lambda && h.loop) m.error(`A closure in an async function uses ${x.name}, declared in a loop that awaits: natively the loop's turns would share it. Pass it to a function that makes the closure.`);
        return read(h);
      }
      case "lambda":
        return scoped(() => {
          for (const p of x.params) scopes.at(-1)!.set(p.name, null);
          const inner: Ways = { loop: false, sw: false, lambda: true };
          return { ...x, body: Array.isArray(x.body) ? rlist(x.body, inner, true) : rx(x.body, inner) };
        });
      case "incr":
        return { ...x, target: rtarget(x.target, w), one: rx(x.one, w) };
      // An assignment used as a value: its statements (their own lets), then its value, read where they are.
      case "seq":
        return scoped(() => {
          const body = rlist(x.body, w, false);
          return { ...x, body, x: rx(x.x, w) };
        });
      case "await":
        m.error("Unsupported: `await` here; assign it to a const first.");
        return x;
      default: {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(x)) out[k] = rany(v, w);
        return out as Expr;
      }
    }
  };
  const rany = (v: unknown, w: Ways): unknown => {
    if (Array.isArray(v)) return v.map((i) => rany(i, w));
    if (v && typeof v === "object") return "e" in v ? rx(v as Expr, w) : Object.fromEntries(Object.entries(v).map(([k, i]) => [k, rany(i, w)]));
    return v;
  };
  /** An assignment target: a hoisted local is written, not unwrapped. */
  const rtarget = (t: Expr, w: Ways): Expr => {
    if (t.e === "id") {
      const h = lookup(t.name);
      if (h) return id(h.name);
    }
    return rx(t, w);
  };
  const rlist = (stmts: Stmt[], w: Ways, own: boolean): Stmt[] => {
    const run = () => {
      for (const s of stmts) if (s.s === "let") scopes.at(-1)!.set(s.name, null);
      for (const s of stmts) if (s.s === "fn") scopes.at(-1)!.set(s.decl.name, null);
      return stmts.flatMap((s) => rstmt(s, w));
    };
    return own ? scoped(run) : run();
  };
  const rstmt = (s: Stmt, w: Ways): Stmt[] => {
    switch (s.s) {
      case "let":
        scopes.at(-1)!.set(s.name, null);
        return [{ ...s, init: s.init && rx(s.init, w) }];
      case "assign":
        return [{ ...s, target: rtarget(s.target, w), value: rx(s.value, w) }];
      case "expr":
        return [{ ...s, x: rx(s.x, w) }];
      case "if":
        return [{ s: "if", c: rx(s.c, w), then: rlist(s.then, w, true), ...(s.else ? { else: rlist(s.else, w, true) } : {}) }];
      case "while":
        return [{ ...s, c: rx(s.c, w), body: rlist(s.body, { ...w, loop: true, sw: false, labels: labelled(w, s) }, true) }];
      case "forOf": {
        const of = rx(s.of, w);
        return [scoped(() => (scopes.at(-1)!.set(s.name, null), { ...s, of, body: rlist(s.body, { ...w, loop: true, sw: false, labels: labelled(w, s) }, true) }))];
      }
      case "forRange": {
        const [from, to] = [rx(s.from, w), rx(s.to, w)];
        return [scoped(() => (scopes.at(-1)!.set(s.name, null), { ...s, from, to, body: rlist(s.body, { ...w, loop: true, sw: false, labels: labelled(w, s) }, true) }))];
      }
      case "switch":
        return [{ s: "switch", x: rx(s.x, w), cases: s.cases.map((c) => ({ values: c.values.map((v) => rx(v, w)), body: rlist(c.body, { ...w, sw: true }, true) })), ...(s.default ? { default: rlist(s.default, { ...w, sw: true }, true) } : {}) }];
      case "try": {
        const out: Extract<Stmt, { s: "try" }> = { s: "try", body: rlist(s.body, w, true), catchBody: scoped(() => (s.catchName && scopes.at(-1)!.set(s.catchName, null), rlist(s.catchBody, w, false))) };
        if (s.catchName) out.catchName = s.catchName;
        if (s.finally) out.finally = rlist(s.finally, w, true);
        if (s.lowered) out.lowered = rlist(s.lowered, w, true);
        return [out];
      }
      case "block":
        return [{ ...s, body: rlist(s.body, { ...w, labels: labelled(w, s) }, true) }];
      case "return":
        if (w.lambda) return [{ ...s, x: s.x && rx(s.x, w) }];
        return returnPath(s.x && rx(s.x, w));
      case "break":
        // A label of a statement the machine took apart: a jump there.
        if (s.label && !w.lambda && !w.labels?.includes(s.label) && breakables.some((b) => b.label === s.label)) return breakPath(false, s.label);
        if (w.lambda || s.label || w.loop || w.sw) return [s];
        return breakPath(false);
      case "continue":
        if (s.label && !w.lambda && !w.labels?.includes(s.label) && breakables.some((b) => b.label === s.label)) return breakPath(true, s.label);
        if (w.lambda || w.loop || s.label) return [s];
        return breakPath(true);
      case "throw":
        return [{ ...s, message: rx(s.message, w) }];
      case "rethrow":
        return [{ ...s, error: rx(s.error, w) }];
      case "fn":
        return [{ s: "fn", decl: scoped(() => {
          for (const p of s.decl.params) scopes.at(-1)!.set(p.name, null);
          return { ...s.decl, body: rlist(s.decl.body, { loop: false, sw: false, lambda: true }, false) };
        }) }];
      default:
        return [s];
    }
  };
  const kept: Ways = { loop: false, sw: false, lambda: false };

  // ---- The machine: cases of one `switch` on the state.
  const cases: { label: number; body: Stmt[] }[] = [];
  const handlers = new Map<number, Stmt[]>();
  let cur: Stmt[] | undefined;
  let nextLabel = 1;
  const tries: TryFrame[] = [];
  const breakables: Breakable[] = [];
  const newLabel = () => nextLabel++;
  const jump = (label: number): Stmt[] => [set(st, int(label)), { s: "continue" }];
  const handler = (): Stmt[] => {
    for (let i = tries.length - 1; i >= 0; i--) {
      const t = tries[i]!;
      if (t.phase === "body" && t.catchLabel !== undefined) return [...(t.catchVar ? [set(t.catchVar.name, id("e__async"))] : []), ...jump(t.catchLabel)];
      if (t.phase !== "finally" && t.finLabel !== undefined) return [set(t.fe!, id("e__async")), set(t.fk!, int(2)), ...jump(t.finLabel)];
    }
    return [];
  };
  const open = (label: number) => {
    cur = [];
    cases.push({ label, body: cur });
    handlers.set(label, handler());
  };
  const ends = (s: Stmt) => s.s === "return" || s.s === "continue" || s.s === "throw" || s.s === "rethrow" || s.s === "unreachable";
  const emit = (...stmts: Stmt[]) => {
    if (!cur) return;
    cur.push(...stmts);
    if (stmts.some(ends)) cur = undefined;
  };
  const goto = (label: number) => emit(...jump(label));
  const settle = (value: Expr | undefined): Stmt[] => {
    if (value?.e === "op" && (value.op as string) === "promise.adopt") return [{ s: "expr", x: op("async.adopt", [id(co), value.args[0]!]) }, { s: "return" }];
    return [{ s: "expr", x: op("async.resolve", [id(co), ...(value && m.ret.k !== "void" ? [value] : [])]) }, { s: "return" }];
  };
  // A `return value` from here: through the finally blocks it leaves (innermost first), then the promise settles.
  function returnPath(value: Expr | undefined): Stmt[] {
    const t = [...tries].reverse().find((f) => f.phase !== "finally" && f.finLabel !== undefined);
    if (!t) return settle(value);
    if (value?.e === "op" && (value.op as string) === "promise.adopt") m.error("Unsupported: returning a promise from inside a `try` with `finally` in an async function; return `await p` instead.");
    const keep = value && m.ret.k !== "void" ? [{ s: "assign", target: id(retVal().name), op: "=", value } as Stmt] : [];
    return [...keep, set(t.fk!, int(1)), ...jump(t.finLabel!)];
  }
  // A jump to `target` from here, through the finally blocks between (each records where to go next).
  const jumpPath = (target: number, depth: number): Stmt[] => {
    const crossed = tries.slice(depth).filter((f) => f.phase !== "finally" && f.finLabel !== undefined).reverse();
    if (!crossed.length) return jump(target);
    const via = (rest: TryFrame[]): number => {
      if (rest.length === 1) return target;
      const [, next, ...more] = rest;
      const label = newLabel();
      cases.push({ label, body: [set(next!.fk!, int(3)), set(next!.ft!, int(via([next!, ...more]))), ...jump(next!.finLabel!)] });
      handlers.set(label, []);
      return label;
    };
    const t = crossed[0]!;
    return [set(t.fk!, int(3)), set(t.ft!, int(via(crossed))), ...jump(t.finLabel!)];
  };
  function breakPath(isContinue: boolean, label?: string): Stmt[] {
    const b = [...breakables].reverse().find((x) => (label ? x.label === label : !isContinue || x.cont !== undefined));
    if (!b) return m.error("Unsupported: this break / continue in an async function."), [];
    return jumpPath(isContinue ? b.cont! : b.brk, b.tries);
  }

  // Awaits taken out of an expression, in evaluation order: each becomes a hoisted value (`aw`) read in its place.
  const awaits = (x: unknown, w: Ways, out: Stmt[]): unknown => {
    if (Array.isArray(x)) return x.map((v) => awaits(v, w, out));
    if (!x || typeof x !== "object") return x;
    const n = x as Record<string, unknown>;
    if (n.e === "lambda") return rx(n as Expr, w);
    if (n.e === "await") {
      const a = n as Await;
      const promise = awaits(a.x, w, out) as Expr;
      const value = a.ty.k === "void" ? undefined : hoist("aw", a.ty);
      const next = newLabel();
      const store: Expr[] = value ? [{ e: "lambda", params: [{ name: "v__async", ty: a.ty }], ret: { k: "void" }, body: [set(value.name, id("v__async"))] }] : [];
      out.push({ s: "expr", x: op("async.await", [id(co), promise, ...store]) }, { s: "expr", x: { e: "int", v: `${next}` } });
      return value ? read(value) : { e: "nil" };
    }
    if ("e" in n) {
      if (n.e === "id") return rx(n as Expr, w);
      const res: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(n)) res[k] = awaits(v, w, out);
      return res;
    }
    return Object.fromEntries(Object.entries(n).map(([k, v]) => [k, awaits(v, w, out)]));
  };
  /** Runs the awaits `pre` holds (each: register, return, resume in the next state with its error thrown there). */
  const flush = (pre: Stmt[]) => {
    for (let i = 0; i < pre.length; i += 2) {
      const next = Number(((pre[i + 1] as Extract<Stmt, { s: "expr" }>).x as { v: string }).v);
      emit(pre[i]!, set(st, int(next)), { s: "return" });
      open(next);
      emit({ s: "expr", x: op("async.check", [id(co)], { throws: true }) });
    }
  };
  const take = <T>(x: T): T => {
    const pre: Stmt[] = [];
    const out = awaits(x, kept, pre) as T;
    flush(pre);
    return out;
  };

  const explode = (s: Stmt, fin: boolean): boolean => hasAwait(s) || finallyReturn(s) || (fin && hasReturn(s)) || switchBreak(s);
  const inFinallyRegion = () => tries.some((t) => t.phase !== "finally" && t.finLabel !== undefined);

  const list = (stmts: Stmt[], own: boolean) => {
    const run = () => {
      // The list's locals are the machine's (hoisted), visible to the functions it declares.
      for (const s of stmts) if (s.s === "let") scopes.at(-1)!.set(s.name, hoist(s.name, s.ty, loopDepth > 0));
      for (const s of stmts) if (s.s === "fn") scopes.at(-1)!.set(s.decl.name, null);
      for (const s of stmts) if (s.s === "fn") fns.push(...rstmt(s, kept));
      for (const s of stmts) if (s.s !== "fn") machineStmt(s);
    };
    if (own) scoped(run);
    else run();
  };

  const machineStmt = (s: Stmt): void => {
    if (!cur) return;
    switch (s.s) {
      case "let": {
        // Its own initializer reads what the name meant before (`let p = p` shadowing a parameter).
        const own = scopes.at(-1)!;
        const h = own.get(s.name)!;
        own.delete(s.name);
        const init = s.init ? take(s.init) : zeroOf(s.ty) ?? { e: "nil" };
        own.set(s.name, h);
        emit({ s: "assign", target: id(h.name), op: "=", value: init });
        return;
      }
      case "expr": {
        const x = take(s.x);
        if (hasAwait(s.x) && (x.e === "nil" || x.e === "id" || (x.e === "unwrap" && x.x.e === "id"))) return;
        return void emit({ ...s, x });
      }
      case "assign": {
        const target = s.target.e === "id" ? rtarget(s.target, kept) : take(s.target);
        return void emit({ ...s, target, value: take(s.value) });
      }
      case "return":
        return void emit(...returnPath(s.x && take(s.x)));
      case "throw":
        return void emit({ ...s, message: take(s.message) });
      case "rethrow":
        return void emit({ ...s, error: take(s.error) });
      case "break":
      case "continue":
        if (s.label && breakables.some((b) => b.label === s.label)) return void emit(...breakPath(s.s === "continue", s.label));
        if (s.label) return void emit(s);
        return void emit(...breakPath(s.s === "continue"));
      case "if": {
        const c = take(s.c);
        if (!explode({ ...s, c: { e: "nil" } }, inFinallyRegion())) return void emit({ ...(rstmt({ ...s, c: { e: "nil" } }, kept)[0] as Extract<Stmt, { s: "if" }>), c });
        const [thenL, elseL, end] = [newLabel(), s.else ? newLabel() : undefined, newLabel()];
        emit({ s: "if", c, then: jump(thenL), else: jump(elseL ?? end) });
        open(thenL);
        list(s.then, true);
        goto(end);
        if (elseL) {
          open(elseL);
          list(s.else!, true);
          goto(end);
        }
        return open(end);
      }
      case "while": {
        if (!explode(s, inFinallyRegion())) return void emit(...rstmt(s, kept));
        const [head, end] = [newLabel(), newLabel()];
        goto(head);
        open(head);
        const c = take(s.c);
        emit({ s: "if", c: { e: "not", x: c }, then: jump(end) });
        loop({ brk: end, cont: head, tries: tries.length, label: s.label }, () => list(s.body, true));
        goto(head);
        return open(end);
      }
      case "forOf": {
        if (!explode(s, inFinallyRegion())) return void emit(...rstmt(s, kept));
        if (!s.elem) return void m.error("Unsupported: this for-of loop around an `await`; iterate an array.");
        const of = take(s.of);
        const arr = hoist("arr", { k: "array", of: s.elem });
        const i = hoist("i", { k: "int" });
        const [head, end] = [newLabel(), newLabel()];
        emit(set(arr.name, of), set(i.name, int(0)));
        goto(head);
        open(head);
        emit({ s: "if", c: { e: "bin", op: ">=", l: id(i.name), r: op("arr.length", [id(arr.name)]) }, then: jump(end) });
        scoped(() => {
          const item = hoist(s.name, s.elem!, true);
          scopes.at(-1)!.set(s.name, item);
          emit(set(item.name, { e: "index", obj: id(arr.name), index: id(i.name) }), { s: "assign", target: id(i.name), op: "+=", value: int(1) });
          loop({ brk: end, cont: head, tries: tries.length, label: s.label }, () => list(s.body, true));
        });
        goto(head);
        return open(end);
      }
      case "forRange": {
        if (!explode(s, inFinallyRegion())) return void emit(...rstmt(s, kept));
        const from = take(s.from);
        const to = take(s.to);
        const bound = hoist("to", { k: "int" });
        const [head, step, end] = [newLabel(), newLabel(), newLabel()];
        scoped(() => {
          const i = hoist(s.name, { k: "int" }, true);
          scopes.at(-1)!.set(s.name, i);
          emit(set(i.name, from), set(bound.name, to));
          goto(head);
          open(head);
          emit({ s: "if", c: { e: "bin", op: s.inclusive ? ">" : ">=", l: id(i.name), r: id(bound.name) }, then: jump(end) });
          loop({ brk: end, cont: step, tries: tries.length, label: s.label }, () => list(s.body, true));
          goto(step);
          open(step);
          emit({ s: "assign", target: id(i.name), op: "+=", value: int(1) });
          goto(head);
        });
        return open(end);
      }
      case "switch": {
        const x = take(s.x);
        if (!explode({ ...s, x: { e: "nil" } }, inFinallyRegion())) return void emit({ ...(rstmt({ ...s, x: { e: "nil" } }, kept)[0] as Extract<Stmt, { s: "switch" }>), x });
        const labels = s.cases.map(() => newLabel());
        const [def, end] = [s.default ? newLabel() : undefined, newLabel()];
        emit({ s: "switch", x, cases: s.cases.map((c, i) => ({ values: c.values.map((v) => rx(v, kept)), body: jump(labels[i]!) })), default: jump(def ?? end) });
        // A break leaves the switch; a continue goes to the loop around it.
        breakables.push({ brk: end, tries: tries.length });
        s.cases.forEach((c, i) => {
          open(labels[i]!);
          list(c.body, true);
          goto(end);
        });
        if (def) {
          open(def);
          list(s.default!, true);
          goto(end);
        }
        breakables.pop();
        return open(end);
      }
      case "try": {
        if (!explode(s, inFinallyRegion())) return void emit(...rstmt(s, kept));
        const t: TryFrame = { phase: "body" };
        const end = newLabel();
        const body = newLabel();
        if (s.catchBody.length && !(s.finally && s.catchBody.length === 1 && s.catchBody[0]!.s === "rethrow" && s.catchBody[0]!.error.e === "id" && s.catchBody[0]!.error.name === s.catchName)) {
          t.catchLabel = newLabel();
          if (s.catchName) t.catchVar = hoist(s.catchName, { k: "rt", name: "Error" }, loopDepth > 0);
        }
        if (s.finally) {
          t.finLabel = newLabel();
          t.fk = hoist("fk", { k: "int" }).name;
          t.fe = hoist("fe", { k: "optional", of: { k: "rt", name: "Error" } }).name;
          t.ft = hoist("ft", { k: "int" }).name;
        }
        const normal = () => (t.finLabel !== undefined ? emit(set(t.fk!, int(0)), ...jump(t.finLabel)) : goto(end));
        tries.push(t);
        goto(body);
        open(body);
        list(s.body, true);
        normal();
        if (t.catchLabel !== undefined) {
          t.phase = "catch";
          open(t.catchLabel);
          scoped(() => {
            if (s.catchName) scopes.at(-1)!.set(s.catchName, t.catchVar!);
            list(s.catchBody, false);
          });
          normal();
        }
        if (t.finLabel !== undefined) {
          t.phase = "finally";
          open(t.finLabel);
          list(s.finally!, true);
          tries.pop();
          if (cur) {
            if (rv || m.ret.k === "void") emit({ s: "if", c: { e: "bin", op: "==", l: id(t.fk!), r: int(1) }, then: returnPath(rv && read(rv)) });
            emit({ s: "if", c: { e: "bin", op: "==", l: id(t.fk!), r: int(2) }, then: [{ s: "rethrow", error: { e: "unwrap", x: id(t.fe!) } }] });
            emit({ s: "if", c: { e: "bin", op: "==", l: id(t.fk!), r: int(3) }, then: [set(st, id(t.ft!)), { s: "continue" }] });
          }
          goto(end);
        } else tries.pop();
        return open(end);
      }
      case "block":
        return void m.error("Unsupported: a labelled block around an `await`.");
      default:
        return void emit(...rstmt(s, kept));
    }
  };
  const loop = (b: Breakable, f: () => void) => {
    breakables.push(b);
    loopDepth++;
    try {
      f();
    } finally {
      loopDepth--;
      breakables.pop();
    }
  };

  open(0);
  list(m.body, false);
  // The end of the body: `undefined` (TypeScript proved a function of another type never gets there).
  if (cur) emit(...(m.ret.k === "void" || m.ret.k === "optional" ? settle(m.ret.k === "optional" ? { e: "nil" } : undefined) : [{ s: "unreachable" } as Stmt]));

  // The step: `while true { do { switch st { … } } catch { the handler of the state, or reject } }`.
  const dispatch: Stmt = { s: "switch", x: id(st), cases: cases.map((c) => ({ values: [int(c.label)], body: c.body.length ? c.body : [{ s: "return" }] })), default: [{ s: "return" }] };
  const groups = new Map<string, number[]>();
  for (const [label, h] of handlers) {
    if (!h.length) continue;
    const key = JSON.stringify(h);
    groups.set(key, [...(groups.get(key) ?? []), label]);
  }
  const catchBody: Stmt[] = [...groups].map(([key, labels]) => ({
    s: "if",
    c: labels.map((l): Expr => ({ e: "bin", op: "==", l: id(st), r: int(l) })).reduce((a, b) => ({ e: "bin", op: "||", l: a, r: b })),
    then: JSON.parse(key) as Stmt[],
  }));
  catchBody.push({ s: "expr", x: op("async.reject", [id(co), id("e__async")]) }, { s: "return" });
  const step: Expr = {
    e: "lambda",
    params: [{ name: co, ty: promiseTy(m.ret) }],
    ret: { k: "void" },
    body: [{ s: "while", c: { e: "bool", v: true }, body: [{ s: "try", body: [dispatch, { s: "return" }], catchName: "e__async", catchBody }] }],
  };
  return [...decls, ...fns, { s: "return", x: op("async.run", [step], { ty: promiseTy(m.ret) } as never) }];
}
