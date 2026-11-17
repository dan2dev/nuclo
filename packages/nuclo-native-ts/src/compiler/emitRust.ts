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
 *    reads its enclosing function's locals takes them as extra parameters;
 *  - classes are flattened: a struct holds the fields of its class and of its bases, every method
 *    and constructor is a free function taking `this`, and a class with subclasses or an interface
 *    a class implements is a trait (`Rc<dyn Shape>`) whose methods take `&self`. Free functions borrow
 *    `this` (`&Rc<C>`): calls clone no receiver.
 * Errors are `Result`s: every `async fn` returns one, and so does what the front-end found can throw
 * (functions, methods, accessors, constructors, closures; array methods have `try_` forms); a `try`
 * block is a labelled block that a failing call breaks out of.
 */
import type { BinOp, ClassDecl, Expr, FnDecl, ObjectClassDecl, Op, Param, Program, ProtocolDecl, Stmt, Ty, UnionDecl } from "./ir.ts";
import { gcLeaf, gcWalks } from "./cycles.ts";
import { INDENT, Printer } from "./printer.ts";

// Strict and reserved words. `self`, `Self`, `super` and `crate` can't be raw identifiers: they get a suffix.
const KEYWORDS = new Set([
  "as", "async", "await", "break", "const", "continue", "dyn", "else", "enum", "extern", "false", "fn", "for", "gen", "if", "impl", "in",
  "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "static", "struct", "trait", "true", "type", "unsafe", "use",
  "where", "while", "abstract", "become", "box", "do", "final", "macro", "override", "priv", "try", "typeof", "unsized", "virtual", "yield",
]);
const UNRAWABLE = new Set(["self", "Self", "super", "crate", "_"]);

const RUNTIME_TYPES: Record<string, string> = { NodeMod: "Mod", Outlet: "Router", Error: "JsError", BigInt: "JsBigInt", Symbol: "JsSymbol", Date: "JsDate" };

/** Runtime types read without a clone. */
const RUST_SIZED = { Int8: "i8", Int16: "i16", Int32: "i32", Int64: "i64", UInt8: "u8", UInt16: "u16", UInt32: "u32", Float32: "f32" } as const;
const COPY_RUNTIME_TYPES = new Set(["Style", "NativeElement", "PointerEvent", "ScrollEvent"]);

/** The Style properties, and how a value is written: a number, a parsed colour or font, an enum, a nested style, media rules, keyframes. */
const STYLE: Record<string, "number" | "color" | "enum" | "font" | "state" | "media" | "animation"> = {
  flexDirection: "enum", alignItems: "enum", alignSelf: "enum", justifyContent: "enum", flexWrap: "enum", flex: "number", gap: "number",
  margin: "number", marginTop: "number", marginRight: "number", marginBottom: "number", marginLeft: "number",
  padding: "number", paddingTop: "number", paddingRight: "number", paddingBottom: "number", paddingLeft: "number",
  width: "number", widthPct: "number", height: "number", minWidth: "number", maxWidth: "number", minHeight: "number", maxHeight: "number", aspectRatio: "number",
  overflow: "enum", position: "enum", top: "number", right: "number", bottom: "number", left: "number", zIndex: "number", display: "enum",
  backgroundColor: "color", color: "color", opacity: "number", borderRadius: "number", borderWidth: "number", borderColor: "color",
  borderTopWidth: "number", borderRightWidth: "number", borderBottomWidth: "number", borderLeftWidth: "number",
  borderTopColor: "color", borderRightColor: "color", borderBottomColor: "color", borderLeftColor: "color",
  shadowColor: "color", shadowRadius: "number", shadowOffsetX: "number", shadowOffsetY: "number",
  fontSize: "number", fontWeight: "enum", fontStyle: "enum", fontFamily: "font", lineHeight: "number", letterSpacing: "number",
  textAlign: "enum", textDecoration: "enum", textTransform: "enum", numberOfLines: "number",
  placeholderColor: "color", objectFit: "enum", pointerEvents: "enum",
  translateX: "number", translateY: "number", scale: "number", rotate: "number",
  transitionDuration: "number", transitionDelay: "number", transitionEasing: "enum",
  animation: "animation", media: "media",
  pressed: "state", hover: "state", focused: "state", disabled: "state", enabled: "state", checked: "state", placeholderShown: "state",
  first: "state", last: "state", only: "state", odd: "state", even: "state", empty: "state",
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

/** A member of a trait: an accessor (`get_x` / `set_x`) of a field or getter, or a method. */
interface TraitMember {
  rust: string;
  kind: "get" | "set" | "method";
  /** The TypeScript name: the field, getter or method. */
  name: string;
  params: Param[];
  ret: Ty;
  /** It can throw: it returns a `Result`. */
  throws?: boolean;
}

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
  private objects = new Map<string, ObjectClassDecl>();
  /** A class's free functions (`init__C`, `m__C__x`): `this` is borrowed (`&Rc<C>`), so a call clones nothing. */
  private byRef = new Set<FnDecl>();
  private protocols = new Map<string, ProtocolDecl>();
  private scopes: Map<string, Binding>[] = [new Map()];
  /** The function being printed: its return type, whether it returns a `Result`, the names its closures capture. */
  private frame = { ret: { k: "void" } as Ty, result: false, captured: new Set<string>() };
  /** The globals `nuclo_main` initializes in place. */
  private placed = new Map<string, Extract<Stmt, { s: "let" }>>();
  /** The innermost `try` block's label: where a failing call goes. */
  private tryLabel: string | undefined;
  /**
   * The loops being printed, innermost last, and how many labelled blocks (try blocks) are open: Rust
   * wants a label on a `break` / `continue` that leaves one, so such a loop gets one (`'loop3:`).
   */
  private loops: { label: string; blocks: number; used: boolean }[] = [];
  private blocks = 0;
  private loopCount = 0;
  private tryCount = 0;
  private warned = new Set<string>();
  /**
   * Top-level names that several modules declare (a module-private `page` in two files, a `feed`
   * that is a variable in one and a function in another): every declaration, picked from by use.
   * Two functions of one name get Rust names of their own.
   */
  private overloads = new Map<string, Binding[]>();
  private rustNames = new Map<FnDecl, string>();

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

  /** How the cycle collector sees a class or interface (cycles.ts rule 6). */
  private gcLeaf: (name: string) => "node" | "obj" | undefined = () => undefined;

  print(program: Program): string {
    this.gcLeaf = gcLeaf(program);
    for (const cls of program.classes) this.classes.set(cls.name, cls);
    const top = (name: string, binding: Binding) => {
      this.overloads.set(name, [...(this.overloads.get(name) ?? []), binding]);
      if (binding.kind === "fn") {
        const fns = this.overloads.get(name)!.filter((b) => b.kind === "fn").length;
        if (fns > 1) this.rustNames.set(binding.decl, `${this.name(name)}__${fns}`);
      }
      this.declare(name, binding);
    };
    for (const g of program.globals) top(g.name, { kind: "global", ty: g.ty });
    for (const fn of program.functions) top(fn.name, { kind: "fn", decl: fn, captures: new Map() });
    for (const p of program.protocols ?? []) this.protocols.set(p.name, p);
    for (const c of program.objectClasses ?? []) this.objects.set(c.name, c);
    const classFns = (program.objectClasses ?? []).flatMap((c) => this.classFns(c));
    for (const fn of classFns) top(fn.name, { kind: "fn", decl: fn, captures: new Map() });
    for (const fn of classFns) if (!fn.async) this.byRef.add(fn);
    for (const [name, bindings] of this.overloads) if (bindings.length < 2) this.overloads.delete(name);
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
    for (const u of program.unions ?? []) out.push(...this.unionDecl(u), "");
    if (program.objectClasses?.length || program.protocols?.length) {
      // What `instanceof` and downcasts need: any object as `Rc<dyn Any>`, which every trait reaches through its root.
      out.push(
        "/// Any object as `Rc<dyn Any>`: `instanceof` and downcasts test its struct.",
        "pub trait ObjectAny {",
        `${INDENT}fn as_any(self: Rc<Self>) -> Rc<dyn std::any::Any>;`,
        "}",
        "",
        "impl<T: 'static> ObjectAny for T {",
        `${INDENT}fn as_any(self: Rc<Self>) -> Rc<dyn std::any::Any> {`,
        `${INDENT}${INDENT}self`,
        `${INDENT}}`,
        "}",
        "",
      );
    }
    for (const p of program.protocols ?? []) out.push(...this.traitDecl(p.name), "");
    for (const c of program.objectClasses ?? []) {
      if (c.open) out.push(...this.traitDecl(c.name), "");
      if (!c.abstract) out.push(...this.structDecl(c), "");
    }
    for (const c of program.objectClasses ?? []) out.push(...this.castFn(c), "");
    for (const fn of classFns) out.push(...this.fn(fn, "", new Map()), "");
    if (program.globals.length) {
      out.push("/// The app's top-level variables. `nuclo_main` runs their initializers in JavaScript's order.", "mod g {", `${INDENT}use super::*;`, `${INDENT}thread_local! {`);
      for (const g of program.globals) out.push(`${INDENT}${INDENT}pub static ${this.name(g.name)}: Var<${this.ty(g.ty)}> = const { Var::empty() };`);
      out.push(`${INDENT}}`, "}", "");
    }
    for (const fn of program.functions) out.push(...this.fn(fn, "", new Map()), "");
    for (const j of program.jsonClasses ?? []) out.push(...this.jsonWriter(j, program), "");
    out.push("pub fn nuclo_main() {");
    // A `global` statement of main sets its global in place; the others are set first.
    this.placed = this.placedGlobals(program);
    for (const g of program.globals) if (!this.placed.has(g.name)) out.push(`${INDENT}${this.globalInit(g, INDENT)}`);
    this.frame = { ret: { k: "void" }, result: false, captured: captured(program.main) };
    // The microtasks the top level queued run when it is done, before any timer (as after a script in JavaScript).
    out.push(...this.scoped(() => this.body(program.main, INDENT)), `${INDENT}drain_microtasks();`, "}", "");
    return out.join("\n");
  }

  private globalInit(g: Extract<Stmt, { s: "let" }>, ind: string): string {
    return `g::${this.name(g.name)}.set(${g.init ? this.coerce(g.init, g.ty, ind) : "None"});`;
  }

  /** A union: an enum with a variant per member, a tag test and a checked read (a clone of the member) each. */
  private unionDecl(u: UnionDecl): string[] {
    const i1 = INDENT;
    const lines = ["#[derive(Clone)]", `pub enum ${u.name} {`, ...u.members.map((m) => `${i1}${m.tag}${m.ty.k === "void" ? "" : `(${this.ty(m.ty)})`},`), "}", "", `impl ${u.name} {`];
    for (const m of u.members) {
      lines.push(`${i1}pub fn is_${m.tag}(&self) -> bool {`, `${i1}${i1}matches!(self, Self::${m.tag}${m.ty.k === "void" ? "" : "(..)"})`, `${i1}}`);
      if (m.ty.k !== "void") {
        lines.push(`${i1}pub fn as_${m.tag}(&self) -> ${this.ty(m.ty)} {`, `${i1}${i1}match self { Self::${m.tag}(v) => v.clone(), _ => unreachable!() }`, `${i1}}`);
      }
    }
    lines.push("}");
    return lines;
  }

  private classDecl(cls: ClassDecl): string[] {
    const i1 = INDENT;
    const lines = [`pub struct ${cls.name} {`, ...cls.fields.map((f) => `${i1}pub ${this.name(f.name)}: Var<${this.ty(f.ty)}>,`), "}", ""];
    // `===` is identity: two objects with the same fields are different objects.
    lines.push(`impl PartialEq for ${cls.name} {`, `${i1}fn eq(&self, other: &Self) -> bool {`, `${i1}${i1}std::ptr::eq(self, other)`, `${i1}}`, "}");
    if (cls.gc) lines.push("", ...this.gcImpl(cls.name, cls.fields.filter((f) => cls.gc!.includes(f.name))));
    // The shape protocols it conforms to, and their bases: each field's getter and setter.
    const traits = new Set<string>();
    const visit = (t: string) => {
      if (traits.has(t)) return;
      traits.add(t);
      this.supertraits(t).forEach(visit);
    };
    (cls.protocols ?? []).forEach(visit);
    for (const t of traits) {
      lines.push("", `impl ${t} for ${cls.name} {`);
      for (const m of this.traitMembers(t)) {
        const body = m.kind === "set" ? `${this.gcTracked(cls.name, m.name) ? `gc_write(&self.${this.name(m.name)}); ` : ""}self.${this.name(m.name)}.set(value)` : `self.${this.name(m.name)}.get()`;
        lines.push(`${i1}${this.traitSignature(m)} {`, `${i1}${i1}${body}`, `${i1}}`);
      }
      lines.push("}");
    }
    if (cls.decodable) {
      lines.push(
        "",
        `impl ${cls.name} {`,
        `${i1}pub fn from_json<J: json::JsonValue>(json: &J) -> Result<Rc<${cls.name}>, JsError> {`,
        `${i1}${i1}Ok(${cls.gc ? "gc_track(" : ""}Rc::new(${cls.name} {`,
        ...cls.fields.map((f) => `${i1}${i1}${i1}${this.name(f.name)}: Var::new(${this.decode(f.ty, `json::field(json, ${this.str(f.name)})?`, 0)}?),`),
        `${i1}${i1}})${cls.gc ? ")" : ""})`,
        `${i1}}`,
        "}",
      );
    }
    return lines;
  }

  // ---------------------------------------------------------------------------
  // Classes and protocols
  // ---------------------------------------------------------------------------

  /** A protocol, or a class with subclasses: a trait, and its values are `Rc<dyn Name>`. */
  private isTrait(name: string): boolean {
    return this.protocols.has(name) || !!this.objects.get(name)?.open;
  }

  /** The struct of a class; a class with subclasses keeps its own name for its trait. */
  private structName(c: ObjectClassDecl): string {
    return c.open ? `${c.name}__` : c.name;
  }

  /** A class and its bases, the class first. */
  /** A field the cycle collector traverses (cycles.ts rule 6): its stores get the write barrier. */
  private gcTracked(cls: string, field: string): boolean {
    return !!this.classes.get(cls)?.gc?.includes(field) || this.chain(cls).some((c) => c.gc?.includes(field));
  }

  private chain(name: string): ObjectClassDecl[] {
    const out: ObjectClassDecl[] = [];
    for (let c = this.objects.get(name); c; c = c.base ? this.objects.get(c.base) : undefined) out.push(c);
    return out;
  }

  /** Every field of a class, its bases' first: what its struct holds. */
  private allFields(c: ObjectClassDecl): ObjectClassDecl["fields"] {
    const out: ObjectClassDecl["fields"] = [];
    for (const k of this.chain(c.name).reverse()) for (const f of k.fields) if (!out.some((o) => o.name === f.name)) out.push(f);
    return out;
  }

  /** The traits a trait extends. */
  private supertraits(name: string): string[] {
    const p = this.protocols.get(name);
    if (p) return p.bases;
    const c = this.objects.get(name);
    return c ? [...(c.base ? [c.base] : []), ...c.protocols] : [];
  }

  /** The members a trait declares itself (those its supertraits declare are theirs). */
  private traitMembers(name: string): TraitMember[] {
    const inherited = new Set<string>();
    const visit = (t: string) => {
      for (const sup of this.supertraits(t)) {
        for (const m of this.traitMembers(sup)) inherited.add(m.rust);
        visit(sup);
      }
    };
    visit(name);
    const own: TraitMember[] = [];
    const field = (f: { name: string; ty: Ty }, settable: boolean, throws?: boolean) => {
      own.push({ rust: `get_${f.name}`, kind: "get", name: f.name, params: [], ret: f.ty, throws });
      if (settable) own.push({ rust: `set_${f.name}`, kind: "set", name: f.name, params: [{ name: "value", ty: f.ty }], ret: { k: "void" }, throws });
    };
    const p = this.protocols.get(name);
    const c = this.objects.get(name);
    if (p) {
      for (const f of p.fields) field(f, !f.readonly);
      for (const m of p.methods) own.push({ rust: m.name, kind: "method", name: m.name, params: m.params, ret: m.ret, throws: m.throws });
    } else if (c) {
      // A class's own fields are set through its trait by its constructor.
      for (const f of c.fields) field(f, true);
      for (const m of c.methods) {
        if (m.getter) field({ name: m.name, ty: m.ret }, c.methods.some((x) => x.setter && x.name === m.name), m.throws);
        else if (!m.setter) own.push({ rust: m.name, kind: "method", name: m.name, params: m.params, ret: m.ret, throws: m.throws });
      }
    }
    return own.filter((m) => !inherited.has(m.rust));
  }

  /** The class in a chain that defines a method or getter (or the setter) with a body. */
  private definer(cls: string, name: string, setter = false): string | undefined {
    return this.chain(cls).find((c) => c.methods.some((m) => m.name === name && !m.abstract && !!m.setter === setter))?.name;
  }

  /** What `name` is on a value of a class or protocol: its type, and for a method its parameters. */
  private member(cls: string, name: string): { kind: "field" | "getter" | "method"; ty: Ty; params: Param[] } | undefined {
    const c = this.objects.get(cls);
    if (c) {
      for (const k of this.chain(cls)) {
        const f = k.fields.find((x) => x.name === name);
        if (f) return { kind: "field", ty: f.ty, params: [] };
        const m = k.methods.find((x) => x.name === name && !x.setter);
        if (m) return { kind: m.getter ? "getter" : "method", ty: m.ret, params: m.params };
      }
    }
    for (const sup of c ? this.chain(cls).flatMap((k) => k.protocols) : this.protocols.has(cls) ? [cls] : []) {
      const p = this.protocols.get(sup)!;
      const f = p.fields.find((x) => x.name === name);
      if (f) return { kind: "field", ty: f.ty, params: [] };
      const m = p.methods.find((x) => x.name === name);
      if (m) return { kind: "method", ty: m.ret, params: m.params };
      for (const base of p.bases) {
        const found = this.member(base, name);
        if (found) return found;
      }
    }
    return undefined;
  }

  /** A class's constructor (`init__C`), methods and getters (`m__C__name`) and setters (`m__C__set_name`) as free functions of `this`. */
  private classFns(c: ObjectClassDecl): FnDecl[] {
    const self: Param = { name: "this", ty: { k: "class", name: c.name } };
    // A hierarchy's constructors throw together (the front-end's families), so the base's does when this one does.
    const throws = c.ctor.throws ? { throws: true } : {};
    const base: Stmt[] = c.base
      ? [{ s: "expr", x: { e: "call", callee: { e: "id", name: `init__${c.base}` }, args: [{ e: "id", name: "this" }, ...(c.ctor.superArgs ?? [])], ...throws } }]
      : [];
    return [
      { name: `init__${c.name}`, params: [self, ...c.ctor.params], ret: { k: "void" }, async: false, body: [...base, ...c.ctor.body], ...throws },
      ...c.methods.filter((m) => !m.abstract).map((m): FnDecl => ({ name: `m__${c.name}__${m.setter ? "set_" : ""}${m.name}`, params: [self, ...m.params], ret: m.ret, async: false, body: m.body, throws: m.throws })),
    ];
  }

  /** `cast__C`: the object as a `C` if its struct is `C`'s or a subclass's (`instanceof`, downcasts). */
  private castFn(c: ObjectClassDecl): string[] {
    const want = this.ty({ k: "class", name: c.name });
    const structs = [...this.objects.values()].filter((s) => !s.abstract && this.chain(s.name).includes(c));
    return [
      `pub fn cast__${c.name}(x: Rc<dyn std::any::Any>) -> Option<${want}> {`,
      ...structs.flatMap((s) => [`${INDENT}if let Ok(o) = x.clone().downcast::<${this.structName(s)}>() {`, `${INDENT}${INDENT}return Some(o as ${want});`, `${INDENT}}`]),
      `${INDENT}None`,
      "}",
    ];
  }

  private traitDecl(name: string): string[] {
    const i1 = INDENT;
    // A root trait extends ObjectAny, so every trait object has one `as_any`.
    const supers = this.supertraits(name).length ? this.supertraits(name) : ["ObjectAny"];
    const lines = [`pub trait ${name}${supers.length ? `: ${supers.join(" + ")}` : ""} {`];
    for (const m of this.traitMembers(name)) lines.push(`${i1}${this.traitSignature(m)};`);
    lines.push("}", "");
    // `===` and indexOf compare identity.
    lines.push(`impl PartialEq for dyn ${name} {`, `${i1}fn eq(&self, other: &Self) -> bool {`, `${i1}${i1}std::ptr::addr_eq(self, other)`, `${i1}}`, "}");
    return lines;
  }

  private traitSignature(m: TraitMember): string {
    const params = ["&self", ...m.params.map((p) => `${this.name(p.name)}: ${this.ty(p.ty)}`)].join(", ");
    if (m.throws) return `fn ${this.name(m.rust)}(${params}) -> Result<${this.ty(m.ret)}, JsError>`;
    return `fn ${this.name(m.rust)}(${params})${m.ret.k === "void" ? "" : ` -> ${this.ty(m.ret)}`}`;
  }

  /** A class's struct: every field, `new` (which runs the constructor chain), and the traits it implements. */
  private structDecl(c: ObjectClassDecl): string[] {
    const [i1, i2, i3] = [INDENT, INDENT + INDENT, INDENT + INDENT + INDENT];
    const name = this.structName(c);
    const fields = this.allFields(c);
    // A back-pointer (cycles.ts) is a `WeakVar`: the same get / set, on a `Weak` it upgrades.
    const cell = (f: ObjectClassDecl["fields"][number]) => (f.weak && f.ty.k === "optional" && f.ty.of.k === "class" ? `WeakVar<${this.isTrait(f.ty.of.name) ? `dyn ${f.ty.of.name}` : f.ty.of.name}>` : `Var<${this.ty(f.ty)}>`);
    const lines = [`pub struct ${name} {`, ...fields.map((f) => `${i1}pub ${this.name(f.name)}: ${cell(f)},`), "}", ""];
    lines.push(`impl PartialEq for ${name} {`, `${i1}fn eq(&self, other: &Self) -> bool {`, `${i2}std::ptr::eq(self, other)`, `${i1}}`, "}", "");
    const params = c.ctor.params.map((p) => `${this.name(p.name)}: ${this.ty(p.ty)}`).join(", ");
    const values = fields.map((f) => `${this.name(f.name)}: ${f.weak ? "Weak" : ""}${f.init ? `Var::new(${this.coerce(f.init, f.ty, i3)})` : f.ty.k === "optional" ? "Var::new(None)" : "Var::empty()"}`);
    const throws = !!c.ctor.throws;
    lines.push(
      `impl ${name} {`,
      `${i1}pub fn new(${params}) -> ${throws ? `Result<Rc<${name}>, JsError>` : `Rc<${name}>`} {`,
      `${i2}let this = ${c.gc ? "gc_track(" : ""}Rc::new(${this.layout(`${name} `, values, i2, "{}")})${c.gc ? ")" : ""};`,
      `${i2}init__${c.name}(${[this.isTrait(c.name) ? `&(this.clone() as Rc<dyn ${c.name}>)` : "&this", ...c.ctor.params.map((p) => this.name(p.name))].join(", ")})${throws ? "?" : ""};`,
      `${i2}${throws ? "Ok(this)" : "this"}`,
      `${i1}}`,
      "}",
    );
    if (c.gc) {
      const tracked = new Set(this.chain(c.name).flatMap((k) => k.gc ?? []));
      lines.push("", ...this.gcImpl(name, fields.filter((f) => tracked.has(f.name))));
    }
    // Every trait of the class, its bases and its protocols.
    const traits = new Set<string>();
    const visit = (t: string) => {
      if (traits.has(t)) return;
      traits.add(t);
      this.supertraits(t).forEach(visit);
    };
    if (c.open) visit(c.name);
    else this.supertraits(c.name).forEach(visit);
    for (const t of traits) {
      lines.push("", `impl ${t} for ${name} {`);
      for (const m of this.traitMembers(t)) {
        const args = m.params.map((p) => this.name(p.name));
        const definer = this.definer(c.name, m.name);
        const isField = fields.some((f) => f.name === m.name);
        // `&self` as the `Rc` that holds it (every object lives in one), its count untouched, typed as the
        // definer's `this`: a free function borrows it.
        const rc = (d: string) => `let this = std::mem::ManuallyDrop::new(unsafe { Rc::from_raw(self as *const Self) } as ${this.ty({ k: "class", name: d })}); `;
        const body =
          m.kind === "set" && !isField ? `${rc(this.definer(c.name, m.name, true)!)}m__${this.definer(c.name, m.name, true)}__set_${m.name}(&this, value)`
          : m.kind === "set" ? `${this.gcTracked(c.name, m.name) ? `gc_write(&self.${this.name(m.name)}); ` : ""}self.${this.name(m.name)}.set(value)`
          : m.kind === "get" && isField ? `self.${this.name(m.name)}.get()`
          : `${rc(definer!)}m__${definer}__${m.name}(${["&this", ...args].join(", ")})`;
        lines.push(`${i1}${this.traitSignature(m)} {`, `${i2}${body}`, `${i1}}`);
      }
      lines.push("}");
    }
    return lines;
  }

  /** `obj.m(…)`: a trait method, or the free function of the class that defines it. */
  private invoke(x: Extract<Expr, { e: "invoke" }>, ind: string): string {
    const objTy = x.sup ? undefined : this.typeOf(x.obj);
    const cls = x.sup ?? (objTy?.k === "class" ? objTy.name : undefined);
    if (!cls) return `/* invoke on ${objTy?.k} */`;
    if (x.sup || !this.isTrait(cls)) {
      const definer = x.sup ?? this.definer(cls, x.name);
      return this.callExpr({ e: "call", callee: { e: "id", name: `m__${definer}__${x.name}` }, args: [x.obj, ...x.args], throws: x.throws }, ind);
    }
    const params = this.member(cls, x.name)?.params ?? [];
    const args = params.map((p, i) => {
      const arg = x.args[i] ?? p.default;
      return arg ? this.coerce(arg, p.ty, ind + INDENT) : "None";
    });
    const call = this.layout(`${this.receiver(x.obj, ind)}.${this.name(x.name)}`, args, ind);
    return x.throws ? this.fail(call) : call;
  }

  /** `jsonw__Name(o, v)`: JSON.stringify of a class (its fields in JavaScript's key order) or a union (its member's). */
  private jsonWriter(j: NonNullable<Program["jsonClasses"]>[number], program: Program): string[] {
    const [i1, i2] = [INDENT, INDENT + INDENT];
    const lines = [`fn jsonw__${j.name}(o: &mut JsonOut, v: &${this.ty({ k: j.fields ? "class" : "union", name: j.name } as Ty)}) {`];
    if (!j.fields) {
      lines.push(`${i1}match v {`);
      for (const m of program.unions!.find((u) => u.name === j.name)!.members) {
        lines.push(m.ty.k === "void" ? `${i2}${j.name}::${m.tag} => o.null(),` : `${i2}${j.name}::${m.tag}(x) => { let x = x.clone(); ${this.jsonEnc(m.ty, "x", 0)} }`);
      }
      return [...lines, `${i1}}`, "}"];
    }
    lines.push(`${i1}o.obj(|o| {`);
    for (const f of j.fields) {
      const read = `v.${this.name(f.name)}.get()`;
      if (f.ty.k !== "optional" || f.nil) lines.push(`${i2}o.key(${this.str(f.name)});`, `${i2}${this.jsonEnc(f.ty, read, 0)};`);
      else lines.push(`${i2}o.field(${this.str(f.name)}, ${read}, |o, x0| ${this.jsonEnc(f.ty.of, "x0", 1)});`);
    }
    return [...lines, `${i1}});`, "}"];
  }

  /** A statement writing `v` (an owned `ty`) into the JsonOut `o`. */
  private jsonEnc(ty: Ty, v: string, d: number): string {
    const x = `x${d}`;
    switch (ty.k) {
      case "string":
        return `o.str(&${v})`;
      case "int":
      case "double":
      case "num":
        return `o.num(${v} as f64)`;
      case "bool":
        return `o.bool(${v})`;
      case "class":
      case "union":
        return `jsonw__${ty.name}(o, &${v})`;
      case "array":
        return `o.arr(&${v}, |o, ${x}| ${this.jsonEnc(ty.of, x, d + 1)})`;
      case "map":
        return `o.map(&${v}, |o, ${x}| ${this.jsonEnc(ty.of, x, d + 1)})`;
      case "optional":
        return `o.opt(${v}, |o, ${x}| ${this.jsonEnc(ty.of, x, d + 1)})`;
      default:
        return `o.date(&${v})`;
    }
  }

  /** JSON.parse / JSON.stringify and Date (jsondate.rs). */
  private jsonDateOp(op: Op, args: Expr[], ind: string): string | undefined {
    const [a, b, ...rest] = args;
    const e = (x: Expr) => this.expr(x, ind);
    const what = (x: Expr | undefined) => (x as Extract<Expr, { e: "str" }>).v;
    const doubles = (xs: Expr[]) => `&[${xs.map(e).join(", ")}]`;
    switch (op) {
      case "json.parse":
        return this.fail(`js_json_decode(${this.strRef(a!, ind)}, ${e(b!)})`);
      case "json.stringify": {
        const ty = (rest[0] as Extract<Expr, { e: "decoder" }>).ty;
        return `{ let v__ = ${this.coerce(a!, ty, ind)}; js_json_stringify(${e(b!)}, move |o| ${this.jsonEnc(ty, "v__", 0)}) }`;
      }
      case "json.gap":
        return what(a) === "num" ? `js_json_gap(${e(b!)})` : `js_json_gap_str(${this.strRef(b!, ind)})`;
      case "date.utc":
        return `js_date_utc(${doubles(args)})`;
      case "date.parse":
        return `js_date_parse(${this.strRef(a!, ind)})`;
      case "date.new": {
        const form = what(a);
        if (form === "now") return "JsDate::now()";
        if (form === "parts") return `JsDate::parts(${doubles([b!, ...rest])})`;
        if (form === "copy") return `JsDate::new(${this.receiver(b!, ind)}.time())`;
        return form === "str" ? `JsDate::new(js_date_parse(${this.strRef(b!, ind)}))` : `JsDate::new(${e(b!)})`;
      }
      case "date.call": {
        const d = this.receiver(a!, ind);
        const [kind, field, local] = what(b).split(" ");
        if (kind === "get") return `${d}.get(${field}, ${local === "1"})`;
        if (kind === "set") return `${d}.set(${field}, ${local === "1"}, ${doubles(rest)})`;
        if (kind === "iso") return this.fail(`${d}.to_iso_string()`);
        const calls: Record<string, string> = { time: "time()", setTime: `set_time(${rest.map(e).join("")})`, tzOffset: "timezone_offset()", utc: "to_utc_string()", dateString: "to_date_string()" };
        return `${d}.${calls[kind!]}`;
      }
      default:
        return undefined;
    }
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
    const saved = { frame: this.frame, tryLabel: this.tryLabel, loops: this.loops, blocks: this.blocks };
    [this.loops, this.blocks] = [[], 0];
    const extra = [...captures].map(([name, binding]) => ({ name, binding, ty: binding.boxed ? `Rc<Var<${this.ty(binding.ty)}>>` : this.ty(binding.ty) }));
    // An async function, or one that can throw, returns a `Result`.
    const result = fn.async || !!fn.throws;
    this.frame = { ret: fn.ret, result, captured: captured(fn.body) };
    this.tryLabel = undefined;
    const lines = this.scoped(() => {
      for (const p of fn.params) this.declare(p.name, { kind: "local", ty: p.ty, boxed: false });
      for (const c of extra) this.declare(c.name, c.binding);
      const params = [...fn.params.map((p, i) => `${this.name(p.name)}: ${i === 0 && this.byRef.has(fn) ? "&" : ""}${this.ty(p.ty)}`), ...extra.map((c) => `${this.name(c.name)}: ${c.ty}`)].join(", ");
      const value = fn.ret.k === "void" ? "()" : this.ty(fn.ret);
      const ret = result ? ` -> Result<${value}, JsError>` : fn.ret.k === "void" ? "" : ` -> ${value}`;
      const body = this.body(fn.body, ind + INDENT);
      if (result && fn.ret.k === "void") body.push(`${ind + INDENT}Ok(())`);
      // A value on every path, but not one Rust sees after a loop or a try.
      else if (fn.ret.k !== "void" && ["try", "while", "forOf", "forRange"].includes(fn.body.at(-1)?.s ?? "")) body.push(`${ind + INDENT}unreachable!()`);
      const head = `${ind}${ind ? "" : "pub "}`;
      const name = this.rustNames.get(fn) ?? this.name(fn.name);
      // An async fn that calls itself has a future of infinite size: it returns it boxed.
      if (fn.async && names(fn.body).has(fn.name)) {
        const future = `std::pin::Pin<Box<dyn std::future::Future<Output = Result<${value}, JsError>>>>`;
        return [`${head}fn ${name}(${params}) -> ${future} {`, `${ind + INDENT}Box::pin(async move {`, ...body.map((line) => INDENT + line), `${ind + INDENT}})`, `${ind}}`];
      }
      return [`${head}${fn.async ? "async " : ""}fn ${name}(${params})${ret} {`, ...body, `${ind}}`];
    });
    this.frame = saved.frame;
    this.tryLabel = saved.tryLabel;
    [this.loops, this.blocks] = [saved.loops, saved.blocks];
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

  /** What `name` is here. `use`: the arguments it is called with, or "fn" for a function as a value (for a top-level name several modules declare). */
  private lookup(name: string, use?: Expr[] | "fn"): Binding | undefined {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const found = this.scopes[i]!.get(name);
      if (found) return (i === 0 && this.overloads.get(name) && this.pick(this.overloads.get(name)!, use)) || found;
    }
    return undefined;
  }

  /** The declaration a use of an overloaded name means: a variable when it is read, the function whose parameters fit when it is called. */
  private pick(options: Binding[], use: Expr[] | "fn" | undefined): Binding | undefined {
    if (use === undefined) return options.find((b) => b.kind === "global");
    const params = (b: Binding): Ty[] | undefined => (b.kind === "fn" ? b.decl.params.map((p) => p.ty) : b.ty.k === "fn" ? b.ty.params : undefined);
    const callable = options.filter((b) => params(b));
    if (use === "fn") return callable[0];
    const score = (b: Binding) => {
      const ps = params(b)!;
      if (use.length > ps.length) return -1;
      return use.reduce((sum, arg, i) => {
        const have = this.typeOf(arg);
        return sum + (have.k === "unknown" || have.k === "nil" ? 1 : this.ty(have as Ty) === this.ty(ps[i]!) ? 2 : 0);
      }, 0);
    };
    return callable.reduce<Binding | undefined>((best, b) => (best && score(best) >= score(b) ? best : b), undefined);
  }

  /** A function's name in Rust. */
  private fnName(name: string, b: Fn): string {
    return this.rustNames.get(b.decl) ?? this.name(name);
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
      case "num":
        return RUST_SIZED[t.n];
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
        return this.isTrait(t.name) ? `Rc<dyn ${t.name}>` : `Rc<${t.name}>`;
      case "fn":
        if (t.throws) return `Rc<dyn Fn(${t.params.map((p) => this.ty(p)).join(", ")}) -> Result<${this.ty(t.ret)}, JsError>>`;
        return `Rc<dyn Fn(${t.params.map((p) => this.ty(p)).join(", ")})${t.ret.k === "void" ? "" : ` -> ${this.ty(t.ret)}`}>`;
      case "rt":
        return RUNTIME_TYPES[t.name] ?? t.name;
      case "union":
        return t.name;
      case "promise":
        return `Promise<${this.ty(t.of)}>`;
      case "settled":
        return `JsSettled<${this.ty(t.of)}>`;
      case "jsmap":
        return `${t.weak ? "JsWeakMap" : "JsOMap"}<${this.ty(t.key)}, ${this.ty(t.of)}>`;
      case "jsset":
        return t.ref ? `JsWeakRef<${this.ty(t.of)}>` : `${t.weak ? "JsWeakMap" : "JsOMap"}<${this.ty(t.of)}, ()>`;
    }
  }

  /** Map / Set (mapset.rs `JsOMap`): keys are borrowed for lookups, owned (and coerced) when stored. */
  private mapSetOp(x: Extract<Expr, { e: "op" }>, ind: string): string {
    if (x.op === "mc.new") return `${this.ty(x.ty!).replace("<", "::<")}::new(${x.args[0] && x.ty?.k === "jsset" ? this.coerce(x.args[0], x.ty.of, ind) : ""})`;
    const [a, b, ...rest] = x.args;
    const name = (b as Extract<Expr, { e: "str" }>).v;
    const t = this.typeOf(a!);
    const key: Typ = t.k === "jsmap" ? t.key : t.k === "jsset" ? t.of : UNKNOWN;
    const arg = (v: Expr, i: number): string => {
      if (["get", "has", "delete"].includes(name)) return `&${this.receiver(v, ind)}`;
      if (name === "set" || name === "add") return this.coerce(v, i === 0 ? key : t.k === "jsmap" ? t.of : UNKNOWN, ind);
      if (v.e === "lambda") return this.callback(v, ind);
      return this.expr(v, ind);
    };
    return `${this.receiver(a!, ind)}.${snake(name)}(${rest.map(arg).join(", ")})`;
  }

  /** Promises (task.rs `Promise`) and async functions' state machines (asyncLower.ts). */
  private promiseOp(x: Extract<Expr, { e: "op" }>, ind: string): string | undefined {
    if (!/^(promise|async|settled|error)\./.test(x.op)) return undefined;
    const [a, b, c] = x.args;
    const of = x.ty?.k === "promise" ? x.ty.of : undefined;
    const r = () => this.receiver(a!, ind);
    const v = (e: Expr) => `${this.atom(e, ind)}.clone()`;
    const fn = (e: Expr) => (e.e === "lambda" ? this.lambda(e, ind) : this.expr(e, ind));
    const co = () => {
      const t = this.typeOf(a!);
      return t.k === "promise" ? t.of : ({ k: "void" } as Ty);
    };
    switch (x.op as string) {
      case "promise.new":
        return of?.k === "void" ? `Promise::<()>::create_void(${fn(a!)})` : `Promise::<${this.ty(of!)}>::create(${fn(a!)})`;
      case "promise.resolve":
        return `Promise::<${this.ty(of!)}>::resolved(${a ? this.coerce(a, of!, ind) : "()"})`;
      case "promise.reject":
        return `Promise::<${this.ty(of!)}>::rejected(${this.expr(a!, ind)})`;
      case "promise.then":
      case "promise.thenP":
      case "promise.catch":
      case "promise.catchP":
      case "promise.finally":
      case "promise.finallyP": {
        const name = { "promise.then": "then", "promise.thenP": "then_p", "promise.catch": "catch", "promise.catchP": "catch_p", "promise.finally": "finally", "promise.finallyP": "finally_p" }[x.op as string]!;
        return `${r()}.${name}(${fn(b!)})`;
      }
      case "promise.then2":
      case "promise.then2P":
        return `${r()}.${x.op === "promise.then2" ? "then2" : "then2_p"}(${fn(b!)}, ${fn(c!)})`;
      case "promise.all":
      case "promise.allSettled":
      case "promise.race":
      case "promise.any": {
        const t = this.typeOf(a!);
        const elem = t.k === "array" && t.of.k === "promise" ? t.of.of : ({ k: "void" } as Ty);
        const name = { "promise.all": "all", "promise.allSettled": "all_settled", "promise.race": "race", "promise.any": "any" }[x.op as string]!;
        return `Promise::<${this.ty(elem)}>::${name}(${this.coerce(a!, t as Ty, ind)})`;
      }
      case "promise.delay":
        return `js_delay(${this.coerce(a!, { k: "double" }, ind)})`;
      case "promise.native": {
        // The call runs in an async block polled at once: its arguments are evaluated now, as JavaScript does.
        const saved = { frame: this.frame, tryLabel: this.tryLabel };
        this.frame = { ...this.frame, result: true };
        this.tryLabel = undefined;
        const call = this.expr(a!, ind + INDENT);
        [this.frame, this.tryLabel] = [saved.frame, saved.tryLabel];
        const clones = this.captureClones(names(a), new Set());
        const value = of && of.k !== "void" ? this.ty(of) : "()";
        const block = `Promise::<${value}>::native(async move { Ok::<${value}, JsError>(${call}) })`;
        return clones.length ? `{ ${clones.join(" ")} ${block} }` : block;
      }
      case "settled.status":
        return `${r()}.status.clone()`;
      case "settled.value":
        return `${r()}.value.clone().unwrap()`;
      case "settled.reason":
        return `${r()}.reason.clone().unwrap()`;
      case "error.new":
        return `JsError::new(${this.expr(a!, ind)})`;
      // An object of an app's error class thrown (`throw new E()`): its name and message, and the object.
      case "error.wrap":
        return `JsError::wrap(${this.expr(b!, ind)}, ${this.expr(c!, ind)}, ${v(a!)}.as_any())`;
      case "error.obj":
        return `${r()}.obj.clone().and_then(cast__${(b as { v: string }).v})`;
      case "error.name":
        return `${r()}.name.to_string()`;
      case "async.run":
        return `js_async(${fn(a!)})`;
      case "async.await":
        return c ? `${r()}.await_with(&${this.atom(b!, ind)}, ${fn(c)})` : `${r()}.await_on(&${this.atom(b!, ind)})`;
      case "async.check":
        return this.fail(`${r()}.check()`);
      case "async.resolve":
        return `${r()}.resolve(${b ? this.coerce(b, co(), ind) : "()"})`;
      case "async.adopt":
        return `${r()}.adopt(${v(b!)})`;
      case "async.reject":
        return `${r()}.reject(${v(b!)})`;
    }
    return undefined;
  }

  /** A builder's children: `Vec<Mod>`, each child converted with `Mod::from`. */
  private isMods(t: Typ): boolean {
    return t.k === "array" && this.isMod(t.of.k === "optional" ? t.of.of : t.of);
  }

  private isMod(t: Typ): boolean {
    return t.k === "rt" && t.name === "NodeMod";
  }

  private isCopy(t: Typ): boolean {
    return t.k === "int" || t.k === "double" || t.k === "num" || t.k === "bool" || t.k === "void" || t.k === "enum" || (t.k === "rt" && COPY_RUNTIME_TYPES.has(t.name));
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
      case "numCast":
        return x.to;
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
        const picked = x.callee.e === "id" ? this.lookup(x.callee.name, x.args) : undefined;
        if (picked?.kind === "fn") return picked.decl.ret;
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
        if (x.ty) return x.ty;
        if (x.op.startsWith("async.") || x.op === "promise.adopt") return { k: "void" };
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
      case "with":
        return this.scoped(() => (this.declare(x.name, { kind: "local", ty: x.ty, boxed: false }), this.typeOf(x.body)));
      case "seq":
        return x.ty;
      case "coalesce": {
        const r = this.typeOf(x.r);
        if (r.k !== "nil" && r.k !== "unknown") return r;
        const l = this.typeOf(x.l);
        // `x ?? nil` of an `Option<Option<T>>` (a missing optional element): flattened.
        return l.k === "optional" && l.of.k === "optional" ? l.of : l;
      }
      case "lambda":
        return { k: "fn", params: x.params.map((p) => p.ty), ret: x.ret };
      case "new":
      case "construct":
        return { k: "class", name: x.cls };
      case "instanceOf":
        return { k: "bool" };
      case "downcast":
        return { k: "class", name: x.cls };
      case "uwrap":
        return { k: "union", name: x.u };
      case "uis":
        return { k: "bool" };
      case "uget":
        return x.ty;
      case "invoke": {
        const obj = x.sup ? ({ k: "class", name: x.sup } as Typ) : this.typeOf(x.obj);
        return obj.k === "class" ? (this.member(obj.name, x.name)?.ty ?? UNKNOWN) : UNKNOWN;
      }
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
      case "await":
        return x.ty;
      case "incr":
        return this.typeOf(x.target);
      case "decoder":
        return UNKNOWN;
    }
  }

  private fieldType(obj: Typ, name: string): Typ {
    if (obj.k === "class" && (this.objects.has(obj.name) || this.protocols.has(obj.name))) return this.member(obj.name, name)?.ty ?? UNKNOWN;
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
      case "int.wideRem":
      case "arr.pushLen":
      case "arr.pushAllLen":
      case "arr.unshiftLen":
      case "arr.indexOf":
      case "arr.findIndex":
      case "str.length":
      case "math.floor":
      case "math.ceil":
      case "math.round":
      case "math.trunc":
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
      case "error.text":
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
      case "int.parse":
      case "bit.ushr":
        return { k: "double" };
      case "arr.concat":
      case "arr.sort":
      case "arr.reverse":
      case "arr.filterI":
        return receiver();
      case "arr.shift":
      case "arr.atRel":
      case "arr.findI":
        return element();
      case "arr.lastIndexOf":
      case "arr.findIndexI":
      case "str.indexOf":
      case "str.lastIndexOf":
      case "str.compare":
      case "bit.and":
      case "bit.or":
      case "bit.xor":
      case "bit.shl":
      case "bit.shr":
      case "bit.not":
      case "bit.imul":
      case "bit.clz32":
        return { k: "int" };
      case "arr.reduce": {
        const fn = args[1] ? this.typeOf(args[1]) : UNKNOWN;
        return fn.k === "fn" ? fn.ret : args[2] ? this.typeOf(args[2]) : UNKNOWN;
      }
      case "arr.mapI": {
        const fn = args[1] ? this.typeOf(args[1]) : UNKNOWN;
        return fn.k === "fn" ? { k: "array", of: fn.ret } : UNKNOWN;
      }
      case "arr.someI":
      case "arr.everyI":
      case "map.has":
        return { k: "bool" };
      case "arr.forEachI":
      case "map.delete":
        return { k: "void" };
      case "str.split":
      case "map.keys":
        return { k: "array", of: { k: "string" } };
      case "map.values": {
        const t = receiver();
        return t.k === "map" ? { k: "array", of: t.of } : UNKNOWN;
      }
      case "str.replace":
      case "str.replaceAll":
      case "str.padStart":
      case "str.padEnd":
      case "str.repeat":
      case "str.trimStart":
      case "str.trimEnd":
        return { k: "string" };
      case "math.fn": {
        const name = args[0]?.e === "str" ? args[0].v : "";
        return ["isInteger", "isNaN", "isFinite"].includes(name) ? { k: "bool" } : { k: "double" };
      }
      case "big.toNumber":
        return { k: "double" };
      case "big.str":
        return { k: "string" };
      case "sym.new":
        return rt("Symbol");
      case "sym.description":
        return { k: "optional", of: { k: "string" } };
      default:
        return op.startsWith("big.") ? rt("BigInt") : UNKNOWN;
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
        if (x.op === "mc.new" || x.op === "mc.call") return this.mapSetOp(x, ind);
        return this.promiseOp(x, ind) ?? this.op(x.op, x.args, ind, !!x.await, !!x.chain, !!x.throws);
      case "bin":
        return this.binary(x, ind);
      case "not":
        return `!${this.atom(x.x, ind)}`;
      case "neg":
        return `-${this.atom(x.x, ind)}`;
      case "cond":
        return `if ${this.expr(x.c, ind)} { ${this.coerce(x.a, this.typeOf(x), ind)} } else { ${this.coerce(x.b, this.typeOf(x), ind)} }`;
      case "unwrap":
        // A trap that says which JavaScript operation failed (the other targets' words).
        return `${this.atom(x.x, ind)}.expect("nuclo: a \`!\` assertion found null or undefined")`;
      // A block: the assignments, then the value.
      case "seq": {
        const i2 = ind + INDENT;
        return this.scoped(() => `{\n${this.body(x.body, i2).join("\n")}\n${i2}${this.coerce(x.x, x.ty, i2)}\n${ind}}`);
      }
      case "with": {
        const init = this.coerce(x.init, x.ty, ind);
        return this.scoped(() => {
          this.declare(x.name, { kind: "local", ty: x.ty, boxed: false });
          return `{ let ${this.name(x.name)}: ${this.ty(x.ty)} = ${init}; ${this.expr(x.body, ind)} }`;
        });
      }
      case "coalesce": {
        // A match, not `unwrap_or_else`: the fallback may await or fail, which a closure can't.
        const [l, want] = [this.typeOf(x.l), this.typeOf(x)];
        if (l.k !== "optional") return this.expr(x.l, ind);
        if (l.of.k === "optional" && x.r.e === "nil") return `${this.atom(x.l, ind)}.flatten()`;
        const some =want.k === "optional" ? "Some(v__)" : "v__";
        return `match ${this.expr(x.l, ind)} { Some(v__) => ${some}, None => ${this.coerce(x.r, want, ind)} }`;
      }
      case "toDouble":
        return `(${this.atom(x.x, ind)} as f64)`;
      case "toInt":
        return `(${this.atom(x.x, ind)} as i64)`;
      case "numCast":
        return `(${this.atom(x.x, ind)} as ${this.ty(x.to)})`;
      case "toStr":
        return x.from.k === "double" ? `js_num(${this.expr(x.x, ind)})` : x.from.k === "string" ? this.expr(x.x, ind) : `${this.atom(x.x, ind)}.to_string()`;
      case "lambda":
        return `f${x.params.length}(${this.lambda(x, ind)})`;
      case "new":
        return this.construct(x, ind);
      case "construct": {
        const c = this.objects.get(x.cls)!;
        const args = c.ctor.params.map((p, i) => {
          const arg = x.args[i] ?? p.default;
          return arg ? this.coerce(arg, p.ty, ind + INDENT) : "None";
        });
        const made = this.layout(`${this.structName(c)}::new`, args, ind);
        return x.throws ? this.fail(made) : made;
      }
      case "invoke":
        return this.invoke(x, ind);
      case "instanceOf":
        return `cast__${x.cls}(${this.atom(x.x, ind)}.as_any()).is_some()`;
      case "downcast":
        return `cast__${x.cls}(${this.atom(x.x, ind)}.as_any()).unwrap()`;
      case "uwrap":
        return x.ty.k === "void" ? `${x.u}::${x.tag}` : `${x.u}::${x.tag}(${this.coerce(x.x, x.ty, ind)})`;
      case "uis":
        return `${this.receiver(x.x, ind)}.is_${x.tag}()`;
      case "uget":
        return `${this.receiver(x.x, ind)}.as_${x.tag}()`;
      case "arr": {
        const of = x.of.k === "class" && !this.classes.has(x.of.name) && !this.objects.has(x.of.name) && !this.protocols.has(x.of.name) ? undefined : x.of;
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
      case "incr": {
        // A block: read, write back, give the old (x++) or the new (++x) value.
        const step = this.assign({ s: "assign", target: x.target, op: x.op, value: x.one }, ind);
        const read = this.expr(x.target, ind);
        return x.prefix ? `{ ${step}; ${read} }` : `{ let v__ = ${read}; ${step}; v__ }`;
      }
      case "launch": {
        const call = this.expr({ ...x.call, await: false } as Expr, ind);
        // launch() logs a failure: a native function has none to report.
        const callee = x.call.e === "call" && x.call.callee.e === "id" ? this.lookup(x.call.callee.name, x.call.args) : undefined;
        return callee?.kind === "fn" && callee.native ? `launch(async move { Ok::<_, JsError>(${call}.await) })` : `launch(${call})`;
      }
      case "await":
        throw new Error("an `await` reached the Rust printer (asyncLower.ts takes them apart)");
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
    if (x.sup) return this.callExpr({ e: "call", callee: { e: "id", name: `m__${x.sup}__${x.name}` }, args: [x.obj], throws: x.throws }, ind);
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
    if (obj.k === "class" && this.isTrait(obj.name)) {
      const get = `${this.receiver(x.obj, ind)}.get_${x.name}()`;
      return x.throws ? this.fail(get) : get;
    }
    if (obj.k === "class" && this.member(obj.name, x.name)?.kind === "getter") {
      return this.callExpr({ e: "call", callee: { e: "id", name: `m__${this.definer(obj.name, x.name)}__${x.name}` }, args: [x.obj], throws: x.throws }, ind);
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
    // Two objects of the app's classes or protocols, maybe of different types: the same object or not.
    const isObject = (t: Typ) => t.k === "class" && (this.objects.has(t.name) || this.protocols.has(t.name));
    // A record and a shape protocol it conforms to (or two records): the same object or not.
    const isRecord = (t: Typ) => t.k === "class" && this.classes.has(t.name);
    const sameRecord = isRecord(lt) && isRecord(rt_) && JSON.stringify(lt) === JSON.stringify(rt_);
    if ((isObject(lt) || isRecord(lt)) && (isObject(rt_) || isRecord(rt_)) && !sameRecord) return `${not ? "!" : ""}std::ptr::addr_eq(Rc::as_ptr(&${this.atom(x.l, ind)}), Rc::as_ptr(&${this.atom(x.r, ind)}))`;
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
    if (want.k === "class" && this.isTrait(want.name)) {
      // A class value where its base or a protocol is expected: an explicit unsizing cast (a vec! or an
      // `if` infers its type from the value, not from the slot).
      const have = this.typeOf(x);
      if (have.k === "class" && (have.name !== want.name || x.e === "construct")) return `(${this.expr(x, ind)} as ${this.ty(want)})`;
    }
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
    const made = `Rc::new(${this.layout(`${x.cls} `, fields, ind, "{}")})`;
    return cls.gc ? `gc_track(${made})` : made;
  }

  /**
   * A tracked struct's `GcNode` (cycles.ts rule 6): `gc_traverse` reports each tracked object its fields hold, as
   * references (borrowed: no count changes), `gc_clear` empties those fields.
   */
  private gcImpl(name: string, fields: { name: string; ty: Ty }[]): string[] {
    const [i1, i2] = [INDENT, INDENT + INDENT];
    return [
      `impl GcNode for ${name} {`,
      `${i1}fn gc_traverse(&self, s: &mut GcScan) {`,
      ...fields.map((f) => `${i2}self.${this.name(f.name)}.gc_peek(|v| ${this.gcVisit(f.ty, "v", 0)});`),
      `${i1}}`,
      `${i1}fn gc_clear(&self) {`,
      ...fields.map((f) => `${i2}self.${this.name(f.name)}.gc_clear();`),
      `${i1}}`,
      "}",
    ];
  }

  /** An expression reporting `v` (a `&` of a `ty`) to the scan `s`: the tracked objects in it. */
  private gcVisit(ty: Ty, v: string, d: number): string {
    const inner = (t: Ty, x: string) => (gcWalks(this.gcLeaf, t) ? this.gcVisit(t, x, d + 1) : "{}");
    switch (ty.k) {
      case "class":
        return `s.rc(${v})`;
      case "optional":
        return `if let Some(x${d}) = ${v} { ${this.gcVisit(ty.of, `x${d}`, d + 1)} }`;
      case "array":
        return `s.arr(${v}, |s, e${d}| ${inner(ty.of, `e${d}`)})`;
      case "map":
        return `s.map(${v}, |s, e${d}| ${inner(ty.of, `e${d}`)})`;
      case "jsmap":
        return `s.omap(${v}, |s, k${d}| ${inner(ty.key, `k${d}`)}, |s, e${d}| ${inner(ty.of, `e${d}`)})`;
      case "jsset":
        return `s.omap(${v}, |s, e${d}| ${inner(ty.of, `e${d}`)}, |_, _| {})`;
      default:
        return "{}";
    }
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
      const v =
        kind === "number" || kind === "enum"
          ? `Some(${this.expr(value, inner)})`
          : kind === "state" || kind === "media" || kind === "animation"
            ? `css_${kind}(${this.expr(value, inner)})`
            : `css_${kind}(${this.strRef(value, inner)})`;
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
    const saved = { frame: this.frame, tryLabel: this.tryLabel, loops: this.loops, blocks: this.blocks };
    [this.loops, this.blocks] = [[], 0];
    const clones = this.captureClones(names(x), new Set(x.params.map((p) => p.name)));
    // A closure that can throw returns a `Result`.
    const result = !!x.throws;
    this.frame = { ret: x.ret, result, captured: captured(x.body) };
    this.tryLabel = undefined;
    const closure = this.scoped(() => {
      for (const p of x.params) this.declare(p.name, { kind: "local", ty: p.ty, boxed: false });
      const params = x.params.map((p) => `${p.unused ? "_" : this.name(p.name)}: ${this.ty(p.ty)}`).join(", ");
      const head = `move |${params}|${result ? ` -> Result<${this.ty(x.ret)}, JsError>` : x.ret.k === "void" ? "" : ` -> ${this.ty(x.ret)}`}`;
      if (!Array.isArray(x.body)) {
        const coerced = this.coerce(x.body, x.ret, ind + INDENT);
        const value = result ? `Ok(${coerced})` : coerced;
        return value.includes("\n") || value.length + ind.length > 90 ? `${head} {\n${ind + INDENT}${value}\n${ind}}` : `${head} { ${value} }`;
      }
      const lines = this.body(x.body, ind + INDENT);
      if (result && x.ret.k === "void") lines.push(`${ind + INDENT}Ok(())`);
      if (lines.length === 1 && lines[0]!.length < 90 && !this.returns(x.body)) return `${head} { ${lines[0]!.trim()} }`;
      return `${head} {\n${lines.join("\n")}\n${ind}}`;
    });
    this.frame = saved.frame;
    this.tryLabel = saved.tryLabel;
    [this.loops, this.blocks] = [saved.loops, saved.blocks];
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
    const b = x.e === "id" ? this.lookup(x.name, "fn") : undefined;
    if (x.e !== "id" || b?.kind !== "fn") return this.expr(x, ind);
    const own: Ty = { k: "fn", params: b.decl.params.map((p) => p.ty), ret: b.decl.ret, ...(b.decl.throws ? { throws: true } : {}) };
    if (!want || this.ty(own) === this.ty(want)) return `f${b.decl.params.length}(${this.fnItem(x.name, b, ind)})`;
    // The slot's signature differs (it returns `Node | null`, the function a `Node`): adapt.
    const params: Param[] = want.params.map((ty, i) => ({ name: `p${i}`, ty, unused: i >= b.decl.params.length }));
    const call: Expr = { e: "call", callee: { e: "id", name: x.name }, args: b.decl.params.map((_, i) => ({ e: "id", name: `p${i}` })), throws: b.decl.throws };
    return this.fnValue({ e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : call, throws: want.throws }, ind);
  }

  /** A declared function as something callable: its name, or a closure supplying what it captures. */
  private fnItem(name: string, b: Fn, ind: string): string {
    if (!b.captures.size && !b.decl.async) return this.fnName(name, b);
    const params: Param[] = b.decl.params.map((p) => ({ name: p.name, ty: p.ty }));
    const call: Expr = { e: "call", callee: { e: "id", name }, args: params.map((p) => ({ e: "id", name: p.name })), throws: b.decl.throws };
    return this.lambda({ e: "lambda", params, ret: b.decl.ret, body: b.decl.ret.k === "void" ? [{ s: "expr", x: call }] : call, throws: b.decl.throws }, ind);
  }

  /** A callback for an array method, called before the method returns: no `Rc` needed. */
  private callback(x: Expr, ind: string): string {
    if (x.e === "lambda") return this.lambda(x, ind);
    const b = x.e === "id" ? this.lookup(x.name, "fn") : undefined;
    if (x.e === "id" && b?.kind === "fn") return this.fnItem(x.name, b, ind);
    return `&*${this.atom(x, ind)}`;
  }

  /** ToInt32 of a number: a literal says its type, which an untyped `5` would not. */
  private i32(x: Expr, ind: string): string {
    if (x.e === "int") return `${x.v}i64.js_i32()`;
    if (x.e === "double") return `${this.expr(x, ind)}f64.js_i32()`;
    return `(${this.expr(x, ind)}).js_i32()`;
  }

  /**
   * `.await` and, for a call that can fail, what a failure does: leave the `try` block, or return the error.
   * `fallible`: an awaited call can fail; `throws`: a synchronous one can (it returns a `Result`).
   */
  private finish(call: string, awaited: boolean | undefined, fallible: boolean, throws = false): string {
    const s = awaited ? `${call}.await` : call;
    if ((!awaited || !fallible) && !throws) return s;
    return this.fail(s);
  }

  /** A `Result` whose error leaves the innermost `try` block, or the function. */
  private fail(s: string): string {
    if (this.tryLabel) return `(match ${s} { Ok(v__) => v__, Err(e__) => break ${this.tryLabel} Err(e__) })`;
    return this.frame.result ? `${s}?` : `${s}.unwrap()`;
  }

  private callExpr(x: Extract<Expr, { e: "call" }>, ind: string): string {
    const inner = ind + INDENT;
    const b = x.callee.e === "id" ? this.lookup(x.callee.name, x.args) : undefined;
    if (x.callee.e === "id" && b?.kind === "fn") {
      const args = b.decl.params.map((p, i) => {
        const arg = x.args[i] ?? p.default;
        if (i === 0 && arg && this.byRef.has(b.decl)) return this.thisRef(arg, p.ty, inner);
        return arg ? this.coerce(arg, p.ty, inner) : "None";
      });
      // What a local function captures travels with each call.
      for (const [capture, local] of b.captures) args.push(local.boxed || !this.isCopy(local.ty) ? `${this.name(capture)}.clone()` : this.name(capture));
      // The app's own async functions return a Result; a native one returns its value.
      return this.finish(this.layout(this.fnName(x.callee.name, b), args, ind), x.await, b.decl.async && !b.native, x.throws);
    }
    const callee = this.typeOf(x.callee);
    if (this.isRt(callee, "Variants")) {
      const selection = x.args[0]?.e === "dict" ? x.args[0].entries.map(([k, v]) => `(${this.str(k)}, ${this.strRef(v, inner)})`) : [];
      return `${this.receiver(x.callee, ind)}.select(&${this.layout("", selection, ind, "[]")})`;
    }
    const params = callee.k === "fn" ? callee.params : [];
    const args = x.args.map((arg, i) => (params[i] ? this.coerce(arg, params[i]!, inner) : this.expr(arg, inner)));
    // `(f)(…)`: the callee is an `Rc<dyn Fn>` in a variable, a field or an optional just unwrapped.
    return this.finish(this.layout(`(${this.receiver(x.callee, ind)})`, args, ind), x.await, false, x.throws);
  }

  /** `this` for a class's free function: the object borrowed, or as its base / protocol (a cast of a clone). */
  private thisRef(x: Expr, want: Ty, ind: string): string {
    const have = this.typeOf(x);
    if (have.k === "class" && want.k === "class" && have.name === want.name) return `&${this.receiver(x, ind)}`;
    return `&${this.coerce(x, want, ind)}`;
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
        const [title, presentation, header, end] = [named.get("title"), named.get("presentation"), named.get("header"), named.get("onEndReached")];
        const options = [
          title ? `Some(${fn(title)})` : "None",
          presentation ? this.strRef(presentation, ind) : '"push"',
          header ? this.expr(header, ind) : "true",
          end ? `Some(${fn(end, { k: "fn", params: [{ k: "map", of: { k: "string" } }], ret: { k: "void" } })})` : "None",
        ];
        return this.layout("Route::new", [this.strRef(x.args[0]!, ind), fn(x.args[1]), ...options], ind);
      }
      case "MediaRule": {
        const bound = (arg: Expr) => (arg.e === "nil" ? "None" : `Some(${this.expr(arg, inner)})`);
        return this.layout("MediaRule::new", [bound(x.args[0]!), bound(x.args[1]!), this.expr(x.args[2]!, inner)], ind);
      }
      case "KeyframeStop":
        return this.layout("KeyframeStop::new", [this.expr(x.args[0]!, inner), this.expr(x.args[1]!, inner)], ind);
      case "StyleAnimation":
        return this.layout("StyleAnimation::new", x.args.map((a) => this.expr(a, inner)), ind);
      case "globalStyle":
        return this.layout("global_style", [this.strRef(x.args[0]!, inner), this.expr(x.args[1]!, inner)], ind);
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

  /** `throws`: the callback can throw: the `try_` form of the array method, which returns a `Result`. */
  protected op(op: Op, args: Expr[], ind: string, _awaited = false, chain = false, throws = false): string {
    const jsonDate = this.jsonDateOp(op, args, ind);
    if (jsonDate !== undefined) return jsonDate;
    const [a, b, c] = args;
    if (chain && a && this.typeOf(a).k === "optional") {
      // `a?.b.length`: the operation runs on the value inside the optional.
      const inside = (this.typeOf(a) as Extract<Ty, { k: "optional" }>).of;
      const local = this.place(a);
      return this.scoped(() => {
        this.declare("o__", { kind: "local", ty: inside, boxed: false });
        const rest = this.op(op, [{ e: "id", name: "o__" }, ...args.slice(1)], ind, false, false, throws);
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
    // An array method taking a callback: its `try_` form when the callback can throw.
    const each = (method: string, rest: string) => (throws ? this.fail(`${r()}.try_${method}(${rest})`) : `${r()}.${method}(${rest})`);
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
      // As a value: the new length (the receiver read once, before the argument).
      case "arr.pushLen":
        return `{ let a__ = &${r()}; a__.push(${this.coerce(b!, elem(), ind)}); a__.len() }`;
      case "arr.pushAllLen":
        return `{ let a__ = &${r()}; a__.push_all(${e(b!)}); a__.len() }`;
      case "arr.unshiftLen":
        return `{ let a__ = &${r()}; a__.unshift(${this.coerce(b!, elem(), ind)}); a__.len() }`;
      case "arr.splice":
        return args[3] ? `${r()}.splice_items(${e(b!)}, ${e(c!)}, ${e(args[3])})` : `${r()}.splice(${e(b!)}, ${e(c!)})`;
      case "arr.indexOf":
        return c ? `${r()}.index_of_from(&${this.coerce(b!, elem(), ind)}, ${e(c)})` : `${r()}.index_of(&${this.coerce(b!, elem(), ind)})`;
      case "arr.includes":
        return c ? `${r()}.includes_from(&${this.coerce(b!, elem(), ind)}, ${e(c)})` : `${r()}.includes(&${this.coerce(b!, elem(), ind)})`;
      case "arr.fill":
        return `${r()}.fill(${this.coerce(b!, elem(), ind)}, ${e(c!)}, ${args[3] ? `Some(${e(args[3])})` : "None"})`;
      case "arr.copyWithin":
        return `${r()}.copy_within(${e(b!)}, ${e(c!)}, ${args[3] ? `Some(${e(args[3])})` : "None"})`;
      case "arr.filled": {
        const of = (a as Extract<Expr, { e: "arr" }>).of;
        const call = `Arr::<${this.ty(of)}>::${throws ? "try_" : ""}filled(${e(b!)}, ${this.coerce(c!, of, ind)})`;
        return throws ? this.fail(call) : call;
      }
      case "arr.fromLength": {
        const call = `Arr::<${this.ty((a as Extract<Expr, { e: "arr" }>).of)}>::${throws ? "try_" : ""}from_len(${e(b!)}, ${this.callback(c!, ind)})`;
        return throws ? this.fail(call) : call;
      }
      case "arr.flat":
        return `${r()}.flat()`;
      case "arr.reduceRight":
        return each("reduce_right", `${this.coerce(c!, this.typeOf(c!), ind)}, ${this.callback(b!, ind)}`);
      case "arr.findLast":
        return each("find_last_i", this.callback(b!, ind));
      case "arr.findLastIndex":
        return each("find_last_index_i", this.callback(b!, ind));
      case "arr.toSpliced":
        return `${r()}.to_spliced(${e(b!)}, ${e(c!)}, ${args[3] ? `Some(${e(args[3])})` : "None"})`;
      case "arr.with":
        return args[3] ? `${r()}.try_with(${e(b!)}, ${this.coerce(c!, elem(), ind)}).unwrap()` : this.fail(`${r()}.try_with(${e(b!)}, ${this.coerce(c!, elem(), ind)})`);
      case "arr.find":
      case "arr.findIndex":
      case "arr.filter":
      case "arr.map":
      case "arr.some":
      case "arr.every":
      case "arr.forEach":
        return each(snake(op.slice(4)), this.callback(b!, ind));
      case "arr.join":
        return `${r()}.join(${s(b!)})`;
      case "arr.slice":
        return `${r()}.slice(${e(b!)}, ${this.coerce(c!, { k: "optional", of: { k: "int" } }, ind)})`;
      case "str.slice":
        return `js_str_slice(${s(a!)}, ${e(b!)}, ${this.coerce(c!, { k: "optional", of: { k: "int" } }, ind)})`;
      case "str.trim":
        return `js_trim(${s(a!)})`;
      case "arr.concat":
        return `Arr::concat(${this.layout("vec!", args.map(e), ind, "[]")})`;
      case "arr.sort":
        return each("sort", this.callback(b!, ind));
      case "arr.reverse":
        return `${r()}.reverse()`;
      case "arr.shift":
        return `${r()}.shift()`;
      case "arr.lastIndexOf":
        return c ? `${r()}.last_index_of_from(&${this.coerce(b!, elem(), ind)}, ${e(c)})` : `${r()}.last_index_of(&${this.coerce(b!, elem(), ind)})`;
      case "arr.atRel":
        return `${r()}.at_rel(${e(b!)})`;
      case "arr.reduce":
        return each("reduce", `${this.coerce(c!, this.opType(op, args), ind)}, ${this.callback(b!, ind)}`);
      case "arr.mapI":
      case "arr.filterI":
      case "arr.forEachI":
      case "arr.someI":
      case "arr.everyI":
      case "arr.findI":
      case "arr.findIndexI":
        return each(`${snake(op.slice(4, -1))}_i`, this.callback(b!, ind));
      case "map.delete":
        return `${r()}.remove(${s(b!)})`;
      case "map.has":
        return `${r()}.has(${s(b!)})`;
      case "map.keys":
        return `${r()}.keys()`;
      case "map.values":
        return `${r()}.values()`;
      case "str.split":
        return `js_split(${s(a!)}, ${s(b!)})`;
      case "str.replace":
      case "str.replaceAll":
        return `js_replace(${s(a!)}, ${s(b!)}, ${s(c!)}, ${op === "str.replaceAll"})`;
      case "str.indexOf":
        return `js_index_of(${s(a!)}, ${s(b!)}, ${e(c!)})`;
      case "str.lastIndexOf":
        return `js_last_index_of(${s(a!)}, ${s(b!)})`;
      case "str.padStart":
      case "str.padEnd":
        return `js_pad(${s(a!)}, ${e(b!)}, ${s(c!)}, ${op === "str.padStart"})`;
      case "str.repeat":
        return `js_repeat(${s(a!)}, ${e(b!)})`;
      case "str.trimStart":
        return `js_trim_start(${s(a!)})`;
      case "str.trimEnd":
        return `js_trim_end(${s(a!)})`;
      case "str.compare":
        return `js_compare(${s(a!)}, ${s(b!)})`;
      case "int.wideRem":
        return `(${this.atom(a!, ind)} % ${this.atom(b!, ind)})`;
      case "math.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v;
        // `%` binds tighter than `+`: the operands are atoms.
        if (name === "fmod") return `(${this.atom(args[1]!, ind)} % ${this.atom(args[2]!, ind)})`;
        const x = args.slice(1).map(e);
        const special: Record<string, string> = {
          sign: `js_sign(${x[0]})`, isInteger: `js_is_integer(${x[0]})`, isNaN: `f64::is_nan(${x[0]})`, isFinite: `f64::is_finite(${x[0]})`,
          Infinity: "f64::INFINITY", NaN: "f64::NAN", log: `f64::ln(${x[0]})`, jsRound: `js_round_d(${x[0]})`, log1p: `f64::ln_1p(${x[0]})`, expm1: `f64::exp_m1(${x[0]})`,
          fround: `((${x[0]}) as f64 as f32 as f64)`, asinh: `js_asinh(${x[0]})`, acosh: `js_acosh(${x[0]})`, atanh: `js_atanh(${x[0]})`,
        };
        return special[name] ?? `f64::${name}(${x.join(", ")})`;
      }
      case "bit.and":
      case "bit.or":
      case "bit.xor": {
        const sym = { "bit.and": "&", "bit.or": "|", "bit.xor": "^" }[op];
        return `(${this.i32(a!, ind)} ${sym} ${this.i32(b!, ind)}) as i64`;
      }
      case "bit.shl":
      case "bit.shr":
        return `(${this.i32(a!, ind)}.wrapping_${op.slice(4)}(${this.i32(b!, ind)} as u32) as i64)`;
      case "bit.ushr":
        return `((${this.i32(a!, ind)} as u32).wrapping_shr(${this.i32(b!, ind)} as u32) as f64)`;
      case "bit.not":
        return `(!${this.i32(a!, ind)} as i64)`;
      case "bit.imul":
        return `(${this.i32(a!, ind)}.wrapping_mul(${this.i32(b!, ind)}) as i64)`;
      case "bit.clz32":
        return `((${this.i32(a!, ind)} as u32).leading_zeros() as i64)`;
      case "js.fn": {
        const name = (a as Extract<Expr, { e: "str" }>).v;
        const rest = args.slice(1);
        // fromCharCode / fromCodePoint take a slice of their codes; an array of them (`...codes`) by reference.
        const list = /^from(CharCode|CodePoint)!?$/.test(name);
        const array = /^from(CharCodes|CodePoints)!?$/.test(name);
        // ArrayBuffer / DataView / typed array arguments (lib4) by reference.
        const byRef = (x: Expr) => { const t = this.typeOf(x); return t.k === "rt" && /Array$|^ArrayBuffer$|^DataView$/.test(t.name); };
        const text = list ? `&[${rest.map(e).join(", ")}]` : rest.map((x) => (this.typeOf(x).k === "string" ? s(x) : array || byRef(x) ? `&${this.receiver(x, ind)}` : e(x))).join(", ");
        const call = `js_${snake(name.replace("!", ""))}(${text})`;
        return name.endsWith("!") ? `${call}.unwrap()` : throws ? this.fail(call) : call;
      }
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
        return `js_pow(${e(a!)}, ${e(b!)})`;
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
        return `js_parse_int(${s(a!)}, ${e(b!)})`;
      case "error.message":
        return `js_error_message(&${r()})`;
      case "error.text":
        return `${r()}.message.clone()`;
      default:
        return op.startsWith("ta.") ? this.typedArrayOp(op, args, ind) : this.bigOp(op, args, ind);
    }
  }

  /** Typed arrays (typedarray.rs: `TypedArray<K>` over shared `Rc<[Cell<_>]>`): callbacks are plain closures. */
  private typedArrayOp(op: Op, args: Expr[], ind: string): string {
    const [a, b, ...rest] = args;
    const name = (b as Extract<Expr, { e: "str" }>).v;
    if (op === "ta.new") {
      const form = (a as Extract<Expr, { e: "str" }>).v;
      const value = rest[0]!;
      return form === "len" ? `${name}::new(${this.expr(value, ind)})` : form === "typed" ? `${name}::from_ta(&${this.receiver(value, ind)})` : `${name}::from_doubles(${this.expr(value, ind)})`;
    }
    if (op === "ta.prop") return `${this.receiver(a!, ind)}.${snake(name)}()`;
    const arg = (x: Expr, i: number) => {
      if (x.e === "lambda") return this.callback(x, ind);
      if (name === "join") return this.strRef(x, ind);
      if (name === "setFromTa" && i === 0) return `&${this.receiver(x, ind)}`;
      return this.expr(x, ind);
    };
    return `${this.receiver(a!, ind)}.${snake(name)}(${rest.map(arg).join(", ")})`;
  }

  /** bigint and symbol operations (`JsBigInt`, `JsSymbol` in bigint.rs): owned operands; a throwing one returns a `Result`. */
  private bigOp(op: Op, args: Expr[], ind: string): string {
    const [a, b] = args;
    const p = (x: Expr) => this.atom(x, ind);
    const e = (x: Expr) => this.expr(x, ind);
    // `/`, `%` and `**` by a literal the front-end checked can't throw; anything else is the checking function.
    const throwing = !(b?.e === "op" && b.op === "big.lit");
    const infix: Partial<Record<Op, string>> = { "big.add": "+", "big.sub": "-", "big.mul": "*", "big.and": "&", "big.or": "|", "big.xor": "^", "big.shl": "<<", "big.shr": ">>" };
    if (infix[op]) return `(${p(a!)} ${infix[op]} ${p(b!)})`;
    switch (op) {
      case "big.lit": {
        const v = (a as Extract<Expr, { e: "str" }>).v;
        return BigInt(v) > 9223372036854775807n || BigInt(v) < -9223372036854775807n ? `JsBigInt::lit("${v}")` : `JsBigInt::from(${v}i64)`;
      }
      case "big.div":
      case "big.mod":
        return throwing ? this.fail(`js_big_${op.slice(4)}(${e(a!)}, ${e(b!)})`) : `(${p(a!)} ${op === "big.div" ? "/" : "%"} ${p(b!)})`;
      case "big.pow":
        return throwing ? this.fail(`js_big_pow(${e(a!)}, ${e(b!)})`) : `${p(a!)}.pow(&${p(b!)})`;
      case "big.neg":
        return `(-${p(a!)})`;
      case "big.not":
        return `(!${p(a!)})`;
      case "big.from":
        return `JsBigInt::from(${e(a!)})`;
      case "big.fromDouble":
        return this.fail(`js_big_from(${e(a!)})`);
      case "big.parse":
        return this.fail(`js_big_parse(${this.strRef(a!, ind)})`);
      case "big.toNumber":
        return `${this.receiver(a!, ind)}.to_f64()`;
      case "big.str":
        return b!.e === "int" ? `${this.receiver(a!, ind)}.to_string_radix(${b!.v})` : this.fail(`js_big_to_string(&${this.receiver(a!, ind)}, ${e(b!)})`);
      case "big.asIntN":
        return `JsBigInt::as_int_n(${e(a!)}, ${e(b!)})`;
      case "big.asUintN":
        return `JsBigInt::as_uint_n(${e(a!)}, ${e(b!)})`;
      case "sym.new":
        return `JsSymbol::new(${this.coerce(a!, { k: "optional", of: { k: "string" } }, ind)})`;
      case "sym.description":
        return `${this.receiver(a!, ind)}.description()`;
      default:
        return `/* ${op} */`;
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
          return this.loop(head, () => this.body(s.body, i2), `${ind}}`, s.label);
        });
      }
      case "forRange": {
        // Int is i64: a literal-only range would infer i32 and wrap `i * 7919` (the bench's mapNum).
        const from = this.atom(s.from, ind).replace(/^\d+$/, "$&i64");
        const head = `${ind}for ${this.name(s.name)} in ${from}..${s.inclusive ? "=" : ""}${this.atom(s.to, ind)} {`;
        return this.scoped(() => {
          this.declare(s.name, { kind: "local", ty: { k: "int" }, boxed: false });
          return this.loop(head, () => this.body(s.body, i2), `${ind}}`, s.label);
        });
      }
      case "while":
        return this.loop(`${ind}while ${this.expr(s.c, ind)} {`, () => this.body(s.body, i2), `${ind}}`, s.label);
      case "return": {
        const value = s.x ? this.coerce(s.x, this.frame.ret, ind) : this.frame.result ? "()" : "";
        return [`${ind}return${this.frame.result ? ` Ok(${value})` : value ? ` ${value}` : ""};`];
      }
      case "break":
      case "continue": {
        if (s.label) return [`${ind}${s.s} '${s.label};`];
        // Out of a labelled block (a try block) to the loop around it: by the loop's label.
        const loop = this.loops.at(-1);
        if (!loop || this.blocks === loop.blocks) return [`${ind}${s.s};`];
        loop.used = true;
        return [`${ind}${s.s} ${loop.label};`];
      }
      case "block": {
        this.blocks++;
        const body = this.body(s.body, i2);
        this.blocks--;
        return [`${ind}'${s.label}: {`, ...body, `${ind}}`];
      }
      case "rethrow": {
        const error = `Err(${this.expr(s.error, ind)})`;
        if (this.tryLabel) return [`${ind}break ${this.tryLabel} ${error};`];
        return [this.frame.result ? `${ind}return ${error};` : `${ind}panic!("{}", js_error_message(&${this.expr(s.error, ind)}));`];
      }
      case "try": {
        // No `finally` in Rust: what leaves the blocks is recorded, and taken after the finally block.
        if (s.lowered) return this.body(s.lowered, ind);
        // A labelled block evaluating to a Result: a failing call inside breaks out with its
        // error, while `return`, `break` and `continue` keep meaning what they mean.
        const outer = this.tryLabel;
        const label = `'try${++this.tryCount}`;
        this.tryLabel = label;
        this.blocks++;
        const body = this.body(s.body, i2);
        this.blocks--;
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
      case "unreachable":
        return [`${ind}unreachable!();`];
      case "global": {
        const g = this.placed.get(s.name);
        return g ? [`${ind}${this.globalInit(g, ind)}`] : [];
      }
      case "fn": {
        return this.fn(s.decl, ind, (this.lookup(s.decl.name) as Fn).captures);
      }
      case "switch": {
        const block = this.switchBlock(s);
        return block.s === "block" ? this.stmt(block, ind) : this.switch(s, ind);
      }
    }
  }

  /** A loop: labelled when a `break` / `continue` in it leaves a try block (see `loops`). */
  private loop(head: string, body: () => string[], end: string, label?: string): string[] {
    const loop = { label: label ? `'${label}` : `'loop${++this.loopCount}`, blocks: this.blocks, used: !!label };
    this.loops.push(loop);
    const lines = body();
    this.loops.pop();
    const labelled = loop.used ? head.replace(/^(\s*)/, `$1${loop.label}: `) : head;
    return [labelled, ...lines, end];
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
    // An accessor that can throw returns a `Result`.
    const f = (call: string) => (target.e === "prop" && target.throws ? this.fail(call) : call);
    if (target.e === "prop" && target.sup) {
      // `super.x = …`: the base's setter on `this`.
      const [set, get] = [`m__${target.sup}__set_${target.name}`, `m__${target.sup}__${target.name}`];
      const self: Ty = { k: "class", name: target.sup };
      if (s.op === "=") return f(`${set}(${this.thisRef(target.obj, self, ind)}, ${value})`);
      return `{ let o__ = ${this.thisRef(target.obj, self, ind)}; ${f(`${set}(o__, ${next(f(`${get}(o__)`))})`)} }`;
    }
    const objTy = target.e === "prop" ? this.typeOf(target.obj) : undefined;
    if (target.e === "prop" && objTy?.k === "class" && this.isTrait(objTy.name)) {
      if (s.op === "=") return f(`${this.receiver(target.obj, ind)}.set_${target.name}(${value})`);
      return `{ let o__ = ${this.expr(target.obj, ind)}; ${f(`o__.set_${target.name}(${next(f(`o__.get_${target.name}()`))})`)} }`;
    }
    if (target.e === "prop" && objTy?.k === "class" && this.member(objTy.name, target.name)?.kind === "getter") {
      // A property with a setter, on a class without subclasses: its free functions.
      const [setter, getter] = [this.definer(objTy.name, target.name, true)!, this.definer(objTy.name, target.name)!];
      const [set, get] = [`m__${setter}__set_${target.name}`, `m__${getter}__${target.name}`];
      if (s.op === "=") return f(`${set}(${this.thisRef(target.obj, { k: "class", name: setter }, ind)}, ${value})`);
      // `this` of each free function: the object, or (inherited) as the base that defines it.
      const as = (d: string) => (d === objTy.name ? "&o__" : `&(o__.clone() as ${this.ty({ k: "class", name: d })})`);
      return `{ let o__ = ${this.expr(target.obj, ind)}; ${f(`${set}(${as(setter)}, ${next(f(`${get}(${as(getter)})`))})`)} }`;
    }
    if (target.e === "prop") {
      const on = this.receiver(target.obj, ind);
      const field = this.name(target.name);
      // A tracked field's store reports what it overwrites while the incremental collector marks (gc.rs `gc_write`).
      if (objTy?.k === "class" && this.gcTracked(objTy.name, target.name)) {
        if (s.op === "=") return `{ let o__ = &${on}; gc_write(&o__.${field}); o__.${field}.set(${value}) }`;
        return `{ let o__ = ${this.expr(target.obj, ind)}; gc_write(&o__.${field}); o__.${field}.set(${next(`o__.${field}.get()`)}) }`;
      }
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
