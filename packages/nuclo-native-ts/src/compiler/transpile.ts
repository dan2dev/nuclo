/**
 * The front-end: TypeScript (program + type checker) → typed IR (ir.ts).
 *
 * It answers every TypeScript question so the printers don't have to:
 *  - types: `number` slots are inferred Int or Double (a fixpoint over every write), interfaces
 *    become classes (protocols when a class implements them), `T | null` an optional, `T[]` an
 *    array, `Record<string, T>` a map;
 *  - narrowing: a nullable value TypeScript has narrowed is force-unwrapped where it is read;
 *  - async: a promise is the runtime's `JsPromise` (JavaScript's job order); an `async` function is a state
 *    machine returning its promise (asyncLower.ts); a native async call (fetch…) is wrapped in a promise;
 *  - exceptions: what can throw synchronously is a fixpoint over the call graph (inferThrows);
 *  - nuclo: builder calls, attribute objects, when/list/region/into/scope, styles, variants and
 *    the router are lowered to runtime calls with lazily built content.
 * Anything it cannot translate is reported with its file and line, and nothing is emitted.
 */
import {
  COLOR_KEYS, ENUM_VALUES, NATIVE_STYLE_KEYS, SHORTHAND_RESETS, STATE_ALIASES, STYLE_ALIASES, STYLE_FLAGS, StyleError, type Theme,
  UNSUPPORTED_PSEUDOS, lowerEntry, parseAnimation, parseMedia, parseBorder, keyframeStops,
} from "../styleAliases.ts";
import * as path from "node:path";
import ts from "typescript";
import {
  type BinOp, type ClassDecl, type ClassField, type Expr, type FnDecl, type MethodDecl, type ObjectClassDecl, type ObjectField, type Op, type Param, type Program,
  type ProtocolDecl, type RuntimeType, type SizedNum, type Stmt, T, type Ty, type UnionDecl,
} from "./ir.ts";
import { asyncGenBase, DELEGATE, GEN, type GenShape, genBase, genMachine, labelsIn, leaves, yieldMarker } from "./generators.ts";
import { lowerAsync } from "./asyncLower.ts";
import { checkCycles, noteOrigin } from "./cycles.ts";
import { markValueClasses } from "./values.ts";
import { kindOf } from "./diagnostics.ts";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
  /** How much of the source it covers, for an editor's underline. */
  length?: number;
  /** TypeScript's own error code; absent on the native compiler's diagnostics. */
  code?: number;
  /** Stable code: `TS2322` for TypeScript's errors, `NUCLO1001`… for the native compiler's (diagnostics.ts, README "Diagnostic codes"). */
  id?: string;
  /** A mechanical fix: the text that replaces the `length` characters at line:column. */
  fix?: string;
}

export class CompileError extends Error {
  readonly diagnostics: Diagnostic[];
  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.map(formatDiagnostic).join("\n"));
    this.diagnostics = diagnostics;
  }
}

const displayPath = (file: string) => {
  const relative = path.relative(process.cwd(), file);
  return relative.startsWith("..") ? file : relative;
};

export const formatDiagnostic = (d: Diagnostic) => `${d.file}:${d.line}:${d.column} - error${d.id ? ` ${d.id}` : ""}: ${d.message}`;

/** The options apps are checked with: tsconfig.app.json, shared with the editor (examples/tsconfig.json). */
export const APP_TSCONFIG = path.resolve(import.meta.dirname, "../../tsconfig.app.json");

export function appCompilerOptions(): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(APP_TSCONFIG, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(APP_TSCONFIG));
  return parsed.options;
}

const API_FILE = path.resolve(import.meta.dirname, "../index.ts");
const ADAPTERS_FILE = path.resolve(import.meta.dirname, "../adapters.ts");

/** The adapter (src/adapters.ts) that replaces a locale-dependent API, appended to its diagnostic. */
const LOCALE_HINT = (text: string): string =>
  /\bIntl\b|toLocale(String|DateString|TimeString)\b/.test(text)
    ? " Locale data differs per platform: write numbers with `formatNumber(n, { minFractionDigits, grouping })`, dates with `formatDate(d, \"yyyy-MM-dd HH:mm\", { timeZone })` and compare text with `compareText(a, b, { sensitivity, numeric })` from @nuclo/native-ts/adapters (the same on every platform)."
    : "";

/** Tags the runtimes have a builder function for. */
const TAGS = new Set([
  "div", "section", "header", "footer", "main", "nav", "article", "aside", "form", "ul", "li",
  "span", "p", "h1", "h2", "h3", "h4", "label", "strong", "small", "em",
  "button", "input", "textarea", "img",
]);

/** The other tags are built by name, `el("figure", …)`: each runtime maps the name to a box or a text. */
const NAMED_TAGS = new Set([
  "ol", "figure", "fieldset", "blockquote", "address", "hgroup", "menu", "search", "dl", "details", "dialog",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "hr",
  "h5", "h6", "b", "i", "u", "s", "del", "ins", "mark", "code", "pre", "kbd", "samp", "var_", "abbr", "cite", "q", "dfn",
  "sub", "sup", "time", "legend", "caption", "figcaption", "summary", "dt", "dd", "a",
  "bdi", "bdo", "data", "output", "rt", "rp", "ruby", "body", "html", "colgroup", "col", "map", "picture", "slot", "head", "base", "link", "meta", "script", "style", "title", "template", "noscript", "datalist", "area", "source", "track", "br", "wbr",
]);

/** What the options of a `select` share while it is lowered (see `select()`). */
interface SelectState {
  /** The names of its variables: whether it is open, and what it holds when the app gives it no `value`. */
  open: string;
  chosen: string;
  change: string;
  /** What is chosen now, as an expression. */
  selected: Expr;
  /** The app's `onChange` handler. */
  handler?: Expr;
  /** The text of the chosen option, as pieces: one for each option, and one for each option a `list()` makes. */
  labels: Expr[];
  /** Where the next option adds its piece: `labels`, or what a `list()` collects for its rows. */
  collect: Expr[];
  first?: Expr;
}

/** The attributes of `select` that the compiler reads itself. */
const SELECT_KEYS: ReadonlySet<string> = new Set(["value", "onChange", "disabled"]);

/** The attributes of `progress` and `meter` that describe the bar; the compiler reads them itself. */
const GAUGE_KEYS: ReadonlySet<string> = new Set(["value", "min", "max", "low", "high", "optimum"]);

/** API interfaces and the runtime types they become. */
const API_TYPES: Record<string, Ty> = {
  Node: T.rt("Node"),
  Modifier: T.rt("NodeMod"),
  WhenBuilder: T.rt("WhenBuilder"),
  Style: T.rt("Style"),
  StyleClass: T.rt("StyleClass"),
  NativeEvent: T.rt("NativeEvent"),
  PointerEvent: T.rt("PointerEvent"),
  PanEvent: T.rt("PanEvent"),
  PinchEvent: T.rt("PinchEvent"),
  ScrollEvent: T.rt("ScrollEvent"),
  KeyboardEvent: T.rt("KeyboardEvent"),
  Frame: T.rt("Frame"),
  NativeElement: T.rt("NativeElement"),
  HTMLInputElement: T.rt("InputTarget"),
  Timer: T.rt("Timer"),
  Router: T.rt("Router"),
  Outlet: T.rt("Outlet"),
  Response: T.rt("Response"),
  ThemedStyle: T.rt("Style"),
};

/** Style keys whose string values are enums natively. */
const STYLE_ENUMS: Record<string, string> = {
  flexDirection: "FlexDirection",
  alignItems: "Align",
  alignSelf: "Align",
  justifyContent: "Justify",
  flexWrap: "FlexWrap",
  overflow: "Overflow",
  position: "Position",
  display: "Display",
  fontWeight: "FontWeight",
  fontStyle: "FontStyle",
  textAlign: "TextAlign",
  textDecoration: "TextDecoration",
  textTransform: "TextTransform",
  transitionEasing: "Easing",
  objectFit: "ObjectFit",
  pointerEvents: "PointerEvents",
};

/** `&:…` selectors and the state keys they are. */
const STYLE_SELECTORS: Record<string, string> = {
  ":hover": "hover", ":active": "pressed", ":focus": "focused", ":focus-visible": "focused", ":focus-within": "focused",
  ":disabled": "disabled", ":enabled": "enabled", ":checked": "checked", ":placeholder-shown": "placeholderShown", "::placeholder": "placeholder",
  ":first-child": "first", ":last-child": "last", ":only-child": "only", ":empty": "empty",
  ":nth-child(odd)": "odd", ":nth-child(2n+1)": "odd", ":nth-child(even)": "even", ":nth-child(2n)": "even",
};

/** Keys a value written as a template (`` `${n}px` ``) may take as a number of points. */
const LENGTH_KEYS = new Set([
  "gap", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "top", "right", "bottom", "left", "fontSize", "lineHeight", "letterSpacing",
  "borderRadius", "borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
]);

/** A value the compiler could not fold to a constant. */
const DYNAMIC = Symbol("dynamic");

/** Event attributes and the runtime type their handler receives. */
const EVENTS: Record<string, RuntimeType> = {
  onClick: "NativeEvent", onInput: "NativeEvent", onChange: "NativeEvent", onFocus: "NativeEvent", onBlur: "NativeEvent",
  onKeyDown: "KeyboardEvent",
  onPointerDown: "PointerEvent", onPointerMove: "PointerEvent", onPointerUp: "PointerEvent", onPointerCancel: "PointerEvent",
  onLongPress: "PointerEvent", onDoubleClick: "PointerEvent",
  onPan: "PanEvent", onPinch: "PinchEvent", onScroll: "ScrollEvent",
};

/** Top-level names an app can't declare: they are the runtimes', Swift's or Foundation's own. */
/** The lib interfaces a generator object is typed as, and its `next()` results. */
const GEN_TYPES: ReadonlySet<string> = new Set(["Generator", "IterableIterator", "IteratorObject", "Iterator"]);
const ASYNC_GEN_TYPES: ReadonlySet<string> = new Set(["AsyncGenerator", "AsyncIterableIterator", "AsyncIteratorObject", "AsyncIterator"]);
const HOLES = "new Array(n) makes an array of n holes, which natively have no equivalent: fill every one (`new Array<T>(n).fill(v)`) or write Array.from({ length: n }, (_, i) => …).";
const ITER_RESULTS: ReadonlySet<string> = new Set(["IteratorResult", "IteratorYieldResult", "IteratorReturnResult"]);
/** The native class of JavaScript's `Error` when the app extends it (`name`, `message`, `toString()`): see errorBase. */
const ERROR_BASE = "Error__";
/** The native error class carrying a thrown value that is not an Error (`throw "x"`, `throw 42`) or an absent `cause` (adapters2). */
const THROWN = "Thrown__";
/** The native name of a class's `[Symbol.iterator]()` (a generator method): for-of, spread… call it (iterShapeOf). */
const ITERATOR_METHOD = "iterator__";

const RESERVED_TYPES = new Set([
  "Clock", "Duration", "Result", "Range", "Character", "Sequence", "Collection", "Optional", "Locale", "Calendar", "Notification",
  "Node", "NodeMod", "Style", "StyleClass", "Variants", "Compound", "WhenBuilder", "NativeEvent", "NativeElement", "InputTarget",
  "PointerEvent", "PanEvent", "PinchEvent", "ScrollEvent", "KeyboardEvent", "Frame", "NFrame", "NativeComponent",
  "A", "NRouter", "NRoute", "NTab", "NTimer", "NResponse", "NJSON", "NError", "String", "Int", "Double", "Bool", "Boolean",
  "Array", "Data", "Date", "URL", "Error", "Exception", "Timer", "View", "Task", "Set", "Map", "List", "Any", "Unit", "Object",
  "JsMap", "Entries",
  // Rust: types the generated code names (a user `class Var` would shadow the runtime's `Var<T>`).
  "Var", "WeakVar", "Arr", "JsOMap", "JsDate", "JsError", "JsSettled",
]);

/**
 * Names the generated code calls or refers to unqualified (formatting helpers, runtime types). A user
 * declaration with one of these names, at any level, would shadow it in Swift or Kotlin. Math
 * functions are printed fully qualified (`Swift.min`, `kotlin.math.floor`), so they stay free.
 */
const IMPLICIT_NAMES = new Set([
  "jsNum", "jsFixed", "jsRound", "jsNow", "jsNumber", "jsParseInt", "jsOr", "jsWith", "jsErrorMessage", "consoleLog", "launch", "jsIsIndex", "JsMap",
  "JsBigInt", "JsSymbol", "JsNamedError", "jsBig", "jsBigDiv", "jsBigMod", "jsBigPow", "jsBigShl", "jsBigShr", "jsBigFrom", "jsBigParse",
  "jsBigToString", "jsBigToDouble", "jsBigAsIntN", "jsBigAsUintN",
  "nucloMain", "MainActivity", "AppDelegate", "NucloActivity", "NucloAppDelegate", "Task", "A", "NJSON", "NError",
  "NRoute", "NTab", "NRouter", "NTimer", "NResponse", "Compound", "Variants", "Style", "StyleClass", "Node", "NodeMod",
  "WhenBuilder", "FlexDirection", "Align", "Justify", "Position", "Display", "FontWeight", "TextAlign", "Params",
  "FlexWrap", "Overflow", "FontStyle", "TextDecoration", "Easing", "el", "nativeView", "forceUpdate", "NFrame", "NativeComponent",
  "PointerEvent", "PanEvent", "PinchEvent", "ScrollEvent", "KeyboardEvent",
  "Content", "Cleanup", "InputTarget", "NativeEvent", "NativeElement", "Exception", "Error", "String", "Int", "Double",
  "Bool", "Boolean", "Unit", "Any", "Void", "mutableListOf", "mutableMapOf", "listOf", "checkbox", "self", "it",
  // The runtimes' own types (Swift shares one module with the app).
  "Runtime", "Flex", "FlexView", "FlexLayout", "ScreenView", "LayerView", "RootController", "ScreenController", "MountProbe",
  "TextViewDelegate", "PaddedLabel", "NButton", "PaddedTextField", "IntoEntry", "RegionState", "Attr",
  "Touch", "PointerRecognizer", "ScrollBox", "FixedScreenView", "ScreenRoot", "StyleRef", "Backdrop",
]);

/**
 * An app's variable, parameter or function named like something the generated code uses (`it`, `self`, `Task`,
 * `jsNum`…, see IMPLICIT_NAMES / RESERVED_TYPES) is `name__` natively, everywhere it is declared or read. Fields,
 * methods and `declare function`s keep their names (those stay rejected where they would clash).
 */
function renameReserved(program: Program) {
  const r = (n: string) => (IMPLICIT_NAMES.has(n) || RESERVED_TYPES.has(n) ? `${n}__` : n);
  const seen = new Set<object>();
  const walk = (x: unknown): void => {
    if (!x || typeof x !== "object" || seen.has(x)) return;
    seen.add(x);
    if (Array.isArray(x)) return x.forEach(walk);
    const o = x as Record<string, unknown>;
    if (o.e === "id" || o.e === "with" || o.s === "let" || o.s === "forOf" || o.s === "forRange" || o.s === "global") o.name = r(o.name as string);
    if (o.s === "try" && typeof o.catchName === "string") o.catchName = r(o.catchName);
    if (o.s === "fn") (o.decl as FnDecl).name = r((o.decl as FnDecl).name);
    if (Array.isArray(o.params)) for (const p of o.params as Param[]) if (typeof p?.name === "string" && !("k" in p)) p.name = r(p.name);
    for (const v of Object.values(o)) walk(v);
  };
  for (const f of program.functions) f.name = r(f.name);
  for (const g of program.globals) seen.add(g), (g.name = r(g.name)), walk(g.init), walk(g.ty);
  if (program.unevaluated) program.unevaluated = program.unevaluated.map(r);
  walk({ ...program, natives: undefined, globals: undefined });
}

/**
 * An Int remainder read as a Double where the sign of a zero shows (`1 / (a % b)`, `Object.is(a % b, -0)`,
 * `Math.atan2`) is the Doubles' remainder: JavaScript's `-4 % 2` is -0, which an Int can't hold. Elsewhere (`xs.push(i % 10)`
 * into a number[]) -0 and +0 read the same, and the Int remainder (fast) stays. (An Int `%` stored in an Int slot first
 * still reads back as +0.)
 */
function negativeZeroRems(program: Program) {
  const SIGNED = new Set(["objectIs", "atan2", "sign", "min", "max"]);
  const seen = new Set<object>();
  const rem = (x: unknown): x is Extract<Expr, { e: "toDouble" }> =>
    !!x && (x as Expr).e === "toDouble" && (x as { x: Expr }).x.e === "bin" && ((x as { x: Expr }).x as { op: string }).op === "%";
  const fix = (o: Record<string, unknown>) => {
    const r = o.x as Extract<Expr, { e: "bin" }>;
    Object.assign(o, { e: "op", op: "math.fn", args: [{ e: "str", v: "fmod" }, { e: "toDouble", x: r.l }, { e: "toDouble", x: r.r }] });
    delete o.x;
  };
  const walk = (x: unknown): void => {
    if (!x || typeof x !== "object" || seen.has(x)) return;
    seen.add(x);
    if (Array.isArray(x)) return x.forEach(walk);
    const o = x as Record<string, unknown>;
    // Through conversions of the converted value (`Double(Double(a % b))`).
    const at = (x: unknown): unknown => {
      while (x && (x as Expr).e === "toDouble" && (x as { x: Expr }).x.e === "toDouble") x = (x as { x: Expr }).x;
      return x;
    };
    if (o.e === "bin" && o.op === "/" && rem(at(o.r))) fix(at(o.r) as Record<string, unknown>);
    const args = o.e === "op" && Array.isArray(o.args) ? (o.args as Expr[]) : [];
    if (args[0]?.e === "str" && SIGNED.has(args[0].v)) for (const a of args) if (rem(at(a))) fix(at(a) as Record<string, unknown>);
    for (const v of Object.values(o)) walk(v);
  };
  walk(program);
}

/** Inside a `declare` (a native function the platform code implements, and its parameters). */
const isAmbient = (node: ts.Node) => !!ts.findAncestor(node, (n) => ts.canHaveModifiers(n) && !!ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword));

type NumKind = "int" | "double";
type Slot = ts.Symbol | ts.Node;

/**
 * The sized number types (src/index.ts; `BigInt` is Int64): the range a slot of each holds, and `int` when reads are Ints
 * (arithmetic on the others is in Doubles: Int64 and UInt32 pass Kotlin's 32-bit Int, Float32 is a float).
 * Int64 stops at the largest double under 2^63, so a write proven in range converts exactly.
 */
const SIZED: Record<SizedNum, { lo: number; hi: number; int: boolean; wrap: string }> = {
  Int8: { lo: -128, hi: 127, int: true, wrap: "(x << 24) >> 24" },
  Int16: { lo: -32768, hi: 32767, int: true, wrap: "(x << 16) >> 16" },
  Int32: { lo: -(2 ** 31), hi: 2 ** 31 - 1, int: true, wrap: "x | 0" },
  Int64: { lo: -(2 ** 63), hi: 2 ** 63 - 1024, int: false, wrap: "x | 0" },
  UInt8: { lo: 0, hi: 255, int: true, wrap: "x & 0xff" },
  UInt16: { lo: 0, hi: 65535, int: true, wrap: "x & 0xffff" },
  UInt32: { lo: 0, hi: 2 ** 32 - 1, int: false, wrap: "x >>> 0" },
  Float32: { lo: -Infinity, hi: Infinity, int: false, wrap: "Math.fround(x)" },
};

/** What a number expression can be: its bounds, whether it is always a whole number, and whether it may be NaN. */
interface NumRange { lo: number; hi: number; whole: boolean; nan: boolean }
const ANY_NUM: NumRange = { lo: -Infinity, hi: Infinity, whole: false, nan: true };

/**
 * The kind of each numeric slot. A property read through some types (`obj.count` of a class) is a
 * transient copy of the declared symbol: it is looked up as the symbol it stands for.
 */
class SlotKinds extends Map<Slot, NumKind> {
  private readonly checker: ts.TypeChecker;
  constructor(checker: ts.TypeChecker) {
    super();
    this.checker = checker;
  }
  private root(slot: Slot): Slot {
    return "flags" in slot && "escapedName" in slot && slot.flags & ts.SymbolFlags.Transient ? (this.checker.getRootSymbols(slot)[0] ?? slot) : slot;
  }
  override get(slot: Slot) {
    return super.get(this.root(slot));
  }
  override set(slot: Slot, kind: NumKind) {
    return super.set(this.root(slot), kind);
  }
  override has(slot: Slot) {
    return super.has(this.root(slot));
  }
}

const BIT_OPS: Partial<Record<ts.SyntaxKind, Op>> = {
  [ts.SyntaxKind.AmpersandToken]: "bit.and",
  [ts.SyntaxKind.BarToken]: "bit.or",
  [ts.SyntaxKind.CaretToken]: "bit.xor",
  [ts.SyntaxKind.LessThanLessThanToken]: "bit.shl",
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: "bit.shr",
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: "bit.ushr",
};

/** `a op= b` for the operators that have no native compound form: `a = a op b`. */
const COMPOUND: Partial<Record<ts.SyntaxKind, ts.BinaryOperator>> = {
  [ts.SyntaxKind.AmpersandEqualsToken]: ts.SyntaxKind.AmpersandToken,
  [ts.SyntaxKind.BarEqualsToken]: ts.SyntaxKind.BarToken,
  [ts.SyntaxKind.CaretEqualsToken]: ts.SyntaxKind.CaretToken,
  [ts.SyntaxKind.LessThanLessThanEqualsToken]: ts.SyntaxKind.LessThanLessThanToken,
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken]: ts.SyntaxKind.GreaterThanGreaterThanToken,
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken]: ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken]: ts.SyntaxKind.AsteriskAsteriskToken,
};

/** The operators of two bigints (plain and compound) and their operation. */
const BIG_OPS: Partial<Record<ts.SyntaxKind, Op>> = {
  [ts.SyntaxKind.PlusToken]: "big.add", [ts.SyntaxKind.PlusEqualsToken]: "big.add",
  [ts.SyntaxKind.MinusToken]: "big.sub", [ts.SyntaxKind.MinusEqualsToken]: "big.sub",
  [ts.SyntaxKind.AsteriskToken]: "big.mul", [ts.SyntaxKind.AsteriskEqualsToken]: "big.mul",
  [ts.SyntaxKind.SlashToken]: "big.div", [ts.SyntaxKind.SlashEqualsToken]: "big.div",
  [ts.SyntaxKind.PercentToken]: "big.mod", [ts.SyntaxKind.PercentEqualsToken]: "big.mod",
  [ts.SyntaxKind.AsteriskAsteriskToken]: "big.pow", [ts.SyntaxKind.AsteriskAsteriskEqualsToken]: "big.pow",
  [ts.SyntaxKind.AmpersandToken]: "big.and", [ts.SyntaxKind.AmpersandEqualsToken]: "big.and",
  [ts.SyntaxKind.BarToken]: "big.or", [ts.SyntaxKind.BarEqualsToken]: "big.or",
  [ts.SyntaxKind.CaretToken]: "big.xor", [ts.SyntaxKind.CaretEqualsToken]: "big.xor",
  [ts.SyntaxKind.LessThanLessThanToken]: "big.shl", [ts.SyntaxKind.LessThanLessThanEqualsToken]: "big.shl",
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: "big.shr", [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken]: "big.shr",
};

/** Math functions with the same meaning everywhere (`Math.fn(x)` → math.fn). */
const MATH_FNS = new Set(["fround", "sign", "log", "log2", "log10", "log1p", "exp", "expm1", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh", "hypot", "cbrt"]);

/** Array methods that call their callback before they return: one that throws makes the call throw. */
const ARRAY_CALLBACKS = new Set(["map", "filter", "forEach", "some", "every", "find", "findIndex", "sort", "reduce", "flatMap", "reduceRight", "findLast", "findLastIndex", "toSorted"]);
/** JavaScript's typed arrays (packed native buffers): each one's element bound when it reads as an Int (else a Double). */
const TYPED_ARRAYS: Record<string, number | undefined> = {
  Int8Array: 2 ** 7, Uint8Array: 2 ** 8, Uint8ClampedArray: 2 ** 8, Int16Array: 2 ** 15, Uint16Array: 2 ** 16, Int32Array: 2 ** 31,
  Uint32Array: undefined, Float32Array: undefined, Float64Array: undefined,
};
const TA_UNSUPPORTED = new Set(["SharedArrayBuffer", "BigInt64Array", "BigUint64Array"]);

/** Constants, as literals JavaScript prints the same way. */
const MATH_CONSTANTS: Record<string, number> = {
  "Math.E": Math.E, "Math.LN2": Math.LN2, "Math.LN10": Math.LN10, "Math.LOG2E": Math.LOG2E, "Math.LOG10E": Math.LOG10E, "Math.SQRT2": Math.SQRT2, "Math.SQRT1_2": Math.SQRT1_2,
  "Number.EPSILON": Number.EPSILON, "Number.MAX_SAFE_INTEGER": Number.MAX_SAFE_INTEGER, "Number.MIN_SAFE_INTEGER": Number.MIN_SAFE_INTEGER,
  "Number.MAX_VALUE": Number.MAX_VALUE, "Number.MIN_VALUE": Number.MIN_VALUE,
};

type GenericDecl = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration;
/** A function of an object literal whose `this` is the object: a method, a getter / setter, a function filling a method. */
type LiteralFn = ts.MethodDeclaration | ts.AccessorDeclaration | ts.FunctionExpression;

/** A native type as part of a name: `Box<number[]>` → `Box__Arr_Double`. */
function mangle(t: Ty): string {
  switch (t.k) {
    case "num":
      return t.n;
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
      return `Arr_${mangle(t.of)}`;
    case "map":
      return `Map_${mangle(t.of)}`;
    case "optional":
      return `Opt_${mangle(t.of)}`;
    case "class":
      return t.name;
    case "rt":
    case "union":
      return t.name;
    case "fn":
      return `Fn_${t.params.map(mangle).join("_")}_To_${mangle(t.ret)}`;
    case "promise":
      return `Promise_${mangle(t.of)}`;
    case "settled":
      return `Settled_${mangle(t.of)}`;
    case "jsmap":
      return `JsMap_${mangle(t.key)}_${mangle(t.of)}`;
    case "jsset":
      return `JsSet_${mangle(t.of)}`;
  }
}

interface Ctx {
  async: boolean;
  /** The enclosing function's return type. */
  ret: Ty;
  /** `void | (() => void)`: a bare `return` and the end of the body return nil. */
  voidUnion: boolean;
  inTry: boolean;
  /** Inside a `for` loop lowered to `while`: what a `continue` runs first (the loop's increment). */
  continueWith?: Stmt[];
  /** What a `continue label` runs first, for each labelled `for` loop lowered to `while` around this code. */
  labelSteps?: Record<string, Stmt[]>;
  /** Inside a generator: its shape (what `yield` yields and reads). */
  gen?: GenShape;
}

/** A temporary holding one item of a literal on the right of a destructuring assignment. */
interface PatternItem {
  x: Expr;
  ty: Ty;
  node: ts.Expression;
}

/** The value a destructuring assignment reads (see destructure): a temporary, or an array or object literal's items. */
interface PatternSource {
  /** TypeScript's type of the value (not null). */
  type: ts.Type;
  x?: Expr;
  ty?: Ty;
  items?: PatternItem[];
  props?: Map<string, PatternItem>;
}

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export function transpile(entry: string): Program {
  const program = ts.createProgram([path.resolve(entry)], appCompilerOptions());
  const files = program
    .getSourceFiles()
    // src/adapters.ts is compiled with the app (also when the package is installed under node_modules).
    .filter((sf) => !sf.isDeclarationFile && path.resolve(sf.fileName) !== API_FILE && (!sf.fileName.includes("/node_modules/") || path.resolve(sf.fileName) === ADAPTERS_FILE));

  const tsDiagnostics = files.flatMap((sf) => [...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf)]);
  if (tsDiagnostics.length) {
    throw new CompileError(
      tsDiagnostics.map((d) => {
        const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: 0, character: 0 };
        return {
          file: d.file ? displayPath(d.file.fileName) : "",
          line: pos.line + 1,
          column: pos.character + 1,
          message: ts.flattenDiagnosticMessageText(d.messageText, "\n"),
          length: d.length,
          code: d.code,
          id: `TS${d.code}`,
        };
      }),
    );
  }
  return new Frontend(program, files).run(path.basename(entry));
}

class Frontend {
  private readonly checker: ts.TypeChecker;
  private readonly diagnostics: Diagnostic[] = [];
  /** The app's node being compiled: where an error found while walking a lib type is reported (see error). */
  private anchor?: ts.Node;
  private readonly kinds: SlotKinds;
  private readonly writes: { slot: Slot; from?: ts.Expression; fromSlot?: Slot; forceDouble?: boolean; counter?: ts.Expression | null }[] = [];
  /** Slots declared with a sized number type (`x: Int8`, a function's `: UInt8` result), and `Int8[]` slots by element. */
  private readonly sized = new Map<Slot, SizedNum>();
  private readonly sizedArrays = new Map<Slot, SizedNum>();
  /** Top-level and local functions: a reference to one as a value is a function reference. */
  private readonly functionSymbols = new Set<ts.Symbol>();
  /** Statements lowered elsewhere (a constructor's statements before `super(…)`, see preSuper): `stmt` skips them. */
  private readonly skipped = new Set<ts.Node>();
  /** Some class extends `Error`: ERROR_BASE exists, and a native error may carry an object of it (see errorBase). */
  private errorClasses = false;
  /** The app throws a value that is not an Error, or uses an error's `cause`: THROWN exists (see thrownClass). */
  private thrownValues = false;
  private readonly classes = new Map<ts.Symbol, ClassDecl>();
  /** The app's classes, and the interfaces some class implements (protocols), by symbol. */
  private readonly objectClasses = new Map<ts.Symbol, ts.ClassLikeDeclaration>();
  /** Native names of class expressions (TypeScript calls an anonymous one `__class`): `X` for `const X = class …`, else `Class__1`. */
  private readonly classNames = new Map<ts.Symbol, string>();
  /** Native names of the top-level declarations of every module, by symbol (nameDeclarations). */
  private readonly topNames = new Map<ts.Symbol, string>();
  /** The locals of the surrounding functions that a nested class uses (and passes on), in order: hidden constructor parameters. */
  private readonly captures = new Map<ts.Symbol, ts.Symbol[]>();
  /**
   * Captured locals a nested class must share with its function: reassigned ones (arrays and maps are
   * references, shared as they are). Each lives in a `Ref__T` box, read and written as `x.value`.
   */
  private readonly boxed = new Set<ts.Symbol>();
  private readonly refClasses = new Map<string, ClassDecl>();
  /**
   * Loop variables a nested class uses while the loop's body reassigns them: each turn has its own
   * box (`i__box`), made at the top of the body and written back to the loop's variable at its end
   * (and before a `continue`), so the step and the condition see what the turn left.
   */
  /** `var`s declared at the top of their function (see checkVar), by the function's body. */
  private readonly hoisted = new Set<ts.Symbol>();
  private readonly hoistedAt = new Map<ts.Node, ts.Symbol[]>();
  private readonly checkedVars = new Set<ts.Symbol>();
  /** Key order (see checkKeyOrders): each interface object literal's keys, as JavaScript lists them (undefined: unknown). */
  private readonly literalKeys: { cls: string; keys?: string[]; node: ts.Node }[] = [];
  /** Interfaces whose objects' keys are enumerated (Object.keys, for…in): the keys listed, and where. */
  private readonly enumeratedClasses = new Map<string, { keys: string[]; node: ts.Node }>();
  /** Maps enumerated, and the types `res.json<T>()` decodes (no JSON parser keeps the keys' order on every platform). */
  private readonly enumeratedMaps: { ty: Ty; node: ts.Node }[] = [];
  private readonly decoded: Ty[] = [];
  /** The classes and unions `JSON.stringify` writes (Program.jsonClasses), by native name. */
  private readonly jsonClasses = new Map<string, NonNullable<Program["jsonClasses"]>[number]>();
  private readonly loopBoxes = new Map<ts.Symbol, { loop: ts.ForStatement | ts.ForOfStatement; name: string }>();
  /** Class expressions already lowered (where they are declared, or after the top level). */
  private readonly definedClasses = new Set<ts.ClassLikeDeclaration>();
  private readonly protocols = new Map<ts.Symbol, ts.InterfaceDeclaration>();
  /** The class an object literal of a protocol builds (`Shape__Literal`), by protocol name: made on first use. */
  private readonly literalClasses = new Map<string, ObjectClassDecl>();
  /** Generators: each `Generator<T, R, N>` shape by base name, the state machine classes, and the generator functions (checkGenerator). */
  private readonly genShapes = new Map<string, GenShape>();
  private readonly genClasses: ObjectClassDecl[] = [];
  private readonly genNodes: ts.SignatureDeclaration[] = [];
  /** The shapes whose generators take `it.throw(e)` (genThrowIns), once computed. */
  private throwIns?: Set<string>;
  /** The shapes each generic generator function's calls make (genInstanceBases). */
  private readonly genInstances = new Map<ts.SignatureDeclaration, string[]>();
  /**
   * Generics are compiled once per instantiation (`Box<number>` → `Box__Double`), so every native
   * value keeps one concrete type. `env` binds the type parameters while one instantiation is
   * lowered; a bound type may name outer parameters, which the same environment binds.
   */
  private env = new Map<ts.Symbol, ts.Type>();
  /** The app's generic functions, interfaces and classes, by symbol. */
  private readonly generics = new Map<ts.Symbol, GenericDecl>();
  /** Every instantiation by its native name, and those still to lower (functions and classes). */
  private readonly instances = new Map<string, { decl: GenericDecl; env: Map<ts.Symbol, ts.Type> }>();
  private readonly pendingInstances: string[] = [];
  /** Generic methods' instantiations (`Class.name__Arg`), lowered into their class after the rest (methodInstance). */
  private readonly methodInstances = new Map<string, { decl: ts.MethodDeclaration; env: Map<ts.Symbol, ts.Type>; cls: string; name: string }>();
  private readonly pendingMethods: string[] = [];
  /** Generic functions declared in a block: one local function per instantiation the block calls (localGenericFns). */
  private readonly localGenerics = new Map<ts.Symbol, ts.FunctionDeclaration>();
  private readonly instanceClasses = new Map<string, ClassDecl>();
  private readonly instanceProtocols = new Map<string, ProtocolDecl>();
  private readonly asyncFunctions = new Set<ts.Node>();
  /**
   * What can throw synchronously, by family root (see `familyOf`): functions, methods, accessors, lambdas,
   * and classes (their constructor). A fixpoint over the call graph (`inferThrows`).
   */
  private readonly throwing = new Set<ts.Node>();
  /** Function-typed variables, parameters and fields that some function value which can throw is stored in. */
  private readonly throwingSlots = new Set<ts.Symbol>();
  /**
   * Declarations that are one native member and so throw together: a method, what it overrides and
   * implements, the functions protocol literals give for it, a getter and its setter; and the classes of
   * one hierarchy (their constructors). A union-find: each node to its parent.
   */
  private readonly families = new Map<ts.Node, ts.Node>();
  /** Names of the temporaries the lowering introduces (`ds__1`, `it__2`…). */
  private temps = 0;
  /** The label of each labelled loop (`outer: for …`), by its statement: its IR loop carries it. */
  private readonly labels = new Map<ts.Node, string>();
  /** `delete o.f` of optional properties, by class (see checkKeyOrders). */
  private readonly deletedFields: { cls: string; node: ts.Node }[] = [];
  /** Nodes already evaluated into a temporary (see presetParts): `expr` gives the temporary. */
  private readonly presets = new Map<ts.Node, Expr>();
  /** The native types of the presets yieldSpill made. */
  private readonly presetTys = new Map<ts.Node, Ty>();
  /** `const MapView = native<MapProps>("MapView")`: the platform type's name and the props type. */
  private readonly nativeComponents = new Map<ts.Symbol, { name: string; props: ts.Type }>();
  /** The ones used, with the name of their props class. */
  private readonly usedComponents = new Map<string, string>();
  /** The selects being lowered, innermost last: their options find the state they share here. */
  private readonly selects: SelectState[] = [];
  /** createCss()'s theme, read at compile time: its tokens and screens apply to every style. */
  private theme: Theme = {};
  /** `const fade = keyframes({…})`: the frames of each, by the const's symbol. */
  private readonly keyframes = new Map<ts.Symbol, ts.ObjectLiteralExpression>();
  /** Properties some code assigns: a const object's property is folded into a style only when none does. */
  private assigned?: Set<ts.Symbol>;
  private selectCount = 0;

  private readonly program: ts.Program;
  private readonly files: readonly ts.SourceFile[];

  constructor(program: ts.Program, files: readonly ts.SourceFile[]) {
    this.program = program;
    this.files = files;
    this.checker = program.getTypeChecker();
    this.kinds = new SlotKinds(this.checker);
  }

  run(source: string): Program {
    // Before any type is made: `unknown` then also holds an Error (unknownTy).
    this.thrownValues = this.usesThrownValues();
    this.nameDeclarations();
    for (const sf of this.files) this.collectStyling(sf);
    this.collectClasses();
    this.collectCaptures();
    for (const sf of this.files) this.collect(sf);
    for (const sf of this.files) this.collectFunctionReferences(sf);
    if (this.sizedArrays.size) {
      // `const xs = makeBytes()`: an unannotated variable takes the packed array type of its initializer.
      for (const sf of this.files) {
        this.forEachNode(sf, (n) => {
          if (!ts.isVariableDeclaration(n) || n.type || !n.initializer || !ts.isIdentifier(n.name)) return;
          const elem = this.storedArray(n.initializer);
          const symbol = this.checker.getSymbolAtLocation(n.name);
          if (elem && symbol) this.sizedArrays.set(symbol, elem);
        });
      }
    }
    if (this.sized.size || this.sizedArrays.size) for (const sf of this.files) this.forEachNode(sf, (n) => this.rejectSized(n));
    this.linkMembers();
    this.inferNumbers();
    this.inferThrows();
    // Every generator is known now (an earlier answer may have missed some).
    this.throwIns = undefined;
    for (const shape of this.genShapes.values()) shape.throws = this.genShapeThrows(shape.base);
    this.collectConformances();

    const out: Program = { source, classes: [], globals: [], functions: [], main: [] };
    // `class E extends Error`: JavaScript's Error as a class of the app, before every class extending it.
    this.errorClasses = [...this.objectClasses.values()].some((node) => { const base = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0]; return !!base && this.isLibError(base.expression); });
    this.errorClasses ||= this.thrownValues;
    if (this.errorClasses) out.objectClasses = [this.errorBase(), ...(this.thrownValues ? [this.thrownClass()] : [])];
    // Modules in TypeScript's order, which is JavaScript's: what a module imports first, depth-first, each once. Each
    // top-level variable (and static field) is initialized where it is declared, among the top-level statements.
    // A module only imported for its types (or not used at all) is never evaluated in JavaScript (the import is
    // elided): its declarations are kept, but none of its top-level code or initializers run.
    const evaluated = this.evaluatedFiles();
    // Module-level `var`s declared more than once or in a block (rest2): globals at their zero value from the start.
    for (const sf of this.files) {
      for (const g of this.hoistedLets(sf) as Extract<Stmt, { s: "let" }>[]) out.globals.push({ ...g, name: this.idName((this.hoistedAt.get(sf)!.find((s) => s.name === g.name)!.valueDeclaration as ts.VariableDeclaration).name as ts.Identifier) });
    }
    for (const sf of this.files) {
      for (const statement of sf.statements) {
        const [before, main] = [out.globals.length, out.main.length];
        this.topLevel(statement, out);
        if (evaluated.has(sf)) for (const g of out.globals.slice(before)) out.main.push({ s: "global", name: g.name });
        else (out.main.length = main), (out.unevaluated ??= []).push(...out.globals.slice(before).map((g) => g.name));
      }
    }
    // An error nothing catches at the top level is logged, and the rest of it doesn't run.
    if (this.irThrows(out.main)) out.main = this.catchLog(out.main);
    // Class expressions inside functions and expressions: one native class each, declared at the top level.
    for (const node of this.objectClasses.values()) if (!this.definedClasses.has(node) && !node.typeParameters?.length) this.classDef(node, out);
    const plain = [...this.protocols.values()].filter((node) => !node.typeParameters?.length).map((node) => this.protocolDecl(node));
    // Generic functions and classes, once per instantiation the program (or another instantiation) uses.
    for (let name = this.pendingInstances.shift(); name; name = this.pendingInstances.shift()) {
      const { decl, env } = this.instances.get(name)!;
      this.withEnv(env, () => {
        if (ts.isClassDeclaration(decl)) this.classDef(decl, out, name);
        else if (ts.isFunctionDeclaration(decl) || ts.isArrowFunction(decl) || ts.isFunctionExpression(decl)) out.functions.push(this.fnDecl(name, decl));
      });
    }
    // Generic methods, once per instantiation, into their class (and the instantiations those request in turn).
    for (let key = this.pendingMethods.shift(); key; key = this.pendingMethods.shift()) {
      this.methodInstanceDef(key, out);
      for (let name = this.pendingInstances.shift(); name; name = this.pendingInstances.shift()) {
        const { decl, env } = this.instances.get(name)!;
        this.withEnv(env, () => {
          if (ts.isClassDeclaration(decl)) this.classDef(decl, out, name);
          else if (ts.isFunctionDeclaration(decl) || ts.isArrowFunction(decl) || ts.isFunctionExpression(decl)) out.functions.push(this.fnDecl(name, decl));
        });
      }
    }
    out.classes = [...this.allClasses(), ...this.refClasses.values()];
    if (plain.length || this.instanceProtocols.size) out.protocols = [...plain, ...this.instanceProtocols.values()];
    this.finishShapes(out);
    if (this.literalClasses.size) out.objectClasses = [...(out.objectClasses ?? []), ...this.literalClasses.values()];
    if (this.genShapes.size) this.genOutput(out);
    if (out.objectClasses) {
      // Bases first: a printer that flattens a class (Rust) finds its base already declared.
      const order: ObjectClassDecl[] = [];
      const visit = (c: ObjectClassDecl) => {
        if (order.includes(c)) return;
        const base = out.objectClasses!.find((b) => b.name === c.base);
        if (base) visit(base);
        order.push(c);
      };
      out.objectClasses.forEach(visit);
      out.objectClasses = order;
      for (const c of order) c.open = order.some((sub) => sub.base === c.name);
    }
    // An interface holding one that can't be decoded (it has a function field) can't be decoded either.
    for (let changed = true; changed; ) {
      changed = false;
      for (const cls of out.classes) {
        if (cls.decodable && !cls.fields.every((f) => this.decodable(f.ty))) (cls.decodable = false), (changed = true);
      }
    }
    if (this.unions.size) out.unions = [...this.unions.values()];
    if (this.jsonClasses.size) out.jsonClasses = [...this.jsonClasses.values()];
    out.functions.push(...this.unionFns.values());
    if (this.usedComponents.size) out.components =[...this.usedComponents].map(([name, props]) => ({ name, props }));
    this.checkKeyOrders();
    this.checkReadBeforeDeclaration();
    this.checkFrozenFlows();
    // Reference cycles Swift and Rust couldn't free (cycles.ts): on a program that is otherwise fine.
    if (!this.diagnostics.length) checkCycles(out, (node, message) => void this.error(node ?? this.files.find((sf) => path.basename(sf.fileName) === source) ?? this.files[0]!, message));
    // Classes nothing can tell from copies: Swift structs (values.ts).
    if (!this.diagnostics.length && out.objectClasses) {
      const classes = [...this.objectClasses].filter(([, node]) => !node.typeParameters?.length).map(([symbol, node]) => ({ node, name: this.className(symbol) }));
      markValueClasses(out, this.checker, this.files, classes);
    }
    if (this.diagnostics.length) {
      throw new CompileError(this.diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column));
    }
    renameReserved(out);
    negativeZeroRems(out);
    return out;
  }

  // -------------------------------------------------------------------------
  // Diagnostics
  // -------------------------------------------------------------------------

  /**
   * A top-level `let` / `const` / `class` read (through the functions a top-level statement calls) before its
   * declaration has run: JavaScript throws a ReferenceError there, and each native target would do something else
   * (Swift initializes it early, Kotlin reads a zero value, Rust panics), so it is a compile error. Followed: direct
   * calls of the module's functions (declarations, and `const`s holding a function); a callback passed along isn't.
   */
  private checkReadBeforeDeclaration() {
    for (const sf of this.files) {
      const declared = new Map<ts.Symbol, ts.Node>();
      for (const st of sf.statements) {
        if (ts.isVariableStatement(st) && st.declarationList.flags & ts.NodeFlags.BlockScoped) {
          for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) declared.set(this.checker.getSymbolAtLocation(d.name)!, d);
        } else if (ts.isClassDeclaration(st) && st.name) declared.set(this.checker.getSymbolAtLocation(st.name)!, st);
      }
      const reported = new Set<ts.Symbol>();
      for (const st of sf.statements) {
        if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) continue;
        const followed = new Set<ts.Node>();
        // `site`: the top-level call being followed (a read in the top-level code itself is TypeScript's error).
        const visit = (n: ts.Node, site: ts.Node | undefined): void => {
          if (ts.isFunctionLike(n) || ts.isClassLike(n)) return;
          if (site && ts.isIdentifier(n)) {
            const symbol = this.valueSymbol(n);
            const decl = symbol && declared.get(symbol);
            if (decl && decl.end > site.pos && !reported.has(symbol!)) {
              reported.add(symbol!);
              this.error(n, `"${n.text}" is read before its declaration runs (here, through the call at line ${sf.getLineAndCharacterOfPosition(site.getStart()).line + 1}): JavaScript throws a ReferenceError; declare it above that call.`);
            }
          }
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
            const target = this.valueSymbol(n.expression)?.valueDeclaration;
            const fn = target && ts.isVariableDeclaration(target) && target.initializer && this.isFunctionNode(target.initializer) ? target.initializer : target;
            if (fn && fn.getSourceFile() === sf && (ts.isFunctionDeclaration(fn) || ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.body && !followed.has(fn)) {
              followed.add(fn);
              visit(fn.body, site ?? n);
            }
          }
          ts.forEachChild(n, (c) => visit(c, site));
        };
        visit(st, undefined);
      }
    }
  }

  /**
   * The modules JavaScript evaluates: the entry, and what an evaluated one imports for a value (an import whose
   * bindings are used only as types, or not at all, is elided, as by TypeScript and bun), side-effect imports and
   * re-exports (`export … from`).
   */
  private evaluatedFiles(): Set<ts.SourceFile> {
    const seen = new Set<ts.SourceFile>();
    const inType = (n: ts.Node): boolean => {
      for (let a: ts.Node = n.parent; a && !ts.isSourceFile(a); a = a.parent) {
        if (ts.isExpressionWithTypeArguments(a) && ts.isHeritageClause(a.parent) && a.parent.token === ts.SyntaxKind.ExtendsKeyword && ts.isClassLike(a.parent.parent)) return false;
        if (ts.isTypeNode(a) || ts.isInterfaceDeclaration(a) || ts.isTypeAliasDeclaration(a)) return true;
        if (ts.isStatement(a) || ts.isFunctionLike(a)) break;
      }
      return false;
    };
    const visit = (sf: ts.SourceFile) => {
      if (seen.has(sf)) return;
      seen.add(sf);
      const aliases = new Set<ts.Symbol>();
      const uses = new Set<ts.Symbol>();
      const imports: [ts.Expression, ts.Symbol[] | undefined][] = [];
      for (const st of sf.statements) {
        if (ts.isImportDeclaration(st)) {
          const c = st.importClause;
          if (c?.isTypeOnly) continue;
          const names = !c ? undefined : [c.name, ...(c.namedBindings && ts.isNamespaceImport(c.namedBindings) ? [c.namedBindings.name] : (c.namedBindings?.elements ?? []).filter((e) => !e.isTypeOnly).map((e) => e.name))];
          const symbols = names?.flatMap((n) => (n ? [this.checker.getSymbolAtLocation(n)!] : []));
          symbols?.forEach((x) => aliases.add(x));
          imports.push([st.moduleSpecifier, symbols]);
        } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && !st.isTypeOnly) imports.push([st.moduleSpecifier, undefined]);
      }
      const scan = (n: ts.Node): void => {
        if (ts.isIdentifier(n) && !ts.isImportSpecifier(n.parent) && !ts.isImportClause(n.parent) && !ts.isNamespaceImport(n.parent)) {
          const symbol = this.checker.getSymbolAtLocation(n) ?? (ts.isShorthandPropertyAssignment(n.parent) ? this.checker.getShorthandAssignmentValueSymbol(n.parent) : undefined);
          if (symbol && aliases.has(symbol) && !inType(n)) uses.add(symbol);
        }
        ts.forEachChild(n, scan);
      };
      if (aliases.size) scan(sf);
      for (const [spec, symbols] of imports) {
        if (symbols && !symbols.some((x) => uses.has(x))) continue;
        const target = this.checker.getSymbolAtLocation(spec)?.valueDeclaration;
        if (target && ts.isSourceFile(target) && this.files.includes(target)) visit(target);
      }
    };
    const entry = path.resolve(this.program.getRootFileNames()[0]!);
    const root = this.files.find((sf) => path.resolve(sf.fileName) === entry);
    if (!root) return new Set(this.files);
    visit(root);
    return seen;
  }

  /** `(x) => x` as `(x) => !!x`: the test JavaScript makes of a callback's result (a quick fix). */
  private truthyFix(fn: ts.Expression): string | undefined {
    if (!ts.isArrowFunction(fn) || ts.isBlock(fn.body)) return undefined;
    const body = fn.body.getText();
    const at = fn.body.getStart() - fn.getStart();
    return `${fn.getText().slice(0, at)}!!${/^[\w.]+$/.test(body) ? body : `(${body})`}`;
  }

  /** `fix`: where the fix is mechanical, the text that replaces `node` (the editor plugin's quick fix). */
  private error(node: ts.Node, message: string, fix?: string): Expr {
    // Never inside TypeScript's lib or the API: a type walked from there (Array's members…) follows from a cause in
    // the app's code, reported there; with none yet, at the app's statement or declaration being compiled.
    if (!this.files.includes(node.getSourceFile())) {
      if (this.diagnostics.length || !this.anchor) return { e: "nil" };
      node = this.anchor;
      fix = undefined;
    }
    // A value typed `any` after an error (`const z = eval(…)`, then `${z}`) follows from that error: once only.
    if (this.diagnostics.length && ts.isExpression(node) && this.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) return { e: "nil" };
    const sf = node.getSourceFile();
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart());
    const file = displayPath(sf.fileName);
    // One error per line: the first is the cause, the rest follow from it.
    if (!this.diagnostics.some((d) => d.file === file && d.line === line + 1)) {
      this.diagnostics.push({ file, line: line + 1, column: character + 1, message, length: node.getEnd() - node.getStart(), id: kindOf(message).code, ...(fix !== undefined ? { fix } : {}) });
    }
    return { e: "nil" };
  }

  // -------------------------------------------------------------------------
  // Pass 1: classes, functions, numeric slots and every write into them
  // -------------------------------------------------------------------------

  private collect(sf: ts.SourceFile) {
    const visit = (node: ts.Node): void => {
      this.anchor = node;
      this.reject(node);

      if (ts.isInterfaceDeclaration(node) && this.protocols.has(this.checker.getSymbolAtLocation(node.name)!)) {
        if (node.typeParameters?.length) this.generics.set(this.checker.getSymbolAtLocation(node.name)!, node);
        for (const member of node.members) {
          if (ts.isPropertySignature(member)) this.declareSlot(member.name, member.type);
          else if (!ts.isMethodSignature(member)) this.error(member, "Only properties and methods are supported in an interface a class implements.");
        }
      } else if (ts.isInterfaceDeclaration(node) || (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type) && !node.type.members.some(ts.isMethodSignature))) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol && node.typeParameters?.length) this.generics.set(symbol, node);
        else if (symbol) this.classes.set(symbol, { name: this.className(symbol), fields: [], decodable: true });
        const members = ts.isInterfaceDeclaration(node) ? node.members : (node.type as ts.TypeLiteralNode).members;
        for (const member of members) {
          if (!ts.isPropertySignature(member)) {
            this.error(member, "Only properties are supported in interfaces (they become native classes).");
            continue;
          }
          this.declareSlot(member.name, member.type);
        }
      }
      // Others are renamed (renameReserved); a `declare function` keeps its name, which platform code calls.
      if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && isAmbient(node) && node.name && ts.isIdentifier(node.name) && ts.isSourceFile(this.topLevelOf(node))) {
        if (RESERVED_TYPES.has(node.name.text)) this.error(node.name, `"${node.name.text}" is reserved by the native runtimes or platforms; rename it.`);
      }
      if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node) || ts.isParameter(node)) && isAmbient(node) && node.name && ts.isIdentifier(node.name) && IMPLICIT_NAMES.has(node.name.text)) {
        this.error(node.name, `"${node.name.text}" would shadow a name the generated Swift/Kotlin uses; rename it.`);
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) this.functionSymbols.add(symbol);
        if (!node.body) {
          // `declare function`: implemented by each platform in native/<target>/.
          if (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Ambient) this.declareNative(node);
          else if (!this.overloadImpl(node)) this.error(node, "Function overloads are supported for functions declared with their implementation (natively one function: the implementation's signature).");
          else {
            // One native function, the implementation: its parameters and result take what the overloads do.
            const impl = this.overloadImpl(node)!;
            node.parameters.forEach((p, i) => {
              const [a, b] = [p, impl.parameters[i]].map((q) => (q && ts.isIdentifier(q.name) ? this.checker.getSymbolAtLocation(q.name) : undefined));
              if (a && b) this.link(a, b);
            });
            this.link(node, impl);
          }
        }
      }
      if (ts.isMethodDeclaration(node) && !node.body && this.overloadImpl(node)) {
        const impl = this.overloadImpl(node)!;
        node.parameters.forEach((p, i) => {
          const [a, b] = [p, impl.parameters[i]].map((q) => (q && ts.isIdentifier(q.name) ? this.checker.getSymbolAtLocation(q.name) : undefined));
          if (a && b) this.link(a, b);
        });
        this.link(node, impl);
      }
      if ((ts.isFunctionDeclaration(node) || this.isFunctionNode(node)) && node.typeParameters?.length) {
        // A top-level generic function is compiled once per instantiation; elsewhere it would have to capture.
        const holder = ts.isFunctionDeclaration(node) ? node : node.parent;
        const name = ts.isFunctionDeclaration(node) ? node.name : ts.isVariableDeclaration(holder) && ts.isIdentifier(holder.name) ? holder.name : undefined;
        const topLevel = !!name && ts.isSourceFile(this.topLevelOf(ts.isFunctionDeclaration(node) ? node : holder)) && (ts.isFunctionDeclaration(node) || !!(ts.getCombinedNodeFlags(holder) & ts.NodeFlags.Const));
        const symbol = topLevel && name ? this.checker.getSymbolAtLocation(name) : undefined;
        if (symbol && !ts.isMethodDeclaration(node)) this.generics.set(symbol, node as GenericDecl);
        else if (ts.isMethodDeclaration(node)) this.checkGenericMethod(node);
        // A function declared in a function: each instantiation its block calls is a local function of its own.
        else if (ts.isFunctionDeclaration(node) && node.name && node.body && ts.isBlock(node.parent)) this.localGenerics.set(this.checker.getSymbolAtLocation(node.name)!, node);
        else this.error(node, "Generic functions are supported at the top level of a module and as function declarations in a block (`function pick<T>(…) {…}`), not as nested arrow functions or function expressions: declare it with `function`.");
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && this.nativeComponent(node)) {
        // Not a variable natively: each use builds the platform's component.
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        if (node.initializer && this.isFunctionNode(node.initializer) && ts.isVariableDeclarationList(node.parent) && node.parent.flags & ts.NodeFlags.Const) {
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (symbol) this.functionSymbols.add(symbol);
        } else {
          this.declareSlot(node.name, node.type);
          if (node.initializer) this.write(node.name, node.initializer);
          // A for-of variable holds the array's elements, and number[] elements are Double.
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (symbol && ts.isForOfStatement(node.parent.parent)) this.writes.push({ slot: symbol, forceDouble: true });
        }
      }
      // JSON.parse may give any number to a field of the type it decodes into.
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "parse" && this.isGlobal(node.expression.expression, "JSON")) {
        const target = this.checker.getContextualType(node);
        if (target) this.jsonDoubles(target, new Set());
      }
      if (ts.isBindingElement(node) && ts.isIdentifier(node.name) && !this.isCreateCss(node.parent.parent)) {
        this.declareSlot(node.name, undefined);
        const symbol = this.checker.getSymbolAtLocation(node.name);
        const source = ts.isObjectBindingPattern(node.parent) ? this.checker.getNonNullableType(this.typeOf(node.parent)).getProperty((node.propertyName ?? node.name).getText().replace(/^["']|["']$/g, "")) : undefined;
        if (symbol) this.writes.push(source ? { slot: symbol, fromSlot: source } : { slot: symbol, forceDouble: true });
        if (node.initializer) this.write(node.name, node.initializer);
        // `const { a, ...rest } = o`: each property of the rest holds o's.
        if (node.dotDotDotToken && ts.isObjectBindingPattern(node.parent)) {
          const from = this.checker.getNonNullableType(this.typeOf(node.parent));
          for (const p of this.typeOf(node.name).getProperties()) {
            const src = from.getProperty(p.name);
            if (src) this.writes.push({ slot: p, fromSlot: src });
          }
        }
      }
      // `(...args: A) => R` with `A extends unknown[]`: an instantiation's tuple would be one array parameter natively.
      if (ts.isParameter(node) && node.dotDotDotToken && node.type && ts.isTypeReferenceNode(node.type) && this.checker.getTypeFromTypeNode(node.type).flags & ts.TypeFlags.TypeParameter) {
        this.error(node, "A rest parameter typed by a type parameter (`...args: A`) is not supported natively: each instantiation would need its own parameter list. Write the parameters out (`(a: number, b: number) => R`), or take an array (`args: T[]`).");
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
        this.declareSlot(node.name, node.type);
        if (node.initializer) this.write(node.name, node.initializer);
        // An untyped callback parameter takes the kind of the parameter it is passed for.
        const fn = node.parent;
        const call = fn.parent;
        const isIndex = (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.parameters.indexOf(node) === 1 && ts.isCallExpression(call) && call.arguments[0] === fn &&
          ts.isPropertyAccessExpression(call.expression) && ["map", "filter", "forEach", "some", "every", "find", "findIndex", "flatMap", "findLast", "findLastIndex"].includes(call.expression.name.text) &&
          this.isArray(this.checker.getNonNullableType(this.typeOf(call.expression.expression))) || this.isTaIndexParam(fn, node) ||
          // `Array.from(xs, (x, i) => …)`, `Array.from({ length: n }, (_, i) => …)`.
          (fn.parameters.indexOf(node) === 1 && ts.isCallExpression(call) && call.arguments[1] === fn && ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "from" && ts.isIdentifier(call.expression.expression) && call.expression.expression.text === "Array");
        // An array callback's index is whole: it keeps the Int declareSlot gave it.
        if (!isIndex && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
          const contextual = this.checker.getContextualType(fn as ts.Expression);
          const ctx = contextual && this.checker.getNonNullableType(contextual).getCallSignatures()[0];
          const source = ctx?.getParameters()[fn.parameters.indexOf(node)];
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (source && symbol) this.writes.push({ slot: symbol, fromSlot: source });
          // A returned closure (`(a) => (b) => …`, `return (x) => …`) is called from places the flows don't follow
          // (`xs.map(curried(2)(5))`): its numbers may be any.
          let up: ts.Node = fn.parent;
          while (ts.isParenthesizedExpression(up)) up = up.parent;
          const returned = ts.isReturnStatement(up) || (ts.isArrowFunction(up) && !up.parameters.some((p) => p.pos <= fn.pos && fn.end <= p.end));
          // (One returned where a function type is declared takes that type's kinds: `source` above.)
          if (symbol && returned && !source) this.writes.push({ slot: symbol, forceDouble: true });
        }
      }
      if (ts.isGetAccessor(node)) this.declareSlot(node.name, node.type);
      // An object literal's getter / setter (rest2): its value, the property and the setter's parameter are one slot.
      if (ts.isAccessor(node) && ts.isObjectLiteralExpression(node.parent)) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        const value = ts.isSetAccessor(node) && node.parameters[0] ? this.checker.getSymbolAtLocation(node.parameters[0].name) : undefined;
        if (symbol) this.link(ts.isGetAccessor(node) ? node : value ?? node, symbol);
      }
      if (ts.isPropertyDeclaration(node) && ts.isClassLike(node.parent)) {
        this.declareSlot(node.name, node.type);
        if (node.initializer) this.write(node.name, node.initializer);
      }
      // A parameter property is a parameter and a field: two symbols, one kind.
      if (ts.isParameter(node) && ts.isIdentifier(node.name) && ts.isConstructorDeclaration(node.parent) && ts.isParameterPropertyDeclaration(node, node.parent)) {
        const [param, field] = this.checker.getSymbolsOfParameterPropertyDeclaration(node, node.name.text);
        if (field && this.isNumber(this.checker.getTypeOfSymbol(field))) this.kinds.set(field, this.forcedKind(node.type) ?? "int");
        if (field) this.declareSized(field, node, node.type);
        if (param) this.declareSized(param, node, node.type);
        if (param && field) this.link(param, field);
      }
      if (this.isFunctionNode(node) || ts.isFunctionDeclaration(node) || ts.isMethodSignature(node) || ts.isGetAccessor(node)) {
        const fn = node as ts.SignatureDeclaration;
        if (ts.getCombinedModifierFlags(fn as ts.Declaration) & ts.ModifierFlags.Async) this.asyncFunctions.add(fn);
        const signature = this.checker.getSignatureFromDeclaration(fn);
        if (signature) {
          let ret = signature.getReturnType();
          if (this.asyncFunctions.has(fn)) ret = this.checker.getAwaitedType(ret) ?? ret;
          // A number a promise holds is a Double (one native `JsPromise<Double>` for every `Promise<number>`).
          if (this.isNumber(ret)) this.kinds.set(fn, this.forcedKind(this.promised(fn.type)) ?? (this.asyncFunctions.has(fn) ? "double" : "int"));
        }
        this.declareSized(fn, fn, fn.type);
        if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) this.writes.push({ slot: node, from: node.body });
      }
      if (ts.isReturnStatement(node) && node.expression) {
        const fn = ts.findAncestor(node.parent, (n) => this.isFunctionNode(n) || ts.isFunctionDeclaration(n) || ts.isGetAccessor(n));
        if (fn) this.writes.push({ slot: fn, from: node.expression });
      }
      // A destructuring assignment, a for-of head without a declaration: each target from its part of the value.
      if (ts.isBinaryExpression(node) && this.destructuring(node)) this.patternWrites(node.left, node.right, this.typeOf(node.right));
      if (ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer)) {
        this.patternWrites(node.initializer, undefined, this.checker.getIndexTypeOfType(this.checker.getNonNullableType(this.typeOf(node.expression)), ts.IndexKind.Number));
      }
      // A counter (`n++`, `n -= 2`): an Int only while a loop around it bounds it (counterBound), else a Double.
      const step = this.counterStep(node);
      if (step) {
        const symbol = this.checker.getSymbolAtLocation(ts.isPropertyAccessExpression(step.target) ? step.target.name : step.target);
        if (symbol) this.writes.push({ slot: symbol, counter: this.counterBound(node, symbol, step.up) ?? null });
      }
      if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind)) {
        const target = ts.isPropertyAccessExpression(node.left) ? node.left.name : node.left;
        const symbol = this.checker.getSymbolAtLocation(target);
        if (symbol) this.writes.push({ slot: symbol, from: node.right, forceDouble: [ts.SyntaxKind.SlashEqualsToken, ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken].includes(node.operatorToken.kind) || (node.operatorToken.kind === ts.SyntaxKind.PercentEqualsToken && this.mayBeZero(node.right)) || this.accumulates(node, symbol) });
      }
      // A number a promise hands its callbacks is a Double (what every `Promise<number>` holds natively).
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["then", "catch"].includes(node.expression.name.text) && this.isLibPromise(this.typeOf(node.expression.expression))) {
        for (const arg of node.arguments) {
          if (!ts.isArrowFunction(arg) && !ts.isFunctionExpression(arg)) continue;
          for (const p of arg.parameters) {
            const symbol = ts.isIdentifier(p.name) ? this.checker.getSymbolAtLocation(p.name) : undefined;
            if (symbol) this.writes.push({ slot: symbol, forceDouble: true });
          }
        }
      }
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const declaration = this.checker.getResolvedSignature(node)?.getDeclaration();
        if (declaration && !this.isApi(declaration) && !declaration.getSourceFile().isDeclarationFile) {
          node.arguments?.forEach((arg, i) => {
            const param = declaration.parameters[i];
            const symbol = param && ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
            if (symbol) this.writes.push({ slot: symbol, from: arg });
          });
        }
      }
      if (this.isFlowSource(node) && !ts.findAncestor(node, ts.isTypeNode)) {
        const target = this.checker.getContextualType(node);
        if (target) this.linkShapes(this.typeOf(node), target);
      }
      if (ts.isObjectLiteralExpression(node)) {
        const ctx = this.checker.getContextualType(node);
        // A function given for a protocol's method is that method: one kind for its parameters and result.
        for (const prop of ctx ? node.properties : []) {
          if (!prop.name || !ts.isIdentifier(prop.name)) continue;
          const fn = ts.isMethodDeclaration(prop) ? prop : ts.isPropertyAssignment(prop) && (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) ? prop.initializer : undefined;
          const decl = this.checker.getNonNullableType(ctx!).getProperty(prop.name.text)?.valueDeclaration;
          if (!fn || !decl || !ts.isMethodSignature(decl)) continue;
          this.link(fn, decl);
          fn.parameters.forEach((param, i) => {
            const mine = this.checker.getSymbolAtLocation(param.name);
            const theirs = decl.parameters[i] && this.checker.getSymbolAtLocation(decl.parameters[i]!.name);
            if (mine && theirs) this.link(mine, theirs);
          });
        }
        if (ctx) {
          for (const prop of node.properties) {
            if (!(ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) || !ts.isIdentifier(prop.name)) continue;
            const target = this.literalMember(ctx, node).getProperty(prop.name.text);
            if (target && this.kinds.has(target)) {
              this.writes.push({ slot: target, from: ts.isPropertyAssignment(prop) ? prop.initializer : prop.name });
            }
          }
          for (const prop of node.properties) {
            if (!ts.isSpreadAssignment(prop)) continue;
            for (const source of this.checker.getNonNullableType(this.typeOf(prop.expression)).getProperties()) {
              const target = ctx.getProperty(source.name);
              if (target && this.kinds.has(target)) this.writes.push({ slot: target, fromSlot: source });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  /**
   * A function passed by reference (`list(items, renderRow)`, `setTimeout(tick, 10)`): its parameters
   * take the kinds of the parameters it is passed for, as a callback written inline does.
   */
  private collectFunctionReferences(sf: ts.SourceFile) {
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && !(ts.isCallExpression(node.parent) && node.parent.expression === node) && !this.isDeclarationName(node)) {
        const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
        const fn = symbol && this.functionSymbols.has(symbol) ? this.functionNodeOf(symbol) : undefined;
        const ctx = fn && this.checker.getContextualType(node)?.getCallSignatures()[0];
        if (fn && ctx && (this.sized.has(fn) || fn.parameters.some((p) => ts.isIdentifier(p.name) && this.sized.has(this.checker.getSymbolAtLocation(p.name)!)))) {
          this.error(node, `${node.text} takes or returns a sized number (Int8…Float32), so it can't be passed as a function value natively: pass a lambda that calls it (\`(x) => ${node.text}(x)\`).`);
        }
        if (fn && ctx) {
          fn.parameters.forEach((param, i) => {
            const slot = ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
            const source = ctx.getParameters()[i];
            if (slot && source) this.writes.push({ slot, fromSlot: source });
          });
        } else if (symbol && !fn && this.checker.getContextualType(node)) {
          // A function-typed parameter, variable or field passed on (`apply(f, 3)`) or stored (`keep = resolve`): it is
          // one native function type on both sides (no adapter), so their parameters share a kind: a Double the
          // callee passes would reach an Int parameter, and a function taking a Double can't be kept as one taking an Int.
          const own = this.checker.getNonNullableType(this.typeOf(node)).getCallSignatures()[0];
          const want = this.checker.getNonNullableType(this.checker.getContextualType(node)!).getCallSignatures()[0];
          if (own && want && own !== want) {
            own.getParameters().forEach((slot, i) => {
              const source = want.getParameters()[i];
              if (source && slot !== source) this.writes.push({ slot, fromSlot: source }, { slot: source, fromSlot: slot });
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  /** Records `const X = native<P>("Name")`; true when the declaration is one. */
  private nativeComponent(node: ts.VariableDeclaration): boolean {
    const init = node.initializer;
    if (!init || !ts.isCallExpression(init) || !ts.isIdentifier(init.expression) || this.apiName(init.expression) !== "native") return false;
    const symbol = this.checker.getSymbolAtLocation(node.name);
    const name = init.arguments[0];
    const props = init.typeArguments?.[0];
    if (!symbol || !name || !ts.isStringLiteral(name) || !props) {
      this.error(init, 'native() takes the props interface and the platform type\'s name: native<MapProps>("MapView").');
      return true;
    }
    if (!ts.isSourceFile(this.topLevelOf(node)) || !(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const)) this.error(node, "Declare a native component as a top-level const.");
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name.text) || RESERVED_TYPES.has(name.text) || IMPLICIT_NAMES.has(name.text)) this.error(name, `"${name.text}" can't name a native type; use an unreserved UpperCamelCase name.`);
    if (ts.isTypeReferenceNode(props)) this.checkPlatformName(this.checker.getSymbolAtLocation(props.typeName), props);
    this.nativeComponents.set(symbol, { name: name.text, props: this.checker.getTypeFromTypeNode(props) });
    return true;
  }

  /** A `declare function`: its numbers must say Int or Double, because the platform code is written against them. */
  private declareNative(node: ts.FunctionDeclaration) {
    const ret = this.promised(node.type);
    if (node.type && ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName) && node.type.typeName.text === "Promise") this.asyncFunctions.add(node);
    const check = (typeNode: ts.TypeNode | undefined, at: ts.Node) => {
      if (!typeNode) return void this.error(at, "A declared native function needs every type written out.");
      if (this.isNumber(this.checker.getTypeFromTypeNode(typeNode)) && !this.forcedKind(typeNode)) {
        this.error(typeNode, "Annotate numbers of a native function as Int or Double: the platform code is written against that type.");
      }
    };
    for (const param of node.parameters) check(param.type, param);
    check(ret, node);
    if (node.name) this.checkPlatformName(this.checker.getSymbolAtLocation(node.name), node.name);
    const names = (n: ts.Node): void => {
      if (ts.isTypeReferenceNode(n)) this.checkPlatformName(this.checker.getSymbolAtLocation(n.typeName), n);
      ts.forEachChild(n, names);
    };
    for (const param of node.parameters) if (param.type) names(param.type);
    if (node.type) names(node.type);
  }

  /** `Promise<T>` → `T`. */
  private promised(typeNode: ts.TypeNode | undefined): ts.TypeNode | undefined {
    if (typeNode && ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName) && typeNode.typeName.text === "Promise") return typeNode.typeArguments?.[0];
    return typeNode;
  }

  private isDeclarationName(node: ts.Identifier): boolean {
    return "name" in node.parent && (node.parent as ts.NamedDeclaration).name === node && !(ts.isPropertyAccessExpression(node.parent) && this.unNamespace(node.parent) === node);
  }

  /** The function a function symbol names: `function f() {}` or `const f = () => …`. */
  private functionNodeOf(symbol: ts.Symbol): ts.SignatureDeclaration | undefined {
    const decl = symbol.valueDeclaration;
    if (decl && ts.isFunctionDeclaration(decl)) return decl;
    if (decl && ts.isVariableDeclaration(decl) && decl.initializer && this.isFunctionNode(decl.initializer)) return decl.initializer;
    return undefined;
  }

  /** The variable or property an expression reads (its base, for `xs[i]`); undefined for temporaries. */
  private storageSymbol(node: ts.Node): ts.Symbol | undefined {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAssertionExpression(node)) node = node.expression;
    if (ts.isElementAccessExpression(node)) return this.storageSymbol(node.expression);
    if (ts.isPropertyAccessExpression(node)) return this.checker.getSymbolAtLocation(node.name);
    if (ts.isIdentifier(node)) {
      if (ts.isShorthandPropertyAssignment(node.parent)) return this.checker.getShorthandAssignmentValueSymbol(node.parent);
      if ((ts.isPropertyAssignment(node.parent) || ts.isShorthandPropertyAssignment(node.parent)) && node.parent.name === node && ts.isObjectLiteralExpression(node.parent.parent)) {
        return this.checker.getContextualType(node.parent.parent)?.getProperty(node.text);
      }
      return this.checker.getSymbolAtLocation(node);
    }
    return undefined;
  }

  /** The node's container: a source file for top-level declarations. */
  private topLevelOf(node: ts.Node): ts.Node {
    let n = node.parent;
    while (n && (ts.isVariableDeclarationList(n) || ts.isVariableStatement(n))) n = n.parent;
    return n;
  }

  /** Constructs with no native equivalent. */
  private reject(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) this.error(node, "`any` cannot be compiled to a native type (natively every value has one type, known when it is compiled): give the value a real type, or `unknown` and test it with typeof.");
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword && ts.isPrivateIdentifier(node.left)) this.error(node, "Unsupported: `#x in obj` (a native object's class is known statically).");
    else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) this.checkClass(node);
    else if (ts.isEnumDeclaration(node)) this.checkEnum(node);
    else if (ts.isVariableDeclarationList(node) && !(node.flags & ts.NodeFlags.BlockScoped)) this.checkVar(node);
    else if (ts.isModuleDeclaration(node)) this.error(node, "Namespaces are not supported natively (a namespace is an object built at run time): move its members to a module and `import * as Name from \"./name.ts\"`.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword && this.isStaticContext(node)) this.error(node, "`this` in a static member is not supported; name the class.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword && !this.inClass(node) && !this.literalThis(node)) this.error(node, "`this` is supported in classes and in object-literal methods (`greet() { … }`) only; write a method there.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword && this.literalThis(node) && this.keepsLiteralThis(node)) {
      this.error(node, "A function in an object-literal method keeps `this`: stored in the object, it would be a reference cycle Swift and Rust can't free. Read what it needs into a local first, or use a class.");
    }
    else if (ts.isDeleteExpression(node) && !this.isMapEntry(node.expression) && !this.deletableField(node)) this.error(node, "`delete` is supported on Record<string, T> entries and on optional properties (as a statement); use a nullable property.");
    else if (ts.isIdentifier(node) && node.text === "eval") this.error(node, "`eval` cannot be compiled ahead of time.");
    // An overloaded function as a value: natively it is its implementation, whose parameters are the overloads' union.
    else if ((ts.isIdentifier(node) || (ts.isPropertyAccessExpression(node) && !ts.isCallExpression(node.parent))) && !(ts.isCallExpression(node.parent) && node.parent.expression === node) && this.isOverloadedValue(node)) {
      this.error(node, `Unsupported: the overloaded function ${node.getText()} used as a value natively (one native function takes the union of the overloads' parameters); wrap the overload you need: \`(x: T) => ${node.getText()}(x)\`.`);
    }
    else if (ts.isPropertyAccessExpression(node) && (node.name.text === "prototype" || node.name.text === "__proto__")) {
      this.error(node, "Prototype access is not supported natively (a native class's members are fixed when it is compiled): add a method to the class, or write a function that takes the object.");
    } else if (this.isGenFn(node)) this.checkGenerator(node);
    else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent) && !this.isCreateCss(node.parent.parent)) {
      if (!node.dotDotDotToken && node.propertyName &&!ts.isIdentifier(node.propertyName) && !ts.isStringLiteral(node.propertyName)) this.error(node, "Unsupported: a computed key in destructuring (`const { [k]: v } = o`), since a native object's fields have fixed names: name the property, or read `o[k]` from a Record<string, T>.");
    }
  }

  /**
   * `var`: one binding per function call, visible in the whole function. Declared once in the function's own
   * block, it is a `let` there. Otherwise (in a block or a loop, or declared twice) it is hoisted: declared at the
   * top of the function with its type's zero value, and each declaration is an assignment. TypeScript rejects a
   * plain read before an assignment; a closure (or nested class) reading it is checked here, as TypeScript
   * assumes it assigned there and JavaScript would read `undefined`.
   */
  private checkVar(list: ts.VariableDeclarationList) {
    const holder = list.parent;
    // `for (var x of xs)` over an array (rest2): x is hoisted, and the loop assigns it (after the loop it keeps the last element).
    const varOf = ts.isForOfStatement(holder) && list.declarations.length === 1 && ts.isIdentifier(list.declarations[0]!.name) && this.isArray(this.checker.getNonNullableType(this.typeOf(holder.expression))) && !this.isTypedArray(this.checker.getNonNullableType(this.typeOf(holder.expression)));
    if ((ts.isForOfStatement(holder) && !varOf) || ts.isForInStatement(holder)) {
      return void this.error(list, "Unsupported: `var` in a for-in head, or in a for-of head over anything but an array, or destructured there (after the loop JavaScript keeps the last element, or the old value when there was none); use `const` and copy what the loop finds to a variable declared before it.");
    }
    const scope = ts.findAncestor(list.parent, (n) => ts.isFunctionLike(n) || ts.isSourceFile(n) || ts.isClassStaticBlockDeclaration(n))!;
    for (const decl of list.declarations) {
      for (const id of this.bindingNames(decl.name)) {
        const symbol = this.checker.getSymbolAtLocation(id);
        if (!symbol || this.checkedVars.has(symbol) || this.isNullLocal(symbol)) continue;
        this.checkedVars.add(symbol);
        if (symbol.declarations?.some(ts.isParameter)) {
          this.error(id, `Unsupported: a \`var\` redeclaring the parameter ${id.text}; assign the parameter.`);
          continue;
        }
        const decls = (symbol.declarations ?? []).filter((d) => ts.isVariableDeclaration(d) || ts.isBindingElement(d));
        const only = decls.length === 1 && ts.isVariableDeclaration(decls[0]!) ? decls[0] : undefined;
        const body = ts.isSourceFile(scope) ? scope : (scope as ts.FunctionLikeDeclaration).body;
        const inPlace = !!only && ts.isVariableStatement(only.parent.parent) && only.parent.parent.parent === body;
        if (!inPlace) {
          // A module-level one (rest2) is a global starting at its zero value; each declaration assigns it.
          if (!body || (!ts.isBlock(body) && !ts.isSourceFile(body))) {
            this.error(id, `Unsupported: the module-level \`var\` ${id.text} declared in a block or more than once; declare it once at the top level (or use \`let\`).`);
            continue;
          }
          if (decls.some((d) => !ts.isVariableDeclaration(d) || !ts.isIdentifier(d.name))) {
            this.error(id, `Unsupported: the destructured \`var\` ${id.text} declared in a block or more than once; use \`let\` before the block.`);
            continue;
          }
          const type = this.checker.getTypeOfSymbol(symbol);
          if (!(this.isNumber(type) || this.isString(type) || this.isBoolean(type) || this.isNullable(type) || this.isArray(type) || (type.getStringIndexType() && !type.getProperties().length))) {
            this.error(id, `Unsupported: the \`var\` ${id.text} declared in a block or more than once has a type without a zero value to start with natively; declare it with \`let\` before the block.`);
            continue;
          }
          this.hoisted.add(symbol);
          this.hoistedAt.set(body, [...(this.hoistedAt.get(body) ?? []), symbol]);
        }
        // Reads in closures and nested classes: only where a declaration with a value has surely run.
        const nullable = this.isNullable(this.checker.getTypeOfSymbol(symbol));
        const visit = (n: ts.Node, nested: boolean): void => {
          if (ts.isIdentifier(n) && n !== id && nested && this.checker.getSymbolAtLocation(n) === symbol) {
            const write = ts.isBinaryExpression(n.parent) && n.parent.left === n && n.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken;
            if (this.hoisted.has(symbol) && ts.findAncestor(n, (a) => a !== scope && ts.isClassLike(a) && a.pos > scope.pos)) {
              this.error(n, `Unsupported: a nested class using the \`var\` ${n.text} declared in a block; declare it with \`let\` before the block.`);
            } else if (!write && !nullable && !decls.some((d) => this.assignedBefore(d as ts.VariableDeclaration, n))) {
              this.error(n, `A closure reads the \`var\` ${n.text} where it may not be assigned yet (JavaScript would read undefined): declare it with a value before the closure, in a block around it.`);
            }
          }
          ts.forEachChild(n, (c) => visit(c, nested || ts.isFunctionLike(n) || ts.isClassLike(n)));
        };
        if (body) ts.forEachChild(body, (c) => visit(c, false));
      }
    }
  }

  /** Whether a `var` declaration with a value has run before `use`: it comes first, in a block around it. */
  private assignedBefore(decl: ts.VariableDeclaration, use: ts.Node): boolean {
    const container = decl.parent.parent.parent;
    // `for (var x of xs) { … }`: assigned in the body (rest2).
    if (ts.isForOfStatement(decl.parent.parent)) return use.pos >= decl.parent.parent.statement.pos && use.end <= decl.parent.parent.statement.end;
    return !!decl.initializer && use.pos >= decl.end && use.pos >= container.pos && use.end <= container.end;
  }

  /** The hoisted `var`s of a function body: declared first, with their type's zero value. */
  private hoistedLets(body: ts.Node): Stmt[] {
    return (this.hoistedAt.get(body) ?? []).map((symbol) => {
      const ty = this.tyOfSymbol(symbol, symbol.valueDeclaration!);
      return { s: "let", name: symbol.name, ty, init: this.zeroValue(ty), mutable: true };
    });
  }

  /** Exactly `null` or `undefined` (not a union with them). */
  private isNullType(type: ts.Type): boolean {
    return !!(type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined));
  }

  /** A variable typed exactly `null` / `undefined`: it has no native variable, and each read is nil. */
  private isNullLocal(symbol: ts.Symbol | undefined): boolean {
    const decl = symbol?.valueDeclaration;
    return !!decl && ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) && this.isNullType(this.checker.getTypeOfSymbol(symbol!));
  }

  private zeroValue(ty: Ty): Expr {
    switch (ty.k) {
      case "int":
        return { e: "int", v: "0" };
      case "double":
        return { e: "double", v: "0.0" };
      case "string":
        return { e: "str", v: "" };
      case "bool":
        return { e: "bool", v: false };
      case "array":
        return { e: "arr", of: ty.of, items: [] };
      case "map":
        return { e: "dict", of: ty.of, entries: [] };
      case "jsmap":
      case "jsset":
        return { e: "op", op: "mc.new", args: [], ty };
      default:
        return { e: "nil" };
    }
  }

  // -------------------------------------------------------------------------
  // Object.keys / values / entries and for…in, in JavaScript's key order
  // -------------------------------------------------------------------------

  /** `Object.keys(x)`, `Object.values(x)`, `Object.entries(x)`: which one. */
  private objectCall(node: ts.Expression): "keys" | "values" | "entries" | undefined {
    if (!ts.isCallExpression(node) || node.arguments.length !== 1 || !ts.isPropertyAccessExpression(node.expression)) return undefined;
    const { expression: obj, name } = node.expression;
    if (!ts.isIdentifier(obj) || obj.text !== "Object" || !this.checker.getSymbolAtLocation(obj)?.declarations?.[0]?.getSourceFile().isDeclarationFile) return undefined;
    return name.text === "keys" || name.text === "values" || name.text === "entries" ? name.text : undefined;
  }

  /**
   * The keys (or values) JavaScript lists for `node`. A map's, in its order: the runtimes' maps keep it. An object's
   * fields: an object of an interface lists them in the order it was made, so each object literal of an interface
   * whose keys are listed must give every field, in the interface's order (checkKeyOrders); an object of a class
   * (with no subclasses) lists its parameter properties, then its fields, base class first, as it defines them.
   */
  private enumerate(node: ts.Expression, what: "keys" | "values", ctx: Ctx): Expr {
    const type = this.typeOf(node);
    if (this.isNullable(type)) return this.error(node, "This value may be null: narrow it before listing its keys.");
    if (this.isArray(type) || this.isString(type) || this.isMixedTuple(type)) return this.error(node, "Unsupported: the keys of an array or a string (its indices, as text); loop over the indices.");
    if (type.getStringIndexType() && !type.getProperties().length) {
      this.enumeratedMaps.push({ ty: this.tyOfExpr(node), node });
      return { e: "op", op: what === "keys" ? "map.keys" : "map.values", args: [this.expr(node, ctx)] };
    }
    const keys = this.objectKeys(type, node);
    if (!keys) return { e: "nil" };
    if (what === "keys") return { e: "arr", of: T.string, items: keys.map((v): Expr => ({ e: "str", v })) };
    if (!this.isPure(node)) return this.error(node, "Put the object in a variable first (its fields are read one by one).");
    const obj = this.expr(node, ctx);
    const tys = keys.map((k) => this.tyOfSymbol(type.getProperty(k)!, node));
    const numbers = tys.length > 0 && tys.every((t) => t.k === "int" || t.k === "double");
    // Array elements that are numbers are Doubles.
    const of = numbers ? T.double : (tys[0] ?? T.string);
    if (!numbers && tys.some((t) => JSON.stringify(t) !== JSON.stringify(of))) {
      return this.error(node, "Unsupported: Object.values of an object whose fields have different types (a native array has one element type).");
    }
    return { e: "arr", of, items: keys.map((name, i) => this.convert({ e: "prop", obj, name }, tys[i]!, of)) };
  }

  /** The own enumerable keys of an object of the app's interfaces or classes, or undefined (reported). */
  private objectKeys(type: ts.Type, at: ts.Node): string[] | undefined {
    const ty = this.ty(type, at);
    if (ty.k !== "class") return void this.error(at, `Unsupported: the keys of a ${this.checker.typeToString(type)}.`);
    if (this.allClasses().some((c) => c.name === ty.name)) {
      // An anonymous shape's: its class's fields (the order its first type gave; checkKeyOrders checks each literal).
      const shape = this.shapeClasses.get(ty.name);
      const keys = shape ? shape.fields.map((f) => f.name) : this.checker.getPropertiesOfType(type).filter((p) => p.valueDeclaration && ts.isPropertySignature(p.valueDeclaration)).map((p) => p.name);
      if (!this.enumeratedClasses.has(ty.name)) this.enumeratedClasses.set(ty.name, { keys, node: at });
      return keys;
    }
    const symbol = type.getSymbol();
    const decl = symbol && this.objectClasses.get(symbol);
    if (!decl) return void this.error(at, `Unsupported: the keys of an object of ${ty.name}, an interface classes implement (they depend on the object's class).`);
    if ([...this.objectClasses.values()].some((c) => this.baseOf(c) === decl)) return void this.error(at, `Unsupported: the keys of an object of ${ty.name}, which has subclasses (they depend on the object's class).`);
    const chain: ts.ClassLikeDeclaration[] = [];
    for (let c: ts.ClassLikeDeclaration | undefined = decl; c; c = this.baseOf(c)) chain.unshift(c);
    return chain.flatMap((c) => {
      const ctor = c.members.find((m): m is ts.ConstructorDeclaration => ts.isConstructorDeclaration(m) && !!m.body);
      const params = (ctor?.parameters ?? []).filter((p) => ts.isParameterPropertyDeclaration(p, ctor!) && ts.isIdentifier(p.name)).map((p) => (p.name as ts.Identifier).text);
      const own = c.members.filter((m): m is ts.PropertyDeclaration => ts.isPropertyDeclaration(m) && (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)));
      const fields = own.filter((m) => !(ts.getCombinedModifierFlags(m) & (ts.ModifierFlags.Static | ts.ModifierFlags.Ambient | ts.ModifierFlags.Abstract)));
      return [...params, ...fields.map((m) => (m.name as ts.Identifier).text)];
    });
  }

  private baseOf(c: ts.ClassLikeDeclaration): ts.ClassLikeDeclaration | undefined {
    const base = this.heritage(c, ts.SyntaxKind.ExtendsKeyword)[0];
    const symbol = base && this.classRef(base.expression);
    return symbol && this.objectClasses.get(symbol);
  }

  /** Whether TypeScript types what Object.values / entries lists `any` (for an object without an index signature). */
  private listsAny(call: ts.Expression): boolean {
    const item = this.checker.getIndexTypeOfType(this.typeOf(call), ts.IndexKind.Number);
    const value = item && this.checker.isTupleType(item) ? this.checker.getTypeArguments(item as ts.TypeReference)[1] : item;
    return !!value && !!(value.flags & ts.TypeFlags.Any);
  }

  /** `Object.entries(x)` as a value: `[key, value]` pairs, one native type only when the values are strings. */
  private entries(node: ts.Expression, at: ts.Node, ctx: Ctx): Expr {
    if (!this.isPure(node)) return this.error(node, "Put the object in a variable first.");
    const keys = this.enumerate(node, "keys", ctx);
    const type = this.tyOfExpr(node);
    if (type.k === "map" && type.of.k === "string") {
      // Each key with its value, read at once (a snapshot, as Object.entries takes).
      const key = `key__${++this.temps}`;
      const value: Expr = { e: "unwrap", x: { e: "op", op: "map.get", args: [this.expr(node, ctx), { e: "id", name: key }] } };
      return { e: "op", op: "arr.map", args: [keys, { e: "lambda", params: [{ name: key, ty: T.string }], ret: T.array(T.string), body: { e: "arr", of: T.string, items: [{ e: "id", name: key }, value] } }] };
    }
    // `Object.entries(rec)` of other values (rest): an array of [key, value] tuples (a record each natively).
    const pairs = type.k === "map" && ts.isExpression(at) ? this.tyOfExpr(at) : undefined;
    const tuple = pairs?.k === "array" && pairs.of.k === "class" ? this.shapeClasses.get(pairs.of.name) : undefined;
    if (type.k === "map" && tuple?.fields.length === 2 && tuple.fields[0]!.ty.k === "string" && this.sameTy(tuple.fields[1]!.ty, type.of)) {
      const key = `key__${++this.temps}`;
      const value: Expr = { e: "unwrap", x: { e: "op", op: "map.get", args: [this.expr(node, ctx), { e: "id", name: key }] } };
      return { e: "op", op: "arr.map", args: [keys, { e: "lambda", params: [{ name: key, ty: T.string }], ret: pairs!.k === "array" ? pairs!.of : T.void, body: { e: "new", cls: tuple.name, args: [["_0", { e: "id", name: key }], ["_1", value]] } }] };
    }
    const values = type.k === "map" ? undefined : this.enumerate(node, "values", ctx);
    if (values?.e !== "arr" || values.of.k !== "string" || keys.e !== "arr") {
      return this.error(at, "Unsupported: Object.entries outside `for (const [key, value] of Object.entries(x))` when the values aren't strings (a [key, value] pair mixes types natively).");
    }
    return { e: "arr", of: T.array(T.string), items: keys.items.map((k, i): Expr => ({ e: "arr", of: T.string, items: [k, values.items[i]!] })) };
  }

  /** `for (const [k, v] of Object.entries(x))`: over snapshots of the keys and the values, as Object.entries takes them. */
  private entriesLoop(node: ts.ForOfStatement, ctx: Ctx): Stmt[] | undefined {
    if (this.objectCall(node.expression) !== "entries") return undefined;
    if (this.listsAny(node.expression)) return [this.unsupported(node.expression, "Object.entries of an interface or a class: TypeScript types the values `any` (no index signature); declare the type with `type X = { … }`, or loop over the keys")];
    const decl = node.initializer;
    const pattern = ts.isVariableDeclarationList(decl) ? decl.declarations[0]!.name : undefined;
    if (!pattern || !ts.isArrayBindingPattern(pattern) || pattern.elements.length > 2 || pattern.elements.some((el) => !ts.isOmittedExpression(el) && (!ts.isIdentifier(el.name) || el.initializer || el.dotDotDotToken))) {
      return [this.unsupported(node.initializer, "this loop over Object.entries; write `for (const [key, value] of Object.entries(x))`")];
    }
    const source = (node.expression as ts.CallExpression).arguments[0]!;
    const [k, v] = pattern.elements.map((el) => (ts.isOmittedExpression(el) ? undefined : (el.name as ts.Identifier)));
    const mutable = !((decl as ts.VariableDeclarationList).flags & ts.NodeFlags.Const);
    const n = ++this.temps;
    const [keys, values, i] = [`keys__${n}`, `values__${n}`, `i__${n}`];
    const at = (arr: string): Expr => ({ e: "index", obj: { e: "id", name: arr }, index: { e: "id", name: i } });
    const lets: Stmt[] = [{ s: "let", name: keys, ty: T.array(T.string), init: this.enumerate(source, "keys", ctx), mutable: false }];
    const binds: Stmt[] = [];
    if (k) binds.push({ s: "let", name: k.text, ty: T.string, init: at(keys), mutable });
    if (v) {
      const init = this.enumerate(source, "values", ctx);
      const sourceTy = this.tyOfExpr(source);
      const of = init.e === "arr" ? init.of : sourceTy.k === "map" ? sourceTy.of : T.string;
      const ty = this.tyOfSymbol(this.checker.getSymbolAtLocation(v)!, v);
      lets.push({ s: "let", name: values, ty: T.array(of), init, mutable: false });
      binds.push({ s: "let", name: v.text, ty, init: this.convert(at(values), of, ty), mutable });
    }
    const length: Expr = { e: "op", op: "arr.length", args: [{ e: "id", name: keys }] };
    const loop: Stmt = { s: "forRange", name: i, from: { e: "int", v: "0" }, to: length, inclusive: false, body: [...binds, ...this.block(node.statement, { ...ctx, continueWith: undefined })], ...this.loopLabel(node) };
    return [{ s: "if", c: { e: "bool", v: true }, then: [...lets, loop] }];
  }

  /** `for (const k in x)`: over a snapshot of the keys; a key deleted before its turn is skipped, as in JavaScript. */
  private forIn(node: ts.ForInStatement, ctx: Ctx): Stmt[] {
    const decl = node.initializer;
    const binding = ts.isVariableDeclarationList(decl) ? decl.declarations[0]!.name : undefined;
    if (!binding || !ts.isIdentifier(binding)) return [this.unsupported(node.initializer, "for-in over an existing variable or a pattern; declare the key: `for (const key in x)`")];
    if (this.isReassigned(binding, node.statement)) return [this.unsupported(binding, "reassigning the key of a for-in loop; copy it to a variable")];
    const keys = this.enumerate(node.expression, "keys", ctx);
    const body = this.block(node.statement, { ...ctx, continueWith: undefined });
    if (keys.e !== "op") return [{ s: "forOf", name: binding.text, of: keys, body, ...this.loopLabel(node) }];
    if (!this.isPure(node.expression)) return [this.unsupported(node.expression, "for-in over a computed map; put it in a variable")];
    const has: Expr = { e: "op", op: "map.has", args: [this.expr(node.expression, ctx), { e: "id", name: binding.text }] };
    return [{ s: "forOf", name: binding.text, of: keys, body: [{ s: "if", c: { e: "not", x: has }, then: [{ s: "continue" }] }, ...body], ...this.loopLabel(node) }];
  }

  /**
   * Object.keys / for…in list an interface object's keys in the order it was made: every object literal of an
   * interface whose keys are listed gives every field in the order listed (JSON.stringify lists them too). An interface
   * decoded from JSON can't be listed: JavaScript keeps the JSON text's key order, a native object its class's. A map
   * decoded from JSON can (every runtime's parser keeps the text's order, and maps apply JavaScript's).
   */
  private checkKeyOrders() {
    const where = (node: ts.Node) => `${displayPath(node.getSourceFile().fileName)}:${node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    for (const { cls, keys, node } of this.literalKeys) {
      const listed = this.enumeratedClasses.get(cls);
      if (!listed || keys?.join() === listed.keys.join()) continue;
      this.error(node, keys
        ? `JavaScript lists an object's keys in the order it was made, and ${cls}'s are listed (${where(listed.node)}): give every property, in this order: ${listed.keys.join(", ")}.`
        : `A spread of another type into a ${cls}, whose keys are listed (${where(listed.node)}): JavaScript would list them in the spread object's order. Write the properties.`);
    }
    const decoded = new Set<string>();
    const reach = (t: Ty): void => {
      if (decoded.has(mangle(t))) return;
      decoded.add(mangle(t));
      if (t.k === "array" || t.k === "map" || t.k === "optional") reach(t.of);
      if (t.k === "class") this.allClasses().find((c) => c.name === t.name)?.fields.forEach((f) => reach(f.ty));
    };
    this.decoded.forEach(reach);
    for (const { cls, node } of this.deletedFields) {
      const listed = this.enumeratedClasses.get(cls);
      if (listed) this.error(node, `\`delete\` of a property of a ${cls}, whose keys are listed (${where(listed.node)}): JavaScript would no longer list the key, natively it stays. Set it to undefined instead.`);
    }
    for (const [cls, { node }] of this.enumeratedClasses) {
      if (decoded.has(cls)) this.error(node, `Unsupported: listing the keys (or JSON.stringify) of a ${cls}, which JSON decodes: JavaScript keeps the JSON text's key order, a native object its interface's. Copy it into an object literal, or decode a map (Record<string, T>).`);
    }
  }

  // -------------------------------------------------------------------------
  // Classes
  // -------------------------------------------------------------------------

  /** The app's classes, and the interfaces they implement (with the interfaces those extend): protocols. */
  private collectClasses() {
    const pending: ts.InterfaceDeclaration[] = [];
    const addProtocol = (expr: ts.Expression) => {
      const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(expr));
      const decl = symbol?.declarations?.find(ts.isInterfaceDeclaration);
      if (!symbol || !decl || decl.getSourceFile().isDeclarationFile || this.protocols.has(symbol)) return;
      this.protocols.set(symbol, decl);
      pending.push(decl);
    };
    const taken = new Set<string>(this.topNames.values());
    // A nested class keeps its name unless another class (or top-level name) has it (two functions may each declare a `Row`).
    const unique = (name: string) => {
      let native = RESERVED_TYPES.has(name) || IMPLICIT_NAMES.has(name) ? `${name}__` : name;
      for (let n = 2; taken.has(native); n++) native = `${name}__${n}`;
      return native;
    };
    const add = (node: ts.ClassLikeDeclaration) => {
      const symbol = this.classSymbol(node);
      if (!symbol) return;
      this.objectClasses.set(symbol, node);
      const nested = ts.isClassDeclaration(node) ? !ts.isSourceFile(node.parent) : !this.isTopLevelClass(node);
      if (ts.isClassExpression(node) && !nested) this.classNames.set(symbol, this.className(this.checker.getSymbolAtLocation((node.parent as ts.VariableDeclaration).name)!));
      else if (nested) this.classNames.set(symbol, unique(node.name?.text ?? "Class"));
      taken.add(this.className(symbol));
      for (const clause of node.heritageClauses ?? []) {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) clause.types.forEach((t) => addProtocol(t.expression));
      }
    };
    for (const sf of this.files) for (const statement of sf.statements) if (ts.isClassDeclaration(statement) && statement.name) add(statement);
    for (const sf of this.files) {
      const visit = (node: ts.Node): void => {
        if (ts.isClassExpression(node) && this.isTopLevelClass(node)) add(node);
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    for (const sf of this.files) {
      const visit = (node: ts.Node): void => {
        if ((ts.isClassExpression(node) && !this.isTopLevelClass(node)) || (ts.isClassDeclaration(node) && node.name && !ts.isSourceFile(node.parent))) add(node);
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    // An interface with methods is a protocol too: its object literals are a class keeping the functions they give.
    for (const sf of this.files) {
      for (const statement of sf.statements) {
        const symbol = ts.isInterfaceDeclaration(statement) ? this.checker.getSymbolAtLocation(statement.name) : undefined;
        const methods = symbol && this.checker.getPropertiesOfType(this.checker.getDeclaredTypeOfSymbol(symbol)).some((p) => p.valueDeclaration && ts.isMethodSignature(p.valueDeclaration));
        if (methods) addProtocol((statement as ts.InterfaceDeclaration).name);
      }
    }
    for (let decl = pending.pop(); decl; decl = pending.pop()) {
      for (const clause of decl.heritageClauses ?? []) clause.types.forEach((t) => addProtocol(t.expression));
    }
  }

  /** A class's symbol (an anonymous class expression has no name to ask). */
  private classSymbol(node: ts.ClassLikeDeclaration): ts.Symbol | undefined {
    return (node.name && this.checker.getSymbolAtLocation(node.name)) || this.checker.getTypeAtLocation(node).getSymbol();
  }

  /**
   * The native name of a class (a class expression's given one), or of any top-level declaration (interface, alias,
   * function, variable): its own, or `name__module` when another module's top level declares the same name (see
   * nameDeclarations). An imported alias names what it imports.
   */
  private className(symbol: ts.Symbol): string {
    const resolved = this.resolveAlias(symbol)!;
    const own = this.classNames.get(resolved) ?? this.topNames.get(resolved);
    if (own) return own;
    // A transient copy (a mapped type's, a property read's) names its declaration's.
    const root = resolved.flags & ts.SymbolFlags.Transient ? this.checker.getRootSymbols(resolved)[0] : undefined;
    return (root && root !== resolved && (this.classNames.get(root) ?? this.topNames.get(root))) || resolved.name;
  }

  /** An identifier's native name: a top-level declaration's (through imports, `ns.name` included), or its own. */
  private idName(node: ts.Identifier): string {
    const resolved = this.resolveAlias(this.valueSymbol(node));
    return (resolved && this.topNames.get(resolved)) ?? node.text;
  }

  /**
   * TypeScript scopes names per module; natively every module's top level is one namespace. Each top-level declaration
   * keeps its name unless another module declares the same name at its top level: then each of them is
   * `name__module` (the file's name), so two modules' `interface Point` or `function more` are distinct native ones.
   */
  private nameDeclarations() {
    const declared = new Map<ts.Symbol, ts.Identifier>();
    const add = (name: ts.BindingName) => {
      if (!ts.isIdentifier(name)) return name.elements.forEach((el) => ts.isBindingElement(el) && add(el.name));
      const symbol = this.checker.getSymbolAtLocation(name);
      if (symbol && !declared.has(symbol)) declared.set(symbol, name);
    };
    for (const sf of this.files) {
      for (const st of sf.statements) {
        if (ts.isVariableStatement(st)) st.declarationList.declarations.forEach((d) => add(d.name));
        else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) add(st.name);
      }
    }
    const byName = new Map<string, ts.Symbol[]>();
    for (const [symbol, name] of declared) byName.set(name.text, [...(byName.get(name.text) ?? []), symbol]);
    const taken = new Set(byName.keys());
    for (const [name, symbols] of byName) {
      for (const symbol of symbols) {
        if (symbols.length === 1) {
          // A name the runtimes or platforms use (`Task`, `Result`, `Node`…) is `name__` natively (rest); a `declare`d one
          // keeps its name (platform code calls it) and stays rejected.
          const ambient = ts.getCombinedModifierFlags(declared.get(symbol)!.parent as ts.Declaration) & ts.ModifierFlags.Ambient;
          this.topNames.set(symbol, (RESERVED_TYPES.has(name) || IMPLICIT_NAMES.has(name)) && !ambient && !taken.has(`${name}__`) ? `${name}__` : name);
          continue;
        }
        const module = path.basename(declared.get(symbol)!.getSourceFile().fileName).replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9]/g, "_");
        let native = `${name}__${module}`;
        for (let n = 2; taken.has(native); n++) native = `${name}__${module}__${n}`;
        taken.add(native);
        this.topNames.set(symbol, native);
      }
    }
  }

  /**
   * Platform code (native/<target>/) names a `declare function` and the interfaces its signature and native components'
   * props use: those keep their TypeScript names, so one another module also declares can't be told apart.
   */
  private checkPlatformName(symbol: ts.Symbol | undefined, at: ts.Node) {
    const resolved = this.resolveAlias(symbol);
    if (!resolved || this.topNames.get(resolved) === resolved.name || !this.topNames.has(resolved)) return;
    this.error(at, `"${resolved.name}" is declared at the top level of another module too, and the platform code (native/) refers to it by this name: rename one of them.`);
  }

  /** `const X = class …` at the top level of a module: the class `X`. */
  private isTopLevelClass(node: ts.ClassExpression): boolean {
    const decl = node.parent;
    return ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) && !!(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const) && ts.isSourceFile(this.topLevelOf(decl));
  }

  /** The app's class an expression names (`C`, a `const` holding a class expression, `(class {…})`), by its symbol. */
  private classRef(node: ts.Expression): ts.Symbol | undefined {
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
    if (symbol && this.objectClasses.has(symbol)) return symbol;
    // Through its type, `typeof C` (an instance's type names the class too, but it can't be constructed).
    const type = this.checker.getTypeAtLocation(node);
    const viaType = type.getConstructSignatures().length ? type.getSymbol() : undefined;
    return viaType && this.objectClasses.has(viaType) ? viaType : undefined;
  }

  /** The index of a constructor body's `super(…)` statement, -1 when it isn't a statement of the body. */
  private superIndex(body: ts.Block): number {
    return body.statements.findIndex((s) => ts.isExpressionStatement(s) && ts.isCallExpression(s.expression) && s.expression.expression.kind === ts.SyntaxKind.SuperKeyword);
  }

  /**
   * Statements before `super(…)` (TypeScript keeps `this` out of them): natively they run inside its first argument
   * (Kotlin evaluates a base constructor's arguments before anything else), so `super` needs one, their variables may
   * be read only there (`const m = …; super(m)`), and they can't reassign a parameter or declare a function.
   */
  private checkPreSuper(body: ts.Block) {
    const at = this.superIndex(body);
    if (at <= 0) return;
    const call = (body.statements[at] as ts.ExpressionStatement).expression as ts.CallExpression;
    if (!call.arguments.length) return void this.error(body.statements[0]!, "Unsupported: statements before a `super()` without arguments (natively they run inside its first argument); move them after it, or into a function the base constructor's argument calls.");
    const locals = new Set<ts.Symbol>();
    const params = new Set((body.parent as ts.ConstructorDeclaration).parameters.map((p) => this.checker.getSymbolAtLocation(p.name)));
    for (const s of body.statements.slice(0, at)) {
      if (ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) this.error(s, "Unsupported: a function or class declared before `super(…)`; declare it outside the constructor.");
      if (ts.isVariableStatement(s)) for (const d of s.declarationList.declarations) for (const n of this.bindingNames(d.name)) locals.add(this.checker.getSymbolAtLocation(n)!);
      const visit = (n: ts.Node): void => {
        if (ts.isReturnStatement(n)) this.error(n, "Unsupported: `return` before `super(…)`.");
        if (ts.isBinaryExpression(n) && this.isAssignment(n.operatorToken.kind) && ts.isIdentifier(n.left) && params.has(this.checker.getSymbolAtLocation(n.left))) this.error(n, "Unsupported: reassigning a parameter before `super(…)`; use a local.");
        if (!ts.isFunctionLike(n)) ts.forEachChild(n, visit);
      };
      visit(s);
    }
    const later = [...call.arguments.slice(1), ...body.statements.slice(at + 1)];
    const uses = (n: ts.Node): ts.Node | undefined => (ts.isIdentifier(n) && locals.has(this.checker.getSymbolAtLocation(n)!) ? n : ts.forEachChild(n, uses));
    for (const n of later) {
      const use = uses(n);
      if (use) this.error(use, `Unsupported: "${use.getText()}", declared before \`super(…)\`, read after its first argument (natively those statements run inside that argument); compute it again, or keep it in a field after super(…).`);
    }
  }

  /** What a class may contain natively. */
  private checkClass(node: ts.ClassLikeDeclaration) {
    if (ts.isClassDeclaration(node) && !node.name) return void this.error(node, "A class declaration needs a name natively (it becomes a named native class): `export default class Counter { … }`.");
    const symbol = this.classSymbol(node);
    const native = symbol ? this.className(symbol) : "";
    const nested = ts.isClassDeclaration(node) ? !ts.isSourceFile(node.parent) : !this.isTopLevelClass(node);
    if (nested) this.checkNestedClass(node);
    if ((ts.isClassExpression(node) || nested) && node.typeParameters?.length) return void this.error(node, "Generic class expressions and generic classes inside functions are not supported natively; declare a generic class at the top level.");
    if (node.typeParameters?.length) {
      // Each instantiation is a class of its own; its statics (which can't use the type parameters) are one shared set,
      // declared once (genericStatics).
      if (symbol && ts.isClassDeclaration(node)) this.generics.set(symbol, node);
    }
    if (ts.getDecorators(node)?.length) this.error(node, "Decorators are not supported natively (they rewrite a class at run time): call the function on the class or method yourself.");
    const base = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0];
    if (base && !this.classRef(base.expression) && !this.isLibError(base.expression)) this.error(base, "A class can extend only another class of the app (or `Error`).");
    for (const member of node.members) {
      const isStatic = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
      if (member.name && !ts.isIdentifier(member.name) && !ts.isPrivateIdentifier(member.name) && !(this.isSymbolIterator(member.name) && ts.isMethodDeclaration(member) && !isStatic && (!!member.asteriskToken || GEN_TYPES.has(this.checker.getSignatureFromDeclaration(member)?.getReturnType().getSymbol()?.name ?? "")))) this.error(member.name, this.isSymbolIterator(member.name) ? "`[Symbol.iterator]` is supported natively as an instance method returning a generator or an `Iterator<T>` (`*[Symbol.iterator]() { yield … }`, or `[Symbol.iterator](): Iterator<T> { return { next: () => … } }`)." : "Class members need plain names natively.");
      else if ((ts.isGetAccessor(member) || ts.isSetAccessor(member)) && !this.checkAccessor(node, member)) continue;
      else if (ts.isPropertyDeclaration(member) && isStatic && !member.initializer) this.error(member, "A static field needs an initial value natively.");
      else if (ts.isPropertyDeclaration(member) && member.exclamationToken) this.error(member, "Definite-assignment fields (`x!: T`) are not supported natively; give the field a value or set it in the constructor.");
      else if (ts.isConstructorDeclaration(member) && base) {
        // The base's constructor runs first: Kotlin and Swift call it before anything else. Statements before it (which
        // can't use `this`) run inside its first argument (preSuper).
        if (member.body && this.superIndex(member.body) < 0) this.error(member, "Call super(…) as a statement of the constructor's body (not inside a block or an expression).");
        else if (member.body) this.checkPreSuper(member.body);
      } else if (!(ts.isPropertyDeclaration(member) || ts.isMethodDeclaration(member) || ts.isGetAccessor(member) || ts.isSetAccessor(member) || ts.isConstructorDeclaration(member) || ts.isSemicolonClassElement(member))) {
        this.error(member, "Unsupported class member: use fields, a constructor, methods, getters, setters and static members.");
      }
    }
  }

  /**
   * A class declared inside a function, or a class expression there or in an expression, is one native
   * class, declared at the top level: the function's locals it uses are passed to it (collectCaptures),
   * and it can't have statics (JavaScript makes a new class, with new statics, each time the
   * declaration or expression runs).
   */
  private checkNestedClass(node: ts.ClassLikeDeclaration) {
    for (const member of node.members) {
      if (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) this.error(member, "Static members of a class inside a function or an expression are not supported natively (JavaScript makes a new class each time); declare the class at the top level.");
    }
  }

  private isNested(node: ts.ClassLikeDeclaration): boolean {
    return ts.isClassDeclaration(node) ? !ts.isSourceFile(node.parent) : !this.isTopLevelClass(node);
  }

  /**
   * The locals of the functions around a nested class that its members use: natively the class is
   * declared at the top level, so each is a hidden constructor parameter kept in a `cap__x` field,
   * which every `new` passes. A class that makes or extends another nested class passes that one's
   * too. The value is copied when the object is made, so a captured variable must not be reassigned
   * (arrays and objects are still shared).
   */
  private collectCaptures() {
    const nested = [...this.objectClasses].filter(([, node]) => this.isNested(node));
    const inside = (n: ts.Node, node: ts.Node) => n.pos >= node.pos && n.end <= node.end;
    const deps = new Map<ts.Symbol, ts.Symbol[]>();
    for (const [symbol, node] of nested) {
      const found: ts.Symbol[] = [];
      const uses: ts.Symbol[] = [];
      const visit = (n: ts.Node): void => {
        if (ts.isTypeNode(n)) return;
        if (ts.isNewExpression(n)) {
          const cls = this.classRef(n.expression);
          if (cls && cls !== symbol) uses.push(cls);
        }
        if (ts.isIdentifier(n)) {
          const value = this.valueSymbol(n);
          const decl = value?.valueDeclaration;
          if (value && decl && !inside(decl, node) && this.isCapturable(decl) && !found.includes(value)) {
            found.push(value);
            if (this.isReassignedLocal(decl)) {
              // A loop's variable: each turn has its own in JavaScript, which the class copies when it is made.
              // Only the loop's own step may change it (that makes the next turn's).
              // A `for` loop's initializer may destructure: its bindings are the loop's variables too.
              const loop = this.loopOf(decl) ?? this.forInitOf(decl);
              const name = (decl as ts.VariableDeclaration | ts.BindingElement).name;
              if (!loop) this.box(value, n);
              else if (this.isReassigned(name as ts.Identifier, loop.statement)) {
                if (ts.isForInStatement(loop) || !ts.isIdentifier(name)) this.error(n, `A nested class uses "${n.text}", which the loop's body reassigns: copy it to a const in the body.`);
                else this.loopBoxes.set(value, { loop, name: `${name.text}__box` });
              }
            }
          }
        }
        ts.forEachChild(n, visit);
      };
      node.members.forEach(visit);
      const base = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0];
      const baseClass = base && this.classRef(base.expression);
      if (baseClass) uses.push(baseClass);
      this.captures.set(symbol, found);
      deps.set(symbol, uses);
    }
    for (let changed = true; changed; ) {
      changed = false;
      for (const [symbol, node] of nested) {
        const own = this.captures.get(symbol)!;
        for (const dep of deps.get(symbol)!) {
          for (const value of this.captures.get(dep) ?? []) {
            // A local of this class's own method is at hand where it makes the other class.
            if (own.includes(value) || inside(value.valueDeclaration!, node)) continue;
            own.push(value);
            changed = true;
          }
        }
      }
    }
  }

  /**
   * Shares a reassigned captured local (not a loop's: collectCaptures handles those) through a box;
   * a boxed variable needs an initial value.
   */
  private box(value: ts.Symbol, at: ts.Node) {
    const decl = value.valueDeclaration!;
    // A destructured one is boxed where its pattern binds it (bindPattern): a `for-of` binds it again each turn.
    if (!ts.isBindingElement(decl) && (ts.isVariableDeclaration(decl) ? !decl.initializer || !ts.isIdentifier(decl.name) : !ts.isParameter(decl) || !ts.isIdentifier(decl.name))) {
      return void this.error(at, `A nested class uses "${value.name}", which is reassigned: declare it with an initial value so it can be shared.`);
    }
    this.boxed.add(value);
  }

  /** The loop a variable is declared by (`for (let i …)`, `for (const x of …)`). */
  private loopOf(decl: ts.Declaration): ts.ForStatement | ts.ForOfStatement | ts.ForInStatement | undefined {
    if (!ts.isVariableDeclaration(decl) || !ts.isVariableDeclarationList(decl.parent)) return undefined;
    const loop = decl.parent.parent;
    return ts.isForStatement(loop) || ts.isForOfStatement(loop) || ts.isForInStatement(loop) ? loop : undefined;
  }

  /** The box a read or a write of a shared local goes through here: its own name, or the loop turn's box inside the loop's body. */
  private boxAt(value: ts.Symbol | undefined, node: ts.Node): string | undefined {
    if (!value) return undefined;
    if (this.boxed.has(value)) return value.name;
    const turn = this.loopBoxes.get(value);
    const body = turn?.loop.statement;
    return body && node.pos >= body.pos && node.end <= body.end ? turn!.name : undefined;
  }

  /** A loop's turn box: made from the loop's variable at the top of the body; `back` writes it to the variable. */
  private loopBox(binding: ts.Identifier): { make: Stmt; back: Stmt } | undefined {
    const value = this.checker.getSymbolAtLocation(binding);
    const turn = value && this.loopBoxes.get(value);
    if (!turn) return undefined;
    return {
      make: { s: "let", name: turn.name, ty: this.refType(value!), init: this.newRef(value!, { e: "id", name: binding.text }), mutable: false },
      back: { s: "assign", target: { e: "id", name: binding.text }, op: "=", value: { e: "prop", obj: { e: "id", name: turn.name }, name: "value" } },
    };
  }

  /** The `for` loop whose initializer destructures a binding (`for (let [a, b] = …; …)`). */
  private forInitOf(decl: ts.Declaration): ts.ForStatement | undefined {
    if (!ts.isBindingElement(decl)) return undefined;
    let root: ts.Node = decl;
    while (ts.isBindingElement(root) || ts.isObjectBindingPattern(root) || ts.isArrayBindingPattern(root)) root = root.parent;
    const loop = ts.isVariableDeclaration(root) ? this.loopOf(root) : undefined;
    return loop && ts.isForStatement(loop) ? loop : undefined;
  }

  /** The names a declaration binds, through any destructuring. */
  private bindingNames(name: ts.BindingName): ts.Identifier[] {
    if (ts.isIdentifier(name)) return [name];
    return name.elements.flatMap((el) => (ts.isBindingElement(el) ? this.bindingNames(el.name) : []));
  }

  /** The box type of a shared local: a class with one `value` field. */
  private refType(value: ts.Symbol, ty = this.tyOfSymbol(value, value.valueDeclaration!)): Ty {
    const name = `Ref__${mangle(ty)}`;
    if (!this.refClasses.has(name)) this.refClasses.set(name, { name, fields: [{ name: "value", ty, readonly: false, optional: ty.k === "optional" }], decodable: false });
    return { k: "class", name };
  }

  /** A shared local made: its box, holding the value. */
  private newRef(value: ts.Symbol, init: Expr, of?: Ty): Expr {
    const ty = this.refType(value, of) as Extract<Ty, { k: "class" }>;
    return { e: "new", cls: ty.name, args: [["value", init]] };
  }

  /** The variable, parameter or local function an identifier reads (`{ x }` reads x, not the property). */
  private valueSymbol(n: ts.Identifier): ts.Symbol | undefined {
    if (ts.isShorthandPropertyAssignment(n.parent) && n.parent.name === n) return this.checker.getShorthandAssignmentValueSymbol(n.parent);
    return this.resolveAlias(this.checker.getSymbolAtLocation(n));
  }

  /** A local of a function (a variable, a parameter, a local function), not one holding a class. */
  private isCapturable(decl: ts.Declaration): boolean {
    if (!ts.findAncestor(decl.parent, ts.isFunctionLike)) return false;
    if (ts.isVariableDeclaration(decl)) return !(decl.initializer && ts.isClassExpression(decl.initializer)) && !this.isNullLocal(this.checker.getSymbolAtLocation(decl.name));
    return ts.isParameter(decl) || ts.isBindingElement(decl) || ts.isFunctionDeclaration(decl);
  }

  private isReassignedLocal(decl: ts.Declaration): boolean {
    if (ts.isFunctionDeclaration(decl) || !("name" in decl) || !ts.isIdentifier(decl.name as ts.Node)) return false;
    if (ts.isVariableDeclaration(decl) && ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const) return false;
    const scope = ts.findAncestor(decl.parent, ts.isFunctionLike);
    return !!scope && this.isReassigned(decl.name as ts.Identifier, scope);
  }

  /** The class a node is inside (the innermost), if it is nested. */
  private nestedClassAt(node: ts.Node): ts.Symbol | undefined {
    const cls = ts.findAncestor(node.parent, ts.isClassLike);
    const symbol = cls && this.classSymbol(cls);
    return symbol && this.captures.has(symbol) ? symbol : undefined;
  }

  /** A captured local read inside the class that captured it: its `cap__x` field. */
  private captureRead(node: ts.Identifier): Expr | undefined {
    const value = this.valueSymbol(node);
    const cls = this.nestedClassAt(node);
    if (!value || !cls || !this.captures.get(cls)!.includes(value)) return undefined;
    return { e: "prop", obj: { e: "id", name: "this" }, name: this.captureField(cls, value) };
  }

  private captureField(cls: ts.Symbol, value: ts.Symbol): string {
    const list = this.captures.get(cls)!;
    const same = list.filter((v) => v.name === value.name);
    return same.length > 1 ? `cap__${value.name}__${same.indexOf(value) + 1}` : `cap__${value.name}`;
  }

  /** What a `new` of a nested class passes for its captures: the locals, or the fields of the class the `new` is in. */
  private captureArgs(cls: ts.Symbol, site: ts.Node): Expr[] {
    const at = this.nestedClassAt(site);
    return (this.captures.get(cls) ?? []).map((value): Expr =>
      at && this.captures.get(at)!.includes(value)
        ? { e: "prop", obj: { e: "id", name: "this" }, name: this.captureField(at, value) }
        : { e: "id", name: this.boxAt(value, site) ?? value.name, fnRef: this.functionSymbols.has(value) || undefined },
    );
  }

  /**
   * A getter and a setter are one native property: a setter comes with its getter, and a class that
   * replaces one of a pair it inherits replaces both (JavaScript would lose the other half). A getter
   * standing for a writable property of a protocol needs its setter.
   */

  private checkAccessor(node: ts.ClassLikeDeclaration, member: ts.GetAccessorDeclaration | ts.SetAccessorDeclaration): boolean {
    const name = this.memberName(member.name);
    const own = (test: (m: ts.ClassElement) => boolean) => node.members.some((m) => test(m) && m.name && this.memberName(m.name) === name);
    const hasGet = own(ts.isGetAccessor);
    const hasSet = own(ts.isSetAccessor);
    if (ts.isSetAccessor(member)) {
      if (!hasGet) return this.error(member, "A setter needs its getter in the same class natively (they are one property)."), false;
      return true;
    }
    if (hasSet || ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) return true;
    for (const other of this.counterparts(node, name)) {
      const decls = other.declarations ?? [];
      if (decls.some(ts.isSetAccessor)) return this.error(member, "Override the getter and the setter together: natively they are one property."), false;
      if (decls.some((d) => ts.isPropertySignature(d) && !d.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword))) {
        return this.error(member, `"${name}" is writable in the interface: give this getter a setter, or make the property readonly.`), false;
      }
    }
    return true;
  }

  private heritage(node: ts.ClassLikeDeclaration, token: ts.SyntaxKind.ExtendsKeyword | ts.SyntaxKind.ImplementsKeyword): readonly ts.ExpressionWithTypeArguments[] {
    return node.heritageClauses?.find((c) => c.token === token)?.types ?? [];
  }

  /** Whether `this` here is the class (a static member) rather than an instance. Arrow functions see their parent's. */
  /** Whether `this` here is an instance of one of the app's classes (arrow functions see their parent's). */
  private inClass(node: ts.Node): boolean {
    const container = ts.findAncestor(node.parent, (n) => (ts.isFunctionLike(n) && !ts.isArrowFunction(n)) || ts.isPropertyDeclaration(n) || ts.isSourceFile(n));
    return !!container && !ts.isSourceFile(container) && ts.isClassLike(container.parent);
  }

  private isStaticContext(node: ts.Node): boolean {
    const container = ts.findAncestor(node.parent, (n) => ts.isFunctionLike(n) && !ts.isArrowFunction(n) || ts.isPropertyDeclaration(n) || ts.isClassStaticBlockDeclaration(n));
    return !!container && (ts.isClassStaticBlockDeclaration(container) || !!(ts.getCombinedModifierFlags(container as ts.Declaration) & ts.ModifierFlags.Static));
  }

  /** Two numeric slots that must have one kind (Int or Double): each is written from the other. */
  private link(a: Slot, b: Slot) {
    this.writes.push({ slot: a, fromSlot: b }, { slot: b, fromSlot: a });
  }

  /**
   * A member and what it overrides or implements are one native member, so their numbers have one
   * kind: fields with fields, a getter with the property, a method's parameters and result with the other's.
   */
  private linkMembers() {
    const parts = (decl: ts.Declaration | undefined): { ret?: Slot; params: Slot[] } => {
      if (!decl) return { params: [] };
      if (ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl)) {
        return { ret: decl, params: decl.parameters.map((p) => this.checker.getSymbolAtLocation(p.name)!).filter(Boolean) };
      }
      return { params: [] };
    };
    for (const node of this.objectClasses.values()) {
      for (const member of node.members) {
        if (!member.name || !(ts.isIdentifier(member.name) || ts.isPrivateIdentifier(member.name))) continue;
        const symbol = this.checker.getSymbolAtLocation(member.name);
        if (ts.isGetAccessor(member) && symbol) this.link(member, symbol);
        const value = ts.isSetAccessor(member) ? member.parameters[0] && this.checker.getSymbolAtLocation(member.parameters[0].name) : undefined;
        if (value && symbol) this.link(value, symbol);
        if (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) continue;
        for (const other of ts.isIdentifier(member.name) ? this.counterparts(node, member.name.text) : []) {
          const decl = other.valueDeclaration ?? other.declarations?.[0];
          if (symbol && !ts.isMethodDeclaration(member)) this.link(symbol, other);
          if (decl && ts.isGetAccessor(decl)) this.link(other, decl);
          const [mine, theirs] = [parts(member), parts(decl)];
          if (mine.ret && theirs.ret) this.link(mine.ret, theirs.ret);
          mine.params.forEach((p, i) => theirs.params[i] && this.link(p, theirs.params[i]!));
        }
      }
      // Parameter properties.
      const ctor = node.members.find(ts.isConstructorDeclaration);
      for (const param of ctor?.parameters ?? []) {
        if (!ts.isParameterPropertyDeclaration(param, ctor!) || !ts.isIdentifier(param.name)) continue;
        const [, field] = this.checker.getSymbolsOfParameterPropertyDeclaration(param, param.name.text);
        if (field) for (const other of this.counterparts(node, param.name.text)) this.link(field, other);
      }
    }
    // A protocol's members with those of the protocols it extends.
    for (const node of this.protocols.values()) {
      for (const member of node.members) {
        if (!member.name || !ts.isIdentifier(member.name)) continue;
        for (const clause of node.heritageClauses ?? []) {
          for (const t of clause.types) {
            const other = this.checker.getTypeAtLocation(t).getProperty(member.name.text);
            const decl = other?.valueDeclaration;
            const symbol = this.checker.getSymbolAtLocation(member.name);
            if (other && symbol && ts.isPropertySignature(member)) this.link(symbol, other);
            const [mine, theirs] = [parts(member), parts(decl)];
            if (mine.ret && theirs.ret) this.link(mine.ret, theirs.ret);
            mine.params.forEach((p, i) => theirs.params[i] && this.link(p, theirs.params[i]!));
          }
        }
      }
    }
  }

  /** The members named `name` of a class's base and of the interfaces it implements. */
  private counterparts(node: ts.ClassLikeDeclaration, name: string): ts.Symbol[] {
    const out: ts.Symbol[] = [];
    for (const clause of node.heritageClauses ?? []) {
      for (const t of clause.types) {
        const prop = this.checker.getTypeAtLocation(t).getProperty(name);
        if (prop) out.push(prop);
      }
    }
    return out;
  }

  /** The class or protocol a declaration belongs to, by name. */
  private ownerOf(decl: ts.Node): string | undefined {
    const parent = decl.parent;
    if (ts.isClassLike(parent)) {
      const symbol = this.classSymbol(parent);
      if (symbol && this.objectClasses.has(symbol)) return this.className(symbol);
    }
    if (ts.isInterfaceDeclaration(parent)) {
      const symbol = this.checker.getSymbolAtLocation(parent.name);
      if (symbol && this.protocols.has(symbol)) return this.className(symbol);
    }
    return undefined;
  }

  /** The base class and the protocols a class or protocol name conforms to, transitively. */
  private supertypes(name: string, out = new Set<string>()): Set<string> {
    const decl = this.declOfName(name);
    const env = this.instances.get(name)?.env ?? this.env;
    const direct = this.withEnv(env, () => (decl?.heritageClauses ?? []).flatMap((clause) => clause.types.map((t) => this.heritageName(t)).filter((n): n is string => !!n)));
    direct.push(...(this.conformances.get(name) ?? []));
    for (const n of direct) {
      if (out.has(n)) continue;
      out.add(n);
      this.supertypes(n, out);
    }
    return out;
  }

  /** The class or protocol a native name stands for: `Box` or an instantiation `Box__Double`. */
  private declOfName(name: string): ts.ClassLikeDeclaration | ts.InterfaceDeclaration | undefined {
    const instance = this.instances.get(name)?.decl;
    if (instance) return ts.isClassDeclaration(instance) || ts.isInterfaceDeclaration(instance) ? instance : undefined;
    const find = <T extends ts.ClassLikeDeclaration | ts.InterfaceDeclaration>(map: Map<ts.Symbol, T>) => [...map].find(([s]) => this.className(s) === name)?.[1];
    return find(this.objectClasses) ?? find(this.protocols);
  }

  /** The native name of an `extends` / `implements` entry: `Base`, or `Base__Double` for `Base<number>`. */
  private heritageName(t: ts.ExpressionWithTypeArguments): string | undefined {
    if (this.isLibError(t.expression)) return ERROR_BASE;
    const generic = this.genericRef(this.bound(this.checker.getTypeAtLocation(t)));
    if (generic) return this.instantiate(generic.decl, generic.args, t);
    const cls = this.classRef(t.expression);
    const symbol = cls ?? this.checker.getSymbolAtLocation(t.expression);
    return symbol && this.className(symbol);
  }

  /** A protocol (an instantiation of a generic one included) by its native name. */
  private protocolByName(name: string): ProtocolDecl | undefined {
    const shape = this.shapeProtocols.get(name);
    if (shape) return shape;
    const instance = this.instanceProtocols.get(name);
    if (instance) return instance;
    const node = [...this.protocols].find(([symbol, decl]) => this.className(symbol) === name && !decl.typeParameters?.length)?.[1];
    return node && this.protocolDecl(node);
  }

  /**
   * An object literal of a protocol: a `new` of the class generated for the protocol's literals,
   * which keeps each field and, for each method, the function given for it (an `fn__` field the method calls).
   */
  private protocolLiteral(node: ts.ObjectLiteralExpression, protocol: ProtocolDecl, ctx: Ctx): Expr {
    const cls = this.literalClass(protocol);
    const given = new Map<string, ts.Expression | ts.MethodDeclaration | ts.AccessorDeclaration | Expr>();
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop.initializer);
      else if (ts.isAccessor(prop) && ts.isIdentifier(prop.name)) given.set(`${ts.isGetAccessor(prop) ? "get" : "set"}__${prop.name.text}`, prop);
      else if (ts.isShorthandPropertyAssignment(prop)) given.set(prop.name.text, prop.name);
      else if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop);
      else if (ts.isSpreadAssignment(prop) && !protocol.methods.length && this.isPure(prop.expression) && !this.isNullable(this.typeOf(prop.expression))) {
        // `{ ...todo, done: true }` of a shape protocol (fields only): each field the source has, read once each (later members win).
        const source = this.expr(prop.expression, ctx);
        for (const from of this.typeOf(prop.expression).getProperties()) {
          const field = cls.fields.find((f) => f.name === from.name);
          if (!field) continue;
          const read: Expr = { e: "prop", obj: source, name: from.name };
          const target = field.ty.k === "optional" ? field.ty.of : field.ty;
          given.set(from.name, target.k === "double" && this.isNumber(this.checker.getTypeOfSymbol(from)) && this.slotKind(from) === "int" ? { e: "toDouble", x: read } : read);
        }
      } else this.error(prop, "Unsupported member in an object literal of an interface with methods: give each property and method by name (no spread of a nullable or computed value).");
    }
    const args = cls.ctor.params.map((param): Expr => {
      const value = given.get(param.name.replace(/^fn__/, ""));
      if (!value) return { e: "nil" };
      if ("e" in value) return value;
      const fn = param.ty.k === "fn" ? param.ty : undefined;
      if (fn && param.name.startsWith("fn__") && ts.isMethodDeclaration(value) && value.asteriskToken) {
        // A generator method: a function making its state machine (which gets the object as `this__`).
        const g = this.generatorFn(`${cls.name}__${param.name.slice(4)}`, value, fn.params.at(-1)!);
        return { e: "lambda", params: g.params.map((p) => ({ name: p.name, ty: p.ty })), ret: g.ret, body: g.body, typed: true };
      }
      if (fn && param.name.startsWith("fn__") && (ts.isMethodDeclaration(value) || ts.isAccessor(value) || ts.isArrowFunction(value) || ts.isFunctionExpression(value))) {
        // A method's function takes the object last: `this` in a method of the literal (a parameter, not a capture: no cycle).
        const lambda = this.lambda(value as ts.MethodDeclaration, ctx, { ...fn, params: fn.params.slice(0, -1) }, true);
        if (lambda.e !== "lambda") return lambda;
        const usesThis = !ts.isArrowFunction(value) && !!this.findThis(value);
        // A function taking fewer parameters than the method ignores the rest.
        const ignored = fn.params.slice(lambda.params.length, -1).map((ty, i): Param => ({ name: `unused__${i}`, ty, unused: true }));
        return { ...lambda, params: [...lambda.params, ...ignored, { name: "this__", ty: fn.params.at(-1)!, ...(usesThis ? {} : { unused: true }) }] };
      }
      if (fn && (ts.isMethodDeclaration(value) || ts.isArrowFunction(value) || ts.isFunctionExpression(value))) return this.lambda(value, ctx, fn, true);
      if (ts.isMethodDeclaration(value) || ts.isAccessor(value)) return this.error(value, "A method needs a function-typed member here.");
      return this.expr(value, ctx, param.ty);
    });
    return { e: "construct", cls: cls.name, args };
  }

  /** The class of a protocol's object literals: a field per property, and per method a function field it calls. */
  private literalClass(protocol: ProtocolDecl): ObjectClassDecl {
    const name = `${protocol.name}__Literal`;
    const existing = this.literalClasses.get(name);
    if (existing) return existing;
    // The protocol's members and those of the protocols it extends (the first declaration of a name wins).
    const fields: ProtocolDecl["fields"] = [];
    const methods: ProtocolDecl["methods"] = [];
    const visit = (p: ProtocolDecl) => {
      for (const f of p.fields) if (!fields.some((x) => x.name === f.name)) fields.push(f);
      for (const m of p.methods) if (!methods.some((x) => x.name === m.name)) methods.push(m);
      for (const base of p.bases) {
        const next = this.protocolByName(base);
        if (next) visit(next);
      }
    };
    visit(protocol);
    const self: Expr = { e: "id", name: "this" };
    const cls: ObjectClassDecl = { name, protocols: [protocol.name], abstract: false, open: false, fields: [], ctor: { params: [], body: [] }, methods: [] };
    const store = (fieldName: string, ty: Ty, readonly: boolean, optional: boolean, fromProtocol: boolean) => {
      cls.fields.push({ name: fieldName, ty, readonly, optional, ...(fromProtocol ? { implements: true } : {}) });
      cls.ctor.params.push({ name: fieldName, ty });
      cls.ctor.body.push({ s: "assign", target: { e: "prop", obj: self, name: fieldName }, op: "=", value: { e: "id", name: fieldName } });
    };
    for (const f of fields) store(f.name, f.ty, f.readonly, f.optional, true);
    for (const m of methods) {
      const throws = m.throws ? { throws: true } : {};
      // The function given for the method, called with the object last (its `this`).
      store(`fn__${m.name}`, { k: "fn", params: [...m.params.map((p) => p.ty), { k: "class", name: protocol.name }], ret: m.ret, ...throws }, true, false, false);
      const call: Expr = { e: "call", callee: { e: "prop", obj: self, name: `fn__${m.name}` }, args: [...m.params.map((p): Expr => ({ e: "id", name: p.name })), self], ...throws };
      cls.methods.push({ name: m.name, params: m.params, ret: m.ret, async: false, body: [m.ret.k === "void" ? { s: "expr", x: call } : { s: "return", x: call }], implements: true, ...throws });
    }
    this.literalClasses.set(name, cls);
    return cls;
  }

  private protocolDecl(node: ts.InterfaceDeclaration, instance?: string): ProtocolDecl {
    const decl: ProtocolDecl = { name: instance ?? this.className(this.checker.getSymbolAtLocation(node.name)!), bases: [], fields: [], methods: [] };
    for (const clause of node.heritageClauses ?? []) {
      for (const t of clause.types) {
        const base = this.heritageName(t);
        if (base) decl.bases.push(base);
      }
    }
    for (const member of node.members) {
      if (!member.name || !ts.isIdentifier(member.name)) continue;
      const symbol = this.checker.getSymbolAtLocation(member.name)!;
      if (ts.isPropertySignature(member)) {
        const readonly = !!member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword);
        decl.fields.push({ name: member.name.text, ty: this.tyOfSymbol(symbol, member), readonly, optional: !!member.questionToken });
      } else if (ts.isMethodSignature(member)) {
        const signature = this.checker.getSignatureFromDeclaration(member)!;
        const params = this.params(member, { async: false, ret: T.void, voidUnion: false, inTry: false }).map((p) => ({ name: p.name, ty: p.ty }));
        decl.methods.push({ name: member.name.text, params, ret: this.ty(signature.getReturnType(), member, this.slotKind(member)), ...(this.throws(member) ? { throws: true } : {}) });
      }
    }
    return this.extendProtocol(decl);
  }

  /**
   * A method's optional and default parameters, applied by the method itself as JavaScript does (a
   * Swift protocol can't declare defaults, and an override or an implementation may have its own):
   * the parameter is optional natively, callers pass nil for it, and the body starts with
   * `p = p ?? default`. A method and what it overrides or implements must agree on which are optional.
   */
  private calleeDefaults(method: MethodDecl, node: ts.MethodDeclaration | ts.AccessorDeclaration, cls: ts.ClassLikeDeclaration) {
    const optional = (p: ts.ParameterDeclaration | undefined) => !!p && (!!p.questionToken || !!p.initializer || !!p.dotDotDotToken);
    for (const other of this.counterparts(cls, method.name)) {
      const decl = other.valueDeclaration;
      if (!decl || !(ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl))) continue;
      node.parameters.forEach((p, i) => {
        if (optional(p) !== optional(decl.parameters[i])) this.error(p, "Make this parameter optional (or defaulted) in every class and interface that declares the method, or in none: natively they are one method.");
      });
    }
    this.ownDefaults(method.params, node.parameters, method.body);
  }

  /**
   * Optional and default parameters that the function applies itself: `p: T?`, and the body starts with `p = p ?? default`.
   * `appCode`: only defaults that run the app's code (`order = { … }` makes an object, a call, a global read), and the
   * parameter keeps a native default of nil: Swift evaluates a default argument outside the main actor, where the
   * app's classes, functions and globals can't be used.
   */
  private ownDefaults(params: Param[], nodes: readonly ts.ParameterDeclaration[], body: Stmt[], appCode = false) {
    const plain = (x: Expr): boolean =>
      ["int", "double", "str", "bool", "nil", "enum"].includes(x.e) || (x.e === "neg" && plain(x.x)) || (x.e === "arr" && x.items.every(plain)) ||
      (x.e === "dict" && x.entries.every(([, v]) => plain(v))) || (x.e === "tpl" && x.parts.every((part) => typeof part === "string" || plain(part)));
    let at = 0;
    params.forEach((p, i) => {
      const param = nodes[i]!;
      if (!p.default || param.dotDotDotToken || (appCode && plain(p.default))) return;
      // A method's app-code default was applied when its function was made (fnDecl); calleeDefaults sees it again.
      if (body.some((st) => st.s === "let" && st.name === p.name && st.init?.e === "coalesce" && st.init.l.e === "id" && st.init.l.name === p.name)) return;
      const value = p.default;
      delete p.default;
      if (!param.initializer) return;
      // `height(node: Node | null = this.root)`: JavaScript applies the default only to a missing argument, not to null.
      const declared = this.checker.getTypeAtLocation(param);
      if (this.members(declared).some((t) => t.flags & ts.TypeFlags.Null) && value.e !== "nil") {
        return void this.error(param, "A default for a parameter that may be null: JavaScript applies it only when the argument is missing, but natively null and a missing argument are one nil. Drop the default and pass the value (`height(this.root)`), or use undefined instead of null.");
      }
      const ty = p.ty;
      p.ty = T.optional(ty);
      if (appCode) p.default = { e: "nil" };
      const fill: Expr = { e: "coalesce", l: { e: "id", name: p.name }, r: value };
      // The body may already shadow the parameter (it is reassigned): that variable starts with the default.
      const shadow = body.find((st): st is Extract<Stmt, { s: "let" }> => st.s === "let" && st.name === p.name && st.init?.e === "id" && st.init.name === p.name);
      // In the parameters' order, as JavaScript evaluates defaults (a later one may read an earlier one's side effects).
      if (shadow) (shadow.init = fill), (at = Math.max(at, body.indexOf(shadow) + 1));
      else body.splice(at++, 0, { s: "let", name: p.name, ty, init: fill, mutable: false });
    });
  }

  /** A class: its fields, constructor and methods; its static members become globals and functions. */
  private classDef(node: ts.ClassLikeDeclaration, out: Program, instance?: string) {
    const symbol = this.classSymbol(node)!;
    const name = instance ?? this.className(symbol);
    this.definedClasses.add(node);
    const top: Ctx = { async: false, ret: T.void, voidUnion: false, inTry: false };
    const self: Expr = { e: "id", name: "this" };
    const baseNode = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0];
    const base = baseNode && this.heritageName(baseNode);
    const baseClass = baseNode && this.classRef(baseNode.expression);
    const protocols = this.heritage(node, ts.SyntaxKind.ImplementsKeyword).map((t) => this.heritageName(t)!);
    // Interfaces and object types its objects flow into without `implements` (rest2: classConform).
    const conformed = new Set([...(this.conformances.get(name) ?? [])].flatMap((p) => [...this.protocolMembers(p)]));
    protocols.push(...[...(this.conformances.get(name) ?? [])].filter((p) => !protocols.includes(p)));
    const inBase = (member: string) => !!baseNode && !!this.checker.getTypeAtLocation(baseNode).getProperty(member);
    const baseField = (member: string) =>
      !!baseNode && !!this.checker.getTypeAtLocation(baseNode).getProperty(member)?.declarations?.some((d) => ts.isPropertyDeclaration(d) || ts.isParameter(d) || (d.getSourceFile().isDeclarationFile && ts.isPropertySignature(d)));
    const inProtocol = (member: string) =>
      conformed.has(member) || [...this.supertypes(name)].some((p) => {
        const decl = this.declOfName(p);
        const symbol = decl && ts.isInterfaceDeclaration(decl) ? this.checker.getSymbolAtLocation(decl.name) : undefined;
        return !!symbol && this.protocols.has(symbol) && !!this.checker.getDeclaredTypeOfSymbol(symbol).getProperty(member);
      });
    const cls: ObjectClassDecl = {
      name,
      base,
      protocols,
      abstract: !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Abstract),
      open: false,
      fields: [],
      ctor: { params: [], body: [] },
      methods: [],
    };
    const inits: Stmt[] = [];
    const field = (fieldName: string, fieldSymbol: ts.Symbol, at: ts.Node, readonly: boolean, optional: boolean): ObjectField => {
      const f: ObjectField = { name: fieldName, ty: this.tyOfSymbol(fieldSymbol, at), readonly, optional };
      if (inBase(fieldName)) f.overrides = true;
      if (inProtocol(fieldName)) {
        f.implements = true;
        // A generated protocol's fields are settable (Swift `{ get set }`); TypeScript checks `readonly` (rest2).
        if (conformed.has(fieldName)) f.readonly = false;
        // `priority = 10` for an interface's `priority?: number`: natively the protocol's property is optional, the field isn't.
        const protoOptional = [...this.supertypes(name)].some((p) => {
          const decl = this.declOfName(p);
          const symbol = decl && ts.isInterfaceDeclaration(decl) ? this.checker.getSymbolAtLocation(decl.name) : undefined;
          const prop = symbol && this.protocols.has(symbol) ? this.checker.getDeclaredTypeOfSymbol(symbol).getProperty(fieldName) : undefined;
          return !!prop && !!(prop.flags & ts.SymbolFlags.Optional);
        });
        if (protoOptional && f.ty.k !== "optional") {
          this.error(at, `"${fieldName}" implements an optional property of an interface: natively the interface's property is optional and this field isn't, so the class wouldn't conform. Declare it optional here too (\`${fieldName}?: T = …\`).`);
        }
      }
      cls.fields.push(f);
      return f;
    };
    let ctorNode: ts.ConstructorDeclaration | undefined;
    for (const member of node.members) {
      if (!member.name || !(ts.isIdentifier(member.name) || ts.isPrivateIdentifier(member.name) || this.isSymbolIterator(member.name))) {
        if (ts.isConstructorDeclaration(member) && member.body) ctorNode = member;
        continue;
      }
      const memberName = this.memberName(member.name);
      const isStatic = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
      // A generic class's statics are declared once for every instantiation (genericStatics).
      if (isStatic && instance) continue;
      if (ts.isPropertyDeclaration(member)) {
        const memberSymbol = this.checker.getSymbolAtLocation(member.name)!;
        const readonly = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly);
        if (isStatic) {
          const ty = this.tyOfSymbol(memberSymbol, member);
          out.globals.push({ s: "let", name: `${name}__${memberName}`, ty, init: this.globalInit(member.initializer!, top, ty), mutable: !readonly });
          continue;
        }
        // A field the base declares too (`name = "NotFound"` in an error class) is the base's: set after super(…).
        if (baseField(memberName)) {
          if (member.initializer) inits.push({ s: "assign", target: { e: "prop", obj: self, name: memberName }, op: "=", value: this.expr(member.initializer, top, this.tyOfSymbol(memberSymbol, member)) });
          continue;
        }
        const f = field(memberName, memberSymbol, member, readonly, !!member.questionToken);
        const init = member.initializer;
        if (!init) continue;
        const literal = ts.isNumericLiteral(init) || ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || init.kind === ts.SyntaxKind.TrueKeyword ||
          init.kind === ts.SyntaxKind.FalseKeyword || init.kind === ts.SyntaxKind.NullKeyword || (ts.isArrayLiteralExpression(init) && !init.elements.length);
        if (literal) f.init = this.expr(init, top, f.ty);
        else inits.push({ s: "assign", target: { e: "prop", obj: self, name: memberName }, op: "=", value: this.expr(init, top, f.ty) });
      } else if (ts.isMethodDeclaration(member) || ts.isGetAccessor(member) || ts.isSetAccessor(member)) {
        // An overload signature: the implementation is the native method. A generic method: its instantiations are.
        if (this.overloadImpl(member) || (ts.isMethodDeclaration(member) && member.typeParameters?.length)) continue;
        if (isStatic) {
          // A static getter is the function `C__x`, its setter `C__set_x` (staticAccessor reads and writes through them).
          out.functions.push(this.fnDecl(`${name}__${ts.isSetAccessor(member) ? "set_" : ""}${memberName}`, member));
          continue;
        }
        const method: MethodDecl = this.fnDecl(memberName, member);
        this.calleeDefaults(method, member, node);
        if (ts.isGetAccessor(member)) method.getter = true;
        if (ts.isSetAccessor(member)) method.setter = true;
        if (!member.body) method.abstract = true;
        if (inBase(memberName) || (memberName === ITERATOR_METHOD && !!baseNode && !!this.iteratorMethod(this.checker.getTypeAtLocation(baseNode)))) method.overrides = true;
        if (inProtocol(memberName)) method.implements = true;
        cls.methods.push(method);
      }
    }
    // The constructor: its own, or the base's parameters passed on.
    const assigns: Stmt[] = [];
    let rest: Stmt[] = [];
    if (ctorNode) {
      cls.ctor.params = this.params(ctorNode, top);
      for (const param of ctorNode.parameters) {
        if (!ts.isParameterPropertyDeclaration(param, ctorNode) || !ts.isIdentifier(param.name)) continue;
        const [, fieldSymbol] = this.checker.getSymbolsOfParameterPropertyDeclaration(param, param.name.text);
        field(param.name.text, fieldSymbol!, param, !!(ts.getCombinedModifierFlags(param) & ts.ModifierFlags.Readonly), false);
        assigns.push({ s: "assign", target: { e: "prop", obj: self, name: param.name.text }, op: "=", value: { e: "id", name: param.name.text } });
      }
      const statements = ctorNode.body!.statements;
      const at = base ? this.superIndex(ctorNode.body!) : -1;
      const first = statements[at];
      const superCall = base && first && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression) ? first.expression : undefined;
      // Statements before super(…) (no `this` there): lowered on their own, run inside its first argument.
      const pre = statements.slice(0, Math.max(at, 0));
      const preStmts = pre.flatMap((s) => noteOrigin(this.stmt(s, top), s));
      pre.forEach((s) => this.skipped.add(s));
      if (superCall && base === ERROR_BASE) cls.ctor.superArgs = this.errorArgs(superCall, top);
      else if (superCall) {
        const signature = this.checker.getResolvedSignature(superCall);
        cls.ctor.superArgs = signature ? this.callArgs(superCall, signature, top) : [];
      }
      if (preStmts.length && cls.ctor.superArgs?.length) {
        const param = base === ERROR_BASE ? undefined : this.checker.getResolvedSignature(superCall!)?.getParameters()[0];
        const ty = param ? this.tyOfSymbol(param, superCall!) : T.string;
        cls.ctor.superArgs[0] = { e: "seq", body: preStmts, x: cls.ctor.superArgs[0]!, ty };
      }
      // The super(…) statement itself lowers to nothing (stmt): the class declares the call.
      rest = this.body(ctorNode, top);
    } else if (base) {
      // The base's parameters, defaults included (the base is declared first), less its captures.
      const baseDecl = out.objectClasses?.find((c) => c.name === base);
      const baseCaptures = baseClass ? (this.captures.get(baseClass)?.length ?? 0) : 0;
      const [signature] = this.checker.getSignaturesOfType(this.checker.getTypeOfSymbol(symbol), ts.SignatureKind.Construct);
      cls.ctor.params = baseDecl ? baseDecl.ctor.params.slice(baseCaptures).map((p) => ({ ...p })) : (signature?.getParameters() ?? []).map((p) => ({ name: p.name, ty: this.tyOfSymbol(p, node) }));
      cls.ctor.superArgs = cls.ctor.params.map((p): Expr => ({ e: "id", name: p.name }));
    }
    // Captured locals: hidden first parameters kept in fields, set before anything reads them; the base gets its own.
    const captured = this.captures.get(symbol) ?? [];
    const capParams = captured.map((value): Param => ({ name: this.captureField(symbol, value), ty: this.boxed.has(value) || this.loopBoxes.has(value) ? this.refType(value) : this.tyOfSymbol(value, value.valueDeclaration!) }));
    // Those the base captures too are its fields: the base's constructor sets them.
    const inherited = new Set((baseClass ? (this.captures.get(baseClass) ?? []) : []).map((value) => this.captureField(symbol, value)));
    const ownCaps = capParams.filter((p) => !inherited.has(p.name));
    for (const p of ownCaps) cls.fields.push({ name: p.name, ty: p.ty, readonly: true, optional: false });
    cls.ctor.params = [...capParams, ...cls.ctor.params];
    if (baseClass && this.captures.get(baseClass)?.length) {
      const passed = this.captures.get(baseClass)!.map((value): Expr => ({ e: "id", name: this.captureField(symbol, value) }));
      cls.ctor.superArgs = [...passed, ...(cls.ctor.superArgs ?? [])];
    }
    const capAssigns = ownCaps.map((p): Stmt => ({ s: "assign", target: { e: "prop", obj: self, name: p.name }, op: "=", value: { e: "id", name: p.name } }));
    cls.ctor.body = [...capAssigns, ...inits, ...assigns, ...rest];
    if (this.throws(node)) cls.ctor.throws = true;
    (out.objectClasses ??= []).push(...noteOrigin([cls], node));
  }

  /**
   * The static members of a generic class: one set for every instantiation, as JavaScript has one class (TypeScript
   * keeps the type parameters out of them). Globals and functions `C__member`, as a plain class's (classDef).
   */
  private genericStatics(node: ts.ClassDeclaration, out: Program) {
    const symbol = this.classSymbol(node);
    if (!symbol) return;
    const name = this.className(symbol);
    const top: Ctx = { async: false, ret: T.void, voidUnion: false, inTry: false };
    for (const member of node.members) {
      if (!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) || !member.name) continue;
      const memberName = this.memberName(member.name);
      if (ts.isPropertyDeclaration(member)) {
        const ty = this.tyOfSymbol(this.checker.getSymbolAtLocation(member.name)!, member);
        out.globals.push({ s: "let", name: `${name}__${memberName}`, ty, init: this.globalInit(member.initializer!, top, ty), mutable: !(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly) });
      } else if (ts.isMethodDeclaration(member) || ts.isGetAccessor(member) || ts.isSetAccessor(member)) {
        out.functions.push(this.fnDecl(`${name}__${ts.isSetAccessor(member) ? "set_" : ""}${memberName}`, member));
      }
    }
  }

  /**
   * An enum is a set of string or number constants: its members are inlined, its type is string or number (a mixed
   * one, rest2: the union `string | number`, as TypeScript types it).
   */
  private checkEnum(node: ts.EnumDeclaration) {
    for (const member of node.members) {
      if (this.checker.getConstantValue(member) === undefined) this.error(member, "Enum members need constant values natively (literals, or numbers counted up).");
    }
  }

  /** `E.Member` of an enum: its constant value. */
  private enumValue(node: ts.Node): string | number | undefined {
    const symbol = ts.isPropertyAccessExpression(node) ? this.checker.getSymbolAtLocation(node.name) : undefined;
    const decl = symbol && symbol.flags & ts.SymbolFlags.EnumMember ? symbol.valueDeclaration : undefined;
    return decl && ts.isEnumMember(decl) ? this.checker.getConstantValue(decl) : undefined;
  }

  /** `map[key]` of a Record<string, T>. */
  private isMapEntry(node: ts.Expression): node is ts.ElementAccessExpression {
    if (!ts.isElementAccessExpression(node)) return false;
    const type = this.checker.getNonNullableType(this.typeOf(node.expression));
    return !!type.getStringIndexType() && type.getProperties().length === 0;
  }

  /** `ns.name` where `ns` is `import * as ns`: the name itself, which names the module's declaration (see nameDeclarations). */
  private unNamespace<T extends ts.Expression>(node: T): T | ts.Identifier {
    if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression)) return node;
    const symbol = this.checker.getSymbolAtLocation(node.expression);
    const target = this.resolveAlias(symbol);
    return symbol && symbol.flags & ts.SymbolFlags.Alias && target && target.flags & ts.SymbolFlags.ValueModule ? (node.name as ts.Identifier) : node;
  }

  /** An expression with no effects, which may be read more than once: `a`, `a.b.c`, `a!`. */
  private skipAsserts(node: ts.Expression): ts.Expression {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) node = node.expression;
    return node;
  }

  /** Gives the same value when evaluated twice and changes nothing: pure reads, literals and arithmetic on them (`i >> 5`, `j + 1`). */
  private isRepeatable(node: ts.Expression): boolean {
    node = this.skipAsserts(node);
    if (this.isPure(node) || ts.isNumericLiteral(node) || ts.isStringLiteralLike(node)) return true;
    if (ts.isPrefixUnaryExpression(node)) return (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.TildeToken) && this.isRepeatable(node.operand);
    return ts.isBinaryExpression(node) && !this.isAssignment(node.operatorToken.kind) && node.operatorToken.kind !== ts.SyntaxKind.CommaToken && this.isRepeatable(node.left) && this.isRepeatable(node.right);
  }

  private isPure(node: ts.Expression): boolean {
    if (ts.isIdentifier(node) || node.kind === ts.SyntaxKind.ThisKeyword || node.kind === ts.SyntaxKind.SuperKeyword) return true;
    // Evaluated already, into a temporary (presetParts).
    if (this.presets.has(node)) return true;
    if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) return this.isPure(node.expression);
    return ts.isPropertyAccessExpression(node) && !node.questionDotToken && this.isPure(node.expression);
  }

  private declareSlot(name: ts.Node, typeNode: ts.TypeNode | undefined) {
    const symbol = this.checker.getSymbolAtLocation(name);
    if (!symbol) return;
    if (this.isNumber(this.checker.getTypeOfSymbolAtLocation(symbol, name))) this.kinds.set(symbol, this.forcedKind(typeNode) ?? "int");
    this.declareSized(symbol, name.parent, typeNode);
  }

  /**
   * A slot whose declared type is a sized number (or an array of one) stores it natively. Elsewhere (`Int8 | null`,
   * `Box<Int8>`, `Record<string, Int8>`, a callback's parameters, `declare function`s, async results) the type is
   * a plain `number`: sound, just not compact.
   */
  private declareSized(slot: Slot, decl: ts.Node, typeNode: ts.TypeNode | undefined) {
    const sized = this.sizedNode(typeNode);
    if (!sized) return;
    const fn = ts.isParameter(decl) ? decl.parent : decl;
    if (ts.isParameter(decl) && (decl.questionToken || decl.initializer || decl.dotDotDotToken)) return;
    if (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) {
      if (decl.questionToken) return;
    } else if (!ts.isVariableDeclaration(decl) || ts.isForOfStatement(decl.parent.parent) || ts.isForInStatement(decl.parent.parent)) {
      // Parameters and results: of functions, methods and constructors with a body (a lambda's follow its call site).
      const named = ts.isFunctionDeclaration(fn) || ts.isMethodDeclaration(fn) || ts.isConstructorDeclaration(fn) || ts.isGetAccessor(fn) || ts.isSetAccessor(fn) ||
        ((ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && ts.isVariableDeclaration(fn.parent) && !!(ts.getCombinedNodeFlags(fn.parent) & ts.NodeFlags.Const));
      if (!named || !(fn as ts.FunctionLikeDeclaration).body || ts.getCombinedModifierFlags(fn as ts.Declaration) & ts.ModifierFlags.Async) return;
    }
    (sized.array ? this.sizedArrays : this.sized).set(slot, sized.n);
    // Reads are Ints or Doubles by type, never changed by inference (every write is checked to fit).
    if (!sized.array) this.kinds.set(slot, SIZED[sized.n].int ? "int" : "double");
  }

  /** `Int8` (one of the API's sized types; `BigInt` is Int64) or `Int8[]` as written in a type annotation. */
  private sizedNode(typeNode: ts.TypeNode | undefined): { n: SizedNum; array: boolean } | undefined {
    while (typeNode && ts.isParenthesizedTypeNode(typeNode)) typeNode = typeNode.type;
    if (!typeNode) return undefined;
    if (ts.isArrayTypeNode(typeNode)) {
      const elem = this.sizedNode(typeNode.elementType);
      return elem && !elem.array ? { n: elem.n, array: true } : undefined;
    }
    if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName) || typeNode.typeArguments) return undefined;
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(typeNode.typeName));
    if (!symbol?.declarations?.some((d) => this.isApi(d))) return undefined;
    const name = symbol.name === "BigInt" ? "Int64" : symbol.name;
    return name in SIZED ? { n: name as SizedNum, array: false } : undefined;
  }

  private write(name: ts.Node, from: ts.Expression) {
    const symbol = this.checker.getSymbolAtLocation(name);
    if (symbol) this.writes.push({ slot: symbol, from });
  }

  /** `Int` / `Double` annotations (the API's aliases). */
  private forcedKind(typeNode: ts.TypeNode | undefined): NumKind | undefined {
    if (!typeNode) return undefined;
    const ref = ts.isUnionTypeNode(typeNode) ? typeNode.types.find(ts.isTypeReferenceNode) : typeNode;
    if (!ref || !ts.isTypeReferenceNode(ref) || !ts.isIdentifier(ref.typeName)) return undefined;
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(ref.typeName));
    if (!symbol?.declarations?.some((d) => this.isApi(d))) return undefined;
    return ref.typeName.text === "Int" ? "int" : ref.typeName.text === "Double" ? "double" : undefined;
  }

  /** A slot holds Int until a write that may not be whole makes it Double. */
  private inferNumbers() {
    for (let changed = true; changed; ) {
      changed = false;
      for (const { slot, from, fromSlot, forceDouble, counter } of this.writes) {
        if (this.kinds.get(slot) !== "int" || this.isForced(slot)) continue;
        // An Int slot holds less than 2^30 (see intBound): a value that may not (`a + b`, `x | 0`) makes it a Double.
        // A counter only while an Int bounds it (adapters2: Kotlin's Int is 32 bits; `n++` 2^31 times must not wrap).
        const whole = counter !== undefined
          ? counter !== null && this.numKind(counter) === "int" && this.intBound(counter) < 2 ** 30 + 2 ** 16
          : !forceDouble && (from ? this.numKind(from) === "int" && this.intBound(from) < 2 ** 30 + 2 ** 16 : !!fromSlot && this.slotKind(fromSlot) === "int");
        if (!whole) {
          this.kinds.set(slot, "double");
          changed = true;
        }
      }
    }
  }

  /** `x++`, `--x`, `x += 1`, `x -= 2` (a literal step): what it counts and which way. */
  private counterStep(node: ts.Node): { target: ts.Expression; up: boolean } | undefined {
    const K = ts.SyntaxKind;
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === K.PlusPlusToken || node.operator === K.MinusMinusToken)) {
      return { target: node.operand, up: node.operator === K.PlusPlusToken };
    }
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === K.PlusEqualsToken || node.operatorToken.kind === K.MinusEqualsToken)) {
      let r = node.right;
      while (ts.isParenthesizedExpression(r)) r = r.expression;
      if (ts.isNumericLiteral(r)) return { target: node.left, up: node.operatorToken.kind === K.PlusEqualsToken };
    }
    return undefined;
  }

  /**
   * What bounds a counter: a loop around the step (in the same function) whose condition, or one of its `&&` parts,
   * is `x < b` / `x <= b` (counting up; `>` / `>=` down), b then an Int expression (inferNumbers checks its kind).
   * ponytail: a step inside an inner endless loop of that loop is taken as bounded by the outer condition.
   */
  private counterBound(node: ts.Node, slot: ts.Symbol, up: boolean): ts.Expression | undefined {
    const K = ts.SyntaxKind;
    const isSlot = (n: ts.Expression) => {
      while (ts.isParenthesizedExpression(n)) n = n.expression;
      return this.checker.getSymbolAtLocation(ts.isPropertyAccessExpression(n) ? n.name : n) === slot;
    };
    const bound = (c: ts.Expression): ts.Expression | undefined => {
      while (ts.isParenthesizedExpression(c)) c = c.expression;
      if (!ts.isBinaryExpression(c)) return undefined;
      const op = c.operatorToken.kind;
      if (op === K.AmpersandAmpersandToken) return bound(c.left) ?? bound(c.right);
      const below = op === K.LessThanToken || op === K.LessThanEqualsToken;
      const above = op === K.GreaterThanToken || op === K.GreaterThanEqualsToken;
      if (isSlot(c.left) && (up ? below : above)) return c.right;
      if (isSlot(c.right) && (up ? above : below)) return c.left;
      return undefined;
    };
    for (let n: ts.Node | undefined = node.parent; n && !ts.isFunctionLike(n) && !ts.isSourceFile(n); n = n.parent) {
      const c = ts.isForStatement(n) ? n.condition : ts.isWhileStatement(n) || ts.isDoStatement(n) ? n.expression : undefined;
      const b = c && bound(c);
      if (b) return b;
    }
    return undefined;
  }

  private isForced(slot: Slot): boolean {
    if (this.sized.has(slot)) return true;
    const decl = "declarations" in slot ? slot.valueDeclaration : slot;
    return !!decl && "type" in decl && this.forcedKind((decl as ts.VariableDeclaration).type) !== undefined;
  }

  /** The numeric kind of a slot: the API's declared alias, a forced annotation, or the inferred kind. */
  private slotKind(slot: Slot): NumKind {
    const symbol = "declarations" in slot ? this.resolveAlias(slot) : undefined;
    if (symbol) {
      const decl = symbol.valueDeclaration ?? symbol.declarations?.[0];
      if (decl && this.isApi(decl)) {
        const typeNode = (decl as ts.ParameterDeclaration).type;
        return typeNode && ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName) && typeNode.typeName.text === "Int" ? "int" : "double";
      }
      return this.kinds.get(symbol) ?? "double";
    }
    return this.kinds.get(slot) ?? "double";
  }

  /**
   * A write that can grow a number past 32 bits however small its inputs: the slot multiplied (`p *= 3`,
   * `f = f * i`), or added to by a non-literal amount (`sum += x`, `b = a + b`). The slot is then a Double, exact
   * to 2^53 as in JavaScript. Counting by a literal (`i += 2`, `n = n - 1`) stays an Int.
   */
  private accumulates(node: ts.BinaryExpression, slot: ts.Symbol): boolean {
    const skip = (n: ts.Expression): ts.Expression => (ts.isParenthesizedExpression(n) ? skip(n.expression) : n);
    const isSlot = (n: ts.Expression) => {
      n = skip(n);
      return this.checker.getSymbolAtLocation(ts.isPropertyAccessExpression(n) ? n.name : n) === slot;
    };
    const literal = (n: ts.Expression) => ts.isNumericLiteral(skip(n));
    const kind = node.operatorToken.kind;
    if (kind === ts.SyntaxKind.AsteriskEqualsToken) return true;
    if (kind === ts.SyntaxKind.PlusEqualsToken || kind === ts.SyntaxKind.MinusEqualsToken) return !literal(node.right);
    const right = skip(node.right);
    if (kind !== ts.SyntaxKind.EqualsToken || !ts.isBinaryExpression(right)) return false;
    const [l, r] = [right.left, right.right];
    if (right.operatorToken.kind === ts.SyntaxKind.AsteriskToken) return isSlot(l) || isSlot(r);
    if (right.operatorToken.kind === ts.SyntaxKind.PlusToken) return (isSlot(l) && !literal(r)) || (isSlot(r) && !literal(l));
    if (right.operatorToken.kind === ts.SyntaxKind.MinusToken) return isSlot(l) && !literal(r);
    return false;
  }

  /** The magnitude an arithmetic of literals and constants of literals can reach, when it is known statically. */
  private constBound(node: ts.Expression, depth = 0): number | undefined {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    if (depth > 8) return undefined;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken)) return this.constBound(node.operand, depth + 1);
    if (ts.isIdentifier(node)) {
      const decl = this.checker.getSymbolAtLocation(node)?.valueDeclaration;
      const isConst = decl && ts.isVariableDeclaration(decl) && ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const;
      return isConst && (decl as ts.VariableDeclaration).initializer ? this.constBound((decl as ts.VariableDeclaration).initializer!, depth + 1) : undefined;
    }
    if (!ts.isBinaryExpression(node)) return undefined;
    const [l, r] = [this.constBound(node.left, depth + 1), this.constBound(node.right, depth + 1)];
    if (l === undefined || r === undefined) return undefined;
    switch (node.operatorToken.kind) {
      case ts.SyntaxKind.PlusToken:
      case ts.SyntaxKind.MinusToken:
        return Math.abs(l) + Math.abs(r);
      case ts.SyntaxKind.AsteriskToken:
        return Math.abs(l) * Math.abs(r);
      case ts.SyntaxKind.PercentToken:
        return Math.abs(r);
      default:
        return undefined;
    }
  }

  /**
   * The largest magnitude an Int expression can reach. An Int slot (variable, parameter, field, result) holds less than
   * 2^30, which the slot rules keep (`inferNumbers`: a write that could pass it makes the slot a Double); counting by a
   * small literal (`i + 1`, `n - 2`) keeps a slot's bound, as `i++` does (the one ceiling: counting past 2^30).
   */
  private intBound(node: ts.Expression, depth = 0): number {
    while (ts.isParenthesizedExpression(node) || ts.isAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
    const known = this.constBound(node);
    if (known !== undefined) return Math.abs(known);
    const size = this.storedSize(node);
    if (size) return SIZED[size].int ? Math.max(-SIZED[size].lo, SIZED[size].hi) : Infinity;
    if (depth > 8) return Infinity;
    if (ts.isCallExpression(node) && this.isMathCall(node)) {
      const r = this.numRange(node);
      return r.nan ? Infinity : Math.max(-r.lo, r.hi);
    }
    const b = (n: ts.Expression) => this.intBound(n, depth + 1);
    const literal = (n: ts.Expression): number | undefined => {
      while (ts.isParenthesizedExpression(n)) n = n.expression;
      return ts.isNumericLiteral(n) ? Number(n.text) : undefined;
    };
    const small = (n: ts.Expression) => (literal(n) ?? Infinity) < 2 ** 16;
    if (ts.isPrefixUnaryExpression(node)) return node.operator === ts.SyntaxKind.TildeToken ? 2 ** 31 : b(node.operand);
    if (ts.isConditionalExpression(node)) return Math.max(b(node.whenTrue), b(node.whenFalse));
    const element = this.taIntRead(node);
    if (element !== undefined) return element;
    if (ts.isBinaryExpression(node)) {
      const [l, r] = [node.left, node.right];
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
        case ts.SyntaxKind.MinusToken:
          return small(r) ? b(l) : small(l) && node.operatorToken.kind === ts.SyntaxKind.PlusToken ? b(r) : b(l) + b(r);
        case ts.SyntaxKind.AsteriskToken:
          return b(l) * b(r);
        case ts.SyntaxKind.PercentToken:
          return Math.min(b(l), b(r));
        // A mask keeps the bits it has (`x & 0xff`), a right shift halves (`x >> 1`); the rest are any 32-bit value.
        case ts.SyntaxKind.AmpersandToken:
          return Math.min(literal(l) ?? 2 ** 31, literal(r) ?? 2 ** 31);
        case ts.SyntaxKind.GreaterThanGreaterThanToken: {
          const by = this.constBound(r);
          return by !== undefined && by >= 1 && by < 32 ? 2 ** (31 - by) : 2 ** 31;
        }
        case ts.SyntaxKind.BarToken:
        case ts.SyntaxKind.CaretToken:
        case ts.SyntaxKind.LessThanLessThanToken:
          return 2 ** 31;
        case ts.SyntaxKind.CommaToken:
          return b(r);
        case ts.SyntaxKind.QuestionQuestionToken:
        case ts.SyntaxKind.BarBarToken:
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return Math.max(b(l), b(r));
        default:
          return this.isAssignment(node.operatorToken.kind) ? b(r) : 2 ** 30 - 1;
      }
    }
    return 2 ** 30 - 1;
  }

  /**
   * `(seed * 31 + 11) % 100003`: Ints whose `+ - *` may pass 32 bits (but not 2^53, so they are exact everywhere) taken
   * `%` an Int under 2^30: the result is an Int, computed in 64 bits (`int.wideRem`) instead of making the slot a Double.
   */
  private isWideRem(node: ts.BinaryExpression): boolean {
    if (node.operatorToken.kind !== ts.SyntaxKind.PercentToken || this.numKind(node.right) !== "int" || this.intBound(node.right) >= 2 ** 30 || this.mayBeZero(node.right)) return false;
    const wide = (n: ts.Expression): boolean => {
      while (ts.isParenthesizedExpression(n)) n = n.expression;
      if (this.numKind(n) === "int") return true;
      const k = ts.isBinaryExpression(n) ? n.operatorToken.kind : undefined;
      return (k === ts.SyntaxKind.PlusToken || k === ts.SyntaxKind.MinusToken || k === ts.SyntaxKind.AsteriskToken) && wide((n as ts.BinaryExpression).left) && wide((n as ts.BinaryExpression).right) && this.intBound(n) < 2 ** 53;
    };
    return this.numKind(node.left) !== "int" && wide(node.left);
  }

  /** An Int expression of `isWideRem`'s dividend: its `+ - *` stay Int IR (the printers widen them). */
  private wideInt(node: ts.Expression, ctx: Ctx): Expr {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    if (this.numKind(node) === "int" || !ts.isBinaryExpression(node)) return this.expr(node, ctx, T.int);
    const op = node.operatorToken.getText() as "+" | "-" | "*";
    return { e: "bin", op, l: this.wideInt(node.left, ctx), r: this.wideInt(node.right, ctx) };
  }

  /** Whether a number may be 0 (or NaN): its range, when known, says it can't. */
  private mayBeZero(node: ts.Expression): boolean {
    const r = this.numRange(node);
    return r.nan || (r.lo <= 0 && r.hi >= 0);
  }

  /** Whether a numeric expression is always whole, given the slots' current kinds. */
  private numKind(node: ts.Expression): NumKind {
    // An Int holds what fits in 32 bits (Kotlin's Int) with room for one more addition: a whole literal from 2^30 is a
    // Double, exact to 2^53 as in JavaScript (`0x7fffffff + 1` is 2147483648, not an overflow).
    // TypeScript gives every literal's text as JavaScript prints its value (`0b1010`, `0o744`, `1_000`, `1e3`, `0xff` → "10",
    // "484", "1000", "1000", "255"), so the text says whether it is whole.
    if (ts.isNumericLiteral(node)) return /^\d+$/.test(node.text) && Number(node.text) < 2 ** 30 ? "int" : "double";
    const size = this.storedSize(node);
    if (size) return SIZED[size].int ? "int" : "double";
    if (ts.isParenthesizedExpression(node) || ts.isAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.numKind(node.expression);
    }
    if (ts.isAwaitExpression(node)) return this.numKind(node.expression);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.TildeToken) return "int";
    // `-0` is a Double (an Int has no negative zero: `1 / -0` is -Infinity).
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand) && Number(node.operand.text) === 0) return "double";
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) return this.numKind(node.operand);
    if (ts.isConditionalExpression(node)) return this.numKind(node.whenTrue) === "int" && this.numKind(node.whenFalse) === "int" ? "int" : "double";
    if (this.taIntRead(node) !== undefined) return "int";
    if (ts.isBinaryExpression(node)) {
      // A constant -0 (`-4 % 2`, `0 * -1`): an Int has no negative zero.
      const [cl, cr] = [this.constValue(node.left), this.constValue(node.right)];
      if (typeof cl === "number" && typeof cr === "number") {
        const k = node.operatorToken.kind;
        if (Object.is(k === ts.SyntaxKind.PercentToken ? cl % cr : k === ts.SyntaxKind.AsteriskToken ? cl * cr : 1, -0)) return "double";
      }
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.AsteriskToken:
        case ts.SyntaxKind.PlusToken:
        case ts.SyntaxKind.MinusToken:
        case ts.SyntaxKind.PercentToken: {
          // `a % b` of a divisor that may be 0 is NaN in JavaScript: a Double (fmod gives NaN; an Int would trap).
          if (node.operatorToken.kind === ts.SyntaxKind.PercentToken && this.mayBeZero(node.right)) return "double";
          if (this.isWideRem(node)) return "int";
          // Constants known to leave an Int's range (`65536 * 65536`) make a Double. Otherwise the result must fit Kotlin's
          // 32-bit Int: `a + b` and `i * 2` of Int slots do, `a * b` and `a + b + c` may not (and a product may pass 2^53,
          // where JavaScript rounds): those are computed in Doubles.
          if (this.numKind(node.left) !== "int" || this.numKind(node.right) !== "int") return "double";
          const big = this.constBound(node);
          if (big !== undefined) return big < 2 ** 30 ? "int" : "double";
          return node.operatorToken.kind === ts.SyntaxKind.PercentToken || this.intBound(node) <= 2 ** 31 - 1 ? "int" : "double";
        }
        case ts.SyntaxKind.AmpersandToken:
        case ts.SyntaxKind.BarToken:
        case ts.SyntaxKind.CaretToken:
        case ts.SyntaxKind.LessThanLessThanToken:
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return "int";
        case ts.SyntaxKind.CommaToken:
          return this.numKind(node.right);
        case ts.SyntaxKind.QuestionQuestionToken:
        case ts.SyntaxKind.BarBarToken:
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return this.numKind(node.left) === "int" && this.numKind(node.right) === "int" ? "int" : "double";
        default:
          // `a = b` is b; `a += b` (and the other compound ones) is a's new value, of a's kind.
          return node.operatorToken.kind === ts.SyntaxKind.EqualsToken ? this.numKind(node.right) : this.isAssignment(node.operatorToken.kind) ? this.numKind(node.left) : "double";
      }
    }
    if (ts.isIdentifier(node)) {
      // `{ level }`: the value is the variable, not the literal's property.
      const symbol = ts.isShorthandPropertyAssignment(node.parent) ? this.checker.getShorthandAssignmentValueSymbol(node.parent) : this.checker.getSymbolAtLocation(node);
      return symbol ? this.slotKind(symbol) : "double";
    }
    if (ts.isPropertyAccessExpression(node)) {
      const member = this.enumValue(node);
      if (member !== undefined) return typeof member === "number" && Number.isInteger(member) ? "int" : "double";
      if (node.name.text === "length" && this.isSequence(this.checker.getNonNullableType(this.typeOf(node.expression)))) return "int";
      if (node.name.text === "size" && this.mcKind(this.checker.getNonNullableType(this.typeOf(node.expression)))) return "int";
      if (["length", "byteLength", "byteOffset", "BYTES_PER_ELEMENT"].includes(node.name.text) && (this.isTypedArray(this.typeOf(node.expression)) || (ts.isIdentifier(node.expression) && node.expression.text in TYPED_ARRAYS))) return "int";
      const symbol = this.checker.getSymbolAtLocation(node.name);
      return symbol ? this.slotKind(symbol) : "double";
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isPropertyAccessExpression(callee)) {
        const name = callee.name.text;
        if (ts.isIdentifier(callee.expression) && callee.expression.text === "Math") {
          // Math.sign(NaN) is NaN: a Double.
          if (["floor", "ceil", "round", "trunc"].includes(name)) return this.isWholeMath(node) ? "int" : "double";
          if (name === "imul" || name === "clz32") return "int";
          if (["max", "min", "abs"].includes(name)) return node.arguments.length && node.arguments.every((a) => this.numKind(a) === "int") ? "int" : "double";
          return "double";
        }
        // Of an array or a string (an app class's own `indexOf` has its own kind: its declaration's).
        if (["indexOf", "findIndex", "lastIndexOf", "findLastIndex"].includes(name) && !this.objectClassMethod(callee)) return "int";
        if (["push", "unshift"].includes(name) && this.isArray(this.checker.getNonNullableType(this.typeOf(callee.expression)))) return "int";
      }
      const declaration = this.checker.getResolvedSignature(node)?.getDeclaration();
      if (declaration && !this.isApi(declaration) && !declaration.getSourceFile().isDeclarationFile) return this.kinds.get(declaration) ?? "double";
      return "double";
    }
    return "double";
  }

  // -------------------------------------------------------------------------
  // Sized numbers (`Int8`…`Float32`; src/index.ts): storage types. A read is an Int or a Double (`numCast`), so
  // arithmetic is unchanged; a write must provably fit (`numRange`), because JavaScript keeps the number as it is.
  // -------------------------------------------------------------------------

  /** The sized slot an expression reads: a variable, parameter or field, a function's result, or an `Int8[]` element. */
  private storedSize(node: ts.Expression): SizedNum | undefined {
    if (ts.isNonNullExpression(node) && ts.isElementAccessExpression(node.expression)) node = node.expression;
    if (ts.isIdentifier(node)) {
      const symbol = this.valueSymbol(node);
      return symbol && this.sized.get(symbol);
    }
    if (ts.isPropertyAccessExpression(node)) {
      const symbol = this.sizedKey(this.checker.getSymbolAtLocation(node.name));
      return symbol && this.sized.get(symbol);
    }
    if (ts.isElementAccessExpression(node)) return this.storedArray(node.expression);
    if (ts.isCallExpression(node)) {
      const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
      return decl && this.sized.get(decl);
    }
    return undefined;
  }

  /** An array literal: its elements (and spread arrays) are converted one by one into the array type it goes to. */
  private freshArray(node: ts.Expression): boolean {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    return ts.isArrayLiteralExpression(node);
  }

  private forEachNode(node: ts.Node, fn: (n: ts.Node) => void) {
    fn(node);
    ts.forEachChild(node, (c) => this.forEachNode(c, fn));
  }

  /** Writes into sized slots that can't be checked as one value (run after collect() declared every slot). */
  private rejectSized(node: ts.Node) {
    const target = (n: ts.Expression) => this.storedSize(n) ?? (ts.isElementAccessExpression(n) ? this.storedArray(n.expression) : undefined);
    const increment = (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken);
    if (increment || (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind) && node.operatorToken.kind !== ts.SyntaxKind.EqualsToken)) {
      const t = increment ? (node as ts.PrefixUnaryExpression).operand : (node as ts.BinaryExpression).left;
      const n = target(t);
      if (n) this.error(node, `\`${node.getText()}\` may leave ${n}'s range, where JavaScript keeps counting: write the new value out and make it fit (\`x = ${SIZED[n].wrap.replace("x", "(x + 1)")}\`), or make it a number.`);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && (ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left))) {
      const hit = (n: ts.Node): boolean => (ts.isExpression(n) && !!target(n)) || !!ts.forEachChild(n, hit);
      if (hit(node.left)) this.error(node, "Destructuring into a sized number (Int8…Float32) is not supported natively: assign each one.");
    }
    if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && this.storedArray(node.initializer)) {
      this.error(node.name, `Destructuring ${this.an(this.storedArray(node.initializer)!)}[] is not supported natively: read xs[0]!, xs[1]!…`);
    }
    if (ts.isForOfStatement(node) && this.storedArray(node.expression)) {
      this.error(node.expression, `for…of over ${this.an(this.storedArray(node.expression)!)}[] is not supported natively: use an index loop (\`for (let i = 0; i < xs.length; i++) … xs[i]!\`).`);
    }
  }

  /** The element type of an `Int8[]` an expression reads. */
  private storedArray(node: ts.Expression): SizedNum | undefined {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) node = node.expression;
    if (ts.isIdentifier(node)) {
      const symbol = this.valueSymbol(node);
      return symbol && this.sizedArrays.get(symbol);
    }
    if (ts.isPropertyAccessExpression(node)) {
      const symbol = this.sizedKey(this.checker.getSymbolAtLocation(node.name));
      return symbol && this.sizedArrays.get(symbol);
    }
    if (ts.isCallExpression(node)) {
      const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
      return decl && this.sizedArrays.get(decl);
    }
    return undefined;
  }

  /** A property read can give a transient copy of the declared symbol (a readonly parameter property): its root. */
  private sizedKey(symbol: ts.Symbol | undefined): ts.Symbol | undefined {
    if (!symbol || this.sized.has(symbol) || this.sizedArrays.has(symbol) || !(symbol.flags & ts.SymbolFlags.Transient)) return symbol;
    return this.checker.getRootSymbols(symbol).find((s) => this.sized.has(s) || this.sizedArrays.has(s)) ?? symbol;
  }

  private an(n: SizedNum): string {
    return `${n.startsWith("U") ? "a" : "an"} ${n}`;
  }

  /** The native type of a sized slot. */
  private sizedTy(slot: Slot | undefined): Ty | undefined {
    if (!slot) return undefined;
    const n = this.sized.get(slot);
    if (n) return { k: "num", n };
    const elem = this.sizedArrays.get(slot);
    return elem ? T.array({ k: "num", n: elem }) : undefined;
  }

  /** A read of a sized slot, as the Int or Double arithmetic takes. */
  private widen(node: ts.Expression, x: Expr): Expr {
    const n = this.storedSize(node);
    if (!n || this.isNullable(this.typeOf(node)) || ts.isExpressionStatement(node.parent)) return x;
    return { e: "numCast", x, from: { k: "num", n }, to: SIZED[n].int ? T.int : T.double };
  }

  /** A value going into a sized slot: checked to fit as it is (else a compile error), then converted. */
  private narrow(x: Expr, node: ts.Expression, to: Extract<Ty, { k: "num" }>): Expr {
    // A read of the same type stays as it is; of another sized type it converts directly.
    if (x.e === "numCast" && x.from.k === "num") {
      if (x.from.n === to.n) return x.x;
    }
    const why = this.misfit(node, to.n);
    if (why) return this.error(node, why, to.n === "Int64" ? undefined : SIZED[to.n].wrap.replace("x", /^[\w.]+$/.test(node.getText()) ? node.getText() : `(${node.getText()})`));
    if (x.e === "numCast" && x.from.k === "num") return { ...x, to };
    const arith = SIZED[to.n].int ? T.int : T.double;
    return { e: "numCast", x: this.coerce(x, node, arith), from: arith, to };
  }

  /** Why `node` may hold a value a slot of type `n` can't keep exactly (undefined: it always fits). */
  private misfit(node: ts.Expression, n: SizedNum): string | undefined {
    const text = node.getText();
    const short = text.length > 40 ? "x" : text;
    const subject = text.length > 40 ? "This value" : `\`${text}\``;
    const wrap = SIZED[n].wrap.replace("x", /^[\w.]+$/.test(short) ? short : `(${short})`);
    if (n === "Float32") {
      if (this.isFloat32(node)) return undefined;
      return `${subject} may not be a 32-bit float: a Float32 holds what Math.fround returns, and JavaScript rounds nothing by itself. Write \`${wrap}\` (or keep it a number).`;
    }
    const r = this.numRange(node);
    const { lo, hi } = SIZED[n];
    if (r.whole && r.lo >= lo && r.hi <= hi) return undefined;
    const range = n === "Int64" ? "a whole number under 2^63" : `${lo}…${hi}`;
    const known = r.whole && Number.isFinite(r.lo) && Number.isFinite(r.hi) ? ` (it can be ${r.lo}…${r.hi})` : r.whole ? "" : " (it may not be a whole number)";
    const fix = n === "Int64"
      ? "Keep it a number (a Double, exact to 2^53), or store a value known to be whole and bounded (`x | 0`, `x >>> 0`, a Math.min/max clamp of whole numbers)."
      : `Wrap it explicitly (\`${wrap}\`), clamp a whole number (\`Math.min(Math.max(${short}, ${lo}), ${hi})\`), or keep it a number.`;
    return `${subject} may not fit ${n} (${range})${known}: JavaScript keeps the number as it is, the native ${n} can't. ${fix}`;
  }

  /** A value JavaScript already rounded to a 32-bit float: Math.fround, a Float32, a literal a float holds, a whole number to 2^24. */
  private isFloat32(node: ts.Expression): boolean {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAssertionExpression(node) || ts.isSatisfiesExpression(node)) node = node.expression;
    if (this.storedSize(node) === "Float32") return true;
    if (ts.isConditionalExpression(node)) return this.isFloat32(node.whenTrue) && this.isFloat32(node.whenFalse);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "fround" && this.isMathCall(node)) return true;
    const c = this.constValue(node);
    if (typeof c === "number") return Object.is(Math.fround(c), c);
    const r = this.numRange(node);
    return r.whole && r.lo >= -(2 ** 24) && r.hi <= 2 ** 24;
  }

  /**
   * `Math.floor/ceil/round/trunc(x)` is an Int only when x can't be NaN or ±Infinity and the result fits 32 bits (else
   * JavaScript's NaN, Infinity or a huge whole number would trap, become 0 or saturate natively): it stays a Double.
   */
  private isWholeMath(node: ts.CallExpression): boolean {
    const a = node.arguments.length === 1 ? this.numRange(node.arguments[0]!) : ANY_NUM;
    return !a.nan && Math.floor(a.lo) >= -(2 ** 31) && Math.ceil(a.hi) <= 2 ** 31 - 1;
  }

  private isMathCall(node: ts.CallExpression): boolean {
    return ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Math" && !this.checker.getSymbolAtLocation(node.expression.expression)?.declarations?.some((d) => !d.getSourceFile().isDeclarationFile);
  }

  /**
   * What a number expression can be, as JavaScript computes it: literals and constants, sized slots (their type's
   * range), Int slots (under 2^30, the Int rule), `+ - *`, `%` by a constant, the bitwise operators (ToInt32), ternaries,
   * Math.min / max / abs / floor / ceil / round / trunc, `.length`. Anything else may be any number, or NaN.
   */
  private numRange(node: ts.Expression, depth = 0): NumRange {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAssertionExpression(node) || ts.isSatisfiesExpression(node)) {
      if (ts.isNonNullExpression(node) && ts.isElementAccessExpression(node.expression)) break;
      node = node.expression;
    }
    if (depth > 16) return ANY_NUM;
    const c = this.constValue(node);
    if (typeof c === "number") return Number.isNaN(c) ? ANY_NUM : { lo: c, hi: c, whole: Number.isInteger(c), nan: false };
    const size = this.storedSize(node);
    if (size) return size === "Float32" ? ANY_NUM : { lo: SIZED[size].lo, hi: SIZED[size].hi, whole: true, nan: false };
    const r = (n: ts.Expression) => this.numRange(n, depth + 1);
    const span = (values: number[], whole: boolean, nan: boolean): NumRange => {
      if (nan || values.some(Number.isNaN)) return ANY_NUM;
      const lo = Math.min(...values), hi = Math.max(...values);
      return { lo, hi, whole: whole && Number.isFinite(lo) && Number.isFinite(hi), nan: false };
    };
    const INT32: NumRange = { lo: -(2 ** 31), hi: 2 ** 31 - 1, whole: true, nan: false };
    const int32 = (a: NumRange) => a.whole && a.lo >= INT32.lo && a.hi <= INT32.hi;
    const shift = (n: ts.Expression) => {
      const k = this.constValue(n);
      return typeof k === "number" && Number.isInteger(k) && k >= 0 && k < 32 ? k : undefined;
    };
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.MinusToken) {
        const a = r(node.operand);
        return { lo: -a.hi, hi: -a.lo, whole: a.whole, nan: a.nan };
      }
      if (node.operator === ts.SyntaxKind.TildeToken) return INT32;
      return ANY_NUM;
    }
    if (ts.isConditionalExpression(node)) {
      const [a, b] = [r(node.whenTrue), r(node.whenFalse)];
      return span([a.lo, a.hi, b.lo, b.hi], a.whole && b.whole, a.nan || b.nan);
    }
    if (ts.isBinaryExpression(node)) {
      const k = node.operatorToken.kind;
      if (k === ts.SyntaxKind.CommaToken) return r(node.right);
      const [a, b] = [r(node.left), r(node.right)];
      const nan = a.nan || b.nan;
      switch (k) {
        case ts.SyntaxKind.PlusToken:
          if (!this.isNumber(this.typeOf(node))) return ANY_NUM;
          return span([a.lo + b.lo, a.hi + b.hi], a.whole && b.whole, nan);
        case ts.SyntaxKind.MinusToken:
          return span([a.lo - b.hi, a.hi - b.lo], a.whole && b.whole, nan);
        case ts.SyntaxKind.AsteriskToken:
          return span([a.lo * b.lo, a.lo * b.hi, a.hi * b.lo, a.hi * b.hi], a.whole && b.whole, nan);
        // A divisor that can't be 0 (or straddle it): the quotient lies between the corners' quotients.
        case ts.SyntaxKind.SlashToken:
          if (b.lo <= 0 && b.hi >= 0) return ANY_NUM;
          return span([a.lo / b.lo, a.lo / b.hi, a.hi / b.lo, a.hi / b.hi], false, nan);
        case ts.SyntaxKind.PercentToken: {
          // The sign of the dividend, smaller than the divisor.
          const m = this.constValue(node.right);
          if (typeof m !== "number" || !Number.isInteger(m) || m === 0 || !a.whole) return ANY_NUM;
          const most = Math.abs(m) - 1;
          return { lo: a.lo < 0 ? Math.max(a.lo, -most) : 0, hi: a.hi > 0 ? Math.min(a.hi, most) : 0, whole: true, nan: false };
        }
        case ts.SyntaxKind.AmpersandToken: {
          const masks = [a, b].filter((x) => int32(x) && x.lo >= 0);
          return masks.length ? { lo: 0, hi: Math.min(...masks.map((x) => x.hi)), whole: true, nan: false } : INT32;
        }
        case ts.SyntaxKind.BarToken:
        case ts.SyntaxKind.CaretToken:
          if (int32(a) && int32(b) && a.lo >= 0 && b.lo >= 0) return { lo: 0, hi: 2 ** Math.ceil(Math.log2(Math.max(a.hi, b.hi) + 1)) - 1, whole: true, nan: false };
          return INT32;
        case ts.SyntaxKind.LessThanLessThanToken: {
          const by = shift(node.right);
          if (by !== undefined && int32(a) && a.lo * 2 ** by >= INT32.lo && a.hi * 2 ** by <= INT32.hi) return { lo: a.lo * 2 ** by, hi: a.hi * 2 ** by, whole: true, nan: false };
          return INT32;
        }
        case ts.SyntaxKind.GreaterThanGreaterThanToken: {
          const by = shift(node.right);
          if (by === undefined) return INT32;
          const base = int32(a) ? a : INT32;
          return { lo: Math.floor(base.lo / 2 ** by), hi: Math.floor(base.hi / 2 ** by), whole: true, nan: false };
        }
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken: {
          const by = shift(node.right);
          if (by === undefined) return { lo: 0, hi: 2 ** 32 - 1, whole: true, nan: false };
          if (int32(a) && a.lo >= 0) return { lo: Math.floor(a.lo / 2 ** by), hi: Math.floor(a.hi / 2 ** by), whole: true, nan: false };
          return { lo: 0, hi: 2 ** (32 - by) - 1, whole: true, nan: false };
        }
        case ts.SyntaxKind.QuestionQuestionToken:
        case ts.SyntaxKind.BarBarToken:
        case ts.SyntaxKind.AmpersandAmpersandToken:
          return span([a.lo, a.hi, b.lo, b.hi], a.whole && b.whole, nan);
        default:
          return ANY_NUM;
      }
    }
    if (ts.isCallExpression(node) && this.isMathCall(node)) {
      const name = (node.expression as ts.PropertyAccessExpression).name.text;
      const args = node.arguments.map(r);
      const nan = args.some((x) => x.nan);
      const whole = args.every((x) => x.whole);
      if (name === "min" && args.length) return span([Math.min(...args.map((x) => x.lo)), Math.min(...args.map((x) => x.hi))], whole, nan);
      if (name === "max" && args.length) return span([Math.max(...args.map((x) => x.lo)), Math.max(...args.map((x) => x.hi))], whole, nan);
      if (name === "random" && !args.length) return { lo: 0, hi: 1, whole: false, nan: false };
      const [a] = args;
      if (!a || args.length !== 1) return ANY_NUM;
      if (name === "abs") return span([a.lo <= 0 && a.hi >= 0 ? 0 : Math.min(Math.abs(a.lo), Math.abs(a.hi)), Math.max(Math.abs(a.lo), Math.abs(a.hi))], a.whole, a.nan);
      if (["floor", "ceil", "round", "trunc"].includes(name)) return span([Math.floor(a.lo), Math.ceil(a.hi)], true, a.nan);
      return ANY_NUM;
    }
    if (ts.isPropertyAccessExpression(node) && node.name.text === "length" && this.isSequence(this.checker.getNonNullableType(this.typeOf(node.expression)))) {
      return { lo: 0, hi: 2 ** 30, whole: true, nan: false };
    }
    // An Int variable, parameter, field or result holds a whole number under 2^30 (the Int rule, see intBound).
    if ((ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) && this.numKind(node) === "int") return { lo: -(2 ** 30), hi: 2 ** 30, whole: true, nan: false };
    return ANY_NUM;
  }

  // -------------------------------------------------------------------------
  // Types
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Exceptions: what can throw
  // -------------------------------------------------------------------------

  /**
   * Which functions can throw synchronously, so only those become throwing natively (Swift `throws`,
   * Rust `Result`; Kotlin needs nothing). A function throws when its body has a `throw`, or calls
   * something that throws, outside a try block with a catch. A function value throws as the function
   * it is; a function-typed variable, parameter or field throws when some value stored in it does
   * (`throwingSlots`), and calling it then throws. Members that are one native member, and the
   * constructors of a class hierarchy, throw together (`families`). Iterated to a fixpoint.
   */
  private inferThrows() {
    const bodies: ts.Node[] = [];
    const members: ts.Node[] = [];
    const flows: { slot: ts.Symbol; value: ts.Expression }[] = [];
    const links: [ts.Symbol, ts.Symbol][] = [];
    const union = (a: ts.Node, b: ts.Node) => {
      const [ra, rb] = [this.familyOf(a), this.familyOf(b)];
      if (ra !== rb) this.families.set(ra, rb);
    };
    const isFn = (t: ts.Type) => this.checker.getNonNullableType(t).getCallSignatures().length > 0;
    // Only the app's slots: what goes to the runtime is caught there (see uncaughtValue).
    const own = (s: ts.Symbol) => {
      const d = s.valueDeclaration ?? s.declarations?.[0];
      return !!d && !this.isApi(d) && !d.getSourceFile().isDeclarationFile;
    };
    const flow = (target: ts.Node | undefined, value: ts.Expression | undefined) => {
      const slot = target && this.checker.getSymbolAtLocation(target);
      if (slot && own(slot) && value && isFn(this.typeOf(value))) flows.push({ slot, value });
    };
    const visit = (node: ts.Node): void => {
      if (ts.isClassLike(node) || ((ts.isFunctionLike(node) && !ts.isConstructorDeclaration(node)) && (node as ts.FunctionLikeDeclaration).body)) bodies.push(node);
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && !this.functionSymbols.has(this.checker.getSymbolAtLocation(node.name)!)) flow(node.name, node.initializer);
      if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind)) flow(ts.isPropertyAccessExpression(node.left) ? node.left.name : node.left, node.right);
      if ((ts.isParameter(node) || ts.isPropertyDeclaration(node)) && node.initializer) flow(node.name, node.initializer);
      if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
        const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
        if (decl && !this.isApi(decl) && !decl.getSourceFile().isDeclarationFile) node.arguments?.forEach((arg, i) => flow(decl.parameters[i]?.name, arg));
      }
      if (ts.isObjectLiteralExpression(node)) {
        const ctx = this.checker.getContextualType(node);
        for (const prop of ctx ? node.properties : []) {
          if (!prop.name || !ts.isIdentifier(prop.name)) continue;
          const target = this.checker.getNonNullableType(ctx!).getProperty(prop.name.text);
          const decl = target?.valueDeclaration;
          // A function a protocol literal gives for a method is that method.
          const fn = ts.isMethodDeclaration(prop) ? prop : ts.isPropertyAssignment(prop) && this.isFunctionNode(prop.initializer) ? prop.initializer : undefined;
          if (fn && decl && ts.isMethodSignature(decl)) union(fn, decl);
          else if (!target || !own(target)) continue;
          else if (ts.isPropertyAssignment(prop) && isFn(this.typeOf(prop.initializer))) flows.push({ slot: target, value: prop.initializer });
          else if (target && ts.isShorthandPropertyAssignment(prop) && isFn(this.typeOf(prop.name))) flows.push({ slot: target, value: prop.name });
        }
      }
      // A callback's parameter holds what the parameter it is passed for holds.
      if (ts.isParameter(node) && ts.isIdentifier(node.name) && (ts.isArrowFunction(node.parent) || ts.isFunctionExpression(node.parent))) {
        const signature = this.checker.getContextualType(node.parent as ts.Expression);
        const source = signature && this.checker.getNonNullableType(signature).getCallSignatures()[0]?.getParameters()[node.parent.parameters.indexOf(node)];
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (source && symbol) links.push([symbol, source]);
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name) && ts.isConstructorDeclaration(node.parent) && ts.isParameterPropertyDeclaration(node, node.parent)) {
        const [param, field] = this.checker.getSymbolsOfParameterPropertyDeclaration(node, node.name.text);
        if (param && field) links.push([param, field], [field, param]);
      }
      ts.forEachChild(node, visit);
    };
    for (const sf of this.files) visit(sf);
    // Families: a member with what it overrides and implements (and a getter with its setter); a class with its base.
    for (const node of this.objectClasses.values()) {
      const base = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0];
      const baseSymbol = base && this.classRef(base.expression);
      const baseNode = baseSymbol && this.objectClasses.get(baseSymbol);
      if (baseNode) union(node, baseNode);
      for (const member of node.members) {
        if (!member.name || ts.isConstructorDeclaration(member) || ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) continue;
        members.push(member);
        for (const decl of this.checker.getSymbolAtLocation(member.name)?.declarations ?? []) union(member, decl);
        for (const other of ts.isIdentifier(member.name) ? this.counterparts(node, member.name.text) : []) for (const decl of other.declarations ?? []) (union(member, decl), members.push(decl));
      }
    }
    for (const node of this.protocols.values()) {
      for (const member of node.members) {
        if (!member.name || !ts.isIdentifier(member.name)) continue;
        for (const clause of node.heritageClauses ?? []) {
          for (const t of clause.types) for (const decl of this.checker.getTypeAtLocation(t).getProperty(member.name.text)?.declarations ?? []) union(member, decl);
        }
      }
    }
    for (let changed = true; changed; ) {
      changed = false;
      for (const node of bodies) {
        if (this.throws(node) || !this.bodyThrows(node)) continue;
        this.throwing.add(this.familyOf(node));
        changed = true;
      }
      for (const { slot, value } of flows) {
        // A slot read into one that throws throws too: natively both hold one function type.
        const from = this.slotOf(value);
        if (this.slotThrows(slot) && from && !this.slotThrows(from)) {
          this.throwingSlots.add(this.rootSymbol(from));
          changed = true;
        }
        if (this.slotThrows(slot) || !this.valueThrows(value)) continue;
        this.throwingSlots.add(this.rootSymbol(slot));
        changed = true;
      }
      for (const [to, from] of links) {
        if (this.slotThrows(to) || !this.slotThrows(from)) continue;
        this.throwingSlots.add(this.rootSymbol(to));
        changed = true;
      }
    }
    for (const member of members) {
      if (!this.throws(member)) continue;
      if (ts.isPropertySignature(member) || ts.isPropertyDeclaration(member)) this.error(member, `"${member.name.getText()}" is a field here and a getter or setter that can throw elsewhere: natively they are one property, which can't throw. Make the accessor catch, or use a method.`);
    }
  }

  /** The family a declaration belongs to (see `families`): its root. */
  private familyOf(node: ts.Node): ts.Node {
    let root = node;
    for (let up = this.families.get(root); up; up = this.families.get(root)) root = up;
    return root;
  }

  /** Whether a function, method, accessor, lambda or class (its constructor) can throw. */
  private throws(node: ts.Node | undefined): boolean {
    return !!node && this.throwing.has(this.familyOf(node));
  }

  private rootSymbol(symbol: ts.Symbol): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Transient ? (this.checker.getRootSymbols(symbol)[0] ?? symbol) : symbol;
  }

  private slotThrows(symbol: ts.Symbol | undefined): boolean {
    return !!symbol && this.throwingSlots.has(this.rootSymbol(symbol));
  }

  /** A body that can throw out of itself: a class's is its constructor and its field initializers. */
  private bodyThrows(node: ts.Node): boolean {
    if (ts.isClassLike(node)) {
      return node.members.some((m) => (ts.isConstructorDeclaration(m) && this.throwsOut(m)) || (ts.isPropertyDeclaration(m) && !(ts.getCombinedModifierFlags(m) & ts.ModifierFlags.Static) && !!m.initializer && this.throwsOut(m.initializer)));
    }
    if (this.asyncFunctions.has(node)) return false;
    return this.throwsOut((node as ts.FunctionLikeDeclaration).body!) || (node as ts.FunctionLikeDeclaration).parameters.some((p) => !!p.initializer && this.throwsOut(p.initializer));
  }

  /** Whether something under `node` (not in a nested function or class) can throw, outside a try block with a catch. */
  private throwsOut(node: ts.Node): boolean {
    const walk = (n: ts.Node): boolean => {
      if (ts.isTryStatement(n)) return (!n.catchClause && walk(n.tryBlock)) || (!!n.catchClause && walk(n.catchClause.block)) || (!!n.finallyBlock && walk(n.finallyBlock));
      if (this.throwPoint(n)) return true;
      if (ts.isClassLike(n) || ts.isFunctionLike(n)) return false;
      return !!ts.forEachChild(n, (c) => walk(c) || undefined);
    };
    return ts.isConstructorDeclaration(node) ? !!node.body && walk(node.body) || node.parameters.some((p) => !!p.initializer && walk(p.initializer)) : walk(node);
  }

  private throwPoint(n: ts.Node): boolean {
    if (ts.isThrowStatement(n) || this.bigThrows(n) || this.genThrowPoint(n) || this.jsonDateThrows(n) || (ts.isNewExpression(n) && this.libThrows(n))) return true;
    if (ts.isCallExpression(n)) return this.callThrows(n);
    if (ts.isNewExpression(n)) {
      const cls = this.classRef(n.expression);
      return this.throws(cls && this.objectClasses.get(cls));
    }
    if (ts.isPropertyAccessExpression(n) && !(ts.isCallExpression(n.parent) && n.parent.expression === n)) return this.accessorThrows(n);
    return false;
  }

  /** A getter or setter that can throw (read or written here). */
  private accessorThrows(node: ts.PropertyAccessExpression): boolean {
    const decls = this.checker.getSymbolAtLocation(node.name)?.declarations ?? [];
    return decls.some((d) => (ts.isGetAccessor(d) || ts.isSetAccessor(d)) && this.throws(d));
  }

  /** A call that can throw: of a function, method or function value that can, or an array method whose callback can. */
  private callThrows(node: ts.CallExpression): boolean {
    let callee: ts.Expression = node.expression;
    while (ts.isParenthesizedExpression(callee) || ts.isNonNullExpression(callee)) callee = callee.expression;
    if (callee.kind === ts.SyntaxKind.SuperKeyword) return false;
    const symbol = ts.isIdentifier(callee) ? this.resolveAlias(this.checker.getSymbolAtLocation(callee)) : ts.isPropertyAccessExpression(callee) ? this.checker.getSymbolAtLocation(callee.name) : undefined;
    const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    if (symbol && decl && !this.isApi(decl) && !decl.getSourceFile().isDeclarationFile) {
      // Calling a generator runs none of its body: its consumers throw (genThrowPoint).
      if (this.isGenFn(decl) || this.isGenFn(this.functionNodeOf(symbol))) return false;
      if (this.functionSymbols.has(symbol)) return this.throws(this.functionNodeOf(symbol));
      if (ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl)) return this.throws(decl);
      return this.slotThrows(symbol);
    }
    if (ts.isPropertyAccessExpression(callee) && ARRAY_CALLBACKS.has(callee.name.text) && this.isArray(this.checker.getNonNullableType(this.typeOf(callee.expression)))) {
      return node.arguments.some((a) => this.valueThrows(a));
    }
    if (ts.isPropertyAccessExpression(callee) && callee.name.text === "from" && ts.isIdentifier(callee.expression) && callee.expression.text === "Array" && node.arguments[1]) return this.valueThrows(node.arguments[1]);
    return this.strNumThrows(node) || this.libThrows(node);
  }

  /** The variable, parameter or field an expression reads a function value from, if it is one (not a declared function). */
  private slotOf(node: ts.Expression): ts.Symbol | undefined {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)) node = node.expression;
    const symbol = ts.isIdentifier(node) ? this.valueSymbol(node) : ts.isPropertyAccessExpression(node) ? this.checker.getSymbolAtLocation(node.name) : undefined;
    const decl = symbol?.valueDeclaration;
    if (!symbol || !decl || this.functionSymbols.has(symbol) || ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl) || this.isApi(decl) || decl.getSourceFile().isDeclarationFile) return undefined;
    return symbol;
  }

  /** Whether a function value can throw when called. */
  private valueThrows(node: ts.Expression): boolean {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)) node = node.expression;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return this.throws(node);
    if (ts.isConditionalExpression(node)) return this.valueThrows(node.whenTrue) || this.valueThrows(node.whenFalse);
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(node.operatorToken.kind)) {
      return this.valueThrows(node.left) || this.valueThrows(node.right);
    }
    const symbol = ts.isIdentifier(node) ? this.valueSymbol(node) : ts.isPropertyAccessExpression(node) ? this.checker.getSymbolAtLocation(node.name) : undefined;
    if (!symbol) return false;
    if (this.functionSymbols.has(symbol)) return this.throws(this.functionNodeOf(symbol));
    const decl = symbol.valueDeclaration;
    if (decl && (ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl))) return this.throws(decl);
    return this.slotThrows(symbol);
  }

  /** A function type stored in a slot that holds throwing functions throws (an optional one too). */
  private withThrows(ty: Ty, symbol: ts.Symbol | undefined): Ty {
    if (!this.slotThrows(symbol)) return ty;
    if (ty.k === "fn") return { ...ty, throws: true };
    if (ty.k === "optional" && ty.of.k === "fn") return { k: "optional", of: { ...ty.of, throws: true } };
    return ty;
  }

  /**
   * A top-level variable whose initial value can throw (rest): as in JavaScript, an error there is uncaught and stops
   * the program (natively a fatal error; JavaScript would stop loading the module).
   */
  private fatalInit(x: Expr, ty: Ty): Expr {
    const e = `e__${++this.temps}`;
    return { e: "call", callee: { e: "lambda", params: [], ret: ty, body: [{ s: "try", body: [{ s: "return", x }], catchName: e, catchBody: [{ s: "unreachable" }] }, { s: "unreachable" }] }, args: [] };
  }

  /** A static field's initial value: one that can throw is fatal if it does (rest2), as a top-level variable's (fatalInit). */
  private globalInit(init: ts.Expression, ctx: Ctx, ty: Ty): Expr {
    const x = this.expr(init, ctx, ty);
    return this.throwsOut(init) ? this.fatalInit(x, ty) : x;
  }

  /**
   * Where no JavaScript caller could catch (the top level, a handler the runtime calls), an uncaught error
   * is logged as the browser logs it (`Uncaught Error: …`) and what was running stops; what it changed stays.
   */
  private catchLog(body: Stmt[]): Stmt[] {
    const e = `e__${++this.temps}`;
    const message: Expr = { e: "tpl", parts: ["Uncaught ", { e: "op", op: "error.message", args: [{ e: "id", name: e }] }] };
    return [{ s: "try", body, catchName: e, catchBody: [{ s: "expr", x: { e: "rt", name: "log", args: [message] } }] }];
  }

  /** Whether IR statements can throw out of themselves (nested functions aside; a try's catch catches its body). */
  private irThrows(node: unknown): boolean {
    if (Array.isArray(node)) return node.some((n) => this.irThrows(n));
    if (!node || typeof node !== "object") return false;
    const x = node as { e?: string; s?: string; throws?: boolean; await?: boolean };
    if (x.e === "lambda" || x.s === "fn") return false;
    if (x.s === "throw" || x.s === "rethrow" || (x.e && x.throws)) return true;
    if (x.s === "try") {
      const t = node as Extract<Stmt, { s: "try" }>;
      return t.lowered ? this.irThrows(t.lowered) : this.irThrows(t.catchBody) || this.irThrows(t.finally);
    }
    return Object.values(node).some((v) => this.irThrows(v));
  }

  /**
   * A function value that can throw going where natively nothing can (`want` doesn't throw): a handler of the
   * runtime's that returns nothing catches and logs (`catchLog`); anything else is rejected.
   */
  private uncaughtValue(node: ts.Node): "log" | undefined {
    const ctxType = ts.isExpression(node) ? this.checker.getContextualType(node) : undefined;
    const t = ctxType && this.checker.getNonNullableType(ctxType);
    const decl = t && (t.aliasSymbol ?? t.getSymbol())?.declarations?.[0];
    const ret = t?.getCallSignatures()[0]?.getReturnType();
    if (decl && this.isApi(decl) && ret && ret.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined)) return "log";
    this.error(node, "This function can throw, and it is stored where natively a function can't (an array, a map, a returned function, or a callback of the runtime that returns a value). Catch inside it, or call it directly.");
    return undefined;
  }

  /**
   * `lowered` of a try statement with `finally` (see ir.ts): a return, break or continue that leaves the try
   * or catch block sets `fin__N` (and `ret__N`) and leaves the labelled block; an error from either sets
   * `err__N`. Then the finally block runs (its own return, break or throw take over, as in JavaScript), and
   * the recorded exit is taken.
   */
  private lowerFinally(st: Extract<Stmt, { s: "try" }>, ret: Ty): Stmt[] {
    const n = ++this.temps;
    const [fin, val, err, error] = [`fin__${n}`, `ret__${n}`, `err__${n}`, `e__${n}`];
    const id = (name: string): Expr => ({ e: "id", name });
    const set = (v: number): Stmt => ({ s: "assign", target: id(fin), op: "=", value: { e: "int", v: String(v) } });
    const leave: Stmt = { s: "break", label: `exit__${n}` };
    const used = new Set<number>();
    // A `break` / `continue` with the label of a statement around the try (none inside has it): 5, 6… in this list.
    const inside = labelsIn([...st.body, ...st.catchBody]);
    const jumps: Stmt[] = [];
    const jumpOut = (s: Stmt): Stmt[] => {
      let i = jumps.findIndex((j) => j.s === s.s && (j as { label?: string }).label === (s as { label?: string }).label);
      if (i < 0) i = jumps.push(s) - 1;
      return [set(5 + i), leave];
    };
    const exits = (stmts: Stmt[], inLoop: boolean, inSwitch: boolean): Stmt[] =>
      stmts.flatMap((s): Stmt[] => {
        switch (s.s) {
          case "return":
            used.add(1);
            // 0: a return with a value, kept in `ret__N`.
            if (s.x) used.add(0);
            return s.x ? [{ s: "assign", target: id(val), op: "=", value: s.x }, set(1), leave] : [set(1), leave];
          case "break":
            if (s.label) return inside.has(s.label) ? [s] : jumpOut(s);
            if (inLoop || inSwitch) return [s];
            used.add(2);
            return [set(2), leave];
          case "continue":
            if (s.label) return inside.has(s.label) ? [s] : jumpOut(s);
            if (inLoop) return [s];
            used.add(3);
            return [set(3), leave];
          case "if":
            return [{ ...s, then: exits(s.then, inLoop, inSwitch), else: s.else && exits(s.else, inLoop, inSwitch) }];
          case "while":
          case "forOf":
          case "forRange":
            return [{ ...s, body: exits(s.body, true, false) }];
          case "switch":
            return [{ ...s, cases: s.cases.map((c) => ({ ...c, body: exits(c.body, inLoop, true) })), default: s.default && exits(s.default, inLoop, true) }];
          case "try":
            return [s.lowered ? { ...s, lowered: exits(s.lowered, inLoop, inSwitch) } : { ...s, body: exits(s.body, inLoop, inSwitch), catchBody: exits(s.catchBody, inLoop, inSwitch) }];
          case "block":
            return [{ ...s, body: exits(s.body, inLoop, inSwitch) }];
          default:
            return [s];
        }
      });
    const body = exits(st.body, false, false);
    // No catch clause: the front-end made it `catch (e) { throw e }`, which the outer catch does anyway.
    const rethrows = st.catchBody.length === 1 && st.catchBody[0]!.s === "rethrow";
    const inner: Stmt[] = rethrows ? body : [{ s: "try", body, catchName: st.catchName, catchBody: exits(st.catchBody, false, false) }];
    const out: Stmt[] = [{ s: "let", name: fin, ty: T.int, init: { e: "int", v: "0" }, mutable: true }];
    if (used.has(0)) out.push({ s: "let", name: val, ty: T.optional(ret), mutable: true });
    // Swift rejects a `throw` where nothing can fail: the error is recorded only when the blocks can throw.
    const fails = this.irThrows(inner);
    if (fails) out.push({ s: "let", name: err, ty: T.optional(T.rt("Error")), mutable: true });
    const guarded: Stmt[] = fails ? [{ s: "try", body: inner, catchName: error, catchBody: [{ s: "assign", target: id(err), op: "=", value: id(error) }, set(4)] }] : inner;
    out.push({ s: "block", label: `exit__${n}`, body: guarded }, ...(st.finally ?? []));
    const when = (v: number, then: Stmt): Stmt => ({ s: "if", c: { e: "bin", op: "==", l: id(fin), r: { e: "int", v: String(v) } }, then: [then] });
    if (used.has(1)) out.push(when(1, { s: "return", x: !used.has(0) ? undefined : ret.k === "optional" ? id(val) : { e: "unwrap", x: id(val) } }));
    if (used.has(2)) out.push(when(2, { s: "break" }));
    if (used.has(3)) out.push(when(3, { s: "continue" }));
    jumps.forEach((j, i) => out.push(when(5 + i, j)));
    if (fails) out.push(when(4, { s: "rethrow", error: { e: "unwrap", x: id(err) } }));
    // Every way through the blocks leaves (as TypeScript saw): nothing follows the recorded exits.
    if ((this.abrupt(st.body) && this.abrupt(st.catchBody)) || this.abrupt(st.finally ?? [])) out.push({ s: "unreachable" });
    return out;
  }

  /** Whether a statement list never ends normally: it returns, throws, breaks or continues on every path. */
  private abrupt(stmts: Stmt[]): boolean {
    const last = stmts.at(-1);
    switch (last?.s) {
      case "return":
      case "throw":
      case "rethrow":
      case "break":
      case "continue":
      case "unreachable":
        return true;
      case "if":
        return this.abrupt(last.then) && this.abrupt(last.else ?? []);
      case "try":
        return (this.abrupt(last.body) && this.abrupt(last.catchBody)) || this.abrupt(last.finally ?? []);
      case "switch":
        return !!last.default && this.abrupt(last.default) && last.cases.every((c) => this.abrupt(c.body));
      default:
        return false;
    }
  }

  private typeOf(node: ts.Node): ts.Type {
    return this.bound(this.checker.getTypeAtLocation(node));
  }

  /** A type parameter as the instantiation being lowered binds it (followed through outer bindings). */
  private bound(type: ts.Type): ts.Type {
    for (let depth = 0; depth < 64 && type.flags & ts.TypeFlags.TypeParameter; depth++) {
      const next = type.symbol && this.env.get(type.symbol);
      if (!next) break;
      type = next;
    }
    // `NonNullable<T>` (what `xs[0] ?? null` gives in a generic) is `T & {}`: the bound T without null.
    if (type.isIntersection() && type.types.length === 2 && this.env.size) {
      const param = type.types.find((t) => t.flags & ts.TypeFlags.TypeParameter);
      const other = type.types.find((t) => t !== param);
      if (param && other && this.checker.typeToString(other) === "{}") return this.checker.getNonNullableType(this.bound(param));
    }
    return type;
  }

  /** A union's members, each bound. */
  private members(type: ts.Type): ts.Type[] {
    return type.isUnion() ? type.types.map((t) => this.bound(t)) : [type];
  }

  private nonNull(type: ts.Type): ts.Type {
    return this.bound(this.checker.getNonNullableType(this.bound(type)));
  }

  /** Lowers `run` with the type parameters of one instantiation bound. */
  private withEnv<R>(env: Map<ts.Symbol, ts.Type>, run: () => R): R {
    const saved = this.env;
    this.env = env;
    try {
      return run();
    } finally {
      this.env = saved;
    }
  }

  /**
   * The native name of `decl` instantiated with `args` (TypeScript types, read in the current
   * environment): `name__Arg1_Arg2`. The first request schedules it; functions and classes are
   * lowered after the rest of the program, interfaces at once (they are only fields).
   */
  private instantiate(decl: GenericDecl, args: readonly ts.Type[], at: ts.Node): string {
    const params = decl.typeParameters ?? [];
    const env = new Map(this.env);
    params.forEach((p, i) => {
      const symbol = this.checker.getSymbolAtLocation(p.name)!;
      const arg = args[i] ?? (p.default ? this.checker.getTypeFromTypeNode(p.default) : undefined);
      if (arg) env.set(symbol, this.bound(arg));
    });
    const tys = params.map((p) => this.withEnv(env, () => this.ty(this.checker.getTypeAtLocation(p), at)));
    const holder = ts.isArrowFunction(decl) || ts.isFunctionExpression(decl) ? decl.parent : decl;
    const holderName = (holder as ts.NamedDeclaration).name;
    const base = holderName && ts.isIdentifier(holderName) ? this.idName(holderName) : "anonymous";
    const name = `${base}__${tys.map(mangle).join("_")}`;
    if (this.instances.has(name)) return name;
    // Each instantiation can request others: a type that grows with every one never ends.
    if (this.instances.size >= 500 || name.length > 200) return this.error(at, `Too many instantiations of ${base} (a generic that instantiates itself with a bigger type?).`), name;
    this.instances.set(name, { decl, env });
    const symbol = ts.isInterfaceDeclaration(decl) ? this.checker.getSymbolAtLocation(decl.name) : undefined;
    if (ts.isInterfaceDeclaration(decl) && symbol && this.protocols.has(symbol)) this.instanceProtocols.set(name, this.withEnv(env, () => this.protocolDecl(decl, name)));
    else if (ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl)) this.interfaceInstance(name, decl, env);
    else this.pendingInstances.push(name);
    return name;
  }

  /**
   * A generic method (`map<U>(f: (x: T) => U): U[]`) of a non-generic class that nothing overrides: compiled once per
   * instantiation the program calls, as a method of its own (`map__String`), as generic functions are. A method that
   * overrides or is overridden would need every instantiation in every class of its family.
   */
  private checkGenericMethod(node: ts.MethodDeclaration) {
    const cls = node.parent;
    const name = node.name.getText();
    if (!ts.isClassLike(cls)) return void this.error(node, "Generic methods are supported in classes natively (not in object literals); write a generic top-level function.");
    if (cls.typeParameters?.length && ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Static) return void this.error(node, "A generic static method of a generic class is not supported natively; write a generic top-level function.");
    if (!node.body) return void this.error(node, "An abstract (or overloaded) generic method is not supported natively; give it one implementation.");
    const base = this.heritage(cls, ts.SyntaxKind.ExtendsKeyword)[0];
    if (base && this.checker.getTypeAtLocation(base).getProperty(name)) return void this.error(node, "A generic method that overrides a base class's is not supported natively (each instantiation would be needed in every class); write a generic top-level function.");
    const own = this.classSymbol(cls);
    for (const sf of this.files) {
      const visit = (n: ts.Node): void => {
        if (ts.isClassLike(n) && n !== cls && n.members.some((m) => m.name?.getText() === name)) {
          const bases = (t: ts.Type): boolean => this.checker.getBaseTypes(t as ts.InterfaceType).some((b) => b.getSymbol() === own || bases(b));
          if (bases(this.checker.getTypeAtLocation(n))) this.error(node, `A generic method that a subclass overrides is not supported natively (${n.name?.getText() ?? "a class"} does): each instantiation would be needed in every class; write a generic top-level function.`);
        }
        ts.forEachChild(n, visit);
      };
      visit(sf);
    }
  }

  /** A local generic function's instantiation with `args` (read in the current environment): its name and environment. */
  private localGenericName(decl: ts.FunctionDeclaration, args: readonly ts.Type[], at: ts.Node): { name: string; env: Map<ts.Symbol, ts.Type> } {
    const env = new Map(this.env);
    decl.typeParameters!.forEach((p, i) => {
      const arg = args[i] ?? (p.default ? this.checker.getTypeFromTypeNode(p.default) : undefined);
      if (arg) env.set(this.checker.getSymbolAtLocation(p.name)!, this.bound(arg));
    });
    const tys = decl.typeParameters!.map((p) => this.withEnv(env, () => this.ty(this.checker.getTypeAtLocation(p), at)));
    return { name: `${this.idName(decl.name!)}__${tys.map(mangle).join("_")}`, env };
  }

  /**
   * A generic function declared in a block: one local function per instantiation called in the block (and in those
   * instantiations, for one that calls itself), declared where it is (hoisted, as the one function JavaScript has).
   */
  private localGenericFns(node: ts.FunctionDeclaration): Stmt[] {
    const symbol = this.checker.getSymbolAtLocation(node.name!);
    const found = new Map<string, Map<ts.Symbol, ts.Type>>();
    const work: Map<ts.Symbol, ts.Type>[] = [];
    const scan = (root: ts.Node, skipOwn: boolean) => {
      const visit = (n: ts.Node): void => {
        if (skipOwn && n === node.body) return;
        if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && this.resolveAlias(this.checker.getSymbolAtLocation(n.expression)) === symbol) {
          const signature = this.checker.getResolvedSignature(n);
          const { name, env } = this.localGenericName(node, (signature && this.checker.getTypeArgumentsForResolvedSignature(signature)) ?? [], n);
          if (!found.has(name) && found.size < 50) {
            found.set(name, env);
            work.push(env);
          }
        }
        ts.forEachChild(n, visit);
      };
      visit(root);
    };
    scan(node.parent, true);
    for (let env = work.shift(); env; env = work.shift()) {
      const e = env;
      this.withEnv(e, () => scan(node.body!, false));
    }
    return [...found].map(([name, env]): Stmt => ({ s: "fn", decl: this.withEnv(env, () => this.fnDecl(name, node)) }));
  }

  /** The native name of generic method `decl` instantiated with `args`: `name__Arg`, scheduled once per class. */
  private methodInstance(decl: ts.MethodDeclaration, args: readonly ts.Type[], at: ts.Node, recv?: ts.Expression): string {
    const env = new Map(this.env);
    // A generic method of a generic class (rest): one per instantiation of the class (the receiver's) and of the method.
    const clsDecl = decl.parent as ts.ClassLikeDeclaration;
    let instance: string | undefined;
    if (clsDecl.typeParameters?.length) {
      const recvType = recv && this.checker.getNonNullableType(this.typeOf(recv));
      const ref = recvType && this.genericRef(recvType);
      const recvTy = recvType && this.ty(recvType, recv);
      if (!ref || ref.decl !== clsDecl || recvTy?.k !== "class") return this.error(at, "A generic method of a generic class is supported natively on an object of that class (not of a subclass); call it on one."), "";
      clsDecl.typeParameters.forEach((p, i) => {
        const arg = ref.args[i];
        if (arg) env.set(this.checker.getSymbolAtLocation(p.name)!, this.bound(arg));
      });
      instance = recvTy.name;
    }
    decl.typeParameters!.forEach((p, i) => {
      const arg = args[i] ?? (p.default ? this.checker.getTypeFromTypeNode(p.default) : undefined);
      if (arg) env.set(this.checker.getSymbolAtLocation(p.name)!, this.bound(arg));
    });
    const tys = decl.typeParameters!.map((p) => this.withEnv(env, () => this.ty(this.checker.getTypeAtLocation(p), at)));
    const name = `${this.memberName(decl.name)}__${tys.map(mangle).join("_")}`;
    const cls = instance ?? this.className(this.classSymbol(decl.parent as ts.ClassLikeDeclaration)!);
    const key = `${cls}.${name}`;
    if (!this.methodInstances.has(key)) {
      this.methodInstances.set(key, { decl, env, cls, name });
      this.pendingMethods.push(key);
    }
    return name;
  }

  /** A generic method's instantiation: a method of its class (a function `C__name` when static). */
  private methodInstanceDef(key: string, out: Program) {
    const { decl, env, cls, name } = this.methodInstances.get(key)!;
    this.withEnv(env, () => {
      if (ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Static) return void out.functions.push(this.fnDecl(`${cls}__${name}`, decl));
      const owner = out.objectClasses?.find((c) => c.name === cls);
      if (!owner) return void this.error(decl, "Unsupported: this generic method natively (its class isn't declared where its instantiations are made).");
      const method: MethodDecl = this.fnDecl(name, decl);
      this.calleeDefaults(method, decl, decl.parent as ts.ClassLikeDeclaration);
      owner.methods.push(method);
    });
  }

  /** The fields of an instantiated generic interface: a native class of its own. */
  private interfaceInstance(name: string, decl: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, env: Map<ts.Symbol, ts.Type>) {
    const cls: ClassDecl = { name, fields: [], decodable: true };
    this.instanceClasses.set(name, cls);
    this.withEnv(env, () => {
      const symbol = this.checker.getSymbolAtLocation(decl.name)!;
      for (const prop of this.checker.getPropertiesOfType(this.checker.getDeclaredTypeOfSymbol(symbol))) {
        const member = prop.valueDeclaration;
        if (!member || !ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) {
          this.error(member ?? decl, "Only properties are supported in interfaces (they become native classes).");
          continue;
        }
        const ty = this.tyOfSymbol(prop, member);
        const readonly = !!member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword);
        cls.fields.push({ name: member.name.text, ty, readonly, optional: !!member.questionToken });
        if (!this.decodable(ty)) cls.decodable = false;
      }
    });
  }

  /** The type arguments of a reference to a generic interface, alias or class (`Box<number>`), if it is one. */
  private genericRef(type: ts.Type): { decl: GenericDecl; args: readonly ts.Type[] } | undefined {
    // `this` in a generic class: the class instantiated with its own parameters.
    if (type.flags & ts.TypeFlags.TypeParameter && (type as ts.TypeParameter & { isThisType?: boolean }).isThisType) type = type.getConstraint() ?? type;
    const alias = type.aliasSymbol && this.generics.get(type.aliasSymbol);
    if (alias) return { decl: alias, args: type.aliasTypeArguments ?? [] };
    const symbol = type.getSymbol();
    const decl = symbol && this.generics.get(symbol);
    if (!decl || ts.isFunctionDeclaration(decl) || ts.isArrowFunction(decl) || ts.isFunctionExpression(decl)) return undefined;
    return { decl, args: type.flags & ts.TypeFlags.Object && (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference ? this.checker.getTypeArguments(type as ts.TypeReference) : [] };
  }

  /** Every interface class: declared ones and instantiations of generic ones. */
  private allClasses(): ClassDecl[] {
    return [...this.classes.values(), ...this.instanceClasses.values(), ...this.shapeClasses.values()];
  }

  /** `Error` (JavaScript's): what an app's error class extends (`class E extends Error`), natively the class ERROR_BASE. */
  private isLibError(node: ts.Expression): boolean {
    if (!ts.isIdentifier(node) || node.text !== "Error") return false;
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
    return !!symbol?.declarations?.length && symbol.declarations.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d));
  }

  /**
   * JavaScript's `Error` as a class of the app (when the app extends it): `name` ("Error"), `message` (the constructor's,
   * "" without one) and `toString()` as Error.prototype.toString. Thrown, an object of it rides in the native error
   * (`error.wrap`, which also keeps its name and message for the runtime's own messages); a caught error gives it back
   * (`error.obj`), so `instanceof`, its fields and `e.message` / `e.name` / `${e}` read the object itself.
   */
  private errorBase(): ObjectClassDecl {
    const self: Expr = { e: "id", name: "this" };
    const field = (name: string): Expr => ({ e: "prop", obj: self, name });
    const empty = (x: Expr): Expr => ({ e: "bin", op: "==", l: x, r: { e: "str", v: "" }, text: true });
    return {
      name: ERROR_BASE,
      protocols: [],
      abstract: false,
      open: true,
      fields: [
        { name: "name", ty: T.string, readonly: false, optional: false, init: { e: "str", v: "Error" } },
        { name: "message", ty: T.string, readonly: false, optional: false, init: { e: "str", v: "" } },
        // `new Error(m, { cause })` (adapters2): a native error (a thrown value that isn't one rides in THROWN); nil when left out.
        ...(this.thrownValues ? [{ name: "cause", ty: T.optional(T.rt("Error")), readonly: false, optional: true }] : []),
      ],
      ctor: {
        params: [{ name: "message", ty: T.string, default: { e: "str", v: "" } }, ...(this.thrownValues ? [{ name: "cause", ty: T.optional(T.rt("Error")), default: { e: "nil" } } as Param] : [])],
        body: [
          { s: "assign", target: field("message"), op: "=", value: { e: "id", name: "message" } },
          ...(this.thrownValues ? [{ s: "assign", target: field("cause"), op: "=", value: { e: "id", name: "cause" } } as Stmt] : []),
        ],
      },
      methods: [{
        name: "toString",
        params: [],
        ret: T.string,
        async: false,
        body: [
          { s: "if", c: empty(field("name")), then: [{ s: "return", x: field("message") }] },
          { s: "if", c: empty(field("message")), then: [{ s: "return", x: field("name") }] },
          { s: "return", x: { e: "tpl", parts: [field("name"), ": ", field("message")] } },
        ],
      }],
    };
  }

  /** `super(message)` / `new Error(message)`: the message ("" when left out or undefined); an `options` argument (`cause`) is rejected. */
  private errorArgs(node: ts.CallExpression | ts.NewExpression, ctx: Ctx): Expr[] {
    const [message, options] = node.arguments ?? [];
    // `{ cause: x }` / `{ cause }` (adapters2): the cause as a native error (THROWN when it isn't one).
    const cause = options && ts.isObjectLiteralExpression(options) && options.properties.length === 1 ? options.properties[0]! : undefined;
    const causeValue = cause && (ts.isPropertyAssignment(cause) || ts.isShorthandPropertyAssignment(cause)) && cause.name.getText() === "cause"
      ? (ts.isPropertyAssignment(cause) ? cause.initializer : cause.name) : undefined;
    if (options && !causeValue) this.error(options, "An error's options are supported natively as a literal `{ cause: value }` only.");
    const text: Expr[] = [];
    if (message) {
      const x = this.expr(message, ctx, this.isNullable(this.typeOf(message)) ? T.optional(T.string) : T.string);
      text.push(this.isNullable(this.typeOf(message)) ? { e: "coalesce", l: x, r: { e: "str", v: "" } } : x);
    }
    return causeValue ? [text[0] ?? { e: "str", v: "" }, this.thrownExpr(causeValue, ctx)] : text;
  }

  /** `new Error(message[, { cause }])`: the runtime's error, or (with a cause) an ERROR_BASE object it carries. */
  private newError(node: ts.NewExpression, ctx: Ctx): Expr {
    const args = this.errorArgs(node, ctx);
    if (args.length < 2) return { e: "op", op: "error.new", args: [args[0] ?? { e: "str", v: "" }], ty: T.rt("Error") };
    return this.wrapError({ e: "construct", cls: ERROR_BASE, args }, { k: "class", name: ERROR_BASE });
  }

  /**
   * The app throws a value that isn't an Error (`throw "x"`, `throw 404`, `throw null`, an `unknown`) or uses an error's
   * `cause` (adapters2): then a native error can carry such a value (THROWN), and a caught `e` is narrowed by
   * typeof / instanceof as in JavaScript.
   */
  private usesThrownValues(): boolean {
    let found = false;
    const visit = (n: ts.Node): void => {
      if (found) return;
      if (ts.isThrowStatement(n) && this.thrownPrimitive(this.typeOf(n.expression))) found = true;
      else if (ts.isPropertyAccessExpression(n) && n.name.text === "cause" && this.isErrorCause(n)) found = true;
      else if (ts.isNewExpression(n) && (n.arguments?.length ?? 0) > 1 && this.isLibError(n.expression)) found = true;
      // A caught error going where an `unknown` is expected (`describe(e)`): an `unknown` must hold errors.
      else if (ts.isIdentifier(n) && this.isCaught(n) && (this.checker.getContextualType(n)?.flags ?? 0) & ts.TypeFlags.Unknown) found = true;
      else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.SuperKeyword && n.arguments.length > 1) {
        let c: ts.Node | undefined = n.parent;
        while (c && !ts.isClassLike(c)) c = c.parent;
        const base = c && this.heritage(c as ts.ClassLikeDeclaration, ts.SyntaxKind.ExtendsKeyword)[0];
        if (base && this.isLibError(base.expression)) found = true;
      }
      ts.forEachChild(n, visit);
    };
    for (const sf of this.files) if (!sf.isDeclarationFile) visit(sf);
    return found;
  }

  /** A thrown type a native error can carry as a value: strings, numbers, booleans, null, undefined, `unknown`. */
  private thrownPrimitive(type: ts.Type): boolean {
    if (type.flags & ts.TypeFlags.Unknown) return true;
    if (type.flags & (ts.TypeFlags.Never | ts.TypeFlags.Any)) return false;
    return this.members(type).every((m) => !!(m.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
  }

  /** `x.cause` of JavaScript's Error (or an error class): lib's `cause?: unknown`. */
  private isErrorCause(node: ts.PropertyAccessExpression): boolean {
    const prop = this.checker.getPropertyOfType(this.checker.getNonNullableType(this.typeOf(node.expression)), "cause");
    return !!prop?.declarations?.length && prop.declarations.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d));
  }

  /** THROWN: an ERROR_BASE whose `value` is the thrown value, named as String(value) (the text JavaScript prints for it). */
  private thrownClass(): ObjectClassDecl {
    const u = this.unknownTy() as Extract<Ty, { k: "union" }>;
    const self: Expr = { e: "id", name: "this" };
    const value: Expr = { e: "id", name: "value" };
    const text: Expr = { e: "cond", c: this.some(value, true), a: { e: "str", v: "undefined" }, b: this.unionCall(`${u.name}__str`, () => this.strFn(u.name), [{ e: "unwrap", x: value }]) };
    return {
      name: THROWN,
      base: ERROR_BASE,
      protocols: [],
      abstract: false,
      open: false,
      fields: [{ name: "value", ty: T.optional(u), readonly: true, optional: true }],
      ctor: {
        params: [{ name: "value", ty: T.optional(u) }],
        superArgs: [],
        body: [
          { s: "assign", target: { e: "prop", obj: self, name: "value" }, op: "=", value },
          { s: "assign", target: { e: "prop", obj: self, name: "name" }, op: "=", value: text },
        ],
      },
      methods: [],
    };
  }

  /** Any thrown value as a native error: an Error as it is, an error class's object wrapped, a primitive in THROWN. */
  private thrownExpr(node: ts.Expression, ctx: Ctx): Expr {
    let bare = node;
    while (ts.isParenthesizedExpression(bare)) bare = bare.expression;
    if (ts.isNewExpression(bare) && this.isLibError(bare.expression)) return this.newError(bare, ctx);
    const type = this.typeOf(node);
    if (bare.kind === ts.SyntaxKind.NullKeyword && this.thrownValues) return this.thrownError({ e: "uwrap", x: { e: "nil" }, u: (this.unknownTy() as { name: string }).name, tag: "Null", ty: T.void });
    if (type.flags & ts.TypeFlags.Unknown && this.isCaught(node)) return this.expr(node, ctx);
    // An `unknown`: the error it holds, else its value in THROWN.
    if (type.flags & ts.TypeFlags.Unknown && this.thrownValues) {
      const u = this.unknownTy() as Extract<Ty, { k: "union" }>;
      const v: Expr = { e: "id", name: `tv__${++this.temps}` };
      const isError = this.both(this.some(v), { e: "uis", x: { e: "unwrap", x: v }, u: u.name, tag: this.unionTag(T.rt("Error")) });
      const body: Expr = { e: "cond", c: isError, a: { e: "uget", x: { e: "unwrap", x: v }, u: u.name, tag: this.unionTag(T.rt("Error")), ty: T.rt("Error") }, b: this.thrownError(v) };
      return { e: "with", name: (v as { name: string }).name, ty: T.optional(u), init: this.expr(node, ctx, T.optional(u)), body };
    }
    if (this.thrownValues && this.thrownPrimitive(type)) return this.thrownError(this.expr(node, ctx, T.optional(this.unknownTy())));
    const ty = this.tyOfExpr(node);
    if (ty.k === "rt" && ty.name === "Error") return this.expr(node, ctx);
    if (this.isErrorClass(ty)) return this.wrapError(this.expr(node, ctx), ty);
    return this.error(node, "throwing anything but an Error or a primitive (also as a `cause`): carry it in an error class (`class Failure extends Error { constructor(readonly value: Point) { super(\"failed\"); } }`); strings, numbers, booleans, null and undefined can be thrown as they are.");
  }

  /** A caught value (a native error) as an `unknown`: the value it carries (THROWN), else the error. */
  private caughtToUnknown(x: Expr): Expr {
    const u = this.unknownTy() as Extract<Ty, { k: "union" }>;
    const e: Expr = { e: "id", name: `ce__${++this.temps}` };
    const t: Expr = { e: "id", name: `ct__${this.temps}` };
    const body: Expr = { e: "cond", c: this.some(t), a: { e: "prop", obj: { e: "unwrap", x: t }, name: "value" }, b: { e: "uwrap", x: e, u: u.name, tag: this.unionTag(T.rt("Error")), ty: T.rt("Error") } };
    return { e: "with", name: (e as { name: string }).name, ty: T.rt("Error"), init: x, body: { e: "with", name: (t as { name: string }).name, ty: T.optional({ k: "class", name: THROWN }), init: this.thrownObj(e), body } };
  }

  /** A value (an `unknown`'s native type) in a native error. */
  private thrownError(value: Expr): Expr {
    return this.wrapError({ e: "construct", cls: THROWN, args: [value] }, { k: "class", name: THROWN });
  }

  /** The THROWN object a native error carries, if it carries one. */
  private thrownObj(x: Expr): Expr {
    return this.errorObj(x, THROWN);
  }

  /** `e.cause` of a native error (or of an error class's object): its cause, or a THROWN undefined. */
  private causeRead(x: Expr, isObject: boolean): Expr {
    const cause: Expr = isObject ? { e: "prop", obj: x, name: "cause" } : { e: "prop", obj: this.errorObj(x, ERROR_BASE), name: "cause", optional: true };
    const c: Expr = { e: "id", name: `cz__${++this.temps}` };
    return { e: "with", name: (c as { name: string }).name, ty: T.optional(T.rt("Error")), init: cause, body: { e: "cond", c: this.some(c), a: { e: "unwrap", x: c }, b: this.thrownError({ e: "nil" }) } };
  }

  /** `typeof` of a caught value (or a cause): "object" for an error, else its value's. */
  private thrownTypeof(x: Expr): Expr {
    const u = this.unknownTy() as Extract<Ty, { k: "union" }>;
    const t: Expr = { e: "id", name: `tt__${++this.temps}` };
    const v: Expr = { e: "prop", obj: { e: "unwrap", x: t }, name: "value" };
    const valueTypeof: Expr = { e: "cond", c: this.some(v, true), a: { e: "str", v: "undefined" }, b: this.unionCall(`${u.name}__typeof`, () => this.typeofFn(u.name), [{ e: "unwrap", x: v }]) };
    return { e: "with", name: (t as { name: string }).name, ty: T.optional({ k: "class", name: THROWN }), init: this.thrownObj(x), body: { e: "cond", c: this.some(t, true), a: { e: "str", v: "object" }, b: valueTypeof } };
  }

  /** A caught value (or a cause) TypeScript narrowed to a primitive (`typeof e === "string"`): the value it carries. */
  private thrownAs(x: Expr, here: ts.Type, node: ts.Node): Expr | undefined {
    if (!this.thrownPrimitive(here) || this.isNullable(here) || here.flags & ts.TypeFlags.Unknown) return undefined;
    const u = this.unknownTy() as Extract<Ty, { k: "union" }>;
    const v: Expr = { e: "unwrap", x: { e: "prop", obj: { e: "unwrap", x: this.thrownObj(x) }, name: "value" } };
    const to = this.ty(here, node);
    if (to.k === "union") return this.toUnionValue(v, u, to);
    const member = this.unionMember(this.unions.get(u.name)!, to.k === "int" ? T.double : to);
    return member && { e: "uget", x: v, u: u.name, tag: member.tag, ty: member.ty };
  }

  /** A class of the app that extends `Error` (or ERROR_BASE itself). */
  private isErrorClass(ty: Ty): boolean {
    return this.errorClasses && ty.k === "class" && (ty.name === ERROR_BASE || this.supertypes(ty.name).has(ERROR_BASE));
  }

  /** An object of an error class as a native error (thrown, or kept where an `Error` is expected). */
  private wrapError(x: Expr, ty: Ty): Expr {
    const v: Expr = x.e === "id" ? x : { e: "id", name: `er__${++this.temps}` };
    const wrap: Expr = { e: "op", op: "error.wrap", args: [v, { e: "prop", obj: v, name: "name" }, { e: "prop", obj: v, name: "message" }], ty: T.rt("Error") };
    return x.e === "id" ? wrap : { e: "with", name: (v as { name: string }).name, ty, init: x, body: wrap };
  }

  /** The object of error class `cls` a native error carries, if it carries one of that class (else nil). */
  private errorObj(x: Expr, cls: string): Expr {
    return { e: "op", op: "error.obj", args: [x, { e: "str", v: cls }], ty: T.optional({ k: "class", name: cls }) };
  }

  /**
   * `e.message` / `e.name` / `${e}` of a native error: the object's when it carries one (it may have changed since it was
   * thrown), else the native error's own. `e` is read twice (a temporary when computed).
   */
  private errorRead(x: Expr, what: "message" | "name" | "text"): Expr {
    const op: Op = what === "message" ? "error.text" : what === "name" ? "error.name" : "error.message";
    if (!this.errorClasses) return { e: "op", op, args: [x], ty: T.string };
    const v: Expr = x.e === "id" ? x : { e: "id", name: `er__${++this.temps}` };
    const own: Expr = { e: "op", op, args: [v], ty: T.string };
    const obj = this.errorObj(v, ERROR_BASE);
    const value: Expr = what === "text"
      ? { e: "cond", c: this.some(obj), a: { e: "invoke", obj: { e: "unwrap", x: obj }, name: "toString", args: [] }, b: own }
      : { e: "coalesce", l: { e: "prop", obj, name: what, optional: true }, r: own };
    return x.e === "id" ? value : { e: "with", name: (v as { name: string }).name, ty: T.rt("Error"), init: x, body: value };
  }

  private isApi(node: ts.Node): boolean {
    return path.resolve(node.getSourceFile().fileName) === API_FILE;
  }

  private resolveAlias(symbol: ts.Symbol | undefined): ts.Symbol | undefined {
    return symbol && symbol.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(symbol) : symbol;
  }

  /** The API name an identifier refers to (`div`, `update`…), if it is the API's. */
  /** `const { css, cx, … } = createCss({…})`. */
  private isCreateCss(node: ts.Node | undefined): node is ts.VariableDeclaration {
    if (!node || !ts.isVariableDeclaration(node) || !node.initializer || !ts.isCallExpression(node.initializer)) return false;
    const callee = node.initializer.expression;
    if (!ts.isIdentifier(callee)) return false;
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(callee));
    const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    return !!decl && this.isApi(decl) && symbol!.name === "createCss";
  }

  /** The theme of createCss() and the frames of every keyframes() const, before any style is lowered. */
  private collectStyling(sf: ts.SourceFile) {
    const visit = (node: ts.Node): void => {
      if (this.isCreateCss(node)) {
        const arg = (node.initializer as ts.CallExpression).arguments[0];
        const theme = arg ? this.constValue(arg) : {};
        if (theme === DYNAMIC || typeof theme !== "object") this.error(node, "Give createCss() its theme as an object literal of literals: it is read at compile time.");
        else this.theme = theme as Theme;
        if (!ts.isObjectBindingPattern(node.name) && ts.isSourceFile(this.topLevelOf(node))) {
          this.error(node.name, "Destructure createCss() where it is called: const { css, cx, variants, keyframes, globalStyle, theme } = createCss({…}).");
        }
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callee = node.initializer.expression;
        const frames = node.initializer.arguments[0];
        if (ts.isIdentifier(callee) && this.apiName(callee) === "keyframes") {
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (!frames || !ts.isObjectLiteralExpression(frames)) this.error(node, "keyframes() takes its stops as an object literal.");
          else if (!ts.isSourceFile(this.topLevelOf(node)) || !(ts.getCombinedNodeFlags(node) & ts.NodeFlags.Const)) this.error(node, "Declare keyframes() as a top-level const.");
          else if (symbol) this.keyframes.set(symbol, frames);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  /**
   * The value of an expression known at compile time: literals, templates of them, `-n`, a ternary of them, and
   * `const`s (and their properties, when nothing assigns them) whose initializers are. DYNAMIC otherwise.
   */
  private constValue(node: ts.Expression): unknown {
    if (ts.isParenthesizedExpression(node) || ts.isAssertionExpression(node) || ts.isSatisfiesExpression(node)) return this.constValue(node.expression);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
      const v = this.constValue(node.operand);
      return typeof v === "number" ? -v : DYNAMIC;
    }
    if (ts.isTemplateExpression(node)) {
      let text = node.head.text;
      for (const span of node.templateSpans) {
        const v = this.constValue(span.expression);
        if (v === DYNAMIC || typeof v === "object") return DYNAMIC;
        text += String(v) + span.literal.text;
      }
      return text;
    }
    if (ts.isObjectLiteralExpression(node)) {
      const out: Record<string, unknown> = {};
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name))) return DYNAMIC;
        const v = this.constValue(prop.initializer);
        if (v === DYNAMIC) return DYNAMIC;
        out[prop.name.text] = v;
      }
      return out;
    }
    if (ts.isIdentifier(node)) {
      const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
      const decl = symbol?.valueDeclaration;
      if (decl && ts.isBindingElement(decl) && this.isCreateCss(decl.parent.parent) && (decl.propertyName ?? decl.name).getText() === "theme") return this.theme;
      if (!decl || !ts.isVariableDeclaration(decl) || !decl.initializer || !(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const)) return DYNAMIC;
      if (decl.getSourceFile().isDeclarationFile || this.isApi(decl)) return DYNAMIC;
      return this.constValue(decl.initializer);
    }
    if (ts.isPropertyAccessExpression(node)) {
      const symbol = this.checker.getSymbolAtLocation(node.name);
      if (symbol && this.assignedProps().has(symbol)) return DYNAMIC;
      const obj = this.constValue(node.expression);
      if (obj === DYNAMIC || !obj || typeof obj !== "object") return DYNAMIC;
      const v = (obj as Record<string, unknown>)[node.name.text];
      return v === undefined ? DYNAMIC : v;
    }
    return DYNAMIC;
  }

  private themeRooted(node: ts.Expression): boolean {
    let root = node;
    while (ts.isPropertyAccessExpression(root)) root = root.expression;
    if (!ts.isIdentifier(root)) return false;
    const decl = this.resolveAlias(this.checker.getSymbolAtLocation(root))?.valueDeclaration;
    return !!decl && ts.isBindingElement(decl) && this.isCreateCss(decl.parent.parent);
  }

  private assignedProps(): Set<ts.Symbol> {
    if (this.assigned) return this.assigned;
    const out = new Set<ts.Symbol>();
    const visit = (node: ts.Node): void => {
      const target = ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
        ? node.left
        : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)
          ? node.operand
          : undefined;
      if (target && ts.isPropertyAccessExpression(target)) {
        const symbol = this.checker.getSymbolAtLocation(target.name);
        if (symbol) out.add(symbol);
      }
      ts.forEachChild(node, visit);
    };
    for (const sf of this.files) visit(sf);
    return (this.assigned = out);
  }

  private apiName(node: ts.Node): string | undefined {
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
    const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    // `const { css } = createCss(…)`: the theme's css is the API's (the theme is applied at compile time).
    if (decl && ts.isBindingElement(decl) && this.isCreateCss(decl.parent.parent)) return (decl.propertyName ?? decl.name).getText();
    return decl && this.isApi(decl) ? symbol!.name : undefined;
  }

  private isNumber(type: ts.Type): boolean {
    const t = this.nonNull(type);
    return !!(t.flags & ts.TypeFlags.NumberLike) || (t.isUnion() && this.members(t).every((u) => !!(u.flags & ts.TypeFlags.NumberLike)));
  }

  private isString(type: ts.Type): boolean {
    type = this.bound(type);
    return !!(type.flags & ts.TypeFlags.StringLike) || (type.isUnion() && this.members(type).every((u) => !!(u.flags & ts.TypeFlags.StringLike)));
  }

  private isBoolean(type: ts.Type): boolean {
    type = this.bound(type);
    return !!(type.flags & ts.TypeFlags.BooleanLike) || (type.isUnion() && this.members(type).every((u) => !!(u.flags & ts.TypeFlags.BooleanLike)));
  }

  private isNullable(type: ts.Type): boolean {
    type = this.bound(type);
    return type.isUnion() && this.members(type).some((u) => !!(u.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) || this.isNullable(u));
  }

  /** An array, or a tuple (TypeScript's type for `[1, 2]` in destructuring), which is one natively. */
  private isArray(type: ts.Type): boolean {
    type = this.bound(type);
    return this.checker.isArrayType(type) || (this.checker.isTupleType(type) && !this.isMixedTuple(type));
  }

  private isSequence(type: ts.Type): boolean {
    return this.isString(type) || this.isArray(type);
  }

  private isClassType(type: ts.Type): boolean {
    return this.isDeclaredClassType(type) || this.isShape(type);
  }

  /** One of the app's classes, interfaces (records and protocols) or `type X = { … }` aliases. */
  private isDeclaredClassType(type: ts.Type): boolean {
    type = this.bound(type);
    if (this.genericRef(type)) return true;
    const symbol = type.aliasSymbol ?? type.getSymbol();
    // By name too: a property read can give a transient copy of the symbol. Class expressions are told apart by their native names.
    return !!symbol && [...this.classes.keys(), ...this.objectClasses.keys(), ...this.protocols.keys()].some((s) => s === symbol || this.className(s) === this.className(symbol));
  }

  /** The IR type of a TypeScript type; `num` is the kind a number takes here. */
  private ty(type: ts.Type, node: ts.Node, num: NumKind = "double"): Ty {
    type = this.bound(type);
    if (type.flags & ts.TypeFlags.TypeParameter && !(type as ts.TypeParameter & { isThisType?: boolean }).isThisType) return this.error(node, `The type parameter ${type.symbol?.name ?? ""} has no native type here (only top-level generic functions, interfaces and classes are instantiated).`), T.string;
    // An unannotated promise rejection reason is `any` in TypeScript's lib, and an Error natively.
    if (type.flags & ts.TypeFlags.Any && this.isCaught(node)) return T.rt("Error");
    if (type.flags & ts.TypeFlags.Any) return this.error(node, "This value is typed `any` (written, or inferred from a lib function such as JSON.parse), which has no native type: annotate it (`const x: T = …`), or type it `unknown` and test it with typeof."), T.string;
    // A caught error is an Error natively (only `new Error(…)` is thrown); any other `unknown` holds what the app can make of primitives.
    if (type.flags & ts.TypeFlags.Unknown) return this.isCaught(node) ? T.rt("Error") : T.optional(this.unknownTy());
    // `{}`: an `unknown` TypeScript narrowed to "not null or undefined" (`v !== null`), still the same native value.
    if (type.flags & ts.TypeFlags.Object && this.checker.typeToString(type) === "{}") return this.unknownTy();
    if (type.flags & ts.TypeFlags.Null) return this.error(node, "A value typed only `null` has no native type here (a local variable typed `null` is supported: each read is null); type it `T | null`."), T.string;
    if (this.isString(type)) return T.string;
    if (this.isBoolean(type)) return T.bool;
    if (this.isNumber(type) && !this.isNullable(type)) return num === "int" ? T.int : T.double;
    if (this.isBigInt(type) && !this.isNullable(type)) return T.rt("BigInt");
    if (this.isSymbol(type) && !this.isNullable(type)) return T.rt("Symbol");
    const typedArray = this.taName(type);
    if (typedArray) return T.rt(typedArray);
    const mapSet = this.mcTy(type, node);
    if (mapSet) return mapSet;
    if (TA_UNSUPPORTED.has(type.getSymbol()?.name ?? "") && this.fromLib(type.getSymbol())) return this.error(node, this.taUnsupported(type.getSymbol()!.name)), T.string;
    if (["ArrayBuffer", "DataView"].includes(type.getSymbol()?.name ?? "") && this.fromLib(type.getSymbol()) && !type.isUnion()) return T.rt(type.getSymbol()!.name as RuntimeType);
    if (type.getSymbol()?.name === "FinalizationRegistry" && this.fromLib(type.getSymbol())) return this.error(node, "FinalizationRegistry is not supported natively: its callbacks run whenever the garbage collector decides (natively at once, or never on the JVM), so no program output could match; release resources explicitly (a dispose() method: `Disposable`, `use(resource, body)` and `Disposer` in @nuclo/native-ts/adapters)."), T.string;
    if (type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never)) return T.void;
    const generator = this.genTy(type, node);
    if (generator) return generator;
    const settled = this.settledTy(type, node);
    if (settled) return settled;
    if (type.isUnion()) {
      const all = this.members(type);
      const rest = all.filter((u) => !(u.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
      if (rest.length === all.length) {
        if (rest.every((u) => u.flags & ts.TypeFlags.StringLike)) return T.string;
        return this.unionTy(type, rest, node);
      }
      const inner = rest.length === 1 ? rest[0]! : this.checker.getNonNullableType(type);
      // `T | null` with T bound to `U | null`: one optional.
      const of = this.ty(inner, node, num);
      return of.k === "optional" ? of : T.optional(of);
    }
    if (this.checker.isArrayType(type)) {
      const [elem] = this.checker.getTypeArguments(type as ts.TypeReference);
      return T.array(this.ty(elem!, node));
    }
    // `[1, 2]` where TypeScript infers a tuple (destructuring): an array when every element has one type.
    if (this.checker.isTupleType(type)) {
      const elems = this.checker.getTypeArguments(type as ts.TypeReference).map((t) => this.ty(t, node));
      const first = elems[0];
      if (first && elems.every((t) => JSON.stringify(t) === JSON.stringify(first))) return T.array(first);
      if (this.isVarTuple(type)) return this.varTupleTy(type, node);
      // `[]`: the rest of a destructured tuple, typed by the array it came from.
      const decl = ts.isIdentifier(node) ? this.checker.getSymbolAtLocation(node)?.valueDeclaration : ts.isBindingElement(node) ? node : undefined;
      if (!first && decl && ts.isBindingElement(decl) && decl.dotDotDotToken) {
        const elem = this.checker.getIndexTypeOfType(this.checker.getNonNullableType(this.typeOf(decl.parent)), ts.IndexKind.Number);
        if (elem) return T.array(this.ty(elem, node));
      }
    }
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const decl = symbol?.declarations?.[0];
    if (symbol && decl && this.isApi(decl)) {
      const mapped = API_TYPES[symbol.name];
      if (mapped) return mapped;
      // The function variants() returns.
      if (type.getCallSignatures().length) return T.rt("Variants");
    }
    if (symbol?.name === "Error" && decl?.getSourceFile().isDeclarationFile) return T.rt("Error");
    if (this.isDate(type)) return T.rt("Date");
    const promised = this.promiseTy(type, node);
    if (promised) return promised;
    const generic = this.genericRef(type);
    if (generic) return { k: "class", name: this.instantiate(generic.decl, generic.args, node) };
    if (this.isShape(type)) return this.shapeTy(type, node);
    if (this.isClassType(type)) return { k: "class", name: this.objectClasses.has(symbol!) ? this.className(symbol!) : this.recordName(symbol!) };
    const index = type.getStringIndexType();
    if (index && type.getProperties().length === 0) return T.map(this.ty(index, node));
    const [signature] = type.getCallSignatures();
    if (signature && type.getProperties().length === 0) {
      return {
        k: "fn",
        params: signature.getParameters().map((p) => this.withThrows(this.ty(this.checker.getTypeOfSymbol(p), node, this.slotKind(p)), p)),
        ret: this.ty(signature.getReturnType(), node),
      };
    }
    return this.error(node, `The type ${this.checker.typeToString(type)} has no native equivalent; declare it as an interface.${LOCALE_HINT(node.getText())}`), T.string;
  }

  /** The IR type of an expression as written (numbers by their inferred kind). */
  private tyOfExpr(node: ts.Expression): Ty {
    const type = this.typeOf(node);
    return this.ty(type, node, this.isNumber(type) ? this.numKind(node) : "double");
  }

  private tyOfSymbol(symbol: ts.Symbol, node: ts.Node): Ty {
    const fixed = this.promiseParams.get(symbol);
    if (fixed) return fixed;
    const sized = this.sizedTy(this.sizedKey(this.resolveAlias(symbol)));
    if (sized) return sized;
    return this.withThrows(this.ty(this.bound(this.checker.getTypeOfSymbolAtLocation(symbol, node)), node, this.slotKind(symbol)), symbol);
  }

  // -------------------------------------------------------------------------
  // Promises: a `Promise<T>` is the runtime's `JsPromise<T>`, settled with JavaScript's job order (a microtask
  // queue in each runtime). An async function is a state machine (asyncLower.ts) whose promise it returns; `then`,
  // `catch`, `finally` and the combinators are runtime calls; a native async call (fetch…) is wrapped in a promise.
  // -------------------------------------------------------------------------

  /** `resolve` / `reject` of a `new Promise` executor: native function types (TypeScript's mention `PromiseLike` and `any`). */
  private readonly promiseParams = new Map<ts.Symbol, Ty>();
  /** Parameters of rejection callbacks typed `unknown`: the error, as a caught one is. */
  private readonly reasonParams = new Set<ts.Node>();

  private isLibPromise(type: ts.Type | undefined): boolean {
    const symbol = type?.getSymbol();
    return symbol?.name === "Promise" && !!symbol.declarations?.length && symbol.declarations.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d));
  }

  private promiseTy(type: ts.Type, node: ts.Node, num: NumKind = "double"): Extract<Ty, { k: "promise" }> | undefined {
    if (!this.isLibPromise(type)) return undefined;
    const [arg] = this.checker.getTypeArguments(type as ts.TypeReference);
    return { k: "promise", of: this.valueTy(arg, node, num) };
  }

  /** What a promise holds natively: nothing for `void`, `undefined`, `null` or `never`; a number is a Double. */
  private valueTy(type: ts.Type | undefined, node: ts.Node, num: NumKind = "double"): Ty {
    if (!type || type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Never)) return T.void;
    if (type.flags & ts.TypeFlags.Unknown) return this.error(node, "This promise's value is `unknown`: give it a type (`new Promise<T>(…)`, `Promise.reject<T>(…)`)."), T.void;
    return this.ty(type, node, num);
  }

  /** `await x`: a promise, or a value (resolved first, as JavaScript does), in an async function. */
  private awaitExpr(node: ts.AwaitExpression, ctx: Ctx): Expr {
    if (!ctx.async && !ctx.gen?.async) return this.error(node, "`await` outside an async function.");
    // In an async generator every `await` is taken out in JavaScript's order (yieldSpill): anywhere is fine.
    if (!ctx.gen) this.checkAwait(node);
    const operand = this.typeOf(node.expression);
    const ty = this.valueTy(this.typeOf(node), node, this.isNumber(this.typeOf(node)) ? this.numKind(node) : "double");
    if (this.isLibPromise(operand)) return { e: "await", x: this.expr(node.expression, ctx), ty };
    if (operand.isUnion() && this.members(operand).some((t) => this.isLibPromise(t))) return this.error(node, "Unsupported: `await` of a value that may or may not be a promise; give it one type.");
    if (ty.k === "void" && !(node.expression.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "undefined"))) {
      return this.error(node, "Unsupported: `await` of something that is not a promise and has no value; call it, then `await null`.");
    }
    return { e: "await", x: { e: "op", op: "promise.resolve", args: ty.k === "void" ? [] : [this.expr(node.expression, ctx, ty)], ty: { k: "promise", of: ty } }, ty };
  }

  /**
   * Natively an `await` is taken out of its statement and run first (asyncLower.ts): only where nothing evaluated
   * before it could see the difference (a literal, `this`, a constant, a function) and it runs on every path.
   */
  private checkAwait(node: ts.AwaitExpression) {
    const bad = (why: string) => void this.error(node, `Unsupported: \`await\` ${why}; assign it to a const in a statement of its own first.`);
    let child: ts.Node = node;
    for (let p = node.parent; p && !ts.isStatement(p) && !ts.isVariableDeclaration(p) && !ts.isArrowFunction(p); child = p, p = p.parent) {
      if (ts.isParenthesizedExpression(p) || ts.isNonNullExpression(p) || ts.isAssertionExpression(p) || ts.isSatisfiesExpression(p) || ts.isAwaitExpression(p)) continue;
      if (ts.isPrefixUnaryExpression(p) || ts.isTypeOfExpression(p) || ts.isPropertyAccessExpression(p) || ts.isSpreadElement(p) || ts.isTemplateSpan(p)) {
        if (ts.isTemplateSpan(p)) {
          const tpl = p.parent;
          if (!tpl.templateSpans.slice(0, tpl.templateSpans.indexOf(p)).every((s) => this.inert(s.expression))) return bad("after a value of the template it reads first");
        }
        continue;
      }
      if (ts.isBinaryExpression(p)) {
        const k = p.operatorToken.kind;
        if (child === p.left) continue;
        if (k === ts.SyntaxKind.EqualsToken) {
          const t = p.left;
          if (ts.isIdentifier(t) || (ts.isPropertyAccessExpression(t) && this.inert(t.expression)) || (ts.isElementAccessExpression(t) && this.inert(t.expression) && this.inert(t.argumentExpression))) continue;
          return bad("assigned to a target it would evaluate first");
        }
        // `x ||= await p` as a statement: natively `if (!x) x = await p`, the target read first as in JavaScript.
        if (this.isLogicalAssignment(k) && ts.isExpressionStatement(p.parent) && this.isPure(p.left)) continue;
        if (this.isAssignment(k)) return bad("in a compound assignment (the target is read before it)");
        // `a && await b;` as a statement is an `if` (exprStmt).
        if (k === ts.SyntaxKind.AmpersandAmpersandToken && ts.isExpressionStatement(p.parent)) continue;
        if (k === ts.SyntaxKind.AmpersandAmpersandToken || k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken || k === ts.SyntaxKind.CommaToken) return bad("on the right of &&, ||, ?? or a comma");
        if (!this.inert(p.left)) return bad("after an operand it reads first");
        continue;
      }
      if (ts.isConditionalExpression(p)) {
        if (child !== p.condition && !ts.isExpressionStatement(p.parent)) return bad("in a branch of ?:");
        continue;
      }
      if (ts.isCallExpression(p) || ts.isNewExpression(p)) {
        if (child === p.expression) continue;
        if (ts.isOptionalChain(p)) return bad("in an optional call");
        const callee = ts.isPropertyAccessExpression(p.expression) ? p.expression.expression : p.expression;
        const args = p.arguments ?? ts.factory.createNodeArray();
        if (!this.inert(callee) || !args.slice(0, args.indexOf(child as ts.Expression)).every((a) => this.inert(a))) return bad("in a call that evaluates something else first");
        continue;
      }
      if (ts.isElementAccessExpression(p)) {
        if (child === p.argumentExpression && !this.inert(p.expression)) return bad("in an index of something it reads first");
        continue;
      }
      if (ts.isArrayLiteralExpression(p)) {
        if (!p.elements.slice(0, p.elements.indexOf(child as ts.Expression)).every((e) => this.inert(e))) return bad("after an element evaluated first");
        continue;
      }
      if (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) {
        const obj = p.parent;
        const before = obj.properties.slice(0, obj.properties.indexOf(p));
        if (!before.every((q) => ts.isPropertyAssignment(q) && this.inert(q.initializer))) return bad("after a property evaluated first");
        continue;
      }
      if (ts.isObjectLiteralExpression(p) || ts.isTemplateExpression(p)) continue;
      return bad("here");
    }
  }

  /** Nothing an `await` could change: a literal, `this`, a function, a constant (or a parameter nothing reassigns). */
  private inert(n: ts.Expression): boolean {
    while (ts.isParenthesizedExpression(n) || ts.isNonNullExpression(n) || ts.isAssertionExpression(n)) n = n.expression;
    // An earlier `await` of the statement: its value is kept where it was (its own position is checked on its own).
    if (ts.isLiteralExpression(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isAwaitExpression(n)) return true;
    if ([ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword, ts.SyntaxKind.ThisKeyword].includes(n.kind)) return true;
    if (ts.isPropertyAccessExpression(n)) return this.enumValue(n) !== undefined || (ts.isIdentifier(n.expression) && n.expression.text === "Promise");
    if (!ts.isIdentifier(n)) return false;
    if (n.text === "undefined") return true;
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(n));
    const decl = symbol?.valueDeclaration;
    if (!decl) return !!symbol;
    if (ts.isFunctionDeclaration(decl) || ts.isClassDeclaration(decl)) return true;
    if (ts.isVariableDeclaration(decl)) return !!(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const);
    if (ts.isParameter(decl) && ts.isIdentifier(decl.name)) {
      const body = (decl.parent as ts.SignatureDeclaration & { body?: ts.Node }).body;
      return !!body && !this.isReassigned(decl.name, body);
    }
    return false;
  }

  /** The promise of a native async call (fetch, `res.json()`, a `declare function` returning a promise, delay). */
  private nativePromise(node: ts.CallExpression, x: Expr): Expr {
    const type = this.typeOf(node);
    if (!this.isLibPromise(type) || !(x.e === "rt" || x.e === "method" || x.e === "call")) return x;
    const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
    if (x.e === "call" && !(decl && ts.isFunctionDeclaration(decl) && !decl.body)) return x;
    if (x.e === "rt" && x.name === "delay") return { e: "op", op: "promise.delay", args: x.args, ty: { k: "promise", of: T.void } };
    const [arg] = this.checker.getTypeArguments(type as ts.TypeReference);
    return { e: "op", op: "promise.native", args: [{ ...x, await: true }], ty: { k: "promise", of: this.valueTy(arg, node, this.numKind(node)) } };
  }

  /** `return p` of a promise in an async function: its promise adopts `p` (two jobs later than a value, as in JavaScript). */
  private asyncReturn(node: ts.Expression, ctx: Ctx): Expr | undefined {
    if (!ctx.async || !this.isLibPromise(this.typeOf(node))) return undefined;
    return { e: "op", op: "promise.adopt", args: [this.expr(node, ctx)] };
  }

  /** An async arrow or function expression: a closure returning its promise (dropped where the slot returns nothing). */
  private asyncLambda(node: ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration, want?: Extract<Ty, { k: "fn" }>): Expr {
    const declared = this.checker.getSignatureFromDeclaration(node)?.getReturnType();
    const awaited = declared && (this.checker.getAwaitedType(declared) ?? declared);
    const ret = this.valueTy(awaited, node, awaited && this.isNumber(awaited) ? this.slotKind(node) : "double");
    const inner: Ctx = { async: true, ret, voidUnion: false, inTry: false };
    const params = this.params(node);
    const body = this.asyncBody(this.body(node, inner), ret, params, node);
    if (want && want.ret.k === "void") {
      const last = body.pop() as Extract<Stmt, { s: "return" }>;
      body.push({ s: "expr", x: last.x! });
      return { e: "lambda", params, ret: T.void, body };
    }
    return { e: "lambda", params, ret: { k: "promise", of: ret }, body };
  }

  /** The body of an async function or arrow, as its state machine. */
  private asyncBody(body: Stmt[], ret: Ty, params: Param[], node: ts.Node): Stmt[] {
    return lowerAsync({ body, ret, params, fresh: (base) => `${base}__${++this.temps}`, error: (message) => void this.error(node, message) });
  }

  /** A callback given to the promise runtime: it can throw (the result rejects), and takes every parameter the runtime passes. */
  private promiseCallback(arg: ts.Expression, ctx: Ctx, params: Ty[], ret: Ty, reason = false): Expr {
    const fnNode = ts.isParenthesizedExpression(arg) ? arg.expression : arg;
    if (reason && (ts.isArrowFunction(fnNode) || ts.isFunctionExpression(fnNode))) {
      const p = fnNode.parameters[0];
      // Unannotated (`any` in TypeScript's lib) or `unknown`: a caught error, an Error natively.
      if (p && (!p.type || p.type.kind === ts.SyntaxKind.UnknownKeyword)) this.reasonParams.add(p);
    }
    const x = this.expr(arg, ctx, { k: "fn", params, ret, throws: true });
    if (x.e === "lambda") while (x.params.length < params.length) x.params.push({ name: `_p${x.params.length}`, ty: params[x.params.length]!, unused: true });
    // `v => log.push(v)`: the callback's value is the new length (`push` returns nothing natively).
    if (x.e === "lambda" && !Array.isArray(x.body) && x.body.e === "op" && x.body.op === "arr.push" && (ret.k === "double" || ret.k === "int")) {
      const length: Expr = { e: "op", op: "arr.length", args: [x.body.args[0]!] };
      x.body = [{ s: "expr", x: x.body }, { s: "return", x: ret.k === "double" ? { e: "toDouble", x: length } : length }];
    }
    return x;
  }

  /** What a callback returns: a promise (adopted) or a value; `null` when it may be either. */
  private returnsPromise(arg: ts.Expression): boolean | null {
    const sig = this.checker.getSignaturesOfType(this.typeOf(arg), ts.SignatureKind.Call)[0];
    const ret = sig?.getReturnType();
    if (!ret) return false;
    if (this.isLibPromise(ret)) return true;
    if (ret.isUnion() && this.members(ret).some((t) => this.isLibPromise(t))) return null;
    return false;
  }

  /** `resolve(v)` / `reject(e)` of an executor, `p.then(…)` / `catch` / `finally`, and `Promise.resolve` / `reject` / `all`…. */
  private promiseCall(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    if (ts.isIdentifier(callee)) {
      const fixed = this.promiseParams.get(this.checker.getSymbolAtLocation(callee)!);
      if (!fixed || fixed.k !== "fn") return undefined;
      if (node.arguments.length !== fixed.params.length) return this.error(node, fixed.params.length ? "Call it with one value." : "A Promise<void> is resolved with no value: resolve().");
      const arg = node.arguments[0];
      if (arg && this.isLibPromise(this.typeOf(arg))) return this.error(arg, "Unsupported: resolving with a promise; write `p.then(resolve, reject)`.");
      return { e: "call", callee: { e: "id", name: this.idName(callee) }, args: arg ? [this.expr(arg, ctx, fixed.params[0])] : [] };
    }
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    const name = callee.name.text;
    const result = this.promiseTy(this.typeOf(node), node);
    const args = node.arguments;
    const error: Ty = T.rt("Error");
    const isError = (a: ts.Expression) => {
      const ty = this.tyOfExpr(a);
      return ty.k === "rt" && ty.name === "Error";
    };
    const lib = this.checker.getSymbolAtLocation(callee.expression)?.declarations;
    if (ts.isIdentifier(callee.expression) && callee.expression.text === "Promise" && lib?.length && lib.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d))) {
      if (!result) return this.error(node, `Promise.${name}() is not supported natively here: its promise's value has no native type. Give the promise a type (\`Promise<T>\`).`);
      switch (name) {
        case "resolve": {
          const a = args[0];
          if (a && this.isLibPromise(this.typeOf(a))) return this.expr(a, ctx);
          return { e: "op", op: "promise.resolve", args: a && result.of.k !== "void" ? [this.expr(a, ctx, result.of)] : [], ty: result };
        }
        case "reject":
          if (!args[0] || !isError(args[0])) return this.error(node, "Promise.reject() takes an Error natively: Promise.reject<T>(new Error(…)).");
          return { e: "op", op: "promise.reject", args: [this.expr(args[0], ctx, error)], ty: result };
        case "all":
        case "allSettled":
        case "race":
        case "any": {
          const a = args[0]!;
          const elems = this.checker.getIndexTypeOfType(this.typeOf(a), ts.IndexKind.Number);
          if (ts.isArrayLiteralExpression(a) ? !a.elements.every((e) => this.isLibPromise(this.typeOf(e))) : !(elems && this.isLibPromise(elems))) return this.error(a, `Promise.${name}() takes an array of promises natively (make a value a promise with Promise.resolve(v)).`);
          // What each promise holds: the result's (an array of it for all / allSettled).
          const held = name === "race" || name === "any" ? result.of : result.of.k === "array" ? result.of.of : undefined;
          const of: Ty | undefined = held && { k: "promise", of: held.k === "settled" ? held.of : held };
          if (!of) return this.error(a, `Promise.${name}() of promises of different types is not supported natively.`);
          if (ts.isArrayLiteralExpression(a) && !a.elements.every((e) => this.sameTy(this.tyOfExpr(e), of))) return this.error(a, `Promise.${name}() of promises of different types is not supported natively.`);
          return { e: "op", op: `promise.${name}` as Op, args: [this.expr(a, ctx, T.array(of))], ty: result };
        }
      }
      return this.error(node, `Promise.${name}() is not supported natively: Promise.resolve, reject, all, allSettled, race and any are.`);
    }
    const recv = this.typeOf(callee.expression);
    if (!this.isLibPromise(recv)) return undefined;
    const p = this.promiseTy(recv, node)!;
    if (!result) return this.error(node, `${name}() of a promise is not supported natively.`);
    const obj = this.expr(callee.expression, ctx);
    const pick = (kinds: (boolean | null)[]) => {
      if (kinds.includes(null) || (kinds.length > 1 && kinds[0] !== kinds[1])) return this.error(node, "Unsupported: a callback that returns a promise on some paths and a value on others (or two that differ); return one kind."), false;
      return kinds[0]!;
    };
    switch (name) {
      case "then": {
        if (!args[0] || args.length > 2 || args.some((a) => a.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(a) && a.text === "undefined"))) break;
        const adopt = pick(args.map((a) => this.returnsPromise(a)));
        const ret: Ty = adopt ? result : result.of;
        const onF = this.promiseCallback(args[0], ctx, [p.of], ret);
        if (args.length === 1) return { e: "op", op: adopt ? "promise.thenP" : "promise.then", args: [obj, onF], ty: result };
        const onR = this.promiseCallback(args[1]!, ctx, [error], ret, true);
        return { e: "op", op: adopt ? "promise.then2P" : "promise.then2", args: [obj, onF, onR], ty: result };
      }
      case "catch": {
        if (args.length !== 1) break;
        if (!this.sameTy(result.of, p.of)) return this.error(node, "Unsupported: a catch callback returning another type than the promise holds natively; return the same type.");
        const adopt = pick([this.returnsPromise(args[0]!)]);
        const onR = this.promiseCallback(args[0]!, ctx, [error], adopt ? result : result.of, true);
        return { e: "op", op: adopt ? "promise.catchP" : "promise.catch", args: [obj, onR], ty: result };
      }
      case "finally": {
        if (args.length !== 1) break;
        const adopt = pick([this.returnsPromise(args[0]!)]);
        const sig = this.checker.getSignaturesOfType(this.typeOf(args[0]!), ts.SignatureKind.Call)[0];
        const ret: Ty = adopt && sig ? this.promiseTy(sig.getReturnType(), node)! : T.void;
        return { e: "op", op: adopt ? "promise.finallyP" : "promise.finally", args: [obj, this.promiseCallback(args[0]!, ctx, [], ret)], ty: result };
      }
    }
    return this.error(node, `Unsupported: this ${name}() of a promise.`);
  }

  /** `PromiseSettledResult<T>` (an element of `Promise.allSettled`'s result): one runtime object, `JsSettled<T>`. */
  private settledTy(type: ts.Type, node: ts.Node): Ty | undefined {
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const name = symbol?.name;
    if (!name || !["PromiseSettledResult", "PromiseFulfilledResult", "PromiseRejectedResult"].includes(name) || !symbol!.declarations?.every((d) => d.getSourceFile().isDeclarationFile)) return undefined;
    const arg = type.aliasSymbol ? type.aliasTypeArguments?.[0] : name === "PromiseFulfilledResult" ? this.checker.getTypeArguments(type as ts.TypeReference)[0] : undefined;
    if (!arg) return this.error(node, "Read a settled result where its status is tested (`r.status === \"rejected\" ? r.reason : …`): natively it has no other type."), T.void;
    return { k: "settled", of: this.valueTy(arg, node) };
  }

  /** `r.status`, and `r.value` / `r.reason` where TypeScript narrowed `r` by its status. */
  private settledProp(node: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    const own = this.typeOf(node.expression);
    const symbol = own.aliasSymbol ?? own.getSymbol();
    if (!["PromiseSettledResult", "PromiseFulfilledResult", "PromiseRejectedResult"].includes(symbol?.name ?? "") || !symbol?.declarations?.every((d) => d.getSourceFile().isDeclarationFile)) return undefined;
    const field = node.name.text;
    const obj: Expr = ts.isIdentifier(node.expression) ? { e: "id", name: this.idName(node.expression) } : this.expr(node.expression, ctx);
    if (field === "status") return { e: "op", op: "settled.status", args: [obj], ty: T.string };
    if (field === "value") return { e: "op", op: "settled.value", args: [obj], ty: this.valueTy(this.typeOf(node), node) };
    if (field === "reason") return { e: "op", op: "settled.reason", args: [obj], ty: T.rt("Error") };
    return this.error(node, `Unsupported: ${field} of a settled result.`);
  }

  /** `new Promise<T>((resolve, reject) => { … })`: the executor runs at once; what it throws rejects the promise. */
  private newPromise(node: ts.NewExpression, ctx: Ctx): Expr {
    const result = this.promiseTy(this.typeOf(node), node)!;
    const executor = node.arguments?.[0];
    const fn = executor && (ts.isParenthesizedExpression(executor) ? executor.expression : executor);
    if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) || node.arguments!.length !== 1) return this.error(node, "new Promise() takes an executor function written in place: new Promise<T>((resolve, reject) => { … }).");
    const resolve: Ty = { k: "fn", params: result.of.k === "void" ? [] : [result.of], ret: T.void };
    const reject: Ty = { k: "fn", params: [T.rt("Error")], ret: T.void };
    fn.parameters.forEach((p, i) => {
      const symbol = ts.isIdentifier(p.name) ? this.checker.getSymbolAtLocation(p.name) : undefined;
      if (symbol && i < 2) this.promiseParams.set(symbol, i ? reject : resolve);
    });
    const x = this.expr(fn, ctx, { k: "fn", params: [resolve, reject], ret: T.void, throws: true });
    if (x.e === "lambda") while (x.params.length < 2) x.params.push({ name: `_p${x.params.length}`, ty: x.params.length ? reject : resolve, unused: true });
    return { e: "op", op: "promise.new", args: [x], ty: result };
  }

  // -------------------------------------------------------------------------
  // bigint and symbol: runtime value types (`big.*` / `sym.*` ops, see ir.ts). The operations JavaScript throws
  // from (a division by 0n, BigInt("x")…) are throw points, unless an operand is a constant that can't throw.
  // -------------------------------------------------------------------------

  private isBigInt(type: ts.Type): boolean {
    const t = this.nonNull(type);
    return !!(t.flags & ts.TypeFlags.BigIntLike) || (t.isUnion() && this.members(t).every((u) => !!(u.flags & ts.TypeFlags.BigIntLike)));
  }

  private isSymbol(type: ts.Type): boolean {
    const t = this.nonNull(type);
    return !!(t.flags & ts.TypeFlags.ESSymbolLike) || (t.isUnion() && this.members(t).every((u) => !!(u.flags & ts.TypeFlags.ESSymbolLike)));
  }

  /** The value of a constant bigint expression: a literal, maybe negated or parenthesized. */
  private bigConst(node: ts.Expression): bigint | undefined {
    while (ts.isParenthesizedExpression(node) || ts.isAssertionExpression(node)) node = node.expression;
    // TypeScript gives the text in decimal, but hexadecimal (`0x1fn`), which BigInt() reads too.
    if (ts.isBigIntLiteral(node)) return BigInt(node.text.slice(0, -1));
    if (!ts.isPrefixUnaryExpression(node) || node.operator !== ts.SyntaxKind.MinusToken) return undefined;
    const v = this.bigConst(node.operand);
    return v === undefined ? undefined : -v;
  }

  private bigLit(v: bigint): Expr {
    return { e: "op", op: "big.lit", args: [{ e: "str", v: String(v) }] };
  }

  /** A radix given as a whole number literal from 2 to 36 (toString() can't throw then). */
  private radix(node: ts.Expression): number | undefined {
    const v = ts.isNumericLiteral(node) ? Number(node.text) : NaN;
    return Number.isInteger(v) && v >= 2 && v <= 36 ? v : undefined;
  }

  /**
   * Whether JavaScript can throw from this bigint operation (a RangeError or a SyntaxError): `/` and `%` but by a
   * nonzero constant, `**` but to a constant exponent >= 0, BigInt() of text or of a number that may be a fraction,
   * `toString(radix)` but of a radix literal from 2 to 36.
   */
  private bigThrows(node: ts.Node): boolean {
    if (ts.isBinaryExpression(node)) {
      const op = BIG_OPS[node.operatorToken.kind];
      if ((op !== "big.div" && op !== "big.mod" && op !== "big.pow") || !this.isBigInt(this.typeOf(node.left))) return false;
      const v = this.bigConst(node.right);
      return v === undefined || (op === "big.pow" ? v < 0n : v === 0n);
    }
    if (!ts.isCallExpression(node) || node.arguments.length !== 1) return false;
    const [callee, arg] = [node.expression, node.arguments[0]!];
    if (ts.isIdentifier(callee) && callee.text === "BigInt") {
      const type = this.typeOf(arg);
      return this.isString(type) || (this.isNumber(type) && !ts.isNumericLiteral(arg) && this.numKind(arg) !== "int");
    }
    return ts.isPropertyAccessExpression(callee) && callee.name.text === "toString" && this.isBigInt(this.typeOf(callee.expression)) && this.radix(arg) === undefined;
  }

  /** `a op b` on two bigints; mixing a bigint and a number is rejected. Comparisons and `===` stay `bin`. */
  private bigBinary(node: ts.BinaryExpression, ctx: Ctx): Expr | undefined {
    const [lt, rt] = [this.typeOf(node.left), this.typeOf(node.right)];
    if ((this.isBigInt(lt) && this.isNumber(rt)) || (this.isNumber(lt) && this.isBigInt(rt))) {
      return this.error(node, "Comparing a bigint with a number is not supported natively (JavaScript compares their exact values); convert one side first: `BigInt(n)` of a whole number, or `Number(b)`.");
    }
    const op = BIG_OPS[node.operatorToken.kind];
    if (!op || !this.isBigInt(lt)) return undefined;
    return this.bigArith(op, node, this.expr(node.left, ctx), this.expr(node.right, ctx));
  }

  private bigArith(op: Op, node: ts.BinaryExpression, l: Expr, r: Expr): Expr {
    const v = this.bigConst(node.right);
    if ((op === "big.div" || op === "big.mod") && v === 0n) return this.error(node.right, "A bigint division by 0n always throws a RangeError; throw one yourself.");
    if (op === "big.pow" && v !== undefined && v < 0n) return this.error(node.right, "A bigint to a negative power always throws a RangeError; throw one yourself.");
    return { e: "op", op, args: [l, r], ...(this.bigThrows(node) ? { throws: true } : {}) };
  }

  /** `b += x`, `b <<= x`, `b++` as statements: `b = b op x`. */
  private bigAssign(node: ts.Expression, ctx: Ctx): Stmt[] | undefined {
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && this.isIncrement(node) && this.isBigInt(this.typeOf(node.operand))) {
      if (!this.isPure(node.operand)) return [this.unsupported(node, "++ / -- on a computed bigint target")];
      const value: Expr = { e: "op", op: node.operator === ts.SyntaxKind.PlusPlusToken ? "big.add" : "big.sub", args: [this.expr(node.operand, ctx), this.bigLit(1n)] };
      return [{ s: "assign", target: this.lvalue(node.operand, ctx), op: "=", value }];
    }
    if (!ts.isBinaryExpression(node) || node.operatorToken.kind === ts.SyntaxKind.EqualsToken || !this.isAssignment(node.operatorToken.kind)) return undefined;
    const op = BIG_OPS[node.operatorToken.kind];
    if (!op || !this.isBigInt(this.typeOf(node.left))) return undefined;
    if (!this.isPure(node.left)) return [this.unsupported(node, "this compound assignment to a computed target")];
    return [{ s: "assign", target: this.lvalue(node.left, ctx), op: "=", value: this.bigArith(op, node, this.expr(node.left, ctx), this.expr(node.right, ctx)) }];
  }

  /** `-b`, `~b` (a negated literal is one literal); `++b` as a value is rejected. */
  private bigUnary(node: ts.PrefixUnaryExpression, ctx: Ctx): Expr | undefined {
    if (!this.isBigInt(this.typeOf(node.operand))) return undefined;
    const v = this.bigConst(node);
    if (v !== undefined) return this.bigLit(v);
    if (node.operator === ts.SyntaxKind.MinusToken) return { e: "op", op: "big.neg", args: [this.expr(node.operand, ctx)] };
    if (node.operator === ts.SyntaxKind.TildeToken) return { e: "op", op: "big.not", args: [this.expr(node.operand, ctx)] };
    if (this.isIncrement(node)) return this.updateValue(node, ctx);
    return undefined;
  }

  /** `if (b)`: a bigint is truthy but 0n. */
  private bigTruthy(node: ts.Expression, type: ts.Type, x: Expr): Expr {
    const nonZero = (v: Expr): Expr => ({ e: "bin", op: "!=", l: v, r: this.bigLit(0n) });
    if (!this.isNullable(type)) return nonZero(x);
    if (!this.isPure(node)) return this.error(node, "The truthiness of a computed `bigint | undefined`: read it into a variable first.");
    const opt = x.e === "unwrap" ? x.x : x;
    return { e: "bin", op: "&&", l: { e: "bin", op: "!=", l: opt, r: { e: "nil" } }, r: nonZero({ e: "unwrap", x: opt }) };
  }

  // -------------------------------------------------------------------------
  // Typed arrays: a view over packed storage (the runtimes' `Uint8Array`…, IR `rt`). Element reads are Ints for the
  // small integer kinds (bound TYPED_ARRAYS), Doubles otherwise; writes are `put` (an Int) / `putD` (a Double), which
  // convert as JavaScript does. Callbacks get the value as a Double and the index as an Int.
  // -------------------------------------------------------------------------

  private fromLib(symbol: ts.Symbol | undefined): boolean {
    return !!symbol?.declarations?.length && symbol.declarations.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d));
  }

  /** The typed array a type is (`Uint8Array`…), not null. */
  private taName(type: ts.Type): RuntimeType | undefined {
    const symbol = type.getSymbol();
    return symbol && symbol.name in TYPED_ARRAYS && !type.isUnion() && this.fromLib(symbol) ? (symbol.name as RuntimeType) : undefined;
  }

  private isTypedArray(type: ts.Type): boolean {
    return !!this.taName(this.checker.getNonNullableType(type));
  }

  /** `Uint8Array` as a value (its constructor: `new`, `of`, `from`, `BYTES_PER_ELEMENT`). */
  private taCtor(node: ts.Expression): RuntimeType | undefined {
    if (!ts.isIdentifier(node) || !(node.text in TYPED_ARRAYS || TA_UNSUPPORTED.has(node.text)) || !this.fromLib(this.checker.getSymbolAtLocation(node))) return undefined;
    if (TA_UNSUPPORTED.has(node.text)) return this.error(node, this.taUnsupported(node.text)), undefined;
    return node.text as RuntimeType;
  }

  private taElem(name: RuntimeType): Ty {
    return TYPED_ARRAYS[name] ? T.int : T.double;
  }

  private taBytes(name: string): number {
    return /^(Ui|I)nt8|Uint8C/.test(name) ? 1 : /16/.test(name) ? 2 : name === "Float64Array" ? 8 : 4;
  }

  /** The element read `ta[i]` / `ta.at(i)` / `ta.find(…)` of a typed array whose values are Ints. */
  private taIntRead(node: ts.Expression): number | undefined {
    if (ts.isElementAccessExpression(node)) return TYPED_ARRAYS[this.taName(this.checker.getNonNullableType(this.typeOf(node.expression))) ?? ""];
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["at", "find"].includes(node.expression.name.text)) {
      return TYPED_ARRAYS[this.taName(this.checker.getNonNullableType(this.typeOf(node.expression.expression))) ?? ""];
    }
    return undefined;
  }

  /** A typed array's callback's index parameter (`(x, i) => …`), an Int. */
  private isTaIndexParam(fn: ts.Node, param: ts.ParameterDeclaration): boolean {
    const call = fn.parent;
    if (!(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) || fn.parameters.indexOf(param) !== 1 || !ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression)) return false;
    const name = call.expression.name.text;
    if (name === "from" && call.arguments[1] === fn) return !!this.taCtor(call.expression.expression);
    return call.arguments[0] === fn && ["map", "filter", "forEach", "some", "every", "find", "findIndex"].includes(name) && this.isTypedArray(this.typeOf(call.expression.expression));
  }

  /** `ta.new`'s second argument is the class's name (printers see the op's arguments only). */
  private taOp(op: "ta.new" | "ta.call" | "ta.prop", ty: Ty, ...args: Expr[]): Expr {
    if (op === "ta.new" && ty.k === "rt") args.splice(1, 0, { e: "str", v: ty.name });
    return { e: "op", op, args, ty };
  }

  private taCallOf(obj: Expr, name: string, ty: Ty, ...args: Expr[]): Expr {
    return this.taOp("ta.call", ty, obj, { e: "str", v: name }, ...args);
  }

  /** `new X(n)`, `new X(numbers)`, `new X(typedArray)`. */
  private taMake(name: RuntimeType, arg: ts.Expression | undefined, ctx: Ctx): Expr {
    const ty = T.rt(name);
    if (!arg) return this.taOp("ta.new", ty, { e: "str", v: "len" }, { e: "int", v: "0" });
    const type = this.typeOf(arg);
    if (this.isNullable(type)) return this.error(arg, "Narrow this value first (it may be null or undefined).");
    if (this.isNumber(type)) return this.taOp("ta.new", ty, { e: "str", v: "len" }, this.expr(arg, ctx, T.int));
    if (this.isTypedArray(type)) return this.taOp("ta.new", ty, { e: "str", v: "typed" }, this.expr(arg, ctx));
    const elem = this.isArray(type) ? this.checker.getIndexTypeOfType(type, ts.IndexKind.Number) : undefined;
    if (elem && this.isNumber(elem)) return this.taOp("ta.new", ty, { e: "str", v: "doubles" }, this.expr(arg, ctx, T.array(T.double)));
    return this.error(arg, `${name} takes a length, an array of numbers or another typed array natively (no ArrayBuffer or other iterable).`);
  }

  private taNew(node: ts.NewExpression, ctx: Ctx): Expr | undefined {
    const ab = this.abNew(node, ctx);
    if (ab) return ab;
    const name = this.taCtor(node.expression);
    if (!name) return TA_UNSUPPORTED.has(node.expression.getText()) ? { e: "nil" } : undefined;
    if ((node.arguments?.length ?? 0) > 1) return this.error(node, `new ${name}(buffer, offset, length) is not supported natively (no ArrayBuffer); use subarray().`);
    return this.taMake(name, node.arguments?.[0], ctx);
  }

  // -------------------------------------------------------------------------
  // ArrayBuffer and DataView (lib4): an ArrayBuffer is the byte store Uint8Array / Uint8ClampedArray views share
  // (other typed arrays keep their own packed store: read other number types through a DataView). Every operation
  // that JavaScript can make throw a RangeError (a length, an offset, a read past the end) throws it (libThrows).
  // Helpers are `js.fn`s: jsNewArrayBuffer, jsNewDataView(Len), jsNewUint8Array(Len), jsDvGet / jsDvSet (a kind
  // number: 0 Int8 … 7 Float64), jsDvGetBig / jsDvSetBig, jsAbSlice, jsTaBuffer.
  // -------------------------------------------------------------------------

  /** Why SharedArrayBuffer / BigInt64Array / BigUint64Array have no native form, and what to write. */
  private taUnsupported(name: string): string {
    return name.startsWith("Big")
      ? `${name} is not supported natively (its elements would be bigints in a packed store): use a bigint[], or a DataView's get${name.slice(0, -5)} / set${name.slice(0, -5)} over an ArrayBuffer.`
      : `${name} is not supported natively (no shared memory between threads): use an ArrayBuffer, or a typed array (Uint8Array, Int32Array, Float64Array…) without its buffer.`;
  }

  /** `ArrayBuffer` / `DataView` of TypeScript's lib. */
  private abName(type: ts.Type): "ArrayBuffer" | "DataView" | undefined {
    const s = type.getSymbol();
    return s && !type.isUnion() && this.fromLib(s) && (s.name === "ArrayBuffer" || s.name === "DataView") ? s.name : undefined;
  }

  private abFn(name: string, ty: Ty, args: Expr[], throws: boolean): Expr {
    return { ...this.jsFn(name, ty, args), ...(throws ? { throws: true } : {}) };
  }

  /** `new ArrayBuffer(n)`, `new DataView(buffer, offset?, length?)`, `new Uint8Array(buffer, offset?, length?)`. */
  private abNew(node: ts.NewExpression, ctx: Ctx): Expr | undefined {
    const ctor = node.expression;
    if (!ts.isIdentifier(ctor) || !this.fromLib(this.checker.getSymbolAtLocation(ctor))) return undefined;
    const args = node.arguments ?? [];
    const num = (a: ts.Expression) => this.expr(a, ctx, T.double);
    if (ctor.text === "FinalizationRegistry") {
      return this.error(node, "FinalizationRegistry is not supported natively: its callbacks run whenever the garbage collector decides (natively at once, or never on the JVM), so no program output could match; release resources explicitly (a dispose() method: `Disposable`, `use(resource, body)` and `Disposer` in @nuclo/native-ts/adapters).");
    }
    if (ctor.text === "ArrayBuffer") {
      if (args.length !== 1) return this.error(node, "new ArrayBuffer(byteLength) takes one length natively (no resizable buffers).");
      return this.abFn("newArrayBuffer", T.rt("ArrayBuffer"), [num(args[0]!)], true);
    }
    const first = args[0];
    if (!first || this.abName(this.typeOf(first)) !== "ArrayBuffer") return undefined;
    const name = ctor.text;
    if (name !== "DataView" && name !== "Uint8Array" && name !== "Uint8ClampedArray") {
      return this.error(node, `new ${name}(buffer, …) is not supported natively: only Uint8Array / Uint8ClampedArray views share an ArrayBuffer's bytes; read other number types through a DataView (getInt16, getFloat64…).`);
    }
    if (this.isNullable(this.typeOf(first))) return this.error(first, "Narrow this value first (it may be null or undefined).");
    const rest = [this.expr(first, ctx), args[1] ? num(args[1]) : { e: "double", v: "0.0" } as Expr, ...(args[2] ? [num(args[2])] : [])];
    return this.abFn(`new${name}${args[2] ? "Len" : ""}`, T.rt(name as RuntimeType), rest, true);
  }

  /** `buffer.slice(…)`, `view.getInt16(offset, littleEndian?)` / `setFloat64(offset, value, littleEndian?)`…. */
  private abCall(node: ts.CallExpression, callee: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    const type = this.typeOf(callee.expression);
    const kind = this.abName(this.checker.getNonNullableType(type));
    if (!kind) return undefined;
    if (this.isNullable(type) || callee.questionDotToken) return this.error(node, `Narrow the ${kind} first (it may be null or undefined).`);
    const name = callee.name.text;
    const args = node.arguments;
    const obj = this.expr(callee.expression, ctx);
    const num = (i: number, fallback: Expr): Expr => (args[i] ? this.expr(args[i]!, ctx, T.double) : fallback);
    if (kind === "ArrayBuffer") {
      if (name !== "slice") return this.error(node, `ArrayBuffer.prototype.${name} is not available natively.`);
      return this.abFn("abSlice", T.rt("ArrayBuffer"), [obj, num(0, { e: "double", v: "0.0" }), num(1, { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] })], false);
    }
    const m = /^(get|set)(Int8|Uint8|Int16|Uint16|Int32|Uint32|Float32|Float64|BigInt64|BigUint64)$/.exec(name);
    if (!m) return this.error(node, `DataView.prototype.${name} is not available natively.`);
    const [, op, what] = m as unknown as [string, "get" | "set", string];
    const little = (i: number): Expr => (args[i] ? this.cond(args[i]!, ctx) : { e: "bool", v: false });
    const at = num(0, { e: "double", v: "0.0" });
    if (what.startsWith("Big")) {
      const signed: Expr = { e: "bool", v: what === "BigInt64" };
      if (op === "get") return this.abFn("dvGetBig", T.rt("BigInt"), [obj, signed, at, little(1)], true);
      return this.abFn("dvSetBig", T.void, [obj, signed, at, this.expr(args[1]!, ctx, T.rt("BigInt")), little(2)], true);
    }
    const code: Expr = { e: "int", v: String(["Int8", "Uint8", "Int16", "Uint16", "Int32", "Uint32", "Float32", "Float64"].indexOf(what)) };
    if (op === "get") return this.abFn("dvGet", T.double, [obj, code, at, little(1)], true);
    return this.abFn("dvSet", T.void, [obj, code, at, num(1, { e: "op", op: "math.fn", args: [{ e: "str", v: "NaN" }] }), little(2)], true);
  }

  /** `buffer.byteLength`, `view.buffer` / `byteLength` / `byteOffset`, `uint8.buffer`. */
  private abProperty(node: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    const type = this.typeOf(node.expression);
    const name = node.name.text;
    const kind = this.abName(this.checker.getNonNullableType(type));
    const ta = kind ? undefined : this.taName(this.checker.getNonNullableType(type));
    if (!kind && !(name === "buffer" && (ta === "Uint8Array" || ta === "Uint8ClampedArray"))) return undefined;
    if (this.isNullable(type) || node.questionDotToken) return this.error(node, `Narrow the ${kind ?? ta} first (it may be null or undefined).`);
    const obj = this.expr(node.expression, ctx);
    if (ta) return this.jsFn("taBuffer", T.rt("ArrayBuffer"), [obj]);
    if (kind === "ArrayBuffer" && name === "byteLength") return this.jsFn("abByteLength", T.double, [obj]);
    if (kind === "DataView" && name === "buffer") return this.jsFn("dvBuffer", T.rt("ArrayBuffer"), [obj]);
    if (kind === "DataView" && (name === "byteLength" || name === "byteOffset")) return this.jsFn(`dv${name[0]!.toUpperCase()}${name.slice(1)}`, T.double, [obj]);
    return this.error(node, `${kind}.prototype.${name} is not available natively.`);
  }

  /** A typed array's callback: an arrow function or function expression, given both the value and the index. */
  private taCallback(arg: ts.Expression | undefined, params: Ty[], ret: Ty, ctx: Ctx): Expr {
    if (!arg || !(ts.isArrowFunction(arg) || ts.isFunctionExpression(arg))) return this.error(arg!, "Pass a typed array method an arrow function natively.");
    if (arg.parameters.length > params.length) return this.error(arg, `This callback takes at most ${params.length} parameters natively (not the array).`);
    if (this.valueThrows(arg)) return this.error(arg, "A typed array method's callback that can throw is not supported natively; catch inside it.");
    const fn = this.expr(arg, ctx, { k: "fn", params, ret });
    if (fn.e !== "lambda") return fn;
    for (let i = fn.params.length; i < params.length; i++) fn.params.push({ name: `ta__${++this.temps}`, ty: params[i]!, unused: true });
    return fn;
  }

  /** `X.of(…)`, `X.from(…)` and the methods of typed arrays. */
  private taCall(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    const ab = this.abCall(node, callee, ctx);
    if (ab) return ab;
    const name = callee.name.text;
    const args = node.arguments;
    if (args.some(ts.isSpreadElement)) return this.isTypedArray(this.typeOf(callee.expression)) || this.taCtor(callee.expression) ? this.error(node, "Spread arguments are not supported in this call natively (its native function takes a fixed list of arguments): pass them one by one (`f(xs[0]!, xs[1]!)`).") : undefined;
    const ctor = this.taCtor(callee.expression);
    if (ctor) {
      if (name === "of") return this.taOp("ta.new", T.rt(ctor), { e: "str", v: "doubles" }, { e: "arr", of: T.double, items: args.map((a) => this.expr(a, ctx, T.double)) });
      if (name !== "from" || args.length > 2) return this.error(node, `${ctor}.${name}(${args.length > 2 ? "…, thisArg" : ""}) is not available natively.`);
      if (!args[1]) return this.taMake(ctor, args[0], ctx);
      if (!this.isArray(this.typeOf(args[0]!))) return this.error(args[0]!, `${ctor}.from(source, map) takes an array of numbers natively (write [...source] for a typed array).`);
      const mapped: Expr = { e: "op", op: "arr.mapI", args: [this.expr(args[0]!, ctx, T.array(T.double)), this.taCallback(args[1], [T.double, T.int], T.double, ctx)] };
      return this.taOp("ta.new", T.rt(ctor), { e: "str", v: "doubles" }, mapped);
    }
    const recvType = this.typeOf(callee.expression);
    const ta = this.taName(this.checker.getNonNullableType(recvType));
    if (!ta) return undefined;
    if (this.isNullable(recvType)) return this.error(node, "Narrow the typed array first (it may be null or undefined).");
    const obj = this.expr(callee.expression, ctx);
    const self = T.rt(ta);
    const elem = this.taElem(ta);
    const num = (i: number, fallback: "0" | "Infinity"): Expr =>
      args[i] ? this.expr(args[i]!, ctx, T.double) : fallback === "0" ? { e: "double", v: "0.0" } : { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] };
    const cb = (ret: Ty) => this.taCallback(args[0], [T.double, T.int], ret, ctx);
    switch (name) {
      case "fill":
        return this.taCallOf(obj, "fill", self, num(0, "0"), num(1, "0"), num(2, "Infinity"));
      case "subarray":
      case "slice":
        return this.taCallOf(obj, name, self, num(0, "0"), num(1, "Infinity"));
      case "copyWithin":
        return this.taCallOf(obj, name, self, num(0, "0"), num(1, "0"), num(2, "Infinity"));
      case "set": {
        const src = args[0]!;
        if (this.isTypedArray(this.typeOf(src))) return this.taCallOf(obj, "setFromTa", T.void, this.expr(src, ctx), num(1, "0"));
        if (!this.isArray(this.typeOf(src))) return this.error(src, "set() takes an array of numbers or a typed array natively.");
        return this.taCallOf(obj, "setFrom", T.void, this.expr(src, ctx, T.array(T.double)), num(1, "0"));
      }
      case "reverse":
        return this.taCallOf(obj, name, self);
      case "sort":
        return args[0] ? this.taCallOf(obj, "sortBy", self, this.taCallback(args[0], [T.double, T.double], T.double, ctx)) : this.taCallOf(obj, "sortNum", self);
      case "indexOf":
      case "includes":
        return this.taCallOf(obj, name, name === "includes" ? T.bool : T.int, num(0, "0"), num(1, "0"));
      case "lastIndexOf":
        return this.taCallOf(obj, name, T.int, num(0, "0"), num(1, "Infinity"));
      case "join":
      case "toString":
        return this.taCallOf(obj, "join", T.string, name === "join" && args[0] ? this.expr(args[0], ctx, T.string) : { e: "str", v: "," });
      case "at":
        return this.taCallOf(obj, "jsAt", T.optional(elem), num(0, "0"));
      case "map":
      case "filter":
        return this.taCallOf(obj, name, self, cb(name === "map" ? T.double : T.bool));
      case "forEach":
        return this.taCallOf(obj, name, T.void, cb(T.void));
      case "some":
      case "every":
        return this.taCallOf(obj, name, T.bool, cb(T.bool));
      case "find":
        return this.taCallOf(obj, name, T.optional(elem), cb(T.bool));
      case "findIndex":
        return this.taCallOf(obj, name, T.int, cb(T.bool));
      case "reduce": {
        if (args.length < 2) return this.error(node, "Give reduce() an initial value: without one it throws on an empty typed array, which natively would crash.");
        const acc = this.tyOfExpr(node);
        return this.taCallOf(obj, name, acc, this.expr(args[1]!, ctx, acc), this.taCallback(args[0], [acc, T.double], acc, ctx));
      }
    }
    return this.error(node, `${ta}.${name}() is not available natively.`);
  }

  /** `ta.length`, `ta.byteLength`, `ta.byteOffset`, `X.BYTES_PER_ELEMENT`. */
  private taProperty(node: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    const ab = this.abProperty(node, ctx);
    if (ab) return ab;
    const name = node.name.text;
    const ctor = this.taCtor(node.expression);
    if (ctor) return name === "BYTES_PER_ELEMENT" ? { e: "int", v: String(this.taBytes(ctor)) } : this.error(node, `${ctor}.${name} is not available natively.`);
    const type = this.typeOf(node.expression);
    const ta = this.taName(this.checker.getNonNullableType(type));
    if (!ta) return undefined;
    if (this.isNullable(type)) return this.error(node, "Narrow the typed array first (it may be null or undefined).");
    if (name === "BYTES_PER_ELEMENT") return { e: "int", v: String(this.taBytes(ta)) };
    if (["length", "byteLength", "byteOffset"].includes(name)) return this.taOp("ta.prop", T.int, this.expr(node.expression, ctx), { e: "str", v: name });
    return this.error(node, `${ta}.${name} is not available natively${name === "buffer" ? " (no ArrayBuffer: share memory with subarray())" : ""}.`);
  }

  /** `ta[i]` (undefined out of range) or, narrowed / asserted, `ta[i]!` (traps out of range, as an array read does). */
  private taIndex(node: ts.ElementAccessExpression, ctx: Ctx, present: boolean): Expr | undefined {
    const ta = this.taName(this.checker.getNonNullableType(this.typeOf(node.expression)));
    if (!ta) return undefined;
    if (node.questionDotToken || this.isNullable(this.typeOf(node.expression))) return this.error(node, "Narrow the typed array first (it may be null or undefined).");
    const elem = this.taElem(ta);
    const index = this.expr(node.argumentExpression, ctx, T.int);
    return present ? this.taCallOf(this.expr(node.expression, ctx), "get", elem, index) : this.taCallOf(this.expr(node.expression, ctx), "opt", T.optional(elem), index);
  }

  /** `ta[i] = v`, `ta[i] op= v`, `ta[i]++` as statements: the value converted on write, as JavaScript does. */
  private taAssign(node: ts.Expression, ctx: Ctx): Stmt[] | undefined {
    const inc = (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && this.isIncrement(node) ? node : undefined;
    const bin = ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind) ? node : undefined;
    let target = inc ? inc.operand : bin?.left;
    while (target && (ts.isParenthesizedExpression(target) || ts.isNonNullExpression(target))) target = target.expression;
    if (!target || !ts.isElementAccessExpression(target)) return undefined;
    const ta = this.taName(this.checker.getNonNullableType(this.typeOf(target.expression)));
    if (!ta) return undefined;
    if (this.isLogicalAssignment(bin?.operatorToken.kind ?? ts.SyntaxKind.Unknown)) return [this.unsupported(node, "a logical assignment to a typed array element")];
    const obj = this.expr(target.expression, ctx);
    const index = this.expr(target.argumentExpression, ctx, T.int);
    const put = (v: Expr, int: boolean): Stmt[] => [{ s: "expr", x: this.taCallOf(obj, int ? "put" : "putD", T.void, index, v) }];
    if (bin?.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const int = this.numKind(bin.right) === "int";
      return put(this.expr(bin.right, ctx, int ? T.int : T.double), int);
    }
    const pure = (n: ts.Expression) => this.isPure(n) || ts.isNumericLiteral(n);
    if (!pure(target.expression) || !pure(target.argumentExpression)) return [this.unsupported(node, "this compound assignment to a typed array element with a computed array or index; read them into variables first")];
    const elem = this.taElem(ta);
    const current = this.taCallOf(obj, "get", elem, index);
    const K = ts.SyntaxKind;
    const kind = inc ? (inc.operator === K.PlusPlusToken ? K.PlusEqualsToken : K.MinusEqualsToken) : bin!.operatorToken.kind;
    const right: ts.Expression | undefined = bin?.right;
    const rightInt = !right || (this.numKind(right) === "int" && this.intBound(right) < 2 ** 30 + 2 ** 16);
    const rhs = (ty: Ty): Expr => (right ? this.expr(right, ctx, ty) : ty.k === "int" ? { e: "int", v: "1" } : { e: "double", v: "1.0" });
    // Ints: `+ -` wrap modulo 2^32 at worst (Kotlin), which the store's own wrapping makes exact (and clamped never wraps).
    if (elem.k === "int" && rightInt && (kind === K.PlusEqualsToken || kind === K.MinusEqualsToken)) {
      return put({ e: "bin", op: kind === K.PlusEqualsToken ? "+" : "-", l: current, r: rhs(T.int) }, true);
    }
    const bits: Partial<Record<ts.SyntaxKind, Op>> = {
      [K.AmpersandEqualsToken]: "bit.and", [K.BarEqualsToken]: "bit.or", [K.CaretEqualsToken]: "bit.xor", [K.LessThanLessThanEqualsToken]: "bit.shl",
      [K.GreaterThanGreaterThanEqualsToken]: "bit.shr", [K.GreaterThanGreaterThanGreaterThanEqualsToken]: "bit.ushr",
    };
    const bit = bits[kind];
    if (bit) return put({ e: "op", op: bit, args: [current, this.expr(right!, ctx)] }, bit !== "bit.ushr");
    const d: Expr = elem.k === "int" ? { e: "toDouble", x: current } : current;
    const arith: Partial<Record<ts.SyntaxKind, BinOp>> = { [K.PlusEqualsToken]: "+", [K.MinusEqualsToken]: "-", [K.AsteriskEqualsToken]: "*", [K.SlashEqualsToken]: "/" };
    if (arith[kind]) return put({ e: "bin", op: arith[kind]!, l: d, r: rhs(T.double) }, false);
    if (kind === K.PercentEqualsToken) return put({ e: "op", op: "math.fn", args: [{ e: "str", v: "fmod" }, d, rhs(T.double)] }, false);
    if (kind === K.AsteriskAsteriskEqualsToken) return put({ e: "op", op: "math.pow", args: [d, rhs(T.double)] }, false);
    return [this.unsupported(node, "this assignment operator on a typed array element")];
  }

  /** `for (const x of ta)`: over the indices, reading each value when its turn comes (as JavaScript's iterator does). */
  private taForOf(node: ts.ForOfStatement, ctx: Ctx): Stmt[] | undefined {
    const ta = this.taName(this.checker.getNonNullableType(this.typeOf(node.expression)));
    if (!ta) return undefined;
    const decl = node.initializer as ts.VariableDeclarationList;
    const binding = decl.declarations[0]!.name;
    if (!ts.isIdentifier(binding)) return [this.unsupported(binding, "destructuring the values of a typed array")];
    const n = ++this.temps;
    const [arr, idx] = [`ta__${n}`, `i__${n}`];
    const ty = this.tyOfSymbol(this.checker.getSymbolAtLocation(binding)!, binding);
    const read = this.taCallOf({ e: "id", name: arr }, "get", this.taElem(ta), { e: "id", name: idx });
    const turn = this.loopBox(binding);
    const body: Stmt[] = [
      // `for (const _ of ta)` counts: no variable (Kotlin has no `val _`).
      ...(binding.text === "_" ? [] : [{ s: "let", name: binding.text, ty, init: ty.k === "double" && this.taElem(ta).k === "int" ? { e: "toDouble", x: read } : read, mutable: !(decl.flags & ts.NodeFlags.Const) } satisfies Stmt]),
      ...(turn ? [turn.make] : []),
      ...this.block(node.statement, { ...ctx, continueWith: undefined }),
    ];
    return [
      { s: "let", name: arr, ty: T.rt(ta), init: this.expr(node.expression, ctx), mutable: false },
      { s: "forRange", name: idx, from: { e: "int", v: "0" }, to: this.taOp("ta.prop", T.int, { e: "id", name: arr }, { e: "str", v: "length" }), inclusive: false, body, ...this.loopLabel(node) },
    ];
  }

  // -------------------------------------------------------------------------
  // Map and Set: each runtime's `JsOMap` (a Set is one without values), a shared insertion-ordered hash map whose
  // iteration is live (`next(seq)`: see the runtimes). IR types `jsmap` / `jsset`, operations `mc.new` / `mc.call`.
  // -------------------------------------------------------------------------

  /** `Map` / `Set` of TypeScript's lib (or their Readonly views), not null. */
  private mcKind(type: ts.Type): "Map" | "Set" | undefined {
    const symbol = type.getSymbol();
    if (!symbol || type.isUnion() || !this.fromLib(symbol)) return undefined;
    return ["Map", "ReadonlyMap", "WeakMap"].includes(symbol.name) ? "Map" : ["Set", "ReadonlySet", "WeakSet"].includes(symbol.name) ? "Set" : undefined;
  }

  /** `WeakMap` / `WeakSet` / `WeakRef` of TypeScript's lib. */
  private weakKind(type: ts.Type): string | undefined {
    const symbol = type.getSymbol();
    return symbol && !type.isUnion() && this.fromLib(symbol) && ["WeakMap", "WeakSet", "WeakRef"].includes(symbol.name) ? symbol.name : undefined;
  }

  /**
   * A weak collection's key / WeakRef's target: an object natively held by reference (an instance, an array, a
   * record). A WeakMap value that can reach its key would keep the key alive natively (JavaScript's GC collects both):
   * rejected, as a cycle is.
   */
  private weakTy(kind: string, type: ts.Type, node: ts.Node): Ty {
    const [k, v] = this.checker.getTypeArguments(type as ts.TypeReference);
    const key = this.ty(k!, node);
    if (!["class", "array", "map"].includes(key.k)) {
      return this.error(node, `A ${kind} ${kind === "WeakRef" ? "target" : "key"} of type ${this.checker.typeToString(k!)} is not supported natively: weakly held keys are objects (a class instance, an object, an array or a record).`), T.string;
    }
    if (kind === "WeakRef") return { k: "jsset", of: key, weak: true, ref: true };
    if (kind === "WeakSet") return { k: "jsset", of: key, weak: true };
    const seen = new Set<ts.Type>();
    const reaches = (t: ts.Type, depth: number): boolean => {
      if (depth > 12 || seen.has(t)) return false;
      seen.add(t);
      if (t === k || (t.getSymbol() && t.getSymbol() === k!.getSymbol())) return true;
      if (t.isUnion() || t.isIntersection()) return t.types.some((m) => reaches(m, depth + 1));
      if (t.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.BigIntLike | ts.TypeFlags.Null | ts.TypeFlags.Undefined)) return false;
      const args = this.checker.getTypeArguments(t as ts.TypeReference) ?? [];
      if (args.some((a) => reaches(a, depth + 1))) return true;
      if (t.getCallSignatures().length) return true; // a function may capture the key
      return t.getProperties().some((p) => p.valueDeclaration && !this.fromLib(p) && reaches(this.checker.getTypeOfSymbolAtLocation(p, node), depth + 1));
    };
    if (reaches(v!, 0)) {
      return this.error(node, `This WeakMap's values can hold its key (${this.checker.typeToString(v!)} reaches ${this.checker.typeToString(k!)}): natively the value would keep the key alive (JavaScript collects both). Key the data by an id in a Map, or keep values that don't refer back.`), T.string;
    }
    return { k: "jsmap", key, of: this.ty(v!, node), weak: true };
  }

  private mcTy(type: ts.Type, node: ts.Node): Ty | undefined {
    const weak = this.weakKind(type);
    if (weak) return this.weakTy(weak, type, node);
    const kind = this.mcKind(type);
    if (!kind) {
      const name = type.getSymbol()?.name ?? "";
      if (["MapIterator", "SetIterator"].includes(name) && this.fromLib(type.getSymbol())) {
        return this.error(node, name.startsWith("Weak") ? `${name} is not supported natively (no weak references to keys): use a Map / Set and delete entries when done.` : `A ${name} as a value is not supported natively: use keys() / values() / entries() in for…of, a spread ([...m.keys()]), Array.from or new Map / new Set.`), T.string;
      }
      return undefined;
    }
    const [k, v] = this.checker.getTypeArguments(type as ts.TypeReference);
    const key = this.ty(k!, node);
    const ok = ["double", "int", "string", "bool", "class", "array", "map", "jsmap", "jsset"].includes(key.k) || (key.k === "rt" && key.name === "BigInt");
    if (!ok) this.error(node, `A ${kind} ${kind === "Map" ? "key" : "element"} of type ${this.checker.typeToString(k!)} is not supported natively (a union, a nullable value, a function or a symbol): key by a string, a number, a boolean, a bigint or an object.`);
    return kind === "Map" ? { k: "jsmap", key, of: this.ty(v!, node) } : { k: "jsset", of: key };
  }

  private mcOp(obj: Expr, method: string, ty: Ty, ...args: Expr[]): Expr {
    return { e: "op", op: "mc.call", args: [obj, { e: "str", v: method }, ...args], ty };
  }

  /** `new Map(…)` / `new Set(…)`: empty, a copy of another, from an array (of pairs), keys / values / entries, Object.entries. */
  private mcNew(node: ts.NewExpression, ctx: Ctx, want?: Ty): Expr | undefined {
    const ctor = node.expression;
    if (!ts.isIdentifier(ctor) || !["Map", "Set", "WeakMap", "WeakSet", "WeakRef"].includes(ctor.text) || !this.fromLib(this.checker.getSymbolAtLocation(ctor))) return undefined;
    if (ctor.text.startsWith("Weak")) {
      // WeakMap / WeakSet start empty (lib4); WeakRef holds its target (mc.new's argument).
      const wty = this.ty(this.typeOf(node), node);
      if (wty.k !== "jsmap" && wty.k !== "jsset") return { e: "nil" };
      if (ctor.text === "WeakRef") return node.arguments?.length === 1 ? { e: "op", op: "mc.new", args: [this.expr(node.arguments[0]!, ctx, wty.of)], ty: wty } : this.error(node, "new WeakRef(target) takes one object.");
      if (node.arguments?.length) return this.error(node, `new ${ctor.text}() starts empty natively: add the entries with ${ctor.text === "WeakMap" ? "set" : "add"}().`);
      return { e: "op", op: "mc.new", args: [], ty: wty };
    }
    const ty = want && (want.k === "jsmap" || want.k === "jsset") ? want : this.ty(this.typeOf(node), node);
    if (ty.k !== "jsmap" && ty.k !== "jsset") return { e: "nil" };
    const made: Expr = { e: "op", op: "mc.new", args: [], ty };
    const key = ty.k === "jsmap" ? ty.key : ty.of;
    const arg = node.arguments?.[0];
    if (!arg || arg.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(arg) && arg.text === "undefined")) return made;
    if (node.arguments!.length > 1 || ts.isSpreadElement(arg)) return this.error(node, `new ${ctor.text}(…) takes one argument natively.`);
    const argType = this.typeOf(arg);
    if (this.isNullable(argType)) return this.error(arg, "Narrow this value first (it may be null or undefined).");
    if (this.mcKind(argType) === ctor.text && this.sameTy(this.tyOfExpr(arg), ty)) return this.mcOp(this.expr(arg, ctx), "copy", ty);
    const listed = this.mcListing(arg);
    if (listed?.what === "entries" && ty.k === "jsmap" && this.sameTy(this.tyOfExpr(listed.recv), ty)) return this.mcOp(this.expr(listed.recv, ctx), "copy", ty);
    if (ty.k === "jsset") {
      const items = listed ? this.mcListed(arg, ctx) : this.isArray(argType) ? this.expr(arg, ctx, T.array(key)) : undefined;
      if (items) return this.mcOp(made, "addAll", ty, items);
      return this.error(arg, "new Set(…) takes an array, another Set, or a Map's keys() / values() natively.");
    }
    // Object.entries(map): its keys and values, in its order.
    if (this.objectCall(arg) === "entries") {
      const source = (arg as ts.CallExpression).arguments[0]!;
      const rec = this.tyOfExpr(source);
      if (rec.k !== "map" || !this.sameTy(key, T.string) || !this.sameTy(rec.of, ty.of)) return this.error(arg, "new Map(Object.entries(x)) takes a Record<string, V> of the map's value type natively.");
      if (!this.isPure(source)) return this.error(source, "Put the object in a variable first.");
      const obj = this.expr(source, ctx);
      return this.mcOp(made, "setAll", ty, { e: "op", op: "map.keys", args: [obj] }, { e: "op", op: "map.values", args: [obj] });
    }
    if (!this.isArray(argType)) return this.error(arg, "new Map(…) takes an array of [key, value] pairs, another Map, its entries() or Object.entries(record) natively.");
    // A literal: one `set` per pair, in order.
    if (ts.isArrayLiteralExpression(arg) && arg.elements.every((p) => ts.isArrayLiteralExpression(p) && p.elements.length === 2 && !p.elements.some(ts.isSpreadElement))) {
      return arg.elements.reduce<Expr>((m, p) => {
        const [k, v] = (p as ts.ArrayLiteralExpression).elements;
        return this.mcOp(m, "set", ty, this.expr(k!, ctx, key), this.expr(v!, ctx, ty.of));
      }, made);
    }
    // An array of pairs: its keys and its values.
    if (!this.isPure(arg)) return this.error(arg, "Put the pairs in a variable first (they are read twice).");
    const pairs = this.tyOfExpr(arg);
    const pair = pairs.k === "array" ? pairs.of : undefined;
    const p = `p__${++this.temps}`;
    const part = (i: number, of: Ty): Expr | undefined => {
      const read: Expr | undefined = pair?.k === "array" ? { e: "unwrap", x: { e: "op", op: "arr.at", args: [{ e: "id", name: p }, { e: "int", v: String(i) }] } } : pair?.k === "class" && this.shapeClasses.get(pair.name)?.fields[i] ? { e: "prop", obj: { e: "id", name: p }, name: `_${i}` } : undefined;
      const from = pair?.k === "array" ? pair.of : pair?.k === "class" ? this.shapeClasses.get(pair.name)!.fields[i]!.ty : undefined;
      if (!read || !from || (!this.sameTy(from, of) && !(from.k === "int" && of.k === "double"))) return undefined;
      return { e: "op", op: "arr.map", args: [this.expr(arg, ctx), { e: "lambda", params: [{ name: p, ty: pair! }], ret: of, body: this.convert(read, from, of) }] };
    };
    const [ks, vs] = [part(0, key), part(1, ty.of)];
    if (!ks || !vs) return this.error(arg, "new Map(pairs) takes an array of [key, value] pairs of the map's types natively.");
    return this.mcOp(made, "setAll", ty, ks, vs);
  }

  /** What a for…of, a spread or Array.from lists of a Map / Set: `m` (entries), `m.keys()`, `m.values()`, `m.entries()`. */
  private mcListing(node: ts.Expression): { recv: ts.Expression; what: "keys" | "values" | "entries"; set: boolean } | undefined {
    const direct = this.mcKind(this.typeOf(node));
    if (direct) return { recv: node, what: direct === "Map" ? "entries" : "keys", set: direct === "Set" };
    if (!ts.isCallExpression(node) || node.arguments.length || !ts.isPropertyAccessExpression(node.expression)) return undefined;
    const name = node.expression.name.text;
    const kind = this.mcKind(this.typeOf(node.expression.expression));
    if (!kind || !["keys", "values", "entries"].includes(name)) return undefined;
    const what = kind === "Set" && name !== "entries" ? "keys" : (name as "keys" | "values" | "entries");
    return { recv: node.expression.expression, what, set: kind === "Set" };
  }

  /** An array of what `node` lists (see mcListing); entries become `pair` values (a [K, V] array or tuple). */
  private mcListed(node: ts.Expression, ctx: Ctx, pair?: Ty): Expr | undefined {
    const listed = this.mcListing(node);
    if (!listed) return undefined;
    const ty = this.tyOfExpr(listed.recv);
    if (ty.k !== "jsmap" && ty.k !== "jsset") return undefined;
    const obj = this.expr(listed.recv, ctx);
    const key = ty.k === "jsmap" ? ty.key : ty.of;
    if (listed.what === "keys") return this.mcOp(obj, "keysArr", T.array(key));
    if (listed.what === "values") return this.mcOp(obj, "valuesArr", T.array((ty as Extract<Ty, { k: "jsmap" }>).of));
    if (listed.set) return this.error(node, "A Set's entries() ([v, v] pairs) are not supported natively; list its values.");
    const map = ty as Extract<Ty, { k: "jsmap" }>;
    if (!pair) {
      const elem = this.checker.getIndexTypeOfType(this.typeOf(node.parent), ts.IndexKind.Number);
      pair = elem && this.ty(elem, node);
    }
    const [k, v] = [`k__${++this.temps}`, `v__${this.temps}`];
    const [kx, vx]: Expr[] = [{ e: "id", name: k }, { e: "id", name: v }];
    let made: Expr | undefined;
    if (pair?.k === "array" && this.sameTy(map.key, pair.of) && this.sameTy(map.of, pair.of)) made = { e: "arr", of: pair.of, items: [kx, vx] };
    const fields = pair?.k === "class" ? this.shapeClasses.get(pair.name)?.fields : undefined;
    if (fields?.length === 2 && this.sameTy(fields[0]!.ty, map.key) && this.sameTy(fields[1]!.ty, map.of)) made = { e: "new", cls: (pair as Extract<Ty, { k: "class" }>).name, args: [["_0", kx], ["_1", vx]] };
    if (!made) return this.error(node, "Listing a Map's [key, value] pairs is supported natively into an array of [K, V] (spread, Array.from); or loop: for (const [k, v] of map).");
    return this.mcOp(obj, "pairs", T.array(pair!), { e: "lambda", params: [{ name: k, ty: map.key }, { name: v, ty: map.of }], ret: pair!, body: made });
  }

  /** `m.size`. */
  private mcProperty(node: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    if (node.name.text !== "size") return undefined;
    const type = this.typeOf(node.expression);
    if (!this.mcKind(this.checker.getNonNullableType(type))) return undefined;
    if (this.isNullable(type) || node.questionDotToken) return this.error(node, "Narrow the map first (it may be null or undefined).");
    return this.mcOp(this.expr(node.expression, ctx), "size", T.int);
  }

  /** The methods of maps and sets, and Array.from of one (or of its keys / values / entries). */
  private mcCall(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    const name = callee.name.text;
    const args = node.arguments;
    if (ts.isIdentifier(callee.expression) && callee.expression.text === "Array" && name === "from" && args[0] && this.mcListing(args[0])) {
      if (args.length > 1) return this.error(node, "Array.from(map, mapFn) is not supported natively: write Array.from(map).map(mapFn).", args.length === 2 ? `Array.from(${args[0]!.getText()}).map(${args[1]!.getText()})` : undefined);
      return this.mcListed(args[0], ctx, this.ty(this.checker.getIndexTypeOfType(this.typeOf(node), ts.IndexKind.Number)!, node));
    }
    const recvType = this.typeOf(callee.expression);
    // `ref.deref()`: the target, or undefined once it is gone (kept until the current job ends, as JavaScript does).
    if (this.weakKind(this.checker.getNonNullableType(recvType)) === "WeakRef" && name === "deref" && !this.isNullable(recvType) && !callee.questionDotToken) {
      const ty = this.tyOfExpr(callee.expression);
      return ty.k === "jsset" ? this.mcOp(this.expr(callee.expression, ctx), "deref", T.optional(ty.of)) : { e: "nil" };
    }
    const kind = this.mcKind(this.checker.getNonNullableType(recvType));
    if (!kind) return undefined;
    if (this.isNullable(recvType) || callee.questionDotToken) return this.error(node, `Narrow the ${kind === "Map" ? "map" : "set"} first (it may be null or undefined).`);
    if (args.some(ts.isSpreadElement)) return this.error(node, "Spread arguments are not supported in this call natively (its native function takes a fixed list of arguments): pass them one by one (`f(xs[0]!, xs[1]!)`).");
    const ty = this.tyOfExpr(callee.expression);
    if (ty.k !== "jsmap" && ty.k !== "jsset") return { e: "nil" };
    const obj = this.expr(callee.expression, ctx);
    const key = ty.k === "jsmap" ? ty.key : ty.of;
    const k = () => this.expr(args[0]!, ctx, key);
    switch (kind === "Map" ? name : `set.${name}`) {
      case "get": {
        // A map of optionals (`Map<string, unknown>`): one nil natively for "missing" and "holds undefined", as in JavaScript.
        const of = (ty as Extract<Ty, { k: "jsmap" }>).of;
        return this.flat(this.mcOp(obj, "get", { k: "optional", of }, k()), of);
      }
      case "set":
        return this.mcOp(obj, "set", ty, k(), this.expr(args[1]!, ctx, (ty as Extract<Ty, { k: "jsmap" }>).of));
      case "set.add":
        return this.mcOp(obj, "add", ty, k());
      case "has":
      case "set.has":
      case "delete":
      case "set.delete":
        return this.mcOp(obj, name, T.bool, k());
      case "clear":
      case "set.clear":
        return this.mcOp(obj, "clear", T.void);
      case "forEach":
      case "set.forEach": {
        const fn = args[0];
        if (!fn || args.length > 1 || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return this.error(node, `Pass ${kind}.forEach an arrow function natively (no thisArg).`);
        if (fn.parameters.length > 2) return this.error(fn, `This callback takes at most 2 parameters natively (not the ${kind === "Map" ? "map" : "set"}).`);
        if (this.valueThrows(fn)) return this.error(fn, `A ${kind}.forEach callback that can throw is not supported natively; loop with for…of.`);
        const params = kind === "Map" ? [(ty as Extract<Ty, { k: "jsmap" }>).of, key] : [key, key];
        const cb = this.expr(fn, ctx, { k: "fn", params, ret: T.void });
        if (cb.e === "lambda") for (let i = cb.params.length; i < 2; i++) cb.params.push({ name: `mc__${++this.temps}`, ty: params[i]!, unused: true });
        return this.mcOp(obj, kind === "Map" ? "forEach" : "forEachSet", T.void, cb);
      }
      case "toString":
      case "set.toString":
        return this.isPure(callee.expression) ? { e: "str", v: `[object ${this.weakKind(this.checker.getNonNullableType(recvType)) ?? kind}]` } : this.error(node, "Put the value in a variable first.");
      case "keys":
      case "values":
      case "entries":
      case "set.keys":
      case "set.values":
      case "set.entries":
        return this.error(node, `${name}() is supported natively in for…of, a spread ([...x.${name}()]), Array.from and new Map / new Set.`);
      default:
        return this.error(node, `${kind}.prototype.${name} is not supported natively: loop over the ${kind} with for…of, or convert it (\`[...x]\`) and use the array method.`);
    }
  }

  /** `for (const [k, v] of m)`, `for (const x of s)`, over `keys()` / `values()` / `entries()`: live, as in JavaScript. */
  private mcForOf(node: ts.ForOfStatement, ctx: Ctx): Stmt[] | undefined {
    const listed = this.mcListing(node.expression);
    if (!listed) return undefined;
    const ty = this.tyOfExpr(listed.recv);
    if (ty.k !== "jsmap" && ty.k !== "jsset") return [];
    if (listed.set && listed.what === "entries") return [this.unsupported(node.expression, "a Set's entries() ([v, v] pairs); loop over its values")];
    const decl = node.initializer as ts.VariableDeclarationList;
    const binding = decl.declarations[0]!.name;
    const mutable = !(decl.flags & ts.NodeFlags.Const);
    const n = ++this.temps;
    const [m, s] = [`m__${n}`, `s__${n}`];
    const key = ty.k === "jsmap" ? ty.key : ty.of;
    const read = (what: "keyAt" | "valueAt", id: ts.Identifier): Stmt[] => {
      const from = what === "keyAt" ? key : (ty as Extract<Ty, { k: "jsmap" }>).of;
      const to = this.tyOfSymbol(this.checker.getSymbolAtLocation(id)!, id);
      const turn = this.loopBox(id);
      const bind: Stmt = { s: "let", name: id.text, ty: to, init: this.convert(this.mcOp({ e: "id", name: m }, what, from, { e: "id", name: s }), from, to), mutable };
      return [bind, ...(turn ? [turn.make] : [])];
    };
    const binds: Stmt[] = [];
    if (listed.what === "entries") {
      const els = ts.isArrayBindingPattern(binding) ? binding.elements : undefined;
      if (!els || els.length > 2 || els.some((el) => !ts.isOmittedExpression(el) && (!ts.isIdentifier(el.name) || el.initializer || el.dotDotDotToken))) {
        return [this.unsupported(binding, "this loop over a Map's entries; write `for (const [key, value] of map)`")];
      }
      els.forEach((el, i) => {
        if (!ts.isOmittedExpression(el)) binds.push(...read(i ? "valueAt" : "keyAt", el.name as ts.Identifier));
      });
    } else {
      if (!ts.isIdentifier(binding)) return [this.unsupported(binding, "destructuring the keys or values of a Map / Set")];
      if (binding.text !== "_") binds.push(...read(listed.what === "values" && !listed.set ? "valueAt" : "keyAt", binding));
    }
    const id = (name: string): Expr => ({ e: "id", name });
    const loop: Stmt = {
      s: "while",
      c: { e: "bool", v: true },
      body: [
        { s: "assign", target: id(s), op: "=", value: this.mcOp(id(m), "next", T.int, id(s)) },
        { s: "if", c: { e: "bin", op: "<", l: id(s), r: { e: "int", v: "0" } }, then: [{ s: "break" }] },
        ...binds,
        ...this.block(node.statement, { ...ctx, continueWith: undefined }),
      ],
    };
    return [{ s: "if", c: { e: "bool", v: true }, then: [{ s: "let", name: m, ty, init: this.expr(listed.recv, ctx), mutable: false }, { s: "let", name: s, ty: T.int, init: { e: "int", v: "-1" }, mutable: true }, loop] }];
  }

  /** `BigInt(x)`, `BigInt.asIntN / asUintN`, `Number(b)`, `Symbol(d)`, and the methods of bigints and symbols. */
  private bigCall(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    const args = node.arguments;
    const arg = args[0];
    const throws = this.bigThrows(node) ? { throws: true } : {};
    if (ts.isIdentifier(callee)) {
      if (callee.text === "Symbol") {
        if (arg && !this.isString(this.typeOf(arg))) return this.error(arg, "Symbol() takes a string description natively.");
        return { e: "op", op: "sym.new", args: [arg ? this.expr(arg, ctx, T.string) : { e: "nil" }] };
      }
      if (callee.text === "Number" && arg && this.isBigInt(this.typeOf(arg))) return { e: "op", op: "big.toNumber", args: [this.expr(arg, ctx)] };
      if (callee.text !== "BigInt" || !arg) return undefined;
      const type = this.typeOf(arg);
      if (this.isBigInt(type) && !this.isNullable(type)) return this.expr(arg, ctx);
      if (this.isString(type)) return { e: "op", op: "big.parse", args: [this.expr(arg, ctx, T.string)], ...throws };
      if (this.isBoolean(type) && !this.isNullable(type)) return { e: "cond", c: this.cond(arg, ctx), a: this.bigLit(1n), b: this.bigLit(0n) };
      if (!this.isNumber(type) || this.isNullable(type)) return this.error(arg, "BigInt() takes a number, a string, a boolean or a bigint natively.");
      if (ts.isNumericLiteral(arg)) {
        const v = Number(arg.text);
        return Number.isInteger(v) ? this.bigLit(BigInt(v)) : this.error(arg, `BigInt(${arg.text}) always throws a RangeError (it is not a whole number).`);
      }
      if (this.numKind(arg) === "int") return { e: "op", op: "big.from", args: [this.expr(arg, ctx, T.int)] };
      return { e: "op", op: "big.fromDouble", args: [this.expr(arg, ctx, T.double)], ...throws };
    }
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    const name = callee.name.text;
    if (ts.isIdentifier(callee.expression) && callee.expression.text === "BigInt" && (name === "asIntN" || name === "asUintN")) {
      const bits = arg && ts.isNumericLiteral(arg) ? Number(arg.text) : NaN;
      if (!Number.isInteger(bits) || bits > 2 ** 31 || !args[1]) return this.error(node, `BigInt.${name}() takes a whole number literal of bits natively.`);
      return { e: "op", op: name === "asIntN" ? "big.asIntN" : "big.asUintN", args: [{ e: "int", v: String(bits) }, this.expr(args[1], ctx)] };
    }
    const recvType = this.typeOf(callee.expression);
    if (this.isNullable(recvType) || !(this.isBigInt(recvType) || this.isSymbol(recvType))) return undefined;
    if (name === "valueOf" && !args.length) return this.expr(callee.expression, ctx);
    const x = this.expr(callee.expression, ctx);
    if (name === "toString" && !arg) return { e: "toStr", x, from: T.rt(this.isBigInt(recvType) ? "BigInt" : "Symbol") };
    if (name !== "toString" || !this.isBigInt(recvType)) return this.error(node, `${name}() of a ${this.isBigInt(recvType) ? "bigint" : "symbol"} is not available natively.`);
    const radix = this.radix(arg!);
    return { e: "op", op: "big.str", args: [x, radix !== undefined ? { e: "int", v: String(radix) } : this.expr(arg!, ctx, T.double)], ...throws };
  }

  // -------------------------------------------------------------------------
  // JSON and Date. `JSON.parse(text) as T` decodes into T with the decoders `res.json<T>()` uses (over each runtime's
  // own parser of JavaScript's grammar); `JSON.stringify` writes through Program.jsonClasses' encoders. A Date is the
  // runtime's `JsDate`, a shared mutable time value; local time is the platform's zone.
  // -------------------------------------------------------------------------

  private isDate(type: ts.Type): boolean {
    const symbol = type.getSymbol();
    return symbol?.name === "Date" && !type.isUnion() && this.fromLib(symbol);
  }

  /** Makes every number field a decoded `type` reaches a Double (JSON may hold a fraction there). */
  private jsonDoubles(type: ts.Type, seen: Set<ts.Type>) {
    type = this.nonNull(type);
    if (seen.has(type)) return;
    seen.add(type);
    for (const m of this.members(type)) {
      const elem = this.isArray(m) ? this.checker.getIndexTypeOfType(m, ts.IndexKind.Number) : m.getStringIndexType();
      if (elem) this.jsonDoubles(elem, seen);
      else if (m.flags & ts.TypeFlags.Object) {
        for (const prop of m.getProperties()) {
          if (this.isNumber(this.nonNull(this.checker.getTypeOfSymbol(prop)))) this.writes.push({ slot: prop, forceDouble: true });
          this.jsonDoubles(this.checker.getTypeOfSymbol(prop), seen);
        }
      }
    }
  }

  /** `JSON` / `Date` written as the global (not a local of that name). */
  private isGlobal(node: ts.Expression, name: string): boolean {
    return ts.isIdentifier(node) && node.text === name && this.fromLib(this.checker.getSymbolAtLocation(node));
  }

  /** `toISOString()` (a RangeError on an invalid date) and `JSON.parse` (a SyntaxError) throw. */
  private jsonDateThrows(n: ts.Node): boolean {
    if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression)) return false;
    const { expression: recv, name } = n.expression;
    if (name.text === "parse" && this.isGlobal(recv, "JSON")) return true;
    return name.text === "toISOString" && this.isDate(this.checker.getNonNullableType(this.typeOf(recv)));
  }

  /** `new Date()`, `new Date(ms | text | date)`, `new Date(y, m, d?, h?, mi?, s?, ms?)` (local time). */
  private newDate(node: ts.NewExpression, ctx: Ctx): Expr {
    const args = node.arguments ?? [];
    const make = (form: string, ...rest: Expr[]): Expr => ({ e: "op", op: "date.new", args: [{ e: "str", v: form }, ...rest], ty: T.rt("Date") });
    if (args.some(ts.isSpreadElement)) return this.error(node, "Spread arguments are not supported in this call natively (its native function takes a fixed list of arguments): pass them one by one (`f(xs[0]!, xs[1]!)`).");
    if (!args.length) return make("now");
    if (args.length > 1) return make("parts", ...args.map((a) => this.expr(a, ctx, T.double)));
    const arg = args[0]!;
    const type = this.typeOf(arg);
    if (this.isNullable(type)) return this.error(arg, "Narrow this value first (it may be null or undefined).");
    if (this.isNumber(type)) return make("ms", this.expr(arg, ctx, T.double));
    if (this.isString(type)) return this.dateText(arg) ?? make("str", this.expr(arg, ctx, T.string));
    if (this.isDate(type)) return make("copy", this.expr(arg, ctx));
    return this.error(arg, "new Date() takes milliseconds, ISO text or another Date natively.");
  }

  /** A date text literal bun reads that isn't the ISO format the native targets read: a compile error. */
  private dateText(arg: ts.Expression): Expr | undefined {
    if (!ts.isStringLiteralLike(arg)) return undefined;
    const iso = /^([+-]\d{6}|\d{4})(-\d{2}(-\d{2})?)?([Tt ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?)?$/;
    if (iso.test(arg.text) || Number.isNaN(Date.parse(arg.text))) return undefined;
    return this.error(arg, `Only ISO 8601 date text (2024-01-15, 2024-01-15T10:30:00Z, 2024-01-15T10:30:00.000+02:00) is read natively; JavaScript engines each read "${arg.text}" their own way.`);
  }

  /** `JSON.parse` / `JSON.stringify`, `Date.UTC` / `Date.parse`, and the methods of a Date. */
  private jsonDateCall(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    const name = callee.name.text;
    const recv = callee.expression;
    const args = node.arguments;
    if (this.isGlobal(recv, "JSON")) {
      if (args.some(ts.isSpreadElement)) return this.error(node, "Spread arguments are not supported in this call natively (its native function takes a fixed list of arguments): pass them one by one (`f(xs[0]!, xs[1]!)`).");
      if (name === "parse") return this.jsonParse(node, ctx);
      if (name === "stringify") return this.jsonStringify(node, ctx);
      return this.error(node, `JSON.${name} is not available natively.`);
    }
    if (this.isGlobal(recv, "Date") && name !== "now") {
      if (args.some(ts.isSpreadElement)) return this.error(node, "Spread arguments are not supported in this call natively (its native function takes a fixed list of arguments): pass them one by one (`f(xs[0]!, xs[1]!)`).");
      if (name === "UTC") return { e: "op", op: "date.utc", args: args.map((a) => this.expr(a, ctx, T.double)), ty: T.double };
      if (name === "parse") return this.dateText(args[0]!) ?? { e: "op", op: "date.parse", args: [this.expr(args[0]!, ctx, T.string)], ty: T.double };
      return this.error(node, `Date.${name} is not available natively.`);
    }
    const type = this.typeOf(recv);
    if (!this.isDate(this.checker.getNonNullableType(type))) return undefined;
    if (this.isNullable(type) || callee.questionDotToken) return this.error(node, "Narrow the date first (it may be null or undefined).");
    const call = (what: string, ty: Ty, throws = false): Expr => ({ e: "op", op: "date.call", args: [this.expr(recv, ctx), { e: "str", v: what }, ...args.map((a) => this.expr(a, ctx, T.double))], ty, ...(throws ? { throws: true } : {}) });
    const fields: Record<string, number> = { FullYear: 0, Month: 1, Date: 2, Hours: 3, Minutes: 4, Seconds: 5, Milliseconds: 6, Day: 7 };
    const m = /^(get|set)(UTC)?(FullYear|Month|Date|Day|Hours|Minutes|Seconds|Milliseconds)$/.exec(name);
    if (m && !(m[1] === "set" && m[3] === "Day")) return call(`${m[1]} ${fields[m[3]!]} ${m[2] ? 0 : 1}`, T.double);
    switch (name) {
      case "getTime":
      case "valueOf":
        return call("time", T.double);
      case "setTime":
        return call("setTime", T.double);
      case "getTimezoneOffset":
        return call("tzOffset", T.double);
      case "toISOString":
        return call("iso", T.string, true);
      case "toUTCString":
      case "toGMTString":
        return call("utc", T.string);
      case "toDateString":
        return call("dateString", T.string);
      case "toJSON":
        return this.error(node, "toJSON() is null for an invalid date (TypeScript types it string): use toISOString() (it throws a RangeError on one), or JSON.stringify.");
      case "toString":
      case "toTimeString":
      case "toLocaleString":
      case "toLocaleDateString":
      case "toLocaleTimeString":
        return this.error(node, `${name}() prints the time zone's or locale's names, which each platform spells its own way: use toISOString(), toUTCString(), toDateString() or the get… methods, or \`formatDate(d, "yyyy-MM-dd HH:mm", { timeZone })\` from @nuclo/native-ts/adapters.`);
    }
    return this.error(node, `Date.prototype.${name}() is not available natively.`);
  }

  /** `JSON.parse(text) as T` / `const x: T = JSON.parse(text)`: decoded into T as `res.json<T>()` is. */
  private jsonParse(node: ts.CallExpression, ctx: Ctx): Expr {
    if (node.arguments.length !== 1) return this.error(node, "JSON.parse(text, reviver): a reviver is not supported natively; convert the decoded value instead.");
    const target = this.checker.getContextualType(node);
    if (!target || target.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
      return this.error(node, "JSON.parse needs the type it decodes into natively: write `JSON.parse(text) as T` (or `const x: T = JSON.parse(text)`), T made of interfaces, arrays, maps, strings, numbers and booleans (not `unknown`). For JSON whose shape isn't known, `parseJson(text)` from @nuclo/native-ts/adapters gives a `Json` with typed accessors.");
    }
    const ty = this.ty(target, node);
    const why = this.undecodable(ty, "T");
    if (why) return this.error(node, `JSON.parse into T needs T made of interfaces, arrays, maps, strings, numbers and booleans: ${why}.`);
    this.decoded.push(ty);
    return { e: "op", op: "json.parse", args: [this.expr(node.arguments[0]!, ctx, T.string), { e: "decoder", ty }], throws: true, ty };
  }

  /** `JSON.stringify(value)`, `JSON.stringify(value, null, indent)`. */
  private jsonStringify(node: ts.CallExpression, ctx: Ctx): Expr {
    const [value, replacer, indent] = node.arguments;
    if (!value) return this.error(node, "JSON.stringify() of nothing is undefined, not text.");
    if (replacer && replacer.kind !== ts.SyntaxKind.NullKeyword && !(ts.isIdentifier(replacer) && replacer.text === "undefined")) {
      return this.error(replacer, "A replacer (function or key list) is not supported natively: map the value into the shape to write first, and pass null.");
    }
    const type = this.typeOf(value);
    if (this.members(this.bound(type)).some((u) => !!(u.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)))) {
      return this.error(value, "JSON.stringify of a value that may be undefined gives undefined, not text: narrow it first (null is written as null).");
    }
    const why = this.jsonPlan(this.nonNull(type), value, "the value");
    if (why) return this.error(value, `JSON.stringify can't write this natively: ${why}.`);
    if (why === "") return { e: "nil" };
    let gap: Expr = { e: "str", v: "" };
    if (indent && !(ts.isIdentifier(indent) && indent.text === "undefined")) {
      const it = this.typeOf(indent);
      if (ts.isNumericLiteral(indent)) gap = { e: "str", v: " ".repeat(Math.max(0, Math.min(10, Math.trunc(Number(indent.text))))) };
      else if (ts.isStringLiteralLike(indent)) gap = { e: "str", v: indent.text.slice(0, 10) };
      else if (this.isNullable(it)) return this.error(indent, "Narrow the indent first (it may be null or undefined).");
      else if (this.isNumber(it)) gap = { e: "op", op: "json.gap", args: [{ e: "str", v: "num" }, this.expr(indent, ctx, T.double)], ty: T.string };
      else if (this.isString(it)) gap = { e: "op", op: "json.gap", args: [{ e: "str", v: "str" }, this.expr(indent, ctx, T.string)], ty: T.string };
      else return this.error(indent, "The indent of JSON.stringify is a number or a string.");
    }
    const ty = this.tyOfExpr(value);
    return { e: "op", op: "json.stringify", args: [this.expr(value, ctx, ty), gap, { e: "decoder", ty }], ty: T.string };
  }

  /**
   * Registers how JSON.stringify writes a (non-null) value of `type` (Program.jsonClasses): undefined when it can,
   * why not otherwise ("" when an error was already reported). A class's keys are JavaScript's (objectKeys, which
   * also makes every object literal of an interface give its fields in order).
   */
  private jsonPlan(type: ts.Type, node: ts.Node, at: string): string | undefined {
    type = this.bound(type);
    if (this.isString(type) || this.isBoolean(type) || this.isDate(type)) return undefined;
    if (this.isNumber(type)) return undefined;
    if (this.isBigInt(type)) return `${at} is a bigint (JavaScript throws a TypeError)`;
    if (this.isArray(type) && !this.isMixedTuple(type)) {
      const elem = this.checker.getIndexTypeOfType(type, ts.IndexKind.Number)!;
      if (this.nonNull(elem).getCallSignatures().length) return `${at} holds functions`;
      return this.jsonPlan(this.nonNull(elem), node, `an element of ${at}`);
    }
    const index = type.getStringIndexType();
    if (index && !type.getProperties().length) {
      if (this.members(this.bound(index)).some((u) => !!(u.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)))) return `${at} is a map that may hold undefined (JavaScript leaves those keys out): use null`;
      if (this.nonNull(index).getCallSignatures().length) return `${at} holds functions`;
      return this.jsonPlan(this.nonNull(index), node, `a value of ${at}`);
    }
    const ty = this.ty(type, node);
    if (ty.k === "union") {
      for (const m of this.members(type)) {
        if (m.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) continue;
        const why = this.jsonPlan(m, node, at);
        if (why !== undefined) return why;
      }
      if (!this.jsonClasses.has(ty.name)) this.jsonClasses.set(ty.name, { name: ty.name });
      return undefined;
    }
    if (ty.k !== "class" || this.isMixedTuple(type)) return `${at} is a ${this.checker.typeToString(type)}, which is not data JSON writes the same everywhere`;
    if (this.jsonClasses.has(ty.name)) return undefined;
    if (type.getProperty("toJSON")) return `${at} is a ${ty.name}, which has a toJSON method (not supported natively)`;
    const keys = this.objectKeys(type, node);
    if (!keys) return "";
    const fields: NonNullable<NonNullable<Program["jsonClasses"]>[number]["fields"]> = [];
    this.jsonClasses.set(ty.name, { name: ty.name, fields });
    for (const key of keys) {
      const prop = type.getProperty(key);
      if (!prop) continue;
      const ptype = this.bound(this.checker.getTypeOfSymbolAtLocation(prop, node));
      const inner = this.nonNull(ptype);
      if (inner.getCallSignatures().length && !this.isClassType(inner)) continue;
      const nils = this.members(ptype).map((u) => u.flags);
      const undef = !!(prop.flags & ts.SymbolFlags.Optional) || nils.some((f) => !!(f & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
      const nul = nils.some((f) => !!(f & ts.TypeFlags.Null));
      if (undef && nul) return `${ty.name}.${key} may be null or undefined, one nil natively (JavaScript writes null and leaves undefined out): pick one`;
      const why = this.jsonPlan(inner, node, `${ty.name}.${key}`);
      if (why !== undefined) return why;
      fields.push({ name: key, ty: this.tyOfSymbol(prop, node), ...(nul ? { nil: "null" as const } : {}) });
    }
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Structural object types: anonymous object types (a literal's, a `{ … }` annotation, a function's
  // inferred result), intersections, utility and mapped types, mixed tuples. Each distinct shape (its
  // members' names and native types) is one record class shared by every type of that shape, a declared
  // interface's included (two same-shaped interfaces are one class): no conversion between them. A value
  // of one class flowing into another shape (an object into `Pick<…>` of it, or into a same-shaped type
  // whose numbers differ) makes that shape a protocol the class conforms to, so both names see one
  // object, as in JavaScript; a value whose type is exact keeps direct, statically dispatched fields.
  // -------------------------------------------------------------------------

  /** Shape keys (`name?:Type` members, sorted) → the native class or protocol of that shape. */
  private readonly shapeNames = new Map<string, string>();
  /** Record classes generated for anonymous shapes and mixed tuples, by name. */
  private readonly shapeClasses = new Map<string, ClassDecl>();
  /** Declared interfaces merged into an earlier one of the same shape and field order: name → that one. */
  private readonly mergedRecords = new Map<string, string>();
  /** Shapes with methods, and records some other class flows into: protocols, by name. */
  private readonly shapeProtocols = new Map<string, ProtocolDecl>();
  /** Classes (records, shape protocols, protocols) that flow into a shape protocol, and conform to it. */
  private readonly conformances = new Map<string, Set<string>>();
  /** Shapes are named once the number kinds are known (`startShapes`, before lowering). */
  private shapesStarted = false;
  private readonly shaping = new Set<ts.Type>();
  private readonly shapeCache = new Map<ts.Type, Ty>();
  /** Named shapes that refer to themselves: the class name reserved while their members are made (rest2). */
  private readonly recursiveShapes = new Map<ts.Type, string>();

  /** An object type with no declaration of its own: a literal's, `{ … }`, `A & B`, `Pick<T, K>`, a mixed tuple. */
  private isShape(type: ts.Type): boolean {
    type = this.bound(type);
    if (this.checker.isTupleType(type)) return this.isMixedTuple(type);
    if (type.isIntersection()) return type.types.every((t) => this.isShape(t) || (this.isDeclaredClassType(t) && !this.isObjectClassType(t)));
    if (!(type.flags & ts.TypeFlags.Object) || this.checker.isArrayType(type) || this.isDeclaredClassType(type)) return false;
    if (type.getCallSignatures().length || type.getConstructSignatures().length || type.getStringIndexType() || type.getNumberIndexType()) return false;
    const alias = type.aliasSymbol?.declarations?.[0];
    if (alias && this.isApi(alias)) return false;
    const flags = (type as ts.ObjectType).objectFlags;
    if (flags & ts.ObjectFlags.Mapped) return true;
    // `const { a, ...rest } = o`: the rest's type (objectRest).
    if (flags & ts.ObjectFlags.ObjectRestType) return true;
    const own = type.getSymbol()?.declarations?.[0];
    return !!(flags & ts.ObjectFlags.Anonymous) && !!own && (ts.isObjectLiteralExpression(own) || ts.isTypeLiteralNode(own)) && !own.getSourceFile().isDeclarationFile && !this.isApi(own);
  }

  private isObjectClassType(type: ts.Type): boolean {
    const symbol = type.getSymbol();
    return !!symbol && [...this.objectClasses.keys()].some((s) => s === symbol || this.className(s) === this.className(symbol));
  }

  /** `[number, string]`: a tuple whose elements have different types (one type: an array natively). */
  private isMixedTuple(type: ts.Type): boolean {
    if (!this.checker.isTupleType(type)) return false;
    // With optional or rest elements its length varies: an array of the elements' union (rest2: varTuple).
    if (this.isVarTuple(type)) return false;
    const names =this.checker.getTypeArguments(type as ts.TypeReference).map((t) => this.checker.typeToString(this.checker.getBaseTypeOfLiteralType(t)));
    return new Set(names).size > 1;
  }

  /** A tuple with optional or rest elements (`[number, string?]`, `[string, ...number[]]`). */
  private isVarTuple(type: ts.Type): boolean {
    return this.checker.isTupleType(type) && (type as ts.TupleTypeReference).target.elementFlags.some((f) => !(f & ts.ElementFlags.Required));
  }

  /**
   * A tuple with optional or rest elements (rest2): natively an array of the union of its element types (optional when
   * an element is: `[1, undefined]` keeps its undefined), so `length`, any index, push, spread and text are an array's.
   */
  private varTupleTy(type: ts.Type, node: ts.Node): Ty {
    const target = (type as ts.TupleTypeReference).target;
    const tys: Ty[] = [];
    for (const t of this.checker.getTypeArguments(type as ts.TypeReference)) {
      const ty = this.ty(this.checker.getNonNullableType(t), node);
      const inner = ty.k === "int" ? T.double : ty;
      for (const m of inner.k === "union" ? this.unions.get(inner.name)!.members.map((m) => m.ty) : [inner]) if (!tys.some((have) => this.sameTy(have, m))) tys.push(m);
    }
    const elem = tys.length === 1 ? tys[0]! : this.unionNamed(tys);
    return T.array(target.elementFlags.some((f) => f & ts.ElementFlags.Optional) || this.checker.getTypeArguments(type as ts.TypeReference).some((t) => this.isNullable(t)) ? T.optional(elem) : elem);
  }

  /** The native record class (or protocol, with methods) of a shape. */
  private shapeTy(type: ts.Type, node: ts.Node): Ty {
    type = this.bound(type);
    const cached = this.env.size ? undefined : this.shapeCache.get(type);
    if (cached) return cached;
    const made = this.checker.isTupleType(type) ? this.tupleTy(type, node) : this.objectShapeTy(type, node);
    if (this.shapesStarted && !this.env.size && made.k === "class") this.shapeCache.set(type, made);
    return made;
  }

  private objectShapeTy(type: ts.Type, node: ts.Node): Ty {
    const alias = type.aliasSymbol;
    const aliasDecl = alias?.declarations?.[0];
    const own = alias && !type.aliasTypeArguments?.length && aliasDecl && !aliasDecl.getSourceFile().isDeclarationFile;
    // A named type that refers to itself (`type Node = { v: number } & { next?: Node }`, rest2): its class by name.
    if (this.shaping.has(type) && own) {
      if (!this.shapesStarted) return { k: "class", name: "__shape" };
      let reserved = this.recursiveShapes.get(type);
      if (!reserved) this.recursiveShapes.set(type, (reserved = this.freshName(alias.name)));
      return { k: "class", name: reserved };
    }
    const members = this.shapeMembers(type, node);
    if (!members) return T.string;
    if (!members.fields.length && !members.methods.length) return this.error(node, `The empty object type ${this.checker.typeToString(type)} has no native equivalent.`), T.string;
    // Before the number kinds are known (pass 1), a shape is not named yet.
    if (!this.shapesStarted) return { k: "class", name: "__shape" };
    const key = this.shapeKey(members);
    let name = this.shapeNames.get(key);
    const reserved = this.recursiveShapes.get(type);
    if (reserved && name !== reserved) name = undefined;
    if (!name) {
      name = reserved ?? this.freshName(own ? alias.name : `Obj__${[...members.fields, ...members.methods].map((m) => m.name).sort().join("_")}`);
      this.shapeNames.set(key, name);
      if (members.methods.length) this.shapeProtocols.set(name, { name, bases: [], fields: members.fields, methods: members.methods });
      else this.shapeClasses.set(name, { name, fields: members.fields, decodable: true });
    }
    return { k: "class", name };
  }

  /** A shape's fields and methods (its properties in TypeScript's order; a field is mutable, TypeScript checks `readonly`). */
  private shapeMembers(type: ts.Type, node: ts.Node): { fields: ClassField[]; methods: ProtocolDecl["methods"] } | undefined {
    if (this.shaping.has(type)) return void this.error(node, `The type ${this.checker.typeToString(type)} refers to itself; declare it as an interface.`);
    this.shaping.add(type);
    try {
      const fields: ClassField[] = [];
      const methods: ProtocolDecl["methods"] = [];
      for (const prop of this.boundPickOmit(type, node) ?? this.checker.getPropertiesOfType(type)) {
        const decl = prop.valueDeclaration ?? prop.declarations?.[0];
        const at = decl && !decl.getSourceFile().isDeclarationFile ? decl : node;
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(prop.name)) {
          this.error(node, `The key "${prop.name}" of ${this.checker.typeToString(type)} can't be a native field; name it with an identifier, or use a Record<string, T> map.`);
          continue;
        }
        if (decl && (ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl))) {
          if (decl.questionToken) this.error(decl, "Unsupported: an optional method (every native object has its methods); declare an optional function property (`greet?: () => string`).");
          const signature = this.checker.getSignatureFromDeclaration(decl)!;
          // A defaulted parameter is optional to callers: the method applies its default.
          const params = this.params(decl, { async: false, ret: T.void, voidUnion: false, inTry: false }).map((p) => ({ name: p.name, ty: p.default ? T.optional(p.ty) : p.ty }));
          methods.push({ name: prop.name, params, ret: this.ty(signature.getReturnType(), decl, this.slotKind(decl)), ...(this.throws(decl) ? { throws: true } : {}) });
        } else if (decl && ts.isAccessor(decl)) {
          // A getter / setter of an object literal (rest2): protocol methods `get__x()` / `set__x(v)`, which reads and writes call.
          const ty = this.tyOfSymbol(prop, decl);
          for (const d of prop.declarations ?? []) {
            if (ts.isGetAccessor(d)) methods.push({ name: `get__${prop.name}`, params: [], ret: this.ty(this.checker.getTypeOfSymbol(prop), d, this.slotKind(d)), ...(this.throws(d) ? { throws: true } : {}) });
            else if (ts.isSetAccessor(d)) methods.push({ name: `set__${prop.name}`, params: [{ name: "v", ty }], ret: T.void, ...(this.throws(d) ? { throws: true } : {}) });
          }
        } else fields.push({ name: prop.name, ty: this.tyOfSymbol(prop, at), readonly: false, optional: !!(prop.flags & ts.SymbolFlags.Optional) });
      }
      return { fields, methods };
    } finally {
      this.shaping.delete(type);
    }
  }

  /**
   * `Pick<T, K>` / `Omit<T, K>` over a type parameter (rest2), in an instantiation: the properties of the type T is bound
   * to there (TypeScript only sees T's constraint), picked or left out by K's literal keys.
   */
  private boundPickOmit(type: ts.Type, node?: ts.Node): ts.Symbol[] | undefined {
    // `const { a, ...rest } = x` of an `x: T`: the rest of what T is bound to.
    if ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.ObjectRestType && this.env.size && node) {
      const decl = ts.isBindingElement(node) ? node : ts.isIdentifier(node) ? this.checker.getSymbolAtLocation(node)?.valueDeclaration : undefined;
      if (decl && ts.isBindingElement(decl) && decl.dotDotDotToken && ts.isObjectBindingPattern(decl.parent)) {
        const taken = new Set(decl.parent.elements.filter((e) => e !== decl).map((e) => ((e.propertyName ?? e.name) as ts.Identifier).text));
        const holder = decl.parent.parent;
        const of = ts.isVariableDeclaration(holder) && holder.initializer ? this.typeOf(holder.initializer) : ts.isParameter(holder) ? this.checker.getTypeAtLocation(holder) : this.typeOf(decl.parent);
        const src = this.bound(this.checker.getNonNullableType(of));
        if (src !== this.checker.getNonNullableType(of)) return this.checker.getPropertiesOfType(src).filter((p) => !taken.has(p.name));
      }
    }
    const alias = type.aliasSymbol;
    const [src, keys] = type.aliasTypeArguments ?? [];
    if (!alias || !src || !keys || (alias.name !== "Pick" && alias.name !== "Omit") || !alias.declarations?.every((d) => d.getSourceFile().isDeclarationFile) || !this.env.size) return undefined;
    const [s, k] = [this.bound(src), this.bound(keys)];
    if (s === src && k === keys) return undefined;
    const names = new Set(this.members(k).map((t) => (t.isStringLiteral() ? t.value : undefined)));
    if (names.has(undefined)) return undefined;
    return this.checker.getPropertiesOfType(s).filter((p) => names.has(p.name) === (alias.name === "Pick"));
  }

  private shapeKey(m: { fields: ClassField[]; methods: ProtocolDecl["methods"] }): string {
    return [
      ...m.fields.map((f) => `${f.name}${f.optional ? "?" : ""}:${mangle(f.ty)}`),
      ...m.methods.map((x) => `${x.name}(${x.params.map((p) => mangle(p.ty)).join(",")}):${mangle(x.ret)}${x.throws ? "!" : ""}`),
    ].sort().join(";");
  }

  /** A mixed tuple: a record with a field per element (`_0`, `_1`…; a number is a Double, as in arrays). */
  private tupleTy(type: ts.Type, node: ts.Node): Ty {
    if ((type as ts.TupleTypeReference).target.elementFlags.some((f) => !(f & ts.ElementFlags.Required))) {
      return this.error(node, `The tuple ${this.checker.typeToString(type)} has optional or rest elements of different types: no native equivalent. Give every element, or use an interface.`), T.string;
    }
    const elems = this.checker.getTypeArguments(type as ts.TypeReference).map((t) => this.ty(t, node));
    const key = `[${elems.map(mangle).join(",")}]`;
    let name = this.shapeNames.get(key);
    if (!name) {
      name = this.freshName(`Tuple__${elems.map(mangle).join("_")}`);
      this.shapeNames.set(key, name);
      this.shapeClasses.set(name, { name, fields: elems.map((ty, i) => ({ name: `_${i}`, ty, readonly: false, optional: false })), decodable: false });
    }
    return { k: "class", name };
  }

  /** `t[1]` of a mixed tuple: its field, by a literal index. */
  private tupleField(node: ts.ElementAccessExpression, read = false): string | undefined {
    if (!this.isMixedTuple(this.checker.getNonNullableType(this.typeOf(node.expression)))) return undefined;
    // A literal, or a pure index typed as one number literal (`i: 0`, rest2).
    const literal = this.typeOf(node.argumentExpression);
    const index = ts.isNumericLiteral(node.argumentExpression) ? Number(node.argumentExpression.text) : literal.isNumberLiteral() && this.isPure(node.argumentExpression) ? literal.value : NaN;
    if (!Number.isInteger(index)) return read ? undefined : void this.error(node, "A tuple of different types is written at a literal index natively (each element is a field of its own type): `t[0] = v`.");
    return `_${index}`;
  }

  /** `t[i]` of a mixed tuple by a computed index (rest2): the field at that index as TypeScript's type there, else undefined. */
  private tupleIndexRead(node: ts.ElementAccessExpression, obj: Expr, ctx: Ctx): Expr {
    const type = this.checker.getNonNullableType(this.typeOf(node.expression));
    const want = this.tyOfExpr(node);
    const elems = this.checker.getTypeArguments(type as ts.TypeReference);
    if (!this.isPure(node.expression)) return this.impure(node.expression, "A tuple read by a computed index");
    const i = `ti__${++this.temps}`;
    const value = (k: number): Expr => {
      const field: Expr = { e: "prop", obj, name: `_${k}` };
      return this.toUnionValue(field, this.ty(elems[k]!, node), want.k === "optional" ? want.of : want) ?? this.convert(field, this.ty(elems[k]!, node), want);
    };
    // Without undefined in its type, the index is one of the tuple's (TypeScript checked): the last needs no test.
    const last = want.k === "optional" ? elems.length : elems.length - 1;
    const chain = elems.slice(0, last).reduceRight<Expr>(
      (rest, _t, k) => ({ e: "cond", c: { e: "bin", op: "==", l: { e: "id", name: i }, r: { e: "double", v: `${k}.0` } }, a: value(k), b: rest }),
      want.k === "optional" ? { e: "nil" } : value(last),
    );
    return { e: "with", name: i, ty: T.double, init: this.expr(node.argumentExpression, ctx, T.double), body: chain };
  }

  /** `${t}` of a mixed tuple of strings, numbers and booleans: its elements joined with "," (as an array's). */
  private tupleStr(node: ts.Expression, type: ts.Type, x: Expr): Expr {
    if (!this.isPure(node)) return this.error(node, "Read the tuple into a variable first (its elements are read one by one).");
    const parts: (string | Expr)[] = [];
    for (const [i, t] of this.checker.getTypeArguments(type as ts.TypeReference).entries()) {
      const read: Expr = { e: "prop", obj: x, name: `_${i}` };
      if (i) parts.push(",");
      if (this.isString(t)) parts.push(read);
      else if (this.isNumber(t) && !this.isNullable(t)) parts.push({ e: "toStr", x: read, from: T.double });
      else if (this.isBoolean(t)) parts.push({ e: "toStr", x: read, from: T.bool });
      else {
        // Objects, arrays, unions, nullable values (rest2): as an array's element (null / undefined print "").
        const text = this.elemText(read, this.ty(t, node));
        if (!text) return this.error(node, "Text of a tuple holding values with no text form (maps, functions…) is not supported natively; format its elements.");
        parts.push(text);
      }
    }
    return { e: "tpl", parts };
  }

  private freshName(base: string): string {
    const taken = (n: string) =>
      this.shapeClasses.has(n) || this.shapeProtocols.has(n) || [...this.shapeNames.values()].includes(n) || this.allClasses().some((c) => c.name === n) ||
      [...this.objectClasses.keys(), ...this.protocols.keys()].some((s) => this.className(s) === n) || RESERVED_TYPES.has(n);
    let name = base;
    for (let i = 2; taken(name); i++) name = `${base}__${i}`;
    return name;
  }

  /** A declared interface's native class: its own, or the first declared one of the same shape. */
  private recordName(symbol: ts.Symbol): string {
    const name = this.className(symbol);
    return this.mergedRecords.get(name) ?? name;
  }

  /** After the number kinds: declared interfaces claim their shapes first, and a same-shaped later one (same field order) is merged. */
  private startShapes() {
    this.shapesStarted = true;
    const orders = new Map<string, string>();
    const declared = [...this.classes.keys(), ...[...this.protocols].filter(([, d]) => !d.typeParameters?.length).map(([s]) => s)];
    for (const symbol of declared) {
      const decl = symbol.declarations?.[0];
      const members = decl && this.shapeMembers(this.checker.getDeclaredTypeOfSymbol(symbol), decl);
      if (!members) continue;
      const key = this.shapeKey(members);
      const order = members.fields.map((f) => f.name).join(",");
      const first = this.shapeNames.get(key);
      if (!first) {
        this.shapeNames.set(key, this.className(symbol));
        orders.set(this.className(symbol), order);
      } else if (this.classes.has(symbol) && orders.get(first) === order && [...this.classes.keys()].some((s) => this.className(s) === first)) this.mergedRecords.set(this.className(symbol), first);
    }
    // Their fields, before any code (a function declared above an interface) builds one.
    for (const symbol of this.classes.keys()) {
      const decl = symbol.declarations?.find((d) => ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d));
      if (decl) this.classDecl(decl as ts.InterfaceDeclaration | ts.TypeAliasDeclaration);
    }
  }

  /**
   * Values of one class flowing into a different shape: a contextual type (an argument, an initializer, a
   * return, an assignment, an element) or an `as`. The shape becomes a protocol the class conforms to, so
   * the object is shared as in JavaScript. A class lacking one of the shape's members (or with another
   * type for it) is rejected: a copy would not see later changes, nor be `===` to the original.
   */
  private collectConformances() {
    this.startShapes();
    for (const sf of this.files) {
      const visit = (node: ts.Node): void => {
        if (ts.isTypeNode(node)) return;
        this.anchor = node;
        if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) this.shapeFlow(node.expression, this.typeOf(node), node);
        else if (this.isFlowSource(node) && !this.destructured(node)) {
          const target = this.checker.getContextualType(node);
          if (target) this.shapeFlow(node, target, node);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    for (const p of this.shapeProtocols.values()) this.extendProtocol(p);
  }

  /**
   * The value a destructuring reads (`const [a, [b, c]] = v`, `[a, b] = v`): its parts flow, not the value, and its
   * contextual type is the pattern's (`[any, [any, any]]`), which would report `any` and the lib's Array members.
   */
  private destructured(node: ts.Node): boolean {
    while (ts.isParenthesizedExpression(node.parent) || ts.isNonNullExpression(node.parent) || ts.isSatisfiesExpression(node.parent)) node = node.parent;
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) return parent.initializer === node && !ts.isIdentifier(parent.name);
    return ts.isBinaryExpression(parent) && parent.right === node && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && (ts.isArrayLiteralExpression(parent.left) || ts.isObjectLiteralExpression(parent.left));
  }

  /** An expression whose value may flow into a slot of another type (a literal is built as the slot's type instead). */
  private isFlowSource(node: ts.Node): node is ts.Expression {
    // A spread copies the fields (or items) into a new value: no object flows.
    if (node.parent && (ts.isSpreadAssignment(node.parent) || ts.isSpreadElement(node.parent))) return false;
    // Destructuring reads the parts of its value (what flows is each part, into its target); a pattern's targets are written.
    if (node.parent && ((ts.isBinaryExpression(node.parent) && this.destructuring(node.parent) && node.parent.right === node) || this.inPattern(node))) return false;
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      if (ts.isShorthandPropertyAssignment(parent)) return parent.name === node;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
      if (ts.isQualifiedName(parent) || ts.isExpressionWithTypeArguments(parent) || ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent) || ts.isBreakOrContinueStatement(parent) || ts.isLabeledStatement(parent)) return false;
      return !this.isDeclarationName(node) && !(ts.isPropertyAssignment(parent) && parent.name === node);
    }
    return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) || ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isAwaitExpression(node) || ts.isNonNullExpression(node) || node.kind === ts.SyntaxKind.ThisKeyword;
  }

  private shapeFlow(expr: ts.Expression, target: ts.Type, at: ts.Node) {
    let inner = expr;
    while (ts.isParenthesizedExpression(inner)) inner = inner.expression;
    if (ts.isObjectLiteralExpression(inner) || ts.isArrayLiteralExpression(inner)) return;
    const source = this.typeOf(expr);
    // `Pick` / `Omit` / an object rest of a type parameter: known per instantiation only (rest2: boundPickOmit).
    const open = (t: ts.Type) => !!((t as ts.ObjectType).objectFlags & ts.ObjectFlags.ObjectRestType) || (!!t.aliasSymbol && ["Pick", "Omit"].includes(t.aliasSymbol.name) && !!t.aliasTypeArguments?.some((a) => a.flags & ts.TypeFlags.TypeParameter));
    if (!this.env.size && (open(this.checker.getNonNullableType(source)) || open(this.checker.getNonNullableType(target)))) return;
    const from = this.shapeName(source, expr);
    const to = this.shapeName(target, expr);
    const cls = this.checker.getNonNullableType(source);
    const declaredProtocol = [...this.protocols.keys()].some((s) => this.className(s) === to);
    // An object of a class used as an interface or object type it doesn't declare (rest2): the class conforms to it.
    // Not for generic classes or targets (their names are per instantiation): those conform only as declared.
    const generic = (t: ts.Type) => !!t.getSymbol()?.declarations?.some((d) => (ts.isClassLike(d) || ts.isInterfaceDeclaration(d)) && !!d.typeParameters?.length) || !!t.aliasTypeArguments?.length;
    if (!from && to && !cls.isUnion() && this.isObjectClassType(cls) && (generic(cls) || generic(this.checker.getNonNullableType(target)))) {
      if (!declaredProtocol && !this.supertypes(this.classNameOf(cls)!).has(to)) {
        return void this.error(at, `An object of the class ${this.checker.typeToString(cls)} is used as ${this.checker.typeToString(this.checker.getNonNullableType(target))}: natively a generic class conforms only to the interfaces it declares. Declare an interface for it and \`implements\` it, or build a new object.`);
      }
      return;
    }
    if (!from && to && !cls.isUnion() && this.isObjectClassType(cls) && !this.supertypes(this.classNameOf(cls)!).has(to)) {
      return this.classConform(this.classNameOf(cls)!, to, cls, this.checker.getNonNullableType(this.bound(target)), at, declaredProtocol);
    }
    if (!from || !to || from === to || this.conformances.get(from)?.has(to)) return;
    this.conform(from, to, this.checker.getNonNullableType(source), this.checker.getNonNullableType(this.bound(target)), at);
  }

  /** The record, shape or protocol a type is natively (not a class, a union, an array). */
  private shapeName(type: ts.Type, node: ts.Node): string | undefined {
    const t = this.checker.getNonNullableType(this.bound(type));
    if (t.isUnion() || this.isObjectClassType(t) || !this.isClassType(t)) return undefined;
    const ty = this.ty(t, node);
    return ty.k === "class" && !this.isObjectClass(ty.name) ? ty.name : undefined;
  }

  private conform(from: string, to: string, source: ts.Type, target: ts.Type, at: ts.Node) {
    const have = this.shapeMembers(source, at);
    const want = this.shapeMembers(target, at);
    if (!have || !want) return;
    const [a, b] = [this.checker.typeToString(source), this.checker.typeToString(target)];
    const reject = (why: string) =>
      void this.error(at, `${a} is used as ${b}, ${why}: natively they are different classes, and a copy would not be the same object (JavaScript shares it). Build a new object ({ ...value }), or give both one type.`);
    for (const f of want.fields) {
      const g = have.fields.find((x) => x.name === f.name);
      if (!g) return reject(`which has no ${f.name}`);
      if (!this.sameTy(g.ty, f.ty) || g.optional !== f.optional) return reject(`whose ${f.name} has another type (${mangle(f.ty)}${f.optional ? ", optional" : ""} there, ${mangle(g.ty)}${g.optional ? ", optional" : ""} here)`);
    }
    for (const m of want.methods) {
      const g = have.methods.find((x) => x.name === m.name);
      if (!g || this.shapeKey({ fields: [], methods: [g] }) !== this.shapeKey({ fields: [], methods: [m] })) return reject(`which has no method ${m.name}${g ? " of that signature" : ""}`);
    }
    if (!this.protocolByName(to)) this.shapeProtocols.set(to, { name: to, bases: [], fields: want.fields, methods: [] });
    if (!this.conformances.has(from)) this.conformances.set(from, new Set());
    this.conformances.get(from)!.add(to);
  }

  /**
   * An object of class `cls` flowing into an interface / object type `to` it doesn't declare (rest2): like a record's
   * conformance, the class gets `to` as a protocol (generated), when it has each field (same native type and
   * optional-ness, a field, not a getter) and each method (same signature). Else rejected: a copy wouldn't be the object.
   */
  private classConform(cls: string, to: string, source: ts.Type, target: ts.Type, at: ts.Node, declared: boolean) {
    const want = declared ? undefined : this.shapeMembers(target, at);
    const protocol = declared ? this.protocolByName(to) : undefined;
    const fields = protocol ? [...this.protocolMembers(to)].flatMap((n) => this.protocolField(to, n) ?? []) : want?.fields ?? [];
    const methods = protocol ? [...this.protocolMembers(to)].flatMap((n) => this.protocolMethod(to, n) ?? []) : want?.methods ?? [];
    const reject = (why: string) =>
      void this.error(at, `An object of the class ${this.checker.typeToString(source)} is used as ${this.checker.typeToString(target)}, ${why}: natively the class can only conform to it with the same members (a copy would not be the same object). Declare it \`implements\` an interface with those members, or build a new object.`);
    const ctx: Ctx = { async: false, ret: T.void, voidUnion: false, inTry: false };
    for (const f of fields) {
      const prop = source.getProperty(f.name);
      const decl = prop?.valueDeclaration;
      if (!prop || !decl || !(ts.isPropertyDeclaration(decl) || ts.isParameter(decl))) return reject(`whose ${f.name} is ${prop ? "not a field" : "missing"}`);
      const ty = this.tyOfSymbol(prop, decl);
      if (!this.sameTy(ty, f.ty) || !!(prop.flags & ts.SymbolFlags.Optional) !== f.optional) return reject(`whose ${f.name} has another native type (${mangle(f.ty)} there, ${mangle(ty)} here)`);
    }
    for (const m of methods) {
      const decl = source.getProperty(m.name)?.valueDeclaration;
      if (!decl || !ts.isMethodDeclaration(decl)) return reject(`which has no method ${m.name}`);
      const signature = this.checker.getSignatureFromDeclaration(decl)!;
      const params = this.params(decl, ctx).map((p) => ({ name: p.name, ty: p.default ? T.optional(p.ty) : p.ty }));
      const mine = { name: m.name, params, ret: this.ty(signature.getReturnType(), decl, this.slotKind(decl)), ...(this.throws(decl) ? { throws: true } : {}) };
      if (this.shapeKey({ fields: [], methods: [mine] }) !== this.shapeKey({ fields: [], methods: [m] })) return reject(`whose method ${m.name} has another native signature`);
    }
    if (!this.protocolByName(to)) this.shapeProtocols.set(to, { name: to, bases: [], fields, methods: [] });
    if (!this.conformances.has(cls)) this.conformances.set(cls, new Set());
    this.conformances.get(cls)!.add(to);
  }

  private protocolField(p: string, name: string): ClassField | undefined {
    const decl = this.protocolByName(p);
    return decl?.fields.find((f) => f.name === name) ?? decl?.bases.map((b) => this.protocolField(b, name)).find(Boolean);
  }

  private protocolMethod(p: string, name: string): ProtocolDecl["methods"][number] | undefined {
    const decl = this.protocolByName(p);
    return decl?.methods.find((m) => m.name === name) ?? decl?.bases.map((b) => this.protocolMethod(b, name)).find(Boolean);
  }

  /** A protocol that a shape protocol flows into is one of its bases; the members the base declares are the base's. */
  private extendProtocol(p: ProtocolDecl): ProtocolDecl {
    for (const to of this.conformances.get(p.name) ?? []) {
      if (p.bases.includes(to)) continue;
      p.bases.push(to);
      const inherited = this.protocolMembers(to);
      p.fields = p.fields.filter((f) => !inherited.has(f.name));
      p.methods = p.methods.filter((m) => !inherited.has(m.name));
    }
    return p;
  }

  /** Every member name a protocol declares, its bases' included. */
  private protocolMembers(name: string, out = new Set<string>()): Set<string> {
    const p = this.protocolByName(name);
    for (const m of [...(p?.fields ?? []), ...(p?.methods ?? [])]) out.add(m.name);
    for (const b of p?.bases ?? []) this.protocolMembers(b, out);
    return out;
  }

  /** The program's records and protocols after the flows: merged and protocol records go, conforming ones list their protocols. */
  private finishShapes(out: Program) {
    out.classes = out.classes.filter((c) => !this.mergedRecords.has(c.name) && !this.shapeProtocols.has(c.name));
    for (const c of out.classes) {
      const protocols = this.conformances.get(c.name);
      if (!protocols?.size) continue;
      c.protocols = [...protocols];
      const names = new Set([...protocols].flatMap((p) => [...this.protocolMembers(p)]));
      // Swift's `{ get set }` needs a `var`; TypeScript doesn't check `readonly` when assigning.
      for (const f of c.fields) if (names.has(f.name)) Object.assign(f, { implements: true, readonly: false });
    }
    if (this.shapeProtocols.size) out.protocols = [...(out.protocols ?? []), ...this.shapeProtocols.values()];
  }

  /** Same-shaped flows share a class, so their numbers have one kind: every flow links the fields of the two types. */
  private linkShapes(source: ts.Type, target: ts.Type, seen = new Map<ts.Type, Set<ts.Type>>()): void {
    source = this.checker.getNonNullableType(source);
    target = this.checker.getNonNullableType(target);
    if (source === target || source.isUnion() || target.isUnion() || seen.get(source)?.has(target)) return;
    if (!seen.has(source)) seen.set(source, new Set());
    seen.get(source)!.add(target);
    if (this.checker.isArrayType(source) && this.checker.isArrayType(target)) {
      return this.linkShapes(this.checker.getTypeArguments(source as ts.TypeReference)[0]!, this.checker.getTypeArguments(target as ts.TypeReference)[0]!, seen);
    }
    if (!(source.flags & target.flags & ts.TypeFlags.Object) && !(source.isIntersection() || target.isIntersection())) return;
    if (source.getCallSignatures().length || target.getCallSignatures().length) return;
    for (const p of target.getProperties()) {
      const q = source.getProperty(p.name);
      if (!q) continue;
      const [pt, qt] = [this.checker.getTypeOfSymbol(p), this.checker.getTypeOfSymbol(q)];
      if (this.isNumber(pt) && this.isNumber(qt)) this.link(p, q);
      else this.linkShapes(qt, pt, seen);
    }
  }

  /** The object-literal method whose `this` this is (arrow functions see their parent's). */
  private literalThis(node: ts.Node): LiteralFn | undefined {
    const container = ts.findAncestor(node.parent, (n) => (ts.isFunctionLike(n) && !ts.isArrowFunction(n)) || ts.isPropertyDeclaration(n) || ts.isSourceFile(n));
    if (!container) return undefined;
    // rest2: a getter / setter of the literal, and `m: function () { … }` filling a method (only ever called on the object).
    if ((ts.isMethodDeclaration(container) || ts.isAccessor(container)) && ts.isObjectLiteralExpression(container.parent)) return container;
    if (ts.isFunctionExpression(container) && !container.asteriskToken && ts.isPropertyAssignment(container.parent) && container.parent.initializer === container && ts.isObjectLiteralExpression(container.parent.parent)) {
      const contextual = this.checker.getContextualType(container.parent.parent);
      const decl = contextual && ts.isIdentifier(container.parent.name) ? this.checker.getNonNullableType(contextual).getProperty(container.parent.name.text)?.valueDeclaration : undefined;
      return decl && (ts.isMethodSignature(decl) || ts.isMethodDeclaration(decl)) ? container : undefined;
    }
    return undefined;
  }

  /** `o.m` where m is a method the app declares (a class's, an interface's), not a library one. */
  private objectClassMethod(callee: ts.PropertyAccessExpression): boolean {
    const decl = this.checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
    return !!decl && !decl.getSourceFile().isDeclarationFile && (ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl));
  }

  /** `o.x` where x is a getter / setter of an object literal (rest2). */
  private isLiteralAccessor(node: ts.Node): node is ts.PropertyAccessExpression & { name: ts.Identifier } {
    if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.name)) return false;
    return !!this.checker.getSymbolAtLocation(node.name)?.declarations?.some((d) => ts.isAccessor(d) && ts.isObjectLiteralExpression(d.parent));
  }

  private isLiteralMethod(decl: ts.Node): boolean {
    return (ts.isMethodDeclaration(decl) && ts.isObjectLiteralExpression(decl.parent)) || (ts.isMethodSignature(decl) && ts.isTypeLiteralNode(decl.parent));
  }

  /** `this` of an object-literal method inside an arrow function that may outlive the call (anything but an array method's callback). */
  private keepsLiteralThis(node: ts.Node): boolean {
    for (let fn = ts.findAncestor(node.parent, ts.isFunctionLike); fn && ts.isArrowFunction(fn); fn = ts.findAncestor(fn.parent, ts.isFunctionLike)) {
      const call = fn.parent;
      const callback = ts.isCallExpression(call) && call.arguments.includes(fn) && ts.isPropertyAccessExpression(call.expression) && ARRAY_CALLBACKS.has(call.expression.name.text) && this.isArray(this.checker.getNonNullableType(this.typeOf(call.expression.expression)));
      if (!callback) return true;
    }
    return false;
  }

  /** A `this` of this object-literal method in its body. */
  private findThis(method: LiteralFn): ts.Node | undefined {
    const visit = (n: ts.Node): ts.Node | undefined => (n.kind === ts.SyntaxKind.ThisKeyword && this.literalThis(n) === method ? n : ts.forEachChild(n, visit));
    return method.body && visit(method.body);
  }

  // -------------------------------------------------------------------------
  // Unions of different types (`string | number`, `Circle | Square`, `unknown`): one tagged enum each.
  // A read TypeScript narrowed extracts the member (`uget`); `typeof`, `instanceof`, `in` and a
  // discriminant test the tag; text, truthiness, `===`, casts and shared fields are generated helpers.
  // -------------------------------------------------------------------------

  /** The unions the program uses, by native name. */
  private readonly unions = new Map<string, UnionDecl>();
  /** Their helpers (`U__…__str`, `U__…__to__U__…`, `U__…__get__kind`…): IR functions, printed like the app's. */
  private readonly unionFns = new Map<string, FnDecl>();

  /** A union whose members are not all strings, numbers or booleans. A number member is a Double. */
  private unionTy(type: ts.Type, members: ts.Type[], node: ts.Node): Ty {
    const tys: Ty[] = [];
    for (const m of members) {
      const ty = m.flags & ts.TypeFlags.BooleanLike ? T.bool : m.flags & ts.TypeFlags.NumberLike ? T.double : m.flags & ts.TypeFlags.StringLike ? T.string : this.ty(m, node);
      if (!["double", "string", "bool", "class", "array", "map"].includes(ty.k)) {
        return this.error(node, `The union ${this.checker.typeToString(type)} has no native equivalent: ${this.checker.typeToString(m)} can't be a member of one (strings, numbers, booleans, the app's interfaces and classes, arrays and maps can).`), T.string;
      }
      if (!tys.some((t) => this.sameTy(t, ty))) tys.push(ty);
    }
    return tys.length === 1 ? tys[0]! : this.unionNamed(tys);
  }

  /** `unknown` (but a caught error) is this, optional: undefined (nil), null, a boolean, a number or a string. */
  private unknownTy(): Ty {
    // With thrown values (adapters2) an `unknown` may also hold a caught error (a native error).
    return this.unionNamed([T.bool, T.void, T.double, T.string, ...(this.thrownValues ? [T.rt("Error")] : [])]);
  }

  /** A caught error (or a property of one): `unknown` in TypeScript, an Error natively. */
  private isCaught(node: ts.Node): boolean {
    // An error's `cause` (adapters2): any thrown value, a native error as a caught one is.
    if (this.thrownValues && ts.isPropertyAccessExpression(node) && node.name.text === "cause" && this.isErrorCause(node)) return true;
    let n = node;
    while (ts.isPropertyAccessExpression(n) || ts.isParenthesizedExpression(n) || ts.isNonNullExpression(n)) n = n.expression;
    const decl = ts.isIdentifier(n) ? this.checker.getSymbolAtLocation(n)?.valueDeclaration : n;
    return !!decl && ((ts.isVariableDeclaration(decl) && ts.isCatchClause(decl.parent)) || this.reasonParams.has(decl));
  }

  private sameTy(a: Ty, b: Ty): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /** The union of these members, declared once under a name made of their tags. */
  private unionNamed(tys: Ty[]): Extract<Ty, { k: "union" }> {
    const members = tys.map((ty) => ({ tag: this.unionTag(ty), ty })).sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
    const name = `U__${members.map((m) => m.tag).join("__")}`;
    if (!this.unions.has(name)) this.unions.set(name, { name, members });
    return { k: "union", name };
  }

  private unionTag(ty: Ty): string {
    switch (ty.k) {
      case "int":
      case "double":
        return "Num";
      case "string":
        return "Str";
      case "bool":
        return "Bool";
      case "void":
        return "Null";
      case "class":
        return `C_${ty.name}`;
      case "union":
        return ty.name;
      case "array":
      case "map":
      case "optional":
        return `${ty.k[0]!.toUpperCase()}_${this.unionTag(ty.of)}`;
      default:
        return ty.k;
    }
  }

  private unionDecl(ty: Ty): UnionDecl | undefined {
    const u = ty.k === "optional" ? ty.of : ty;
    return u.k === "union" ? this.unions.get(u.name) : undefined;
  }

  /** A TypeScript type that is a native union (or an optional one): not all strings, numbers or booleans. */
  private isTsUnion(type: ts.Type): boolean {
    const t = this.checker.getNonNullableType(type);
    return !!(t.flags & ts.TypeFlags.Unknown) || this.checker.typeToString(t) === "{}" || (t.isUnion() && !this.isString(t) && !this.isNumber(t) && !this.isBoolean(t));
  }

  /** The member a value of type `ty` goes in: its own, or (an object) its base's or protocol's. */
  private unionMember(u: UnionDecl, ty: Ty): UnionDecl["members"][number] | undefined {
    const own = u.members.find((m) => this.sameTy(m.ty, ty));
    if (own || ty.k !== "class") return own;
    const supers = this.supertypes(ty.name);
    return u.members.find((m) => m.ty.k === "class" && supers.has(m.ty.name));
  }

  /** A value of type `have` as union `want`: a member wrapped (an Int as a Double), another union cast. */
  private toUnionValue(x: Expr, have: Ty, want: Ty): Expr | undefined {
    if (want.k !== "union") return undefined;
    if (have.k === "union") return have.name === want.name ? x : this.unionCall(`${have.name}__to__${want.name}`, () => this.castFn(have.name, want.name), [x]);
    if (have.k === "int") return this.toUnionValue(x.e === "int" ? { e: "double", v: `${x.v}.0` } : { e: "toDouble", x }, T.double, want);
    const member = this.unionMember(this.unions.get(want.name)!, have);
    return member && { e: "uwrap", x, u: want.name, tag: member.tag, ty: member.ty };
  }

  /** A call of a generated helper, made the first time it is used. */
  private unionCall(name: string, make: () => Pick<FnDecl, "params" | "ret" | "body">, args: Expr[]): Expr {
    if (!this.unionFns.has(name)) {
      const fn: FnDecl = { name, params: [], ret: T.void, async: false, body: [] };
      this.unionFns.set(name, fn);
      Object.assign(fn, make());
    }
    return { e: "call", callee: { e: "id", name }, args };
  }

  /** A helper over the members of `u`: `each` gives a member's statements (its value read as `get`), or none. */
  private unionHelper(u: string, ret: Ty, each: (m: UnionDecl["members"][number], get: Expr, is: Expr) => Stmt[], end: Stmt, params: string[] = ["u"]) {
    const [x] = params.map((name): Expr => ({ e: "id", name }));
    const body: Stmt[] = [];
    for (const m of this.unions.get(u)!.members) {
      const get: Expr = m.ty.k === "void" ? { e: "nil" } : { e: "uget", x: x!, u, tag: m.tag, ty: m.ty };
      body.push(...each(m, get, { e: "uis", x: x!, u, tag: m.tag }));
    }
    body.push(end);
    return { params: params.map((name) => ({ name, ty: { k: "union", name: u } as Ty })), ret, body };
  }

  private castFn(from: string, to: string) {
    const target = this.unions.get(to)!;
    return this.unionHelper(from, { k: "union", name: to }, (m, get, is) => {
      const into = this.unionMember(target, m.ty);
      return into ? [{ s: "if", c: is, then: [{ s: "return", x: { e: "uwrap", x: get, u: to, tag: into.tag, ty: into.ty } }] }] : [];
    }, { s: "unreachable" });
  }

  private typeofName(ty: Ty): string {
    switch (ty.k) {
      case "int":
      case "double":
        return "number";
      case "string":
        return "string";
      case "bool":
        return "boolean";
      case "fn":
        return "function";
      case "void":
        return "undefined";
      case "rt":
        return ty.name === "BigInt" ? "bigint" : ty.name === "Symbol" ? "symbol" : "object";
      default:
        return "object";
    }
  }

  /** `typeof` of a member: `null`'s is "object". */
  private memberTypeof(m: UnionDecl["members"][number]): string {
    return m.ty.k === "void" ? "object" : this.typeofName(m.ty);
  }

  /** What `typeof` gives for nil here: an `unknown`'s nil is undefined; otherwise the TypeScript type says which, if only one. */
  private nilTypeof(node: ts.Expression, decl: UnionDecl | undefined): string | undefined {
    if (decl?.members.some((m) => m.tag === "Null")) return "undefined";
    const members = this.members(this.typeOf(node));
    const [hasNull, hasUndefined] = [members.some((m) => m.flags & ts.TypeFlags.Null), members.some((m) => m.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void))];
    return hasNull && hasUndefined ? undefined : hasNull ? "object" : "undefined";
  }

  private any(tests: Expr[]): Expr {
    return tests.reduce<Expr | undefined>((a, b) => (a ? { e: "bin", op: "||", l: a, r: b } : b), undefined) ?? { e: "bool", v: false };
  }

  private both(a: Expr, b: Expr): Expr {
    if (b.e === "bool") return b.v ? a : b;
    return { e: "bin", op: "&&", l: a, r: b };
  }

  private some(x: Expr, not = false): Expr {
    return { e: "bin", op: not ? "==" : "!=", l: x, r: { e: "nil" } };
  }

  private impure(node: ts.Expression, what: string): Expr {
    return this.error(node, `${what} reads the value more than once natively: read it into a variable first.`);
  }

  /** A read TypeScript narrowed: the member it holds (a checked extraction), or the narrower union. */
  private fromUnion(x: Expr, node: ts.Node, declared: ts.Type, here: ts.Type): Expr | undefined {
    if (!this.isTsUnion(declared)) return undefined;
    const d = this.ty(declared, node);
    const from = this.unionDecl(d);
    const h = this.checker.getNonNullableType(here);
    if (!from || h.flags & (ts.TypeFlags.Never | ts.TypeFlags.NonPrimitive | ts.TypeFlags.Unknown)) return undefined;
    const to = this.ty(h, node);
    const nullable = this.isNullable(here) || !!(here.flags & ts.TypeFlags.Unknown);
    // The same union, maybe no longer null (`{}`: an `unknown` that isn't null or undefined).
    if (to.k === "union" && to.name === from.name) return d.k === "optional" && !nullable && x.e !== "unwrap" ? { e: "unwrap", x } : undefined;
    const v: Expr = d.k === "optional" && x.e !== "unwrap" && !nullable ? { e: "unwrap", x } : x;
    const narrow = (y: Expr): Expr | undefined => {
      if (to.k === "union") return this.toUnionValue(y, { k: "union", name: from.name }, to);
      const member = this.unionMember(from, to);
      if (!member) return undefined;
      const got: Expr = { e: "uget", x: y, u: from.name, tag: member.tag, ty: member.ty };
      return to.k === "class" && member.ty.k === "class" && to.name !== member.ty.name ? { e: "downcast", x: got, cls: to.name } : got;
    };
    if (d.k !== "optional" || !nullable) return narrow(v);
    const inner = narrow({ e: "unwrap", x: v });
    return inner && { e: "cond", c: this.some(v), a: inner, b: { e: "nil" } };
  }

  /** A value going where a union is expected: wrapped, cast, or (`T | null`) wrapped when present. */
  private intoUnion(x: Expr, node: ts.Expression, want: Ty): Expr | undefined {
    const elem = (t: Ty) => (t.k === "array" || t.k === "map" ? t.of : undefined);
    if (elem(want)?.k === "union" && x.e !== "arr" && x.e !== "dict" && x.e !== "nil") {
      const have = this.tyOfExpr(node);
      if (have.k === want.k && !this.sameTy(have, want)) {
        return this.error(node, `${this.checker.typeToString(this.typeOf(node))} is used where ${have.k === "array" ? "an array" : "a map"} of a union is expected: natively they are different types. Build it with the union's type.`);
      }
    }
    const target = want.k === "optional" ? want.of : want;
    // A conditional's branches were each made the union already.
    let bare: ts.Node = node;
    while (ts.isParenthesizedExpression(bare)) bare = bare.expression;
    if (target.k !== "union" || x.e === "uwrap" || ts.isConditionalExpression(bare)) return undefined;
    const decl = this.unions.get(target.name)!;
    const nullMember = decl.members.find((m) => m.tag === "Null");
    if (nullMember && bare.kind === ts.SyntaxKind.NullKeyword) return { e: "uwrap", x, u: target.name, tag: "Null", ty: T.void };
    if (x.e === "nil") return undefined;
    // A caught error is typed `unknown` but natively it is an Error, which no `unknown` union holds.
    const caught = ts.isIdentifier(bare) ? this.checker.getSymbolAtLocation(bare)?.valueDeclaration : undefined;
    // adapters2: a caught value (or a cause) as an `unknown`: the value it carries, else the error itself.
    if (this.thrownValues && this.typeOf(node).flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any) && this.isCaught(node) && want.k === "optional") return this.caughtToUnknown(x);
    if (this.thrownValues && this.typeOf(node).flags & ts.TypeFlags.Object && this.isClassType(this.typeOf(node))) {
      const cls = this.tyOfExpr(node);
      if (this.isErrorClass(cls)) return { e: "uwrap", x: this.wrapError(x, cls), u: target.name, tag: this.unionTag(T.rt("Error")), ty: T.rt("Error") };
    }
    if (caught && ts.isVariableDeclaration(caught) && ts.isCatchClause(caught.parent)) {
      return this.error(node, "A caught error is natively an Error, not an `unknown` value: pass `String(e)` or `e.message` (after `e instanceof Error`).");
    }
    const have = this.tyOfExpr(node);
    const inner = have.k === "optional" ? have.of : have;
    if (inner.k === "union" && inner.name === target.name) return undefined;
    const fail = () =>
      this.error(node, `${this.checker.typeToString(this.typeOf(node))} has no member in the native union ${target.name}${nullMember ? " (an `unknown` holds strings, numbers, booleans, null and undefined natively)" : ""}.`);
    if (have.k !== "optional") return this.toUnionValue(x, have, target) ?? fail();
    // A computed value (`heap.pop() ?? "empty"`) is evaluated once (`with`).
    const pure = this.isPure(node) || x.e === "id";
    const v: Expr = pure ? x : { e: "id", name: `lv__${++this.temps}` };
    const some = this.toUnionValue({ e: "unwrap", x: v }, inner, target) ?? fail();
    const nil = nullMember ? this.nilTypeof(node, undefined) : "undefined";
    if (!nil) return this.error(node, "This value may be null or undefined, which an `unknown` keeps apart natively: narrow it first.");
    const value: Expr = { e: "cond", c: this.some(v), a: some, b: nil === "object" ? { e: "uwrap", x: { e: "nil" }, u: target.name, tag: "Null", ty: T.void } : { e: "nil" } };
    return pure ? value : { e: "with", name: (v as { name: string }).name, ty: have, init: x, body: value };
  }

  /** The members of a union an object literal is assignable to. */
  private literalFits(contextual: ts.Type | undefined, node: ts.ObjectLiteralExpression): ts.Type[] {
    const fresh = this.typeOf(node);
    return contextual ? this.members(this.checker.getNonNullableType(contextual)).filter((t) => this.checker.isTypeAssignableTo(fresh, t)) : [];
  }

  /** The type an object literal builds: its contextual type, or the one member of a contextual union it fits. */
  private literalMember(contextual: ts.Type, node: ts.ObjectLiteralExpression): ts.Type {
    const fits = this.checker.getNonNullableType(contextual).isUnion() ? this.literalFits(contextual, node) : [];
    return fits.length === 1 ? fits[0]! : contextual;
  }

  /** `{ kind: "circle", r: 1 }` where a union is expected: the one member TypeScript finds it assignable to. */
  private unionObject(node: ts.ObjectLiteralExpression, ctx: Ctx, u: string): Expr {
    const contextual = this.checker.getContextualType(node);
    const fits = this.literalFits(contextual, node);
    const member = fits.length === 1 ? this.unionMember(this.unions.get(u)!, this.ty(fits[0]!, node)) : undefined;
    if (!member) return this.error(node, `This object literal can't be told apart between the members of ${contextual ? this.checker.typeToString(contextual) : "the union"} natively; give it one member's type first (const c: Circle = {…}).`);
    return { e: "uwrap", x: this.object(node, ctx, member.ty), u, tag: member.tag, ty: member.ty };
  }

  /** `typeof x` as a value. */
  private typeofValue(node: ts.TypeOfExpression, ctx: Ctx): Expr {
    const ty = this.tyOfExpr(node.expression);
    if (this.thrownValues && ty.k === "rt" && ty.name === "Error") return this.thrownTypeof(this.expr(node.expression, ctx));
    const decl = this.unionDecl(ty);
    const inner = ty.k === "optional" ? ty.of : ty;
    const x = this.expr(node.expression, ctx);
    const value = (y: Expr): Expr => (decl ? this.unionCall(`${decl.name}__typeof`, () => this.typeofFn(decl.name), [y]) : { e: "str", v: this.typeofName(inner) });
    if (ty.k !== "optional") return value(x);
    const nil = this.nilTypeof(node.expression, decl);
    if (!nil) return this.error(node, "`typeof` of a value that may be null or undefined: natively they are one nil; narrow it first.");
    if (!this.isPure(node.expression)) return this.impure(node.expression, "`typeof` of a value that may be null");
    return { e: "cond", c: this.some(x, true), a: { e: "str", v: nil }, b: value({ e: "unwrap", x }) };
  }

  private typeofFn(u: string) {
    return this.unionHelper(u, T.string, (m, _get, is) => [{ s: "if", c: is, then: [{ s: "return", x: { e: "str", v: this.memberTypeof(m) } }] }], { s: "unreachable" });
  }

  /**
   * A read TypeScript narrowed to fewer members is a cast of the declared union: a tag test reads
   * the declared one (same tags) instead of making the narrower one.
   */
  private uncast(x: Expr, decl: UnionDecl | undefined): [Expr, UnionDecl | undefined] {
    const from = x.e === "call" && x.callee.e === "id" && decl ? new RegExp(`^(U__.*)__to__${decl.name}$`).exec(x.callee.name)?.[1] : undefined;
    return from && x.e === "call" && this.unions.has(from) ? [x.args[0]!, this.unions.get(from)] : [x, decl];
  }

  /** `typeof x === "number"`: a test of the tags whose `typeof` it is (a constant for any other type). */
  private typeofTest(node: ts.TypeOfExpression, name: string, ctx: Ctx): Expr {
    const ty = this.tyOfExpr(node.expression);
    if (this.thrownValues && ty.k === "rt" && ty.name === "Error") return { e: "bin", op: "==", l: this.thrownTypeof(this.expr(node.expression, ctx)), r: { e: "str", v: name }, text: true };
    const decl = this.unionDecl(ty);
    const inner = ty.k === "optional" ? ty.of : ty;
    const tags = decl?.members.filter((m) => this.memberTypeof(m) === name) ?? [];
    if ((ty.k === "optional" ? 1 : 0) + tags.length > 1 && !this.isPure(node.expression)) return this.impure(node.expression, "This `typeof` test");
    const [x, u] = this.uncast(this.expr(node.expression, ctx), decl);
    const test = (y: Expr): Expr => (u ? this.any(tags.map((m): Expr => ({ e: "uis", x: y, u: u.name, tag: m.tag }))) : { e: "bool", v: this.typeofName(inner) === name });
    if (ty.k !== "optional") return test(x);
    const nil = this.nilTypeof(node.expression, decl);
    if (!nil) return this.error(node, "`typeof` of a value that may be null or undefined: natively they are one nil; narrow it first.");
    const some = test({ e: "unwrap", x });
    if (name !== nil) return this.both(this.some(x), some);
    return some.e === "bool" && !some.v ? this.some(x, true) : { e: "bin", op: "||", l: this.some(x, true), r: some };
  }

  /** `===` / `!==` where a side is a union, `typeof x === "…"`, `"key" in x` on a union, `null` against an `unknown`. */
  private unionBinary(node: ts.BinaryExpression, ctx: Ctx): Expr | undefined {
    const kind = node.operatorToken.kind;
    if (kind === ts.SyntaxKind.InKeyword) return this.unionIn(node, ctx);
    const loose = kind === ts.SyntaxKind.EqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsToken;
    if (!loose && kind !== ts.SyntaxKind.EqualsEqualsEqualsToken && kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken) return undefined;
    const not = (x: Expr): Expr => (kind === ts.SyntaxKind.ExclamationEqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsToken ? { e: "not", x } : x);
    const skip = (n: ts.Expression): ts.Expression => (ts.isParenthesizedExpression(n) ? skip(n.expression) : n);
    const literal = (n: ts.Expression) => (ts.isStringLiteral(skip(n)) || ts.isNoSubstitutionTemplateLiteral(skip(n)) ? (skip(n) as ts.StringLiteral).text : undefined);
    for (const [a, b] of [[node.left, node.right], [node.right, node.left]] as const) {
      const operand = skip(a);
      if (ts.isTypeOfExpression(operand) && literal(b) !== undefined) return not(this.typeofTest(operand, literal(b)!, ctx));
    }
    const side = (n: ts.Expression) => (this.isTsUnion(this.typeOf(n)) ? this.unionDecl(this.tyOfExpr(n)) : undefined);
    const [lu, ru] = [side(node.left), side(node.right)];
    if (!lu && !ru) return undefined;
    const isNil = (n: ts.Expression) => skip(n).kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(skip(n)) && (skip(n) as ts.Identifier).text === "undefined");
    if (isNil(node.left) || isNil(node.right)) {
      const [other, nil, u] = isNil(node.left) ? [node.right, node.left, ru] : [node.left, node.right, lu];
      // An `unknown`: nil is undefined, null is the member Null. Any other union's nil is both.
      if (!u?.members.some((m) => m.tag === "Null")) return undefined;
      if (!this.isPure(other)) return this.impure(other, "Comparing an `unknown` with null");
      const x = this.expr(other, ctx);
      const isNull = this.both(this.some(x), { e: "uis", x: { e: "unwrap", x }, u: u.name, tag: "Null" });
      return not(loose ? { e: "bin", op: "||", l: this.some(x, true), r: isNull } : skip(nil).kind === ts.SyntaxKind.NullKeyword ? isNull : this.some(x, true));
    }
    const [lt, rt] = [this.tyOfExpr(node.left), this.tyOfExpr(node.right)];
    if (loose) {
      // `==` (rest2): JavaScript's loose equality, member by member; nil (null or undefined) equals only nil (and `unknown`'s Null).
      for (const [n, t] of [[node.left, lt], [node.right, rt]] as const) if (t.k === "optional" && !this.isPure(n)) return this.impure(n, "== on a union that may be null");
      const eq = this.unionEqOf(this.expr(node.left, ctx), lt, this.expr(node.right, ctx), rt, true);
      return eq ? not(eq) : this.error(node, "== between these members isn't supported natively (an object of a type with no text form): compare with ===.");
    }
    const strip = (t: Ty): Ty => (t.k === "optional" ? t.of : t.k === "int" ? T.double : t);
    // One union holding both sides' members.
    const tys: Ty[] = [];
    for (const t of [strip(lt), strip(rt)]) {
      for (const m of t.k === "union" ? this.unions.get(t.name)!.members.map((m) => m.ty) : [t]) {
        if (!tys.some((have) => this.sameTy(have, m) || (m.k === "class" && have.k === "class" && this.supertypes(m.name).has(have.name)))) tys.push(m);
      }
    }
    const w = this.unionNamed(tys);
    if (lt.k === "optional" && rt.k === "optional") return this.error(node, "=== between two unions that may both be null: narrow one first.");
    const optional = lt.k === "optional" ? node.left : rt.k === "optional" ? node.right : undefined;
    if (optional && !this.isPure(optional)) return this.impure(optional, "=== on a union that may be null");
    const [l, r] = [this.expr(node.left, ctx), this.expr(node.right, ctx)];
    const wrap = (x: Expr, t: Ty) => this.toUnionValue(t.k === "optional" ? { e: "unwrap", x } : x, t.k === "optional" ? t.of : t, w)!;
    const eq = this.unionCall(`${w.name}__eq`, () => this.eqFn(w.name), [wrap(l, lt), wrap(r, rt)]);
    return not(optional ? this.both(this.some(optional === node.left ? l : r), eq) : eq);
  }

  /**
   * `l === r` / `l == r` (`loose`) where a side is a union (rest2: `==` and `switch`), both wrapped into one union of
   * both sides' members. An optional side must be pure (it is read twice). Undefined when a loose pair has no form.
   */
  private unionEqOf(l: Expr, lt: Ty, r: Expr, rt: Ty, loose: boolean): Expr | undefined {
    const strip = (t: Ty): Ty => (t.k === "optional" ? t.of : t.k === "int" ? T.double : t);
    const tys: Ty[] = [];
    for (const t of [strip(lt), strip(rt)]) {
      for (const m of t.k === "union" ? this.unions.get(t.name)!.members.map((m) => m.ty) : t.k === "void" ? [] : [t]) {
        if (!tys.some((have) => this.sameTy(have, m) || (m.k === "class" && have.k === "class" && this.supertypes(m.name).has(have.name)))) tys.push(m);
      }
    }
    // `x == null` of a union that may be null: nil (and `unknown`'s Null).
    const nullish = (x: Expr, t: Ty): Expr => {
      const u = this.unionDecl(t);
      const isNull: Expr | undefined = u?.members.some((m) => m.tag === "Null") ? { e: "uis", x: { e: "unwrap", x }, u: u.name, tag: "Null" } : undefined;
      return t.k !== "optional" ? (isNull ? { e: "uis", x, u: u!.name, tag: "Null" } : { e: "bool", v: false }) : isNull ? { e: "bin", op: "||", l: this.some(x, true), r: isNull } : this.some(x, true);
    };
    if (l.e === "nil" || r.e === "nil") return l.e === "nil" ? nullish(r, rt) : nullish(l, lt);
    const w = this.unionNamed(tys);
    if (w.k !== "union") return undefined;
    if (loose && !this.unionLooseFn(w.name)) return undefined;
    const wrap = (x: Expr, t: Ty) => this.toUnionValue(t.k === "optional" ? { e: "unwrap", x } : x, t.k === "optional" ? t.of : t, w)!;
    const eq = loose
      ? this.unionCall(`${w.name}__leq`, () => this.unionLooseFn(w.name)!, [wrap(l, lt), wrap(r, rt)])
      : this.unionCall(`${w.name}__eq`, () => this.eqFn(w.name), [wrap(l, lt), wrap(r, rt)]);
    if (lt.k !== "optional" && rt.k !== "optional") return eq;
    if (lt.k === "optional" && rt.k === "optional") {
      const both = this.both(this.some(l), this.both(this.some(r), eq));
      return loose ? this.any([{ e: "bin", op: "&&", l: nullish(l, lt), r: nullish(r, rt) }, both]) : both;
    }
    const [o, ot] = lt.k === "optional" ? [l, lt] : [r, rt];
    const other = (o === l ? [r, rt] : [l, lt]) as [Expr, Ty];
    const some = this.both(this.some(o), eq);
    // nil == the other side's Null (an `unknown`).
    return loose && this.unionDecl(other[1])?.members.some((m) => m.tag === "Null") ? this.any([{ e: "bin", op: "&&", l: this.some(o, true), r: nullish(...other) }, some]) : some;
  }

  /** JavaScript's `==` over the members of `u` (rest2); undefined when an object member has no text form. */
  private unionLooseFn(u: string): Pick<FnDecl, "params" | "ret" | "body"> | undefined {
    const members = this.unions.get(u)!.members;
    const prim = (t: Ty) => ["double", "string", "bool", "void"].includes(t.k);
    const body: Stmt[] = [];
    const [a, b] = [{ e: "id", name: "a" }, { e: "id", name: "b" }] as Expr[];
    const num = (x: Expr): Expr => ({ e: "op", op: "num.parse", args: [x] });
    const one = (x: Expr): Expr => ({ e: "cond", c: x, a: { e: "double", v: "1.0" }, b: { e: "double", v: "0.0" } });
    for (const ma of members) {
      for (const mb of members) {
        const [x, y] = [{ e: "uget", x: a!, u, tag: ma.tag, ty: ma.ty } as Expr, { e: "uget", x: b!, u, tag: mb.tag, ty: mb.ty } as Expr];
        // A side's primitive value: a string or number stays, a boolean is a number, an object its text.
        const side = (t: Ty, v: Expr): { k: "num" | "str"; v: Expr } | undefined => {
          if (t.k === "double") return { k: "num", v };
          if (t.k === "string") return { k: "str", v };
          if (t.k === "bool") return { k: "num", v: one(v) };
          const text = this.elemText(v, t);
          return text && { k: "str", v: text };
        };
        let value: Expr | undefined;
        if (ma.tag === mb.tag) {
          value = ma.ty.k === "void" ? { e: "bool", v: true } : { e: "bin", op: ma.ty.k === "class" || ma.ty.k === "array" || ma.ty.k === "map" ? "===" : "==", l: x, r: y, ...(ma.ty.k === "string" ? { text: true } : {}) };
        } else if (ma.ty.k === "void" || mb.ty.k === "void" || (!prim(ma.ty) && !prim(mb.ty))) {
          value = { e: "bool", v: false };
        } else {
          const [p, q] = [side(ma.ty, x), side(mb.ty, y)];
          if (!p || !q) return undefined;
          value = p.k === "str" && q.k === "str" ? { e: "bin", op: "==", l: p.v, r: q.v, text: true } : { e: "bin", op: "==", l: p.k === "num" ? p.v : num(p.v), r: q.k === "num" ? q.v : num(q.v) };
        }
        body.push({ s: "if", c: { e: "bin", op: "&&", l: { e: "uis", x: a!, u, tag: ma.tag }, r: { e: "uis", x: b!, u, tag: mb.tag } }, then: [{ s: "return", x: value }] });
      }
    }
    body.push({ s: "unreachable" });
    return { params: [{ name: "a", ty: { k: "union", name: u } }, { name: "b", ty: { k: "union", name: u } }], ret: T.bool, body };
  }

  private eqFn(u: string) {
    return this.unionHelper(u, T.bool, (m, _get, is) => {
      const [a, b] = ["a", "b"].map((name): Expr => ({ e: "id", name }));
      const both: Expr = { e: "bin", op: "&&", l: is, r: { e: "uis", x: b!, u, tag: m.tag } };
      const get = (x: Expr): Expr => ({ e: "uget", x, u, tag: m.tag, ty: m.ty });
      // ponytail: an Error in an `unknown` (adapters2) equals nothing, not even itself (native errors have no identity).
      const same: Expr = m.ty.k === "void" ? { e: "bool", v: true } : m.ty.k === "rt" && m.ty.name === "Error" ? { e: "bool", v: false } : { e: "bin", op: m.ty.k === "class" || m.ty.k === "array" || m.ty.k === "map" ? "===" : "==", l: get(a!), r: get(b!) };
      return [{ s: "if", c: both, then: [{ s: "return", x: same }] }];
    }, { s: "return", x: { e: "bool", v: false } }, ["a", "b"]);
  }

  /** SameValueZero (`includes`): `===`, except NaN equals NaN. */
  private eq0Fn(u: string) {
    const fn = this.eqFn(u);
    const num = this.unions.get(u)!.members.find((m) => m.ty.k === "double");
    if (!num) return fn;
    const [a, b] = ["a", "b"].map((name): Expr => ({ e: "uget", x: { e: "id", name }, u, tag: num.tag, ty: num.ty }));
    const nan = (x: Expr): Expr => ({ e: "bin", op: "!=", l: x, r: x });
    const both: Expr = { e: "bin", op: "&&", l: { e: "uis", x: { e: "id", name: "a" }, u, tag: num.tag }, r: { e: "uis", x: { e: "id", name: "b" }, u, tag: num.tag } };
    return { ...fn, body: [{ s: "if", c: both, then: [{ s: "return", x: { e: "bin", op: "||", l: { e: "bin", op: "==", l: a!, r: b! }, r: { e: "bin", op: "&&", l: nan(a!), r: nan(b!) } } }] } as Stmt, ...fn.body] };
  }

  /**
   * `xs.indexOf(v, from)` / `includes` / `lastIndexOf` on an array of a union (rest2): a loop comparing with `===`
   * (SameValueZero for includes), `from` as JavaScript reads it (negative: from the end).
   */
  private unionSearchFn(u: string, name: "indexOf" | "includes" | "lastIndexOf"): Pick<FnDecl, "params" | "ret" | "body"> {
    const ut: Ty = { k: "union", name: u };
    const id = (name: string): Expr => ({ e: "id", name });
    const int = (v: number): Expr => ({ e: "int", v: String(v) });
    const bin = (op: BinOp, l: Expr, r: Expr): Expr => ({ e: "bin", op, l, r });
    const [xs, v, from, n, i] = ["xs", "v", "from", "n", "i"].map(id) as [Expr, Expr, Expr, Expr, Expr];
    const eq = name === "includes" ? this.unionCall(`${u}__eq0`, () => this.eq0Fn(u), [{ e: "index", obj: xs, index: i }, v]) : this.unionCall(`${u}__eq`, () => this.eqFn(u), [{ e: "index", obj: xs, index: i }, v]);
    const last = name === "lastIndexOf";
    const start: Expr = last
      ? { e: "cond", c: bin("<", from, int(0)), a: bin("+", n, from), b: { e: "cond", c: bin("<", from, n), a: from, b: bin("-", n, int(1)) } }
      : { e: "cond", c: bin("<", from, int(0)), a: { e: "cond", c: bin("<", bin("+", n, from), int(0)), a: int(0), b: bin("+", n, from) }, b: from };
    const found: Expr = name === "includes" ? { e: "bool", v: true } : i;
    return {
      params: [{ name: "xs", ty: T.array(ut) }, { name: "v", ty: ut }, { name: "from", ty: T.int }],
      ret: name === "includes" ? T.bool : T.int,
      body: [
        { s: "let", name: "n", ty: T.int, init: { e: "op", op: "arr.length", args: [xs] }, mutable: false },
        { s: "let", name: "i", ty: T.int, init: start, mutable: true },
        { s: "while", c: last ? bin(">=", i, int(0)) : bin("<", i, n), body: [
          { s: "if", c: eq, then: [{ s: "return", x: found }] },
          { s: "assign", target: i, op: last ? "-=" : "+=", value: int(1) },
        ] },
        { s: "return", x: name === "includes" ? { e: "bool", v: false } : int(-1) },
      ],
    };
  }

  /** `"radius" in s`: the members that declare the property. */
  private unionIn(node: ts.BinaryExpression, ctx: Ctx): Expr | undefined {
    const type = this.typeOf(node.right);
    if (!this.isTsUnion(type)) return undefined;
    const ty = this.tyOfExpr(node.right);
    const decl = this.unionDecl(ty);
    if (!decl) return undefined;
    if (!ts.isStringLiteral(node.left)) return this.error(node.left, "`in` on a union takes a literal key natively.");
    if (ty.k === "optional") return this.error(node.right, "`in` on a union that may be null: narrow it first.");
    if (!this.isPure(node.right)) return this.impure(node.right, "`in` on a union");
    const x = this.expr(node.right, ctx);
    const tags = new Set<string>();
    for (const t of this.members(type)) {
      const prop = t.getProperty(node.left.text);
      if (!prop) continue;
      if (prop.flags & ts.SymbolFlags.Optional) return this.error(node, `\`in\` on a union where ${node.left.text} is optional: natively a field is always there.`);
      const member = this.unionMember(decl, this.ty(t, node.right));
      if (member) tags.add(member.tag);
    }
    return this.any([...tags].map((tag): Expr => ({ e: "uis", x, u: decl.name, tag })));
  }

  /** `x instanceof C` where x is a union: the members that are C (or a subclass), or a base of C holding one. */
  private unionInstanceOf(node: ts.BinaryExpression, ctx: Ctx, cls: string): Expr | undefined {
    if (!this.isTsUnion(this.typeOf(node.left))) return undefined;
    const ty = this.tyOfExpr(node.left);
    const decl = this.unionDecl(ty);
    if (!decl) return undefined;
    if (!this.isPure(node.left)) return this.impure(node.left, "instanceof on a union");
    const [read, u] = this.uncast(this.expr(node.left, ctx), decl);
    const x: Expr = ty.k === "optional" ? { e: "unwrap", x: read } : read;
    const tests = decl.members.flatMap((m): Expr[] => {
      if (m.ty.k !== "class") return [];
      const is: Expr = { e: "uis", x, u: u!.name, tag: m.tag };
      if (m.ty.name === cls || this.supertypes(m.ty.name).has(cls)) return [is];
      return this.supertypes(cls).has(m.ty.name) ? [this.both(is, { e: "instanceOf", x: { e: "uget", x, u: u!.name, tag: m.tag, ty: m.ty }, cls })] : [];
    });
    return ty.k === "optional" ? this.both(this.some(read), this.any(tests)) : this.any(tests);
  }

  /** `Array.isArray(x)`: the array members of a union (a constant for any other type). A method of a union is rejected. */
  private unionIsArray(node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const callee = node.expression;
    if (ts.isPropertyAccessExpression(callee) && this.isTsUnion(this.typeOf(callee.expression)) && this.unionDecl(this.tyOfExpr(callee.expression))) {
      return this.error(node, `Call ${callee.name.text}() after narrowing the union (each member's is another native function), or type the value as an interface its classes implement.`);
    }
    if (!ts.isPropertyAccessExpression(callee) || !ts.isIdentifier(callee.expression) || callee.expression.text !== "Array" || callee.name.text !== "isArray" || node.arguments.length !== 1) return undefined;
    const arg = node.arguments[0]!;
    const ty = this.tyOfExpr(arg);
    const decl = this.unionDecl(ty);
    const arrays = decl?.members.filter((m) => m.ty.k === "array") ?? [];
    if ((ty.k === "optional" ? 1 : 0) + arrays.length > 1 && !this.isPure(arg)) return this.impure(arg, "Array.isArray");
    const [read, u] = this.uncast(this.expr(arg, ctx), ty.k === "optional" ? undefined : decl);
    const x: Expr = ty.k === "optional" ? { e: "unwrap", x: read } : read;
    const test = decl ? this.any(arrays.map((m): Expr => ({ e: "uis", x, u: (u ?? decl).name, tag: m.tag }))) : { e: "bool" as const, v: (ty.k === "optional" ? ty.of : ty).k === "array" };
    return ty.k === "optional" ? this.both(this.some(read), test) : test;
  }

  /** A condition on a union: JavaScript's truthiness of the member it holds. */
  private unionTruthy(node: ts.Expression, type: ts.Type, x: Expr): Expr | undefined {
    if (!this.isTsUnion(type)) return undefined;
    const ty = this.tyOfExpr(node);
    const decl = this.unionDecl(ty);
    if (!decl) return undefined;
    const call = (y: Expr, u = decl) => this.unionCall(`${u.name}__truthy`, () => this.truthyFn(u.name), [y]);
    if (ty.k !== "optional") return call(...(this.uncast(x, decl) as [Expr, UnionDecl]));
    if (!this.isPure(node)) return this.impure(node, "A condition on a union that may be null");
    return this.both(this.some(x), call({ e: "unwrap", x }));
  }

  private truthyFn(u: string) {
    return this.unionHelper(u, T.bool, (m, get, is) => {
      const value: Expr =
        m.ty.k === "double" ? { e: "bin", op: "&&", l: { e: "bin", op: "!=", l: get, r: { e: "double", v: "0.0" } }, r: { e: "bin", op: "==", l: get, r: get } }
        : m.ty.k === "string" ? { e: "op", op: "str.nonEmpty", args: [get] }
        : m.ty.k === "bool" ? get
        : { e: "bool", v: m.ty.k !== "void" };
      return [{ s: "if", c: is, then: [{ s: "return", x: value }] }];
    }, { s: "unreachable" });
  }

  /** Text of a union of primitives (`${x}`, `String(x)`), as JavaScript formats it. */
  private unionStr(node: ts.Expression, type: ts.Type, x: Expr): Expr | undefined {
    if (!this.isTsUnion(type)) return undefined;
    const ty = this.tyOfExpr(node);
    const decl = this.unionDecl(ty);
    if (!decl) return undefined;
    if (!this.unionTextable(decl)) {
      return this.error(node, `Cannot turn ${this.checker.typeToString(type)} into text natively (JavaScript prints an object as [object Object] and an array by its items): narrow it first.`);
    }
    const call = (y: Expr) => this.unionCall(`${decl.name}__str`, () => this.strFn(decl.name), [y]);
    if (ty.k !== "optional") return call(x);
    if (!decl.members.some((m) => m.tag === "Null")) return this.error(node, `Cannot turn ${this.checker.typeToString(type)} into text natively: it may be null or undefined, which print differently in JavaScript but are one nil natively. Handle that first (\`x ?? ""\`).`);
    if (!this.isPure(node)) return this.impure(node, "Text of an `unknown`");
    return { e: "cond", c: this.some(x, true), a: { e: "str", v: "undefined" }, b: call({ e: "unwrap", x }) };
  }

  private strFn(u: string) {
    return this.unionHelper(u, T.string, (m, get, is) => {
      const text: Expr = m.ty.k === "void" ? { e: "str", v: "null" } : m.ty.k === "string" ? get : ["double", "bool"].includes(m.ty.k) ? { e: "toStr", x: get, from: m.ty } : this.elemText(get, m.ty)!;
      return [{ s: "if", c: is, then: [{ s: "return", x: text }] }];
    }, { s: "unreachable" });
  }

  /** `s.kind` on a union of objects that all have it: read from whichever member it holds. */
  private unionProp(node: ts.PropertyAccessExpression, objType: ts.Type, ctx: Ctx): Expr | undefined {
    if (!this.isTsUnion(objType)) return undefined;
    const ty = this.tyOfExpr(node.expression);
    const decl = this.unionDecl(ty);
    if (!decl) return undefined;
    if (ty.k === "optional") return this.error(node, "Reading a field of a union that may be null: narrow it first.");
    const name = node.name.text;
    const want = this.tyOfExpr(node);
    const fn = this.unionHelper(decl.name, want, (m, get, is) => {
      const t = this.members(this.checker.getNonNullableType(objType)).find((t) => this.unionMember(decl, this.ty(t, node)) === m);
      const prop = t?.getProperty(name);
      if (!prop || m.ty.k !== "class") return [{ s: "expr", x: this.error(node, `Read ${name} after narrowing the union: natively only a field every member (an object) has can be read before.`) }];
      const read: Expr = { e: "prop", obj: get, name };
      const have = this.tyOfSymbol(prop, node);
      return [{ s: "if", c: is, then: [{ s: "return", x: this.toUnionValue(read, have, want) ?? this.convert(read, have, want) }] }];
    }, { s: "unreachable" });
    return this.unionCall(`${decl.name}__get__${name}`, () => fn, [this.expr(node.expression, ctx)]);
  }

  // -------------------------------------------------------------------------
  // Top level
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Generators (`function*`): a state machine class each, lowered by generators.ts. A `Generator<T, R, N>` is
  // that shape's base class (`Generator__…`); `it.next()` gives its `IterResult__…` record.
  // -------------------------------------------------------------------------

  private isGenFn(node: ts.Node | undefined): node is ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration {
    return !!node && (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) && !!node.asteriskToken;
  }

  /** Where a generator is declared: what its state machine can't be. */
  private checkGenerator(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration) {
    // A generic generator function is compiled per instantiation (its own state machine each), as generic functions are.
    const generic = (n: ts.Node) => (ts.isClassLike(n) || ts.isMethodDeclaration(n)) && !!(n as ts.SignatureDeclaration).typeParameters?.length;
    if (ts.findAncestor(node, generic)) return void this.error(node, "Generator methods of generic classes, and generic generator methods, are not supported natively; write a generic generator function (`function* items<T>(xs: T[])`).");
    this.genNodes.push(node);
  }

  private isLibType(symbol: ts.Symbol | undefined, names: ReadonlySet<string>): boolean {
    return !!symbol && names.has(symbol.name) && !!symbol.declarations?.some((d) => d.getSourceFile().isDeclarationFile && /[\\/]lib\.[^\\/]*\.d\.ts$/.test(d.getSourceFile().fileName));
  }

  /** `Generator<T, R, N>` (or the iterator interfaces a generator is): its native shape. */
  private genShapeOf(type: ts.Type, node: ts.Node): GenShape | undefined {
    type = this.checker.getNonNullableType(this.bound(type));
    const isAsync = this.isLibType(type.getSymbol(), ASYNC_GEN_TYPES);
    if (!isAsync && !this.isLibType(type.getSymbol(), GEN_TYPES)) return undefined;
    const [value, ret, next] = this.checker.getTypeArguments(type as ts.TypeReference);
    const shape = value && this.genShapeFor(value, ret, next, node, isAsync);
    if (shape) shape.used = true;
    return shape;
  }

  private genShapeFor(value: ts.Type, ret: ts.Type | undefined, next: ts.Type | undefined, node: ts.Node, isAsync = false): GenShape {
    // `any` / `unknown` as TReturn or TNext (`Generator<T>`, an inferred TNext): the generator returns nothing, reads nothing.
    const none = (t: ts.Type | undefined) => !t || !!(t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never));
    const v = value.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never) ? undefined : this.ty(value, node);
    const [r, n] = [none(ret) ? undefined : this.ty(ret!, node), none(next) ? undefined : this.ty(next!, node)];
    const key = `${v ? mangle(v) : "Void"}__${r ? mangle(r) : "Void"}`;
    const base = `${isAsync ? "AsyncGenerator" : "Generator"}__${key}${n ? `__${mangle(n)}` : ""}`;
    let shape = this.genShapes.get(base);
    // An async generator's machine always "throws": its driver turns what the body throws into a rejection.
    if (!shape && isAsync) this.genShapes.set(base, (shape = { base, result: `IterResult__${key}`, value: v, ret: r, next: n, throws: true, async: true }));
    if (!shape) {
      shape = { base, result: `IterResult__${key}`, value: v, ret: r, next: n, throws: false };
      this.genShapes.set(base, shape);
      shape.throws = this.genShapeThrows(base);
      if (this.genThrowIns().has(base)) shape.throwIn = true;
    }
    return shape;
  }

  /** Some generator of this shape can throw (then all of them are `throws`: one native method). */
  private genShapeThrows(base: string): boolean {
    // An async generator's machine: its driver turns what the body throws into a rejection.
    if (this.genShapes.get(base)?.async) return true;
    if (this.genThrowIns().has(base)) return true;
    // A generic generator: the shapes its calls instantiate (all of them, from a call that is generic itself).
    return this.genNodes.some((g) => (this.isGenericGen(g) ? this.throws(g) && this.genInstanceBases(g).some((b) => b === "*" || b === base) : this.genFnShape(g)?.base === base && this.throws(g)));
  }

  /** The shapes the calls of a generic generator function make ("*": a call in a generic function, any shape). */
  private genInstanceBases(g: ts.SignatureDeclaration): string[] {
    let bases = this.genInstances.get(g);
    if (bases) return bases;
    this.genInstances.set(g, (bases = []));
    for (const sf of this.files) {
      this.forEachNode(sf, (n) => {
        if (!ts.isCallExpression(n) || this.checker.getResolvedSignature(n)?.declaration !== g) return;
        const type = this.checker.getTypeAtLocation(n);
        const generic = (t: ts.Type, depth = 0): boolean =>
          !!(t.flags & ts.TypeFlags.TypeParameter) || (depth < 6 && !!(t.flags & ts.TypeFlags.Object) && !!((t as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) && this.checker.getTypeArguments(t as ts.TypeReference).some((x) => generic(x, depth + 1)));
        if (generic(type)) return void bases!.push("*");
        const base = this.genShapeOf(type, n)?.base;
        if (base) bases!.push(base);
      });
    }
    return bases;
  }

  private isGenericGen(node: ts.Node): boolean {
    const generic = (n: ts.Node) => (ts.isClassLike(n) || ts.isFunctionLike(n)) && !!(n as ts.SignatureDeclaration).typeParameters?.length;
    return generic(node) || !!ts.findAncestor(node.parent, generic);
  }

  /**
   * The shapes `it.throw(e)` is called on, and those they delegate to (`yield*`): their generators take an error where
   * they stopped (`throw__`), so they all can throw. Computed once, the first time a shape asks.
   */
  private genThrowIns(): Set<string> {
    if (this.throwIns) return this.throwIns;
    const found = (this.throwIns = new Set<string>());
    const calls: ts.Expression[] = [];
    for (const sf of this.files) {
      this.forEachNode(sf, (n) => {
        if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === "throw" && this.isLibType(this.checker.getNonNullableType(this.checker.getTypeAtLocation(n.expression.expression)).getSymbol(), GEN_TYPES)) calls.push(n.expression.expression);
      });
    }
    for (const recv of calls) {
      const shape = this.genShapeOf(this.checker.getTypeAtLocation(recv), recv);
      if (shape) found.add(shape.base);
    }
    for (let grew = true; grew; ) {
      grew = false;
      for (const g of this.genNodes) {
        if (this.isGenericGen(g) || !found.has(this.genFnShape(g)?.base ?? "")) continue;
        this.forEachNode(g, (n) => {
          if (!ts.isYieldExpression(n) || !n.asteriskToken || !n.expression) return;
          const inner = this.iterShapeOf(this.checker.getTypeAtLocation(n.expression), n.expression);
          if (inner && !found.has(inner.base)) (found.add(inner.base), (grew = true));
        });
      }
    }
    for (const shape of this.genShapes.values()) if (found.has(shape.base)) (shape.throwIn = true), (shape.throws = true);
    return found;
  }

  private genFnShape(node: ts.SignatureDeclaration): GenShape | undefined {
    const signature = this.checker.getSignatureFromDeclaration(node);
    return signature && this.genShapeOf(signature.getReturnType(), node);
  }

  /** `IteratorResult<T, R>` (or one of its members, after a `done` test): the shape whose record it is. */
  private iterResult(type: ts.Type, node: ts.Node): { shape: GenShape; only?: "yield" | "return" } | undefined {
    type = this.bound(type);
    if (type.aliasSymbol?.name === "IteratorResult" && this.isLibType(type.aliasSymbol, ITER_RESULTS)) {
      const [value, ret] = type.aliasTypeArguments ?? [];
      return value ? { shape: this.genShapeFor(value, ret, undefined, node) } : undefined;
    }
    const parts = type.isUnion() ? type.types : [type];
    if (!parts.every((t) => this.isLibType(t.getSymbol(), ITER_RESULTS))) return undefined;
    const arg = (name: string) => {
      const t = parts.find((p) => p.getSymbol()!.name === name);
      return t && this.checker.getTypeArguments(t as ts.TypeReference)[0];
    };
    const [value, ret] = [arg("IteratorYieldResult"), arg("IteratorReturnResult")];
    if (value && (ret || parts.length === 1)) {
      const shape = ret ? this.genShapeFor(value, ret, undefined, node) : [...this.genShapes.values()].find((s) => s.value && this.sameTy(s.value, this.ty(value, node)));
      return shape && { shape, only: ret ? undefined : "yield" };
    }
    const shape = ret && [...this.genShapes.values()].find((s) => (s.ret ? this.sameTy(s.ret, this.ty(ret, node)) : !!(ret.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined))));
    return shape && { shape, only: "return" };
  }

  /** `[Symbol.iterator]` as a member name. */
  private isSymbolIterator(name: ts.Node): boolean {
    if (!ts.isComputedPropertyName(name)) return false;
    const x = name.expression;
    return ts.isPropertyAccessExpression(x) && x.name.text === "iterator" && ts.isIdentifier(x.expression) && x.expression.text === "Symbol" && this.isLibGlobal(x.expression);
  }

  /**
   * What for-of, a spread, `Array.from` and array destructuring consume: a generator, or an object of an app class whose
   * `[Symbol.iterator]()` is a generator method (or returns one): that generator's shape.
   */
  private iterShapeOf(type: ts.Type, node: ts.Node): GenShape | undefined {
    const g = this.genShapeOf(type, node);
    if (g) return g;
    const method = this.iteratorMethod(type);
    const signature = method && this.checker.getSignatureFromDeclaration(method);
    return signature && this.genShapeOf(signature.getReturnType(), node);
  }

  /** The `[Symbol.iterator]()` method of an app class (or a base) a type is. */
  private iteratorMethod(type: ts.Type): ts.MethodDeclaration | undefined {
    type = this.checker.getNonNullableType(this.bound(type));
    if (!this.isDeclaredClassType(type) || !type.getSymbol() || !this.objectClasses.has(type.getSymbol()!)) return undefined;
    for (const p of type.getProperties()) {
      const decl = p.valueDeclaration;
      if (decl && ts.isMethodDeclaration(decl) && this.isSymbolIterator(decl.name)) return decl;
    }
    return undefined;
  }

  /** The generator `node` is consumed as: itself, or an iterable object's `[Symbol.iterator]()`. */
  private genValue(node: ts.Expression, ctx: Ctx): Expr {
    const x = this.expr(node, ctx);
    return !this.genShapeOf(this.typeOf(node), node) && this.iteratorMethod(this.typeOf(node)) ? { e: "invoke", obj: x, name: ITERATOR_METHOD, args: [] } : x;
  }

  /**
   * A hand-written iterator object (rest2): `{ next() { … } }` (or `next: () => …`) where an `Iterator<T>` is
   * expected. Natively a subclass of the generator base class of its shape whose `resume__` calls the given `next`,
   * so every consumer of a generator (for-of, spread, `Array.from`, destructuring, `it.next()`) takes it as it is.
   * Without a `return` member: a for-of left early calls nothing (JavaScript finds no `return()` either).
   */
  private iterLiteral(node: ts.ObjectLiteralExpression, ctx: Ctx, shape: GenShape): Expr {
    let next: ts.MethodDeclaration | ts.ArrowFunction | ts.FunctionExpression | undefined;
    for (const p of node.properties) {
      const name = p.name && ts.isIdentifier(p.name) ? p.name.text : undefined;
      if (name === "next" && ts.isMethodDeclaration(p) && !p.asteriskToken) next = p;
      else if (name === "next" && ts.isPropertyAssignment(p) && (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))) next = p.initializer;
      else return this.error(p, "Unsupported: a member other than `next` in a hand-written iterator object (a `return` / `throw` the for-of would call); write it as a generator (`function*`) instead.");
    }
    if (!next) return this.error(node, "A hand-written iterator object needs a `next` function natively.");
    if (!ts.isArrowFunction(next) && this.findThis(next)) return this.error(next, "`this` in a hand-written iterator's `next` is not supported natively: keep the state in variables it captures.");
    if (this.throws(next) && !shape.throws) return this.error(next, "A hand-written iterator whose `next` can throw is not supported natively here: write it as a generator (`function*`).");
    shape.used = true;
    const resultTy: Ty = { k: "class", name: shape.result };
    const fnTy: Extract<Ty, { k: "fn" }> = { k: "fn", params: [], ret: resultTy, ...(shape.throws ? { throws: true } : {}) };
    return { e: "construct", cls: this.iterObjClass(shape, fnTy).name, args: [this.lambda(next, ctx, fnTy)] };
  }

  /** The class of a shape's hand-written iterators: its base, with `resume__` calling the stored `next`. */
  private iterObjClass(shape: GenShape, fnTy: Extract<Ty, { k: "fn" }>): ObjectClassDecl {
    const name = `IterObj__${shape.base}`;
    const made = this.genClasses.find((c) => c.name === name);
    if (made) return made;
    const self: Expr = { e: "id", name: "this" };
    const fld = (n: string): Expr => ({ e: "prop", obj: self, name: n });
    const throws = shape.throws ? { throws: true } : {};
    const r: Expr = { e: "id", name: "r" };
    const cls: ObjectClassDecl = {
      name,
      base: shape.base,
      protocols: [],
      abstract: false,
      open: false,
      fields: [{ name: "fn__next", ty: fnTy, readonly: true, optional: false }],
      ctor: { params: [{ name: "fn__next", ty: fnTy }], superArgs: [], body: [{ s: "assign", target: fld("fn__next"), op: "=", value: { e: "id", name: "fn__next" } }] },
      methods: [
        {
          name: "resume__", params: [], ret: T.bool, async: false, overrides: true, ...throws,
          body: [
            { s: "let", name: "r", ty: { k: "class", name: shape.result }, init: { e: "call", callee: fld("fn__next"), args: [], ...throws }, mutable: false },
            { s: "if", c: { e: "prop", obj: r, name: "done" }, then: [{ s: "assign", target: fld("state__"), op: "=", value: { e: "int", v: "1" } }, { s: "return", x: { e: "bool", v: false } }] },
            ...(shape.value ? [{ s: "assign", target: fld("value__"), op: "=", value: { e: "prop", obj: r, name: "value" } } as Stmt] : []),
            { s: "assign", target: fld("state__"), op: "=", value: { e: "int", v: "2" } },
            { s: "return", x: { e: "bool", v: true } },
          ],
        },
        // No `return()` to call: leaving a for-of early (or destructuring) does nothing more.
        { name: "close__", params: [], ret: T.void, async: false, overrides: true, ...throws, body: [] },
      ],
    };
    this.genClasses.push(cls);
    return cls;
  }

  /** `{ value: v, done: false }` / `{ value: undefined, done: true }` as an `IteratorResult` (the record of its shape). */
  private iterResultLiteral(node: ts.ObjectLiteralExpression, ctx: Ctx, shape: GenShape): Expr {
    let value: ts.Expression | undefined;
    let done: ts.Expression | undefined;
    for (const p of node.properties) {
      const init = ts.isPropertyAssignment(p) ? p.initializer : ts.isShorthandPropertyAssignment(p) ? p.name : undefined;
      const name = p.name && ts.isIdentifier(p.name) ? p.name.text : undefined;
      if (init && name === "value") value = init;
      else if (init && name === "done") done = init;
      else return this.error(p, "An iterator result is `{ value, done }` natively (no other member, no spread).");
    }
    const isDone = done?.kind === ts.SyntaxKind.TrueKeyword;
    const notDone = !done || done.kind === ts.SyntaxKind.FalseKeyword;
    if (!isDone && !notDone) return this.error(done!, "An iterator result's `done` is a literal `true` or `false` natively (write the two results apart: `i < n ? { value, done: false } : { value: undefined, done: true }`).");
    const args: [string, Expr][] = [["done", { e: "bool", v: isDone }]];
    // Done, the value is the return value (none for `Iterator<T>`: TReturn is `any`).
    const into = isDone ? shape.ret : shape.value;
    if (value && into) args.push([isDone ? "ret" : "value", this.expr(value, ctx, T.optional(into))]);
    else if (value && !this.isPure(value)) return this.error(value, "This iterator result's value isn't kept natively (its type has none here): put it in a variable first.");
    return { e: "new", cls: shape.result, args };
  }

  /** ty() of a generator or an iterator result. */
  private genTy(type: ts.Type, node: ts.Node): Ty | undefined {
    const g = this.genShapeOf(type, node);
    // Kept in a field, a method's generator (which holds its object) can close a cycle: cycles.ts sees the machine
    // classes' fields like any class's (the cycle collector frees it).
    if (g) return this.isNullable(type) ? T.optional({ k: "class", name: g.base }) : { k: "class", name: g.base };
    const r = this.isLibType(type.aliasSymbol ?? type.getSymbol() ?? (type.isUnion() ? type.types[0]!.getSymbol() : undefined), ITER_RESULTS) ? this.iterResult(type, node) : undefined;
    if (r) return { k: "class", name: r.shape.result };
    if (this.isLibType(type.aliasSymbol ?? type.getSymbol() ?? (type.isUnion() ? type.types[0]!.getSymbol() : undefined), ITER_RESULTS)) {
      return this.error(node, "This iterator result has no native type here: keep `it.next()` in a variable (typed IteratorResult<T, R>) and test its `done`."), T.void;
    }
    return undefined;
  }

  /** A generator function: the function makes the state machine object (nothing of the body runs yet). */
  private generatorFn(name: string, node: ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration, literalThis?: Ty): FnDecl {
    const shape = this.genFnShape(node);
    // Rejected where declared (checkGenerator): an async generator's AsyncGenerator.
    if (!shape) return { name, params: [], ret: T.void, async: false, body: [] };
    const ctx: Ctx = { async: false, ret: shape.ret ?? T.void, voidUnion: false, inTry: false, gen: shape };
    // An object literal's generator method: its object comes last (`this__`, as its other methods take it).
    const params = [...this.params(node, ctx), ...(literalThis ? [{ name: "this__", ty: literalThis }] : [])];
    const body = this.body(node, ctx);
    const isStatic = !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Static);
    const cls = ts.isMethodDeclaration(node) && !isStatic ? (ts.findAncestor(node.parent, ts.isClassLike) as ts.ClassLikeDeclaration | undefined) : undefined;
    const owner: Ty | undefined = cls ? { k: "class", name: this.className(this.classSymbol(cls)!) } : undefined;
    const captures = cls ? [] : this.genCaptures(node);
    const taken = new Set([...this.genClasses.map((c) => c.name), ...[...this.objectClasses.keys()].map((s) => this.className(s))]);
    let machine = `Gen__${owner?.k === "class" ? `${owner.name}__` : ""}${name}`;
    for (let i = 2; taken.has(machine); i++) machine = `Gen__${owner?.k === "class" ? `${owner.name}__` : ""}${name}__${i}`;
    this.genClasses.push(
      ...noteOrigin([genMachine({
        name: machine,
        shape,
        params: params.map((p) => ({ name: p.name, ty: p.ty })),
        captures,
        owner,
        body,
        refOf: (ty) => (this.refType(null!, ty) as Extract<Ty, { k: "class" }>).name,
        irThrows: (x) => this.irThrows(x),
        error: (message) => void this.error(node, message),
      })], node),
    );
    const args: Expr[] = [...(owner ? [{ e: "id", name: "this" } as Expr] : []), ...[...captures, ...params].map((p): Expr => ({ e: "id", name: p.name }))];
    return { name, params, ret: { k: "class", name: shape.base }, async: false, body: [{ s: "return", x: { e: "construct", cls: machine, args } }] };
  }

  /**
   * The locals of the functions around a generator that it reads: the state machine is a top-level class, so it
   * gets them when made (arrays and maps are references, so it shares them). A local reassigned later would be
   * seen changing in JavaScript: rejected.
   */
  private genCaptures(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.MethodDeclaration): Param[] {
    const out = new Map<ts.Symbol, Param>();
    const visit = (n: ts.Node): void => {
      if (ts.isIdentifier(n) && !this.isDeclarationName(n) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) {
        const symbol = this.valueSymbol(n);
        const decl = symbol?.valueDeclaration;
        if (symbol && decl && !out.has(symbol) && (ts.isVariableDeclaration(decl) || ts.isParameter(decl) || ts.isFunctionDeclaration(decl) || ts.isBindingElement(decl)) &&
          !decl.getSourceFile().isDeclarationFile && ts.findAncestor(decl.parent, ts.isFunctionLike) && !ts.findAncestor(decl, (a) => a === node)) {
          let ty = this.tyOfSymbol(symbol, decl);
          const fn = this.functionNodeOf(symbol);
          if (ty.k === "fn" && fn && this.throws(fn)) ty = { ...ty, throws: true };
          if (!(ts.isFunctionDeclaration(decl) || (ts.isVariableDeclaration(decl) && ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const)) && this.isReassignedLocal(decl)) {
            this.error(n, `The generator reads ${n.text}, which is reassigned: natively it gets the value it had when the generator was called. Pass it as a parameter.`);
          }
          out.set(symbol, { name: n.text, ty });
        }
      }
      ts.forEachChild(n, visit);
    };
    if (node.body) visit(node.body);
    return [...out.values()];
  }

  /** `yield v`, `const x = yield v`, `x = yield v`, `yield* g`: a marker statement the state machine takes apart. */
  private yieldStmt(node: ts.YieldExpression, ctx: Ctx, into?: { target: Expr; ty: Ty }): Stmt[] {
    const g = ctx.gen;
    if (!g) return [this.unsupported(node, "`yield` here")];
    const fit = (x: Expr, to: Ty): Expr => (to.k === "optional" ? x : { e: "unwrap", x });
    if (g.async) {
      if (node.asteriskToken) return [this.unsupported(node, "`yield*` in an async generator; write `for await (const v of inner) yield v;`")];
      // `yield v` in an async generator awaits v first (the machine stops twice).
      const value: Expr = { e: "await", x: this.promiseOf(node.expression, ctx, g.value), ty: node.expression && g.value ? g.value : T.void };
      const read: Expr | undefined = into && (g.next ? fit({ e: "prop", obj: { e: "id", name: GEN }, name: "sent__" }, into.ty) : { e: "nil" });
      return [yieldMarker({ value, into: into?.target, read })];
    }
    if (node.asteriskToken) {
      const src = node.expression!;
      const type = this.checker.getNonNullableType(this.typeOf(src));
      if (this.isArray(type)) {
        if (into) return [this.unsupported(node, "the value of `yield*` over an array (always undefined)")];
        const arrTy = this.tyOfExpr(src);
        if (!g.value || arrTy.k !== "array" || !this.sameTy(arrTy.of, g.value)) return [this.unsupported(src, "`yield*` of an array whose elements have another native type than what the generator yields")];
        const n = ++this.temps;
        const [arr, i] = [`ys__${n}`, `yi__${n}`];
        const at: Expr = { e: "index", obj: { e: "id", name: arr }, index: { e: "id", name: i } };
        return [
          { s: "let", name: arr, ty: arrTy, init: this.expr(src, ctx, arrTy), mutable: false },
          { s: "let", name: i, ty: T.int, init: { e: "int", v: "0" }, mutable: true },
          {
            s: "while",
            c: { e: "bin", op: "<", l: { e: "id", name: i }, r: { e: "op", op: "arr.length", args: [{ e: "id", name: arr }] } },
            body: [yieldMarker({ value: at }), { s: "assign", target: { e: "id", name: i }, op: "+=", value: { e: "int", v: "1" } }],
          },
        ];
      }
      const iterable = this.yieldIterable(src, ctx, !!into);
      if (iterable) return iterable;
      const inner = this.iterShapeOf(type, src);
      if (!inner) return [this.unsupported(src, "`yield*` of anything but an array, a string, a Map / Set (or its keys(), values(), entries()), a generator or an object with a `*[Symbol.iterator]()`")];
      if ((inner.value || g.value) && !(inner.value && g.value && this.sameTy(inner.value, g.value))) return [this.unsupported(src, "`yield*` of a generator that yields another native type than this one")];
      if (inner.next) return [this.unsupported(src, "`yield*` of a generator that reads the values `next(v)` sends")];
      const read: Expr | undefined = into && (inner.ret ? fit({ e: "prop", obj: { e: "id", name: DELEGATE }, name: "ret__" }, into.ty) : { e: "nil" });
      const sameRet = !!(inner.ret && g.ret && this.sameTy(inner.ret, g.ret));
      return [yieldMarker({ delegate: this.genValue(src, ctx), base: inner.base, into: into?.target, read, sameRet, innerThrows: inner.throws })];
    }
    const value = node.expression && g.value ? this.expr(node.expression, ctx, g.value) : undefined;
    if (node.expression && !g.value && !this.isPure(node.expression)) return [this.unsupported(node.expression, "computing a value a generator of `undefined` yields")];
    const read: Expr | undefined = into && (g.next ? fit({ e: "prop", obj: { e: "id", name: GEN }, name: "sent__" }, into.ty) : { e: "nil" });
    return [yieldMarker({ value, into: into?.target, read })];
  }

  /**
   * `yield* s` of a string (its code points), or of a Map / Set (or its keys(), values(), entries()): a `yield` per
   * value. A Map / Set is iterated live, as JavaScript does (an entry added meanwhile is seen): the same cursor loop
   * as a for-of over it (mcForOf).
   */
  private yieldIterable(src: ts.Expression, ctx: Ctx, valueUsed: boolean): Stmt[] | undefined {
    const g = ctx.gen!;
    const string = this.isString(this.checker.getNonNullableType(this.typeOf(src)));
    const listed = string ? undefined : this.mcListing(src);
    if (!string && !listed) return undefined;
    if (valueUsed) return [this.unsupported(src, "the value of `yield*` over a string, Map or Set (always undefined)")];
    const n = ++this.temps;
    const id = (name: string): Expr => ({ e: "id", name });
    if (string) {
      if (g.value?.k !== "string") return [this.unsupported(src, "`yield*` of a string in a generator that doesn't yield strings")];
      const [arr, i] = [`ys__${n}`, `yi__${n}`];
      return [
        { s: "let", name: arr, ty: T.array(T.string), init: this.codePoints(src, ctx), mutable: false },
        { s: "let", name: i, ty: T.int, init: { e: "int", v: "0" }, mutable: true },
        {
          s: "while",
          c: { e: "bin", op: "<", l: id(i), r: { e: "op", op: "arr.length", args: [id(arr)] } },
          body: [yieldMarker({ value: { e: "index", obj: id(arr), index: id(i) } }), { s: "assign", target: id(i), op: "+=", value: { e: "int", v: "1" } }],
        },
      ];
    }
    const ty = this.tyOfExpr(listed!.recv);
    if (ty.k !== "jsmap" && ty.k !== "jsset") return [this.unsupported(src, "`yield*` of this collection")];
    const [m, s] = [`ym__${n}`, `yc__${n}`];
    const key = ty.k === "jsmap" ? ty.key : ty.of;
    const at = (what: "keyAt" | "valueAt", t: Ty) => this.mcOp(id(m), what, t, id(s));
    let value: Expr | undefined;
    if (listed!.what === "keys") value = at("keyAt", key);
    else if (listed!.what === "values" && ty.k === "jsmap") value = at("valueAt", ty.of);
    else if (ty.k === "jsmap") {
      const pair = g.value;
      const fields = pair?.k === "class" ? this.shapeClasses.get(pair.name)?.fields : undefined;
      if (pair?.k === "array" && this.sameTy(ty.key, pair.of) && this.sameTy(ty.of, pair.of)) value = { e: "arr", of: pair.of, items: [at("keyAt", ty.key), at("valueAt", ty.of)] };
      else if (fields?.length === 2 && this.sameTy(fields[0]!.ty, ty.key) && this.sameTy(fields[1]!.ty, ty.of)) value = { e: "new", cls: (pair as Extract<Ty, { k: "class" }>).name, args: [["_0", at("keyAt", ty.key)], ["_1", at("valueAt", ty.of)]] };
    }
    const elem = listed!.what === "values" && ty.k === "jsmap" ? ty.of : key;
    if (!value || !g.value || (listed!.what !== "entries" && !this.sameTy(elem, g.value))) return [this.unsupported(src, "`yield*` of a Map / Set whose values have another native type than what the generator yields (a Set's entries() aren't supported)")];
    return [
      { s: "let", name: m, ty, init: this.expr(listed!.recv, ctx), mutable: false },
      { s: "let", name: s, ty: T.int, init: { e: "int", v: "-1" }, mutable: true },
      {
        s: "while",
        c: { e: "bool", v: true },
        body: [
          { s: "assign", target: id(s), op: "=", value: this.mcOp(id(m), "next", T.int, id(s)) },
          { s: "if", c: { e: "bin", op: "<", l: id(s), r: { e: "int", v: "0" } }, then: [{ s: "break" }] },
          yieldMarker({ value }),
        ],
      },
    ];
  }

  /**
   * `for await (const x of src)` in an async function or generator, as the specification runs it, with statement-level
   * awaits (asyncLower / the async generator machine take them apart):
   * - src an async generator: `r = await it.next()` each turn; leaving the body early (break, return, an error)
   *   awaits `it.return()` (an error of it is dropped when the body threw);
   * - src an array (of promises or values), JavaScript's async-from-sync iterator: each item is awaited through a
   *   derived promise (two jobs, as the specification's `then` of the item and the await of its result; the end too),
   *   and leaving early awaits the iterator's (resolved) `return()`: one job.
   */
  private forAwait(node: ts.ForOfStatement, ctx: Ctx): Stmt[] {
    if (!ctx.async && !ctx.gen?.async) return [this.unsupported(node, "`for await` outside an async function")];
    const decl = node.initializer;
    if (!ts.isVariableDeclarationList(decl)) return [this.unsupported(node, "`for await` with an existing variable; declare it in the loop (`for await (const x of …)`)")];
    const binding = decl.declarations[0]!.name;
    const mutable = !(decl.flags & ts.NodeFlags.Const);
    const n = ++this.temps;
    const id = (name: string): Expr => ({ e: "id", name });
    const set = (name: string, v: Expr): Stmt => ({ s: "assign", target: id(name), op: "=", value: v });
    const [open, e] = [`fo__${n}`, `fe__${n}`];
    const bind = (item: Expr, from: Ty): Stmt[] => {
      if (!ts.isIdentifier(binding)) return [{ s: "let", name: `fi__${n}`, ty: from, init: item, mutable: false }, ...this.bindPattern(binding, id(`fi__${n}`), ctx, mutable)];
      const symbol = this.checker.getSymbolAtLocation(binding)!;
      const ty = this.tyOfSymbol(symbol, binding);
      // An iterator result's value: there whenever `done` is false.
      if (from.k === "optional" && ty.k !== "optional") (item = { e: "unwrap", x: item }), (from = from.of);
      if (this.boxed.has(symbol)) return [{ s: "let", name: binding.text, ty: this.refType(symbol), init: this.newRef(symbol, this.convert(item, from, ty)), mutable: false }];
      return [{ s: "let", name: binding.text, ty, init: this.convert(item, from, ty), mutable }];
    };
    const awaitStmt = (p: Expr, ty: Ty, into?: string): Stmt => (into ? { s: "let", name: into, ty, init: { e: "await", x: p, ty }, mutable: false } : { s: "expr", x: { e: "await", x: p, ty } });
    const body = this.block(node.statement, { ...ctx, continueWith: undefined });
    const wrap = (setup: Stmt[], loop: Stmt[], close: Expr, closeTy: Ty): Stmt[] => {
      const st: Extract<Stmt, { s: "try" }> = {
        s: "try",
        body: [{ s: "while", c: { e: "bool", v: true }, body: loop, ...this.loopLabel(node) }],
        catchName: e,
        catchBody: [
          { s: "if", c: id(open), then: [set(open, { e: "bool", v: false }), { s: "try", body: [awaitStmt(close, closeTy)], catchBody: [] }] },
          { s: "rethrow", error: id(e) },
        ],
        finally: [{ s: "if", c: id(open), then: [set(open, { e: "bool", v: false }), awaitStmt(close, closeTy)] }],
      };
      st.lowered = this.lowerFinally(st, ctx.ret);
      return [{ s: "if", c: { e: "bool", v: true }, then: [...setup, { s: "let", name: open, ty: T.bool, init: { e: "bool", v: false }, mutable: true }, st] }];
    };
    const type = this.checker.getNonNullableType(this.typeOf(node.expression));
    const g = this.genShapeOf(type, node.expression);
    if (g?.async) {
      const it = `fit__${n}`;
      const r = `fr__${n}`;
      const resTy: Ty = { k: "class", name: g.result };
      const next: Expr = { e: "invoke", obj: id(it), name: "next__", args: g.next ? [{ e: "nil" }] : [] };
      const value: Expr = !g.value ? { e: "nil" } : { e: "prop", obj: id(r), name: "value" };
      const from = g.value ? T.optional(g.value) : T.optional(T.bool);
      return wrap(
        [{ s: "let", name: it, ty: { k: "class", name: g.base }, init: this.expr(node.expression, ctx), mutable: false }],
        [
          set(open, { e: "bool", v: false }),
          awaitStmt(next, resTy, r),
          { s: "if", c: { e: "prop", obj: id(r), name: "done" }, then: [{ s: "break" }] },
          set(open, { e: "bool", v: true }),
          ...bind(value, from),
          ...body,
        ],
        { e: "invoke", obj: id(it), name: "return__", args: g.ret ? [{ e: "nil" }] : [] },
        resTy,
      );
    }
    if (!this.isArray(type)) return [this.unsupported(node.expression, "`for await` over anything but an async generator or an array (of promises or values)")];
    const arrTy = this.tyOfExpr(node.expression) as Extract<Ty, { k: "array" }>;
    const elem = arrTy.of;
    const of = elem.k === "promise" ? elem.of : elem;
    const [arr, i, v] = [`fa__${n}`, `fx__${n}`, `fv__${n}`];
    const at: Expr = { e: "index", obj: id(arr), index: id(i) };
    const item: Expr = elem.k === "promise" ? at : { e: "op", op: "promise.resolve", args: [at], ty: { k: "promise", of } };
    const derived = (p: Expr, t: Ty): Expr => ({ e: "op", op: "promise.then", args: [p, { e: "lambda", params: [{ name: `fp__${n}`, ty: t }], ret: t, body: t.k === "void" ? [] : id(`fp__${n}`), typed: true, throws: true }], ty: { k: "promise", of: t } });
    const resolved: Expr = { e: "op", op: "promise.resolve", args: [], ty: { k: "promise", of: T.void } };
    return wrap(
      [
        { s: "let", name: arr, ty: arrTy, init: this.expr(node.expression, ctx, arrTy), mutable: false },
        { s: "let", name: i, ty: T.int, init: { e: "int", v: "0" }, mutable: true },
      ],
      [
        set(open, { e: "bool", v: false }),
        { s: "if", c: { e: "bin", op: ">=", l: id(i), r: { e: "op", op: "arr.length", args: [id(arr)] } }, then: [awaitStmt(derived(resolved, T.void), T.void), { s: "break" }] },
        { s: "let", name: `fq__${n}`, ty: { k: "promise", of }, init: item, mutable: false },
        { s: "assign", target: id(i), op: "+=", value: { e: "int", v: "1" } },
        awaitStmt(derived(id(`fq__${n}`), of), of, v),
        set(open, { e: "bool", v: true }),
        ...bind(id(v), of),
        ...body,
      ],
      resolved,
      T.void,
    );
  }

  /** An async generator function (`async function*`, `async *m()`). */
  private isAsyncGen(node: ts.Node | undefined): boolean {
    return !!node && this.isGenFn(node) && !!(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Async);
  }

  /** `node` as a promise of `ty` to await: itself if it is one, else a resolved one (JavaScript's PromiseResolve). */
  private promiseOf(node: ts.Expression | undefined, ctx: Ctx, ty: Ty | undefined): Expr {
    if (node && this.isLibPromise(this.checker.getNonNullableType(this.typeOf(node)))) return this.expr(node, ctx);
    const of = ty ?? T.void;
    return { e: "op", op: "promise.resolve", args: node && ty ? [this.expr(node, ctx, ty)] : [], ty: { k: "promise", of } };
  }

  /** A `yield` under `node` (not in a nested function, not one already taken out: `presets`). */
  private hasYieldIn(node: ts.Node): boolean {
    if (this.presets.has(node)) return false;
    // In an async generator an `await` stops the machine too (it never stops inside a nested function: see below).
    if (ts.isAwaitExpression(node) && this.isAsyncGen(ts.findAncestor(node.parent, ts.isFunctionLike))) return true;
    return ts.isYieldExpression(node) || (!ts.isFunctionLike(node) && !ts.isClassLike(node) && !!ts.forEachChild(node, (c) => this.hasYieldIn(c) || undefined));
  }

  /**
   * A statement of a generator with a `yield` inside an expression (`f(a, yield b)`, `x + (yield 1)`, a condition, a
   * template): natively a `yield` is a statement of the state machine, so the statement's parts are taken out first,
   * in JavaScript's order (`yieldSpill`), then it is lowered as usual reading them (presets). `undefined`: nothing to
   * take out (no yield, or only where `yieldStmt` takes it: `yield v;`, `x = yield v;`, `const x = yield v;`).
   */
  private yieldSpilled(node: ts.Statement, ctx: Ctx): Stmt[] | undefined {
    const y = (n: ts.Node | undefined) => !!n && this.hasYieldIn(n);
    const bare = (n: ts.Expression): ts.Expression => (ts.isParenthesizedExpression(n) ? bare(n.expression) : n);
    const simpleYield = (n: ts.Expression) => ts.isYieldExpression(bare(n)) && !y((bare(n) as ts.YieldExpression).expression);
    const before = new Set(this.presets.keys());
    const out: Stmt[] = [];
    try {
      if (ts.isReturnStatement(node) && node.expression && ctx.gen?.async) {
        // `return v` in an async generator awaits v (the machine stops there), then returns.
        if (y(node.expression)) this.yieldSpill(node.expression, ctx, out);
        const g = ctx.gen;
        return [...out, { s: "return", x: { e: "await", x: this.promiseOf(node.expression, ctx, g.ret), ty: g.ret ?? T.void } }];
      }
      if (ts.isExpressionStatement(node)) {
        const e = bare(node.expression);
        if (!y(e) || simpleYield(e)) return undefined;
        if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.EqualsToken && simpleYield(e.right) && !y(e.left)) return undefined;
        // `yield (yield a)` / `x = yield f(yield b)`: the inner ones first, the outer one stays a statement.
        if (ts.isYieldExpression(e)) this.yieldSpill(e.expression!, ctx, out);
        else if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isYieldExpression(bare(e.right)) && ts.isIdentifier(bare(e.left))) this.yieldSpill((bare(e.right) as ts.YieldExpression).expression!, ctx, out);
        else this.yieldSpill(e, ctx, out);
        // `await p;`: nothing is left of the statement.
        if (this.presets.has(e)) return out;
        return [...out, ...this.stmt(node, ctx)];
      }
      if (ts.isVariableStatement(node)) {
        if (!node.declarationList.declarations.some((d) => y(d.initializer))) return undefined;
        return node.declarationList.declarations.flatMap((d) => {
          const init = d.initializer;
          if (!init || !y(init) || (ts.isIdentifier(d.name) && simpleYield(init))) return this.varDecl(d, node.declarationList, ctx);
          const pre: Stmt[] = [];
          if (ts.isIdentifier(d.name) && ts.isYieldExpression(bare(init))) this.yieldSpill((bare(init) as ts.YieldExpression).expression!, ctx, pre);
          else this.yieldSpill(init, ctx, pre);
          return [...pre, ...this.varDecl(d, node.declarationList, ctx)];
        });
      }
      const part = ts.isReturnStatement(node) || ts.isThrowStatement(node) ? node.expression
        : ts.isIfStatement(node) || ts.isSwitchStatement(node) ? node.expression
        : ts.isForOfStatement(node) ? node.expression
        : undefined;
      if (part && y(part)) {
        this.yieldSpill(part, ctx, out);
        return [...out, ...this.stmt(node, ctx)];
      }
      if (ts.isWhileStatement(node) && y(node.expression)) {
        // `while (c)` with a `yield` in c: `while (true) { …c's parts; if (!c) break; body }` (a `continue` tests c again).
        this.yieldSpill(node.expression, ctx, out);
        const c = this.cond(node.expression, ctx);
        const body = this.block(node.statement, { ...ctx, continueWith: undefined });
        return [{ s: "while", c: { e: "bool", v: true }, body: [...out, { s: "if", c: { e: "not", x: c }, then: [{ s: "break" }] }, ...body], ...this.loopLabel(node) }];
      }
      if ((ts.isDoStatement(node) && y(node.expression)) || (ts.isForStatement(node) && (y(node.condition) || y(node.incrementor)))) {
        return [this.unsupported(node, "a `yield` in the condition of a do-while or for loop; write `while (true) { … if (!(cond)) break; }`")];
      }
      return undefined;
    } finally {
      for (const k of [...this.presets.keys()]) if (!before.has(k)) this.presets.delete(k);
    }
  }

  /**
   * Takes the `yield`s out of `node` in JavaScript's evaluation order, into `out`: each one into a temporary (what the
   * `yield` evaluates to), and whatever is evaluated before one of them into a temporary too, unless the pause can't
   * change it (`inert`: a literal, a constant, `this`, a function). `&&`, `||`, `??` and `?:` with a `yield` on their
   * right become `if`s. `expr` then reads the temporaries (presets).
   */
  private yieldSpill(node: ts.Expression, ctx: Ctx, out: Stmt[]): void {
    const g = ctx.gen!;
    // Reported once: the node then counts as taken out (no statement takes it apart again).
    const fail = (message: string) => void (this.error(node, message), this.presets.set(node, { e: "nil" }));
    const y = (n: ts.Node) => this.hasYieldIn(n);
    const temp = (n: ts.Expression, init: Expr | undefined, ty: Ty, mutable = false): string => {
      const name = `ys__${++this.temps}`;
      out.push({ s: "let", name, ty, ...(init ? { init } : {}), mutable });
      this.presets.set(n, { e: "id", name });
      this.presetTys.set(n, ty);
      return name;
    };
    const keep = (n: ts.Expression) => {
      if (this.presets.has(n) || this.inert(n) || (ts.isIdentifier(n) && this.isLibGlobal(n))) return;
      if (ts.isParenthesizedExpression(n) || ts.isNonNullExpression(n)) return keep(n.expression);
      temp(n, this.expr(n, ctx), this.tyOfExpr(n));
    };
    /** Operands in evaluation order: those before the last one holding a yield are kept, those holding one taken apart. */
    const operands = (ns: readonly ts.Expression[]) => {
      let last = -1;
      ns.forEach((n, i) => y(n) && (last = i));
      ns.forEach((n, i) => (i < last ? (y(n) ? this.yieldSpill(n, ctx, out) : keep(n)) : i === last ? this.yieldSpill(n, ctx, out) : undefined));
    };
    /** A callee `o.m` / `o[k]`: its object (and key) are evaluated first; the method is called after the arguments. */
    const callee = (c: ts.Expression): ts.Expression[] =>
      ts.isPropertyAccessExpression(c) ? [c.expression] : ts.isElementAccessExpression(c) ? [c.expression, c.argumentExpression] : [c];
    /** A branch (`a ? b : c`, `a && b`): its own statements, then its value into `name`. */
    const branch = (n: ts.Expression, name: string, ty: Ty, test?: boolean): Stmt[] => {
      const inner: Stmt[] = [];
      if (y(n)) this.yieldSpill(n, ctx, inner);
      return [...inner, { s: "assign", target: { e: "id", name }, op: "=", value: test ? this.cond(n, ctx) : this.expr(n, ctx, ty) }];
    };
    if (!y(node)) return keep(node);
    if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAssertionExpression(node) || ts.isSatisfiesExpression(node)) return this.yieldSpill(node.expression, ctx, out);
    if (ts.isAwaitExpression(node)) {
      // An async generator's `await p`: a statement of its own (`const t = await p`), which the machine stops at.
      if (y(node.expression)) this.yieldSpill(node.expression, ctx, out);
      const aw = this.awaitExpr(node, ctx);
      if (aw.e !== "await") return;
      if (aw.ty.k === "void") {
        out.push({ s: "expr", x: aw });
        this.presets.set(node, { e: "nil" });
        return;
      }
      temp(node, aw, aw.ty);
      return;
    }
    if (ts.isYieldExpression(node)) {
      if (node.expression && y(node.expression)) this.yieldSpill(node.expression, ctx, out);
      if (node.asteriskToken || !g.next) {
        out.push(...this.yieldStmt(node, ctx));
        this.presets.set(node, { e: "nil" });
        return;
      }
      const ty = this.tyOfExpr(node);
      const name = temp(node, undefined, ty, true);
      out.push(...this.yieldStmt(node, ctx, { target: { e: "id", name }, ty }));
      return;
    }
    if (ts.isConditionalExpression(node)) {
      if (y(node.condition)) this.yieldSpill(node.condition, ctx, out);
      const ty = this.tyOfExpr(node);
      const c = this.cond(node.condition, ctx);
      const name = `ys__${++this.temps}`;
      out.push({ s: "let", name, ty: T.optional(ty), mutable: true }, { s: "if", c, then: branch(node.whenTrue, name, ty), else: branch(node.whenFalse, name, ty) });
      this.presets.set(node, ty.k === "optional" ? { e: "id", name } : { e: "unwrap", x: { e: "id", name } });
      return;
    }
    if (ts.isBinaryExpression(node)) {
      const k = node.operatorToken.kind;
      if ((k === ts.SyntaxKind.AmpersandAmpersandToken || k === ts.SyntaxKind.BarBarToken) && y(node.right)) {
        if (!(this.typeOf(node).flags & ts.TypeFlags.BooleanLike)) return fail("Unsupported: a `yield` on the right of && / || whose value isn't a boolean; write an if.");
        if (y(node.left)) this.yieldSpill(node.left, ctx, out);
        const name = `ys__${++this.temps}`;
        out.push({ s: "let", name, ty: T.bool, init: this.cond(node.left, ctx), mutable: true });
        const test: Expr = k === ts.SyntaxKind.AmpersandAmpersandToken ? { e: "id", name } : { e: "not", x: { e: "id", name } };
        out.push({ s: "if", c: test, then: branch(node.right, name, T.bool, true) });
        this.presets.set(node, { e: "id", name });
        return;
      }
      if (k === ts.SyntaxKind.QuestionQuestionToken && y(node.right)) {
        if (y(node.left)) this.yieldSpill(node.left, ctx, out);
        const ty = this.tyOfExpr(node);
        const name = `ys__${++this.temps}`;
        const left = this.expr(node.left, ctx, T.optional(ty.k === "optional" ? ty.of : ty));
        out.push({ s: "let", name, ty: T.optional(ty.k === "optional" ? ty.of : ty), init: left.e === "unwrap" ? left.x : left, mutable: true });
        out.push({ s: "if", c: { e: "bin", op: "==", l: { e: "id", name }, r: { e: "nil" } }, then: branch(node.right, name, ty) });
        this.presets.set(node, ty.k === "optional" ? { e: "id", name } : { e: "unwrap", x: { e: "id", name } });
        return;
      }
      if (k === ts.SyntaxKind.EqualsToken) {
        const t = node.left;
        return operands([...(ts.isIdentifier(t) ? [] : callee(t)), node.right]);
      }
      if (this.isAssignment(k)) return fail("Unsupported: a `yield` in a compound assignment (the target is read before it); write `x = x + (yield v)`.");
      return operands([node.left, node.right]);
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      if (ts.isCallExpression(node) && node.questionDotToken) return fail("Unsupported: a `yield` in an optional call.");
      return operands([...callee(node.expression), ...(node.arguments ?? [])]);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isSpreadElement(node) || ts.isTypeOfExpression(node) || ts.isVoidExpression(node) || ts.isAwaitExpression(node)) return operands([node.expression]);
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) return operands([node.operand]);
    if (ts.isElementAccessExpression(node)) return operands([node.expression, node.argumentExpression]);
    if (ts.isArrayLiteralExpression(node)) return operands(node.elements);
    if (ts.isTemplateExpression(node)) return operands(node.templateSpans.map((s) => s.expression));
    if (ts.isObjectLiteralExpression(node) && node.properties.every((p) => ts.isPropertyAssignment(p) && !ts.isComputedPropertyName(p.name))) {
      return operands(node.properties.map((p) => (p as ts.PropertyAssignment).initializer));
    }
    fail("Unsupported: a `yield` inside this expression; take it out into `const v = yield x;` first.");
  }

  /** `for (const x of gen())`: `resume__()` until done; leaving early (break, return, throw) calls its `return()`, as JavaScript does. */
  private genForOf(node: ts.ForOfStatement, ctx: Ctx): Stmt[] | undefined {
    const type = this.typeOf(node.expression);
    const shape = this.iterShapeOf(type, node.expression);
    // In a generator, a for-of over an array is an index loop (its locals can live across a `yield`).
    const overArray = !shape && ctx.gen && this.isArray(this.checker.getNonNullableType(type));
    const decl = node.initializer;
    if ((!shape && !overArray) || !ts.isVariableDeclarationList(decl)) return undefined;
    const binding = decl.declarations[0]!.name;
    if (ts.isIdentifier(binding) && this.loopBox(binding)) return undefined;
    const n = ++this.temps;
    const it = `it__${n}`;
    const inner = { ...ctx, continueWith: undefined };
    const mutable = !(decl.flags & ts.NodeFlags.Const);
    const bind = (item: Expr): Stmt[] => {
      if (!ts.isIdentifier(binding)) return [{ s: "let", name: `item__${n}`, ty: this.ty(this.typeOf(binding), binding), init: item, mutable: false }, ...this.bindPattern(binding, { e: "id", name: `item__${n}` }, ctx, mutable)];
      const symbol = this.checker.getSymbolAtLocation(binding)!;
      const ty = this.tyOfSymbol(symbol, binding);
      if (this.boxed.has(symbol)) return [{ s: "let", name: binding.text, ty: this.refType(symbol), init: this.newRef(symbol, item), mutable: false }];
      return this.isNullLocal(symbol) ? [] : [{ s: "let", name: binding.text, ty, init: item, mutable }];
    };
    if (overArray) {
      const arrTy = this.tyOfExpr(node.expression);
      const i: Expr = { e: "id", name: `i__${n}` };
      return [{
        s: "if",
        c: { e: "bool", v: true },
        then: [
          { s: "let", name: it, ty: arrTy, init: this.expr(node.expression, ctx, arrTy), mutable: false },
          { s: "let", name: `i__${n}`, ty: T.int, init: { e: "int", v: "0" }, mutable: true },
          {
            s: "while",
            c: { e: "bin", op: "<", l: i, r: { e: "op", op: "arr.length", args: [{ e: "id", name: it }] } },
            body: [...bind({ e: "index", obj: { e: "id", name: it }, index: i }), { s: "assign", target: i, op: "+=", value: { e: "int", v: "1" } }, ...this.block(node.statement, inner)],
            ...this.loopLabel(node),
          },
        ],
      }];
    }
    const g = shape!;
    const throws = g.throws ? { throws: true } : {};
    const value: Expr = { e: "prop", obj: { e: "id", name: it }, name: "value__" };
    const elemTy = ts.isIdentifier(binding) ? this.tyOfSymbol(this.checker.getSymbolAtLocation(binding)!, binding) : this.ty(this.typeOf(binding), binding);
    const item: Expr = !g.value ? { e: "nil" } : elemTy.k === "optional" ? value : { e: "unwrap", x: value };
    const body = [...bind(item), ...this.block(node.statement, inner)];
    const loop: Stmt = { s: "while", c: { e: "invoke", obj: { e: "id", name: it }, name: "resume__", args: [], ...throws }, body, ...this.loopLabel(node) };
    const init: Stmt = { s: "let", name: it, ty: { k: "class", name: g.base }, init: this.genValue(node.expression, ctx), mutable: false };
    // In a generator, a `yield` in the body is a way out too (the consumer's `return()`).
    if (!leaves(body, this.labels.get(node)) && !this.irThrows(body) && !ctx.gen) return [{ s: "if", c: { e: "bool", v: true }, then: [init, loop] }];
    const e = `e__${n}`;
    const close: Stmt = { s: "expr", x: { e: "invoke", obj: { e: "id", name: it }, name: "close__", args: [], ...throws } };
    // A body and a generator that can't throw: only the early exits (`break`, `return`) close it (rest2: no catch that
    // rethrows, which Swift would require a throwing function for).
    const canThrow = g.throws || this.irThrows(body);
    const st: Extract<Stmt, { s: "try" }> = {
      s: "try",
      body: [loop],
      ...(canThrow ? { catchName: e } : {}),
      // Left by an error: `return()` runs, but what it throws is dropped (JavaScript's IteratorClose keeps the first
      // error). The `finally` then finds the generator done.
      catchBody: canThrow ? [
        ...(g.throws ? [{ s: "try", body: [close], catchBody: [] } satisfies Stmt] : [close]),
        { s: "rethrow", error: { e: "id", name: e } },
      ] : [],
      finally: [close],
    };
    st.lowered = this.lowerFinally(st, ctx.ret);
    return [{ s: "if", c: { e: "bool", v: true }, then: [init, st] }];
  }

  /** `it.next(v)`, `it.return(v)`, `Array.from(gen)`. */
  private genCall(node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const callee = node.expression;
    if (!ts.isPropertyAccessExpression(callee)) return undefined;
    if (ts.isIdentifier(callee.expression) && callee.expression.text === "Array" && callee.name.text === "from" && node.arguments[0]) {
      const g = this.iterShapeOf(this.typeOf(node.arguments[0]), node.arguments[0]);
      if (!g) return undefined;
      if (node.arguments.length > 1) return this.error(node, "Unsupported: Array.from(generator, mapFn); write [...gen()].map(mapFn).", node.arguments.length === 2 ? `[...${node.arguments[0]!.getText()}].map(${node.arguments[1]!.getText()})` : undefined);
      return { e: "invoke", obj: this.genValue(node.arguments[0], ctx), name: "toArray__", args: [], ...(g.throws ? { throws: true } : {}) };
    }
    const g = this.genShapeOf(this.typeOf(callee.expression), callee.expression);
    if (!g) return undefined;
    // An async generator's next / return / throw never throw: they give a promise.
    const throws = g.throws && !g.async ? { throws: true } : {};
    const obj = this.expr(callee.expression, ctx);
    const arg = node.arguments[0];
    switch (callee.name.text) {
      case "next":
        // A `yield` the generator reads gets undefined from `next()`, which its (non-optional) TNext can't hold natively:
        // only the first `next()`, which starts the generator (no `yield` receives its value), may leave it out.
        if (g.next && g.next.k !== "optional" && !arg && !this.startsGenerator(callee.expression)) {
          return this.error(node, "next() without a value, where the generator reads what next(v) sends: the `yield` would get undefined, which its type can't hold natively; pass a value (or add `| undefined` to the generator's TNext).");
        }
        return { e: "invoke", obj, name: "next__", args: g.next ? [arg ? this.expr(arg, ctx, T.optional(g.next)) : { e: "nil" }] : [], ...throws };
      case "return":
        return { e: "invoke", obj, name: "return__", args: g.ret ? [arg ? this.expr(arg, ctx, T.optional(g.ret)) : { e: "nil" }] : [], ...throws };
      case "throw": {
        // `it.throw(e)`: e thrown where the generator stopped (its catch / finally blocks see it); genThrowIns.
        if (!arg) return this.error(node, "throw() of a generator needs the error to throw.");
        const ty = this.tyOfExpr(arg);
        return { e: "invoke", obj, name: "throw__", args: [this.isErrorClass(ty) ? this.wrapError(this.expr(arg, ctx), ty) : this.expr(arg, ctx)], ...(g.async ? {} : { throws: true }) };
      }
      default:
        return this.error(node, `Unsupported: ${callee.name.text}() of a generator (next() and return() are).`);
    }
  }

  /**
   * Whether `recv.next()` is surely a generator's first `next()`: a new generator (`gen().next()`), or the first use
   * of a `const` holding one, in the block that declares it and not in a loop or function inside that block.
   */
  private startsGenerator(recv: ts.Expression): boolean {
    if (ts.isCallExpression(recv)) return true;
    if (!ts.isIdentifier(recv)) return false;
    const decl = this.valueSymbol(recv)?.valueDeclaration;
    if (!decl || !ts.isVariableDeclaration(decl) || !(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const)) return false;
    const scope = decl.parent.parent.parent;
    for (let n: ts.Node = recv.parent; n !== scope; n = n.parent) {
      if (!n || ts.isFunctionLike(n) || ts.isIterationStatement(n, false)) return false;
    }
    let first: ts.Identifier | undefined;
    const visit = (n: ts.Node): void => {
      if (first) return;
      if (ts.isIdentifier(n) && n !== decl.name && n.text === recv.text && this.valueSymbol(n) === this.valueSymbol(recv)) first = n;
      else ts.forEachChild(n, visit);
    };
    visit(scope);
    return first === recv;
  }

  /** `r.value` / `r.done` of an iterator result. */
  private iterProp(node: ts.PropertyAccessExpression, ctx: Ctx): Expr | undefined {
    const name = node.name.text;
    if (name !== "value" && name !== "done") return undefined;
    const r = this.iterResult(this.checker.getNonNullableType(this.typeOf(node.expression)), node.expression);
    if (!r) return undefined;
    const obj = this.expr(node.expression, ctx);
    const prop = (field: string): Expr => ({ e: "prop", obj, name: field });
    if (name === "done") return prop("done");
    const { value, ret } = r.shape;
    const yielded: Expr = !value ? { e: "nil" } : value.k === "optional" ? prop("value") : { e: "unwrap", x: prop("value") };
    const returned: Expr = !ret ? { e: "nil" } : ret.k === "optional" ? prop("ret") : { e: "unwrap", x: prop("ret") };
    if (r.only === "yield") return yielded;
    if (r.only === "return") return returned;
    // Not narrowed by `done`: one native type for both, or test `done` first.
    if (!ret) return value ? prop("value") : { e: "nil" };
    if (!value) return prop("ret");
    if (!this.sameTy(T.optional(value), T.optional(ret)) || !this.isPure(node.expression)) return this.error(node, "Test `done` before reading `value` (it holds a yielded value or the return value, which have different native types).");
    return { e: "cond", c: prop("done"), a: prop("ret"), b: prop("value") };
  }

  /** `r.done` of an iterator result: TypeScript types it `boolean | undefined`, it is always a boolean. */
  private isIterDone(node: ts.Expression): boolean {
    return ts.isPropertyAccessExpression(node) && node.name.text === "done" && !!this.iterResult(this.checker.getNonNullableType(this.typeOf(node.expression)), node.expression);
  }

  /** Consuming a generator (for-of, spread, destructuring, next(), yield*…) can throw when its shape can. */
  private genThrowPoint(n: ts.Node): boolean {
    const consumed = ts.isForOfStatement(n) || ts.isSpreadElement(n) ? n.expression
      : ts.isYieldExpression(n) && n.asteriskToken ? n.expression
      : ts.isVariableDeclaration(n) && ts.isArrayBindingPattern(n.name) ? n.initializer
      : ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ["next", "return", "throw"].includes(n.expression.name.text) ? n.expression.expression
      : ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === "from" && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === "Array" ? n.arguments[0]
      : undefined;
    if (!consumed) return false;
    // An iterable object (`*[Symbol.iterator]()`) is consumed through its generator (`next` / `return` aren't its own).
    const iterable = !ts.isCallExpression(n) || n.expression.getText().startsWith("Array.") ? this.iteratorMethod(this.typeOf(consumed)) : undefined;
    if (!iterable && !this.isLibType(this.checker.getNonNullableType(this.typeOf(consumed)).getSymbol(), GEN_TYPES)) return false;
    // In a generic function (every instantiation shares this answer): a generator of a type parameter may throw.
    const args = this.checker.getTypeArguments(this.checker.getNonNullableType(this.typeOf(consumed)) as ts.TypeReference);
    const unbound = (t: ts.Type, depth = 0): boolean => {
      t = this.bound(t);
      if (t.flags & ts.TypeFlags.TypeParameter) return true;
      return depth < 6 && !!(t.flags & ts.TypeFlags.Object) && !!((t as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) && this.checker.getTypeArguments(t as ts.TypeReference).some((x) => unbound(x, depth + 1));
    };
    if (!iterable && args.some((a) => unbound(a))) return true;
    const base = this.iterShapeOf(this.typeOf(consumed), consumed)?.base;
    return !!base && this.genShapeThrows(base);
  }

  /** The base classes, their result records and the state machines. */
  private genOutput(out: Program) {
    for (const shape of this.genShapes.values()) {
      if (shape.async) {
        const { cls, result, req } = asyncGenBase(shape);
        if (!out.classes.some((c) => c.name === result.name)) out.classes.push(result);
        out.classes.push(req);
        (out.objectClasses ??= []).push(cls);
        continue;
      }
      const { cls, result } = genBase(shape);
      // Shapes that differ only in TNext share their record.
      if (!out.classes.some((c) => c.name === result.name)) out.classes.push(result);
      // A shape only an `IteratorResult<T, R>` named (another TNext than the generators'): its record only.
      if (shape.used) (out.objectClasses ??= []).push(cls);
    }
    (out.objectClasses ??= []).push(...this.genClasses);
  }

  private topLevel(node: ts.Statement, out: Program) {
    if (ts.isClassDeclaration(node) && node.typeParameters?.length) return this.genericStatics(node, out);
    if ((ts.isFunctionDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node)) && node.typeParameters?.length) return;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) this.classDecl(node);
      return;
    }
    if (ts.isInterfaceDeclaration(node)) return this.classDecl(node);
    if (ts.isClassDeclaration(node)) return node.name ? this.classDef(node, out) : undefined;
    // `const X = class …`: the class X, lowered here (its statics initialize in order); X itself is no variable natively.
    if (ts.isVariableStatement(node) && node.declarationList.declarations.some((d) => d.initializer && ts.isClassExpression(d.initializer))) {
      const [decl, ...rest] = node.declarationList.declarations;
      if (rest.length || !decl || !this.isTopLevelClass(decl.initializer as ts.ClassExpression)) return void this.error(node, "Declare a class expression alone in a `const`.");
      return this.classDef(decl.initializer as ts.ClassExpression, out);
    }
    if (ts.isEnumDeclaration(node)) return;
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      out.functions.push(this.fnDecl(this.idName(node.name), node));
      return;
    }
    if (ts.isFunctionDeclaration(node) && !node.body) {
      // An overload signature: the implementation is the native function.
      if (node.name && !this.overloadImpl(node)) (out.natives ??= []).push(this.fnDecl(node.name.text, node));
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) {
          if (this.isCreateCss(decl)) continue;
          for (const stmt of this.varDecl(decl, node.declarationList, { async: false, ret: T.void, voidUnion: false, inTry: false })) {
            if (stmt.s === "let") out.globals.push(stmt);
          }
          continue;
        }
        if (this.nativeComponents.has(this.checker.getSymbolAtLocation(decl.name)!)) continue;
        if (decl.initializer && this.isFunctionNode(decl.initializer) && node.declarationList.flags & ts.NodeFlags.Const) {
          if (decl.initializer.typeParameters?.length) continue;
          out.functions.push(this.fnDecl(this.idName(decl.name), decl.initializer as ts.ArrowFunction));
        } else {
          const [stmt] = this.varDecl(decl, node.declarationList, { async: false, ret: T.void, voidUnion: false, inTry: false });
          // A module-level `var` declared more than once or in a block (rest2): this declaration assigns the global.
          if (stmt?.s === "assign") out.main.push(stmt);
          if (stmt?.s === "let" && stmt.init && decl.initializer && this.throwsOut(decl.initializer)) stmt.init = this.fatalInit(stmt.init, stmt.ty);
          if (stmt?.s === "let") {
            if (!stmt.init && stmt.ty.k !== "optional") this.error(decl, "A top-level variable needs an initial value.");
            out.globals.push(stmt);
          }
        }
      }
      return;
    }
    out.main.push(...this.stmt(node, { async: false, ret: T.void, voidUnion: false, inTry: false }));
  }

  private classDecl(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration) {
    const symbol = this.checker.getSymbolAtLocation(node.name);
    const cls = symbol && this.classes.get(symbol);
    // Filled once (startShapes fills every record before the code using them is lowered).
    if (!cls || cls.fields.length) return;
    // Every property, inherited ones (`extends`) included.
    for (const prop of this.checker.getPropertiesOfType(this.checker.getDeclaredTypeOfSymbol(symbol))) {
      const member = prop.valueDeclaration;
      if (!member || !ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) {
        this.error(member ?? node, "Only properties are supported in interfaces (they become native classes).");
        continue;
      }
      const ty = this.tyOfSymbol(prop, member);
      const readonly = !!member.modifiers?.some((m) => m.kind === ts.SyntaxKind.ReadonlyKeyword);
      cls.fields.push({ name: member.name.text, ty, readonly, optional: !!member.questionToken });
      if (!this.decodable(ty)) cls.decodable = false;
    }
  }

  private decodable(ty: Ty): boolean {
    switch (ty.k) {
      case "int":
      case "double":
      case "string":
      case "bool":
        return true;
      case "class":
        // A shape some other class flows into is a protocol: no class to decode into. An app class (not a record)
        // is made by its constructor, never from JSON.
        return !this.shapeProtocols.has(ty.name) && (this.allClasses().find((c) => c.name === ty.name)?.decodable ?? false);
      case "array":
      case "optional":
      case "map":
        return this.decodable(ty.of);
      default:
        return false;
    }
  }

  /** Why JSON can't give a `ty`: the first field on the way that holds a class, a protocol or a non-data type. */
  private undecodable(ty: Ty, at: string, seen = new Set<string>()): string | undefined {
    if (ty.k === "array" || ty.k === "optional" || ty.k === "map") return this.undecodable(ty.of, at, seen);
    if (ty.k === "num") return `${at} is ${ty.n}, and JSON may hold any number there (type it number)`;
    if (ty.k !== "class") return this.decodable(ty) ? undefined : `${at} is not data (a function, a union, …)`;
    const cls = this.allClasses().find((c) => c.name === ty.name);
    if (!cls) return `${at} is the class ${ty.name}, whose objects only its constructor makes (use an interface)`;
    if (this.shapeProtocols.has(ty.name)) return `${at} is ${ty.name}, which other object types flow into`;
    if (seen.has(ty.name)) return undefined;
    seen.add(ty.name);
    for (const f of cls.fields) {
      const why = this.undecodable(f.ty, `${ty.name}.${f.name}`, seen);
      if (why) return why;
    }
    return undefined;
  }

  /** Whether an expression's value is read (`n = xs.push(v)`), not only run (a statement, `void`, a void arrow's body). */
  private valueUsed(node: ts.Expression): boolean {
    let n: ts.Node = node;
    while (ts.isParenthesizedExpression(n.parent)) n = n.parent;
    const p = n.parent;
    if (ts.isExpressionStatement(p) || ts.isVoidExpression(p)) return false;
    if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.CommaToken && p.left === n) return false;
    if (ts.isForStatement(p) && (p.initializer === n || p.incrementor === n)) return false;
    if (ts.isArrowFunction(p) && p.body === n) {
      const sig = this.checker.getContextualType(p)?.getCallSignatures()[0] ?? this.checker.getSignatureFromDeclaration(p);
      const ret = sig?.getReturnType();
      return !ret || !(ret.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined));
    }
    return true;
  }

  private isFunctionNode(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration {
    return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node);
  }

  private fnDecl(name: string, node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration | ts.AccessorDeclaration): FnDecl {
    if (this.isGenFn(node)) return this.generatorFn(name, node);
    const isAsync = this.asyncFunctions.has(node);
    const signature = this.checker.getSignatureFromDeclaration(node)!;
    let retType = signature.getReturnType();
    if (isAsync) retType = this.checker.getAwaitedType(retType) ?? retType;
    const ret = this.sizedTy(node) ?? this.ty(retType, node, this.slotKind(node));
    const ctx: Ctx = { async: isAsync, ret, voidUnion: false, inTry: false };
    const fn: FnDecl = { name, params: this.params(node, ctx), ret, async: isAsync, body: this.body(node, ctx) };
    if (this.throws(node)) fn.throws = true;
    this.ownDefaults(fn.params, node.parameters, fn.body, true);
    noteOrigin([fn], node);
    // An async function of the app returns its promise, which its state machine settles (a native one stays `async`).
    if (isAsync && node.body) Object.assign(fn, { ret: { k: "promise", of: ret }, async: false, body: this.asyncBody(fn.body, ret, fn.params, node) });
    return fn;
  }

  private params(node: ts.SignatureDeclaration, ctx?: Ctx): Param[] {
    return node.parameters.map((param) => {
      const name = this.paramName(param);
      const symbol = ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
      const ty = symbol ? this.tyOfSymbol(symbol, param) : this.ty(this.typeOf(param), param);
      if (!param.initializer && !param.questionToken) return { name, ty };
      if (param.dotDotDotToken) return { name, ty, default: { e: "arr", of: (ty as Extract<Ty, { k: "array" }>).of, items: [] } };
      if (!ctx) return this.error(param, "Callbacks can't have default or optional parameters natively."), { name, ty };
      const value: Expr = param.initializer ? this.expr(param.initializer, ctx, ty) : { e: "nil" };
      return { name, ty, default: value };
    });
  }

  /** A parameter's native name: its own, or `arg__<i>` for a destructured one. */
  private paramName(param: ts.ParameterDeclaration): string {
    return ts.isIdentifier(param.name) ? param.name.text : `arg__${param.parent.parameters.indexOf(param)}`;
  }

  private body(node: ts.SignatureDeclaration & { body?: ts.ConciseBody }, ctx: Ctx): Stmt[] {
    const body = node.body;
    if (!body) return [];
    const stmts: Stmt[] = [];
    for (const param of node.parameters) {
      if (!ts.isIdentifier(param.name)) stmts.push(...this.bindPattern(param.name, { e: "id", name: this.paramName(param) }, ctx, false));
    }
    // Swift parameters are constants: a reassigned one is shadowed by a variable (a box, when a nested class shares it).
    for (const param of node.parameters) {
      const boxed = ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
      if (boxed && this.boxed.has(boxed)) {
        stmts.push({ s: "let", name: boxed.name, ty: this.refType(boxed), init: this.newRef(boxed, { e: "id", name: boxed.name }), mutable: false });
        continue;
      }
      if (ts.isIdentifier(param.name) && this.isReassigned(param.name, body)) {
        const symbol = this.checker.getSymbolAtLocation(param.name)!;
        stmts.push({ s: "let", name: param.name.text, ty: this.tyOfSymbol(symbol, param), init: { e: "id", name: param.name.text }, mutable: true });
      }
    }
    if (ts.isBlock(body)) {
      stmts.push(...this.hoistedLets(body), ...this.block(body, ctx));
      if (ctx.voidUnion && !(stmts.at(-1)?.s === "return")) stmts.push({ s: "return", x: { e: "nil" } });
    } else if (ctx.async && this.isLibPromise(this.typeOf(body))) {
      stmts.push({ s: "return", x: this.asyncReturn(body, ctx) });
    } else if (ctx.ret.k === "void") {
      stmts.push(...this.exprStmt(body, ctx));
    } else {
      stmts.push({ s: "return", x: this.expr(body, ctx, ctx.ret) });
    }
    return stmts;
  }

  private isReassigned(name: ts.Identifier, scope: ts.Node): boolean {
    const symbol = this.checker.getSymbolAtLocation(name);
    let found = false;
    const visit = (node: ts.Node) => {
      if (found) return;
      if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind) && ts.isIdentifier(node.left)) {
        found = this.checker.getSymbolAtLocation(node.left) === symbol;
      } else if ((ts.isBinaryExpression(node) && this.destructuring(node)) || (ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer))) {
        const pattern = ts.isForOfStatement(node) ? (node.initializer as ts.Expression) : (node as ts.BinaryExpression).left;
        found = this.patternTargets(pattern).some((t) => ts.isIdentifier(t) && this.valueSymbol(t) === symbol);
      } else if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && ts.isIdentifier(node.operand)) {
        found = this.checker.getSymbolAtLocation(node.operand) === symbol && this.isIncrement(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(scope);
    return found;
  }

  private isAssignment(kind: ts.SyntaxKind) {
    return kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
  }

  private isLogicalAssignment(kind: ts.SyntaxKind) {
    return kind === ts.SyntaxKind.QuestionQuestionEqualsToken || kind === ts.SyntaxKind.BarBarEqualsToken || kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken;
  }

  private isIncrement(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression) {
    return node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken;
  }

  // -------------------------------------------------------------------------
  // Statements
  // -------------------------------------------------------------------------

  /**
   * The object (and index) of a computed target (`xs[i++].n ||= 1`) evaluated into temporaries, which `expr` then
   * gives for those nodes (see `presets`), so reading and writing the target evaluates them once.
   */
  private presetParts(target: ts.Expression, ctx: Ctx): Stmt[] {
    while (ts.isParenthesizedExpression(target)) target = target.expression;
    const out: Stmt[] = [];
    const preset = (node: ts.Expression, want?: Ty) => {
      if (this.isPure(node) || this.isConstant(node)) return;
      const name = `lt__${++this.temps}`;
      const ty = want ?? this.tyOfExpr(node);
      out.push({ s: "let", name, ty, init: this.expr(node, ctx, want), mutable: false });
      this.presets.set(node, { e: "id", name });
    };
    if (ts.isPropertyAccessExpression(target) && target.expression.kind !== ts.SyntaxKind.SuperKeyword) preset(target.expression);
    if (ts.isElementAccessExpression(target)) {
      preset(target.expression);
      preset(target.argumentExpression, this.indexTy(target));
    }
    return out;
  }

  /** `delete o.f` as a statement, of an optional property of an object (not a static one). */
  private deletableField(node: ts.DeleteExpression): boolean {
    const target = node.expression;
    if (!ts.isPropertyAccessExpression(target) || target.questionDotToken || !ts.isExpressionStatement(node.parent)) return false;
    const symbol = this.checker.getSymbolAtLocation(target.name);
    return !!symbol && !!(symbol.flags & ts.SymbolFlags.Optional) && !(symbol.flags & ts.SymbolFlags.Method) && !this.staticField(target);
  }

  /** `xs[i]` / `m[k]` read as an optional (a missing element is undefined), for a logical assignment's test. */
  private elementRead(target: ts.Expression, ctx: Ctx): { x: Expr; ty: Ty } | undefined {
    while (ts.isParenthesizedExpression(target)) target = target.expression;
    if (!ts.isElementAccessExpression(target) || this.tupleField(target)) return undefined;
    const objType = this.checker.getNonNullableType(this.typeOf(target.expression));
    const elem = (this.ty(objType, target.expression) as { of?: Ty }).of;
    if (!elem || this.isTypedArray(objType)) return undefined;
    const isArray = this.isArray(objType);
    const op = isArray ? "arr.at" : "map.get";
    const x = this.flat({ e: "op", op, args: [this.expr(target.expression, ctx), this.expr(target.argumentExpression, ctx, isArray ? T.int : T.string)] }, elem);
    return { x, ty: elem.k === "optional" ? elem : T.optional(elem) };
  }

  /** Truthiness of a native value of type `ty` (one read): nil, 0, NaN, "" and false are falsy. */
  private irTruthy(x: Expr, ty: Ty): Expr | undefined {
    const inner = ty.k === "optional" ? ty.of : ty;
    const zero: Expr | undefined = inner.k === "int" ? { e: "int", v: "0" } : inner.k === "double" ? { e: "double", v: "0.0" } : inner.k === "string" ? { e: "str", v: "" } : inner.k === "bool" ? { e: "bool", v: false } : undefined;
    if (!zero) return inner.k === "union" ? undefined : ty.k === "optional" ? { e: "bin", op: "!=", l: x, r: { e: "nil" } } : { e: "bool", v: true };
    const v: Expr = ty.k === "optional" ? { e: "coalesce", l: x, r: zero } : x;
    switch (inner.k) {
      case "int":
        return { e: "bin", op: "!=", l: v, r: zero };
      case "double":
        return { e: "bin", op: ">", l: { e: "op", op: "math.abs", args: [v] }, r: zero };
      case "string":
        return { e: "op", op: "str.nonEmpty", args: [v] };
      default:
        return v;
    }
  }

  /** `{ label }` to spread into the IR loop of a labelled loop statement (nothing for an unlabelled one). */
  private loopLabel(node: ts.Node): { label?: string } {
    const label = this.labels.get(node);
    return label ? { label } : {};
  }

  /** A statement label's native name (apart from the compiler's own `exit__N`, `sw__N`, `loopN`). */
  private labelName(id: ts.Identifier): string {
    return `lb__${id.text}`;
  }

  /** A block's statements, with its function declarations first (they are hoisted in JavaScript). */
  private block(node: ts.Statement, ctx: Ctx): Stmt[] {
    if (!ts.isBlock(node)) return noteOrigin(this.stmt(node, ctx), node);
    const hoisted = node.statements.filter(ts.isFunctionDeclaration);
    const rest = node.statements.filter((s) => !ts.isFunctionDeclaration(s));
    return [...hoisted, ...rest].flatMap((s) => noteOrigin(this.stmt(s, ctx), s));
  }

  private stmt(node: ts.Statement, ctx: Ctx): Stmt[] {
    if (this.skipped.has(node)) return [];
    this.anchor = node;
    const spilled = ctx.gen && this.yieldSpilled(node, ctx);
    if (spilled) return spilled;
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.kind === ts.SyntaxKind.SuperKeyword) return [];
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.flatMap((d) => this.varDecl(d, node.declarationList, ctx));
    if (ts.isExpressionStatement(node)) {
      const out = this.exprStmt(node.expression, ctx);
      // A call TypeScript knows doesn't return (a `never` function): natively what follows is unreachable too.
      return ts.isCallExpression(node.expression) && this.typeOf(node.expression).flags & ts.TypeFlags.Never ? [...out, { s: "unreachable" }] : out;
    }
    if (ts.isBlock(node)) return this.block(node, ctx);
    if (ts.isIfStatement(node)) {
      return [{ s: "if", c: this.cond(node.expression, ctx), then: this.block(node.thenStatement, ctx), else: node.elseStatement && this.block(node.elseStatement, ctx) }];
    }
    if (ts.isReturnStatement(node)) {
      if (!node.expression) return [{ s: "return", x: ctx.voidUnion ? { e: "nil" } : undefined }];
      // `return ([a, b] = …)`: the assignment, then its value.
      const pattern = this.destructuring(node.expression);
      if (pattern) {
        const d = this.destructure(pattern, ctx, ctx.ret.k !== "void");
        return [...d.stmts, ctx.ret.k === "void" ? { s: "return" } : { s: "return", x: this.convert(d.value!, this.tyOfExpr(pattern.right), ctx.ret) }];
      }
      const adopted = this.asyncReturn(node.expression, ctx);
      if (adopted) return [{ s: "return", x: adopted }];
      if (ctx.ret.k === "void") return [...this.exprStmt(node.expression, ctx), { s: "return" }];
      return [{ s: "return", x: this.expr(node.expression, ctx, ctx.ret) }];
    }
    if (ts.isForInStatement(node)) return this.forIn(node, ctx);
    if (ts.isForOfStatement(node) && node.awaitModifier) return this.forAwait(node, ctx);
    if (ts.isForOfStatement(node)) {
      const entries = this.entriesLoop(node, ctx);
      if (entries) return entries;
      const decl = node.initializer;
      if (!ts.isVariableDeclarationList(decl)) return this.forOfTargets(node, decl, ctx);
      // `for (var x of xs)` (rest2): x is the function's hoisted variable, assigned each turn.
      const head = decl.declarations[0]?.name;
      if (head && ts.isIdentifier(head) && this.hoisted.has(this.checker.getSymbolAtLocation(head)!)) return this.forOfTargets(node, head, ctx);
      const indexed = this.arrayIterLoop(node, ctx);
      if (indexed) return indexed;
      const generated = this.genForOf(node, ctx);
      if (generated) return generated;
      const typedLoop = this.taForOf(node, ctx);
      if (typedLoop) return typedLoop;
      const mapSetLoop = this.mcForOf(node, ctx);
      if (mapSetLoop) return mapSetLoop;
      const binding = decl.declarations[0]!.name;
      const inner = { ...ctx, continueWith: undefined };
      // `for (const c of s)` (rest): over the string's code points, as JavaScript's string iterator.
      if (this.isString(this.typeOf(node.expression)) && ts.isIdentifier(binding)) {
        const turn = this.loopBox(binding);
        return [{ s: "forOf", name: binding.text, of: this.codePoints(node.expression, ctx), body: [...(turn ? [turn.make] : []), ...this.block(node.statement, inner)], elem: T.string, ...this.loopLabel(node) }];
      }
      if (!this.isArray(this.typeOf(node.expression))) return [this.unsupported(node.expression, "for-of over anything but an array (strings iterate characters natively)")];
      if (ts.isIdentifier(binding)) {
        const turn = this.loopBox(binding);
        const elem = ctx.async ? this.tyOfSymbol(this.checker.getSymbolAtLocation(binding)!, binding) : undefined;
        const of = this.expr(node.expression, ctx, elem && T.array(elem));
        return [{ s: "forOf", name: binding.text, of, body: [...(turn ? [turn.make] : []), ...this.block(node.statement, inner)], ...(elem ? { elem } : {}), ...this.loopLabel(node) }];
      }
      const item = `it__${++this.temps}`;
      const binds = this.bindPattern(binding, { e: "id", name: item }, ctx, !(decl.flags & ts.NodeFlags.Const));
      const elem = ctx.async ? (this.tyOfExpr(node.expression) as Extract<Ty, { k: "array" }>).of : undefined;
      return [{ s: "forOf", name: item, of: this.expr(node.expression, ctx), body: [...binds, ...this.block(node.statement, inner)], ...(elem ? { elem } : {}), ...this.loopLabel(node) }];
    }
    if (ts.isForStatement(node)) return this.forLoop(node, ctx);
    if (ts.isWhileStatement(node)) return [{ s: "while", c: this.cond(node.expression, ctx), body: this.block(node.statement, { ...ctx, continueWith: undefined }), ...this.loopLabel(node) }];
    if (ts.isDoStatement(node)) {
      // `do B while (C)` → `first = true; while (first || C) { first = false; B }`: `continue` still tests C.
      const first = `first__${++this.temps}`;
      const body = this.block(node.statement, { ...ctx, continueWith: undefined });
      const test: Expr = { e: "bin", op: "||", l: { e: "id", name: first }, r: this.cond(node.expression, ctx) };
      return [
        { s: "let", name: first, ty: T.bool, init: { e: "bool", v: true }, mutable: true },
        { s: "while", c: test, body: [{ s: "assign", target: { e: "id", name: first }, op: "=", value: { e: "bool", v: false } }, ...body], ...this.loopLabel(node) },
      ];
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      if (node.label) {
        const label = this.labelName(node.label);
        if (ts.isBreakStatement(node)) return [{ s: "break", label }];
        // `a: b: for …` / `a: { for … }`: `continue a` needs `a` on the loop itself.
        let target: ts.Node = node.parent;
        while (!(ts.isLabeledStatement(target) && target.label.text === node.label.text)) target = target.parent;
        if (!ts.isIterationStatement((target as ts.LabeledStatement).statement, false)) return [this.unsupported(node, "`continue` to a label that isn't directly on its loop; put the label on the loop")];
        return [...(ctx.labelSteps?.[label] ?? []), { s: "continue", label }];
      }
      return ts.isBreakStatement(node) ? [{ s: "break" }] : [...(ctx.continueWith ?? []), { s: "continue" }];
    }
    // `label: for …` puts the label on the loop (see loopLabel); `label: { … }` (any other statement) is a labelled block.
    if (ts.isLabeledStatement(node)) {
      const label = this.labelName(node.label);
      if (ts.isIterationStatement(node.statement, false)) {
        this.labels.set(node.statement, label);
        return this.stmt(node.statement, ctx);
      }
      return [{ s: "block", label, body: this.block(node.statement, ctx) }];
    }
    if (ts.isTryStatement(node)) {
      if (node.finallyBlock) return this.tryFinally(node, ctx);
      const inner = { ...ctx, inTry: true };
      const catchName = node.catchClause?.variableDeclaration && ts.isIdentifier(node.catchClause.variableDeclaration.name) ? node.catchClause.variableDeclaration.name.text : undefined;
      return [{ s: "try", body: this.block(node.tryBlock, inner), catchName, catchBody: node.catchClause ? this.block(node.catchClause.block, ctx) : [] }];
    }
    if (ts.isThrowStatement(node)) {
      const x = node.expression;
      if (ts.isNewExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === "Error") {
        const args = this.errorArgs(x, ctx);
        if (args.length > 1) return [{ s: "rethrow", error: this.wrapError({ e: "construct", cls: ERROR_BASE, args }, { k: "class", name: ERROR_BASE }) }];
        return [{ s: "throw", message: args[0] ?? { e: "str", v: "" } }];
      }
      // A string, number, boolean, null, undefined or `unknown` (adapters2): it rides in a native error (THROWN).
      if (this.thrownValues && this.thrownPrimitive(this.typeOf(x))) return [{ s: "rethrow", error: this.thrownExpr(x, ctx) }];
      // `throw e` of a caught error (or an `Error` kept in a variable).
      const ty = this.tyOfExpr(x);
      if (ty.k === "rt" && ty.name === "Error") return [{ s: "rethrow", error: this.expr(x, ctx) }];
      // An object of an error class (`throw new NotFound(id)`): it rides in the native error.
      if (this.isErrorClass(ty)) return [{ s: "rethrow", error: this.wrapError(this.expr(x, ctx), ty) }];
      return [this.unsupported(node, "throwing anything but an Error or a primitive (strings, numbers, booleans, null, undefined, `unknown`, Errors and objects of classes extending Error can be thrown); carry it in an error class (`class Failure extends Error { constructor(readonly value: Point) { super(\"failed\"); } }`)")];
    }
    if (ts.isSwitchStatement(node) && ctx.gen && !this.isPure(node.expression)) {
      // In a generator the subject is read in each case's test (the cases may be taken apart): once, into a local.
      const sw = this.switchStmt(node, ctx) as Extract<Stmt, { s: "switch" }>;
      const temp = `sw__${++this.temps}`;
      return [{ s: "let", name: temp, ty: this.tyOfExpr(node.expression), init: sw.x, mutable: false }, { ...sw, x: { e: "id", name: temp } }];
    }
    if (ts.isSwitchStatement(node)) return [this.switchStmt(node, ctx)];
    if (ts.isFunctionDeclaration(node) && node.name && node.body && node.typeParameters?.length) return this.localGenericFns(node);
    if (ts.isFunctionDeclaration(node) && node.name && node.body) return [{ s: "fn", decl: this.fnDecl(node.name.text, node) }];
    // A class declared in a function is declared at the top level natively (run lowers it).
    if (ts.isEmptyStatement(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node)) return [];
    return [this.unsupported(node, `the statement ${ts.SyntaxKind[node.kind]}`)];
  }

  private unsupported(node: ts.Node, what: string): Stmt {
    this.error(node, `Unsupported: ${what}.`);
    return { s: "expr", x: { e: "nil" } };
  }

  private varDecl(decl: ts.VariableDeclaration, list: ts.VariableDeclarationList, ctx: Ctx): Stmt[] {
    const mutable = !(list.flags & ts.NodeFlags.Const);
    // `const K = class …` in a function: the class is declared at the top level, K is no variable natively.
    if (decl.initializer && ts.isClassExpression(decl.initializer)) return mutable ? [this.unsupported(decl, "a class expression in a `let`; use `const`")] : [];
    if (!ts.isIdentifier(decl.name)) {
      if (!decl.initializer) return [this.unsupported(decl, "destructuring without a value")];
      // The value is read once: a temporary unless it is a variable already.
      const init = decl.initializer;
      // `const [a, b] = gen()`: its first values (then its `return()`), all of them for a rest element.
      const g = ts.isArrayBindingPattern(decl.name) ? this.iterShapeOf(this.typeOf(init), init) : undefined;
      if (g && ts.isArrayBindingPattern(decl.name)) {
        const temp = `ds__${++this.temps}`;
        const rest = decl.name.elements.some((el) => ts.isBindingElement(el) && el.dotDotDotToken);
        const n = String(decl.name.elements.length);
        const values: Expr = { e: "invoke", obj: this.genValue(init, ctx), name: rest ? "toArray__" : "take__", args: rest ? [] : [{ e: "int", v: n }], ...(g.throws ? { throws: true } : {}) };
        const ty = T.array(g.value ?? T.optional(T.bool));
        return [{ s: "let", name: temp, ty, init: values, mutable: false }, ...this.bindPattern(decl.name, { e: "id", name: temp }, ctx, mutable)];
      }
      if (ts.isIdentifier(init)) return this.bindPattern(decl.name, this.expr(init, ctx), ctx, mutable);
      const temp = `ds__${++this.temps}`;
      const ty = this.tyOfExpr(init);
      return [{ s: "let", name: temp, ty, init: this.expr(init, ctx, ty), mutable: false }, ...this.bindPattern(decl.name, { e: "id", name: temp }, ctx, mutable)];
    }
    // `const f = () => …` is a local function: it can call itself, and its numbers keep their kinds.
    if (decl.initializer && list.flags & ts.NodeFlags.Const && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
      return [{ s: "fn", decl: this.fnDecl(decl.name.text, decl.initializer) }];
    }
    const symbol = this.checker.getSymbolAtLocation(decl.name)!;
    // `const v = ([a, b] = …)`: the assignment, then v is its value (the right side).
    const pattern = decl.initializer && this.destructuring(decl.initializer);
    if (pattern && !this.isNullLocal(symbol)) {
      const d = this.destructure(pattern, ctx, true);
      const ty = this.tyOfSymbol(symbol, decl);
      const value = this.convert(d.value!, this.tyOfExpr(pattern.right), ty);
      const name = this.idName(decl.name);
      if (this.hoisted.has(symbol)) return [...d.stmts, { s: "assign", target: { e: "id", name }, op: "=", value }];
      if (this.boxed.has(symbol)) return [...d.stmts, { s: "let", name, ty: this.refType(symbol), init: this.newRef(symbol, value), mutable: false }];
      return [...d.stmts, { s: "let", name, ty, init: value, mutable }];
    }
    // `const x = yield v`: x is what `next(v)` sends.
    if (decl.initializer && ts.isYieldExpression(decl.initializer) && !this.presets.has(decl.initializer)) {
      if (this.hoisted.has(symbol) || this.boxed.has(symbol)) return [this.unsupported(decl, "a `var` or a variable a nested class shares, set by `yield`; declare it with let or const")];
      const ty = this.tyOfSymbol(symbol, decl);
      return [{ s: "let", name: decl.name.text, ty, mutable: true }, ...this.yieldStmt(decl.initializer, ctx, { target: { e: "id", name: decl.name.text }, ty })];
    }
    // Typed exactly `null` / `undefined`: no native variable, each read is nil.
    if (this.isNullLocal(symbol)) {
      const init = decl.initializer;
      return !init || this.isPure(init) || init.kind === ts.SyntaxKind.NullKeyword ? [] : [this.unsupported(init, "computing the value of a local that is always null")];
    }
    const ty = this.tyOfSymbol(symbol, decl);
    // A hoisted `var` (declared at the top of the function): its declaration assigns it.
    const name = this.idName(decl.name);
    if (this.hoisted.has(symbol)) return decl.initializer ? [{ s: "assign", target: { e: "id", name }, op: "=", value: this.expr(decl.initializer, ctx, ty) }] : [];
    if (this.boxed.has(symbol)) return [{ s: "let", name, ty: this.refType(symbol), init: this.newRef(symbol, this.expr(decl.initializer!, ctx, ty)), mutable: false }];
    return [{ s: "let", name, ty, init: decl.initializer && this.expr(decl.initializer, ctx, ty), mutable }];
  }

  /**
   * Destructuring, as the reads it stands for: `const { a, b: c = 1 } = o` is `a = o.a`, `c = o.b ?? 1`;
   * `const [x, , ...rest] = xs` is `x = xs[0]`, `rest = xs.slice(2)`. `source` is read once per name.
   */
  /**
   * `const { a, ...rest } = o`: a new object of the rest's (anonymous) type, holding the other properties of `o` (own
   * data properties: a class's methods and getters aren't, so the source must be an interface or object type).
   */
  private objectRest(rest: ts.Node, source: Expr, sourceType: ts.Type): Expr {
    const restType = this.typeOf(rest);
    if (this.isDeclaredClassType(sourceType) && sourceType.getSymbol() && this.objectClasses.has(sourceType.getSymbol()!)) return this.error(rest, "Unsupported: a rest element in object destructuring of a class's object (JavaScript leaves out its methods and getters); read the properties.");
    if (sourceType.getStringIndexType()) return this.error(rest, "Unsupported: a rest element in object destructuring of a map; copy the map and delete the keys.");
    const ty = this.ty(restType, rest);
    if (ty.k !== "class") return this.error(rest, "Unsupported: a rest element in object destructuring of this type; read the properties.");
    const args = (this.boundPickOmit(restType, rest) ?? restType.getProperties()).map((p): [string, Expr] => {
      const from = sourceType.getProperty(p.name);
      const read: Expr = { e: "prop", obj: source, name: p.name };
      const want = this.tyOfSymbol(p, rest);
      return [p.name, (from && this.castTo(read, this.tyOfSymbol(from, rest), want)) ?? read];
    });
    return { e: "new", cls: ty.name, args };
  }

  private bindPattern(pattern: ts.BindingPattern, source: Expr, ctx: Ctx, mutable: boolean): Stmt[] {
    const out: Stmt[] = [];
    // In an instantiation, a type parameter's bound type (rest2: `const { id, ...rest } = x` of an `x: T`).
    const sourceType = this.bound(this.checker.getNonNullableType(this.typeOf(pattern)));
    const isMap = !!sourceType.getStringIndexType() && sourceType.getProperties().length === 0;
    pattern.elements.forEach((el, i) => {
      if (ts.isOmittedExpression(el)) return;
      let value: Expr;
      let nullable: boolean;
      if (ts.isObjectBindingPattern(pattern) && el.dotDotDotToken) {
        value = this.objectRest(el, source, sourceType);
        nullable = false;
      } else if (ts.isObjectBindingPattern(pattern)) {
        const key = (el.propertyName ?? el.name) as ts.Identifier | ts.StringLiteral;
        if (isMap) {
          value = this.flat({ e: "op", op: "map.get", args: [source, { e: "str", v: key.text }] }, (this.ty(sourceType, pattern) as { of?: Ty }).of);
          nullable = true;
        } else {
          const prop = sourceType.getProperty(key.text);
          const propType = prop ? this.checker.getTypeOfSymbolAtLocation(prop, el) : undefined;
          value = { e: "prop", obj: source, name: key.text };
          // A number of the bound type's kind into the variable's (rest2: generic destructuring).
          if (prop && ts.isIdentifier(el.name) && this.isNumber(propType!) && !this.sized.get(this.sizedKey(prop) ?? pattern)) value = this.convert(value, this.tyOfSymbol(prop, el), this.tyOfSymbol(this.checker.getSymbolAtLocation(el.name)!, el));
          nullable = !!propType && this.isNullable(propType);
          const size = this.sized.get(this.sizedKey(prop) ?? pattern);
          if (size) value = { e: "numCast", x: value, from: { k: "num", n: size }, to: SIZED[size].int ? T.int : T.double };
          if (el.initializer && propType && this.isNullable(propType) && (propType as ts.UnionType).types.some((t) => t.flags & ts.TypeFlags.Null)) {
            this.error(el, "A default for a property that can be null: JavaScript keeps the null, natively the default would replace it. Use ?? instead.");
          }
          if (prop && el.initializer && this.isNumber(propType!) && this.slotKind(prop) === "int" && this.numKind(el.initializer) === "double") {
            this.error(el.initializer, "This default is not a whole number but the property is: give the property a Double type, or the default a whole value.");
          }
        }
      } else if (this.isMixedTuple(sourceType)) {
        // A tuple of different types: its element is a field.
        if (el.dotDotDotToken) this.error(el, "Unsupported: a rest element of a tuple of different types (the rest has no native class); read the elements.");
        value = { e: "prop", obj: source, name: `_${i}` };
        nullable = false;
      } else if (el.dotDotDotToken) {
        value = { e: "op", op: "arr.slice", args: [source, { e: "int", v: String(i) }, { e: "nil" }] };
        nullable = false;
      } else {
        // A tuple's element is there (a plain read); an array's may not be (`T | undefined`).
        nullable = this.isNullable(this.typeOf(el.name)) || !!el.initializer;
        const index: Expr = { e: "int", v: String(i) };
        value = nullable ? this.flat({ e: "op", op: "arr.at", args: [source, index] }, (this.ty(sourceType, pattern) as { of?: Ty }).of) : { e: "index", obj: source, index };
        // An element of a tuple with optional / rest elements (rest2): the member TypeScript types it as.
        const tupleElem = this.isVarTuple(sourceType) && this.checker.getIndexTypeOfType(sourceType, ts.IndexKind.Number);
        if (tupleElem) value = this.fromUnion(value, el, tupleElem, this.typeOf(el.name)) ?? value;
      }
      // The rest of a tuple with optional / rest elements (rest2): its items as the rest's element type.
      const restOf = el.dotDotDotToken && this.isVarTuple(sourceType) ? this.checker.getIndexTypeOfType(this.typeOf(el.name), ts.IndexKind.Number) : undefined;
      if (restOf && ts.isIdentifier(el.name)) {
        const from = this.checker.getIndexTypeOfType(sourceType, ts.IndexKind.Number)!;
        const p = `tr__${++this.temps}`;
        const of = this.ty(restOf, el);
        const item = this.fromUnion({ e: "id", name: p }, el, from, restOf);
        if (item) value = { e: "op", op: "arr.map", args: [value, { e: "lambda", params: [{ name: p, ty: this.ty(from, el) }], ret: of, body: item }] };
        out.push({ s: "let", name: this.idName(el.name), ty: T.array(of), init: value, mutable });
        return;
      }
      if (ts.isIdentifier(el.name)) {
        const symbol = this.checker.getSymbolAtLocation(el.name)!;
        // A rest of a tuple is a tuple TypeScript may type as `[]`: its type is the source's element type.
        const elemType = el.dotDotDotToken ? this.checker.getIndexTypeOfType(sourceType, ts.IndexKind.Number) : undefined;
        const ty = elemType ? T.array(this.ty(elemType, el)) : this.tyOfSymbol(symbol, el);
        if (el.initializer && nullable) value = { e: "coalesce", l: value, r: this.expr(el.initializer, ctx, ty) };
        // Shared with a nested class that reassigns it (or the function does): its box.
        if (this.boxed.has(symbol)) out.push({ s: "let", name: el.name.text, ty: this.refType(symbol, ty), init: this.newRef(symbol, value, ty), mutable: false });
        else out.push({ s: "let", name: this.idName(el.name), ty, init: value, mutable });
        return;
      }
      const temp = `ds__${++this.temps}`;
      const ty = this.ty(this.typeOf(el.name), el);
      if (el.initializer && nullable) value = { e: "coalesce", l: value, r: this.expr(el.initializer, ctx, ty) };
      out.push({ s: "let", name: temp, ty, init: value, mutable: false }, ...this.bindPattern(el.name, { e: "id", name: temp }, ctx, mutable));
    });
    return out;
  }

  /** `[a, b] = …` / `({ x } = …)` (in parentheses too): an assignment whose target is a pattern. */
  private destructuring(node: ts.Node): ts.BinaryExpression | undefined {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && (ts.isArrayLiteralExpression(node.left) || ts.isObjectLiteralExpression(node.left)) ? node : undefined;
  }

  /** What a pattern (of a destructuring assignment or a `for (… of …)` head) writes, in order: variables, properties, elements. */
  private patternTargets(node: ts.Expression): ts.Expression[] {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap((el) => (ts.isOmittedExpression(el) ? [] : this.patternTargets(ts.isSpreadElement(el) ? el.expression : el)));
    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.flatMap((p) => (ts.isShorthandPropertyAssignment(p) ? [p.name] : ts.isPropertyAssignment(p) ? this.patternTargets(p.initializer) : ts.isSpreadAssignment(p) ? this.patternTargets(p.expression) : []));
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) return this.patternTargets(node.left);
    return [node];
  }

  /** Whether `node` is (inside) the pattern of a destructuring assignment or of a `for (… of …)` head without a declaration. */
  private inPattern(node: ts.Node): boolean {
    for (let n = node; n.parent; n = n.parent) {
      const p = n.parent;
      if (ts.isBinaryExpression(p) && this.destructuring(p) && p.left === n) return true;
      if (ts.isForOfStatement(p) && p.initializer === n && !ts.isVariableDeclarationList(n)) return true;
      if (!(ts.isArrayLiteralExpression(p) || ts.isObjectLiteralExpression(p) || ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) || ts.isSpreadElement(p) || ts.isSpreadAssignment(p) || ts.isParenthesizedExpression(p) || (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.EqualsToken))) return false;
    }
    return false;
  }

  /**
   * `pattern = value`: the value first (an array or object literal's items into temporaries, so `[a, b] = [b, a]`
   * swaps without an array natively; a whole value only when the assignment's own value is used: `keep`), then
   * each target in order, as JavaScript assigns them. `value` is the assignment's value (the right side).
   */
  private destructure(node: ts.BinaryExpression, ctx: Ctx, keep: boolean): { stmts: Stmt[]; value?: Expr } {
    let right = node.right;
    while (ts.isParenthesizedExpression(right)) right = right.expression;
    const stmts: Stmt[] = [];
    const type = this.checker.getNonNullableType(this.typeOf(right));
    const temp = (init: Expr, ty: Ty): Expr => {
      const name = `ds__${++this.temps}`;
      stmts.push({ s: "let", name, ty, init, mutable: false });
      return { e: "id", name };
    };
    const inner = this.destructuring(right);
    let source: PatternSource;
    if (inner) {
      const d = this.destructure(inner, ctx, true);
      stmts.push(...d.stmts);
      source = { type, x: d.value!, ty: this.tyOfExpr(inner.right) };
    } else if (!keep && ts.isArrayLiteralExpression(right) && ts.isArrayLiteralExpression(node.left) && !right.elements.some(ts.isSpreadElement)) {
      const targets = node.left.elements;
      source = {
        type,
        items: right.elements.map((item, i) => {
          const target = this.leafTarget(targets[i]);
          const ty = target && !ts.isSpreadElement(targets[i]!) ? this.lvalueTy(target) : this.tyOfExpr(item);
          return { x: this.isConstant(item) ? this.expr(item, ctx, ty) : temp(this.expr(item, ctx, ty), ty), ty, node: item };
        }),
      };
    } else if (!keep && ts.isObjectLiteralExpression(right) && ts.isObjectLiteralExpression(node.left) && right.properties.every((p) => (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) || ts.isShorthandPropertyAssignment(p))) {
      const props = new Map<string, PatternItem>();
      for (const p of right.properties as ts.NodeArray<ts.PropertyAssignment | ts.ShorthandPropertyAssignment>) {
        const value = ts.isPropertyAssignment(p) ? p.initializer : p.name;
        const target = node.left.properties.find((t) => t.name && ts.isIdentifier(t.name) && t.name.text === (p.name as ts.Identifier).text);
        const leaf = target && this.leafTarget(ts.isPropertyAssignment(target) ? target.initializer : ts.isShorthandPropertyAssignment(target) ? target.name : undefined);
        const ty = leaf ? this.lvalueTy(leaf) : this.tyOfExpr(value);
        props.set((p.name as ts.Identifier).text, { x: this.isConstant(value) ? this.expr(value, ctx, ty) : temp(this.expr(value, ctx, ty), ty), ty, node: value });
      }
      source = { type, props };
    } else {
      const ty = this.tyOfExpr(right);
      source = { type, x: temp(this.expr(right, ctx, ty), ty), ty };
    }
    stmts.push(...this.assignPattern(node.left, source, ctx));
    return { stmts, value: source.x };
  }

  /** `for (x of xs)`, `for ([k, v] of pairs)`, `for ({ x } of points)`: each element is assigned to the existing targets. */
  private forOfTargets(node: ts.ForOfStatement, head: ts.Expression, ctx: Ctx): Stmt[] {
    const type = this.checker.getNonNullableType(this.typeOf(node.expression));
    if (!this.isArray(type) || this.isTypedArray(type)) return [this.unsupported(node.initializer, "a for-of with an existing variable (or pattern) over anything but an array; declare it in the loop (`for (const x of …)`)")];
    while (ts.isParenthesizedExpression(head)) head = head.expression;
    const of = this.tyOfExpr(node.expression) as Extract<Ty, { k: "array" }>;
    const item: Expr = { e: "id", name: `it__${++this.temps}` };
    const binds: Stmt[] = [];
    if (ts.isArrayLiteralExpression(head) || ts.isObjectLiteralExpression(head)) {
      const elemType = this.checker.getNonNullableType(this.checker.getIndexTypeOfType(type, ts.IndexKind.Number) ?? type);
      binds.push(...this.assignPattern(head, { type: elemType, x: item, ty: of.of }, ctx));
    } else {
      const target = this.patternLvalue(head, ctx, binds);
      const want = this.lvalueTy(head);
      if (want.k === "num") this.error(head, "Unsupported: a for-of into a sized number (natively the value could wrap); declare the loop's variable and convert it.");
      binds.push({ s: "assign", target, op: "=", value: this.convert(item, of.of, want) });
    }
    const body = [...binds, ...this.block(node.statement, { ...ctx, continueWith: undefined })];
    return [{ s: "forOf", name: (item as { name: string }).name, of: this.expr(node.expression, ctx), body, ...(ctx.async ? { elem: of.of } : {}), ...this.loopLabel(node) }];
  }

  /**
   * Number kinds of what a destructuring assignment (or a for-of head) writes: from the literal item it gets, the
   * property it reads (`fromSlot`), else a Double (an array's element).
   */
  private patternWrites(pattern: ts.Expression, source: ts.Expression | undefined, type: ts.Type | undefined): void {
    while (ts.isParenthesizedExpression(pattern)) pattern = pattern.expression;
    while (source && ts.isParenthesizedExpression(source)) source = source.expression;
    const inner = source && this.destructuring(source);
    if (inner) source = inner.right;
    type = type && this.checker.getNonNullableType(type);
    if (ts.isBinaryExpression(pattern) && pattern.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      for (const t of this.patternTargets(pattern.left)) this.patternWrite(t, { from: pattern.right });
      return this.patternWrites(pattern.left, source, type);
    }
    if (ts.isArrayLiteralExpression(pattern)) {
      const items = source && ts.isArrayLiteralExpression(source) && !source.elements.some(ts.isSpreadElement) ? source.elements : undefined;
      const tuple = type && this.checker.isTupleType(type) ? this.checker.getTypeArguments(type as ts.TypeReference) : undefined;
      const elem = type && this.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
      pattern.elements.forEach((el, i) => {
        if (ts.isOmittedExpression(el)) return;
        if (ts.isSpreadElement(el)) return this.patternWrites(el.expression, undefined, undefined);
        this.patternWrites(el, items?.[i], items?.[i] ? this.typeOf(items[i]!) : tuple?.[i] ?? elem);
      });
      return;
    }
    if (ts.isObjectLiteralExpression(pattern)) {
      const props = source && ts.isObjectLiteralExpression(source) ? source.properties : undefined;
      for (const p of pattern.properties) {
        if (!(ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) continue;
        const key = p.name.text;
        const given = props?.find((q) => q.name && (ts.isIdentifier(q.name) || ts.isStringLiteral(q.name)) && q.name.text === key);
        const value = given && ts.isPropertyAssignment(given) ? given.initializer : given && ts.isShorthandPropertyAssignment(given) ? given.name : undefined;
        const prop = type?.getProperty(key);
        const el = ts.isPropertyAssignment(p) ? p.initializer : p.name;
        if (ts.isShorthandPropertyAssignment(p) && p.objectAssignmentInitializer) this.patternWrite(p.name, { from: p.objectAssignmentInitializer });
        if (value || !prop || this.leafTarget(el) === undefined) this.patternWrites(el, value, value ? this.typeOf(value) : prop && this.checker.getTypeOfSymbol(prop));
        else this.patternWrite(this.leafTarget(el)!, { forceDouble: true });
      }
      return;
    }
    this.patternWrite(pattern, source ? { from: source } : { forceDouble: true });
  }

  private patternWrite(target: ts.Expression, how: { from?: ts.Expression; fromSlot?: ts.Symbol; forceDouble?: boolean }) {
    const symbol = ts.isIdentifier(target) ? this.valueSymbol(target) : this.checker.getSymbolAtLocation(ts.isPropertyAccessExpression(target) ? target.name : target);
    if (symbol) this.writes.push({ slot: symbol, ...how });
  }

  /** A pattern element's target when it is no pattern itself (`a` of `a = 1` too). */
  private leafTarget(el: ts.Expression | undefined): ts.Expression | undefined {
    while (el && (ts.isParenthesizedExpression(el) || ts.isSpreadElement(el))) el = el.expression;
    if (el && ts.isBinaryExpression(el) && el.operatorToken.kind === ts.SyntaxKind.EqualsToken) el = el.left;
    while (el && ts.isParenthesizedExpression(el)) el = el.expression;
    return el && !ts.isArrayLiteralExpression(el) && !ts.isObjectLiteralExpression(el) && !ts.isOmittedExpression(el) ? el : undefined;
  }

  /** A literal: evaluating it again (or never) changes nothing. */
  private isConstant(node: ts.Expression): boolean {
    return ts.isNumericLiteral(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword ||
      (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand));
  }

  /** The writes of an assignment pattern from `source`, target by target (see destructure). */
  private assignPattern(pattern: ts.Expression, source: PatternSource, ctx: Ctx): Stmt[] {
    while (ts.isParenthesizedExpression(pattern)) pattern = pattern.expression;
    const out: Stmt[] = [];
    const type = source.type;
    const each = (el: ts.Expression, read: () => { x: Expr; ty: Ty; nullable: boolean; type: ts.Type | undefined }, def?: ts.Expression) => {
      let target = el;
      let fallback = def;
      if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) [target, fallback] = [target.left, target.right];
      while (ts.isParenthesizedExpression(target)) target = target.expression;
      const nested = ts.isArrayLiteralExpression(target) || ts.isObjectLiteralExpression(target);
      // Its parts first (JavaScript evaluates the target before the value), when computing them can change something.
      const lvalue = nested ? undefined : this.patternLvalue(target, ctx, out);
      const want = nested ? undefined : this.lvalueTy(target);
      if (want?.k === "num") this.error(target, "Unsupported: destructuring into a sized number (natively the value could wrap); assign it in a statement of its own with a conversion.");
      const r = read();
      let x = r.x;
      let ty = r.ty;
      if (fallback) {
        if (!r.nullable) {
          // Never undefined: the default is never used (TypeScript allows it).
        } else {
          // In the target's type (an Int field read into a Double variable is converted first, the default isn't).
          const into = want ?? (ty.k === "optional" ? ty.of : ty);
          x = { e: "coalesce", l: this.castTo(x, ty, T.optional(into)) ?? x, r: this.expr(fallback, ctx, into) };
          ty = into;
        }
      }
      if (!nested) {
        out.push({ s: "assign", target: lvalue!, op: "=", value: want ? this.convert(x, ty, want) : x });
        return;
      }
      const name = `ds__${++this.temps}`;
      out.push({ s: "let", name, ty, init: x, mutable: false });
      const inner = r.type ?? this.typeOf(target);
      out.push(...this.assignPattern(target, { type: this.checker.getNonNullableType(inner), x: { e: "id", name }, ty }, ctx));
    };
    if (ts.isArrayLiteralExpression(pattern)) {
      const tuple = this.isMixedTuple(type);
      const elemType = tuple ? undefined : this.checker.getIndexTypeOfType(type, ts.IndexKind.Number);
      pattern.elements.forEach((el, i) => {
        if (ts.isOmittedExpression(el)) return;
        if (ts.isSpreadElement(el)) {
          if (tuple) return void this.error(el, "Unsupported: a rest element of a tuple of different types (the rest has no native class); read the elements.");
          return each(el.expression, () => {
            if (source.items) {
              const of = (this.lvalueTy(this.leafTarget(el) ?? el.expression) as { of?: Ty }).of ?? T.double;
              return { x: { e: "arr", of, items: source.items.slice(i).map((it) => this.convert(it.x, it.ty, of)) }, ty: T.array(of), nullable: false, type: undefined };
            }
            return { x: { e: "op", op: "arr.slice", args: [source.x!, { e: "int", v: String(i) }, { e: "nil" }] }, ty: source.ty!, nullable: false, type };
          });
        }
        each(el, () => {
          if (source.items) {
            const it = source.items[i];
            if (!it) return { x: { e: "nil" }, ty: T.optional(this.lvalueTy(this.leafTarget(el) ?? el)), nullable: true, type: undefined };
            return { ...it, nullable: this.isNullable(this.typeOf(it.node)), type: this.typeOf(it.node) };
          }
          if (tuple) {
            const t = this.checker.getTypeArguments(type as ts.TypeReference)[i]!;
            return { x: { e: "prop", obj: source.x!, name: `_${i}` }, ty: this.ty(t, el), nullable: this.isNullable(t), type: t };
          }
          const of = (source.ty as { of?: Ty }).of ?? T.double;
          // A tuple's element is there; an array's may not be (`T | undefined`).
          const there = this.checker.isTupleType(type) && i < this.checker.getTypeArguments(type as ts.TypeReference).length && !this.isNullable(elemType!);
          const index: Expr = { e: "int", v: String(i) };
          return there
            ? { x: { e: "index", obj: source.x!, index }, ty: of, nullable: false, type: elemType }
            : { x: this.flat({ e: "op", op: "arr.at", args: [source.x!, index] }, of), ty: T.optional(of.k === "optional" ? of.of : of), nullable: true, type: elemType };
        });
      });
      return out;
    }
    if (!ts.isObjectLiteralExpression(pattern)) return [this.unsupported(pattern, "this destructuring target")];
    const isMap = !!type.getStringIndexType() && type.getProperties().length === 0;
    for (const p of pattern.properties) {
      if (ts.isSpreadAssignment(p)) {
        out.push(this.unsupported(p, "a rest element in object destructuring assignment (the variable's declared type may not be the rest's); declare it where it is destructured: `const { x, ...rest } = o`"));
        continue;
      }
      if (!ts.isShorthandPropertyAssignment(p) && !ts.isPropertyAssignment(p)) {
        out.push(this.unsupported(p, "this destructuring target"));
        continue;
      }
      const key = p.name;
      if (!ts.isIdentifier(key) && !ts.isStringLiteral(key)) {
        out.push(this.unsupported(key, "a computed key in a destructuring pattern"));
        continue;
      }
      const el = ts.isPropertyAssignment(p) ? p.initializer : p.name;
      each(el, () => {
        const given = source.props?.get(key.text);
        if (source.props) {
          if (!given) return { x: { e: "nil" }, ty: T.optional(T.double), nullable: true, type: undefined };
          return { ...given, nullable: this.isNullable(this.typeOf(given.node)), type: this.typeOf(given.node) };
        }
        if (isMap) {
          const of = (source.ty as { of?: Ty }).of ?? T.double;
          return { x: this.flat({ e: "op", op: "map.get", args: [source.x!, { e: "str", v: key.text }] }, of), ty: T.optional(of.k === "optional" ? of.of : of), nullable: true, type: type.getStringIndexType() };
        }
        const prop = type.getProperty(key.text);
        const propType = prop ? this.checker.getTypeOfSymbolAtLocation(prop, p) : undefined;
        const nullable = !!propType && this.isNullable(propType);
        const hasDefault = ts.isShorthandPropertyAssignment(p) ? !!p.objectAssignmentInitializer : ts.isBinaryExpression(el) && el.operatorToken.kind === ts.SyntaxKind.EqualsToken;
        if (hasDefault && nullable && (propType as ts.UnionType).types.some((t) => t.flags & ts.TypeFlags.Null)) {
          this.error(p, "A default for a property that can be null: JavaScript keeps the null, natively the default would replace it. Use ?? instead.");
        }
        let x: Expr = { e: "prop", obj: source.x!, name: key.text };
        // The native field's type (an object literal's anonymous class keeps its numbers as Doubles).
        const field = source.ty?.k === "class" ? this.allClasses().find((c) => c.name === (source.ty as { name: string }).name)?.fields.find((f) => f.name === key.text) : undefined;
        let ty = field ? (field.optional && field.ty.k !== "optional" ? T.optional(field.ty) : field.ty) : prop ? this.tyOfSymbol(prop, p) : T.double;
        const size = this.sized.get(this.sizedKey(prop) ?? pattern);
        if (size) [x, ty] = [{ e: "numCast", x, from: { k: "num", n: size }, to: SIZED[size].int ? T.int : T.double }, SIZED[size].int ? T.int : T.double];
        return { x, ty, nullable, type: propType };
      }, ts.isShorthandPropertyAssignment(p) ? p.objectAssignmentInitializer : undefined);
    }
    return out;
  }

  /**
   * A pattern's target as an lvalue. A property or element whose object or index takes computing (`xs[i++]`) has
   * them evaluated into temporaries now, before the value (as JavaScript does).
   */
  private patternLvalue(target: ts.Expression, ctx: Ctx, out: Stmt[]): Expr {
    const temp = (x: Expr, ty: Ty): Expr => {
      const name = `ds__${++this.temps}`;
      out.push({ s: "let", name, ty, init: x, mutable: false });
      return { e: "id", name };
    };
    if (ts.isPropertyAccessExpression(target) && !this.isPure(target.expression) && target.expression.kind !== ts.SyntaxKind.SuperKeyword && !this.staticField(target)) {
      const obj = temp(this.expr(target.expression, ctx), this.tyOfExpr(target.expression));
      return { e: "prop", obj, name: this.memberName(target.name), ...(this.accessorThrows(target) ? { throws: true } : {}) };
    }
    if (ts.isElementAccessExpression(target) && !this.tupleField(target) && !this.isTypedArray(this.typeOf(target.expression)) && !(this.isPure(target.expression) && (this.isPure(target.argumentExpression) || this.isConstant(target.argumentExpression)))) {
      const obj = this.isPure(target.expression) ? this.expr(target.expression, ctx) : temp(this.expr(target.expression, ctx), this.tyOfExpr(target.expression));
      const index = temp(this.expr(target.argumentExpression, ctx, this.indexTy(target)), this.indexTy(target));
      return { e: "index", obj, index };
    }
    return this.lvalue(target, ctx);
  }

  /**
   * `try {} catch {} finally {}`, `try {} finally {}`: the finally block runs on every way out, as in
   * JavaScript. Kotlin has `finally`; Swift and Rust print `lowered` (see lowerFinally). Without a catch
   * clause the error is caught and thrown again. A `continue` leaving the blocks in a `for` loop that
   * became a `while` would run the loop's step before the finally block: rejected.
   */
  private tryFinally(node: ts.TryStatement, ctx: Ctx): Stmt[] {
    if (ctx.continueWith?.length || ctx.labelSteps) {
      let found: ts.Node | undefined;
      const visit = (n: ts.Node, inLoop = false): void => {
        if (found || ts.isFunctionLike(n) || ts.isClassLike(n)) return;
        // A `continue label` to such a loop around the try too.
        if (ts.isContinueStatement(n) && (n.label ? !!ctx.labelSteps?.[this.labelName(n.label)]?.length : !inLoop && !!ctx.continueWith?.length)) found = n;
        else ts.forEachChild(n, (c) => visit(c, inLoop || ts.isIterationStatement(n, false)));
      };
      visit(node.tryBlock);
      if (node.catchClause) visit(node.catchClause.block);
      if (found) return [this.unsupported(found, "`continue` out of a try block with `finally` in this `for` loop (natively its step would run before the finally block); use a range loop (`for (let i = a; i < b; i++)`) or a while loop")];
    }
    const inner = { ...ctx, inTry: true };
    const named = node.catchClause?.variableDeclaration && ts.isIdentifier(node.catchClause.variableDeclaration.name) ? node.catchClause.variableDeclaration.name.text : undefined;
    const catchName = node.catchClause ? named : `e__${++this.temps}`;
    const catchBody: Stmt[] = node.catchClause ? this.block(node.catchClause.block, ctx) : [{ s: "rethrow", error: { e: "id", name: catchName! } }];
    const st: Extract<Stmt, { s: "try" }> = { s: "try", body: this.block(node.tryBlock, inner), catchName, catchBody, finally: this.block(node.finallyBlock!, ctx) };
    st.lowered = this.lowerFinally(st, ctx.ret);
    return [st];
  }

  /**
   * `for (let i = a; i < b; i++)` with a bound the body can't change → a range loop. Any other
   * `for` → `init; while (cond) { body; step }`, where a `continue` runs the step first.
   */
  private forLoop(node: ts.ForStatement, ctx: Ctx): Stmt[] {
    const range = this.forRange(node, ctx);
    if (range) return range;
    const init = node.initializer;
    // JavaScript gives each iteration its own `let i`; a `while` has one. A closure would tell them apart. (A `var` is one for all.)
    if (init && ts.isVariableDeclarationList(init) && init.flags & ts.NodeFlags.BlockScoped) {
      const symbols = new Set(init.declarations.flatMap((d) => this.bindingNames(d.name).map((id) => this.checker.getSymbolAtLocation(id))));
      let captured: ts.Node | undefined;
      const visit = (n: ts.Node, inClosure: boolean): void => {
        if (captured) return;
        // A nested class copies the variable when an object is made (its `new` is checked instead).
        if (ts.isClassLike(n)) return;
        if (inClosure && ts.isIdentifier(n) && symbols.has(this.checker.getSymbolAtLocation(n))) captured = n;
        // A closure that makes such an object reads the variable then: it captures it too.
        const made = inClosure && ts.isNewExpression(n) ? this.classRef(n.expression) : undefined;
        if (made && this.captures.get(made)?.some((value) => symbols.has(value))) captured = n;
        ts.forEachChild(n, (c) => visit(c, inClosure || this.isFunctionNode(n) || ts.isFunctionDeclaration(n)));
      };
      visit(node.statement, false);
      if (captured) return [this.unsupported(captured, "a closure capturing the variable of this `for` loop (each iteration has its own in JavaScript); copy it to a const in the body")];
    }
    const first: Stmt[] = !init ? [] : ts.isVariableDeclarationList(init) ? init.declarations.flatMap((d) => this.varDecl(d, init, ctx)) : this.exprStmt(init, ctx);
    const step = node.incrementor ? this.exprStmt(node.incrementor, ctx) : [];
    // Turn boxes: made first in the body, written back before the step (at its end and before a `continue`).
    const turns = init && ts.isVariableDeclarationList(init) ? init.declarations.flatMap((d) => this.bindingNames(d.name).map((id) => this.loopBox(id)).filter((t) => !!t)) : [];
    const back = turns.map((t) => t!.back);
    const label = this.labels.get(node);
    const labelSteps = label ? { ...ctx.labelSteps, [label]: [...back, ...step] } : ctx.labelSteps;
    const body = this.block(node.statement, { ...ctx, continueWith: [...back, ...step], labelSteps });
    const loop: Stmt = { s: "while", c: node.condition ? this.cond(node.condition, ctx) : { e: "bool", v: true }, body: [...turns.map((t) => t!.make), ...body, ...back, ...step], ...this.loopLabel(node) };
    // The loop's variables are its own: `if (true) { … }` scopes them (two loops may both declare `i`).
    return [{ s: "if", c: { e: "bool", v: true }, then: [...first, loop] }];
  }

  /**
   * Whether the body of a loop leaves `bound` as it is: literals, variables the body doesn't assign
   * (nor, for globals, a function it calls), the length of an array it doesn't change, and
   * arithmetic and Math calls of those. JavaScript reads the bound on every turn; a range reads it once.
   */
  private stableBound(bound: ts.Expression, body: ts.Statement): boolean {
    let callsApp = false;
    const findCalls = (n: ts.Node): void => {
      if (callsApp) return;
      if (ts.isCallExpression(n)) {
        const callee = this.checker.getResolvedSignature(n)?.getDeclaration();
        callsApp = !!callee && !this.isApi(callee) && !callee.getSourceFile().isDeclarationFile;
      }
      ts.forEachChild(n, findCalls);
    };
    findCalls(body);
    const isLocal = (symbol: ts.Symbol | undefined) => {
      const decl = symbol?.valueDeclaration;
      return !!decl && (ts.isParameter(decl) || (ts.isVariableDeclaration(decl) && !ts.isSourceFile(this.topLevelOf(decl))));
    };
    const stable = (x: ts.Expression): boolean => {
      if (ts.isNumericLiteral(x)) return true;
      if (ts.isParenthesizedExpression(x)) return stable(x.expression);
      if (ts.isIdentifier(x)) {
        const symbol = this.checker.getSymbolAtLocation(x);
        const decl = symbol?.valueDeclaration;
        if (decl && ts.isVariableDeclaration(decl) && ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const) return true;
        return !this.isReassigned(x, body) && (isLocal(symbol) || !callsApp);
      }
      if (ts.isBinaryExpression(x) && [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.SlashToken, ts.SyntaxKind.PercentToken].includes(x.operatorToken.kind)) {
        return stable(x.left) && stable(x.right);
      }
      if (ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && ts.isIdentifier(x.expression.expression) && x.expression.expression.text === "Math") {
        return x.expression.name.text !== "random" && x.arguments.every(stable);
      }
      if (ts.isPropertyAccessExpression(x) && x.name.text === "length" && this.isPure(x.expression)) {
        // The array changes if the body mutates or reassigns it, or calls a function that could reach it (a global or a property).
        const array = this.storageSymbol(x.expression);
        if (!array || (!isLocal(array) && callsApp)) return false;
        let changes = false;
        const visit = (n: ts.Node): void => {
          if (changes) return;
          if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"].includes(n.expression.name.text)) {
            changes = this.storageSymbol(n.expression.expression) === array;
          } else if (ts.isBinaryExpression(n) && this.isAssignment(n.operatorToken.kind)) changes = this.storageSymbol(n.left) === array;
          ts.forEachChild(n, visit);
        };
        visit(body);
        return !changes;
      }
      return false;
    };
    return stable(bound);
  }

  /** `for (let i = a; i < b; i++)` → a range loop, when nothing in the body changes `i` or `b`. */
  private forRange(node: ts.ForStatement, ctx: Ctx): Stmt[] | undefined {
    const init = node.initializer;
    // A `var` is the function's: it outlives the loop, which a range's own variable wouldn't.
    // One variable only: `for (let i = 1, k = 0; …)` keeps its other variables in the general loop.
    const decl = init && ts.isVariableDeclarationList(init) && init.flags & ts.NodeFlags.BlockScoped && init.declarations.length === 1 ? init.declarations[0] : undefined;
    const cond = node.condition;
    const inc = node.incrementor;
    if (
      decl && ts.isIdentifier(decl.name) && decl.initializer && cond && ts.isBinaryExpression(cond) &&
      ts.isIdentifier(cond.left) && cond.left.text === decl.name.text &&
      (cond.operatorToken.kind === ts.SyntaxKind.LessThanToken || cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken) &&
      inc && (ts.isPostfixUnaryExpression(inc) || ts.isPrefixUnaryExpression(inc)) && inc.operator === ts.SyntaxKind.PlusPlusToken &&
      ts.isIdentifier(inc.operand) && inc.operand.text === decl.name.text && !this.isReassigned(decl.name, node.statement) && !this.isBigInt(this.typeOf(decl.name)) &&
      this.stableBound(cond.right, node.statement) &&
      // A Double start or bound (`i = 0.5`, `i < n / 2`) isn't an Int range: JavaScript counts 0.5, 1.5, …
      this.numKind(decl.initializer) === "int" && this.numKind(cond.right) === "int"
    ) {
      return [{
        s: "forRange",
        name: decl.name.text,
        from: this.expr(decl.initializer, ctx, T.int),
        to: this.expr(cond.right, ctx, T.int),
        inclusive: cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken,
        body: this.block(node.statement, { ...ctx, continueWith: undefined }),
        ...this.loopLabel(node),
      }];
    }
    return undefined;
  }


  private switchStmt(node: ts.SwitchStatement, ctx: Ctx): Stmt {
    const subject = this.tyOfExpr(node.expression);
    // A union subject (rest2): the index of the first case `===` to it (cases evaluated in order until one matches), switched on.
    const onUnion = this.unionDecl(subject) ? { name: `sw__${++this.temps}`, tests: [] as Expr[] } : undefined;
    const cases: { values: Expr[]; body: Stmt[] }[] = [];
    let defaultBody: Stmt[] | undefined;
    let pending: Expr[] = [];
    for (const clause of node.caseBlock.clauses) {
      const stmts = clause.statements.flatMap((s) => this.stmt(s, ctx));
      const last = stmts.at(-1);
      if (stmts.length && last?.s === "break" && !last.label) stmts.pop();
      else if (stmts.length && last?.s !== "return" && last?.s !== "throw" && last?.s !== "break" && last?.s !== "continue" && clause !== node.caseBlock.clauses.at(-1)) this.error(clause, "Unsupported: fallthrough between switch cases; end each case with break or return.");
      if (ts.isDefaultClause(clause)) {
        defaultBody = stmts;
        continue;
      }
      if (onUnion) {
        const nil = this.isNullType(this.typeOf(clause.expression));
        const eq = this.unionEqOf({ e: "id", name: onUnion.name }, subject, nil ? { e: "nil" } : this.expr(clause.expression, ctx), nil ? T.void : this.tyOfExpr(clause.expression), false);
        pending.push({ e: "int", v: String(onUnion.tests.push(eq!) - 1) });
      } else pending.push(this.expr(clause.expression, ctx, subject));
      if (clause.statements.length) {
        cases.push({ values: pending, body: stmts });
        pending = [];
      }
    }
    // An exhaustive switch needs no default in TypeScript, but Swift, Kotlin and Rust need its end to be unreachable.
    if (!defaultBody && this.coversEveryLiteral(node)) defaultBody = [{ s: "unreachable" }];
    if (onUnion) {
      const index = onUnion.tests.reduceRight<Expr>((rest, test, i) => ({ e: "cond", c: test, a: { e: "int", v: String(i) }, b: rest }), { e: "int", v: "-1" });
      return { s: "switch", x: { e: "with", name: onUnion.name, ty: subject, init: this.expr(node.expression, ctx, subject), body: index }, cases, default: defaultBody };
    }
    return { s: "switch", x: this.expr(node.expression, ctx), cases, default: defaultBody, ...(this.isString(this.checker.getNonNullableType(this.typeOf(node.expression))) ? { text: true } : {}) };
  }

  private coversEveryLiteral(node: ts.SwitchStatement): boolean {
    const subject = this.checker.getTypeAtLocation(node.expression);
    const members = subject.isUnion() ? subject.types : [subject];
    const covered = new Set<unknown>();
    for (const clause of node.caseBlock.clauses) {
      const type = ts.isCaseClause(clause) ? this.checker.getTypeAtLocation(clause.expression) : undefined;
      if (type?.isLiteral()) covered.add(type.value);
    }
    return members.every((t) => t.isLiteral() && covered.has(t.value));
  }

  /** An expression in statement position: assignments, increments, calls, launches. */
  private exprStmt(node: ts.Expression, ctx: Ctx): Stmt[] {
    if (ts.isParenthesizedExpression(node)) return this.exprStmt(node.expression, ctx);
    if (ts.isYieldExpression(node) && !this.presets.has(node)) return this.yieldStmt(node, ctx);
    const pattern = this.destructuring(node);
    if (pattern) return this.destructure(pattern, ctx, false).stmts;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isYieldExpression(node.right) && !this.presets.has(node.right)) {
      return this.yieldStmt(node.right, ctx, { target: this.lvalue(node.left, ctx), ty: this.lvalueTy(node.left) });
    }
    const assigned = ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind) ? node.left
      : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && this.isIncrement(node) ? node.operand : undefined;
    // A compound assignment or ++ / -- to a target whose object or index is computed (`xs[f()]! += 1n`, `o().n |= 1`): the
    // target is read and written, so those are evaluated first, once, into temporaries (as JavaScript evaluates them first).
    if (assigned && !(ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.EqualsToken || this.isLogicalAssignment(node.operatorToken.kind)))) {
      const bare = this.skipAsserts(assigned);
      const computed = ts.isElementAccessExpression(bare) ? !(this.isPure(bare.expression) && this.isRepeatable(bare.argumentExpression)) : ts.isPropertyAccessExpression(bare) && !bare.questionDotToken && !this.isPure(bare);
      if (computed) {
        const before = new Set(this.presets.keys());
        try {
          const parts = this.presetParts(bare, ctx);
          return [...parts, ...this.exprStmt(node, ctx)];
        } finally {
          for (const k of [...this.presets.keys()]) if (!before.has(k)) this.presets.delete(k);
        }
      }
    }
    const accessor = assigned && this.staticAccessor(assigned);
    if (accessor) return [this.staticAssign(node, assigned!, accessor, ctx)];
    // A setter of an object literal (rest2): `o.x = v` calls it.
    if (assigned && this.isLiteralAccessor(assigned)) {
      const setter = this.checker.getSymbolAtLocation(assigned.name)!.declarations!.find(ts.isSetAccessor);
      if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !setter) return [this.unsupported(node, "a compound assignment or ++ / -- to an object literal's getter / setter (or one without a setter); write `o.x = o.x + 1`")];
      const ty = this.tyOfSymbol(this.checker.getSymbolAtLocation(assigned.name)!, setter);
      return [{ s: "expr", x: { e: "invoke", obj: this.expr(assigned.expression, ctx), name: `set__${assigned.name.text}`, args: [this.expr(node.right, ctx, ty)], ...(this.throws(setter) ? { throws: true } : {}) } }];
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) return [...this.exprStmt(node.left, ctx), ...this.exprStmt(node.right, ctx)];
    if (ts.isCallExpression(node)) {
      const optional = this.optionalCall(node, ctx);
      if (optional?.call.e === "with" && optional.call.body.e === "cond") {
        const w = optional.call;
        return [{ s: "let", name: w.name, ty: w.ty, init: w.init, mutable: false }, { s: "if", c: (w.body as Extract<Expr, { e: "cond" }>).c, then: [{ s: "expr", x: (w.body as Extract<Expr, { e: "cond" }>).a }] }];
      }
      if (optional) return [{ s: "if", c: optional.cond, then: [{ s: "expr", x: optional.call }] }];
      // `o?.m()` as a statement: `if (o != nil) o!.m()`.
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.questionDotToken && this.isNullable(this.typeOf(node.expression.expression))) {
        const stmt = (x: Expr): Stmt[] =>
          x.e === "with" ? [{ s: "let", name: x.name, ty: x.ty, init: x.init, mutable: false }, ...stmt(x.body)]
          : x.e === "cond" && x.b.e === "nil" ? [{ s: "if", c: x.c, then: [{ s: "expr", x: x.a }] }]
          : [{ s: "expr", x }];
        return stmt(this.expr(node, ctx));
      }
    }
    if (ts.isBinaryExpression(node) && this.isLogicalAssignment(node.operatorToken.kind)) {
      // `a ??= b`, `a ||= b`, `a &&= b`: an assignment under a test of `a`. A computed target's object and index
      // are evaluated once, first (temporaries).
      const kind = node.operatorToken.kind;
      const before = new Set(this.presets.keys());
      const parts = this.presetParts(node.left, ctx);
      try {
        // `??=` on what can't be null or undefined assigns nothing.
        if (kind === ts.SyntaxKind.QuestionQuestionEqualsToken && !this.isNullable(this.typeOf(node.left)) && !this.elementRead(node.left, ctx)) return parts;
        const target = this.lvalue(node.left, ctx);
        const current = this.expr(node.left, ctx);
        // An element's read: TypeScript types the target of a write without `undefined`; the read may miss.
        const read = this.elementRead(node.left, ctx);
        const truthy = read ? this.irTruthy(read.x, read.ty) ?? this.error(node.left, "Unsupported: ||= / &&= on an element of this type; read it into a variable first.") : this.cond(node.left, ctx, current);
        const test: Expr = kind === ts.SyntaxKind.QuestionQuestionEqualsToken
          ? { e: "bin", op: "==", l: read?.x ?? (current.e === "unwrap" ? current.x : current), r: { e: "nil" } }
          : kind === ts.SyntaxKind.BarBarEqualsToken ? { e: "not", x: truthy } : truthy;
        return [...parts, { s: "if", c: test, then: [{ s: "assign", target, op: "=", value: this.expr(node.right, ctx, this.lvalueTy(node.left)) }] }];
      } finally {
        for (const k of [...this.presets.keys()]) if (!before.has(k)) this.presets.delete(k);
      }
    }
    const taAssign = this.taAssign(node, ctx);
    if (taAssign) return taAssign;
    const bigAssign = this.bigAssign(node, ctx);
    if (bigAssign) return bigAssign;
    const compound = ts.isBinaryExpression(node) ? COMPOUND[node.operatorToken.kind] : undefined;
    if (compound && ts.isBinaryExpression(node)) {
      // `words[i >> 5]! |= bit`: an element is read and written, so its array and index must be safe to evaluate twice.
      const bare = this.skipAsserts(node.left);
      const element = ts.isElementAccessExpression(bare) && this.isPure(bare.expression) && this.isRepeatable(bare.argumentExpression);
      if (!this.isPure(node.left) && !element) return [this.unsupported(node, "this compound assignment to a computed target")];
      // `a |= b` is `a = a | b`, converted to the kind of `a`.
      const op = compound === ts.SyntaxKind.AsteriskAsteriskToken ? "math.pow" : BIT_OPS[compound]!;
      const args = op === "math.pow" ? [this.expr(node.left, ctx, T.double), this.expr(node.right, ctx, T.double)] : [this.expr(node.left, ctx), this.expr(node.right, ctx)];
      let x: Expr = { e: "op", op, args };
      const target = this.lvalueTy(node.left);
      if (target.k === "int" && (op === "math.pow" || op === "bit.ushr")) x = { e: "toInt", x };
      if (target.k === "double" && op !== "math.pow" && op !== "bit.ushr") x = { e: "toDouble", x };
      return [{ s: "assign", target: this.lvalue(node.left, ctx), op: "=", value: x }];
    }
    // `delete o.f` of an optional property: natively the field is nil, as reading it gives `undefined` in JavaScript.
    if (ts.isDeleteExpression(node) && this.deletableField(node)) {
      const cls = this.ty(this.checker.getNonNullableType(this.typeOf((node.expression as ts.PropertyAccessExpression).expression)), node);
      if (cls.k === "class") this.deletedFields.push({ cls: cls.name, node });
      return [{ s: "assign", target: this.lvalue(node.expression, ctx), op: "=", value: { e: "nil" } }];
    }
    if (ts.isDeleteExpression(node) && this.isMapEntry(node.expression)) {
      return [{ s: "expr", x: { e: "op", op: "map.delete", args: [this.expr(node.expression.expression, ctx), this.expr(node.expression.argumentExpression, ctx, T.string)] } }];
    }
    // `n = null` to a local that is always null: nothing to store.
    if (ts.isBinaryExpression(node) && ts.isIdentifier(node.left) && this.isNullLocal(this.valueSymbol(node.left))) {
      return this.isPure(node.right) || node.right.kind === ts.SyntaxKind.NullKeyword ? [] : [this.unsupported(node.right, "computing the value of a local that is always null")];
    }
    if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind)) {
      const ops: Record<number, "=" | "+=" | "-=" | "*=" | "/=" | "%="> = {
        [ts.SyntaxKind.EqualsToken]: "=",
        [ts.SyntaxKind.PlusEqualsToken]: "+=",
        [ts.SyntaxKind.MinusEqualsToken]: "-=",
        [ts.SyntaxKind.AsteriskEqualsToken]: "*=",
        [ts.SyntaxKind.SlashEqualsToken]: "/=",
        [ts.SyntaxKind.PercentEqualsToken]: "%=",
      };
      const op = ops[node.operatorToken.kind];
      if (!op) return [this.unsupported(node, "this assignment operator")];
      const entry = this.mapEntryUpdate(node.left, op, node.right, ctx);
      if (entry) return entry;
      const targetTy = this.lvalueTy(node.left);
      if (op === "+=" && targetTy.k === "string") {
        return [{ s: "assign", target: this.lvalue(node.left, ctx), op, value: this.str(node.right, ctx) }];
      }
      // `x %= y` on a Double: `x = fmod(x, y)` (natively `%` is for Ints), so the target is read twice.
      if (op === "%=" && targetTy.k === "double") {
        const bare = this.skipAsserts(node.left);
        const element = ts.isElementAccessExpression(bare) && this.isPure(bare.expression) && this.isRepeatable(bare.argumentExpression);
        if (!this.isPure(node.left) && !element) return [this.unsupported(node.left, "%= on a computed target that isn't an Int; read it into a variable first")];
        const value: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "fmod" }, this.expr(node.left, ctx, T.double), this.expr(node.right, ctx, T.double)] };
        return [{ s: "assign", target: this.lvalue(node.left, ctx), op: "=", value }];
      }
      return [{ s: "assign", target: this.lvalue(node.left, ctx), op, value: this.expr(node.right, ctx, targetTy) }];
    }
    if ((ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) && this.isIncrement(node)) {
      const entry = this.mapEntryUpdate(node.operand, node.operator === ts.SyntaxKind.PlusPlusToken ? "+=" : "-=", undefined, ctx);
      if (entry) return entry;
      const ty = this.lvalueTy(node.operand);
      const one: Expr = ty.k === "int" ? { e: "int", v: "1" } : { e: "double", v: "1.0" };
      return [{ s: "assign", target: this.lvalue(node.operand, ctx), op: node.operator === ts.SyntaxKind.PlusPlusToken ? "+=" : "-=", value: one }];
    }
    if (ts.isAwaitExpression(node)) return [{ s: "expr", x: this.expr(node, ctx) }];
    if (ts.isConditionalExpression(node)) {
      return [{ s: "if", c: this.cond(node.condition, ctx), then: this.exprStmt(node.whenTrue, ctx), else: this.exprStmt(node.whenFalse, ctx) }];
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return [{ s: "if", c: this.cond(node.left, ctx), then: this.exprStmt(node.right, ctx) }];
    }
    // `subscribe(fn)` that returns an unsubscribe function nobody keeps.
    if (ts.isCallExpression(node) && this.typeOf(node).getCallSignatures().length) return [{ s: "expr", x: this.expr(node, ctx), discard: true }];
    return [{ s: "expr", x: this.expr(node, ctx) }];
  }


  /**
   * `counts[k]!++`, `totals[k]! += x` on a Record entry: natively a map read is optional, so it is `m[k] = m[k]! + x`
   * (the map and the key evaluated twice: they must be pure). `undefined`, any other target: nothing.
   */
  private mapEntryUpdate(target: ts.Expression, op: "=" | "+=" | "-=" | "*=" | "/=" | "%=", right: ts.Expression | undefined, ctx: Ctx): Stmt[] | undefined {
    const entry = this.skipAsserts(target);
    if (op === "=" || op === "%=" || !this.isMapEntry(entry)) return undefined;
    if (!this.isPure(entry.expression) || !this.isRepeatable(entry.argumentExpression)) {
      return [this.unsupported(target, "an update of a map entry whose map or key is computed; read the key into a variable first")];
    }
    const isText = this.isString(this.checker.getNonNullableType(this.typeOf(entry)));
    const old: Expr = { e: "unwrap", x: this.expr(entry, ctx) };
    const rhs: Expr = right ? (isText ? this.str(right, ctx) : this.expr(right, ctx, T.double)) : { e: "double", v: "1.0" };
    const value: Expr = isText ? { e: "tpl", parts: [old, rhs] } : { e: "bin", op: op[0] as "+" | "-" | "*" | "/", l: old, r: rhs };
    return [{ s: "assign", target: this.lvalue(entry, ctx), op: "=", value }];
  }

  private lvalue(node: ts.Expression, ctx: Ctx): Expr {
    // `counts[x]!++`, `(o.n)! += 1`: noUncheckedIndexedAccess makes developers assert the target.
    if (ts.isNonNullExpression(node) || ts.isParenthesizedExpression(node)) return this.lvalue(node.expression, ctx);
    if (ts.isIdentifier(node)) {
      const box = this.boxAt(this.valueSymbol(node), node);
      if (box) return { e: "prop", obj: this.captureRead(node) ?? { e: "id", name: box }, name: "value" };
      return { e: "id", name: this.idName(node) };
    }
    const staticField = this.staticField(node);
    if (staticField) return staticField;
    // A setter that can throw.
    const throws = ts.isPropertyAccessExpression(node) && this.accessorThrows(node) ? { throws: true } : {};
    if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword) return { ...this.superProperty(node, true)!, ...throws } as Expr;
    if (ts.isPropertyAccessExpression(node)) return { e: "prop", obj: this.expr(node.expression, ctx), name: this.memberName(node.name), ...throws };
    if (ts.isElementAccessExpression(node)) {
      if (this.isTypedArray(this.typeOf(node.expression))) return this.error(node, "Write a typed array element in a statement of its own natively (`ta[i] = v;`, `ta[i] += v;`), not inside an expression.");
      const field = this.tupleField(node);
      if (field) return { e: "prop", obj: this.expr(node.expression, ctx), name: field };
      return { e: "index", obj: this.expr(node.expression, ctx), index: this.expr(node.argumentExpression, ctx, this.indexTy(node)) };
    }
    return this.error(node, "Unsupported assignment target natively: assign to a variable, a property (`o.x = v`) or an element (`xs[i] = v`, `map[key] = v`).");
  }

  private lvalueTy(node: ts.Expression): Ty {
    if (ts.isParenthesizedExpression(node)) return this.lvalueTy(node.expression);
    // `words[i]!`: the element's type without undefined.
    if (ts.isNonNullExpression(node)) {
      const t = this.lvalueTy(node.expression);
      return t.k === "optional" ? t.of : t;
    }
    const packed = ts.isElementAccessExpression(node) ? this.storedArray(node.expression) : undefined;
    if (packed) return { k: "num", n: packed };
    // An element of a tuple with optional / rest elements (rest2): the array's element type.
    if (ts.isElementAccessExpression(node) && this.isVarTuple(this.checker.getNonNullableType(this.typeOf(node.expression)))) {
      const arr = this.tyOfExpr(node.expression);
      return ((arr.k === "optional" ? arr.of : arr) as { of: Ty }).of;
    }
    const target = ts.isPropertyAccessExpression(node) ? node.name : node;
    const symbol = this.checker.getSymbolAtLocation(target);
    return symbol ? this.tyOfSymbol(symbol, node) : this.tyOfExpr(node);
  }

  private indexTy(node: ts.ElementAccessExpression): Ty {
    return this.isArray(this.typeOf(node.expression)) ? T.int : T.string;
  }

  // -------------------------------------------------------------------------
  // Expressions
  // -------------------------------------------------------------------------

  /** Lowers an expression; `want` is the type its position needs (numbers convert, functions adapt). */
  private expr(node: ts.Expression, ctx: Ctx, want?: Ty): Expr {
    const preset = this.presets.get(node);
    // A temporary of a statement taken apart around a `yield` (yieldSpill): converted where its position needs it.
    if (preset) return want && this.presetTys.has(node) ? this.convert(preset, this.presetTys.get(node)!, want) : preset;
    const builtin = want?.k === "fn" && (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) ? this.builtinValue(node, want) : undefined;
    if (builtin) return builtin;
    if (ts.isYieldExpression(node)) return this.error(node, "Unsupported: `yield` inside an expression; write it as a statement (`yield v;`, `const x = yield v;` or `x = yield v;`).");
    // `theme.colors.primary`: createCss()'s theme is read at compile time.
    if (ts.isPropertyAccessExpression(node) && this.themeRooted(node)) {
      const v = this.constValue(node);
      if (typeof v === "string") return { e: "str", v };
      if (typeof v === "number") return want?.k === "int" ? { e: "int", v: String(v) } : { e: "double", v: Number.isInteger(v) ? v.toFixed(1) : String(v) };
      return this.error(node, "Read a single token of the theme (theme.colors.primary).");
    }
    // `-1` or `await f()` going into a union: the operand is the member, made the union once, here.
    const memberWant = want && this.unionDecl(want) && (ts.isPrefixUnaryExpression(node) || ts.isAwaitExpression(node)) ? undefined : want;
    // Into a sized slot: computed as an Int or a Double, then checked and converted once (`narrow`).
    const inner = want?.k === "num" ? (SIZED[want.n].int ? T.int : T.double) : memberWant;
    const x = this.widen(node, this.rawExpr(node, ctx, inner));
    return want ? this.coerce(x, node, want) : x;
  }

  private coerce(x: Expr, node: ts.Expression, want: Ty): Expr {
    // An object of an error class where an `Error` is expected: a native error carrying it.
    if (this.errorClasses && (want.k === "optional" ? want.of : want).k === "rt" && ((want.k === "optional" ? want.of : want) as { name: string }).name === "Error") {
      const have = this.typeOf(node).flags & ts.TypeFlags.Object && this.isClassType(this.typeOf(node)) ? this.tyOfExpr(node) : undefined;
      if (have && this.isErrorClass(have)) return this.wrapError(x, have);
    }
    this.checkNominal(node, want);
    const union = this.intoUnion(x, node, want);
    if (union) return union;
    const target = want.k === "optional" ? want.of : want;
    if (target.k === "num" && this.isNumber(this.typeOf(node))) return this.narrow(x, node, target);
    if (target.k === "array" && target.of.k === "num" ? this.storedArray(node) !== target.of.n && !this.freshArray(node) : this.storedArray(node) && (want.k === "array" || want.k === "optional")) {
      return this.error(node, target.k === "array" && target.of.k === "num"
        ? `This array is not ${this.an(target.of.n)}[]: natively that one is packed ${target.of.n}s. Build it with \`[…]\` or push its elements one by one.`
        : `${this.an(this.storedArray(node)!).replace(/^a/, "A")}[] is used where another array type is expected: natively it is packed ${this.storedArray(node)}s. Declare that one ${this.storedArray(node)}[] too, or copy the elements one by one.`);
    }
    if (target.k === "double" || target.k === "int") {
      if (!this.isNumber(this.typeOf(node))) return x;
      const have = this.numKind(node);
      if (target.k === "double" && have === "int") return x.e === "int" ? { e: "double", v: `${x.v}.0` } : x.e === "double" ? x : { e: "toDouble", x };
      if (target.k === "int" && have === "double") return x.e === "double" && /\.0$/.test(x.v) ? { e: "int", v: x.v.slice(0, -2) } : { e: "toInt", x };
    }
    if (target.k === "fn") return this.adapt(x, node, target);
    return x;
  }

  /**
   * TypeScript is structural; Swift and Kotlin classes are nominal. A value of one interface used
   * where another (same-shaped) interface is expected would be a different native class.
   */
  private checkNominal(node: ts.Expression, want: Ty) {
    let n = node;
    while (ts.isParenthesizedExpression(n)) n = n.expression;
    if (!(ts.isIdentifier(n) || ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n) || ts.isAwaitExpression(n) || ts.isNewExpression(n) || n.kind === ts.SyntaxKind.ThisKeyword)) return;
    const type = this.typeOf(n);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) || type.getCallSignatures().length) return;
    // `const env = { x: 3 }; calc(env)` into a `Record<string, number>`: TypeScript lets a type literal stand for a map.
    if ((want.k === "map" || (want.k === "optional" && want.of.k === "map")) && this.isShape(this.nonNull(type))) {
      return void this.error(node, `An object of type ${this.checker.typeToString(type)} is used as a Record (a map): natively an object and a map are different types. Declare it as a Record where it is made (\`const env: Record<string, number> = { … }\`).`);
    }
    const classOf = (t: Ty): string | undefined =>
      t.k === "class" ? t.name : t.k === "array" || t.k === "optional" || t.k === "map" ? classOf(t.of) : undefined;
    const expected = classOf(want);
    if (!expected) return;
    // `nonNull` binds type parameters: `T | null` without null is `NonNullable<T>` (`T & {}`) otherwise.
    const actual = this.classNameOf(this.nonNull(type));
    // A class goes where its base or a protocol it implements is expected, but an array of it is another native type.
    const direct = want.k === "class" || (want.k === "optional" && want.of.k === "class");
    if (actual && direct && this.supertypes(actual).has(expected)) return;
    if (actual && !direct && actual !== expected && this.supertypes(actual).has(expected)) {
      return void this.error(node, `An array or map of ${actual} is used where one of ${expected} is expected: natively they are different types. Declare it as ${expected}[] where it is built.`);
    }
    if (actual && actual !== expected) {
      this.error(node, `${actual} is used where ${expected} is expected: same shape in TypeScript, but different native classes. Build the ${expected} explicitly.`);
    }
  }

  /** The interface a type is, looking through arrays and maps. */
  private classNameOf(type: ts.Type): string | undefined {
    // `nonNull` binds a type parameter first (`T[]` in a generic: `getNonNullableType(T)` would be `NonNullable<T>`).
    if (this.isArray(type)) return this.classNameOf(this.nonNull(this.checker.getTypeArguments(type as ts.TypeReference)[0]!));
    const index = type.getStringIndexType();
    if (index && type.getProperties().length === 0) return this.classNameOf(this.nonNull(index));
    const generic = this.genericRef(this.bound(type));
    if (generic) return this.instantiate(generic.decl, generic.args, generic.decl);
    if (this.isShape(type)) {
      const t = this.shapeTy(type, type.getSymbol()?.declarations?.[0] ?? this.files[0]!);
      return t.k === "class" ? t.name : undefined;
    }
    const symbol = type.aliasSymbol ?? type.getSymbol();
    return symbol && this.isClassType(type) ? this.recordName(symbol) : undefined;
  }

  /**
   * A function value where a function is expected: adapted in its parameters (adaptArity), and called from a
   * closure when it can throw and the slot can't (a runtime handler: catchLog), or the slot can and it can't
   * (natively their types differ). A lambda is made to fit by `lambda`.
   */
  private adapt(x: Expr, node: ts.Expression, want: Extract<Ty, { k: "fn" }>): Expr {
    const out = this.adaptArity(x, node, want);
    const type = this.typeOf(node);
    if (x.e === "lambda" || x.e === "nil" || this.isNullable(type) || !this.checker.getNonNullableType(type).getCallSignatures().length) return out;
    const throws = this.valueThrows(node);
    const same = throws === !!want.throws;
    // An async function where the slot returns nothing (`setTimeout(refresh, 10)`): called from a closure that drops its promise.
    const dropsPromise = want.ret.k === "void" && this.isLibPromise(this.checker.getNonNullableType(type).getCallSignatures()[0]?.getReturnType());
    if ((same && out.e !== "lambda" && !dropsPromise) || (!same && throws && this.uncaughtValue(node) !== "log")) return out;
    let lambda = out;
    if (lambda.e !== "lambda") {
      const [signature] = this.checker.getNonNullableType(this.typeOf(node)).getCallSignatures();
      const arity = Math.min(signature?.getParameters().length ?? want.params.length, want.params.length);
      const params = want.params.map((ty, i) => ({ name: `p__${i}`, ty, unused: i >= arity }));
      const call: Expr = { e: "call", callee: x.e === "id" && x.fnRef ? { e: "id", name: x.name } : x, args: params.slice(0, arity).map((p): Expr => ({ e: "id", name: p.name })) };
      lambda = { e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : call };
    }
    if (lambda.e !== "lambda") return out;
    const body = lambda.body;
    let call = Array.isArray(body) ? (body[0] as Extract<Stmt, { s: "expr" }>).x : body;
    while (call.e === "toDouble" || call.e === "toInt") call = call.x;
    if (call.e === "call" && throws) call.throws = true;
    if (want.throws) return { ...lambda, throws: true };
    return throws ? { ...lambda, body: this.catchLog(Array.isArray(body) ? body : [{ s: "expr", x: body }]) } : lambda;
  }

  /** A function passed where one with more parameters is expected gets the extra ones, unused. */
  private adaptArity(x: Expr, node: ts.Expression, want: Extract<Ty, { k: "fn" }>): Expr {
    if (x.e === "lambda" && x.params.length < want.params.length) {
      const extra = want.params.slice(x.params.length).map((ty, i) => ({ name: `_${i}`, ty, unused: true }));
      return { ...x, params: [...x.params, ...extra] };
    }
    if (x.e === "id" && x.fnRef) {
      const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
      const fn = symbol && this.functionNodeOf(symbol);
      if (!fn) return x;
      const arity = fn.parameters.length;
      const own = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? this.tyOfSymbol(this.checker.getSymbolAtLocation(p.name)!, p) : T.void));
      const signature = this.checker.getSignatureFromDeclaration(fn);
      const ownRet = signature ? this.sizedTy(fn) ?? this.ty(signature.getReturnType(), fn, this.slotKind(fn)) : want.ret;
      const mismatch = (a: Ty | undefined, b: Ty) => !!a && ((a.k === "int" && b.k === "double") || (a.k === "double" && b.k === "int"));
      // An optional or defaulted parameter may be optional natively (`ownDefaults`): Rust doesn't pass a T as a T?.
      const optional = want.params.some((p, i) => p.k !== "optional" && i < arity && (!!fn.parameters[i]!.questionToken || !!fn.parameters[i]!.initializer));
      const wrap = arity < want.params.length || optional || want.params.some((p, i) => mismatch(own[i], p)) || mismatch(ownRet, want.ret);
      if (wrap) {
        const params = want.params.map((ty, i) => ({ name: i < arity ? `p${i}` : `_${i}`, ty, unused: i >= arity }));
        const args = params.slice(0, arity).map((p, i): Expr => this.convert({ e: "id", name: p.name }, p.ty, own[i]!));
        const call: Expr = { e: "call", callee: { e: "id", name: x.name }, args };
        return { e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : this.convert(call, ownRet, want.ret) };
      }
      return x;
    }
    // A function value (a parameter, what a call returns) that takes fewer parameters: called from a closure that takes them all.
    if (x.e !== "lambda") {
      const [signature] = this.checker.getNonNullableType(this.typeOf(node)).getCallSignatures();
      const arity = signature?.getParameters().length ?? want.params.length;
      if (arity < want.params.length) {
        const params = want.params.map((ty, i) => ({ name: `_${i}`, ty, unused: i >= arity }));
        const call: Expr = { e: "call", callee: x, args: params.slice(0, arity).map((p): Expr => ({ e: "id", name: p.name })) };
        return { e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : call };
      }
      // `xs.map(volume(2)(5))`: a function value whose numbers are Ints where the slot's are Doubles (or back), evaluated
      // once (`with`) and called from a closure that converts.
      if (!ts.isCallExpression(node) || this.isNullable(this.typeOf(node))) return x;
      const have = this.tyOfExpr(node);
      const mismatch = (a: Ty | undefined, b: Ty) => !!a && ((a.k === "int" && b.k === "double") || (a.k === "double" && b.k === "int"));
      if (have.k === "fn" && !have.throws && have.params.length === arity && (want.params.some((p, i) => mismatch(have.params[i], p)) || mismatch(have.ret, want.ret))) {
        const pure = x.e === "id";
        const callee: Expr = pure ? x : { e: "id", name: `fv${++this.temps}__` };
        const params = want.params.map((ty, i) => ({ name: `p${i}__${this.temps}`, ty, unused: i >= arity }));
        const call: Expr = { e: "call", callee, args: params.slice(0, arity).map((p, i) => this.convert({ e: "id", name: p.name }, p.ty, have.params[i]!)) };
        const lambda: Expr = { e: "lambda", params, ret: want.ret, body: want.ret.k === "void" ? [{ s: "expr", x: call }] : this.convert(call, have.ret, want.ret) };
        return pure ? lambda : { e: "with", name: (callee as { name: string }).name, ty: have, init: x, body: lambda };
      }
    }
    return x;
  }

  /** Int ↔ Double where two number kinds meet. */
  private convert(x: Expr, from: Ty, to: Ty): Expr {
    if (from.k === "int" && to.k === "double") return { e: "toDouble", x };
    if (from.k === "double" && to.k === "int") return { e: "toInt", x };
    return x;
  }

  /**
   * `a || b` / `a && b` as a value (not only a boolean): `a` once (a temporary when computing it could change
   * something: `with`), tested for truthiness; then `a` itself, or `b` (evaluated only then). Both are made the
   * expression's type (a union when they differ: `n && "x"` is `number | string`).
   */
  private logical(node: ts.BinaryExpression, ctx: Ctx): Expr {
    const or = node.operatorToken.kind === ts.SyntaxKind.BarBarToken;
    const ty = this.tyOfExpr(node);
    const lty = this.tyOfExpr(node.left);
    const left = this.expr(node.left, ctx);
    const pure = this.isPure(node.left) || this.isConstant(node.left);
    const a: Expr = pure ? left : { e: "id", name: `lv__${++this.temps}` };
    const test = this.cond(node.left, ctx, a);
    // `a` as the result: what `||` keeps is truthy (not nil), what `&&` keeps is falsy (nil when `a` is never falsy otherwise).
    // TypeScript leaves out of the expression's type what `a` can't be there (`false || 42` is a number): never kept.
    const keep = (): Expr | undefined => {
      if (or) return this.castTo(lty.k === "optional" && ty.k !== "optional" ? { e: "unwrap", x: a } : a, lty.k === "optional" && ty.k !== "optional" ? lty.of : lty, ty);
      const inner = lty.k === "optional" ? lty.of : lty;
      if (!["int", "double", "string", "bool", "union", "rt"].includes(inner.k) || (inner.k === "rt" && inner.name !== "BigInt")) return ty.k === "optional" ? { e: "nil" } : undefined;
      return this.castTo(a, lty, ty);
    };
    // Likewise `b` (`0 && "x"` is `0`: "x" is never the value).
    const right = this.checker.isTypeAssignableTo(this.typeOf(node.right), this.typeOf(node)) ? this.expr(node.right, ctx, ty) : undefined;
    const kept = keep();
    const value: Expr = !kept ? right ?? this.error(node, "Unsupported: && / || between these types natively; give both sides one type.")
      : !right || (test.e === "bool" && test.v === or) ? kept
      : test.e === "bool" ? right
      : or ? { e: "cond", c: test, a: kept, b: right } : { e: "cond", c: test, a: right, b: kept };
    return pure ? value : { e: "with", name: (a as { name: string }).name, ty: lty, init: left, body: value };
  }

  /**
   * `f(o)` when the optional `x` (the value of `node`) holds `o`, else nil: `a?.length`, `a?.[i]`. A computed `x` is
   * evaluated once (`with`).
   */
  private optionalOn(node: ts.Expression, x: Expr, f: (o: Expr) => Expr): Expr {
    if (x.e === "unwrap") x = x.x;
    const pure = this.isPure(node) || x.e === "id";
    const v: Expr = pure ? x : { e: "id", name: `lv__${++this.temps}` };
    const value: Expr = { e: "cond", c: this.some(v), a: f({ e: "unwrap", x: v }), b: { e: "nil" } };
    return pure ? value : { e: "with", name: (v as { name: string }).name, ty: this.tyOfExpr(node), init: x, body: value };
  }

  /** In an optional chain whose `?.` is on a value that may be nullish (not one TypeScript narrowed, nor a preset one). */
  private liveChain(node: ts.Expression): boolean {
    if (!ts.isOptionalChain(node)) return false;
    let n: ts.Expression = node;
    while (!(n as { questionDotToken?: ts.Node }).questionDotToken && (ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n) || ts.isNonNullExpression(n))) n = n.expression;
    const link = n as ts.Expression & { questionDotToken?: ts.Node; expression?: ts.Expression };
    const obj = link.questionDotToken ? link.expression : undefined;
    return !!obj && this.isNullable(this.typeOf(obj)) && !this.presets.has(obj);
  }

  /** A chain's links (`chain` ops and properties down the receivers) as plain ones: its value is there (optionalOn). */
  private unchain(x: Expr): Expr {
    if (x.e === "op" && (x.chain || x.args[0]?.e === "op" || x.args[0]?.e === "prop")) return { ...x, chain: undefined, args: x.args.map((a, i) => (i === 0 ? this.unchain(a) : a)) };
    if (x.e === "prop" && x.chain) return { ...x, chain: undefined, obj: this.unchain(x.obj) };
    return x;
  }

  /** A value of native type `from` as one of type `to` (Int → Double, into a union, into or out of an optional). */
  private castTo(x: Expr, from: Ty, to: Ty): Expr | undefined {
    if (this.sameTy(from, to)) return x;
    if (from.k === "optional" && to.k === "optional") {
      const inner = this.castTo({ e: "unwrap", x }, from.of, to.of);
      return !inner ? undefined : inner.e === "unwrap" && inner.x === x ? x : { e: "cond", c: this.some(x), a: inner, b: { e: "nil" } };
    }
    if (from.k === "optional") return this.castTo({ e: "unwrap", x }, from.of, to);
    if (to.k === "optional") return this.castTo(x, from, to.of);
    if (from.k === "int" && to.k === "double") return x.e === "int" ? { e: "double", v: `${x.v}.0` } : { e: "toDouble", x };
    return this.toUnionValue(x, from, to);
  }

  /** A condition: JavaScript truthiness made explicit. */
  /** `given`: the value of `node`, already computed (a temporary): tested as `node` would be, without evaluating it. */
  private cond(node: ts.Expression, ctx: Ctx, given?: Expr): Expr {
    if (ts.isParenthesizedExpression(node)) return this.cond(node.expression, ctx, given);
    if (!given && ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) return { e: "not", x: this.cond(node.operand, ctx) };
    if (!given && ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      return { e: "bin", op: node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? "&&" : "||", l: this.cond(node.left, ctx), r: this.cond(node.right, ctx) };
    }
    const type = this.typeOf(node);
    if (this.isNullType(type) && (given || this.isPure(node))) return { e: "bool", v: false };
    if (!given && this.isIterDone(node)) return this.expr(node, ctx);
    const x = given ?? this.expr(node, ctx);
    const truthy = this.unionTruthy(node, type, x);
    if (truthy) return truthy;
    if (this.isBoolean(type)) return x;
    if (this.isBigInt(type)) return this.bigTruthy(node, type, x);
    // A Double is falsy at 0, -0 and NaN: |x| > 0 (one read).
    const primitive = (v: Expr, t: ts.Type, kind: Ty): Expr | undefined =>
      this.isBoolean(t) ? v
      : this.isString(t) ? { e: "op", op: "str.nonEmpty", args: [v] }
      : !this.isNumber(t) ? undefined
      : kind.k === "int" ? { e: "bin", op: "!=", l: v, r: { e: "int", v: "0" } }
      : { e: "bin", op: ">", l: { e: "op", op: "math.abs", args: [v] }, r: { e: "double", v: "0.0" } };
    if (this.isNullable(type)) {
      // `boolean | undefined`, `string | null`, `number | undefined`: nil, false, "", 0 and NaN are all falsy.
      const inner = this.checker.getNonNullableType(type);
      const ty = this.tyOfExpr(node);
      const of = ty.k === "optional" ? ty.of : ty;
      const zero: Expr | undefined = of.k === "bool" ? { e: "bool", v: false } : of.k === "string" ? { e: "str", v: "" } : of.k === "int" ? { e: "int", v: "0" } : of.k === "double" ? { e: "double", v: "0.0" } : undefined;
      const test = zero && primitive({ e: "coalesce", l: x, r: zero }, inner, of);
      return test ?? { e: "bin", op: "!=", l: x, r: { e: "nil" } };
    }
    const test = primitive(x, type, this.numKind(node) === "int" ? T.int : T.double);
    if (test) return test;
    return { e: "bool", v: true };
  }

  /**
   * `${x}` of a string, number, boolean (or a union of them) that may be null or undefined, but not both (natively
   * both are nil): "null" / "undefined" when nil. A computed value is evaluated once (`with`).
   */
  private nullableStr(node: ts.Expression, type: ts.Type, x: Expr): Expr | undefined {
    if (!this.isNullable(type) || !type.isUnion()) return undefined;
    const isNull = type.types.some((t) => t.flags & ts.TypeFlags.Null);
    const isUndefined = type.types.some((t) => t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void));
    if (isNull === isUndefined) return undefined;
    const inner = this.checker.getNonNullableType(type);
    const ty = this.tyOfExpr(node);
    if (ty.k !== "optional") return undefined;
    const pure = this.isPure(node) || x.e === "id";
    const v: Expr = pure ? x : { e: "id", name: `lv__${++this.temps}` };
    const some: Expr = { e: "unwrap", x: v };
    const decl = this.unionDecl(ty.of);
    const text: Expr | undefined = this.isString(inner) ? some
      : this.isNumber(inner) || this.isBoolean(inner) ? { e: "toStr", x: some, from: ty.of }
      : decl && decl.members.every((m) => ["double", "string", "bool"].includes(m.ty.k)) ? this.unionCall(`${decl.name}__str`, () => this.strFn(decl.name), [some])
      : undefined;
    if (!text) return undefined;
    const value: Expr = { e: "cond", c: this.some(v), a: text, b: { e: "str", v: isNull ? "null" : "undefined" } };
    return pure ? value : { e: "with", name: (v as { name: string }).name, ty, init: x, body: value };
  }

  /** A string: numbers and booleans formatted as JavaScript would. */
  private str(node: ts.Expression, ctx: Ctx): Expr {
    if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return { e: "str", v: node.getText() };
    const type = this.typeOf(node);
    // Typed (or narrowed to) exactly null / undefined here: its text is known.
    if (this.isNullType(type) && (this.isPure(node) || node.kind === ts.SyntaxKind.NullKeyword)) return { e: "str", v: type.flags & ts.TypeFlags.Null ? "null" : "undefined" };
    if (this.isIterDone(node)) return { e: "toStr", x: this.expr(node, ctx), from: T.bool };
    const arrayTy = this.isArray(type) && !this.isNullable(type) && !this.storedArray(node) ? this.tyOfExpr(node) : undefined;
    const x = this.expr(node, ctx, arrayTy);
    if (this.isString(type)) return x;
    if (this.isNumber(type) && !this.isNullable(type)) return { e: "toStr", x, from: this.numKind(node) === "int" ? T.int : T.double };
    if (this.isBoolean(type)) return { e: "toStr", x, from: T.bool };
    if (this.taName(type)) return this.taCallOf(x, "join", T.string, { e: "str", v: "," });
    const mapSet = this.weakKind(type) ?? this.mcKind(type) ?? this.abName(type);
    if (mapSet) return this.isPure(node) || ts.isNewExpression(node) ? { e: "str", v: `[object ${mapSet}]` } : this.error(node, "Put the value in a variable first.");
    if ((this.isBigInt(type) || this.isSymbol(type)) && !this.isNullable(type)) return { e: "toStr", x, from: T.rt(this.isBigInt(type) ? "BigInt" : "Symbol") };
    const joined = arrayTy?.k === "array" ? this.joinText(x, arrayTy.of, { e: "str", v: "," }) : undefined;
    if (joined) return joined;
    const nullable = this.nullableStr(node, type, x);
    if (nullable) return nullable;
    const text = this.unionStr(node, type, x);
    if (text) return text;
    // A caught error (an unannotated promise rejection reason is `any` in TypeScript's lib): "Error: …".
    if (type.flags & ts.TypeFlags.Unknown || (type.flags & ts.TypeFlags.Any && this.isCaught(node))) return this.errorRead(x, "text");
    // An object of an error class: its toString() (Error.prototype.toString unless it overrides it).
    const errTy = this.errorClasses && !this.isNullable(type) && type.getSymbol() && this.objectClasses.has(type.getSymbol()!) ? this.tyOfExpr(node) : undefined;
    if (errTy && this.isErrorClass(errTy)) return { e: "invoke", obj: x, name: "toString", args: [] };
    // An Error value (a rejection reason, an allSettled result's reason): "Error: message", as String(e) gives.
    if ((x.e === "op" && x.ty?.k === "rt" && x.ty.name === "Error") || (type.getSymbol()?.name === "Error" && type.getSymbol()!.declarations?.every((d) => d.getSourceFile().isDeclarationFile))) return this.errorRead(x, "text");
    if (this.isMixedTuple(type)) return this.tupleStr(node, type, x);
    // An object of the app's classes: its toString(), or "[object Object]" (rest2).
    const objTy = !this.isNullable(type) && !(type.flags & ts.TypeFlags.Any) ? this.tyOfExpr(node) : undefined;
    const objText = objTy?.k === "class" ? this.objectText(x, objTy) : undefined;
    if (objText) return objText.e === "str" && !this.isPure(node) ? { e: "with", name: `ot__${++this.temps}`, ty: objTy!, init: x, body: objText } : objText;
    if (objTy?.k === "class" && this.isObjectClass(objTy.name)) {
      return this.error(node, `Cannot turn ${this.checker.typeToString(type)} into text natively: a subclass (or a class implementing it) declares its own toString(), which only a method of ${objTy.name} could dispatch to. Declare toString() in ${objTy.name} too (it can return "[object Object]").`);
    }
    if (this.isDate(this.checker.getNonNullableType(type))) return this.error(node, "A date as text is its toString(), which prints the time zone's name each platform spells its own way: use toISOString(), toUTCString() or toDateString().");
    if (type.flags & ts.TypeFlags.Any) return this.error(node, "This value is typed `any`, which has no native text form: give it a real type (or `unknown` and test it with typeof).");
    const named = this.checker.typeToString(type);
    return this.error(node, this.isNullable(type)
      ? `Cannot turn ${named} into text natively: it may be null or undefined. Handle that first (\`x ?? ""\`, or \`x === null ? "none" : …\`).`
      : `Cannot turn ${named} into text natively (only strings, numbers, booleans, bigints, arrays of them and the app's unions print the same on every platform): format it from its fields.`);
  }

  private rawExpr(node: ts.Expression, ctx: Ctx, want?: Ty): Expr {
    switch (node.kind) {
      case ts.SyntaxKind.NumericLiteral: {
        const text = (node as ts.NumericLiteral).text;
        const value = Number(text);
        const double: Expr = { e: "double", v: Number.isInteger(value) && !/e/i.test(String(value)) ? `${value}.0` : String(value) };
        if (want?.k === "double" || (want?.k === "optional" && want.of.k === "double")) return double;
        return this.numKind(node) === "int" ? { e: "int", v: /^0x/i.test(text) ? String(value) : text } : double;
      }
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
        return { e: "str", v: (node as ts.StringLiteral).text };
      case ts.SyntaxKind.TrueKeyword:
        return { e: "bool", v: true };
      case ts.SyntaxKind.FalseKeyword:
        return { e: "bool", v: false };
      case ts.SyntaxKind.NullKeyword:
        return { e: "nil" };
      case ts.SyntaxKind.BigIntLiteral:
        return this.bigLit(this.bigConst(node)!);
    }
    if (ts.isIdentifier(node)) return this.identifier(node);
    if (ts.isTemplateExpression(node)) {
      const parts: (string | Expr)[] = [node.head.text];
      for (const span of node.templateSpans) parts.push(this.str(span.expression, ctx), span.literal.text);
      return { e: "tpl", parts: parts.filter((p) => p !== "") };
    }
    // String.raw`…`: the literal text as written (escapes kept), the values as text (lib4).
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText() === "String.raw" && this.isLibGlobal((node.tag as ts.PropertyAccessExpression).expression as ts.Identifier)) {
      const t = node.template;
      const raw = (n: ts.TemplateLiteralLikeNode) => n.rawText ?? n.text;
      const parts: (string | Expr)[] = ts.isNoSubstitutionTemplateLiteral(t) ? [raw(t)] : [raw(t.head)];
      if (ts.isTemplateExpression(t)) for (const span of t.templateSpans) parts.push(this.str(span.expression, ctx), raw(span.literal));
      return { e: "tpl", parts: parts.filter((p) => p !== "") };
    }
    if (ts.isNonNullExpression(node)) {
      // `rows[i]!`: the read itself, which traps natively when out of range, as `!` would.
      if (ts.isElementAccessExpression(node.expression)) {
        const read = this.elementAccess(node.expression, ctx, true);
        // An element that is itself nullable (`(T | undefined)[]`): the plain read is still optional.
        const arr = this.checker.getNonNullableType(this.typeOf(node.expression.expression));
        const elem = this.isArray(arr) ? this.checker.getTypeArguments(arr as ts.TypeReference)[0] : undefined;
        return elem && this.isNullable(this.bound(elem)) && read.e !== "unwrap" ? { e: "unwrap", x: read } : read;
      }
      // A nullable operand is unwrapped first, then converted (`dist[u!]` of a `number | undefined`: Int(u!), not Int(u)!).
      const nullable = this.isNullable(this.typeOf(node.expression));
      const inner = this.expr(node.expression, ctx, nullable && want && want.k !== "optional" ? undefined : want);
      return nullable && inner.e !== "unwrap" ? { e: "unwrap", x: inner } : inner;
    }
    // `x as T` and `<T>x` are the same assertion.
    if (ts.isParenthesizedExpression(node) || ts.isAssertionExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.expr(node.expression, ctx, want);
    }
    if (ts.isAwaitExpression(node)) return this.awaitExpr(node, ctx);
    if (ts.isPropertyAccessExpression(node)) return this.property(node, ctx);
    if (ts.isElementAccessExpression(node)) return this.elementAccess(node, ctx, false);
    if (ts.isCallExpression(node)) return this.nativePromise(node, this.call(node, ctx));
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      // Into an optional function slot (`onError?`), it is that function type.
      const fn = want?.k === "optional" ? want.of : want;
      return this.lambda(node, ctx, fn?.k === "fn" ? fn : undefined);
    }
    if (ts.isConditionalExpression(node)) {
      const ty = want ?? this.tyOfExpr(node);
      return { e: "cond", c: this.cond(node.condition, ctx), a: this.expr(node.whenTrue, ctx, ty), b: this.expr(node.whenFalse, ctx, ty) };
    }
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.ExclamationToken) return { e: "not", x: this.cond(node.operand, ctx) };
      const big = this.bigUnary(node, ctx);
      if (big) return big;
      // `+"3"`, `-flag`: ToNumber of a string (as Number(s)) or a boolean (1 / 0).
      const operandType = this.typeOf(node.operand);
      if ((node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken) && (this.isString(operandType) || this.isBoolean(operandType))) {
        const n: Expr = this.isString(operandType)
          ? { e: "op", op: "num.parse", args: [this.expr(node.operand, ctx, T.string)] }
          : { e: "cond", c: this.cond(node.operand, ctx), a: { e: "double", v: "1.0" }, b: { e: "double", v: "0.0" } };
        return node.operator === ts.SyntaxKind.MinusToken ? { e: "neg", x: n } : n;
      }
      // `-0` is a Double (see numKind), unless an Int is wanted (`case -0:` on an Int).
      if (node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand) && Number(node.operand.text) === 0 && want?.k !== "int") return { e: "neg", x: { e: "double", v: "0.0" } };
      if (node.operator === ts.SyntaxKind.MinusToken) return { e: "neg", x: this.expr(node.operand, ctx, want) };
      if (node.operator === ts.SyntaxKind.PlusToken) return this.expr(node.operand, ctx, want);
      if (node.operator === ts.SyntaxKind.TildeToken) return { e: "op", op: "bit.not", args: [this.expr(node.operand, ctx)] };
      return this.increment(node, ctx);
    }
    if (ts.isPostfixUnaryExpression(node)) return this.increment(node, ctx);
    if (ts.isBinaryExpression(node)) return this.binary(node, ctx);
    if (ts.isArrayLiteralExpression(node)) {
      // Into a union: its array member (one, or TypeScript's type for the literal decides).
      const arrays = this.unionDecl(want ?? T.void)?.members.filter((m) => m.ty.k === "array");
      if (arrays?.length) {
        const member = arrays.length === 1 ? arrays[0]! : arrays.find((m) => this.sameTy(m.ty, this.tyOfExpr(node)));
        if (!member) return this.error(node, "This array literal could be more than one member of the union natively; give it its type first.");
        return { e: "uwrap", x: this.arrayOf(node.elements, (member.ty as Extract<Ty, { k: "array" }>).of, ctx), u: this.unionDecl(want!)!.name, tag: member.tag, ty: member.ty };
      }
      // Into an optional array (`items?: MenuItem[]`) too: the declared element type, not TypeScript's for the literal.
      const wantArray = want?.k === "optional" ? want.of : want;
      // A mixed tuple's record where one is expected (`[string, Record<string, boolean>][]`): its declared field types.
      const wantTuple = wantArray?.k === "class" && this.shapeClasses.get(wantArray.name)?.fields.length === node.elements.length;
      const ty = wantArray?.k === "array" || wantTuple ? wantArray! : this.tyOfExpr(node);
      // A tuple of different types: its record, a field per element.
      const tuple = ty.k === "class" ? this.shapeClasses.get(ty.name) : undefined;
      if (tuple && node.elements.length === tuple.fields.length && !node.elements.some(ts.isSpreadElement)) {
        return { e: "new", cls: tuple.name, args: tuple.fields.map((f, i): [string, Expr] => [f.name, this.expr(node.elements[i]!, ctx, f.ty)]) };
      }
      if (ty.k !== "array") return this.error(node, "Unsupported array literal.");
      return this.arrayOf(node.elements, ty.of, ctx);
    }
    if (ts.isObjectLiteralExpression(node)) return this.object(node, ctx, want);
    // In an object literal's method, `this` is the object: the method's function takes it last (`this__`, see literalClass).
    if (node.kind === ts.SyntaxKind.ThisKeyword) return { e: "id", name: this.literalThis(node) ? "this__" : "this" };
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && (node.expression.text === "Promise" || node.expression.text === "Error") && this.checker.getSymbolAtLocation(node.expression)?.declarations?.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d))) {
      if (node.expression.text === "Promise") return this.newPromise(node, ctx);
      // An Error as a value (`reject(new Error("…"))`), what `throw new Error(…)` throws.
      return this.newError(node, ctx);
    }
    if (ts.isNewExpression(node) && this.isGlobal(node.expression, "Date")) return this.newDate(node, ctx);
    if (ts.isNewExpression(node)) {
      const typed = this.taNew(node, ctx);
      if (typed) return typed;
      const mapSet = this.mcNew(node, ctx, want);
      if (mapSet) return mapSet;
      const symbol = this.classRef(node.expression);
      const signature = this.checker.getResolvedSignature(node);
      if (symbol && signature) {
        const made: Extract<Expr, { e: "construct" }> = { e: "construct", cls: this.classNameOf(this.typeOf(node)) ?? this.className(symbol), args: [...this.captureArgs(symbol, node), ...this.callArgs(node, signature, ctx)] };
        if (this.throwPoint(node)) made.throws = true;
        return made;
      }
      if (ts.isIdentifier(node.expression) && node.expression.text === "Array" && this.isLibGlobal(node.expression)) return this.arrayCtor(node, ctx);
      return this.error(node, "Unsupported: `new` of anything but the app's classes (and `throw new Error(...)`).");
    }
    if (ts.isTypeOfExpression(node)) return this.typeofValue(node, ctx);
    return this.error(node, `Unsupported: this ${ts.SyntaxKind[node.kind].replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} has no native form; write it with plain calls, operators and literals.`);
  }

  /**
   * An assignment or `++` / `--` whose value is used (`while ((line = next()) !== null)`, `f(x = 1)`, `a = b = c`,
   * `(total += x) > 10`, `xs[f()]++`, `C.count++` of a static setter, `b++` of a bigint): the statement form inside the
   * expression (IR `seq`), in JavaScript's order: a computed target's object and index first (temporaries, `presetParts`),
   * then the right side, then the write. Its value: for `=` the right side's (a temporary: JavaScript gives the assigned
   * value itself), for `x++` the target read before, for `op=` / `??=` / `||=` / `&&=` / `++x` the target read after.
   */
  private updateValue(node: ts.BinaryExpression | ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, ctx: Ctx): Expr {
    let target = ts.isBinaryExpression(node) ? node.left : node.operand;
    while (ts.isParenthesizedExpression(target)) target = target.expression;
    const right = ts.isBinaryExpression(node) ? node.right : undefined;
    const awaits = (n: ts.Node): boolean => ts.isAwaitExpression(n) || ts.isYieldExpression(n) || (!ts.isFunctionLike(n) && !!ts.forEachChild(n, (c) => awaits(c) || undefined));
    if (awaits(node)) return this.error(node, "Unsupported: an `await` (or `yield`) in an assignment used as a value; assign it in a statement of its own first.");
    if (right && this.isNullType(this.typeOf(right))) return this.error(node, "Unsupported: assigning null / undefined inside an expression; make it a statement.");
    const ty = this.tyOfExpr(node);
    const before = new Set(this.presets.keys());
    const temps: string[] = [];
    try {
      // `xs[i]!++`: the element itself is the target (its object and index are the parts).
      const inner = ts.isNonNullExpression(target) ? target.expression : target;
      const body = this.presetParts(inner, ctx);
      const read = () => this.expr(ts.isBinaryExpression(node) ? node.left : node.operand, ctx);
      const temp = (init: Expr, t: Ty): Expr => {
        const name = `sv__${++this.temps}`;
        temps.push(name);
        body.push({ s: "let", name, ty: t, init, mutable: false });
        return { e: "id", name };
      };
      if (right && node.kind === ts.SyntaxKind.BinaryExpression && (node as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        // The right side once, in its own type; the write converts it as the statement would.
        const value = temp(this.expr(right, ctx), ty);
        this.presets.set(right, this.coerce(value, right, this.lvalueTy(inner)));
        body.push(...this.exprStmt(node, ctx));
        return { e: "seq", body, x: value, ty };
      }
      const postfix = ts.isPostfixUnaryExpression(node);
      // `op=` / `++x` give the value computed, which a target that converts what it stores (a typed array's element,
      // a sized number) or a setter may not read back.
      const accessor = this.staticAccessor(inner) || (ts.isPropertyAccessExpression(inner) && this.checker.getSymbolAtLocation(inner.name)?.declarations?.some(ts.isSetAccessor));
      const converts = (ts.isElementAccessExpression(inner) && this.isTypedArray(this.typeOf(inner.expression))) || this.lvalueTy(inner).k === "num";
      if (!postfix && (accessor || converts)) return this.error(node, `Unsupported: the value of ${ts.isBinaryExpression(node) ? "a compound assignment" : "a prefix ++ / --"} to ${accessor ? "a setter" : "a typed array element or a sized number"} inside an expression (JavaScript gives the value computed, not what is stored); make it a statement and read the target after.`);
      const old = postfix ? temp(read(), ty) : undefined;
      body.push(...this.exprStmt(node, ctx));
      let x = old ?? read();
      // `a ??= b`: TypeScript's value is no longer nullable.
      if (!old && x.e !== "unwrap" && this.isNullable(this.typeOf(ts.isBinaryExpression(node) ? node.left : node.operand)) && !this.isNullable(this.typeOf(node))) x = { e: "unwrap", x };
      return { e: "seq", body, x, ty };
    } finally {
      for (const k of [...this.presets.keys()]) if (!before.has(k)) this.presets.delete(k);
    }
  }

  /** `x++`, `--obj.count`, `xs[i]++` as a value. The target is read and written, so it must have no effects. */
  private increment(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, ctx: Ctx): Expr {
    const target = node.operand;
    if (this.staticAccessor(target) || this.isBigInt(this.typeOf(target))) return this.updateValue(node, ctx);
    const element = ts.isNonNullExpression(target) ? target.expression : target;
    if (ts.isElementAccessExpression(element) && this.isTypedArray(this.typeOf(element.expression))) return this.updateValue(node, ctx);
    const pure = this.isPure(target) || (ts.isElementAccessExpression(target) && this.isPure(target.expression) && this.isPure(target.argumentExpression));
    if (!pure) return this.updateValue(node, ctx);
    const ty = this.lvalueTy(target);
    return {
      e: "incr",
      target: this.lvalue(target, ctx),
      op: node.operator === ts.SyntaxKind.PlusPlusToken ? "+=" : "-=",
      one: ty.k === "int" ? { e: "int", v: "1" } : { e: "double", v: "1.0" },
      prefix: ts.isPrefixUnaryExpression(node),
    };
  }

  /**
   * `xs[i]` / `map[key]`. With noUncheckedIndexedAccess the read is `T | undefined`, and so is the
   * native one: `jsAt(i)` / `getOrNull(i)` and the map's optional subscript, never a crash. A read
   * TypeScript has narrowed (or `!`-asserted) is the plain subscript.
   */
  private elementAccess(node: ts.ElementAccessExpression, ctx: Ctx, asserted: boolean): Expr {
    const objType = this.checker.getNonNullableType(this.typeOf(node.expression));
    const obj = this.expr(node.expression, ctx);
    const present = asserted || !this.isNullable(this.typeOf(node));
    const typed = this.taIndex(node, ctx, present);
    if (typed) return typed;
    if (this.isString(objType) && this.isNumber(this.typeOf(node.argumentExpression))) {
      // `s[i]` (rest): the UTF-16 unit at an integer index in range, else undefined, as JavaScript.
      const at = (o: Expr): Expr => this.jsFn("strIndex", T.optional(T.string), [o, this.expr(node.argumentExpression, ctx, T.double)]);
      if (node.questionDotToken && this.isNullable(this.typeOf(node.expression))) return this.optionalOn(node.expression, obj, (o) => this.flat(at(o), T.optional(T.string)));
      return present ? { e: "unwrap", x: at(obj) } : at(obj);
    }
    if (this.isString(objType)) return this.error(node, "Indexing a string is not supported natively (characters differ); use slice().");
    const field = this.tupleField(node, true);
    if (field) return { e: "prop", obj, name: field, optional: !!node.questionDotToken || undefined };
    if (this.isMixedTuple(objType) && !node.questionDotToken) return this.tupleIndexRead(node, obj, ctx);
    const elem = (this.ty(objType, node.expression) as { of?: Ty }).of;
    if (this.isArray(objType)) {
      // `a?.[i]`: the index is evaluated only when there is an array.
      if (node.questionDotToken && this.isNullable(this.typeOf(node.expression))) return this.optionalOn(node.expression, obj, (o) => this.flat({ e: "op", op: "arr.at", args: [o, this.expr(node.argumentExpression, ctx, T.int)] }, elem));
      const index = this.expr(node.argumentExpression, ctx, T.int);
      const read: Expr = present ? { e: "index", obj, index } : this.flat({ e: "op", op: "arr.at", args: [obj, index] }, elem);
      // An element of a tuple with optional / rest elements (rest2): the member TypeScript types it as here.
      const tupleElem = this.isVarTuple(objType) && this.checker.getIndexTypeOfType(objType, ts.IndexKind.Number);
      return (tupleElem && this.fromUnion(read, node, tupleElem, this.typeOf(node))) || read;
    }
    if (objType.getStringIndexType()) {
      if (node.questionDotToken && this.isNullable(this.typeOf(node.expression))) return this.optionalOn(node.expression, obj, (o) => this.flat({ e: "op", op: "map.get", args: [o, this.expr(node.argumentExpression, ctx, T.string)] }, elem));
      const get: Expr = { e: "op", op: "map.get", args: [obj, this.expr(node.argumentExpression, ctx, T.string)] };
      return present ? { e: "unwrap", x: get } : this.flat(get, elem);
    }
    const keyed = this.literalKeyRead(node, objType, obj, ctx);
    if (keyed) return keyed;
    return this.error(node, "Only arrays and Record<string, T> maps can be indexed natively.");
  }

  /**
   * A Record literal with spreads, shorthands or computed keys (rest): `{ ...defaults, [key]: v, b }` set entry by entry
   * in source order into a new map (a later key overwrites, keeping its first position, as in JavaScript).
   */
  private mapLiteralSteps(node: ts.ObjectLiteralExpression, ty: Extract<Ty, { k: "map" }>, ctx: Ctx): Expr | undefined {
    const n = ++this.temps;
    const m = `ml${n}__`;
    const map: Expr = { e: "id", name: m };
    const body: Stmt[] = [{ s: "let", name: m, ty, init: { e: "dict", of: ty.of, entries: [] }, mutable: false }];
    const set = (key: Expr, value: Expr): Stmt => ({ s: "assign", target: { e: "index", obj: map, index: key }, op: "=", value });
    for (const [i, prop] of node.properties.entries()) {
      if (ts.isSpreadAssignment(prop)) {
        const from = this.tyOfExpr(prop.expression);
        if (from.k !== "map" || !this.sameTy(from.of, ty.of) || this.isNullable(this.typeOf(prop.expression))) return undefined;
        const [s, k] = [`ms${n}_${i}__`, `mk${n}_${i}__`];
        body.push(
          { s: "let", name: s, ty: from, init: this.expr(prop.expression, ctx), mutable: false },
          { s: "forOf", name: k, of: { e: "op", op: "map.keys", args: [{ e: "id", name: s }] }, body: [set({ e: "id", name: k }, { e: "unwrap", x: { e: "op", op: "map.get", args: [{ e: "id", name: s }, { e: "id", name: k }] } })] },
        );
      } else if (ts.isShorthandPropertyAssignment(prop)) body.push(set({ e: "str", v: prop.name.text }, this.expr(prop.name, ctx, ty.of)));
      else if (ts.isPropertyAssignment(prop) && ts.isComputedPropertyName(prop.name)) {
        const k = prop.name.expression;
        const kt = this.typeOf(k);
        if (!(this.isString(kt) || this.isNumber(kt)) || this.isNullable(kt)) return undefined;
        // The key first, then the value (JavaScript's order).
        const key = `mq${n}_${i}__`;
        body.push({ s: "let", name: key, ty: T.string, init: this.str(k, ctx), mutable: false }, set({ e: "id", name: key }, this.expr(prop.initializer, ctx, ty.of)));
      } else if (ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name))) {
        body.push(set({ e: "str", v: prop.name.text }, this.expr(prop.initializer, ctx, ty.of)));
      } else return undefined;
    }
    return { e: "seq", body, x: map, ty };
  }

  /**
   * `transitions[state]` (rest): an object whose keys are listed (`Record<"a" | "b", T>`, an interface) read by a key of
   * a union of its string literal keys: the field the key names (a test per key), all of one native type.
   */
  private literalKeyRead(node: ts.ElementAccessExpression, objType: ts.Type, obj: Expr, ctx: Ctx): Expr | undefined {
    if (node.questionDotToken || this.isNullable(this.typeOf(node.expression))) return undefined;
    const keyType = this.typeOf(node.argumentExpression);
    const keys = (keyType.isUnion() ? keyType.types : [keyType]).map((t) => (t.isStringLiteral() ? t.value : undefined));
    if (!keys.length || keys.some((k) => k === undefined || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(k) || !objType.getProperty(k))) return undefined;
    const out = this.tyOfExpr(node);
    if (keys.some((k) => !this.sameTy(this.tyOfSymbol(objType.getProperty(k!)!, node), out))) return undefined;
    const n = ++this.temps;
    const [o, k] = [`lo${n}__`, `lk${n}__`];
    const field = (name: string): Expr => ({ e: "prop", obj: { e: "id", name: o }, name });
    let read: Expr = field(keys.at(-1)!);
    for (const key of keys.slice(0, -1).reverse()) read = { e: "cond", c: { e: "bin", op: "==", l: { e: "id", name: k }, r: { e: "str", v: key! } }, a: field(key!), b: read };
    const withKey: Expr = { e: "with", name: k, ty: T.string, init: this.expr(node.argumentExpression, ctx, T.string), body: read };
    return { e: "with", name: o, ty: this.tyOfExpr(node.expression), init: obj, body: withKey };
  }

  /**
   * A read that is nil when the element is missing (`jsAt`, `pop`, a map lookup…) from a container of optionals:
   * `T | null | undefined` is one optional natively, so Swift's `T??` / Rust's `Option<Option<T>>` is flattened
   * (`x ?? nil`), or `=== null` would test the outer one.
   */
  private flat(x: Expr, elem: Ty | undefined): Expr {
    return elem?.k === "optional" ? { e: "coalesce", l: x, r: { e: "nil" } } : x;
  }

  private identifier(node: ts.Identifier): Expr {
    if (node.text === "undefined") return { e: "nil" };
    if ((node.text === "Infinity" || node.text === "NaN") && this.checker.getSymbolAtLocation(node)?.declarations?.[0]?.getSourceFile().isDeclarationFile) {
      return { e: "op", op: "math.fn", args: [{ e: "str", v: node.text }] };
    }
    const symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) return this.error(node, `${node.text} is not declared anywhere the native code can see: import it, or declare it in the app.`);
    const resolved = this.resolveAlias(symbol)!;
    if (this.isNullLocal(resolved)) return { e: "nil" };
    if (resolved.flags & ts.SymbolFlags.Enum) return this.error(node, `The enum ${node.text} exists natively only through its members (${node.text}.Member).`);
    if (resolved.flags & ts.SymbolFlags.ValueModule) return this.error(node, `The module ${node.text} exists natively only through its members (${node.text}.name).`);
    if (resolved.flags & ts.SymbolFlags.Class || this.classRef(node)) return this.error(node, `The class ${node.text} exists natively only through \`new\` and its static members.`);
    const decl = resolved.valueDeclaration ?? resolved.declarations?.[0];
    if (decl && this.isApi(decl)) return this.error(node, `${node.text} must be called, not used as a value.`);
    if (decl?.getSourceFile().isDeclarationFile) return this.error(node, `${node.text} is not available natively.`);
    if ((this.generics.has(resolved) || this.localGenerics.has(resolved)) && !this.isLvalue(node)) {
      return this.error(node, `${node.text} is generic: pass it as a callback that calls it (x => ${node.text}(x)), so its types are known.`);
    }
    const captured = this.captureRead(node);
    const x: Expr = captured ?? { e: "id", name: this.idName(node), fnRef: this.functionSymbols.has(resolved) || undefined };
    const value = this.valueSymbol(node);
    const box = this.boxAt(value, node);
    return this.unwrapIfNarrowed(box ? { e: "prop", obj: captured ?? { e: "id", name: box }, name: "value" } : x, node, resolved);
  }

  /** A nullable value TypeScript has narrowed to non-null here is force-unwrapped. */
  private unwrapIfNarrowed(x: Expr, node: ts.Node, symbol: ts.Symbol): Expr {
    if (this.isLvalue(node)) return x;
    const declared = this.checker.getTypeOfSymbol(symbol);
    const here = this.typeOf(node);
    // A caught value (or a cause) narrowed to a primitive (`typeof e === "string"`): the value its native error carries (adapters2).
    if (this.thrownValues && declared.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any) && this.isCaught(node)) {
      const value = this.thrownAs(x, here, node);
      if (value) return value;
    }
    // Narrowed to exactly null (`let found: T | null = null` set only inside a closure, which TypeScript doesn't see): no unwrap.
    const read: Expr = this.isNullable(declared) && !this.isNullable(here) && !(here.flags & (ts.TypeFlags.Never | ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) ? { e: "unwrap", x } : x;
    const member = this.fromUnion(read, node, declared, here);
    if (member) return member;
    // A native error narrowed to an error class (`if (e instanceof NotFound) e.code`): the object it carries.
    if (this.errorClasses && !this.isNullable(here) && here.getSymbol() && this.objectClasses.has(here.getSymbol()!) && (declared.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any) || this.checker.getNonNullableType(declared).getSymbol()?.name === "Error")) {
      const to = this.ty(here, node);
      if (this.isErrorClass(to) && this.ty(declared, node).k === "rt") return { e: "unwrap", x: this.errorObj(x, (to as { name: string }).name) };
    }
    // Narrowed to a subclass (`if (s instanceof Circle) s.radius`): a downcast natively.
    const [from, to] = [this.objectClassName(this.checker.getNonNullableType(declared)), this.objectClassName(this.checker.getNonNullableType(here))];
    if (!from || !to || from === to || this.isNullable(here) || !this.supertypes(to).has(from)) return read;
    return { e: "downcast", x: read, cls: to };
  }

  /** The app's class or protocol a type is, if it is exactly one. */
  private objectClassName(type: ts.Type): string | undefined {
    const symbol = type.aliasSymbol ?? type.getSymbol();
    if (!symbol || type.isUnion() || type.isIntersection()) return undefined;
    const name = this.isClassType(type) ? this.ty(type, symbol.valueDeclaration ?? symbol.declarations![0]!) : undefined;
    return name?.k === "class" && (this.isObjectClass(name.name) || this.protocolByName(name.name)) ? name.name : undefined;
  }

  private isObjectClass(name: string): boolean {
    return [...this.objectClasses.keys()].some((s) => this.className(s) === name) || this.instances.has(name);
  }

  /** `x instanceof C`. In a `catch`, `e instanceof Error` is always true natively (only `new Error(…)` is thrown). */
  private instanceOf(node: ts.BinaryExpression, ctx: Ctx): Expr {
    const right = ts.isIdentifier(node.right) ? this.resolveAlias(this.checker.getSymbolAtLocation(node.right)) : undefined;
    if (right?.name === "Error" && right.declarations?.[0]?.getSourceFile().isDeclarationFile && this.ty(this.typeOf(node.left), node.left).k === "rt") {
      // Unless it carries a thrown value that isn't an Error (adapters2).
      return this.thrownValues ? this.some(this.thrownObj(this.expr(node.left, ctx)), true) : { e: "bool", v: true };
    }
    // `e instanceof TypeError` (RangeError, SyntaxError…) of a caught error (rest): the runtime's errors carry their class's name.
    if (right && /^(Type|Range|Syntax|Reference|URI|Eval)Error$/.test(right.name) && right.declarations?.[0]?.getSourceFile().isDeclarationFile && this.ty(this.typeOf(node.left), node.left).k === "rt") {
      return { e: "bin", op: "==", l: { e: "op", op: "error.name", args: [this.expr(node.left, ctx)] }, r: { e: "str", v: right.name } };
    }
    const cls = this.errorClasses ? this.classRef(node.right) : undefined;
    const errorCls = cls && this.objectClasses.has(cls) && this.isErrorClass({ k: "class", name: this.className(cls) }) ? this.className(cls) : undefined;
    const libError = right?.name === "Error" && !!right.declarations?.[0]?.getSourceFile().isDeclarationFile;
    if (this.errorClasses && (errorCls || libError) && !(this.typeOf(node.left).flags & ts.TypeFlags.Any)) {
      // An object of an error class is an Error; a native error is an object of an error class when it carries one.
      const leftTy = this.tyOfExpr(node.left);
      if (libError && this.isErrorClass(leftTy.k === "optional" ? leftTy.of : leftTy)) {
        if (leftTy.k !== "optional") return this.isPure(node.left) ? { e: "bool", v: true } : this.error(node.left, "instanceof Error of a computed object: read it into a variable first.");
        return this.some(this.expr(node.left, ctx));
      }
      if (errorCls && leftTy.k === "rt" && leftTy.name === "Error") return this.some(this.errorObj(this.expr(node.left, ctx), errorCls));
    }
    // adapters2: an `unknown` holding an error (`u instanceof Error`, `u instanceof Failure`).
    const leftU = this.thrownValues && this.typeOf(node.left).flags & ts.TypeFlags.Unknown && !this.isCaught(node.left) ? this.unionDecl(this.tyOfExpr(node.left)) : undefined;
    if (leftU && (libError || errorCls)) {
      if (!this.isPure(node.left)) return this.impure(node.left, "instanceof of an `unknown`");
      const x = this.expr(node.left, ctx);
      const tag = this.unionTag(T.rt("Error"));
      const err: Expr = { e: "uget", x: { e: "unwrap", x }, u: leftU.name, tag, ty: T.rt("Error") };
      const test = libError ? this.some(this.thrownObj(err), true) : this.some(this.errorObj(err, errorCls!));
      return this.both(this.both(this.some(x), { e: "uis", x: { e: "unwrap", x }, u: leftU.name, tag }), test);
    }
    const classSymbol = this.classRef(node.right);
    const decl = classSymbol && this.objectClasses.get(classSymbol);
    if (!decl) return this.error(node.right, "instanceof works with the app's classes natively (and `e instanceof Error` in a catch).");
    if (decl.typeParameters?.length) return this.error(node.right, "instanceof a generic class is not supported natively (its instantiations are different classes).");
    const leftType = this.typeOf(node.left);
    const viaUnion = this.unionInstanceOf(node, ctx, this.className(classSymbol));
    if (viaUnion) return viaUnion;
    if (!this.objectClassName(this.checker.getNonNullableType(leftType))) return this.error(node.left, "instanceof tests a value of the app's classes or of an interface they implement natively.");
    const test = (x: Expr): Expr => ({ e: "instanceOf", x, cls: this.className(classSymbol!) });
    if (!this.isNullable(leftType)) return test(this.expr(node.left, ctx));
    // `null instanceof C` is false: the optional is tested first (and read twice).
    if (!this.isPure(node.left)) return this.error(node.left, "instanceof on a nullable computed value: read it into a variable first.");
    const x = this.expr(node.left, ctx);
    const optional = x.e === "unwrap" ? x.x : x;
    return { e: "bin", op: "&&", l: { e: "bin", op: "!=", l: optional, r: { e: "nil" } }, r: test({ e: "unwrap", x: optional }) };
  }

  private isLvalue(node: ts.Node): boolean {
    const target = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node ? node.parent : node;
    const parent = target.parent;
    return (ts.isBinaryExpression(parent) && parent.left === target && this.isAssignment(parent.operatorToken.kind)) ||
      ((ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) && this.isIncrement(parent));
  }

  private property(node: ts.PropertyAccessExpression, ctx: Ctx): Expr {
    const settled = this.settledProp(node, ctx);
    if (settled) return settled;
    const member = this.enumValue(node);
    if (member !== undefined) {
      if (typeof member === "string") return { e: "str", v: member };
      return Number.isInteger(member) ? { e: "int", v: String(member) } : { e: "double", v: String(member) };
    }
    const unqualified = this.unNamespace(node);
    if (unqualified !== node) return this.identifier(unqualified as ts.Identifier);
    const typedProp = this.taProperty(node, ctx);
    if (typedProp) return typedProp;
    const mapSetProp = this.mcProperty(node, ctx);
    if (mapSetProp) return mapSetProp;
    const sup = this.superProperty(node, false);
    // A getter (or setter) that can throw.
    const throws = this.accessorThrows(node) ? { throws: true } : {};
    if (sup) return { ...sup, ...throws } as Expr;
    const accessor = this.staticAccessor(node);
    if (accessor) return { e: "call", callee: { e: "id", name: accessor.get }, args: [], ...throws };
    const staticField = this.staticField(node);
    // `if (C.instance === null) C.instance = new C(); return C.instance;`: narrowed like a variable.
    const staticSymbol = staticField && this.checker.getSymbolAtLocation(node.name);
    if (staticField && staticSymbol) return this.unwrapIfNarrowed(staticField, node, staticSymbol);
    if (staticField) return staticField;
    const memberDecl = this.checker.getSymbolAtLocation(node.name)?.valueDeclaration;
    // A getter of an object literal (rest2): its protocol method.
    if (this.isLiteralAccessor(node)) {
      const getter = this.checker.getSymbolAtLocation(node.name)!.declarations!.find(ts.isGetAccessor);
      if (!getter) return this.error(node, "This object-literal property has a setter only: JavaScript reads undefined, which its native type can't hold.");
      return { e: "invoke", obj: this.expr(node.expression, ctx), name: `get__${node.name.text}`, args: [], ...(this.throws(getter) ? { throws: true } : {}) };
    }
    if (memberDecl && (ts.isMethodDeclaration(memberDecl) || ts.isMethodSignature(memberDecl)) && (this.ownerOf(memberDecl) || this.isLiteralMethod(memberDecl))) {
      return this.error(node, "A method can only be called natively (JavaScript would lose its `this`); wrap it in an arrow function.");
    }
    const name = this.memberName(node.name);
    const objType = this.typeOf(node.expression);
    if (ts.isIdentifier(node.expression) && node.expression.text === "Math" && name === "PI") return { e: "op", op: "math.pi", args: [] };
    if (name === "description" && this.isSymbol(objType) && !this.isNullable(objType)) return { e: "op", op: "sym.description", args: [this.expr(node.expression, ctx)] };
    const constant = ts.isIdentifier(node.expression) ? MATH_CONSTANTS[`${node.expression.text}.${name}`] : undefined;
    if (constant !== undefined) return { e: "double", v: /[.e]/.test(String(constant)) ? String(constant) : `${constant}.0` };
    if (ts.isIdentifier(node.expression) && node.expression.text === "Number" && (name === "POSITIVE_INFINITY" || name === "NaN")) return { e: "op", op: "math.fn", args: [{ e: "str", v: name === "NaN" ? "NaN" : "Infinity" }] };
    if (ts.isIdentifier(node.expression) && node.expression.text === "Number" && name === "NEGATIVE_INFINITY") return { e: "neg", x: { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] } };
    const chain = (ts.isOptionalChain(node) && !node.questionDotToken && this.liveChain(node)) || undefined;
    if (node.questionDotToken && name === "length" && this.isNullable(objType)) {
      const of = this.checker.getNonNullableType(objType);
      if (this.isArray(of) || this.isString(of)) return this.optionalOn(node.expression, this.expr(node.expression, ctx), (o) => ({ e: "op", op: this.isArray(of) ? "arr.length" : "str.length", args: [o] }));
    }
    if (name === "length" && this.isArray(this.checker.getNonNullableType(objType))) return { e: "op", op: "arr.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "length" && this.isMixedTuple(objType)) {
      if (!this.isPure(node.expression)) return this.error(node, "Read the tuple into a variable first: its length is known statically.");
      return { e: "double", v: `${this.checker.getTypeArguments(objType as ts.TypeReference).length}.0` };
    }
    if (name === "length" && this.isString(this.checker.getNonNullableType(objType))) return { e: "op", op: "str.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "message" && this.ty(objType, node).k === "rt") return this.errorRead(this.expr(node.expression, ctx), "message");
    // `e.cause` (adapters2): a native error, THROWN undefined when there is none. Reads only.
    if (name === "cause" && this.thrownValues && !this.isLvalue(node) && this.isErrorCause(node)) {
      const objTy = this.ty(this.checker.getNonNullableType(objType), node.expression);
      if (!this.isNullable(objType) && (objTy.k === "rt" || this.isErrorClass(objTy))) {
        const cause = this.causeRead(this.expr(node.expression, ctx), objTy.k !== "rt");
        return this.thrownAs(cause, this.typeOf(node), node) ?? cause;
      }
    }
    if ((name === "name" || name === "stack" || name === "cause") && !node.questionDotToken && (this.ty(objType, node) as { name?: string }).name === "Error") {
      if (name !== "name") return this.error(node, `Unsupported: an error's \`${name}\` natively${name === "stack" ? " (each platform has its own call stack)" : ""}; keep what you need in a field of an error class.`);
      return this.errorRead(this.expr(node.expression, ctx), "name");
    }
    // `err?.message` of an `Error | null`: the message when there is an error.
    if (name === "message" && node.questionDotToken && this.ty(this.checker.getNonNullableType(objType), node).k === "rt") {
      if (!this.isPure(node.expression)) return this.impure(node, "`?.message`");
      const err = this.expr(node.expression, ctx);
      return { e: "cond", c: this.some(err), a: { e: "op", op: "error.text", args: [{ e: "unwrap", x: err }] }, b: { e: "nil" } };
    }
    const iter = this.iterProp(node, ctx);
    if (iter) return iter;
    const shared = this.unionProp(node, objType, ctx);
    if (shared) return shared;
    const obj = this.expr(node.expression, ctx);
    // Record<string, T>: a map lookup, optional unless TypeScript narrowed it.
    if (objType.getStringIndexType() && objType.getProperties().length === 0) {
      const get: Expr = { e: "op", op: "map.get", args: [obj, { e: "str", v: name }] };
      return this.isNullable(this.typeOf(node)) ? this.flat(get, (this.ty(objType, node.expression) as { of?: Ty }).of) : { e: "unwrap", x: get };
    }
    const x: Expr = { e: "prop", obj, name, optional: (!!node.questionDotToken && this.isNullable(objType) && !this.presets.has(node.expression)) || undefined, chain, ...throws };
    const symbol = this.checker.getSymbolAtLocation(node.name);
    return symbol ? this.unwrapIfNarrowed(x, node, symbol) : x;
  }

  private binary(node: ts.BinaryExpression, ctx: Ctx): Expr {
    const kind = node.operatorToken.kind;
    const lt = this.typeOf(node.left);
    const rt = this.typeOf(node.right);
    if (this.isAssignment(kind)) {
      // A destructuring assignment's value is its right side (`[a, b] = pair` gives `pair`).
      const pattern = this.destructuring(node);
      if (pattern) {
        const { stmts, value } = this.destructure(pattern, ctx, true);
        return value ? { e: "seq", body: stmts, x: value, ty: this.tyOfExpr(node) } : this.error(node, "Unsupported: this destructuring assignment as a value; make it a statement.");
      }
      return this.updateValue(node, ctx);
    }
    if (kind === ts.SyntaxKind.InstanceOfKeyword) return this.instanceOf(node, ctx);
    const order: Partial<Record<ts.SyntaxKind, BinOp>> = { [ts.SyntaxKind.LessThanToken]: "<", [ts.SyntaxKind.LessThanEqualsToken]: "<=", [ts.SyntaxKind.GreaterThanToken]: ">", [ts.SyntaxKind.GreaterThanEqualsToken]: ">=" };
    if (order[kind] && (this.isDate(lt) || this.isDate(rt))) {
      // Dates compare by their time values (valueOf), as numbers.
      if (!this.isDate(lt) || !this.isDate(rt)) return this.error(node, "Compare a date with getTime() natively.");
      const time = (x: ts.Expression): Expr => ({ e: "op", op: "date.call", args: [this.expr(x, ctx), { e: "str", v: "time" }], ty: T.double });
      return { e: "bin", op: order[kind]!, l: time(node.left), r: time(node.right) };
    }
    const union = this.unionBinary(node, ctx);
    if (union) return union;
    if (kind === ts.SyntaxKind.QuestionQuestionToken) {
      const ty = this.tyOfExpr(node);
      if (this.isNullType(lt) && this.isPure(node.left)) return this.expr(node.right, ctx, ty);
      // A union result (`flag ?? "unset"`: `boolean | string`): the left side goes into the union first.
      const u = ty.k === "optional" ? ty.of : ty;
      const left = this.expr(node.left, ctx, u.k === "union" ? T.optional(u) : undefined);
      // `x ?? y` where TypeScript narrowed x: keep it optional, so `??` stays meaningful natively.
      return { e: "coalesce", l: left.e === "unwrap" ? left.x : left, r: this.expr(node.right, ctx, ty) };
    }
    if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
      if (this.isBoolean(this.typeOf(node))) return this.cond(node, ctx);
      return this.logical(node, ctx);
    }
    if (kind === ts.SyntaxKind.PlusToken && (this.isString(lt) || this.isString(rt))) {
      const flat: (string | Expr)[] = [];
      const add = (n: ts.Expression) => {
        if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.PlusToken && this.isString(this.typeOf(n))) {
          add(n.left);
          add(n.right);
        } else if (ts.isStringLiteral(n)) flat.push(n.text);
        else flat.push(this.str(n, ctx));
      };
      add(node);
      return { e: "tpl", parts: flat };
    }
    const big = this.bigBinary(node, ctx);
    if (big) return big;
    if (this.isTypedArray(this.typeOf(node.left)) && this.isTypedArray(this.typeOf(node.right))) {
      return this.error(node, "Comparing two typed arrays is not supported natively (JavaScript compares the views' identities); compare an id you keep with each.");
    }
    const ops: Partial<Record<ts.SyntaxKind, BinOp>> = {
      [ts.SyntaxKind.PlusToken]: "+",
      [ts.SyntaxKind.MinusToken]: "-",
      [ts.SyntaxKind.AsteriskToken]: "*",
      [ts.SyntaxKind.SlashToken]: "/",
      [ts.SyntaxKind.PercentToken]: "%",
      [ts.SyntaxKind.LessThanToken]: "<",
      [ts.SyntaxKind.LessThanEqualsToken]: "<=",
      [ts.SyntaxKind.GreaterThanToken]: ">",
      [ts.SyntaxKind.GreaterThanEqualsToken]: ">=",
      [ts.SyntaxKind.EqualsEqualsEqualsToken]: "==",
      [ts.SyntaxKind.ExclamationEqualsEqualsToken]: "!=",
      [ts.SyntaxKind.EqualsEqualsToken]: "==",
      [ts.SyntaxKind.ExclamationEqualsToken]: "!=",
    };
    if (kind === ts.SyntaxKind.AsteriskAsteriskToken) return { e: "op", op: "math.pow", args: [this.expr(node.left, ctx, T.double), this.expr(node.right, ctx, T.double)] };
    if (kind === ts.SyntaxKind.InKeyword) {
      const map = this.checker.getNonNullableType(rt);
      if (!map.getStringIndexType() || map.getProperties().length) return this.error(node, "`in` is supported on Record<string, T> maps natively.");
      return { e: "op", op: "map.has", args: [this.expr(node.right, ctx), this.expr(node.left, ctx, T.string)] };
    }
    const bit = BIT_OPS[kind];
    if (bit) return { e: "op", op: bit, args: [this.expr(node.left, ctx), this.expr(node.right, ctx)] };
    let op = ops[kind];
    if (!op) return this.error(node, `Unsupported: the operator ${node.operatorToken.getText()} between these types has no native form; write the operation out (a comma expression as separate statements, a test as an if).`);
    if (op === "==" || op === "!=") {
      // `listeners.filter((l) => l !== fn)`: Swift closures have no identity.
      const isFn = (t: ts.Type) => this.checker.getNonNullableType(t).getCallSignatures().length > 0;
      if (isFn(lt) && isFn(rt)) {
        return this.error(node, "Comparing two functions (`===` / `!==`) is not supported natively: a Swift closure has no identity. Keep an id beside each function (`{ id, fn }`, a counter) and compare the ids, or return an unsubscribe function from where it is added.");
      }
      // Both sides always null / undefined (`n === null` for `const n: null`): known statically.
      if (this.isNullType(lt) && this.isNullType(rt) && (this.isPure(node.left) || node.left.kind === ts.SyntaxKind.NullKeyword) && (this.isPure(node.right) || node.right.kind === ts.SyntaxKind.NullKeyword)) {
        const strict = kind === ts.SyntaxKind.EqualsEqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
        const same = !strict || (lt.flags & ts.TypeFlags.Null) === (rt.flags & ts.TypeFlags.Null);
        return { e: "bool", v: op === "==" ? same : !same };
      }
      const isNil = (n: ts.Expression) => n.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(n) && n.text === "undefined");
      if (isNil(node.left) || isNil(node.right)) {
        const other = isNil(node.left) ? node.right : node.left;
        const strict = kind === ts.SyntaxKind.EqualsEqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
        const members = this.members(this.typeOf(other));
        if (strict && members.some((t) => t.flags & ts.TypeFlags.Null) && members.some((t) => t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void))) {
          // `xs[i] === null` on an array of optionals: natively null and undefined are one nil, but here undefined
          // means "no element": the index is out of range.
          let read = other;
          while (ts.isParenthesizedExpression(read)) read = read.expression;
          if (ts.isElementAccessExpression(read) && this.isArray(this.checker.getNonNullableType(this.typeOf(read.expression))) && this.isPure(read.expression) && (this.isPure(read.argumentExpression) || ts.isNumericLiteral(read.argumentExpression))) {
            const [arr, i] = [this.expr(read.expression, ctx), this.expr(read.argumentExpression, ctx, T.int)];
            const inRange: Expr = { e: "bin", op: "&&", l: { e: "bin", op: ">=", l: i, r: { e: "int", v: "0" } }, r: { e: "bin", op: "<", l: i, r: { e: "op", op: "arr.length", args: [arr] } } };
            const test: Expr = (isNil(node.left) ? node.left : node.right).kind === ts.SyntaxKind.NullKeyword ? { e: "bin", op: "&&", l: inRange, r: { e: "bin", op: "==", l: { e: "index", obj: arr, index: i }, r: { e: "nil" } } } : { e: "not", x: inRange };
            return op === "==" ? test : { e: "not", x: test };
          }
          return this.error(node, "`=== null` / `=== undefined` on a value that may be either: natively null and undefined are one nil. Use `== null` (either one), or narrow the value first; to keep them apart, hold it in an `Opt<T>` (`opt(v)`, `optNull()`, `optUndefined()` from @nuclo/native-ts/adapters).");
        }
        // A narrowed read is `x!`: what is tested is the optional itself (Rust has no `is_some` on the value).
        const tested = this.expr(other, ctx);
        return { e: "bin", op, l: tested.e === "unwrap" ? tested.x : tested, r: { e: "nil" } };
      }
      // Objects, arrays and maps: the same one or not (`[1] === [1]` is false).
      const ref = this.checker.getNonNullableType(lt);
      const isMap = !!ref.getStringIndexType() && !ref.getProperties().length && !this.isString(ref);
      if (this.isClassType(ref) || this.isLibPromise(ref) || this.isArray(ref) || isMap || this.mcKind(ref) || this.weakKind(ref) || this.abName(ref)) op = op === "==" ? "===" : "!==";
    }
    // JavaScript orders strings by UTF-16 units; Swift and Rust by other rules.
    if (["<", "<=", ">", ">="].includes(op) && this.isString(lt) && this.isString(rt)) {
      return { e: "bin", op, l: { e: "op", op: "str.compare", args: [this.expr(node.left, ctx), this.expr(node.right, ctx)] }, r: { e: "int", v: "0" } };
    }
    if ((op === "==" || op === "!=") && this.isString(this.checker.getNonNullableType(lt)) && this.isString(this.checker.getNonNullableType(rt))) {
      return { e: "bin", op, l: this.expr(node.left, ctx), r: this.expr(node.right, ctx), text: true };
    }
    if (this.isNumber(lt) && this.isNumber(rt)) {
      if (this.isWideRem(node)) return { e: "op", op: "int.wideRem", args: [this.wideInt(node.left, ctx), this.expr(node.right, ctx, T.int)] };
      // As numKind says (Int constants whose result leaves an Int's range are computed in Doubles).
      const num = op === "/" || (["+", "-", "*", "%"].includes(op) && this.numKind(node) === "double") || this.numKind(node.left) === "double" || this.numKind(node.right) === "double" ? T.double : T.int;
      // `%` of Doubles is C's fmod (truncated, the dividend's sign), as in JavaScript.
      if (op === "%" && num.k === "double") return { e: "op", op: "math.fn", args: [{ e: "str", v: "fmod" }, this.expr(node.left, ctx, num), this.expr(node.right, ctx, num)] };
      return { e: "bin", op, l: this.expr(node.left, ctx, num), r: this.expr(node.right, ctx, num) };
    }
    return { e: "bin", op, l: this.expr(node.left, ctx), r: this.expr(node.right, ctx) };
  }

  private object(node: ts.ObjectLiteralExpression, ctx: Ctx, want?: Ty): Expr {
    const target = want?.k === "optional" ? want.of : want;
    if (target?.k === "union") return this.unionObject(node, ctx, target.name);
    const ctxType = this.checker.getContextualType(node) ?? this.typeOf(node);
    const ty = target && target.k !== "fn" ? target : this.ty(this.checker.getNonNullableType(ctxType), node);
    if (ty.k === "rt" && ty.name === "Style") return this.style(node, ctx);
    // A hand-written iterator (`{ next() { … } }` as an `Iterator<T>`) and its results (rest2).
    const iterShape = ty.k === "class" ? [...this.genShapes.values()].find((s) => !s.async && (s.base === ty.name || s.result === ty.name)) : undefined;
    if (iterShape) return iterShape.base === (ty as { name: string }).name ? this.iterLiteral(node, ctx, iterShape) : this.iterResultLiteral(node, ctx, iterShape);
    if (ty.k === "class" && !this.shapeProtocols.has(ty.name) && this.allClasses().some((c) => c.name === ty.name)) {
      const cls = this.allClasses().find((c) => c.name === ty.name)!;
      // Later members win, as in JavaScript: `{ ...base, x: 1 }` and `{ x: 1, ...base }` differ.
      const given = new Map<string, ts.Expression | Expr>();
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop.initializer);
        else if (ts.isShorthandPropertyAssignment(prop)) given.set(prop.name.text, prop.name);
        else if (ts.isSpreadAssignment(prop)) {
          if (!this.isPure(prop.expression)) this.error(prop, "Spread a variable or a property (natively it is read once per field).");
          else if (this.isNullable(this.typeOf(prop.expression))) this.error(prop, "Spreading a value that may be null: narrow it first.");
          else {
            const sourceType = this.typeOf(prop.expression);
            const source = this.expr(prop.expression, ctx);
            for (const field of cls.fields) {
              const from = sourceType.getProperty(field.name);
              if (!from) continue;
              const read: Expr = { e: "prop", obj: source, name: field.name };
              const target = field.ty.k === "optional" ? field.ty.of : field.ty;
              given.set(field.name, target.k === "double" && this.isNumber(this.checker.getTypeOfSymbol(from)) && this.slotKind(from) === "int" ? { e: "toDouble", x: read } : read);
            }
          }
        } else this.error(prop, "Unsupported object literal member (methods and computed keys can't build a native class).");
      }
      const args: [string, Expr][] = [];
      for (const field of cls.fields) {
        const value = given.get(field.name);
        if (value) args.push([field.name, "kind" in value ? this.expr(value as ts.Expression, ctx, field.ty) : (value as Expr)]);
      }
      // The order JavaScript lists its keys in (checked against Object.keys / for…in at the end); unknown after a spread of another type.
      const spreadsOther = node.properties.some((p) => {
        if (!ts.isSpreadAssignment(p)) return false;
        const from = this.ty(this.checker.getNonNullableType(this.typeOf(p.expression)), p);
        return from.k !== "class" || from.name !== cls.name;
      });
      this.literalKeys.push({ cls: cls.name, keys: spreadsOther ? undefined : [...given.keys()], node });
      return { e: "new", cls: cls.name, args };
    }
    if (ty.k === "map" && node.properties.some((p) => ts.isSpreadAssignment(p) || ts.isShorthandPropertyAssignment(p) || (ts.isPropertyAssignment(p) && ts.isComputedPropertyName(p.name)))) {
      const made = this.mapLiteralSteps(node, ty, ctx);
      if (made) return made;
    }
    if (ty.k === "map") {
      return {
        e: "dict",
        of: ty.of,
        entries: node.properties.map((prop) => {
          if (!ts.isPropertyAssignment(prop)) return ["", this.error(prop, "Unsupported map entry (it is read at compile time): write `key: value`, without spreads, shorthands or methods.")];
          if (ts.isComputedPropertyName(prop.name)) return ["", this.error(prop.name, "A computed key (`{ [k]: v }`) in a map literal is not supported natively: set it after (`m[k] = v`).")];
          // A number key is its JavaScript text (`1.50` is "1.5"), which TypeScript gives.
          const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name) ? prop.name.text : "";
          return [key, this.expr(prop.initializer, ctx, ty.of)];
        }),
      };
    }
    const protocol = ty.k === "class" ? this.protocolByName(ty.name) : undefined;
    if (protocol) return this.protocolLiteral(node, protocol, ctx);
    if (ty.k === "class") return this.error(node, `${ty.name} is a class: create it with \`new\`, not an object literal.`);
    return this.error(node, "An object literal needs an interface type to become a native class.");
  }

  /**
   * A Style literal: nuclo-core's keys, strings, states and media blocks lowered to the native keys (styleAliases.ts),
   * enums for keyword values, Double for numbers, `...base` merged under it.
   */
  private style(node: ts.ObjectLiteralExpression, ctx: Ctx): Expr {
    let base: Expr | undefined;
    const given = new Map<string, Expr>();
    const media: Expr[] = [];
    const set = (key: string, value: Expr) => {
      // A shorthand written after a side resets it, as within one CSS rule.
      for (const reset of SHORTHAND_RESETS[key] ?? []) given.delete(reset);
      given.delete(key);
      given.set(key, value);
    };
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        if (base || given.size) this.error(prop, "A style spread must come first.");
        base = this.expr(prop.expression, ctx);
        continue;
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        this.error(prop, `Write ${prop.name.text}: ${prop.name.text} in a style.`);
        continue;
      }
      if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
        this.error(prop, "Unsupported style entry (a style is read at compile time): write `key: value` or a leading `...otherStyle`.");
        continue;
      }
      this.styleEntry(prop.name.text, prop.initializer, ctx, set, media);
    }
    if (media.length) given.set("media", { e: "arr", of: { k: "class", name: "MediaRule" }, items: media });
    return this.styleOf(given, base);
  }

  /** One entry of a style literal. */
  private styleEntry(key: string, init: ts.Expression, ctx: Ctx, set: (key: string, value: Expr) => void, media: Expr[]) {
    const state = STATE_ALIASES[key] ?? (key.startsWith("&") ? STYLE_SELECTORS[key.slice(1)] : key === "placeholder" ? "placeholder" : undefined);
    if (key.startsWith("&") && !state) {
      this.error(init, `The selector "${key}" has no native equivalent; the state keys do (${Object.keys(STYLE_SELECTORS).map((k) => `&${k}`).join(", ")}).`);
      return;
    }
    if (state === "placeholder") {
      // `::placeholder` paints the placeholder's text: its colour is what a field has for it.
      const style = this.constValue(init);
      const color = style !== DYNAMIC && style && typeof style === "object" ? (style as Record<string, unknown>).color : undefined;
      if (typeof color !== "string") this.error(init, "Write placeholder as { color: \"…\" } with a literal colour.");
      else set("placeholderColor", { e: "str", v: String(this.theme.colors?.[color] ?? color) });
      return;
    }
    if (state) {
      set(state, this.expr(init, ctx, T.rt("Style")));
      return;
    }
    if (UNSUPPORTED_PSEUDOS.has(key)) {
      this.error(init, `The pseudo key ${key} has no native equivalent (generated content, visited links and form validation don't exist natively).`);
      return;
    }
    const screen = this.theme.screens?.[key];
    if (key.startsWith("@") || screen !== undefined) {
      try {
        const range = parseMedia(screen ?? key);
        const bound = (v: number | undefined): Expr => (v === undefined ? { e: "nil" } : { e: "double", v: v.toFixed(1) });
        media.push({ e: "rt", name: "MediaRule", args: [bound(range.min), bound(range.max), this.expr(init, ctx, T.rt("Style"))] });
      } catch (error) {
        if (!(error instanceof StyleError)) throw error;
        this.error(init, error.message);
      }
      return;
    }
    if (key === "raw") {
      if (!ts.isObjectLiteralExpression(init)) return void this.error(init, "Write raw as an object literal.");
      for (const prop of init.properties) {
        if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) this.error(prop, "Unsupported raw entry (read at compile time): write `name: value` with a plain or quoted name.");
        else this.styleEntry(camel(prop.name.text), prop.initializer, ctx, set, media);
      }
      return;
    }
    if (key === "animation") {
      const animation = this.animation(init, ctx);
      if (animation) set("animation", animation);
      return;
    }
    if (key === "width" && !this.isNumber(this.typeOf(init)) && this.constValue(init) === DYNAMIC && !ts.isConditionalExpression(init)) {
      const pct = ts.isTemplateExpression(init) && init.templateSpans.length === 1 && init.templateSpans[0]!.literal.text === "%";
      if (pct || ts.isParenthesizedExpression(init)) return void set("widthPct", this.percent(init, ctx));
    }
    // A value known now: read as CSS (tokens, units, shorthands), each native key a literal.
    const value = this.constValue(init);
    if (value !== DYNAMIC) {
      for (const [k, v] of this.lowered(key, value, init)) set(k, this.styleLiteral(k, v));
      return;
    }
    // A choice between two such values: each native key a choice.
    if (ts.isConditionalExpression(init)) {
      const a = this.constValue(init.whenTrue);
      const b = this.constValue(init.whenFalse);
      if (a !== DYNAMIC && b !== DYNAMIC) {
        const left = new Map(this.lowered(key, a, init.whenTrue));
        const right = new Map(this.lowered(key, b, init.whenFalse));
        const keys = new Set([...left.keys(), ...right.keys()]);
        for (const k of keys) {
          if (!left.has(k) || !right.has(k)) {
            this.error(init, `Both sides of this choice must set ${k}: give each the same kind of value.`);
            continue;
          }
          set(k, { e: "cond", c: this.cond(init.condition, ctx), a: this.styleLiteral(k, left.get(k)), b: this.styleLiteral(k, right.get(k)) });
        }
        return;
      }
    }
    // A value known at run time.
    for (const target of STYLE_ALIASES[key] ?? [key]) this.dynamicStyleEntry(target, init, ctx, set);
  }

  /** lowerEntry() with the theme, its errors reported at `at`. */
  private lowered(key: string, value: unknown, at: ts.Node): [string, unknown][] {
    try {
      return lowerEntry(key, value, this.theme);
    } catch (error) {
      if (!(error instanceof StyleError)) throw error;
      this.error(at, error.message);
      return [];
    }
  }

  /** A native key's value known at compile time. */
  private styleLiteral(key: string, value: unknown): Expr {
    if (ENUM_VALUES[key] || STYLE_ENUMS[key]) return { e: "enum", type: STYLE_ENUMS[key]!, member: camel(String(value)) };
    if (typeof value === "number") return { e: "double", v: Number.isInteger(value) ? value.toFixed(1) : String(value) };
    return { e: "str", v: String(value) };
  }

  /** A style key whose value is computed at run time: numbers, colours, fonts, `${n}px` and `1px solid ${color}`. */
  private dynamicStyleEntry(key: string, init: ts.Expression, ctx: Ctx, set: (key: string, value: Expr) => void) {
    const type = this.typeOf(init);
    const enumType = STYLE_ENUMS[key];
    if (enumType) return void set(key, this.styleEnum(init, enumType, ctx));
    if (this.isNumber(type)) {
      if (key === "flexGrow") return void set("flex", this.expr(init, ctx, T.double));
      if ((NATIVE_STYLE_KEYS as readonly string[]).includes(key) && !COLOR_KEYS.has(key)) return void set(key, this.expr(init, ctx, T.double));
    }
    if (COLOR_KEYS.has(key) || key === "fontFamily") return void set(key, this.expr(init, ctx, T.string));
    // `${n}px`: the number.
    if (LENGTH_KEYS.has(key) && ts.isTemplateExpression(init) && init.head.text === "" && init.templateSpans.length === 1 && init.templateSpans[0]!.literal.text === "px") {
      return void set(key, this.expr(init.templateSpans[0]!.expression, ctx, T.double));
    }
    // `1px solid ${color}`: the width as written, the colour at run time.
    const border = /^border(Top|Right|Bottom|Left)?$/.exec(key);
    if (border && ts.isTemplateExpression(init) && init.templateSpans.length === 1 && init.templateSpans[0]!.literal.text.trim() === "") {
      const parsed = parseBorder(init.head.text);
      const side = border[1] ?? "";
      if (parsed.width !== undefined) set(side ? `border${side}Width` : "borderWidth", { e: "double", v: parsed.width.toFixed(1) });
      return void set(side ? `border${side}Color` : "borderColor", this.expr(init.templateSpans[0]!.expression, ctx, T.string));
    }
    this.error(init, `Write ${key} as a literal, a ternary of literals${LENGTH_KEYS.has(key) ? ", a number or `${n}px`" : COLOR_KEYS.has(key) ? " or a string" : ""}: it is read at compile time.`);
  }

  /** `` `${fade} 300ms ease-out infinite` ``: the keyframes const's frames and the timing written around it. */
  private animation(init: ts.Expression, ctx: Ctx): Expr | undefined {
    const frames = new Map<string, ts.ObjectLiteralExpression>();
    let text: string;
    const nameOf = (expr: ts.Expression): string | undefined => {
      if (!ts.isIdentifier(expr)) return undefined;
      const symbol = this.checker.getSymbolAtLocation(expr);
      const literal = symbol && this.keyframes.get(this.resolveAlias(symbol)!);
      if (!literal) return undefined;
      frames.set(expr.text, literal);
      return expr.text;
    };
    if (ts.isTemplateExpression(init)) {
      text = init.head.text;
      for (const span of init.templateSpans) {
        const name = nameOf(span.expression);
        const v = name ?? this.constValue(span.expression);
        if (v === DYNAMIC) return void this.error(span.expression, "An animation names a keyframes() const and writes its timing as literals.");
        text += String(v) + span.literal.text;
      }
    } else {
      const name = nameOf(init);
      if (!name) return void this.error(init, "Write animation as a template: `${name} 1s ease infinite`, with name a keyframes() const.");
      text = name;
    }
    try {
      // The stops' times only: their styles are lowered below, where each becomes a Style.
      const anim = parseAnimation(text, (name) => (frames.has(name) ? keyframeStops(Object.fromEntries(frames.get(name)!.properties.map((p) => [p.name!.getText().replace(/^["']|["']$/g, ""), {}]))) : undefined));
      const literal = frames.get(anim.name)!;
      const stops: Expr[] = [];
      for (const prop of literal.properties) {
        if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) || ts.isNumericLiteral(prop.name))) {
          stops.push(this.error(prop, "Unsupported keyframe (read at compile time): write a stop as `from: { … }`, `to: { … }` or `\"50%\": { … }`."));
          continue;
        }
        const style = this.expr(prop.initializer, ctx, T.rt("Style"));
        for (const selector of prop.name.text.split(",")) {
          const stop = selector.trim();
          const at = stop === "from" ? 0 : stop === "to" ? 1 : Number(stop.replace("%", "")) / 100;
          if (Number.isNaN(at)) stops.push(this.error(prop, `"${stop}" is not a keyframe stop (from, to or a percentage).`));
          else stops.push({ e: "rt", name: "KeyframeStop", args: [{ e: "double", v: at.toFixed(4) }, style] });
        }
      }
      return {
        e: "rt",
        name: "StyleAnimation",
        args: [
          { e: "arr", of: { k: "class", name: "KeyframeStop" }, items: stops },
          { e: "double", v: anim.duration.toFixed(1) },
          { e: "double", v: anim.delay.toFixed(1) },
          { e: "enum", type: "Easing", member: camel(anim.easing) },
          { e: "int", v: String(anim.iterations) },
          { e: "bool", v: anim.alternate },
        ],
      };
    } catch (error) {
      if (!(error instanceof StyleError)) throw error;
      this.error(init, error.message);
      return undefined;
    }
  }

  /** A Style value from its keys, in the order the Style declares them (Swift labels follow it). */
  private styleOf(given: Map<string, Expr>, base?: Expr): Expr {
    return { e: "style", props: this.styleKeys().filter((k) => given.has(k)).map((k) => [k, given.get(k)!]), base };
  }

  /** `"50%"` or `${n}%`: the number of percent, as a Double. */
  private percent(node: ts.Expression, ctx: Ctx): Expr {
    if (ts.isParenthesizedExpression(node)) return this.percent(node.expression, ctx);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const m = /^(-?\d+(?:\.\d+)?)%$/.exec(node.text);
      if (m) return { e: "double", v: m[1]!.includes(".") ? m[1]! : `${m[1]}.0` };
    } else if (ts.isTemplateExpression(node) && node.head.text === "" && node.templateSpans.length === 1 && node.templateSpans[0]!.literal.text === "%") {
      return this.expr(node.templateSpans[0]!.expression, ctx, T.double);
    }
    return this.error(node, "Write a percent width as a literal (\"50%\") or a template of one number (`${value}%`).");
  }

  private styleEnum(node: ts.Expression, type: string, ctx: Ctx): Expr {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return { e: "enum", type, member: camel(node.text) };
    if (ts.isParenthesizedExpression(node)) return this.styleEnum(node.expression, type, ctx);
    if (ts.isConditionalExpression(node)) {
      return { e: "cond", c: this.cond(node.condition, ctx), a: this.styleEnum(node.whenTrue, type, ctx), b: this.styleEnum(node.whenFalse, type, ctx) };
    }
    return this.error(node, `Write ${type} values as literals (or a ternary of literals).`);
  }

  /** The native Style keys, in the order the runtimes' Style initializers declare them (Swift labels follow it). */
  private styleKeys(): readonly string[] {
    return NATIVE_STYLE_KEYS;
  }


  // -------------------------------------------------------------------------
  // Functions and calls
  // -------------------------------------------------------------------------

  /** `ownDefaults`: a protocol method's function, which applies its own optional and default parameters (callers pass nil). */
  private lambda(node: ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration, ctx: Ctx, want?: Extract<Ty, { k: "fn" }>, ownDefaults = false): Expr {
    if (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) return this.asyncLambda(node, want);
    const signature = this.checker.getSignatureFromDeclaration(node);
    const declaredRet = signature ? signature.getReturnType() : undefined;
    let ret = want?.ret ?? this.sizedTy(node) ?? (declaredRet ? this.ty(declaredRet, node, this.slotKind(node)) : T.void);
    // `void | (() => void)` (onMount): an optional cleanup.
    const voidUnion = ret.k === "optional" && ret.of.k === "fn";
    if (want && declaredRet && ret.k !== "void" && !voidUnion && declaredRet.flags & ts.TypeFlags.Void) ret = T.void;
    const inner: Ctx = { async: false, ret, voidUnion, inTry: false };
    const params = this.params(node, ownDefaults ? inner : undefined);
    const destructures = node.parameters.some((p) => !ts.isIdentifier(p.name));
    const defaults = ownDefaults && params.some((p) => p.default);
    const body = node.body && !ts.isBlock(node.body) && ret.k !== "void" && !voidUnion && !destructures && !defaults ? this.expr(node.body, inner, ret) : this.body(node, inner);
    if (Array.isArray(body)) this.ownDefaults(params, node.parameters, body);
    const lambda: Extract<Expr, { e: "lambda" }> = { e: "lambda", params, ret, body };
    // One that can throw: as the slot it goes to (which then throws too), or caught where nothing could catch it.
    if (want?.throws || (!want && this.throws(node))) lambda.throws = true;
    else if (this.throws(node) && this.uncaughtValue(node) === "log") lambda.body = this.catchLog(Array.isArray(body) ? body : [{ s: "expr", x: body }]);
    noteOrigin([lambda], node);
    return lambda;
  }

  private call(node: ts.CallExpression, ctx: Ctx): Expr {
    if (this.typeOf(node).flags & ts.TypeFlags.Never && !ts.isExpressionStatement(node.parent) && !ts.isArrowFunction(node.parent)) {
      return this.error(node, "A call of a function that never returns is supported as a statement natively (it has no value); write `if (…) fail(…)` instead.");
    }
    const optional = this.optionalCall(node, ctx);
    if (optional) return optional.cond.e === "bool" ? optional.call : { e: "cond", c: optional.cond, a: optional.call, b: { e: "nil" } };
    const isArray = this.unionIsArray(node, ctx);
    if (isArray) return isArray;
    const callee = this.unNamespace(node.expression);
    // `o?.m(…)`, `o?.a.m(…)` of a method (of a class, a string, an array…): the call on the value when there is one
    // (arguments evaluated only then), else nil. The call is lowered as `o.m(…)` with `o` given (presets).
    let head: ts.Expression = callee;
    while (!node.questionDotToken && (ts.isPropertyAccessExpression(head) || ts.isElementAccessExpression(head) || ts.isCallExpression(head) || ts.isNonNullExpression(head)) && !(head as { questionDotToken?: ts.Node }).questionDotToken && ts.isOptionalChain(head)) head = head.expression;
    if (!node.questionDotToken && (ts.isPropertyAccessExpression(head) || ts.isElementAccessExpression(head) || ts.isCallExpression(head)) && head.questionDotToken && !this.presets.has(head.expression) && this.isNullable(this.typeOf(head.expression))) {
      const obj = head.expression;
      return this.optionalOn(obj, this.expr(obj, ctx), (o) => {
        this.presets.set(obj, o);
        try {
          return this.unchain(this.call(node, ctx));
        } finally {
          this.presets.delete(obj);
        }
      });
    }
    // (`o?.m()` where TypeScript narrowed `o` to an object is `o.m()`.)
    if (node.questionDotToken && this.isNullable(this.typeOf(node.expression))) {
      return this.error(node, "Unsupported: this optional call (?.()); narrow the value first (if (f) f()).");
    }
    const api = ts.isIdentifier(callee) ? this.apiName(callee) : undefined;
    if (api) return this.nuclo(api, node, ctx);
    const component = ts.isIdentifier(callee) ? this.nativeComponents.get(this.resolveAlias(this.checker.getSymbolAtLocation(callee))!) : undefined;
    if (component) return this.nativeView(component, node, ctx);

    const promise = this.promiseCall(node, callee, ctx);
    if (promise) return promise;
    const big = this.bigCall(node, callee, ctx);
    if (big) return big;
    const typed = this.taCall(node, callee, ctx);
    if (typed) return typed;
    const jsonDate = this.jsonDateCall(node, callee, ctx);
    if (jsonDate) return jsonDate;
    const mapSet = this.mcCall(node, callee, ctx);
    if (mapSet) return mapSet;
    if (ts.isIdentifier(callee)) {
      if (callee.text === "String" && node.arguments.length === 1) return this.str(node.arguments[0]!, ctx);
      if (callee.text === "Array" && this.isLibGlobal(callee)) return this.arrayCtor(node, ctx);
      if (callee.text === "Number") {
        // ToNumber: of a number it is the number (a Double), of a boolean 1 / 0, of text JavaScript's parse.
        const arg = node.arguments[0];
        if (!arg) return { e: "double", v: "0.0" };
        const t = this.checker.getNonNullableType(this.typeOf(arg));
        if (this.isNumber(this.typeOf(arg))) return this.expr(arg, ctx, T.double);
        if (t.flags & ts.TypeFlags.BooleanLike && !this.isNullable(this.typeOf(arg))) return { e: "cond", c: this.expr(arg, ctx, T.bool), a: { e: "double", v: "1.0" }, b: { e: "double", v: "0.0" } };
        return { e: "op", op: "num.parse", args: [this.expr(arg, ctx, T.string)] };
      }
      // A Double: parseInt("x") is NaN.
      if (callee.text === "parseInt" || callee.text === "parseFloat") return this.parseNumber(callee.text, node, ctx);
      // encodeURIComponent / encodeURI / decodeURIComponent / decodeURI (rest): runtime ports of JavaScript's.
      if (/^(en|de)codeURI(Component)?$/.test(callee.text) && this.isLibGlobal(callee) && node.arguments.length === 1) {
        const fn = callee.text.replace("URI", "Uri");
        const arg = this.str(node.arguments[0]!, ctx);
        if (fn.startsWith("encode")) return this.jsFn(fn, T.string, [arg]);
        return this.libThrows(node) ? ({ ...this.jsFn(fn, T.string, [arg]), throws: true } as Expr) : this.jsFn(`${fn}!`, T.string, [arg]);
      }
      if ((callee.text === "isNaN" || callee.text === "isFinite") && node.arguments.length === 1) {
        return { e: "op", op: "math.fn", args: [{ e: "str", v: callee.text }, this.expr(node.arguments[0]!, ctx, T.double)] };
      }
    }
    const listing = this.objectCall(node);
    if (listing && listing !== "keys" && this.listsAny(node)) return this.error(node, "TypeScript types these values `any` (an interface or a class has no index signature): declare the type with `type X = { … }`, or list the keys and read each field.");
    if (listing) return listing === "entries" ? this.entries(node.arguments[0]!, node, ctx) : this.enumerate(node.arguments[0]!, listing, ctx);
    const object = this.objectStatic(node, callee, ctx);
    if (object) return object;
    const generated = this.genCall(node, ctx);
    if (generated) return generated;
    if (ts.isPropertyAccessExpression(callee)) {
      const member = this.memberCall(callee, node, ctx);
      if (member) return member;
      const method = this.method(callee, node, ctx);
      if (method?.e === "op" && this.liveChain(node)) method.chain = true;
      if (method?.e === "op" && this.callThrows(node)) method.throws = true;
      if (method) return method;
    }

    const signature = this.checker.getResolvedSignature(node);
    const decl = signature?.getDeclaration();
    if (!signature || !decl) return this.error(node, "This call has no single signature natively (an overloaded function, or a value of a union of function types): call a function with one signature, or narrow the value first.");
    // A variants() recipe: btn({ intent: "danger" }).
    if (this.isApi(decl)) {
      const arg = node.arguments[0];
      return { e: "call", callee: this.expr(callee, ctx), args: arg ? [this.selection(arg, ctx)] : [] };
    }
    if (decl.getSourceFile().isDeclarationFile) return this.error(node, `${callee.getText()}() is not available natively.${LOCALE_HINT(callee.getText())}`);
    const args = this.callArgs(node, signature, ctx);
    // A declared function is called by name; a function value (maybe narrowed from null) is read as one.
    const symbol = ts.isIdentifier(callee) ? this.resolveAlias(this.checker.getSymbolAtLocation(callee)) : undefined;
    const generic = symbol && this.generics.get(symbol);
    if (generic) return { e: "call", callee: { e: "id", name: this.instantiate(generic, this.checker.getTypeArgumentsForResolvedSignature(signature) ?? [], node) }, args, ...this.thrown(node) };
    const local = symbol && this.localGenerics.get(symbol);
    if (local) return { e: "call", callee: { e: "id", name: this.localGenericName(local, this.checker.getTypeArgumentsForResolvedSignature(signature) ?? [], node).name }, args, ...this.thrown(node) };
    const fn = symbol && this.functionSymbols.has(symbol) && !this.captureRead(callee as ts.Identifier) ? ({ e: "id", name: this.idName(callee as ts.Identifier) } as Expr) : this.expr(callee, ctx);
    const impl = this.overloadImpl(decl);
    if (impl) return this.overloadResult({ e: "call", callee: fn, args, ...this.thrown(node) }, node, impl);
    return { e: "call", callee: fn, args, ...this.thrown(node) };
  }

  /**
   * Whether a number / string API call can throw a RangeError: `n.toString(radix)`, `toPrecision(p)`,
   * `toExponential(f)` but with a literal argument in range, `String.fromCodePoint` but of valid literal code points.
   */
  private strNumThrows(node: ts.CallExpression): boolean {
    const callee = node.expression;
    if (!ts.isPropertyAccessExpression(callee)) return false;
    const [name, arg] = [callee.name.text, node.arguments[0]];
    const literal = (a: ts.Expression | undefined, lo: number, hi: number) => !!a && ts.isNumericLiteral(a) && Math.trunc(Number(a.text)) >= lo && Math.trunc(Number(a.text)) <= hi;
    if (ts.isIdentifier(callee.expression) && callee.expression.text === "String" && name === "fromCodePoint") {
      return !node.arguments.every((a) => ts.isNumericLiteral(a) && Number.isInteger(Number(a.text)) && Number(a.text) <= 0x10ffff);
    }
    if (!arg || !this.isNumber(this.checker.getNonNullableType(this.typeOf(callee.expression)))) return false;
    const range = new Map<string, [number, number]>([["toString", [2, 36]], ["toPrecision", [1, 100]], ["toExponential", [0, 100]]]).get(name);
    return !!range && !literal(arg, ...range);
  }

  /**
   * Whether a library call can throw JavaScript's RangeError (lib4): `xs.with(i, v)`, `new Array(n).fill(v)` and
   * `s.repeat(n)` / `d.toFixed(f)` but with a literal argument that is valid.
   */
  private libThrows(node: ts.Node): boolean {
    // `new ArrayBuffer(n)`, `new DataView(buffer, …)`, `new Uint8Array(buffer, …)`: a length or an offset out of range.
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && this.fromLib(this.checker.getSymbolAtLocation(node.expression))) {
      const first = node.arguments?.[0];
      return node.expression.text === "ArrayBuffer" || (!!first && this.abName(this.typeOf(first)) === "ArrayBuffer");
    }
    // `decodeURIComponent(s)` / `decodeURI(s)`: a URIError on a malformed escape (rest).
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^decodeURI(Component)?$/.test(node.expression.text) && this.isLibGlobal(node.expression)) return this.inTry(node);
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return false;
    if (this.abName(this.checker.getNonNullableType(this.typeOf(node.expression.expression))) === "DataView") return /^[gs]et/.test(node.expression.name.text);
    const [recv, name, arg] = [node.expression.expression, node.expression.name.text, node.arguments[0]];
    const whole = (a: ts.Expression | undefined, hi: number) => !!a && ts.isNumericLiteral(a) && Number.isInteger(Number(a.text)) && Number(a.text) <= hi;
    if (name === "fill" && this.holeyLength(recv)) return !whole(this.holeyLength(recv), 2 ** 32 - 1) && this.inTry(node);
    const type = this.checker.getNonNullableType(this.typeOf(recv));
    if (name === "with" && this.isArray(type)) return this.inTry(node);
    // `reduce(f)` without an initial value: a TypeError on an empty array (rest).
    if ((name === "reduce" || name === "reduceRight") && this.isArray(type) && node.arguments.length === 1) return this.inTry(node);
    if (name === "repeat" && this.isString(type)) return !whole(arg, 2 ** 30) && this.inTry(node);
    if (name === "toFixed" && this.isNumber(type) && arg) return !whole(arg, 100) && this.inTry(node);
    return false;
  }

  /**
   * Inside a try block with a catch, in the same function: there `repeat` / `toFixed` / `new Array(n)` of an argument
   * not known to be valid throw JavaScript's RangeError to the catch. Elsewhere (lib4) an invalid argument stops the
   * program with that error on every target, as JavaScript's uncaught error would, and the function doesn't become
   * one that throws (a global initializer calling it stays valid).
   */
  private inTry(node: ts.Node): boolean {
    let n = node;
    for (; n.parent && !ts.isFunctionLike(n) && !ts.isClassLike(n); n = n.parent) {
      if (ts.isTryStatement(n.parent) && n.parent.tryBlock === n && n.parent.catchClause) return true;
    }
    // In a function a caller may catch from: a declared function or method called (directly, or by such functions)
    // inside a try block with a catch. It throws there as in JavaScript (and its other callers then may throw too).
    return ts.isFunctionLike(n) && this.catchableFns().has(n);
  }

  private catchable?: Set<ts.Node>;

  /** Declared functions, methods and `const` arrow functions some call reaches from inside a try block with a catch (see inTry). */
  private catchableFns(): Set<ts.Node> {
    if (this.catchable) return this.catchable;
    const found = (this.catchable = new Set<ts.Node>());
    const calls: { call: ts.CallExpression; fn: ts.Node }[] = [];
    for (const sf of this.files) {
      this.forEachNode(sf, (n) => {
        if (!ts.isCallExpression(n)) return;
        let fn = this.checker.getResolvedSignature(n)?.getDeclaration() as ts.Node | undefined;
        if (fn && this.files.includes(fn.getSourceFile()) && ts.isFunctionLike(fn) && (fn as ts.FunctionLikeDeclaration).body) calls.push({ call: n, fn });
      });
    }
    const caught = (call: ts.Node): boolean => {
      let n = call;
      for (; n.parent && !ts.isFunctionLike(n) && !ts.isClassLike(n); n = n.parent) {
        if (ts.isTryStatement(n.parent) && n.parent.tryBlock === n && n.parent.catchClause) return true;
      }
      return ts.isFunctionLike(n) && found.has(n);
    };
    for (let more = true; more; ) {
      more = false;
      for (const { call, fn } of calls) if (!found.has(fn) && caught(call)) found.add(fn), (more = true);
    }
    return found;
  }

  /** `repeat` / `toFixed` of an argument not known to be valid, outside a try block: the error is fatal (`!`). */
  private libFatal(node: ts.CallExpression): boolean {
    if (!ts.isPropertyAccessExpression(node.expression) || this.libThrows(node)) return false;
    const arg = node.arguments[0];
    const whole = (a: ts.Expression | undefined, hi: number) => !!a && ts.isNumericLiteral(a) && Number.isInteger(Number(a.text)) && Number(a.text) <= hi;
    const name = node.expression.name.text;
    return name === "repeat" ? !whole(arg, 2 ** 30) : name === "toFixed" ? !!arg && !whole(arg, 100) : false;
  }

  /**
   * `Object.is(a, b)` of numbers (SameValue: NaN is NaN, -0 isn't +0), and a clear diagnostic for the Object statics
   * that have no native equivalent (lib4).
   */
  private objectStatic(node: ts.CallExpression, callee: ts.Expression, ctx: Ctx): Expr | undefined {
    if (!ts.isPropertyAccessExpression(callee) || !ts.isIdentifier(callee.expression) || !this.isLibGlobal(callee.expression)) return undefined;
    // `Map.groupBy(items, key)` (adapters2).
    if (callee.expression.text === "Map" && callee.name.text === "groupBy" && node.arguments.length === 2) return this.groupBy(node, node.arguments[0]!, node.arguments[1]!, ctx, true);
    if (callee.expression.text !== "Object") return undefined;
    const name = callee.name.text;
    const [a, b] = node.arguments;
    if (name === "is" && a && b) {
      const [ta, tb] = [this.typeOf(a), this.typeOf(b)];
      if (this.isNumber(ta) && this.isNumber(tb) && !this.isNullable(ta) && !this.isNullable(tb)) return this.jsFn("objectIs", T.bool, [this.expr(a, ctx, T.double), this.expr(b, ctx, T.double)]);
      return this.error(node, "Object.is() takes two numbers natively (for other values it is ===).");
    }
    if (name === "groupBy" && a && b) return this.groupBy(node, a, b, ctx, false);
    // `Object.freeze(literal)` (adapters2): the literal itself. Only readonly types can reach it (an array is
    // `readonly T[]`; a `Readonly<T>` object never flows where a field is writable: checkFrozenFlows), so no write
    // JavaScript would refuse can happen natively.
    if (name === "freeze" && a && node.arguments.length === 1) {
      let bare = a;
      while (ts.isParenthesizedExpression(bare) || ts.isAsExpression(bare) || ts.isSatisfiesExpression(bare)) bare = bare.expression;
      if (ts.isArrayLiteralExpression(bare) || ts.isObjectLiteralExpression(bare)) return this.expr(a, ctx, this.tyOfExpr(node));
      return this.error(node, "Object.freeze() is supported natively on a literal only (`Object.freeze({ … })`, `Object.freeze([ … ])`): another reference to the object would stay writable. Freeze the literal where it is made, or use `readonly` fields / `Readonly<T>` / `readonly T[]` (checked at compile time).");
    }
    const fromEntries = name === "fromEntries" && a && node.arguments.length === 1 ? this.fromEntries(node, a, ctx) : undefined;
    if (fromEntries) return fromEntries;
    const assigned = name === "assign" && a && node.arguments.length > 1 ? this.objectAssign(node, ctx) : undefined;
    if (assigned) return assigned;
    const why: Record<string, string> = {
      assign: "here it would copy keys only known at run time (an optional field present or not, a field the target lacks, a method); it is supported between Records and from objects whose fields are all required into one that has them. Write the fields (`t.a = s.a`) or make a new object with a spread (`{ ...t, ...s }`)",
      isFrozen: "natively an object doesn't record whether it was frozen: only literals are frozen (Object.freeze({ … })), so the code that froze it knows; keep that in a field if it must be tested",
      seal: "objects natively always have exactly their type's fields: sealing changes nothing there but JavaScript's errors",
      isSealed: "see Object.seal",
      preventExtensions: "see Object.seal",
      isExtensible: "see Object.seal",
      fromEntries: "it is supported natively from an array of [string or number, value] pairs into a Record; build the record in a loop (`for (const [k, v] of pairs) rec[k] = v`) or use new Map(pairs)",
      create: "objects are made by literals or classes natively (no prototypes)",
      getPrototypeOf: "there are no prototypes natively; use instanceof",
      setPrototypeOf: "there are no prototypes natively",
      defineProperty: "an object's fields are fixed by its type natively",
      defineProperties: "an object's fields are fixed by its type natively",
      getOwnPropertyNames: "use Object.keys",
      getOwnPropertyDescriptor: "there are no property descriptors natively",
      getOwnPropertyDescriptors: "there are no property descriptors natively",
      getOwnPropertySymbols: "symbol keys are not supported natively",
    };
    if (why[name]) return this.error(node, `Object.${name}() is not supported natively: ${why[name]}.`);
    return undefined;
  }

  /**
   * A built-in function used as a value (rest): `xs.map(Number)`, `xs.filter(Boolean)`, `xs.map(parseInt)` (map's
   * index is its radix, as in JavaScript), `Math.max` as a callback. A lambda taking the callback's arguments and
   * passing the built-in as many as it reads (a missing one is undefined: NaN for a number).
   */
  private builtinValue(node: ts.Expression, want: Extract<Ty, { k: "fn" }>): Expr | undefined {
    const id = ts.isIdentifier(node) ? node : ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && ["Math", "Number"].includes(node.expression.text) ? node.expression : undefined;
    if (!id || !this.isLibGlobal(id)) return undefined;
    const name = ts.isIdentifier(node) ? node.text : `${id.text}.${(node as ts.PropertyAccessExpression).name.text}`;
    const n = ++this.temps;
    const params: Param[] = want.params.map((ty, i) => ({ name: `b${n}_${i}__`, ty, unused: true }));
    if (params.some((p) => !["string", "int", "double", "bool"].includes(p.ty.k))) return undefined;
    const NAN: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "NaN" }] };
    const read = (i: number): Expr | undefined => {
      const p = params[i];
      if (!p) return undefined;
      delete p.unused;
      return { e: "id", name: p.name };
    };
    // ToNumber of an argument (undefined is NaN).
    const num = (i: number): Expr | undefined => {
      const x = read(i);
      const ty = params[i]?.ty;
      return !x ? NAN : ty!.k === "double" ? x : ty!.k === "int" ? { e: "toDouble", x } : ty!.k === "bool" ? { e: "cond", c: x, a: { e: "double", v: "1.0" }, b: { e: "double", v: "0.0" } } : { e: "op", op: "num.parse", args: [x] };
    };
    const text = (i: number): Expr | undefined => {
      const x = read(i);
      const ty = params[i]?.ty;
      return !x ? { e: "str", v: "undefined" } : ty!.k === "string" ? x : { e: "toStr", x, from: ty! };
    };
    const MATH: Record<string, Op> = { abs: "math.abs", sqrt: "math.sqrt" };
    let body: Expr | undefined;
    let ty: Ty = T.double;
    const short = name.replace(/^(Math|Number)\./, "");
    if (name === "Number") body = num(0);
    else if (name === "String") [body, ty] = [text(0), T.string];
    else if (name === "Boolean") {
      const x = read(0);
      const k = params[0]?.ty.k;
      ty = T.bool;
      body = !x ? { e: "bool", v: false } : k === "bool" ? x : k === "string" ? { e: "op", op: "str.nonEmpty", args: [x] } : k === "int" ? { e: "bin", op: "!=", l: x, r: { e: "int", v: "0" } } : { e: "bin", op: ">", l: { e: "op", op: "math.abs", args: [x] }, r: { e: "double", v: "0.0" } };
    } else if (name === "parseInt" || name === "Number.parseInt") body = { e: "op", op: "int.parse", args: [text(0)!, params[1] ? num(1)! : { e: "double", v: "0.0" }] };
    else if (name === "parseFloat" || name === "Number.parseFloat") body = this.jsFn("parseFloat", T.double, [text(0)!]);
    else if (["isNaN", "isFinite", "Number.isNaN", "Number.isFinite", "Number.isInteger"].includes(name)) {
      if (name.startsWith("Number.") && params[0]?.ty.k !== "double" && params[0]?.ty.k !== "int") return undefined;
      [body, ty] = [{ e: "op", op: "math.fn", args: [{ e: "str", v: short }, num(0)!] }, T.bool];
    } else if (name === "Number.isSafeInteger" && (params[0]?.ty.k === "double" || params[0]?.ty.k === "int")) [body, ty] = [this.jsFn("isSafeInteger", T.bool, [num(0)!]), T.bool];
    else if (name.startsWith("Math.")) {
      if (short === "max" || short === "min") {
        // Every argument (a rest parameter): a fold from -Infinity / Infinity.
        const inf: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] };
        body = params.reduce<Expr>((acc, _, i) => ({ e: "op", op: `math.${short}` as Op, args: [acc, num(i)!] }), short === "min" ? inf : { e: "neg", x: inf });
      } else if (short === "pow") body = { e: "op", op: "math.pow", args: [num(0)!, num(1)!] };
      else if (short === "atan2") body = { e: "op", op: "math.fn", args: [{ e: "str", v: short }, num(0)!, num(1)!] };
      else if (short === "hypot" && params.length === 2) body = { e: "op", op: "math.fn", args: [{ e: "str", v: short }, num(0)!, num(1)!] };
      else if (MATH[short]) body = { e: "op", op: MATH[short]!, args: [num(0)!] };
      else if (["floor", "ceil", "round", "trunc"].includes(short)) body = { e: "op", op: "math.fn", args: [{ e: "str", v: short === "round" ? "jsRound" : short }, num(0)!] };
      else if (MATH_FNS.has(short) && short !== "hypot") body = { e: "op", op: "math.fn", args: [{ e: "str", v: short }, num(0)!] };
    }
    if (!body) return undefined;
    return { e: "lambda", params, ret: want.ret, body: this.convert(body, ty, want.ret), ...(want.throws ? { throws: true } : {}) };
  }

  /**
   * `xs.reduce(f)` / `xs.reduceRight(f)` without an initial value (rest): the first (last) element is the start and
   * the rest are folded; an empty array throws JavaScript's TypeError (catchable inside a try, else fatal: libThrows).
   */
  private reduceFirst(node: ts.CallExpression, name: string, obj: Expr, fn: ts.Expression, elem: Ty, ctx: Ctx): Expr {
    const arity = ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) ? fn.parameters.length : (this.typeOf(fn).getCallSignatures()[0]?.parameters.length ?? 1);
    if (arity > 2) return this.error(fn, `${name}() callbacks take the total and the item natively (not the index).`);
    const throws = this.callThrows(node) ? { throws: true } : {};
    const f = this.expr(fn, ctx, { k: "fn", params: [elem, elem], ret: elem, ...throws });
    const xs = `rd${++this.temps}__`;
    const v: Expr = { e: "id", name: xs };
    const len: Expr = { e: "op", op: "arr.length", args: [v] };
    const caught = this.libThrows(node);
    const right = name === "reduceRight";
    const last: Expr = { e: "bin", op: "-", l: len, r: { e: "int", v: "1" } };
    // The start's index, or the TypeError (reduceStart throws on 0 elements).
    const check: Expr = { ...this.jsFn(caught ? "reduceStart" : "reduceStart!", T.int, [len, right ? last : { e: "int", v: "0" }]), ...(caught ? { throws: true } : {}) };
    // ponytail: the rest is a copy (slice) folded by the existing ops; an index loop would save the copy.
    const start: Expr = { e: "index", obj: v, index: check };
    const rest: Expr = { e: "op", op: "arr.slice", args: [v, right ? { e: "int", v: "0" } : { e: "int", v: "1" }, right ? last : { e: "nil" }] };
    const fold: Expr = { e: "op", op: right ? "arr.reduceRight" : "arr.reduce", args: [rest, f, start], ty: elem, ...throws };
    return { e: "with", name: xs, ty: T.array(elem), init: obj, body: fold };
  }

  /**
   * `Object.fromEntries(pairs)` into a Record (rest): an array of `[key, value]` pairs, set in order (a later key wins,
   * as in JavaScript); a number key is its text.
   */
  /**
   * `Object.groupBy(items, key)` (a Record of arrays in JavaScript's key order) / `Map.groupBy(items, key)` (a Map in
   * first-seen order) of an array (adapters2): one pass, each item pushed to its key's array, made on first use.
   */
  private groupBy(node: ts.CallExpression, items: ts.Expression, keyFn: ts.Expression, ctx: Ctx, map: boolean): Expr {
    const out = this.tyOfExpr(node);
    const src = this.tyOfExpr(items);
    if (src.k !== "array" || !this.isArray(this.checker.getNonNullableType(this.typeOf(items)))) return this.error(items, `${map ? "Map" : "Object"}.groupBy takes an array natively (spread another iterable into one first).`);
    const group = out.k === "map" ? out.of : out.k === "jsmap" ? out.of : undefined;
    const arr = group?.k === "optional" ? group.of : group;
    if (!group || arr?.k !== "array") return this.error(node, "Object.groupBy's keys must be strings or numbers natively (a Record): type the key function's result `string` (not a union of literals), or use Map.groupBy.");
    const keyTy = out.k === "jsmap" ? out.key : T.string;
    const fnType = this.typeOf(keyFn).getCallSignatures()[0];
    const keyRet = fnType ? this.checker.getReturnTypeOfSignature(fnType) : undefined;
    if (!keyRet || this.isNullable(keyRet) || (!map && !this.isString(keyRet))) return this.error(keyFn, "Object.groupBy's key function returns a string natively (a Record<string, T[]>); `String(n)` a number, or use Map.groupBy.");
    const retTy = map ? keyTy : T.string;
    const arity = ts.isArrowFunction(keyFn) || ts.isFunctionExpression(keyFn) ? keyFn.parameters.length : (fnType?.parameters.length ?? 1);
    const throws = this.thrown(node);
    const n = ++this.temps;
    const [m, f, i, it, g] = [`gm${n}__`, `gf${n}__`, `gi${n}__`, `gx${n}__`, `gg${n}__`].map((name): Expr => ({ e: "id", name }));
    const counted = arity >= 2;
    const nm = (x: Expr) => (x as { name: string }).name;
    const fnTy: Extract<Ty, { k: "fn" }> = { k: "fn", params: arity >= 2 ? [src.of, T.int] : [src.of], ret: retTy, ...throws };
    const lambda = this.expr(keyFn, ctx, fnTy);
    // The index as the callback takes it (an Int, or a Double where it does arithmetic with Doubles).
    const indexTy = lambda.e === "lambda" ? lambda.params[1]?.ty : undefined;
    if (indexTy?.k === "double") fnTy.params[1] = T.double;
    const call: Expr = { e: "call", callee: f!, args: arity >= 2 ? [it!, indexTy?.k === "double" ? { e: "toDouble", x: i! } : i!] : [it!], ...throws };
    const key = call;
    const read: Expr = this.flat(map ? this.mcOp(m!, "get", T.optional(group), { e: "id", name: `gk${n}__` }) : { e: "op", op: "map.get", args: [m!, { e: "id", name: `gk${n}__` }] }, group);
    const made = this.convert({ e: "arr", of: arr.of, items: [it!] }, arr, group);
    const store: Stmt = map
      ? { s: "expr", x: this.mcOp(m!, "set", out, { e: "id", name: `gk${n}__` }, made) }
      : { s: "assign", target: { e: "index", obj: m!, index: { e: "id", name: `gk${n}__` } }, op: "=", value: made };
    return {
      e: "seq",
      body: [
        { s: "let", name: nm(m!), ty: out, init: map ? { e: "op", op: "mc.new", args: [], ty: out } : { e: "dict", of: (out as { of: Ty }).of, entries: [] }, mutable: false },
        { s: "let", name: nm(f!), ty: fnTy, init: lambda, mutable: false },
        ...(counted ? [{ s: "let", name: nm(i!), ty: T.int, init: { e: "int", v: "0" }, mutable: true } as Stmt] : []),
        {
          s: "forOf", name: nm(it!), of: this.expr(items, ctx, src), body: [
            { s: "let", name: `gk${n}__`, ty: map ? keyTy : T.string, init: key, mutable: false },
            ...(counted ? [{ s: "assign", target: i!, op: "+=", value: { e: "int", v: "1" } } as Stmt] : []),
            { s: "let", name: nm(g!), ty: T.optional(arr), init: read, mutable: false },
            { s: "if", c: this.some(g!, true), then: [store], else: [{ s: "expr", x: { e: "op", op: "arr.push", args: [{ e: "unwrap", x: g! }, it!] } }] },
          ],
        },
      ],
      x: m!,
      ty: out,
    };
  }

  private fromEntries(node: ts.CallExpression, src: ts.Expression, ctx: Ctx): Expr | undefined {
    const out = this.tyOfExpr(node);
    const srcType = this.checker.getNonNullableType(this.typeOf(src));
    if (out.k !== "map" || !this.isArray(srcType)) return undefined;
    const pair = this.checker.getTypeArguments(srcType as ts.TypeReference)[0];
    if (!pair || !this.checker.isTupleType(pair)) return undefined;
    const [keyType, valueType] = this.checker.getTypeArguments(pair as ts.TypeReference);
    if (!keyType || !valueType || !(this.isString(keyType) || this.isNumber(keyType)) || this.isNullable(keyType)) return undefined;
    const arr = this.tyOfExpr(src);
    if (arr.k !== "array") return undefined;
    const n = ++this.temps;
    const [m, it] = [`fe${n}__`, `fp${n}__`];
    const item: Expr = { e: "id", name: it };
    const part = (i: number): Expr => (arr.of.k === "class" ? { e: "prop", obj: item, name: `_${i}` } : { e: "index", obj: item, index: { e: "int", v: String(i) } });
    const keyTy = arr.of.k === "array" ? arr.of.of : this.ty(keyType, src);
    const key: Expr = this.isString(keyType) ? part(0) : { e: "toStr", x: part(0), from: keyTy.k === "int" ? T.int : T.double };
    const valueTy = arr.of.k === "array" ? arr.of.of : this.ty(valueType, src);
    return {
      e: "seq",
      body: [
        { s: "let", name: m, ty: out, init: { e: "dict", of: out.of, entries: [] }, mutable: false },
        { s: "forOf", name: it, of: this.expr(src, ctx), body: [{ s: "assign", target: { e: "index", obj: { e: "id", name: m }, index: key }, op: "=", value: this.convert(part(1), valueTy, out.of) }] },
      ],
      x: { e: "id", name: m },
      ty: out,
    };
  }

  /**
   * `Object.assign(target, ...sources)` (rest) where every key is known: Records into a Record (each source's keys in
   * order), or objects whose fields are all required into an object that has them (each field copied). Returns target.
   */
  private objectAssign(node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const [target, ...sources] = node.arguments;
    if (!target || sources.some(ts.isSpreadElement)) return undefined;
    const tTy = this.tyOfExpr(target);
    const n = ++this.temps;
    const t = `oa${n}__`;
    const body: Stmt[] = [{ s: "let", name: t, ty: tTy, init: this.expr(target, ctx), mutable: false }];
    for (const [i, src] of sources.entries()) {
      const sTy = this.tyOfExpr(src);
      const s = `os${n}_${i}__`;
      if (tTy.k === "map" && sTy.k === "map" && this.sameTy(tTy.of, sTy.of)) {
        const k = `ok${n}_${i}__`;
        body.push(
          { s: "let", name: s, ty: sTy, init: this.expr(src, ctx), mutable: false },
          { s: "forOf", name: k, of: { e: "op", op: "map.keys", args: [{ e: "id", name: s }] }, body: [{ s: "assign", target: { e: "index", obj: { e: "id", name: t }, index: { e: "id", name: k } }, op: "=", value: { e: "unwrap", x: { e: "op", op: "map.get", args: [{ e: "id", name: s }, { e: "id", name: k }] } } }] },
        );
        continue;
      }
      if (tTy.k !== "class" || sTy.k !== "class") return undefined;
      const srcType = this.checker.getNonNullableType(this.typeOf(src));
      const tgtType = this.checker.getNonNullableType(this.typeOf(target));
      const props = this.checker.getPropertiesOfType(srcType);
      // An optional field may be absent at run time (JavaScript then copies nothing): not known natively.
      if (props.some((p) => p.flags & ts.SymbolFlags.Optional || !tgtType.getProperty(p.name) || p.declarations?.some((d) => ts.isMethodDeclaration(d) || ts.isAccessor(d)))) return undefined;
      body.push({ s: "let", name: s, ty: sTy, init: this.expr(src, ctx), mutable: false });
      for (const p of props) {
        const want = this.tyOfSymbol(tgtType.getProperty(p.name)!, target);
        const have = this.tyOfSymbol(p, src);
        if (!this.sameTy(this.numFree(want), this.numFree(have))) return undefined;
        body.push({ s: "assign", target: { e: "prop", obj: { e: "id", name: t }, name: p.name }, op: "=", value: this.convert({ e: "prop", obj: { e: "id", name: s }, name: p.name }, have, want) });
      }
    }
    return { e: "seq", body, x: { e: "id", name: t }, ty: tTy };
  }

  /** `ty` with Int and Double alike (a field copy converts between them). */
  private numFree(ty: Ty): Ty {
    return ty.k === "int" ? T.double : ty.k === "optional" ? T.optional(this.numFree(ty.of)) : ty;
  }

  /** `[...s]` / `Array.from(s)` / `for (c of s)` (rest): a string's code points, each a string. */
  private codePoints(node: ts.Expression, ctx: Ctx): Expr {
    return this.jsFn("codePoints", T.array(T.string), [this.expr(node, ctx, T.string)]);
  }

  /** A runtime helper by name (`js.fn`), of result type `ty`. */
  private jsFn(name: string, ty: Ty, args: Expr[]): Expr {
    return { e: "op", op: "js.fn", args: [{ e: "str", v: name }, ...args], ty };
  }

  /** `parseInt(s, radix)` / `parseFloat(s)` (also `Number.parseInt` / `Number.parseFloat`): Doubles, NaN when nothing parses. */
  private parseNumber(name: string, node: ts.CallExpression, ctx: Ctx): Expr {
    const [s, radix] = node.arguments;
    if (!s) return this.error(node, `${name}() takes a string natively.`);
    if (name === "parseFloat") return this.jsFn("parseFloat", T.double, [this.expr(s, ctx, T.string)]);
    return { e: "op", op: "int.parse", args: [this.expr(s, ctx, T.string), radix ? this.expr(radix, ctx, T.double) : { e: "double", v: "0.0" }] };
  }

  /**
   * `Object.freeze({ … })` (adapters2) is the literal natively, so its `Readonly<T>` must never reach a type whose field
   * is writable (TypeScript allows that; JavaScript would then throw on the write, a native write would succeed).
   * Every expression of such a type is checked against where it goes (its contextual type), arrays of it too.
   * ponytail: a `Readonly<T>` inside another generic type (`Box<Readonly<T>>` → `Box<T>`) isn't followed.
   */
  private checkFrozenFlows(): void {
    const isFreeze = (n: ts.Node) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === "freeze" && ts.isIdentifier(n.expression.expression) && n.expression.expression.text === "Object";
    let used = false;
    for (const sf of this.files) this.forEachNode(sf, (n) => void (used ||= isFreeze(n)));
    if (!used) return;
    const byType = new Map<ts.Type, ts.Type | undefined>();
    const frozen = (t: ts.Type, depth = 0): ts.Type | undefined => {
      if (byType.has(t)) return byType.get(t);
      byType.set(t, undefined);
      let found: ts.Type | undefined;
      if (t.aliasSymbol?.name === "Readonly" && this.fromLib(t.aliasSymbol)) found = t;
      else if (depth < 4 && t.isUnion()) found = t.types.map((m) => frozen(m, depth + 1)).find((x) => !!x);
      else if (depth < 4 && t.flags & ts.TypeFlags.Object && this.checker.isArrayType(t)) {
        const elem = this.checker.getTypeArguments(t as ts.TypeReference)[0];
        found = elem && elem !== t ? frozen(elem, depth + 1) : undefined;
      }
      byType.set(t, found);
      return found;
    };
    const writable = (src: ts.Type, dst: ts.Type, depth = 0): boolean => {
      if (depth > 4) return false;
      if (dst.isUnion()) return dst.types.some((d) => writable(src, d, depth));
      if (this.isArray(dst)) return writable(src, this.checker.getTypeArguments(dst as ts.TypeReference)[0] ?? dst, depth + 1);
      if (dst.aliasSymbol?.name === "Readonly" || dst.flags & ts.TypeFlags.TypeParameter) return false;
      return src.getProperties().some((p) => {
        const d = this.checker.getPropertyOfType(dst, p.name);
        return !!d?.declarations?.length && d.declarations.every((x) => !(ts.getCombinedModifierFlags(x) & ts.ModifierFlags.Readonly));
      });
    };
    // Near-linear: only freeze calls and reads of variables, parameters and fields whose type holds a frozen object
    // (cached per symbol) are where a frozen value flows from.
    const bySymbol = new Map<ts.Symbol, ts.Type | undefined>();
    const frozenRead = (n: ts.Identifier): ts.Type | undefined => {
      const symbol = this.checker.getSymbolAtLocation(n);
      if (!symbol || !(symbol.flags & (ts.SymbolFlags.Variable | ts.SymbolFlags.Property))) return undefined;
      if (!bySymbol.has(symbol)) bySymbol.set(symbol, frozen(this.checker.getTypeOfSymbol(symbol)));
      return bySymbol.get(symbol);
    };
    for (const sf of this.files) {
      this.forEachNode(sf, (n) => {
        if (!isFreeze(n) && !ts.isIdentifier(n)) return;
        if (!n.parent || ts.isSpreadAssignment(n.parent) || ts.isSpreadElement(n.parent) || (ts.isIdentifier(n) && this.isDeclarationName(n))) return;
        if (ts.isIdentifier(n) && ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) return;
        const t = isFreeze(n) ? frozen(this.typeOf(n as ts.Expression)) : frozenRead(n as ts.Identifier);
        const want = t && this.checker.getContextualType(n as ts.Expression);
        if (t && want && writable(t, want)) this.error(n, `A frozen object (${this.checker.typeToString(t)}) can't go where its fields are writable (${this.checker.typeToString(want)}): JavaScript would throw on a write there, natively it would succeed. Make those fields \`readonly\` (or the type \`Readonly<…>\`), or pass a copy (\`{ ...obj }\`).`);
      });
    }
  }

  /** `throws` for the IR of a call that can throw. */
  private thrown(node: ts.CallExpression): { throws?: true } {
    return this.callThrows(node) ? { throws: true } : {};
  }

  /** `obj.m(…)` / `super.m(…)` on a class or protocol value, and `C.m(…)`, a static method. */
  private memberCall(callee: ts.PropertyAccessExpression, node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const decl = this.checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
    // A method of an object literal or a `{ … }` type: one of a shape protocol's.
    const owner = decl && (this.ownerOf(decl) ?? (this.isLiteralMethod(decl) ? this.shapeName(this.typeOf(callee.expression), callee) : undefined));
    if (!decl || !owner || !(ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl))) return undefined;
    const signature = this.checker.getResolvedSignature(node);
    if (!signature) return this.error(node, "This call has no single signature natively (an overloaded function, or a value of a union of function types): call a function with one signature, or narrow the value first.");
    const args = this.callArgs(node, signature, ctx);
    // A generic method: the instantiation of its type arguments here.
    const name = ts.isMethodDeclaration(decl) && decl.typeParameters?.length && ts.isClassLike(decl.parent)
      ? this.methodInstance(decl, this.checker.getTypeArgumentsForResolvedSignature(signature) ?? [], node, callee.expression.kind === ts.SyntaxKind.SuperKeyword ? undefined : callee.expression)
      : this.memberName(callee.name);
    // An overloaded method: its implementation is the native one (callArgs passed its parameters).
    const impl = this.overloadImpl(signature.getDeclaration());
    const result = (x: Expr): Expr => (impl ? this.overloadResult(x, node, impl) : x);
    if (ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Static) return result({ e: "call", callee: { e: "id", name: `${owner}__${name}` }, args, ...this.thrown(node) });
    // Left-out optional arguments are nil: the method applies its own defaults.
    const declared = (impl ?? decl).parameters.filter((p) => !p.dotDotDotToken).length;
    while (args.length < declared) args.push({ e: "nil" });
    if (callee.expression.kind === ts.SyntaxKind.SuperKeyword) {
      return result({ e: "invoke", obj: { e: "id", name: "this" }, name, args, sup: this.superOwner(node, name, ts.isMethodDeclaration) ?? owner, ...this.thrown(node) });
    }
    return result({ e: "invoke", obj: this.expr(callee.expression, ctx), name, args, ...this.thrown(node) });
  }

  /**
   * The base class that declares what `super.name` reaches, as this class extends it (`Base__Double`
   * for `extends Base<number>`): the nearest one with a member that passes `test`.
   */
  private superOwner(node: ts.Node, name: string, test: (m: ts.ClassElement) => boolean): string | undefined {
    const cls = ts.findAncestor(node, ts.isClassLike);
    let clause = cls && this.heritage(cls, ts.SyntaxKind.ExtendsKeyword)[0];
    let env = this.env;
    for (let depth = 0; clause && depth < 32; depth++) {
      const base = this.withEnv(env, () => this.heritageName(clause!));
      const decl = base && this.declOfName(base);
      if (!base || !decl || !ts.isClassDeclaration(decl)) break;
      if (decl.members.some((m) => m.name && ts.isIdentifier(m.name) && m.name.text === name && test(m))) return base;
      env = this.instances.get(base)?.env ?? env;
      clause = this.heritage(decl, ts.SyntaxKind.ExtendsKeyword)[0];
    }
    return undefined;
  }

  /** `super.x`: the base's getter (and setter), run on `this`. Only accessors can be reached: fields live on the object. */
  private superProperty(node: ts.PropertyAccessExpression, write: boolean): Expr | undefined {
    if (node.expression.kind !== ts.SyntaxKind.SuperKeyword) return undefined;
    const name = node.name.text;
    const sup = this.superOwner(node, name, write ? ts.isSetAccessor : ts.isGetAccessor);
    if (!sup) return this.error(node, `super.${name} reaches a base class's ${write ? "setter" : "getter"} only; there is none.`);
    return { e: "prop", obj: { e: "id", name: "this" }, name, sup };
  }

  /** A static field of one of the app's classes (`C.count`): the global `C__count`. */
  private staticField(node: ts.Expression): Expr | undefined {
    if (!ts.isPropertyAccessExpression(node)) return undefined;
    const decl = this.checker.getSymbolAtLocation(node.name)?.valueDeclaration;
    const owner = decl && ts.isPropertyDeclaration(decl) && ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Static ? this.ownerOf(decl) : undefined;
    return owner ? { e: "id", name: `${owner}__${this.memberName(node.name)}` } : undefined;
  }

  /**
   * A class member's native name. `#x` is private to the class that declares it, and a subclass may
   * declare its own `#x`: natively it is `x__Class` (one struct holds both in Rust, one name space in Swift and Kotlin).
   */
  private memberName(name: ts.Node): string {
    if (ts.isIdentifier(name)) return name.text;
    if (this.isSymbolIterator(name)) return ITERATOR_METHOD;
    if (!ts.isPrivateIdentifier(name)) return name.getText();
    const decl = this.checker.getSymbolAtLocation(name)?.valueDeclaration ?? name.parent;
    const cls = ts.findAncestor(decl, ts.isClassLike);
    const symbol = cls && this.classSymbol(cls);
    return `${name.text.slice(1)}__${symbol ? this.className(symbol) : "anonymous"}`;
  }

  /** `C.x` where `x` is a static getter (and maybe setter): the functions `C__x` and `C__set_x`. */
  private staticAccessor(node: ts.Expression): { get: string; set: string } | undefined {
    if (!ts.isPropertyAccessExpression(node)) return undefined;
    const decl = this.checker.getSymbolAtLocation(node.name)?.declarations?.find((d) => ts.isGetAccessor(d) || ts.isSetAccessor(d));
    const owner = decl && ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Static ? this.ownerOf(decl) : undefined;
    const name = this.memberName(node.name);
    return owner ? { get: `${owner}__${name}`, set: `${owner}__set_${name}` } : undefined;
  }

  /** An assignment (`=`, `+=`…, `++`, `--`) to a static accessor: its setter, called with the new value. */
  private staticAssign(node: ts.Expression, target: ts.Expression, accessor: { get: string; set: string }, ctx: Ctx): Stmt {
    const ty = this.lvalueTy(target);
    const throws = ts.isPropertyAccessExpression(target) && this.accessorThrows(target) ? { throws: true } : {};
    const current: Expr = { e: "call", callee: { e: "id", name: accessor.get }, args: [], ...throws };
    const set = (value: Expr): Stmt => ({ s: "expr", x: { e: "call", callee: { e: "id", name: accessor.set }, args: [value], ...throws } });
    const one: Expr = ty.k === "int" ? { e: "int", v: "1" } : { e: "double", v: "1.0" };
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      return set({ e: "bin", op: node.operator === ts.SyntaxKind.PlusPlusToken ? "+" : "-", l: current, r: one });
    }
    const { operatorToken: op, right } = node as ts.BinaryExpression;
    if (op.kind === ts.SyntaxKind.EqualsToken) return set(this.expr(right, ctx, ty));
    if (op.kind === ts.SyntaxKind.PlusEqualsToken && ty.k === "string") return set({ e: "tpl", parts: [current, this.str(right, ctx)] });
    const arithmetic: Partial<Record<ts.SyntaxKind, BinOp>> = {
      [ts.SyntaxKind.PlusEqualsToken]: "+", [ts.SyntaxKind.MinusEqualsToken]: "-", [ts.SyntaxKind.AsteriskEqualsToken]: "*",
      [ts.SyntaxKind.SlashEqualsToken]: "/", [ts.SyntaxKind.PercentEqualsToken]: "%",
    };
    const bin = arithmetic[op.kind];
    if (!bin) return this.unsupported(node, "this assignment operator on a static getter / setter; write `C.x = …`");
    return set({ e: "bin", op: bin, l: current, r: this.expr(right, ctx, ty) });
  }

  /** The arguments of a call to the app's own function: a rest parameter receives the trailing ones as an array. */
  /** A reference (not a declaration) to an overloaded function or method of the app. */
  private isOverloadedValue(node: ts.Identifier | ts.PropertyAccessExpression): boolean {
    const name = ts.isIdentifier(node) ? node : node.name;
    if (ts.isIdentifier(node) && (ts.isFunctionDeclaration(node.parent) || ts.isMethodDeclaration(node.parent) || ts.isPropertyAccessExpression(node.parent) || ts.isImportSpecifier(node.parent) || ts.isExportSpecifier(node.parent) || ts.isImportClause(node.parent))) return false;
    const decls = this.resolveAlias(this.checker.getSymbolAtLocation(name))?.declarations ?? [];
    return decls.some((d) => !!this.overloadImpl(d));
  }

  /** An overload signature's implementation (`function f(a: string): string; …; function f(a: string | number) {…}`). */
  private overloadImpl(decl: ts.Node | undefined): ts.FunctionDeclaration | ts.MethodDeclaration | undefined {
    if (!decl || !(ts.isFunctionDeclaration(decl) || ts.isMethodDeclaration(decl)) || decl.body || !decl.name || ts.getCombinedModifierFlags(decl) & (ts.ModifierFlags.Ambient | ts.ModifierFlags.Abstract)) return undefined;
    if (ts.isMethodDeclaration(decl) && !ts.isClassLike(decl.parent)) return undefined;
    return this.checker.getSymbolAtLocation(decl.name)?.declarations?.find((d): d is ts.FunctionDeclaration | ts.MethodDeclaration => (ts.isFunctionDeclaration(d) || ts.isMethodDeclaration(d)) && !!d.body && d.parent === decl.parent);
  }

  /**
   * A call of an overloaded function calls its implementation: the arguments go to its parameters, and its result (a
   * union, say) is narrowed to what the overload TypeScript chose returns.
   */
  private overloadResult(x: Expr, node: ts.CallExpression, impl: ts.FunctionDeclaration | ts.MethodDeclaration): Expr {
    const implRet = this.checker.getSignatureFromDeclaration(impl)?.getReturnType();
    const here = this.typeOf(node);
    if (!implRet || this.sameTy(this.ty(implRet, impl, this.slotKind(impl)), this.tyOfExpr(node))) return x;
    const narrowed = this.fromUnion(x, node, implRet, here) ?? this.castTo(x, this.ty(implRet, impl, this.slotKind(impl)), this.tyOfExpr(node));
    return narrowed ?? this.error(node, "Unsupported: this overload's result natively (the implementation's result can't be narrowed to it); give the implementation the overload's result type.");
  }

  private callArgs(node: ts.CallExpression | ts.NewExpression, signature: ts.Signature, ctx: Ctx): Expr[] {
    const impl = this.overloadImpl(signature.getDeclaration());
    if (impl) signature = this.checker.getSignatureFromDeclaration(impl) ?? signature;
    const params = signature.getParameters();
    const decl = signature.getDeclaration();
    const rest = decl?.parameters.findIndex((p) => p.dotDotDotToken) ?? -1;
    const arg = (a: ts.Expression, i: number) => {
      const param = params[i];
      if (ts.isSpreadElement(a)) return this.error(a, "Spread arguments are supported for a rest parameter only.");
      // The parameter's type where it is declared: typed at a caught error, an `unknown` would read as an Error.
      const at = param?.valueDeclaration && this.isCaught(a) ? param.valueDeclaration : a;
      return this.expr(a, ctx, param ? this.tyOfSymbol(param, at) : undefined);
    };
    const given = node.arguments ?? ts.factory.createNodeArray<ts.Expression>();
    if (rest < 0) return given.map(arg);
    const restTy = this.tyOfSymbol(params[rest]!, node) as Extract<Ty, { k: "array" }>;
    const trailing = given.slice(rest);
    const only = trailing.length === 1 ? trailing[0]! : undefined;
    const packed = only && ts.isSpreadElement(only) ? this.expr(only.expression, ctx, restTy) : this.arrayOf(trailing, restTy.of, ctx);
    return [...given.slice(0, rest).map(arg), packed];
  }

  /** `[a, ...xs, b]`: one array literal, or the concatenation of literals and spread arrays. */
  private arrayOf(elements: readonly ts.Expression[], of: Ty, ctx: Ctx): Expr {
    const parts: Expr[] = [];
    let run: Expr[] = [];
    for (const el of elements) {
      if (!ts.isSpreadElement(el)) {
        run.push(this.expr(el, ctx, of));
        continue;
      }
      if (run.length) parts.push({ e: "arr", of, items: run });
      run = [];
      // `[...gen()]`: every value it yields.
      const g = this.iterShapeOf(this.typeOf(el.expression), el.expression);
      if (g) {
        if (!g.value || !this.sameTy(g.value, of)) return this.error(el, "Spread a generator into an array of the type it yields.");
        parts.push({ e: "invoke", obj: this.genValue(el.expression, ctx), name: "toArray__", args: [], ...(g.throws ? { throws: true } : {}) });
        continue;
      }
      if (this.isString(this.typeOf(el.expression)) && of.k === "string") {
        parts.push(this.codePoints(el.expression, ctx));
        continue;
      }
      if (this.isTypedArray(this.typeOf(el.expression)) && of.k === "double") {
        parts.push(this.taCallOf(this.expr(el.expression, ctx), "toArray", T.array(T.double)));
        continue;
      }
      const iter = this.arrayIter(el.expression);
      if (iter) {
        parts.push(this.iterArray(iter, of, ctx));
        continue;
      }
      const listed = this.mcListing(el.expression) && this.mcListed(el.expression, ctx, of);
      if (listed) {
        if (listed.e === "op" && listed.ty?.k === "array" && !this.sameTy(listed.ty.of, of)) return this.error(el, "Spread a Map / Set into an array of its element type.");
        parts.push(listed);
        continue;
      }
      if (!this.isArray(this.checker.getNonNullableType(this.typeOf(el.expression)))) return this.error(el, "Only arrays can be spread natively.");
      parts.push(this.expr(el.expression, ctx, { k: "array", of }));
    }
    if (run.length || !parts.length) parts.push({ e: "arr", of, items: run });
    return parts.length === 1 && parts[0]!.e === "arr" ? parts[0]! : { e: "op", op: "arr.concat", args: parts };
  }

  /**
   * `f?.(…)` and `o?.f(…)` (a function field of an optional object): the call when the value is
   * there, `undefined` otherwise. The value is read twice, so it must be a variable or a property.
   */
  private optionalCall(node: ts.CallExpression, ctx: Ctx): { cond: Expr; call: Expr } | undefined {
    const callee = node.expression;
    const signature = this.checker.getResolvedSignature(node);
    const nonNil = (x: Expr): Expr => ({ e: "bin", op: "!=", l: x, r: { e: "nil" } });
    // What TypeScript narrowed is still tested: the optional itself.
    const optional = (x: Expr): Expr => (x.e === "unwrap" ? x.x : x);
    // What TypeScript narrowed to a function (an object) is called as it is.
    if (node.questionDotToken && !this.isNullable(this.typeOf(callee))) return undefined;
    if (node.questionDotToken) {
      if (!signature) return void this.error(node, "Unsupported: ?.() of a function with no single signature; narrow it first.");
      // A computed function (`handlers[k]?.()`, `o.f?.()` of a getter…) is read once (rest).
      const temp = this.isPure(callee) ? undefined : `oc${++this.temps}__`;
      const f = temp ? { e: "id" as const, name: temp } : optional(this.expr(callee, ctx));
      const out = { cond: nonNil(f), call: { e: "call" as const, callee: { e: "unwrap" as const, x: f }, args: this.callArgs(node, signature, ctx), ...this.thrown(node) } };
      return temp ? { cond: { e: "bool", v: true }, call: { e: "with", name: temp, ty: this.tyOfExpr(callee), init: optional(this.expr(callee, ctx)), body: { e: "cond", c: out.cond, a: out.call, b: { e: "nil" } } } } : out;
    }
    if (ts.isPropertyAccessExpression(callee) && callee.questionDotToken && this.isNullable(this.typeOf(callee.expression))) {
      const field = this.checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
      if (!field || !ts.isPropertySignature(field) || !signature) return undefined;
      const temp = this.isPure(callee.expression) ? undefined : `oc${++this.temps}__`;
      const obj = temp ? { e: "id" as const, name: temp } : optional(this.expr(callee.expression, ctx));
      const out = { cond: nonNil(obj), call: { e: "call" as const, callee: { e: "prop" as const, obj: { e: "unwrap" as const, x: obj }, name: callee.name.text }, args: this.callArgs(node, signature, ctx), ...this.thrown(node) } };
      return temp ? { cond: { e: "bool", v: true }, call: { e: "with", name: temp, ty: this.tyOfExpr(callee.expression), init: optional(this.expr(callee.expression, ctx)), body: { e: "cond", c: out.cond, a: out.call, b: { e: "nil" } } } } : out;
    }
    return undefined;
  }

  /** `Array` (or another global of TypeScript's lib), not one of the app's names. */
  private isLibGlobal(id: ts.Identifier): boolean {
    const decls = this.checker.getSymbolAtLocation(id)?.declarations;
    return !!decls?.length && decls.every((d) => d.getSourceFile().isDeclarationFile && !this.isApi(d));
  }

  /** `new Array(n)` / `Array(n)` of one number (n holes): the length. */
  private holeyLength(node: ts.Expression): ts.Expression | undefined {
    while (ts.isParenthesizedExpression(node)) node = node.expression;
    if (!(ts.isNewExpression(node) || ts.isCallExpression(node)) || !ts.isIdentifier(node.expression) || node.expression.text !== "Array" || !this.isLibGlobal(node.expression)) return undefined;
    const [n, ...rest] = node.arguments ?? [];
    return n && !rest.length && !ts.isSpreadElement(n) && this.isNumber(this.typeOf(n)) ? n : undefined;
  }

  /** `new Array<T>()` / `Array(a, b)`: its items (`new Array(n)`, n holes, only as `new Array<T>(n).fill(v)`). */
  private arrayCtor(node: ts.NewExpression | ts.CallExpression, ctx: Ctx): Expr {
    if (this.holeyLength(node)) return this.error(node, HOLES);
    const ty = this.tyOfExpr(node);
    if (ty.k !== "array") return this.error(node, "Give the array its element type: new Array<T>().");
    return this.arrayOf(node.arguments ?? [], ty.of, ctx);
  }

  /** The items of `push(…)` / `unshift(…)` / `splice(i, n, …)`, spreads too, as one array (a spread array as it is: each runtime reads it before writing). */
  private items(args: readonly ts.Expression[], of: Ty, ctx: Ctx): Expr {
    const x = this.arrayOf(args, of, ctx);
    return x.e === "op" && x.op === "arr.concat" && x.args.length === 1 ? x.args[0]! : x;
  }

  /** `xs.join(sep)`, `${xs}`, `String(xs)`: each element as JavaScript prints it (null and undefined as "", an array joined by ","). */
  private joinText(x: Expr, elem: Ty, sep: Expr): Expr | undefined {
    if (elem.k === "string") return { e: "op", op: "arr.join", args: [x, sep] };
    const name = `j${++this.temps}__`;
    const text = this.elemText({ e: "id", name }, elem);
    return text && { e: "op", op: "arr.join", args: [{ e: "op", op: "arr.map", args: [x, { e: "lambda", params: [{ name, ty: elem }], ret: T.string, body: text }] }, sep] };
  }

  private elemText(v: Expr, ty: Ty): Expr | undefined {
    if (ty.k === "string") return v;
    if (ty.k === "rt" && ty.name === "Error") return this.errorRead(v, "text");
    if (ty.k === "int" || ty.k === "double" || ty.k === "bool" || (ty.k === "rt" && ty.name === "BigInt")) return { e: "toStr", x: v, from: ty };
    if (ty.k === "array") return this.joinText(v, ty.of, { e: "str", v: "," });
    if (ty.k === "class") return this.objectText(v, ty);
    // An element of a union: as `${u}`, except null, which an array prints as "" (rest2).
    if (ty.k === "union") {
      const decl = this.unions.get(ty.name)!;
      if (!this.unionTextable(decl)) return undefined;
      const text = this.unionCall(`${decl.name}__str`, () => this.strFn(decl.name), [v]);
      return decl.members.some((m) => m.tag === "Null") ? { e: "cond", c: { e: "uis", x: v, u: decl.name, tag: "Null" }, a: { e: "str", v: "" }, b: text } : text;
    }
    if (ty.k !== "optional") return undefined;
    const inner = this.elemText({ e: "unwrap", x: v }, ty.of);
    return inner && { e: "cond", c: { e: "bin", op: "==", l: v, r: { e: "nil" } }, a: { e: "str", v: "" }, b: inner };
  }

  /**
   * `${obj}` of an object of the app's classes / interfaces (rest2): its `toString()` when its class (or a base) declares
   * one, else "[object Object]". Undefined when a subclass or a conforming class declares its own (no static answer).
   */
  private objectText(v: Expr, ty: Extract<Ty, { k: "class" }>): Expr | undefined {
    if (this.isErrorClass(ty)) return { e: "invoke", obj: v, name: "toString", args: [] };
    const declares = (name: string) => this.declOfName(name)?.members.some((m: ts.ClassElement | ts.TypeElement) => m.name && ts.isIdentifier(m.name) && m.name.text === "toString");
    const chain = [ty.name, ...this.supertypes(ty.name)];
    const own = chain.find(declares);
    if (own) {
      const m = this.declOfName(own)!.members.find((m: ts.ClassElement | ts.TypeElement) => m.name && ts.isIdentifier(m.name) && m.name.text === "toString")!;
      return ts.isMethodDeclaration(m) || ts.isMethodSignature(m) ? { e: "invoke", obj: v, name: "toString", args: [] } : undefined;
    }
    // (Generic declarations aren't walked: their heritage is per instantiation.)
    const names = [...this.objectClasses, ...this.protocols].filter(([, d]) => !d.typeParameters?.length).map(([s]) => this.className(s));
    if (names.some((n) => n !== ty.name && this.supertypes(n).has(ty.name) && declares(n))) return undefined;
    return { e: "str", v: "[object Object]" };
  }

  /** Whether each member of a union has a text form (rest2: objects and arrays too). */
  private unionTextable(decl: UnionDecl): boolean {
    return decl.members.every((m) => ["double", "string", "bool", "void"].includes(m.ty.k) || !!this.elemText({ e: "id", name: "t__" }, m.ty));
  }

  /** `xs.keys()` / `xs.values()` / `xs.entries()` of an array. */
  private arrayIter(node: ts.Expression): { recv: ts.Expression; kind: "keys" | "values" | "entries" } | undefined {
    if (!ts.isCallExpression(node) || node.arguments.length || !ts.isPropertyAccessExpression(node.expression)) return undefined;
    const kind = node.expression.name.text;
    const recv = node.expression.expression;
    if (kind !== "keys" && kind !== "values" && kind !== "entries") return undefined;
    return this.isArray(this.typeOf(recv)) && !this.storedArray(recv) ? { recv, kind } : undefined;
  }

  /** `[...xs.keys()]`, `Array.from(xs.values())`: the indices, or a copy (the iterator is used up at once). */
  private iterArray(it: { recv: ts.Expression; kind: "keys" | "values" | "entries" }, of: Ty, ctx: Ctx): Expr {
    if (it.kind === "entries") return this.error(it.recv.parent, "entries() as a value gives [index, item] pairs, which mix types natively: loop with `for (const [i, x] of xs.entries())`.");
    const xs = this.expr(it.recv, ctx);
    if (it.kind === "values") return { e: "op", op: "arr.slice", args: [xs, { e: "int", v: "0" }, { e: "nil" }] };
    const i = `i${++this.temps}__`;
    const index: Expr = { e: "lambda", params: [{ name: i, ty: T.int }], ret: of, body: this.convert({ e: "id", name: i }, T.int, of) };
    return { e: "op", op: "arr.fromLength", args: [{ e: "arr", of, items: [] }, { e: "op", op: "arr.length", args: [xs] }, index], ty: T.array(of) };
  }

  /** `Array.of(…)`, `Array.from(xs | { length: n } | xs.keys() / xs.values(), mapFn?)`. */
  private arrayStatic(name: string, node: ts.CallExpression, ctx: Ctx): Expr {
    const args = node.arguments;
    let out = this.tyOfExpr(node);
    // `const b: number[][] = Array.from({ length: n }, () => [])`: TypeScript types the call `never[][]`; the declared type says what it holds.
    const declared = this.checker.getContextualType(node);
    if (declared && /\bnever\b/.test(this.checker.typeToString(this.typeOf(node))) && this.isArray(this.checker.getNonNullableType(declared))) out = this.ty(this.checker.getNonNullableType(declared), node);
    if (out.k !== "array" || (name !== "of" && name !== "from")) return this.error(node, `Array.${name}() is not available natively.`);
    if (name === "of") return this.arrayOf(args, out.of, ctx);
    const [src, fn] = args;
    if (!src || ts.isSpreadElement(src) || args.length > 2) return this.error(node, "Array.from(…, mapFn, thisArg) is not available natively.");
    const throws = this.callThrows(node) ? { throws: true } : {};
    if (ts.isObjectLiteralExpression(src)) {
      const length = src.properties.length === 1 ? src.properties[0]! : undefined;
      if (!length || !ts.isPropertyAssignment(length) || length.name.getText() !== "length") return this.error(src, "Array.from of an object takes `{ length: n }` natively.");
      if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) || fn.parameters.some((p) => !ts.isIdentifier(p.name) || p.initializer || p.dotDotDotToken)) {
        return this.error(node, "Array.from({ length: n }) takes a function of the index natively: Array.from({ length: n }, (_, i) => …).");
      }
      const [first, index] = fn.parameters;
      const symbol = first && this.checker.getSymbolAtLocation(first.name);
      let used = false;
      const visit = (n: ts.Node): void => {
        if (ts.isIdentifier(n) && n !== first?.name && this.checker.getSymbolAtLocation(n) === symbol) used = true;
        else ts.forEachChild(n, visit);
      };
      if (symbol) visit(fn.body);
      if (used) return this.error(first!, "This value is always undefined in Array.from({ length: n }, …): take the index, `(_, i) => …`.");
      const lambda = this.expr(fn, ctx, { k: "fn", params: [T.int, T.int], ret: out.of, ...throws });
      if (lambda.e !== "lambda") return lambda;
      const i = lambda.params[1];
      lambda.params = [i && index && i.ty.k === "int" ? i : { name: `i${++this.temps}__`, ty: T.int }];
      if (i && index && i.ty.k !== "int") return this.error(index, "Take the index as a whole number in Array.from({ length: n }, (_, i) => …); convert it inside.");
      return { e: "op", op: "arr.fromLength", args: [{ e: "arr", of: out.of, items: [] }, this.expr(length.initializer, ctx, T.int), lambda], ty: out, ...throws };
    }
    const chars = this.isString(this.typeOf(src));
    const iter = chars ? undefined : this.arrayIter(src);
    const srcTy = chars ? T.array(T.string) : iter?.kind === "keys" ? T.array(fn ? T.int : out.of) : this.tyOfExpr(iter ? iter.recv : src);
    if (srcTy.k !== "array" || !(iter || chars || this.isArray(this.typeOf(src)))) return this.error(src, "Array.from takes an array, `{ length: n }`, a generator, or xs.keys() / xs.values() natively.");
    const source = chars ? this.codePoints(src, ctx) : iter ? this.iterArray(iter, srcTy.of, ctx) : this.expr(src, ctx);
    if (!fn) return iter || chars ? source : { e: "op", op: "arr.slice", args: [source, { e: "int", v: "0" }, { e: "nil" }] };
    const arity = ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) ? fn.parameters.length : (this.typeOf(fn).getCallSignatures()[0]?.parameters.length ?? 1);
    if (arity > 2) return this.error(fn, "Array.from's function takes the item and its index natively.");
    const lambda = this.expr(fn, ctx, { k: "fn", params: arity === 2 ? [srcTy.of, T.int] : [srcTy.of], ret: out.of, ...throws });
    return { e: "op", op: arity === 2 ? "arr.mapI" : "arr.map", args: [source, lambda], ...throws };
  }

  /**
   * `for (const [i, x] of xs.entries())`, `for (const i of xs.keys())`, `for (const x of xs.values())`: an index loop,
   * live as JavaScript's array iterator (it reads the length at every step, so it sees pushes).
   */
  private arrayIterLoop(node: ts.ForOfStatement, ctx: Ctx): Stmt[] | undefined {
    const it = this.arrayIter(node.expression);
    if (!it) return undefined;
    const decl = node.initializer as ts.VariableDeclarationList;
    const binding = decl.declarations[0]!.name;
    const mutable = !(decl.flags & ts.NodeFlags.Const);
    let k: ts.Identifier | undefined;
    let v: ts.Identifier | undefined;
    if (it.kind === "entries") {
      if (!ts.isArrayBindingPattern(binding) || binding.elements.length > 2 || binding.elements.some((el) => !ts.isOmittedExpression(el) && (!ts.isIdentifier(el.name) || el.initializer || el.dotDotDotToken))) {
        return [this.unsupported(binding, "this loop over entries(); write `for (const [i, x] of xs.entries())`")];
      }
      [k, v] = binding.elements.map((el) => (ts.isOmittedExpression(el) ? undefined : (el.name as ts.Identifier)));
    } else if (!ts.isIdentifier(binding)) return [this.unsupported(binding, `destructuring in a loop over ${it.kind}()`)];
    else if (it.kind === "keys") k = binding;
    else v = binding;
    const n = ++this.temps;
    const [arr, idx, at] = [`arr__${n}`, `i__${n}`, `k__${n}`];
    const elem = (this.tyOfExpr(it.recv) as Extract<Ty, { k: "array" }>).of;
    const id = (name: string): Expr => ({ e: "id", name });
    const binds: Stmt[] = [
      { s: "let", name: at, ty: T.int, init: id(idx), mutable: false },
      { s: "assign", target: id(idx), op: "+=", value: { e: "int", v: "1" } },
    ];
    const tyOf = (name: ts.Identifier) => this.tyOfSymbol(this.checker.getSymbolAtLocation(name)!, name);
    if (k) binds.push({ s: "let", name: k.text, ty: tyOf(k), init: this.convert(id(at), T.int, tyOf(k)), mutable });
    if (v) binds.push({ s: "let", name: v.text, ty: tyOf(v), init: this.convert({ e: "index", obj: id(arr), index: id(at) }, elem, tyOf(v)), mutable });
    const body = [...binds, ...this.block(node.statement, { ...ctx, continueWith: undefined })];
    return [{ s: "if", c: { e: "bool", v: true }, then: [
      { s: "let", name: arr, ty: T.array(elem), init: this.expr(it.recv, ctx), mutable: false },
      { s: "let", name: idx, ty: T.int, init: { e: "int", v: "0" }, mutable: true },
      { s: "while", c: { e: "bin", op: "<", l: id(idx), r: { e: "op", op: "arr.length", args: [id(arr)] } }, body },
    ] }];
  }

  /** Methods of built-in values: arrays, strings, numbers, Math, Date, console, router, response, when(). */
  private method(callee: ts.PropertyAccessExpression, node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const name = callee.name.text;
    const recv = callee.expression;
    const args = node.arguments;
    if (ts.isIdentifier(recv) && recv.text === "Math") {
      const ops: Record<string, Op> = { floor: "math.floor", ceil: "math.ceil", round: "math.round", trunc: "math.trunc", abs: "math.abs", min: "math.min", max: "math.max", sqrt: "math.sqrt", pow: "math.pow", random: "math.random" };
      const op = ops[name];
      // hypot: () is 0, (x) is |x|; more than two numbers JavaScriptCore sums its own way (no native equivalent).
      if (name === "hypot" && args.length < 2 && !args.some(ts.isSpreadElement)) return args[0] ? { e: "op", op: "math.abs", args: [this.expr(args[0], ctx, T.double)] } : { e: "double", v: "0.0" };
      // More than two (or a spread): JavaScriptCore's own algorithms, ported (jsHypotN, rest).
      if (name === "hypot" && (args.length > 2 || args.some(ts.isSpreadElement))) return this.jsFn("hypotN", T.double, [this.arrayOf(args, T.double, ctx)]);
      if (!op && MATH_FNS.has(name)) return { e: "op", op: "math.fn", args: [{ e: "str", v: name }, ...args.map((a) => this.expr(a, ctx, T.double))] };
      if (name === "imul" || name === "clz32") {
        if (args.length < (name === "imul" ? 2 : 1)) return this.error(node, `Math.${name}() takes ${name === "imul" ? "two numbers" : "a number"} natively.`);
        return { e: "op", op: `bit.${name}`, args: args.slice(0, name === "imul" ? 2 : 1).map((a) => this.expr(a, ctx)) };
      }
      if (!op) return this.error(node, `Math.${name} is not available natively.`);
      // `Math.max(...xs)`, `Math.min(0, ...xs)`: a fold from -Infinity / Infinity, which an empty array gives.
      if ((op === "math.min" || op === "math.max") && args.some(ts.isSpreadElement)) {
        const n = ++this.temps;
        const [acc, v] = [`m${n}__`, `v${n}__`];
        const inf: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] };
        const step: Expr = { e: "lambda", params: [{ name: acc, ty: T.double }, { name: v, ty: T.double }], ret: T.double, body: { e: "op", op, args: [{ e: "id", name: acc }, { e: "id", name: v }] } };
        return { e: "op", op: "arr.reduce", args: [this.arrayOf(args, T.double, ctx), step, op === "math.min" ? inf : { e: "neg", x: inf }], ty: T.double };
      }
      const num = this.numKind(node) === "int" && (op === "math.abs" || op === "math.min" || op === "math.max") ? T.int : T.double;
      // Math.max() is -Infinity, Math.min() Infinity; of one number, the number.
      if ((op === "math.min" || op === "math.max") && args.length < 2) {
        if (args.length) return this.expr(args[0]!, ctx, num);
        const inf: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] };
        return op === "math.min" ? inf : { e: "neg", x: inf };
      }
      // Math.floor(n) of a whole number is the number itself.
      if (["math.floor", "math.ceil", "math.round", "math.trunc"].includes(op) && this.numKind(args[0]!) === "int") return this.expr(args[0]!, ctx, T.int);
      // Not provably a finite 32-bit result: computed in Doubles, so NaN and Infinity stay what JavaScript gives.
      if (["math.floor", "math.ceil", "math.round", "math.trunc"].includes(op) && this.numKind(node) === "double") {
        return { e: "op", op: "math.fn", args: [{ e: "str", v: name === "round" ? "jsRound" : name }, this.expr(args[0]!, ctx, T.double)] };
      }
      return { e: "op", op, args: args.map((a) => this.expr(a, ctx, num)) };
    }
    if (ts.isIdentifier(recv) && recv.text === "Number" && name === "isSafeInteger" && args.length === 1) return this.jsFn("isSafeInteger", T.bool, [this.expr(args[0]!, ctx, T.double)]);
    if (ts.isIdentifier(recv) && recv.text === "Number" && ["isInteger", "isNaN", "isFinite"].includes(name) && args.length === 1) {
      return { e: "op", op: "math.fn", args: [{ e: "str", v: name }, this.expr(args[0]!, ctx, T.double)] };
    }
    if (ts.isIdentifier(recv) && recv.text === "Number" && (name === "parseInt" || name === "parseFloat")) return this.parseNumber(name, node, ctx);
    if (ts.isIdentifier(recv) && recv.text === "String" && (name === "fromCharCode" || name === "fromCodePoint")) {
      const spread = args.find(ts.isSpreadElement);
      if (spread && args.length > 1) return this.error(node, `${name}() takes either numbers or one spread array natively.`);
      // `throws`: fromCodePoint of anything but valid literals (callThrows).
      const safe = name === "fromCodePoint" && !this.strNumThrows(node) ? "!" : "";
      if (spread) return this.jsFn(`${name}s${safe}`, T.string, [this.expr(spread.expression, ctx, T.array(T.double))]);
      return this.jsFn(`${name}${safe}`, T.string, args.map((a) => this.expr(a, ctx, T.double)));
    }
    if (ts.isIdentifier(recv) && recv.text === "Date" && name === "now") return { e: "op", op: "date.now", args: [] };
    if (ts.isIdentifier(recv) && this.apiName(recv) === "console" && name === "log") return { e: "rt", name: "log", args: args.map((a) => this.str(a, ctx)) };
    if (ts.isIdentifier(recv) && recv.text === "Array" && this.isLibGlobal(recv)) return this.arrayStatic(name, node, ctx);
    // `new Array<T>(n).fill(v)` / `Array<T>(n).fill(v)`: n holes, every one filled at once.
    const holes = this.holeyLength(recv);
    if (holes) {
      const of = this.tyOfExpr(node);
      if (name !== "fill" || args.length !== 1 || of.k !== "array") return this.error(recv, HOLES);
      // A length not known to be valid: checked (a 4th argument), a RangeError as JavaScript throws (libThrows).
      if (this.libThrows(node)) return { e: "op", op: "arr.filled", args: [{ e: "arr", of: of.of, items: [] }, this.expr(holes, ctx, T.double), this.expr(args[0]!, ctx, of.of), { e: "bool", v: true }], ty: of, throws: true };
      return { e: "op", op: "arr.filled", args: [{ e: "arr", of: of.of, items: [] }, this.expr(holes, ctx, T.int), this.expr(args[0]!, ctx, of.of)], ty: of };
    }

    const recvType = this.checker.getNonNullableType(this.typeOf(recv));
    const packed = this.storedArray(recv);
    if (packed && !["push", "unshift", "splice"].includes(name)) {
      return this.error(node, `${name}() is not supported on ${this.an(packed)}[] natively (packed ${packed}s): use xs[i], xs[i] = v, xs.length, push, unshift, splice(i, n), [...xs] and index loops.`);
    }
    const recvTy = packed ? T.array({ k: "num", n: packed }) : this.ty(recvType, recv);
    const obj = this.expr(recv, ctx, this.isArray(recvType) && !packed ? recvTy : undefined);

    if (this.isArray(recvType)) {
      const elem = (recvTy as Extract<Ty, { k: "array" }>).of;
      // A callback may take the index as well: `(x, i) => …` is the op's indexed form.
      const arity = (fn: ts.Expression | undefined) =>
        !fn ? 0 : ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) ? fn.parameters.length : (this.typeOf(fn).getCallSignatures()[0]?.parameters.length ?? 1);
      const indexed = arity(args[0]) === 2;
      // A callback that can throw makes the call throw (`call` marks it).
      const throws = this.callThrows(node) ? { throws: true } : {};
      const cb = (i: number, ret: Ty) => this.expr(args[i]!, ctx, { k: "fn", params: indexed ? [elem, T.int] : [elem], ret, ...throws });
      const checkCallback = () => {
        if (arity(args[0]) > 2) this.error(args[0]!, `${name}() callbacks take the item and its index natively (not the array).`);
      };
      const each = (op: string): Op => `arr.${op}${indexed ? "I" : ""}` as Op;
      switch (name) {
        // As a value (`n = xs.push(v)`), the `Len` form: the new length, as in JavaScript.
        case "push": {
          const used = this.valueUsed(node);
          if (args.length === 1 && !ts.isSpreadElement(args[0]!)) return { e: "op", op: used ? "arr.pushLen" : "arr.push", args: [obj, this.expr(args[0]!, ctx, elem)] };
          return { e: "op", op: used ? "arr.pushAllLen" : "arr.pushAll", args: [obj, this.items(args, elem, ctx)] };
        }
        case "pop":
          return this.flat({ e: "op", op: "arr.pop", args: [obj] }, elem);
        case "unshift":
          if (args.length === 1 && !ts.isSpreadElement(args[0]!)) return { e: "op", op: this.valueUsed(node) ? "arr.unshiftLen" : "arr.unshift", args: [obj, this.expr(args[0]!, ctx, elem)] };
          if (this.valueUsed(node)) return this.error(node, "unshift() of several items as a value is not supported natively; call it, then read xs.length.");
          return { e: "op", op: "arr.splice", args: [obj, { e: "int", v: "0" }, { e: "int", v: "0" }, this.items(args, elem, ctx)] };
        case "splice": {
          // No count: everything from the start on.
          const count: Expr = args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: "2147483647" };
          return { e: "op", op: "arr.splice", args: [obj, this.expr(args[0]!, ctx, T.int), count, ...(args.length > 2 ? [this.items(args.slice(2), elem, ctx)] : [])] };
        }
        case "indexOf":
        case "includes":
        case "lastIndexOf":
          if (elem.k === "union") {
            const from: Expr = args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: name === "lastIndexOf" ? "2147483647" : "0" };
            return this.unionCall(`${elem.name}__${name}`, () => this.unionSearchFn(elem.name, name), [obj, this.expr(args[0]!, ctx, elem), from]);
          }
          return { e: "op", op: `arr.${name}` as Op, args: [obj, this.expr(args[0]!, ctx, elem), ...(args[1] ? [this.expr(args[1], ctx, T.int)] : [])] };
        case "join":
        case "toString": {
          const text = this.joinText(obj, elem, args[0] ? this.expr(args[0], ctx, T.string) : { e: "str", v: "," });
          return text ?? this.error(node, `${name}() is supported on arrays of strings, numbers, booleans, bigints, their optionals and arrays of them.`);
        }
        case "fill": {
          const end = args[2] ? [this.expr(args[2], ctx, T.int)] : [];
          return { e: "op", op: "arr.fill", args: [obj, this.expr(args[0]!, ctx, elem), args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: "0" }, ...end], ty: recvTy };
        }
        case "copyWithin":
          return { e: "op", op: "arr.copyWithin", args: [obj, this.expr(args[0]!, ctx, T.int), args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: "0" }, ...(args[2] ? [this.expr(args[2], ctx, T.int)] : [])], ty: recvTy };
        case "flat": {
          if (args[0] && !ts.isNumericLiteral(args[0])) return this.error(args[0], "flat() takes a literal depth natively (its result type depends on it).");
          let depth = args[0] ? Number(args[0].text) : 1;
          let out: Expr = obj;
          let of: Ty = elem;
          // One level at a time while the elements are arrays: `flat(9)` of a `T[][]` is `flat(1)`.
          for (; depth > 0 && of.k === "array"; depth--) {
            out = { e: "op", op: "arr.flat", args: [out], ty: of };
            of = of.of;
          }
          return out === obj ? { e: "op", op: "arr.slice", args: [obj, { e: "int", v: "0" }, { e: "nil" }] } : out;
        }
        case "flatMap": {
          checkCallback();
          const out = this.tyOfExpr(node) as Extract<Ty, { k: "array" }>;
          const ret = args[0] && this.typeOf(args[0]).getCallSignatures()[0]?.getReturnType();
          if (!ret || (!this.isArray(ret) && ret.isUnion() && ret.types.some((t) => this.isArray(t)))) return this.error(node, "flatMap() callbacks return either an array or a value natively (not a union of both).");
          const nested = this.isArray(ret);
          const mapped: Expr = { e: "op", op: each("map"), args: [obj, cb(0, nested ? out : out.of)], ...throws };
          return nested ? { e: "op", op: "arr.flat", args: [mapped], ty: out } : mapped;
        }
        case "reduceRight": {
          if (args.length < 2) return this.reduceFirst(node, name, obj, args[0]!, elem, ctx);
          if (arity(args[0]) > 2) return this.error(args[0]!, "reduceRight() callbacks take the total and the item natively (not the index).");
          const acc = this.tyOfExpr(node);
          return { e: "op", op: "arr.reduceRight", args: [obj, this.expr(args[0]!, ctx, { k: "fn", params: [acc, elem], ret: acc, ...throws }), this.expr(args[1]!, ctx, acc)], ty: acc };
        }
        case "keys":
        case "values":
        case "entries":
          return this.error(node, `${name}() is supported in for…of (\`for (const [i, x] of xs.entries())\`), in a spread (\`[...xs.${name}()]\`) and in Array.from natively.`);
        case "concat":
          return { e: "op", op: "arr.concat", args: [obj, ...args.map((a): Expr => (this.isArray(this.typeOf(a)) ? this.expr(a, ctx, recvTy) : { e: "arr", of: elem, items: [this.expr(a, ctx, elem)] }))] };
        case "sort":
          return { e: "op", op: "arr.sort", args: [obj, args[0] ? this.expr(args[0], ctx, { k: "fn", params: [elem, elem], ret: T.double, ...throws }) : this.defaultComparator(elem, node)] };
        case "reverse":
          return { e: "op", op: "arr.reverse", args: [obj] };
        // ES2023 copies: sort / reverse / splice of a copy, `with` a copy with one element replaced.
        case "toSorted":
        case "toReversed": {
          const copy: Expr = { e: "op", op: "arr.slice", args: [obj, { e: "int", v: "0" }, { e: "nil" }] };
          if (name === "toReversed") return { e: "op", op: "arr.reverse", args: [copy] };
          return { e: "op", op: "arr.sort", args: [copy, args[0] ? this.expr(args[0], ctx, { k: "fn", params: [elem, elem], ret: T.double, ...throws }) : this.defaultComparator(elem, node)] };
        }
        case "toSpliced": {
          const count: Expr = args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: "2147483647" };
          return { e: "op", op: "arr.toSpliced", args: [obj, args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }, args[0] ? count : { e: "int", v: "0" }, ...(args.length > 2 ? [this.items(args.slice(2), elem, ctx)] : [])], ty: recvTy };
        }
        case "with":
          // A RangeError out of range, the index converted as JavaScript does: to a catch around it (libThrows), else
          // fatal (a 4th argument), as JavaScript's uncaught error.
          if (this.libThrows(node)) return { e: "op", op: "arr.with", args: [obj, this.expr(args[0]!, ctx, T.double), this.expr(args[1]!, ctx, elem)], ty: recvTy, throws: true };
          return { e: "op", op: "arr.with", args: [obj, this.expr(args[0]!, ctx, T.double), this.expr(args[1]!, ctx, elem), { e: "bool", v: true }], ty: recvTy };
        case "shift":
          return this.flat({ e: "op", op: "arr.shift", args: [obj] }, elem);
        case "at":
          return this.flat({ e: "op", op: "arr.atRel", args: [obj, this.expr(args[0]!, ctx, T.int)] }, elem);
        case "reduce": {
          if (args.length < 2) return this.reduceFirst(node, name, obj, args[0]!, elem, ctx);
          if (arity(args[0]) > 2) return this.error(args[0]!, "reduce() callbacks take the total and the item natively (not the index).");
          const acc = this.tyOfExpr(node);
          return { e: "op", op: "arr.reduce", args: [obj, this.expr(args[0]!, ctx, { k: "fn", params: [acc, elem], ret: acc, ...throws }), this.expr(args[1]!, ctx, acc)] };
        }
        case "slice":
          return { e: "op", op: "arr.slice", args: [obj, args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }, args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
        case "find":
        case "findIndex":
        case "findLast":
        case "findLastIndex":
        case "filter":
        case "some":
        case "every": {
          checkCallback();
          // A test returning a number or a nullable (`xs.filter((x) => x)`) would be used as is natively, not as its truthiness.
          const ret = args[0] && this.typeOf(args[0]).getCallSignatures()[0]?.getReturnType();
          if (ret && !this.isBoolean(ret) && !(ret.flags & ts.TypeFlags.Never)) return this.error(args[0]!, `${name}() callbacks must return a boolean natively: write the test (\`x !== undefined\`, \`x > 0\`, \`!!x\`).`, this.truthyFix(args[0]!));
          if (name === "findLast" || name === "findLastIndex") {
            // The runtimes take (item, index) only: an item-only test gets an unused index.
            const f = cb(0, T.bool);
            const unused: Param = { name: `unused__${++this.temps}`, ty: T.int, unused: true };
            const x = `x${++this.temps}__`;
            const test: Expr = indexed ? f
              : f.e === "lambda" ? { ...f, params: [...f.params, unused] }
              : { e: "lambda", params: [{ name: x, ty: elem }, unused], ret: T.bool, body: { e: "call", callee: f, args: [{ e: "id", name: x }], ...throws }, ...throws };
            const found: Expr = { e: "op", op: `arr.${name}` as Op, args: [obj, test], ...throws, ty: name === "findLast" ? { k: "optional", of: elem } : T.int };
            return name === "findLast" ? this.flat(found, elem) : found;
          }
          if (name === "find") return this.flat({ e: "op", op: each(name), args: [obj, cb(0, T.bool)] }, elem);
          const kept: Expr = { e: "op", op: each(name), args: [obj, cb(0, T.bool)] };
          // `xs.filter((x): x is T => x !== null)`: a type predicate dropping null gives an array of T natively too.
          const outType = name === "filter" && elem.k === "optional" ? this.checker.getNonNullableType(this.typeOf(node)) : undefined;
          const outElem = outType && this.isArray(outType) ? this.bound(this.checker.getTypeArguments(outType as ts.TypeReference)[0]!) : undefined;
          // (`(x) => x === null` is inferred as the predicate `x is null`: an array of nulls, which stays as it is.)
          const narrowed = !!outElem && !this.isNullable(outElem) && !(outElem.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.Never));
          const out = narrowed ? this.tyOfExpr(node) : undefined;
          if (out?.k === "array" && elem.k === "optional" && out.of.k !== "optional") {
            const x = `x${++this.temps}__`;
            return { e: "op", op: each("map"), args: [kept, { e: "lambda", params: [{ name: x, ty: elem }], ret: out.of, body: { e: "unwrap", x: { e: "id", name: x } } }] };
          }
          return kept;
        }
        case "forEach":
          checkCallback();
          return { e: "op", op: each("forEach"), args: [obj, cb(0, T.void)] };
        case "map": {
          checkCallback();
          const out = this.tyOfExpr(node);
          return { e: "op", op: each("map"), args: [obj, cb(0, out.k === "array" ? out.of : T.void)] };
        }
      }
      return this.error(node, `Array.${name}() is not available natively.`);
    }
    if (this.isString(recvType)) {
      const strOps: Record<string, Op> = {
        trim: "str.trim", trimStart: "str.trimStart", trimEnd: "str.trimEnd", toUpperCase: "str.upper", toLowerCase: "str.lower",
        includes: "str.includes", startsWith: "str.startsWith", endsWith: "str.endsWith", slice: "str.slice",
      };
      const text = (i: number, fallback?: string): Expr => (args[i] ? this.expr(args[i]!, ctx, T.string) : { e: "str", v: fallback ?? "" });
      const int = (i: number, fallback: string): Expr => (args[i] ? this.expr(args[i]!, ctx, T.int) : { e: "int", v: fallback });
      const INFINITY: Expr = { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] };
      const num = (i: number, fallback: Expr = { e: "double", v: "0.0" }): Expr => (args[i] ? this.expr(args[i]!, ctx, T.double) : fallback);
      // `s.replace(pattern, (match, offset, s) => …)` of a string pattern: the callback per match (lib4).
      if ((name === "replace" || name === "replaceAll") && args.length === 2 && this.isString(this.typeOf(args[0]!)) && (ts.isArrowFunction(args[1]!) || ts.isFunctionExpression(args[1]!))) {
        const fn = args[1];
        if (fn.parameters.length > 3) return this.error(fn, "A replace() callback takes (match, offset, string) natively (no capture groups without a regular expression).");
        if (this.valueThrows(fn)) return this.error(fn, "A replace() callback that can throw is not supported natively; catch inside it.");
        const params = [T.string, T.double, T.string];
        const f = this.expr(fn, ctx, { k: "fn", params, ret: T.string });
        if (f.e === "lambda") for (let i = f.params.length; i < 3; i++) f.params.push({ name: `rp__${++this.temps}`, ty: params[i]!, unused: true });
        return this.jsFn(`${name}Fn`, T.string, [obj, text(0), f]);
      }
      const strings =args.every((a) => this.isString(this.typeOf(a)) || this.isNumber(this.typeOf(a)));
      if (!strings) return this.error(node, `${name}() takes strings and numbers natively (no regular expressions or callbacks).`);
      switch (name) {
        case "toString":
          return obj;
        case "split":
          if (!args.length) return { e: "arr", of: T.string, items: [obj] };
          if (args.length === 2) return this.jsFn("splitLimit", T.array(T.string), [obj, text(0), num(1)]);
          return { e: "op", op: "str.split", args: [obj, text(0)] };
        // Positions by UTF-16 units, converted as JavaScript does (NaN is 0, fractions truncate, out of range clamps).
        case "charAt":
          return this.jsFn("charAt", T.string, [obj, num(0)]);
        case "charCodeAt":
          return this.jsFn("charCodeAt", T.double, [obj, num(0)]);
        case "codePointAt":
          return this.jsFn("codePointAt", T.optional(T.double), [obj, num(0)]);
        case "at":
          return this.jsFn("strAt", T.optional(T.string), [obj, num(0)]);
        case "substring":
          return this.jsFn("substring", T.string, [obj, num(0), num(1, INFINITY)]);
        case "substr":
          return this.jsFn("substr", T.string, [obj, num(0), num(1, INFINITY)]);
        case "concat":
          return { e: "tpl", parts: [obj, ...args.map((a) => this.str(a, ctx))] };
        case "normalize": {
          const form = args[0] ? (ts.isStringLiteralLike(args[0]) ? args[0].text : "") : "NFC";
          if (!["NFC", "NFD", "NFKC", "NFKD"].includes(form)) return this.error(node, 'normalize() takes "NFC", "NFD", "NFKC" or "NFKD" as a literal natively.');
          return this.jsFn("normalize", T.string, [obj, { e: "str", v: form }]);
        }
        case "startsWith":
        case "endsWith":
        case "includes":
          if (args.length < 2) break;
          return this.jsFn(`${name}At`, T.bool, [obj, text(0), num(1)]);
        case "replace":
        case "replaceAll":
          return { e: "op", op: `str.${name}`, args: [obj, text(0), text(1)] };
        case "indexOf":
          // A position that may be NaN, ±Infinity or a fraction is converted as JavaScript does (an Int conversion would trap).
          if (args[1] && this.numKind(args[1]) !== "int") return this.jsFn("indexOfFrom", T.int, [obj, text(0), num(1)]);
          return { e: "op", op: "str.indexOf", args: [obj, text(0), int(1, "0")] };
        case "lastIndexOf":
          if (args.length > 1) return this.jsFn("lastIndexOfFrom", T.int, [obj, text(0), num(1)]);
          return { e: "op", op: "str.lastIndexOf", args: [obj, text(0)] };
        case "padStart":
        case "padEnd":
          return { e: "op", op: `str.${name}`, args: [obj, int(0, "0"), text(1, " ")] };
        case "repeat":
          // A count not known to be valid: a RangeError when negative or infinite (libThrows).
          if (this.libThrows(node) || this.libFatal(node)) return this.jsFn(`strRepeat${this.libThrows(node) ? "" : "!"}`, T.string, [obj, this.expr(args[0]!, ctx, T.double)]);
          return { e: "op", op: "str.repeat", args: [obj, int(0, "0")] };
        case "localeCompare":
          return this.error(node, "localeCompare() depends on the platform's locale data; compare with < and > (UTF-16 order, the same everywhere), or `compareText(a, b, { sensitivity, numeric })` / `collator(…)` from @nuclo/native-ts/adapters (case- and accent-insensitive, natural number order, the same everywhere).");
      }
      const op = strOps[name];
      if (!op) return this.error(node, `String.${name}() is not available natively.`);
      if (op === "str.slice") return { e: "op", op, args: [obj, this.expr(args[0]!, ctx, T.int), args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
      return { e: "op", op, args: [obj, ...args.map((a) => this.expr(a, ctx, T.string))] };
    }
    if ((this.isNumber(recvType) || this.isBoolean(recvType)) && name === "toString" && !args.length) return this.str(recv, ctx);
    if (this.isNumber(recvType) && name === "toFixed") {
      if (this.libThrows(node) || this.libFatal(node)) return this.jsFn(`toFixedChecked${this.libThrows(node) ? "" : "!"}`, T.string, [this.expr(recv, ctx, T.double), this.expr(args[0]!, ctx, T.double)]);
      return { e: "op", op: "num.toFixed", args: [this.expr(recv, ctx, T.double), args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }] };
    }
    // toString(radix), toPrecision(p), toExponential(f): JavaScript's digits (exact rounding, JSC's radix fractions);
    // a RangeError for an argument out of range, unless it is a literal in range (`!`, can't throw).
    if (this.isNumber(recvType) && ["toString", "toPrecision", "toExponential"].includes(name)) {
      if (!args.length) return name === "toExponential" ? this.jsFn("toExponentialAuto", T.string, [this.expr(recv, ctx, T.double)]) : this.str(recv, ctx);
      if (!this.isNumber(this.typeOf(args[0]!)) || this.isNullable(this.typeOf(args[0]!))) return this.error(args[0]!, `${name}() takes a number natively.`);
      if (name === "toString" && ts.isNumericLiteral(args[0]!) && Math.trunc(Number(args[0].text)) === 10) return this.str(recv, ctx);
      const fn = name === "toString" ? "toRadix" : name;
      return this.jsFn(`${fn}${this.strNumThrows(node) ? "" : "!"}`, T.string, [this.expr(recv, ctx, T.double), this.expr(args[0]!, ctx, T.double)]);
    }
    if (recvTy.k === "rt") {
      switch (recvTy.name) {
        case "Router":
          return { e: "method", obj, name, args: args.map((a) => this.expr(a, ctx, T.string)) };
        case "WhenBuilder":
          return name === "when"
            ? { e: "method", obj, name, args: [this.condition(args[0]!, ctx), this.content(args.slice(1), ctx)] }
            : { e: "method", obj, name, args: [this.content(args, ctx)] };
        case "Response": {
          if (name === "text") return { e: "method", obj, name, args: [] };
          if (name === "json") {
            const promised = this.checker.getAwaitedType(this.typeOf(node));
            const ty = promised ? this.ty(promised, node) : T.void;
            const why = this.undecodable(ty, "T");
            if (why) return this.error(node, `json<T>() needs T made of interfaces, arrays, strings, numbers and booleans: ${why}.`);
            this.decoded.push(ty);
            return { e: "method", obj, name, args: [{ e: "decoder", ty }] };
          }
        }
      }
    }
    return undefined;
  }

  /** `sort()` without a comparator compares the items as text, as JavaScript does: `[10, 9].sort()` is `[10, 9]`. */
  private defaultComparator(elem: Ty, node: ts.Node): Expr {
    if (!["string", "int", "double", "bool"].includes(elem.k) && !(elem.k === "rt" && elem.name === "BigInt")) return this.error(node, "sort() of objects needs a comparator (JavaScript would compare \"[object Object]\").");
    const text = (name: string): Expr => (elem.k === "string" ? { e: "id", name } : { e: "toStr", x: { e: "id", name }, from: elem });
    return {
      e: "lambda",
      params: [{ name: "a__", ty: elem }, { name: "b__", ty: elem }],
      ret: T.double,
      body: { e: "toDouble", x: { e: "op", op: "str.compare", args: [text("a__"), text("b__")] } },
    };
  }

  /** `{ intent: "danger", block: true }` → ["intent": "danger", "block": "true"]. */
  private selection(node: ts.Expression, ctx: Ctx): Expr {
    if (!ts.isObjectLiteralExpression(node)) return this.error(node, "Pass variant selections as an object literal.");
    return {
      e: "dict",
      of: T.string,
      entries: node.properties.map((prop) => {
        if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) return ["", this.error(prop, "Unsupported selection entry (read at compile time): write `group: \"variant\"` with a plain name.")];
        return [prop.name.text, this.str(prop.initializer, ctx)];
      }),
    };
  }

  // -------------------------------------------------------------------------
  // nuclo
  // -------------------------------------------------------------------------

  private nuclo(name: string, node: ts.CallExpression, ctx: Ctx): Expr {
    const args = node.arguments;
    if (TAGS.has(name)) {
      let tag = name;
      const typeProp = this.attrValue(args, "type");
      if (name === "input" && typeProp && ts.isStringLiteral(typeProp) && typeProp.text === "checkbox") tag = "checkbox";
      return { e: "rt", name: tag, args: this.children(args, ctx) };
    }
    if (NAMED_TAGS.has(name)) return { e: "rt", name: "el", args: [{ e: "str", v: name.replace(/_$/, "") }, ...this.children(args, ctx)] };
    if (name === "progress" || name === "meter") return this.gauge(name, args, ctx);
    if (name === "select") return this.select(node, ctx);
    if (name === "option") return this.option(node, ctx);
    if (name === "optgroup") return this.optgroup(node, ctx);
    switch (name) {
      case "update":
      case "scope":
        return { e: "rt", name, args: args.map((a) => this.expr(a, ctx, T.string)) };
      case "render":
      case "hydrate":
        return { e: "rt", name: "render", args: [this.expr(args[0]!, ctx, { k: "fn", params: [], ret: T.rt("Node") })] };
      case "forceUpdate":
        return { e: "rt", name, args: [] };
      case "requestAnimationFrame":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, { k: "fn", params: [T.double], ret: T.void })] };
      case "cancelAnimationFrame":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx)] };
      case "native":
        return this.error(node, "Declare a native component as a top-level const: const MapView = native<MapProps>(\"MapView\").");
      case "list": {
        const renderTy = this.tyOfExpr(args[1]!);
        const elem = renderTy.k === "fn" ? renderTy.params[0]! : T.void;
        // The options a list makes put their text in the select's label as a whole: one piece for every item.
        const select = this.selects.at(-1);
        const outer = select?.collect;
        if (select) select.collect = [];
        const list: Expr = {
          e: "rt",
          name,
          args: [
            this.expr(args[0]!, ctx, { k: "fn", params: [], ret: T.array(elem) }),
            this.expr(args[1]!, ctx, { k: "fn", params: [elem, T.int], ret: T.optional(T.rt("Node")) }),
          ],
        };
        if (select) {
          const pieces = select.collect;
          select.collect = outer!;
          const render = args[1]!;
          if (pieces.length && !ts.isArrowFunction(render)) this.error(render, "Write the render function of a list of options as an arrow function.");
          else if (pieces.length && ts.isArrowFunction(render)) {
            const items = ts.isArrowFunction(args[0]!) && !ts.isBlock(args[0].body) ? this.expr(args[0].body, ctx, T.array(elem)) : { e: "call" as const, callee: this.expr(args[0]!, ctx), args: [] };
            const each: Expr = { e: "lambda", params: this.params(render).slice(0, 1), ret: T.string, body: { e: "tpl", parts: pieces } };
            outer!.push({ e: "op", op: "arr.join", args: [{ e: "op", op: "arr.map", args: [items, each] }, { e: "str", v: "" }] });
          }
        }
        return list;
      }
      case "when":
        return { e: "rt", name, args: [this.condition(args[0]!, ctx), this.content(args.slice(1), ctx)] };
      case "region": {
        const options = args[0];
        if (!options || !ts.isObjectLiteralExpression(options)) return this.error(node, "region() takes an object literal.");
        const get = (key: string) => this.attrValue([options], key);
        const id = get("id");
        const type = get("type");
        const empty = get("empty");
        const named: [string, Expr][] = [];
        if (type) named.push(["type", this.expr(type, ctx, T.string)]);
        if (empty) named.push(["empty", this.content([empty], ctx)]);
        return { e: "rt", name, args: [id ? this.expr(id, ctx, T.string) : this.error(node, "region() needs an id.")], named };
      }
      case "into":
        if (!ts.isStringLiteral(args[0]!) && !this.isString(this.typeOf(args[0]!))) return this.error(node, "into() takes a region id and content.");
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, T.string), this.content(args.slice(1), ctx)] };
      case "on": {
        const type = args[0];
        const handler = args[1];
        if (!type || !ts.isStringLiteral(type) || !handler) return this.error(node, "on() takes a literal event name.");
        return this.attr(`on${type.text[0]!.toUpperCase()}${type.text.slice(1)}`, handler, ctx);
      }
      case "css":
        // css("name", style): the name is the web's class name; natively a class is a value.
        return { e: "rt", name, args: [this.expr(args.at(-1)!, ctx, T.rt("Style"))] };
      case "cx":
        return { e: "rt", name, args: args.map((a) => this.optionalChild(a, ctx, T.rt("StyleClass"))) };
      case "variants":
        return this.variants(node, ctx);
      case "keyframes": {
        // The frames go where an `animation` names this const; the value is only its name.
        const decl = node.parent;
        return { e: "str", v: ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) ? decl.name.text : "keyframes" };
      }
      case "globalStyle": {
        if (!ts.isExpressionStatement(node.parent) || !ts.isSourceFile(node.parent.parent)) return this.error(node, "Call globalStyle() at the top level.");
        const selector = this.constValue(args[0]!);
        if (typeof selector !== "string") return this.error(args[0]!, "globalStyle() takes its selector as a literal.");
        const tags = selector.split(",").map((part) => part.trim());
        const bad = tags.find((tag) => !/^(\*|:root|[a-z][a-z0-9]*)$/.test(tag));
        if (bad) return this.error(args[0]!, `globalStyle("${bad}"): natively a selector is "body", "html", ":root", "*" or a tag name.`);
        return { e: "rt", name: "globalStyle", args: [{ e: "str", v: tags.join(",") }, this.expr(args[1]!, ctx, T.rt("Style"))] };
      }
      case "createCss":
        return this.error(node, "Destructure createCss() where it is called: const { css, cx, variants, keyframes, globalStyle, theme } = createCss({…}).");
      case "createRouter":
        return this.router(node, ctx);
      case "fetch": {
        const named: [string, Expr][] = [];
        const init = args[1];
        if (init && ts.isObjectLiteralExpression(init)) {
          for (const key of ["method", "body", "headers"]) {
            const value = this.attrValue([init], key);
            if (value) named.push([key, this.expr(value, ctx, key === "headers" ? T.map(T.string) : T.string)]);
          }
        } else if (init) this.error(init, "fetch() options must be an object literal.");
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, T.string)], named };
      }
      case "delay":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, T.double)] };
      case "setTimeout":
      case "setInterval":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, { k: "fn", params: [], ret: T.void }), this.expr(args[1]!, ctx, T.double)] };
      case "clearTimeout":
      case "clearInterval":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx)] };
    }
    return this.error(node, `${name}() is not supported natively (the runtimes have no counterpart to it): see README "Strict TypeScript" for the functions they provide.`);
  }

  /**
   * `progress` and `meter` are a track box with a fill box in it, so every platform draws the same
   * bar: the fill's `widthPct` follows the value, and `meter` picks its color as HTML does.
   * The range is written as literals (the colors depend on where `optimum` sits); `value` is a
   * number or `() => number`, and a function becomes a dynamic style of the fill.
   */
  private gauge(name: "progress" | "meter", args: readonly ts.Expression[], ctx: Ctx): Expr {
    const literal = (key: string): number | undefined => {
      const init = this.attrValue(args, key);
      if (!init) return undefined;
      if (ts.isNumericLiteral(init)) return Number(init.text);
      if (ts.isPrefixUnaryExpression(init) && init.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(init.operand)) return -Number(init.operand.text);
      this.error(init, `${key} must be a number literal.`);
      return undefined;
    };
    const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
    const dbl = (n: number): Expr => ({ e: "double", v: Number.isInteger(n) ? n.toFixed(1) : String(n) });
    const min = literal("min") ?? 0;
    const max = literal("max") ?? 1;
    const low = clamp(literal("low") ?? min, min, max);
    const high = clamp(literal("high") ?? max, low, max);
    const optimum = clamp(literal("optimum") ?? (min + max) / 2, min, max);

    const value = this.attrValue(args, "value");
    const body = value && ts.isArrowFunction(value) && !ts.isBlock(value.body) && value.parameters.length === 0 ? value.body : undefined;
    if (value && this.isCallable(value) && !body) this.error(value, `Write the ${name} value as a number or an arrow function with an expression body: () => number.`);
    const read: Expr = body ? { e: "id", name: "gaugeValue" } : value ? this.expr(value, ctx, T.double) : dbl(min);

    const compare = (op: "<" | ">" | "<=" | ">=", n: number): Expr => ({ e: "bin", op, l: read, r: dbl(n) });
    const str = (v: string): Expr => ({ e: "str", v });
    const pick = (c: Expr, a: Expr, b: Expr): Expr => ({ e: "cond", c, a, b });
    const [good, fair, poor] = [str("#22c55e"), str("#eab308"), str("#ef4444")];
    // A literal value is folded here: Swift reads `10.0 < 33.0` as ambiguous with other `<` overloads.
    const fixed = !value ? min : ts.isNumericLiteral(value) ? Number(value.text) : undefined;
    const fold = (v: number): Expr =>
      optimum < low ? (v < low ? good : v > high ? poor : fair)
      : optimum > high ? (v > high ? good : v < low ? poor : fair)
      : v >= low && v <= high ? good : fair;
    const color: Expr =
      name === "progress" ? str("#2563eb")
      : fixed !== undefined ? fold(fixed)
      : optimum < low ? pick(compare("<", low), good, pick(compare(">", high), poor, fair))
      : optimum > high ? pick(compare(">", high), good, pick(compare("<", low), poor, fair))
      : pick({ e: "bin", op: "&&", l: compare(">=", low), r: compare("<=", high) }, good, fair);
    const fill = this.styleOf(new Map<string, Expr>([
      ["widthPct", { e: "op", op: "math.max", args: [dbl(0), { e: "op", op: "math.min", args: [dbl(100), { e: "bin", op: "*", l: { e: "bin", op: "/", l: { e: "bin", op: "-", l: read, r: dbl(min) }, r: dbl(max - min) }, r: dbl(100) }] }] }],
      ["backgroundColor", color],
    ]));
    const style: Expr = body
      ? { e: "lambda", params: [], ret: T.rt("Style"), body: [{ s: "let", name: "gaugeValue", ty: T.double, init: this.expr(body, ctx, T.double), mutable: false }, { s: "return", x: fill }] }
      : fill;
    const track: Expr[] = [{ e: "str", v: name }, ...this.children(args, ctx, GAUGE_KEYS)];
    return { e: "rt", name: "el", args: [...track, { e: "rt", name: "div", args: [{ e: "rt", name: "A.style", args: [style] }] }] };
  }

  /** A value the select reads each time it is drawn: a plain value, or the body of `() => value`. */
  private reading(node: ts.Expression, ctx: Ctx, ty: Ty, what: string): Expr {
    if (ts.isArrowFunction(node) && !ts.isBlock(node.body) && node.parameters.length === 0) return this.expr(node.body, ctx, ty);
    if (this.isCallable(node)) return this.error(node, `Write ${what} as a value or an arrow function with an expression body: () => value.`);
    return this.expr(node, ctx, ty);
  }

  /**
   * `select`, `option` and `optgroup` are built from boxes and text, so every platform draws the same
   * control: a box (the `select` tag's: border, rounded, white) holding a row with the chosen option's
   * text and a chevron, and below it, once the row is pressed, the options, one row each. What is
   * chosen and whether it is open are variables of the select, in a closure that builds it:
   *
   *   (() => { var open = false; var chosen = "first"; return el("select", …row, when(() => open, …options)) })()
   *
   * The options are found where they are written: directly in the select, in an optgroup, or in the
   * render function of a list(). The text of the chosen one is the one of the option whose value is
   * `value`: each option adds `value == chosen ? text : ""` to the row's text, and a list adds a piece
   * for each of its items.
   */
  private select(node: ts.CallExpression, ctx: Ctx): Expr {
    const id = this.selectCount++;
    const state: SelectState = { open: `selectOpen${id}`, chosen: `selectChosen${id}`, change: `selectChange${id}`, selected: { e: "nil" }, labels: [], collect: [] };
    state.selected = { e: "id", name: state.chosen };
    state.collect = state.labels;
    const attributes = node.arguments.filter(ts.isObjectLiteralExpression);
    const value = this.attrValue(attributes, "value");
    if (value) state.selected = this.reading(value, ctx, T.string, "the value of a select");
    const disabledNode = this.attrValue(attributes, "disabled");
    const disabled = disabledNode ? this.reading(disabledNode, ctx, T.bool, "disabled") : undefined;
    for (const object of attributes) {
      for (const prop of object.properties) {
        if (!prop.name || !ts.isIdentifier(prop.name) || prop.name.text !== "onChange") continue;
        const handler = ts.isMethodDeclaration(prop) ? prop : ts.isPropertyAssignment(prop) ? prop.initializer : ts.isShorthandPropertyAssignment(prop) ? prop.name : undefined;
        if (handler) state.handler = (this.attr("onChange", handler, ctx) as Extract<Expr, { e: "rt" }>).args[0]!;
      }
    }

    this.selects.push(state);
    let rows: Expr[];
    try {
      rows = node.arguments.filter((arg) => !ts.isObjectLiteralExpression(arg)).map((arg) => this.optionalChild(arg, ctx, T.rt("NodeMod")));
    } finally {
      this.selects.pop();
    }
    const mods = this.children(attributes, ctx, SELECT_KEYS);

    const rt = (name: string, ...args: Expr[]): Expr => ({ e: "rt", name, args });
    const num = (n: number): Expr => ({ e: "double", v: n.toFixed(1) });
    const str = (v: string): Expr => ({ e: "str", v });
    const style = (entries: [string, Expr][]) => rt("A.style", this.styleOf(new Map(entries)));
    const enumOf = (key: string, value: string): Expr => ({ e: "enum", type: STYLE_ENUMS[key]!, member: camel(value) });
    const lambda = (body: Stmt[] | Expr, ret: Ty): Expr => ({ e: "lambda", params: [], ret, body });
    const press = (body: Stmt[]): Expr => rt("A.onClick", { e: "lambda", params: [{ name: "e", ty: T.rt("NativeEvent"), unused: true }], ret: T.void, body, typed: true });
    const open: Expr = { e: "id", name: state.open };
    const label: Expr = { e: "tpl", parts: state.labels.length ? state.labels : [""] };
    const refresh: Stmt = { s: "expr", x: rt("update") };

    const toggle: Stmt = { s: "assign", target: open, op: "=", value: { e: "not", x: open } };
    const trigger = rt(
      "div",
      style([["flexDirection", enumOf("flexDirection", "row")], ["alignItems", enumOf("alignItems", "center")], ["justifyContent", enumOf("justifyContent", "space-between")], ["gap", num(8)], ["paddingTop", num(10)], ["paddingRight", num(12)], ["paddingBottom", num(10)], ["paddingLeft", num(12)]]),
      press(disabled ? [{ s: "if", c: { e: "not", x: disabled }, then: [toggle, refresh] }] : [toggle, refresh]),
      rt("span", style([["flex", num(1)]]), rt("A.text", lambda(label, T.string))),
      rt("span", rt("A.text", str("▾"))),
    );
    const content: Expr = { e: "lambda", params: [], ret: T.array(T.optional(T.rt("NodeMod"))), body: { e: "arr", of: T.optional(T.rt("NodeMod")), items: [rt("el", str("hr")), ...rows] } };
    const body: Stmt[] = [
      { s: "let", name: state.open, ty: T.bool, init: { e: "bool", v: false }, mutable: true },
      { s: "let", name: state.chosen, ty: T.string, init: state.first ?? str(""), mutable: true },
    ];
    if (state.handler) body.push({ s: "let", name: state.change, ty: { k: "fn", params: [T.rt("NativeEvent")], ret: T.void }, init: state.handler, mutable: false });
    body.push({ s: "return", x: rt("el", str("select"), ...mods, trigger, rt("when", lambda(open, T.bool), content)) });
    return { e: "call", callee: lambda(body, T.rt("Node")), args: [] };
  }

  /** The text an option shows: its children's, as a string expression. */
  private optionText(args: readonly ts.Expression[], ctx: Ctx): Expr {
    const parts = args.filter((arg) => !ts.isObjectLiteralExpression(arg)).map((arg): Expr => (this.isCallable(arg) ? this.reading(arg, ctx, T.string, "the text of an option") : this.str(arg, ctx)));
    return { e: "tpl", parts: parts.length ? parts : [""] };
  }

  private option(node: ts.CallExpression, ctx: Ctx): Expr {
    const state = this.selects.at(-1);
    if (!state) return this.error(node, "option() belongs inside a select().");
    const args = node.arguments;
    const text = this.optionText(args, ctx);
    const valueNode = this.attrValue(args, "value");
    const value = valueNode ? this.expr(valueNode, ctx, T.string) : text;
    const disabledNode = this.attrValue(args, "disabled");
    const disabled = disabledNode?.kind === ts.SyntaxKind.TrueKeyword;
    state.first ??= state.collect === state.labels ? value : undefined;
    state.collect.push({ e: "cond", c: { e: "bin", op: "==", l: state.selected, r: value }, a: text, b: { e: "str", v: "" } });

    const num = (n: number): Expr => ({ e: "double", v: n.toFixed(1) });
    const chosenNow: Expr = { e: "bin", op: "==", l: state.selected, r: value };
    const look: [string, Expr][] = [["flexDirection", { e: "enum", type: "FlexDirection", member: "row" }], ["paddingTop", num(10)], ["paddingRight", num(12)], ["paddingBottom", num(10)], ["paddingLeft", num(12)], ["backgroundColor", { e: "cond", c: chosenNow, a: { e: "str", v: "#eef2ff" }, b: { e: "str", v: "#ffffff" } }]];
    if (disabled) look.push(["opacity", num(0.4)]);
    const pick: Stmt[] = [
      { s: "assign", target: { e: "id", name: state.chosen }, op: "=", value },
      { s: "assign", target: { e: "id", name: state.open }, op: "=", value: { e: "bool", v: false } },
    ];
    if (state.handler) pick.push({ s: "expr", x: { e: "call", callee: { e: "id", name: state.change }, args: [{ e: "rt", name: "selectEvent", args: [value] }] } });
    pick.push({ s: "expr", x: { e: "rt", name: "update", args: [] } });
    const mods: Expr[] = [
      { e: "rt", name: "A.style", args: [{ e: "lambda", params: [], ret: T.rt("Style"), body: this.styleOf(new Map(look)) }] },
      ...(disabled ? [] : [{ e: "rt" as const, name: "A.onClick", args: [{ e: "lambda" as const, params: [{ name: "e", ty: T.rt("NativeEvent"), unused: true }], ret: T.void, body: pick, typed: true }] }]),
      { e: "rt", name: "span", args: this.children(args.filter((arg) => !ts.isObjectLiteralExpression(arg)), ctx) },
    ];
    return { e: "rt", name: "div", args: mods };
  }

  private optgroup(node: ts.CallExpression, ctx: Ctx): Expr {
    if (!this.selects.length) return this.error(node, "optgroup() belongs inside a select().");
    const label = this.attrValue(node.arguments, "label");
    const rows = node.arguments.filter((arg) => !ts.isObjectLiteralExpression(arg)).map((arg) => this.optionalChild(arg, ctx, T.rt("NodeMod")));
    const heading: Expr[] = label
      ? [{
          e: "rt",
          name: "span",
          args: [
            { e: "rt", name: "A.style", args: [this.styleOf(new Map<string, Expr>([["paddingTop", { e: "double", v: "10.0" }], ["paddingRight", { e: "double", v: "12.0" }], ["paddingBottom", { e: "double", v: "4.0" }], ["paddingLeft", { e: "double", v: "12.0" }], ["fontSize", { e: "double", v: "12.0" }], ["fontWeight", { e: "enum", type: STYLE_ENUMS.fontWeight!, member: "bold" }], ["color", { e: "str", v: "#64748b" }]]))] },
            ...this.children([label], ctx),
          ],
        }]
      : [];
    return { e: "rt", name: "div", args: [...heading, ...rows] };
  }

  /** A when() condition: a function, or a value fixed when the tree is built. */
  private condition(node: ts.Expression, ctx: Ctx): Expr {
    return this.isCallable(node)
      ? this.expr(node, ctx, { k: "fn", params: [], ret: T.bool })
      : this.cond(node, ctx);
  }

  /** Content built when it is shown: a closure returning the children. */
  private content(args: readonly ts.Expression[], ctx: Ctx): Expr {
    const items = this.children(args, ctx);
    return { e: "lambda", params: [], ret: T.array(T.optional(T.rt("NodeMod"))), body: { e: "arr", of: T.optional(T.rt("NodeMod")), items } };
  }

  private attrValue(args: readonly ts.Expression[], key: string): ts.Expression | undefined {
    for (const arg of args) {
      if (!ts.isObjectLiteralExpression(arg)) continue;
      for (const prop of arg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === key) return prop.initializer;
        if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === key) return prop.name;
      }
    }
    return undefined;
  }

  /** A builder's arguments: text, dynamic text, nodes, modifiers and expanded attribute objects. */
  private children(args: readonly ts.Expression[], ctx: Ctx, skip?: ReadonlySet<string>): Expr[] {
    const out: Expr[] = [];
    for (const arg of args) {
      if (ts.isObjectLiteralExpression(arg)) {
        out.push(...this.attributes(arg, ctx, skip));
        continue;
      }
      if (ts.isSpreadElement(arg)) {
        out.push(this.error(arg, "Unsupported: spread children; use list()."));
        continue;
      }
      if (arg.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(arg) && arg.text === "undefined")) continue;
      const type = this.typeOf(arg);
      if (this.isString(type) || (this.isNumber(type) && !this.isNullable(type))) {
        out.push({ e: "rt", name: "A.text", args: [this.str(arg, ctx)] });
        continue;
      }
      if (this.isCallable(arg)) {
        out.push({ e: "rt", name: "A.text", args: [this.dynamic(arg, ctx, T.string)] });
        continue;
      }
      out.push(this.optionalChild(arg, ctx, T.rt("NodeMod")));
    }
    return out;
  }

  /** `cond && child` → `cond ? child : nil`. */
  private optionalChild(node: ts.Expression, ctx: Ctx, ty: Ty): Expr {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
      return { e: "cond", c: this.cond(node.left, ctx), a: this.expr(node.right, ctx, ty), b: { e: "nil" } };
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) return { e: "nil" };
    return this.expr(node, ctx);
  }

  /** A function value (as opposed to a value given once), without lowering its type. */
  private isCallable(node: ts.Expression): boolean {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return true;
    const type = this.checker.getNonNullableType(this.typeOf(node));
    return type.getCallSignatures().length > 0 && !(type.isUnion() && type.types.some((u) => u.getCallSignatures().length === 0));
  }

  /** A value or a `() => value` function, lowered with the type the runtime expects. */
  private dynamic(node: ts.Expression, ctx: Ctx, ty: Ty): Expr {
    return this.isCallable(node) ? this.expr(node, ctx, { k: "fn", params: [], ret: ty }) : this.expr(node, ctx, ty);
  }

  private attributes(node: ts.ObjectLiteralExpression, ctx: Ctx, skip?: ReadonlySet<string>): Expr[] {
    return node.properties.flatMap((prop): Expr[] => {
      if (skip && prop.name && ts.isIdentifier(prop.name) && skip.has(prop.name.text)) return [];
      if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name)) return [this.attr(prop.name.text, prop, ctx)];
      if (ts.isShorthandPropertyAssignment(prop)) return [this.attr(prop.name.text, prop.name, ctx)];
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) return [this.error(prop, "Unsupported attribute entry (attributes are read at compile time): write `name: value` with a plain name, no spreads or methods.")];
      if (prop.name.text === "type") {
        const value = prop.initializer;
        return ts.isStringLiteral(value) && value.text === "checkbox" ? [] : [{ e: "rt", name: "A.inputType", args: [this.expr(value, ctx, T.string)] }];
      }
      return [this.attr(prop.name.text, prop.initializer, ctx)];
    });
  }

  private attr(name: string, value: ts.Expression | ts.MethodDeclaration, ctx: Ctx): Expr {
    const event = (param: Ty, ret: Ty): Ty => ({ k: "fn", params: [param], ret });
    const lower = (ty: Ty) => (ts.isMethodDeclaration(value) ? this.lambda(value, ctx, ty.k === "fn" ? ty : undefined) : this.expr(value, ctx, ty));
    switch (name) {
      case "style":
        return { e: "rt", name: "A.style", args: [this.dynamic(value as ts.Expression, ctx, T.rt("Style"))] };
      case "className":
        return { e: "rt", name: "A.className", args: [this.dynamic(value as ts.Expression, ctx, T.rt("StyleClass"))] };
      case "value":
      case "placeholder":
      case "src":
      case "href":
      case "ariaLabel":
        return { e: "rt", name: `A.${name}`, args: [this.dynamic(value as ts.Expression, ctx, T.string)] };
      case "checked":
      case "disabled":
        return { e: "rt", name: `A.${name}`, args: [this.dynamic(value as ts.Expression, ctx, T.bool)] };
      case "onMount":
        return { e: "rt", name: "A.onMount", args: [lower(event(T.rt("NativeElement"), T.optional({ k: "fn", params: [], ret: T.void })))] };
      case "onDestroy":
        return { e: "rt", name: "A.onDestroy", args: [lower(event(T.rt("NativeElement"), T.void))] };
    }
    const payload = EVENTS[name];
    if (payload) return { e: "rt", name: `A.${name}`, args: [lower(event(T.rt(payload), T.void))] };
    return this.error(value, `The attribute ${name} is not supported natively (no native view has it): use style, class, the events (onClick…) or the attributes in src/index.ts's Attributes.`);
  }

  /**
   * `MapView({ latitude: () => lat, onMove, style })` → the platform's component, a props object
   * built from the values as they are now, and one dirty-checked binding per dynamic prop.
   */
  private nativeView(component: { name: string; props: ts.Type }, node: ts.CallExpression, ctx: Ctx): Expr {
    const propsTy = this.ty(component.props, node);
    const cls = propsTy.k === "class" ? this.allClasses().find((c) => c.name === propsTy.name) : undefined;
    if (!cls) return this.error(node, "A native component's props must be an interface of the app.");
    this.usedComponents.set(component.name, cls.name);
    const [first, ...rest] = node.arguments;
    if (first && !ts.isObjectLiteralExpression(first)) return this.error(first, "Pass a native component's props as an object literal.");
    const initial: [string, Expr][] = [];
    const mods: Expr[] = [];
    const given = new Map<string, ts.Expression>();
    for (const prop of first?.properties ?? []) {
      if (ts.isShorthandPropertyAssignment(prop)) given.set(prop.name.text, prop.name);
      else if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop.initializer);
      else this.error(prop, "Unsupported prop entry (a native component's props are read at compile time): write `name: value` with a plain name, no spreads or methods.");
    }
    for (const field of cls.fields) {
      const value = given.get(field.name);
      given.delete(field.name);
      if (!value) continue;
      const target = field.ty.k === "optional" ? field.ty.of : field.ty;
      if (target.k === "fn" || !this.isCallable(value)) {
        initial.push([field.name, this.expr(value, ctx, field.ty)]);
        continue;
      }
      // The value now (to build the props), and the function update() re-runs.
      const now: Expr = ts.isArrowFunction(value) && !ts.isBlock(value.body)
        ? this.expr(value.body, ctx, field.ty)
        : { e: "call", callee: this.expr(value, ctx), args: [] };
      initial.push([field.name, now]);
      mods.push({
        e: "rt",
        name: "A.prop",
        args: [
          this.expr(value, ctx, { k: "fn", params: [], ret: field.ty }),
          {
            e: "lambda",
            params: [{ name: "props", ty: propsTy }, { name: "value", ty: field.ty }],
            ret: T.void,
            typed: true,
            body: [{ s: "assign", target: { e: "prop", obj: { e: "id", name: "props" }, name: field.name }, op: "=", value: { e: "id", name: "value" } }],
          },
        ],
      });
    }
    for (const [name, value] of given) mods.push(this.attr(name, value, ctx));
    return {
      e: "rt",
      name: "nativeView",
      args: [{ e: "new", cls: component.name, args: [] }, { e: "new", cls: cls.name, args: initial }, ...mods, ...this.children(rest, ctx)],
    };
  }

  private variants(node: ts.CallExpression, ctx: Ctx): Expr {
    const config = node.arguments[0];
    if (!config || !ts.isObjectLiteralExpression(config)) return this.error(node, "variants() takes an object literal.");
    const get = (key: string) => this.attrValue([config], key);
    const named: [string, Expr][] = [];
    const base = get("base");
    named.push(["base", base ? this.expr(base, ctx, T.rt("Style")) : { e: "style", props: [] }]);
    const groups = get("variants");
    if (!groups || !ts.isObjectLiteralExpression(groups)) return this.error(node, "variants() needs a `variants` object literal.");
    const groupEntries: [string, Expr][] = groups.properties.map((g) => {
      if (!ts.isPropertyAssignment(g) || !ts.isIdentifier(g.name) || !ts.isObjectLiteralExpression(g.initializer)) return ["", this.error(g, "Unsupported variant group (read at compile time): write `group: { variant: { …style } }`.")];
      return [
        g.name.text,
        {
          e: "dict",
          of: T.rt("Style"),
          entries: g.initializer.properties.map((v): [string, Expr] => {
            if (!ts.isPropertyAssignment(v) || !(ts.isIdentifier(v.name) || ts.isStringLiteral(v.name))) return ["", this.error(v, "Unsupported variant (read at compile time): write `variant: { …style }` with a plain or quoted name.")];
            return [v.name.text, this.expr(v.initializer, ctx, T.rt("Style"))];
          }),
        },
      ];
    });
    named.push(["variants", { e: "dict", of: T.map(T.rt("Style")), entries: groupEntries }]);
    const defaults = get("defaultVariants");
    named.push(["defaults", defaults ? this.selection(defaults, ctx) : { e: "dict", of: T.string, entries: [] }]);
    const compounds = get("compoundVariants");
    const items: Expr[] = [];
    if (compounds && ts.isArrayLiteralExpression(compounds)) {
      for (const item of compounds.elements) {
        if (!ts.isObjectLiteralExpression(item)) {
          items.push(this.error(item, "Unsupported compound variant (read at compile time): write an object literal `{ group: \"variant\", …, css: { …style } }`."));
          continue;
        }
        const style = this.attrValue([item], "css");
        const match = item.properties.filter((p) => !(p.name && ts.isIdentifier(p.name) && p.name.text === "css"));
        const entries: [string, Expr][] = match.map((p) =>
          ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) ? [p.name.text, this.str(p.initializer, ctx)] : ["", this.error(item, "Unsupported compound entry (read at compile time): write `group: \"variant\"` with a plain name.")],
        );
        items.push({ e: "rt", name: "Compound", args: [{ e: "dict", of: T.string, entries }, style ? this.expr(style, ctx, T.rt("Style")) : { e: "style", props: [] }] });
      }
    }
    named.push(["compounds", { e: "arr", of: { k: "class", name: "Compound" }, items }]);
    return { e: "rt", name: "Variants", args: [], named };
  }

  private router(node: ts.CallExpression, ctx: Ctx): Expr {
    const [table, options] = node.arguments;
    if (!table || !ts.isObjectLiteralExpression(table)) return this.error(node, "createRouter() takes the routes as an object literal.");
    const view: Ty = { k: "fn", params: [T.map(T.string)], ret: T.rt("Node") };
    const title: Ty = { k: "fn", params: [T.map(T.string)], ret: T.string };
    const routes = table.properties.map((prop): Expr => {
      if (!ts.isPropertyAssignment(prop) || !(ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name))) return this.error(prop, "Unsupported route (routes are read at compile time): write `\"/path/:id\": { view: … }` with a literal path.");
      const pattern: Expr = { e: "str", v: prop.name.text };
      const value = prop.initializer;
      if (!ts.isObjectLiteralExpression(value)) return { e: "rt", name: "Route", args: [pattern, this.expr(value, ctx, view)] };
      const v = this.attrValue([value], "view");
      const t = this.attrValue([value], "title");
      const named: [string, Expr][] = [];
      if (t) {
        named.push([
          "title",
          this.isString(this.typeOf(t))
            ? { e: "lambda", params: [{ name: "_0", ty: T.map(T.string), unused: true }], ret: T.string, body: this.expr(t, ctx, T.string) }
            : this.expr(t, ctx, title),
        ]);
      }
      const presentation = this.attrValue([value], "presentation");
      if (presentation) named.push(["presentation", this.expr(presentation, ctx, T.string)]);
      const header = this.attrValue([value], "header");
      if (header) named.push(["header", this.expr(header, ctx, T.bool)]);
      const endReached = this.attrValue([value], "onEndReached");
      if (endReached) named.push(["onEndReached", this.expr(endReached, ctx, { k: "fn", params: [T.map(T.string)], ret: T.void })]);
      return { e: "rt", name: "Route", args: [pattern, v ? this.expr(v, ctx, view) : this.error(value, "A route needs a view.")], named };
    });
    const named: [string, Expr][] = [["routes", { e: "arr", of: { k: "class", name: "NRoute" }, items: routes }]];
    if (options && ts.isObjectLiteralExpression(options)) {
      const tabs = this.attrValue([options], "tabs");
      if (tabs && ts.isArrayLiteralExpression(tabs)) {
        named.push([
          "tabs",
          {
            e: "arr",
            of: { k: "class", name: "NTab" },
            items: tabs.elements.map((tab): Expr => {
              if (!ts.isObjectLiteralExpression(tab)) return this.error(tab, "A tab must be an object literal.");
              const field = (key: string): Expr => {
                const value = this.attrValue([tab], key);
                return value ? this.expr(value, ctx, T.string) : { e: "str", v: "" };
              };
              return { e: "rt", name: "Tab", args: [field("path"), field("title"), field("icon")] };
            }),
          },
        ]);
      }
      const initial = this.attrValue([options], "initial");
      if (initial) named.push(["initial", this.expr(initial, ctx, T.string)]);
    }
    return { e: "rt", name: "Router", args: [], named };
  }
}
