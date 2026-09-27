import { createHash } from "node:crypto";
import { parseSync } from "vite";

// oxc's ESTree nodes, loosely typed.
type Node = any;

/** Code that only runs on the server: a `$server()` function, or the `load`/`actions` of a Page() or Layout(). */
interface ServerPart {
  /** Id label: the binding (`getPost`), `load`, or `actions.save`. */
  name: string;
  /** The function whose body stays on the server. */
  fn: Node;
  /** `macro`: `$server(fn)`; `value`: a property (`load: () => …`); `method`: a method (`load() {…}`). */
  kind: "macro" | "value" | "method";
  /** The `$server()` call, or the object property. */
  node: Node;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

const MACRO = "export const getPost = $server(async (slug: string) => …)";
const DEFINITION = "export default Page({ load: () => …, actions: { save: () => … }, render })";
const ACTIONS = "actions: { save: async () => … }";

/** Stable id of a server function: a hash of its file (relative to the root) and name. */
export function serverFnId(file: string, name: string): string {
  return createHash("sha256").update(`${file}#${name}`).digest("hex").slice(0, 12);
}

/** Ids of a source file's server functions: `$server()` functions, and the loads and actions of its definition. */
export function serverFnIds(code: string, file: string, rel: string): string[] {
  if (!code.includes("$server") && !code.includes("nuclo-pages")) return [];
  const { program, errors } = parseSync(file, code);
  if (errors.length) return [];
  const found = findServerParts(program);
  return "error" in found ? [] : found.parts.map((part) => serverFnId(rel, part.name));
}

/**
 * Compiles the server-only parts of a module for one environment.
 * - server: each becomes `__serverFn("id", fn)`; the module stays intact, so SSR calls run in-process.
 * - client: each becomes an `__rpc("id")` stub, and the imports and private top-level
 *   declarations only those bodies used are removed.
 * Lines are preserved (no source map needed). Returns null when there is nothing to do.
 */
export function transformServerFns(
  code: string,
  file: string,
  rel: string,
  target: "client" | "server",
  dev = false,
): { code: string } | { error: string } | null {
  const { program, errors } = parseSync(file, code);
  if (errors.length) return null;
  const found = findServerParts(program);
  if ("error" in found) return { error: `${found.error} (${rel}:${lineOf(code, found.pos)})` };
  if (!found.parts.length) return null;

  const edits: Edit[] = [];
  for (const { name, fn, kind, node } of found.parts) {
    const id = JSON.stringify(serverFnId(rel, name));
    const key = kind === "method" ? code.slice(node.key.start, node.key.end) : "";
    if (target === "client") {
      const stub = `__rpc(${id}${dev ? `, ${JSON.stringify(`${rel}#${name}`)}` : ""})`;
      if (kind === "macro") edits.push({ start: node.start, end: node.end, text: stub });
      else if (kind === "value") edits.push({ start: fn.start, end: fn.end, text: stub });
      else edits.push({ start: node.start, end: node.end, text: `${key}: ${stub}` });
    } else if (kind === "macro") {
      edits.push({ start: node.callee.start, end: node.callee.end, text: "__serverFn" }, { start: fn.start, end: fn.start, text: `${id}, ` });
    } else if (kind === "value") {
      edits.push({ start: fn.start, end: fn.start, text: `__serverFn(${id}, ` }, { start: fn.end, end: fn.end, text: ")" });
    } else {
      // A method becomes a function expression: `async load(e) {…}` → `load: __serverFn(id, async function (e) {…})`.
      const expression = `${fn.async ? "async " : ""}function${fn.generator ? "*" : ""} ${code.slice(fn.start, fn.end)}`;
      edits.push({ start: node.start, end: node.end, text: `${key}: __serverFn(${id}, ${expression})` });
    }
  }
  if (target === "client") edits.push(...stripServerOnly(program, code, found.parts));
  const runtime = target === "server" ? `import { __serverFn } from "nuclo-pages/server";` : `import { __rpc } from "nuclo-pages/client";`;
  return { code: `${applyEdits(code, edits)}\n${runtime}\n` };
}

const keyName = (key: Node): string | undefined => (key.type === "Identifier" ? key.name : key.type === "Literal" ? String(key.value) : undefined);

/**
 * Finds the server-only parts of a module: top-level `const x = $server(fn)`,
 * and the inline `load` and `actions` of `export default Page({…})` / `Layout({…})`.
 * Anything that would hide server code from the build is an error.
 */
function findServerParts(program: Node): { parts: ServerPart[] } | { error: string; pos: number } {
  const parts: ServerPart[] = [];
  for (const statement of program.body as Node[]) {
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type !== "VariableDeclaration") continue;
    for (const { id, init } of declaration.declarations as Node[]) {
      if (init?.type !== "CallExpression" || init.callee.type !== "Identifier" || init.callee.name !== "$server") continue;
      if (declaration.kind !== "const" || id.type !== "Identifier") {
        return { error: `$server() must initialize a top-level const: ${MACRO}`, pos: init.start };
      }
      const [fn, ...rest] = init.arguments as Node[];
      if (rest.length || (fn?.type !== "ArrowFunctionExpression" && fn?.type !== "FunctionExpression")) {
        return { error: `$server() takes exactly one inline function: ${MACRO}`, pos: init.start };
      }
      parts.push({ name: id.name, fn, kind: "macro", node: init });
    }
  }
  const callees = new Set(parts.map((part) => part.node.callee));
  let stray: Node;
  visitRefs(program, (node) => {
    if (!stray && node.name === "$server" && !callees.has(node)) stray = node;
  });
  if (stray) return { error: `$server() can only initialize a top-level const: ${MACRO}`, pos: stray.start };

  // Page() and Layout(), imported from nuclo-pages (possibly renamed).
  const helpers = new Set<string>();
  for (const statement of program.body as Node[]) {
    if (statement.type !== "ImportDeclaration" || statement.source.value !== "nuclo-pages" || statement.importKind === "type") continue;
    for (const specifier of statement.specifiers as Node[]) {
      const imported = specifier.type === "ImportSpecifier" && specifier.importKind !== "type" ? keyName(specifier.imported) : undefined;
      if (imported === "Page" || imported === "Layout") helpers.add(specifier.local.name);
    }
  }
  if (!helpers.size) return { parts };
  const exported = (program.body as Node[]).find((statement) => statement.type === "ExportDefaultDeclaration")?.declaration;
  const call = exported?.type === "CallExpression" && exported.callee.type === "Identifier" && helpers.has(exported.callee.name) ? exported : undefined;
  let misplaced: Node;
  visitRefs(program, (node) => {
    if (!misplaced && helpers.has(node.name) && node !== call?.callee) misplaced = node;
  });
  if (misplaced) return { error: `${misplaced.name}() must be the default export: ${DEFINITION}`, pos: misplaced.start };
  if (!call) return { parts };

  const [definition] = call.arguments as Node[];
  if (definition?.type !== "ObjectExpression") return { error: `${call.callee.name}() takes an object literal: ${DEFINITION}`, pos: call.start };
  for (const property of definition.properties as Node[]) {
    // A spread or computed key could hide a load or actions from the build.
    if (property.type !== "Property" || property.computed) return { error: `write the ${call.callee.name}() definition out, without spreads or computed keys`, pos: property.start };
    const name = keyName(property.key);
    if (name === "load") {
      const part = serverPart("load", property);
      if (!part) return { error: "load must be an inline function: load: async (event) => …", pos: property.start };
      parts.push(part);
    } else if (name === "actions") {
      if (property.value.type !== "ObjectExpression") return { error: `actions must be an object of inline functions: ${ACTIONS}`, pos: property.start };
      for (const action of property.value.properties as Node[]) {
        const part = action.type === "Property" && !action.computed ? serverPart(`actions.${keyName(action.key)}`, action) : undefined;
        if (!part) return { error: `actions must be an object of inline functions: ${ACTIONS}`, pos: action.start };
        parts.push(part);
      }
    }
  }
  return { parts };
}

/** A property holding an inline function (`name: () => …` or `name() {…}`); getters and references don't qualify. */
function serverPart(name: string, property: Node): ServerPart | undefined {
  const fn = property.value;
  if (property.kind !== "init" || (fn.type !== "ArrowFunctionExpression" && fn.type !== "FunctionExpression")) return undefined;
  return { name, fn, kind: property.method ? "method" : "value", node: property };
}

interface Item {
  names: string[];
  refs: Set<string>;
  node: Node;
  /** Set for import specifiers. */
  statement?: Node;
}

/**
 * Removes the import specifiers and non-exported top-level declarations that
 * only the (removed) server bodies used, transitively. Anything reachable from
 * client code — exports, side effects, other declarations — is kept.
 */
function stripServerOnly(program: Node, code: string, parts: readonly ServerPart[]): Edit[] {
  const bodies = parts.map((part) => part.fn);
  const inBody = (node: Node) => bodies.some((fn) => node.start >= fn.start && node.end <= fn.end);
  const items: Item[] = [];
  const roots = new Set<string>();

  for (const statement of program.body as Node[]) {
    if (statement.type === "ImportDeclaration") {
      // Side-effect imports (no specifiers) always stay.
      for (const specifier of statement.specifiers as Node[]) items.push({ names: [specifier.local.name], refs: new Set(), node: specifier, statement });
      continue;
    }
    const refs = new Set<string>();
    visitRefs(statement, (node) => refs.add(node.name), inBody);
    const removable =
      (statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration" || statement.type === "VariableDeclaration") &&
      !parts.some((part) => part.node.start >= statement.start && part.node.end <= statement.end);
    if (removable) items.push({ names: declaredNames(statement), refs, node: statement });
    else for (const ref of refs) roots.add(ref);
  }

  const byName = new Map<string, Item>();
  for (const item of items) for (const name of item.names) byName.set(name, item);
  const reach = (start: Iterable<string>) => {
    const seen = new Set<Item>();
    const queue = [...start];
    while (queue.length) {
      const item = byName.get(queue.pop()!);
      if (!item || seen.has(item)) continue;
      seen.add(item);
      queue.push(...item.refs);
    }
    return seen;
  };
  const serverRefs = new Set<string>();
  for (const fn of bodies) visitRefs(fn, (node) => serverRefs.add(node.name));
  const live = reach(roots);
  const remove = new Set([...reach(serverRefs)].filter((item) => !live.has(item)));

  const edits: Edit[] = [];
  const statements = new Map<Node, Node[]>();
  for (const item of remove) {
    if (!item.statement) edits.push({ start: item.node.start, end: item.node.end, text: "" });
    else statements.set(item.statement, [...(statements.get(item.statement) ?? []), item.node]);
  }
  for (const [statement, gone] of statements) {
    const kept = (statement.specifiers as Node[]).filter((specifier) => !gone.includes(specifier));
    edits.push({ start: statement.start, end: statement.end, text: kept.length ? importText(statement, kept, code) : "" });
  }
  return edits;
}

function importText(statement: Node, specifiers: Node[], code: string): string {
  const parts: string[] = [];
  const named: string[] = [];
  for (const specifier of specifiers) {
    const local = specifier.local.name;
    if (specifier.type === "ImportDefaultSpecifier") parts.push(local);
    else if (specifier.type === "ImportNamespaceSpecifier") parts.push(`* as ${local}`);
    else {
      const imported = specifier.imported.type === "Identifier" ? specifier.imported.name : JSON.stringify(specifier.imported.value);
      named.push(imported === local ? local : `${imported} as ${local}`);
    }
  }
  if (named.length) parts.push(`{ ${named.join(", ")} }`);
  // The source slice keeps import attributes and the semicolon.
  return `import ${parts.join(", ")} from ${code.slice(statement.source.start, statement.end)}`;
}

function declaredNames(statement: Node): string[] {
  if (statement.type !== "VariableDeclaration") return [statement.id.name];
  const names: string[] = [];
  const collect = (pattern: Node): void => {
    if (!pattern) return;
    if (pattern.type === "Identifier") names.push(pattern.name);
    else if (pattern.type === "ObjectPattern") for (const p of pattern.properties) collect(p.type === "RestElement" ? p.argument : p.value);
    else if (pattern.type === "ArrayPattern") for (const element of pattern.elements) collect(element);
    else if (pattern.type === "RestElement") collect(pattern.argument);
    else if (pattern.type === "AssignmentPattern") collect(pattern.left);
  };
  for (const declarator of statement.declarations) collect(declarator.id);
  return names;
}

/**
 * Calls `visit` for every identifier used as a value (not declared, not a
 * property key). Shadowing is ignored, which only ever keeps more code.
 */
function visitRefs(node: Node, visit: (identifier: Node) => void, skip?: (node: Node) => boolean): void {
  const refs = (n: Node): void => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(refs);
    if (typeof n.type !== "string" || skip?.(n)) return;
    switch (n.type) {
      case "Identifier":
        return visit(n);
      case "MemberExpression":
        refs(n.object);
        if (n.computed) refs(n.property);
        return;
      case "Property":
      case "MethodDefinition":
      case "PropertyDefinition":
      case "AccessorProperty":
        if (n.computed) refs(n.key);
        refs(n.value);
        refs(n.decorators);
        return;
      case "VariableDeclarator":
        binding(n.id);
        return refs(n.init);
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression":
        n.params.forEach(binding);
        return refs(n.body);
      case "ClassDeclaration":
      case "ClassExpression":
        refs(n.decorators);
        refs(n.superClass);
        return refs(n.body);
      case "CatchClause":
        binding(n.param);
        return refs(n.body);
      case "LabeledStatement":
        return refs(n.body);
      case "BreakStatement":
      case "ContinueStatement":
      case "MetaProperty":
      case "ImportDeclaration":
      case "ExportAllDeclaration":
        return;
      case "ExportNamedDeclaration":
        if (n.source) return;
        refs(n.declaration);
        for (const specifier of n.specifiers) refs(specifier.local);
        return;
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "TSNonNullExpression":
      case "TSTypeAssertion":
      case "TSInstantiationExpression":
        return refs(n.expression);
      default:
        // Other TS nodes are types: they reference nothing at runtime.
        if (n.type.startsWith("TS")) return;
        for (const key in n) if (key !== "type" && key !== "start" && key !== "end") refs(n[key]);
    }
  };
  // Binding patterns: only defaults and computed keys hold references.
  const binding = (n: Node): void => {
    if (!n || n.type === "Identifier") return;
    if (n.type === "ObjectPattern") {
      for (const p of n.properties) {
        if (p.type === "RestElement") binding(p.argument);
        else {
          if (p.computed) refs(p.key);
          binding(p.value);
        }
      }
    } else if (n.type === "ArrayPattern") n.elements.forEach(binding);
    else if (n.type === "RestElement") binding(n.argument);
    else if (n.type === "AssignmentPattern") {
      binding(n.left);
      refs(n.right);
    } else refs(n); // e.g. a member expression target in `for (a.b of c)`
  };
  refs(node);
}

/** Applies edits back to front, padding with newlines so every line keeps its number. */
function applyEdits(code: string, edits: Edit[]): string {
  for (const { start, end, text } of [...edits].sort((a, b) => b.start - a.start)) {
    const lost = (code.slice(start, end).match(/\n/g)?.length ?? 0) - (text.match(/\n/g)?.length ?? 0);
    code = code.slice(0, start) + text + "\n".repeat(Math.max(0, lost)) + code.slice(end);
  }
  return code;
}

function lineOf(code: string, pos: number): number {
  return code.slice(0, pos).split("\n").length;
}
