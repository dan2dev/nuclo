import { describe, it, expect, afterEach, vi } from "vitest";
import "nuclo";
import { createRouter, type PageComponent, type Route } from "../src/index";
import { App, click, deferred, flush, mount, useRouterEnv } from "./helpers";

// Registered before useRouterEnv() so it runs after the routes are stopped:
// stop() still needs cancelIdleCallback.
afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as Record<string, unknown>).requestIdleCallback;
  delete (globalThis as Record<string, unknown>).cancelIdleCallback;
});

const routes = useRouterEnv();

async function start(router: { start(url?: string): Promise<Route> }, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

const Home: PageComponent = () => into("main", div({ id: "home" }, "home"));
const About: PageComponent = () => into("main", div({ id: "about" }, "about"));

function link(attrs: Record<string, string>, child?: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  for (const [key, value] of Object.entries(attrs)) anchor.setAttribute(key, value);
  if (child) anchor.innerHTML = child;
  document.body.appendChild(anchor);
  return anchor;
}

function basicRouter() {
  return createRouter({ "/": () => Home, "/about": () => About });
}

describe("link clicks", () => {
  it("navigates a plain internal link", async () => {
    const route = await start(basicRouter(), "/");
    const container = mount();
    render(App, container);

    expect(click(link({ href: "/about" }))).toBe(true);
    await flush();

    expect(route.path).toBe("/about");
    expect(window.location.pathname).toBe("/about");
    expect(container.querySelector("#about")).not.toBeNull();
  });

  it("navigates from a nested element inside the link", async () => {
    const route = await start(basicRouter(), "/");
    const anchor = link({ href: "/about" }, "<span><b id='deep'>go</b></span>");

    expect(click(anchor.querySelector("#deep")!)).toBe(true);
    await flush();
    expect(route.path).toBe("/about");
  });

  it("keeps the query and hash", async () => {
    const route = await start(basicRouter(), "/");
    click(link({ href: "/about?a=1#b" }));
    await flush();

    expect(route.path).toBe("/about");
    expect(route.search.get("a")).toBe("1");
    expect(route.hash).toBe("#b");
  });

  it("resolves a relative href against the current URL", async () => {
    const router = createRouter({ "/": () => Home, "/about": () => About });
    const route = await start(router, "/");
    click(link({ href: "about" }));
    await flush();
    expect(route.path).toBe("/about");
  });

  for (const [name, init] of [
    ["meta", { metaKey: true }],
    ["ctrl", { ctrlKey: true }],
    ["shift", { shiftKey: true }],
    ["alt", { altKey: true }],
    ["middle button", { button: 1 }],
  ] as const) {
    it(`ignores a ${name} click`, async () => {
      const route = await start(basicRouter(), "/");
      expect(click(link({ href: "/about" }), init)).toBe(false);
      await flush();
      expect(route.path).toBe("/");
    });
  }

  it("ignores an already-prevented event", async () => {
    const route = await start(basicRouter(), "/");
    const anchor = link({ href: "/about" });
    // A capture listener that cancels first mimics an app handler winning.
    const cancel = (event: Event): void => event.preventDefault();
    document.addEventListener("click", cancel, true);
    try {
      click(anchor);
    } finally {
      document.removeEventListener("click", cancel, true);
    }
    await flush();
    expect(route.path).toBe("/");
  });

  for (const [name, attrs] of [
    ["an external origin", { href: "https://example.com/about" }],
    ["target=_blank", { href: "/about", target: "_blank" }],
    ["a download link", { href: "/about", download: "" }],
    ['rel="external"', { href: "/about", rel: "noopener external" }],
    ["an opted-out link", { href: "/about", "data-nuclo-router": "off" }],
    ["a bare hash link", { href: "#section" }],
  ] as const) {
    it(`ignores ${name}`, async () => {
      const route = await start(basicRouter(), "/");
      expect(click(link(attrs as Record<string, string>))).toBe(false);
      await flush();
      expect(route.path).toBe("/");
    });
  }

  it("ignores target=_self as a normal link", async () => {
    const route = await start(basicRouter(), "/");
    expect(click(link({ href: "/about", target: "_self" }))).toBe(true);
    await flush();
    expect(route.path).toBe("/about");
  });

  it("ignores a link with no href", async () => {
    const route = await start(basicRouter(), "/");
    expect(click(link({}))).toBe(false);
    await flush();
    expect(route.path).toBe("/");
  });

  it("ignores a click with no anchor in its ancestry", async () => {
    const route = await start(basicRouter(), "/");
    const loose = document.createElement("div");
    document.body.appendChild(loose);
    expect(click(loose)).toBe(false);
    expect(route.path).toBe("/");
  });

  it("lets the browser handle a path no route owns", async () => {
    const route = await start(createRouter({ "/": () => Home }), "/");
    expect(click(link({ href: "/unknown" }))).toBe(false);
    await flush();
    expect(route.path).toBe("/");
  });

  it("lets the browser handle a link outside the base", async () => {
    const router = createRouter({ "*": () => Home }, { base: "/docs" });
    const route = await start(router, "/docs");
    expect(click(link({ href: "/outside" }))).toBe(false);
    await flush();
    expect(route.path).toBe("/");
  });

  it("leaves a hash-only link on the same page to the browser", async () => {
    window.history.replaceState(null, "", "/about");
    const route = await start(basicRouter());
    // Same pathname and query: native hash scrolling and history beat ours.
    expect(click(link({ href: "/about#section" }))).toBe(false);
    expect(route.path).toBe("/about");
  });

  it("swallows a click on the exact current URL", async () => {
    window.history.replaceState(null, "", "/about?x=1");
    const route = await start(basicRouter());
    // The browser's only default left here is a full page reload.
    expect(click(link({ href: "/about?x=1" }))).toBe(true);
    await flush();
    expect(route.path).toBe("/about");
    expect(window.location.pathname + window.location.search).toBe("/about?x=1");
  });

  it("drops a fragment when the link to the same page has none", async () => {
    window.history.replaceState(null, "", "/about#section");
    const route = await start(basicRouter());
    expect(click(link({ href: "/about" }))).toBe(true);
    await flush();
    expect(route.path).toBe("/about");
    expect(window.location.hash).toBe("");
  });

  it("ignores an unparseable href", async () => {
    const route = await start(basicRouter(), "/");
    expect(click(link({ href: "http://[" }))).toBe(false);
    await flush();
    expect(route.path).toBe("/");
  });

  it("works for an SVG <a>, which has no string href", async () => {
    const route = await start(basicRouter(), "/");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const anchor = document.createElementNS("http://www.w3.org/2000/svg", "a");
    anchor.setAttribute("href", "/about");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    anchor.appendChild(rect);
    svg.appendChild(anchor);
    document.body.appendChild(svg);

    expect(click(rect)).toBe(true);
    await flush();
    expect(route.path).toBe("/about");
  });
});

describe("popstate", () => {
  it("renders the entry the browser went back to", async () => {
    const route = await start(basicRouter(), "/");
    const container = mount();
    render(App, container);

    await route.go("/about");
    expect(route.path).toBe("/about");

    window.history.replaceState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();

    expect(route.path).toBe("/");
    expect(container.querySelector("#home")).not.toBeNull();
  });

  it("does not reset the scroll — the browser restores it", async () => {
    const route = await start(basicRouter(), "/");
    await route.go("/about");
    (window.scrollTo as unknown as ReturnType<typeof vi.fn>).mockClear();

    window.history.replaceState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("reports an error for a history entry no route owns", async () => {
    const route = await start(createRouter({ "/": () => Home }), "/");

    window.history.replaceState(null, "", "/foreign");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();

    expect(route.error?.message).toMatch(/no route matches/);
    expect(route.path).toBe("/");
  });

  it("abandons an in-flight load when the history leaves the app", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/slow": () => gate.promise });
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    const navigation = route.go("/slow");
    expect(route.pending).toBe(true);

    window.history.replaceState(null, "", "/foreign");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();
    expect(route.pending).toBe(false);
    expect(route.error?.message).toMatch(/no route matches/);

    gate.resolve({ default: About });
    await navigation;

    // The overtaken page must not land on a URL the app does not own.
    expect(route.path).toBe("/");
    expect(container.querySelector("#about")).toBeNull();
  });
});

describe("stop()", () => {
  it("detaches the click and popstate listeners", async () => {
    const route = await start(basicRouter(), "/");
    route.stop();

    expect(click(link({ href: "/about" }))).toBe(false);
    window.history.replaceState(null, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();

    expect(route.path).toBe("/");
  });

  it("is idempotent", async () => {
    const route = await start(basicRouter(), "/");
    route.stop();
    expect(() => route.stop()).not.toThrow();
  });

  it("ignores a go() call made after it", async () => {
    const route = await start(basicRouter(), "/");
    route.stop();
    await route.go("/about");
    expect(route.path).toBe("/");
  });

  it("drops a load that was already in flight", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/about": () => gate.promise });
    const route = await start(router, "/");
    const container = mount();
    render(App, container);

    const promise = route.go("/about");
    expect(route.pending).toBe(true);

    route.stop();
    // stop() also clears pending: the Route is retired, not loading.
    expect(route.pending).toBe(false);
    gate.resolve({ default: About });
    await promise;

    expect(route.path).toBe("/");
    expect(container.querySelector("#about")).toBeNull();
  });

  it("stays silent about a chunk that fails after it", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const gate = deferred<{ default: PageComponent }>();
    const router = createRouter({ "/": () => Home, "/about": () => gate.promise });
    const route = await start(router, "/");

    const promise = route.go("/about");
    route.stop();
    gate.reject(new Error("too late"));
    await promise;

    // A retired Route neither reports nor logs the failure — and it stops
    // claiming to be loading, so an app's pending spinner is not stranded.
    expect(route.error).toBeNull();
    expect(route.pending).toBe(false);
    expect(logged).not.toHaveBeenCalled();
  });

  it("freezes hash and url at the last known values", async () => {
    const route = await start(basicRouter(), "/about?x=1#y");
    route.stop();
    window.history.replaceState(null, "", "/elsewhere");

    expect(route.hash).toBe("#y");
    expect(route.url).toBe("/about?x=1#y");
  });
});

describe("a second start() retires the first Route", () => {
  it("leaves only the newest Route listening", async () => {
    const router = basicRouter();
    const first = await start(router, "/");
    const second = await start(router, "/");

    click(link({ href: "/about" }));
    await flush();

    expect(second.path).toBe("/about");
    // The retired Route was stopped: it never saw the click.
    expect(first.path).toBe("/");
  });
});

describe("idle preloading", () => {
  it("loads the remaining routes once the page is idle", async () => {
    vi.useFakeTimers();
    const loaded: string[] = [];
    const router = createRouter({
      "/": () => Home,
      "/a": () => {
        loaded.push("a");
        return Promise.resolve({ default: About });
      },
      "/b": () => {
        loaded.push("b");
        return Promise.resolve({ default: About });
      },
    });
    const route = await router.start("/");
    routes.push(route);

    expect(loaded).toEqual([]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(loaded).toEqual(["a", "b"]);

    // Preloaded routes then navigate without an async gap.
    const promise = route.go("/a");
    expect(route.path).toBe("/a");
    expect(route.pending).toBe(false);
    await promise;
  });

  it("uses requestIdleCallback when the browser has one", async () => {
    const queued: Array<() => void> = [];
    (globalThis as Record<string, unknown>).requestIdleCallback = (fn: () => void) => {
      queued.push(fn);
      return queued.length;
    };
    (globalThis as Record<string, unknown>).cancelIdleCallback = vi.fn();

    let loadedA = false;
    const router = createRouter({
      "/": () => Home,
      "/a": () => {
        loadedA = true;
        return About;
      },
    });
    const route = await start(router, "/");

    expect(queued.length).toBe(1);
    queued.shift()!();
    expect(loadedA).toBe(true);

    route.stop();
    expect(globalThis.cancelIdleCallback).toHaveBeenCalled();
  });

  it("can be turned off", async () => {
    vi.useFakeTimers();
    let loaded = false;
    const router = createRouter(
      {
        "/": () => Home,
        "/a": () => {
          loaded = true;
          return About;
        },
      },
      { preload: false },
    );
    routes.push(await router.start("/"));

    await vi.advanceTimersByTimeAsync(2000);
    expect(loaded).toBe(false);
  });

  it("waits while the user is waiting for a navigation", async () => {
    vi.useFakeTimers();
    const gate = deferred<{ default: PageComponent }>();
    let preloaded = false;
    const router = createRouter({
      "/": () => Home,
      "/slow": () => gate.promise,
      "/later": () => {
        preloaded = true;
        return About;
      },
    });
    const route = await router.start("/");
    routes.push(route);

    const navigation = route.go("/slow");
    await vi.advanceTimersByTimeAsync(1000);
    // A pending navigation defers the preloader rather than competing with it.
    expect(preloaded).toBe(false);

    gate.resolve({ default: About });
    await navigation;
    await vi.advanceTimersByTimeAsync(1000);
    expect(preloaded).toBe(true);
  });

  it("skips a route that is already cached and keeps going past a failure", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    let homeCalls = 0;
    let lastLoaded = false;
    const router = createRouter({
      "/": () => {
        homeCalls++;
        return Home;
      },
      "/broken": () => Promise.reject(new Error("no chunk")),
      "/throws": () => {
        throw new Error("sync boom");
      },
      "/last": () => {
        lastLoaded = true;
        return About;
      },
    });
    routes.push(await router.start("/"));

    await vi.advanceTimersByTimeAsync(2000);
    expect(homeCalls).toBe(1);
    expect(lastLoaded).toBe(true);
  });

  it("stops preloading when the Route is stopped", async () => {
    vi.useFakeTimers();
    let loaded = false;
    const router = createRouter({
      "/": () => Home,
      "/a": () => {
        loaded = true;
        return About;
      },
    });
    const route = await router.start("/");
    route.stop();

    await vi.advanceTimersByTimeAsync(2000);
    expect(loaded).toBe(false);
  });
});
