/**
 * Reference cycles. JavaScript's garbage collector frees a group of objects that point at each other once nothing else
 * reaches them; Swift (ARC) and Rust (`Rc`) free an object only when nothing points at it, so such a group leaks. Kotlin
 * (the JVM's collector) frees it, but the analysis decides for every target: one program, one set of decisions.
 *
 * It runs on the finished IR, where every native reference is visible: fields, closures and what they capture,
 * `cap__x` fields and `Ref__T` boxes of nested classes, `fn__m` fields of protocol literals, generator state machines.
 *
 * 1. Closures. A closure holds what it captures (Swift and Kotlin capture variables, Rust clones into `move`
 *    closures). Which closures a function-typed slot (field, variable, parameter, array element) can hold is a flow
 *    analysis over the whole program (0-CFA: through assignments, arguments, returns, array operations, calls of
 *    function values).
 * 2. The type graph: a node per class (records and the app's classes, generated ones included) and per closure. A
 *    field leads to every class its type can hold (subclasses and conforming classes; arrays, maps, optionals,
 *    promises and unions are looked through), a closure to what it captures.
 * 3. Writes. A reference stored into an object that nothing references yet can't close a cycle: a constructor's
 *    `this` before it escapes, a local holding a new object (`new`, a literal, a function that returns one, a
 *    parameter every caller passes such an object for) before it escapes. Any other store (`x.f = v`, `x.items.push(v)`,
 *    `xs[i] = v`, reassigning a variable a closure captures) closes a cycle only if the value can reach the object
 *    stored into: in the graph, the value's nodes reach the holder's. A new value reaches only what it was made from.
 *    Such a store is lowered (4, 5), tracked by the cycle collector (6) or an error.
 * 4. Except a closure stored in a field of the object it captures (`this.onTick = () => this.n++`) whose field is only
 *    ever called (`obj.onTick()`), never read as a value: natively the closure takes the object as a last parameter
 *    instead of capturing it, and each call passes the object it read the field from. Nothing is kept, so no weak
 *    reference is needed, and no unwrapping can fail.
 * 5. And except a child's link to the parent that holds it, when every read of it provably runs inside a method of
 *    that parent (`backPointers`): the field is weak natively (Swift `weak var`, Rust `WeakVar`), never found empty.
 *
 * 6. Any other write that may close a cycle makes the classes on the cycle "collected" (`gc` on their declarations):
 *    Swift and Rust register their objects with the runtime's cycle collector (CPython's algorithm: an object whose
 *    strong count is all references from other tracked objects is reachable only through them; what no outside
 *    reference reaches is garbage, and its fields are cleared so ARC / Rc free it). The collector sees fields holding
 *    objects directly or in optionals, arrays, records, Maps and Sets; a cycle that can pass through what it can't see
 *    (a closure, a captured local's box, a union, a promise, a WeakMap value) stays an error.
 *
 * What the runtime holds (nodes, bindings, timers, promise reactions, which a promise drops once it settles) is not
 * in the graph: the runtime releases it with its view or when it has run.
 */
import type ts from "typescript";
import type { ClassDecl, Expr, FnDecl, ObjectClassDecl, Param, Program, ProtocolDecl, Stmt, Ty } from "./ir.ts";

type Lambda = Extract<Expr, { e: "lambda" }>;

/** The TypeScript node IR statements, lambdas and classes came from (filled by the front-end): where errors point. */
export const origins = new WeakMap<object, ts.Node>();

/** Records where IR came from (the innermost wins: it is noted first). */
export function noteOrigin<T>(items: T[], node: ts.Node): T[] {
  for (const item of items) if (item && typeof item === "object" && !origins.has(item)) origins.set(item, node);
  return items;
}

export type CycleReport = (node: ts.Node | undefined, message: string) => void;

/** Checks the program for reference cycles and lowers the closures of (4) in place. Errors go to `report`. */
export function checkCycles(program: Program, report: CycleReport): void {
  new Cycles(program, report).run();
}

/** The parameter a closure of (4) gets its object as. */
const OWNER = "owner__";

interface Binding {
  id: number;
  name: string;
  ty: Ty;
  /** The function declaring it (none: a global). */
  owner?: FnRec;
  /** A local function declaration. */
  fn?: FnRec;
  ctorParam?: boolean;
  /** An element of the field `element` of `this` (a for-of variable, an array method's callback parameter). */
  element?: string;
  /** Its parameter index, for a parameter. */
  index?: number;
}

interface FnRec {
  id: number;
  node: Lambda | FnDecl;
  params: Binding[];
  captures: Set<Binding>;
  origin?: ts.Node;
  cls?: string;
  /** What each `return` gives. */
  returns: Desc[];
  /** Its call sites' arguments (only for functions called by name, methods and constructors). */
  calls: Desc[][];
  /** Used as a value: callers are unknown. */
  asValue?: boolean;
}

/** What a value is made of, for "can it reach that object?". `self`: the object itself; the rest is what it reaches. */
type Desc =
  | { k: "plain"; ty?: Ty; src: string[] }
  | Fresh
  | { k: "closure"; fn: FnRec }
  | { k: "alt"; options: Desc[] }
  | { k: "ret"; fns: FnRec[]; ty?: Ty }
  | { k: "param"; fn: FnRec; index: number; ty: Ty }
  /** A part stored into a field (`slot`) or passed as a constructor's argument (`arg`): nothing if that is a weak back-pointer. */
  | { k: "via"; slot?: string; arg?: { cls: string; index: number }; d: Desc };

/** A new object: what it was made from (`parts`), what its constructor stores (`cls`), and (`of`) what a value it stands for reaches. */
interface Fresh {
  k: "fresh";
  self: Set<string>;
  parts: Desc[];
  cls?: string;
  of?: Desc;
  /** It is fresh only if this holds (a parameter every caller passes a new object for, a function returning one). */
  cond?: () => boolean;
  ty?: Ty;
}

interface Write {
  holder: () => Set<string>;
  value: Desc;
  origin?: ts.Node;
  /** It writes into a fresh object only if this holds: then it can't close a cycle. */
  skip?: () => boolean;
  field?: { slot: string; name: string; target?: Binding };
  lambda?: FnRec;
  what: string;
}

interface ClassInfo {
  name: string;
  kind: "record" | "object" | "protocol";
  fields: Map<string, Ty>;
  declarers: Map<string, string>;
  methods: Map<string, FnDecl>;
  supers: string[];
  record?: ClassDecl;
  object?: ObjectClassDecl;
  protocol?: ProtocolDecl;
}

/** A method call's or a field read's receiver: `this`, an element of a field of `this`, or anything else. */
type Recv = { k: "this" } | { k: "element"; slot: string } | { k: "other" };

interface Scope {
  vars: Map<string, Binding>;
  fn: FnRec | undefined;
  up: Scope | undefined;
}

/** Array and map operations that don't hand out the receiver itself. */
const RECEIVER_OPS = new Set([
  "arr.length", "arr.at", "arr.push", "arr.pushAll", "arr.pop", "arr.unshift", "arr.splice", "arr.indexOf", "arr.includes", "arr.find", "arr.findIndex",
  "arr.filter", "arr.map", "arr.some", "arr.every", "arr.forEach", "arr.join", "arr.slice", "arr.concat", "arr.shift", "arr.lastIndexOf", "arr.reduce",
  "arr.atRel", "arr.mapI", "arr.filterI", "arr.forEachI", "arr.someI", "arr.everyI", "arr.findI", "arr.findIndexI", "map.get", "map.delete", "map.has",
  "map.keys", "map.values", "arr.pushLen", "arr.pushAllLen", "arr.unshiftLen", "arr.flat", "arr.reduceRight", "arr.findLast", "arr.findLastIndex", "arr.toSpliced", "arr.with",
]);
/** `fill` gives the array itself (see op()); `splice`'s items are its third value. */
const INSERT_OPS = new Set(["arr.push", "arr.pushAll", "arr.unshift", "arr.splice", "arr.pushLen", "arr.pushAllLen", "arr.unshiftLen", "arr.fill"]);
/** A new array holding the elements of its values (`filled`: of its value; `flat`: of its arrays' arrays). */
const COPY_OPS = new Set(["arr.slice", "arr.filter", "arr.filterI", "arr.concat", "map.values", "arr.flat", "arr.filled", "arr.toSpliced", "arr.with"]);
const PLAIN_VALUES = new Set(["int", "double", "str", "bool", "nil", "tpl", "toStr", "bin", "not", "neg", "enum", "toDouble", "toInt", "numCast", "incr", "instanceOf", "uis"]);

class Cycles {
  private readonly classes = new Map<string, ClassInfo>();
  private readonly subtypes = new Map<string, Set<string>>();
  private readonly unions = new Map<string, Ty[]>();
  private readonly functions = new Map<string, FnRec[]>();
  private readonly fnRecs = new Map<object, FnRec>();
  private readonly globals = new Map<string, Binding>();
  private ids = 0;
  /** Field families: the fields that are one slot (a field, what it implements or overrides), union-find on `Type.field`. */
  private readonly family = new Map<string, string>();
  /** Flows: content(to) ⊇ content(from); a slot's content is the functions it can hold. */
  private readonly edges = new Map<string, Set<string>>();
  private readonly content = new Map<string, Set<FnRec>>();
  private readonly dynamicCalls: { callee: string[]; args: string[][]; result: string }[] = [];
  private readonly writes: Write[] = [];
  /** Function-field families read as a value somewhere (not only called or tested for nil). */
  private readonly valueReads = new Set<string>();
  /** `recv.f(args)` calls of function fields, and every value stored into a function field: for (4). */
  private readonly fieldCalls: { call: Extract<Expr, { e: "call" }>; slot: string; recv: Expr; recvTy?: Ty }[] = [];
  private readonly fieldStores: { slot: string; value: Expr; target?: Binding; holder?: Ty; set: (x: Expr) => void }[] = [];
  /** What constructors store into `this` besides their parameters, by class. */
  private readonly ctorWrites = new Map<string, Desc[]>();
  private readonly leaks = new Map<string, boolean>();
  /** The bindings that hold a fresh object at the statement being walked. */
  private fresh = new Map<Binding, Fresh>();
  /** The statement where a fresh local escapes, when it only stores it (`this.next = link`): it is still fresh as that value. */
  private escapingValue?: { b: Binding; d: Fresh };
  private readonly stack: FnRec[] = [];
  private readonly originStack: (ts.Node | undefined)[] = [];
  private graph = new Map<string, Map<string, string>>();
  private readonly converted = new Set<FnRec>();
  /** For back-pointers (`backPointers`): field reads and stores, method calls and their receivers, array inserts, `new`s. */
  private readonly reads: { slot: string; recv: Recv; fn?: FnRec }[] = [];
  private readonly stores: { slot: string; obj: Expr; value: Expr; fn?: FnRec; fresh: boolean; scope: Scope }[] = [];
  private readonly inserts: { slot: string; obj: Expr; value: Expr; fn?: FnRec; scope: Scope }[] = [];
  private readonly invokes: { targets: FnDecl[]; recv: Recv; fn?: FnRec }[] = [];
  private readonly constructs: { x: Extract<Expr, { e: "construct" }>; fn?: FnRec }[] = [];
  private readonly methodOf = new Map<FnRec, { cls: string; ctor: boolean }>();
  /** Callbacks of array methods: they run inside the function that calls the method. */
  private readonly syncIn = new Map<FnRec, FnRec | undefined>();
  private readonly weakSlots = new Set<string>();
  /** (6) The classes the cycle collector tracks. */
  private readonly collected = new Set<string>();

  private readonly program: Program;
  private readonly report: CycleReport;

  constructor(program: Program, report: CycleReport) {
    this.program = program;
    this.report = report;
  }

  run() {
    this.model();
    this.walkProgram();
    this.solve();
    this.buildGraph();
    this.ownedClosures();
    if (this.converted.size) this.buildGraph();
    const open = () => this.writes.filter((w) => !(w.lambda && this.converted.has(w.lambda)) && !(w.field && this.weakSlots.has(w.field.slot)) && !w.skip?.() && this.danger(w));
    if (this.backPointers(open())) this.buildGraph();
    // (6) Any other possible cycle: its classes are tracked by the runtime's cycle collector, when it can see every
    // reference of the cycle; otherwise it stays an error.
    for (const w of open()) {
      const why = this.collect(w);
      if (why) this.report(w.origin, this.message(w, this.danger(w)!, why));
    }
    if (this.collected.size) this.markCollected();
  }

  // ---------------------------------------------------------------------------
  // The program's types
  // ---------------------------------------------------------------------------

  private model() {
    const p = this.program;
    for (const c of p.classes) {
      this.classes.set(c.name, { name: c.name, kind: "record", fields: new Map(c.fields.map((f) => [f.name, f.ty])), declarers: new Map(c.fields.map((f) => [f.name, c.name])), methods: new Map(), supers: c.protocols ?? [], record: c });
    }
    for (const pr of p.protocols ?? []) {
      this.classes.set(pr.name, { name: pr.name, kind: "protocol", fields: new Map(pr.fields.map((f) => [f.name, f.ty])), declarers: new Map(pr.fields.map((f) => [f.name, pr.name])), methods: new Map(), supers: pr.bases, protocol: pr });
    }
    const objects = new Map((p.objectClasses ?? []).map((c) => [c.name, c]));
    for (const c of p.objectClasses ?? []) {
      const info: ClassInfo = { name: c.name, kind: "object", fields: new Map(), declarers: new Map(), methods: new Map(), supers: [...(c.base ? [c.base] : []), ...c.protocols], object: c };
      const chain: ObjectClassDecl[] = [];
      for (let k: ObjectClassDecl | undefined = c; k; k = k.base ? objects.get(k.base) : undefined) chain.unshift(k);
      for (const k of chain) {
        for (const f of k.fields) if (!info.fields.has(f.name)) (info.fields.set(f.name, f.ty), info.declarers.set(f.name, k.name));
        for (const m of k.methods) if (!m.setter) info.methods.set(m.name, m);
      }
      this.classes.set(c.name, info);
    }
    for (const info of this.classes.values()) {
      if (info.kind !== "protocol") continue;
      for (const s of this.supersOf(info.name)) {
        for (const [f, ty] of this.classes.get(s)?.fields ?? []) if (!info.fields.has(f)) (info.fields.set(f, ty), info.declarers.set(f, s));
      }
    }
    for (const info of this.classes.values()) {
      for (const s of this.supersOf(info.name)) (this.subtypes.get(s) ?? this.subtypes.set(s, new Set()).get(s)!).add(info.name);
    }
    for (const u of p.unions ?? []) this.unions.set(u.name, u.members.map((m) => m.ty));
    for (const info of this.classes.values()) {
      for (const f of info.fields.keys()) {
        this.union(`${info.name}.${f}`, `${info.declarers.get(f)}.${f}`);
        for (const s of this.supersOf(info.name)) if (this.classes.get(s)?.fields.has(f)) this.union(`${info.name}.${f}`, `${s}.${f}`);
      }
    }
  }

  /** Every supertype (bases, protocols, their bases), transitively. */
  private supersOf(name: string, out = new Set<string>()): Set<string> {
    for (const s of this.classes.get(name)?.supers ?? []) {
      if (out.has(s)) continue;
      out.add(s);
      this.supersOf(s, out);
    }
    return out;
  }

  /** The classes an object of static type `name` can be: itself, its subclasses and conforming classes (no protocol). */
  private targets(name: string): string[] {
    return [name, ...(this.subtypes.get(name) ?? [])].filter((n) => this.classes.has(n) && this.classes.get(n)!.kind !== "protocol");
  }

  private find(key: string): string {
    let root = key;
    for (let up = this.family.get(root); up && up !== root; up = this.family.get(root)) root = up;
    return root;
  }

  private union(a: string, b: string) {
    const [ra, rb] = [this.find(a), this.find(b)];
    if (ra !== rb) this.family.set(ra, rb);
  }

  /** The slot of field `f` read or written through a value of static type `ty`. */
  private fieldSlot(ty: Ty | undefined, f: string): string {
    const cls = classOf(ty);
    if (cls && this.classes.get(cls)?.fields.has(f)) return `f:${this.find(`${cls}.${f}`)}`;
    // An unknown receiver: every field of that name.
    const any = `?.${f}`;
    for (const info of this.classes.values()) if (info.fields.has(f)) this.union(any, `${info.name}.${f}`);
    return `f:${this.find(any)}`;
  }

  private fieldTy(ty: Ty | undefined, f: string): Ty | undefined {
    const info = this.classes.get(classOf(ty) ?? "");
    return info?.fields.get(f) ?? info?.methods.get(f)?.ret;
  }

  private isField(ty: Ty | undefined, f: string): boolean {
    return !!this.classes.get(classOf(ty) ?? "")?.fields.has(f);
  }

  // ---------------------------------------------------------------------------
  // Walking the IR: bindings, closures, flows, writes
  // ---------------------------------------------------------------------------

  private binding(name: string, ty: Ty, owner?: FnRec): Binding {
    return { id: ++this.ids, name, ty, owner };
  }

  private rec(node: Lambda | FnDecl, params: Param[], cls?: string): FnRec {
    const existing = this.fnRecs.get(node);
    if (existing) return existing;
    const r: FnRec = { id: ++this.ids, node, params: [], captures: new Set(), origin: origins.get(node), cls, returns: [], calls: [] };
    r.params = params.map((p, index) => ({ ...this.binding(p.name, p.ty, r), index }));
    this.fnRecs.set(node, r);
    return r;
  }

  private ctorRec(c: ObjectClassDecl): FnRec {
    const r = this.rec(c.ctor as unknown as FnDecl, c.ctor.params, c.name);
    r.params.forEach((b) => (b.ctorParam = true));
    return r;
  }

  private walkProgram() {
    const p = this.program;
    for (const g of p.globals) this.globals.set(g.name, this.binding(g.name, g.ty));
    for (const fn of p.functions) {
      const list = this.functions.get(fn.name) ?? [];
      list.push(this.rec(fn, fn.params));
      this.functions.set(fn.name, list);
    }
    // Whether each constructor lets `this` escape (a new object of it then isn't fresh), before anything asks.
    for (const c of p.objectClasses ?? []) {
      const self: Ty = { k: "class", name: c.name };
      this.leaks.set(c.name, !!(c.ctor.superArgs?.some((a) => this.escapes(a, "this", self)) || this.escapes(c.ctor.body, "this", self)));
    }
    const top: Scope = { vars: new Map(), fn: undefined, up: undefined };
    for (const g of p.globals) if (g.init) this.edge(this.src(g.init, top), `g:${g.name}`);
    for (const fn of p.functions) this.walkFn(this.fnRecs.get(fn)!, fn.body, top);
    for (const c of p.objectClasses ?? []) {
      const self: Ty = { k: "class", name: c.name };
      this.originStack.push(origins.get(c));
      const ctor = this.ctorRec(c);
      this.methodOf.set(ctor, { cls: c.name, ctor: true });
      const thisB = this.binding("this", self, ctor);
      const base = c.base ? (p.objectClasses ?? []).find((b) => b.name === c.base) : undefined;
      if (base) {
        const baseCtor = this.ctorRec(base);
        const scope = this.fnScope(ctor, top, thisB);
        this.stack.push(ctor);
        const args = (c.ctor.superArgs ?? []).map((a, i) => {
          const param = baseCtor.params[i];
          if (param) this.edge(this.src(a, scope), `v${param.id}`);
          if (!(a.e === "id" && ctor.params.some((b) => b.name === a.name))) this.addCtorWrite(c.name, this.desc(a, scope));
          return this.desc(a, scope);
        });
        baseCtor.calls.push(args);
        this.stack.pop();
      }
      this.walkFn(ctor, c.ctor.body, top, thisB, !this.leaksThis(c.name));
      for (const m of c.methods) {
        if (!m.body.length) continue;
        const r = this.rec(m, m.params, c.name);
        this.methodOf.set(r, { cls: c.name, ctor: false });
        this.walkFn(r, m.body, top, this.binding("this", self, r));
      }
      this.originStack.pop();
    }
    const main: FnDecl = { name: "main", params: [], ret: { k: "void" }, async: false, body: p.main };
    this.walkFn(this.rec(main, []), p.main, top);
  }

  private fnScope(fn: FnRec, up: Scope, self?: Binding): Scope {
    const vars = new Map<string, Binding>();
    for (const b of fn.params) vars.set(b.name, b);
    if (self) vars.set("this", self);
    return { vars, fn, up };
  }

  private walkFn(fn: FnRec, body: Stmt[] | Expr, up: Scope, self?: Binding, freshThis = false) {
    this.stack.push(fn);
    this.originStack.push(fn.origin);
    const scope = this.fnScope(fn, up, self);
    const outer = this.fresh;
    this.fresh = new Map();
    if (Array.isArray(body)) {
      const entry: { b: Binding; d: Fresh }[] = [];
      if (self && freshThis) entry.push({ b: self, d: { k: "fresh", self: new Set([classOf(self.ty)!]), parts: [] } });
      // A parameter is fresh while every caller passes a new object for it (only known at the end: a condition).
      for (const b of fn.params) {
        if (fn.node && "e" in fn.node) continue;
        entry.push({ b, d: { k: "fresh", self: this.nodesOf(b.ty, []), parts: [], of: { k: "param", fn, index: b.index!, ty: b.ty }, cond: () => this.paramFresh(fn, b.index!), ty: b.ty } });
      }
      this.block(body, scope, entry);
    } else {
      const s = this.src(body, scope);
      this.edge(s, `r${fn.id}`);
      fn.returns.push(this.desc(body, scope));
    }
    this.fresh = outer;
    this.originStack.pop();
    this.stack.pop();
  }

  private get origin(): ts.Node | undefined {
    for (let i = this.originStack.length - 1; i >= 0; i--) if (this.originStack[i]) return this.originStack[i];
    return undefined;
  }

  /** A statement list. Its lets and local functions are declared first (JavaScript's block scope, hoisting). */
  private block(stmts: Stmt[], up: Scope, entry: { b: Binding; d: Fresh }[] = []) {
    const scope: Scope = { vars: new Map(), fn: up.fn, up };
    const inits = new Map<string, Expr>();
    this.letInits.set(scope, inits);
    for (const s of stmts) {
      if (s.s === "let" && s.init && !stmts.some((t) => assigns(t, s.name))) inits.set(s.name, s.init);
      if (s.s === "let") scope.vars.set(s.name, this.binding(s.name, s.ty, up.fn));
      if (s.s === "fn") {
        const b = this.binding(s.decl.name, { k: "fn", params: s.decl.params.map((p) => p.ty), ret: s.decl.ret }, up.fn);
        b.fn = this.rec(s.decl, s.decl.params);
        scope.vars.set(s.decl.name, b);
      }
    }
    // Fresh objects: in the statements before the binding escapes (`windows`), and where it escapes by being stored.
    const windows = new Map<number, Binding[]>();
    const escapeAt = new Map<number, Binding>();
    const descs = new Map<Binding, Fresh>();
    const open = (b: Binding, from: number) => {
      let i = from;
      for (; i < stmts.length && !this.escapes(stmts[i], b.name, b.ty); i++) (windows.get(i) ?? windows.set(i, []).get(i)!).push(b);
      if (i < stmts.length) escapeAt.set(i, b);
    };
    for (const { b, d } of entry) {
      descs.set(b, d);
      open(b, 0);
    }
    const starts = new Set<number>();
    stmts.forEach((s, i) => {
      if (s.s !== "let" || !s.init || stmts.some((t) => assigns(t, s.name)) || !this.freshInit(s.init, scope)) return;
      starts.add(i);
      open(scope.vars.get(s.name)!, i + 1);
    });
    stmts.forEach((s, i) => {
      const prev = this.fresh;
      this.fresh = new Map(prev);
      for (const b of windows.get(i) ?? []) this.fresh.set(b, descs.get(b)!);
      const escaping = escapeAt.get(i);
      this.escapingValue = escaping && isDirectStore(s, escaping.name) ? { b: escaping, d: descs.get(escaping)! } : undefined;
      if (s.s === "let" && s.init && starts.has(i)) {
        const b = scope.vars.get(s.name)!;
        descs.set(b, this.freshOf(this.desc(s.init, scope), b.ty));
      }
      this.stmt(s, scope);
      this.escapingValue = undefined;
      this.fresh = prev;
    });
  }

  /** Whether a `let`'s value is a new object: `new`, a literal, a call of a function that may return one. */
  private freshInit(x: Expr, scope: Scope): boolean {
    if (x.e === "construct") return !this.leaksThis(x.cls);
    if (x.e === "new" || x.e === "arr" || x.e === "dict" || (x.e === "op" && x.op === "arr.filled")) return true;
    return x.e === "call" && x.callee.e === "id" && !this.lookup(x.callee.name, scope, false) && this.functions.has(x.callee.name);
  }

  /** A fresh object's description from its value's. */
  private freshOf(d: Desc, ty: Ty): Fresh {
    if (d.k === "fresh") return { ...d, parts: [...d.parts] };
    if (d.k === "ret") return { k: "fresh", self: this.nodesOf(ty, []), parts: [], of: d, cond: () => this.retFresh(d.fns), ty };
    return { k: "fresh", self: this.nodesOf(ty, []), parts: [], of: d, cond: () => false, ty };
  }

  private stmt(s: Stmt, scope: Scope) {
    const origin = origins.get(s);
    if (origin) this.originStack.push(origin);
    this.stmtInner(s, scope);
    if (origin) this.originStack.pop();
  }

  private stmtInner(s: Stmt, scope: Scope) {
    switch (s.s) {
      case "let": {
        const b = this.lookup(s.name, scope)!;
        if (!s.init) return;
        this.edge(this.src(s.init, scope), `v${b.id}`);
        // A variable closures capture is a box they hold: its first value too (`const o = { f: () => o.x }`).
        this.writes.push({ holder: () => this.capturersOf(b), value: this.desc(s.init, scope), origin: this.origin, what: `the variable "${b.name}", which a closure captures` });
        return;
      }
      case "assign":
        return this.assign(s, scope);
      case "expr":
        this.src(s.x, scope);
        return;
      case "if":
        this.src(s.c, scope);
        this.block(s.then, scope);
        if (s.else) this.block(s.else, scope);
        return;
      case "forOf": {
        const elem = s.elem ?? elemOf(this.tyOf(s.of, scope));
        const b = this.binding(s.name, elem ?? { k: "void" }, scope.fn);
        const of = s.of.e === "unwrap" ? s.of.x : s.of;
        if (of.e === "prop" && of.obj.e === "id" && of.obj.name === "this" && !assigns(s.body, s.name)) b.element = this.fieldSlot(this.tyOf(of.obj, scope), of.name);
        this.edge(this.src(s.of, scope), `v${b.id}`);
        this.block(s.body, { vars: new Map([[s.name, b]]), fn: scope.fn, up: scope });
        return;
      }
      case "forRange":
        this.src(s.from, scope);
        this.src(s.to, scope);
        this.block(s.body, { vars: new Map([[s.name, this.binding(s.name, { k: "int" }, scope.fn)]]), fn: scope.fn, up: scope });
        return;
      case "while":
        this.src(s.c, scope);
        this.block(s.body, scope);
        return;
      case "return":
        if (s.x && scope.fn) {
          this.edge(this.src(s.x, scope), `r${scope.fn.id}`);
          scope.fn.returns.push(this.desc(s.x, scope));
        }
        return;
      case "try":
        // Swift and Rust print the lowered form; its statements are the original ones.
        if (s.lowered) return this.block(s.lowered, scope);
        this.block(s.body, scope);
        this.block(s.catchBody, s.catchName ? { vars: new Map([[s.catchName, this.binding(s.catchName, { k: "rt", name: "Error" }, scope.fn)]]), fn: scope.fn, up: scope } : scope);
        if (s.finally) this.block(s.finally, scope);
        return;
      case "throw":
        this.src(s.message, scope);
        return;
      case "rethrow":
        this.src(s.error, scope);
        return;
      case "block":
        this.block(s.body, scope);
        return;
      case "switch":
        this.src(s.x, scope);
        for (const c of s.cases) {
          c.values.forEach((v) => this.src(v, scope));
          this.block(c.body, scope);
        }
        if (s.default) this.block(s.default, scope);
        return;
      case "fn": {
        const b = this.lookup(s.decl.name, scope, false);
        if (b?.fn) this.walkFn(b.fn, s.decl.body, scope);
        return;
      }
      case "break": case "continue": case "unreachable":
        return;
      default:
        // A statement kind added later: walk what it holds.
        for (const v of Object.values(s)) this.walkUnknown(v, scope);
    }
  }

  private walkUnknown(v: unknown, scope: Scope) {
    if (Array.isArray(v)) {
      if (v.some((x) => x && typeof x === "object" && "s" in x)) this.block(v as Stmt[], scope);
      else for (const x of v) this.walkUnknown(x, scope);
    } else if (v && typeof v === "object") {
      if ("e" in v) this.src(v as Expr, scope);
      else if ("s" in v) this.stmt(v as Stmt, scope);
    }
  }

  private assign(s: Extract<Stmt, { s: "assign" }>, scope: Scope) {
    const value = this.src(s.value, scope);
    if (s.op !== "=") {
      this.src(s.target, scope);
      return;
    }
    const t = s.target;
    if (t.e === "id") {
      const b = this.lookup(t.name, scope);
      if (!b) return;
      this.edge(value, this.slotOfBinding(b));
      // A variable some closure captures lives in a box the closure holds.
      if (b.owner) this.writes.push({ holder: () => this.capturersOf(b), value: this.desc(s.value, scope), origin: this.origin, what: `the variable "${b.name}", which a closure captures` });
    } else if (t.e === "prop") {
      const objTy = this.tyOf(t.obj, scope);
      this.src(t.obj, scope);
      const slot = this.fieldSlot(objTy, t.name);
      this.edge(value, slot);
      const target = t.obj.e === "id" ? this.lookup(t.obj.name, scope, false) : undefined;
      if (isFnTy(this.fieldTy(objTy, t.name))) this.fieldStores.push({ slot, value: s.value, target, holder: objTy, set: (x) => (s.value = x) });
      const freshTarget = target && this.fresh.get(target);
      this.stores.push({ slot, obj: t.obj, value: s.value, fn: scope.fn, fresh: !!freshTarget && !freshTarget.cond, scope });
      const boxed = classOf(objTy)?.startsWith("Ref__") && t.obj.e === "id";
      const what = boxed ? `the variable "${(t.obj as { name: string }).name}", which a class declared in its function uses` : `the field "${t.name}" of ${classOf(objTy) ?? "an object"}`;
      this.store(t.obj, objTy, this.desc(s.value, scope), scope, what, { slot, name: t.name, target }, s.value.e === "lambda" ? this.rec(s.value, s.value.params) : undefined, ownPart(t.obj, s.value, this.getters()));
    } else if (t.e === "index") {
      this.src(t.index, scope);
      this.elementWrite(t.obj, s.value, value, scope);
    }
  }

  /** A reference stored into the object `obj` (of type `objTy`): free if it is fresh, else a write to check. */
  private getterNames?: Set<string>;

  /** Every getter's name, of any class. */
  private getters(): Set<string> {
    if (!this.getterNames) {
      this.getterNames = new Set();
      for (const c of this.classes.values()) for (const m of c.methods.values()) if ((m as { getter?: boolean }).getter) this.getterNames.add(m.name);
    }
    return this.getterNames;
  }

  private store(obj: Expr, objTy: Ty | undefined, value: Desc, scope: Scope, what: string, field?: Write["field"], lambda?: FnRec, own = false) {
    const target = obj.e === "id" ? this.lookup(obj.name, scope, false) : undefined;
    const fresh = target && this.fresh.get(target);
    if (fresh) fresh.parts.push(field ? { k: "via", slot: field.slot, d: value } : value);
    if (target?.name === "this" && scope.fn?.cls && this.isCtor(scope.fn) && !fromParams(value, scope.fn)) this.addCtorWrite(scope.fn.cls, value);
    if (fresh && !fresh.cond) return;
    // `o.f = o.g` / `this.it = this.source`: o already reaches what one of its own fields holds, so no new cycle.
    if (own) return;
    this.writes.push({ holder: () => this.holderOf(objTy), value, origin: this.origin, skip: fresh?.cond, field, lambda, what });
  }

  /** `xs.push(v)`, `xs[i] = v`: a reference stored into what holds the array. */
  private elementWrite(arr: Expr, value: Expr, valueSrc: string[], scope: Scope) {
    this.src(arr, scope);
    for (const slot of this.slotsOf(arr, scope)) this.edge(valueSrc, slot);
    let root = arr;
    while (root.e === "index" || root.e === "unwrap") root = root.e === "index" ? root.obj : root.x;
    const desc = this.desc(value, scope);
    if (root.e === "prop") {
      const objTy = this.tyOf(root.obj, scope);
      this.inserts.push({ slot: this.fieldSlot(objTy, root.name), obj: root.obj, value, fn: scope.fn, scope });
      this.store(root.obj, objTy, desc, scope, `an array or map in the field "${root.name}" of ${classOf(objTy) ?? "an object"}`);
    } else {
      // An array or map in a variable, a parameter or a call's result: shared, so whatever can hold one of its type may
      // (a field of that type, a closure capturing a variable of that type), besides the closures capturing this one.
      const b = root.e === "id" ? this.lookup(root.name, scope, false) : undefined;
      const fresh = b && this.fresh.get(b);
      if (fresh) fresh.parts.push(desc);
      if (fresh && !fresh.cond) return;
      const ty = this.tyOf(root, scope);
      const holder = () => new Set([...(b?.owner ? this.capturersOf(b) : []), ...this.holdersOfShared(ty)]);
      // A variable may hold the very object this array belongs to (`const k = n.kids; k.push(n)`), new or not.
      const held: Desc = value.e === "id" ? { k: "plain", ty: this.tyOf(value, scope), src: valueSrc } : desc;
      this.writes.push({ holder, value: held, origin: this.origin, skip: fresh?.cond, what: b ? `the array or map "${b.name}", which other variables, fields or closures may share` : "an array or map that other variables, fields or closures may share" });
    }
  }

  /** The classes with a field, and the closures capturing a variable, that can hold an array or map of type `ty`. */
  private holdersOfShared(ty: Ty | undefined): string[] {
    if (!ty || (ty.k !== "array" && ty.k !== "map" && ty.k !== "jsmap" && ty.k !== "jsset")) return [];
    const key = JSON.stringify(ty);
    const holds = (t: Ty | undefined): boolean =>
      !!t && (JSON.stringify(t) === key || ((t.k === "array" || t.k === "map" || t.k === "optional" || t.k === "promise" || t.k === "jsset") && holds(t.of)) || (t.k === "jsmap" && (holds(t.key) || holds(t.of))) || (t.k === "union" && (this.unions.get(t.name) ?? []).some(holds)));
    const out: string[] = [];
    for (const info of this.classes.values()) if (info.kind !== "protocol" && [...info.fields.values()].some(holds)) out.push(...this.targets(info.name));
    for (const r of this.fnRecs.values()) if ([...r.captures].some((c) => holds(c.ty))) out.push(`λ${r.id}`);
    return out;
  }

  private isCtor(fn: FnRec): boolean {
    return (this.program.objectClasses ?? []).some((c) => (c.ctor as unknown) === fn.node);
  }

  private addCtorWrite(cls: string, d: Desc | undefined) {
    if (d) (this.ctorWrites.get(cls) ?? this.ctorWrites.set(cls, []).get(cls)!).push(d);
  }

  /** The binding of a name; `capture`: a use, which captures it in the functions between. */
  private lookup(name: string, scope: Scope | undefined, capture = true): Binding | undefined {
    for (let s = scope; s; s = s.up) {
      const b = s.vars.get(name);
      if (!b) continue;
      if (capture && b.owner) for (let i = this.stack.length - 1; i >= 0 && this.stack[i] !== b.owner; i--) this.stack[i]!.captures.add(b);
      return b;
    }
    return this.globals.get(name);
  }

  private slotOfBinding(b: Binding): string {
    return b.owner || b.fn ? `v${b.id}` : `g:${b.name}`;
  }

  private capturersOf(b: Binding): Set<string> {
    const out = new Set<string>();
    for (const r of this.fnRecs.values()) if (r.captures.has(b)) out.add(`λ${r.id}`);
    return out;
  }

  private holderOf(ty: Ty | undefined): Set<string> {
    const cls = classOf(ty);
    return new Set(cls ? this.targets(cls) : []);
  }

  /** The slots an array or object value is kept in (for writes into it). */
  private slotsOf(x: Expr, scope: Scope): string[] {
    switch (x.e) {
      case "id": {
        const b = this.lookup(x.name, scope, false);
        return b ? [this.slotOfBinding(b)] : [];
      }
      case "prop":
        return [this.fieldSlot(this.tyOf(x.obj, scope), x.name)];
      case "index":
        return this.slotsOf(x.obj, scope);
      case "unwrap":
        return this.slotsOf(x.x, scope);
      default:
        return [];
    }
  }

  private edge(from: string[], to: string) {
    for (const f of from) if (f !== to) (this.edges.get(f) ?? this.edges.set(f, new Set()).get(f)!).add(to);
  }

  private fnAtom(r: FnRec, asValue = true): string {
    if (asValue) r.asValue = true;
    const atom = `F${r.id}`;
    if (!this.content.has(atom)) this.content.set(atom, new Set([r]));
    return atom;
  }

  /** Where a value's functions come from (slots, or `F<id>`: a function itself). Walks the expression. */
  private src(x: Expr, scope: Scope): string[] {
    switch (x.e) {
      case "int": case "double": case "str": case "bool": case "nil": case "enum": case "decoder":
        return [];
      case "tpl":
        for (const p of x.parts) if (typeof p !== "string") this.src(p, scope);
        return [];
      case "id": {
        const b = this.lookup(x.name, scope);
        if (b?.fn) return [this.fnAtom(b.fn)];
        if (b) return [this.slotOfBinding(b)];
        const bound = this.withInits.get(x.name);
        if (bound) return bound.src;
        return (this.functions.get(x.name) ?? []).map((r) => this.fnAtom(r));
      }
      case "prop": {
        const objTy = this.tyOf(x.obj, scope);
        this.src(x.obj, scope);
        if (!this.isField(objTy, x.name) && this.fieldTy(objTy, x.name)) {
          const getter = this.classes.get(classOf(objTy)!)!.methods.get(x.name)!;
          this.invokes.push({ targets: this.methodsOf(objTy, x.name).map((m) => m.decl), recv: this.recv(x.obj, scope), fn: scope.fn });
          return [`r${this.rec(getter, getter.params).id}`];
        }
        const slot = this.fieldSlot(objTy, x.name);
        if (isFnTy(this.fieldTy(objTy, x.name))) this.valueReads.add(slot);
        this.reads.push({ slot, recv: this.recv(x.obj, scope), fn: scope.fn });
        return [slot];
      }
      case "index":
        this.src(x.index, scope);
        return this.src(x.obj, scope);
      case "call":
        return this.call(x, scope);
      case "rt":
        x.args.forEach((a) => this.src(a, scope));
        x.named?.forEach(([, a]) => this.src(a, scope));
        return [];
      case "method":
        this.src(x.obj, scope);
        x.args.forEach((a) => this.src(a, scope));
        return [];
      case "op":
        return this.op(x, scope);
      case "bin":
        // A nil test of a function field is not a read of its value.
        for (const side of [x.l, x.r]) {
          const other = side === x.l ? x.r : x.l;
          const read = side.e === "unwrap" ? side.x : side;
          if (read.e === "prop" && other.e === "nil" && isFnTy(this.fieldTy(this.tyOf(read.obj, scope), read.name))) this.src(read.obj, scope);
          else this.src(side, scope);
        }
        return [];
      case "not": case "neg": case "toDouble": case "toInt": case "numCast": case "toStr": case "instanceOf": case "uis":
        this.src(x.x, scope);
        return [];
      case "cond":
        this.src(x.c, scope);
        return [...this.src(x.a, scope), ...this.src(x.b, scope)];
      case "coalesce":
        return [...this.src(x.l, scope), ...this.src(x.r, scope)];
      // `with`: its value is the bound one or what the body computes (the binding is read through `init`).
      case "with": {
        const init = this.src(x.init, scope);
        this.withInits.set(x.name, { x: x.init, src: init });
        return [...init, ...this.src(x.body, scope)];
      }
      // An assignment used as a value: its statements (lets in a scope of their own), then its value.
      case "seq": {
        const inner: Scope = { vars: new Map(), fn: scope.fn, up: scope };
        this.seqScopes.set(x, inner);
        for (const s of x.body) {
          if (s.s === "let") inner.vars.set(s.name, this.binding(s.name, s.ty, scope.fn));
          this.stmt(s, inner);
        }
        return this.src(x.x, inner);
      }
      case "unwrap": case "downcast": case "uget": case "uwrap":
        return this.src(x.x, scope);
      case "lambda": {
        const r = this.rec(x, x.params);
        this.walkFn(r, x.body, scope);
        return [this.fnAtom(r)];
      }
      case "new": {
        const ty: Ty = { k: "class", name: x.cls };
        for (const entry of x.args) {
          const [f, v] = entry;
          const slot = this.fieldSlot(ty, f);
          this.edge(this.src(v, scope), slot);
          if (isFnTy(this.fieldTy(ty, f))) this.fieldStores.push({ slot, value: v, holder: ty, set: (y) => (entry[1] = y) });
        }
        return [];
      }
      case "arr":
        return x.items.flatMap((i) => this.src(i, scope));
      case "dict":
        return x.entries.flatMap(([, v]) => this.src(v, scope));
      case "style":
        x.props.forEach(([, v]) => this.src(v, scope));
        if (x.base) this.src(x.base, scope);
        return [];
      case "launch":
        this.src(x.call, scope);
        return [];
      case "await":
        return this.src(x.x, scope);
      case "incr":
        this.src(x.target, scope);
        return [];
      case "construct": {
        const cls = this.program.objectClasses?.find((c) => c.name === x.cls);
        const ctor = cls && this.ctorRec(cls);
        x.args.forEach((a, i) => {
          const param = ctor?.params[i];
          const s = this.src(a, scope);
          if (param) this.edge(s, `v${param.id}`);
        });
        ctor?.calls.push(x.args.map((a) => this.desc(a, scope)));
        this.constructs.push({ x, fn: scope.fn });
        this.exprScopes.set(x, scope);
        return [];
      }
      case "invoke": {
        const objTy = this.tyOf(x.obj, scope);
        this.src(x.obj, scope);
        const args = x.args.map((a) => this.src(a, scope));
        const descs = x.args.map((a) => this.desc(a, scope));
        const result = `c${++this.ids}`;
        this.invokes.push({ targets: this.methodsOf(objTy, x.name, x.sup).map((m) => m.decl), recv: this.recv(x.obj, scope), fn: scope.fn });
        for (const m of this.methodsOf(objTy, x.name, x.sup)) {
          const r = this.rec(m.decl, m.decl.params, m.cls);
          args.forEach((a, i) => r.params[i] && this.edge(a, `v${r.params[i]!.id}`));
          this.edge([`r${r.id}`], result);
          r.calls.push(descs);
        }
        return [result];
      }
      default:
        for (const v of Object.values(x)) this.walkUnknown(v, scope);
        return [];
    }
  }

  private call(x: Extract<Expr, { e: "call" }>, scope: Scope): string[] {
    let callee = x.callee;
    while (callee.e === "unwrap") callee = callee.x;
    const args = x.args.map((a) => this.src(a, scope));
    const result = `c${++this.ids}`;
    const local = callee.e === "id" ? this.lookup(callee.name, scope) : undefined;
    const named = callee.e === "id" && !local ? (this.functions.get(callee.name) ?? []) : local?.fn ? [local.fn] : [];
    if (named.length) {
      const descs = x.args.map((a) => this.desc(a, scope));
      for (const r of named) {
        args.forEach((a, i) => r.params[i] && this.edge(a, `v${r.params[i]!.id}`));
        this.edge([`r${r.id}`], result);
        r.calls.push(descs);
      }
      return [result];
    }
    if (callee.e === "prop") {
      // Calling a function field is not reading it as a value.
      const objTy = this.tyOf(callee.obj, scope);
      this.src(callee.obj, scope);
      const slot = this.fieldSlot(objTy, callee.name);
      if (this.isField(objTy, callee.name)) this.fieldCalls.push({ call: x, slot, recv: callee.obj, recvTy: objTy });
      this.dynamicCalls.push({ callee: [slot], args, result });
      return [result];
    }
    this.dynamicCalls.push({ callee: this.src(callee, scope), args, result });
    return [result];
  }

  private methodsOf(objTy: Ty | undefined, name: string, sup?: string): { decl: FnDecl; cls: string }[] {
    const cls = sup ?? classOf(objTy);
    const names = cls ? [cls, ...(sup ? [] : (this.subtypes.get(cls) ?? []))] : [...this.classes.keys()];
    const out: { decl: FnDecl; cls: string }[] = [];
    for (const n of names) {
      const m = this.classes.get(n)?.methods.get(name);
      if (m && m.body.length && !out.some((o) => o.decl === m)) out.push({ decl: m, cls: n });
    }
    return out;
  }

  private op(x: Extract<Expr, { e: "op" }>, scope: Scope): string[] {
    const [recv, ...rest] = x.args;
    // Map.set / Set.add (and setAll / addAll) store their arguments in the map, as push does in an array; a new
    // map's (`new Map(pairs)`) are what it is made of (desc).
    const mapStore = x.op === "mc.call" && recv && recv.e !== "op" && ["set", "add", "setAll", "addAll"].includes((rest[0] as { v?: string })?.v ?? "");
    if (mapStore) {
      for (const v of rest.slice(1)) this.elementWrite(recv, v, this.src(v, scope), scope);
      return [...this.src(recv, scope)];
    }
    if (INSERT_OPS.has(x.op) && recv) {
      // Into a new array (`new Array<T>(n).fill(v)`): nothing else can hold it yet.
      const fresh = recv.e === "arr" || (recv.e === "op" && COPY_OPS.has(recv.op));
      rest.forEach((v, i) => {
        const s = this.src(v, scope);
        if (!fresh && (x.op !== "arr.splice" || i >= 2)) this.elementWrite(recv, v, s, scope);
      });
      return x.op === "arr.fill" ? this.src(recv, scope) : [];
    }
    const recvSrc = recv ? this.src(recv, scope) : [];
    const out = [...recvSrc];
    const recvRoot = recv && (recv.e === "unwrap" ? recv.x : recv);
    for (const a of rest) {
      if (a.e === "lambda" && (x.op.startsWith("arr.") || x.op === "mc.call")) {
        const r = this.rec(a, a.params);
        this.syncIn.set(r, scope.fn);
        if (recvRoot?.e === "prop" && recvRoot.obj.e === "id" && recvRoot.obj.name === "this" && r.params[0] && !assigns(a.body, r.params[0].name)) r.params[0].element = this.fieldSlot(this.tyOf(recvRoot.obj, scope), recvRoot.name);
      }
      // A typed array's callback runs before the call returns, as an array method's does (its values are numbers).
      if (a.e === "lambda" && x.op === "ta.call") this.syncIn.set(this.rec(a, a.params), scope.fn);
      const s = this.src(a, scope);
      if (a.e === "lambda" || isFnTy(this.tyOf(a, scope))) {
        // A callback: it gets the elements (and, for reduce, the accumulator).
        const result = `c${++this.ids}`;
        const args = x.op === "arr.reduce" || x.op === "arr.reduceRight" ? [[...(x.args[2] ? this.src(x.args[2], scope) : []), result], recvSrc] : x.op === "mc.call" ? [recvSrc, recvSrc] : [recvSrc];
        this.dynamicCalls.push({ callee: s, args, result });
        out.push(result);
      } else out.push(...s);
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Types of IR expressions
  // ---------------------------------------------------------------------------

  private tyOf(x: Expr, scope: Scope): Ty | undefined {
    switch (x.e) {
      case "id": {
        const b = this.lookup(x.name, scope, false);
        if (b) return b.ty;
        // A `with`'s binding: its value's.
        const bound = this.withInits.get(x.name);
        if (bound) return this.tyOf(bound.x, scope);
        const fn = this.functions.get(x.name)?.[0]?.node as FnDecl | undefined;
        return fn ? { k: "fn", params: fn.params.map((p) => p.ty), ret: fn.ret } : undefined;
      }
      case "prop":
        return this.fieldTy(this.tyOf(x.obj, scope), x.name);
      case "index":
        return elemOf(this.tyOf(x.obj, scope));
      case "call": {
        let callee = x.callee;
        while (callee.e === "unwrap") callee = callee.x;
        const t = unopt(this.tyOf(callee, scope));
        return t?.k === "fn" ? t.ret : undefined;
      }
      case "invoke":
        return this.methodsOf(this.tyOf(x.obj, scope), x.name, x.sup)[0]?.decl.ret ?? this.protocolMethod(this.tyOf(x.obj, scope), x.name);
      case "op":
        return x.ty ?? this.opTy(x, scope);
      case "cond":
        return this.tyOf(x.a, scope) ?? this.tyOf(x.b, scope);
      case "coalesce":
        return unopt(this.tyOf(x.l, scope)) ?? this.tyOf(x.r, scope);
      case "with":
        return this.tyOf(x.body, scope) ?? this.tyOf(x.init, scope);
      case "seq":
        return x.ty;
      case "unwrap":
        return unopt(this.tyOf(x.x, scope));
      case "lambda":
        return { k: "fn", params: x.params.map((p) => p.ty), ret: x.ret };
      case "new": case "construct": case "downcast":
        return { k: "class", name: x.cls };
      case "arr":
        return { k: "array", of: x.of };
      case "dict":
        return { k: "map", of: x.of };
      case "uget": case "await":
        return x.ty;
      case "uwrap":
        return { k: "union", name: x.u };
      default:
        return undefined;
    }
  }

  private protocolMethod(ty: Ty | undefined, name: string): Ty | undefined {
    const visit = (n: string): Ty | undefined => {
      const info = this.classes.get(n);
      const m = info?.protocol?.methods.find((m) => m.name === name);
      if (m) return m.ret;
      for (const s of info?.supers ?? []) {
        const r = visit(s);
        if (r) return r;
      }
      return undefined;
    };
    const cls = classOf(ty);
    return cls ? visit(cls) : undefined;
  }

  private opTy(x: Extract<Expr, { e: "op" }>, scope: Scope): Ty | undefined {
    const recv = x.args[0] ? this.tyOf(x.args[0], scope) : undefined;
    const elem = elemOf(recv);
    switch (x.op) {
      case "arr.at": case "arr.pop": case "arr.shift": case "arr.find": case "arr.findI": case "arr.atRel": case "map.get":
        return elem && { k: "optional", of: elem };
      case "arr.filter": case "arr.filterI": case "arr.slice": case "arr.concat": case "arr.sort": case "arr.reverse": case "arr.splice":
        return recv;
      case "map.values":
        return elem && { k: "array", of: elem };
      case "arr.map": case "arr.mapI": {
        const f = x.args[1] && this.tyOf(x.args[1], scope);
        return f?.k === "fn" ? { k: "array", of: f.ret } : undefined;
      }
      case "arr.reduce":
        return x.args[2] && this.tyOf(x.args[2], scope);
      default:
        return undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Values: what they are made of
  // ---------------------------------------------------------------------------

  private desc(x: Expr, scope: Scope): Desc {
    switch (x.e) {
      case "lambda":
        return { k: "closure", fn: this.rec(x, x.params) };
      case "new":
        return { k: "fresh", self: new Set([x.cls]), parts: x.args.map(([, v]) => this.desc(v, scope)) };
      case "construct":
        return { k: "fresh", self: new Set([x.cls]), parts: x.args.map((v, index): Desc => ({ k: "via", arg: { cls: x.cls, index }, d: this.desc(v, scope) })), cls: x.cls };
      case "arr":
        return { k: "fresh", self: new Set(), parts: x.items.map((v) => this.desc(v, scope)) };
      case "dict":
        return { k: "fresh", self: new Set(), parts: x.entries.map(([, v]) => this.desc(v, scope)) };
      case "cond":
        return { k: "alt", options: [this.desc(x.a, scope), this.desc(x.b, scope)] };
      case "coalesce":
        return { k: "alt", options: [this.desc(x.l, scope), this.desc(x.r, scope)] };
      case "with":
        return { k: "alt", options: [this.desc(x.init, scope), this.desc(x.body, scope)] };
      case "seq":
        return this.desc(x.x, this.seqScopes.get(x) ?? scope);
      case "unwrap": case "uwrap": case "downcast":
        return this.desc(x.x, scope);
      case "op":
        // A copy holds the elements of what it was made from.
        if (COPY_OPS.has(x.op)) return { k: "fresh", self: new Set(), parts: x.args.filter((a) => a.e !== "lambda").map((a) => this.desc(a, scope)) };
        // A new Map / Set, a copy or a listing of one, or set / add chained on a new one: made of its arguments.
        if (x.op === "mc.new" || (x.op === "mc.call" && (["copy", "keysArr", "valuesArr", "pairs"].includes((x.args[1] as { v?: string }).v ?? "") || (x.args[0]?.e === "op" && this.desc(x.args[0], scope).k === "fresh")))) {
          return { k: "fresh", self: new Set(), parts: x.args.filter((a) => a.e !== "lambda" && a.e !== "str").map((a) => this.desc(a, scope)) };
        }
        // `[a].fill(v)`: a new array, holding what it held and the value.
        if ((x.op === "arr.fill" || x.op === "arr.copyWithin") && x.args[0] && (x.args[0].e === "arr" || (x.args[0].e === "op" && COPY_OPS.has(x.args[0].op)))) {
          return { k: "fresh", self: new Set(), parts: [this.desc(x.args[0], scope), ...(x.op === "arr.fill" ? [this.desc(x.args[1]!, scope)] : [])] };
        }
        break;
      case "call": {
        const callee = x.callee.e === "unwrap" ? x.callee.x : x.callee;
        const local = callee.e === "id" ? this.lookup(callee.name, scope, false) : undefined;
        const fns = callee.e === "id" && !local ? this.functions.get(callee.name) : local?.fn ? [local.fn] : undefined;
        if (fns?.length) return { k: "ret", fns, ty: this.tyOf(x, scope) };
        break;
      }
      case "invoke": {
        const fns = this.methodsOf(this.tyOf(x.obj, scope), x.name, x.sup).map((m) => this.rec(m.decl, m.decl.params, m.cls));
        if (fns.length) return { k: "ret", fns, ty: this.tyOf(x, scope) };
        break;
      }
      case "id": {
        const b = this.lookup(x.name, scope, false);
        // Fresh only where it escapes by being stored (before, any use as a value is an escape; after, it may be anywhere).
        if (b && this.escapingValue?.b === b) return this.escapingValue.d;
        // Read (as an array's receiver) before it escapes: still what it was made of.
        if (b && this.fresh.has(b)) return this.fresh.get(b)!;
        const bound = !b ? this.withInits.get(x.name) : undefined;
        if (bound) return this.desc(bound.x, scope);
        break;
      }
      default:
        if (PLAIN_VALUES.has(x.e)) return { k: "fresh", self: new Set(), parts: [] };
    }
    return { k: "plain", ty: this.tyOf(x, scope), src: this.srcOf(x, scope) };
  }

  /** `src` of an expression already walked (adds no flows or captures). */
  private srcOf(x: Expr, scope: Scope): string[] {
    if (x.e === "id") {
      const b = this.lookup(x.name, scope, false);
      if (b?.fn) return [this.fnAtom(b.fn, false)];
      if (b) return [this.slotOfBinding(b)];
      return (this.functions.get(x.name) ?? []).map((r) => this.fnAtom(r, false));
    }
    if (x.e === "prop") return [this.fieldSlot(this.tyOf(x.obj, scope), x.name)];
    if (x.e === "index" || x.e === "unwrap") return this.srcOf(x.e === "index" ? x.obj : x.x, scope);
    // Whatever slots appear in it: an over-approximation.
    const out: string[] = [];
    const visit = (n: unknown) => {
      if (Array.isArray(n)) n.forEach(visit);
      else if (n && typeof n === "object") {
        const e = n as Expr;
        if (e.e === "id" || e.e === "prop") out.push(...this.srcOf(e, scope));
        else if (e.e === "lambda") out.push(this.fnAtom(this.rec(e, e.params), false));
        else Object.values(n).forEach(visit);
      }
    };
    visit(x);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Escapes: where a fresh object stops being fresh
  // ---------------------------------------------------------------------------

  /** Whether `name` (of type `ty`) is used under `node` other than to read or write its fields, test it or as an array's receiver. */
  private escapes(node: unknown, name: string, ty: Ty): boolean {
    const isIt = (x: unknown) => !!x && typeof x === "object" && (x as Expr).e === "id" && (x as { name: string }).name === name;
    const visit = (n: unknown): boolean => {
      if (Array.isArray(n)) return n.some(visit);
      if (!n || typeof n !== "object") return false;
      const x = n as Expr & Stmt;
      if (isIt(x)) return true;
      if (x.e === "lambda" || x.s === "fn") return mentions(x, name);
      if (x.e === "prop" && isIt(x.obj)) return !this.isField(ty, x.name);
      if (x.s === "assign" && x.target.e === "prop" && isIt(x.target.obj) && this.isField(ty, x.target.name)) return visit(x.value);
      if (x.s === "assign" && x.target.e === "index" && x.target.obj.e === "prop" && isIt(x.target.obj.obj) && this.isField(ty, x.target.obj.name)) return visit(x.target.index) || visit(x.value);
      if (x.e === "op" && RECEIVER_OPS.has(x.op) && (isIt(x.args[0]) || (x.args[0]?.e === "prop" && isIt(x.args[0].obj) && this.isField(ty, x.args[0].name)))) return visit(x.args.slice(1));
      if (x.e === "bin" && ["==", "!=", "===", "!=="].includes(x.op) && (isIt(x.l) || isIt(x.r))) return visit(isIt(x.l) ? x.r : x.l);
      return Object.values(n).some(visit);
    };
    return visit(node);
  }

  // ---------------------------------------------------------------------------
  // Solving the flows; the graph
  // ---------------------------------------------------------------------------

  private solve() {
    const contentOf = (slot: string) => this.content.get(slot) ?? this.content.set(slot, new Set()).get(slot)!;
    const add = (from: string, to: string) => {
      const set = this.edges.get(from) ?? this.edges.set(from, new Set()).get(from)!;
      if (set.has(to)) return false;
      set.add(to);
      return true;
    };
    for (let changed = true; changed; ) {
      changed = false;
      for (const call of this.dynamicCalls) {
        for (const r of call.callee.flatMap((s) => [...contentOf(s)])) {
          call.args.forEach((a, i) => {
            const p = r.params[i];
            if (p) for (const s of a) if (add(s, `v${p.id}`)) changed = true;
          });
          if (add(`r${r.id}`, call.result)) changed = true;
        }
      }
      const work = [...this.edges.keys()];
      while (work.length) {
        const from = work.pop()!;
        const fs = contentOf(from);
        if (!fs.size) continue;
        for (const to of this.edges.get(from) ?? []) {
          const ts = contentOf(to);
          const before = ts.size;
          for (const f of fs) ts.add(f);
          if (ts.size !== before) (work.push(to), (changed = true));
        }
      }
    }
  }

  private closures(src: string[]): Set<string> {
    const out = new Set<string>();
    for (const s of src) for (const r of this.content.get(s) ?? []) out.add(`λ${r.id}`);
    return out;
  }

  /** The graph nodes a value of type `ty` can be (its functions: the closures in `src`). */
  private nodesOf(ty: Ty | undefined, src: string[], out = new Set<string>()): Set<string> {
    switch (ty?.k) {
      case "class":
        for (const t of this.targets(ty.name)) out.add(t);
        break;
      case "array": case "map": case "optional": case "promise": case "settled": case "jsset":
        this.nodesOf(ty.of, src, out);
        break;
      case "jsmap":
        this.nodesOf(ty.key, src, out);
        this.nodesOf(ty.of, src, out);
        break;
      case "union":
        for (const m of this.unions.get(ty.name) ?? []) this.nodesOf(m, src, out);
        break;
      case "fn":
        for (const n of this.closures(src)) out.add(n);
        break;
      case "rt":
        // A native error may carry an object of the app's error classes (`throw new E()`, transpile.ts errorBase).
        if (ty.name === "Error") for (const t of this.targets("Error__")) out.add(t);
        break;
    }
    return out;
  }

  private guard = new Set<object>();
  /** `with` bindings (unique temporaries), read as their value: what flows from it, and its description. */
  private readonly withInits = new Map<string, { x: Expr; src: string[] }>();
  /** The scope of a `seq`'s statements (its lets), where its value is read. */
  private readonly seqScopes = new WeakMap<Expr, Scope>();

  /** Whether a value is a new object (nothing references it). */
  private isFresh(d: Desc): boolean {
    if (this.guard.has(d)) return false;
    this.guard.add(d);
    try {
      switch (d.k) {
        case "fresh":
          return !d.cond || d.cond();
        case "closure":
          return true;
        case "via":
          return this.isFresh(d.d);
        case "alt":
          return d.options.every((o) => this.isFresh(o));
        case "ret":
          return this.retFresh(d.fns);
        case "param":
          return this.paramFresh(d.fn, d.index);
        default:
          return false;
      }
    } finally {
      this.guard.delete(d);
    }
  }

  private retFresh(fns: FnRec[]): boolean {
    return fns.every((r) => !this.guard.has(r) && r.returns.length > 0 && this.within(r, () => r.returns.every((d) => this.isFresh(d))));
  }

  private paramFresh(fn: FnRec, index: number): boolean {
    // A left-out argument is the parameter's default: a literal there is new on each call.
    const byDefault = () => !!(fn.node as FnDecl).params?.[index]?.default && isFreshLiteral((fn.node as FnDecl).params[index]!.default!);
    return !fn.asValue && fn.calls.length > 0 && !this.guard.has(fn) && this.within(fn, () => fn.calls.every((args) => (args[index] ? this.isFresh(args[index]!) : byDefault())));
  }

  private within<T>(key: object, f: () => T): T {
    this.guard.add(key);
    try {
      return f();
    } finally {
      this.guard.delete(key);
    }
  }

  /** The nodes a value is or reaches. */
  private full(d: Desc, out = new Set<string>()): Set<string> {
    if (d.k === "via") return this.weakVia(d) ? out : this.full(d.d, out);
    if (d.k === "fresh" && (!d.cond || this.isFresh(d))) for (const s of d.self) out.add(s);
    else if (d.k === "fresh" || d.k === "ret" || d.k === "param") this.nodesOf(d.ty, [], out);
    return this.top(d, out);
  }

  /** The nodes a value reaches, itself excluded when it is new (nothing reaches it). */
  private top(d: Desc, out = new Set<string>()): Set<string> {
    if (this.guard.has(d)) return out;
    this.guard.add(d);
    try {
      switch (d.k) {
        case "via":
          if (!this.weakVia(d)) this.top(d.d, out);
          break;
        case "plain":
          this.nodesOf(d.ty, d.src, out);
          break;
        case "closure":
          out.add(`λ${d.fn.id}`);
          break;
        case "alt":
          for (const o of d.options) this.top(o, out);
          break;
        case "fresh":
          if (d.cond && !d.cond()) this.nodesOf(d.ty, [], out);
          for (const p of d.parts) this.full(p, out);
          if (d.of) this.top(d.of, out);
          if (d.cls) {
            if (this.leaksThis(d.cls)) for (const t of this.targets(d.cls)) out.add(t);
            else for (const c of this.ctorChain(d.cls)) for (const w of this.ctorWrites.get(c) ?? []) this.full(w, out);
          }
          break;
        case "ret":
          if (this.retFresh(d.fns)) for (const r of d.fns) this.within(r, () => r.returns.forEach((x) => this.top(x, out)));
          else this.nodesOf(d.ty, d.fns.map((r) => `r${r.id}`), out);
          break;
        case "param":
          if (this.paramFresh(d.fn, d.index)) this.within(d.fn, () => d.fn.calls.forEach((args) => args[d.index] && this.top(args[d.index]!, out)));
          else this.nodesOf(d.ty, [`v${d.fn.params[d.index]!.id}`], out);
          break;
      }
    } finally {
      this.guard.delete(d);
    }
    return out;
  }

  private ctorChain(cls: string): string[] {
    const out: string[] = [];
    for (let c = this.classes.get(cls)?.object; c; c = c.base ? this.classes.get(c.base)?.object : undefined) out.push(c.name);
    return out;
  }

  private leaksThis(cls: string): boolean {
    return this.ctorChain(cls).some((c) => this.leaks.get(c));
  }

  private buildGraph() {
    const g = new Map<string, Map<string, string>>();
    const add = (from: string, to: Set<string>, label: string) => {
      const m = g.get(from) ?? g.set(from, new Map()).get(from)!;
      for (const t of to) if (!m.has(t)) m.set(t, label);
    };
    for (const info of this.classes.values()) {
      if (info.kind === "protocol") continue;
      for (const [f, ty] of info.fields) {
        const slot = `f:${this.find(`${info.name}.${f}`)}`;
        if (!this.weakSlots.has(slot)) add(info.name, this.nodesOf(ty, [slot]), `.${f}`);
      }
    }
    for (const r of this.fnRecs.values()) {
      for (const b of r.captures) add(`λ${r.id}`, b.fn ? new Set([`λ${b.fn.id}`]) : this.nodesOf(b.ty, [`v${b.id}`]), `captures "${b.name}"`);
    }
    this.graph = g;
  }

  /** A path from the value to the object written into, if the value can reach it: the write may close a cycle. */
  private danger(w: Write): string[] | undefined {
    const targets = w.holder();
    if (!targets.size) return undefined;
    const parent = new Map<string, string | undefined>();
    const queue: string[] = [];
    for (const f of this.top(w.value)) if (!parent.has(f)) (parent.set(f, undefined), queue.push(f));
    while (queue.length) {
      const n = queue.shift()!;
      if (targets.has(n)) {
        const path: string[] = [];
        for (let at: string | undefined = n; at !== undefined; at = parent.get(at)) path.unshift(at);
        return path;
      }
      for (const next of this.graph.get(n)?.keys() ?? []) if (!parent.has(next)) (parent.set(next, n), queue.push(next));
    }
    return undefined;
  }

  // ---------------------------------------------------------------------------
  // (4) Closures stored in a field of the object they capture
  // ---------------------------------------------------------------------------

  /**
   * `obj.f = () => …obj…` (`obj` is `this` or a local that is never reassigned): when the field is only ever called,
   * the closure takes the object as a last parameter (`owner__`) instead of capturing it, every call passes the object
   * it read the field from (`o.f(x)` → `o.f(x, o)`), and every other value stored into the field is adapted to take
   * the object and ignore it. The field's declaring class must be the only class with it (no subclass, no protocol),
   * and the calls' receivers plain variables or field reads, so they can be evaluated twice.
   */
  private ownedClosures() {
    const candidates = new Map<string, Write[]>();
    for (const w of this.writes) {
      const target = w.field?.target;
      if (!w.lambda || !target || !w.lambda.captures.has(target)) continue;
      const list = candidates.get(w.field!.slot) ?? candidates.set(w.field!.slot, []).get(w.field!.slot)!;
      list.push(w);
    }
    for (const [slot, list] of candidates) {
      const why = this.notOwnable(slot, list);
      if (why) {
        for (const w of list) w.what += ` (${why})`;
        continue;
      }
      this.convert(slot, list);
    }
  }

  /** Why the closures of a field family can't take their object as a parameter (undefined: they can). */
  private notOwnable(slot: string, list: Write[]): string | undefined {
    if (this.valueReads.has(slot)) return "the field is also read as a value, not only called";
    const members = [...this.classes.values()].filter((c) => [...c.fields.keys()].some((f) => `f:${this.find(`${c.name}.${f}`)}` === slot));
    const owner = members[0];
    if (members.length !== 1 || owner!.kind === "protocol" || this.subtypes.get(owner!.name)?.size || owner!.supers.length) return "the field belongs to a class hierarchy or an interface";
    for (const c of this.fieldCalls) if (c.slot === slot && !pureReceiver(c.recv)) return "a call reads the field from a computed value";
    for (const s of this.fieldStores) {
      if (s.slot !== slot || s.value.e === "lambda" || s.value.e === "nil") continue;
      if (s.value.e !== "id") return "a value other than a function written there is stored in it";
    }
    for (const w of list) {
      const lambda = w.lambda!.node as Lambda;
      const name = w.field!.target!.name;
      if (lambda.params.some((p) => p.name === OWNER || p.name === name) || declares(lambda.body, name) || declares(lambda.body, OWNER)) return "the closure redeclares the object's name";
      if (name !== "this" && assigns(declaringScope(this.program, lambda, name), name) && w.field!.target!.owner) return "the variable holding the object is reassigned";
    }
    return undefined;
  }

  private convert(slot: string, list: Write[]) {
    const owner = [...this.classes.values()].find((c) => [...c.fields.keys()].some((f) => `f:${this.find(`${c.name}.${f}`)}` === slot))!;
    const ownerTy: Ty = { k: "class", name: owner.name };
    const field = [...owner.fields.keys()].find((f) => `f:${this.find(`${owner.name}.${f}`)}` === slot)!;
    const old = owner.fields.get(field)!;
    const fnTy = unopt(old) as Extract<Ty, { k: "fn" }>;
    const widened: Extract<Ty, { k: "fn" }> = { ...fnTy, params: [...fnTy.params, ownerTy] };
    const newTy: Ty = old.k === "optional" ? { k: "optional", of: widened } : widened;
    for (const f of [...(owner.record?.fields ?? []), ...(owner.object?.fields ?? [])]) if (f.name === field) f.ty = newTy;
    owner.fields.set(field, newTy);
    const triggers = new Map(list.map((w) => [w.lambda!.node as Lambda, w.field!.target!.name]));
    for (const s of this.fieldStores) {
      if (s.slot !== slot || s.value.e === "nil") continue;
      if (s.value.e === "lambda") {
        const lambda = s.value;
        const name = triggers.get(lambda);
        if (name) replaceId(lambda.body, name, OWNER);
        lambda.params = [...lambda.params, { name: OWNER, ty: ownerTy, ...(name ? {} : { unused: true }) }];
        continue;
      }
      // A function value: adapted to take the object and ignore it.
      const params: Param[] = fnTy.params.map((ty, i) => ({ name: `p__${i}`, ty }));
      const call: Expr = { e: "call", callee: s.value, args: params.map((p) => ({ e: "id", name: p.name })), ...(fnTy.throws ? { throws: true } : {}) };
      s.set({ e: "lambda", params: [...params, { name: OWNER, ty: ownerTy, unused: true }], ret: fnTy.ret, body: fnTy.ret.k === "void" ? [{ s: "expr", x: call }] : call, ...(fnTy.throws ? { throws: true } : {}) });
    }
    for (const c of this.fieldCalls) if (c.slot === slot) c.call.args = [...c.call.args, structuredClone(c.recv)];
    for (const w of list) {
      this.converted.add(w.lambda!);
      w.lambda!.captures.delete(w.field!.target!);
    }
  }

  // ---------------------------------------------------------------------------
  // Back-pointers: weak where the owner is provably alive at every read
  // ---------------------------------------------------------------------------

  private recv(x: Expr, scope: Scope): Recv {
    const r = x.e === "unwrap" ? x.x : x;
    if (r.e === "id" && r.name === "this") return { k: "this" };
    if (r.e === "id") {
      const b = this.lookup(r.name, scope, false);
      return b?.element ? { k: "element", slot: b.element } : { k: "other" };
    }
    const arr = r.e === "index" ? r.obj : r.e === "op" && r.op === "arr.at" ? r.args[0] : undefined;
    const field = arr && (arr.e === "unwrap" ? arr.x : arr);
    if (field?.e === "prop" && field.obj.e === "id" && field.obj.name === "this") return { k: "element", slot: this.fieldSlot(this.tyOf(field.obj, scope), field.name) };
    return { k: "other" };
  }

  /** Whether code in `fn` runs while a method of `cls` runs on `this` (inside it, or in a callback it calls at once). */
  private runsIn(fn: FnRec | undefined, cls: string, ctor = true): boolean {
    for (let at = fn; at; at = this.syncIn.get(at)) {
      const m = this.methodOf.get(at);
      if (m) return m.cls === cls && (ctor || !m.ctor);
      if (!this.syncIn.has(at)) return false;
    }
    return false;
  }

  /**
   * A child's field pointing back at the parent that holds it (\`child.parent = this\` where \`this.children\` holds the
   * child) is made weak when every read of it finds the parent alive, which holds when:
   * - the field (optional, of a final class P, in a final class C) is set only to \`null\`, or to \`this\` inside a method
   *   of P on a C just made there, which the same method adds to one of P's fields holding Cs (its "children");
   *   or by C's constructor from a parameter that every \`new C\` passes \`this\` for, inside a method of P that adds it;
   * - nothing else adds to those fields (they may be filtered, sliced or emptied by P's methods), so a child is only
   *   ever in the children of the parent it points at;
   * - it is read only as \`this.parent\` in C's methods (M), and every call of a method in M is on \`this\` in a method of
   *   C (then that one is in M too), or on a child read from \`this.children\` in a method of P (or in an array method's
   *   callback there): that P is running a method, so it is alive (Swift keeps \`self\` for the whole call, Rust holds the
   *   \`Rc\`), and it is the child's parent.
   * Returns whether some field became weak.
   */
  private backPointers(open: Write[]): boolean {
    if (!open.length) return false;
    let changed = false;
    // Every field of a class that is an optional object of another class holding it.
    const slots = [...this.classes.values()].filter((c) => c.kind === "object").flatMap((c) => [...c.fields].filter(([, t]) => t.k === "optional" && t.of.k === "class").map(([f]) => `f:${this.find(`${c.name}.${f}`)}`));
    for (const slot of new Set(slots)) {
      if (this.weakable(slot)) {
        this.weakSlots.add(slot);
        changed = true;
      }
    }
    return changed;
  }

  private weakable(slot: string): boolean {
    const members = [...this.classes.values()].filter((c) => [...c.fields.keys()].some((f) => `f:${this.find(`${c.name}.${f}`)}` === slot));
    const c = members[0];
    if (members.length !== 1 || c!.kind !== "object" || this.subtypes.get(c!.name)?.size) return false;
    const field = [...c!.fields.keys()].find((f) => `f:${this.find(`${c!.name}.${f}`)}` === slot)!;
    const ty = c!.fields.get(field)!;
    const p = ty.k === "optional" && ty.of.k === "class" ? this.classes.get(ty.of.name) : undefined;
    if (!p || p.kind !== "object" || this.subtypes.get(p.name)?.size) return false;
    const holds = (t: Ty | undefined): boolean => (t?.k === "optional" || t?.k === "array" ? holds(t.of) : t?.k === "class" && t.name === c!.name);
    const children = new Set([...p.fields].filter(([, t]) => holds(t)).map(([f]) => `f:${this.find(`${p.name}.${f}`)}`).filter((s) => s !== slot));
    if (!children.size) return false;
    const isThis = (x: Expr) => x.e === "id" && x.name === "this";
    const added = (fn: FnRec | undefined, value: (v: Expr) => boolean) => this.inserts.some((i) => children.has(i.slot) && i.fn === fn && isThis(i.obj) && value(i.value));
    // `new C(…, this, …)` in a method of P that adds it to P's children (directly, or through a fresh local).
    const ctorIndex = c!.object!.ctor.params.findIndex((param) => this.stores.some((st) => st.slot === slot && isThis(st.obj) && st.value.e === "id" && st.value.name === param.name && this.methodOf.get(st.fn!)?.ctor));
    const linkedNew = (x: Expr, fn: FnRec | undefined, scope?: Scope): boolean => {
      if (x.e !== "construct" || x.cls !== c!.name || ctorIndex < 0 || !isThis(x.args[ctorIndex] ?? { e: "nil" }) || !this.runsIn(fn, p.name)) return false;
      return added(fn, (v) => v === x || (v.e === "id" && !!scope && this.letOf(scope, v.name) === x));
    };
    for (const st of this.stores) {
      if (st.slot !== slot || st.value.e === "nil") continue;
      const m = st.fn && this.methodOf.get(st.fn);
      if (m?.ctor && m.cls === c!.name && isThis(st.obj) && st.value.e === "id" && st.value.name === c!.object!.ctor.params[ctorIndex]?.name) {
        // Each `new C` passes null for it (or leaves it to a null default), or `this` of a P adding the child.
        const nothing = (k: { x: Extract<Expr, { e: "construct" }> }) => {
          const arg = k.x.args[ctorIndex] ?? c!.object!.ctor.params[ctorIndex]?.default;
          return !arg || arg.e === "nil";
        };
        if (!this.constructs.filter((k) => k.x.cls === c!.name).every((k) => nothing(k) || linkedNew(k.x, k.fn, this.scopeOf(k.x)))) return false;
        continue;
      }
      const x = st.obj.e === "id" ? st.obj.name : undefined;
      if (!isThis(st.value) || !x || !st.fresh || !this.runsIn(st.fn, p.name) || st.fn !== this.fnOfMethod(st.fn)) return false;
      if (!added(st.fn, (v) => v.e === "id" && v.name === x)) return false;
    }
    // Nothing else goes into the children: the linked new children, or a part of them (filter, slice), or nothing.
    for (const ins of this.inserts) {
      if (!children.has(ins.slot)) continue;
      const v = ins.value;
      const linked = v.e === "id" && this.stores.some((st) => st.slot === slot && st.fn === ins.fn && st.obj.e === "id" && st.obj.name === v.name && isThis(st.value));
      if (!isThis(ins.obj) || !(linked || linkedNew(v, ins.fn, ins.scope) || (v.e === "id" && linkedNew(this.letOf(ins.scope, v.name) ?? { e: "nil" }, ins.fn, ins.scope)))) return false;
    }
    for (const st of this.stores) {
      if (!children.has(st.slot)) continue;
      const v = st.value;
      const part = (x: Expr): boolean => x.e === "nil" || (x.e === "arr" && !x.items.length) || (x.e === "op" && COPY_OPS.has(x.op) && x.op !== "arr.concat" && !!x.args[0] && part(x.args[0])) || (x.e === "prop" && isThis(x.obj) && children.has(this.fieldSlot({ k: "class", name: p.name }, x.name)));
      if (!isThis(st.obj) || !this.runsIn(st.fn, p.name) || !(part(v) && !(v.e === "prop"))) return false;
    }
    // Reads: `this.field` in C's methods (M), and M's callers.
    const inM = new Set<FnDecl>();
    for (const r of this.reads) {
      if (r.slot !== slot) continue;
      const m = r.fn && this.methodOf.get(r.fn);
      if (!m || m.ctor || m.cls !== c!.name || r.recv.k !== "this") return false;
      inM.add(r.fn!.node as FnDecl);
    }
    for (let grew = true; grew; ) {
      grew = false;
      for (const inv of this.invokes) {
        const m = inv.fn && this.methodOf.get(inv.fn);
        if (!inv.targets.some((t) => inM.has(t)) || inv.recv.k !== "this" || !m || m.ctor || m.cls !== c!.name || inM.has(inv.fn!.node as FnDecl)) continue;
        inM.add(inv.fn!.node as FnDecl);
        grew = true;
      }
    }
    for (const inv of this.invokes) {
      if (!inv.targets.some((t) => inM.has(t))) continue;
      const m = inv.fn && this.methodOf.get(inv.fn);
      const onThis = inv.recv.k === "this" && !!m && !m.ctor && m.cls === c!.name;
      const onChild = inv.recv.k === "element" && children.has(inv.recv.slot) && this.runsIn(inv.fn, p.name);
      if (!onThis && !onChild) return false;
    }
    for (const f of c!.object ? this.ctorChain(c!.name).flatMap((n) => this.classes.get(n)!.object!.fields) : []) if (f.name === field) f.weak = true;
    return true;
  }

  /** A part kept only in a weak back-pointer: a field, or a constructor parameter the constructor only stores in one. */
  private weakVia(d: Extract<Desc, { k: "via" }>): boolean {
    if (d.slot) return this.weakSlots.has(d.slot);
    if (!d.arg || !this.weakSlots.size) return false;
    const c = this.classes.get(d.arg.cls)?.object;
    const ctor = c && this.fnRecs.get(c.ctor);
    const name = ctor?.params[d.arg.index]?.name;
    if (!c || !ctor || !name) return false;
    const weakStores = this.stores.filter((st) => st.fn === ctor && st.obj.e === "id" && st.obj.name === "this" && st.value.e === "id" && st.value.name === name && this.weakSlots.has(st.slot)).length;
    return weakStores > 0 && weakStores === countMentions([c.ctor.body, c.ctor.superArgs ?? []], name);
  }

  /** The method a function is (itself, not a closure in it). */
  private fnOfMethod(fn: FnRec | undefined): FnRec | undefined {
    return fn && this.methodOf.has(fn) ? fn : undefined;
  }

  private readonly letInits = new Map<Scope, Map<string, Expr>>();

  /** The value a `let` of this name was declared with, in this scope or around it. */
  private letOf(scope: Scope, name: string): Expr | undefined {
    for (let s: Scope | undefined = scope; s; s = s.up) {
      const init = this.letInits.get(s)?.get(name);
      if (init) return init;
      if (s.vars.has(name)) return undefined;
    }
    return undefined;
  }

  private readonly exprScopes = new WeakMap<object, Scope>();

  private scopeOf(x: object): Scope | undefined {
    return this.exprScopes.get(x);
  }

  // ---------------------------------------------------------------------------
  // (6) Cycles the runtime's collector frees
  // ---------------------------------------------------------------------------

  /**
   * The nodes a field's value holds strongly: those the collector walks (objects, in optionals, arrays, records, Maps
   * and Sets) and the others (in unions, promises, functions, errors, WeakMap values). A WeakRef / WeakSet holds none.
   */
  private fieldNodes(ty: Ty, slot: string): { walk: Set<string>; opaque: Set<string> } {
    const walk = new Set<string>();
    const opaque = new Set<string>();
    const visit = (t: Ty): void => {
      switch (t.k) {
        case "class":
          for (const n of this.targets(t.name)) walk.add(n);
          return;
        case "optional": case "array": case "map":
          return visit(t.of);
        case "jsmap":
          if (t.weak) this.nodesOf(t.of, [slot], opaque);
          else (visit(t.key), visit(t.of));
          return;
        case "jsset":
          if (!t.weak && !t.ref) visit(t.of);
          return;
        default:
          this.nodesOf(t, [slot], opaque);
      }
    };
    visit(ty);
    return { walk, opaque };
  }

  /**
   * A write that may close a cycle: every node on a path from the value back to the object written into must be a
   * class whose references to the others the collector walks. Then those classes are collected (undefined); else why not.
   */
  private collect(w: Write): string | undefined {
    const targets = w.holder();
    const bfs = (from: Iterable<string>, next: (n: string) => Iterable<string>) => {
      const seen = new Set<string>(from);
      const queue = [...seen];
      while (queue.length) for (const m of next(queue.pop()!)) if (!seen.has(m)) (seen.add(m), queue.push(m));
      return seen;
    };
    const forward = bfs(this.top(w.value), (n) => this.graph.get(n)?.keys() ?? []);
    const reverse = new Map<string, string[]>();
    for (const [from, tos] of this.graph) for (const to of tos.keys()) (reverse.get(to) ?? reverse.set(to, []).get(to)!).push(from);
    const back = bfs([...targets].filter((t) => forward.has(t)), (n) => reverse.get(n) ?? []);
    const cycle = [...forward].filter((n) => back.has(n));
    for (const n of cycle) {
      const info = this.classes.get(n);
      if (n.startsWith("λ")) return `the cycle can pass through ${this.nodeName(n)}, and what a closure captures is invisible natively, so the cycle collector can't free it (a listener can carry the object in a field instead: \`bind(owner, (owner, arg) => …)\` from @nuclo/native-ts/adapters, with \`Emitter<A>\`)`;
      if (n.startsWith("Ref__")) return `the cycle can pass through ${this.nodeName(n)}, which the cycle collector doesn't track`;
      if (!info || info.kind === "protocol") return `the cycle can pass through ${this.nodeName(n)}, which the cycle collector doesn't track`;
    }
    const on = new Set(cycle);
    for (const n of cycle) {
      const info = this.classes.get(n)!;
      for (const [f, ty] of info.fields) {
        const slot = `f:${this.find(`${info.name}.${f}`)}`;
        if (this.weakSlots.has(slot)) continue;
        if ([...this.fieldNodes(ty, slot).opaque].some((x) => on.has(x))) {
          return `the cycle can pass through the field "${f}" of ${n}, which holds the objects in a value the cycle collector doesn't look into (a union, a promise, a function, an error or a WeakMap value); keep them in a field of their own class type, an array, a record, a Map or a Set`;
        }
      }
    }
    for (const n of cycle) this.collected.add(n);
    return undefined;
  }

  /** Marks the collected classes' declarations (whole class hierarchies) with the fields the collector walks. */
  private markCollected() {
    for (const n of [...this.collected]) {
      for (const c of this.ctorChain(n)) this.collected.add(c);
    }
    for (const n of [...this.collected]) {
      if (this.classes.get(n)?.kind !== "object") continue;
      const visit = (c: string) => {
        for (const s of this.subtypes.get(c) ?? []) {
          if (this.classes.get(s)?.kind !== "object" || this.collected.has(s)) continue;
          this.collected.add(s);
          visit(s);
        }
      };
      visit(n);
    }
    const walked = (cls: string, f: string, ty: Ty) => [...this.fieldNodes(ty, `f:${this.find(`${cls}.${f}`)}`).walk].some((n) => this.collected.has(n));
    for (const c of this.program.classes) {
      if (this.collected.has(c.name)) c.gc = c.fields.filter((f) => walked(c.name, f.name, f.ty)).map((f) => f.name);
    }
    for (const c of this.program.objectClasses ?? []) {
      if (this.collected.has(c.name)) c.gc = c.fields.filter((f) => !f.weak && walked(c.name, f.name, f.ty)).map((f) => f.name);
    }
  }

  // ---------------------------------------------------------------------------
  // Diagnostics
  // ---------------------------------------------------------------------------

  /** A graph node as the app's code names it. */
  private nodeName(n: string): string {
    if (n.startsWith("λ")) {
      const r = [...this.fnRecs.values()].find((r) => `λ${r.id}` === n);
      const o = r && origins.get(r.node);
      return o ? `the closure at line ${o.getSourceFile().getLineAndCharacterOfPosition(o.getStart()).line + 1}` : "a closure";
    }
    if (n.startsWith("Ref__")) return `a box of a local that a class declared in a function uses (${n})`;
    if (n.endsWith("__Literal")) return `an object literal of ${n.slice(0, -"__Literal".length)}`;
    return n;
  }

  private message(w: Write, path: string[], why: string): string {
    const chain = path
      .map((n, i) => {
        const label = i + 1 < path.length ? this.graph.get(n)?.get(path[i + 1]!) : undefined;
        const name = this.nodeName(n);
        return !label ? name : label.startsWith(".") ? `${name}${label}` : `${name} (${label})`;
      })
      .join(" → ");
    const lead = path.length > 1 ? `the value leads back to it (${chain})` : `the value is, or holds, ${this.nodeName(path[0]!).replace(/^the /, "a ").replace(/^(?![a])/, "a ")}`;
    const own = w.lambda && w.field?.target && w.lambda.captures.has(w.field.target);
    const fix = own
      ? `A closure kept in a field of the object it captures compiles when that field is only ever called (\`obj.${w.field!.name}(…)\`, then natively the closure gets the object as a parameter); otherwise make it a method.`
      : w.field || w.what.startsWith("an array")
        ? `Keep the objects in fields typed by their classes (or in arrays, records, Maps or Sets of them), where the cycle collector sees them; or pass the object as a parameter to the code that needs it instead of capturing it.`
        : `Pass the object to the closure as a parameter instead of storing it in a variable the closure captures.`;
    return `Possible reference cycle: this stores into ${w.what}, and ${lead}; ${why}. Swift (ARC) and Rust (Rc) never free objects that point at each other, which JavaScript's garbage collector would. ${fix}`;
  }
}

function classOf(ty: Ty | undefined): string | undefined {
  if (!ty) return undefined;
  if (ty.k === "optional") return classOf(ty.of);
  return ty.k === "class" ? ty.name : undefined;
}

function unopt(ty: Ty | undefined): Ty | undefined {
  return ty?.k === "optional" ? ty.of : ty;
}

function elemOf(ty: Ty | undefined): Ty | undefined {
  const t = unopt(ty);
  return t?.k === "array" || t?.k === "map" || t?.k === "jsmap" || t?.k === "jsset" ? t.of : undefined;
}

function isFnTy(ty: Ty | undefined): boolean {
  return unopt(ty)?.k === "fn";
}

/** A value made only of a function's own parameters (a constructor's: its arguments stand for them at each `new`). */
function fromParams(d: Desc, fn: FnRec): boolean {
  if (d.k === "param") return d.fn === fn;
  if (d.k === "fresh" && !d.self.size && !d.cls && !d.cond) return d.parts.every((p) => fromParams(p, fn)) && (!d.of || fromParams(d.of, fn));
  if (d.k === "fresh" && d.of?.k === "param" && d.of.fn === fn && !d.parts.length) return true;
  return false;
}

/** A literal that is a new value each time it runs (a default parameter's). */
/** Whether `value` is read from `obj`'s own fields or elements (`this.source`, `o.items[i]`): something `obj` already reaches. */
function ownPart(obj: Expr, value: Expr, getters: Set<string>): boolean {
  if (obj.e !== "id") return false;
  let v = value;
  let reads = 0;
  while (v.e === "unwrap" || v.e === "prop" || v.e === "index") {
    // A getter may return something its object doesn't hold.
    if (v.e === "prop" && getters.has(v.name)) return false;
    if (v.e !== "unwrap") reads++;
    v = v.e === "unwrap" ? v.x : v.obj;
  }
  return reads > 0 && v.e === "id" && v.name === obj.name;
}

function isFreshLiteral(x: Expr): boolean {
  return ["arr", "dict", "nil", "int", "double", "str", "bool"].includes(x.e) && (x.e !== "arr" || !x.items.length) && (x.e !== "dict" || !x.entries.length);
}

/** A receiver a call can read twice: a variable, or fields read from one. */
function pureReceiver(x: Expr): boolean {
  if (x.e === "id") return true;
  if (x.e === "unwrap") return pureReceiver(x.x);
  return x.e === "prop" && !x.optional && pureReceiver(x.obj);
}

/** Whether `node` assigns the variable `name` (anywhere, closures included). */
function assigns(node: unknown, name: string): boolean {
  if (Array.isArray(node)) return node.some((n) => assigns(n, name));
  if (!node || typeof node !== "object") return false;
  const s = node as Stmt;
  if (s.s === "assign" && s.target.e === "id" && s.target.name === name) return true;
  return Object.values(node).some((v) => assigns(v, name));
}

/**
 * The innermost node around `inside` that declares `name` (a block with its `let`, a loop over it, a function or lambda
 * taking it): where every assignment to that variable is. The whole tree when none does (a global).
 */
function declaringScope(root: unknown, inside: unknown, name: string): unknown {
  const path: unknown[] = [];
  const find = (node: unknown): boolean => {
    if (node === inside) return true;
    if (!node || typeof node !== "object") return false;
    path.push(node);
    if ((Array.isArray(node) ? node : Object.values(node)).some(find)) return true;
    path.pop();
    return false;
  };
  if (!find(root)) return root;
  const takes = (params: unknown) => Array.isArray(params) && params.some((p: { name?: string }) => p?.name === name);
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i];
    if (Array.isArray(n)) {
      if (n.some((s: Stmt) => s?.s === "let" && s.name === name)) return n;
      continue;
    }
    const x = n as { s?: string; name?: string; params?: unknown; decl?: { params?: unknown } };
    if (((x.s === "forOf" || x.s === "forRange") && x.name === name) || takes(x.params) || takes(x.decl?.params)) return n;
  }
  return root;
}

/** Whether `node` declares `name` (a let, a parameter, a loop variable, a local function). */
function declares(node: unknown, name: string): boolean {
  if (Array.isArray(node)) return node.some((n) => declares(n, name));
  if (!node || typeof node !== "object") return false;
  const s = node as Stmt & Expr;
  if ((s.s === "let" || s.s === "forOf" || s.s === "forRange") && s.name === name) return true;
  if (s.e === "lambda" && s.params.some((p) => p.name === name)) return true;
  if (s.s === "fn" && (s.decl.name === name || s.decl.params.some((p) => p.name === name))) return true;
  return Object.values(node).some((v) => declares(v, name));
}

/** Replaces the identifier `from` with `to` under `node`, in place. */
function replaceId(node: unknown, from: string, to: string) {
  if (Array.isArray(node)) return node.forEach((n) => replaceId(n, from, to));
  if (!node || typeof node !== "object") return;
  const x = node as { e?: string; name?: string };
  if (x.e === "id" && x.name === from) x.name = to;
  else Object.values(node).forEach((v) => replaceId(v, from, to));
}

/** The statement's direct values: what it stores, passes or returns as it is. */
function directValues(s: Stmt): Expr[] {
  const args = (x: Expr | undefined): Expr[] => {
    if (!x) return [];
    if (x.e === "call" || x.e === "construct" || x.e === "invoke") return x.args;
    if (x.e === "op" && INSERT_OPS.has(x.op)) return x.args.slice(1);
    if (x.e === "new") return x.args.map(([, v]) => v);
    if (x.e === "arr") return x.items;
    return [];
  };
  if (s.s === "assign" && s.op === "=") return [s.value, ...args(s.value)];
  if (s.s === "expr") return args(s.x);
  if (s.s === "let") return s.init ? args(s.init) : [];
  if (s.s === "return") return s.x ? [s.x, ...args(s.x)] : [];
  return [];
}

/** A statement whose only use of `name` is storing, passing or returning it as it is (`this.next = link`, `add(child)`). */
function isDirectStore(s: Stmt, name: string): boolean {
  return countMentions(s, name) === 1 && directValues(s).some((x) => x.e === "id" && x.name === name);
}

function countMentions(node: unknown, name: string): number {
  if (Array.isArray(node)) return node.reduce((n, c) => n + countMentions(c, name), 0);
  if (!node || typeof node !== "object") return 0;
  const x = node as Expr;
  if (x.e === "id" && x.name === name) return 1;
  return Object.values(node).reduce((n: number, v) => n + countMentions(v, name), 0);
}

/** Whether the identifier `name` appears under `node`. */
function mentions(node: unknown, name: string): boolean {
  return countMentions(node, name) > 0;
}

/**
 * For the printers: how a value of class or interface `name` is reported to the cycle collector (rule 6): "node" (a
 * tracked class), "obj" (an interface some tracked class implements: checked at run time), or undefined (never tracked).
 */
export function gcLeaf(program: Program): (name: string) => "node" | "obj" | undefined {
  const tracked = new Set([...program.classes, ...(program.objectClasses ?? [])].filter((c) => c.gc).map((c) => c.name));
  const protocols = new Map((program.protocols ?? []).map((p) => [p.name, p]));
  const objects = new Map((program.objectClasses ?? []).map((c) => [c.name, c]));
  const implemented = new Set<string>();
  const addProtocol = (p: string) => {
    if (implemented.has(p)) return;
    implemented.add(p);
    for (const b of protocols.get(p)?.bases ?? []) addProtocol(b);
  };
  for (const c of program.classes) if (c.gc) (c.protocols ?? []).forEach(addProtocol);
  for (const c of program.objectClasses ?? []) {
    if (!c.gc) continue;
    for (let k: ObjectClassDecl | undefined = c; k; k = k.base ? objects.get(k.base) : undefined) k.protocols.forEach(addProtocol);
  }
  return (name) => (tracked.has(name) ? "node" : implemented.has(name) ? "obj" : undefined);
}

/** Whether the collector walks a value of type `ty` to a tracked object (objects, optionals, arrays, records, Maps, Sets). */
export function gcWalks(leaf: (name: string) => "node" | "obj" | undefined, ty: Ty): boolean {
  switch (ty.k) {
    case "class":
      return !!leaf(ty.name);
    case "optional": case "array": case "map":
      return gcWalks(leaf, ty.of);
    case "jsmap":
      return !ty.weak && (gcWalks(leaf, ty.key) || gcWalks(leaf, ty.of));
    case "jsset":
      return !ty.weak && !ty.ref && gcWalks(leaf, ty.of);
    default:
      return false;
  }
}
