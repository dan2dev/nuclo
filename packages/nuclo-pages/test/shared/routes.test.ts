import { describe, expect, it } from "vitest";
import { href, matchRoute } from "../../src/shared/routes";
import type { RouteDef } from "../../src/shared/types";

const route = (id: string): RouteDef => ({ id, path: id.split("/").filter(Boolean), layouts: [], page: 0, errors: [] });

// In the order the scanner sorts them: static > param > catch-all.
const routes = [
  "/blog/new",
  "/blog/[slug]/comments/[id]",
  "/blog/[slug]",
  "/café",
  "/about",
  "/docs/[...path]",
  "/",
  "/[...all]",
].map(route);

const match = (pathname: string, table = routes) => {
  const found = matchRoute(table, pathname);
  return found && { id: found.route.id, params: found.params };
};

describe("matchRoute", () => {
  it("matches the root, with or without a pathname", () => {
    expect(match("/")).toEqual({ id: "/", params: {} });
    expect(match("")).toEqual({ id: "/", params: {} });
  });

  it("ignores trailing and repeated slashes", () => {
    expect(match("/about/")).toEqual({ id: "/about", params: {} });
    expect(match("//about//")).toEqual({ id: "/about", params: {} });
  });

  it("prefers the first route in table order (static before params)", () => {
    expect(match("/blog/new")).toEqual({ id: "/blog/new", params: {} });
    expect(match("/blog/old")).toEqual({ id: "/blog/[slug]", params: { slug: "old" } });
  });

  it("extracts several params", () => {
    expect(match("/blog/hello/comments/42")).toEqual({ id: "/blog/[slug]/comments/[id]", params: { slug: "hello", id: "42" } });
  });

  it("decodes params, including encoded slashes", () => {
    expect(match("/blog/hello%20world")?.params).toEqual({ slug: "hello world" });
    expect(match("/blog/a%2Fb")?.params).toEqual({ slug: "a/b" });
    expect(match("/blog/%F0%9F%9A%80")?.params).toEqual({ slug: "🚀" });
  });

  it("compares static segments decoded", () => {
    expect(match("/caf%C3%A9")).toEqual({ id: "/café", params: {} });
  });

  it("is case-sensitive", () => {
    expect(match("/About")).toEqual({ id: "/[...all]", params: { all: "About" } });
  });

  it("treats malformed percent-encoding as no match", () => {
    expect(match("/blog/%E0%A4%A")).toBeNull();
    expect(match("/%")).toBeNull();
  });

  it("matches catch-alls with one or more segments", () => {
    expect(match("/docs/a")).toEqual({ id: "/docs/[...path]", params: { path: "a" } });
    expect(match("/docs/a/b%20c/d")).toEqual({ id: "/docs/[...path]", params: { path: "a/b c/d" } });
    // A catch-all needs at least one segment: /docs falls through to the next route.
    expect(match("/docs")).toEqual({ id: "/[...all]", params: { all: "docs" } });
  });

  it("returns null when nothing matches", () => {
    const table = ["/", "/about", "/blog/[slug]"].map(route);
    expect(match("/about/team", table)).toBeNull();
    expect(match("/blog", table)).toBeNull();
    expect(match("/blog/a/b", table)).toBeNull();
    expect(matchRoute([], "/")).toBeNull();
  });
});

describe("href", () => {
  it("returns static ids as they are", () => {
    expect(href("/")).toBe("/");
    expect(href("/about")).toBe("/about");
  });

  it("fills and encodes params", () => {
    expect(href("/blog/[slug]", { slug: "hello world" })).toBe("/blog/hello%20world");
    expect(href("/blog/[slug]", { slug: "a/b?c#d" })).toBe("/blog/a%2Fb%3Fc%23d");
    expect(href("/blog/[slug]/comments/[id]", { slug: "x", id: "7" })).toBe("/blog/x/comments/7");
  });

  it("keeps the slashes of catch-all values", () => {
    expect(href("/docs/[...path]", { path: "guide/getting started" })).toBe("/docs/guide/getting%20started");
  });

  it("throws on a missing param", () => {
    expect(() => href("/blog/[slug]", {})).toThrow('missing param "slug"');
    expect(() => href("/blog/[slug]")).toThrow('missing param "slug"');
  });

  it("round-trips through matchRoute", () => {
    for (const slug of ["plain", "with space", "ünïcödé", "a/b", "100%", "?#&=", "🚀"]) {
      expect(match(href("/blog/[slug]", { slug }))?.params).toEqual({ slug });
    }
    for (const path of ["a", "a/b/c", "x y/z"]) {
      expect(match(href("/docs/[...path]", { path }))?.params).toEqual({ path });
    }
  });
});
