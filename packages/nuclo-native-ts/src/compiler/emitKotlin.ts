/** IR → Kotlin for Android Views, against src/runtimes/android/NucloRuntime.kt. */
import type { ClassDecl, Expr, FnDecl, Op, Program, Stmt, Ty } from "./ir.ts";
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
    for (const g of program.globals) out.push(...this.stmt(g, ""));
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
    const params = fn.params.map((p) => `${this.name(p.name)}: ${this.ty(p.ty)}${p.default ? ` = ${this.expr(p.default, ind)}` : ""}`).join(", ");
    const ret = fn.ret.k === "void" ? "" : `: ${this.ty(fn.ret)}`;
    return [`${ind}${fn.async ? "suspend " : ""}fun ${this.name(fn.name)}(${params})${ret} {`, ...this.block(fn.body, ind + INDENT), `${ind}}`];
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
        return x.fnRef ? `::${this.name(x.name)}` : this.name(x.name);
      case "call":
        return this.call(this.callee(x.callee, ind), x.args, [], ind, (l) => `${l} = `);
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
    const names = this.paramNames(x.params, () => "_");
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
    const fn = (x: Expr) => (this.canTrail(x as Extract<Expr, { e: "lambda" }>) ? ` ${e(x)}` : `(${e(x)})`);
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
        return `${r()}.trim()`;
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
