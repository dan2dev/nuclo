/**
 * Path matching. Patterns are plain paths with `:name` params and a trailing
 * `*name` catch-all (bare `*` is the 404). Precedence: static, then dynamic in
 * declaration order, then catch-alls longest first — so `"*"` matches only
 * what nothing else does, wherever it sits in the table.
 */

export interface RouteParams {
  readonly [name: string]: string;
}

export interface Match<T> {
  /** The table key that matched. */
  readonly pattern: string;
  readonly value: T;
  readonly params: RouteParams;
  /** Canonical decoded path: no base, no trailing slash, no empty segments. */
  readonly path: string;
}

/** Shared by every param-less match. Null-prototype, like every params object, so a segment named "__proto__" is data. */
const NO_PARAMS: RouteParams = Object.freeze(Object.create(null) as RouteParams);

/** A malformed escape (%zz) is client input, not a bug: keep it as written. */
export function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** "/a//b/" -> ["a", "b"] */
export function splitPath(path: string, decodeSegments = false): string[] {
  const segs = path.split("/").filter(Boolean);
  return decodeSegments ? segs.map(decode) : segs;
}

export const joinSegments = (segs: readonly string[]): string => "/" + segs.join("/");

/** "docs/" -> "/docs"; "" and "/" -> "/" */
export const normalizePath = (path: string): string => joinSegments(splitPath(path));

/** "" for a root base, else "/prefix" with no trailing slash. */
export const normalizeBase = (base = ""): string => normalizePath(base).replace(/^\/$/, "");

/** The pathname minus the base, or null when it sits outside it (not the app's URL). */
export function stripBase(pathname: string, base: string): string | null {
  if (!base) return pathname;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length);
  return rest === "" ? "/" : rest[0] === "/" ? rest : null;
}

interface Compiled<T> {
  readonly pattern: string;
  readonly value: T;
  /** Literal or `:name` per segment, catch-all excluded. */
  readonly segs: readonly string[];
  /** The catch-all's param name, or null. */
  readonly rest: string | null;
  /** 0 static, 1 dynamic, 2 catch-all. */
  readonly rank: number;
}

function compile<T>(pattern: string, value: T): Compiled<T> {
  const segs = splitPath(pattern, true);
  const star = segs.findIndex((seg) => seg[0] === "*");
  if (star !== -1 && star !== segs.length - 1) {
    throw new Error(`nuclo-router: "${pattern}" — a *catch-all must be the last segment`);
  }
  const rest = star === -1 ? null : segs.pop()!.slice(1) || "*";
  for (const seg of segs) {
    if (seg === "." || seg === "..") {
      throw new Error(
        `nuclo-router: "${pattern}" — a route pattern is absolute. ` +
          `A "./" or "../" key only works nested inside a parent table, which resolves it. Nest it, or write the full path.`,
      );
    }
    if (seg === ":") throw new Error(`nuclo-router: "${pattern}" — ":" needs a param name`);
  }
  const rank = rest !== null ? 2 : segs.some((seg) => seg[0] === ":") ? 1 : 0;
  return { pattern, value, segs, rest, rank };
}

function matchOne<T>(c: Compiled<T>, segs: readonly string[]): RouteParams | null {
  const n = c.segs.length;
  if (c.rest === null ? segs.length !== n : segs.length < n) return null;
  let params: Record<string, string> | null = null;
  for (let i = 0; i < n; i++) {
    const want = c.segs[i];
    if (want[0] === ":") (params ??= Object.create(null))[want.slice(1)] = segs[i];
    else if (want !== segs[i]) return null;
  }
  if (c.rest !== null) (params ??= Object.create(null))[c.rest] = segs.slice(n).join("/");
  return params ?? NO_PARAMS;
}

/** Compiles the table once into a matcher: a segment comparison per pattern, no regexes. */
export function createMatcher<T>(table: Readonly<Record<string, T>>): (pathname: string) => Match<T> | null {
  const compiled = Object.keys(table)
    .map((pattern) => compile(pattern, table[pattern]))
    // Stable: declaration order breaks ties. Catch-alls: longest literal prefix first.
    .sort((a, b) => a.rank - b.rank || (a.rank === 2 ? b.segs.length - a.segs.length : 0));

  return (pathname) => {
    const segs = splitPath(pathname, true);
    const path = joinSegments(segs);
    for (const c of compiled) {
      const params = matchOne(c, segs);
      if (params) return { pattern: c.pattern, value: c.value, params, path };
    }
    return null;
  };
}
