/**
 * The typed IR between the TypeScript front-end (transpile.ts) and the printers (emitSwift.ts,
 * emitKotlin.ts). The front-end resolves every TypeScript question — types, Int vs Double,
 * narrowing, async, nuclo builders — so a printer only chooses syntax.
 */

/** Opaque runtime types: each printer maps them to its runtime's class names. */
export type RuntimeType =
  | "Node"
  | "NodeMod"
  | "WhenBuilder"
  | "Style"
  | "StyleClass"
  | "Variants"
  | "NativeEvent"
  | "PointerEvent"
  | "PanEvent"
  | "PinchEvent"
  | "ScrollEvent"
  | "KeyboardEvent"
  | "Frame"
  | "NativeElement"
  | "InputTarget"
  | "Timer"
  | "Router"
  | "Outlet"
  | "Response"
  | "Error";

export type Ty =
  | { k: "int" }
  | { k: "double" }
  | { k: "string" }
  | { k: "bool" }
  | { k: "void" }
  | { k: "array"; of: Ty }
  | { k: "map"; of: Ty }
  | { k: "optional"; of: Ty }
  | { k: "class"; name: string }
  | { k: "fn"; params: Ty[]; ret: Ty }
  | { k: "rt"; name: RuntimeType };

export const T = {
  int: { k: "int" } as Ty,
  double: { k: "double" } as Ty,
  string: { k: "string" } as Ty,
  bool: { k: "bool" } as Ty,
  void: { k: "void" } as Ty,
  rt: (name: RuntimeType): Ty => ({ k: "rt", name }),
  array: (of: Ty): Ty => ({ k: "array", of }),
  map: (of: Ty): Ty => ({ k: "map", of }),
  optional: (of: Ty): Ty => (of.k === "optional" ? of : { k: "optional", of }),
};

/**
 * Semantic operations on built-in values. Printers own the spelling (`.count` vs `.length`,
 * `append` vs `add`); the first argument is the receiver.
 */
export type Op =
  | "arr.length" | "arr.at" | "arr.push" | "arr.pushAll" | "arr.pop" | "arr.unshift" | "arr.splice" | "arr.indexOf" | "arr.includes"
  | "arr.find" | "arr.findIndex" | "arr.filter" | "arr.map" | "arr.some" | "arr.every" | "arr.forEach" | "arr.join" | "arr.slice"
  | "str.length" | "str.trim" | "str.upper" | "str.lower" | "str.includes" | "str.startsWith" | "str.endsWith" | "str.slice"
  | "str.nonEmpty" | "str.or"
  | "num.toFixed" | "math.floor" | "math.ceil" | "math.round" | "math.trunc" | "math.abs" | "math.min" | "math.max"
  | "math.sqrt" | "math.pow" | "math.random" | "math.pi"
  | "map.get" | "date.now" | "num.parse" | "int.parse" | "error.message"
  | "arr.concat" | "arr.sort" | "arr.reverse" | "arr.shift" | "arr.lastIndexOf" | "arr.reduce" | "arr.atRel"
  /** Callbacks that take the index as well: `xs.map((x, i) => …)`. */
  | "arr.mapI" | "arr.filterI" | "arr.forEachI" | "arr.someI" | "arr.everyI" | "arr.findI" | "arr.findIndexI"
  | "map.delete" | "map.has"
  | "str.split" | "str.replace" | "str.replaceAll" | "str.indexOf" | "str.lastIndexOf" | "str.padStart" | "str.padEnd"
  | "str.repeat" | "str.trimStart" | "str.trimEnd"
  /** `a < b` on strings: -1, 0 or 1 by UTF-16 units. */
  | "str.compare"
  /** A Math / Number function or constant by name: the first argument is its name as a string literal. */
  | "math.fn"
  /** The bitwise operators, on ToInt32 of their operands (`>>>` gives a Double: it is unsigned). */
  | "bit.and" | "bit.or" | "bit.xor" | "bit.shl" | "bit.shr" | "bit.ushr" | "bit.not";

export type Expr =
  | { e: "int"; v: string }
  | { e: "double"; v: string }
  | { e: "str"; v: string }
  | { e: "bool"; v: boolean }
  | { e: "nil" }
  /** A template: literal text and expressions that are already strings. */
  | { e: "tpl"; parts: (string | Expr)[] }
  /** `fnRef`: a declared function used as a value (Kotlin needs `::name`). */
  | { e: "id"; name: string; fnRef?: boolean }
  /** `optional`: `a?.b`. `chain`: a later link of an optional chain (`a?.b.c`'s `.c`): Kotlin needs `?.` there too. */
  | { e: "prop"; obj: Expr; name: string; optional?: boolean; chain?: boolean }
  | { e: "index"; obj: Expr; index: Expr }
  | { e: "call"; callee: Expr; args: Expr[]; await?: boolean }
  /** A runtime function (`div`, `list`, `A.onClick`…). Named args are labels (Swift) / named arguments (Kotlin). */
  | { e: "rt"; name: string; args: Expr[]; named?: [string, Expr][]; await?: boolean }
  /** A method on a runtime object: `.when(...)`, `router.go(...)`, `res.text()`. */
  | { e: "method"; obj: Expr; name: string; args: Expr[]; await?: boolean }
  | { e: "op"; op: Op; args: Expr[]; await?: boolean; chain?: boolean }
  | { e: "bin"; op: BinOp; l: Expr; r: Expr }
  | { e: "not"; x: Expr }
  | { e: "neg"; x: Expr }
  | { e: "cond"; c: Expr; a: Expr; b: Expr }
  | { e: "unwrap"; x: Expr }
  | { e: "coalesce"; l: Expr; r: Expr }
  | { e: "toDouble"; x: Expr }
  | { e: "toInt"; x: Expr }
  | { e: "toStr"; x: Expr; from: Ty }
  /** `typed`: nothing at the call site gives the parameters' types, so they are printed. */
  | { e: "lambda"; params: Param[]; ret: Ty; body: Stmt[] | Expr; typed?: boolean }
  | { e: "new"; cls: string; args: [string, Expr][] }
  | { e: "arr"; of: Ty; items: Expr[] }
  | { e: "dict"; of: Ty; entries: [string, Expr][] }
  /** A Style value: `Style(padding: 8)`; `base` is merged under it (`{ ...row, flex: 1 }`). */
  | { e: "style"; props: [string, Expr][]; base?: Expr }
  | { e: "enum"; type: string; member: string }
  /** A JSON decoder for `res.json<T>()`. */
  | { e: "decoder"; ty: Ty }
  /** Starts an async call from synchronous code (Swift `Task {}`, Kotlin `launch {}`). */
  | { e: "launch"; call: Expr }
  /** `x++` / `--x` as a value: `target` is a variable, a property or an array element; `one` is 1 or 1.0. */
  | { e: "incr"; target: Expr; op: "+=" | "-="; one: Expr; prefix: boolean }
  /** `new C(…)` of one of the app's classes. Trailing arguments may be left out for parameters with defaults. */
  | { e: "construct"; cls: string; args: Expr[] }
  /**
   * `obj.m(…)`, a method of a class or a protocol, dispatched on the object. `sup`: `super.m(…)`, and
   * the class whose `m` runs. Getters are read with `prop`, as fields are.
   */
  | { e: "invoke"; obj: Expr; name: string; args: Expr[]; sup?: string };

export type BinOp = "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "===" | "!==" | "<" | "<=" | ">" | ">=" | "&&" | "||";

export interface Param {
  name: string;
  ty: Ty;
  /** Not read in the body: Swift prints `_`. */
  unused?: boolean;
  /** A default value (`x = 2`, or nil for `x?: T`): call sites may leave it out. */
  default?: Expr;
}

export type Stmt =
  | { s: "let"; name: string; ty: Ty; init?: Expr; mutable: boolean }
  | { s: "assign"; target: Expr; op: "=" | "+=" | "-=" | "*=" | "/=" | "%="; value: Expr }
  /** `discard`: the value is a function, which Swift refuses to leave unused. */
  | { s: "expr"; x: Expr; discard?: boolean }
  | { s: "if"; c: Expr; then: Stmt[]; else?: Stmt[] }
  | { s: "forOf"; name: string; of: Expr; body: Stmt[] }
  | { s: "forRange"; name: string; from: Expr; to: Expr; inclusive: boolean; body: Stmt[] }
  | { s: "while"; c: Expr; body: Stmt[] }
  | { s: "return"; x?: Expr }
  | { s: "break" }
  | { s: "continue" }
  | { s: "try"; body: Stmt[]; catchName?: string; catchBody: Stmt[]; finally?: Stmt[] }
  | { s: "throw"; message: Expr }
  /** The default of a switch that covers every member of its literal union: TypeScript proved it is never reached. */
  | { s: "unreachable" }
  | { s: "switch"; x: Expr; cases: { values: Expr[]; body: Stmt[] }[]; default?: Stmt[] }
  /** A local function (hoisted to the top of its block, as JavaScript does). */
  | { s: "fn"; decl: FnDecl };

export interface ClassField {
  name: string;
  ty: Ty;
  readonly: boolean;
  optional: boolean;
}

export interface ClassDecl {
  name: string;
  fields: ClassField[];
  /** Every field is JSON-decodable: a decoder is generated. */
  decodable: boolean;
}

/** A method of a class (or, without a body, of a protocol or an abstract class). */
export interface MethodDecl extends FnDecl {
  /** `get name()`: read as a property. */
  getter?: boolean;
  abstract?: boolean;
  /** A base class declares it too (Swift and Kotlin `override`). */
  overrides?: boolean;
  /** A protocol the class conforms to declares it (Kotlin `override`). */
  implements?: boolean;
}

export interface ObjectField extends ClassField {
  /** A literal it starts with. A field without one is set by the constructor (until then it holds a zero value). */
  init?: Expr;
  overrides?: boolean;
  implements?: boolean;
}

/**
 * A class of the app: a Swift class, a Kotlin class, a Rust struct. `this` is the id `this`.
 * Static members are globals and functions named `Class__member`.
 */
export interface ObjectClassDecl {
  name: string;
  base?: string;
  /** The protocols it declares it implements. */
  protocols: string[];
  abstract: boolean;
  /** Some class extends it. */
  open: boolean;
  /** Its own fields (parameter properties included); inherited ones are the base's. */
  fields: ObjectField[];
  /**
   * The constructor: the base's runs first with `superArgs`, then `body`, which starts with the
   * field initializers and parameter properties, as in JavaScript. A class without one gets its base's parameters.
   */
  ctor: { params: Param[]; superArgs?: Expr[]; body: Stmt[] };
  /** Its own methods and getters. */
  methods: MethodDecl[];
}

/** An interface some class implements: a Swift protocol, a Kotlin interface, a Rust trait. */
export interface ProtocolDecl {
  name: string;
  /** The protocols it extends. */
  bases: string[];
  fields: ClassField[];
  methods: { name: string; params: Param[]; ret: Ty }[];
}

export interface FnDecl {
  name: string;
  params: Param[];
  ret: Ty;
  async: boolean;
  body: Stmt[];
}

export interface Program {
  source: string;
  classes: ClassDecl[];
  globals: Extract<Stmt, { s: "let" }>[];
  functions: FnDecl[];
  /** Top-level statements, run by the generated entry point. */
  main: Stmt[];
  /**
   * `declare function`s: their signatures (no body). The app implements them per platform; a
   * printer whose language doesn't infer argument types reads them here.
   */
  natives?: FnDecl[];
  /** The native components the app uses (`native<P>("Name")`) and the class their props are. */
  components?: { name: string; props: string }[];
  protocols?: ProtocolDecl[];
  /** The app's classes, each after its base. */
  objectClasses?: ObjectClassDecl[];
}
