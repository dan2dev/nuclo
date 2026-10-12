/**
 * beforeLeave(): a page's guard, asked only when the page is about to be
 * discarded — by a link, go(), Back/Forward, close(), or leaving the app.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { createRouter, type LeaveGuard, type PageComponent, type Route, type RouteContext, type Router } from "../src/index";
import { App, click, deferred, flush, mount, stubAssign, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

let router: Router;

async function start(r: Router, url?: string): Promise<Route> {
  router = r;
  if (url) window.history.replaceState(null, "", url);
  const route = await r.start();
  routes.push(route);
  return route;
}

/** The guard every Form page registers; swap it per test. */
let guard: LeaveGuard = () => true;

const Form: PageComponent = (_ctx, { beforeLeave }) => {
  beforeLeave((to) => guard(to));
  return div({ id: "form" }, input({ id: "field" }));
};
const Other: PageComponent = () => div({ id: "other" });
const Child: PageComponent = () => div({ id: "child" });
const Layout: PageComponent = (_ctx, { outlet, beforeLeave }) => {
  beforeLeave((to) => guard(to));
  return div({ id: "layout" }, outlet());
};

function table() {
  return {
    "/": () => Form,
    "/other": () => Other,
    "/modal": () => Form,
    "/s": { "/": () => Layout, "./a": () => Child, "./b": () => Child },
  };
}

async function show(url = "/"): Promise<{ route: Route; container: HTMLElement }> {
  const route = await start(createRouter(table(), { preload: false }), url);
  const container = mount();
  render(App(router), container);
  return { route, container };
}

describe("beforeLeave()", () => {
  it("keeps the page when its guard refuses a go(), and is handed where the navigation was going", async () => {
    const seen: Array<RouteContext | null> = [];
    guard = (to) => {
      seen.push(to);
      return false;
    };
    const { route, container } = await show();
    const form = container.querySelector("#form");

    await route.go("/other?x=1");
    expect(seen.map((to) => to?.url)).toEqual(["/other?x=1"]);
    expect(window.location.pathname).toBe("/");
    expect(container.querySelector("#form")).toBe(form);
  });

  it("lets the navigation through when the guard allows it, and goes with its page", async () => {
    const asked = vi.fn(() => true);
    guard = asked;
    const { route, container } = await show();

    await route.go("/other");
    expect(container.querySelector("#other")).not.toBeNull();
    await route.go("/");
    await route.go("/other");
    // Once per Form: the first one's guard left with it.
    expect(asked).toHaveBeenCalledTimes(2);
  });

  it("treats a guard that returns nothing as leave", async () => {
    guard = () => {};
    const { route, container } = await show();
    await route.go("/other");
    expect(container.querySelector("#other")).not.toBeNull();
  });

  it("waits for an async guard", async () => {
    const answer = deferred<boolean>();
    guard = () => answer.promise;
    const { route, container } = await show();

    const going = route.go("/other");
    await flush();
    expect(container.querySelector("#form")).not.toBeNull();
    answer.resolve(true);
    await going;
    expect(container.querySelector("#other")).not.toBeNull();
  });

  it("stays when a guard throws, and says so", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    guard = () => {
      throw new Error("boom");
    };
    const { route } = await show();
    await route.go("/other");
    expect(window.location.pathname).toBe("/");
    expect(error).toHaveBeenCalled();
  });

  it("guards a link click", async () => {
    guard = () => false;
    const { container } = await show();
    const link = document.createElement("a");
    link.href = "/other";
    container.appendChild(link);

    expect(click(link)).toBe(true);
    await flush();
    expect(window.location.pathname).toBe("/");
    expect(container.querySelector("#form")).not.toBeNull();
  });

  it("is not asked while its page is kept: a query change, or a child under a layout", async () => {
    const asked = vi.fn(() => false);
    guard = asked;
    const { route, container } = await show("/s/a");
    expect(container.querySelector("#layout #child")).not.toBeNull();

    await route.go("/s/b");
    await route.go("/s/b?q=1");
    expect(asked).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search).toBe("/s/b?q=1");

    await route.go("/other");
    expect(asked).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/s/b");
  });

  it("guards leaving the app, with nowhere to hand it", async () => {
    const seen: Array<RouteContext | null> = [];
    let leave = false;
    guard = (to) => {
      seen.push(to);
      return leave;
    };
    const { route } = await show();
    const assign = stubAssign();
    try {
      await route.go("/nowhere");
      expect(assign.calls).toEqual([]);
      leave = true;
      await route.go("/nowhere");
      expect(assign.calls).toEqual(["/nowhere"]);
      expect(seen).toEqual([null, null]);
    } finally {
      assign.restore();
    }
  });

  it("walks a refused Back back, and lets the next one through", async () => {
    guard = () => true;
    const { route, container } = await show("/other");
    await route.go("/");
    const asked = vi.fn(() => false);
    guard = asked;
    const form = container.querySelector("#form");

    window.history.back();
    await waitFor(() => asked.mock.calls.length === 1);
    await waitFor(() => window.location.pathname === "/");
    await flush();
    expect(container.querySelector("#form")).toBe(form);
    expect(route.path).toBe("/");

    guard = () => true;
    window.history.back();
    await waitFor(() => container.querySelector("#other") !== null);
    expect(route.path).toBe("/other");
  });

  it("does not ask on a Back it could not walk back: an entry the router did not write", async () => {
    guard = () => true;
    const { route, container } = await show("/");
    // A foreign entry, as a native #fragment or another script would leave.
    window.history.pushState(null, "", "/other");
    window.history.back();
    await waitFor(() => window.location.pathname === "/");
    const asked = vi.fn(() => false);
    guard = asked;

    window.history.forward();
    await waitFor(() => container.querySelector("#other") !== null);
    expect(asked).not.toHaveBeenCalled();
    expect(route.path).toBe("/other");
  });

  it("keeps a layer whose guard refuses close(), and its push() waiting", async () => {
    guard = () => true;
    const { route, container } = await show("/other");
    const result = route.push<string>("/modal");
    await waitFor(() => route.depth === 2);
    const layer = { closed: false };
    void result.then(() => (layer.closed = true));

    const asked = vi.fn(() => false);
    guard = asked;
    const modal = container.querySelector("#form");
    // close() walks history back too, so this is its path as well.
    window.history.back();
    await waitFor(() => asked.mock.calls.length === 1);
    await waitFor(() => window.location.pathname === "/modal");
    await flush();
    expect(route.depth).toBe(2);
    expect(container.querySelector("#form")).toBe(modal);
    expect(layer.closed).toBe(false);

    guard = () => true;
    window.history.back();
    await expect(result).resolves.toBeUndefined();
    expect(route.depth).toBe(1);
  });

  it("forgets what a refused close() asked to resolve with", async () => {
    guard = () => true;
    const { route } = await show("/other");
    let layerOf: { close(result?: unknown): void } | undefined;
    const Modal: PageComponent = (_ctx, { layer, beforeLeave }) => {
      layerOf = layer;
      beforeLeave(() => guard(null));
      return div({ id: "modal" });
    };
    const r2 = createRouter({ "/other": () => Other, "/modal": () => Modal }, { preload: false });
    route.stop();
    const route2 = await start(r2);
    render(App(router), mount());
    const result = route2.push<string>("/modal");
    await waitFor(() => route2.depth === 2);

    const asked = vi.fn(() => false);
    guard = asked;
    layerOf!.close("saved");
    await waitFor(() => asked.mock.calls.length === 1);
    await waitFor(() => window.location.pathname === "/modal");
    await flush();
    expect(route2.depth).toBe(2);

    // Dismissed by Back now: the refused "saved" must not leak into it.
    guard = () => true;
    window.history.back();
    await expect(result).resolves.toBeUndefined();
  });

  it("drops a navigation overtaken while its guard was asking", async () => {
    const answer = deferred<boolean>();
    guard = () => answer.promise;
    const { route, container } = await show();

    const going = route.go("/other");
    void route.push("/modal");
    await waitFor(() => route.depth === 2);
    answer.resolve(true);
    await going;
    expect(container.querySelector("#other")).toBeNull();
    expect(window.location.pathname).toBe("/modal");
  });

  it("drops a layer's Back answered after stop()", async () => {
    guard = () => true;
    const { route } = await show("/other");
    void route.push("/modal");
    await waitFor(() => route.depth === 2);
    const answer = deferred<boolean>();
    guard = () => answer.promise;

    window.history.back();
    await waitFor(() => window.location.pathname === "/other");
    route.stop();
    answer.resolve(false);
    await flush();
    expect(window.location.pathname).toBe("/other");
  });
});
