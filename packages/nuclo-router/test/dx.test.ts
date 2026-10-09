/**
 * Behaviour a user feels directly and that is easy to get subtly wrong: one
 * onNavigate per Back in hash mode, two layers on one href, a `hash` that is
 * live and cheap, encoded fragment targets, and params typed from the pattern.
 */
import { describe, it, expect, expectTypeOf, vi } from "vitest";
import "nuclo";
import {
  createRouter,
  type Params,
  type PageComponent,
  type PageProps,
  type Route,
  type RouteContext,
  type Router,
} from "../src/index";
import { App, flush, mount, useRouterEnv, waitFor } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => into("main", div({ id: "home" }, "home"));
const About: PageComponent = () =>
  into("main", div({ id: "about" }, h1({ id: "café" }, "café"), p({ id: "plain" }, "x")));
const Modal: PageComponent = (_ctx, { layer }) => into("main", div({ id: `modal-${layer.depth}` }));

async function start(router: Router, url?: string): Promise<Route> {
  const route = await router.start(url);
  routes.push(route);
  return route;
}

describe("one location change, one navigation", () => {
  it("calls onNavigate once per Back in hash mode", async () => {
    // jsdom, like a browser, fires both popstate and hashchange for one Back.
    const onNavigate = vi.fn();
    const route = await start(
      createRouter({ "/": () => Home, "/about": () => About }, { history: "hash", preload: false, onNavigate }),
    );
    render(App, mount());
    await route.go("/about");
    onNavigate.mockClear();

    window.history.back();
    await waitFor(() => route.path === "/");
    await flush();

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("closes exactly one layer per Back when two layers share an href", async () => {
    const route = await start(createRouter({ "/": () => Home, "/modal": () => Modal }, { preload: false }), "/");
    const container = mount();
    render(App, container);
    const first = route.push("/modal");
    await flush();
    const second = route.push("/modal");
    await flush();
    expect(route.depth).toBe(3);

    window.history.back();
    await waitFor(() => route.depth === 2);

    await expect(second).resolves.toBeUndefined();
    expect([...container.firstElementChild!.children].map((c) => c.id)).toEqual(["home", "modal-1"]);

    route.stop();
    await first;
  });
});

describe("route.hash", () => {
  it("is the live fragment, with no navigation needed to change it", async () => {
    const route = await start(createRouter({ "/": () => Home, "/about": () => About }, { preload: false }), "/");
    render(App, mount());
    expect(route.hash).toBe("");

    await route.go("/about#plain");
    expect(route.hash).toBe("#plain");

    // An in-page anchor changes only the fragment.
    window.history.replaceState(null, "", "/about#other");
    expect(route.hash).toBe("#other");

    // A stopped Route reports what its page was built with.
    route.stop();
    expect(route.hash).toBe("#plain");
  });

  it("is the route's own fragment in hash mode", async () => {
    const route = await start(
      createRouter({ "/": () => Home, "/about": () => About }, { history: "hash", preload: false }),
    );
    render(App, mount());

    await route.go("/about#plain");

    expect(window.location.hash).toBe("#/about#plain");
    expect(route.hash).toBe("#plain");
  });
});

describe("fragment scrolling", () => {
  it("decodes the fragment before looking the element up", async () => {
    const route = await start(createRouter({ "/": () => Home, "/about": () => About }, { preload: false }), "/");
    render(App, mount());

    await route.go("/about#caf%C3%A9");

    const target = document.getElementById("café")!;
    expect(target).not.toBeNull();
    const scrolled = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock;
    expect(scrolled.calls.length).toBe(1);
    expect(scrolled.contexts[0]).toBe(target);
  });

  it("looks a malformed fragment up as written", async () => {
    const route = await start(createRouter({ "/": () => Home, "/about": () => About }, { preload: false }), "/");
    render(App, mount());

    await route.go("/about#%E0%A4%A");

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(route.path).toBe("/about");
  });
});

describe("typed params", () => {
  it("derives the param names from the pattern", () => {
    expectTypeOf<Params<"/blog/:slug">>().toEqualTypeOf<{ readonly slug: string }>();
    expectTypeOf<Params<"/u/:id/edit/:tab">>().toEqualTypeOf<{ readonly id: string; readonly tab: string }>();
    expectTypeOf<Params<"/files/*rest">>().toEqualTypeOf<{ readonly rest: string }>();
    expectTypeOf<Params<"*">>().toEqualTypeOf<{ readonly "*": string }>();
    expectTypeOf<Params<"/docs/intro">>().toEqualTypeOf<{}>();
  });

  it("lets a page type its context with its own pattern", async () => {
    const Post = (ctx: RouteContext<Params<"/blog/:slug">>) => into("main", div({ id: "post" }, ctx.params.slug));
    const route = await start(createRouter({ "/blog/:slug": () => Post }, { preload: false }), "/blog/hello");
    const container = mount();
    render(App, container);

    expect(container.querySelector("#post")!.textContent).toBe("hello");
  });
});

describe("a page's second argument", () => {
  it("carries the layer, the loader's data and the outlet", async () => {
    let props: PageProps<string> | undefined;
    const Page = ((_ctx, given) => {
      props = given;
      return into("main", div({ id: "page" }, given.outlet()));
    }) as PageComponent<string>;
    const route = await start(createRouter({ "/": () => ({ load: () => "loaded", default: Page }) }, { preload: false }), "/");
    const container = mount();
    render(App, container);

    expect(props!.layer.depth).toBe(0);
    expect(props!.data).toBe("loaded");
    // No child route: the outlet renders nothing.
    expect(container.querySelector("#page")!.textContent).toBe("");
  });

  it("hands undefined data to a page whose route has no load()", async () => {
    let data: unknown = "unset";
    const route = await start(
      createRouter({ "/": () => (_ctx, props) => ((data = props.data), into("main", div())) }, { preload: false }),
      "/",
    );
    render(App, mount());

    expect(data).toBeUndefined();
  });

  it("types data from the page's own type parameter", () => {
    expectTypeOf<Parameters<PageComponent<{ title: string }>>[1]["data"]>().toEqualTypeOf<{ title: string }>();
    expectTypeOf<PageProps["data"]>().toBeUnknown();
    // A page may still take fewer arguments than it is given.
    expectTypeOf<() => HTMLDivElement>().toExtend<PageComponent>();
    expectTypeOf<(ctx: RouteContext) => HTMLDivElement>().toExtend<PageComponent>();
  });
});
