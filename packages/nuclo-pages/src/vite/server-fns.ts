import { createHash } from "node:crypto";
import { parseSync } from "vite";

// oxc's ESTree nodes, loosely typed.
type Node = any;

interface ServerCall {
  name: string;
  call: Node;
  callee: Node;
  fn: Node;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

const USAGE = "export const getPost = $server(async (slug: string) => …)";

/** Stable id of a server function: a hash of its file (relative to the root) and binding. */
export function serverFnId(file: string, name: string): string {
  return createHash("sha256").update(`${file}#${name}`).digest("hex").slice(0, 12);
}

/** Ids of the valid `$server()` declarations in a source file (for the server-function map). */
export function serverFnIds(code: string, file: string, rel: string): string[] {
  if (!code.includes("$server")) return [];
  const { program, errors } = parseSync(file, code);
  if (errors.length) return [];
  const found = findServerFns(program);
  return "error" in found ? [] : found.calls.map((call) => serverFnId(rel, call.name));
}

/**
 * Rewrites the `$server()` declarations of a module.
 * - server: `$server(fn)` → `__serverFn("id", fn)`; the module stays intact, so SSR calls run in-process.
 * - client: `$server(fn)` → `__rpc("id")`, then removes the imports and private top-level declarations
 *   only the server bodies used.
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
  const found = findServerFns(program);
  if ("error" in found) return { error: `${found.error} (${rel}:${lineOf(code, found.pos)})` };
  if (!found.calls.length) return null;

  const edits: Edit[] = [];
  for (const { name, call, callee, fn } of found.calls) {
    const id = JSON.stringify(serverFnId(rel, name));
    if (target === "server") {
      edits.push({ start: callee.start, end: callee.end, text: "__serverFn" }, { start: fn.start, end: fn.start, text: `${id}, ` });
    } else {
      edits.push({ start: call.start, end: call.end, text: `__rpc(${id}${dev ? `, ${JSON.stringify(`${rel}#${name}`)}` : ""})` });
    }
  }
  if (target === "client") edits.push(...stripServerOnly(program, code, found.calls));
  const runtime = target === "server" ? `import { __serverFn } from "nuclo-pages/server";` : `import { __rpc } from "nuclo-pages/client";`;
  return { code: `${applyEdits(code, edits)}\n${runtime}\n` };
}

/** Top-level `const x = $server(fn)` declarations; any other use of `$server` is an error. */
function findServerFns(program: Node): { calls: ServerCall[] } | { error: string; pos: number } {
  const calls: ServerCall[] = [];
  for (const statement of program.body as Node[]) {
    const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type !== "VariableDeclaration") continue;
    for (const { id, init } of declaration.declarations as Node[]) {
      if (init?.type !== "CallExpression" || init.callee.type !== "Identifier" || init.callee.name !== "$server") continue;
      if (declaration.kind !== "const" || id.type !== "Identifier") {
        return { error: `$server() must initialize a top-level const: ${USAGE}`, pos: init.start };
      }
      const [fn, ...rest] = init.arguments as Node[];
      if (rest.length || (fn?.type !== "ArrowFunctionExpression" && fn?.type !== "FunctionExpression")) {
        return { error: `$server() takes exactly one inline function: ${USAGE}`, pos: init.start };
      }
      calls.push({ name: id.name, call: init, callee: init.callee, fn });
    }
  }
  const callees = new Set(calls.map((call) => call.callee));
  let stray: Node;
  visitRefs(program, (node) => {
    if (!stray && node.name === "$server" && !callees.has(node)) stray = node;
  });
  if (stray) return { error: `$server() can only initialize a top-level const: ${USAGE}`, pos: stray.start };
  return { calls };
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
function stripServerOnly(program: Node, code: string, calls: readonly ServerCall[]): Edit[] {
  const bodies = calls.map((call) => call.fn);
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
      !calls.some((call) => call.call.start >= statement.start && call.call.end <= statement.end);
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
      default:
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
