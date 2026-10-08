/**
 * The app shape the README documents, end to end: pending/error when() blocks
 * as siblings of route.pages() inside one host, server-rendered then hydrated
 * then navigated. Sibling when() blocks share the host's claim cursor with the
 * view's list(), so this is the shape most likely to expose a marker mismatch.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route, type RouteContext } from "../src/index";
import { click, deferred, flush, mount, useRouterEnv } from "./helpers";

const routes = useRouterEnv();

const Home: PageComponent = () => div({ id: "home" }, h1("Home"));
const Docs: PageComponent = () => div({ id: "docs" }, h1("Docs"));
const Post: PageComponent = (ctx: RouteContext) => div({ id: "post" }, h1(ctx.params.slug));
const NotFound: PageComponent = () => div({ id: "nf" }, h1("404"));

const Spinner = () => div({ id: "spinner" }, "Loading…");
const ErrorView = (route: Route) => div({ id: "err" }, () => route.error?.message ?? "");

/** Verbatim from the README. */
const App = (route: Route) => () =>
  div(
    { id: "shell" },
    header(
      a({ id: "to-home", href: route.href("/") }, "Home"),
      a({ id: "to-docs", href: route.href("/docs") }, "Docs"),
    ),
    main(
      { id: "outlet" },
      when(() => route.pending, Spinner()),
      when(() => route.error !== null, ErrorView(route)),
      route.pages(),
    ),
    footer({ id: "foot" }, "© nuclo"),
  );

function makeRouter(slow?: Promise<{ default: PageComponent }>) {
  return createRouter({
    "/": () => Home,
    "/docs": () => (slow ? slow : Docs),
    "/blog/:slug": () => Post,
    "*": () => NotFound,
  });
}

async function serverThenClient(url: string, slow?: Promise<{ default: PageComponent }>) {
  const server = await makeRouter().start(url);
  const html = renderToString(App(server));
  server.stop();

  const container = mount();
  container.innerHTML = html;
  const ssrShell = container.firstElementChild!;
  const ssrOutlet = ssrShell.children[1];
  const ssrPage = ssrOutlet.children[0];

  window.history.replaceState(null, "", url);
  const route = await makeRouter(slow).start();
  routes.push(route);
  hydrate(App(route), container);
  return { html, container, route, ssrShell, ssrOutlet, ssrPage };
}

describe("the README app", () => {
  it("server-renders only the active page, with no spinner or error", async () => {
    const { html } = await serverThenClient("/docs");
    expect(html).toContain('id="docs"');
    expect(html).not.toContain('id="spinner"');
    expect(html).not.toContain('id="err"');
    expect(html).not.toContain('id="home"');
  });

  it("hydrates by claiming the server's nodes, spinner siblings and all", async () => {
    const { container, ssrShell, ssrOutlet, ssrPage } = await serverThenClient("/blog/hello");

    expect(container.firstElementChild).toBe(ssrShell);
    expect(ssrShell.children[1]).toBe(ssrOutlet);
    expect(ssrOutlet.children[0]).toBe(ssrPage);
    expect(ssrPage.id).toBe("post");
    expect(container.querySelectorAll("#post").length).toBe(1);
    expect(container.querySelectorAll("#shell").length).toBe(1);
    expect(container.querySelector("#spinner")).toBeNull();
  });

  it("hydrates the catch-all route", async () => {
    const { container } = await serverThenClient("/no/such/page");
    expect(container.querySelectorAll("#nf").length).toBe(1);
  });

  it("navigates by link click, keeping the shell and the when() siblings intact", async () => {
    const { container, route, ssrShell } = await serverThenClient("/");
    const outlet = container.querySelector("#outlet")!;

    click(container.querySelector("#to-docs")!);
    await flush();

    expect(route.path).toBe("/docs");
    expect(container.firstElementChild).toBe(ssrShell);
    expect(container.querySelector("#outlet")).toBe(outlet);
    expect(container.querySelectorAll("#docs").length).toBe(1);
    expect(container.querySelector("#home")).toBeNull();
    expect(container.querySelector("#spinner")).toBeNull();
    expect(container.querySelectorAll("#foot").length).toBe(1);
  });

  it("shows the spinner while a route loads, then swaps it for the page", async () => {
    const gate = deferred<{ default: PageComponent }>();
    const { container, route } = await serverThenClient("/", gate.promise);

    const navigation = route.go("/docs");
    // Old page still up, spinner in, no layout thrash.
    expect(container.querySelectorAll("#spinner").length).toBe(1);
    expect(container.querySelectorAll("#home").length).toBe(1);

    gate.resolve({ default: Docs });
    await navigation;

    expect(container.querySelector("#spinner")).toBeNull();
    expect(container.querySelector("#home")).toBeNull();
    expect(container.querySelectorAll("#docs").length).toBe(1);
  });

  it("shows the error view when a chunk fails, then recovers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const gate = deferred<{ default: PageComponent }>();
    const { container, route } = await serverThenClient("/", gate.promise);

    const navigation = route.go("/docs");
    gate.reject(new Error("chunk 404"));
    await navigation;

    expect(container.querySelectorAll("#err").length).toBe(1);
    expect(container.querySelector("#err")!.textContent).toContain("chunk 404");
    expect(container.querySelector("#spinner")).toBeNull();
    // The page the user was on never went away.
    expect(container.querySelectorAll("#home").length).toBe(1);

    await route.go("/blog/x");
    expect(container.querySelector("#err")).toBeNull();
    expect(container.querySelectorAll("#post").length).toBe(1);
  });

  it("survives a round trip of many navigations without accumulating nodes", async () => {
    const { container, route } = await serverThenClient("/");

    for (let i = 0; i < 30; i++) {
      await route.go(`/blog/p${i}`);
      await route.go("/docs");
    }

    const outlet = container.querySelector("#outlet")!;
    expect(container.querySelectorAll("#shell").length).toBe(1);
    expect(container.querySelectorAll("#docs").length).toBe(1);
    expect(container.querySelectorAll("#post").length).toBe(0);
    // One page row plus the two when() blocks' markers — never a growing pile.
    expect(outlet.children.length).toBe(1);
    expect(route.path).toBe("/docs");
  });
});
