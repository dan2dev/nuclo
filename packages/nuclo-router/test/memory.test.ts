/**
 * Real garbage-collection tests (--expose-gc, see vitest.config.ts).
 * A stubbed WeakRef "dies" even while something still holds its target, so
 * only a forced GC proves the router retains nothing.
 *
 * TWO TRAPS, both of which produce perfect false-positive "leaks":
 *
 * 1. Every strong reference a test touches must live in a call frame that has
 *    already popped. A local — or even an unnamed temporary like
 *    `new WeakRef(container.children[0])` — in the *still-running* test
 *    function is a GC root in V8, so the object under test survives and looks
 *    retained. Hence the `capture*()` helpers below: each does all the strong-
 *    reference work and returns only WeakRefs. The giveaway when this is
 *    wrong is that exactly the last-captured object of a loop survives.
 *
 * 2. Never capture a node via querySelector(). jsdom caches matched nodes on
 *    the Document, which is a real GC root for the file's lifetime. Take nodes
 *    from render()'s return value or from children/childNodes.
 *
 * 3. jsdom's history.pushState()/replaceState() retain every node attached at
 *    the moment they are called — verified with a bare document.createElement()
 *    div and no nuclo code at all, so it is purely a jsdom artifact. Since
 *    navigating necessarily mutates history, any GC assertion about a page the
 *    router navigated away from must run with history stubbed
 *    (withoutJsdomHistory below); otherwise jsdom, not the router, is what
 *    holds the node. The router's real history calls are asserted in
 *    router.test.ts / navigation.test.ts instead.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, type PageComponent, type Route, type Router } from "../src/index";
import { App, deferred, flush, mount, useRouterEnv } from "./helpers";

useRouterEnv();

const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    globalThis.gc!();
    // Yield a macrotask so FinalizationRegistry callbacks run too.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * Runs `fn` with jsdom's history mutators replaced by no-ops. See trap 3
 * above: they are GC roots for every attached node, which would mask what the
 * router itself retains. Nothing the router does during a navigation reads
 * back from the history stack.
 */
async function withoutJsdomHistory<T>(fn: () => Promise<T>): Promise<T> {
  const { pushState, replaceState } = window.history;
  window.history.pushState = () => {};
  window.history.replaceState = () => {};
  try {
    return await fn();
  } finally {
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
  }
}

function alive(refs: readonly WeakRef<object>[]): number {
  let count = 0;
  for (const ref of refs) if (ref.deref() !== undefined) count++;
  return count;
}

const Home: PageComponent = () => div({ id: "home" }, "home");

/** The last data object a loader page was handed, for GC tracking. */
let seenData: object | undefined;
const About: PageComponent = () => div({ id: "about" }, "about");

function table() {
  return { "/": () => Home, "/about": () => About };
}

/** Mounts a Route's view, then drops every strong reference to it. */
async function captureMountAndDrop(): Promise<WeakRef<object>[]> {
  const router = createRouter(table(), { preload: false });
  const route = await router.start("/");
  const container = mount();
  const rendered = render(App(router), container) as unknown as Node;

  const refs: WeakRef<object>[] = [
    new WeakRef(route),
    new WeakRef(container),
    new WeakRef(rendered),
  ];
  // The outlet's markers and the page between them.
  for (let i = 0; i < rendered.childNodes.length; i++) {
    refs.push(new WeakRef(rendered.childNodes[i]));
  }
  expect(refs.length).toBe(6);

  route.stop();
  container.remove();
  return refs;
}

/** Mounts a view and keeps the Route alive — only the DOM is dropped. */
async function captureTreeKeepingRoute(): Promise<{ route: Route; refs: WeakRef<Node>[] }> {
  const router = createRouter(table(), { preload: false });
  const route = await router.start("/");
  const container = mount();
  const rendered = render(App(router), container) as unknown as Node;

  // The outlet's markers and the page between them.
  const refs: WeakRef<Node>[] = [new WeakRef(container), new WeakRef(rendered)];
  for (let i = 0; i < rendered.childNodes.length; i++) {
    refs.push(new WeakRef(rendered.childNodes[i]));
  }
  expect(refs.length).toBe(5);
  container.remove();
  return { route, refs };
}

describe("Route collectability", () => {
  itGc("a stopped Route is collected once the app drops it and its router", async () => {
    async function capture(): Promise<WeakRef<Route>> {
      const router = createRouter(table(), { preload: false });
      const route = await router.start("/");
      route.stop();
      return new WeakRef(route);
    }

    const ref = await capture();
    await collectGarbage();
    expect(ref.deref()).toBeUndefined();
  });

  itGc("a Route is collected together with the tree it rendered", async () => {
    const refs = await captureMountAndDrop();
    await collectGarbage();
    expect(alive(refs)).toBe(0);
  });

  itGc("the rendered tree is collectible even when stop() is never called", async () => {
    // The Route stays alive (it is still listening), and its page's view still
    // stands in the router's mount — this proves the view holds the region it
    // was placed in only weakly, and the Route no DOM of its own: only the
    // page function and its context.
    const { route, refs } = await captureTreeKeepingRoute();
    try {
      await collectGarbage();
      expect(alive(refs)).toBe(0);
    } finally {
      // A live Route left behind would hand its page to the next test's region.
      route.stop();
    }
  });
});

describe("navigation does not accumulate", () => {
  itGc("the page left behind is collected", async () => {
    async function capture(): Promise<{ route: Route; rows: number; outgoing: WeakRef<Element> }> {
      const router = createRouter(table(), { preload: false });
      const route = await router.start("/");
      const app = render(App(router), mount()) as unknown as Element;

      // From children, never querySelector.
      const outgoing = new WeakRef(app.children[0]);
      await route.go("/about");
      return { route, rows: app.children.length, outgoing };
    }

    const { route, rows, outgoing } = await withoutJsdomHistory(capture);
    expect(rows).toBe(1);

    await collectGarbage();
    expect(outgoing.deref()).toBeUndefined();
    route.stop();
  });

  itGc("every page of a long navigation run is collected", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<Element>[]; maxRows: number }> {
      const Page: PageComponent = (ctx) => div({ id: `p${ctx.params.n}` }, ctx.params.n);
      const router = createRouter({ "/p/:n": () => Page }, { preload: false });
      const route = await router.start("/p/0");
      const app = render(App(router), mount()) as unknown as Element;

      const refs: WeakRef<Element>[] = [];
      let maxRows = 0;
      for (let i = 1; i <= 50; i++) {
        refs.push(new WeakRef(app.children[0]));
        await route.go(`/p/${i}`);
        // One row at a time: the slot never grows.
        if (app.children.length > maxRows) maxRows = app.children.length;
      }
      return { route, refs, maxRows };
    }

    const { route, refs, maxRows } = await withoutJsdomHistory(capture);
    expect(maxRows).toBe(1);

    await collectGarbage();
    expect(alive(refs)).toBe(0);
    route.stop();
  });

  it("imports each route's module exactly once across many navigations", async () => {
    const calls: Record<string, number> = { home: 0, about: 0 };
    const router = createRouter(
      {
        "/": () => {
          calls.home++;
          return Promise.resolve({ default: Home });
        },
        "/about": () => {
          calls.about++;
          return Promise.resolve({ default: About });
        },
      },
      { preload: false },
    );
    const route = await router.start("/");

    for (let i = 0; i < 25; i++) {
      await route.go("/about");
      await route.go("/");
    }

    // The cache is bounded by the number of routes, not the number of navigations.
    expect(calls).toEqual({ home: 1, about: 1 });
    route.stop();
  });
});

describe("listeners", () => {
  it("adds exactly one click and one popstate listener, and removes both", async () => {
    const added: string[] = [];
    const removed: string[] = [];
    vi.spyOn(document, "addEventListener").mockImplementation(((type: string) => {
      added.push(`document:${type}`);
    }) as unknown as typeof document.addEventListener);
    vi.spyOn(document, "removeEventListener").mockImplementation(((type: string) => {
      removed.push(`document:${type}`);
    }) as unknown as typeof document.removeEventListener);
    vi.spyOn(window, "addEventListener").mockImplementation(((type: string) => {
      added.push(`window:${type}`);
    }) as unknown as typeof window.addEventListener);
    vi.spyOn(window, "removeEventListener").mockImplementation(((type: string) => {
      removed.push(`window:${type}`);
    }) as unknown as typeof window.removeEventListener);

    const router = createRouter(table(), { preload: false });
    const route = await router.start("/");
    expect(added).toEqual(["window:popstate", "document:click"]);

    route.stop();
    expect(removed).toEqual(["window:popstate", "document:click"]);
    // Idempotent: a second stop() must not detach anything again.
    route.stop();
    expect(removed).toHaveLength(2);
  });

  itGc("repeated start()/stop() cycles leave nothing behind", async () => {
    async function capture(): Promise<WeakRef<Route>[]> {
      const router = createRouter(table(), { preload: false });
      const refs: WeakRef<Route>[] = [];
      for (let i = 0; i < 30; i++) {
        const route = await router.start("/");
        refs.push(new WeakRef(route));
        route.stop();
      }
      return refs;
    }

    const refs = await capture();
    await collectGarbage();
    expect(alive(refs)).toBe(0);
  });

  itGc("a start() that forgets to stop() the previous Route still releases it", async () => {
    const router = createRouter(table(), { preload: false });
    let first: Route | null = await router.start("/");
    const ref = new WeakRef(first);

    // start() retires the live Route for us — one page, one Route.
    const second = await router.start("/");
    first = null;

    await collectGarbage();
    expect(ref.deref()).toBeUndefined();
    second.stop();
  });
});

describe("loader data", () => {
  itGc("the data a route loaded is released when you navigate away", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<object>[] }> {
      // A fresh object per navigation, so each one is individually trackable.
      const router = createRouter(
        {
          "/p/:n": () => ({
            load: (ctx: { params: Record<string, string> }) => ({ payload: `data for ${ctx.params.n}` }),
            default: ((_c, { data }) => {
              seenData = data;
              return div({ id: "p" }, data.payload);
            }) as PageComponent<{ payload: string }>,
          }),
          "/elsewhere": () => Home,
        },
        { preload: false },
      );
      const route = await router.start("/p/0");
      render(App(router), mount());

      const refs: WeakRef<object>[] = [];
      for (let i = 1; i <= 20; i++) {
        // Track the object the page is currently holding, then move on.
        refs.push(new WeakRef(seenData!));
        await route.go(`/p/${i}`);
      }
      await route.go("/elsewhere");
      return { route, refs };
    }

    const { route, refs } = await withoutJsdomHistory(capture);
    await collectGarbage();
    // The module stays cached; the data does not.
    expect(alive(refs)).toBe(0);
    route.stop();
  });
});

describe("the layer stack", () => {
  itGc("a closed layer's DOM, entry and resolver are all released", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<object>[]; depthAfter: number }> {
      const Modal: PageComponent = (_ctx, { layer }) => div({ id: `layer-${layer.depth}` }, "modal");
      const router = createRouter({ "/": () => Home, "/modal": () => Modal }, { preload: false });
      const route = await router.start("/");
      const app = render(App(router), mount()) as unknown as Element;

      const pushed = route.push("/modal");
      await new Promise((r) => setTimeout(r, 0));
      // The layer's row, taken from children — never querySelector.
      const refs: WeakRef<object>[] = [new WeakRef(app.children[1])];

      window.history.back();
      await pushed;
      await new Promise((r) => setTimeout(r, 0));

      return { route, refs, depthAfter: route.depth };
    }

    const { route, refs, depthAfter } = await withoutJsdomHistory(capture);
    expect(depthAfter).toBe(1);

    await collectGarbage();
    expect(alive(refs)).toBe(0);
    route.stop();
  });

  itGc("opening and closing many layers accumulates nothing", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<object>[]; maxRows: number }> {
      const Modal: PageComponent = (_ctx, { layer }) => div({ id: `layer-${layer.depth}` }, "modal");
      const router = createRouter({ "/": () => Home, "/modal": () => Modal }, { preload: false });
      const route = await router.start("/");
      const app = render(App(router), mount()) as unknown as Element;

      const refs: WeakRef<object>[] = [];
      let maxRows = 0;
      for (let i = 0; i < 30; i++) {
        const pushed = route.push("/modal");
        await new Promise((r) => setTimeout(r, 0));
        refs.push(new WeakRef(app.children[1]));
        if (app.children.length > maxRows) maxRows = app.children.length;
        window.history.back();
        await pushed;
        await new Promise((r) => setTimeout(r, 0));
      }
      return { route, refs, maxRows };
    }

    const { route, refs, maxRows } = await withoutJsdomHistory(capture);
    // Never more than the base page plus one layer at a time.
    expect(maxRows).toBe(2);

    await collectGarbage();
    expect(alive(refs)).toBe(0);
    route.stop();
  });

  itGc("stop() with layers open releases the Route and every layer", async () => {
    async function capture(): Promise<WeakRef<object>[]> {
      const Modal: PageComponent = (_ctx, { layer }) => div({ id: `layer-${layer.depth}` }, "modal");
      const router = createRouter({ "/": () => Home, "/modal": () => Modal }, { preload: false });
      const route = await router.start("/");
      const container = mount();
      const app = render(App(router), container) as unknown as Element;

      const first = route.push("/modal");
      await new Promise((r) => setTimeout(r, 0));
      const second = route.push("/modal");
      await new Promise((r) => setTimeout(r, 0));

      const refs: WeakRef<object>[] = [new WeakRef(route), new WeakRef(container), new WeakRef(app)];
      // The outlet's markers and the three pages between them.
      for (let i = 0; i < app.childNodes.length; i++) {
        refs.push(new WeakRef(app.childNodes[i]));
      }
      expect(refs.length).toBe(8);

      route.stop();
      // Both awaiting callers are released rather than left hanging.
      await first;
      await second;
      container.remove();
      return refs;
    }

    const refs = await withoutJsdomHistory(capture);
    await collectGarbage();
    expect(alive(refs)).toBe(0);
  });
});

describe("in-flight work after stop()", () => {
  itGc("a module that resolves late retains no DOM and renders nothing", async () => {
    async function capture(): Promise<{ refs: WeakRef<object>[]; rowsAfter: number; pathAfter: string }> {
      const gate = deferred<{ default: PageComponent }>();
      const router = createRouter(
        { "/": () => Home, "/late": () => gate.promise },
        { preload: false },
      );
      const route = await router.start("/");
      const container = mount();
      const app = render(App(router), container) as unknown as Element;

      const navigation = route.go("/late");
      const refs: WeakRef<object>[] = [new WeakRef(route), new WeakRef(container), new WeakRef(app)];

      route.stop();
      gate.resolve({ default: About });
      await navigation;
      await flush();

      const rowsAfter = app.children.length;
      const pathAfter = route.path;
      container.remove();
      return { refs, rowsAfter, pathAfter };
    }

    const { refs, rowsAfter, pathAfter } = await withoutJsdomHistory(capture);
    // stop() took the mount down, so the region is empty — and the page that
    // arrived late was neither rendered nor committed.
    expect(rowsAfter).toBe(0);
    expect(pathAfter).toBe("/");

    await collectGarbage();
    expect(alive(refs)).toBe(0);
  });

  itGc("a pending idle preload does not pin a stopped Route", async () => {
    const queued: Array<() => void> = [];
    (globalThis as Record<string, unknown>).requestIdleCallback = (fn: () => void) => {
      queued.push(fn);
      return queued.length;
    };
    (globalThis as Record<string, unknown>).cancelIdleCallback = () => {};

    try {
      // The router keeps its last Route, so it is dropped with it.
      async function capture(): Promise<WeakRef<Route>> {
        const router = createRouter({ "/": () => Home, "/about": () => About });
        const route = await router.start("/");
        route.stop();
        return new WeakRef(route);
      }
      const ref = await capture();

      expect(queued).toHaveLength(1);
      // The callback is still queued and still holds its closure; running it
      // after stop() must be inert, and must not resurrect the Route.
      queued.shift()!();

      await collectGarbage();
      expect(ref.deref()).toBeUndefined();
    } finally {
      delete (globalThis as Record<string, unknown>).requestIdleCallback;
      delete (globalThis as Record<string, unknown>).cancelIdleCallback;
    }
  });
});

describe("an app that reads the router", () => {
  const Page: PageComponent = () => div({ id: "page" }, "page");
  const Other: PageComponent = () => div({ id: "other" }, "other");
  const Modal: PageComponent = (_ctx, { layer }) => div({ id: "modal" }, button({ onClick: () => layer.close() }));
  /** What an app module is: a component reading the router it imports. */
  const Shell = (router: Router) => () =>
    div({ id: "shell" }, a({ href: router.href("/") }), main({ id: "outlet" }, router.outlet()));

  function appTable() {
    return { "/": () => Page, "/other": () => Other, "/modal": () => Modal };
  }

  itGc("a stopped Route's tree and page are released while the router lives on", async () => {
    async function capture(): Promise<{ router: Router; refs: WeakRef<object>[] }> {
      const router = createRouter(appTable(), { preload: false });
      const route = await router.start("/");
      const container = mount();
      const shell = render(Shell(router), container) as unknown as Element;
      const refs: WeakRef<object>[] = [new WeakRef(container), new WeakRef(shell), new WeakRef(shell.children[1].children[0])];

      route.stop();
      container.remove();
      return { router, refs };
    }

    // The router still answers from the stopped Route, which holds no DOM.
    const { router, refs } = await capture();
    await collectGarbage();
    expect(alive(refs)).toBe(0);
    expect(router.path).toBe("/");
  });

  itGc("navigating releases the previous page", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<object>[] }> {
      const router = createRouter(appTable(), { preload: false });
      const route = await router.start("/");
      const container = mount();
      const shell = render(Shell(router), container) as unknown as Element;
      // The page's node in the outlet.
      const refs: WeakRef<object>[] = [new WeakRef(shell.children[1].children[0])];

      await router.go("/other");
      return { route, refs };
    }

    const { route, refs } = await withoutJsdomHistory(capture);
    await collectGarbage();
    expect(alive(refs)).toBe(0);
    route.stop();
  });

  itGc("a layer over a page is released when it closes", async () => {
    async function capture(): Promise<{ route: Route; refs: WeakRef<object>[] }> {
      const router = createRouter(appTable(), { preload: false });
      const route = await router.start("/");
      const container = mount();
      const shell = render(Shell(router), container) as unknown as Element;
      const outlet = shell.children[1];

      const pushed = router.push("/modal");
      await new Promise((r) => setTimeout(r, 0));
      const refs: WeakRef<object>[] = [new WeakRef(outlet.children[1])];

      window.history.back();
      await pushed;
      await new Promise((r) => setTimeout(r, 0));
      expect(outlet.children[0].id).toBe("page");
      return { route, refs };
    }

    const { route, refs } = await withoutJsdomHistory(capture);
    await collectGarbage();
    expect(alive(refs)).toBe(0);
    route.stop();
  });
});
