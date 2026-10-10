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

const Home: PageComponent = () => div({ id: "home" }, "home");
const About: PageComponent = () => div({ id: "about" }, "about");
const router = createRouter({ "/": () => Home, "/about": () => About });

const App = () =>
  div({ id: "shell" }, a({ href: router.href("/") }, () => router.path), main(router.outlet()));

describe("route.run() with no window", () => {
  it("renders the page in the outlet", async () => {
    const route = await router.start("/about");
    const html = route.run(() => renderToString(App));

    expect(html).toMatch(/<main><!--list-start[^>]*--><div id="about">.*<!--list-end[^>]*--><\/main>/);
    expect(html).not.toContain("<!--view-");
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
