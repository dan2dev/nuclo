/** IR → Swift 5.9+ for UIKit, against src/runtimes/ios/NucloRuntime.swift. */
import type { ClassDecl, Expr, FnDecl, MethodDecl, ObjectClassDecl, Op, Program, ProtocolDecl, Stmt, Ty, UnionDecl } from "./ir.ts";
import { gcLeaf, gcWalks } from "./cycles.ts";
import { INDENT, Printer, canThrow } from "./printer.ts";

/** The cycle collector's write barrier on a tracked field (NucloRuntime.swift `jsGcBarrier`): `v` is the old value. */
const GC_BARRIER = (v: string) => `if JsGc.marking { jsGcBarrier(${v}) }`;
const KEYWORDS = new Set([
  "associatedtype", "class", "deinit", "enum", "extension", "fileprivate", "func", "import", "init", "inout", "internal", "let", "open",
  "operator", "private", "protocol", "public", "rethrows", "static", "struct", "subscript", "typealias", "var", "break", "case", "continue",
  "default", "defer", "do", "else", "fallthrough", "for", "guard", "if", "in", "repeat", "return", "switch", "where", "while", "as", "Any",
  "catch", "false", "is", "nil", "super", "self", "Self", "throw", "throws", "true", "try",
]);

const RUNTIME_NAMES: Record<string, string> = {
  log: "consoleLog",
  Router: "NRouter",
  Route: "NRoute",
  Tab: "NTab",
};

const RUNTIME_TYPES: Record<string, string> = {
  Timer: "NTimer",
  Frame: "NFrame",
  Router: "NRouter",
  Outlet: "NRouter",
  Response: "NResponse",
  Error: "Error",
  BigInt: "JsBigInt",
  Symbol: "JsSymbol",
  Date: "JsDate",
};

export function emitSwift(program: Program): string {
  return new SwiftPrinter().print(program);
}

class SwiftPrinter extends Printer {
  protected readonly keywords = KEYWORDS;
  protected override readonly noTrailingComma = true;

  /** How the cycle collector sees a class or interface (cycles.ts rule 6). */
  private gcLeaf: (name: string) => "node" | "obj" | undefined = () => undefined;

  print(program: Program): string {
    this.gcLeaf = gcLeaf(program);
    const out = [this.header(program, "//"), "#if canImport(UIKit)", "import UIKit", "#else", "import AppKit", "#endif", ""];
    for (const cls of program.classes) out.push(...this.classDecl(cls), "");
    for (const u of program.unions ?? []) out.push(...this.unionDecl(u), "");
    for (const p of program.protocols ?? []) out.push(...this.protocolDecl(p), "");
    for (const cls of program.objectClasses ?? []) out.push(...this.objectClassDecl(cls, program.objectClasses!), "");
    for (const g of program.globals) out.push(...this.stmt(g, "").map((l) => `@MainActor ${l}`));
    if (program.globals.length) out.push("");
    for (const fn of program.functions) out.push(...this.fn(fn), "");
    for (const j of program.jsonClasses ?? []) out.push(...this.jsonWriter(j, program), "");
    // The microtasks the top level queued run when it is done, before any timer (as after a script in JavaScript).
    out.push("@MainActor func nucloMain() {", ...this.block(program.main, INDENT), `${INDENT}jsDrainMicrotasks()`, "}", "");
    out.push("@main", "final class AppDelegate: NucloAppDelegate {", `${INDENT}override func start() {`, `${INDENT}${INDENT}nucloMain()`, `${INDENT}}`, "}", "");
    return out.join("\n");
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    const supers = [...(cls.protocols ?? []), ...(cls.gc ? ["JsGcNode"] : [])];
    const lines = [`@MainActor final class ${cls.name}${supers.length ? `: ${supers.join(", ")}` : ""} {`];
    for (const f of cls.fields) {
      const [name, ty] = [this.name(f.name), this.ty(f.ty)];
      // A field the collector clears is variable; one with no nil, behind optional storage.
      // A tracked field's store reports what it overwrites while the incremental collector marks (the write barrier).
      const gc = !!cls.gc?.includes(f.name);
      if (gc && f.ty.k === "class") lines.push(`${i1}private var ${f.name}__: (${ty})!`, `${i1}var ${name}: ${ty} { get { ${f.name}__ } set { ${GC_BARRIER(`${f.name}__`)}; ${f.name}__ = newValue } }`);
      else lines.push(`${i1}${f.readonly && !gc ? "let" : "var"} ${name}: ${ty}${gc ? ` { willSet { ${GC_BARRIER(name)} } }` : ""}`);
    }
    if (cls.gc) lines.push(`${i1}nonisolated(unsafe) var gcIndex = -1`);
    lines.push("");
    // a stored closure parameter must be @escaping (an optional one already is)
    const params = cls.fields.map((f) => `${this.name(f.name)}: ${f.ty.k === "fn" && !f.optional ? "@escaping " : ""}${this.ty(f.ty)}${f.optional ? " = nil" : ""}`).join(", ");
    lines.push(`${i1}init(${params}) {`);
    for (const f of cls.fields) lines.push(`${i2}self.${this.name(f.name)} = ${this.name(f.name)}`);
    if (cls.gc) lines.push(`${i2}gcIndex = jsGcTrack(self)`);
    lines.push(`${i1}}`);
    if (cls.gc) lines.push(...this.gcMembers(cls.fields.filter((f) => cls.gc!.includes(f.name)).map((f) => ({ ...f, storage: f.ty.k === "class" })), true));
    if (cls.decodable) {
      lines.push("", `${i1}static func decode(_ json: Any?) throws -> ${cls.name} {`, `${i2}let object = try NJSON.object(json)`);
      const args = cls.fields.map((f) => `${this.name(f.name)}: ${this.decode(f.ty, `object["${f.name}"]`, 0)}`);
      lines.push(`${i2}return ${cls.name}(`, ...args.map((a, i) => `${i2}${INDENT}${a}${i < args.length - 1 ? "," : ""}`), `${i2})`, `${i1}}`);
    }
    lines.push("}");
    return lines;
  }

  /** A union: an enum with a case per member (no allocation for a primitive one), a tag test and a checked read each. */
  private unionDecl(u: UnionDecl): string[] {
    const lines = [`enum ${u.name} {`];
    for (const m of u.members) lines.push(`${INDENT}case ${m.tag}${m.ty.k === "void" ? "" : `(${this.ty(m.ty)})`}`);
    for (const m of u.members) {
      lines.push(`${INDENT}var is_${m.tag}: Bool { if case .${m.tag} = self { return true }; return false }`);
      if (m.ty.k !== "void") lines.push(`${INDENT}var as_${m.tag}: ${this.ty(m.ty)} { if case .${m.tag}(let v) = self { return v }; fatalError("not ${m.tag}") }`);
    }
    lines.push("}");
    return lines;
  }

  private protocolDecl(p: ProtocolDecl): string[] {
    const lines = [`@MainActor protocol ${p.name}: ${p.bases.length ? p.bases.join(", ") : "AnyObject"} {`];
    for (const f of p.fields) lines.push(`${INDENT}var ${this.name(f.name)}: ${this.ty(f.ty)} { get${f.readonly ? "" : " set"} }`);
    for (const m of p.methods) lines.push(`${INDENT}${this.signature(m.name, m.params, m.ret, "", m.throws)}`);
    lines.push("}");
    return lines;
  }

  private signature(name: string, params: FnDecl["params"], ret: Ty, ind = "", throws = false): string {
    const ps = params.map((p) => `_ ${this.name(p.name)}: ${p.ty.k === "fn" ? "@escaping " : ""}${this.ty(p.ty)}${p.default ? ` = ${this.expr(p.default, ind)}` : ""}`).join(", ");
    return `func ${this.name(name)}(${ps})${throws ? " throws" : ""}${ret.k === "void" ? "" : ` -> ${this.ty(ret)}`}`;
  }

  /** `try ` before an expression that can throw: one covers all of it (operators and autoclosures included). */
  private tried(x: Expr | undefined): string {
    return canThrow(x) ? "try " : "";
  }

  /** A getter or setter that can throw is a pair of methods (a Swift setter can't throw): `get__x()`, `set__x(_:)`. */
  protected override expr(x: Expr, ind: string): string {
    if (x.e === "prop" && x.throws) return `${x.sup ? "super" : this.postfixOperand(x.obj, ind)}.get__${x.name}()`;
    if (x.e === "bin" && x.text) return `${x.op === "!=" ? "!" : ""}jsStrEq(${this.expr(x.l, ind)}, ${this.expr(x.r, ind)})`;
    if (x.e === "op") {
      if (x.op === "mc.new" || x.op === "mc.call") return this.mapSetOp(x.op, x.args, x.ty, ind);
      const promise = this.promiseOp(x, ind);
      if (promise !== undefined) return promise;
    }
    return super.expr(x, ind);
  }

  /**
   * A class. Fields start at a zero value (or `T!` when their type has none) and the initializer
   * sets them in JavaScript's order: Swift's rule that every field is set before `super.init` and
   * before `self` is used would otherwise reorder the constructor.
   */
  private objectClassDecl(cls: ObjectClassDecl, all: ObjectClassDecl[]): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    const supers = [...(cls.base ? [cls.base] : []), ...cls.protocols, ...(cls.gc && !cls.base ? ["JsGcNode"] : [])];
    // A value class (values.ts): a struct, no allocation or reference counting.
    const lines = [`@MainActor ${cls.value ? "struct" : `${cls.open ? "" : "final "}class`} ${cls.name}${supers.length ? `: ${supers.join(", ")}` : ""} {`];
    for (const f of cls.fields) {
      const zero = f.init ? this.expr(f.init, i1) : this.zero(f.ty);
      const [name, ty] = [this.name(f.name), this.ty(f.ty)];
      const gc = !!cls.gc?.includes(f.name);
      if (zero !== undefined) lines.push(`${i1}${f.weak ? "weak " : ""}var ${name}: ${ty} = ${zero}${gc ? ` { willSet { ${GC_BARRIER(name)} } }` : ""}`);
      // No zero value: unset storage behind a property of the field's own type (what a protocol requires, and what `let x = o.f` infers).
      else lines.push(`${i1}private var ${f.name}__: (${ty})!`, `${i1}var ${name}: ${ty} { get { ${f.name}__ } set { ${gc ? `${GC_BARRIER(`${f.name}__`)}; ` : ""}${f.name}__ = newValue } }`);
    }
    if (cls.gc && !cls.base) lines.push(`${i1}nonisolated(unsafe) var gcIndex = -1`);
    if (cls.fields.length || cls.gc) lines.push("");
    // `override init` when the base has an initializer with the same parameter types.
    const base = all.find((b) => b.name === cls.base);
    const same = !!base && base.ctor.params.length === cls.ctor.params.length && base.ctor.params.every((p, i) => this.ty(p.ty) === this.ty(cls.ctor.params[i]!.ty));
    const params = cls.ctor.params.map((p) => `_ ${this.name(p.name)}: ${p.ty.k === "fn" ? "@escaping " : ""}${this.ty(p.ty)}${p.default ? ` = ${this.expr(p.default, i1)}` : ""}`).join(", ");
    // Every constructor of a hierarchy throws when one does (the front-end's families): `override` stays valid.
    const throws = cls.ctor.throws ? " throws" : "";
    lines.push(`${i1}${same ? "override " : ""}init(${params})${throws} {`);
    if (cls.ctor.superArgs) lines.push(`${i2}${throws || canThrow(cls.ctor.superArgs) ? "try " : ""}${this.call("super.init", cls.ctor.superArgs, [], i2, (l) => `${l}: `)}`);
    // A tracked hierarchy's root registers each object (its fields all have a value already).
    if (cls.gc && !cls.base) lines.push(`${i2}gcIndex = jsGcTrack(self)`);
    lines.push(...this.block(cls.ctor.body, i2), `${i1}}`);
    if (cls.gc) {
      const fields = cls.fields.filter((f) => cls.gc!.includes(f.name)).map((f) => ({ ...f, storage: !f.init && this.zero(f.ty) === undefined }));
      lines.push(...this.gcMembers(fields, !cls.base));
    }
    // A setter is printed with its getter: one computed property.
    for (const m of cls.methods) if (!m.setter) lines.push("", ...this.method(m, cls.methods.find((s) => s.setter && s.name === m.name)));
    lines.push("}");
    return lines;
  }

  private method(m: MethodDecl, setter?: MethodDecl): string[] {
    const i1 = INDENT;
    const abstract = (at: string) => [`${at}fatalError("${m.name} is abstract")`];
    const body = m.abstract ? abstract(i1 + i1) : this.block(m.body, i1 + i1);
    const override = m.overrides ? "override " : "";
    if (m.getter && (m.throws || setter?.throws)) {
      const lines = [`${i1}${override}${this.signature(`get__${m.name}`, [], m.ret, i1, true)} {`, ...body, `${i1}}`];
      const set = setter && (setter.abstract ? abstract(i1 + i1) : this.block(setter.body, i1 + i1));
      return setter ? [...lines, "", `${i1}${override}${this.signature(`set__${m.name}`, setter.params, setter.ret, i1, true)} {`, ...set!, `${i1}}`] : lines;
    }
    if (m.getter && setter) {
      const [i3, value] = [i1 + i1 + i1, this.name(setter.params[0]!.name)];
      return [
        `${i1}${override}var ${this.name(m.name)}: ${this.ty(m.ret)} {`,
        `${i1}${i1}get {`, ...(m.abstract ? abstract(i3) : this.block(m.body, i3)), `${i1}${i1}}`,
        `${i1}${i1}set(${value}) {`, ...(setter.abstract ? abstract(i3) : this.block(setter.body, i3)), `${i1}${i1}}`,
        `${i1}}`,
      ];
    }
    if (m.getter) return [`${i1}${override}var ${this.name(m.name)}: ${this.ty(m.ret)} {`, ...body, `${i1}}`];
    const attrs = m.ret.k === "void" ? "" : "@discardableResult ";
    return [`${i1}${attrs}${override}${this.signature(m.name, m.params, m.ret, i1, m.throws)} {`, ...body, `${i1}}`];
  }

  /**
   * A tracked class's members for the cycle collector (cycles.ts rule 6): leaving the registry, reporting the tracked
   * objects its fields hold, dropping them. `storage`: the field is read and cleared through its `name__` storage.
   */
  private gcMembers(fields: { name: string; ty: Ty; storage: boolean }[], root: boolean): string[] {
    const [i1, i2] = [INDENT, INDENT + INDENT];
    const read = (f: { name: string; storage: boolean }) => (f.storage ? `${f.name}__` : this.name(f.name));
    const over = root ? "" : "override ";
    return [
      ...(root ? ["", `${i1}deinit { jsGcUntrack(gcIndex) }`] : []),
      "",
      `${i1}${over}func gcTraverse(_ s: JsGcScan) {`,
      ...(root ? [] : [`${i2}super.gcTraverse(s)`]),
      ...fields.map((f) => `${i2}${this.gcVisit(f.ty, read(f), 0)}`),
      `${i1}}`,
      "",
      `${i1}${over}func gcClear() {`,
      ...(root ? [] : [`${i2}super.gcClear()`]),
      ...fields.map((f) => `${i2}${read(f)} = ${f.storage || f.ty.k === "optional" ? "nil" : `${this.ty(f.ty)}()`}`),
      `${i1}}`,
    ];
  }

  /** A statement reporting `v` (a `ty`) to the scan `s`: the tracked objects in it, through optionals and containers. */
  private gcVisit(ty: Ty, v: string, d: number): string {
    const e = `e${d}`;
    const inner = (t: Ty, x: string) => (gcWalks(this.gcLeaf, t) ? this.gcVisit(t, x, d + 1) : "");
    switch (ty.k) {
      case "class":
        return `s.${this.gcLeaf(ty.name)}(${v})`;
      case "optional":
        return this.gcVisit(ty.of, v, d);
      case "array":
        return `s.arr(${v}) { s, ${e} in ${inner(ty.of, e)} }`;
      case "map":
        return `s.map(${v}) { s, ${e} in ${inner(ty.of, e)} }`;
      case "jsmap":
        return `s.omap(${v}) { s, k${d}, ${e} in ${[inner(ty.key, `k${d}`), inner(ty.of, e)].filter(Boolean).join("; ")} }`;
      case "jsset":
        return `s.omap(${v}) { s, ${e}, _ in ${inner(ty.of, e)} }`;
      default:
        return "";
    }
  }

  /** The value a field holds until the constructor sets it; undefined when its type has none. */
  private zero(t: Ty): string | undefined {
    switch (t.k) {
      case "int":
      case "num":
        return "0";
      case "double":
        return "0.0";
      case "string":
        return '""';
      case "bool":
        return "false";
      case "optional":
        return "nil";
      case "array":
        return "[]";
      case "map":
        return "[:]";
      case "jsmap":
      case "jsset":
        return `${this.ty(t)}()`;
      default:
        return undefined;
    }
  }

  /** `jsonw__Name(o, v)`: JSON.stringify of a class (its fields in JavaScript's key order) or a union (its member's). */
  private jsonWriter(j: NonNullable<Program["jsonClasses"]>[number], program: Program): string[] {
    const [i1, i2] = [INDENT, INDENT + INDENT];
    const lines = [`@MainActor func jsonw__${j.name}(_ o: NJSONOut, _ v: ${this.ty({ k: j.fields ? "class" : "union", name: j.name } as Ty)}) {`];
    if (!j.fields) {
      lines.push(`${i1}switch v {`);
      for (const m of program.unions!.find((u) => u.name === j.name)!.members) {
        lines.push(m.ty.k === "void" ? `${i1}case .${m.tag}: o.null()` : `${i1}case .${m.tag}(let x): ${this.jsonEnc(m.ty, "x", 0)}`);
      }
      return [...lines, `${i1}}`, "}"];
    }
    lines.push(`${i1}o.obj {`);
    for (const f of j.fields) {
      const read = `v.${this.name(f.name)}`;
      if (f.ty.k !== "optional") lines.push(`${i2}o.key(${this.str(f.name)}); ${this.jsonEnc(f.ty, read, 0)}`);
      else if (f.nil) lines.push(`${i2}o.key(${this.str(f.name)}); ${this.jsonEnc(f.ty, read, 0)}`);
      else lines.push(`${i2}o.field(${this.str(f.name)}, ${read}) { x0 in ${this.jsonEnc(f.ty.of, "x0", 1)} }`);
    }
    return [...lines, `${i1}}`, "}"];
  }

  /** A statement writing `v` (a `ty`) into the NJSONOut `o`. */
  private jsonEnc(ty: Ty, v: string, d: number): string {
    const x = `x${d}`;
    switch (ty.k) {
      case "string":
        return `o.str(${v})`;
      case "int":
      case "double":
        return `o.num(${v})`;
      case "num":
        return `o.num(Double(${v}))`;
      case "bool":
        return `o.bool(${v})`;
      case "class":
      case "union":
        return `jsonw__${ty.name}(o, ${v})`;
      case "array":
        return `o.arr(${v}) { ${x} in ${this.jsonEnc(ty.of, x, d + 1)} }`;
      case "map":
        return `o.map(${v}) { ${x} in ${this.jsonEnc(ty.of, x, d + 1)} }`;
      case "optional":
        return `o.opt(${v}) { ${x} in ${this.jsonEnc(ty.of, x, d + 1)} }`;
      default:
        return `o.date(${v})`;
    }
  }

  /** JSON.parse / JSON.stringify and Date (`JsDate` in the runtime). */
  private jsonDateOp(op: Op, args: Expr[], ind: string): string | undefined {
    const [a, b, ...rest] = args;
    const e = (x: Expr) => this.expr(x, ind);
    const what = (x: Expr | undefined) => (x as Extract<Expr, { e: "str" }>).v;
    switch (op) {
      case "json.parse":
        return `jsJsonDecode(${e(a!)}, ${e(b!)})`;
      case "json.stringify":
        return `jsJsonStringify(${e(a!)}, ${e(b!)}) { o, v in ${this.jsonEnc((rest[0] as Extract<Expr, { e: "decoder" }>).ty, "v", 0)} }`;
      case "json.gap":
        return `jsJsonGap(${e(b!)})`;
      case "date.utc":
        return `jsDateUTC([${args.map(e).join(", ")}])`;
      case "date.parse":
        return `jsDateParse(${e(a!)})`;
      case "date.new": {
        const form = what(a);
        if (form === "now") return "JsDate.now()";
        if (form === "parts") return `JsDate.parts([${[b!, ...rest].map(e).join(", ")}])`;
        if (form === "copy") return `JsDate(${this.postfixOperand(b!, ind)}.t)`;
        return form === "str" ? `JsDate(jsDateParse(${e(b!)}))` : `JsDate(${e(b!)})`;
      }
      case "date.call": {
        const d = this.postfixOperand(a!, ind);
        const [kind, field, local] = what(b).split(" ");
        if (kind === "get") return `${d}.get(${field}, ${local === "1"})`;
        if (kind === "set") return `${d}.set(${field}, ${local === "1"}, [${rest.map(e).join(", ")}])`;
        const calls: Record<string, string> = { time: "t", setTime: `setTime(${rest.map(e).join("")})`, tzOffset: "timezoneOffset()", iso: "toISOString()", utc: "toUTCString()", dateString: "toDateString()" };
        return `${d}.${calls[kind!]}`;
      }
      default:
        return undefined;
    }
  }

  /** An expression decoding `value` (an `Any?` from jsJsonParse) into `ty`. */
  private decode(ty: Ty, value: string, depth: number): string {
    const v = `v${depth}`;
    switch (ty.k) {
      case "string":
        return `try NJSON.string(${value})`;
      case "int":
        return `try NJSON.int(${value})`;
      case "double":
        return `try NJSON.double(${value})`;
      case "bool":
        return `try NJSON.bool(${value})`;
      case "class":
        return `try ${ty.name}.decode(${value})`;
      case "array":
        return `try NJSON.array(${value}) { ${v} in ${this.decode(ty.of, v, depth + 1)} }`;
      case "optional":
        return `try NJSON.optional(${value}) { ${v} in ${this.decode(ty.of, v, depth + 1)} }`;
      case "map":
        return `try NJSON.map(${value}) { ${v} in ${this.decode(ty.of, v, depth + 1)} }`;
      default:
        return "nil";
    }
  }

  /** A function: top level (`@MainActor`), or local (nested, isolated like its parent). */
  private fn(fn: FnDecl, ind = "", local = false): string[] {
    // A closure parameter may be kept (a handler, a binding): it escapes.
    const params = fn.params.map((p) => `_ ${this.name(p.name)}: ${p.ty.k === "fn" ? "@escaping " : ""}${this.ty(p.ty)}${p.default ? ` = ${this.expr(p.default, ind)}` : ""}`).join(", ");
    const effects = fn.async ? " async throws" : fn.throws ? " throws" : "";
    const ret = fn.ret.k === "void" ? "" : ` -> ${this.ty(fn.ret)}`;
    // A local function in a closure (an async arrow's state machine) isn't isolated like it: say so.
    const attrs = local ? (fn.ret.k === "void" ? "@MainActor " : "@MainActor @discardableResult ") : fn.ret.k === "void" ? "@MainActor " : "@MainActor @discardableResult ";
    return [`${ind}${attrs}func ${this.name(fn.name)}(${params})${effects}${ret} {`, ...this.block(fn.body, ind + INDENT), `${ind}}`];
  }

  protected ty(t: Ty): string {
    switch (t.k) {
      case "num":
        return t.n === "Float32" ? "Float" : t.n;
      case "int":
        return "Int";
      case "double":
        return "Double";
      case "string":
        return "String";
      case "bool":
        return "Bool";
      case "void":
        return "Void";
      case "array":
        return `JsArray<${this.ty(t.of)}>`;
      case "map":
        return `JsMap<${this.ty(t.of)}>`;
      case "optional":
        return t.of.k === "fn" ? `(${this.ty(t.of)})?` : `${this.ty(t.of)}?`;
      case "class":
        return t.name;
      case "fn":
        // A function passed to a function may be stored (a listener), so it escapes.
        return `(${t.params.map((p) => (p.k === "fn" ? "@escaping " : "") + this.ty(p)).join(", ")})${t.throws ? " throws" : ""} -> ${this.ty(t.ret)}`;
      case "rt":
        return RUNTIME_TYPES[t.name] ?? t.name;
      case "union":
        return t.name;
      case "promise":
        return `JsPromise<${this.ty(t.of)}>`;
      case "settled":
        return `JsSettled<${this.ty(t.of)}>`;
      case "jsmap":
        return t.weak ? `JsWeakMap<${this.ty(t.key)}, ${this.ty(t.of)}>` : `JsOMap<${this.keyKind(t.key)}, ${this.ty(t.of)}>`;
      case "jsset":
        return t.ref ? `JsWeakRef<${this.ty(t.of)}>` : t.weak ? `JsWeakMap<${this.ty(t.of)}, Void>` : `JsOMap<${this.keyKind(t.of)}, Void>`;
    }
  }

  /** How a Map / Set key is hashed (NucloRuntime.swift `JsKeyKind`). */
  private keyKind(k: Ty): string {
    if (k.k === "double") return "JsNumK";
    if (k.k === "string") return "JsStrK";
    if (k.k === "int") return "JsIntK";
    if (k.k === "bool" || k.k === "rt") return `JsHashK<${this.ty(k)}>`;
    return `JsRefK<${this.ty(k)}>`;
  }

  /** Promises (NucloRuntime.swift `JsPromise`) and async functions' state machines (asyncLower.ts). */
  private promiseOp(x: Extract<Expr, { e: "op" }>, ind: string): string | undefined {
    const [a, b, c] = x.args;
    const e = (v: Expr) => this.expr(v, ind);
    const r = () => this.postfixOperand(a!, ind);
    const of = x.ty?.k === "promise" ? x.ty.of : undefined;
    const typed = (v: Expr): Expr => (v.e === "lambda" ? { ...v, typed: true } : v);
    const fn = (v: Expr) => this.expr(typed(v), ind);
    switch (x.op as string) {
      case "promise.new":
        return of?.k === "void" ? `JsPromise<Void>.createVoid ${e(a!)}` : `JsPromise<${this.ty(of!)}>.create ${e(a!)}`;
      case "promise.resolve":
        return `JsPromise<${this.ty(of!)}>.resolved(${a ? e(a) : "()"})`;
      case "promise.reject":
        return `JsPromise<${this.ty(of!)}>.rejected(${e(a!)})`;
      case "promise.then":
      case "promise.thenP":
      case "promise.catch":
      case "promise.catchP":
      case "promise.finally":
      case "promise.finallyP": {
        const name = { "promise.then": "then", "promise.thenP": "thenP", "promise.catch": "jsCatch", "promise.catchP": "jsCatchP", "promise.finally": "jsFinally", "promise.finallyP": "jsFinallyP" }[x.op as string]!;
        return `${r()}.${name}(${fn(b!)})`;
      }
      case "promise.then2":
      case "promise.then2P":
        return `${r()}.${x.op === "promise.then2" ? "then2" : "then2P"}(${fn(b!)}, ${fn(c!)})`;
      case "promise.all":
      case "promise.allSettled": {
        const t = x.ty?.k === "promise" && x.ty.of.k === "array" ? x.ty.of.of : undefined;
        const elem = t?.k === "settled" ? t.of : t;
        return `JsPromise<${this.ty(elem!)}>.${x.op === "promise.all" ? "all" : "allSettled"}(${e(a!)})`;
      }
      case "promise.race":
      case "promise.any":
        return `JsPromise<${this.ty(of!)}>.${x.op === "promise.race" ? "race" : "any"}(${e(a!)})`;
      case "promise.delay":
        return `jsDelay(${e(a!)})`;
      case "promise.native": {
        // The call's arguments are evaluated now (a capture list), as JavaScript evaluates them; the call runs in a task.
        const call = a!;
        const caps: string[] = [];
        const cap = (v: Expr): Expr => {
          if (v.e === "int" || v.e === "double" || v.e === "str" || v.e === "bool" || v.e === "nil" || v.e === "decoder" || v.e === "lambda") return v;
          // A literal keeps its type there (a map literal is a JsMap, not a Dictionary).
          const as = v.e === "dict" ? ` as JsMap<${this.ty(v.of)}>` : v.e === "arr" ? ` as JsArray<${this.ty(v.of)}>` : "";
          caps.push(`a__${caps.length} = ${this.expr(v, ind)}${as}`);
          return { e: "id", name: `a__${caps.length - 1}` };
        };
        let inner: Expr = call;
        if (call.e === "rt") inner = { ...call, args: call.args.map(cap), named: call.named?.map(([k, v]) => [k, cap(v)]) };
        else if (call.e === "method") inner = { ...call, obj: cap(call.obj), args: call.args.map(cap) };
        else if (call.e === "call") inner = { ...call, args: call.args.map(cap) };
        return `jsNative { ${caps.length ? `[${caps.join(", ")}] in ` : ""}${this.expr(inner, ind)} }`;
      }
      case "settled.status":
        return `${r()}.status`;
      case "settled.value":
        return `${r()}.value!`;
      case "settled.reason":
        return `${r()}.reason!`;
      case "error.new":
        return `NError(${e(a!)})`;
      // An object of an app's error class thrown (`throw new E()`): its name and message, and the object.
      case "error.wrap":
        return `NError(name: ${e(x.args[1]!)}, ${e(x.args[2]!)}, obj: ${e(a!)})`;
      case "error.obj":
        return `((${e(a!)} as? NError)?.obj as? ${(x.args[1] as { v: string }).v})`;
      case "error.name":
        return `((${e(a!)} as? NError)?.name ?? "Error")`;
      case "async.run":
        return `jsAsync ${fn(a!)}`;
      case "async.await":
        return `${r()}.awaitOn(${e(b!)}${c ? `, ${fn(c)}` : ""})`;
      case "async.check":
        return `${r()}.check()`;
      case "async.resolve":
        return `${r()}.resolve(${b ? e(b) : "()"})`;
      case "async.adopt":
        return `${r()}.adopt(${e(b!)})`;
      case "async.reject":
        return `${r()}.reject(${e(b!)})`;
    }
    return undefined;
  }

  protected str(v: string): string {
    return `"${this.escape(v)}"`;
  }

  private escape(v: string): string {
    // eslint-disable-next-line no-control-regex
    return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/[\u0000-\u001f\u007f]/g, (c) => `\\u{${c.charCodeAt(0).toString(16)}}`);
  }

  private awaited(s: string, awaited: boolean) {
    return awaited ? `try await ${s}` : s;
  }

  protected special(x: Expr, ind: string): string {
    switch (x.e) {
      case "nil":
        return "nil";
      case "tpl":
        // A single-line string literal: an interpolated expression the printer wrapped is put back on one line.
        return `"${x.parts.map((p) => (typeof p === "string" ? this.escape(p) : `\\(${oneLine(this.interpolated(p, ind))})`)).join("")}"`;
      case "id":
        return x.name === "this" ? "self" : this.name(x.name);
      case "construct":
        return this.call(x.cls, x.args, [], ind, (l) => `${l}: `);
      case "invoke":
        return this.call(`${x.sup ? "super" : this.postfixOperand(x.obj, ind)}.${this.name(x.name)}`, x.args, [], ind, (l) => `${l}: `);
      case "call":
        return this.awaited(this.call(this.postfixOperand(x.callee, ind), x.args, [], ind, (l) => `${l}: `), !!x.await);
      case "rt":
        return this.awaited(this.call(this.runtimeName(x.name), x.args, x.named ?? [], ind, (l) => `${l}: `), !!x.await);
      case "method":
        return this.awaited(this.call(`${this.postfixOperand(x.obj, ind)}.${this.name(x.name)}`, x.args, [], ind, (l) => `${l}: `), !!x.await);
      case "cond":
        return this.optionalChain(x, ind) ?? `${this.expr(x.c, ind)} ? ${this.expr(x.a, ind)} : ${this.expr(x.b, ind)}`;
      case "unwrap":
        return `${this.postfixOperand(x.x, ind)}!`;
      case "incr":
        return `${x.prefix ? "jsPreIncr" : "jsPostIncr"}(&${this.expr(x.target, ind)}, ${x.op === "+=" ? "" : "-"}${this.expr(x.one, ind)})`;
      case "seq": {
        const i2 = ind + INDENT;
        return `jsRun { () -> ${this.ty(x.ty)} in\n${x.body.flatMap((s) => this.stmt(s, i2)).join("\n")}\n${i2}return ${this.tried(x.x)}${this.expr(x.x, i2)}\n${ind}}`;
      }
      // A non-escaping closure: implicit `self` and captured variables work as in the expression around it.
      case "with":
        return `jsWith(${this.expr(x.init, ind)}) { (${this.name(x.name)}: ${this.ty(x.ty)}) in ${this.tried(x.body)}${this.expr(x.body, ind + INDENT)} }`;
      case "coalesce":
        // `??` groups to the right in Swift: a left coalesce (a flattened `T??`) keeps its own type.
        return `${x.l.e === "coalesce" || x.l.e === "cond" ? `(${this.expr(x.l, ind)})` : this.expr(x.l, ind)} ?? ${this.expr(x.r, ind)}`;
      case "toDouble":
        return `Double(${this.expr(x.x, ind)})`;
      case "toInt":
        return `Int(${this.expr(x.x, ind)})`;
      case "numCast":
        return `${this.ty(x.to)}(${this.expr(x.x, ind)})`;
      case "toStr":
        if (x.from.k === "rt") return `String(describing: ${this.expr(x.x, ind)})`;
        return x.from.k === "double" ? `jsNum(${this.expr(x.x, ind)})` : `String(${this.expr(x.x, ind)})`;
      case "new":
        return this.call(x.cls, [], x.args, ind, (l) => `${this.name(l)}: `);
      case "arr": {
        const items = x.items.map((i) => this.expr(i, ind + INDENT));
        if (items.some((i) => i.includes("\n")) || items.join(", ").length > 90) return `[\n${items.map((i) => ind + INDENT + i).join(",\n")},\n${ind}]`;
        return `[${items.join(", ")}]`;
      }
      case "dict": {
        if (!x.entries.length) return "[:]";
        const items = x.entries.map(([k, v]) => `${this.str(k)}: ${this.expr(v, ind + INDENT)}`);
        if (items.some((i) => i.includes("\n")) || items.join(", ").length > 90) return `[\n${items.map((i) => ind + INDENT + i).join(",\n")},\n${ind}]`;
        return `[${items.join(", ")}]`;
      }
      case "style": {
        const style = this.call("Style", [], x.props, ind, (l) => `${l}: `);
        return x.base ? `${this.postfixOperand(x.base, ind)}.merged(${style})` : style;
      }
      case "enum":
        // Against an optional parameter a bare `.none` is Optional's: the property would stay unset.
        return x.member === "none" ? `${x.type}.none` : `.${x.member}`;
      case "decoder":
        return `{ json in ${this.decode(x.ty, "json", 0)} }`;
      case "instanceOf":
        return `(${this.postfixOperand(x.x, ind)} is ${this.ty({ k: "class", name: x.cls })})`;
      case "downcast":
        return `(${this.postfixOperand(x.x, ind)} as! ${this.ty({ k: "class", name: x.cls })})`;
      case "uwrap":
        return x.ty.k === "void" ? `${x.u}.${x.tag}` : `${x.u}.${x.tag}(${this.expr(x.x, ind)})`;
      case "uis":
        return `${this.postfixOperand(x.x, ind)}.is_${x.tag}`;
      case "uget":
        return `${this.postfixOperand(x.x, ind)}.as_${x.tag}`;
      case "launch":
        return `Task { try await ${this.expr(x.call, ind)} }`;
      default:
        return `/* ${x.e} */`;
    }
  }

  /** Inside `\( )`: numbers and booleans interpolate as they are, Doubles the JavaScript way. */
  private interpolated(p: Expr, ind: string): string {
    if (p.e === "toStr") return p.from.k === "double" ? `jsNum(${this.expr(p.x, ind)})` : this.expr(p.x, ind);
    return this.expr(p, ind);
  }

  private runtimeName(name: string): string {
    return RUNTIME_NAMES[name] ?? name;
  }

  protected lambda(x: Extract<Expr, { e: "lambda" }>, ind: string): string {
    const names = this.paramNames(x.params, () => "_");
    const typed = x.typed ? ` (${names.map((n, i) => `${n}: ${this.ty(x.params[i]!.ty)}`).join(", ")}) in` : "";
    const head = typed || (names.length ? ` ${names.join(", ")} in` : "");
    if (!Array.isArray(x.body)) {
      const body = this.tried(x.body) + this.expr(x.body, ind + INDENT);
      if (!body.includes("\n") && body.length + ind.length < 90) return `{${head} ${body} }`;
      return `{${head}\n${ind + INDENT}${body}\n${ind}}`;
    }
    const lines = this.block(x.body, ind + INDENT);
    if (lines.length === 1 && !lines[0]!.trimStart().startsWith("return") && lines[0]!.length < 80) return `{${head} ${lines[0]!.trim()} }`;
    return `{${head}\n${lines.join("\n")}\n${ind}}`;
  }

  /**
   * `f?.(…)` / `o?.f(…)`, which the front-end gives as `x != nil ? x!… : nil`: Swift's own optional chaining (`f?(…)`,
   * `o?.f(…)`), which types without a context and lets a chain go on (`f?().jsLength ?? 0`).
   */
  private optionalChain(x: Extract<Expr, { e: "cond" }>, ind: string): string | undefined {
    if (x.b.e !== "nil" || x.c.e !== "bin" || x.c.op !== "!=" || x.c.r.e !== "nil" || x.a.e !== "call") return undefined;
    const tested = this.postfixOperand(x.c.l, ind);
    const call = this.expr(x.a, ind);
    return call.startsWith(`${tested}!`) ? `${tested}?${call.slice(tested.length + 1)}` : undefined;
  }

  protected override postfixOperand(x: Expr, ind: string): string {
    // A literal as a receiver has no type from its context: Swift would make it a Swift Array / Dictionary.
    if (x.e === "arr" || x.e === "dict") return `(${this.expr(x, ind)} as ${this.ty(x.e === "arr" ? { k: "array", of: x.of } : { k: "map", of: x.of })})`;
    return (x.e === "cond" && this.optionalChain(x, ind)) || super.postfixOperand(x, ind);
  }

  protected op(op: Op, args: Expr[], ind: string, awaited: boolean): string {
    const jsonDate = this.jsonDateOp(op, args, ind);
    if (jsonDate !== undefined) return jsonDate;
    const [a, b, c] = args;
    const r = () => this.postfixOperand(a!, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // A function passed by name (`xs.map(double)`) is an argument, not a trailing closure.
    const trailing = (x: Expr) => (x.e === "lambda" ? this.lambda(x, ind) : `(${this.expr(x, ind)})`);
    let s: string;
    switch (op) {
      case "arr.length":
        s = `${r()}.count`;
        break;
      case "str.length":
        s = `${r()}.jsLength`;
        break;
      case "arr.at":
        s = `${r()}.jsAt(${e(b!)})`;
        break;
      case "arr.push":
        s = `${r()}.append(${e(b!)})`;
        break;
      case "arr.pushAll":
        s = `${r()}.append(contentsOf: ${e(b!)})`;
        break;
      case "arr.pop":
        s = `${r()}.jsPop()`;
        break;
      case "arr.unshift":
        s = `${r()}.insert(${e(b!)}, at: 0)`;
        break;
      case "arr.pushLen":
        s = `${r()}.jsPush(${e(b!)})`;
        break;
      case "arr.pushAllLen":
        s = `${r()}.jsPush(contentsOf: ${e(b!)})`;
        break;
      case "arr.unshiftLen":
        s = `${r()}.jsUnshift(${e(b!)})`;
        break;
      case "arr.splice":
        s = `${r()}.jsSplice(${args.slice(1).map(e).join(", ")})`;
        break;
      case "arr.indexOf":
        s = `${r()}.jsIndexOf(${args.slice(1).map(e).join(", ")})`;
        break;
      case "arr.includes":
        s = `${r()}.jsIncludes(${args.slice(1).map(e).join(", ")})`;
        break;
      case "arr.fill":
      case "arr.copyWithin":
        s = `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}(${e(b!)}, ${e(c!)}, ${args[3] ? e(args[3]) : "nil"})`;
        break;
      case "arr.filled":
        s = `${this.ty({ k: "array", of: (a as Extract<Expr, { e: "arr" }>).of })}.jsFilled${args[3] ? "Checked" : ""}(${e(b!)}, ${e(c!)})`;
        break;
      case "arr.fromLength":
        s = `${this.ty({ k: "array", of: (a as Extract<Expr, { e: "arr" }>).of })}.jsFrom(length: ${e(b!)}) ${trailing(c!)}`;
        break;
      case "arr.flat":
        s = `${r()}.jsFlat()`;
        break;
      case "arr.reduceRight":
        s = `${r()}.jsReduceRight(${this.postfixOperand(c!, ind)}, ${e(b!)})`;
        break;
      case "arr.findLast":
      case "arr.findLastIndex":
        s = `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}(${e(b!)})`;
        break;
      case "arr.toSpliced":
        s = `${r()}.jsToSpliced(${args.slice(1).map(e).join(", ")})`;
        break;
      case "arr.with":
        s = args[3] ? `(try! ${r()}.jsWith(${e(b!)}, ${e(c!)}))` : `${r()}.jsWith(${e(b!)}, ${e(c!)})`;
        break;
      case "arr.find":
        s = `${r()}.first ${trailing(b!)}`;
        break;
      case "arr.findIndex":
        s = `(${r()}.firstIndex ${trailing(b!)} ?? -1)`;
        break;
      case "arr.filter":
        s = `${r()}.filter ${trailing(b!)}`;
        break;
      case "arr.map":
        s = `${r()}.map ${trailing(b!)}`;
        break;
      case "arr.some":
        s = `${r()}.contains ${trailing(b!)}`;
        break;
      case "arr.every":
        s = `${r()}.allSatisfy ${trailing(b!)}`;
        break;
      case "arr.forEach":
        s = `${r()}.forEach ${trailing(b!)}`;
        break;
      case "arr.join":
        s = `${r()}.joined(separator: ${e(b!)})`;
        break;
      case "arr.slice":
      case "str.slice":
        s = `${r()}.jsSlice(${e(b!)}, ${e(c!)})`;
        break;
      case "str.trim":
        s = `${r()}.jsTrim()`;
        break;
      case "str.upper":
        s = `${r()}.uppercased()`;
        break;
      case "str.lower":
        s = `${r()}.jsLower()`;
        break;
      case "str.includes":
        s = `${r()}.jsIncludes(${e(b!)})`;
        break;
      case "str.startsWith":
        s = `${r()}.jsStartsWith(${e(b!)})`;
        break;
      case "str.endsWith":
        s = `${r()}.jsEndsWith(${e(b!)})`;
        break;
      case "str.nonEmpty":
        s = `!${r()}.isEmpty`;
        break;
      case "str.or":
        s = `jsOr(${e(a!)}, ${e(b!)})`;
        break;
      case "num.toFixed":
        s = `jsFixed(${e(a!)}, ${e(b!)})`;
        break;
      case "math.floor":
        s = `Int(${r()}.rounded(.down))`;
        break;
      case "math.ceil":
        s = `Int(${r()}.rounded(.up))`;
        break;
      case "math.round":
        s = `jsRound(${e(a!)})`;
        break;
      case "math.trunc":
        s = `Int(${e(a!)})`;
        break;
      case "math.abs":
        s = `Swift.abs(${e(a!)})`;
        break;
      case "math.min":
      case "math.max":
        s = args.map(e).reduce((acc, next) => `js${op === "math.min" ? "Min" : "Max"}(${acc}, ${next})`);
        break;
      case "math.sqrt":
        s = `${r()}.squareRoot()`;
        break;
      case "math.pow":
        s = `jsPow(${e(a!)}, ${e(b!)})`;
        break;
      case "math.random":
        s = "Double.random(in: 0..<1)";
        break;
      case "math.pi":
        s = "Double.pi";
        break;
      case "map.get":
        s = `${r()}[${e(b!)}]`;
        break;
      case "date.now":
        s = "jsNow()";
        break;
      case "num.parse":
        s = `jsNumber(${e(a!)})`;
        break;
      case "int.parse":
        s = `jsParseInt(${e(a!)}, ${e(b!)})`;
        break;
      case "error.message":
        s = `jsErrorMessage(${e(a!)})`;
        break;
      case "error.text":
        s = `((${e(a!)} as? NError)?.message ?? ${this.postfixOperand(a!, ind)}.localizedDescription)`;
        break;
      case "arr.concat":
        s = `${r()}.jsConcat(${args.slice(1).map(e).join(", ")})`;
        break;
      // In place, giving the array itself (JsArray is a reference, as in JavaScript).
      case "arr.sort":
        s = `${r()}.jsSort(${e(b!)})`;
        break;
      case "arr.reverse":
        s = `${r()}.jsReverse()`;
        break;
      case "arr.shift":
        s = `${r()}.jsShift()`;
        break;
      case "arr.lastIndexOf":
        s = `${r()}.jsLastIndexOf(${args.slice(1).map(e).join(", ")})`;
        break;
      case "arr.atRel":
        s = `${r()}.jsAtRel(${e(b!)})`;
        break;
      case "arr.reduce":
        s = `${r()}.reduce(${this.postfixOperand(c!, ind)}, ${e(b!)})`;
        break;
      case "arr.mapI":
      case "arr.filterI":
      case "arr.forEachI":
      case "arr.someI":
      case "arr.everyI":
      case "arr.findI":
      case "arr.findIndexI":
        s = `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}(${e(b!)})`;
        break;
      case "map.delete":
        s = `${r()}.removeValue(forKey: ${e(b!)})`;
        break;
      case "map.has":
        s = `(${r()}[${e(b!)}] != nil)`;
        break;
      case "map.keys":
        s = `${r()}.jsKeys`;
        break;
      case "map.values":
        s = `${r()}.jsValues`;
        break;
      case "str.split":
        s = `${r()}.jsSplit(${e(b!)})`;
        break;
      case "str.replace":
      case "str.replaceAll":
        s = `${r()}.jsReplace(${e(b!)}, ${e(c!)}, all: ${op === "str.replaceAll"})`;
        break;
      case "str.indexOf":
        s = `${r()}.jsIndexOf(${e(b!)}, ${e(c!)})`;
        break;
      case "str.lastIndexOf":
        s = `${r()}.jsLastIndexOf(${e(b!)})`;
        break;
      case "str.padStart":
      case "str.padEnd":
        s = `${r()}.jsPad(${e(b!)}, ${e(c!)}, atStart: ${op === "str.padStart"})`;
        break;
      case "str.repeat":
        s = `${r()}.jsRepeat(${e(b!)})`;
        break;
      case "str.trimStart":
        s = `${r()}.jsTrimStart()`;
        break;
      case "str.trimEnd":
        s = `${r()}.jsTrimEnd()`;
        break;
      case "str.compare":
        s = `jsCompare(${e(a!)}, ${e(b!)})`;
        break;
      case "int.wideRem":
        s = `(${this.postfixOperand(a!, ind)} % ${this.postfixOperand(b!, ind)})`;
        break;
      case "math.fn":
        s = this.mathFn((a as Extract<Expr, { e: "str" }>).v, args.slice(1).map(e));
        break;
      case "bit.and":
      case "bit.or":
      case "bit.xor":
      case "bit.shl":
      case "bit.shr": {
        const sym = { "bit.and": "&", "bit.or": "|", "bit.xor": "^", "bit.shl": "&<<", "bit.shr": "&>>" }[op];
        s = `Int(jsI32(${e(a!)}) ${sym} jsI32(${e(b!)}))`;
        break;
      }
      case "bit.ushr":
        s = `Double(UInt32(bitPattern: jsI32(${e(a!)})) &>> UInt32(bitPattern: jsI32(${e(b!)})))`;
        break;
      case "bit.not":
        s = `Int(~jsI32(${e(a!)}))`;
        break;
      case "bit.imul":
        s = `Int(jsI32(${e(a!)}) &* jsI32(${e(b!)}))`;
        break;
      case "bit.clz32":
        s = `UInt32(bitPattern: jsI32(${e(a!)})).leadingZeroBitCount`;
        break;
      case "js.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v;
        const safe = name.endsWith("!");
        s = `${safe ? "try! " : ""}js${name[0]!.toUpperCase()}${name.slice(1).replace("!", "")}(${args.slice(1).map(e).join(", ")})`;
        break;
      }
      default:
        s = op.startsWith("ta.") ? this.typedArrayOp(op, args, ind) : this.bigOp(op, args, ind);
    }
    return this.awaited(s, awaited);
  }

  /** Typed arrays (`JsTypedArray<K>` in the runtime, its typealiases named as in JavaScript). */
  private typedArrayOp(op: Op, args: Expr[], ind: string): string {
    const [a, b, ...rest] = args;
    const name = (b as Extract<Expr, { e: "str" }>).v;
    if (op === "ta.new") {
      const form = (a as Extract<Expr, { e: "str" }>).v;
      return `${name}(${form === "len" ? "length" : form}: ${this.expr(rest[0]!, ind)})`;
    }
    if (op === "ta.prop") return `${this.postfixOperand(a!, ind)}.${name}`;
    return `${this.postfixOperand(a!, ind)}.${name}(${rest.map((x) => this.expr(x, ind)).join(", ")})`;
  }

  /** Map / Set (NucloRuntime.swift `JsOMap`): `mc.new` makes one, `mc.call` calls the named method. */
  private mapSetOp(op: Op, args: Expr[], ty: Ty | undefined, ind: string): string {
    if (op === "mc.new") return `${this.ty(ty!)}(${args.map((x) => this.expr(x, ind)).join(", ")})`;
    const [a, b, ...rest] = args;
    const arg = (x: Expr) => this.expr(x.e === "lambda" ? { ...x, typed: true } : x, ind);
    return `${this.postfixOperand(a!, ind)}.${(b as Extract<Expr, { e: "str" }>).v}(${rest.map(arg).join(", ")})`;
  }

  /** bigint and symbol operations (`JsBigInt`, `JsSymbol` in the runtime); a throwing one is a throwing function. */
  private bigOp(op: Op, args: Expr[], ind: string): string {
    const [a, b] = args;
    const p = (x: Expr) => this.postfixOperand(x, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // `/`, `%` and `**` by a literal the front-end checked can't throw; anything else is the throwing function.
    const throwing = !(b?.e === "op" && b.op === "big.lit");
    const infix: Partial<Record<Op, string>> = { "big.add": "+", "big.sub": "-", "big.mul": "*", "big.and": "&", "big.or": "|", "big.xor": "^", "big.shl": "<<", "big.shr": ">>" };
    if (infix[op]) return `(${p(a!)} ${infix[op]} ${p(b!)})`;
    switch (op) {
      case "big.lit": {
        const v = (a as Extract<Expr, { e: "str" }>).v;
        return BigInt(v) > 9223372036854775807n || BigInt(v) < -9223372036854775807n ? `JsBigInt(literal: "${v}")` : `JsBigInt(${v})`;
      }
      case "big.div":
      case "big.mod":
        return throwing ? `${op === "big.div" ? "jsBigDiv" : "jsBigMod"}(${e(a!)}, ${e(b!)})` : `(${p(a!)} ${op === "big.div" ? "/" : "%"} ${p(b!)})`;
      case "big.pow":
        return throwing ? `jsBigPow(${e(a!)}, ${e(b!)})` : `JsBigInt.pow(${e(a!)}, ${e(b!)})`;
      case "big.neg":
        return `(-${p(a!)})`;
      case "big.not":
        return `(~${p(a!)})`;
      case "big.from":
        return `JsBigInt(${e(a!)})`;
      case "big.fromDouble":
        return `jsBigFrom(${e(a!)})`;
      case "big.parse":
        return `jsBigParse(${e(a!)})`;
      case "big.toNumber":
        return `${p(a!)}.double`;
      case "big.str":
        return b!.e === "int" ? `${p(a!)}.toString(${b!.v})` : `jsBigToString(${e(a!)}, ${e(b!)})`;
      case "big.asIntN":
      case "big.asUintN":
        return `JsBigInt.${op.slice(4)}(${e(a!)}, ${e(b!)})`;
      case "sym.new":
        return `JsSymbol(${e(a!)})`;
      case "sym.description":
        return `${p(a!)}.desc`;
      default:
        return `/* ${op} */`;
    }
  }

  private mathFn(name: string, args: string[]): string {
    switch (name) {
      case "sign":
        return `jsSign(${args[0]})`;
      case "fround":
        return `Double(Float(${args[0]}))`;
      case "jsRound":
        return `jsRoundD(${args[0]})`;
      case "isInteger":
        return `jsIsInteger(${args[0]})`;
      case "isNaN":
        return `(${args[0]}).isNaN`;
      case "isFinite":
        return `(${args[0]}).isFinite`;
      case "Infinity":
        return "Double.infinity";
      case "NaN":
        return "Double.nan";
      default:
        return `Foundation.${name}(${args.join(", ")})`;
    }
  }

  /** A trailing closure can't appear bare in a statement condition. */
  private condition(c: Expr, ind: string): string {
    const s = this.tried(c) + this.expr(c, ind);
    return s.includes("{") ? `(${s})` : s;
  }

  protected stmt(s: Stmt, ind: string): string[] {
    const i2 = ind + INDENT;
    switch (s.s) {
      case "let": {
        const keyword = s.mutable ? "var" : "let";
        if (!s.init) return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)}${s.ty.k === "optional" ? " = nil" : ""}`];
        return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)} = ${this.tried(s.init)}${this.expr(s.init, ind)}`];
      }
      case "assign": {
        const t = s.target;
        if (t.e === "prop" && t.throws) {
          // A setter that can throw: `set__x(_:)`, given its getter's value for `+=`.
          const obj = t.sup ? "super" : this.postfixOperand(t.obj, ind);
          const value = s.op === "=" ? this.expr(s.value, ind) : `${obj}.get__${t.name}() ${s.op[0]} (${this.expr(s.value, ind)})`;
          return [`${ind}try ${obj}.set__${t.name}(${value})`];
        }
        if (canThrow(t)) return [`${ind}try ${this.expr(t, ind)} ${s.op} ${this.expr(s.value, ind)}`];
        return [`${ind}${this.expr(t, ind)} ${s.op} ${this.tried(s.value)}${this.expr(s.value, ind)}`];
      }
      case "expr":
        return [`${ind}${s.discard ? "_ = " : ""}${this.tried(s.x)}${this.expr(s.x, ind)}`];
      case "if": {
        const lines = [`${ind}if ${this.condition(s.c, ind)} {`, ...this.block(s.then, i2)];
        let rest = s.else;
        while (rest?.length === 1 && rest[0]!.s === "if") {
          const elif = rest[0] as Extract<Stmt, { s: "if" }>;
          lines.push(`${ind}} else if ${this.condition(elif.c, ind)} {`, ...this.block(elif.then, i2));
          rest = elif.else;
        }
        if (rest?.length) lines.push(`${ind}} else {`, ...this.block(rest, i2));
        lines.push(`${ind}}`);
        return lines;
      }
      case "forOf": {
        // A literal has no array type of its own here: typed, its nested arrays are JsArrays too (`for [a, b] of [["x", "y"]]`).
        const of = s.of.e === "arr" ? `(${this.expr(s.of, ind)} as ${this.ty({ k: "array", of: s.of.of })})` : this.expr(s.of, ind);
        return [`${ind}${s.label ? `${s.label}: ` : ""}for ${this.name(s.name)} in ${this.tried(s.of)}${of} {`, ...this.block(s.body, i2), `${ind}}`];
      }
      case "forRange":
        return [
          `${ind}${s.label ? `${s.label}: ` : ""}for ${this.name(s.name)} in ${this.tried({ e: "arr", of: { k: "int" }, items: [s.from, s.to] })}Swift.stride(from: ${this.expr(s.from, ind)}, ${s.inclusive ? "through" : "to"}: ${this.expr(s.to, ind)}, by: 1) {`,
          ...this.block(s.body, i2),
          `${ind}}`,
        ];
      case "while":
        return [`${ind}${s.label ? `${s.label}: ` : ""}while ${this.condition(s.c, ind)} {`, ...this.block(s.body, i2), `${ind}}`];
      case "return":
        return [s.x ? `${ind}return ${this.tried(s.x)}${this.expr(s.x, ind)}` : `${ind}return`];
      case "break":
        return [`${ind}break${s.label ? ` ${s.label}` : ""}`];
      case "continue":
        return [`${ind}continue${s.label ? ` ${s.label}` : ""}`];
      case "block":
        return [`${ind}${s.label}: do {`, ...this.block(s.body, i2), `${ind}}`];
      case "rethrow":
        return [`${ind}throw ${this.expr(s.error, ind)}`];
      case "try":
        // Swift has no `finally`: what leaves the blocks is recorded, and taken after the finally block.
        if (s.lowered) return this.block(s.lowered, ind);
        return [
          `${ind}do {`,
          ...this.block(s.body, i2),
          // Bound by name: Swift's implicit `error` would hide an app variable called `error`.
          `${ind}} catch ${s.catchName ? `let ${this.name(s.catchName)}` : "_"} {`,
          ...this.block(s.catchBody, i2),
          `${ind}}`,
        ];
      case "throw":
        return [`${ind}throw NError(${this.tried(s.message)}${this.expr(s.message, ind)})`];
      case "unreachable":
        return [`${ind}fatalError("unreachable")`];
      // A Swift global runs its initializer on first read: read here, in JavaScript's order.
      case "global":
        return [`${ind}_ = ${this.name(s.name)}`];
      case "fn":
        return this.fn(s.decl, ind, true);
      case "switch": {
        const lines = [`${ind}switch ${this.tried(s.x)}${this.expr(s.x, ind)} {`];
        for (const c of s.cases) {
          const test = s.text ? `let v__ where ${c.values.map((v) => `jsStrEq(v__, ${this.expr(v, ind)})`).join(" || ")}` : c.values.map((v) => this.expr(v, ind)).join(", ");
          lines.push(`${ind}case ${test}:`, ...(c.body.length ? this.block(c.body, i2) : [`${i2}break`]));
        }
        lines.push(`${ind}default:`, ...(s.default?.length ? this.block(s.default, i2) : [`${i2}break`]), `${ind}}`);
        return lines;
      }
    }
  }
}

/** Code the printer wrapped, on one line: statements of a closure body (`{ x in let a = … \n return a }`) get `;`. */
function oneLine(code: string): string {
  const pieces = code.split(/\n\s*/);
  return pieces.reduce((out, next) => out + (/[{(\[,]$|\bin$/.test(out) || /^[})\].]/.test(next) ? " " : "; ") + next);
}
