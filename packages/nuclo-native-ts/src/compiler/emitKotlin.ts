/** IR → Kotlin for Android Views, against src/runtimes/android/NucloRuntime.kt. */
import type { ClassDecl, Expr, FnDecl, MethodDecl, ObjectClassDecl, Op, Program, ProtocolDecl, Stmt, Ty, UnionDecl } from "./ir.ts";
import { INDENT, Printer } from "./printer.ts";

/** Sized numbers: Kotlin's own unsigned types keep the values (UByte.toInt() is 0…255). */
const KOTLIN_SIZED = { Int8: "Byte", Int16: "Short", Int32: "Int", Int64: "Long", UInt8: "UByte", UInt16: "UShort", UInt32: "UInt", Float32: "Float" } as const;

const KEYWORDS = new Set([
  "as", "break", "class", "continue", "do", "else", "false", "for", "fun", "if", "in", "interface", "is", "null", "object", "package",
  "return", "super", "this", "throw", "true", "try", "typealias", "typeof", "val", "var", "when", "while",
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
  Error: "Exception",
  BigInt: "JsBigInt",
  Symbol: "JsSymbol",
  Date: "JsDate",
};

export const KOTLIN_PACKAGE = "dev.nuclo.app";

/**
 * A function's string locals built by `s += x` inside a loop: a Kotlin String append copies the whole text (O(n²) for
 * the loop, where JavaScript's ropes are O(n)), so they become StringBuilders. Only when that can't cost more: the local
 * is declared once (a string, never a lambda's or nested function's), only ever `+=`'d (no `=`), and read (`toString()`)
 * nowhere inside a loop that appends to it.
 */
export function stringBuilders(body: Stmt[]): Set<string> {
  type Use = { loops: object[]; append: boolean; nested: boolean };
  const decls = new Map<string, { count: number; ok: boolean; loops: object[] }>();
  const uses = new Map<string, Use[]>();
  const use = (name: string, u: Use) => (uses.get(name) ?? uses.set(name, []).get(name)!).push(u);
  const walk = (node: unknown, loops: object[], nested: boolean): void => {
    if (Array.isArray(node)) return void node.forEach((n) => walk(n, loops, nested));
    if (!node || typeof node !== "object") return;
    const x = node as Record<string, unknown> & { s?: string; e?: string; name?: string };
    if (x.s === "let" && typeof x.name === "string") {
      const d = decls.get(x.name);
      const st = x as unknown as Extract<Stmt, { s: "let" }>;
      decls.set(x.name, { count: (d?.count ?? 0) + 1, ok: !nested && st.mutable && st.ty.k === "string", loops });
    }
    if (x.s === "assign" && (x.target as Expr).e === "id") {
      const t = x.target as Extract<Expr, { e: "id" }>;
      use(t.name, { loops, append: x.op === "+=", nested });
      if (x.op !== "+=") use(t.name, { loops, append: false, nested: true });
      return walk(x.value, loops, nested);
    }
    if (x.e === "id" && typeof x.name === "string") return void use(x.name, { loops, append: false, nested });
    const loop = x.s === "forOf" || x.s === "forRange" || x.s === "while" ? [...loops, x] : loops;
    const inner = nested || x.e === "lambda" || x.s === "fn";
    for (const [k, v] of Object.entries(x)) walk(v, k === "body" || k === "c" ? loop : loops, inner);
  };
  walk(body, [], false);
  const out = new Set<string>();
  for (const [name, d] of decls) {
    const us = uses.get(name) ?? [];
    if (d.count !== 1 || !d.ok || us.some((u) => u.nested)) continue;
    // Loops inside the declaration's scope that append to it.
    const appending = new Set(us.filter((u) => u.append).flatMap((u) => u.loops.filter((l) => !d.loops.includes(l))));
    if (appending.size && us.every((u) => u.append || !u.loops.some((l) => appending.has(l)))) out.add(name);
  }
  return out;
}

export function emitKotlin(program: Program): string {
  return new KotlinPrinter().print(program);
}

class KotlinPrinter extends Printer {
  protected readonly keywords = KEYWORDS;
  /** The class whose members are being printed: `this` is `this@Name` (a lambda inside a method may have a receiver of its own). */
  private self?: ObjectClassDecl;
  /** The globals `nucloMain` initializes in place. */
  private placed = new Map<string, Extract<Stmt, { s: "let" }>>();

  print(program: Program): string {
    const out = [
      this.header(program, "//"),
      '@file:Suppress("UNUSED_PARAMETER", "UNUSED_ANONYMOUS_PARAMETER", "RedundantExplicitType", "UNNECESSARY_NOT_NULL_ASSERTION")',
      "",
      `package ${KOTLIN_PACKAGE}`,
      "",
      "import dev.nuclo.runtime.*",
      "import kotlin.math.pow",
      "",
    ];
    for (const cls of program.classes) out.push(...this.classDecl(cls), "");
    for (const u of program.unions ?? []) out.push(...this.unionDecl(u), "");
    for (const p of program.protocols ?? []) out.push(...this.protocolDecl(p), "");
    for (const cls of program.objectClasses ?? []) out.push(...this.objectClassDecl(cls), "");
    // Fields, not properties: a property `count` would get a JVM setter named like a function `setCount`. A global
    // `nucloMain` initializes in place (JavaScript's order; Kotlin would run every initializer first, when the file's
    // class loads) starts at a zero value, or is a private `lateinit` (no accessors) when its type has none.
    this.placed = this.placedGlobals(program);
    for (const g of program.globals) {
      const zero = this.placed.has(g.name) ? this.zero(g.ty) : "";
      if (zero === undefined) out.push(`private lateinit var ${this.name(g.name)}: ${this.ty(g.ty)}`);
      else if (zero) out.push(`@JvmField var ${this.name(g.name)}: ${this.ty(g.ty)} = ${zero}`);
      else out.push(...this.stmt(g, "").map((line, at) => (at === 0 ? `@JvmField ${line}` : line)));
    }
    if (program.globals.length) out.push("");
    for (const fn of program.functions) out.push(...this.fn(fn), "");
    for (const j of program.jsonClasses ?? []) out.push(...this.jsonWriter(j, program), "");
    // The microtasks the top level queued run when it is done, before any timer (as after a script in JavaScript).
    out.push("fun nucloMain() {", ...this.block(program.main, INDENT), `${INDENT}jsDrainMicrotasks()`, "}", "");
    out.push("class MainActivity : NucloActivity({ nucloMain() })", "");
    return out.join("\n");
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    const fields = cls.fields.map((f) => `${i1}${f.implements ? "override " : ""}${f.readonly ? "val" : "var"} ${this.name(f.name)}: ${this.ty(f.ty)}${f.optional ? " = null" : ""},`);
    // The shape protocols it conforms to (interfaces).
    const supers = cls.protocols?.length ? ` : ${cls.protocols.join(", ")}` : "";
    const lines = [`class ${cls.name}(`, ...fields, `)${supers}`];
    if (cls.decodable) {
      lines[lines.length - 1] = `)${supers} {`;
      lines.push(
        `${i1}companion object {`,
        `${i2}fun fromJson(json: Any?): ${cls.name} {`,
        `${i2}${INDENT}val obj = NJSON.obj(json)`,
        `${i2}${INDENT}return ${cls.name}(`,
        ...cls.fields.map((f) => `${i2}${INDENT}${INDENT}${this.name(f.name)} = ${this.decode(f.ty, `obj["${f.name}"]`, 0)},`),
        `${i2}${INDENT})`,
        `${i2}}`,
        `${i1}}`,
        "}",
      );
    }
    return lines;
  }

  /** A union: a sealed class with a subclass per member (`object` for null), tested with `is`. */
  private unionDecl(u: UnionDecl): string[] {
    return [
      `sealed class ${u.name} {`,
      ...u.members.map((m) => (m.ty.k === "void" ? `${INDENT}object ${m.tag} : ${u.name}()` : `${INDENT}class ${m.tag}(@JvmField val v: ${this.ty(m.ty)}) : ${u.name}()`)),
      "}",
    ];
  }

  /** `jsonw__Name(o, v)`: JSON.stringify of a class (its fields in JavaScript's key order) or a union (its member's). */
  private jsonWriter(j: NonNullable<Program["jsonClasses"]>[number], program: Program): string[] {
    const [i1, i2] = [INDENT, INDENT + INDENT];
    const lines = [`fun jsonw__${j.name}(o: NJSONOut, v: ${j.name}) {`];
    if (!j.fields) {
      lines.push(`${i1}when (v) {`);
      for (const m of program.unions!.find((u) => u.name === j.name)!.members) {
        lines.push(`${i2}is ${j.name}.${m.tag} -> ${m.ty.k === "void" ? "o.nul()" : this.jsonEnc(m.ty, "v.v", 0)}`);
      }
      return [...lines, `${i1}}`, "}"];
    }
    lines.push(`${i1}o.obj {`);
    for (const f of j.fields) {
      const read = `v.${this.name(f.name)}`;
      if (f.ty.k !== "optional" || f.nil) lines.push(`${i2}o.key(${this.str(f.name)}); ${this.jsonEnc(f.ty, read, 0)}`);
      else lines.push(`${i2}o.field(${this.str(f.name)}, ${read}) { x0 -> ${this.jsonEnc(f.ty.of, "x0", 1)} }`);
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
        return `o.num(${v}.toDouble())`;
      case "bool":
        return `o.bool(${v})`;
      case "class":
      case "union":
        return `jsonw__${ty.name}(o, ${v})`;
      case "array":
        return `o.arr(${v}) { ${x} -> ${this.jsonEnc(ty.of, x, d + 1)} }`;
      case "map":
        return `o.map(${v}) { ${x} -> ${this.jsonEnc(ty.of, x, d + 1)} }`;
      case "optional":
        return `o.opt(${v}) { ${x} -> ${this.jsonEnc(ty.of, x, d + 1)} }`;
      default:
        return `o.date(${v})`;
    }
  }

  /** JSON.parse / JSON.stringify and Date (`JsDate` in NucloJs.kt). */
  private jsonDateOp(op: Op, args: Expr[], ind: string): string | undefined {
    const [a, b, ...rest] = args;
    const e = (x: Expr) => this.expr(x, ind);
    const what = (x: Expr | undefined) => (x as Extract<Expr, { e: "str" }>).v;
    switch (op) {
      case "json.parse":
        return `jsJsonDecode(${e(a!)}, ${e(b!)})`;
      case "json.stringify":
        return `jsJsonStringify(${e(a!)}, ${e(b!)}) { o, v -> ${this.jsonEnc((rest[0] as Extract<Expr, { e: "decoder" }>).ty, "v", 0)} }`;
      case "json.gap":
        return `jsJsonGap(${e(b!)})`;
      case "date.utc":
        return `jsDateUTC(${args.map(e).join(", ")})`;
      case "date.parse":
        return `jsDateParse(${e(a!)})`;
      case "date.new": {
        const form = what(a);
        if (form === "now") return "JsDate.now()";
        if (form === "parts") return `JsDate.parts(${[b!, ...rest].map(e).join(", ")})`;
        if (form === "copy") return `JsDate(${this.postfixOperand(b!, ind)}.t)`;
        return form === "str" ? `JsDate(jsDateParse(${e(b!)}))` : `JsDate(${e(b!)})`;
      }
      case "date.call": {
        const d = this.postfixOperand(a!, ind);
        const [kind, field, local] = what(b).split(" ");
        if (kind === "get") return `${d}.get(${field}, ${local === "1"})`;
        if (kind === "set") return `${d}.set(${field}, ${local === "1"}, ${rest.map(e).join(", ")})`;
        const calls: Record<string, string> = { time: "t", setTime: `setTime(${rest.map(e).join("")})`, tzOffset: "timezoneOffset()", iso: "toISOString()", utc: "toUTCString()", dateString: "toDateString()" };
        return `${d}.${calls[kind!]}`;
      }
      default:
        return undefined;
    }
  }

  private decode(ty: Ty, value: string, depth: number): string {
    const v = `v${depth}`;
    switch (ty.k) {
      case "string":
        return `NJSON.string(${value})`;
      case "int":
        return `NJSON.int(${value})`;
      case "double":
        return `NJSON.double(${value})`;
      case "bool":
        return `NJSON.bool(${value})`;
      case "class":
        return `${ty.name}.fromJson(${value})`;
      case "array":
        return `NJSON.array(${value}) { ${v} -> ${this.decode(ty.of, v, depth + 1)} }`;
      case "optional":
        return `NJSON.optional(${value}) { ${v} -> ${this.decode(ty.of, v, depth + 1)} }`;
      case "map":
        return `NJSON.map(${value}) { ${v} -> ${this.decode(ty.of, v, depth + 1)} }`;
      default:
        return "null";
    }
  }

  private fn(fn: FnDecl, ind = ""): string[] {
    const outer = this.builders;
    this.builders = stringBuilders(fn.body);
    try {
      return [`${ind}${fn.async ? "suspend " : ""}${this.signature(fn.name, fn.params, fn.ret, ind)} {`, ...this.block(fn.body, ind + INDENT), `${ind}}`];
    } finally {
      this.builders = outer;
    }
  }

  /** This function's string locals kept as StringBuilders (see `stringBuilders`). */
  private builders = new Set<string>();

  private signature(name: string, params: FnDecl["params"], ret: Ty, ind: string): string {
    return `fun ${this.name(name)}(${this.params(params, ind)})${ret.k === "void" ? "" : `: ${this.ty(ret)}`}`;
  }

  private params(params: FnDecl["params"], ind: string): string {
    // Kotlin reserves `_`, `__`… as parameter names of a declared function.
    return params.map((p, i) => `${/^_+$/.test(p.name) ? `unused${i}` : this.name(p.name)}: ${this.ty(p.ty)}${p.default ? ` = ${this.expr(p.default, ind)}` : ""}`).join(", ");
  }

  private protocolDecl(p: ProtocolDecl): string[] {
    const lines = [`interface ${p.name}${p.bases.length ? ` : ${p.bases.join(", ")}` : ""} {`];
    for (const f of p.fields) lines.push(`${INDENT}${f.readonly ? "val" : "var"} ${this.name(f.name)}: ${this.ty(f.ty)}`);
    for (const m of p.methods) lines.push(`${INDENT}${this.signature(m.name, m.params, m.ret, INDENT)}`);
    lines.push("}");
    return lines;
  }

  /**
   * A class with a secondary constructor, which runs the base's first, as JavaScript does. Fields
   * start at a zero value (`lateinit` when their type has none) and the constructor sets them.
   */
  private objectClassDecl(cls: ObjectClassDecl): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    this.self = cls;
    const supers = [...(cls.base ? [cls.base] : []), ...cls.protocols];
    const lines = [`${cls.abstract ? "abstract " : cls.open ? "open " : ""}class ${cls.name}${supers.length ? ` : ${supers.join(", ")}` : ""} {`];
    const open = cls.open ? "open " : "";
    for (const f of cls.fields) {
      const zero = f.init ? this.expr(f.init, i1) : this.zero(f.ty);
      const override = f.overrides || f.implements ? "override " : open;
      // `state` beside a method `getState()` (or `strategy` beside `setStrategy(s)`): the property's JVM accessors
      // would have the method's signature. Renamed on the JVM only (final properties).
      const cap = f.name.charAt(0).toUpperCase() + f.name.slice(1);
      const clash = !override && cls.methods.some((m) => !m.getter && !m.setter && ((m.name === `get${cap}` && m.params.length === 0) || (m.name === `set${cap}` && m.params.length === 1)));
      const jvm = clash ? `@get:JvmName("${f.name}__get") @set:JvmName("${f.name}__set") ` : "";
      lines.push(`${i1}${jvm}${override}${zero === undefined ? "lateinit " : ""}var ${this.name(f.name)}: ${this.ty(f.ty)}${zero === undefined ? "" : ` = ${zero}`}`);
    }
    if (cls.fields.length) lines.push("");
    const delegate = cls.ctor.superArgs ? ` : ${this.call("super", cls.ctor.superArgs, [], i1, (l) => `${l} = `, false)}` : "";
    lines.push(`${i1}constructor(${this.params(cls.ctor.params, i1)})${delegate} {`, ...this.block(cls.ctor.body, i2), `${i1}}`);
    // A setter is printed with its getter: one property.
    for (const m of cls.methods) if (!m.setter) lines.push("", ...this.method(m, open, cls.methods.find((s) => s.setter && s.name === m.name)));
    lines.push("}");
    this.self = undefined;
    return lines;
  }

  private method(m: MethodDecl, open: string, setter?: MethodDecl): string[] {
    const i1 = INDENT;
    // `toString(): string` overrides Any's (Kotlin requires the modifier).
    const ofAny = !m.getter && !m.setter && m.name === "toString" && !m.params.length && m.ret.k === "string";
    const overrides = m.overrides || m.implements || ofAny;
    const modifiers = `${m.abstract ? "abstract " : overrides ? "" : open}${overrides ? "override " : ""}`;
    if (m.getter) {
      const head = `${i1}${modifiers}${setter ? "var" : "val"} ${this.name(m.name)}: ${this.ty(m.ret)}`;
      if (m.abstract) return [head];
      const lines = [head, `${i1}${i1}get() {`, ...this.block(m.body, i1 + i1 + i1), `${i1}${i1}}`];
      if (setter) lines.push(`${i1}${i1}set(${this.name(setter.params[0]!.name)}) {`, ...this.block(setter.body, i1 + i1 + i1), `${i1}${i1}}`);
      return lines;
    }
    const head = `${i1}${modifiers}${this.signature(m.name, m.params, m.ret, i1)}`;
    return m.abstract ? [head] : [`${head} {`, ...this.block(m.body, i1 + i1), `${i1}}`];
  }

  /** The value a field holds until the constructor sets it; undefined when its type has none. */
  private zero(t: Ty): string | undefined {
    switch (t.k) {
      case "num":
        return `0.to${KOTLIN_SIZED[t.n]}()`;
      case "int":
        return "0";
      case "double":
        return "0.0";
      case "string":
        return '""';
      case "bool":
        return "false";
      case "optional":
        return "null";
      case "array":
        return t.of.k === "double" ? "JsDoubleList()" : t.of.k === "num" && t.of.n === "Int8" ? "JsByteList()" : `mutableListOf<${this.ty(t.of)}>()`;
      case "map":
        return `mutableMapOf<String, ${this.ty(t.of)}>()`;
      case "jsmap":
      case "jsset":
        return this.newMapSet(t);
      default:
        return undefined;
    }
  }

  protected ty(t: Ty): string {
    switch (t.k) {
      case "num":
        return KOTLIN_SIZED[t.n];
      case "int":
        return "Int";
      case "double":
        return "Double";
      case "string":
        return "String";
      case "bool":
        return "Boolean";
      case "void":
        return "Unit";
      case "array":
        return `MutableList<${this.ty(t.of)}>`;
      case "map":
        return `MutableMap<String, ${this.ty(t.of)}>`;
      case "optional":
        return t.of.k === "fn" ? `(${this.ty(t.of)})?` : `${this.ty(t.of)}?`;
      case "class":
        return t.name;
      case "fn":
        return `(${t.params.map((p) => this.ty(p)).join(", ")}) -> ${this.ty(t.ret)}`;
      case "rt":
        return RUNTIME_TYPES[t.name] ?? t.name;
      case "union":
        return t.name;
      case "promise":
        return `JsPromise<${this.ty(t.of)}>`;
      case "settled":
        return `JsSettled<${this.ty(t.of)}>`;
      case "jsmap":
        return `${t.weak ? "JsWeakMap" : "JsOMap"}<${this.ty(t.key)}, ${this.ty(t.of)}>`;
      case "jsset":
        return t.ref ? `JsWeakRef<${this.ty(t.of)}>` : `${t.weak ? "JsWeakMap" : "JsOMap"}<${this.ty(t.of)}, Unit>`;
    }
  }

  /** An empty Map / Set (NucloJs.kt `JsOMap`): objects, arrays and maps as keys compare by identity. */
  private newMapSet(t: Extract<Ty, { k: "jsmap" | "jsset" }>): string {
    const key = t.k === "jsmap" ? t.key : t.of;
    const byValue = ["double", "int", "string", "bool", "rt"].includes(key.k);
    return `${this.ty(t)}(${!byValue})`;
  }

  /** Promises (NucloRuntime.kt `JsPromise`) and async functions' state machines (asyncLower.ts). */
  private promiseOp(x: Extract<Expr, { e: "op" }>, ind: string): string | undefined {
    const [a, b, c] = x.args;
    const e = (v: Expr) => this.expr(v, ind);
    const r = () => this.postfixOperand(a!, ind);
    const of = x.ty?.k === "promise" ? x.ty.of : undefined;
    const typed = (v: Expr): Expr => (v.e === "lambda" ? { ...v, typed: true } : v);
    const fn = (v: Expr) => this.expr(typed(v), ind);
    const unit = (t: Ty | undefined) => (t?.k === "void" ? "Unit" : "");
    switch (x.op as string) {
      case "promise.new":
        return of?.k === "void" ? `JsPromise.createVoid(${fn(a!)})` : `JsPromise.create<${this.ty(of!)}>(${fn(a!)})`;
      case "promise.resolve":
        return `JsPromise.resolved<${this.ty(of!)}>(${a ? e(a) : unit(of)})`;
      case "promise.reject":
        return `JsPromise.rejected<${this.ty(of!)}>(${e(a!)})`;
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
      case "promise.allSettled":
      case "promise.race":
      case "promise.any":
        return `JsPromise.${(x.op as string).slice(8)}(${e(a!)})`;
      case "promise.delay":
        return `jsDelay(${e(a!)})`;
      case "promise.native":
        return `jsNative { ${e(a!)} }`;
      case "settled.status":
        return `${r()}.status`;
      case "settled.value":
        return `${r()}.value`;
      case "settled.reason":
        return `${r()}.reason`;
      case "error.new":
        return `Exception(${e(a!)})`;
      // An object of an app's error class thrown (`throw new E()`): its name and message, and the object.
      case "error.wrap":
        return `JsNamedError(${e(x.args[1]!)}, ${e(x.args[2]!)}, ${e(a!)})`;
      case "error.obj":
        return `((${e(a!)} as? JsNamedError)?.obj as? ${(x.args[1] as { v: string }).v})`;
      case "error.name":
        return `((${e(a!)} as? JsNamedError)?.jsName ?: "Error")`;
      case "async.run":
        return `jsAsync(${fn(a!)})`;
      case "async.await":
        return `${r()}.awaitOn(${e(b!)}, ${c ? fn(c) : "null"})`;
      case "async.check":
        return `${r()}.check()`;
      case "async.resolve":
        return `${r()}.resolve(${b ? e(b) : "Unit"})`;
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
    return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }

  protected special(x: Expr, ind: string): string {
    switch (x.e) {
      case "nil":
        return "null";
      case "tpl":
        return `"${x.parts.map((p) => (typeof p === "string" ? this.escape(p) : `\${${this.interpolated(p, ind)}}`)).join("")}"`;
      case "id":
        if (x.name === "this") return this.self ? `this@${this.self.name}` : "this";
        if (this.builders.has(x.name)) return `${this.name(x.name)}.toString()`;
        return x.fnRef && !this.forward.has(x.name) ? `::${this.name(x.name)}` : this.name(x.name);
      case "construct":
        return this.call(x.cls, x.args, [], ind, (l) => `${l} = `, false);
      case "invoke": {
        // `super<Base>`: the base class, even when a protocol declares the method too.
        const on = x.sup ? `super<${this.self?.base ?? x.sup}>` : this.postfixOperand(x.obj, ind);
        return this.call(`${on}.${this.name(x.name)}`, x.args, [], ind, (l) => `${l} = `, false);
      }
      case "incr": {
        const sign = x.op === "+=" ? "++" : "--";
        return x.prefix ? `(${sign}${this.expr(x.target, ind)})` : `(${this.expr(x.target, ind)}${sign})`;
      }
      case "call":
        // No trailing lambda: it would bind to the last parameter, and an app function's may be a defaulted one after the lambda.
        return this.call(this.callee(x.callee, ind), x.args, [], ind, (l) => `${l} = `, false);
      case "rt":
        return this.call(this.name(RUNTIME_NAMES[x.name] ?? x.name), x.args, x.named ?? [], ind, (l) => `${l} = `);
      case "method":
        return this.call(`${this.postfixOperand(x.obj, ind)}.${this.name(x.name)}`, x.args, [], ind, (l) => `${l} = `);
      case "cond":
        return `if (${this.expr(x.c, ind)}) ${this.expr(x.a, ind)} else ${this.expr(x.b, ind)}`;
      case "unwrap":
        return `${this.postfixOperand(x.x, ind)}!!`;
      case "coalesce":
        return `${x.l.e === "cond" ? `(${this.expr(x.l, ind)})` : this.expr(x.l, ind)} ?: ${this.expr(x.r, ind)}`;
      // `run` is inline: the body writes the variables around it.
      case "seq": {
        const i2 = ind + INDENT;
        return `run {\n${x.body.flatMap((s) => this.stmt(s, i2)).join("\n")}\n${i2}${this.expr(x.x, i2)}\n${ind}}`;
      }
      // `let` is inline: the body reads and writes the variables around it as the expression would.
      case "with":
        return `(${this.expr(x.init, ind)}).let { ${this.name(x.name)}: ${this.ty(x.ty)} -> ${this.expr(x.body, ind + INDENT)} }`;
      case "toDouble":
        return `${this.postfixOperand(x.x, ind)}.toDouble()`;
      case "toInt":
        return `${this.postfixOperand(x.x, ind)}.toInt()`;
      case "numCast": {
        // Byte / Short / UByte / UShort from a Double go through Int (Double.toByte() is deprecated).
        const via = x.from.k === "double" && x.to.k === "num" && ["Int8", "Int16", "UInt8", "UInt16"].includes(x.to.n) ? ".toInt()" : "";
        return `${this.postfixOperand(x.x, ind)}${via}.to${this.ty(x.to)}()`;
      }
      case "toStr":
        return x.from.k === "double" ? `jsNum(${this.expr(x.x, ind)})` : `${this.postfixOperand(x.x, ind)}.toString()`;
      case "new":
        return this.call(x.cls, [], x.args, ind, (l) => `${this.name(l)} = `);
      case "arr":
        // number[] and Int8[] literals are packed lists (NucloJs.kt JsDoubleList / JsByteList).
        const packed = x.of.k === "double" ? "jsDoubles" : x.of.k === "num" && x.of.n === "Int8" ? "jsBytes" : undefined;
        return this.call(packed ?? `mutableListOf<${this.ty(x.of)}>`, x.items, [], ind, () => "", false);
      case "dict":
        return this.call(
          `mutableMapOf<String, ${this.ty(x.of)}>`,
          x.entries.map(([k, v]): Expr => ({ e: "rt", name: "__pair", args: [{ e: "str", v: k }, v] })),
          [],
          ind,
          () => "",
          false,
        );
      case "style": {
        const style = this.call("Style", [], x.props, ind, (l) => `${l} = `);
        return x.base ? `${this.postfixOperand(x.base, ind)}.merged(${style})` : style;
      }
      case "enum":
        return `${x.type}.${x.member[0]!.toUpperCase()}${x.member.slice(1)}`;
      case "decoder":
        return `{ json -> ${this.decode(x.ty, "json", 0)} }`;
      case "instanceOf":
        return `(${this.postfixOperand(x.x, ind)} is ${this.ty({ k: "class", name: x.cls })})`;
      case "downcast":
        return `(${this.postfixOperand(x.x, ind)} as ${this.ty({ k: "class", name: x.cls })})`;
      case "uwrap":
        return x.ty.k === "void" ? `${x.u}.${x.tag}` : `${x.u}.${x.tag}(${this.expr(x.x, ind)})`;
      case "uis":
        return `(${this.postfixOperand(x.x, ind)} is ${x.u}.${x.tag})`;
      case "uget":
        return `(${this.postfixOperand(x.x, ind)} as ${x.u}.${x.tag}).v`;
      case "launch":
        return `launch { ${this.expr(x.call, ind)} }`;
      default:
        return `/* ${x.e} */`;
    }
  }

  protected override expr(x: Expr, ind: string): string {
    // `"key" to value` inside mutableMapOf.
    if (x.e === "rt" && x.name === "__pair") return `${this.expr(x.args[0]!, ind)} to ${this.expr(x.args[1]!, ind)}`;
    if (x.e === "op") {
      if (x.op === "mc.new") return x.args[0] ? `${this.ty(x.ty!)}(${this.expr(x.args[0], ind)})` : this.newMapSet(x.ty as Extract<Ty, { k: "jsmap" | "jsset" }>);
      if (x.op === "mc.call") {
        const [a, b, ...rest] = x.args;
        return `${this.postfixOperand(a!, ind)}.${(b as Extract<Expr, { e: "str" }>).v}(${rest.map((v) => this.expr(v, ind)).join(", ")})`;
      }
      const promise = this.promiseOp(x, ind);
      if (promise !== undefined) return promise;
    }
    // Kotlin doesn't short-circuit the rest of an optional chain: each later link is `?.` too.
    // `super<Base>`: the base class, even when a protocol declares the property too.
    if (x.e === "prop" && x.sup) return `super<${this.self?.base ?? x.sup}>.${this.name(x.name)}`;
    if (x.e === "prop" && x.chain && !x.optional) return `${this.postfixOperand(x.obj, ind)}?.${this.name(x.name)}`;
    if (x.e === "op" && x.chain) {
      const receiver = this.postfixOperand(x.args[0]!, ind);
      const s = this.op(x.op, x.args, ind);
      return s.startsWith(`${receiver}.`) ? `${receiver}?.${s.slice(receiver.length + 1)}` : s;
    }
    return super.expr(x, ind);
  }

  /** A callee: a local lambda variable or a declared function, called by name. */
  private callee(x: Expr, ind: string): string {
    return x.e === "id" ? this.name(x.name) : this.postfixOperand(x, ind);
  }

  private interpolated(p: Expr, ind: string): string {
    if (p.e === "toStr") return p.from.k === "double" ? `jsNum(${this.expr(p.x, ind)})` : this.expr(p.x, ind);
    return this.expr(p, ind);
  }

  /** Lambdas that `return` become anonymous functions, which can't trail. */
  protected override canTrail(x: Extract<Expr, { e: "lambda" }>): boolean {
    return !(Array.isArray(x.body) && this.returns(x.body));
  }

  protected lambda(x: Extract<Expr, { e: "lambda" }>, ind: string): string {
    if (Array.isArray(x.body) && this.returns(x.body)) {
      const params = x.params.map((p, i) => `${p.unused ? `unused${i}` : this.name(p.name)}: ${this.ty(p.ty)}`).join(", ");
      const ret = x.ret.k === "void" ? "" : `: ${this.ty(x.ret)}`;
      return `fun(${params})${ret} {\n${this.block(x.body, ind + INDENT).join("\n")}\n${ind}}`;
    }
    const names = this.paramNames(x.params, () => "_").map((n, i) => (x.typed ? `${n}: ${this.ty(x.params[i]!.ty)}` : n));
    const head = names.length ? ` ${names.join(", ")} ->` : "";
    if (!Array.isArray(x.body)) {
      const body = this.expr(x.body, ind + INDENT);
      if (!body.includes("\n") && body.length + ind.length < 90) return `{${head} ${body} }`;
      return `{${head}\n${ind + INDENT}${body}\n${ind}}`;
    }
    const lines = this.block(x.body, ind + INDENT);
    if (lines.length === 1 && lines[0]!.length < 80) return `{${head} ${lines[0]!.trim()} }`;
    return `{${head}\n${lines.join("\n")}\n${ind}}`;
  }

  protected op(op: Op, args: Expr[], ind: string): string {
    const jsonDate = this.jsonDateOp(op, args, ind);
    if (jsonDate !== undefined) return jsonDate;
    const [a, b, c] = args;
    const r = () => this.postfixOperand(a!, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // A lambda trails; a function reference (`::format`) is an argument.
    const fn = (x: Expr) => (x.e === "lambda" && this.canTrail(x) ? ` ${e(x)}` : `(${e(x)})`);
    // After other arguments: `f(a) { … }`, or `f(a, ::g)` (a function reference or `fun(…)` can't trail).
    const call = (args: string, x: Expr) => (x.e === "lambda" && this.canTrail(x) ? `(${args}) ${e(x)}` : `(${args}, ${e(x)})`);
    switch (op) {
      case "arr.length":
        return `${r()}.size`;
      case "str.length":
        return `${r()}.length`;
      case "arr.at":
        return `${r()}.getOrNull(${e(b!)})`;
      case "arr.push":
        return `${r()}.add(${e(b!)})`;
      case "arr.pushAll":
        return `${r()}.addAll(${e(b!)})`;
      case "arr.pop":
        return `${r()}.removeLastOrNull()`;
      case "arr.unshift":
        return `${r()}.add(0, ${e(b!)})`;
      // As a value: the new length (the receiver read once, before the argument).
      case "arr.pushLen":
        return `${r()}.let { a__ -> a__.add(${e(b!)}); a__.size }`;
      case "arr.pushAllLen":
        return `${r()}.let { a__ -> a__.addAll(${e(b!)}); a__.size }`;
      case "arr.unshiftLen":
        return `${r()}.let { a__ -> a__.add(0, ${e(b!)}); a__.size }`;
      case "arr.splice":
        return `${r()}.jsSplice(${args.slice(1).map(e).join(", ")})`;
      case "arr.indexOf":
        return `${r()}.jsIndexOf(${args.slice(1).map(e).join(", ")})`;
      case "arr.includes":
        return `${r()}.jsIncludes(${args.slice(1).map(e).join(", ")})`;
      case "arr.fill":
      case "arr.copyWithin":
        return `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}(${e(b!)}, ${e(c!)}, ${args[3] ? e(args[3]) : "null"})`;
      case "arr.filled":
        return `jsFilled${args[3] ? "Checked" : ""}<${this.ty((a as Extract<Expr, { e: "arr" }>).of)}>(${e(b!)}, ${e(c!)})`;
      case "arr.fromLength":
        return `jsFromLength<${this.ty((a as Extract<Expr, { e: "arr" }>).of)}>${call(e(b!), c!)}`;
      case "arr.flat":
        return `${r()}.jsFlat()`;
      case "arr.reduceRight":
        return `${r()}.jsReduceRight${call(e(c!), b!)}`;
      case "arr.findLast":
      case "arr.findLastIndex":
        return `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}${fn(b!)}`;
      case "arr.toSpliced":
        return `${r()}.jsToSpliced(${args.slice(1).map(e).join(", ")})`;
      case "arr.with":
        return args[3] ? `jsFatal { ${r()}.jsWith(${e(b!)}, ${e(c!)}) }` : `${r()}.jsWith(${e(b!)}, ${e(c!)})`;
      case "arr.find":
        return `${r()}.find${fn(b!)}`;
      case "arr.findIndex":
        return `${r()}.indexOfFirst${fn(b!)}`;
      case "arr.filter":
        // Into the result list directly (filter/map + toMutableList copied every element twice).
        return `${r()}.filterTo${call("ArrayList()", b!)}`;
      case "arr.map":
        return `${r()}.mapTo${call("ArrayList()", b!)}`;
      case "arr.some":
        return `${r()}.any${fn(b!)}`;
      case "arr.every":
        return `${r()}.all${fn(b!)}`;
      case "arr.forEach":
        return `${r()}.forEach${fn(b!)}`;
      case "arr.join":
        return `${r()}.joinToString(${e(b!)})`;
      case "arr.slice":
      case "str.slice":
        return `${r()}.jsSlice(${e(b!)}, ${e(c!)})`;
      case "str.trim":
        return `${r()}.jsTrim()`;
      case "arr.concat":
        return `${r()}.jsConcat(${args.slice(1).map(e).join(", ")})`;
      case "arr.sort":
        return `${r()}.jsSort${fn(b!)}`;
      case "arr.reverse":
        return `${r()}.jsReverse()`;
      case "arr.shift":
        return `${r()}.jsShift()`;
      case "arr.lastIndexOf":
        return `${r()}.jsLastIndexOf(${args.slice(1).map(e).join(", ")})`;
      case "arr.atRel":
        return `${r()}.jsAtRel(${e(b!)})`;
      case "arr.reduce":
        return `${r()}.fold${call(e(c!), b!)}`;
      case "arr.mapI":
      case "arr.filterI":
      case "arr.forEachI":
      case "arr.someI":
      case "arr.everyI":
      case "arr.findI":
      case "arr.findIndexI":
        return `${r()}.js${op[4]!.toUpperCase()}${op.slice(5)}${fn(b!)}`;
      case "map.delete":
        return `${r()}.remove(${e(b!)})`;
      case "map.has":
        return `${r()}.containsKey(${e(b!)})`;
      case "map.keys":
        return `${r()}.jsKeys()`;
      case "map.values":
        return `${r()}.jsValues()`;
      case "str.split":
        return `${r()}.jsSplit(${e(b!)})`;
      case "str.replace":
      case "str.replaceAll":
        return `${r()}.jsReplace(${e(b!)}, ${e(c!)}, ${op === "str.replaceAll"})`;
      case "str.indexOf":
        return `${r()}.jsIndexOf(${e(b!)}, ${e(c!)})`;
      case "str.lastIndexOf":
        return `${r()}.jsLastIndexOf(${e(b!)})`;
      case "str.padStart":
      case "str.padEnd":
        return `${r()}.jsPad(${e(b!)}, ${e(c!)}, ${op === "str.padStart"})`;
      case "str.repeat":
        return `${r()}.jsRepeat(${e(b!)})`;
      case "str.trimStart":
        return `${r()}.jsTrimStart()`;
      case "str.trimEnd":
        return `${r()}.jsTrimEnd()`;
      case "str.compare":
        return `jsCompare(${e(a!)}, ${e(b!)})`;
      // Kotlin's Int is 32 bits: the dividend is computed in Longs.
      case "int.wideRem": {
        const wide = (x: Expr): string =>
          x.e === "bin" ? `(${wide(x.l)} ${x.op} ${wide(x.r)})` : x.e === "int" ? `${x.v}L` : `${this.postfixOperand(x, ind)}.toLong()`;
        return `(${wide(a!)} % ${wide(b!)}).toInt()`;
      }
      case "math.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v;
        const x = args.slice(1).map(e);
        const special: Record<string, string> = {
          sign: `jsSign(${x[0]})`, isInteger: `jsIsInteger(${x[0]})`, isNaN: `(${x[0]}).isNaN()`, isFinite: `(${x[0]}).isFinite()`,
          Infinity: "Double.POSITIVE_INFINITY", NaN: "Double.NaN", log: `kotlin.math.ln(${x[0]})`, log1p: `kotlin.math.ln1p(${x[0]})`,
          fmod: `jsRem(${x[0]}, ${x[1]})`, fround: `(${x[0]}).toFloat().toDouble()`,
          trunc: `kotlin.math.truncate(${x[0]})`, jsRound: `jsRoundD(${x[0]})`,
        };
        return special[name] ?? `kotlin.math.${name}(${x.join(", ")})`;
      }
      case "bit.and":
      case "bit.or":
      case "bit.xor":
      case "bit.shl":
      case "bit.shr":
        return `(jsI32(${e(a!)}) ${op.slice(4)} jsI32(${e(b!)}))`;
      case "bit.ushr":
        return `jsUshr(jsI32(${e(a!)}), jsI32(${e(b!)}))`;
      case "bit.not":
        return `jsI32(${e(a!)}).inv()`;
      case "bit.imul":
        return `(jsI32(${e(a!)}) * jsI32(${e(b!)}))`;
      case "bit.clz32":
        return `Integer.numberOfLeadingZeros(jsI32(${e(a!)}))`;
      case "js.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v.replace("!", "");
        const call = `js${name[0]!.toUpperCase()}${name.slice(1)}(${args.slice(1).map(e).join(", ")})`;
        // `!`: an error here stops the program (Swift `try!`, Rust `unwrap`); no `catch (e: Exception)` takes it.
        return (a as Extract<Expr, { e: "str" }>).v.endsWith("!") ? `jsFatal { ${call} }` : call;
      }
      case "str.upper":
        return `${r()}.uppercase()`;
      case "str.lower":
        return `${r()}.lowercase()`;
      case "str.includes":
        return `${r()}.contains(${e(b!)})`;
      case "str.startsWith":
        return `${r()}.startsWith(${e(b!)})`;
      case "str.endsWith":
        return `${r()}.endsWith(${e(b!)})`;
      case "str.nonEmpty":
        return `${r()}.isNotEmpty()`;
      case "str.or":
        return `${r()}.ifEmpty { ${e(b!)} }`;
      case "num.toFixed":
        return `jsFixed(${e(a!)}, ${e(b!)})`;
      case "math.floor":
        return `kotlin.math.floor(${e(a!)}).toInt()`;
      case "math.ceil":
        return `kotlin.math.ceil(${e(a!)}).toInt()`;
      case "math.round":
        return `jsRound(${e(a!)})`;
      case "math.trunc":
        return `${r()}.toInt()`;
      case "math.abs":
        return `kotlin.math.abs(${e(a!)})`;
      case "math.min":
        return `kotlin.comparisons.minOf(${args.map(e).join(", ")})`;
      case "math.max":
        return `kotlin.comparisons.maxOf(${args.map(e).join(", ")})`;
      case "math.sqrt":
        return `kotlin.math.sqrt(${e(a!)})`;
      case "math.pow":
        return `jsPow(${e(a!)}, ${e(b!)})`;
      case "math.random":
        return "kotlin.random.Random.nextDouble()";
      case "math.pi":
        return "kotlin.math.PI";
      case "map.get":
        return `${r()}[${e(b!)}]`;
      case "date.now":
        return "jsNow()";
      case "num.parse":
        return `jsNumber(${e(a!)})`;
      case "int.parse":
        return `jsParseInt(${e(a!)}, ${e(b!)})`;
      case "error.message":
        return `jsErrorMessage(${e(a!)})`;
      case "error.text":
        return `(${this.postfixOperand(a!, ind)}.message ?: ${this.postfixOperand(a!, ind)}.javaClass.simpleName)`;
      default:
        return op.startsWith("ta.") ? this.typedArrayOp(op, args, ind) : this.bigOp(op, args, ind);
    }
  }

  /** Typed arrays (NucloJs.kt: `Uint8Array`… over a primitive array, `JsTypedArray` their base). */
  private typedArrayOp(op: Op, args: Expr[], ind: string): string {
    const [a, b, ...rest] = args;
    const name = (b as Extract<Expr, { e: "str" }>).v;
    if (op === "ta.new") return `${name}(${this.expr(rest[0]!, ind)})`;
    if (op === "ta.prop") return `${this.postfixOperand(a!, ind)}.${name}`;
    return `${this.postfixOperand(a!, ind)}.${name}(${rest.map((x) => this.expr(x, ind)).join(", ")})`;
  }

  /** bigint (`JsBigInt` = java.math.BigInteger, whose Kotlin operators are JavaScript's) and symbol operations. */
  private bigOp(op: Op, args: Expr[], ind: string): string {
    const [a, b] = args;
    const p = (x: Expr) => this.postfixOperand(x, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // `/` and `%` by a literal the front-end checked can't throw; anything else checks for 0n.
    const throwing = !(b?.e === "op" && b.op === "big.lit");
    const infix: Partial<Record<Op, string>> = { "big.add": "+", "big.sub": "-", "big.mul": "*", "big.and": "and", "big.or": "or", "big.xor": "xor" };
    if (infix[op]) return `(${p(a!)} ${infix[op]} ${p(b!)})`;
    switch (op) {
      case "big.lit": {
        const v = (a as Extract<Expr, { e: "str" }>).v;
        return BigInt(v) > 9223372036854775807n || BigInt(v) < -9223372036854775807n ? `jsBig("${v}")` : `jsBig(${v}L)`;
      }
      case "big.div":
      case "big.mod":
        return throwing ? `${op === "big.div" ? "jsBigDiv" : "jsBigMod"}(${e(a!)}, ${e(b!)})` : `(${p(a!)} ${op === "big.div" ? "/" : "%"} ${p(b!)})`;
      case "big.pow":
        return `jsBigPow(${e(a!)}, ${e(b!)})`;
      case "big.shl":
        return `jsBigShl(${e(a!)}, ${e(b!)})`;
      case "big.shr":
        return `jsBigShr(${e(a!)}, ${e(b!)})`;
      case "big.neg":
        return `(-${p(a!)})`;
      case "big.not":
        return `${p(a!)}.inv()`;
      case "big.from":
        return `jsBig(${p(a!)}.toLong())`;
      case "big.fromDouble":
        return `jsBigFrom(${e(a!)})`;
      case "big.parse":
        return `jsBigParse(${e(a!)})`;
      case "big.toNumber":
        return `jsBigToDouble(${e(a!)})`;
      case "big.str":
        return b!.e === "int" ? `${p(a!)}.toString(${b!.v})` : `jsBigToString(${e(a!)}, ${e(b!)})`;
      case "big.asIntN":
        return `jsBigAsIntN(${e(a!)}, ${e(b!)})`;
      case "big.asUintN":
        return `jsBigAsUintN(${e(a!)}, ${e(b!)})`;
      case "sym.new":
        return `JsSymbol(${e(a!)})`;
      case "sym.description":
        return `${p(a!)}.desc`;
      default:
        return `/* ${op} */`;
    }
  }

  /**
   * JavaScript hoists a block's function declarations (the front-end puts them first), but a Kotlin local `fun` only
   * sees what is declared above it. Each goes right after the block's locals and local functions it reads (through
   * the functions it calls too), and before the first statement that uses it; what is still read before it is
   * placed is declared first (see below).
   */
  protected override block(stmts: Stmt[], ind: string): string[] {
    const fns = stmts.filter((s): s is Extract<Stmt, { s: "fn" }> => s.s === "fn");
    if (!fns.length) return super.block(stmts, ind);
    const ids = (node: unknown, out = new Set<string>()): Set<string> => {
      if (Array.isArray(node)) for (const item of node) ids(item, out);
      else if (node && typeof node === "object") {
        const x = node as { e?: string; name?: string };
        if (x.e === "id" && x.name) out.add(x.name);
        for (const value of Object.values(node)) ids(value, out);
      }
      return out;
    };
    const rest = stmts.filter((s) => s.s !== "fn");
    const lets = new Set(rest.flatMap((s) => (s.s === "let" ? [s.name] : [])));
    const byName = new Map(fns.map((f) => [f.decl.name, f]));
    const uses = new Map(fns.map((f) => [f, ids(f.decl.body)]));
    const [out, placed, declared] = [[] as Stmt[], new Set<string>(), new Set<string>()];
    const ready = (f: Extract<Stmt, { s: "fn" }>) =>
      [...uses.get(f)!].every((n) => n === f.decl.name || (lets.has(n) ? declared.has(n) : byName.has(n) ? placed.has(n) : true));
    const place = (f: Extract<Stmt, { s: "fn" }>) => {
      if (placed.has(f.decl.name)) return;
      placed.add(f.decl.name);
      for (const n of uses.get(f)!) if (byName.has(n)) place(byName.get(n)!);
      out.push(f);
    };
    const placeReady = () => {
      for (let more = true; more; ) {
        more = false;
        for (const f of fns) if (!placed.has(f.decl.name) && ready(f)) (place(f), (more = true));
      }
    };
    placeReady();
    for (const s of rest) {
      for (const n of ids(s)) if (byName.has(n)) place(byName.get(n)!);
      out.push(s);
      if (s.s === "let") declared.add(s.name), placeReady();
    }
    fns.forEach(place);
    // What a function reads that is placed after it (two functions calling each other; a local declared later, which
    // JavaScript allows when the call runs after it): declared first (a `lateinit var` of the function's type, set to
    // an anonymous function where it was; a local's zero value, assigned where it was).
    const [early, fwd] = [new Set<string>(), [] as string[]];
    for (const s of out) {
      if (s.s === "fn") {
        for (const n of uses.get(s)!) if (n !== s.decl.name && !early.has(n) && (byName.has(n) || lets.has(n)) && !fwd.includes(n)) fwd.push(n);
        early.add(s.decl.name);
      } else if (s.s === "let") early.add(s.name);
    }
    const pre: string[] = [];
    const added: string[] = [];
    for (const n of fwd) {
      const f = byName.get(n);
      if (f) {
        if (f.decl.async || f.decl.params.some((p) => p.default)) continue;
        pre.push(`${ind}lateinit var ${this.name(n)}: ${this.ty({ k: "fn", params: f.decl.params.map((p) => p.ty), ret: f.decl.ret })}`);
      } else {
        const l = rest.find((s): s is Extract<Stmt, { s: "let" }> => s.s === "let" && s.name === n)!;
        if (this.builders.has(n)) continue;
        const zero = this.zero(l.ty);
        pre.push(zero === undefined ? `${ind}lateinit var ${this.name(n)}: ${this.ty(l.ty)}` : `${ind}var ${this.name(n)}: ${this.ty(l.ty)} = ${zero}`);
      }
      if (!this.forward.has(n)) this.forward.add(n), added.push(n);
    }
    try {
      return [...pre, ...super.block(out, ind)];
    } finally {
      for (const n of added) this.forward.delete(n);
    }
  }

  /** Local functions and locals the enclosing block declares first (see `block`): set where they were. */
  private readonly forward = new Set<string>();

  /** The labels of the labelled loops being printed (`break@l`; a labelled block's label is returned from). */
  private readonly loopLabels = new Set<string>();

  /** A loop, `label@ for …` when it has one. */
  private labelled(s: Extract<Stmt, { s: "forOf" | "forRange" | "while" }>, head: string, ind: string): string[] {
    if (s.label) this.loopLabels.add(s.label);
    const body = this.block(s.body, ind + INDENT);
    if (s.label) this.loopLabels.delete(s.label);
    return [`${ind}${s.label ? `${s.label}@ ` : ""}${head}`, ...body, `${ind}}`];
  }

  protected stmt(s: Stmt, ind: string): string[] {
    const i2 = ind + INDENT;
    switch (s.s) {
      case "let": {
        if (this.builders.has(s.name)) return [`${ind}val ${this.name(s.name)} = StringBuilder(${s.init ? this.expr(s.init, ind) : '""'})`];
        if (this.forward.has(s.name)) return s.init ? [`${ind}${this.name(s.name)} = ${this.expr(s.init, ind)}`] : [];
        const keyword = s.mutable ? "var" : "val";
        if (!s.init) return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)}${s.ty.k === "optional" ? " = null" : ""}`];
        return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)} = ${this.expr(s.init, ind)}`];
      }
      case "assign":
        if (s.op === "+=" && s.target.e === "id" && this.builders.has(s.target.name)) return [`${ind}${this.name(s.target.name)}.append(${this.expr(s.value, ind)})`];
        if (s.op === "=" && s.target.e === "index") return [`${ind}jsSet(${this.expr(s.target.obj, ind)}, ${this.expr(s.target.index, ind)}, ${this.expr(s.value, ind)})`];
        return [`${ind}${this.expr(s.target, ind)} ${s.op} ${this.expr(s.value, ind)}`];
      case "expr":
        return [`${ind}${this.expr(s.x, ind)}`];
      case "if": {
        const lines = [`${ind}if (${this.expr(s.c, ind)}) {`, ...this.block(s.then, i2)];
        let rest = s.else;
        while (rest?.length === 1 && rest[0]!.s === "if") {
          const elif = rest[0] as Extract<Stmt, { s: "if" }>;
          lines.push(`${ind}} else if (${this.expr(elif.c, ind)}) {`, ...this.block(elif.then, i2));
          rest = elif.else;
        }
        if (rest?.length) lines.push(`${ind}} else {`, ...this.block(rest, i2));
        lines.push(`${ind}}`);
        return lines;
      }
      case "forOf":
        return this.labelled(s, `for (${this.name(s.name)} in ${this.postfixOperand(s.of, ind)}.jsLive()) {`, ind);
      case "forRange":
        return this.labelled(s, `for (${this.name(s.name)} in ${this.expr(s.from, ind)}${s.inclusive ? ".." : " until "}${this.expr(s.to, ind)}) {`, ind);
      case "while":
        return this.labelled(s, `while (${this.expr(s.c, ind)}) {`, ind);
      case "return":
        return [s.x ? `${ind}return ${this.expr(s.x, ind)}` : `${ind}return`];
      // A labelled block is an inline lambda: its label is left by returning from it.
      case "break":
        return [!s.label ? `${ind}break` : this.loopLabels.has(s.label) ? `${ind}break@${s.label}` : `${ind}return@${s.label}`];
      case "continue":
        return [s.label ? `${ind}continue@${s.label}` : `${ind}continue`];
      case "try":
        return [
          `${ind}try {`,
          ...this.block(s.body, i2),
          `${ind}} catch (${s.catchName ? this.name(s.catchName) : "ignored"}: Exception) {`,
          ...this.block(s.catchBody, i2),
          ...(s.finally ? [`${ind}} finally {`, ...this.block(s.finally, i2)] : []),
          `${ind}}`,
        ];
      case "throw":
        return [`${ind}throw Exception(${this.expr(s.message, ind)})`];
      case "rethrow":
        return [`${ind}throw ${this.expr(s.error, ind)}`];
      // A switch left by a `break` (see switchBlock): an inline lambda its label returns from (`break` and
      // `continue` inside still reach the loop around it). A try's `lowered` form isn't printed (Kotlin has `finally`).
      case "block":
        return [`${ind}run<Unit> ${s.label}@{`, ...this.block(s.body, ind + INDENT), `${ind}}`];
      case "unreachable":
        return [`${ind}error("unreachable")`];
      case "global": {
        const g = this.placed.get(s.name);
        return g?.init ? [`${ind}${this.name(g.name)} = ${this.expr(g.init, ind)}`] : [];
      }
      case "fn":
        if (this.forward.has(s.decl.name)) {
          const [head, ...body] = this.fn({ ...s.decl, name: "" }, ind);
          return [head!.replace(/^(\s*)fun \(/, `$1${this.name(s.decl.name)} = fun(`), ...body];
        }
        return this.fn(s.decl, ind);
      case "switch": {
        const block = this.switchBlock(s);
        if (block.s === "block") return this.stmt(block, ind);
        const lines = [`${ind}when (${this.expr(s.x, ind)}) {`];
        for (const c of s.cases) lines.push(`${i2}${c.values.map((v) => this.expr(v, i2)).join(", ")} -> {`, ...this.block(c.body, i2 + INDENT), `${i2}}`);
        lines.push(`${i2}else -> {`, ...this.block(s.default ?? [], i2 + INDENT), `${i2}}`, `${ind}}`);
        return lines;
      }
    }
  }
}
