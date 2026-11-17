/**
 * The front-end: TypeScript (program + type checker) → typed IR (ir.ts).
 *
 * It answers every TypeScript question so the printers don't have to:
 *  - types: `number` slots are inferred Int or Double (a fixpoint over every write), interfaces
 *    become classes (protocols when a class implements them), `T | null` an optional, `T[]` an
 *    array, `Record<string, T>` a map;
 *  - narrowing: a nullable value TypeScript has narrowed is force-unwrapped where it is read;
 *  - async: `async` functions become `async throws` / `suspend`, an un-awaited call is launched;
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
  type BinOp, type ClassDecl, type Expr, type FnDecl, type MethodDecl, type ObjectClassDecl, type ObjectField, type Op, type Param, type Program,
  type ProtocolDecl, type RuntimeType, type Stmt, T, type Ty,
} from "./ir.ts";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
  /** How much of the source it covers, for an editor's underline. */
  length?: number;
  /** TypeScript's own error code; absent on the native compiler's diagnostics. */
  code?: number;
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

export const formatDiagnostic = (d: Diagnostic) => `${d.file}:${d.line}:${d.column} - error: ${d.message}`;

/** The options apps are checked with: tsconfig.app.json, shared with the editor (examples/tsconfig.json). */
export const APP_TSCONFIG = path.resolve(import.meta.dirname, "../../tsconfig.app.json");

export function appCompilerOptions(): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(APP_TSCONFIG, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(APP_TSCONFIG));
  return parsed.options;
}

const API_FILE = path.resolve(import.meta.dirname, "../index.ts");

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
const RESERVED_TYPES = new Set([
  "Clock", "Duration", "Result", "Range", "Character", "Sequence", "Collection", "Optional", "Locale", "Calendar", "Notification",
  "Node", "NodeMod", "Style", "StyleClass", "Variants", "Compound", "WhenBuilder", "NativeEvent", "NativeElement", "InputTarget",
  "PointerEvent", "PanEvent", "PinchEvent", "ScrollEvent", "KeyboardEvent", "Frame", "NFrame", "NativeComponent",
  "A", "NRouter", "NRoute", "NTab", "NTimer", "NResponse", "NJSON", "NError", "String", "Int", "Double", "Bool", "Boolean",
  "Array", "Data", "Date", "URL", "Error", "Exception", "Timer", "View", "Task", "Set", "Map", "List", "Any", "Unit", "Object",
]);

/**
 * Names the generated code calls or refers to unqualified (formatting helpers, runtime types). A user
 * declaration with one of these names, at any level, would shadow it in Swift or Kotlin. Math
 * functions are printed fully qualified (`Swift.min`, `kotlin.math.floor`), so they stay free.
 */
const IMPLICIT_NAMES = new Set([
  "jsNum", "jsFixed", "jsRound", "jsNow", "jsNumber", "jsParseInt", "jsOr", "jsErrorMessage", "consoleLog", "launch",
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

type NumKind = "int" | "double";
type Slot = ts.Symbol | ts.Node;

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

/** Math functions with the same meaning everywhere (`Math.fn(x)` → math.fn). */
const MATH_FNS = new Set(["sign", "log", "log2", "log10", "log1p", "exp", "expm1", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh", "hypot", "cbrt"]);

/** Constants, as literals JavaScript prints the same way. */
const MATH_CONSTANTS: Record<string, number> = {
  "Math.E": Math.E, "Math.LN2": Math.LN2, "Math.LN10": Math.LN10, "Math.LOG2E": Math.LOG2E, "Math.LOG10E": Math.LOG10E, "Math.SQRT2": Math.SQRT2, "Math.SQRT1_2": Math.SQRT1_2,
  "Number.EPSILON": Number.EPSILON, "Number.MAX_SAFE_INTEGER": Number.MAX_SAFE_INTEGER, "Number.MIN_SAFE_INTEGER": Number.MIN_SAFE_INTEGER,
  "Number.MAX_VALUE": Number.MAX_VALUE, "Number.MIN_VALUE": Number.MIN_VALUE,
};

type GenericDecl = ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.ClassDeclaration;

/** A native type as part of a name: `Box<number[]>` → `Box__Arr_Double`. */
function mangle(t: Ty): string {
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
      return `Arr_${mangle(t.of)}`;
    case "map":
      return `Map_${mangle(t.of)}`;
    case "optional":
      return `Opt_${mangle(t.of)}`;
    case "class":
      return t.name;
    case "rt":
      return t.name;
    case "fn":
      return `Fn_${t.params.map(mangle).join("_")}_To_${mangle(t.ret)}`;
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
}

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export function transpile(entry: string): Program {
  const program = ts.createProgram([path.resolve(entry)], appCompilerOptions());
  const files = program
    .getSourceFiles()
    .filter((sf) => !sf.isDeclarationFile && path.resolve(sf.fileName) !== API_FILE && !sf.fileName.includes("/node_modules/"));

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
        };
      }),
    );
  }
  return new Frontend(program, files).run(path.basename(entry));
}

class Frontend {
  private readonly checker: ts.TypeChecker;
  private readonly diagnostics: Diagnostic[] = [];
  private readonly kinds: SlotKinds;
  private readonly writes: { slot: Slot; from?: ts.Expression; fromSlot?: Slot; forceDouble?: boolean }[] = [];
  /** Top-level and local functions: a reference to one as a value is a function reference. */
  private readonly functionSymbols = new Set<ts.Symbol>();
  private readonly classes = new Map<ts.Symbol, ClassDecl>();
  /** The app's classes, and the interfaces some class implements (protocols), by symbol. */
  private readonly objectClasses = new Map<ts.Symbol, ts.ClassLikeDeclaration>();
  /** Native names of class expressions (TypeScript calls an anonymous one `__class`): `X` for `const X = class …`, else `Class__1`. */
  private readonly classNames = new Map<ts.Symbol, string>();
  /** The locals of the surrounding functions that a nested class uses (and passes on), in order: hidden constructor parameters. */
  private readonly captures = new Map<ts.Symbol, ts.Symbol[]>();
  /**
   * Captured locals a nested class must share with its function: reassigned ones, and arrays and maps
   * something mutates (Swift's are values). Each lives in a `Ref__T` box, read and written as `x.value`.
   */
  private readonly boxed = new Set<ts.Symbol>();
  private readonly refClasses = new Map<string, ClassDecl>();
  /**
   * Loop variables a nested class uses while the loop's body reassigns them: each turn has its own
   * box (`i__box`), made at the top of the body and written back to the loop's variable at its end
   * (and before a `continue`), so the step and the condition see what the turn left.
   */
  /**
   * `for (const row of rows)` where something mutates `row`: in JavaScript `row` is the element itself,
   * and Swift would copy it. The loop runs over indices and `row` is `rows[i]`; a nested class using
   * `row` keeps the index (and shares `rows`, boxed when it is a local).
   */
  private readonly elementLoops = new Map<ts.Symbol, { loop: ts.ForOfStatement; source: ts.Symbol; index: string }>();
  private readonly loopBoxes = new Map<ts.Symbol, { loop: ts.ForStatement | ts.ForOfStatement; name: string }>();
  /** Class expressions already lowered (where they are declared, or after the top level). */
  private readonly definedClasses = new Set<ts.ClassLikeDeclaration>();
  private readonly protocols = new Map<ts.Symbol, ts.InterfaceDeclaration>();
  /** The class an object literal of a protocol builds (`Shape__Literal`), by protocol name: made on first use. */
  private readonly literalClasses = new Map<string, ObjectClassDecl>();
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
  private readonly instanceClasses = new Map<string, ClassDecl>();
  private readonly instanceProtocols = new Map<string, ProtocolDecl>();
  private readonly asyncFunctions = new Set<ts.Node>();
  /** Arrays are values in Swift: what mutates an array, and what makes two bindings share one (see checkArrays). */
  private readonly mutations: ts.Expression[] = [];
  private readonly aliases: { target: ts.Node; source: ts.Expression }[] = [];
  /** Arrays bound by destructuring: the local and the property it was read from. */
  private readonly destructuredArrays: { target: ts.Identifier; source?: ts.Symbol }[] = [];
  /** Names of the temporaries the lowering introduces (`ds__1`, `it__2`…). */
  private temps = 0;
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
    for (const sf of this.files) this.collectStyling(sf);
    this.collectClasses();
    this.collectCaptures();
    for (const sf of this.files) this.collect(sf);
    for (const sf of this.files) this.collectFunctionReferences(sf);
    this.linkMembers();
    this.inferNumbers();
    this.checkArrays();

    const out: Program = { source, classes: [], globals: [], functions: [], main: [] };
    for (const sf of this.files) {
      for (const statement of sf.statements) this.topLevel(statement, out);
    }
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
    out.classes = [...this.allClasses(), ...this.refClasses.values()];
    if (plain.length || this.instanceProtocols.size) out.protocols = [...plain, ...this.instanceProtocols.values()];
    if (this.literalClasses.size) out.objectClasses = [...(out.objectClasses ?? []), ...this.literalClasses.values()];
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
    if (this.usedComponents.size) out.components = [...this.usedComponents].map(([name, props]) => ({ name, props }));
    if (this.diagnostics.length) {
      throw new CompileError(this.diagnostics.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column));
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // Diagnostics
  // -------------------------------------------------------------------------

  private error(node: ts.Node, message: string): Expr {
    const sf = node.getSourceFile();
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart());
    const file = displayPath(sf.fileName);
    // One error per line: the first is the cause, the rest follow from it.
    if (!this.diagnostics.some((d) => d.file === file && d.line === line + 1)) {
      this.diagnostics.push({ file, line: line + 1, column: character + 1, message, length: node.getEnd() - node.getStart() });
    }
    return { e: "nil" };
  }

  // -------------------------------------------------------------------------
  // Pass 1: classes, functions, numeric slots and every write into them
  // -------------------------------------------------------------------------

  private collect(sf: ts.SourceFile) {
    const visit = (node: ts.Node): void => {
      this.reject(node);

      if (ts.isInterfaceDeclaration(node) && this.protocols.has(this.checker.getSymbolAtLocation(node.name)!)) {
        if (node.typeParameters?.length) this.generics.set(this.checker.getSymbolAtLocation(node.name)!, node);
        for (const member of node.members) {
          if (ts.isPropertySignature(member)) this.declareSlot(member.name, member.type);
          else if (!ts.isMethodSignature(member)) this.error(member, "Only properties and methods are supported in an interface a class implements.");
        }
      } else if (ts.isInterfaceDeclaration(node) || (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type))) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol && node.typeParameters?.length) this.generics.set(symbol, node);
        else if (symbol) this.classes.set(symbol, { name: node.name.text, fields: [], decodable: true });
        if (RESERVED_TYPES.has(node.name.text) || IMPLICIT_NAMES.has(node.name.text)) this.error(node.name, `"${node.name.text}" is reserved by the native runtimes; rename the type.`);
        const members = ts.isInterfaceDeclaration(node) ? node.members : (node.type as ts.TypeLiteralNode).members;
        for (const member of members) {
          if (!ts.isPropertySignature(member)) {
            this.error(member, "Only properties are supported in interfaces (they become native classes).");
            continue;
          }
          this.declareSlot(member.name, member.type);
        }
      }
      if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name && ts.isIdentifier(node.name) && ts.isSourceFile(this.topLevelOf(node))) {
        if (RESERVED_TYPES.has(node.name.text)) this.error(node.name, `"${node.name.text}" is reserved by the native runtimes or platforms; rename it.`);
      }
      if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node) || ts.isParameter(node)) && node.name && ts.isIdentifier(node.name) && IMPLICIT_NAMES.has(node.name.text)) {
        this.error(node.name, `"${node.name.text}" would shadow a name the generated Swift/Kotlin uses; rename it.`);
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) this.functionSymbols.add(symbol);
        if (!node.body) {
          // `declare function`: implemented by each platform in native/<target>/.
          if (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Ambient) this.declareNative(node);
          else this.error(node, "Function overloads are not supported natively; use one signature.");
        }
      }
      if ((ts.isFunctionDeclaration(node) || this.isFunctionNode(node)) && node.typeParameters?.length) {
        // A top-level generic function is compiled once per instantiation; elsewhere it would have to capture.
        const holder = ts.isFunctionDeclaration(node) ? node : node.parent;
        const name = ts.isFunctionDeclaration(node) ? node.name : ts.isVariableDeclaration(holder) && ts.isIdentifier(holder.name) ? holder.name : undefined;
        const topLevel = !!name && ts.isSourceFile(this.topLevelOf(ts.isFunctionDeclaration(node) ? node : holder)) && (ts.isFunctionDeclaration(node) || !!(ts.getCombinedNodeFlags(holder) & ts.NodeFlags.Const));
        const symbol = topLevel && name ? this.checker.getSymbolAtLocation(name) : undefined;
        if (symbol && !ts.isMethodDeclaration(node)) this.generics.set(symbol, node as GenericDecl);
        else if (ts.isMethodDeclaration(node)) this.error(node, "Generic methods are not supported natively; make the class generic, or write a generic top-level function.");
        else this.error(node, "Declare generic functions at the top level of a module (a nested one would capture its surroundings in every instantiation).");
      }
      if (ts.isVariableDeclaration(node) && node.initializer) this.aliases.push({ target: node.name, source: node.initializer });
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        this.aliases.push({ target: node.left, source: node.right });
        if (ts.isElementAccessExpression(node.left)) this.mutations.push(node.left.expression);
      }
      if (ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.parent)) this.aliases.push({ target: node.name, source: node.initializer });
      if (ts.isShorthandPropertyAssignment(node)) this.aliases.push({ target: node.name, source: node.name });
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["push", "pop", "shift", "unshift", "splice"].includes(node.expression.name.text)) {
        if (this.isArray(this.checker.getNonNullableType(this.typeOf(node.expression.expression)))) this.mutations.push(node.expression.expression);
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
      if (ts.isBindingElement(node) && ts.isIdentifier(node.name) && !this.isCreateCss(node.parent.parent)) {
        this.declareSlot(node.name, undefined);
        const symbol = this.checker.getSymbolAtLocation(node.name);
        const source = ts.isObjectBindingPattern(node.parent) ? this.checker.getNonNullableType(this.typeOf(node.parent)).getProperty((node.propertyName ?? node.name).getText().replace(/^["']|["']$/g, "")) : undefined;
        if (symbol) this.writes.push(source ? { slot: symbol, fromSlot: source } : { slot: symbol, forceDouble: true });
        if (node.initializer) this.write(node.name, node.initializer);
        if (this.isArray(this.checker.getNonNullableType(this.typeOf(node.name)))) this.destructuredArrays.push({ target: node.name, source });
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
        this.declareSlot(node.name, node.type);
        if (node.initializer) this.write(node.name, node.initializer);
        // An untyped callback parameter takes the kind of the parameter it is passed for.
        const fn = node.parent;
        const call = fn.parent;
        const isIndex = (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.parameters.indexOf(node) === 1 && ts.isCallExpression(call) && call.arguments[0] === fn &&
          ts.isPropertyAccessExpression(call.expression) && ["map", "filter", "forEach", "some", "every", "find", "findIndex"].includes(call.expression.name.text) &&
          this.isArray(this.checker.getNonNullableType(this.typeOf(call.expression.expression)));
        // An array callback's index is whole: it keeps the Int declareSlot gave it.
        if (!isIndex && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
          const contextual = this.checker.getContextualType(fn as ts.Expression);
          const ctx = contextual && this.checker.getNonNullableType(contextual).getCallSignatures()[0];
          const source = ctx?.getParameters()[fn.parameters.indexOf(node)];
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (source && symbol) this.writes.push({ slot: symbol, fromSlot: source });
        }
      }
      if (ts.isGetAccessor(node)) this.declareSlot(node.name, node.type);
      if (ts.isPropertyDeclaration(node) && ts.isClassLike(node.parent)) {
        this.declareSlot(node.name, node.type);
        if (node.initializer) this.write(node.name, node.initializer);
      }
      // A parameter property is a parameter and a field: two symbols, one kind.
      if (ts.isParameter(node) && ts.isIdentifier(node.name) && ts.isConstructorDeclaration(node.parent) && ts.isParameterPropertyDeclaration(node, node.parent)) {
        const [param, field] = this.checker.getSymbolsOfParameterPropertyDeclaration(node, node.name.text);
        if (field && this.isNumber(this.checker.getTypeOfSymbol(field))) this.kinds.set(field, this.forcedKind(node.type) ?? "int");
        if (param && field) this.link(param, field);
      }
      if (this.isFunctionNode(node) || ts.isFunctionDeclaration(node) || ts.isMethodSignature(node) || ts.isGetAccessor(node)) {
        const fn = node as ts.SignatureDeclaration;
        if (ts.getCombinedModifierFlags(fn as ts.Declaration) & ts.ModifierFlags.Async) this.asyncFunctions.add(fn);
        const signature = this.checker.getSignatureFromDeclaration(fn);
        if (signature) {
          let ret = signature.getReturnType();
          if (this.asyncFunctions.has(fn)) ret = this.checker.getAwaitedType(ret) ?? ret;
          if (this.isNumber(ret)) this.kinds.set(fn, this.forcedKind(this.promised(fn.type)) ?? "int");
        }
        if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) this.writes.push({ slot: node, from: node.body });
      }
      if (ts.isReturnStatement(node) && node.expression) {
        const fn = ts.findAncestor(node.parent, (n) => this.isFunctionNode(n) || ts.isFunctionDeclaration(n) || ts.isGetAccessor(n));
        if (fn) this.writes.push({ slot: fn, from: node.expression });
      }
      if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind)) {
        const target = ts.isPropertyAccessExpression(node.left) ? node.left.name : node.left;
        const symbol = this.checker.getSymbolAtLocation(target);
        if (symbol) this.writes.push({ slot: symbol, from: node.right, forceDouble: [ts.SyntaxKind.SlashEqualsToken, ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken].includes(node.operatorToken.kind) });
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
            const target = ctx.getProperty(prop.name.text);
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
        if (fn && ctx) {
          fn.parameters.forEach((param, i) => {
            const slot = ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
            const source = ctx.getParameters()[i];
            if (slot && source) this.writes.push({ slot, fromSlot: source });
          });
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

  /**
   * Swift arrays are values; JavaScript arrays are shared references. Code where the difference
   * shows is rejected: mutating a parameter (the caller's array wouldn't change), mutating a
   * temporary (a call's result), and two bindings sharing one array that either side then mutates.
   * `.slice()` makes an explicit copy, which behaves the same on every target.
   */
  private checkArrays() {
    const mutated = new Set<ts.Symbol>();
    for (const receiver of this.mutations) {
      const symbol = this.storageSymbol(receiver);
      if (!symbol) {
        this.error(receiver, "This array is a temporary natively (Swift arrays are values): mutate the variable or property that holds it.");
        continue;
      }
      const decl = symbol.valueDeclaration;
      if (decl && ts.isParameter(decl)) {
        this.error(receiver, `"${symbol.name}" is a parameter: Swift passes arrays by value, so the caller's array would not change. Return a new array, or mutate the variable that owns it.`);
        continue;
      }
      mutated.add(symbol);
    }
    // A mutated element of the array a for-of goes over: reached through its index.
    for (const value of mutated) {
      const decl = value.valueDeclaration;
      const loop = decl && this.loopOf(decl);
      if (loop && ts.isForOfStatement(loop) && ts.isIdentifier((decl as ts.VariableDeclaration).name)) this.elementLoop(value, loop, mutated);
    }
    // A nested class keeps its own copy of a captured array or map (Swift's are values).
    for (const values of [...this.captures.values()]) {
      for (const value of values) if (mutated.has(value) && !this.elementLoops.has(value)) this.box(value, (value.valueDeclaration as ts.NamedDeclaration).name ?? value.valueDeclaration!);
    }
    for (const { target, source } of this.destructuredArrays) {
      const symbol = this.checker.getSymbolAtLocation(target);
      if ((symbol && mutated.has(symbol)) || (source && mutated.has(source))) {
        this.error(target, "This array would be shared in JavaScript but copied natively (Swift arrays are values), and one side is mutated. Read it with .slice(), or keep one variable.");
      }
    }
    for (const { target, source } of this.aliases) {
      if (!this.isArray(this.checker.getNonNullableType(this.typeOf(source))) || this.isFresh(source, false)) continue;
      const to = this.storageSymbol(target);
      const from = this.storageSymbol(source);
      if ((to && mutated.has(to)) || (from && mutated.has(from)) || (!from && to && mutated.has(to))) {
        this.error(source, "This array would be shared in JavaScript but copied natively (Swift arrays are values), and one side is mutated. Copy it with .slice(), or keep one variable.");
      }
    }
  }

  /** The variable or property an expression reads (its base, for `xs[i]`); undefined for temporaries. */
  private storageSymbol(node: ts.Node): ts.Symbol | undefined {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)) node = node.expression;
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

  /** Whether an array expression is a new array (nobody else holds it). */
  private isFresh(node: ts.Expression, forReturn: boolean, seen = new Set<ts.Node>()): boolean {
    while (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node) || ts.isAwaitExpression(node)) node = node.expression;
    if (ts.isArrayLiteralExpression(node)) return true;
    if (ts.isConditionalExpression(node)) return this.isFresh(node.whenTrue, forReturn, seen) && this.isFresh(node.whenFalse, forReturn, seen);
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      return this.isFresh(node.left, forReturn, seen) && this.isFresh(node.right, forReturn, seen);
    }
    if (ts.isCallExpression(node)) {
      const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
      if (!decl || this.isApi(decl) || decl.getSourceFile().isDeclarationFile || seen.has(decl)) return true;
      seen.add(decl);
      // A user function's result is new if everything it returns is.
      const returns: ts.Expression[] = [];
      const body = (decl as ts.FunctionLikeDeclaration).body;
      if (body && !ts.isBlock(body)) returns.push(body);
      const visit = (n: ts.Node): void => {
        if (ts.isReturnStatement(n) && n.expression) returns.push(n.expression);
        if (!this.isFunctionNode(n) && !ts.isFunctionDeclaration(n)) ts.forEachChild(n, visit);
      };
      if (body && ts.isBlock(body)) ts.forEachChild(body, visit);
      return returns.every((r) => this.isFresh(r, true, seen));
    }
    // A function's own local array, returned: new to the caller.
    if (forReturn && ts.isIdentifier(node)) {
      const decl = this.checker.getSymbolAtLocation(node)?.valueDeclaration;
      return !!decl && ts.isVariableDeclaration(decl) && !ts.isSourceFile(this.topLevelOf(decl)) && !!decl.initializer && this.isFresh(decl.initializer, false, seen);
    }
    return false;
  }

  /** The node's container: a source file for top-level declarations. */
  private topLevelOf(node: ts.Node): ts.Node {
    let n = node.parent;
    while (n && (ts.isVariableDeclarationList(n) || ts.isVariableStatement(n))) n = n.parent;
    return n;
  }

  /** Constructs with no native equivalent. */
  private reject(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) this.error(node, "`any` cannot be compiled to a native type; give the value a real type.");
    else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword && ts.isPrivateIdentifier(node.left)) this.error(node, "Unsupported: `#x in obj` (a native object's class is known statically).");
    else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) this.checkClass(node);
    else if (ts.isEnumDeclaration(node)) this.checkEnum(node);
    else if (ts.isModuleDeclaration(node)) this.error(node, "Namespaces are not supported.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword && this.isStaticContext(node)) this.error(node, "`this` in a static member is not supported; name the class.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword && !this.inClass(node)) this.error(node, "`this` is supported in classes only; in an object literal's method, use the variable that holds the object.");
    else if (ts.isDeleteExpression(node) && !this.isMapEntry(node.expression)) this.error(node, "`delete` is supported on Record<string, T> entries; use a nullable property.");
    else if (ts.isIdentifier(node) && node.text === "eval") this.error(node, "`eval` cannot be compiled ahead of time.");
    else if (ts.isPropertyAccessExpression(node) && (node.name.text === "prototype" || node.name.text === "__proto__")) {
      this.error(node, "Prototype access is not supported.");
    } else if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.asteriskToken) this.error(node, "Generators are not supported.");
    else if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent) && !this.isCreateCss(node.parent.parent)) {
      if (node.dotDotDotToken) this.error(node, "Unsupported: a rest element in object destructuring (the rest has no native class); read the properties.");
      else if (node.propertyName && !ts.isIdentifier(node.propertyName) && !ts.isStringLiteral(node.propertyName)) this.error(node, "Unsupported: a computed key in destructuring.");
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
    const taken = new Set<string>();
    // A nested class keeps its name unless another class has it (two functions may each declare a `Row`).
    const unique = (name: string) => {
      let native = name;
      for (let n = 2; taken.has(native); n++) native = `${name}__${n}`;
      return native;
    };
    const add = (node: ts.ClassLikeDeclaration) => {
      const symbol = this.classSymbol(node);
      if (!symbol) return;
      this.objectClasses.set(symbol, node);
      const nested = ts.isClassDeclaration(node) ? !ts.isSourceFile(node.parent) : !this.isTopLevelClass(node);
      if (ts.isClassExpression(node) && !nested) this.classNames.set(symbol, (node.parent as ts.VariableDeclaration).name.getText());
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
    for (let decl = pending.pop(); decl; decl = pending.pop()) {
      for (const clause of decl.heritageClauses ?? []) clause.types.forEach((t) => addProtocol(t.expression));
    }
  }

  /** A class's symbol (an anonymous class expression has no name to ask). */
  private classSymbol(node: ts.ClassLikeDeclaration): ts.Symbol | undefined {
    return (node.name && this.checker.getSymbolAtLocation(node.name)) || this.checker.getTypeAtLocation(node).getSymbol();
  }

  /** A class's native name: its own, or the one given to a class expression. */
  private className(symbol: ts.Symbol): string {
    return this.classNames.get(symbol) ?? symbol.name;
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

  /** What a class may contain natively. */
  private checkClass(node: ts.ClassLikeDeclaration) {
    if (ts.isClassDeclaration(node) && !node.name) return void this.error(node, "A class declaration needs a name.");
    const symbol = this.classSymbol(node);
    const native = symbol ? this.className(symbol) : "";
    if (RESERVED_TYPES.has(native) || IMPLICIT_NAMES.has(native)) this.error(node.name ?? node, `"${native}" is reserved by the native runtimes; rename the class.`);
    const nested = ts.isClassDeclaration(node) ? !ts.isSourceFile(node.parent) : !this.isTopLevelClass(node);
    if (nested) this.checkNestedClass(node);
    if ((ts.isClassExpression(node) || nested) && node.typeParameters?.length) return void this.error(node, "Generic class expressions and generic classes inside functions are not supported natively; declare a generic class at the top level.");
    if (node.typeParameters?.length) {
      // Each instantiation is a class of its own: a static member would be one per instantiation, not one shared.
      for (const member of node.members) {
        if (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) this.error(member, "Static members of a generic class are not supported natively (each instantiation would have its own); use a top-level variable or function.");
      }
      if (symbol && ts.isClassDeclaration(node)) this.generics.set(symbol, node);
    }
    if (ts.getDecorators(node)?.length) this.error(node, "Decorators are not supported.");
    const base = this.heritage(node, ts.SyntaxKind.ExtendsKeyword)[0];
    if (base && !this.classRef(base.expression)) this.error(base, "A class can extend only another class of the app.");
    for (const member of node.members) {
      const isStatic = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
      if (member.name && !ts.isIdentifier(member.name) && !ts.isPrivateIdentifier(member.name)) this.error(member.name, "Class members need plain names natively.");
      else if ((ts.isGetAccessor(member) || ts.isSetAccessor(member)) && !this.checkAccessor(node, member)) continue;
      else if (ts.isMethodDeclaration(member) && ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Async) this.error(member, "Async methods are not supported natively; call an async function from the method.");
      else if (ts.isMethodDeclaration(member) && member.asteriskToken) this.error(member, "Generators are not supported.");
      else if (ts.isPropertyDeclaration(member) && isStatic && !member.initializer) this.error(member, "A static field needs an initial value natively.");
      else if (ts.isPropertyDeclaration(member) && member.exclamationToken) this.error(member, "Definite-assignment fields (`x!: T`) are not supported natively; give the field a value or set it in the constructor.");
      else if (ts.isConstructorDeclaration(member) && base) {
        // The base's constructor runs first: Kotlin and Swift call it before anything else.
        const first = member.body?.statements[0];
        const isSuper = first && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression) && first.expression.expression.kind === ts.SyntaxKind.SuperKeyword;
        if (!isSuper) this.error(member, "Call super(…) as the constructor's first statement.");
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
   * Shares a captured local through a box. A loop's variable can't be one (each turn has its own in
   * JavaScript), nor a destructured one; a boxed variable needs an initial value.
   */
  private box(value: ts.Symbol, at: ts.Node) {
    const decl = value.valueDeclaration!;
    // A mutated array a loop declares. Each turn's binding is the same array in JavaScript unless something
    // reassigns it: one box for the whole loop, made by its initializer, read in its header too.
    const loop = this.loopOf(decl) ?? this.forInitOf(decl);
    if (loop && ts.isForStatement(loop) && ts.isVariableDeclaration(decl) && ts.isIdentifier(decl.name) && !this.isReassigned(decl.name, loop)) {
      this.boxed.add(value);
      return;
    }
    if (loop && ts.isForStatement(loop)) {
      return void this.error(at, `A nested class uses "${value.name}", an array a \`for\` loop declares, mutates and reassigns (or destructures): natively each turn's would be a copy (Swift arrays are values). Keep the array in a const outside the loop.`);
    }
    if (loop) return void this.error(at, `A nested class mutates "${value.name}", an element of the array the loop goes over: natively it would change a copy (Swift arrays are values). Index the array instead.`);
    // A destructured one is boxed where its pattern binds it (bindPattern): a `for-of` binds it again each turn.
    if (!ts.isBindingElement(decl) && (ts.isVariableDeclaration(decl) ? !decl.initializer || !ts.isIdentifier(decl.name) : !ts.isParameter(decl) || !ts.isIdentifier(decl.name))) {
      return void this.error(at, `A nested class uses "${value.name}", which is reassigned or mutated: declare it with an initial value so it can be shared.`);
    }
    this.boxed.add(value);
  }

  /**
   * Makes `row` of `for (const row of rows)` the element `rows[i]`. `rows` must be a variable nothing
   * reshapes or reassigns (an index would then reach another element than JavaScript's object), and
   * not a parameter (Swift passes arrays by value). A nested class using `row` uses `rows` too.
   */
  private elementLoop(row: ts.Symbol, loop: ts.ForOfStatement, mutated: Set<ts.Symbol>) {
    const decl = row.valueDeclaration as ts.VariableDeclaration;
    const at = decl.name as ts.Identifier;
    const source = ts.isIdentifier(loop.expression) ? this.resolveAlias(this.checker.getSymbolAtLocation(loop.expression)) : undefined;
    const sourceDecl = source?.valueDeclaration;
    if (sourceDecl && ts.isParameter(sourceDecl)) {
      return void this.error(at, `"${row.name}" is mutated, and it is an element of the parameter "${source!.name}": Swift passes arrays by value, so the caller's array would not change. Return a new array instead.`);
    }
    if (!source || !sourceDecl || !ts.isVariableDeclaration(sourceDecl) || !ts.isIdentifier(sourceDecl.name)) {
      return void this.error(at, `"${row.name}" is mutated, and it is an element of what the loop goes over: loop over a variable holding the array (natively the element is reached by its index, Swift arrays being values).`);
    }
    if (mutated.has(source) || this.isReassigned(sourceDecl.name, this.topLevelOf(sourceDecl).getSourceFile())) {
      return void this.error(at, `"${row.name}" is mutated through its index in "${source.name}", which is itself reassigned or reshaped (push, splice, sort…): natively the index could reach another element. Leave "${source.name}" as it is.`);
    }
    if (this.isReassigned(at, loop.statement)) return void this.error(at, `"${row.name}" is mutated and reassigned: declare it with const.`);
    this.elementLoops.set(row, { loop, source, index: `${row.name}__i` });
    // Classes that use the element use the array too: shared, through a box when it is a local.
    const local = ts.findAncestor(sourceDecl.parent, ts.isFunctionLike);
    for (const values of this.captures.values()) {
      if (!values.includes(row) || !local || values.includes(source)) continue;
      values.push(source);
      if (!this.boxed.has(source)) this.box(source, at);
    }
  }

  /** A read of a variable here: its box's value, or the field of the nested class that captured it. */
  private readAt(value: ts.Symbol, node: ts.Node): Expr {
    const cls = this.nestedClassAt(node);
    const captured: Expr | undefined = cls && this.captures.get(cls)!.includes(value) ? { e: "prop", obj: { e: "id", name: "this" }, name: this.captureField(cls, value) } : undefined;
    const box = this.boxAt(value, node);
    return box ? { e: "prop", obj: captured ?? { e: "id", name: box }, name: "value" } : (captured ?? { e: "id", name: value.name });
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
    if (ts.isVariableDeclaration(decl)) return !(decl.initializer && ts.isClassExpression(decl.initializer));
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
        : { e: "id", name: this.elementLoops.get(value)?.index ?? this.boxAt(value, site) ?? value.name, fnRef: this.functionSymbols.has(value) || undefined },
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
      if (symbol && this.protocols.has(symbol)) return parent.name.text;
    }
    return undefined;
  }

  /** The base class and the protocols a class or protocol name conforms to, transitively. */
  private supertypes(name: string, out = new Set<string>()): Set<string> {
    const decl = this.declOfName(name);
    const env = this.instances.get(name)?.env ?? this.env;
    const direct = this.withEnv(env, () => (decl?.heritageClauses ?? []).flatMap((clause) => clause.types.map((t) => this.heritageName(t)).filter((n): n is string => !!n)));
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
    const generic = this.genericRef(this.bound(this.checker.getTypeAtLocation(t)));
    if (generic) return this.instantiate(generic.decl, generic.args, t);
    const cls = this.classRef(t.expression);
    return cls ? this.className(cls) : this.resolveAlias(this.checker.getSymbolAtLocation(t.expression))?.name;
  }

  /** A protocol (an instantiation of a generic one included) by its native name. */
  private protocolByName(name: string): ProtocolDecl | undefined {
    const instance = this.instanceProtocols.get(name);
    if (instance) return instance;
    const node = [...this.protocols].find(([symbol, decl]) => symbol.name === name && !decl.typeParameters?.length)?.[1];
    return node && this.protocolDecl(node);
  }

  /**
   * An object literal of a protocol: a `new` of the class generated for the protocol's literals,
   * which keeps each field and, for each method, the function given for it (an `fn__` field the method calls).
   */
  private protocolLiteral(node: ts.ObjectLiteralExpression, protocol: ProtocolDecl, ctx: Ctx): Expr {
    const cls = this.literalClass(protocol);
    const given = new Map<string, ts.Expression | ts.MethodDeclaration>();
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop.initializer);
      else if (ts.isShorthandPropertyAssignment(prop)) given.set(prop.name.text, prop.name);
      else if (ts.isMethodDeclaration(prop) && ts.isIdentifier(prop.name) && !prop.asteriskToken) given.set(prop.name.text, prop);
      else this.error(prop, "Unsupported member in an object literal of an interface a class implements: give each property and method by name (no spread).");
    }
    const args = cls.ctor.params.map((param): Expr => {
      const value = given.get(param.name.replace(/^fn__/, ""));
      if (!value) return { e: "nil" };
      const fn = param.ty.k === "fn" ? param.ty : undefined;
      if (fn && (ts.isMethodDeclaration(value) || ts.isArrowFunction(value) || ts.isFunctionExpression(value))) return this.lambda(value, ctx, fn, true);
      if (ts.isMethodDeclaration(value)) return this.error(value, "A method needs a function-typed member here.");
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
      store(`fn__${m.name}`, { k: "fn", params: m.params.map((p) => p.ty), ret: m.ret }, true, false, false);
      const call: Expr = { e: "call", callee: { e: "prop", obj: self, name: `fn__${m.name}` }, args: m.params.map((p): Expr => ({ e: "id", name: p.name })) };
      cls.methods.push({ name: m.name, params: m.params, ret: m.ret, async: false, body: [m.ret.k === "void" ? { s: "expr", x: call } : { s: "return", x: call }], implements: true });
    }
    this.literalClasses.set(name, cls);
    return cls;
  }

  private protocolDecl(node: ts.InterfaceDeclaration, instance?: string): ProtocolDecl {
    const decl: ProtocolDecl = { name: instance ?? node.name.text, bases: [], fields: [], methods: [] };
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
        decl.methods.push({ name: member.name.text, params, ret: this.ty(signature.getReturnType(), member, this.slotKind(member)) });
      }
    }
    return decl;
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

  /** Optional and default parameters that the function applies itself: `p: T?`, and the body starts with `p = p ?? default`. */
  private ownDefaults(params: Param[], nodes: readonly ts.ParameterDeclaration[], body: Stmt[]) {
    params.forEach((p, i) => {
      const param = nodes[i]!;
      if (!p.default || param.dotDotDotToken) return;
      const value = p.default;
      delete p.default;
      if (!param.initializer) return;
      const ty = p.ty;
      p.ty = T.optional(ty);
      const fill: Expr = { e: "coalesce", l: { e: "id", name: p.name }, r: value };
      // The body may already shadow the parameter (it is reassigned): that variable starts with the default.
      const shadow = body.find((st): st is Extract<Stmt, { s: "let" }> => st.s === "let" && st.name === p.name && st.init?.e === "id" && st.init.name === p.name);
      if (shadow) shadow.init = fill;
      else body.unshift({ s: "let", name: p.name, ty, init: fill, mutable: false });
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
    const inBase = (member: string) => !!baseNode && !!this.checker.getTypeAtLocation(baseNode).getProperty(member);
    const inProtocol = (member: string) =>
      [...this.supertypes(name)].some((p) => {
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
      if (inProtocol(fieldName)) f.implements = true;
      cls.fields.push(f);
      return f;
    };
    let ctorNode: ts.ConstructorDeclaration | undefined;
    for (const member of node.members) {
      if (!member.name || !(ts.isIdentifier(member.name) || ts.isPrivateIdentifier(member.name))) {
        if (ts.isConstructorDeclaration(member) && member.body) ctorNode = member;
        continue;
      }
      const memberName = this.memberName(member.name);
      const isStatic = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static);
      if (ts.isPropertyDeclaration(member)) {
        const memberSymbol = this.checker.getSymbolAtLocation(member.name)!;
        const readonly = !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Readonly);
        if (isStatic) {
          const ty = this.tyOfSymbol(memberSymbol, member);
          out.globals.push({ s: "let", name: `${name}__${memberName}`, ty, init: this.expr(member.initializer!, top, ty), mutable: !readonly });
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
        if (inBase(memberName)) method.overrides = true;
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
      const first = statements[0];
      const superCall = base && first && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression) ? first.expression : undefined;
      if (superCall) {
        const signature = this.checker.getResolvedSignature(superCall);
        cls.ctor.superArgs = signature ? this.callArgs(superCall, signature, top) : [];
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
    const capParams = captured.map((value): Param => ({ name: this.captureField(symbol, value), ty: this.elementLoops.has(value) ? T.int : this.boxed.has(value) || this.loopBoxes.has(value) ? this.refType(value) : this.tyOfSymbol(value, value.valueDeclaration!) }));
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
    (out.objectClasses ??= []).push(cls);
  }

  /** An enum is a set of string or number constants: its members are inlined, its type is string or number. */
  private checkEnum(node: ts.EnumDeclaration) {
    let kind: string | undefined;
    for (const member of node.members) {
      const value = this.checker.getConstantValue(member);
      if (value === undefined) {
        this.error(member, "Enum members need constant values natively (literals, or numbers counted up).");
        continue;
      }
      if (kind && kind !== typeof value) this.error(member, "This enum mixes strings and numbers; natively it is one or the other.");
      kind = typeof value;
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

  /** `ns.name` where `ns` is `import * as ns`: the name itself (modules share one native namespace). */
  private unNamespace<T extends ts.Expression>(node: T): T | ts.Identifier {
    if (!ts.isPropertyAccessExpression(node) || !ts.isIdentifier(node.expression)) return node;
    const symbol = this.checker.getSymbolAtLocation(node.expression);
    const target = this.resolveAlias(symbol);
    return symbol && symbol.flags & ts.SymbolFlags.Alias && target && target.flags & ts.SymbolFlags.ValueModule ? (node.name as ts.Identifier) : node;
  }

  /** An expression with no effects, which may be read more than once: `a`, `a.b.c`, `a!`. */
  private isPure(node: ts.Expression): boolean {
    if (ts.isIdentifier(node) || node.kind === ts.SyntaxKind.ThisKeyword || node.kind === ts.SyntaxKind.SuperKeyword) return true;
    if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) return this.isPure(node.expression);
    return ts.isPropertyAccessExpression(node) && !node.questionDotToken && this.isPure(node.expression);
  }

  private declareSlot(name: ts.Node, typeNode: ts.TypeNode | undefined) {
    const symbol = this.checker.getSymbolAtLocation(name);
    if (!symbol) return;
    if (this.isNumber(this.checker.getTypeOfSymbolAtLocation(symbol, name))) this.kinds.set(symbol, this.forcedKind(typeNode) ?? "int");
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
      for (const { slot, from, fromSlot, forceDouble } of this.writes) {
        if (this.kinds.get(slot) !== "int" || this.isForced(slot)) continue;
        const whole = !forceDouble && (from ? this.numKind(from) === "int" : !!fromSlot && this.slotKind(fromSlot) === "int");
        if (!whole) {
          this.kinds.set(slot, "double");
          changed = true;
        }
      }
    }
  }

  private isForced(slot: Slot): boolean {
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

  /** Whether a numeric expression is always whole, given the slots' current kinds. */
  private numKind(node: ts.Expression): NumKind {
    // A whole literal beyond 32 bits is a Double: exact to 2^53 as in JavaScript, where Kotlin's Int would overflow.
    if (ts.isNumericLiteral(node)) return /^(0x[0-9a-f]+|\d+)$/i.test(node.text) && Number(node.text) <= 2147483647 ? "int" : "double";
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.numKind(node.expression);
    }
    if (ts.isAwaitExpression(node)) return this.numKind(node.expression);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.TildeToken) return "int";
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) return this.numKind(node.operand);
    if (ts.isConditionalExpression(node)) return this.numKind(node.whenTrue) === "int" && this.numKind(node.whenFalse) === "int" ? "int" : "double";
    if (ts.isBinaryExpression(node)) {
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
        case ts.SyntaxKind.MinusToken:
        case ts.SyntaxKind.AsteriskToken:
        case ts.SyntaxKind.PercentToken:
          return this.numKind(node.left) === "int" && this.numKind(node.right) === "int" ? "int" : "double";
        case ts.SyntaxKind.AmpersandToken:
        case ts.SyntaxKind.BarToken:
        case ts.SyntaxKind.CaretToken:
        case ts.SyntaxKind.LessThanLessThanToken:
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return "int";
        case ts.SyntaxKind.CommaToken:
          return this.numKind(node.right);
        case ts.SyntaxKind.QuestionQuestionToken:
          return this.numKind(node.left) === "int" && this.numKind(node.right) === "int" ? "int" : "double";
        default:
          return this.isAssignment(node.operatorToken.kind) ? this.numKind(node.right) : "double";
      }
    }
    if (ts.isIdentifier(node)) {
      const symbol = this.checker.getSymbolAtLocation(node);
      return symbol ? this.slotKind(symbol) : "double";
    }
    if (ts.isPropertyAccessExpression(node)) {
      const member = this.enumValue(node);
      if (member !== undefined) return typeof member === "number" && Number.isInteger(member) ? "int" : "double";
      if (node.name.text === "length" && this.isSequence(this.checker.getNonNullableType(this.typeOf(node.expression)))) return "int";
      const symbol = this.checker.getSymbolAtLocation(node.name);
      return symbol ? this.slotKind(symbol) : "double";
    }
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isPropertyAccessExpression(callee)) {
        const name = callee.name.text;
        if (ts.isIdentifier(callee.expression) && callee.expression.text === "Math") {
          if (["floor", "ceil", "round", "trunc", "sign"].includes(name)) return "int";
          if (["max", "min", "abs"].includes(name)) return node.arguments.every((a) => this.numKind(a) === "int") ? "int" : "double";
          return "double";
        }
        if (["indexOf", "findIndex", "lastIndexOf"].includes(name)) return "int";
      }
      if (ts.isIdentifier(callee) && callee.text === "parseInt") return "int";
      const declaration = this.checker.getResolvedSignature(node)?.getDeclaration();
      if (declaration && !this.isApi(declaration) && !declaration.getSourceFile().isDeclarationFile) return this.kinds.get(declaration) ?? "double";
      return "double";
    }
    return "double";
  }

  // -------------------------------------------------------------------------
  // Types
  // -------------------------------------------------------------------------

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
    const base = (holder as ts.NamedDeclaration).name?.getText() ?? "anonymous";
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
    return [...this.classes.values(), ...this.instanceClasses.values()];
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
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return this.constValue(node.expression);
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
    return this.checker.isArrayType(type) || this.checker.isTupleType(type);
  }

  private isSequence(type: ts.Type): boolean {
    return this.isString(type) || this.isArray(type);
  }

  private isClassType(type: ts.Type): boolean {
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
    if (type.flags & ts.TypeFlags.Any) return this.error(node, "`any` cannot be compiled to a native type."), T.string;
    if (type.flags & ts.TypeFlags.Unknown) return T.rt("Error");
    if (this.isString(type)) return T.string;
    if (this.isBoolean(type)) return T.bool;
    if (this.isNumber(type) && !this.isNullable(type)) return num === "int" ? T.int : T.double;
    if (type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never)) return T.void;
    if (type.isUnion()) {
      const all = this.members(type);
      const rest = all.filter((u) => !(u.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
      if (rest.length === all.length) {
        if (rest.every((u) => u.flags & ts.TypeFlags.StringLike)) return T.string;
        return this.error(node, `The union ${this.checker.typeToString(type)} has no native equivalent.`), T.string;
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
    if (symbol?.name === "Promise") return this.error(node, "A promise must be awaited where it is created."), T.void;
    const generic = this.genericRef(type);
    if (generic) return { k: "class", name: this.instantiate(generic.decl, generic.args, node) };
    if (this.isClassType(type)) return { k: "class", name: this.objectClasses.has(symbol!) ? this.className(symbol!) : symbol!.name };
    const index = type.getStringIndexType();
    if (index && type.getProperties().length === 0) return T.map(this.ty(index, node));
    const [signature] = type.getCallSignatures();
    if (signature && type.getProperties().length === 0) {
      return {
        k: "fn",
        params: signature.getParameters().map((p) => this.ty(this.checker.getTypeOfSymbol(p), node, this.slotKind(p))),
        ret: this.ty(signature.getReturnType(), node),
      };
    }
    return this.error(node, `The type ${this.checker.typeToString(type)} has no native equivalent; declare it as an interface.`), T.string;
  }

  /** The IR type of an expression as written (numbers by their inferred kind). */
  private tyOfExpr(node: ts.Expression): Ty {
    const type = this.typeOf(node);
    return this.ty(type, node, this.isNumber(type) ? this.numKind(node) : "double");
  }

  private tyOfSymbol(symbol: ts.Symbol, node: ts.Node): Ty {
    return this.ty(this.bound(this.checker.getTypeOfSymbolAtLocation(symbol, node)), node, this.slotKind(symbol));
  }

  // -------------------------------------------------------------------------
  // Top level
  // -------------------------------------------------------------------------

  private topLevel(node: ts.Statement, out: Program) {
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
      out.functions.push(this.fnDecl(node.name.text, node));
      return;
    }
    if (ts.isFunctionDeclaration(node) && !node.body) {
      if (node.name) (out.natives ??= []).push(this.fnDecl(node.name.text, node));
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
          out.functions.push(this.fnDecl(decl.name.text, decl.initializer as ts.ArrowFunction));
        } else {
          const [stmt] = this.varDecl(decl, node.declarationList, { async: false, ret: T.void, voidUnion: false, inTry: false });
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
    if (!cls) return;
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
        return this.allClasses().find((c) => c.name === ty.name)?.decodable ?? true;
      case "array":
      case "optional":
      case "map":
        return this.decodable(ty.of);
      default:
        return false;
    }
  }

  private isFunctionNode(node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration {
    return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node);
  }

  private fnDecl(name: string, node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration | ts.AccessorDeclaration): FnDecl {
    const isAsync = this.asyncFunctions.has(node);
    const signature = this.checker.getSignatureFromDeclaration(node)!;
    let retType = signature.getReturnType();
    if (isAsync) retType = this.checker.getAwaitedType(retType) ?? retType;
    const ret = this.ty(retType, node, this.slotKind(node));
    const ctx: Ctx = { async: isAsync, ret, voidUnion: false, inTry: false };
    return { name, params: this.params(node, ctx), ret, async: isAsync, body: this.body(node, ctx) };
  }

  private params(node: ts.SignatureDeclaration, ctx?: Ctx): Param[] {
    return node.parameters.map((param) => {
      const name = this.paramName(param);
      const ty = ts.isIdentifier(param.name) ? this.tyOfSymbol(this.checker.getSymbolAtLocation(param.name)!, param) : this.ty(this.typeOf(param), param);
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
      stmts.push(...this.block(body, ctx));
      if (ctx.voidUnion && !(stmts.at(-1)?.s === "return")) stmts.push({ s: "return", x: { e: "nil" } });
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

  /** A block's statements, with its function declarations first (they are hoisted in JavaScript). */
  private block(node: ts.Statement, ctx: Ctx): Stmt[] {
    if (!ts.isBlock(node)) return this.stmt(node, ctx);
    const hoisted = node.statements.filter(ts.isFunctionDeclaration);
    const rest = node.statements.filter((s) => !ts.isFunctionDeclaration(s));
    return [...hoisted, ...rest].flatMap((s) => this.stmt(s, ctx));
  }

  private stmt(node: ts.Statement, ctx: Ctx): Stmt[] {
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.kind === ts.SyntaxKind.SuperKeyword) return [];
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.flatMap((d) => this.varDecl(d, node.declarationList, ctx));
    if (ts.isExpressionStatement(node)) return this.exprStmt(node.expression, ctx);
    if (ts.isBlock(node)) return this.block(node, ctx);
    if (ts.isIfStatement(node)) {
      return [{ s: "if", c: this.cond(node.expression, ctx), then: this.block(node.thenStatement, ctx), else: node.elseStatement && this.block(node.elseStatement, ctx) }];
    }
    if (ts.isReturnStatement(node)) {
      if (!node.expression) return [{ s: "return", x: ctx.voidUnion ? { e: "nil" } : undefined }];
      if (ctx.ret.k === "void") return [...this.exprStmt(node.expression, ctx), { s: "return" }];
      return [{ s: "return", x: this.expr(node.expression, ctx, ctx.ret) }];
    }
    if (ts.isForOfStatement(node)) {
      const decl = node.initializer;
      if (!ts.isVariableDeclarationList(decl)) return [this.unsupported(node, "for-of over an existing variable; declare it in the loop")];
      if (!this.isArray(this.typeOf(node.expression))) return [this.unsupported(node.expression, "for-of over anything but an array (strings iterate characters natively)")];
      const binding = decl.declarations[0]!.name;
      const inner = { ...ctx, continueWith: undefined };
      if (ts.isIdentifier(binding)) {
        const element = this.elementLoops.get(this.checker.getSymbolAtLocation(binding)!);
        if (element) {
          // Over the indices: the element is read (and mutated) in the array itself.
          const length: Expr = { e: "op", op: "arr.length", args: [this.readAt(element.source, node.expression)] };
          return [{ s: "forRange", name: element.index, from: { e: "int", v: "0" }, to: length, inclusive: false, body: this.block(node.statement, inner) }];
        }
        const turn = this.loopBox(binding);
        return [{ s: "forOf", name: binding.text, of: this.expr(node.expression, ctx), body: [...(turn ? [turn.make] : []), ...this.block(node.statement, inner)] }];
      }
      const item = `it__${++this.temps}`;
      const binds = this.bindPattern(binding, { e: "id", name: item }, ctx, !(decl.flags & ts.NodeFlags.Const));
      return [{ s: "forOf", name: item, of: this.expr(node.expression, ctx), body: [...binds, ...this.block(node.statement, inner)] }];
    }
    if (ts.isForStatement(node)) return this.forLoop(node, ctx);
    if (ts.isWhileStatement(node)) return [{ s: "while", c: this.cond(node.expression, ctx), body: this.block(node.statement, { ...ctx, continueWith: undefined }) }];
    if (ts.isDoStatement(node)) {
      // `do B while (C)` → `first = true; while (first || C) { first = false; B }`: `continue` still tests C.
      const first = `first__${++this.temps}`;
      const body = this.block(node.statement, { ...ctx, continueWith: undefined });
      const test: Expr = { e: "bin", op: "||", l: { e: "id", name: first }, r: this.cond(node.expression, ctx) };
      return [
        { s: "let", name: first, ty: T.bool, init: { e: "bool", v: true }, mutable: true },
        { s: "while", c: test, body: [{ s: "assign", target: { e: "id", name: first }, op: "=", value: { e: "bool", v: false } }, ...body] },
      ];
    }
    if (ts.isBreakStatement(node) || ts.isContinueStatement(node)) {
      if (node.label) return [this.unsupported(node, "labelled break and continue")];
      return ts.isBreakStatement(node) ? [{ s: "break" }] : [...(ctx.continueWith ?? []), { s: "continue" }];
    }
    if (ts.isTryStatement(node)) {
      if (node.finallyBlock) return this.tryFinally(node, ctx);
      const inner = { ...ctx, inTry: true };
      const catchName = node.catchClause?.variableDeclaration && ts.isIdentifier(node.catchClause.variableDeclaration.name) ? node.catchClause.variableDeclaration.name.text : undefined;
      return [{ s: "try", body: this.block(node.tryBlock, inner), catchName, catchBody: node.catchClause ? this.block(node.catchClause.block, ctx) : [] }];
    }
    if (ts.isThrowStatement(node)) {
      if (!ctx.async && !ctx.inTry) return [this.unsupported(node, "`throw` outside an async function or a try block")];
      const x = node.expression;
      if (ts.isNewExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === "Error") {
        return [{ s: "throw", message: x.arguments?.[0] ? this.expr(x.arguments[0], ctx, T.string) : { e: "str", v: "Error" } }];
      }
      return [this.unsupported(node, "throwing anything but `new Error(message)`")];
    }
    if (ts.isSwitchStatement(node)) return [this.switchStmt(node, ctx)];
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
    const ty = this.tyOfSymbol(symbol, decl);
    if (this.boxed.has(symbol)) return [{ s: "let", name: decl.name.text, ty: this.refType(symbol), init: this.newRef(symbol, this.expr(decl.initializer!, ctx, ty)), mutable: false }];
    return [{ s: "let", name: decl.name.text, ty, init: decl.initializer && this.expr(decl.initializer, ctx, ty), mutable }];
  }

  /**
   * Destructuring, as the reads it stands for: `const { a, b: c = 1 } = o` is `a = o.a`, `c = o.b ?? 1`;
   * `const [x, , ...rest] = xs` is `x = xs[0]`, `rest = xs.slice(2)`. `source` is read once per name.
   */
  private bindPattern(pattern: ts.BindingPattern, source: Expr, ctx: Ctx, mutable: boolean): Stmt[] {
    const out: Stmt[] = [];
    const sourceType = this.checker.getNonNullableType(this.typeOf(pattern));
    const isMap = !!sourceType.getStringIndexType() && sourceType.getProperties().length === 0;
    pattern.elements.forEach((el, i) => {
      if (ts.isOmittedExpression(el)) return;
      let value: Expr;
      let nullable: boolean;
      if (ts.isObjectBindingPattern(pattern)) {
        const key = (el.propertyName ?? el.name) as ts.Identifier | ts.StringLiteral;
        if (isMap) {
          value = { e: "op", op: "map.get", args: [source, { e: "str", v: key.text }] };
          nullable = true;
        } else {
          const prop = sourceType.getProperty(key.text);
          const propType = prop ? this.checker.getTypeOfSymbolAtLocation(prop, el) : undefined;
          value = { e: "prop", obj: source, name: key.text };
          nullable = !!propType && this.isNullable(propType);
          if (el.initializer && propType && this.isNullable(propType) && (propType as ts.UnionType).types.some((t) => t.flags & ts.TypeFlags.Null)) {
            this.error(el, "A default for a property that can be null: JavaScript keeps the null, natively the default would replace it. Use ?? instead.");
          }
          if (prop && el.initializer && this.isNumber(propType!) && this.slotKind(prop) === "int" && this.numKind(el.initializer) === "double") {
            this.error(el.initializer, "This default is not a whole number but the property is: give the property a Double type, or the default a whole value.");
          }
        }
      } else if (el.dotDotDotToken) {
        value = { e: "op", op: "arr.slice", args: [source, { e: "int", v: String(i) }, { e: "nil" }] };
        nullable = false;
      } else {
        // A tuple's element is there (a plain read); an array's may not be (`T | undefined`).
        nullable = this.isNullable(this.typeOf(el.name)) || !!el.initializer;
        const index: Expr = { e: "int", v: String(i) };
        value = nullable ? { e: "op", op: "arr.at", args: [source, index] } : { e: "index", obj: source, index };
      }
      if (ts.isIdentifier(el.name)) {
        const symbol = this.checker.getSymbolAtLocation(el.name)!;
        // A rest of a tuple is a tuple TypeScript may type as `[]`: its type is the source's element type.
        const elemType = el.dotDotDotToken ? this.checker.getIndexTypeOfType(sourceType, ts.IndexKind.Number) : undefined;
        const ty = elemType ? T.array(this.ty(elemType, el)) : this.tyOfSymbol(symbol, el);
        if (el.initializer && nullable) value = { e: "coalesce", l: value, r: this.expr(el.initializer, ctx, ty) };
        // Shared with a nested class that reassigns it (or the function does): its box.
        if (this.boxed.has(symbol)) out.push({ s: "let", name: el.name.text, ty: this.refType(symbol, ty), init: this.newRef(symbol, value, ty), mutable: false });
        else out.push({ s: "let", name: el.name.text, ty, init: value, mutable });
        return;
      }
      const temp = `ds__${++this.temps}`;
      const ty = this.ty(this.typeOf(el.name), el);
      if (el.initializer && nullable) value = { e: "coalesce", l: value, r: this.expr(el.initializer, ctx, ty) };
      out.push({ s: "let", name: temp, ty, init: value, mutable: false }, ...this.bindPattern(el.name, { e: "id", name: temp }, ctx, mutable));
    });
    return out;
  }

  /**
   * `try {} catch {} finally {}` where nothing leaves the blocks early: the finally block runs after
   * the try statement, as it does in JavaScript. A `return`, `break`, `continue` or `throw` out of
   * them (or an `await` in the catch block, which can fail) would skip it natively.
   */
  private tryFinally(node: ts.TryStatement, ctx: Ctx): Stmt[] {
    if (!node.catchClause) return [this.unsupported(node, "`finally` without `catch` (the error would skip it natively); add a catch block")];
    const leaves = (block: ts.Node, inCatch: boolean): ts.Node | undefined => {
      let found: ts.Node | undefined;
      const visit = (n: ts.Node, inLoop: boolean, inSwitch: boolean): void => {
        if (found || this.isFunctionNode(n) || ts.isFunctionDeclaration(n)) return;
        if (ts.isReturnStatement(n)) found = n;
        else if (ts.isBreakStatement(n) && !inLoop && !inSwitch) found = n;
        else if (ts.isContinueStatement(n) && !inLoop) found = n;
        else if (inCatch && (ts.isThrowStatement(n) || ts.isAwaitExpression(n))) found = n;
        const loop = inLoop || ts.isIterationStatement(n, false);
        ts.forEachChild(n, (c) => visit(c, loop, inSwitch || ts.isSwitchStatement(n)));
      };
      visit(block, false, false);
      return found;
    };
    const early = leaves(node.tryBlock, false) ?? leaves(node.catchClause.block, true);
    if (early) return [this.unsupported(early, "leaving a try or catch block that has `finally` early (the finally block would be skipped natively)")];
    const inner = { ...ctx, inTry: true };
    const catchName = node.catchClause.variableDeclaration && ts.isIdentifier(node.catchClause.variableDeclaration.name) ? node.catchClause.variableDeclaration.name.text : undefined;
    return [
      { s: "try", body: this.block(node.tryBlock, inner), catchName, catchBody: this.block(node.catchClause.block, ctx) },
      ...this.block(node.finallyBlock!, ctx),
    ];
  }

  /**
   * `for (let i = a; i < b; i++)` with a bound the body can't change → a range loop. Any other
   * `for` → `init; while (cond) { body; step }`, where a `continue` runs the step first.
   */
  private forLoop(node: ts.ForStatement, ctx: Ctx): Stmt[] {
    const range = this.forRange(node, ctx);
    if (range) return range;
    const init = node.initializer;
    // JavaScript gives each iteration its own `let i`; a `while` has one. A closure would tell them apart.
    if (init && ts.isVariableDeclarationList(init)) {
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
    const body = this.block(node.statement, { ...ctx, continueWith: [...back, ...step] });
    const loop: Stmt = { s: "while", c: node.condition ? this.cond(node.condition, ctx) : { e: "bool", v: true }, body: [...turns.map((t) => t!.make), ...body, ...back, ...step] };
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
    const decl = init && ts.isVariableDeclarationList(init) ? init.declarations[0] : undefined;
    const cond = node.condition;
    const inc = node.incrementor;
    if (
      decl && ts.isIdentifier(decl.name) && decl.initializer && cond && ts.isBinaryExpression(cond) &&
      ts.isIdentifier(cond.left) && cond.left.text === decl.name.text &&
      (cond.operatorToken.kind === ts.SyntaxKind.LessThanToken || cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken) &&
      inc && (ts.isPostfixUnaryExpression(inc) || ts.isPrefixUnaryExpression(inc)) && inc.operator === ts.SyntaxKind.PlusPlusToken &&
      ts.isIdentifier(inc.operand) && inc.operand.text === decl.name.text && !this.isReassigned(decl.name, node.statement) &&
      this.stableBound(cond.right, node.statement)
    ) {
      return [{
        s: "forRange",
        name: decl.name.text,
        from: this.expr(decl.initializer, ctx, T.int),
        to: this.expr(cond.right, ctx, T.int),
        inclusive: cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken,
        body: this.block(node.statement, { ...ctx, continueWith: undefined }),
      }];
    }
    return undefined;
  }


  private switchStmt(node: ts.SwitchStatement, ctx: Ctx): Stmt {
    const subject = this.tyOfExpr(node.expression);
    const cases: { values: Expr[]; body: Stmt[] }[] = [];
    let defaultBody: Stmt[] | undefined;
    let pending: Expr[] = [];
    for (const clause of node.caseBlock.clauses) {
      const stmts = clause.statements.flatMap((s) => this.stmt(s, ctx));
      const last = stmts.at(-1);
      if (stmts.length && last?.s === "break") stmts.pop();
      else if (stmts.length && last?.s !== "return" && last?.s !== "throw" && clause !== node.caseBlock.clauses.at(-1)) this.error(clause, "Unsupported: fallthrough between switch cases; end each case with break or return.");
      if (ts.isDefaultClause(clause)) {
        defaultBody = stmts;
        continue;
      }
      pending.push(this.expr(clause.expression, ctx, subject));
      if (clause.statements.length) {
        cases.push({ values: pending, body: stmts });
        pending = [];
      }
    }
    // An exhaustive switch needs no default in TypeScript, but Swift, Kotlin and Rust need its end to be unreachable.
    if (!defaultBody && this.coversEveryLiteral(node)) defaultBody = [{ s: "unreachable" }];
    return { s: "switch", x: this.expr(node.expression, ctx), cases, default: defaultBody };
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
    const assigned = ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind) ? node.left
      : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && this.isIncrement(node) ? node.operand : undefined;
    const accessor = assigned && this.staticAccessor(assigned);
    if (accessor) return [this.staticAssign(node, assigned!, accessor, ctx)];
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.CommaToken) return [...this.exprStmt(node.left, ctx), ...this.exprStmt(node.right, ctx)];
    if (ts.isCallExpression(node)) {
      const optional = this.optionalCall(node, ctx);
      if (optional) return [{ s: "if", c: optional.cond, then: [{ s: "expr", x: optional.call }] }];
    }
    if (ts.isBinaryExpression(node) && this.isLogicalAssignment(node.operatorToken.kind)) {
      // `a ??= b`, `a ||= b`, `a &&= b`: an assignment under a test of `a`.
      if (!this.isPure(node.left)) return [this.unsupported(node, "a logical assignment to a computed target")];
      const kind = node.operatorToken.kind;
      const target = this.lvalue(node.left, ctx);
      const current = this.expr(node.left, ctx);
      const test: Expr = kind === ts.SyntaxKind.QuestionQuestionEqualsToken
        ? { e: "bin", op: "==", l: current, r: { e: "nil" } }
        : kind === ts.SyntaxKind.BarBarEqualsToken ? { e: "not", x: this.cond(node.left, ctx) } : this.cond(node.left, ctx);
      return [{ s: "if", c: test, then: [{ s: "assign", target, op: "=", value: this.expr(node.right, ctx, this.lvalueTy(node.left)) }] }];
    }
    const compound = ts.isBinaryExpression(node) ? COMPOUND[node.operatorToken.kind] : undefined;
    if (compound && ts.isBinaryExpression(node)) {
      if (!this.isPure(node.left)) return [this.unsupported(node, "this compound assignment to a computed target")];
      // `a |= b` is `a = a | b`, converted to the kind of `a`.
      const op = compound === ts.SyntaxKind.AsteriskAsteriskToken ? "math.pow" : BIT_OPS[compound]!;
      const args = op === "math.pow" ? [this.expr(node.left, ctx, T.double), this.expr(node.right, ctx, T.double)] : [this.expr(node.left, ctx), this.expr(node.right, ctx)];
      let x: Expr = { e: "op", op, args };
      const target = this.lvalueTy(node.left);
      if (target.k === "int" && (op === "math.pow" || op === "bit.ushr")) x = { e: "toInt", x };
      if (target.k === "double" && op !== "math.pow" && op !== "bit.ushr") x = { e: "toDouble", x };
      return [{ s: "assign", target: this.lvalue(node.left, ctx), op: "=", value: x }];
    }
    if (ts.isDeleteExpression(node) && this.isMapEntry(node.expression)) {
      return [{ s: "expr", x: { e: "op", op: "map.delete", args: [this.expr(node.expression.expression, ctx), this.expr(node.expression.argumentExpression, ctx, T.string)] } }];
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
      const targetTy = this.lvalueTy(node.left);
      if (op === "+=" && targetTy.k === "string") {
        return [{ s: "assign", target: this.lvalue(node.left, ctx), op, value: this.str(node.right, ctx) }];
      }
      return [{ s: "assign", target: this.lvalue(node.left, ctx), op, value: this.expr(node.right, ctx, targetTy) }];
    }
    if ((ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node)) && this.isIncrement(node)) {
      const ty = this.lvalueTy(node.operand);
      const one: Expr = ty.k === "int" ? { e: "int", v: "1" } : { e: "double", v: "1.0" };
      return [{ s: "assign", target: this.lvalue(node.operand, ctx), op: node.operator === ts.SyntaxKind.PlusPlusToken ? "+=" : "-=", value: one }];
    }
    if (ts.isCallExpression(node) && this.isAsyncCall(node)) return [{ s: "expr", x: { e: "launch", call: this.expr(node, ctx) } }];
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

  private isAsyncCall(node: ts.CallExpression): boolean {
    const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
    return !!decl && this.asyncFunctions.has(decl);
  }

  private lvalue(node: ts.Expression, ctx: Ctx): Expr {
    if (ts.isIdentifier(node)) {
      const box = this.boxAt(this.valueSymbol(node), node);
      if (box) return { e: "prop", obj: this.captureRead(node) ?? { e: "id", name: box }, name: "value" };
      return { e: "id", name: node.text };
    }
    const staticField = this.staticField(node);
    if (staticField) return staticField;
    if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword) return this.superProperty(node, true)!;
    if (ts.isPropertyAccessExpression(node)) return { e: "prop", obj: this.expr(node.expression, ctx), name: this.memberName(node.name) };
    if (ts.isElementAccessExpression(node)) return { e: "index", obj: this.expr(node.expression, ctx), index: this.expr(node.argumentExpression, ctx, this.indexTy(node)) };
    return this.error(node, "Unsupported assignment target.");
  }

  private lvalueTy(node: ts.Expression): Ty {
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
    // `theme.colors.primary`: createCss()'s theme is read at compile time.
    if (ts.isPropertyAccessExpression(node) && this.themeRooted(node)) {
      const v = this.constValue(node);
      if (typeof v === "string") return { e: "str", v };
      if (typeof v === "number") return want?.k === "int" ? { e: "int", v: String(v) } : { e: "double", v: Number.isInteger(v) ? v.toFixed(1) : String(v) };
      return this.error(node, "Read a single token of the theme (theme.colors.primary).");
    }
    const x = this.rawExpr(node, ctx, want);
    return want ? this.coerce(x, node, want) : x;
  }

  private coerce(x: Expr, node: ts.Expression, want: Ty): Expr {
    this.checkNominal(node, want);
    const target = want.k === "optional" ? want.of : want;
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
    const classOf = (t: Ty): string | undefined =>
      t.k === "class" ? t.name : t.k === "array" || t.k === "optional" || t.k === "map" ? classOf(t.of) : undefined;
    const expected = classOf(want);
    if (!expected) return;
    const actual = this.classNameOf(this.checker.getNonNullableType(type));
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
    if (this.isArray(type)) return this.classNameOf(this.checker.getNonNullableType(this.checker.getTypeArguments(type as ts.TypeReference)[0]!));
    const index = type.getStringIndexType();
    if (index && type.getProperties().length === 0) return this.classNameOf(this.checker.getNonNullableType(index));
    const generic = this.genericRef(this.bound(type));
    if (generic) return this.instantiate(generic.decl, generic.args, generic.decl);
    const symbol = type.aliasSymbol ?? type.getSymbol();
    return symbol && this.isClassType(type) ? this.className(symbol) : undefined;
  }

  /** A function passed where one with more parameters is expected gets the extra ones, unused. */
  private adapt(x: Expr, node: ts.Expression, want: Extract<Ty, { k: "fn" }>): Expr {
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
      const ownRet = signature ? this.ty(signature.getReturnType(), fn, this.slotKind(fn)) : want.ret;
      const mismatch = (a: Ty | undefined, b: Ty) => !!a && ((a.k === "int" && b.k === "double") || (a.k === "double" && b.k === "int"));
      const wrap = arity < want.params.length || want.params.some((p, i) => mismatch(own[i], p)) || mismatch(ownRet, want.ret);
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
    }
    return x;
  }

  /** Int ↔ Double where two number kinds meet. */
  private convert(x: Expr, from: Ty, to: Ty): Expr {
    if (from.k === "int" && to.k === "double") return { e: "toDouble", x };
    if (from.k === "double" && to.k === "int") return { e: "toInt", x };
    return x;
  }

  /** A condition: JavaScript truthiness made explicit. */
  private cond(node: ts.Expression, ctx: Ctx): Expr {
    if (ts.isParenthesizedExpression(node)) return this.cond(node.expression, ctx);
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) return { e: "not", x: this.cond(node.operand, ctx) };
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      return { e: "bin", op: node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? "&&" : "||", l: this.cond(node.left, ctx), r: this.cond(node.right, ctx) };
    }
    const type = this.typeOf(node);
    const x = this.expr(node, ctx);
    if (this.isBoolean(type)) return x;
    if (this.isNullable(type)) return { e: "bin", op: "!=", l: x, r: { e: "nil" } };
    if (this.isString(type)) return { e: "op", op: "str.nonEmpty", args: [x] };
    if (this.isNumber(type)) return { e: "bin", op: "!=", l: x, r: this.numKind(node) === "int" ? { e: "int", v: "0" } : { e: "double", v: "0.0" } };
    return { e: "bool", v: true };
  }

  /** A string: numbers and booleans formatted as JavaScript would. */
  private str(node: ts.Expression, ctx: Ctx): Expr {
    if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return { e: "str", v: node.getText() };
    const type = this.typeOf(node);
    const x = this.expr(node, ctx);
    if (this.isString(type)) return x;
    if (this.isNumber(type) && !this.isNullable(type)) return { e: "toStr", x, from: this.numKind(node) === "int" ? T.int : T.double };
    if (this.isBoolean(type)) return { e: "toStr", x, from: T.bool };
    if (type.flags & ts.TypeFlags.Unknown) return { e: "op", op: "error.message", args: [x] };
    return this.error(node, `Cannot turn ${this.checker.typeToString(type)} into text natively; handle null with ?? first.`);
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
    }
    if (ts.isIdentifier(node)) return this.identifier(node);
    if (ts.isTemplateExpression(node)) {
      const parts: (string | Expr)[] = [node.head.text];
      for (const span of node.templateSpans) parts.push(this.str(span.expression, ctx), span.literal.text);
      return { e: "tpl", parts: parts.filter((p) => p !== "") };
    }
    if (ts.isNonNullExpression(node)) {
      // `rows[i]!`: the read itself, which traps natively when out of range, as `!` would.
      if (ts.isElementAccessExpression(node.expression)) return this.elementAccess(node.expression, ctx, true);
      const inner = this.expr(node.expression, ctx, want);
      return this.isNullable(this.typeOf(node.expression)) && inner.e !== "unwrap" ? { e: "unwrap", x: inner } : inner;
    }
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.expr(node.expression, ctx, want);
    }
    if (ts.isAwaitExpression(node)) {
      if (!ctx.async) return this.error(node, "`await` outside an async function.");
      const inner = this.expr(node.expression, ctx, want);
      if (inner.e === "call" || inner.e === "rt" || inner.e === "method" || inner.e === "op") return { ...inner, await: true };
      return this.error(node, "Only calls can be awaited.");
    }
    if (ts.isPropertyAccessExpression(node)) return this.property(node, ctx);
    if (ts.isElementAccessExpression(node)) return this.elementAccess(node, ctx, false);
    if (ts.isCallExpression(node)) return this.call(node, ctx);
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return this.lambda(node, ctx, want?.k === "fn" ? want : undefined);
    if (ts.isConditionalExpression(node)) {
      const ty = want ?? this.tyOfExpr(node);
      return { e: "cond", c: this.cond(node.condition, ctx), a: this.expr(node.whenTrue, ctx, ty), b: this.expr(node.whenFalse, ctx, ty) };
    }
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.ExclamationToken) return { e: "not", x: this.cond(node.operand, ctx) };
      if (node.operator === ts.SyntaxKind.MinusToken) return { e: "neg", x: this.expr(node.operand, ctx, want) };
      if (node.operator === ts.SyntaxKind.PlusToken) return this.expr(node.operand, ctx, want);
      if (node.operator === ts.SyntaxKind.TildeToken) return { e: "op", op: "bit.not", args: [this.expr(node.operand, ctx)] };
      return this.increment(node, ctx);
    }
    if (ts.isPostfixUnaryExpression(node)) return this.increment(node, ctx);
    if (ts.isBinaryExpression(node)) return this.binary(node, ctx);
    if (ts.isArrayLiteralExpression(node)) {
      const ty = want?.k === "array" ? want : this.tyOfExpr(node);
      if (ty.k !== "array") return this.error(node, "Unsupported array literal.");
      return this.arrayOf(node.elements, ty.of, ctx);
    }
    if (ts.isObjectLiteralExpression(node)) return this.object(node, ctx, want);
    if (node.kind === ts.SyntaxKind.ThisKeyword) return { e: "id", name: "this" };
    if (ts.isNewExpression(node)) {
      const symbol = this.classRef(node.expression);
      const signature = this.checker.getResolvedSignature(node);
      if (symbol && signature) return { e: "construct", cls: this.classNameOf(this.typeOf(node)) ?? this.className(symbol), args: [...this.captureArgs(symbol, node), ...this.callArgs(node, signature, ctx)] };
      return this.error(node, "Unsupported: `new` of anything but the app's classes (and `throw new Error(...)`).");
    }
    if (ts.isTypeOfExpression(node)) return this.error(node, "Unsupported: `typeof` at run time.");
    return this.error(node, `Unsupported expression ${ts.SyntaxKind[node.kind]}.`);
  }

  /** `x++`, `--obj.count`, `xs[i]++` as a value. The target is read and written, so it must have no effects. */
  private increment(node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression, ctx: Ctx): Expr {
    const target = node.operand;
    if (this.staticAccessor(target)) return this.error(node, "Unsupported: ++/-- on a static getter / setter inside an expression; use it as a statement.");
    const pure = this.isPure(target) || (ts.isElementAccessExpression(target) && this.isPure(target.expression) && this.isPure(target.argumentExpression));
    if (!pure) return this.error(node, "Unsupported: ++/-- on a computed target inside an expression; read it into a variable first.");
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
    if (this.isString(objType)) return this.error(node, "Indexing a string is not supported natively (characters differ); use slice().");
    if (this.isArray(objType)) {
      const index = this.expr(node.argumentExpression, ctx, T.int);
      if (node.questionDotToken) return this.error(node, "Unsupported: ?.[] on an optional array; read it into a variable and narrow it first.");
      return present ? { e: "index", obj, index } : { e: "op", op: "arr.at", args: [obj, index] };
    }
    if (objType.getStringIndexType()) {
      const get: Expr = { e: "op", op: "map.get", args: [obj, this.expr(node.argumentExpression, ctx, T.string)] };
      return present ? { e: "unwrap", x: get } : get;
    }
    return this.error(node, "Only arrays and Record<string, T> maps can be indexed natively.");
  }

  private identifier(node: ts.Identifier): Expr {
    if (node.text === "undefined") return { e: "nil" };
    if ((node.text === "Infinity" || node.text === "NaN") && this.checker.getSymbolAtLocation(node)?.declarations?.[0]?.getSourceFile().isDeclarationFile) {
      return { e: "op", op: "math.fn", args: [{ e: "str", v: node.text }] };
    }
    const symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) return this.error(node, `Unknown identifier ${node.text}.`);
    const resolved = this.resolveAlias(symbol)!;
    if (resolved.flags & ts.SymbolFlags.Enum) return this.error(node, `The enum ${node.text} exists natively only through its members (${node.text}.Member).`);
    if (resolved.flags & ts.SymbolFlags.ValueModule) return this.error(node, `The module ${node.text} exists natively only through its members (${node.text}.name).`);
    if (resolved.flags & ts.SymbolFlags.Class || this.classRef(node)) return this.error(node, `The class ${node.text} exists natively only through \`new\` and its static members.`);
    const decl = resolved.valueDeclaration ?? resolved.declarations?.[0];
    if (decl && this.isApi(decl)) return this.error(node, `${node.text} must be called, not used as a value.`);
    if (decl?.getSourceFile().isDeclarationFile) return this.error(node, `${node.text} is not available natively.`);
    if (this.generics.has(resolved) && !this.isLvalue(node)) {
      return this.error(node, `${node.text} is generic: pass it as a callback that calls it (x => ${node.text}(x)), so its types are known.`);
    }
    const captured = this.captureRead(node);
    const x: Expr = captured ?? { e: "id", name: node.text, fnRef: this.functionSymbols.has(resolved) || undefined };
    const value = this.valueSymbol(node);
    const element = value && this.elementLoops.get(value);
    // The loop's element: the array at the index (the class's own copy of the index, in a nested class).
    if (element) return { e: "index", obj: this.readAt(element.source, node), index: captured ?? { e: "id", name: element.index } };
    const box = this.boxAt(value, node);
    return this.unwrapIfNarrowed(box ? { e: "prop", obj: captured ?? { e: "id", name: box }, name: "value" } : x, node, resolved);
  }

  /** A nullable value TypeScript has narrowed to non-null here is force-unwrapped. */
  private unwrapIfNarrowed(x: Expr, node: ts.Node, symbol: ts.Symbol): Expr {
    if (this.isLvalue(node)) return x;
    const declared = this.checker.getTypeOfSymbol(symbol);
    const here = this.typeOf(node);
    const read: Expr = this.isNullable(declared) && !this.isNullable(here) && !(here.flags & ts.TypeFlags.Never) ? { e: "unwrap", x } : x;
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
    if (right?.name === "Error" && right.declarations?.[0]?.getSourceFile().isDeclarationFile && this.ty(this.typeOf(node.left), node.left).k === "rt") return { e: "bool", v: true };
    const classSymbol = this.classRef(node.right);
    const decl = classSymbol && this.objectClasses.get(classSymbol);
    if (!decl) return this.error(node.right, "instanceof works with the app's classes natively (and `e instanceof Error` in a catch).");
    if (decl.typeParameters?.length) return this.error(node.right, "instanceof a generic class is not supported natively (its instantiations are different classes).");
    const leftType = this.typeOf(node.left);
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
    const member = this.enumValue(node);
    if (member !== undefined) {
      if (typeof member === "string") return { e: "str", v: member };
      return Number.isInteger(member) ? { e: "int", v: String(member) } : { e: "double", v: String(member) };
    }
    const unqualified = this.unNamespace(node);
    if (unqualified !== node) return this.identifier(unqualified as ts.Identifier);
    const sup = this.superProperty(node, false);
    if (sup) return sup;
    const accessor = this.staticAccessor(node);
    if (accessor) return { e: "call", callee: { e: "id", name: accessor.get }, args: [] };
    const staticField = this.staticField(node);
    if (staticField) return staticField;
    const memberDecl = this.checker.getSymbolAtLocation(node.name)?.valueDeclaration;
    if (memberDecl && (ts.isMethodDeclaration(memberDecl) || ts.isMethodSignature(memberDecl)) && this.ownerOf(memberDecl)) {
      return this.error(node, "A method can only be called natively (JavaScript would lose its `this`); wrap it in an arrow function.");
    }
    const name = this.memberName(node.name);
    const objType = this.typeOf(node.expression);
    if (ts.isIdentifier(node.expression) && node.expression.text === "Math" && name === "PI") return { e: "op", op: "math.pi", args: [] };
    const constant = ts.isIdentifier(node.expression) ? MATH_CONSTANTS[`${node.expression.text}.${name}`] : undefined;
    if (constant !== undefined) return { e: "double", v: Number.isInteger(constant) ? `${constant}.0` : String(constant) };
    if (ts.isIdentifier(node.expression) && node.expression.text === "Number" && (name === "POSITIVE_INFINITY" || name === "NaN")) return { e: "op", op: "math.fn", args: [{ e: "str", v: name === "NaN" ? "NaN" : "Infinity" }] };
    if (ts.isIdentifier(node.expression) && node.expression.text === "Number" && name === "NEGATIVE_INFINITY") return { e: "neg", x: { e: "op", op: "math.fn", args: [{ e: "str", v: "Infinity" }] } };
    const chain = (ts.isOptionalChain(node) && !node.questionDotToken) || undefined;
    if (node.questionDotToken && name === "length") return this.error(node, "Unsupported: ?.length; narrow the value first.");
    if (name === "length" && this.isArray(this.checker.getNonNullableType(objType))) return { e: "op", op: "arr.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "length" && this.isString(this.checker.getNonNullableType(objType))) return { e: "op", op: "str.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "message" && this.ty(objType, node).k === "rt") return { e: "op", op: "error.text", args: [this.expr(node.expression, ctx)] };
    const obj = this.expr(node.expression, ctx);
    // Record<string, T>: a map lookup, optional unless TypeScript narrowed it.
    if (objType.getStringIndexType() && objType.getProperties().length === 0) {
      const get: Expr = { e: "op", op: "map.get", args: [obj, { e: "str", v: name }] };
      return this.isNullable(this.typeOf(node)) ? get : { e: "unwrap", x: get };
    }
    const x: Expr = { e: "prop", obj, name, optional: !!node.questionDotToken || undefined, chain };
    const symbol = this.checker.getSymbolAtLocation(node.name);
    return symbol ? this.unwrapIfNarrowed(x, node, symbol) : x;
  }

  private binary(node: ts.BinaryExpression, ctx: Ctx): Expr {
    const kind = node.operatorToken.kind;
    const lt = this.typeOf(node.left);
    const rt = this.typeOf(node.right);
    if (this.isAssignment(kind)) return this.error(node, "Unsupported: assignment inside an expression; make it a statement.");
    if (kind === ts.SyntaxKind.InstanceOfKeyword) return this.instanceOf(node, ctx);
    if (kind === ts.SyntaxKind.QuestionQuestionToken) {
      const ty = this.tyOfExpr(node);
      const left = this.expr(node.left, ctx);
      // `x ?? y` where TypeScript narrowed x: keep it optional, so `??` stays meaningful natively.
      return { e: "coalesce", l: left.e === "unwrap" ? left.x : left, r: this.expr(node.right, ctx, ty) };
    }
    if (kind === ts.SyntaxKind.AmpersandAmpersandToken || kind === ts.SyntaxKind.BarBarToken) {
      if (this.isBoolean(this.typeOf(node))) return this.cond(node, ctx);
      if (kind === ts.SyntaxKind.BarBarToken && this.isString(rt)) {
        return this.isNullable(lt) ? { e: "coalesce", l: this.expr(node.left, ctx), r: this.expr(node.right, ctx) } : { e: "op", op: "str.or", args: [this.expr(node.left, ctx), this.expr(node.right, ctx)] };
      }
      if (kind === ts.SyntaxKind.BarBarToken && this.isNullable(lt)) return { e: "coalesce", l: this.expr(node.left, ctx), r: this.expr(node.right, ctx) };
      return this.error(node, "Unsupported: && / || on values that are not booleans.");
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
    if (!op) return this.error(node, `Unsupported operator ${node.operatorToken.getText()}.`);
    if (op === "==" || op === "!=") {
      const isNil = (n: ts.Expression) => n.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(n) && n.text === "undefined");
      if (isNil(node.left) || isNil(node.right)) {
        const other = isNil(node.left) ? node.right : node.left;
        return { e: "bin", op, l: this.expr(other, ctx), r: { e: "nil" } };
      }
      if (this.isClassType(this.checker.getNonNullableType(lt))) op = op === "==" ? "===" : "!==";
    }
    // JavaScript orders strings by UTF-16 units; Swift and Rust by other rules.
    if (["<", "<=", ">", ">="].includes(op) && this.isString(lt) && this.isString(rt)) {
      return { e: "bin", op, l: { e: "op", op: "str.compare", args: [this.expr(node.left, ctx), this.expr(node.right, ctx)] }, r: { e: "int", v: "0" } };
    }
    if (this.isNumber(lt) && this.isNumber(rt)) {
      const num = op === "/" || this.numKind(node.left) === "double" || this.numKind(node.right) === "double" ? T.double : T.int;
      if (op === "%" && num.k === "double") return this.error(node, "Unsupported: % on non-whole numbers.");
      return { e: "bin", op, l: this.expr(node.left, ctx, num), r: this.expr(node.right, ctx, num) };
    }
    return { e: "bin", op, l: this.expr(node.left, ctx), r: this.expr(node.right, ctx) };
  }

  private object(node: ts.ObjectLiteralExpression, ctx: Ctx, want?: Ty): Expr {
    const target = want?.k === "optional" ? want.of : want;
    const ctxType = this.checker.getContextualType(node) ?? this.typeOf(node);
    const ty = target && target.k !== "fn" ? target : this.ty(this.checker.getNonNullableType(ctxType), node);
    if (ty.k === "rt" && ty.name === "Style") return this.style(node, ctx);
    if (ty.k === "class" && this.allClasses().some((c) => c.name === ty.name)) {
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
      return { e: "new", cls: cls.name, args };
    }
    if (ty.k === "map") {
      return {
        e: "dict",
        of: ty.of,
        entries: node.properties.map((prop) => {
          if (!ts.isPropertyAssignment(prop)) return ["", this.error(prop, "Unsupported map entry.")];
          const key = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : "";
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
        this.error(prop, "Unsupported style entry.");
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
        if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) this.error(prop, "Unsupported raw entry.");
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
          stops.push(this.error(prop, "Unsupported keyframe."));
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
    if (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) {
      return this.error(node, "Unsupported: async callbacks; move the body into an async function and call it.");
    }
    const signature = this.checker.getSignatureFromDeclaration(node);
    const declaredRet = signature ? signature.getReturnType() : undefined;
    let ret = want?.ret ?? (declaredRet ? this.ty(declaredRet, node, this.slotKind(node)) : T.void);
    // `void | (() => void)` (onMount): an optional cleanup.
    const voidUnion = ret.k === "optional" && ret.of.k === "fn";
    if (want && declaredRet && ret.k !== "void" && !voidUnion && declaredRet.flags & ts.TypeFlags.Void) ret = T.void;
    const inner: Ctx = { async: false, ret, voidUnion, inTry: false };
    const params = this.params(node, ownDefaults ? inner : undefined);
    const destructures = node.parameters.some((p) => !ts.isIdentifier(p.name));
    const defaults = ownDefaults && params.some((p) => p.default);
    const body = node.body && !ts.isBlock(node.body) && ret.k !== "void" && !voidUnion && !destructures && !defaults ? this.expr(node.body, inner, ret) : this.body(node, inner);
    if (Array.isArray(body)) this.ownDefaults(params, node.parameters, body);
    return { e: "lambda", params, ret, body };
  }

  private call(node: ts.CallExpression, ctx: Ctx): Expr {
    const optional = this.optionalCall(node, ctx);
    if (optional) return { e: "cond", c: optional.cond, a: optional.call, b: { e: "nil" } };
    const callee = this.unNamespace(node.expression);
    if (node.questionDotToken || (ts.isPropertyAccessExpression(callee) && callee.questionDotToken)) {
      return this.error(node, "Unsupported: this optional call (?.()); narrow the value first (if (f) f()).");
    }
    const api = ts.isIdentifier(callee) ? this.apiName(callee) : undefined;
    if (api) return this.nuclo(api, node, ctx);
    const component = ts.isIdentifier(callee) ? this.nativeComponents.get(this.resolveAlias(this.checker.getSymbolAtLocation(callee))!) : undefined;
    if (component) return this.nativeView(component, node, ctx);

    if (ts.isIdentifier(callee)) {
      if (callee.text === "String" && node.arguments.length === 1) return this.str(node.arguments[0]!, ctx);
      if (callee.text === "Number") return { e: "op", op: "num.parse", args: [this.expr(node.arguments[0]!, ctx, T.string)] };
      if (callee.text === "parseInt") return { e: "op", op: "int.parse", args: [this.expr(node.arguments[0]!, ctx, T.string)] };
      if ((callee.text === "isNaN" || callee.text === "isFinite") && node.arguments.length === 1) {
        return { e: "op", op: "math.fn", args: [{ e: "str", v: callee.text }, this.expr(node.arguments[0]!, ctx, T.double)] };
      }
    }
    if (ts.isPropertyAccessExpression(callee)) {
      const member = this.memberCall(callee, node, ctx);
      if (member) return member;
      const method = this.method(callee, node, ctx);
      if (method?.e === "op" && ts.isOptionalChain(node)) method.chain = true;
      if (method) return method;
    }

    const signature = this.checker.getResolvedSignature(node);
    const decl = signature?.getDeclaration();
    if (!signature || !decl) return this.error(node, "Cannot resolve this call.");
    // A variants() recipe: btn({ intent: "danger" }).
    if (this.isApi(decl)) {
      const arg = node.arguments[0];
      return { e: "call", callee: this.expr(callee, ctx), args: arg ? [this.selection(arg, ctx)] : [] };
    }
    if (decl.getSourceFile().isDeclarationFile) return this.error(node, `${callee.getText()}() is not available natively.`);
    const args = this.callArgs(node, signature, ctx);
    // A declared function is called by name; a function value (maybe narrowed from null) is read as one.
    const symbol = ts.isIdentifier(callee) ? this.resolveAlias(this.checker.getSymbolAtLocation(callee)) : undefined;
    const generic = symbol && this.generics.get(symbol);
    if (generic) return { e: "call", callee: { e: "id", name: this.instantiate(generic, this.checker.getTypeArgumentsForResolvedSignature(signature) ?? [], node) }, args };
    const fn = symbol && this.functionSymbols.has(symbol) && !this.captureRead(callee as ts.Identifier) ? ({ e: "id", name: (callee as ts.Identifier).text } as Expr) : this.expr(callee, ctx);
    return { e: "call", callee: fn, args };
  }

  /** `obj.m(…)` / `super.m(…)` on a class or protocol value, and `C.m(…)`, a static method. */
  private memberCall(callee: ts.PropertyAccessExpression, node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const decl = this.checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
    const owner = decl && this.ownerOf(decl);
    if (!decl || !owner || !(ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl))) return undefined;
    const signature = this.checker.getResolvedSignature(node);
    if (!signature) return this.error(node, "Cannot resolve this call.");
    const args = this.callArgs(node, signature, ctx);
    const name = this.memberName(callee.name);
    if (ts.getCombinedModifierFlags(decl) & ts.ModifierFlags.Static) return { e: "call", callee: { e: "id", name: `${owner}__${name}` }, args };
    // Left-out optional arguments are nil: the method applies its own defaults.
    const declared = decl.parameters.filter((p) => !p.dotDotDotToken).length;
    while (args.length < declared) args.push({ e: "nil" });
    if (callee.expression.kind === ts.SyntaxKind.SuperKeyword) {
      return { e: "invoke", obj: { e: "id", name: "this" }, name, args, sup: this.superOwner(node, name, ts.isMethodDeclaration) ?? owner };
    }
    return { e: "invoke", obj: this.expr(callee.expression, ctx), name, args };
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
    const current: Expr = { e: "call", callee: { e: "id", name: accessor.get }, args: [] };
    const set = (value: Expr): Stmt => ({ s: "expr", x: { e: "call", callee: { e: "id", name: accessor.set }, args: [value] } });
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
  private callArgs(node: ts.CallExpression | ts.NewExpression, signature: ts.Signature, ctx: Ctx): Expr[] {
    const params = signature.getParameters();
    const decl = signature.getDeclaration();
    const rest = decl?.parameters.findIndex((p) => p.dotDotDotToken) ?? -1;
    const arg = (a: ts.Expression, i: number) => {
      const param = params[i];
      if (ts.isSpreadElement(a)) return this.error(a, "Spread arguments are supported for a rest parameter only.");
      return this.expr(a, ctx, param ? this.tyOfSymbol(param, a) : undefined);
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
    if (node.questionDotToken) {
      if (!this.isPure(callee) || !signature) return void this.error(node, "Unsupported: ?.() on a computed function; read it into a variable first.");
      const f = optional(this.expr(callee, ctx));
      return { cond: nonNil(f), call: { e: "call", callee: { e: "unwrap", x: f }, args: this.callArgs(node, signature, ctx) } };
    }
    if (ts.isPropertyAccessExpression(callee) && callee.questionDotToken) {
      const field = this.checker.getSymbolAtLocation(callee.name)?.valueDeclaration;
      if (!field || !ts.isPropertySignature(field) || !signature) return undefined;
      if (!this.isPure(callee.expression)) return void this.error(node, "Unsupported: ?. on a computed value before a call; read it into a variable first.");
      const obj = optional(this.expr(callee.expression, ctx));
      return { cond: nonNil(obj), call: { e: "call", callee: { e: "prop", obj: { e: "unwrap", x: obj }, name: callee.name.text }, args: this.callArgs(node, signature, ctx) } };
    }
    return undefined;
  }

  /** Methods of built-in values: arrays, strings, numbers, Math, Date, console, router, response, when(). */
  private method(callee: ts.PropertyAccessExpression, node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const name = callee.name.text;
    const recv = callee.expression;
    const args = node.arguments;
    if (ts.isIdentifier(recv) && recv.text === "Math") {
      const ops: Record<string, Op> = { floor: "math.floor", ceil: "math.ceil", round: "math.round", trunc: "math.trunc", abs: "math.abs", min: "math.min", max: "math.max", sqrt: "math.sqrt", pow: "math.pow", random: "math.random" };
      const op = ops[name];
      if (!op && MATH_FNS.has(name)) return { e: "op", op: "math.fn", args: [{ e: "str", v: name }, ...args.map((a) => this.expr(a, ctx, T.double))] };
      if (!op) return this.error(node, `Math.${name} is not available natively.`);
      const num = this.numKind(node) === "int" && (op === "math.abs" || op === "math.min" || op === "math.max") ? T.int : T.double;
      // Math.floor(n) of a whole number is the number itself.
      if (["math.floor", "math.ceil", "math.round", "math.trunc"].includes(op) && this.numKind(args[0]!) === "int") return this.expr(args[0]!, ctx, T.int);
      return { e: "op", op, args: args.map((a) => this.expr(a, ctx, num)) };
    }
    if (ts.isIdentifier(recv) && recv.text === "Number" && ["isInteger", "isNaN", "isFinite"].includes(name) && args.length === 1) {
      return { e: "op", op: "math.fn", args: [{ e: "str", v: name }, this.expr(args[0]!, ctx, T.double)] };
    }
    if (ts.isIdentifier(recv) && recv.text === "Date" && name === "now") return { e: "op", op: "date.now", args: [] };
    if (ts.isIdentifier(recv) && this.apiName(recv) === "console" && name === "log") return { e: "rt", name: "log", args: args.map((a) => this.str(a, ctx)) };

    const recvType = this.checker.getNonNullableType(this.typeOf(recv));
    const recvTy = this.ty(recvType, recv);
    const obj = this.expr(recv, ctx);

    if (this.isArray(recvType)) {
      const elem = (recvTy as Extract<Ty, { k: "array" }>).of;
      // A callback may take the index as well: `(x, i) => …` is the op's indexed form.
      const arity = (fn: ts.Expression | undefined) =>
        !fn ? 0 : ts.isArrowFunction(fn) || ts.isFunctionExpression(fn) ? fn.parameters.length : (this.typeOf(fn).getCallSignatures()[0]?.parameters.length ?? 1);
      const indexed = arity(args[0]) === 2;
      const cb = (i: number, ret: Ty) => this.expr(args[i]!, ctx, { k: "fn", params: indexed ? [elem, T.int] : [elem], ret });
      const checkCallback = () => {
        if (arity(args[0]) > 2) this.error(args[0]!, `${name}() callbacks take the item and its index natively (not the array).`);
      };
      const each = (op: string): Op => `arr.${op}${indexed ? "I" : ""}` as Op;
      switch (name) {
        case "push":
          return args.length === 1 ? { e: "op", op: "arr.push", args: [obj, this.expr(args[0]!, ctx, elem)] } : { e: "op", op: "arr.pushAll", args: [obj, { e: "arr", of: elem, items: args.map((a) => this.expr(a, ctx, elem)) }] };
        case "pop":
          return { e: "op", op: "arr.pop", args: [obj] };
        case "unshift":
          return { e: "op", op: "arr.unshift", args: [obj, this.expr(args[0]!, ctx, elem)] };
        case "splice":
          if (args.length > 2) return this.error(node, "splice() with inserted items is not supported natively; use splice + push.");
          return { e: "op", op: "arr.splice", args: [obj, this.expr(args[0]!, ctx, T.int), args[1] ? this.expr(args[1], ctx, T.int) : { e: "int", v: "1" }] };
        case "indexOf":
          return { e: "op", op: "arr.indexOf", args: [obj, this.expr(args[0]!, ctx, elem)] };
        case "includes":
          return { e: "op", op: "arr.includes", args: [obj, this.expr(args[0]!, ctx, elem)] };
        case "join": {
          const sep: Expr = args[0] ? this.expr(args[0], ctx, T.string) : { e: "str", v: "," };
          if (elem.k === "string") return { e: "op", op: "arr.join", args: [obj, sep] };
          // Numbers and booleans are joined as JavaScript prints them.
          if (!["int", "double", "bool"].includes(elem.k)) return this.error(node, "join() is supported on arrays of strings, numbers and booleans.");
          const text: Expr = { e: "lambda", params: [{ name: "j__", ty: elem }], ret: T.string, body: { e: "toStr", x: { e: "id", name: "j__" }, from: elem } };
          return { e: "op", op: "arr.join", args: [{ e: "op", op: "arr.map", args: [obj, text] }, sep] };
        }
        case "concat":
          return { e: "op", op: "arr.concat", args: [obj, ...args.map((a): Expr => (this.isArray(this.typeOf(a)) ? this.expr(a, ctx, recvTy) : { e: "arr", of: elem, items: [this.expr(a, ctx, elem)] }))] };
        case "sort":
          return { e: "op", op: "arr.sort", args: [obj, args[0] ? this.expr(args[0], ctx, { k: "fn", params: [elem, elem], ret: T.double }) : this.defaultComparator(elem, node)] };
        case "reverse":
          return { e: "op", op: "arr.reverse", args: [obj] };
        case "shift":
          return { e: "op", op: "arr.shift", args: [obj] };
        case "lastIndexOf":
          if (args.length > 1) return this.error(node, "lastIndexOf() with a start index is not supported natively.");
          return { e: "op", op: "arr.lastIndexOf", args: [obj, this.expr(args[0]!, ctx, elem)] };
        case "at":
          return { e: "op", op: "arr.atRel", args: [obj, this.expr(args[0]!, ctx, T.int)] };
        case "reduce": {
          if (args.length < 2) return this.error(node, "Give reduce() an initial value: without one it throws on an empty array, which natively would crash.");
          if (arity(args[0]) > 2) return this.error(args[0]!, "reduce() callbacks take the total and the item natively (not the index).");
          const acc = this.tyOfExpr(node);
          return { e: "op", op: "arr.reduce", args: [obj, this.expr(args[0]!, ctx, { k: "fn", params: [acc, elem], ret: acc }), this.expr(args[1]!, ctx, acc)] };
        }
        case "slice":
          return { e: "op", op: "arr.slice", args: [obj, args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }, args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
        case "find":
        case "findIndex":
        case "filter":
        case "some":
        case "every":
          checkCallback();
          return { e: "op", op: each(name), args: [obj, cb(0, T.bool)] };
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
      const strings = args.every((a) => this.isString(this.typeOf(a)) || this.isNumber(this.typeOf(a)));
      if (!strings) return this.error(node, `${name}() takes strings and numbers natively (no regular expressions or callbacks).`);
      switch (name) {
        case "toString":
          return obj;
        case "split":
          if (args.length !== 1) return this.error(node, "split() takes one separator natively.");
          return { e: "op", op: "str.split", args: [obj, text(0)] };
        case "replace":
        case "replaceAll":
          return { e: "op", op: `str.${name}`, args: [obj, text(0), text(1)] };
        case "indexOf":
          return { e: "op", op: "str.indexOf", args: [obj, text(0), int(1, "0")] };
        case "lastIndexOf":
          if (args.length > 1) return this.error(node, "lastIndexOf() with a start index is not supported natively.");
          return { e: "op", op: "str.lastIndexOf", args: [obj, text(0)] };
        case "padStart":
        case "padEnd":
          return { e: "op", op: `str.${name}`, args: [obj, int(0, "0"), text(1, " ")] };
        case "repeat":
          return { e: "op", op: "str.repeat", args: [obj, int(0, "0")] };
        case "localeCompare":
          return this.error(node, "localeCompare() depends on the platform's locale data; compare with < and > (UTF-16 order, the same everywhere).");
      }
      const op = strOps[name];
      if (!op) return this.error(node, `String.${name}() is not available natively.`);
      if (op === "str.slice") return { e: "op", op, args: [obj, this.expr(args[0]!, ctx, T.int), args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
      return { e: "op", op, args: [obj, ...args.map((a) => this.expr(a, ctx, T.string))] };
    }
    if ((this.isNumber(recvType) || this.isBoolean(recvType)) && name === "toString" && !args.length) return this.str(recv, ctx);
    if (this.isNumber(recvType) && name === "toFixed") {
      return { e: "op", op: "num.toFixed", args: [this.expr(recv, ctx, T.double), args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }] };
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
            if (!this.decodable(ty)) return this.error(node, "json<T>() needs T made of interfaces, arrays, strings, numbers and booleans.");
            return { e: "method", obj, name, args: [{ e: "decoder", ty }] };
          }
        }
      }
    }
    return undefined;
  }

  /** `sort()` without a comparator compares the items as text, as JavaScript does: `[10, 9].sort()` is `[10, 9]`. */
  private defaultComparator(elem: Ty, node: ts.Node): Expr {
    if (!["string", "int", "double", "bool"].includes(elem.k)) return this.error(node, "sort() of objects needs a comparator (JavaScript would compare \"[object Object]\").");
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
        if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) return ["", this.error(prop, "Unsupported selection entry.")];
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
    return this.error(node, `${name}() is not supported natively.`);
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
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) return [this.error(prop, "Unsupported attribute.")];
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
    return this.error(value, `The attribute ${name} is not supported natively.`);
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
      else this.error(prop, "Unsupported prop.");
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
      if (!ts.isPropertyAssignment(g) || !ts.isIdentifier(g.name) || !ts.isObjectLiteralExpression(g.initializer)) return ["", this.error(g, "Unsupported variant group.")];
      return [
        g.name.text,
        {
          e: "dict",
          of: T.rt("Style"),
          entries: g.initializer.properties.map((v): [string, Expr] => {
            if (!ts.isPropertyAssignment(v) || !(ts.isIdentifier(v.name) || ts.isStringLiteral(v.name))) return ["", this.error(v, "Unsupported variant.")];
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
          items.push(this.error(item, "Unsupported compound variant."));
          continue;
        }
        const style = this.attrValue([item], "css");
        const match = item.properties.filter((p) => !(p.name && ts.isIdentifier(p.name) && p.name.text === "css"));
        const entries: [string, Expr][] = match.map((p) =>
          ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) ? [p.name.text, this.str(p.initializer, ctx)] : ["", this.error(item, "Unsupported compound entry.")],
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
      if (!ts.isPropertyAssignment(prop) || !(ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name))) return this.error(prop, "Unsupported route.");
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
