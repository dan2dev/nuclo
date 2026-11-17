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
  | "Error"
  /** A JavaScript Date (`JsDate`): a shared, mutable time value. */
  | "Date"
  /** `bigint`: an arbitrary-precision integer value (Swift / Rust `JsBigInt`, Kotlin `BigInteger`). */
  | "BigInt"
  /** `symbol`: a reference compared by identity, with an optional description (`JsSymbol`). */
  | "Symbol"
  /** JavaScript typed arrays: a view over packed shared storage (each runtime's class of the same name). */
  | "Int8Array" | "Uint8Array" | "Uint8ClampedArray" | "Int16Array" | "Uint16Array" | "Int32Array" | "Uint32Array" | "Float32Array" | "Float64Array"
  /** `ArrayBuffer` (the byte store Uint8Array views share) and `DataView` (lib4). */
  | "ArrayBuffer" | "DataView";

/** A sized number type the app annotates (`Int8`…`Float32`, from @nuclo/native-ts): storage only (numCast). */
export type SizedNum = "Int8" | "Int16" | "Int32" | "Int64" | "UInt8" | "UInt16" | "UInt32" | "Float32";

export type Ty =
  | { k: "int" }
  | { k: "double" }
  /** A slot of a sized number type. Arithmetic never sees it: every read is a `numCast` to int / double. */
  | { k: "num"; n: SizedNum }
  | { k: "string" }
  | { k: "bool" }
  | { k: "void" }
  | { k: "array"; of: Ty }
  | { k: "map"; of: Ty }
  | { k: "optional"; of: Ty }
  | { k: "class"; name: string }
  /** `throws`: a function value that can throw (Swift `throws`, Rust `Result`); see Expr `throws`. */
  | { k: "fn"; params: Ty[]; ret: Ty; throws?: boolean }
  | { k: "rt"; name: RuntimeType }
  /** A union of different types (`string | number`): one of the program's `unions`, a tagged enum natively. */
  | { k: "union"; name: string }
  /** `Promise<T>`: the runtime's `JsPromise<T>` (Rust `Promise<T>`), a shared object settled once. */
  | { k: "promise"; of: Ty }
  /** An element of `Promise.allSettled`'s result: `status`, and `value` or `reason` (`JsSettled<T>`). */
  | { k: "settled"; of: Ty }
  /**
   * JavaScript's `Map<K, V>` / `Set<T>`: a shared, insertion-ordered hash map (`JsOMap`; a Set is one with no values),
   * keys by SameValueZero (numbers, strings by code units, booleans, bigints) or identity (objects, arrays, maps).
   */
  | { k: "jsmap"; key: Ty; of: Ty; weak?: true }
  /**
   * `weak`: `WeakMap` / `WeakSet` (`JsWeakMap`: objects by identity, the key held weakly, not iterable); a jsset with
   * `ref` is a `WeakRef<T>` (`JsWeakRef`). Same ops (`mc.new`, whose argument is a WeakRef's target; `mc.call`).
   */
  | { k: "jsset"; of: Ty; weak?: true; ref?: true };

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
  /**
   * `splice(start, count, items?)` (items: one array); `indexOf` / `includes` / `lastIndexOf` take an optional start.
   * `fill(v, start, end?)` and `copyWithin(target, start, end?)` work in place and give the array. `filled(t, n, v)`:
   * `new Array(n).fill(v)`. `fromLength(t, n, (i) => v)`: `Array.from({ length: n }, …)` (`t`: an empty array
   * literal, only its element type is printed). `flat`: one level of a `T[][]`.
   * `reduceRight(f, init)`.
   */
  | "arr.fill" | "arr.copyWithin" | "arr.filled" | "arr.fromLength" | "arr.flat" | "arr.reduceRight"
  /** ES2023: `findLast` / `findLastIndex` (a test of (item, index)), `toSpliced(start, count, items?)`, `with(i, v)`. */
  | "arr.findLast" | "arr.findLastIndex" | "arr.toSpliced" | "arr.with"
  /** `push` / `unshift` whose value is read: they give the new length (an Int). */
  | "arr.pushLen" | "arr.pushAllLen" | "arr.unshiftLen"
  /** `(a * b + c) % k` of Ints whose dividend may pass 32 bits (under 2^53) but whose result is under k: 64-bit math. */
  | "int.wideRem"
  | "arr.find" | "arr.findIndex" | "arr.filter" | "arr.map" | "arr.some" | "arr.every" | "arr.forEach" | "arr.join" | "arr.slice"
  | "str.length" | "str.trim" | "str.upper" | "str.lower" | "str.includes" | "str.startsWith" | "str.endsWith" | "str.slice"
  | "str.nonEmpty" | "str.or"
  | "num.toFixed" | "math.floor" | "math.ceil" | "math.round" | "math.trunc" | "math.abs" | "math.min" | "math.max"
  | "math.sqrt" | "math.pow" | "math.random" | "math.pi"
  | "map.get" | "date.now" | "num.parse" | "int.parse"
  /** `${e}` of a caught error: "Error: <message>". `error.text` is `e.message`, the message alone. */
  | "error.message" | "error.text"
  | "arr.concat" | "arr.sort" | "arr.reverse" | "arr.shift" | "arr.lastIndexOf" | "arr.reduce" | "arr.atRel"
  /** Callbacks that take the index as well: `xs.map((x, i) => …)`. */
  | "arr.mapI" | "arr.filterI" | "arr.forEachI" | "arr.someI" | "arr.everyI" | "arr.findI" | "arr.findIndexI"
  | "map.delete" | "map.has"
  /** Object.keys / Object.values of a map: arrays in JavaScript's key order (integer-like keys ascending, then insertion order). */
  | "map.keys" | "map.values"
  | "str.split" | "str.replace" | "str.replaceAll" | "str.indexOf" | "str.lastIndexOf" | "str.padStart" | "str.padEnd"
  | "str.repeat" | "str.trimStart" | "str.trimEnd"
  /** `a < b` on strings: -1, 0 or 1 by UTF-16 units. */
  | "str.compare"
  /** A Math / Number function or constant by name: the first argument is its name as a string literal. */
  | "math.fn"
  /** The bitwise operators, on ToInt32 of their operands (`>>>` gives a Double: it is unsigned). */
  | "bit.and" | "bit.or" | "bit.xor" | "bit.shl" | "bit.shr" | "bit.ushr" | "bit.not"
  /** `Math.imul(a, b)` / `Math.clz32(a)`: on ToInt32 of the operands, an Int. */
  | "bit.imul" | "bit.clz32"
  /**
   * A JavaScript string / number helper of every runtime by name (`str` first argument): Swift / Kotlin `js<Name>`,
   * Rust `js_<name>`; string arguments by reference in Rust. The op's `ty` is its result. A name ending in `!` can't
   * throw (its arguments were checked at compile time): Swift `try!`, Rust `.unwrap()`; else the op `throws`.
   */
  | "js.fn"
  /**
   * bigint: `big.lit` (its argument a `str` of decimal digits), arithmetic on two bigints (`/` truncates, `%` takes the
   * dividend's sign, bits are two's complement, `>>` rounds down). `throws` on `big.div` / `big.mod` / `big.pow` (by 0n,
   * or a negative exponent), `big.fromDouble` (not whole), `big.parse` (not a bigint literal) and `big.str` whose radix
   * is not an `int` literal: JavaScript's RangeError / SyntaxError. Comparisons and `==` are `bin` on the values.
   */
  | "big.lit" | "big.add" | "big.sub" | "big.mul" | "big.div" | "big.mod" | "big.pow" | "big.neg"
  | "big.and" | "big.or" | "big.xor" | "big.not" | "big.shl" | "big.shr"
  /** BigInt(int), BigInt(double), BigInt(string), Number(b), b.toString(radix), BigInt.asIntN / asUintN(bits literal, b). */
  | "big.from" | "big.fromDouble" | "big.parse" | "big.toNumber" | "big.str" | "big.asIntN" | "big.asUintN"
  /** `Symbol(description?)` (nil without one), `s.description` (optional). */
  | "sym.new" | "sym.description"
  /**
   * Typed arrays (`ty`: the result type). `ta.new`: a `str` form, "len" (an Int), "doubles" (a number[]) or "typed"
   * (another typed array), then the class's name (a `str`), then the value. `ta.call`: the runtime method named by the second argument (a `str`)
   * on the receiver, with the rest as arguments. `ta.prop`: a property (`length`, `byteLength`, `byteOffset`).
   */
  | "ta.new" | "ta.call" | "ta.prop"
  /**
   * JSON: `json.parse` (text, a `decoder`; `throws`: a SyntaxError), `json.stringify` (value, gap string, a `decoder`
   * node carrying the value's type: classes are written by Program.jsonClasses), `json.gap` (a `str` "num" or "str",
   * then the indent argument of `JSON.stringify(v, null, indent)`).
   * Date (`JsDate` in each runtime, a shared mutable time value): `date.new` (a `str` form: "now", "ms" a Double,
   * "str" text, "parts" Doubles, "copy" a Date; then its arguments), `date.call` (the date, a `str` of what: "time",
   * "setTime", "get F L" / "set F L" (field F 0 year … 6 ms, 7 weekday; L "1" local, "0" UTC), "tzOffset",
   * "iso" (`throws`: RangeError), "utc", "dateString"; then Double arguments), `date.utc` (Doubles), `date.parse` (text).
   */
  | "json.parse" | "json.stringify" | "json.gap" | "date.new" | "date.call" | "date.utc" | "date.parse"
  /**
   * Map / Set (`ty`: the result type). `mc.new`: an empty one of type `ty`. `mc.call`: the runtime method named by the
   * second argument (a `str`) on the receiver, with the rest as arguments (see each runtime's `JsOMap`).
   */
  | "mc.new" | "mc.call"
  /**
   * Promises (each op's `ty` is its result type). `promise.native`: the promise of an awaited native call (its one
   * argument, a call with `await`). `then` / `catch` / `finally` take callbacks that can throw; the `P` forms take ones
   * returning a promise, which the result adopts. `promise.adopt` marks `return p` of a promise in an async function.
   */
  | "promise.new" | "promise.resolve" | "promise.reject" | "promise.then" | "promise.thenP" | "promise.then2" | "promise.then2P"
  | "promise.catch" | "promise.catchP" | "promise.finally" | "promise.finallyP" | "promise.all" | "promise.allSettled"
  | "promise.race" | "promise.any" | "promise.native" | "promise.delay" | "promise.adopt"
  | "settled.status" | "settled.value" | "settled.reason"
  /** `new Error(message)` as a value (what `throw new Error(message)` throws). */
  | "error.new"
  /**
   * An app's error classes (`class E extends Error`): `error.wrap(obj, name, message)` is a native error carrying `obj`
   * (thrown, or kept as an `Error`); `error.obj(e, str C)` the object of class C (or a subclass) `e` carries, else nil;
   * `error.name(e)` a native error's own name ("Error", "RangeError"…).
   */
  | "error.wrap" | "error.obj" | "error.name"
  /**
   * An async function's state machine (asyncLower.ts): `async.run(step)` makes the promise and runs the step;
   * `async.await(co, p, store?)` resumes it after `p` settles; `async.check(co)` throws what `p` rejected with;
   * `async.resolve(co, v?)` / `async.adopt(co, p)` / `async.reject(co, e)` settle it.
   */
  | "async.run" | "async.await" | "async.check" | "async.resolve" | "async.adopt" | "async.reject";

/**
 * `throws` (on `call`, `invoke`, `construct`, `op`, and `prop` of an accessor): evaluating this node can throw
 * synchronously (the front-end computed it over the call graph). Swift marks it with `try`, Rust propagates
 * the `Result` (`?`, or out of the `try` block); Kotlin needs nothing. A `lambda` with `throws` returns a `Result` in Rust.
 */
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
  /**
   * `optional`: `a?.b`. `chain`: a later link of an optional chain (`a?.b.c`'s `.c`): Kotlin needs `?.` there too.
   * `sup`: `super.x` (`obj` is `this`), a getter / setter of that base class.
   */
  | { e: "prop"; obj: Expr; name: string; optional?: boolean; chain?: boolean; sup?: string; throws?: boolean }
  | { e: "index"; obj: Expr; index: Expr }
  | { e: "call"; callee: Expr; args: Expr[]; await?: boolean; throws?: boolean }
  /** A runtime function (`div`, `list`, `A.onClick`…). Named args are labels (Swift) / named arguments (Kotlin). */
  | { e: "rt"; name: string; args: Expr[]; named?: [string, Expr][]; await?: boolean }
  /** A method on a runtime object: `.when(...)`, `router.go(...)`, `res.text()`. */
  | { e: "method"; obj: Expr; name: string; args: Expr[]; await?: boolean }
  | { e: "op"; op: Op; args: Expr[]; await?: boolean; chain?: boolean; throws?: boolean; ty?: Ty }
  /** `text`: `==` / `!=` of two strings, equal only unit for unit (Swift's `==` also equates canonically equivalent text). */
  | { e: "bin"; op: BinOp; l: Expr; r: Expr; text?: boolean }
  | { e: "not"; x: Expr }
  | { e: "neg"; x: Expr }
  | { e: "cond"; c: Expr; a: Expr; b: Expr }
  | { e: "unwrap"; x: Expr }
  | { e: "coalesce"; l: Expr; r: Expr }
  /** `body` with local `name` (of type `ty`) bound to `init`, evaluated once first (`f() || x`: f's value, tested and kept). */
  | { e: "with"; name: string; ty: Ty; init: Expr; body: Expr }
  /**
   * `body` (assignments, from an assignment used as a value: `while ((n = next()) !== null)`), then `x`, the value (of
   * type `ty`). Swift: a non-escaping closure (`jsRun`), Kotlin: `run {}`, Rust: a block.
   */
  | { e: "seq"; body: Stmt[]; x: Expr; ty: Ty }
  | { e: "toDouble"; x: Expr }
  | { e: "toInt"; x: Expr }
  /** A numeric conversion between int, double and num types; the front-end proved the value fits `to` exactly. */
  | { e: "numCast"; x: Expr; from: Ty; to: Ty }
  | { e: "toStr"; x: Expr; from: Ty }
  /** `typed`: nothing at the call site gives the parameters' types, so they are printed. */
  | { e: "lambda"; params: Param[]; ret: Ty; body: Stmt[] | Expr; typed?: boolean; throws?: boolean }
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
  /** `await x` (`x` a promise) in an async function, of type `ty`: asyncLower.ts takes it apart (printers never see it). */
  | { e: "await"; x: Expr; ty: Ty }
  /** `x++` / `--x` as a value: `target` is a variable, a property or an array element; `one` is 1 or 1.0. */
  | { e: "incr"; target: Expr; op: "+=" | "-="; one: Expr; prefix: boolean }
  /** `new C(…)` of one of the app's classes. Trailing arguments may be left out for parameters with defaults. */
  | { e: "construct"; cls: string; args: Expr[]; throws?: boolean }
  /**
   * `obj.m(…)`, a method of a class or a protocol, dispatched on the object. `sup`: `super.m(…)`, and
   * the class whose `m` runs. Getters are read with `prop`, as fields are.
   */
  | { e: "invoke"; obj: Expr; name: string; args: Expr[]; sup?: string; throws?: boolean }
  /** `x instanceof C`: `x` (an object of the app's classes or protocols) is a `C` or a subclass of it. */
  | { e: "instanceOf"; x: Expr; cls: string }
  /** `x` as the class TypeScript narrowed it to (after `instanceof`): a checked downcast. */
  | { e: "downcast"; x: Expr; cls: string }
  /** A value of union `u`'s member `tag` (whose type is `ty`; `void` for the unit member `Null`) as the union. */
  | { e: "uwrap"; x: Expr; u: string; tag: string; ty: Ty }
  /** Whether union value `x` holds member `tag`. */
  | { e: "uis"; x: Expr; u: string; tag: string }
  /** Member `tag` of union value `x`, which holds it (TypeScript narrowed it). */
  | { e: "uget"; x: Expr; u: string; tag: string; ty: Ty };

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
  /** `elem`: the element type (an async function's state machine keeps the element in a local of its own). */
  /** `label` (on every loop): a labelled statement's, which a `break` / `continue` with that label leaves. */
  | { s: "forOf"; name: string; of: Expr; body: Stmt[]; elem?: Ty; label?: string }
  | { s: "forRange"; name: string; from: Expr; to: Expr; inclusive: boolean; body: Stmt[]; label?: string }
  | { s: "while"; c: Expr; body: Stmt[]; label?: string }
  | { s: "return"; x?: Expr }
  /** `label`: leaves the loop or `block` of that label. */
  | { s: "break"; label?: string }
  /** `label`: the next turn of the loop of that label. */
  | { s: "continue"; label?: string }
  /**
   * `finally` runs on every path out of the statement (Kotlin prints it natively). `lowered`: the same
   * statement for a target without a `finally` that can jump (Swift, Rust): the blocks record how they were
   * left in `fin__N`, leave a labelled `block`, the finally block runs, then that exit is taken.
   */
  | { s: "try"; body: Stmt[]; catchName?: string; catchBody: Stmt[]; finally?: Stmt[]; lowered?: Stmt[] }
  | { s: "throw"; message: Expr }
  /** `throw e` of a caught error (an `Error` value). */
  | { s: "rethrow"; error: Expr }
  /** A labelled block that `break` with its label leaves (a labelled statement, a try's `lowered` form). */
  | { s: "block"; label: string; body: Stmt[] }
  /** The default of a switch that covers every member of its literal union: TypeScript proved it is never reached. */
  | { s: "unreachable" }
  /** `text`: on a string, matched unit for unit (see `bin`). */
  | { s: "switch"; x: Expr; cases: { values: Expr[]; body: Stmt[] }[]; default?: Stmt[]; text?: boolean }
  /** A local function (hoisted to the top of its block, as JavaScript does). */
  | { s: "fn"; decl: FnDecl }
  /**
   * In `Program.main` only: top-level variable `name` (of `Program.globals`) is initialized here, in source order among
   * the top-level statements, as JavaScript does. A global no `global` statement names is initialized before `main`.
   */
  | { s: "global"; name: string };

export interface ClassField {
  name: string;
  ty: Ty;
  readonly: boolean;
  optional: boolean;
  /** A protocol the class conforms to declares it (Kotlin `override`). */
  implements?: boolean;
  /**
   * A back-pointer to the object that owns this one (an optional object type): Swift `weak var`, Rust `WeakVar`
   * (a `Weak` upgraded on read); Kotlin keeps it as it is. cycles.ts proves every read finds the owner alive.
   */
  weak?: boolean;
}

export interface ClassDecl {
  name: string;
  fields: ClassField[];
  /** Every field is JSON-decodable: a decoder is generated. */
  decodable: boolean;
  /** Shape protocols it conforms to (a value of it flows into one; see transpile.ts "Structural object types"). */
  protocols?: string[];
  /** Its objects may be part of a reference cycle (cycles.ts): the cycle collector tracks them. See `ObjectClassDecl.gc`. */
  gc?: string[];
}

/** A method of a class (or, without a body, of a protocol or an abstract class). */
export interface MethodDecl extends FnDecl {
  /** `get name()`: read as a property. */
  getter?: boolean;
  /** `set name(value)`: written as a property. Its class declares the getter too. */
  setter?: boolean;
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
  ctor: { params: Param[]; superArgs?: Expr[]; body: Stmt[]; throws?: boolean };
  /** Its own methods and getters. */
  methods: MethodDecl[];
  /**
   * Its objects may be part of a reference cycle (cycles.ts), so Swift and Rust track them for the runtime's cycle
   * collector (a whole class hierarchy is tracked or none of it). The names are its own fields that can hold tracked
   * objects (directly, in optionals, arrays, records, Maps or Sets): what `gcTraverse` reports and `gcClear` drops.
   */
  gc?: string[];
  /** No program can tell its objects from copies (values.ts): Swift prints a `struct`. */
  value?: boolean;
}

/** An interface some class implements: a Swift protocol, a Kotlin interface, a Rust trait. */
export interface ProtocolDecl {
  name: string;
  /** The protocols it extends. */
  bases: string[];
  fields: ClassField[];
  methods: { name: string; params: Param[]; ret: Ty; throws?: boolean }[];
}

export interface FnDecl {
  name: string;
  params: Param[];
  ret: Ty;
  async: boolean;
  /** It can throw synchronously: Swift `throws`, Rust `Result` (an async one always can). */
  throws?: boolean;
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
   * Globals of modules JavaScript never evaluates (only imported for types): declared, never initialized (no
   * `global` statement places them, and they aren't initialized before `main` either).
   */
  unevaluated?: string[];
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
  /** The unions of different types the program uses: a Swift enum, a Kotlin sealed class, a Rust enum each. */
  unions?: UnionDecl[];
  /**
   * The classes (and unions, without fields) `JSON.stringify` writes, each a function `jsonw__Name(out, value)`: the
   * fields in JavaScript's key order; `nil` "null" writes null for a missing value, else the key is left out.
   * Function-valued fields are left out (JavaScript skips them).
   */
  jsonClasses?: { name: string; fields?: { name: string; ty: Ty; nil?: "null" }[] }[];
}

/** A union of different types. A member's `ty` is `void` for `Null` (an `unknown`'s null; its nil is undefined). */
export interface UnionDecl {
  name: string;
  members: { tag: string; ty: Ty }[];
}
