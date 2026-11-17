/** IR → Kotlin for Android Views, against src/runtimes/android/NucloRuntime.kt. */
import type { ClassDecl, Expr, FnDecl, MethodDecl, ObjectClassDecl, Op, Program, ProtocolDecl, Stmt, Ty } from "./ir.ts";
import { INDENT, Printer } from "./printer.ts";

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
};

export const KOTLIN_PACKAGE = "dev.nuclo.app";

export function emitKotlin(program: Program): string {
  return new KotlinPrinter().print(program);
}

class KotlinPrinter extends Printer {
  protected readonly keywords = KEYWORDS;
  /** The class whose members are being printed: `this` is `this@Name` (a lambda inside a method may have a receiver of its own). */
  private self?: ObjectClassDecl;

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
    for (const p of program.protocols ?? []) out.push(...this.protocolDecl(p), "");
    for (const cls of program.objectClasses ?? []) out.push(...this.objectClassDecl(cls), "");
    // Fields, not properties: a property `count` would get a JVM setter named like a function `setCount`.
    for (const g of program.globals) out.push(...this.stmt(g, "").map((line, at) => (at === 0 ? `@JvmField ${line}` : line)));
    if (program.globals.length) out.push("");
    for (const fn of program.functions) out.push(...this.fn(fn), "");
    out.push("fun nucloMain() {", ...this.block(program.main, INDENT), "}", "");
    out.push("class MainActivity : NucloActivity({ nucloMain() })", "");
    return out.join("\n");
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    const fields = cls.fields.map((f) => `${i1}${f.readonly ? "val" : "var"} ${this.name(f.name)}: ${this.ty(f.ty)}${f.optional ? " = null" : ""},`);
    const lines = [`class ${cls.name}(`, ...fields, ")"];
    if (cls.decodable) {
      lines[lines.length - 1] = ") {";
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
    return [`${ind}${fn.async ? "suspend " : ""}${this.signature(fn.name, fn.params, fn.ret, ind)} {`, ...this.block(fn.body, ind + INDENT), `${ind}}`];
  }

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
      lines.push(`${i1}${override}${zero === undefined ? "lateinit " : ""}var ${this.name(f.name)}: ${this.ty(f.ty)}${zero === undefined ? "" : ` = ${zero}`}`);
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
    const modifiers = `${m.abstract ? "abstract " : m.overrides || m.implements ? "" : open}${m.overrides || m.implements ? "override " : ""}`;
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
        return `mutableListOf<${this.ty(t.of)}>()`;
      case "map":
        return `mutableMapOf<String, ${this.ty(t.of)}>()`;
      default:
        return undefined;
    }
  }

  protected ty(t: Ty): string {
    switch (t.k) {
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
    }
  }

  protected str(v: string): string {
    return `"${this.escape(v)}"`;
  }

  private escape(v: string): string {
    return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  }

  protected special(x: Expr, ind: string): string {
    switch (x.e) {
      case "nil":
        return "null";
      case "tpl":
        return `"${x.parts.map((p) => (typeof p === "string" ? this.escape(p) : `\${${this.interpolated(p, ind)}}`)).join("")}"`;
      case "id":
        if (x.name === "this") return this.self ? `this@${this.self.name}` : "this";
        return x.fnRef ? `::${this.name(x.name)}` : this.name(x.name);
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
        return `${this.expr(x.l, ind)} ?: ${this.expr(x.r, ind)}`;
      case "toDouble":
        return `${this.postfixOperand(x.x, ind)}.toDouble()`;
      case "toInt":
        return `${this.postfixOperand(x.x, ind)}.toInt()`;
      case "toStr":
        return x.from.k === "double" ? `jsNum(${this.expr(x.x, ind)})` : `${this.postfixOperand(x.x, ind)}.toString()`;
      case "new":
        return this.call(x.cls, [], x.args, ind, (l) => `${this.name(l)} = `);
      case "arr":
        return this.call(`mutableListOf<${this.ty(x.of)}>`, x.items, [], ind, () => "", false);
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
      case "launch":
        return `launch { ${this.expr(x.call, ind)} }`;
      default:
        return `/* ${x.e} */`;
    }
  }

  protected override expr(x: Expr, ind: string): string {
    // `"key" to value` inside mutableMapOf.
    if (x.e === "rt" && x.name === "__pair") return `${this.expr(x.args[0]!, ind)} to ${this.expr(x.args[1]!, ind)}`;
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
    const [a, b, c] = args;
    const r = () => this.postfixOperand(a!, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // A lambda trails; a function reference (`::format`) is an argument.
    const fn = (x: Expr) => (x.e === "lambda" && this.canTrail(x) ? ` ${e(x)}` : `(${e(x)})`);
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
      case "arr.splice":
        return `${r()}.jsSplice(${e(b!)}, ${e(c!)})`;
      case "arr.indexOf":
        return `${r()}.indexOf(${e(b!)})`;
      case "arr.includes":
        return `${r()}.contains(${e(b!)})`;
      case "arr.find":
        return `${r()}.find${fn(b!)}`;
      case "arr.findIndex":
        return `${r()}.indexOfFirst${fn(b!)}`;
      case "arr.filter":
        return `${r()}.filter${fn(b!)}.toMutableList()`;
      case "arr.map":
        return `${r()}.map${fn(b!)}.toMutableList()`;
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
        return `${r()}.lastIndexOf(${e(b!)})`;
      case "arr.atRel":
        return `${r()}.jsAtRel(${e(b!)})`;
      case "arr.reduce":
        return `${r()}.fold(${e(c!)})${fn(b!)}`;
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
      case "str.split":
        return `${r()}.jsSplit(${e(b!)})`;
      case "str.replace":
      case "str.replaceAll":
        return `${r()}.jsReplace(${e(b!)}, ${e(c!)}, ${op === "str.replaceAll"})`;
      case "str.indexOf":
        return `${r()}.jsIndexOf(${e(b!)}, ${e(c!)})`;
      case "str.lastIndexOf":
        return `${r()}.lastIndexOf(${e(b!)})`;
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
      case "math.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v;
        const x = args.slice(1).map(e);
        const special: Record<string, string> = {
          sign: `jsSign(${x[0]})`, isInteger: `jsIsInteger(${x[0]})`, isNaN: `(${x[0]}).isNaN()`, isFinite: `(${x[0]}).isFinite()`,
          Infinity: "Double.POSITIVE_INFINITY", NaN: "Double.NaN", log: `kotlin.math.ln(${x[0]})`, log1p: `kotlin.math.ln1p(${x[0]})`,
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
        return `${r()}.pow(${e(b!)})`;
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
        return `jsParseInt(${e(a!)})`;
      case "error.message":
        return `jsErrorMessage(${e(a!)})`;
      case "error.text":
        return `(${this.postfixOperand(a!, ind)}.message ?: ${this.postfixOperand(a!, ind)}.javaClass.simpleName)`;
    }
  }

  protected stmt(s: Stmt, ind: string): string[] {
    const i2 = ind + INDENT;
    switch (s.s) {
      case "let": {
        const keyword = s.mutable ? "var" : "val";
        if (!s.init) return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)}${s.ty.k === "optional" ? " = null" : ""}`];
        return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)} = ${this.expr(s.init, ind)}`];
      }
      case "assign":
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
        return [`${ind}for (${this.name(s.name)} in ${this.expr(s.of, ind)}) {`, ...this.block(s.body, i2), `${ind}}`];
      case "forRange":
        return [`${ind}for (${this.name(s.name)} in ${this.expr(s.from, ind)}${s.inclusive ? ".." : " until "}${this.expr(s.to, ind)}) {`, ...this.block(s.body, i2), `${ind}}`];
      case "while":
        return [`${ind}while (${this.expr(s.c, ind)}) {`, ...this.block(s.body, i2), `${ind}}`];
      case "return":
        return [s.x ? `${ind}return ${this.expr(s.x, ind)}` : `${ind}return`];
      case "break":
        return [`${ind}break`];
      case "continue":
        return [`${ind}continue`];
      case "try":
        return [
          `${ind}try {`,
          ...this.block(s.body, i2),
          `${ind}} catch (${s.catchName ? this.name(s.catchName) : "ignored"}: Exception) {`,
          ...this.block(s.catchBody, i2),
          `${ind}}`,
        ];
      case "throw":
        return [`${ind}throw Exception(${this.expr(s.message, ind)})`];
      case "unreachable":
        return [`${ind}error("unreachable")`];
      case "fn":
        return this.fn(s.decl, ind);
      case "switch": {
        const lines = [`${ind}when (${this.expr(s.x, ind)}) {`];
        for (const c of s.cases) lines.push(`${i2}${c.values.map((v) => this.expr(v, i2)).join(", ")} -> {`, ...this.block(c.body, i2 + INDENT), `${i2}}`);
        lines.push(`${i2}else -> {`, ...this.block(s.default ?? [], i2 + INDENT), `${i2}}`, `${ind}}`);
        return lines;
      }
    }
  }
}
