import { beforeEach, describe, expect, it, vi } from "vitest";

// Fresh module state per test.
let state: typeof import("../../src/shared/route-state");
beforeEach(async () => {
  vi.resetModules();
  state = await import("../../src/shared/route-state");
});

describe("route", () => {
  it("starts empty", () => {
    expect(state.route.id).toBe("");
    expect(state.route.params).toEqual({});
    expect(state.route.pending).toBe(false);
    expect(state.route.url).toBeInstanceOf(URL);
  });

  it("reflects setRoute, including partial updates", () => {
    const url = new URL("http://localhost/blog/a");
    state.setRoute({ id: "/blog/[slug]", url, params: { slug: "a" } });
    state.setRoute({ pending: true });
    expect(state.route).toMatchObject({ id: "/blog/[slug]", url, params: { slug: "a" }, pending: true });
  });

  it("prefers the installed source and falls back to module state", () => {
    const snapshot = { id: "/server", url: new URL("http://s/"), params: { x: "1" }, pending: false };
    let active: typeof snapshot | undefined = snapshot;
    state.setRoute({ id: "/client" });
    state.setRouteSource(() => active);
    expect(state.route.id).toBe("/server");
    expect(state.route.params).toEqual({ x: "1" });
    active = undefined;
    expect(state.route.id).toBe("/client");
  });
});

describe("navigate", () => {
  it("rejects until the client router installs itself", async () => {
    await expect(state.navigate("/x")).rejects.toThrow("only works in the browser");
  });

  it("forwards to the installed navigator", async () => {
    const navigator = vi.fn(async () => {});
    state.setNavigator(navigator);
    await state.navigate("/x", { replace: true });
    expect(navigator).toHaveBeenCalledWith("/x", { replace: true });
  });
});

describe("isActive", () => {
  const at = (path: string) => state.setRoute({ url: new URL(path, "http://localhost") });

  it("matches the path and everything below it, on segment boundaries", () => {
    at("/blog/post");
    expect(state.isActive("/blog")).toBe(true);
    expect(state.isActive("/blog/")).toBe(true);
    expect(state.isActive("/blog/post")).toBe(true);
    expect(state.isActive("/blo")).toBe(false);
    expect(state.isActive("/blog/post/comments")).toBe(false);
    at("/blogger");
    expect(state.isActive("/blog")).toBe(false);
  });

  it("treats / and exact as exact matches", () => {
    at("/about");
    expect(state.isActive("/")).toBe(false);
    at("/");
    expect(state.isActive("/")).toBe(true);
    at("/blog/post");
    expect(state.isActive("/blog", true)).toBe(false);
    expect(state.isActive("/blog/post", true)).toBe(true);
  });

  it("ignores search, hash and trailing slashes, and resolves relative hrefs", () => {
    at("/blog/post/?q=1#top");
    expect(state.isActive("/blog/post?x=2", true)).toBe(true);
    expect(state.isActive("http://localhost/blog")).toBe(true);
    // Relative hrefs resolve like links do: against the current URL.
    expect(state.isActive("post", true)).toBe(false); // → /blog/post/post
    at("/blog/post?q=1");
    expect(state.isActive("post", true)).toBe(true);
    expect(state.isActive("../about")).toBe(false);
  });
});

