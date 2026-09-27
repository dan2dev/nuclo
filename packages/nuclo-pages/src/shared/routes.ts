import type { RouteDef } from "./types";

export interface Match {
  route: RouteDef;
  params: Record<string, string>;
}

/** First route matching the pathname. Routes come pre-sorted (static > param > catch-all). */
export function matchRoute(routes: readonly RouteDef[], pathname: string): Match | null {
  const parts = pathname.split("/").filter(Boolean);
  for (const route of routes) {
    const params = matchPath(route.path, parts);
    if (params) return { route, params };
  }
  return null;
}

function matchPath(path: readonly string[], parts: readonly string[]): Record<string, string> | null {
  const params: Record<string, string> = {};
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (i >= parts.length) return null;
    if (segment.startsWith("[...")) {
      const rest = parts.slice(i).map(decode);
      if (rest.includes(null)) return null;
      params[segment.slice(4, -1)] = rest.join("/");
      return params;
    }
    const part = decode(parts[i]);
    if (part === null) return null;
    if (segment.startsWith("[")) params[segment.slice(1, -1)] = part;
    else if (segment !== part) return null;
  }
  return parts.length === path.length ? params : null;
}

function decode(part: string): string | null {
  try {
    return decodeURIComponent(part);
  } catch {
    return null;
  }
}

/** Builds a URL from a route id: `href("/blog/[slug]", { slug: "hello" })` → "/blog/hello". */
export function href(id: string, params: Record<string, string> = {}): string {
  const value = (name: string) => {
    const v = params[name];
    if (v === undefined) throw new Error(`href("${id}"): missing param "${name}"`);
    return String(v);
  };
  const segments = id.split("/").filter(Boolean).map((segment) => {
    if (segment.startsWith("[...")) return value(segment.slice(4, -1)).split("/").map(encodeURIComponent).join("/");
    if (segment.startsWith("[")) return encodeURIComponent(value(segment.slice(1, -1)));
    return segment;
  });
  return "/" + segments.join("/");
}
