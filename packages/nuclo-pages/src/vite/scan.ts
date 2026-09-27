import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizePath, parseSync } from "vite";
import type { RootDef, RouteDef } from "../shared/types";

export const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

export interface ScannedRoute extends RouteDef {
  /** Page or API file, absolute. */
  file: string;
  /** `prerender: true` in the page's definition, or inherited from its nearest layout's. */
  prerender: boolean;
}

export interface PagesScan {
  /** Route modules (pages, layouts, error views, API routes), indexed by the route table. */
  modules: { file: string; server: boolean }[];
  routes: ScannedRoute[];
  root: RootDef;
}

const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const PARAM = /^\[([A-Za-z_$][\w$]*)\]$/;
const REST = /^\[\.\.\.([A-Za-z_$][\w$]*)\]$/;
const GROUP = /^\(.+\)$/;

class ScanError extends Error {
  constructor(file: string, message: string) {
    super(`[nuclo-pages] src/pages/${file}: ${message}`);
  }
}

/** Scans `src/pages` into the route table. `files` (relative to `dir`) and `read` default to the filesystem. */
export function scanPages(
  dir: string,
  read: (file: string) => string = (file) => readFileSync(file, "utf8"),
  list: readonly string[] = existsSync(dir) ? (readdirSync(dir, { recursive: true }) as string[]) : [],
): PagesScan {
  const files = list.map((file) => normalizePath(file)).filter(isRouteFile).sort();
  const modules: PagesScan["modules"] = [];
  const add = (file: string, server = false) => modules.push({ file: normalizePath(join(dir, file)), server }) - 1;
  const layouts = new Map<string, { module: number; prerender?: boolean }>();
  const errors = new Map<string, number>();
  const pages: { file: string; dir: string; path: string[]; api: boolean; prerender?: boolean }[] = [];

  for (const file of files) {
    const parts = file.split("/");
    const name = parts.pop()!.replace(SOURCE, "");
    const dirPath = parts.join("/");
    const segments = parts.filter((part) => !GROUP.test(part));
    // Files that don't parse (null) are let through: Vite reports the syntax error when it loads them.
    const info = routeFileInfo(read(join(dir, file)), file);
    if (name === "_layout") {
      if (info && info.definition !== "Layout") throw new ScanError(file, "a layout is export default Layout({ render: ({ children }) => … })");
      validate(segments, file);
      layouts.set(dirPath, { module: add(file), prerender: info?.prerender });
    } else if (name === "_error") {
      if (info && info.definition !== "ErrorPage") throw new ScanError(file, "an error view is export default ErrorPage({ render: ({ status, message }) => … })");
      errors.set(dirPath, add(file));
    } else {
      const api = !!info && info.definition === null && info.methods.length > 0;
      if (info && !api && info.definition !== "Page") {
        throw new ScanError(
          file,
          info.definition === null ? "a page is export default Page({ render: … }); an API route exports GET/POST/… handlers" : "a page is export default Page({ render: … })",
        );
      }
      const path = [...segments, ...(name === "index" || GROUP.test(name) ? [] : [name])];
      validate(path, file);
      pages.push({ file, dir: dirPath, path, api, prerender: info?.prerender });
    }
  }

  const routes: ScannedRoute[] = [];
  const patterns = new Map<string, string>();
  for (const page of pages) {
    const pattern = page.path.map((segment) => (REST.test(segment) ? "[...]" : PARAM.test(segment) ? "[]" : segment)).join("/");
    const clash = patterns.get(pattern);
    if (clash) throw new ScanError(page.file, `resolves to the same URL as src/pages/${clash}`);
    patterns.set(pattern, page.file);

    const id = "/" + page.path.join("/");
    const module = add(page.file, page.api);
    if (page.api) {
      routes.push({ id, path: page.path, layouts: [], page: module, errors: [], api: 1, file: modules[module].file, prerender: false });
      continue;
    }
    // Layout chain: the root layout (built-in when missing) plus every ancestor folder with a _layout.
    const chainDirs = ancestors(page.dir).filter((d) => d === "" || layouts.has(d));
    const chain: [number, string[]][] = chainDirs.map((d) => [layouts.get(d)?.module ?? -1, paramsOf(d)]);
    const boundary = (failing: string, strict: boolean): [number, number] => {
      const candidates = ancestors(failing);
      if (strict) candidates.pop();
      const at = candidates.reverse().find((d) => errors.has(d));
      const wraps = (d: string) => d === "" || at === d || (at ?? "").startsWith(d + "/");
      return [at === undefined ? -1 : errors.get(at)!, chainDirs.filter(wraps).length];
    };
    const inherited = [...chainDirs].reverse().map((d) => layouts.get(d)?.prerender).find((value) => value !== undefined);
    routes.push({
      id,
      path: page.path,
      layouts: chain,
      page: module,
      errors: [
        // A failing root layout can only render the root error view, without any layout.
        [errors.get("") ?? -1, 0],
        ...chainDirs.slice(1).map((d) => boundary(d, true)),
        boundary(page.dir, false),
      ],
      file: modules[module].file,
      prerender: page.prerender ?? inherited ?? false,
    });
  }
  routes.sort(compareRoutes);
  return { modules, routes, root: { layout: layouts.get("")?.module ?? -1, error: errors.get("") ?? -1 } };
}

function isRouteFile(file: string): boolean {
  if (!SOURCE.test(file) || /\.d\.[cm]?ts$/.test(file) || /\.(?:test|spec)\.[^/]+$/.test(file)) return false;
  const parts = file.split("/");
  const name = parts.pop()!.replace(SOURCE, "");
  if (parts.some((part) => part.startsWith("_") || part.startsWith("."))) return false;
  return name === "_layout" || name === "_error" || !(name.startsWith("_") || name.startsWith("."));
}

function validate(path: readonly string[], file: string): void {
  const names = new Set<string>();
  path.forEach((segment, i) => {
    const rest = REST.exec(segment);
    const name = rest?.[1] ?? PARAM.exec(segment)?.[1];
    if (rest && i !== path.length - 1) throw new ScanError(file, `the catch-all ${segment} must be the last segment`);
    if (!name && /[[\]]/.test(segment)) throw new ScanError(file, `invalid segment "${segment}": use [name] or [...name]`);
    if (name && names.has(name)) throw new ScanError(file, `duplicate param "${name}"`);
    if (name) names.add(name);
  });
}

/** "" (the pages root), then every folder down to `dir`. */
function ancestors(dir: string): string[] {
  const parts = dir ? dir.split("/") : [];
  return ["", ...parts.map((_, i) => parts.slice(0, i + 1).join("/"))];
}

/** Params a layout's folder consumes, e.g. "[org]/(admin)" → ["org"]. */
function paramsOf(dir: string): string[] {
  return (dir ? dir.split("/") : []).flatMap((segment) => {
    const name = (REST.exec(segment) ?? PARAM.exec(segment))?.[1];
    return name ? [name] : [];
  });
}

const rank = (segment: string) => (REST.test(segment) ? 2 : PARAM.test(segment) ? 1 : 0);

/** Static segments win over params, params over catch-alls. */
function compareRoutes(a: RouteDef, b: RouteDef): number {
  for (let i = 0; i < Math.min(a.path.length, b.path.length); i++) {
    const diff = rank(a.path[i]) - rank(b.path[i]);
    if (diff) return diff;
  }
  return b.path.length - a.path.length || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// oxc's ESTree nodes, loosely typed: only a handful of fields are read.
type Node = any;

const HELPERS = new Set(["Page", "Layout", "ErrorPage"]);

export interface RouteFileInfo {
  /** Which helper defines the default export (`export default Page({…})`), "other" for any other default export, null without one. */
  definition: "Page" | "Layout" | "ErrorPage" | "other" | null;
  /** Exported HTTP method handlers. */
  methods: string[];
  /** A literal `prerender` in the definition. */
  prerender?: boolean;
}

const keyName = (key: Node): string | undefined => (key.type === "Identifier" ? key.name : key.type === "Literal" ? String(key.value) : undefined);

/** How a route file is defined; null when it doesn't parse. */
export function routeFileInfo(code: string, file: string): RouteFileInfo | null {
  const { program, errors } = parseSync(file, code);
  if (errors.length) return null;
  // Local names of the helpers imported from nuclo-pages (they may be renamed).
  const helpers = new Map<string, RouteFileInfo["definition"]>();
  for (const node of program.body as Node[]) {
    if (node.type !== "ImportDeclaration" || node.source.value !== "nuclo-pages" || node.importKind === "type") continue;
    for (const specifier of node.specifiers as Node[]) {
      const imported = specifier.type === "ImportSpecifier" && specifier.importKind !== "type" ? keyName(specifier.imported) : undefined;
      if (imported && HELPERS.has(imported)) helpers.set(specifier.local.name, imported as RouteFileInfo["definition"]);
    }
  }
  const names = new Set<string>();
  const info: RouteFileInfo = { definition: null, methods: [] };
  for (const node of program.body as Node[]) {
    if (node.type === "ExportDefaultDeclaration") {
      const call = node.declaration;
      const helper = call.type === "CallExpression" && call.callee.type === "Identifier" ? helpers.get(call.callee.name) : undefined;
      info.definition = helper ?? "other";
      const object = helper && call.arguments[0]?.type === "ObjectExpression" ? call.arguments[0] : undefined;
      for (const property of (object?.properties ?? []) as Node[]) {
        if (property.type === "Property" && !property.computed && keyName(property.key) === "prerender" && typeof property.value.value === "boolean") {
          info.prerender = property.value.value;
        }
      }
      continue;
    }
    if (node.type !== "ExportNamedDeclaration" || node.exportKind === "type") continue;
    const declaration = node.declaration;
    if (declaration?.type === "VariableDeclaration") {
      for (const { id } of declaration.declarations as Node[]) if (id.type === "Identifier") names.add(id.name);
    } else if (declaration?.id && !declaration.type.startsWith("TS")) {
      names.add(declaration.id.name);
    }
    for (const specifier of (node.specifiers ?? []) as Node[]) {
      if (specifier.exportKind === "type") continue;
      const name = keyName(specifier.exported);
      if (name === "default") info.definition = "other";
      else if (name) names.add(name);
    }
  }
  info.methods = METHODS.filter((method) => names.has(method));
  return info;
}
