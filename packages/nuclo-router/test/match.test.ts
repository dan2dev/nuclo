import { describe, it, expect } from "vitest";
import {
  createMatcher,
  joinSegments,
  normalizeBase,
  normalizePath,
  splitPath,
  stripBase,
} from "../src/match";

describe("splitPath", () => {
  it("drops empty segments and leading/trailing slashes", () => {
    expect(splitPath("/a/b", false)).toEqual(["a", "b"]);
    expect(splitPath("a/b/", false)).toEqual(["a", "b"]);
    expect(splitPath("/a//b///", false)).toEqual(["a", "b"]);
    expect(splitPath("/", false)).toEqual([]);
    expect(splitPath("", false)).toEqual([]);
  });

  it("decodes only when asked", () => {
    expect(splitPath("/a%20b", false)).toEqual(["a%20b"]);
    expect(splitPath("/a%20b", true)).toEqual(["a b"]);
    expect(splitPath("/caf%C3%A9/%E2%9C%93", true)).toEqual(["café", "✓"]);
  });

  it("keeps a malformed escape instead of throwing", () => {
    expect(splitPath("/100%/%zz", true)).toEqual(["100%", "%zz"]);
  });
});

describe("joinSegments / normalizePath", () => {
  it("rebuilds a canonical path", () => {
    expect(joinSegments([])).toBe("/");
    expect(joinSegments(["a", "b"])).toBe("/a/b");
    expect(normalizePath("docs/")).toBe("/docs");
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("//a//")).toBe("/a");
  });
});

describe("normalizeBase", () => {
  it("collapses every root spelling to the empty prefix", () => {
    expect(normalizeBase(undefined)).toBe("");
    expect(normalizeBase("")).toBe("");
    expect(normalizeBase("/")).toBe("");
    expect(normalizeBase("//")).toBe("");
  });

  it("normalizes a sub-path base", () => {
    expect(normalizeBase("/docs")).toBe("/docs");
    expect(normalizeBase("docs/")).toBe("/docs");
    expect(normalizeBase("/a/b/")).toBe("/a/b");
  });
});

describe("stripBase", () => {
  it("passes everything through for a root base", () => {
    expect(stripBase("/anything", "")).toBe("/anything");
  });

  it("strips the prefix and keeps the remainder rooted", () => {
    expect(stripBase("/docs", "/docs")).toBe("/");
    expect(stripBase("/docs/", "/docs")).toBe("/");
    expect(stripBase("/docs/intro", "/docs")).toBe("/intro");
  });

  it("rejects pathnames outside the base", () => {
    expect(stripBase("/other", "/docs")).toBeNull();
    // A prefix match that is not a segment boundary is not inside the base.
    expect(stripBase("/docsearch", "/docs")).toBeNull();
  });
});

describe("createMatcher — static routes", () => {
  const match = createMatcher({ "/": "home", "/docs": "docs", "/docs/intro": "intro" });

  it("matches exactly, ignoring slash spelling", () => {
    expect(match("/")?.value).toBe("home");
    expect(match("")?.value).toBe("home");
    expect(match("/docs")?.value).toBe("docs");
    expect(match("/docs/")?.value).toBe("docs");
    expect(match("//docs//")?.value).toBe("docs");
    expect(match("/docs/intro")?.value).toBe("intro");
  });

  it("reports the canonical path and pattern", () => {
    const found = match("/docs/")!;
    expect(found.path).toBe("/docs");
    expect(found.pattern).toBe("/docs");
    expect(found.params).toEqual({});
  });

  it("returns null with no catch-all", () => {
    expect(match("/nope")).toBeNull();
    expect(match("/docs/intro/deep")).toBeNull();
  });

  it("matches percent-encoded paths against their decoded pattern", () => {
    const m = createMatcher({ "/a b": "spaced" });
    expect(m("/a%20b")?.value).toBe("spaced");
  });
});

describe("createMatcher — params", () => {
  const match = createMatcher({
    "/blog/:slug": "post",
    "/blog/:slug/:comment": "comment",
    "/u/:id/edit": "edit",
  });

  it("captures one param per segment", () => {
    expect(match("/blog/hello")).toMatchObject({ value: "post", params: { slug: "hello" } });
    expect(match("/blog/a/b")).toMatchObject({ value: "comment", params: { slug: "a", comment: "b" } });
    expect(match("/u/7/edit")).toMatchObject({ value: "edit", params: { id: "7" } });
  });

  it("requires an exact segment count", () => {
    expect(match("/blog")).toBeNull();
    expect(match("/blog/a/b/c")).toBeNull();
    expect(match("/u/7")).toBeNull();
  });

  it("decodes param values", () => {
    expect(match("/blog/caf%C3%A9")?.params.slug).toBe("café");
  });

  it("never pollutes Object.prototype through a param name", () => {
    const m = createMatcher({ "/x/:__proto__": "evil" });
    const found = m("/x/boom")!;
    expect(Object.getPrototypeOf(found.params)).toBeNull();
    expect(found.params["__proto__"]).toBe("boom");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("prefers a static route over a param route for the same shape", () => {
    const m = createMatcher({ "/blog/:slug": "post", "/blog/new": "new" });
    expect(m("/blog/new")?.value).toBe("new");
    expect(m("/blog/old")?.value).toBe("post");
  });

  it("breaks ties between param routes by declaration order", () => {
    const first = createMatcher({ "/:a/x": "A", "/y/:b": "B" });
    expect(first("/y/x")?.value).toBe("A");
    const second = createMatcher({ "/y/:b": "B", "/:a/x": "A" });
    expect(second("/y/x")?.value).toBe("B");
  });
});

describe("createMatcher — catch-alls", () => {
  it("captures the remaining path, joined", () => {
    const match = createMatcher({ "/files/*rest": "files" });
    expect(match("/files/a/b.txt")?.params.rest).toBe("a/b.txt");
    expect(match("/files/one")?.params.rest).toBe("one");
    // The prefix alone matches, with an empty tail.
    expect(match("/files")?.params.rest).toBe("");
    expect(match("/other")).toBeNull();
  });

  it("names an unnamed catch-all '*'", () => {
    const match = createMatcher({ "/files/*": "files" });
    expect(match("/files/a/b")?.params["*"]).toBe("a/b");
  });

  it("matches every path from a bare '*', wherever it is declared", () => {
    const match = createMatcher({ "*": "notFound", "/": "home", "/docs": "docs" });
    expect(match("/")?.value).toBe("home");
    expect(match("/docs")?.value).toBe("docs");
    expect(match("/anything/at/all")?.value).toBe("notFound");
  });

  it("prefers the longest catch-all prefix", () => {
    const match = createMatcher({ "*": "notFound", "/files/*rest": "files" });
    expect(match("/files/x")?.value).toBe("files");
    expect(match("/elsewhere")?.value).toBe("notFound");
  });

  it("prefers a param route over a catch-all", () => {
    const match = createMatcher({ "*": "notFound", "/blog/:slug": "post" });
    expect(match("/blog/hi")?.value).toBe("post");
    expect(match("/blog/hi/there")?.value).toBe("notFound");
  });

  it("rejects a catch-all that is not the last segment", () => {
    expect(() => createMatcher({ "/a/*rest/b": "bad" })).toThrow(/last segment/);
  });

  it("rejects a param with no name", () => {
    expect(() => createMatcher({ "/a/:": "bad" })).toThrow(/param name/);
  });
});
