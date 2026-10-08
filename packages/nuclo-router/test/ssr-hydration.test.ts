/**
 * The SSR → hydration contract: the server and the client build the same
 * tree, so hydrate() claims the server's nodes instead of rebuilding them.
 * Node identity is the assertion that matters — a node captured from the SSR
 * markup must still be the live node after hydrate().
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route } from "../src/index";
import { mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => div({ id: "home" }, h1("Home"), p("welcome"));
const About: PageComponent = () => div({ id: "about" }, h1("About"));
const Post: PageComponent = (ctx) => div({ id: "post" }, h1(ctx.params.slug));

const table = {
  "/": () => Home,
  "/about": () => About,
  "/blog/:slug": () => Post,
};

/** The isomorphic app shell — the same function on both sides. */
const App = (route: Route) => () =>
  div(
    { id: "shell" },
    header({ id: "nav" }, a({ href: route.href("/") }, "home")),
    main({ id: "outlet" }, route.view()),
    footer({ id: "foot" }, "© nuclo"),
  );

/**
 * Renders a request the way a server would, then retires the Route. (Under
 * jsdom a Route also attaches browser listeners; a real server has no
 * document, and a request's Route is discarded once its HTML is out.)
 */
async function ssr(url: string): Promise<string> {
  const router = createRouter(table);
  const route = await router.start(url);
  try {
    return renderToString(App(route));
  } finally {
    route.stop();
  }
}

describe("renderToString", () => {
  it("renders the matched page inside the shell", async () => {
    const html = await ssr("/about");
    expect(html).toContain('id="shell"');
    expect(html).toContain('id="about"');
    expect(html).toContain("About");
    expect(html).not.toContain('id="home"');
  });

  it("emits the list markers hydration claims", async () => {
    const html = await ssr("/");
    expect(html).toMatch(/<!--list-start-\d+-->/);
    expect(html).toContain("<!--list-end-->");
  });

  it("renders a param route with its params", async () => {
    const html = await ssr("/blog/hello-world");
    expect(html).toContain('id="post"');
    expect(html).toContain("hello-world");
  });

  it("accepts an absolute request URL", async () => {
    const html = await ssr("https://nuclo.dev/blog/abc?draft=1");
    expect(html).toContain("abc");
  });

  it("does not fire onNavigate again just for rendering", async () => {
    const onNavigate = vi.fn();
    const router = createRouter(table, { onNavigate });
    const route = await router.start("/about");
    routes.push(route);

    renderToString(App(route));
    renderToString(App(route));
    // Only the initial resolve counts. (With no window at all it never fires
    // — see ssr-node.test.ts.)
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("hydrate", () => {
  async function hydrateFrom(url: string): Promise<{
    container: HTMLElement;
    route: Route;
    ssrPage: Element;
    ssrShell: Element;
  }> {
    const html = await ssr(url);
    const container = mount();
    container.innerHTML = html;
    const ssrShell = container.firstElementChild!;
    const ssrPage = container.querySelector("#outlet")!.firstElementChild!;

    window.history.replaceState(null, "", url);
    const router = createRouter(table);
    const route = await router.start();
    routes.push(route);
    hydrate(App(route), container);
    return { container, route, ssrPage, ssrShell };
  }

  it("claims the server's nodes instead of rebuilding them", async () => {
    const { container, ssrPage, ssrShell } = await hydrateFrom("/about");

    // Same node objects, still in the document: nothing was replaced.
    expect(container.firstElementChild).toBe(ssrShell);
    expect(container.querySelector("#outlet")!.firstElementChild).toBe(ssrPage);
    expect(ssrPage.id).toBe("about");
    expect(container.querySelectorAll("#about").length).toBe(1);
  });

  it("claims a param route's page", async () => {
    const { container, ssrPage } = await hydrateFrom("/blog/hello");
    expect(container.querySelector("#outlet")!.firstElementChild).toBe(ssrPage);
    expect(container.querySelector("#post h1")!.textContent).toBe("hello");
  });

  it("leaves no duplicated markup", async () => {
    const { container } = await hydrateFrom("/");
    expect(container.querySelectorAll("#shell").length).toBe(1);
    expect(container.querySelectorAll("#home").length).toBe(1);
    expect(container.querySelectorAll("#foot").length).toBe(1);
  });

  it("navigates after hydrating, swapping only the outlet", async () => {
    const { container, route, ssrShell } = await hydrateFrom("/");
    const nav = container.querySelector("#nav")!;
    const foot = container.querySelector("#foot")!;

    await route.go("/about");

    // The shell survives; only the page inside the outlet changed.
    expect(container.firstElementChild).toBe(ssrShell);
    expect(container.querySelector("#nav")).toBe(nav);
    expect(container.querySelector("#foot")).toBe(foot);
    expect(container.querySelector("#home")).toBeNull();
    expect(container.querySelector("#about")).not.toBeNull();
  });

  it("is live after hydration — a link click navigates", async () => {
    const { container, route } = await hydrateFrom("/");
    const anchor = container.querySelector("#nav a")! as HTMLAnchorElement;
    anchor.setAttribute("href", "/about");

    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(route.path).toBe("/about");
    expect(container.querySelector("#about")).not.toBeNull();
  });
});

describe("concurrent requests", () => {
  it("gives each request its own Route, sharing only the module cache", async () => {
    let loads = 0;
    const router = createRouter({
      "/blog/:slug": () => {
        loads++;
        return Promise.resolve({ default: Post });
      },
    });

    const [a, b, c] = await Promise.all([
      router.start("/blog/a"),
      router.start("/blog/b"),
      router.start("/blog/c"),
    ]);
    routes.push(a, b, c);

    expect([a.path, b.path, c.path]).toEqual(["/blog/a", "/blog/b", "/blog/c"]);
    expect([a.params.slug, b.params.slug, c.params.slug]).toEqual(["a", "b", "c"]);

    // One import() for three concurrent requests — the in-flight promise is shared.
    expect(loads).toBe(1);

    const [htmlA, htmlB] = [renderToString(App(a)), renderToString(App(b))];
    expect(htmlA).toContain(">a<");
    expect(htmlB).toContain(">b<");
    expect(htmlA).not.toContain(">b<");
  });

  it("renders interleaved requests without cross-talk", async () => {
    const router = createRouter(table);
    const first = await router.start("/blog/one");
    const second = await router.start("/blog/two");
    routes.push(first, second);

    // Render out of order: a Route's output must depend only on itself.
    const htmlSecond = renderToString(App(second));
    const htmlFirst = renderToString(App(first));

    expect(htmlFirst).toContain("one");
    expect(htmlFirst).not.toContain("two");
    expect(htmlSecond).toContain("two");
    expect(htmlSecond).not.toContain("one");
  });
});
