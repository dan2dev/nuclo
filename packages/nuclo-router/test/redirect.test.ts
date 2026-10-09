/**
 * `throw new Redirect(href)` from a loader: followed in the browser by go(),
 * push() and start() alike, with the redirected-from URL never reaching
 * history. The server half is in ssr-node.test.ts.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, Redirect, type Layer, type PageComponent, type Route, type Router } from "../src/index";
import { App, deferred, flush, historyLength, mount, stubAssign, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

async function start(router: Router, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

/** A page at the root of its match. */
const P = (id: string): PageComponent => () => into("main", div({ id }, id));
/** A child, rendered inside its parent's outlet() rather than a region. */
const C = (id: string): PageComponent => () => div({ id }, id);

/** A route whose loader throws a Redirect to `href`. */
const to = (href: string) => () => ({
  default: P("never"),
  load: () => {
    throw new Redirect(href);
  },
});

/** A route whose loader waits on `gate` — reject it with a Redirect. */
const gated = (gate: Promise<never>) => () => ({ default: P("never"), load: () => gate });

const SSO = "https://auth.example.com/login";

function router() {
  return createRouter(
    {
      "/": () => P("home"),
      "/about": () => P("about"),
      "/login": () => P("login"),
      "/admin": to("/login"),
      "/next": to("/login?next=%2Fadmin#form"),
      "/old": () => {
        throw new Redirect("/about");
      },
      "/a/:id": to("./edit"),
      "/a/:id/edit": () => P("edit"),
      "/b/c": to(".."),
      "/b": () => P("b"),
      "/chain": to("/admin"),
      "/loop": to("/loop"),
      "/sso": to(SSO),
      // Matches any path: only the origin check keeps SSO from landing here.
      "*": () => P("nf"),
    },
    { preload: false },
  );
}

describe("a Redirect from go()", () => {
  it("lands on the target, and only the target reaches history", async () => {
    const onNavigate = vi.fn();
    const route = await start(
      createRouter({ "/": () => P("home"), "/admin": to("/login"), "/login": () => P("login") }, { preload: false, onNavigate }),
      "/",
    );
    const container = mount();
    render(App, container);
    onNavigate.mockClear();
    const length = historyLength();

    await route.go("/admin");

    expect(route.path).toBe("/login");
    expect(window.location.pathname).toBe("/login");
    expect(window.history.length).toBe(length + 1);
    expect(container.querySelector("#login")).not.toBeNull();
    expect(route.error).toBeNull();
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0].path).toBe("/login");

    // Back skips the redirected-from URL entirely.
    window.history.back();
    await waitFor(() => route.path === "/");
  });

  it("follows a loader that rejects with one, pending until the target lands", async () => {
    const gate = deferred<never>();
    const route = await start(
      createRouter({ "/": () => P("home"), "/slow": gated(gate.promise), "/login": () => P("login") }, { preload: false }),
      "/",
    );

    const navigation = route.go("/slow");
    expect(route.pending).toBe(true);
    gate.reject(new Redirect("/login"));
    await navigation;

    expect(route.path).toBe("/login");
    expect(route.pending).toBe(false);
  });

  it("works from the route table itself", async () => {
    const route = await start(router(), "/");
    await route.go("/old");
    expect(route.path).toBe("/about");
  });

  it("resolves a relative href against the URL being navigated to", async () => {
    const route = await start(router(), "/");

    await route.go("/a/7");
    expect(route.path).toBe("/a/7/edit");

    await route.go("/b/c");
    expect(route.path).toBe("/b");
  });

  it("keeps the query and hash it names", async () => {
    const route = await start(router(), "/");
    await route.go("/next");

    expect(route.path).toBe("/login");
    expect(route.search.get("next")).toBe("/admin");
    expect(route.hash).toBe("#form");
  });

  it("replaces when the navigation replaces", async () => {
    const route = await start(router(), "/");
    const length = historyLength();

    await route.go("/admin", { replace: true });
    expect(window.location.pathname).toBe("/login");
    expect(window.history.length).toBe(length);
  });

  it("replaces the entry Back landed on", async () => {
    let allowed = true;
    const route = await start(
      createRouter(
        {
          "/": () => P("home"),
          "/admin": () => ({
            default: P("admin"),
            load: () => {
              if (!allowed) throw new Redirect("/login");
            },
          }),
          "/login": () => P("login"),
        },
        { preload: false },
      ),
      "/",
    );
    await route.go("/admin");
    await route.go("/");
    const length = window.history.length;
    allowed = false;

    window.history.back();
    await waitFor(() => route.path === "/login");
    expect(window.location.pathname).toBe("/login");
    expect(window.history.length).toBe(length);
  });

  it("follows a chain of redirects, sync and async", async () => {
    const gate = deferred<never>();
    const route = await start(
      createRouter(
        { "/": () => P("home"), "/a": to("/b"), "/b": gated(gate.promise), "/c": () => P("c") },
        { preload: false },
      ),
      "/",
    );
    const length = historyLength();

    const navigation = route.go("/a");
    gate.reject(new Redirect("/c"));
    await navigation;

    expect(route.path).toBe("/c");
    expect(window.history.length).toBe(length + 1);
  });

  it("follows ten in a row and fails on the eleventh", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let limit = 10;
    const route = await start(
      createRouter(
        {
          "/": () => P("home"),
          "/r/:n": () => ({
            default: P("end"),
            load: (ctx: { params: Record<string, string> }) => {
              const n = Number(ctx.params.n);
              if (n < limit) throw new Redirect(`/r/${n + 1}`);
            },
          }),
        },
        { preload: false },
      ),
      "/",
    );

    await route.go("/r/0");
    expect(route.path).toBe("/r/10");
    expect(route.error).toBeNull();

    limit = 11;
    await route.go("/r/0");
    expect(route.error?.message).toBe('nuclo-router: more than 10 redirects in a row, the last to "/r/11"');
    // A failure like any other: the page, its URL and the pending flag stay put.
    expect(route.path).toBe("/r/10");
    expect(window.location.pathname).toBe("/r/10");
    expect(route.pending).toBe(false);
  });

  it("fails a loop instead of hanging", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = await start(router(), "/");

    await route.go("/loop");
    expect(route.error?.message).toMatch(/more than 10 redirects/);
    expect(route.path).toBe("/");
    expect(window.location.pathname).toBe("/");
    expect(logged).toHaveBeenCalledTimes(1);
  });

  it("leaves the app for another origin", async () => {
    const route = await start(router(), "/");
    const assign = stubAssign();
    try {
      await route.go("/sso");
      expect(assign.calls).toEqual([SSO]);
    } finally {
      assign.restore();
    }
    expect(route.path).toBe("/");
  });

  it("is dropped when another navigation overtook it", async () => {
    const gate = deferred<never>();
    const route = await start(
      createRouter(
        { "/": () => P("home"), "/slow": gated(gate.promise), "/about": () => P("about"), "/login": () => P("login") },
        { preload: false },
      ),
      "/",
    );

    const overtaken = route.go("/slow");
    await route.go("/about");
    gate.reject(new Redirect("/login"));
    await overtaken;

    expect(route.path).toBe("/about");
    expect(window.location.pathname).toBe("/about");
  });

  it("keeps a parent mounted when its child redirects to a sibling", async () => {
    const Parent: PageComponent = (_ctx, { outlet }) => into("main", div({ id: "parent" }, outlet()));
    const route = await start(
      createRouter(
        { "/p": { "/": () => Parent, "./a": to("../b"), "./b": () => C("b"), "./c": () => C("c") } },
        { preload: false },
      ),
      "/p/c",
    );
    const container = mount();
    render(App, container);
    const parent = container.querySelector("#parent");
    expect(parent).not.toBeNull();

    await route.go("/p/a");

    expect(route.path).toBe("/p/b");
    expect(container.querySelector("#parent")).toBe(parent);
    expect(container.querySelector("#b")).not.toBeNull();
  });

  it("keeps the redirected-from URL out of memory history too", async () => {
    const route = await start(
      createRouter({ "/": () => P("home"), "/admin": to("/login"), "/login": () => P("login") }, { history: "memory", preload: false }),
      "/",
    );

    await route.go("/admin");
    expect(route.url).toBe("/login");

    route.back();
    await waitFor(() => route.path === "/");
  });

  it("writes the target into the hash in hash mode", async () => {
    const route = await start(
      createRouter({ "/": () => P("home"), "/admin": to("/login"), "/login": () => P("login") }, { history: "hash", preload: false }),
    );

    await route.go("/admin");
    expect(window.location.hash).toBe("#/login");
  });
});

describe("a Redirect from start() in the browser", () => {
  it("is followed, replacing the URL it started on", async () => {
    window.history.replaceState(null, "", "/admin");
    const length = historyLength();

    const route = await start(router());

    expect(route.path).toBe("/login");
    expect(window.location.pathname).toBe("/login");
    expect(window.history.length).toBe(length);
  });

  it("resolves a relative href against the URL it started on", async () => {
    const route = await start(router(), "/a/7");
    expect(route.path).toBe("/a/7/edit");
    expect(window.location.pathname).toBe("/a/7/edit");
  });

  it("follows a chain", async () => {
    const route = await start(router(), "/chain");
    expect(route.path).toBe("/login");
  });

  it("rejects a loop", async () => {
    await expect(router().start("/loop")).rejects.toThrow(/more than 10 redirects/);
  });

  it("leaves the app for another origin, rejecting with the Redirect", async () => {
    const assign = stubAssign();
    try {
      const error = await router()
        .start("/sso")
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Redirect);
      expect((error as Redirect).href).toBe(SSO);
      expect(assign.calls).toEqual([SSO]);
    } finally {
      assign.restore();
    }
  });

  it("is followed in memory mode", async () => {
    const memory = createRouter({ "/admin": to("/login"), "/login": () => P("login") }, { history: "memory", preload: false });
    const route = await start(memory, "/admin");

    expect(route.path).toBe("/login");
    expect(route.url).toBe("/login");
  });

  it("still rejects with any other loader failure exactly as thrown", async () => {
    const boom = new Error("boom");
    const failing = createRouter({
      "/": () => ({
        default: P("never"),
        load: () => {
          throw boom;
        },
      }),
    });
    await expect(failing.start("/")).rejects.toBe(boom);
  });
});

describe("a Redirect from push()", () => {
  let layer: Layer | undefined;
  const Login: PageComponent = (_ctx, props) => {
    layer = props.layer;
    return into("main", div({ id: `login-${props.layer.depth}` }));
  };
  const table = (gate?: Promise<never>) => ({
    "/": () => P("home"),
    "/about": () => P("about"),
    "/new": to("/login"),
    "/slow": gated(gate ?? new Promise<never>(() => {})),
    "/loop": to("/loop"),
    "/login": () => Login,
  });

  it("opens the target as the layer", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");
    const container = mount();
    render(App, container);

    const result = route.push<string>("/new");
    await flush();

    expect(route.depth).toBe(2);
    expect(route.path).toBe("/login");
    expect(window.location.pathname).toBe("/login");
    expect(container.querySelector("#login-1")).not.toBeNull();

    layer!.close("signed in");
    await expect(result).resolves.toBe("signed in");
  });

  it("follows a loader that rejects with one", async () => {
    const gate = deferred<never>();
    const route = await start(createRouter(table(gate.promise), { preload: false }), "/");
    render(App, mount());

    void route.push("/slow");
    expect(route.pending).toBe(true);
    gate.reject(new Redirect("/login"));
    await waitFor(() => route.depth === 2);

    expect(route.path).toBe("/login");
    expect(route.pending).toBe(false);
  });

  it("rejects a loop, opening nothing", async () => {
    const route = await start(createRouter(table(), { preload: false }), "/");

    await expect(route.push("/loop")).rejects.toThrow(/more than 10 redirects/);
    expect(route.depth).toBe(1);
    expect(route.pending).toBe(false);
    expect(window.location.pathname).toBe("/");
  });

  it("opens nothing when a navigation overtook it", async () => {
    const gate = deferred<never>();
    const route = await start(createRouter(table(gate.promise), { preload: false }), "/");

    const pushed = route.push("/slow");
    await route.go("/about");
    gate.reject(new Redirect("/login"));

    await expect(pushed).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
    expect(route.path).toBe("/about");
  });
});

describe("another origin", () => {
  it("is never the app's in the browser, whatever its path", async () => {
    const r = router();
    expect(r.match("https://other.example/about")).toBeNull();
    expect(r.match(`${window.location.origin}/about`)?.path).toBe("/about");

    const route = await start(r, "/");
    const assign = stubAssign();
    try {
      // The "*" route matches any path, so without the origin check this
      // would pushState a cross-origin URL — a SecurityError.
      await route.go("https://other.example/about");
      expect(assign.calls).toEqual(["https://other.example/about"]);
    } finally {
      assign.restore();
    }
  });
});
