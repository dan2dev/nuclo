// @vitest-environment node
/**
 * route.app() on a real server: no window, many Routes alive at once. Each
 * render mounts its own Route's pages on a host that is never serialized, so
 * interleaved requests cannot see each other's pages.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo/polyfill";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent, type Route } from "../src/index";

const Home: PageComponent = () => view("main", div({ id: "home" }, "home"));
const About: PageComponent = () => view("main", div({ id: "about" }, "about"));
const Plain: PageComponent = () => div({ id: "plain" }, "plain");

const App = (route: Route) => () =>
  div({ id: "shell" }, a({ href: route.href("/") }, "home"), main(region({ id: "main", empty: p("none") })));

const router = createRouter({ "/": () => Home, "/about": () => About, "/plain": () => Plain });

describe("route.app() with no window", () => {
  it("renders the page into the region and nothing else of the router's", async () => {
    const route = await router.start("/about");
    const html = renderToString(route.app(App));

    expect(html).toMatch(/<main><!--region-start-\d+-v1--><div id="about">.*<!--region-end--><\/main>/);
    expect(html).not.toContain("list-start");
    expect(html).not.toContain("<!--view-");
    expect(html).not.toContain(">none<");
  });

  it("keeps the pages of interleaved requests apart", async () => {
    const [home, about] = await Promise.all([router.start("/"), router.start("/about")]);

    const htmlAbout = renderToString(about.app(App));
    const htmlHome = renderToString(home.app(App));

    expect(htmlAbout).toContain('id="about"');
    expect(htmlAbout).not.toContain('id="home"');
    expect(htmlHome).toContain('id="home"');
    expect(htmlHome).not.toContain('id="about"');
  });

  it("renders the same Route twice without the pages piling up", async () => {
    const route = await router.start("/");
    const first = renderToString(route.app(App));
    const second = renderToString(route.app(App));

    expect(first).toBe(second);
    expect(second.match(/id="home"/g)?.length).toBe(1);
  });

  it("mounts nothing of its own when the app placed pages() itself", async () => {
    const route = await router.start("/plain");
    // Placed before the render, so app() knows to mount nothing.
    const pages = route.pages();
    const html = renderToString(route.app(() => () => div({ id: "shell" }, main({ id: "outlet" }, pages))));

    expect(html.match(/id="plain"/g)?.length).toBe(1);
    expect(html).toMatch(/<main id="outlet"><!--list-start-\d+--><div id="plain">/);
  });

  it("warns when pages() is placed inside the tree app() already mounted", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await router.start("/plain");
    renderToString(route.app((r) => () => div(main(r.pages()))));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/placed after route\.app\(\)/);
    warn.mockRestore();
  });

  it("leaves a page that is not a view out of the HTML", async () => {
    const route = await router.start("/plain");
    const html = renderToString(route.app(App));

    expect(html).not.toContain("plain");
    expect(html).toContain(">none<");
  });
});
