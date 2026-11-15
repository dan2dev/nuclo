/**
 * IR → Rust, against src/runtimes/rust (a backend-independent core and a GTK 4 backend).
 *
 * Swift and Kotlin infer types, promote `T` to `T?`, overload on closures and collect garbage.
 * Rust does none of that, so this printer does what the other two leave to their compilers:
 *  - it types every expression from the IR's declarations (`typeOf`), to wrap a value going into
 *    an optional slot in `Some`, to tell `A::text(value)` from `A::text_fn(|| value)`, and to
 *    compare an optional with a value;
 *  - it gives JavaScript's sharing explicitly: interfaces are `Rc` structs with `Var` fields,
 *    arrays and maps are shared handles, globals are thread-local `Var`s, and a local that a
 *    closure captures and something reassigns lives in an `Rc<Var>`;
 *  - closures are `move` closures over clones of what they capture, and a local function that
 *    reads its enclosing function's locals takes them as extra parameters.
 * Errors are `Result`s: every `async fn` returns one, and a `try` block is a labelled block that
 * a failing call breaks out of.
 */
import type { BinOp, ClassDecl, Expr, FnDecl, Op, Param, Program, Stmt, Ty } from "./ir.ts";
import { INDENT, Printer } from "./printer.ts";

// Strict and reserved words. `self`, `Self`, `super` and `crate` can't be raw identifiers: they get a suffix.
const KEYWORDS = new Set([
  "as", "async", "await", "break", "const", "continue", "dyn", "else", "enum", "extern", "false", "fn", "for", "gen", "if", "impl", "in",
  "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "static", "struct", "trait", "true", "type", "unsafe", "use",
  "where", "while", "abstract", "become", "box", "do", "final", "macro", "override", "priv", "try", "typeof", "unsized", "virtual", "yield",
]);
const UNRAWABLE = new Set(["self", "Self", "super", "crate", "_"]);

const RUNTIME_TYPES: Record<string, string> = { NodeMod: "Mod", Outlet: "Router", Error: "JsError" };

/** Runtime types read without a clone. */
const COPY_RUNTIME_TYPES = new Set(["Style", "NativeElement", "PointerEvent", "ScrollEvent"]);

/** The Style properties, and how a value is written: a number, a parsed colour or font, an enum, a nested style. */
const STYLE: Record<string, "number" | "color" | "enum" | "font" | "state"> = {
  flexDirection: "enum", alignItems: "enum", alignSelf: "enum", justifyContent: "enum", flexWrap: "enum", flex: "number", gap: "number",
  margin: "number", marginTop: "number", marginRight: "number", marginBottom: "number", marginLeft: "number",
  padding: "number", paddingTop: "number", paddingRight: "number", paddingBottom: "number", paddingLeft: "number",
  width: "number", widthPct: "number", height: "number", minWidth: "number", maxWidth: "number", minHeight: "number", maxHeight: "number", aspectRatio: "number",
  overflow: "enum", position: "enum", top: "number", right: "number", bottom: "number", left: "number", zIndex: "number", display: "enum",
  backgroundColor: "color", color: "color", opacity: "number", borderRadius: "number", borderWidth: "number", borderColor: "color",
  shadowColor: "color", shadowRadius: "number", shadowOffsetX: "number", shadowOffsetY: "number",
  fontSize: "number", fontWeight: "enum", fontStyle: "enum", fontFamily: "font", lineHeight: "number", letterSpacing: "number",
  textAlign: "enum", textDecoration: "enum", numberOfLines: "number",
  translateX: "number", translateY: "number", scale: "number", rotate: "number",
  transitionDuration: "number", transitionDelay: "number", transitionEasing: "enum",
  pressed: "state", hover: "state", focused: "state",
};

const TAGS = new Set([
  "div", "section", "header", "footer", "main", "nav", "article", "aside", "form", "ul", "li", "span", "p", "h1", "h2", "h3", "h4",
  "label", "strong", "small", "em", "button", "input", "checkbox", "textarea", "img",
]);

/** Attributes that take a value or a `() => value`, and whether the value is passed as `&str`. */
const DYNAMIC_ATTRS: Record<string, boolean> = {
  text: true, value: true, placeholder: true, src: true, href: true, ariaLabel: true, style: false, className: false, checked: false, disabled: false,
};
const HANDLER_ATTRS = new Set([
  "onClick", "onInput", "onChange", "onFocus", "onBlur", "onKeyDown", "onPointerDown", "onPointerMove", "onPointerUp", "onPointerCancel",
  "onLongPress", "onDoubleClick", "onPan", "onPinch", "onScroll", "onMount", "onDestroy",
]);

const PRECEDENCE: Record<BinOp, number> = {
  "*": 6, "/": 6, "%": 6, "+": 5, "-": 5, "<": 4, "<=": 4, ">": 4, ">=": 4, "==": 3, "!=": 3, "===": 3, "!==": 3, "&&": 2, "||": 1,
};

/** What the printer knows about a name. */
type Binding =
  | { kind: "global"; ty: Ty }
  /** `boxed`: an `Rc<Var<T>>`, because a closure captures it and something reassigns it. */
  | { kind: "local"; ty: Ty; boxed: boolean }
  /** `captures`: the enclosing function's locals a local function reads, passed as extra arguments. */
  | { kind: "fn"; decl: FnDecl; captures: Map<string, Local>; native?: boolean };

type Local = Extract<Binding, { kind: "local" }>;
type Fn = Extract<Binding, { kind: "fn" }>;

/** Types only the printer has: `null` itself, a Style enum value, and "could not tell". */
type Typ = Ty | { k: "nil" } | { k: "enum" } | { k: "unknown" };

const UNKNOWN: Typ = { k: "unknown" };
const rt = (name: string): Typ => ({ k: "rt", name }) as Typ;
const snake = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const pascal = (name: string) => name[0]!.toUpperCase() + name.slice(1);

type Lambda = Extract<Expr, { e: "lambda" }>;

/** Every identifier read or written under `node`, nested closures included. */
function names(node: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) for (const item of node) names(item, out);
  else if (node && typeof node === "object") {
    const x = node as { e?: string; name?: string };
    if (x.e === "id" && x.name) out.add(x.name);
    for (const value of Object.values(node)) names(value, out);
  }
  return out;
}

/** The identifiers that closures and local functions under `node` use: what they capture. */
function captured(node: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) for (const item of node) captured(item, out);
  else if (node && typeof node === "object") {
    const x = node as { e?: string; s?: string };
    if (x.e === "lambda" || x.s === "fn") names(node, out);
    else for (const value of Object.values(node)) captured(value, out);
  }
  return out;
}

export interface RustOptions {
  /** Receives what the app uses that this target does not implement (the app still builds). */
  warn?: (message: string) => void;
  /** The app has a `native/linux/` folder, where its `declare function`s and native components are. */
  native?: boolean;
}

export function emitRust(program: Program, options: RustOptions = {}): string {
  return new RustPrinter(options).print(program);
}

class RustPrinter extends Printer {
  protected readonly keywords = KEYWORDS;
  private classes = new Map<string, ClassDecl>();
  private scopes: Map<string, Binding>[] = [new Map()];
  /** The function being printed: its return type, whether it returns a `Result`, the names its closures capture. */
  private frame = { ret: { k: "void" } as Ty, result: false, captured: new Set<string>() };
  /** The innermost `try` block's label: where a failing call goes. */
  private tryLabel: string | undefined;
  private tryCount = 0;
  private warned = new Set<string>();

  private readonly options: RustOptions;

  constructor(options: RustOptions) {
    super();
    this.options = options;
  }

  private unsupported(what: string) {
    if (this.warned.has(what)) return;
    this.warned.add(what);
    this.options.warn?.(`linux: ${what} is not implemented by the Rust runtime; it is ignored.`);
  }

  // ---------------------------------------------------------------------------
  // The program
  // ---------------------------------------------------------------------------

  print(program: Program): string {
    for (const cls of program.classes) this.classes.set(cls.name, cls);
    for (const g of program.globals) this.declare(g.name, { kind: "global", ty: g.ty });
    for (const fn of program.functions) this.declare(fn.name, { kind: "fn", decl: fn, captures: new Map() });
    for (const fn of program.natives ?? []) {
      this.declare(fn.name, { kind: "fn", decl: fn, captures: new Map(), native: true });
      if (!this.options.native) this.options.warn?.(`linux: ${fn.name}() is declared but native/linux/mod.rs, where the app implements it, does not exist: cargo will not find it.`);
    }
    const out = [
      this.header(program, "//"),
      // The names are the app's (camelCase functions, lowercase globals), and the printer is not
      // a linter: it clones and parenthesizes more than a person would.
      "#![allow(non_snake_case, non_upper_case_globals, non_camel_case_types, unused, clippy::all)]",
      "",
      "use crate::native::*;",
      "use crate::nuclo::prelude::*;",
      "",
    ];
    for (const cls of program.classes) out.push(...this.classDecl(cls), "");
    if (program.globals.length) {
      out.push("/// The app's top-level variables. `nuclo_main` runs their initializers in order.", "mod g {", `${INDENT}use super::*;`, `${INDENT}thread_local! {`);
      for (const g of program.globals) out.push(`${INDENT}${INDENT}pub static ${this.name(g.name)}: Var<${this.ty(g.ty)}> = const { Var::empty() };`);
      out.push(`${INDENT}}`, "}", "");
    }
    for (const fn of program.functions) out.push(...this.fn(fn, "", new Map()), "");
    out.push("pub fn nuclo_main() {");
    for (const g of program.globals) {
      const init = g.init ? this.coerce(g.init, g.ty, INDENT) : "None";
      out.push(`${INDENT}g::${this.name(g.name)}.set(${init});`);
    }
    this.frame = { ret: { k: "void" }, result: false, captured: captured(program.main) };
    out.push(...this.scoped(() => this.body(program.main, INDENT)), "}", "");
    return out.join("\n");
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const lines = [`pub struct ${cls.name} {`, ...cls.fields.map((f) => `${i1}pub ${this.name(f.name)}: Var<${this.ty(f.ty)}>,`), "}", ""];
    // `===` is identity: two objects with the same fields are different objects.
    lines.push(`impl PartialEq for ${cls.name} {`, `${i1}fn eq(&self, other: &Self) -> bool {`, `${i1}${i1}std::ptr::eq(self, other)`, `${i1}}`, "}");
    if (cls.decodable) {
      lines.push(
        "",
        `impl ${cls.name} {`,
        `${i1}pub fn from_json(json: &Json) -> Result<Rc<${cls.name}>, JsError> {`,
        `${i1}${i1}Ok(Rc::new(${cls.name} {`,
        ...cls.fields.map((f) => `${i1}${i1}${i1}${this.name(f.name)}: Var::new(${this.decode(f.ty, `json::field(json, ${this.str(f.name)})?`, 0)}?),`),
        `${i1}${i1}}))`,
        `${i1}}`,
        "}",
      );
    }
    return lines;
  }

  /** A `Result` decoding `value` (a `&Json`) into `ty`. */
  private decode(ty: Ty, value: string, depth: number): string {
    const v = `v${depth}`;
    switch (ty.k) {
      case "string":
        return `json::string(${value})`;
      case "int":
        return `json::int(${value})`;
      case "double":
        return `json::double(${value})`;
      case "bool":
        return `json::bool(${value})`;
      case "class":
        return `${ty.name}::from_json(${value})`;
      case "array":
      case "optional":
      case "map":
        return `json::${ty.k}(${value}, |${v}| ${this.decode(ty.of, v, depth + 1)})`;
      default:
        return `Err(JsError::new("Cannot decode this type"))`;
    }
  }

  /** A function item. `captures` are an enclosing function's locals, appended to the parameters. */
  private fn(fn: FnDecl, ind: string, captures: Map<string, Local>): string[] {
    const saved = { frame: this.frame, tryLabel: this.tryLabel };
    const extra = [...captures].map(([name, binding]) => ({ name, binding, ty: binding.boxed ? `Rc<Var<${this.ty(binding.ty)}>>` : this.ty(binding.ty) }));
    this.frame = { ret: fn.ret, result: fn.async, captured: captured(fn.body) };
    this.tryLabel = undefined;
    const lines = this.scoped(() => {
      for (const p of fn.params) this.declare(p.name, { kind: "local", ty: p.ty, boxed: false });
      for (const c of extra) this.declare(c.name, c.binding);
      const params = [...fn.params.map((p) => `${this.name(p.name)}: ${this.ty(p.ty)}`), ...extra.map((c) => `${this.name(c.name)}: ${c.ty}`)].join(", ");
      const value = fn.ret.k === "void" ? "()" : this.ty(fn.ret);
      const ret = fn.async ? ` -> Result<${value}, JsError>` : fn.ret.k === "void" ? "" : ` -> ${value}`;
      const body = this.body(fn.body, ind + INDENT);
      if (fn.async && fn.ret.k === "void") body.push(`${ind + INDENT}Ok(())`);
      // A value on every path, but not one Rust sees after a loop or a try.
      else if (fn.ret.k !== "void" && ["try", "while", "forOf", "forRange"].includes(fn.body.at(-1)?.s ?? "")) body.push(`${ind + INDENT}unreachable!()`);
      return [`${ind}${ind ? "" : "pub "}${fn.async ? "async " : ""}fn ${this.name(fn.name)}(${params})${ret} {`, ...body, `${ind}}`];
    });
    this.frame = saved.frame;
    this.tryLabel = saved.tryLabel;
    return lines;
  }

  // ---------------------------------------------------------------------------
  // Names and scopes
  // ---------------------------------------------------------------------------

  protected override name(n: string): string {
    return UNRAWABLE.has(n) ? `${n}_` : KEYWORDS.has(n) ? `r#${n}` : n;
  }

  private declare(name: string, binding: Binding) {
    this.scopes.at(-1)!.set(name, binding);
  }

  private lookup(name: string): Binding | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const found = this.scopes[i]!.get(name);
      if (found) return found;
    }
    return undefined;
  }

  private scoped<T>(print: () => T): T {
    this.scopes.push(new Map());
    try {
      return print();
    } finally {
      this.scopes.pop();
    }
  }

  /**
   * A block's statements in a new scope. Its local functions are declared first (JavaScript
   * hoists them), each with the locals it captures: the block's own, declared anywhere in it,
   * and those of the functions it calls.
   */
  private body(stmts: Stmt[], ind: string): string[] {
    return this.scoped(() => {
      const lets = new Map<string, Local>();
      for (const s of stmts) if (s.s === "let") lets.set(s.name, { kind: "local", ty: s.ty, boxed: this.boxed(s) });
      const fns = stmts.flatMap((s) => (s.s === "fn" ? [{ decl: s.decl, used: names(s.decl), binding: { kind: "fn", decl: s.decl, captures: new Map() } as Fn }] : []));
      for (const fn of fns) this.declare(fn.decl.name, fn.binding);
      for (let changed = fns.length > 0; changed; ) {
        changed = false;
        for (const fn of fns) {
          const own = new Set(fn.decl.params.map((p) => p.name));
          for (const name of fn.used) {
            const binding = lets.get(name) ?? this.lookup(name);
            const wanted: [string, Local][] = binding?.kind === "local" ? [[name, binding]] : binding?.kind === "fn" ? [...binding.captures] : [];
            for (const [capture, local] of wanted) {
              if (own.has(capture) || fn.binding.captures.has(capture)) continue;
              fn.binding.captures.set(capture, local);
              changed = true;
            }
          }
        }
      }
      return stmts.flatMap((s) => this.stmt(s, ind));
    });
  }

  private boxed(s: Extract<Stmt, { s: "let" }>): boolean {
    return s.mutable && this.frame.captured.has(s.name);
  }

  // ---------------------------------------------------------------------------
  // Types
  // ---------------------------------------------------------------------------

  protected ty(t: Ty): string {
    switch (t.k) {
      case "int":
        return "i64";
      case "double":
        return "f64";
      case "string":
        return "String";
      case "bool":
        return "bool";
      case "void":
        return "()";
      case "array":
        return this.isMods(t) ? "Vec<Mod>" : `Arr<${this.ty(t.of)}>`;
      case "map":
        return `Map<${this.ty(t.of)}>`;
      case "optional":
        return `Option<${this.ty(t.of)}>`;
      case "class":
        return `Rc<${t.name}>`;
      case "fn":
        return `Rc<dyn Fn(${t.params.map((p) => this.ty(p)).join(", ")})${t.ret.k === "void" ? "" : ` -> ${this.ty(t.ret)}`}>`;
      case "rt":
        return RUNTIME_TYPES[t.name] ?? t.name;
    }
  }

  /** A builder's children: `Vec<Mod>`, each child converted with `Mod::from`. */
  private isMods(t: Typ): boolean {
    return t.k === "array" && this.isMod(t.of.k === "optional" ? t.of.of : t.of);
  }

  private isMod(t: Typ): boolean {
    return t.k === "rt" && t.name === "NodeMod";
  }

  private isCopy(t: Typ): boolean {
    return t.k === "int" || t.k === "double" || t.k === "bool" || t.k === "void" || t.k === "enum" || (t.k === "rt" && COPY_RUNTIME_TYPES.has(t.name));
  }

  private isRt(t: Typ, name: string): boolean {
    return t.k === "rt" && t.name === name;
  }

  private typeOf(x: Expr): Typ {
    switch (x.e) {
      case "int":
        return { k: "int" };
      case "double":
      case "toDouble":
        return { k: "double" };
      case "toInt":
        return { k: "int" };
      case "str":
      case "tpl":
      case "toStr":
        return { k: "string" };
      case "bool":
      case "not":
        return { k: "bool" };
      case "nil":
        return { k: "nil" };
      case "id": {
        const b = this.lookup(x.name);
        if (!b) return UNKNOWN;
        return b.kind === "fn" ? { k: "fn", params: b.decl.params.map((p) => p.ty), ret: b.decl.ret } : b.ty;
      }
      case "prop": {
        const obj = this.typeOf(x.obj);
        const field = this.fieldType(obj.k === "optional" ? obj.of : obj, x.name);
        return (x.optional || x.chain) && field.k !== "optional" && field.k !== "unknown" ? { k: "optional", of: field as Ty } : field;
      }
      case "index": {
        const obj = this.typeOf(x.obj);
        return obj.k === "array" || obj.k === "map" ? obj.of : UNKNOWN;
      }
      case "call": {
        const callee = this.typeOf(x.callee);
        if (this.isRt(callee, "Variants")) return rt("StyleClass");
        return callee.k === "fn" ? callee.ret : UNKNOWN;
      }
      case "rt":
        return this.rtType(x.name);
      case "method": {
        if (x.name === "when" || x.name === "else") return rt("WhenBuilder");
        if (x.name === "text") return { k: "string" };
        const decoder = x.args[0];
        if (x.name === "json" && decoder?.e === "decoder") return decoder.ty;
        return { k: "void" };
      }
      case "op": {
        const ty = this.opType(x.op, x.args);
        return x.chain && ty.k !== "optional" && ty.k !== "unknown" ? { k: "optional", of: ty as Ty } : ty;
      }
      case "bin":
        return PRECEDENCE[x.op] >= 5 ? this.typeOf(x.l) : { k: "bool" };
      case "neg":
        return this.typeOf(x.x);
      case "cond": {
        const [a, b] = [this.typeOf(x.a), this.typeOf(x.b)];
        if (a.k === "nil") return b.k === "optional" || b.k === "nil" || b.k === "unknown" ? b : { k: "optional", of: b as Ty };
        if (b.k === "nil" || b.k === "optional") return a.k === "optional" || a.k === "unknown" ? a : b.k === "optional" ? b : { k: "optional", of: a as Ty };
        return a;
      }
      case "unwrap": {
        const inner = this.typeOf(x.x);
        return inner.k === "optional" ? inner.of : inner;
      }
      case "coalesce": {
        const r = this.typeOf(x.r);
        if (r.k !== "nil" && r.k !== "unknown") return r;
        return this.typeOf(x.l);
      }
      case "lambda":
        return { k: "fn", params: x.params.map((p) => p.ty), ret: x.ret };
      case "new":
        return { k: "class", name: x.cls };
      case "arr":
        return { k: "array", of: x.of };
      case "dict":
        return { k: "map", of: x.of };
      case "style":
        return rt("Style");
      case "enum":
        return { k: "enum" };
      case "launch":
        return { k: "void" };
      case "decoder":
        return UNKNOWN;
    }
  }

  private fieldType(obj: Typ, name: string): Typ {
    if (obj.k === "class") return this.classes.get(obj.name)?.fields.find((f) => f.name === name)?.ty ?? UNKNOWN;
    if (obj.k !== "rt") return UNKNOWN;
    const fields: Record<string, Typ> = {
      "NativeEvent.target": rt("InputTarget"),
      "InputTarget.value": { k: "string" },
      "InputTarget.checked": { k: "bool" },
      "Response.ok": { k: "bool" },
      "Response.status": { k: "int" },
      "Router.path": { k: "string" },
      "Router.canGoBack": { k: "bool" },
      "Router.outlet": rt("Outlet"),
      "PanEvent.state": { k: "string" },
      "PinchEvent.state": { k: "string" },
      "KeyboardEvent.key": { k: "string" },
      "PointerEvent.pointerId": { k: "int" },
    };
    // The other fields of the pointer, pan, pinch and scroll events are all doubles.
    return fields[`${obj.name}.${name}`] ?? (obj.name.endsWith("Event") && obj.name !== "NativeEvent" ? { k: "double" } : UNKNOWN);
  }

  private rtType(name: string): Typ {
    if (name.startsWith("A.") || ["scope", "list", "region", "into"].includes(name)) return rt("NodeMod");
    switch (name) {
      case "when":
        return rt("WhenBuilder");
      case "css":
      case "cx":
        return rt("StyleClass");
      case "Variants":
      case "Router":
        return rt(name);
      case "fetch":
        return rt("Response");
      case "setTimeout":
      case "setInterval":
        return rt("Timer");
      case "selectEvent":
        return rt("NativeEvent");
      case "update":
      case "forceUpdate":
      case "render":
      case "delay":
      case "clearTimeout":
      case "clearInterval":
      case "cancelAnimationFrame":
      case "log":
        return { k: "void" };
      case "requestAnimationFrame":
        return rt("Frame");
      case "Compound":
      case "Route":
      case "Tab":
        return UNKNOWN;
      default:
        return rt("Node");
    }
  }

  private opType(op: Op, args: Expr[]): Typ {
    const receiver = (): Typ => {
      const t = args[0] ? this.typeOf(args[0]) : UNKNOWN;
      return t.k === "optional" ? t.of : t;
    };
    const element = (): Typ => {
      const t = receiver();
      return t.k === "array" || t.k === "map" ? { k: "optional", of: t.of } : UNKNOWN;
    };
    switch (op) {
      case "arr.length":
      case "arr.indexOf":
      case "arr.findIndex":
      case "str.length":
      case "math.floor":
      case "math.ceil":
      case "math.round":
      case "math.trunc":
      case "int.parse":
        return { k: "int" };
      case "arr.at":
      case "arr.pop":
      case "arr.find":
      case "map.get":
        return element();
      case "arr.push":
      case "arr.pushAll":
      case "arr.unshift":
      case "arr.forEach":
        return { k: "void" };
      case "arr.splice":
      case "arr.filter":
      case "arr.slice":
        return receiver();
      case "arr.map": {
        const fn = args[1] ? this.typeOf(args[1]) : UNKNOWN;
        return fn.k === "fn" ? { k: "array", of: fn.ret } : UNKNOWN;
      }
      case "arr.includes":
      case "arr.some":
      case "arr.every":
      case "str.includes":
      case "str.startsWith":
      case "str.endsWith":
      case "str.nonEmpty":
        return { k: "bool" };
      case "arr.join":
      case "str.trim":
      case "str.upper":
      case "str.lower":
      case "str.slice":
      case "str.or":
      case "num.toFixed":
      case "error.message":
        return { k: "string" };
      case "math.abs":
      case "math.min":
      case "math.max":
        return args[0] ? this.typeOf(args[0]) : UNKNOWN;
      case "math.sqrt":
      case "math.pow":
      case "math.random":
      case "math.pi":
      case "date.now":
      case "num.parse":
        return { k: "double" };
    }
  }

  // ---------------------------------------------------------------------------
  // Expressions
  // ---------------------------------------------------------------------------

  protected str(v: string): string {
    return `"${this.escape(v)}"`;
  }

  private escape(v: string): string {
    return v
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f]/g, (c) => `\\u{${c.charCodeAt(0).toString(16)}}`);
  }

  /** An owned value. */
  protected override expr(x: Expr, ind: string): string {
    switch (x.e) {
      case "int":
        return x.v;
      case "double":
        return /[.eE]/.test(x.v) ? x.v : `${x.v}.0`;
      case "str":
        return `${this.str(x.v)}.to_string()`;
      case "bool":
        return String(x.v);
      case "nil":
        return "None";
      case "tpl":
        return this.template(x.parts, ind);
      case "id":
        return this.read(x, ind);
      case "prop":
        return this.prop(x, ind);
      case "index": {
        const obj = this.typeOf(x.obj);
        if (obj.k === "map") return `${this.receiver(x.obj, ind)}.get(${this.strRef(x.index, ind)}).unwrap()`;
        return `${this.receiver(x.obj, ind)}.get(${this.expr(x.index, ind)})`;
      }
      case "call":
        return this.callExpr(x, ind);
      case "rt":
        return this.runtime(x, ind);
      case "method":
        return this.method(x, ind);
      case "op":
        return this.op(x.op, x.args, ind, !!x.await, !!x.chain);
      case "bin":
        return this.binary(x, ind);
      case "not":
        return `!${this.atom(x.x, ind)}`;
      case "neg":
        return `-${this.atom(x.x, ind)}`;
      case "cond":
        return `if ${this.expr(x.c, ind)} { ${this.coerce(x.a, this.typeOf(x), ind)} } else { ${this.coerce(x.b, this.typeOf(x), ind)} }`;
      case "unwrap":
        return `${this.atom(x.x, ind)}.unwrap()`;
      case "coalesce": {
        // A match, not `unwrap_or_else`: the fallback may await or fail, which a closure can't.
        const [l, want] = [this.typeOf(x.l), this.typeOf(x)];
        if (l.k !== "optional") return this.expr(x.l, ind);
        const some = want.k === "optional" ? "Some(v__)" : "v__";
        return `match ${this.expr(x.l, ind)} { Some(v__) => ${some}, None => ${this.coerce(x.r, want, ind)} }`;
      }
      case "toDouble":
        return `(${this.atom(x.x, ind)} as f64)`;
      case "toInt":
        return `(${this.atom(x.x, ind)} as i64)`;
      case "toStr":
        return x.from.k === "double" ? `js_num(${this.expr(x.x, ind)})` : x.from.k === "string" ? this.expr(x.x, ind) : `${this.atom(x.x, ind)}.to_string()`;
      case "lambda":
        return `f${x.params.length}(${this.lambda(x, ind)})`;
      case "new":
        return this.construct(x, ind);
      case "arr": {
        const of = x.of.k === "class" && !this.classes.has(x.of.name) ? undefined : x.of;
        if (!of || this.isMods({ k: "array", of })) {
          // The runtime's own lists (children, routes, tabs, compounds) are plain vectors.
          const want: Ty | undefined = of ? { k: "rt", name: "NodeMod" } : undefined;
          return this.layout("vec!", x.items.map((item) => (want ? this.coerce(item, want, ind + INDENT) : this.expr(item, ind + INDENT))), ind, "[]");
        }
        if (!x.items.length) return `Arr::<${this.ty(of)}>::new()`;
        return `Arr::from(${this.layout("vec!", x.items.map((item) => this.coerce(item, of, ind + INDENT)), ind, "[]")})`;
      }
      case "dict": {
        const entries = x.entries.map(([k, v]) => `(${this.str(k)}, ${this.coerce(v, x.of, ind + INDENT)})`);
        return `Map::<${this.ty(x.of)}>::from_pairs(${this.layout("vec!", entries, ind, "[]")})`;
      }
      case "style":
        return this.style(x, ind);
      case "enum":
        return `${x.type}::${pascal(x.member)}`;
      case "decoder":
        return `|json__| ${this.decode(x.ty, "json__", 0)}`;
      case "launch": {
        const call = this.expr({ ...x.call, await: false } as Expr, ind);
        // launch() logs a failure: a native function has none to report.
        const callee = x.call.e === "call" && x.call.callee.e === "id" ? this.lookup(x.call.callee.name) : undefined;
        return callee?.kind === "fn" && callee.native ? `launch(async move { Ok::<_, JsError>(${call}.await) })` : `launch(${call})`;
      }
    }
  }

  protected special(x: Expr, ind: string): string {
    return this.expr(x, ind);
  }

  /** An expression a `.`, `!`, `-` or `as` applies to. */
  private atom(x: Expr, ind: string): string {
    const s = this.expr(x, ind);
    return ["bin", "not", "neg", "cond", "coalesce"].includes(x.e) ? `(${s})` : s;
  }

  /** `name(a, b)`, one argument per line when long. */
  private layout(name: string, parts: string[], ind: string, brackets = "()"): string {
    const [open, close] = [brackets[0]!, brackets[1]!];
    if (parts.some((p) => p.includes("\n")) || name.length + parts.join(", ").length > 110 - ind.length) {
      return `${name}${open}\n${parts.map((p) => `${ind + INDENT}${p},`).join("\n")}\n${ind}${close}`;
    }
    const pad = open === "{" && parts.length ? " " : "";
    return `${name}${open}${pad}${parts.join(", ")}${pad}${close}`;
  }

  /** Reads a variable: a copy for numbers and booleans, a clone (of a handle, or a string) otherwise. */
  private read(x: Extract<Expr, { e: "id" }>, ind: string): string {
    const b = this.lookup(x.name);
    if (!b) return this.name(x.name);
    if (b.kind === "global") return `g::${this.name(x.name)}.get()`;
    if (b.kind === "fn") return this.fnValue(x, ind);
    if (b.boxed) return `${this.name(x.name)}.get()`;
    return this.isCopy(b.ty) ? this.name(x.name) : `${this.name(x.name)}.clone()`;
  }

  /** A plain local, which can be borrowed instead of cloned. */
  private place(x: Expr): string | undefined {
    if (x.e !== "id") return undefined;
    const b = this.lookup(x.name);
    return b?.kind === "local" && !b.boxed ? this.name(x.name) : undefined;
  }

  /** Something a method or a field can be reached on: a local as it is, anything else as a value. */
  private receiver(x: Expr, ind: string): string {
    const local = this.place(x);
    if (local) return local;
    if (x.e === "unwrap") {
      const inner = this.place(x.x);
      if (inner) return `${inner}.as_ref().unwrap()`;
    }
    return this.atom(x, ind);
  }

  /** A `&str`. */
  private strRef(x: Expr, ind: string): string {
    if (x.e === "str") return this.str(x.v);
    return `&${this.receiver(x, ind)}`;
  }

  private template(parts: (string | Expr)[], ind: string): string {
    const args: string[] = [];
    const text = parts
      .map((p) => {
        if (typeof p === "string") return this.escape(p).replace(/[{}]/g, (c) => c + c);
        if (p.e === "str") return this.escape(p.v).replace(/[{}]/g, (c) => c + c);
        // Integers and booleans print as JavaScript prints them; a double goes through js_num.
        if (p.e === "toStr" && p.from.k !== "double") args.push(this.place(p.x) ?? this.expr(p.x, ind));
        else args.push(this.place(p) ?? this.expr(p, ind));
        return "{}";
      })
      .join("");
    return args.length ? this.layout("format!", [`"${text}"`, ...args], ind) : `"${text}".to_string()`;
  }

  private prop(x: Extract<Expr, { e: "prop" }>, ind: string): string {
    const obj = this.typeOf(x.obj);
    if ((x.optional || x.chain) && obj.k === "optional") {
      // `a?.b`: the access runs on the value inside the optional.
      const local = this.place(x.obj);
      return this.scoped(() => {
        this.declare("o__", { kind: "local", ty: obj.of, boxed: false });
        const access = this.prop({ e: "prop", obj: { e: "id", name: "o__" }, name: x.name }, ind);
        const flat = this.fieldType(obj.of, x.name).k === "optional";
        return `${local ? `${local}.as_ref()` : this.atom(x.obj, ind)}.${flat ? "and_then" : "map"}(|o__| ${access})`;
      });
    }
    const on = this.receiver(x.obj, ind);
    if (obj.k === "class") return `${on}.${this.name(x.name)}.get()`;
    if (obj.k === "rt") {
      const accessors: Record<string, string> = {
        "NativeEvent.target": "target.clone()",
        "InputTarget.value": "value.clone()",
        "InputTarget.checked": "checked",
        "Response.ok": "ok()",
        "Response.status": "status",
        "Router.path": "path()",
        "Router.canGoBack": "can_go_back()",
        "Router.outlet": "outlet()",
        "Outlet.outlet": "outlet()",
        "PanEvent.state": "state.clone()",
        "PinchEvent.state": "state.clone()",
        "KeyboardEvent.key": "key.clone()",
      };
      const accessor = accessors[`${obj.name}.${x.name}`];
      if (accessor) return `${on}.${accessor}`;
    }
    return `${on}.${this.name(snake(x.name))}`;
  }

  private binary(x: Extract<Expr, { e: "bin" }>, ind: string): string {
    if (["==", "!=", "===", "!=="].includes(x.op)) return this.equality(x, ind);
    const prec = PRECEDENCE[x.op];
    const comparison = prec === 4;
    const operand = (side: Expr, right: boolean) => {
      const s = this.expr(side, ind);
      if (side.e === "cond" || side.e === "coalesce") return `(${s})`;
      if (side.e !== "bin") return s;
      const inner = PRECEDENCE[side.op];
      // Rust does not chain comparisons: `a < b == c` needs its parentheses.
      return inner < prec || (right && inner === prec) || (comparison && inner <= 4) ? `(${s})` : s;
    };
    return `${operand(x.l, false)} ${x.op} ${operand(x.r, true)}`;
  }

  /** `==` between two values, an optional and a value, or a value and `null`. */
  private equality(x: Extract<Expr, { e: "bin" }>, ind: string): string {
    const not = x.op === "!=" || x.op === "!==";
    if (x.r.e === "nil" || x.l.e === "nil") {
      const other = x.r.e === "nil" ? x.l : x.r;
      return `${this.receiver(other, ind)}.${not ? "is_some" : "is_none"}()`;
    }
    const [lt, rt_] = [this.typeOf(x.l), this.typeOf(x.r)];
    const side = (value: Expr, own: Typ, other: Typ, opposite: Expr) => {
      // A string literal compares as a `&str`: no allocation.
      if (value.e === "str" && own.k === other.k && opposite.e !== "str") return this.str(value.v);
      const s = this.place(value) && own.k === other.k ? this.place(value)! : this.expr(value, ind);
      if (own.k !== "optional" && other.k === "optional") return `Some(${s})`;
      return (value.e === "bin" && PRECEDENCE[value.op] <= 4) || ["cond", "coalesce", "lambda"].includes(value.e) ? `(${s})` : s;
    };
    return `${side(x.l, lt, rt_, x.r)} ${not ? "!=" : "=="} ${side(x.r, rt_, lt, x.l)}`;
  }

  /** A value for a slot of type `want`: `Some(…)` into an optional, `Mod::from` into children, a boxed function. */
  private coerce(x: Expr, want: Typ, ind: string): string {
    if (x.e === "nil") return this.isMod(want) ? "Mod::None" : "None";
    if (want.k === "unknown" || want.k === "nil" || want.k === "void" || want.k === "enum") return this.expr(x, ind);
    if (x.e === "cond") return `if ${this.expr(x.c, ind)} { ${this.coerce(x.a, want, ind)} } else { ${this.coerce(x.b, want, ind)} }`;
    if (want.k === "optional") {
      const have = this.typeOf(x);
      if (have.k === "optional" || have.k === "nil" || have.k === "unknown") return this.expr(x, ind);
      return `Some(${this.coerce(x, want.of, ind)})`;
    }
    if (want.k === "fn") return this.fnValue(x, ind, want);
    if (this.isMod(want)) {
      const have = this.typeOf(x);
      return this.isMod(have) ? this.expr(x, ind) : `${this.atom(x, ind)}.into()`;
    }
    return this.expr(x, ind);
  }

  private construct(x: Extract<Expr, { e: "new" }>, ind: string): string {
    const cls = this.classes.get(x.cls);
    if (!cls) return `${x.cls}::default()`;
    const given = new Map(x.args);
    const fields = cls.fields.map((f) => {
      const value = given.get(f.name);
      return `${this.name(f.name)}: Var::new(${value ? this.coerce(value, f.ty, ind + INDENT) : "None"})`;
    });
    return `Rc::new(${this.layout(`${x.cls} `, fields, ind, "{}")})`;
  }

  private style(x: Extract<Expr, { e: "style" }>, ind: string): string {
    const fields: string[] = [];
    for (const [key, value] of x.props) {
      const kind = STYLE[key];
      if (!kind) {
        this.unsupported(`Style.${key}`);
        continue;
      }
      const inner = ind + INDENT;
      const v = kind === "number" || kind === "enum" ? `Some(${this.expr(value, inner)})` : kind === "state" ? `css_state(${this.expr(value, inner)})` : `css_${kind}(${this.strRef(value, inner)})`;
      fields.push(`${snake(key)}: ${v}`);
    }
    const literal = fields.length ? this.layout("Style ", [...fields, "..Style::default()"], ind, "{}").replace(/default\(\),\n/, "default()\n") : "Style::default()";
    return x.base ? `${this.receiver(x.base, ind)}.merged(&${literal})` : literal;
  }

  // ---------------------------------------------------------------------------
  // Functions and calls
  // ---------------------------------------------------------------------------

  /** A closure: `move`, over clones of the locals it uses, so it can outlive the function that made it. */
  protected lambda(x: Lambda, ind: string): string {
    const saved = { frame: this.frame, tryLabel: this.tryLabel };
    const clones = this.captureClones(names(x), new Set(x.params.map((p) => p.name)));
    this.frame = { ret: x.ret, result: false, captured: captured(x.body) };
    this.tryLabel = undefined;
    const closure = this.scoped(() => {
      for (const p of x.params) this.declare(p.name, { kind: "local", ty: p.ty, boxed: false });
      const params = x.params.map((p) => `${p.unused ? "_" : this.name(p.name)}: ${this.ty(p.ty)}`).join(", ");
      const head = `move |${params}|${x.ret.k === "void" ? "" : ` -> ${this.ty(x.ret)}`}`;
      if (!Array.isArray(x.body)) {
        const value = this.coerce(x.body, x.ret, ind + INDENT);
        return value.includes("\n") || value.length + ind.length > 90 ? `${head} {\n${ind + INDENT}${value}\n${ind}}` : `${head} { ${value} }`;
      }
      const lines = this.body(x.body, ind + INDENT);
      if (lines.length === 1 && lines[0]!.length < 90 && !this.returns(x.body)) return `${head} { ${lines[0]!.trim()} }`;
      return `${head} {\n${lines.join("\n")}\n${ind}}`;
    });
    this.frame = saved.frame;
    this.tryLabel = saved.tryLabel;
    if (!clones.length) return closure;
    return `{\n${clones.map((c) => `${ind + INDENT}${c}`).join("\n")}\n${ind + INDENT}${closure.replace(/\n/g, `\n${INDENT}`)}\n${ind}}`;
  }

  /** `let x = x.clone();` for each captured local that is not `Copy`, local functions' own captures included. */
  private captureClones(used: Set<string>, own: Set<string>): string[] {
    const wanted = new Set<string>();
    for (const name of used) {
      if (own.has(name)) continue;
      const b = this.lookup(name);
      if (b?.kind === "local") wanted.add(name);
      if (b?.kind === "fn") for (const capture of b.captures.keys()) wanted.add(capture);
    }
    return [...wanted]
      .filter((name) => {
        const b = this.lookup(name);
        return b?.kind === "local" && (b.boxed || !this.isCopy(b.ty));
      })
      .map((name) => `let ${this.name(name)} = ${this.name(name)}.clone();`);
  }

  /** A function as a value: an `Rc<dyn Fn>`, of the type `want` when the slot has one. */
  private fnValue(x: Expr, ind: string, want?: Extract<Ty, { k: "fn" }>): string {
    if (x.e === "lambda") return `f${x.params.length}(${this.lambda(x, ind)})`;
    const b = x.e === "id" ? this.lookup(x.name) : undefined;
    if (x.e !== "id" || b?.kind !== "fn") return this.expr(x, ind);
    const own: Ty = { k: "fn", params: b.decl.params.map((p) => p.ty), ret: b.decl.ret };
    if (!want || this.ty(own) === this.ty(want)) return `f${b.decl.params.length}(${this.fnItem(x.name, b, ind)})`;
    // The slot's signature differs (it returns `Node | null`, the function a `Node`): adapt.
    const params: Param[] = want.params.map((ty, i) => ({ name: `p${i}`, ty, unused: i >= b.decl.params.length }));
    const call: Expr = { e: "call", callee: { e: "id", name: x.name }, args: b.decl.params.map((_, i) => ({ e: "id", name: `p${i}` })) };
    return this.fnValue({ e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : call }, ind);
  }

  /** A declared function as something callable: its name, or a closure supplying what it captures. */
  private fnItem(name: string, b: Fn, ind: string): string {
    if (!b.captures.size && !b.decl.async) return this.name(name);
    const params: Param[] = b.decl.params.map((p) => ({ name: p.name, ty: p.ty }));
    const call: Expr = { e: "call", callee: { e: "id", name }, args: params.map((p) => ({ e: "id", name: p.name })) };
    return this.lambda({ e: "lambda", params, ret: b.decl.ret, body: b.decl.ret.k === "void" ? [{ s: "expr", x: call }] : call }, ind);
  }

  /** A callback for an array method, called before the method returns: no `Rc` needed. */
  private callback(x: Expr, ind: string): string {
    if (x.e === "lambda") return this.lambda(x, ind);
    const b = x.e === "id" ? this.lookup(x.name) : undefined;
    if (x.e === "id" && b?.kind === "fn") return this.fnItem(x.name, b, ind);
    return `&*${this.atom(x, ind)}`;
  }

  /** `.await` and, for a call that can fail, what a failure does: leave the `try` block, or return the error. */
  private finish(call: string, awaited: boolean | undefined, fallible: boolean): string {
    const s = awaited ? `${call}.await` : call;
    if (!awaited || !fallible) return s;
    if (this.tryLabel) return `(match ${s} { Ok(v__) => v__, Err(e__) => break ${this.tryLabel} Err(e__) })`;
    return this.frame.result ? `${s}?` : `${s}.unwrap()`;
  }

  private callExpr(x: Extract<Expr, { e: "call" }>, ind: string): string {
    const inner = ind + INDENT;
    const b = x.callee.e === "id" ? this.lookup(x.callee.name) : undefined;
    if (x.callee.e === "id" && b?.kind === "fn") {
      const args = b.decl.params.map((p, i) => {
        const arg = x.args[i] ?? p.default;
        return arg ? this.coerce(arg, p.ty, inner) : "None";
      });
      // What a local function captures travels with each call.
      for (const [capture, local] of b.captures) args.push(local.boxed || !this.isCopy(local.ty) ? `${this.name(capture)}.clone()` : this.name(capture));
      // The app's own async functions return a Result; a native one returns its value.
      return this.finish(this.layout(this.name(x.callee.name), args, ind), x.await, b.decl.async && !b.native);
    }
    const callee = this.typeOf(x.callee);
    if (this.isRt(callee, "Variants")) {
      const selection = x.args[0]?.e === "dict" ? x.args[0].entries.map(([k, v]) => `(${this.str(k)}, ${this.strRef(v, inner)})`) : [];
      return `${this.receiver(x.callee, ind)}.select(&${this.layout("", selection, ind, "[]")})`;
    }
    const params = callee.k === "fn" ? callee.params : [];
    const args = x.args.map((arg, i) => (params[i] ? this.coerce(arg, params[i]!, inner) : this.expr(arg, inner)));
    // `(f)(…)`: the callee is an `Rc<dyn Fn>` in a variable, a field or an optional just unwrapped.
    return this.finish(this.layout(`(${this.receiver(x.callee, ind)})`, args, ind), x.await, false);
  }

  /** A value, or the function `update()` re-runs: the runtime has one entry point for each. */
  private dynamic(name: string, arg: Expr, asStr: boolean, ind: string): string {
    if (this.typeOf(arg).k === "fn") return `A::${snake(name)}_fn(${this.fnValue(arg, ind)})`;
    return `A::${snake(name)}(${asStr ? this.strRef(arg, ind) : this.expr(arg, ind)})`;
  }

  private runtime(x: Extract<Expr, { e: "rt" }>, ind: string): string {
    const inner = ind + INDENT;
    const named = new Map(x.named ?? []);
    const children = (args: Expr[]) => this.layout("vec!", args.map((a) => this.coerce(a, { k: "rt", name: "NodeMod" }, inner)), ind, "[]");
    const refs = (args: Expr[]) => `&[${args.map((a) => this.strRef(a, ind)).join(", ")}]`;
    const fn = (arg: Expr | undefined, want?: Ty, at = inner) => (arg ? this.fnValue(arg, at, want?.k === "fn" ? want : undefined) : "None");
    const fnTy = (params: Typ[], ret: Typ): Ty => ({ k: "fn", params: params as Ty[], ret: ret as Ty });

    if (TAGS.has(x.name)) return `${this.name(x.name)}(${children(x.args)})`;
    if (x.name.startsWith("A.")) {
      const attr = x.name.slice(2);
      const arg = x.args[0]!;
      if (attr in DYNAMIC_ATTRS) return this.dynamic(attr, arg, DYNAMIC_ATTRS[attr]!, ind);
      if (HANDLER_ATTRS.has(attr)) return `A::${snake(attr)}(${fn(arg, undefined, ind)})`;
      if (attr === "inputType") return `A::input_type(${this.strRef(arg, ind)})`;
      if (attr === "prop") return this.layout("A::prop", [fn(arg), fn(x.args[1])], ind);
      this.unsupported(`the attribute ${attr}`);
      return "Mod::None";
    }
    switch (x.name) {
      case "el":
        return `el(${this.strRef(x.args[0]!, ind)}, ${children(x.args.slice(1))})`;
      case "update":
      case "scope":
        return `${x.name}(${refs(x.args)})`;
      case "forceUpdate":
        return "force_update()";
      case "selectEvent":
        return `select_event(${this.strRef(x.args[0]!, ind)})`;
      case "requestAnimationFrame":
        return `request_animation_frame(${fn(x.args[0], undefined, ind)})`;
      case "cancelAnimationFrame":
        return `cancel_animation_frame(${this.expr(x.args[0]!, ind)})`;
      case "nativeView":
        // `Name::default()` is the app's type in native/linux/, and the props its generated struct.
        return this.layout("native_view", [this.expr(x.args[0]!, inner), this.expr(x.args[1]!, inner), children(x.args.slice(2))], ind);
      case "render": {
        const arg = x.args[0]!;
        const ty = this.typeOf(arg);
        return ty.k === "rt" && (ty.name === "Outlet" || ty.name === "Router") ? `render_outlet(${this.expr(arg, ind)})` : `render(${fn(arg, undefined, ind)})`;
      }
      case "list": {
        // list() keeps `Node | null` rows: a render function returning a `Node` is adapted.
        const items = this.typeOf(x.args[0]!);
        const element = items.k === "fn" && items.ret.k === "array" ? items.ret.of : undefined;
        const render = element && fnTy([element, { k: "int" }], { k: "optional", of: { k: "rt", name: "Node" } });
        return this.layout("list", [fn(x.args[0]), fn(x.args[1], render)], ind);
      }
      case "when":
        return this.layout("when", [this.condition(x.args[0]!, inner), fn(x.args[1])], ind);
      case "region": {
        const [type, empty] = [named.get("type"), named.get("empty")];
        return this.layout("region", [this.strRef(x.args[0]!, ind), type ? this.strRef(type, ind) : '"latest"', empty ? `Some(${fn(empty)})` : "None"], ind);
      }
      case "into":
        return this.layout("into", [this.strRef(x.args[0]!, ind), fn(x.args[1])], ind);
      case "css":
        return `css(${this.expr(x.args[0]!, ind)})`;
      case "cx":
        return this.layout("cx", [this.layout("vec!", x.args.map((a) => this.coerce(a, { k: "optional", of: { k: "rt", name: "StyleClass" } }, inner)), ind, "[]")], ind);
      case "Variants": {
        const pairs = (dict: Expr | undefined, value: (v: Expr) => string) =>
          this.layout("vec!", dict?.e === "dict" ? dict.entries.map(([k, v]) => `(${this.str(k)}, ${value(v)})`) : [], inner, "[]");
        const selection = (dict: Expr | undefined) => `&${pairs(dict, (v) => this.strRef(v, inner)).slice("vec!".length)}`;
        const base = named.get("base");
        return this.layout(
          "Variants::new",
          [
            base ? this.expr(base, inner) : "Style::default()",
            pairs(named.get("variants"), (group) => pairs(group, (style) => this.expr(style, inner + INDENT))),
            selection(named.get("defaults")),
            named.has("compounds") ? this.expr(named.get("compounds")!, inner) : "vec![]",
          ],
          ind,
        );
      }
      case "Compound": {
        const matches = x.args[0]?.e === "dict" ? x.args[0].entries.map(([k, v]) => `(${this.str(k)}, ${this.strRef(v, ind)})`) : [];
        return `Compound::new(&[${matches.join(", ")}], ${this.expr(x.args[1]!, ind)})`;
      }
      case "Route": {
        const [title, presentation, header] = [named.get("title"), named.get("presentation"), named.get("header")];
        const options = [title ? `Some(${fn(title)})` : "None", presentation ? this.strRef(presentation, ind) : '"push"', header ? this.expr(header, ind) : "true"];
        return this.layout("Route::new", [this.strRef(x.args[0]!, ind), fn(x.args[1]), ...options], ind);
      }
      case "Tab":
        return `Tab::new(${x.args.map((a) => this.strRef(a, ind)).join(", ")})`;
      case "Router": {
        const initial = named.get("initial");
        const list = (key: string) => (named.has(key) ? this.expr(named.get(key)!, inner) : "vec![]");
        return this.layout("Router::new", [list("routes"), list("tabs"), initial ? `Some(${this.strRef(initial, ind)})` : "None"], ind);
      }
      case "fetch": {
        const init = [...named].map(([key, value]) => `${key}: Some(${this.expr(value, ind)})`);
        const options = init.length ? `FetchInit { ${init.join(", ")}, ..FetchInit::default() }` : "FetchInit::default()";
        return this.finish(`fetch(${this.strRef(x.args[0]!, ind)}, ${options})`, x.await, true);
      }
      case "delay":
        return this.finish(`delay(${this.expr(x.args[0]!, ind)})`, x.await, false);
      case "setTimeout":
      case "setInterval":
        return this.layout(snake(x.name), [fn(x.args[0]), this.expr(x.args[1]!, inner)], ind);
      case "clearTimeout":
      case "clearInterval":
        return `${snake(x.name)}(${this.expr(x.args[0]!, ind)})`;
      case "log":
        return `console_log(${refs(x.args)})`;
    }
    this.unsupported(`${x.name}()`);
    return `unimplemented!("${x.name}() is not implemented on Linux")`;
  }

  /** A when() condition: a function, or a value fixed when the tree is built. */
  private condition(x: Expr, ind: string): string {
    if (this.typeOf(x).k === "fn") return this.fnValue(x, ind);
    return `{\n${ind + INDENT}let fixed__ = ${this.expr(x, ind + INDENT)};\n${ind + INDENT}f0(move || fixed__)\n${ind}}`;
  }

  private method(x: Extract<Expr, { e: "method" }>, ind: string): string {
    const inner = ind + INDENT;
    const obj = this.typeOf(x.obj);
    if (this.isRt(obj, "Response")) {
      const args = x.args.map((a) => this.expr(a, inner));
      return this.finish(`${this.receiver(x.obj, ind)}.${x.name}(${args.join(", ")})`, x.await, true);
    }
    if (this.isRt(obj, "WhenBuilder")) {
      const args = x.name === "when" ? [this.condition(x.args[0]!, inner), this.fnValue(x.args[1]!, inner)] : [this.fnValue(x.args[0]!, inner)];
      return this.layout(`${this.atom(x.obj, ind)}.${x.name === "else" ? "otherwise" : "when"}`, args, ind);
    }
    // The router: go, back, reset, replace.
    return `${this.receiver(x.obj, ind)}.${this.name(snake(x.name))}(${x.args.map((a) => this.strRef(a, ind)).join(", ")})`;
  }

  protected op(op: Op, args: Expr[], ind: string, _awaited = false, chain = false): string {
    const [a, b, c] = args;
    if (chain && a && this.typeOf(a).k === "optional") {
      // `a?.b.length`: the operation runs on the value inside the optional.
      const inside = (this.typeOf(a) as Extract<Ty, { k: "optional" }>).of;
      const local = this.place(a);
      return this.scoped(() => {
        this.declare("o__", { kind: "local", ty: inside, boxed: false });
        const rest = this.op(op, [{ e: "id", name: "o__" }, ...args.slice(1)], ind);
        const flat = this.opType(op, [{ e: "id", name: "o__" }, ...args.slice(1)]).k === "optional";
        return `${local ? `${local}.as_ref()` : this.atom(a, ind)}.${flat ? "and_then" : "map"}(|o__| ${rest})`;
      });
    }
    const r = () => this.receiver(a!, ind);
    const e = (x: Expr) => this.expr(x, ind);
    const s = (x: Expr) => this.strRef(x, ind);
    const elem = (): Typ => {
      const t = this.typeOf(a!);
      return t.k === "array" ? t.of : UNKNOWN;
    };
    const number = (x: Expr) => (this.typeOf(x).k === "int" ? "i64" : "f64");
    switch (op) {
      case "arr.length":
        return `${r()}.len()`;
      case "str.length":
        return `js_len(${s(a!)})`;
      case "arr.at":
        return `${r()}.at(${e(b!)})`;
      case "arr.push":
        return `${r()}.push(${this.coerce(b!, elem(), ind)})`;
      case "arr.pushAll":
        return `${r()}.push_all(${e(b!)})`;
      case "arr.pop":
        return `${r()}.pop()`;
      case "arr.unshift":
        return `${r()}.unshift(${this.coerce(b!, elem(), ind)})`;
      case "arr.splice":
        return `${r()}.splice(${e(b!)}, ${e(c!)})`;
      case "arr.indexOf":
        return `${r()}.index_of(&${this.coerce(b!, elem(), ind)})`;
      case "arr.includes":
        return `${r()}.includes(&${this.coerce(b!, elem(), ind)})`;
      case "arr.find":
      case "arr.findIndex":
      case "arr.filter":
      case "arr.map":
      case "arr.some":
      case "arr.every":
      case "arr.forEach":
        return `${r()}.${snake(op.slice(4))}(${this.callback(b!, ind)})`;
      case "arr.join":
        return `${r()}.join(${s(b!)})`;
      case "arr.slice":
        return `${r()}.slice(${e(b!)}, ${this.coerce(c!, { k: "optional", of: { k: "int" } }, ind)})`;
      case "str.slice":
        return `js_str_slice(${s(a!)}, ${e(b!)}, ${this.coerce(c!, { k: "optional", of: { k: "int" } }, ind)})`;
      case "str.trim":
        return `${r()}.trim().to_string()`;
      case "str.upper":
        return `${r()}.to_uppercase()`;
      case "str.lower":
        return `${r()}.to_lowercase()`;
      case "str.includes":
        return `${r()}.contains(${s(b!)})`;
      case "str.startsWith":
        return `${r()}.starts_with(${s(b!)})`;
      case "str.endsWith":
        return `${r()}.ends_with(${s(b!)})`;
      case "str.nonEmpty":
        return `!${r()}.is_empty()`;
      case "str.or":
        return `js_or(${e(a!)}, ${e(b!)})`;
      case "num.toFixed":
        return `js_fixed(${e(a!)}, ${e(b!)})`;
      case "math.floor":
        return `(f64::floor(${e(a!)}) as i64)`;
      case "math.ceil":
        return `(f64::ceil(${e(a!)}) as i64)`;
      case "math.round":
        return `js_round(${e(a!)})`;
      case "math.trunc":
        return `(${this.atom(a!, ind)} as i64)`;
      case "math.abs":
        return `${number(a!)}::abs(${e(a!)})`;
      case "math.min":
      case "math.max":
        return args.map(e).reduce((acc, next) => `js_${op.slice(5)}(${acc}, ${next})`);
      case "math.sqrt":
        return `f64::sqrt(${e(a!)})`;
      case "math.pow":
        return `f64::powf(${e(a!)}, ${e(b!)})`;
      case "math.random":
        return "js_random()";
      case "math.pi":
        return "std::f64::consts::PI";
      case "map.get":
        return `${r()}.get(${s(b!)})`;
      case "date.now":
        return "js_now()";
      case "num.parse":
        return `js_number(${s(a!)})`;
      case "int.parse":
        return `js_parse_int(${s(a!)})`;
      case "error.message":
        return `js_error_message(&${r()})`;
    }
  }

  // ---------------------------------------------------------------------------
  // Statements
  // ---------------------------------------------------------------------------

  protected stmt(s: Stmt, ind: string): string[] {
    const i2 = ind + INDENT;
    switch (s.s) {
      case "let": {
        // The initializer is printed before the name exists: `let x = x` reads the outer one.
        const boxed = this.boxed(s);
        const init = s.init ? this.coerce(s.init, s.ty, ind) : s.ty.k === "optional" ? "None" : undefined;
        this.declare(s.name, { kind: "local", ty: s.ty, boxed });
        const name = this.name(s.name);
        if (boxed) return [`${ind}let ${name}: Rc<Var<${this.ty(s.ty)}>> = Rc::new(${init ? `Var::new(${init})` : "Var::empty()"});`];
        return [`${ind}let ${s.mutable ? "mut " : ""}${name}: ${this.ty(s.ty)}${init ? ` = ${init}` : ""};`];
      }
      case "assign":
        return [`${ind}${this.assign(s, ind)};`];
      case "expr": {
        const x = this.expr(s.x, ind);
        // A block-like expression first in a statement would end it early: `match … {}.x`.
        return [`${ind}${/^(match|if) /.test(x) ? `let _ = ${x}` : x};`];
      }
      case "if": {
        const lines = [`${ind}if ${this.expr(s.c, ind)} {`, ...this.body(s.then, i2)];
        let rest = s.else;
        while (rest?.length === 1 && rest[0]!.s === "if") {
          const elif = rest[0] as Extract<Stmt, { s: "if" }>;
          lines.push(`${ind}} else if ${this.expr(elif.c, ind)} {`, ...this.body(elif.then, i2));
          rest = elif.else;
        }
        if (rest?.length) lines.push(`${ind}} else {`, ...this.body(rest, i2));
        lines.push(`${ind}}`);
        return lines;
      }
      case "forOf": {
        const of = this.typeOf(s.of);
        const head = `${ind}for ${this.name(s.name)} in ${this.receiver(s.of, ind)}.iter() {`;
        return this.scoped(() => {
          this.declare(s.name, { kind: "local", ty: of.k === "array" ? of.of : { k: "void" }, boxed: false });
          return [head, ...this.body(s.body, i2), `${ind}}`];
        });
      }
      case "forRange": {
        const head = `${ind}for ${this.name(s.name)} in ${this.atom(s.from, ind)}..${s.inclusive ? "=" : ""}${this.atom(s.to, ind)} {`;
        return this.scoped(() => {
          this.declare(s.name, { kind: "local", ty: { k: "int" }, boxed: false });
          return [head, ...this.body(s.body, i2), `${ind}}`];
        });
      }
      case "while":
        return [`${ind}while ${this.expr(s.c, ind)} {`, ...this.body(s.body, i2), `${ind}}`];
      case "return": {
        const value = s.x ? this.coerce(s.x, this.frame.ret, ind) : this.frame.result ? "()" : "";
        return [`${ind}return${this.frame.result ? ` Ok(${value})` : value ? ` ${value}` : ""};`];
      }
      case "break":
        return [`${ind}break;`];
      case "continue":
        return [`${ind}continue;`];
      case "try": {
        // A labelled block evaluating to a Result: a failing call inside breaks out with its
        // error, while `return`, `break` and `continue` keep meaning what they mean.
        const outer = this.tryLabel;
        const label = `'try${++this.tryCount}`;
        this.tryLabel = label;
        const body = this.body(s.body, i2);
        this.tryLabel = outer;
        const error = s.catchName ? this.name(s.catchName) : "_";
        const handler = this.scoped(() => {
          if (s.catchName) this.declare(s.catchName, { kind: "local", ty: { k: "rt", name: "Error" }, boxed: false });
          return this.body(s.catchBody, i2);
        });
        return [`${ind}let caught__: Result<(), JsError> = ${label}: {`, ...body, `${i2}Ok(())`, `${ind}};`, `${ind}if let Err(${error}) = caught__ {`, ...handler, `${ind}}`];
      }
      case "throw": {
        const error = `Err(JsError::new(${this.expr(s.message, ind)}))`;
        if (this.tryLabel) return [`${ind}break ${this.tryLabel} ${error};`];
        return [this.frame.result ? `${ind}return ${error};` : `${ind}panic!("{}", ${this.expr(s.message, ind)});`];
      }
      case "fn": {
        return this.fn(s.decl, ind, (this.lookup(s.decl.name) as Fn).captures);
      }
      case "switch":
        return this.switch(s, ind);
    }
  }

  private assign(s: Extract<Stmt, { s: "assign" }>, ind: string): string {
    const target = s.target;
    const ty = this.typeOf(target);
    const value = this.coerce(s.value, ty, ind);
    // `x += y` as `x = x + y`: a Var has no `+=`, and a String adds a `&str`.
    const next = (current: string) => {
      if (s.op === "=") return value;
      return `${current} ${s.op[0]} ${ty.k === "string" ? "&" : ""}${["bin", "cond", "coalesce"].includes(s.value.e) || ty.k === "string" ? `(${value})` : value}`;
    };
    if (target.e === "id") {
      const b = this.lookup(target.name);
      const name = this.name(target.name);
      if (b?.kind === "global") return `g::${name}.set(${next(`g::${name}.get()`)})`;
      if (b?.kind === "local" && b.boxed) return `${name}.set(${next(`${name}.get()`)})`;
      if (s.op === "=") return `${name} = ${value}`;
      return ty.k === "string" ? `${name}.push_str(&${value})` : `${name} ${s.op} ${value}`;
    }
    if (target.e === "prop") {
      const on = this.receiver(target.obj, ind);
      const field = this.name(target.name);
      if (s.op === "=") return `${on}.${field}.set(${value})`;
      return `{ let o__ = ${this.expr(target.obj, ind)}; o__.${field}.set(${next(`o__.${field}.get()`)}) }`;
    }
    if (target.e === "index") {
      const map = this.typeOf(target.obj).k === "map";
      const [set, get] = map ? ["insert", "get"] : ["set_at", "get"];
      const key = map ? this.strRef(target.index, ind) : this.expr(target.index, ind);
      if (s.op === "=") return `${this.receiver(target.obj, ind)}.${set}(${key}, ${value})`;
      const current = `o__.${get}(${map ? "&" : ""}k__)${map ? ".unwrap()" : ""}`;
      return `{ let o__ = ${this.expr(target.obj, ind)}; let k__ = ${this.expr(target.index, ind)}; o__.${set}(${map ? "&" : ""}k__, ${next(current)}) }`;
    }
    return `${this.expr(target, ind)} = ${value}`;
  }

  private switch(s: Extract<Stmt, { s: "switch" }>, ind: string): string[] {
    const i2 = ind + INDENT;
    const values = s.cases.flatMap((c) => c.values);
    const strings = values.every((v) => v.e === "str");
    if (strings || values.every((v) => v.e === "int")) {
      const lines = [`${ind}match ${strings ? `${this.receiver(s.x, ind)}.as_str()` : this.expr(s.x, ind)} {`];
      for (const c of s.cases) {
        lines.push(`${i2}${c.values.map((v) => (v.e === "str" ? this.str(v.v) : this.expr(v, i2))).join(" | ")} => {`, ...this.body(c.body, i2 + INDENT), `${i2}}`);
      }
      lines.push(`${i2}_ => {`, ...this.body(s.default ?? [], i2 + INDENT), `${i2}}`, `${ind}}`);
      return lines;
    }
    // Computed cases: compared in order.
    const lines = [`${ind}let subject__ = ${this.expr(s.x, ind)};`];
    s.cases.forEach((c, i) => {
      const test = c.values.map((v) => `subject__ == ${this.atom(v, ind)}`).join(" || ");
      lines.push(`${ind}${i ? "} else " : ""}if ${test} {`, ...this.body(c.body, i2));
    });
    if (s.default?.length) lines.push(s.cases.length ? `${ind}} else {` : `${ind}{`, ...this.body(s.default, i2));
    if (s.cases.length || s.default?.length) lines.push(`${ind}}`);
    return lines;
  }
}
