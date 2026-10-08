/**
 * Path matching — the only non-DOM logic in this package.
 *
 * Patterns are plain paths with `:name` params and a trailing `*name`
 * catch-all:
 *
 *   "/"  "/docs/intro"   static  — matched by one Map lookup
 *   "/blog/:slug"                — one param per segment
 *   "/files/*rest"  "*"          — catch-all tail (the `*` route is the 404)
 *
 * Precedence: static patterns first, then dynamic ones in declaration order,
 * then catch-alls (longest literal prefix first). So a `"*"` route matches
 * only what nothing else does, wherever it sits in the table — declaration
 * order never has to encode specificity.
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

/** Shared for every param-less match — a match costs no allocation. */
const NO_PARAMS: RouteParams = Object.freeze(Object.create(null) as RouteParams);

const SLASH = 47;
const COLON = 58;
const STAR = 42;

function decodeSegment(raw: string): string {
  if (raw.indexOf("%") === -1) return raw;
  // A malformed escape (%zz) is a client-supplied value, not a bug: keep the
  // raw segment rather than throwing out of the match.
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Splits a path into non-empty segments: "/a//b/" -> ["a", "b"]. */
export function splitPath(path: string, decode: boolean): string[] {
  const segs = path.split("/").filter(Boolean);
  return decode ? segs.map(decodeSegment) : segs;
}

export function joinSegments(segs: readonly string[]): string {
  return segs.length === 0 ? "/" : "/" + segs.join("/");
}

/** "docs/" -> "/docs"; "" and "/" -> "/". */
export function normalizePath(path: string): string {
  return joinSegments(splitPath(path, false));
}

/** "" for a root base, else "/prefix" with no trailing slash. */
export function normalizeBase(base: string | undefined): string {
  if (!base) return "";
  const segs = splitPath(base, false);
  return segs.length === 0 ? "" : "/" + segs.join("/");
}

/**
 * Removes the base prefix from a pathname, or returns null when the pathname
 * sits outside the base (the app does not own that URL — the router must let
 * the browser navigate to it).
 */
export function stripBase(pathname: string, base: string): string | null {
  if (base === "") return pathname;
  if (!pathname.startsWith(base)) return null;
  const rest = pathname.slice(base.length);
  if (rest === "") return "/";
  return rest.charCodeAt(0) === SLASH ? rest : null;
}

interface Compiled<T> {
  readonly pattern: string;
  readonly value: T;
  /** Literal text per segment; "" where names[i] holds a param name. */
  readonly lits: readonly string[];
  readonly names: readonly (string | null)[];
  /** Param name of the trailing catch-all, or null when there is none. */
  readonly rest: string | null;
  /** Canonical path — only meaningful (and only used) for static patterns. */
  readonly key: string;
  readonly isStatic: boolean;
}

function compile<T>(pattern: string, value: T): Compiled<T> {
  const raw = splitPath(pattern, true);
  const lits: string[] = [];
  const names: (string | null)[] = [];
  let rest: string | null = null;
  let isStatic = true;

  for (let i = 0; i < raw.length; i++) {
    const seg = raw[i];
    const first = seg.charCodeAt(0);
    if (first === STAR) {
      if (i !== raw.length - 1) {
        throw new Error(`nuclo-router: "${pattern}" — a *catch-all must be the last segment`);
      }
      rest = seg.slice(1) || "*";
      isStatic = false;
      break;
    }
    // A "." or ".." segment can never match: incoming paths are canonicalized
    // without resolving dot segments, so "./x" would compile to the literal
    // path "/./x" and silently match nothing. Relative keys are meaningful
    // only to mount(), which rewrites them before the table is compiled.
    if (seg === "." || seg === "..") {
      throw new Error(
        `nuclo-router: "${pattern}" — a route pattern is absolute. ` +
          `A "./" or "../" key only works nested inside a parent table, which resolves it. Nest it, or write the full path.`,
      );
    }
    if (first === COLON) {
      const name = seg.slice(1);
      if (!name) throw new Error(`nuclo-router: "${pattern}" — ":" needs a param name`);
      lits.push("");
      names.push(name);
      isStatic = false;
      continue;
    }
    lits.push(seg);
    names.push(null);
  }

  return { pattern, value, lits, names, rest, key: joinSegments(lits), isStatic };
}

function matchOne<T>(c: Compiled<T>, segs: readonly string[]): RouteParams | null {
  const n = c.lits.length;
  if (c.rest === null ? segs.length !== n : segs.length < n) return null;

  const names = c.names;
  // Literals first, so a pattern that cannot match allocates nothing.
  for (let i = 0; i < n; i++) {
    if (names[i] === null && c.lits[i] !== segs[i]) return null;
  }
  // Null-prototype: a URL segment named "__proto__" or "constructor" must land
  // in the params object as data, never on Object.prototype. Only dynamic and
  // catch-all patterns reach here, so this object is never empty — static
  // matches short-circuit to the shared NO_PARAMS in createMatcher().
  const params = Object.create(null) as Record<string, string>;
  for (let i = 0; i < n; i++) {
    const name = names[i];
    if (name !== null) params[name] = segs[i];
  }
  if (c.rest !== null) params[c.rest] = segs.slice(n).join("/");
  return params;
}

/**
 * Compiles a pattern table once into a matcher closure. Matching a static
 * route is a single Map lookup; a dynamic one is a segment-count check plus a
 * literal comparison per segment — no regexes are built or run.
 */
export function createMatcher<T>(
  table: Readonly<Record<string, T>>,
): (pathname: string) => Match<T> | null {
  const statics = new Map<string, Compiled<T>>();
  const dynamic: Compiled<T>[] = [];
  const catchAll: Compiled<T>[] = [];

  for (const pattern of Object.keys(table)) {
    const c = compile(pattern, table[pattern]);
    if (c.rest !== null) catchAll.push(c);
    else if (c.isStatic) statics.set(c.key, c);
    else dynamic.push(c);
  }
  // Longest literal prefix first, so "/files/*rest" is preferred over "*".
  catchAll.sort((a, b) => b.lits.length - a.lits.length);

  return function match(pathname: string): Match<T> | null {
    const segs = splitPath(pathname, true);
    const path = joinSegments(segs);

    const exact = statics.get(path);
    if (exact) return { pattern: exact.pattern, value: exact.value, params: NO_PARAMS, path };

    for (let i = 0; i < dynamic.length; i++) {
      const params = matchOne(dynamic[i], segs);
      if (params) return { pattern: dynamic[i].pattern, value: dynamic[i].value, params, path };
    }
    for (let i = 0; i < catchAll.length; i++) {
      const params = matchOne(catchAll[i], segs);
      if (params) return { pattern: catchAll[i].pattern, value: catchAll[i].value, params, path };
    }
    return null;
  };
}
