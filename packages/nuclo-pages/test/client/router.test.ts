import { update } from "nuclo";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { start } from "../../src/client/router";
import { error, navigate, redirect, route } from "../../src/index";
import { createRedirect } from "../../src/shared/errors";
import type { RouteModule } from "../../src/shared/types";
import { createApp, deferred } from "../helpers";

/**
 * One app, server-rendered by the real handler, hydrated by the real router.
 * The tests share the page and run in order, like a user clicking around.
 */

const loads: Record<string, number> = {};
const count = (name: string) => void (loads[name] = (loads[name] ?? 0) + 1);
const destroyed: string[] = [];
let gate: Promise<void> | undefined;

const files: Record<string, RouteModule> = {
  "_layout.ts": {
    load: () => (count("root"), { user: "ana" }),
    head: () => ({ title: "Site", meta: { description: "site" } }),
    default: ({ data, children }) =>
      div(
        { id: "shell" },
        nav(
          a({ id: "home-link", href: "/" }, "Home"),
          a({ id: "blog-link", href: "/blog/first" }, "Blog"),
          span({ id: "path" }, () => route.url.pathname),
          span({ id: "pending" }, () => String(route.pending)),
        ),
        span({ id: "user" }, data.user),
        main(children),
      ),
  },
  "_error.ts": { default: ({ status, message }) => h1({ id: "error" }, `${status} ${message}`) },
  "index.ts": { default: () => h1({ id: "title" }, "Home") },
  "about.ts": {
    default: () => {
      const state = { clicks: 0 };
      return div(h1({ id: "title" }, "About"), button({ id: "inc", onClick: () => (state.clicks++, update()) }, () => String(state.clicks)));
    },
  },
  "lazy.ts": { default: () => h1({ id: "title" }, "Lazy") },
  "blog/_layout.ts": {
    load: () => (count("blog-layout"), null),
    default: ({ children }) => section({ id: "blog" }, on("destroy", () => destroyed.push("blog-layout")), children),
  },
  "blog/[slug].ts": {
    load: async ({ params, url }: { params: { slug: string }; url: URL }) => {
      count(`post:${params.slug}`);
      if (params.slug === "slow") await gate;
      return { slug: params.slug, q: url.searchParams.get("q") };
    },
    head: ({ data }: { data: { slug: string } }) => ({ title: `Post ${data.slug}`, meta: { description: data.slug } }),
    default: ({ data }) =>
      article({ id: "post" }, on("destroy", () => destroyed.push(`post:${data.slug}`)), h1({ id: "title" }, data.slug), p({ id: "q" }, String(data.q))),
  },
  "org/[org]/_layout.ts": {
    load: ({ params }: { params: object }) => (count(`org:${JSON.stringify(params)}`), (params as { org: string }).org),
    default: ({ data, children }) => section({ id: "org" }, span({ id: "org-name" }, data), children),
  },
  "org/[org]/[id].ts": { default: ({ params }) => h1({ id: "title" }, `${params.org}/${params.id}`) },
  "redirect.ts": { load: () => redirect("/about"), default: () => p("never") },
  "loop.ts": { load: () => redirect("/loop"), default: () => p("never") },
  "teapot.ts": { load: () => error(418, "I'm a teapot"), default: () => p("never") },
  "api/data.ts": { GET: () => Response.json({}) },
};

const { request, scan, modules } = createApp(files);
const $ = (id: string) => document.getElementById(id);
const title = () => $("title")?.textContent;
const click = (target: Element, init: MouseEventInit = {}) =>
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
const link = (href: string, attrs: Record<string, string> = {}) => {
  const a = document.createElement("a");
  a.setAttribute("href", href);
  for (const [name, value] of Object.entries(attrs)) a.setAttribute(name, value);
  a.textContent = href;
  document.body.append(a);
  return a;
};
/** jsdom can't load documents: each full navigation reports "Not implemented: navigation…". */
let fullLoads = 0;
const virtualConsole = (globalThis as unknown as { jsdom: { virtualConsole: import("node:events").EventEmitter } }).jsdom.virtualConsole;
virtualConsole.removeAllListeners("jsdomError");
virtualConsole.on("jsdomError", (e: Error) => {
  if (/^Not implemented: navigation/.test(e.message)) fullLoads++;
});

let scrollTo: ReturnType<typeof vi.fn>;
let ssrShell: HTMLElement | null;

beforeAll(async () => {
  scrollTo = vi.fn();
  window.scrollTo = scrollTo as never;
  const html = await (await request("/")).text();
  document.head.innerHTML = /<head>([\s\S]*)<\/head>/.exec(html)![1];
  document.body.innerHTML = /<body>([\s\S]*)<\/body>/.exec(html)![1];
  history.replaceState(null, "", "/");
  ssrShell = $("shell");
  await start({ modules, routes: scan.routes, root: scan.root, dev: true });
});

afterEach(() => vi.restoreAllMocks());

describe("hydration", () => {
  it("adopts the server-rendered DOM instead of re-creating it", () => {
    expect($("shell")).toBe(ssrShell);
    expect(document.querySelectorAll("#shell")).toHaveLength(1);
    expect(document.getElementById("app")!.children).toHaveLength(1);
    expect(title()).toBe("Home");
    expect($("path")!.textContent).toBe("/");
    expect($("user")!.textContent).toBe("ana");
    expect(route).toMatchObject({ id: "/", params: {}, pending: false });
  });

  it("does not run loads again on the client", () => {
    expect(loads.root).toBe(1); // the server's
  });
});

describe("navigation", () => {
  it("follows link clicks client-side, keeping the root layout", async () => {
    const before = history.length;
    expect(click($("blog-link")!)).toBe(false); // default prevented
    await vi.waitFor(() => expect(title()).toBe("first"));
    expect(location.pathname).toBe("/blog/first");
    expect(history.length).toBe(before + 1);
    expect($("shell")).toBe(ssrShell);
    expect(loads).toMatchObject({ root: 1, "blog-layout": 1, "post:first": 1 });
    expect($("path")!.textContent).toBe("/blog/first");
    expect(route).toMatchObject({ id: "/blog/[slug]", params: { slug: "first" }, pending: false });
    expect(document.title).toBe("Post first");
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toBe("first");
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("keeps a layout whose params didn't change and destroys only the page", async () => {
    const blog = $("blog");
    await navigate("/blog/second");
    expect(title()).toBe("second");
    expect($("blog")).toBe(blog);
    expect(loads["blog-layout"]).toBe(1);
    expect(destroyed).toEqual(["post:first"]);
  });

  it("re-runs a page's load when its search changes, not for the same URL", async () => {
    await navigate("/blog/second?q=1");
    expect($("q")!.textContent).toBe("1");
    expect(loads["post:second"]).toBe(2);
    await navigate("/blog/second?q=1");
    expect(loads["post:second"]).toBe(2);
  });

  it("keeps a page without load across search changes", async () => {
    await navigate("/about");
    expect(destroyed).toContain("blog-layout");
    click($("inc")!);
    expect($("inc")!.textContent).toBe("1");
    await navigate("/about?tab=2");
    expect($("inc")!.textContent).toBe("1");
    expect(route.url.search).toBe("?tab=2");
    expect(location.search).toBe("?tab=2");
  });

  it("remounts a layout when a param it consumes changes, passing only its params", async () => {
    await navigate("/org/acme/1");
    const org = $("org");
    expect(loads['org:{"org":"acme"}']).toBe(1);
    await navigate("/org/acme/2");
    expect(title()).toBe("acme/2");
    expect($("org")).toBe(org);
    expect(loads['org:{"org":"acme"}']).toBe(1);
    await navigate("/org/beta/1");
    expect(title()).toBe("beta/1");
    expect($("org")).not.toBe(org);
    expect($("org-name")!.textContent).toBe("beta");
    expect(loads['org:{"org":"beta"}']).toBe(1);
  });

  it("sets route.pending while loading", async () => {
    const release = deferred();
    gate = release.promise;
    const navigation = navigate("/blog/slow");
    await vi.waitFor(() => expect(route.pending).toBe(true));
    expect($("pending")!.textContent).toBe("true");
    release.resolve();
    await navigation;
    expect(route.pending).toBe(false);
    expect($("pending")!.textContent).toBe("false");
    expect(title()).toBe("slow");
  });

  it("drops a navigation overtaken by a newer one", async () => {
    await navigate("/");
    const release = deferred();
    gate = release.promise;
    const slow = navigate("/blog/slow");
    await navigate("/about");
    release.resolve();
    await slow;
    expect(title()).toBe("About");
    expect(location.pathname).toBe("/about");
  });

  it("replaces history only when asked", async () => {
    const before = history.length;
    await navigate("/", { replace: true });
    expect(history.length).toBe(before);
    expect(title()).toBe("Home");
  });

  it("follows a load's redirect as the original navigation", async () => {
    const before = history.length;
    await navigate("/redirect");
    expect(location.pathname).toBe("/about");
    expect(title()).toBe("About");
    expect(history.length).toBe(before + 1);
  });

  it("stops redirect loops", async () => {
    await expect(navigate("/loop")).rejects.toThrow("Too many redirects");
    expect(route.pending).toBe(false);
  });

  it("renders the nearest error view when a load fails, and recovers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await navigate("/teapot");
    expect($("error")!.textContent).toBe("418 I'm a teapot");
    expect($("shell")).toBe(ssrShell);
    expect(location.pathname).toBe("/teapot");
    expect(route.id).toBe("/teapot");
    await navigate("/");
    expect($("error")).toBeNull();
    expect(title()).toBe("Home");
  });

  it("falls back to a full page load when a route chunk fails to load", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const index = scan.modules.findIndex((m) => m.file.endsWith("/lazy.ts"));
    const original = modules[index];
    modules[index] = () => Promise.reject(new Error("chunk failed"));
    const before = fullLoads;
    await navigate("/lazy");
    expect(fullLoads - before).toBe(1);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ message: "chunk failed" }));
    expect(title()).toBe("Home");
    // The failed import isn't cached: the next navigation retries it.
    modules[index] = original;
    await navigate("/lazy");
    expect(title()).toBe("Lazy");
  });
});

describe("links", () => {
  it("leaves API routes, unknown URLs and other origins to the browser", async () => {
    await navigate("/");
    const before = fullLoads;
    await navigate("/api/data");
    await navigate("/does/not/exist");
    await navigate("https://example.com/");
    expect(fullLoads - before).toBe(3);
    expect(title()).toBe("Home");
  });

  it("does not intercept modified clicks, other buttons or special links", () => {
    const plain = link("/about");
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      expect(click(plain, init)).toBe(true);
    }
    for (const attrs of [{ target: "_blank" }, { download: "" }, { rel: "noopener external" }, { "data-reload": "" }]) {
      expect(click(link("/about", attrs))).toBe(true);
    }
    expect(click(link("https://example.com/about"))).toBe(true);
    expect(click(link("#section"))).toBe(true); // same-page anchor
    expect(title()).toBe("Home");
  });

  it("respects links whose click was already handled", async () => {
    const handled = link("/about");
    handled.addEventListener("click", (event) => event.preventDefault());
    click(handled);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(title()).toBe("Home");
  });

  it("follows clicks on elements inside a link", async () => {
    const outer = link("/about");
    const inner = document.createElement("span");
    outer.append(inner);
    expect(click(inner)).toBe(false);
    await vi.waitFor(() => expect(title()).toBe("About"));
  });
});

describe("history", () => {
  it("restores the scroll position on back and forward", async () => {
    await navigate("/");
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
    await navigate("/about");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    scrollTo.mockClear();
    history.back();
    await vi.waitFor(() => expect(title()).toBe("Home"));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 300);
    history.forward();
    await vi.waitFor(() => expect(title()).toBe("About"));
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
  });

  it("treats same-page #hash entries as no navigation", async () => {
    const before = loads["post:hash"] ?? 0;
    await navigate("/blog/hash");
    location.hash = "part";
    await vi.waitFor(() => expect(route.url.hash).toBe("#part"));
    history.back();
    await vi.waitFor(() => expect(route.url.hash).toBe(""));
    expect(loads["post:hash"]).toBe(before + 1);
    expect(title()).toBe("hash");
  });
});

describe("prefetch", () => {
  it("loads a hovered link's page and reuses the data on click", async () => {
    await navigate("/");
    const hovered = link("/blog/hover");
    hovered.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    await vi.waitFor(() => expect(loads["post:hover"]).toBe(1));
    hovered.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    click(hovered);
    await vi.waitFor(() => expect(title()).toBe("hover"));
    expect(loads["post:hover"]).toBe(1);
  });

  it("prefetches on focus too", async () => {
    await navigate("/");
    link("/blog/focus").dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await vi.waitFor(() => expect(loads["post:focus"]).toBe(1));
  });

  it("discards prefetched data after 10 seconds", async () => {
    await navigate("/");
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    link("/blog/stale").dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    await vi.waitFor(() => expect(loads["post:stale"]).toBe(1));
    clock.mockReturnValue(now + 10_001);
    await navigate("/blog/stale");
    expect(loads["post:stale"]).toBe(2);
  });

  it("ignores links to the current page and to API routes", async () => {
    await navigate("/");
    const before = { ...loads };
    link("/").dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    link("/api/data").dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(loads).toEqual(before);
  });
});

describe("server function redirects", () => {
  it("navigates when a redirect rejects unhandled (e.g. from an event handler)", async () => {
    await navigate("/");
    const event = Object.assign(new Event("unhandledrejection", { cancelable: true }), { reason: createRedirect("/about") });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(title()).toBe("About"));
  });

  it("ignores other unhandled rejections", async () => {
    const event = Object.assign(new Event("unhandledrejection", { cancelable: true }), { reason: new Error("x") });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
