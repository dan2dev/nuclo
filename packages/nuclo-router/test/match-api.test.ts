/**
 * router.match() — resolving a URL without loading anything.
 *
 * The point of this API is what it does NOT do: no import, no history, no
 * listeners, no Route. That is what makes it usable on a server before
 * deciding a status code.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, type PageComponent, type RouteTable } from "../src/index";
import { useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => div("home");
const Post: PageComponent = () => div("post");

function table(): RouteTable {
  return {
    "/": () => Home,
    "/blog/new": () => Home,
    "/blog/:slug": () => Post,
    "/files/*rest": () => Post,
  };
}

describe("match()", () => {
  it("returns the same context a navigation would produce", () => {
    const router = createRouter(table());
    const hit = router.match("/blog/hello?draft=1#notes")!;

    expect(hit.path).toBe("/blog/hello");
    expect(hit.pattern).toBe("/blog/:slug");
    expect(hit.params.slug).toBe("hello");
    expect(hit.search.get("draft")).toBe("1");
    expect(hit.hash).toBe("#notes");
    expect(hit.url).toBe("/blog/hello?draft=1#notes");
  });

  it("applies the full precedence and normalization rules", () => {
    const router = createRouter(table());
    expect(router.match("/blog/new")!.pattern).toBe("/blog/new");
    expect(router.match("/blog//hello//")!.path).toBe("/blog/hello");
    expect(router.match("/blog/caf%C3%A9")!.params.slug).toBe("café");
    expect(router.match("/files/a/b.txt")!.params.rest).toBe("a/b.txt");
  });

  it("returns null instead of throwing when nothing matches", () => {
    const router = createRouter(table());
    expect(router.match("/nope")).toBeNull();
    expect(router.match("/blog/a/b/c")).toBeNull();
  });

  it("returns null for a URL outside base, at a segment boundary", () => {
    const router = createRouter({ "/": () => Home, "/intro": () => Home }, { base: "/docs" });
    expect(router.match("/docs")!.path).toBe("/");
    expect(router.match("/docs/intro")!.path).toBe("/intro");
    // Not a segment boundary — not ours.
    expect(router.match("/docsearch")).toBeNull();
    expect(router.match("/elsewhere")).toBeNull();
  });

  it("returns null for an unparseable URL", () => {
    expect(createRouter(table()).match("http://[")).toBeNull();
  });

  it("treats a leading '//' as protocol-relative, not a duplicate slash", () => {
    // "//blog/hello" is another HOST, not a path — standard URL parsing, and
    // the same reason a click on href="//evil.com" is left to the browser.
    expect(createRouter(table()).match("//blog/hello")).toBeNull();
  });

  it("accepts an absolute URL and defaults to the current location", () => {
    window.history.replaceState(null, "", "/blog/from-location");
    const router = createRouter(table());
    expect(router.match(`${window.location.origin}/blog/abs`)!.params.slug).toBe("abs");
    // Another site is not ours, whatever its path.
    expect(router.match("https://example.com/blog/abs")).toBeNull();
    expect(router.match()!.params.slug).toBe("from-location");
  });

  it("loads nothing, touches no history and attaches no listeners", () => {
    let loaderCalls = 0;
    const added: string[] = [];
    vi.spyOn(document, "addEventListener").mockImplementation(((t: string) => void added.push(t)) as never);
    vi.spyOn(window, "addEventListener").mockImplementation(((t: string) => void added.push(t)) as never);
    const pushState = vi.spyOn(window.history, "pushState");

    const router = createRouter({
      "/blog/:slug": () => {
        loaderCalls++;
        return Post;
      },
    });

    expect(router.match("/blog/a")).not.toBeNull();
    expect(router.match("/blog/b")).not.toBeNull();

    expect(loaderCalls).toBe(0);
    expect(added).toEqual([]);
    expect(pushState).not.toHaveBeenCalled();
  });

  it("works on a router that is never started, and does not disturb one that is", async () => {
    const router = createRouter(table());
    const route = await router.start("/");
    routes.push(route);

    expect(router.match("/blog/x")!.pattern).toBe("/blog/:slug");
    // The live Route is untouched by a match().
    expect(route.path).toBe("/");
    expect(route.pending).toBe(false);
  });
});
