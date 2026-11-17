/**
 * Generators (`function*`), lowered in the IR so every target runs the same code: each generator function is a
 * state machine class (a subclass of the generator type's base class, see `genBase`) whose `resume__()` runs the
 * body from where it stopped to the next `yield` (it returns true, the value in `value__`) or to its end (false,
 * the return value in `ret__`). Locals that live across a `yield` are fields; statements without a `yield` stay as
 * they are. No thread, no coroutine, no allocation per step: `for…of` and spread call `resume__()` directly, only
 * `it.next()` allocates its `{ value, done }` record. Closures in the body capture boxes of the fields they use
 * (`Ref__T`, made where JavaScript makes the binding), never the generator object: no reference cycle.
 *
 * The front-end writes a `yield` as a marker statement (`yieldMarker`), with the generator itself as the id `GEN`.
 */
import type { ClassDecl, Expr, MethodDecl, ObjectClassDecl, ObjectField, Param, Stmt, Ty } from "./ir.ts";

export const YIELD = "yield__";
/** The generator object, in the expressions the front-end writes for a `yield` (the value sent by `next(v)`). */
export const GEN = "this__gen";
/** The generator a `yield*` delegates to, in the expression that reads its return value. */
export const DELEGATE = "delegate__";

const START = 0;
const DONE = 1;

/** The native shape of `Generator<T, TReturn, TNext>`: its base class and `{ value, done }` record. */
export interface GenShape {
  base: string;
  result: string;
  /** T (absent: the generator yields only `undefined`). */
  value?: Ty;
  /** TReturn (absent: `void`, `undefined` or `any`). */
  ret?: Ty;
  /** TNext, when the generator reads what `next(v)` sends. */
  next?: Ty;
  /** Some generator of this shape can throw: every `resume__` of it is `throws`. */
  throws: boolean;
  /** An async generator's shape (`AsyncGenerator<T, R, N>`, asyncGenBase). */
  async?: boolean;
  /** `it.throw(e)` reaches generators of this shape (`throw__`, an `err__` field): then `throws` too. */
  throwIn?: boolean;
  /** Named as a generator type somewhere (else only its `{ value, done }` record is needed). */
  used?: boolean;
}

const id = (name: string): Expr => ({ e: "id", name });
const self: Expr = id("this");
const fld = (name: string, obj: Expr = self): Expr => ({ e: "prop", obj, name });
const int = (v: number): Expr => ({ e: "int", v: String(v) });
const bool = (v: boolean): Expr => ({ e: "bool", v });
const nil: Expr = { e: "nil" };
const set = (target: Expr, value: Expr): Stmt => ({ s: "assign", target, op: "=", value });
const eq = (l: Expr, r: Expr): Expr => ({ e: "bin", op: "==", l, r });
const not = (x: Expr): Expr => ({ e: "not", x });

/** `yield value` (`into`: where the value `next(v)` sends goes, read by `read`), or `yield* delegate`. */
export function yieldMarker(o: { value?: Expr; into?: Expr; read?: Expr; delegate?: Expr; base?: string; sameRet?: boolean; innerThrows?: boolean }): Stmt {
  const named: [string, Expr][] = [];
  if (o.into) named.push(["into", o.into], ["read", o.read!]);
  if (o.delegate) named.push(["delegate", o.delegate], ["base", { e: "str", v: o.base! }]);
  if (o.sameRet) named.push(["sameRet", bool(true)]);
  if (o.innerThrows) named.push(["innerThrows", bool(true)]);
  return { s: "expr", x: { e: "rt", name: YIELD, args: o.value ? [o.value] : [], named } };
}

const markerOf = (s: Stmt): Extract<Expr, { e: "rt" }> | undefined => (s.s === "expr" && s.x.e === "rt" && s.x.name === YIELD ? s.x : undefined);

/** Whether something under `node` (not in a nested function) matches. */
function some(node: unknown, test: (n: Record<string, unknown>) => boolean | undefined): boolean {
  if (Array.isArray(node)) return node.some((n) => some(n, test));
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  const hit = test(n);
  if (hit !== undefined) return hit;
  return Object.values(n).some((v) => some(v, test));
}

/** A `yield`, or (in an async generator) an `await`: where the machine stops. */
const hasYield = (x: unknown) => some(x, (n) => ((n.e === "rt" && n.name === YIELD) || n.e === "await" ? true : n.e === "lambda" || n.s === "fn" ? false : undefined));
const hasReturn = (x: unknown) => some(x, (n) => (n.s === "return" ? true : n.e === "lambda" || n.s === "fn" ? false : undefined));

/** The labels of the loops and blocks in `stmts` (not in nested functions). */
export function labelsIn(stmts: Stmt[]): Set<string> {
  const out = new Set<string>();
  some(stmts, (n) => {
    if (n.e === "lambda" || n.s === "fn") return false;
    if ((n.s === "while" || n.s === "forOf" || n.s === "forRange" || n.s === "block") && typeof n.label === "string") out.add(n.label);
    return undefined;
  });
  return out;
}

/** A `break` or `continue` in `s` that leaves it (to a loop or switch around it). */
function escapes(s: Stmt): boolean {
  const inside = labelsIn([s]);
  const walk = (stmts: Stmt[], loop: boolean, sw: boolean): boolean =>
    stmts.some((t) => {
      switch (t.s) {
        case "break":
          return t.label ? !inside.has(t.label) : !loop && !sw;
        case "continue":
          return t.label ? !inside.has(t.label) : !loop;
        case "if":
          return walk(t.then, loop, sw) || walk(t.else ?? [], loop, sw);
        case "while":
        case "forOf":
        case "forRange":
          return walk(t.body, true, false);
        case "switch":
          return t.cases.some((c) => walk(c.body, loop, true)) || walk(t.default ?? [], loop, true);
        case "try":
          return walk(t.body, loop, sw) || walk(t.catchBody, loop, sw) || walk(t.finally ?? [], loop, sw) || walk(t.lowered ?? [], loop, sw);
        case "block":
          return walk(t.body, loop, sw);
        default:
          return false;
      }
    });
  return walk([s], false, false);
}

/** Whether a loop body can leave its loop early: a `return`, a `break` of that loop, a `break` / `continue` to a label around it. */
export function leaves(body: Stmt[], own?: string): boolean {
  const inside = labelsIn(body);
  const walk = (stmts: Stmt[], inner: boolean): boolean =>
    stmts.some((t) => {
      switch (t.s) {
        case "return":
          return true;
        case "break":
          return t.label ? !inside.has(t.label) : !inner;
        case "continue":
          return !!t.label && t.label !== own && !inside.has(t.label);
        case "if":
          return walk(t.then, inner) || walk(t.else ?? [], inner);
        case "while":
        case "forOf":
        case "forRange":
          return walk(t.body, true);
        case "switch":
          return t.cases.some((c) => walk(c.body, true)) || walk(t.default ?? [], true);
        case "try":
          return walk(t.body, inner) || walk(t.catchBody, inner) || walk(t.finally ?? [], inner);
        case "block":
          return walk(t.body, inner);
        default:
          return false;
      }
    });
  return walk(body, false);
}

/** The base class of one generator type: the state the machines share, `next__`, `return__`, `close__`, and what `for…of`, spread and destructuring use. */
export function genBase(g: GenShape): { cls: ObjectClassDecl; result: ClassDecl } {
  const result: ClassDecl = {
    name: g.result,
    fields: [
      { name: "done", ty: { k: "bool" }, readonly: true, optional: false },
      ...(g.value ? [{ name: "value", ty: opt(g.value), readonly: true, optional: true }] : []),
      ...(g.ret ? [{ name: "ret", ty: opt(g.ret), readonly: true, optional: true }] : []),
    ],
    decodable: false,
  };
  const throws = g.throws ? { throws: true } : {};
  const resume: Expr = { e: "invoke", obj: self, name: "resume__", args: [], ...throws };
  const record = (done: boolean): Expr => ({
    e: "new",
    cls: g.result,
    args: [["done", bool(done)], ...(g.value ? [["value", done ? nil : fld("value__")] as [string, Expr]] : []), ...(g.ret ? [["ret", done ? fld("ret__") : nil] as [string, Expr]] : [])],
  });
  const step: Stmt[] = [{ s: "if", c: resume, then: [{ s: "return", x: record(false) }] }, { s: "return", x: record(true) }];
  const notStarted: Expr = { e: "bin", op: "||", l: eq(fld("state__"), int(START)), r: eq(fld("state__"), int(DONE)) };
  const resultTy: Ty = { k: "class", name: g.result };
  const method = (name: string, params: Param[], ret: Ty, body: Stmt[], abstract = false): MethodDecl => ({ name, params, ret, async: false, body, abstract, ...throws });
  const elems: Ty = { k: "array", of: g.value ?? { k: "optional", of: { k: "bool" } } };
  const push: Stmt = { s: "expr", x: { e: "op", op: "arr.push", args: [id("out"), g.value && g.value.k !== "optional" ? { e: "unwrap", x: fld("value__") } : g.value ? fld("value__") : nil] } };
  const fields: ObjectField[] = [
    { name: "state__", ty: { k: "int" }, readonly: false, optional: false, init: int(START) },
    { name: "mode__", ty: { k: "int" }, readonly: false, optional: false, init: int(0) },
  ];
  if (g.value) fields.push({ name: "value__", ty: opt(g.value), readonly: false, optional: true, init: nil });
  if (g.ret) fields.push({ name: "ret__", ty: opt(g.ret), readonly: false, optional: true, init: nil });
  if (g.next) fields.push({ name: "sent__", ty: opt(g.next), readonly: false, optional: true, init: nil });
  if (g.throwIn) fields.push({ name: "err__", ty: { k: "optional", of: ERROR }, readonly: false, optional: true, init: nil });
  const cls: ObjectClassDecl = {
    name: g.base,
    protocols: [],
    abstract: true,
    open: true,
    fields,
    ctor: { params: [], body: [] },
    methods: [
      method("resume__", [], { k: "bool" }, [], true),
      // `it.next(v)`: `v` is what the `yield` it resumes evaluates to.
      method("next__", g.next ? [{ name: "arg", ty: opt(g.next) }] : [], resultTy, [...(g.next ? [set(fld("sent__"), id("arg"))] : []), ...step]),
      // `it.return(v)`: a `return v` where the generator stopped (its `finally` blocks run, and may yield).
      method("return__", g.ret ? [{ name: "v", ty: opt(g.ret) }] : [], resultTy, [
        { s: "if", c: notStarted, then: [set(fld("state__"), int(DONE)), ...(g.ret ? [set(fld("ret__"), id("v"))] : []), { s: "return", x: record(true) }] },
        set(fld("mode__"), int(1)),
        ...(g.ret ? [set(fld("ret__"), id("v"))] : []),
        ...step,
      ]),
      // `it.throw(e)`: a `throw e` where the generator stopped (its `catch` / `finally` blocks see it). Not started or
      // done: it is done, and e comes out.
      ...(g.throwIn
        ? [method("throw__", [{ name: "e", ty: ERROR }], resultTy, [
            { s: "if", c: notStarted, then: [set(fld("state__"), int(DONE)), { s: "rethrow", error: id("e") }] },
            set(fld("mode__"), int(2)),
            set(fld("err__"), id("e")),
            ...step,
          ])]
        : []),
      // What `for…of` and destructuring call when they stop early: `return()`, its result unused.
      method("close__", [], { k: "void" }, [
        { s: "if", c: notStarted, then: [set(fld("state__"), int(DONE)), { s: "return" }] },
        set(fld("mode__"), int(1)),
        ...(g.ret ? [set(fld("ret__"), nil)] : []),
        { s: "if", c: resume, then: [] },
      ]),
      // `[...it]`, `Array.from(it)`.
      method("toArray__", [], elems, [
        { s: "let", name: "out", ty: elems, init: { e: "arr", of: elems.of, items: [] }, mutable: true },
        { s: "while", c: resume, body: [push] },
        { s: "return", x: id("out") },
      ]),
      // `const [a, b] = it`: the first `n` values, then `return()` if it isn't done.
      method("take__", [{ name: "n", ty: { k: "int" } }], elems, [
        { s: "let", name: "out", ty: elems, init: { e: "arr", of: elems.of, items: [] }, mutable: true },
        {
          s: "while",
          c: { e: "bin", op: "<", l: { e: "op", op: "arr.length", args: [id("out")] }, r: id("n") },
          body: [{ s: "if", c: not(resume), then: [{ s: "return", x: id("out") }] }, push],
        },
        { s: "expr", x: { e: "invoke", obj: self, name: "close__", args: [], ...throws } },
        { s: "return", x: id("out") },
      ]),
    ],
  };
  return { cls, result };
}

const opt = (t: Ty): Ty => (t.k === "optional" ? t : { k: "optional", of: t });
const ERROR: Ty = { k: "rt", name: "Error" };
const VOID: Ty = { k: "void" };
/** A promise reaction (`then2`'s callbacks, which may throw: a Rust `Result`). */
const lambda = (params: Param[], body: Stmt[]): Expr => ({ e: "lambda", params, ret: VOID, body, typed: true, throws: true });
const drive: Stmt = { s: "expr", x: { e: "invoke", obj: self, name: "drive__", args: [] } };

/**
 * The base class of one async generator type (`AsyncGenerator<T, R, N>`), as the specification runs one: requests
 * (`next(v)`, `return(v)`, `throw(e)`) queue up, each with its promise; the state machine (`resume__`, as for a
 * generator, which also stops at an `await`: `wait__`) runs the head request and settles its promise at the next
 * `yield` (then goes on with the next request at once, if any) or at its end (then the rest are done). `return(v)`
 * of one that isn't running at a `yield` awaits v first (AsyncGeneratorAwaitReturn). Job order: one job per
 * `await` (and the awaits JavaScript adds: the operand of `yield` and `return`), the request's promise settled where
 * the specification settles it; the runtimes' promises do the rest.
 */
export function asyncGenBase(g: GenShape): { cls: ObjectClassDecl; result: ClassDecl; req: ClassDecl } {
  const { result } = genBase({ ...g, async: false, throws: false, throwIn: false });
  const resultTy: Ty = { k: "class", name: g.result };
  const promiseTy = { k: "promise", of: resultTy } as Ty;
  const reqName = `AReq__${g.base.replace(/^AsyncGenerator__/, "")}`;
  const reqTy: Ty = { k: "class", name: reqName };
  const req: ClassDecl = {
    name: reqName,
    fields: [
      { name: "kind", ty: { k: "int" }, readonly: true, optional: false },
      ...(g.next ? [{ name: "sent", ty: opt(g.next), readonly: true, optional: true }] : []),
      ...(g.ret ? [{ name: "ret", ty: opt(g.ret), readonly: true, optional: true }] : []),
      { name: "err", ty: opt(ERROR), readonly: true, optional: true },
      { name: "p", ty: promiseTy, readonly: true, optional: false },
    ],
    decodable: false,
  };
  const q = fld("q__");
  const head: Expr = { e: "index", obj: q, index: int(0) };
  const shift: Stmt = { s: "expr", x: { e: "op", op: "arr.shift", args: [q] } };
  const qEmpty: Expr = eq({ e: "op", op: "arr.length", args: [q] }, int(0));
  const op = (name: string, args: Expr[], ty?: Ty): Expr => ({ e: "op", op: name as never, args, ...(ty ? { ty } : {}) });
  const resolve = (p: Expr, v: Expr): Stmt => ({ s: "expr", x: op("async.resolve", [p, v]) });
  const reject = (p: Expr, e: Expr): Stmt => ({ s: "expr", x: op("async.reject", [p, e]) });
  const record = (done: boolean, value: Expr): Expr => ({
    e: "new",
    cls: g.result,
    args: [["done", bool(done)], ...(g.value ? [["value", done ? nil : value] as [string, Expr]] : []), ...(g.ret ? [["ret", done ? value : nil] as [string, Expr]] : [])],
  });
  const fresh: Stmt = { s: "let", name: "p", ty: promiseTy, init: op("async.run", [{ e: "lambda", params: [{ name: "co__", ty: promiseTy }], ret: VOID, body: [], typed: true }], promiseTy), mutable: false };
  const make = (kind: number, extra: { sent?: Expr; ret?: Expr; err?: Expr }): Expr => ({
    e: "new",
    cls: reqName,
    args: [
      ["kind", int(kind)],
      ...(g.next ? [["sent", extra.sent ?? nil] as [string, Expr]] : []),
      ...(g.ret ? [["ret", extra.ret ?? nil] as [string, Expr]] : []),
      ["err", extra.err ?? nil],
      ["p", id("p")],
    ],
  });
  const push = (x: Expr): Stmt => ({ s: "expr", x: op("arr.push", [q, x]) });
  const idle: Expr = { e: "bin", op: "&&", l: not(fld("running__")), r: not(fld("retWait__")) };
  const completed: Expr = { e: "bin", op: "&&", l: eq(fld("state__"), int(DONE)), r: idle };
  // Resumes the machine with the head request (a `yield` takes its value, `return` or `throw` happens there).
  const takeHead: Stmt[] = [
    { s: "let", name: "n", ty: reqTy, init: head, mutable: false },
    set(fld("mode__"), fld("kind", id("n"))),
    ...(g.next ? [set(fld("sent__"), fld("sent", id("n")))] : []),
    ...(g.ret ? [{ s: "if", c: eq(fld("kind", id("n")), int(1)), then: [set(fld("ret__"), fld("ret", id("n")))] } as Stmt] : []),
    set(fld("err__"), fld("err", id("n"))),
  ];
  const method = (name: string, params: Param[], ret: Ty, body: Stmt[], extra: Partial<MethodDecl> = {}): MethodDecl => ({ name, params, ret, async: false, body, abstract: false, ...extra });
  const settleHead = (how: (p: Expr) => Stmt): Stmt[] => [{ s: "let", name: "h", ty: reqTy, init: head, mutable: false }, shift, how(fld("p", id("h")))];
  const retTy: Ty = g.ret ? opt(g.ret) : VOID;
  const fields: ObjectField[] = [
    { name: "state__", ty: { k: "int" }, readonly: false, optional: false, init: int(START) },
    { name: "mode__", ty: { k: "int" }, readonly: false, optional: false, init: int(0) },
    { name: "wait__", ty: { k: "bool" }, readonly: false, optional: false, init: bool(false) },
    { name: "running__", ty: { k: "bool" }, readonly: false, optional: false, init: bool(false) },
    { name: "retWait__", ty: { k: "bool" }, readonly: false, optional: false, init: bool(false) },
    ...(g.value ? [{ name: "value__", ty: opt(g.value), readonly: false, optional: true, init: nil }] : []),
    ...(g.ret ? [{ name: "ret__", ty: opt(g.ret), readonly: false, optional: true, init: nil }] : []),
    ...(g.next ? [{ name: "sent__", ty: opt(g.next), readonly: false, optional: true, init: nil }] : []),
    { name: "err__", ty: opt(ERROR), readonly: false, optional: true, init: nil },
    { name: "awe__", ty: opt(ERROR), readonly: false, optional: true, init: nil },
    { name: "q__", ty: { k: "array", of: reqTy }, readonly: false, optional: false, init: { e: "arr", of: reqTy, items: [] } },
  ];
  const cls: ObjectClassDecl = {
    name: g.base,
    protocols: [],
    abstract: true,
    open: true,
    fields,
    ctor: { params: [], body: [] },
    methods: [
      method("resume__", [], { k: "bool" }, [], { abstract: true, throws: true }),
      method("next__", g.next ? [{ name: "arg", ty: opt(g.next) }] : [], promiseTy, [
        fresh,
        { s: "if", c: completed, then: [resolve(id("p"), record(true, nil)), { s: "return", x: id("p") }] },
        push(make(0, { sent: g.next ? id("arg") : undefined })),
        { s: "if", c: idle, then: [...takeHead, drive] },
        { s: "return", x: id("p") },
      ]),
      method("return__", g.ret ? [{ name: "v", ty: opt(g.ret) }] : [], promiseTy, [
        fresh,
        push(make(1, { ret: g.ret ? id("v") : undefined })),
        {
          s: "if",
          c: idle,
          then: [
            {
              s: "if",
              c: { e: "bin", op: "||", l: eq(fld("state__"), int(START)), r: eq(fld("state__"), int(DONE)) },
              then: [set(fld("state__"), int(DONE)), set(fld("retWait__"), bool(true)), { s: "expr", x: { e: "invoke", obj: self, name: "awaitReturn__", args: [] } }],
              else: [...takeHead, drive],
            },
          ],
        },
        { s: "return", x: id("p") },
      ]),
      method("throw__", [{ name: "e", ty: ERROR }], promiseTy, [
        fresh,
        { s: "if", c: { e: "bin", op: "&&", l: eq(fld("state__"), int(START)), r: idle }, then: [set(fld("state__"), int(DONE))] },
        { s: "if", c: completed, then: [reject(id("p"), id("e")), { s: "return", x: id("p") }] },
        push(make(2, { err: id("e") })),
        { s: "if", c: idle, then: [...takeHead, drive] },
        { s: "return", x: id("p") },
      ]),
      // Runs the machine for the head request, and on with the next ones while they are there.
      method("drive__", [], VOID, [
        set(fld("running__"), bool(true)),
        {
          s: "while",
          c: bool(true),
          body: [
            { s: "let", name: "more", ty: { k: "bool" }, init: bool(false), mutable: true },
            {
              s: "try",
              body: [set(id("more"), { e: "invoke", obj: self, name: "resume__", args: [], throws: true })],
              catchName: "e__run",
              catchBody: [set(fld("running__"), bool(false)), set(fld("state__"), int(DONE)), ...settleHead((p) => reject(p, id("e__run"))), { s: "expr", x: { e: "invoke", obj: self, name: "drain__", args: [] } }, { s: "return" }],
            },
            { s: "if", c: fld("wait__"), then: [set(fld("wait__"), bool(false)), { s: "return" }] },
            {
              s: "if",
              c: not(id("more")),
              then: [set(fld("running__"), bool(false)), ...settleHead((p) => resolve(p, record(true, g.ret ? fld("ret__") : nil))), { s: "expr", x: { e: "invoke", obj: self, name: "drain__", args: [] } }, { s: "return" }],
            },
            ...settleHead((p) => resolve(p, record(false, g.value ? fld("value__") : nil))),
            { s: "if", c: qEmpty, then: [set(fld("running__"), bool(false)), { s: "return" }] },
            ...takeHead,
          ],
        },
      ]),
      // Done: the requests left are done at once, a `return(v)` among them awaits v first.
      method("drain__", [], VOID, [
        {
          s: "while",
          c: not(qEmpty),
          body: [
            { s: "if", c: eq(fld("kind", head), int(1)), then: [set(fld("retWait__"), bool(true)), { s: "expr", x: { e: "invoke", obj: self, name: "awaitReturn__", args: [] } }, { s: "return" }] },
            { s: "let", name: "h", ty: reqTy, init: head, mutable: false },
            shift,
            { s: "if", c: eq(fld("kind", id("h")), int(2)), then: [reject(fld("p", id("h")), { e: "unwrap", x: fld("err", id("h")) })], else: [resolve(fld("p", id("h")), record(true, nil))] },
          ],
        },
      ]),
      method("awaitReturn__", [], VOID, [
        {
          s: "expr",
          x: op(
            "promise.then2",
            [
              op("promise.resolve", g.ret ? [fld("ret", head)] : [], { k: "promise", of: retTy } as Ty),
              lambda([{ name: "v", ty: retTy }], [set(fld("retWait__"), bool(false)), ...settleHead((p) => resolve(p, record(true, g.ret ? id("v") : nil))), { s: "expr", x: { e: "invoke", obj: self, name: "drain__", args: [] } }]),
              lambda([{ name: "e", ty: ERROR }], [set(fld("retWait__"), bool(false)), ...settleHead((p) => reject(p, id("e"))), { s: "expr", x: { e: "invoke", obj: self, name: "drain__", args: [] } }]),
            ],
            { k: "promise", of: VOID } as Ty,
          ),
        },
      ]),
    ],
  };
  return { cls, result, req };
}

export interface MachineInput {
  name: string;
  shape: GenShape;
  /** The generator's parameters, then the enclosing locals it reads (captured by value), and a method's `this`. */
  params: Param[];
  captures: Param[];
  owner?: Ty;
  body: Stmt[];
  /** The `Ref__T` class boxing a `T` (made on first use). */
  refOf: (ty: Ty) => string;
  /** Whether IR statements can throw out of themselves. */
  irThrows: (x: unknown) => boolean;
  error: (message: string) => void;
}

/** A binding of the generator body: a native local (`native`), or a field of the machine (boxed when a closure reads it). */
interface Decl {
  name: string;
  native: boolean;
  field?: string;
  ty?: Ty;
  boxed?: boolean;
  owner?: boolean;
  /** A box made where its list starts (it has a zero value), so a hoisted function can capture it before the `let`. */
  early?: boolean;
}

interface TryFrame {
  phase: "body" | "catch" | "finally";
  catchLabel?: number;
  catchDecl?: Decl;
  finLabel?: number;
  ck: string;
  cv?: string;
  ce: string;
  ct: string;
}

interface Breakable {
  brk: number;
  cont?: number;
  tries: number;
  /** A labelled loop's label. */
  label?: string;
}

function zeroOf(ty: Ty): Expr | undefined {
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
      return bool(false);
    case "array":
      return { e: "arr", of: ty.of, items: [] };
    case "map":
      return { e: "dict", of: ty.of, entries: [] };
    case "jsmap":
    case "jsset":
      return { e: "op", op: "mc.new", args: [], ty };
    case "optional":
      return nil;
    default:
      return undefined;
  }
}

/** The state machine class of one generator function. */
export function genMachine(m: MachineInput): ObjectClassDecl {
  const { shape } = m;
  const fields: ObjectField[] = [];
  const taken = new Set(["state__", "mode__", "value__", "ret__", "sent__", "self__"]);
  const addField = (base: string, ty: Ty): string => {
    let name = base;
    for (let i = 2; taken.has(name); i++) name = `${base}__${i}`;
    taken.add(name);
    const zero = zeroOf(ty);
    fields.push({ name, ty, readonly: false, optional: ty.k === "optional", ...(zero && ty.k !== "array" && ty.k !== "map" ? { init: zero } : {}) });
    return name;
  };

  // 1. Which statements the machine takes apart: those holding a `yield`, a `break`/`continue` to a loop it takes
  //    apart, or a `return` that has to run a `finally` it takes apart. The others stay as they are.
  const exploded = new Set<Stmt>();
  const mark = (stmts: Stmt[], fin: boolean) => {
    for (const s of stmts) {
      if (s.s === "let" || s.s === "fn" || s.s === "expr" || s.s === "assign" || s.s === "return" || s.s === "break" || s.s === "continue") continue;
      if (!(hasYield(s) || escapes(s) || (fin && hasReturn(s)))) continue;
      exploded.add(s);
      switch (s.s) {
        case "if":
          mark(s.then, fin), mark(s.else ?? [], fin);
          break;
        case "while":
        case "forOf":
        case "forRange":
          mark(s.body, fin);
          break;
        case "switch":
          s.cases.forEach((c) => mark(c.body, fin)), mark(s.default ?? [], fin);
          break;
        case "try":
          mark(s.body, fin || !!s.finally), mark(s.catchBody, fin || !!s.finally), mark(s.finally ?? [], fin);
          break;
      }
    }
  };
  mark(m.body, false);

  // 2. Every binding, and which name each id reads: fields for what the machine's lists declare, native locals inside kept statements.
  const declOf = new Map<object, Decl>();
  const refs = new Map<Expr, Decl>();
  const fnRefs = new Map<Decl, Set<Decl>>();
  const scopes: Map<string, Decl>[] = [new Map()];
  const ownerDecl: Decl = { name: "this", native: false, field: "self__", owner: true };
  if (m.owner) scopes[0]!.set("this", ownerDecl);
  const paramDecls = [...m.captures, ...m.params].map((p): Decl => {
    const d: Decl = { name: p.name, native: false, field: addField(`v__${p.name}`, p.ty), ty: p.ty };
    scopes[0]!.set(p.name, d);
    return d;
  });
  const declare = (key: object, name: string, machine: boolean, ty?: Ty): Decl => {
    const d: Decl = { name, native: !machine, ty };
    if (machine) d.field = addField(`v__${name}`, ty!);
    scopes.at(-1)!.set(name, d);
    declOf.set(key, d);
    return d;
  };
  const lookup = (name: string): Decl | undefined => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const d = scopes[i]!.get(name);
      if (d) return d;
    }
    return undefined;
  };
  let fnSeen: Set<Decl> | undefined;
  const scoped = <T>(f: () => T): T => {
    scopes.push(new Map());
    try {
      return f();
    } finally {
      scopes.pop();
    }
  };
  const resolveExpr = (x: unknown, inLambda: boolean): void => {
    if (Array.isArray(x)) return x.forEach((v) => resolveExpr(v, inLambda));
    if (!x || typeof x !== "object") return;
    const n = x as Expr;
    if (n.e === "id") {
      const d = lookup(n.name);
      if (!d) return;
      refs.set(n, d);
      if (inLambda && !d.native && !d.owner) d.boxed = true;
      fnSeen?.add(d);
      return;
    }
    if (n.e === "lambda") {
      return scoped(() => {
        for (const p of n.params) declare(p, p.name, false);
        if (Array.isArray(n.body)) resolveStmts(n.body, false, true);
        else resolveExpr(n.body, true);
      });
    }
    for (const v of Object.values(n)) if (v && typeof v === "object") resolveExpr(v, inLambda);
  };
  const resolveStmts = (stmts: Stmt[], machine: boolean, inLambda: boolean): void => {
    for (const s of stmts) resolveStmt(s, machine, inLambda);
  };
  const resolveStmt = (s: Stmt, machine: boolean, inLambda: boolean): void => {
    const inner = machine && exploded.has(s);
    switch (s.s) {
      case "let":
        resolveExpr(s.init, inLambda);
        declare(s, s.name, machine, s.ty);
        return;
      case "fn": {
        const d = declare(s, s.decl.name, machine, { k: "fn", params: s.decl.params.map((p) => p.ty), ret: s.decl.ret, throws: s.decl.throws });
        const outer = fnSeen;
        if (machine) fnRefs.set(d, (fnSeen = new Set()));
        scoped(() => {
          for (const p of s.decl.params) declare(p, p.name, false);
          resolveStmts(s.decl.body, false, true);
        });
        fnSeen = outer;
        return;
      }
      case "if":
        resolveExpr(s.c, inLambda);
        scoped(() => resolveStmts(s.then, inner, inLambda));
        scoped(() => resolveStmts(s.else ?? [], inner, inLambda));
        return;
      case "while":
        resolveExpr(s.c, inLambda);
        scoped(() => resolveStmts(s.body, inner, inLambda));
        return;
      case "forOf":
        resolveExpr(s.of, inLambda);
        if (inner) m.error("Unsupported in a generator: this loop around a `yield` (iterate an array, a range or a generator).");
        scoped(() => (declare(s, s.name, false), resolveStmts(s.body, false, inLambda)));
        return;
      case "forRange":
        resolveExpr([s.from, s.to], inLambda);
        scoped(() => (declare(s, s.name, inner, { k: "int" }), resolveStmts(s.body, inner, inLambda)));
        return;
      case "switch":
        resolveExpr(s.x, inLambda);
        for (const c of s.cases) resolveExpr(c.values, inLambda), scoped(() => resolveStmts(c.body, inner, inLambda));
        scoped(() => resolveStmts(s.default ?? [], inner, inLambda));
        return;
      case "try":
        scoped(() => resolveStmts(s.body, inner, inLambda));
        scoped(() => {
          if (s.catchName) declare(s, s.catchName, inner, { k: "rt", name: "Error" });
          resolveStmts(s.catchBody, inner, inLambda);
        });
        scoped(() => resolveStmts(s.finally ?? [], inner, inLambda));
        if (!inner && s.lowered) scoped(() => resolveStmts(s.lowered!, false, inLambda));
        return;
      case "block":
        if (inner) m.error("Unsupported in a generator: a labelled block around a `yield`.");
        scoped(() => resolveStmts(s.body, false, inLambda));
        return;
      default:
        resolveExpr(s, inLambda);
    }
  };
  resolveStmts(m.body, true, false);
  // A hoisted function capturing itself (or a cycle of them) through boxes: the box would hold the closure holding the box.
  const reaches = (from: Decl, to: Decl, seen = new Set<Decl>()): boolean =>
    [...(fnRefs.get(from) ?? [])].some((d) => d === to || (!seen.has(d) && (seen.add(d), reaches(d, to, seen))));
  for (const d of fnRefs.keys()) if (reaches(d, d)) m.error(`The local function ${d.name} in a generator calls itself: declare it outside the generator (natively it would keep itself alive).`);
  // Boxed fields hold a `Ref__T`; one with a zero value is made where its list starts (see `early`).
  for (const d of [...paramDecls, ...declOf.values()]) {
    if (!d.boxed || d.native || d.owner) continue;
    const i = fields.findIndex((f) => f.name === d.field);
    fields[i] = { name: d.field!, ty: { k: "class", name: m.refOf(d.ty!) }, readonly: false, optional: false };
    d.early = !!zeroOf(d.ty!);
    for (const fn of fnRefs.values()) if (fn.has(d) && !d.early) m.error(`A local function in this generator reads ${d.name}, declared after it with no zero value: declare ${d.name} before the function.`);
  }

  // 3. The machine: cases of one `switch` on `state__`.
  const cases: { label: number; body: Stmt[] }[] = [];
  const handlers = new Map<number, Stmt[]>();
  let cur: Stmt[] | undefined;
  let nextLabel = 2;
  const tries: TryFrame[] = [];
  const breakables: Breakable[] = [];
  const newLabel = () => nextLabel++;
  const jump = (label: number | Expr): Stmt[] => [set(fld("state__"), typeof label === "number" ? int(label) : label), { s: "continue" }];
  const done = (value: Expr | undefined): Stmt[] => [...(shape.ret ? [set(fld("ret__"), value ?? nil)] : []), set(fld("state__"), int(DONE)), { s: "return", x: bool(false) }];
  const handler = (): Stmt[] => {
    for (let i = tries.length - 1; i >= 0; i--) {
      const t = tries[i]!;
      if (t.phase === "body" && t.catchLabel !== undefined) {
        const keep = t.catchDecl ? [set(fld(t.catchDecl.field!), t.catchDecl.boxed ? box(t.catchDecl, id("e__gen")) : id("e__gen"))] : [];
        return [...keep, ...jump(t.catchLabel)];
      }
      if (t.phase !== "finally" && t.finLabel !== undefined) return [set(fld(t.ce), id("e__gen")), set(fld(t.ck), int(2)), ...jump(t.finLabel)];
    }
    return [];
  };
  const open = (label: number) => {
    cur = [];
    cases.push({ label, body: cur });
    handlers.set(label, handler());
  };
  const emit = (...stmts: Stmt[]) => {
    if (!cur) return void pending.splice(0);
    cur.push(...pending.splice(0), ...stmts);
    if (stmts.some((s) => s.s === "return" || s.s === "continue" || s.s === "break" || s.s === "throw" || s.s === "rethrow" || s.s === "unreachable")) cur = undefined;
  };
  const goto = (label: number) => emit(...jump(label));
  const place = (label: number) => (goto(label), open(label));
  // A `return value` from here: through the `finally` blocks it leaves, innermost first, then the generator is done.
  const returnPath = (value: Expr | undefined): Stmt[] => {
    const t = [...tries].reverse().find((f) => f.phase !== "finally" && f.finLabel !== undefined);
    if (!t) return done(value);
    return [...(t.cv ? [set(fld(t.cv), value ?? nil)] : []), set(fld(t.ck), int(1)), ...jump(t.finLabel!)];
  };
  // A jump to `target` (a loop's end or step) from here, through the `finally` blocks between: each records where to go next.
  const jumpPath = (target: number, depth: number): Stmt[] => {
    const crossed = tries.slice(depth).filter((f) => f.phase !== "finally" && f.finLabel !== undefined).reverse();
    const via = (rest: TryFrame[]): number => {
      if (rest.length === 1) return target;
      const [, next, ...more] = rest;
      const label = newLabel();
      cases.push({ label, body: [set(fld(next!.ck), int(3)), set(fld(next!.ct), int(via([next!, ...more]))), ...jump(next!.finLabel!)] });
      handlers.set(label, []);
      return label;
    };
    if (!crossed.length) return jump(target);
    const t = crossed[0]!;
    return [set(fld(t.ck), int(3)), set(fld(t.ct), int(via(crossed))), ...jump(t.finLabel!)];
  };

  // Ids, renamed: a field (`this.f`, `this.f.value` when boxed), or in a closure the box read into a local first (`pending`).
  const pending: Stmt[] = [];
  const snaps = new Map<Decl, string>();
  let snapCount = 0;
  const snap = (d: Decl): Expr => {
    let name = snaps.get(d);
    if (!name || !pending.some((s) => s.s === "let" && s.name === name)) {
      name = `${d.field}__c${++snapCount}`;
      snaps.set(d, name);
      pending.push({ s: "let", name, ty: d.owner ? m.owner! : { k: "class", name: m.refOf(d.ty!) }, init: fld(d.field!), mutable: false });
    }
    return id(name);
  };
  const box = (d: Decl, value: Expr): Expr => ({ e: "new", cls: m.refOf(d.ty!), args: [["value", value]] });
  const read = (d: Decl, inLambda: boolean): Expr => {
    if (d.owner) return inLambda ? snap(d) : fld("self__");
    if (!d.boxed) return fld(d.field!);
    return fld("value", inLambda ? snap(d) : fld(d.field!));
  };
  const rx = (x: Expr, inLambda = false): Expr => {
    if (x.e === "id") {
      if (x.name === GEN) return self;
      const d = refs.get(x);
      return d && !d.native ? read(d, inLambda) : { ...x };
    }
    if (x.e === "lambda") return { ...x, body: Array.isArray(x.body) ? x.body.flatMap((s) => keep(s, true)) : rx(x.body, true) };
    // An assignment used as a value: its statements are kept whole (they can't yield).
    if (x.e === "seq") return { ...x, body: x.body.flatMap((s) => keep(s, inLambda)), x: rx(x.x, inLambda) };
    return mapExpr(x, (c) => rx(c, inLambda));
  };
  // A statement the machine keeps whole: its ids renamed, a `return` finishing the generator (no `finally` of the machine around it).
  const keep = (s: Stmt, inLambda: boolean): Stmt[] => {
    const r = (x: Expr) => rx(x, inLambda);
    const ks = (stmts: Stmt[]) => stmts.flatMap((t) => keep(t, inLambda));
    switch (s.s) {
      case "return":
        return inLambda ? [{ s: "return", x: s.x && r(s.x) }] : done(s.x && r(s.x));
      case "let":
        return [{ ...s, init: s.init && r(s.init) }];
      case "assign":
        return [{ ...s, target: r(s.target), value: r(s.value) }];
      case "expr":
        return [{ ...s, x: r(s.x) }];
      case "if":
        return [{ s: "if", c: r(s.c), then: ks(s.then), else: s.else && ks(s.else) }];
      case "forOf":
        return [{ ...s, of: r(s.of), body: ks(s.body) }];
      case "forRange":
        return [{ ...s, from: r(s.from), to: r(s.to), body: ks(s.body) }];
      case "while":
        return [{ ...s, c: r(s.c), body: ks(s.body) }];
      case "try":
        return [{ ...s, body: ks(s.body), catchBody: ks(s.catchBody), finally: s.finally && ks(s.finally), lowered: s.lowered && ks(s.lowered) }];
      case "throw":
        return [{ ...s, message: r(s.message) }];
      case "rethrow":
        return [{ ...s, error: r(s.error) }];
      case "block":
        return [{ ...s, body: ks(s.body) }];
      case "switch":
        return [{ ...s, x: r(s.x), cases: s.cases.map((c) => ({ values: c.values.map(r), body: ks(c.body) })), default: s.default && ks(s.default) }];
      case "fn":
        return [{ s: "fn", decl: { ...s.decl, body: s.decl.body.flatMap((t) => keep(t, true)) } }];
      default:
        return [s];
    }
  };

  const list = (stmts: Stmt[]) => {
    // Boxes of this block's bindings that closures share: made on entry (each loop turn has its own, as in JavaScript).
    for (const s of stmts) {
      const d = s.s === "let" ? declOf.get(s) : undefined;
      if (d?.boxed && d.early) emit(set(fld(d.field!), box(d, zeroOf(d.ty!)!)));
    }
    for (const s of stmts) stmt(s);
  };
  const assignDecl = (d: Decl, value: Expr): Stmt => (d.boxed ? (d.early ? set(fld("value", fld(d.field!)), value) : set(fld(d.field!), box(d, value))) : set(fld(d.field!), value));
  /**
   * An async generator's `await p` (p a promise): the machine registers its resumption on p (`drive__` once p
   * settles: one job, as JavaScript's Await), stops (`wait__`), and goes on in a new state, where p's error is thrown.
   */
  const awaitOp = (p: Expr, ty: Ty, store?: (v: Expr) => Stmt[]) => {
    const at = newLabel();
    const ok = lambda([{ name: "v__aw", ty }], [...(store ? store(id("v__aw")) : []), drive]);
    const failed = lambda([{ name: "e__aw", ty: ERROR }], [set(fld("awe__"), id("e__aw")), drive]);
    emit({ s: "expr", x: { e: "op", op: "promise.then2", args: [p, ok, failed], ty: { k: "promise", of: VOID } } }, set(fld("wait__"), bool(true)), set(fld("state__"), int(at)), { s: "return", x: bool(true) });
    open(at);
    emit({ s: "if", c: { e: "bin", op: "!=", l: fld("awe__"), r: nil }, then: [{ s: "let", name: "e__awaited", ty: ERROR, init: { e: "unwrap", x: fld("awe__") }, mutable: false }, set(fld("awe__"), nil), { s: "rethrow", error: id("e__awaited") }] });
  };
  /** `await p` as a statement the front-end wrote (`const v = await p`, `v = await p`, `await p`, `return await p`). */
  const awaitStmt = (s: Stmt): boolean => {
    const x = s.s === "let" ? s.init : s.s === "expr" ? s.x : s.s === "assign" ? s.value : s.s === "return" ? s.x : undefined;
    if (x?.e !== "await") return false;
    const p = rx(x.x);
    if (s.s === "let") {
      const d = declOf.get(s)!;
      awaitOp(p, x.ty, (v) => [assignDecl(d, v)]);
    } else if (s.s === "assign") awaitOp(p, x.ty, (v) => [set(rx(s.target), v)]);
    else if (s.s === "return") {
      // `return v` of an async generator awaits v, then leaves (through its finally blocks).
      if (x.ty.k === "void" || !shape.ret) {
        awaitOp(p, x.ty);
        emit(...returnPath(undefined));
        return true;
      }
      const r = addField("awr__", opt(x.ty));
      awaitOp(p, x.ty, (v) => [set(fld(r), v)]);
      emit(...returnPath(fld(r)));
    } else awaitOp(p, x.ty);
    return true;
  };
  const resumePoint = (label: number, onReturn: Stmt[], onThrow?: Stmt[]) => {
    open(label);
    if (shape.async) {
      // An async generator resumed with `return(v)` at a `yield`: v is awaited first, then it returns from here.
      const after = newLabel();
      const retTy: Ty = shape.ret ? opt(shape.ret) : VOID;
      const p: Expr = { e: "op", op: "promise.resolve", args: shape.ret ? [fld("ret__")] : [], ty: { k: "promise", of: retTy } };
      const ok = lambda([{ name: "v__aw", ty: retTy }], [...(shape.ret ? [set(fld("ret__"), id("v__aw"))] : []), drive]);
      const failed = lambda([{ name: "e__aw", ty: ERROR }], [set(fld("awe__"), id("e__aw")), drive]);
      const saved = cur!;
      cases.push({ label: after, body: (cur = []) });
      handlers.set(after, handler());
      emit({ s: "if", c: { e: "bin", op: "!=", l: fld("awe__"), r: nil }, then: [{ s: "let", name: "e__awaited", ty: ERROR, init: { e: "unwrap", x: fld("awe__") }, mutable: false }, set(fld("awe__"), nil), { s: "rethrow", error: id("e__awaited") }] });
      emit(...returnPath(shape.ret ? fld("ret__") : undefined));
      cur = saved;
      const thrown: Stmt[] = [{ s: "let", name: "e__thrown", ty: ERROR, init: { e: "unwrap", x: fld("err__") }, mutable: false }, set(fld("err__"), nil), { s: "rethrow", error: id("e__thrown") }];
      emit({ s: "if", c: eq(fld("mode__"), int(2)), then: [set(fld("mode__"), int(0)), ...thrown] });
      emit({ s: "if", c: eq(fld("mode__"), int(1)), then: [set(fld("mode__"), int(0)), { s: "expr", x: { e: "op", op: "promise.then2", args: [p, ok, failed], ty: { k: "promise", of: VOID } } }, set(fld("wait__"), bool(true)), set(fld("state__"), int(after)), { s: "return", x: bool(true) }] });
      return;
    }
    // `it.throw(e)`: e thrown here (the error table sends it to the catch / finally around this point).
    if (shape.throwIn) {
      const thrown: Stmt[] = [{ s: "let", name: "e__thrown", ty: ERROR, init: { e: "unwrap", x: fld("err__") }, mutable: false }, set(fld("err__"), nil), { s: "rethrow", error: id("e__thrown") }];
      emit({ s: "if", c: eq(fld("mode__"), int(2)), then: [set(fld("mode__"), int(0)), ...(onThrow ?? thrown)] });
    }
    emit({ s: "if", c: eq(fld("mode__"), int(1)), then: [set(fld("mode__"), int(0)), ...onReturn, ...returnPath(shape.ret ? fld("ret__") : undefined)] });
  };

  const stmt = (s: Stmt): void => {
    if (!cur) return;
    const marker = markerOf(s);
    if (marker) return yieldOp(marker);
    if (shape.async && awaitStmt(s)) return;
    if (!exploded.has(s)) {
      switch (s.s) {
        case "let": {
          const d = declOf.get(s)!;
          if (s.init) emit(assignDecl(d, rx(s.init)));
          else if (s.ty.k === "optional" || (d.boxed && !d.early)) emit(assignDecl(d, nil));
          return;
        }
        case "fn": {
          const d = declOf.get(s)!;
          const fn = s.decl;
          const lambda: Expr = { e: "lambda", params: fn.params, ret: fn.ret, body: fn.body.flatMap((t) => keep(t, true)), typed: true, ...(fn.throws ? { throws: true } : {}) };
          return emit(assignDecl(d, lambda));
        }
        case "return":
          return emit(...returnPath(s.x && rx(s.x)));
        case "break": {
          const b = s.label ? breakables.findLast((x) => x.label === s.label) : breakables.at(-1)!;
          if (!b) return emit(s);
          return emit(...jumpPath(b.brk, b.tries));
        }
        case "continue": {
          const b = [...breakables].reverse().find((x) => (s.label ? x.label === s.label : x.cont !== undefined))!;
          return emit(...jumpPath(b.cont!, b.tries));
        }
        default:
          return emit(...keep(s, false));
      }
    }
    switch (s.s) {
      case "if": {
        const [otherwise, end] = [newLabel(), newLabel()];
        emit({ s: "if", c: not(rx(s.c)), then: jump(s.else ? otherwise : end) });
        list(s.then);
        goto(end);
        if (s.else) open(otherwise), list(s.else), goto(end);
        return open(end);
      }
      case "while": {
        const [top, end] = [newLabel(), newLabel()];
        place(top);
        if (!(s.c.e === "bool" && s.c.v)) emit({ s: "if", c: not(rx(s.c)), then: jump(end) });
        breakables.push({ brk: end, cont: top, tries: tries.length, label: s.label });
        list(s.body);
        breakables.pop();
        goto(top);
        return open(end);
      }
      case "forRange": {
        const d = declOf.get(s)!;
        const [i, to] = [addField(`i__${d.name}`, { k: "int" }), addField(`to__${d.name}`, { k: "int" })];
        const [top, step, end] = [newLabel(), newLabel(), newLabel()];
        emit(set(fld(i), rx(s.from)), set(fld(to), rx(s.to)));
        place(top);
        // Each turn's own binding: a new box when a closure shares it.
        emit({ s: "if", c: not({ e: "bin", op: s.inclusive ? "<=" : "<", l: fld(i), r: fld(to) }), then: jump(end) }, set(fld(d.field!), d.boxed ? box(d, fld(i)) : fld(i)));
        breakables.push({ brk: end, cont: step, tries: tries.length, label: s.label });
        list(s.body);
        breakables.pop();
        place(step);
        emit({ s: "assign", target: fld(i), op: "+=", value: int(1) });
        goto(top);
        return open(end);
      }
      case "switch": {
        const x = rx(s.x);
        if (!(x.e === "prop" || x.e === "id" || x.e === "int" || x.e === "str")) m.error("Unsupported in a generator: a switch on a computed value around a `yield` (switch on a variable).");
        const end = newLabel();
        const labels = s.cases.map(() => newLabel());
        const other = s.default ? newLabel() : end;
        let chain: Stmt[] = jump(other);
        for (let i = s.cases.length - 1; i >= 0; i--) {
          const test = s.cases[i]!.values.map((v) => eq(x, rx(v))).reduce((a, b) => ({ e: "bin", op: "||", l: a, r: b }));
          chain = [{ s: "if", c: test, then: jump(labels[i]!), else: chain }];
        }
        emit(...chain);
        breakables.push({ brk: end, tries: tries.length });
        s.cases.forEach((c, i) => (open(labels[i]!), list(c.body), goto(end)));
        if (s.default) open(other), list(s.default), goto(end);
        breakables.pop();
        return open(end);
      }
      case "try": {
        const n = tries.length + cases.length;
        const rethrows = s.catchBody.length === 1 && s.catchBody[0]!.s === "rethrow" && !!s.finally;
        const [body, end] = [newLabel(), newLabel()];
        const t: TryFrame = { phase: "body", ck: "", ce: "", ct: "" };
        if (!rethrows) (t.catchLabel = newLabel()), (t.catchDecl = s.catchName ? declOf.get(s) : undefined);
        if (s.finally) {
          t.finLabel = newLabel();
          t.ck = addField(`ck__${n}`, { k: "int" });
          t.ce = addField(`ce__${n}`, { k: "optional", of: { k: "rt", name: "Error" } });
          t.ct = addField(`ct__${n}`, { k: "int" });
          if (shape.ret) t.cv = addField(`cv__${n}`, opt(shape.ret));
        }
        const leave = () => (t.finLabel !== undefined ? (emit(set(fld(t.ck), int(0))), goto(t.finLabel)) : goto(end));
        goto(body);
        tries.push(t);
        open(body);
        list(s.body);
        leave();
        if (t.catchLabel !== undefined) {
          t.phase = "catch";
          open(t.catchLabel);
          list(s.catchBody);
          leave();
        }
        if (t.finLabel !== undefined) {
          t.phase = "finally";
          open(t.finLabel);
          list(s.finally!);
          const rethrow: Stmt = { s: "rethrow", error: { e: "unwrap", x: fld(t.ce) } };
          emit(
            { s: "if", c: eq(fld(t.ck), int(1)), then: returnPath(t.cv ? fld(t.cv) : undefined) },
            { s: "if", c: eq(fld(t.ck), int(2)), then: [rethrow] },
            { s: "if", c: eq(fld(t.ck), int(3)), then: jump(fld(t.ct)) },
          );
          goto(end);
        }
        tries.pop();
        return open(end);
      }
      default:
        m.error(`Unsupported in a generator: this statement (${s.s}) around a \`yield\`.`);
    }
  };

  const yieldOp = (marker: Extract<Expr, { e: "rt" }>) => {
    const named = new Map(marker.named ?? []);
    const into = named.get("into");
    const delegate = named.get("delegate");
    if (delegate) {
      const inner = (named.get("base") as Extract<Expr, { e: "str" }>).v;
      const d = addField("inner__", { k: "class", name: inner });
      emit(set(fld(d), rx(delegate)));
      const [loop, at, end] = [newLabel(), newLabel(), newLabel()];
      place(loop);
      // The inner generator's own shape says whether its methods throw (Rust `Result`).
      const innerThrows = named.has("innerThrows") ? { throws: true } : {};
      const resume: Expr = { e: "invoke", obj: fld(d), name: "resume__", args: [], ...innerThrows };
      emit({ s: "if", c: not(resume), then: jump(end) }, ...(shape.value ? [set(fld("value__"), fld("value__", fld(d)))] : []), set(fld("state__"), int(at)), { s: "return", x: bool(true) });
      // `it.return(v)` while delegating is the inner generator's `return(v)` first (its `finally` blocks run). When both
      // return the same type, as in JavaScript: what the inner one yields meanwhile is yielded (still delegating), and
      // the value it ends with (its `finally` may override `v`) is the one this one returns.
      const copy = shape.value ? [set(fld("value__"), fld("value__", fld(d)))] : [];
      const onReturn: Stmt[] = named.has("sameRet")
        ? [
            set(fld("mode__", fld(d)), int(1)),
            set(fld("ret__", fld(d)), fld("ret__")),
            { s: "if", c: resume, then: [...copy, set(fld("state__"), int(at)), { s: "return", x: bool(true) }] },
            set(fld("ret__"), fld("ret__", fld(d))),
          ]
        : [{ s: "expr", x: { e: "invoke", obj: fld(d), name: "close__", args: [], ...innerThrows } }];
      // `it.throw(e)` while delegating is the inner generator's `throw(e)`: what it yields then is yielded, what it
      // returns is the value of the `yield*`, what it throws comes out here.
      const onThrow: Stmt[] = [
        set(fld("mode__", fld(d)), int(2)),
        set(fld("err__", fld(d)), fld("err__")),
        set(fld("err__"), nil),
        { s: "if", c: resume, then: [...copy, set(fld("state__"), int(at)), { s: "return", x: bool(true) }] },
        ...jump(end),
      ];
      resumePoint(at, onReturn, onThrow);
      goto(loop);
      open(end);
      if (into) emit(set(rx(into), substitute(named.get("read")!, DELEGATE, fld(d))));
      return;
    }
    const at = newLabel();
    // An async generator's `yield v` awaits v first (`value` is that await).
    const awaited = shape.async ? marker.args[0] : undefined;
    if (awaited?.e === "await") awaitOp(rx(awaited.x), awaited.ty, (v) => (shape.value ? [set(fld("value__"), awaited.ty.k === "void" ? nil : v)] : []));
    emit(...(shape.value && !awaited ? [set(fld("value__"), marker.args[0] ? rx(marker.args[0]) : nil)] : []), set(fld("state__"), int(at)), { s: "return", x: bool(true) });
    resumePoint(at, []);
    if (into) emit(set(rx(into), rx(named.get("read")!)));
    if (shape.next) emit(set(fld("sent__"), nil));
  };

  open(START);
  list(m.body);
  emit(...done(undefined));

  const dispatch: Stmt = {
    s: "switch",
    x: fld("state__"),
    cases: cases.map((c) => ({ values: [int(c.label)], body: c.body })),
    default: [...(shape.ret ? [set(fld("ret__"), nil)] : []), { s: "return", x: bool(false) }],
  };
  // An error leaving a step: to the catch or finally block around where it stopped, or out (the generator is then done).
  const groups = new Map<string, { values: Expr[]; body: Stmt[] }>();
  for (const [label, body] of handlers) {
    if (!body.length) continue;
    const key = JSON.stringify(body);
    if (!groups.has(key)) groups.set(key, { values: [], body });
    groups.get(key)!.values.push(int(label));
  }
  // A shape no generator of which throws out: what the body throws is all caught inside (TypeScript's view, see inferThrows).
  const out: Stmt[] = shape.throws ? [set(fld("state__"), int(DONE)), { s: "rethrow", error: id("e__gen") }] : [{ s: "unreachable" }];
  const caught: Stmt[] = groups.size ? [{ s: "switch", x: fld("state__"), cases: [...groups.values()], default: out }] : out;
  const step: Stmt[] = m.irThrows(cases.map((c) => c.body)) ? [{ s: "try", body: [dispatch], catchName: "e__gen", catchBody: caught }] : [dispatch];

  const ctorParams: Param[] = [...(m.owner ? [{ name: "self__", ty: m.owner }] : []), ...[...m.captures, ...m.params].map((p) => ({ name: p.name, ty: p.ty }))];
  if (m.owner) fields.push({ name: "self__", ty: m.owner, readonly: true, optional: false });
  const ctorBody: Stmt[] = [
    ...(m.owner ? [set(fld("self__"), id("self__"))] : []),
    ...paramDecls.map((d) => set(fld(d.field!), d.boxed ? box(d, id(d.name)) : id(d.name))),
  ];
  return {
    name: m.name,
    base: shape.base,
    protocols: [],
    abstract: false,
    open: false,
    fields,
    ctor: { params: ctorParams, superArgs: [], body: ctorBody },
    methods: [{ name: "resume__", params: [], ret: { k: "bool" }, async: false, overrides: true, body: [{ s: "while", c: bool(true), body: step }], ...(shape.throws ? { throws: true } : {}) }],
  };
}

/** `x` with `fn` applied to each expression directly under it (statements in a lambda body are the lambda's business). */
function mapExpr(x: Expr, fn: (c: Expr) => Expr): Expr {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(x)) {
    if (Array.isArray(v)) out[k] = v.map((item) => (isExpr(item) ? fn(item) : Array.isArray(item) ? item.map((y) => (isExpr(y) ? fn(y) : y)) : item));
    else out[k] = isExpr(v) ? fn(v) : v;
  }
  return out as Expr;
}

const isExpr = (v: unknown): v is Expr => !!v && typeof v === "object" && "e" in v;

function substitute(x: Expr, name: string, by: Expr): Expr {
  if (x.e === "id" && x.name === name) return by;
  return mapExpr(x, (c) => substitute(c, name, by));
}
