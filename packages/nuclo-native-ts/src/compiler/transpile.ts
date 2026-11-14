/**
 * The front-end: TypeScript (program + type checker) → typed IR (ir.ts).
 *
 * It answers every TypeScript question so the printers don't have to:
 *  - types: `number` slots are inferred Int or Double (a fixpoint over every write), interfaces
 *    become classes, `T | null` an optional, `T[]` an array, `Record<string, T>` a map;
 *  - narrowing: a nullable value TypeScript has narrowed is force-unwrapped where it is read;
 *  - async: `async` functions become `async throws` / `suspend`, an un-awaited call is launched;
 *  - nuclo: builder calls, attribute objects, when/list/region/into/scope, styles, variants and
 *    the router are lowered to runtime calls with lazily built content.
 * Anything it cannot translate is reported with its file and line, and nothing is emitted.
 */
import * as path from "node:path";
import ts from "typescript";
import { type BinOp, type ClassDecl, type Expr, type FnDecl, type Op, type Param, type Program, type Stmt, T, type Ty } from "./ir.ts";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
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

const TAGS = new Set([
  "div", "section", "header", "footer", "main", "nav", "article", "aside", "form", "ul", "li",
  "span", "p", "h1", "h2", "h3", "h4", "label", "strong", "small", "em",
  "button", "input", "textarea", "img",
]);

/** API interfaces and the runtime types they become. */
const API_TYPES: Record<string, Ty> = {
  Node: T.rt("Node"),
  Modifier: T.rt("NodeMod"),
  WhenBuilder: T.rt("WhenBuilder"),
  Style: T.rt("Style"),
  StyleClass: T.rt("StyleClass"),
  NativeEvent: T.rt("NativeEvent"),
  NativeElement: T.rt("NativeElement"),
  HTMLInputElement: T.rt("InputTarget"),
  Timer: T.rt("Timer"),
  Router: T.rt("Router"),
  Outlet: T.rt("Outlet"),
  Response: T.rt("Response"),
};

/** Style keys whose string values are enums natively. */
const STYLE_ENUMS: Record<string, string> = {
  flexDirection: "FlexDirection",
  alignItems: "Align",
  justifyContent: "Justify",
  position: "Position",
  display: "Display",
  fontWeight: "FontWeight",
  textAlign: "TextAlign",
};

/** Top-level names an app can't declare: they are the runtimes', Swift's or Foundation's own. */
const RESERVED_TYPES = new Set([
  "Clock", "Duration", "Result", "Range", "Character", "Sequence", "Collection", "Optional", "Locale", "Calendar", "Notification",
  "Node", "NodeMod", "Style", "StyleClass", "Variants", "Compound", "WhenBuilder", "NativeEvent", "NativeElement", "InputTarget",
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
  "Content", "Cleanup", "InputTarget", "NativeEvent", "NativeElement", "Exception", "Error", "String", "Int", "Double",
  "Bool", "Boolean", "Unit", "Any", "Void", "mutableListOf", "mutableMapOf", "listOf", "checkbox", "self", "it",
  // The runtimes' own types (Swift shares one module with the app).
  "Runtime", "Flex", "FlexView", "FlexLayout", "ScreenView", "LayerView", "RootController", "ScreenController", "MountProbe",
  "TextViewDelegate", "PaddedLabel", "NButton", "PaddedTextField", "IntoEntry", "RegionState", "Attr",
]);

type NumKind = "int" | "double";
type Slot = ts.Symbol | ts.Node;

interface Ctx {
  async: boolean;
  /** The enclosing function's return type. */
  ret: Ty;
  /** `void | (() => void)`: a bare `return` and the end of the body return nil. */
  voidUnion: boolean;
  inTry: boolean;
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
        };
      }),
    );
  }
  return new Frontend(program, files).run(path.basename(entry));
}

class Frontend {
  private readonly checker: ts.TypeChecker;
  private readonly diagnostics: Diagnostic[] = [];
  private readonly kinds = new Map<Slot, NumKind>();
  private readonly writes: { slot: Slot; from?: ts.Expression; fromSlot?: ts.Symbol; forceDouble?: boolean }[] = [];
  /** Top-level and local functions: a reference to one as a value is a function reference. */
  private readonly functionSymbols = new Set<ts.Symbol>();
  private readonly classes = new Map<ts.Symbol, ClassDecl>();
  private readonly asyncFunctions = new Set<ts.Node>();
  /** Arrays are values in Swift: what mutates an array, and what makes two bindings share one (see checkArrays). */
  private readonly mutations: ts.Expression[] = [];
  private readonly aliases: { target: ts.Node; source: ts.Expression }[] = [];

  private readonly program: ts.Program;
  private readonly files: readonly ts.SourceFile[];

  constructor(program: ts.Program, files: readonly ts.SourceFile[]) {
    this.program = program;
    this.files = files;
    this.checker = program.getTypeChecker();
  }

  run(source: string): Program {
    for (const sf of this.files) this.collect(sf);
    for (const sf of this.files) this.collectFunctionReferences(sf);
    this.inferNumbers();
    this.checkArrays();

    const out: Program = { source, classes: [], globals: [], functions: [], main: [] };
    for (const sf of this.files) {
      for (const statement of sf.statements) this.topLevel(statement, out);
    }
    out.classes = [...this.classes.values()];
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
      this.diagnostics.push({ file, line: line + 1, column: character + 1, message });
    }
    return { e: "nil" };
  }

  // -------------------------------------------------------------------------
  // Pass 1: classes, functions, numeric slots and every write into them
  // -------------------------------------------------------------------------

  private collect(sf: ts.SourceFile) {
    const visit = (node: ts.Node): void => {
      this.reject(node);

      if (ts.isInterfaceDeclaration(node) || (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type))) {
        const symbol = this.checker.getSymbolAtLocation(node.name);
        if (symbol) this.classes.set(symbol, { name: node.name.text, fields: [], decodable: true });
        if (RESERVED_TYPES.has(node.name.text) || IMPLICIT_NAMES.has(node.name.text)) this.error(node.name, `"${node.name.text}" is reserved by the native runtimes; rename the type.`);
        if (node.typeParameters?.length) this.error(node.name, "Generic interfaces are not supported natively; declare a concrete interface per type.");
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
        if (!node.body) this.error(node, "Function overloads are not supported natively; use one signature.");
      }
      if ((ts.isFunctionDeclaration(node) || this.isFunctionNode(node)) && node.typeParameters?.length) {
        this.error(node, "Generic functions are not supported natively; write one function per type.");
      }
      if (ts.isVariableDeclaration(node) && node.initializer) this.aliases.push({ target: node.name, source: node.initializer });
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        this.aliases.push({ target: node.left, source: node.right });
        if (ts.isElementAccessExpression(node.left)) this.mutations.push(node.left.expression);
      }
      if (ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.parent)) this.aliases.push({ target: node.name, source: node.initializer });
      if (ts.isShorthandPropertyAssignment(node)) this.aliases.push({ target: node.name, source: node.name });
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["push", "pop", "shift", "unshift", "splice"].includes(node.expression.name.text)) {
        if (this.checker.isArrayType(this.checker.getNonNullableType(this.typeOf(node.expression.expression)))) this.mutations.push(node.expression.expression);
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
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
      if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
        this.declareSlot(node.name, node.type);
        if (node.initializer) this.write(node.name, node.initializer);
        // An untyped callback parameter takes the kind of the parameter it is passed for.
        const fn = node.parent;
        if (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) {
          const ctx = this.checker.getContextualType(fn as ts.Expression)?.getCallSignatures()[0];
          const source = ctx?.getParameters()[fn.parameters.indexOf(node)];
          const symbol = this.checker.getSymbolAtLocation(node.name);
          if (source && symbol) this.writes.push({ slot: symbol, fromSlot: source });
        }
      }
      if (this.isFunctionNode(node) || ts.isFunctionDeclaration(node)) {
        const fn = node as ts.SignatureDeclaration;
        if (ts.getCombinedModifierFlags(fn as ts.Declaration) & ts.ModifierFlags.Async) this.asyncFunctions.add(fn);
        const signature = this.checker.getSignatureFromDeclaration(fn);
        if (signature) {
          let ret = signature.getReturnType();
          if (this.asyncFunctions.has(fn)) ret = this.checker.getAwaitedType(ret) ?? ret;
          if (this.isNumber(ret)) this.kinds.set(fn, this.forcedKind(fn.type) ?? "int");
        }
        if (ts.isArrowFunction(node) && !ts.isBlock(node.body)) this.writes.push({ slot: node, from: node.body });
      }
      if (ts.isReturnStatement(node) && node.expression) {
        const fn = ts.findAncestor(node.parent, (n) => this.isFunctionNode(n) || ts.isFunctionDeclaration(n));
        if (fn) this.writes.push({ slot: fn, from: node.expression });
      }
      if (ts.isBinaryExpression(node) && this.isAssignment(node.operatorToken.kind)) {
        const target = ts.isPropertyAccessExpression(node.left) ? node.left.name : node.left;
        const symbol = this.checker.getSymbolAtLocation(target);
        if (symbol) this.writes.push({ slot: symbol, from: node.right, forceDouble: node.operatorToken.kind === ts.SyntaxKind.SlashEqualsToken });
      }
      if (ts.isCallExpression(node)) {
        const declaration = this.checker.getResolvedSignature(node)?.getDeclaration();
        if (declaration && !this.isApi(declaration) && !declaration.getSourceFile().isDeclarationFile) {
          node.arguments.forEach((arg, i) => {
            const param = declaration.parameters[i];
            const symbol = param && ts.isIdentifier(param.name) ? this.checker.getSymbolAtLocation(param.name) : undefined;
            if (symbol) this.writes.push({ slot: symbol, from: arg });
          });
        }
      }
      if (ts.isObjectLiteralExpression(node)) {
        const ctx = this.checker.getContextualType(node);
        if (ctx) {
          for (const prop of node.properties) {
            if (!(ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) || !ts.isIdentifier(prop.name)) continue;
            const target = ctx.getProperty(prop.name.text);
            if (target && this.kinds.has(target)) {
              this.writes.push({ slot: target, from: ts.isPropertyAssignment(prop) ? prop.initializer : prop.name });
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

  private isDeclarationName(node: ts.Identifier): boolean {
    return "name" in node.parent && (node.parent as ts.NamedDeclaration).name === node;
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
    for (const { target, source } of this.aliases) {
      if (!this.checker.isArrayType(this.checker.getNonNullableType(this.typeOf(source))) || this.isFresh(source, false)) continue;
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
    else if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) this.error(node, "Classes are not supported; use interfaces and functions.");
    else if (ts.isEnumDeclaration(node)) this.error(node, "Enums are not supported; use a union of string literals.");
    else if (ts.isModuleDeclaration(node)) this.error(node, "Namespaces are not supported.");
    else if (node.kind === ts.SyntaxKind.ThisKeyword) this.error(node, "`this` is not supported.");
    else if (ts.isDeleteExpression(node)) this.error(node, "`delete` is not supported; use a nullable property.");
    else if (ts.isIdentifier(node) && node.text === "eval") this.error(node, "`eval` cannot be compiled ahead of time.");
    else if (ts.isPropertyAccessExpression(node) && (node.name.text === "prototype" || node.name.text === "__proto__")) {
      this.error(node, "Prototype access is not supported.");
    } else if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.asteriskToken) this.error(node, "Generators are not supported.");
    else if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) this.error(node, "Destructuring is not supported; read the properties.");
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
    if (ts.isNumericLiteral(node)) return /^(0x[0-9a-f]+|\d+)$/i.test(node.text) ? "int" : "double";
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) {
      return this.numKind(node.expression);
    }
    if (ts.isAwaitExpression(node)) return this.numKind(node.expression);
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
    return this.checker.getTypeAtLocation(node);
  }

  private isApi(node: ts.Node): boolean {
    return path.resolve(node.getSourceFile().fileName) === API_FILE;
  }

  private resolveAlias(symbol: ts.Symbol | undefined): ts.Symbol | undefined {
    return symbol && symbol.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(symbol) : symbol;
  }

  /** The API name an identifier refers to (`div`, `update`…), if it is the API's. */
  private apiName(node: ts.Node): string | undefined {
    const symbol = this.resolveAlias(this.checker.getSymbolAtLocation(node));
    const decl = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    return decl && this.isApi(decl) ? symbol!.name : undefined;
  }

  private isNumber(type: ts.Type): boolean {
    const t = this.checker.getNonNullableType(type);
    return !!(t.flags & ts.TypeFlags.NumberLike) || (t.isUnion() && t.types.every((u) => !!(u.flags & ts.TypeFlags.NumberLike)));
  }

  private isString(type: ts.Type): boolean {
    return !!(type.flags & ts.TypeFlags.StringLike) || (type.isUnion() && type.types.every((u) => !!(u.flags & ts.TypeFlags.StringLike)));
  }

  private isBoolean(type: ts.Type): boolean {
    return !!(type.flags & ts.TypeFlags.BooleanLike) || (type.isUnion() && type.types.every((u) => !!(u.flags & ts.TypeFlags.BooleanLike)));
  }

  private isNullable(type: ts.Type): boolean {
    return type.isUnion() && type.types.some((u) => !!(u.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
  }

  private isSequence(type: ts.Type): boolean {
    return this.isString(type) || this.checker.isArrayType(type);
  }

  private isClassType(type: ts.Type): boolean {
    const symbol = type.aliasSymbol ?? type.getSymbol();
    return !!symbol && [...this.classes.keys()].some((s) => s === symbol || s.name === symbol.name);
  }

  /** The IR type of a TypeScript type; `num` is the kind a number takes here. */
  private ty(type: ts.Type, node: ts.Node, num: NumKind = "double"): Ty {
    if (type.flags & ts.TypeFlags.Any) return this.error(node, "`any` cannot be compiled to a native type."), T.string;
    if (type.flags & ts.TypeFlags.Unknown) return T.rt("Error");
    if (this.isString(type)) return T.string;
    if (this.isBoolean(type)) return T.bool;
    if (this.isNumber(type) && !this.isNullable(type)) return num === "int" ? T.int : T.double;
    if (type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never)) return T.void;
    if (type.isUnion()) {
      const rest = type.types.filter((u) => !(u.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void)));
      if (rest.length === type.types.length) {
        if (rest.every((u) => u.flags & ts.TypeFlags.StringLike)) return T.string;
        return this.error(node, `The union ${this.checker.typeToString(type)} has no native equivalent.`), T.string;
      }
      const inner = rest.length === 1 ? rest[0]! : this.checker.getNonNullableType(type);
      return T.optional(this.ty(inner, node, num));
    }
    if (this.checker.isArrayType(type)) {
      const [elem] = this.checker.getTypeArguments(type as ts.TypeReference);
      return T.array(this.ty(elem!, node));
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
    if (this.isClassType(type)) return { k: "class", name: symbol!.name };
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
    return this.ty(this.checker.getTypeOfSymbolAtLocation(symbol, node), node, this.slotKind(symbol));
  }

  // -------------------------------------------------------------------------
  // Top level
  // -------------------------------------------------------------------------

  private topLevel(node: ts.Statement, out: Program) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) this.classDecl(node);
      return;
    }
    if (ts.isInterfaceDeclaration(node)) return this.classDecl(node);
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      out.functions.push(this.fnDecl(node.name.text, node));
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        if (decl.initializer && this.isFunctionNode(decl.initializer) && node.declarationList.flags & ts.NodeFlags.Const) {
          out.functions.push(this.fnDecl(decl.name.text, decl.initializer as ts.ArrowFunction));
        } else {
          const stmt = this.varDecl(decl, node.declarationList, { async: false, ret: T.void, voidUnion: false, inTry: false });
          if (stmt.s === "let") {
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
      case "class":
        return true;
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

  private fnDecl(name: string, node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): FnDecl {
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
      if (!ts.isIdentifier(param.name)) return this.error(param, "Destructured parameters are not supported."), { name: "_", ty: T.void };
      if (param.dotDotDotToken) return this.error(param, "Rest parameters are not supported natively; take an array."), { name: "_", ty: T.void };
      const symbol = this.checker.getSymbolAtLocation(param.name)!;
      const ty = this.tyOfSymbol(symbol, param);
      if (!param.initializer && !param.questionToken) return { name: param.name.text, ty };
      if (!ctx) return this.error(param, "Callbacks can't have default or optional parameters natively."), { name: param.name.text, ty };
      const value: Expr = param.initializer ? this.expr(param.initializer, ctx, ty) : { e: "nil" };
      return { name: param.name.text, ty, default: value };
    });
  }

  private body(node: ts.SignatureDeclaration & { body?: ts.ConciseBody }, ctx: Ctx): Stmt[] {
    const body = node.body;
    if (!body) return [];
    const stmts: Stmt[] = [];
    // Swift parameters are constants: a reassigned one is shadowed by a variable.
    for (const param of node.parameters) {
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
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.map((d) => this.varDecl(d, node.declarationList, ctx));
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
      if (!ts.isVariableDeclarationList(decl) || !ts.isIdentifier(decl.declarations[0]!.name)) return [this.unsupported(node, "this for-of form")];
      if (!this.checker.isArrayType(this.typeOf(node.expression))) return [this.unsupported(node.expression, "for-of over anything but an array (strings iterate characters natively)")];
      return [{ s: "forOf", name: decl.declarations[0]!.name.text, of: this.expr(node.expression, ctx), body: this.block(node.statement, ctx) }];
    }
    if (ts.isForStatement(node)) return this.forRange(node, ctx);
    if (ts.isWhileStatement(node)) return [{ s: "while", c: this.cond(node.expression, ctx), body: this.block(node.statement, ctx) }];
    if (ts.isBreakStatement(node)) return [{ s: "break" }];
    if (ts.isContinueStatement(node)) return [{ s: "continue" }];
    if (ts.isTryStatement(node)) {
      if (node.finallyBlock) return [this.unsupported(node.finallyBlock, "`finally`")];
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
    if (ts.isEmptyStatement(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) return [];
    return [this.unsupported(node, `the statement ${ts.SyntaxKind[node.kind]}`)];
  }

  private unsupported(node: ts.Node, what: string): Stmt {
    this.error(node, `Unsupported: ${what}.`);
    return { s: "expr", x: { e: "nil" } };
  }

  private varDecl(decl: ts.VariableDeclaration, list: ts.VariableDeclarationList, ctx: Ctx): Stmt {
    if (!ts.isIdentifier(decl.name)) return this.unsupported(decl, "destructuring");
    // `const f = () => …` is a local function: it can call itself, and its numbers keep their kinds.
    if (decl.initializer && list.flags & ts.NodeFlags.Const && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
      return { s: "fn", decl: this.fnDecl(decl.name.text, decl.initializer) };
    }
    const symbol = this.checker.getSymbolAtLocation(decl.name)!;
    const ty = this.tyOfSymbol(symbol, decl);
    const mutable = !(list.flags & ts.NodeFlags.Const);
    return { s: "let", name: decl.name.text, ty, init: decl.initializer && this.expr(decl.initializer, ctx, ty), mutable };
  }

  /** `for (let i = a; i < b; i++)` → a range loop; other `for` forms are rejected. */
  private forRange(node: ts.ForStatement, ctx: Ctx): Stmt[] {
    const init = node.initializer;
    const decl = init && ts.isVariableDeclarationList(init) ? init.declarations[0] : undefined;
    const cond = node.condition;
    const inc = node.incrementor;
    if (
      decl && ts.isIdentifier(decl.name) && decl.initializer && cond && ts.isBinaryExpression(cond) &&
      ts.isIdentifier(cond.left) && cond.left.text === decl.name.text &&
      (cond.operatorToken.kind === ts.SyntaxKind.LessThanToken || cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken) &&
      inc && (ts.isPostfixUnaryExpression(inc) || ts.isPrefixUnaryExpression(inc)) && inc.operator === ts.SyntaxKind.PlusPlusToken &&
      ts.isIdentifier(inc.operand) && inc.operand.text === decl.name.text && !this.isReassigned(decl.name, node.statement)
    ) {
      return [{
        s: "forRange",
        name: decl.name.text,
        from: this.expr(decl.initializer, ctx, T.int),
        to: this.expr(cond.right, ctx, T.int),
        inclusive: cond.operatorToken.kind === ts.SyntaxKind.LessThanEqualsToken,
        body: this.block(node.statement, ctx),
      }];
    }
    return [this.unsupported(node, "this `for` form (use `for (let i = a; i < b; i++)` or for-of)")];
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
    return { s: "switch", x: this.expr(node.expression, ctx), cases, default: defaultBody };
  }

  /** An expression in statement position: assignments, increments, calls, launches. */
  private exprStmt(node: ts.Expression, ctx: Ctx): Stmt[] {
    if (ts.isParenthesizedExpression(node)) return this.exprStmt(node.expression, ctx);
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
    return [{ s: "expr", x: this.expr(node, ctx) }];
  }

  private isAsyncCall(node: ts.CallExpression): boolean {
    const decl = this.checker.getResolvedSignature(node)?.getDeclaration();
    return !!decl && this.asyncFunctions.has(decl);
  }

  private lvalue(node: ts.Expression, ctx: Ctx): Expr {
    if (ts.isIdentifier(node)) return { e: "id", name: node.text };
    if (ts.isPropertyAccessExpression(node)) return { e: "prop", obj: this.expr(node.expression, ctx), name: node.name.text };
    if (ts.isElementAccessExpression(node)) return { e: "index", obj: this.expr(node.expression, ctx), index: this.expr(node.argumentExpression, ctx, this.indexTy(node)) };
    return this.error(node, "Unsupported assignment target.");
  }

  private lvalueTy(node: ts.Expression): Ty {
    const target = ts.isPropertyAccessExpression(node) ? node.name : node;
    const symbol = this.checker.getSymbolAtLocation(target);
    return symbol ? this.tyOfSymbol(symbol, node) : this.tyOfExpr(node);
  }

  private indexTy(node: ts.ElementAccessExpression): Ty {
    return this.checker.isArrayType(this.typeOf(node.expression)) ? T.int : T.string;
  }

  // -------------------------------------------------------------------------
  // Expressions
  // -------------------------------------------------------------------------

  /** Lowers an expression; `want` is the type its position needs (numbers convert, functions adapt). */
  private expr(node: ts.Expression, ctx: Ctx, want?: Ty): Expr {
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
    if (!(ts.isIdentifier(n) || ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n) || ts.isAwaitExpression(n))) return;
    const type = this.typeOf(n);
    if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown) || type.getCallSignatures().length) return;
    const classOf = (t: Ty): string | undefined =>
      t.k === "class" ? t.name : t.k === "array" || t.k === "optional" || t.k === "map" ? classOf(t.of) : undefined;
    const expected = classOf(want);
    if (!expected) return;
    const actual = this.classNameOf(this.checker.getNonNullableType(type));
    if (actual && actual !== expected) {
      this.error(node, `${actual} is used where ${expected} is expected: same shape in TypeScript, but different native classes. Build the ${expected} explicitly.`);
    }
  }

  /** The interface a type is, looking through arrays and maps. */
  private classNameOf(type: ts.Type): string | undefined {
    if (this.checker.isArrayType(type)) return this.classNameOf(this.checker.getNonNullableType(this.checker.getTypeArguments(type as ts.TypeReference)[0]!));
    const index = type.getStringIndexType();
    if (index && type.getProperties().length === 0) return this.classNameOf(this.checker.getNonNullableType(index));
    const symbol = type.aliasSymbol ?? type.getSymbol();
    return symbol && this.isClassType(type) ? symbol.name : undefined;
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
        if (want?.k === "double" || (want?.k === "optional" && want.of.k === "double")) return { e: "double", v: text.includes(".") ? text : `${text}.0` };
        return this.numKind(node) === "int" ? { e: "int", v: text } : { e: "double", v: text };
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
      return this.error(node, "Unsupported: ++/-- inside an expression; use it as a statement.");
    }
    if (ts.isPostfixUnaryExpression(node)) return this.error(node, "Unsupported: ++/-- inside an expression; use it as a statement.");
    if (ts.isBinaryExpression(node)) return this.binary(node, ctx);
    if (ts.isArrayLiteralExpression(node)) {
      const ty = want?.k === "array" ? want : this.tyOfExpr(node);
      if (ty.k !== "array") return this.error(node, "Unsupported array literal.");
      return { e: "arr", of: ty.of, items: node.elements.map((el) => (ts.isSpreadElement(el) ? this.error(el, "Unsupported: spread in arrays.") : this.expr(el, ctx, ty.of))) };
    }
    if (ts.isObjectLiteralExpression(node)) return this.object(node, ctx, want);
    if (ts.isNewExpression(node)) return this.error(node, "Unsupported: `new` (only `throw new Error(...)`).");
    if (ts.isTypeOfExpression(node)) return this.error(node, "Unsupported: `typeof` at run time.");
    return this.error(node, `Unsupported expression ${ts.SyntaxKind[node.kind]}.`);
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
    if (this.checker.isArrayType(objType)) {
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
    const symbol = this.checker.getSymbolAtLocation(node);
    if (!symbol) return this.error(node, `Unknown identifier ${node.text}.`);
    const resolved = this.resolveAlias(symbol)!;
    const decl = resolved.valueDeclaration ?? resolved.declarations?.[0];
    if (decl && this.isApi(decl)) return this.error(node, `${node.text} must be called, not used as a value.`);
    if (decl?.getSourceFile().isDeclarationFile) return this.error(node, `${node.text} is not available natively.`);
    const x: Expr = { e: "id", name: node.text, fnRef: this.functionSymbols.has(resolved) || undefined };
    return this.unwrapIfNarrowed(x, node, resolved);
  }

  /** A nullable value TypeScript has narrowed to non-null here is force-unwrapped. */
  private unwrapIfNarrowed(x: Expr, node: ts.Node, symbol: ts.Symbol): Expr {
    if (this.isLvalue(node)) return x;
    const declared = this.checker.getTypeOfSymbol(symbol);
    const here = this.typeOf(node);
    return this.isNullable(declared) && !this.isNullable(here) && !(here.flags & ts.TypeFlags.Never) ? { e: "unwrap", x } : x;
  }

  private isLvalue(node: ts.Node): boolean {
    const target = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node ? node.parent : node;
    const parent = target.parent;
    return (ts.isBinaryExpression(parent) && parent.left === target && this.isAssignment(parent.operatorToken.kind)) ||
      ((ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) && this.isIncrement(parent));
  }

  private property(node: ts.PropertyAccessExpression, ctx: Ctx): Expr {
    const name = node.name.text;
    const objType = this.typeOf(node.expression);
    if (ts.isIdentifier(node.expression) && node.expression.text === "Math" && name === "PI") return { e: "op", op: "math.pi", args: [] };
    const chain = (ts.isOptionalChain(node) && !node.questionDotToken) || undefined;
    if (node.questionDotToken && name === "length") return this.error(node, "Unsupported: ?.length; narrow the value first.");
    if (name === "length" && this.checker.isArrayType(this.checker.getNonNullableType(objType))) return { e: "op", op: "arr.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "length" && this.isString(this.checker.getNonNullableType(objType))) return { e: "op", op: "str.length", args: [this.expr(node.expression, ctx)], chain };
    if (name === "message" && this.ty(objType, node).k === "rt") return { e: "op", op: "error.message", args: [this.expr(node.expression, ctx)] };
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
    if (ty.k === "class") {
      const cls = [...this.classes.values()].find((c) => c.name === ty.name)!;
      const given = new Map<string, ts.Expression>();
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) given.set(prop.name.text, prop.initializer);
        else if (ts.isShorthandPropertyAssignment(prop)) given.set(prop.name.text, prop.name);
        else this.error(prop, "Unsupported object literal member (spreads and methods can't build a native class).");
      }
      const args: [string, Expr][] = [];
      for (const field of cls.fields) {
        const value = given.get(field.name);
        if (value) args.push([field.name, this.expr(value, ctx, field.ty)]);
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
    return this.error(node, "An object literal needs an interface type to become a native class.");
  }

  /** A Style literal: enums for keyword values, Double for numbers, `...base` merged under it. */
  private style(node: ts.ObjectLiteralExpression, ctx: Ctx): Expr {
    let base: Expr | undefined;
    const given = new Map<string, Expr>();
    for (const prop of node.properties) {
      if (ts.isSpreadAssignment(prop)) {
        if (base || given.size) this.error(prop, "A style spread must come first.");
        base = this.expr(prop.expression, ctx);
        continue;
      }
      if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) {
        this.error(prop, "Unsupported style entry.");
        continue;
      }
      const key = prop.name.text;
      const enumType = STYLE_ENUMS[key];
      given.set(key, enumType ? this.styleEnum(prop.initializer, enumType, ctx) : this.expr(prop.initializer, ctx, this.isNumber(this.typeOf(prop.initializer)) ? T.double : T.string));
    }
    return { e: "style", props: this.styleKeys().filter((k) => given.has(k)).map((k) => [k, given.get(k)!]), base };
  }

  private styleEnum(node: ts.Expression, type: string, ctx: Ctx): Expr {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return { e: "enum", type, member: camel(node.text) };
    if (ts.isParenthesizedExpression(node)) return this.styleEnum(node.expression, type, ctx);
    if (ts.isConditionalExpression(node)) {
      return { e: "cond", c: this.cond(node.condition, ctx), a: this.styleEnum(node.whenTrue, type, ctx), b: this.styleEnum(node.whenFalse, type, ctx) };
    }
    return this.error(node, `Write ${type} values as literals (or a ternary of literals).`);
  }

  /** The Style interface's keys in declaration order (Swift labels must follow it). */
  private styleKeys(): string[] {
    const api = this.program.getSourceFile(API_FILE);
    const decl = api?.statements.find((s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === "Style");
    return decl ? decl.members.flatMap((m) => (m.name && ts.isIdentifier(m.name) ? [m.name.text] : [])) : [];
  }

  // -------------------------------------------------------------------------
  // Functions and calls
  // -------------------------------------------------------------------------

  private lambda(node: ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration, ctx: Ctx, want?: Extract<Ty, { k: "fn" }>): Expr {
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
    const params = this.params(node);
    const body = node.body && !ts.isBlock(node.body) && ret.k !== "void" && !voidUnion ? this.expr(node.body, inner, ret) : this.body(node, inner);
    return { e: "lambda", params, ret, body };
  }

  private call(node: ts.CallExpression, ctx: Ctx): Expr {
    const callee = node.expression;
    if (node.questionDotToken || (ts.isPropertyAccessExpression(callee) && callee.questionDotToken)) {
      return this.error(node, "Unsupported: optional calls (?.()); narrow the value first (if (f) f()).");
    }
    const api = ts.isIdentifier(callee) ? this.apiName(callee) : undefined;
    if (api) return this.nuclo(api, node, ctx);

    if (ts.isIdentifier(callee)) {
      if (callee.text === "String" && node.arguments.length === 1) return this.str(node.arguments[0]!, ctx);
      if (callee.text === "Number") return { e: "op", op: "num.parse", args: [this.expr(node.arguments[0]!, ctx, T.string)] };
      if (callee.text === "parseInt") return { e: "op", op: "int.parse", args: [this.expr(node.arguments[0]!, ctx, T.string)] };
    }
    if (ts.isPropertyAccessExpression(callee)) {
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
    const params = signature.getParameters();
    const args = node.arguments.map((arg, i) => {
      const param = params[i];
      return this.expr(arg, ctx, param ? this.tyOfSymbol(param, arg) : undefined);
    });
    // A declared function is called by name; a function value (maybe narrowed from null) is read as one.
    const symbol = ts.isIdentifier(callee) ? this.resolveAlias(this.checker.getSymbolAtLocation(callee)) : undefined;
    const fn = symbol && this.functionSymbols.has(symbol) ? ({ e: "id", name: callee.getText() } as Expr) : this.expr(callee, ctx);
    return { e: "call", callee: fn, args };
  }

  /** Methods of built-in values: arrays, strings, numbers, Math, Date, console, router, response, when(). */
  private method(callee: ts.PropertyAccessExpression, node: ts.CallExpression, ctx: Ctx): Expr | undefined {
    const name = callee.name.text;
    const recv = callee.expression;
    const args = node.arguments;
    if (ts.isIdentifier(recv) && recv.text === "Math") {
      const ops: Record<string, Op> = { floor: "math.floor", ceil: "math.ceil", round: "math.round", trunc: "math.trunc", abs: "math.abs", min: "math.min", max: "math.max", sqrt: "math.sqrt", pow: "math.pow", random: "math.random" };
      const op = ops[name];
      if (!op) return this.error(node, `Math.${name} is not available natively.`);
      const num = this.numKind(node) === "int" && (op === "math.abs" || op === "math.min" || op === "math.max") ? T.int : T.double;
      // Math.floor(n) of a whole number is the number itself.
      if (["math.floor", "math.ceil", "math.round", "math.trunc"].includes(op) && this.numKind(args[0]!) === "int") return this.expr(args[0]!, ctx, T.int);
      return { e: "op", op, args: args.map((a) => this.expr(a, ctx, num)) };
    }
    if (ts.isIdentifier(recv) && recv.text === "Date" && name === "now") return { e: "op", op: "date.now", args: [] };
    if (ts.isIdentifier(recv) && this.apiName(recv) === "console" && name === "log") return { e: "rt", name: "log", args: args.map((a) => this.str(a, ctx)) };

    const recvType = this.checker.getNonNullableType(this.typeOf(recv));
    const recvTy = this.ty(recvType, recv);
    const obj = this.expr(recv, ctx);

    if (this.checker.isArrayType(recvType)) {
      const elem = (recvTy as Extract<Ty, { k: "array" }>).of;
      const cb = (i: number, ret: Ty) => this.expr(args[i]!, ctx, { k: "fn", params: [elem], ret });
      const checkCallback = () => {
        const fn = args[0];
        if (fn && (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) && fn.parameters.length > 1) this.error(fn, `${name}() callbacks take one parameter natively (no index).`);
      };
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
        case "join":
          if (elem.k !== "string") return this.error(node, "join() is supported on string arrays.");
          return { e: "op", op: "arr.join", args: [obj, args[0] ? this.expr(args[0], ctx, T.string) : { e: "str", v: "," }] };
        case "slice":
          return { e: "op", op: "arr.slice", args: [obj, args[0] ? this.expr(args[0], ctx, T.int) : { e: "int", v: "0" }, args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
        case "find":
        case "findIndex":
        case "filter":
        case "some":
        case "every":
          checkCallback();
          return { e: "op", op: `arr.${name}` as Op, args: [obj, cb(0, T.bool)] };
        case "forEach":
          checkCallback();
          return { e: "op", op: "arr.forEach", args: [obj, cb(0, T.void)] };
        case "map": {
          checkCallback();
          const out = this.tyOfExpr(node);
          return { e: "op", op: "arr.map", args: [obj, cb(0, out.k === "array" ? out.of : T.void)] };
        }
      }
      return this.error(node, `Array.${name}() is not available natively.`);
    }
    if (this.isString(recvType)) {
      const strOps: Record<string, Op> = { trim: "str.trim", toUpperCase: "str.upper", toLowerCase: "str.lower", includes: "str.includes", startsWith: "str.startsWith", endsWith: "str.endsWith", slice: "str.slice" };
      const op = strOps[name];
      if (!op) return this.error(node, `String.${name}() is not available natively.`);
      if (op === "str.slice") return { e: "op", op, args: [obj, this.expr(args[0]!, ctx, T.int), args[1] ? this.expr(args[1], ctx, T.int) : { e: "nil" }] };
      return { e: "op", op, args: [obj, ...args.map((a) => this.expr(a, ctx, T.string))] };
    }
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
    switch (name) {
      case "update":
      case "scope":
        return { e: "rt", name, args: args.map((a) => this.expr(a, ctx, T.string)) };
      case "render":
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, { k: "fn", params: [], ret: T.rt("Node") })] };
      case "list": {
        const renderTy = this.tyOfExpr(args[1]!);
        const elem = renderTy.k === "fn" ? renderTy.params[0]! : T.void;
        return {
          e: "rt",
          name,
          args: [
            this.expr(args[0]!, ctx, { k: "fn", params: [], ret: T.array(elem) }),
            this.expr(args[1]!, ctx, { k: "fn", params: [elem, T.int], ret: T.optional(T.rt("Node")) }),
          ],
        };
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
        return { e: "rt", name, args: [this.expr(args[0]!, ctx, T.rt("Style"))] };
      case "cx":
        return { e: "rt", name, args: args.map((a) => this.optionalChild(a, ctx, T.rt("StyleClass"))) };
      case "variants":
        return this.variants(node, ctx);
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
      }
    }
    return undefined;
  }

  /** A builder's arguments: text, dynamic text, nodes, modifiers and expanded attribute objects. */
  private children(args: readonly ts.Expression[], ctx: Ctx): Expr[] {
    const out: Expr[] = [];
    for (const arg of args) {
      if (ts.isObjectLiteralExpression(arg)) {
        out.push(...this.attributes(arg, ctx));
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

  private attributes(node: ts.ObjectLiteralExpression, ctx: Ctx): Expr[] {
    return node.properties.flatMap((prop): Expr[] => {
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
        return { e: "rt", name: `A.${name}`, args: [this.dynamic(value as ts.Expression, ctx, T.string)] };
      case "checked":
      case "disabled":
        return { e: "rt", name: `A.${name}`, args: [this.dynamic(value as ts.Expression, ctx, T.bool)] };
      case "onClick":
      case "onInput":
      case "onChange":
        return { e: "rt", name: `A.${name}`, args: [lower(event(T.rt("NativeEvent"), T.void))] };
      case "onMount":
        return { e: "rt", name: "A.onMount", args: [lower(event(T.rt("NativeElement"), T.optional({ k: "fn", params: [], ret: T.void })))] };
      case "onDestroy":
        return { e: "rt", name: "A.onDestroy", args: [lower(event(T.rt("NativeElement"), T.void))] };
    }
    return this.error(value, `The attribute ${name} is not supported natively.`);
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
