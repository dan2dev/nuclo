// @vitest-environment node
/**
 * route.run() on a real server: no window, many Routes alive at once, one
 * shared router the app reads. Each render mounts its own Route's pages on a
 * host that is never serialized, so interleaved requests cannot see each
 * other's pages.
 */
import { describe, it, expect, vi } from "vitest";
import "nuclo/polyfill";
import "nuclo";
import { renderToString } from "nuclo/ssr";
import { createRouter, type PageComponent } from "../src/index";

const Home: PageComponent = () => into("main", div({ id: "home" }, "home"));
const About: PageComponent = () => into("main", div({ id: "about" }, "about"));
const Plain: PageComponent = () => div({ id: "plain" }, "plain");

const router = createRouter({ "/": () => Home, "/about": () => About, "/plain": () => Plain });

const App = () =>
  div({ id: "shell" }, a({ href: router.href("/") }, () => router.path), main(region({ id: "main", empty: p("none") })));

describe("route.run() with no window", () => {
  it("renders the page into the region and nothing else of the router's", async () => {
    const route = await router.start("/about");
    const html = route.run(() => renderToString(App));

    expect(html).toMatch(/<main><!--region-start-\d+-v1--><div id="about">.*<!--region-end--><\/main>/);
    expect(html).not.toContain("list-start");
    expect(html).not.toContain("<!--view-");
    expect(html).not.toContain(">none<");
  });

  it("keeps the pages of interleaved requests apart", async () => {
    const [home, about] = await Promise.all([router.start("/"), router.start("/about")]);

    const htmlAbout = about.run(() => renderToString(App));
    const htmlHome = home.run(() => renderToString(App));

    expect(htmlAbout).toContain('id="about"');
    expect(htmlAbout).not.toContain('id="home"');
    expect(htmlHome).toContain('id="home"');
    expect(htmlHome).not.toContain('id="about"');
  });

  it("renders the same Route twice without the pages piling up", async () => {
    const route = await router.start("/");
    const first = route.run(() => renderToString(App));
    const second = route.run(() => renderToString(App));

    expect(first).toBe(second);
    expect(second.match(/id="home"/g)?.length).toBe(1);
  });

  it("leaves a page that is not a view out of the HTML, and says so", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await router.start("/plain");
    const html = route.run(() => renderToString(App));

    expect(html).not.toContain('id="plain"');
    expect(html).toContain(">none<");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/"\/plain" returned content without an into\(\)/);
    warn.mockRestore();
  });

  it("warns once the render is over when a page's view has no region in it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const typo = createRouter({ "/": () => () => into("mian", div({ id: "typo" }, "typo")) });
    const route = await typo.start("/");
    const html = route.run(() => renderToString(() => div(main(region({ id: "main" })))));
    await Promise.resolve();

    expect(html).not.toContain('id="typo"');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/"\/" returned an into\(\) whose region is not in the tree/);
    warn.mockRestore();
  });

  it("stays quiet for a page whose view landed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await router.start("/about");
    route.run(() => renderToString(App));
    await Promise.resolve();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("has no active route outside run(), even after start()", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = await router.start("/");
    // renderToString() logs a throwing render and returns "".
    expect(renderToString(App)).toBe("");
    expect(String(error.mock.calls[0][1])).toMatch(/inside route\.run\(\)/);
    error.mockRestore();

    // run() restores what was active before it, nested or not.
    route.run(() => {
      expect(router.path).toBe("/");
      expect(() => route.run(() => { throw new Error("boom"); })).toThrow("boom");
      expect(router.path).toBe("/");
    });
    expect(() => router.path).toThrow(/no active route/);
  });
});
