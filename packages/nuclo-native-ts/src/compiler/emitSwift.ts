/** IR → Swift 5.9+ for UIKit, against src/runtimes/ios/NucloRuntime.swift. */
import type { ClassDecl, Expr, FnDecl, Op, Program, Stmt, Ty } from "./ir.ts";
import { INDENT, Printer } from "./printer.ts";

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
};

export function emitSwift(program: Program): string {
  return new SwiftPrinter().print(program);
}

class SwiftPrinter extends Printer {
  protected readonly keywords = KEYWORDS;
  protected override readonly noTrailingComma = true;

  print(program: Program): string {
    const out = [this.header(program, "//"), "#if canImport(UIKit)", "import UIKit", "#else", "import AppKit", "#endif", ""];
    for (const cls of program.classes) out.push(...this.classDecl(cls), "");
    for (const g of program.globals) out.push(...this.stmt(g, "").map((l) => `@MainActor ${l}`));
    if (program.globals.length) out.push("");
    for (const fn of program.functions) out.push(...this.fn(fn), "");
    out.push("@MainActor func nucloMain() {", ...this.block(program.main, INDENT), "}", "");
    out.push("@main", "final class AppDelegate: NucloAppDelegate {", `${INDENT}override func start() {`, `${INDENT}${INDENT}nucloMain()`, `${INDENT}}`, "}", "");
    return out.join("\n");
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const i2 = INDENT + INDENT;
    const lines = [`@MainActor final class ${cls.name} {`];
    for (const f of cls.fields) lines.push(`${i1}${f.readonly ? "let" : "var"} ${this.name(f.name)}: ${this.ty(f.ty)}`);
    lines.push("");
    // a stored closure parameter must be @escaping (an optional one already is)
    const params = cls.fields.map((f) => `${this.name(f.name)}: ${f.ty.k === "fn" && !f.optional ? "@escaping " : ""}${this.ty(f.ty)}${f.optional ? " = nil" : ""}`).join(", ");
    lines.push(`${i1}init(${params}) {`);
    for (const f of cls.fields) lines.push(`${i2}self.${this.name(f.name)} = ${this.name(f.name)}`);
    lines.push(`${i1}}`);
    if (cls.decodable) {
      lines.push("", `${i1}static func decode(_ json: Any?) throws -> ${cls.name} {`, `${i2}let object = try NJSON.object(json)`);
      const args = cls.fields.map((f) => `${this.name(f.name)}: ${this.decode(f.ty, `object["${f.name}"]`, 0)}`);
      lines.push(`${i2}return ${cls.name}(`, ...args.map((a, i) => `${i2}${INDENT}${a}${i < args.length - 1 ? "," : ""}`), `${i2})`, `${i1}}`);
    }
    lines.push("}");
    return lines;
  }

  /** An expression decoding `value` (an `Any?` from JSONSerialization) into `ty`. */
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
    const effects = fn.async ? " async throws" : "";
    const ret = fn.ret.k === "void" ? "" : ` -> ${this.ty(fn.ret)}`;
    const attrs = local ? (fn.ret.k === "void" ? "" : "@discardableResult ") : fn.ret.k === "void" ? "@MainActor " : "@MainActor @discardableResult ";
    return [`${ind}${attrs}func ${this.name(fn.name)}(${params})${effects}${ret} {`, ...this.block(fn.body, ind + INDENT), `${ind}}`];
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
        return "Bool";
      case "void":
        return "Void";
      case "array":
        return `[${this.ty(t.of)}]`;
      case "map":
        return `[String: ${this.ty(t.of)}]`;
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
    return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
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
        return `"${x.parts.map((p) => (typeof p === "string" ? this.escape(p) : `\\(${this.interpolated(p, ind).replace(/,\n\s*/g, ", ").replace(/\n\s*/g, "")})`)).join("")}"`;
      case "id":
        return this.name(x.name);
      case "call":
        return this.awaited(this.call(this.postfixOperand(x.callee, ind), x.args, [], ind, (l) => `${l}: `), !!x.await);
      case "rt":
        return this.awaited(this.call(this.runtimeName(x.name), x.args, x.named ?? [], ind, (l) => `${l}: `), !!x.await);
      case "method":
        return this.awaited(this.call(`${this.postfixOperand(x.obj, ind)}.${this.name(x.name)}`, x.args, [], ind, (l) => `${l}: `), !!x.await);
      case "cond":
        return `${this.expr(x.c, ind)} ? ${this.expr(x.a, ind)} : ${this.expr(x.b, ind)}`;
      case "unwrap":
        return `${this.postfixOperand(x.x, ind)}!`;
      case "coalesce":
        return `${this.expr(x.l, ind)} ?? ${this.expr(x.r, ind)}`;
      case "toDouble":
        return `Double(${this.expr(x.x, ind)})`;
      case "toInt":
        return `Int(${this.expr(x.x, ind)})`;
      case "toStr":
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
      const body = this.expr(x.body, ind + INDENT);
      if (!body.includes("\n") && body.length + ind.length < 90) return `{${head} ${body} }`;
      return `{${head}\n${ind + INDENT}${body}\n${ind}}`;
    }
    const lines = this.block(x.body, ind + INDENT);
    if (lines.length === 1 && !lines[0]!.trimStart().startsWith("return") && lines[0]!.length < 80) return `{${head} ${lines[0]!.trim()} }`;
    return `{${head}\n${lines.join("\n")}\n${ind}}`;
  }

  protected op(op: Op, args: Expr[], ind: string, awaited: boolean): string {
    const [a, b, c] = args;
    const r = () => this.postfixOperand(a!, ind);
    const e = (x: Expr) => this.expr(x, ind);
    const trailing = (x: Expr) => this.lambda(x as Extract<Expr, { e: "lambda" }>, ind);
    let s: string;
    switch (op) {
      case "arr.length":
      case "str.length":
        s = `${r()}.count`;
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
      case "arr.splice":
        s = `${r()}.jsSplice(${e(b!)}, ${e(c!)})`;
        break;
      case "arr.indexOf":
        s = `${r()}.jsIndexOf(${e(b!)})`;
        break;
      case "arr.includes":
        s = `${r()}.jsIncludes(${e(b!)})`;
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
        s = `${r()}.lowercased()`;
        break;
      case "str.includes":
        s = `${r()}.contains(${e(b!)})`;
        break;
      case "str.startsWith":
        s = `${r()}.hasPrefix(${e(b!)})`;
        break;
      case "str.endsWith":
        s = `${r()}.hasSuffix(${e(b!)})`;
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
        s = `Swift.min(${args.map(e).join(", ")})`;
        break;
      case "math.max":
        s = `Swift.max(${args.map(e).join(", ")})`;
        break;
      case "math.sqrt":
        s = `${r()}.squareRoot()`;
        break;
      case "math.pow":
        s = `Foundation.pow(${e(a!)}, ${e(b!)})`;
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
        s = `jsParseInt(${e(a!)})`;
        break;
      case "error.message":
        s = `jsErrorMessage(${e(a!)})`;
        break;
    }
    return this.awaited(s, awaited);
  }

  /** A trailing closure can't appear bare in a statement condition. */
  private condition(c: Expr, ind: string): string {
    const s = this.expr(c, ind);
    return s.includes("{") ? `(${s})` : s;
  }

  protected stmt(s: Stmt, ind: string): string[] {
    const i2 = ind + INDENT;
    switch (s.s) {
      case "let": {
        const keyword = s.mutable || s.ty.k === "array" || s.ty.k === "map" ? "var" : "let";
        if (!s.init) return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)}${s.ty.k === "optional" ? " = nil" : ""}`];
        return [`${ind}${keyword} ${this.name(s.name)}: ${this.ty(s.ty)} = ${this.expr(s.init, ind)}`];
      }
      case "assign":
        return [`${ind}${this.expr(s.target, ind)} ${s.op} ${this.expr(s.value, ind)}`];
      case "expr":
        return [`${ind}${this.expr(s.x, ind)}`];
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
      case "forOf":
        return [`${ind}for ${this.name(s.name)} in ${this.expr(s.of, ind)} {`, ...this.block(s.body, i2), `${ind}}`];
      case "forRange":
        return [
          `${ind}for ${this.name(s.name)} in Swift.stride(from: ${this.expr(s.from, ind)}, ${s.inclusive ? "through" : "to"}: ${this.expr(s.to, ind)}, by: 1) {`,
          ...this.block(s.body, i2),
          `${ind}}`,
        ];
      case "while":
        return [`${ind}while ${this.condition(s.c, ind)} {`, ...this.block(s.body, i2), `${ind}}`];
      case "return":
        return [s.x ? `${ind}return ${this.expr(s.x, ind)}` : `${ind}return`];
      case "break":
        return [`${ind}break`];
      case "continue":
        return [`${ind}continue`];
      case "try":
        return [
          `${ind}do {`,
          ...this.block(s.body, i2),
          // Bound by name: Swift's implicit `error` would hide an app variable called `error`.
          `${ind}} catch ${s.catchName ? `let ${this.name(s.catchName)}` : "_"} {`,
          ...this.block(s.catchBody, i2),
          `${ind}}`,
        ];
      case "throw":
        return [`${ind}throw NError(${this.expr(s.message, ind)})`];
      case "fn":
        return this.fn(s.decl, ind, true);
      case "switch": {
        const lines = [`${ind}switch ${this.expr(s.x, ind)} {`];
        for (const c of s.cases) {
          lines.push(`${ind}case ${c.values.map((v) => this.expr(v, ind)).join(", ")}:`, ...(c.body.length ? this.block(c.body, i2) : [`${i2}break`]));
        }
        lines.push(`${ind}default:`, ...(s.default?.length ? this.block(s.default, i2) : [`${i2}break`]), `${ind}}`);
        return lines;
      }
    }
  }
}
