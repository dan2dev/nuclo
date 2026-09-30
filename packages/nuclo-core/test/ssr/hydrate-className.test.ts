/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { hydrate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr";
import { css } from "../../src/style";
import "../../src";

/**
 * hydrate() must treat the server-rendered class attribute as output of the
 * client's className modifiers, not as extra static classes — otherwise a
 * dynamic className adds to the server value instead of replacing it.
 */
describe("hydrate() — className replaces server classes", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="r"></div>';
    root = document.getElementById("r")!;
  });

  function ssrThenHydrate(app: () => ExpandedElement<"div">, html = renderToString(app)): HTMLElement {
    root.innerHTML = html;
    const ssrEl = root.firstElementChild;
    const el = hydrate(app, root) as HTMLElement;
    expect(el).toBe(ssrEl);
    return el;
  }

  it("dynamic className string replaces the server value on update", () => {
    let on = false;
    const App = () => div({ className: () => (on ? "on" : "off") }, "x");
    const el = ssrThenHydrate(App);
    expect(el.className).toBe("off");

    on = true;
    update();
    expect(el.className).toBe("on");

    on = false;
    update();
    expect(el.className).toBe("off");
  });

  it("toggled css() result replaces the server class on update", () => {
    const a = css({ color: "red" });
    const b = css({ color: "blue" });
    let on = false;
    const App = () => div(() => (on ? b : a), "x");
    const el = ssrThenHydrate(App);
    expect(el.className).toBe(a.className);

    on = true;
    update();
    expect(el.className).toBe(b.className);
  });

  it("keeps static classes alongside a dynamic className", () => {
    let on = false;
    const App = () => div({ className: "base" }, { className: () => (on ? "on" : "off") });
    const el = ssrThenHydrate(App);
    expect(el.className).toBe("base off");

    on = true;
    update();
    expect(el.className).toBe("base on");
  });

  it("mismatched static className converges on the client value", () => {
    const App = () => div({ className: "client" }, "x");
    const el = ssrThenHydrate(App, '<div class="server"><!-- text-0 -->x</div>');
    expect(el.className).toBe("client");
  });
});
