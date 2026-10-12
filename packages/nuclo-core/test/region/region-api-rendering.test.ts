/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCss, css, cx, forceUpdate, getCssText, globalStyle, hydrate, into,
  keyframes, list, on, region, render, resetStyles, scope, update, variants, when,
} from "../../src";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";

describe("region/into rendering API combinations", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    update();
    resetStyles();
    root = document.createElement("div");
    document.body.append(root);
  });
  afterEach(() => {
    root.remove();
    update();
    forceUpdate();
    resetStyles();
  });

  for (const type of ["latest", "stack"] as const) {
    it.each(["render", "hydrate"])(`${type}: composes styles through %s, forceUpdate and scoped update`, (mount) => {
      const themed = createCss({ colors: { accent: "#123456" } });
      const recipe = variants({ variants: { tone: { quiet: { opacity: 0.5 }, loud: { opacity: 1 } } } });
      let loud = false;
      let active = false;
      let color = "red";
      const App = () => {
        const animation = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
        globalStyle(".portal-view", { boxSizing: "border-box" });
        return div(region({ id: "main", type }), into("main",
          section(scope("view"), list(() => ["row"], () => button(
            { id: "styled" },
            cx("portal-view", themed.css({ color: "accent" }), recipe({ tone: loud ? "loud" : "quiet" })),
            css({ animation: `${animation} 1s linear` }),
            { className: () => active ? "active" : "idle", style: () => ({ backgroundColor: color }) },
            when(() => active, "active").else("idle"),
          ))),
        ));
      };
      if (mount === "hydrate") {
        root.innerHTML = withServerGlobals(() => renderToString(App));
        const server = root.querySelector("button");
        hydrate(App, root);
        expect(root.querySelector("button")).toBe(server);
      } else render(App, root);
      const buttonEl = root.querySelector("button")!;
      const quiet = cx(themed.css({ color: "accent" }), recipe({ tone: "quiet" })).className;
      const loudClass = cx(themed.css({ color: "accent" }), recipe({ tone: "loud" })).className;
      expect(buttonEl.classList.contains(quiet)).toBe(true);
      loud = true;
      forceUpdate();
      expect(root.querySelector("button")).toBe(buttonEl);
      expect(buttonEl.classList.contains(quiet)).toBe(false);
      expect(buttonEl.classList.contains(loudClass)).toBe(true);
      const stableCss = getCssText();
      forceUpdate();
      forceUpdate();
      expect(getCssText()).toBe(stableCss);
      expect(stableCss.match(/@keyframes /g)).toHaveLength(1);
      expect(stableCss.match(/\.portal-view\{/g)).toHaveLength(1);
      expect(stableCss).toContain("color:#123456");
      active = true;
      color = "blue";
      update("view");
      expect(buttonEl.classList.contains("active")).toBe(true);
      expect(buttonEl.classList.contains("idle")).toBe(false);
      expect(buttonEl.classList.contains(loudClass)).toBe(true);
      expect(buttonEl.style.backgroundColor).toBe("blue");
      expect(buttonEl.textContent).toBe("active");
    });

    it(`${type}: refreshes dynamic empty content and cleans it up when a view arrives`, () => {
      let visible = false;
      let count = 1;
      const destroyed = vi.fn();
      const clicked = vi.fn();
      render(() => div(
        region({ id: "main", type, empty: section(scope("empty"),
          list(() => ["fallback"], () => button({ onDestroy: destroyed }, on("click", clicked), () => String(count))),
          when(() => count > 1, span("more")),
        ) }),
        when(() => visible, into("main", article("content"))),
      ), root);
      const fallback = root.querySelector("button")!;
      forceUpdate();
      count = 2;
      update("empty");
      expect(root.querySelector("button")).toBe(fallback);
      expect(fallback.textContent).toBe("2");
      expect(root.querySelector("span")!.textContent).toBe("more");
      visible = true;
      forceUpdate();
      expect(root.querySelector("button")).toBeNull();
      expect(destroyed).toHaveBeenCalledTimes(1);
      fallback.click();
      expect(clicked).not.toHaveBeenCalled();
      visible = false;
      forceUpdate();
      expect(root.querySelector("button")).not.toBe(fallback);
      expect(root.querySelector("button")!.textContent).toBe("2");
    });

    it(`${type}: preserves raw nodes between dynamic blocks and replaces mismatched tags`, () => {
      const raw = document.createElement("strong");
      raw.textContent = "raw";
      let changed = false;
      let values = ["a"];
      const destroyed = vi.fn();
      render(() => div(region({ id: "main", type }), into("main", section(
        list(() => values, value => span(value)),
        raw,
        changed ? article("new") : p({ onDestroy: destroyed }, "old"),
        when(() => changed, em("shown")),
      ))), root);
      values = ["a", "b"];
      changed = true;
      forceUpdate();
      forceUpdate();
      expect(root.querySelector("strong")).toBe(raw);
      expect(root.querySelectorAll("strong")).toHaveLength(1);
      expect(Array.from(root.querySelector("section")!.children, el => el.tagName)).toEqual(["SPAN", "SPAN", "STRONG", "ARTICLE", "EM"]);
      expect(destroyed).toHaveBeenCalledTimes(1);
      values = [];
      update();
      expect(root.querySelector("section")!.textContent).toBe("rawnewshown");
    });
  }

  it.each([false, true])("refreshes SVG lists inside a view (hydrated=%s)", (ssr) => {
    let shapes = [1, 2];
    let fill = "red";
    const App = () => div(region({ id: "main" }), into("main", section(scope("graphic"),
      svgSvg({ viewBox: "0 0 100 100" }, list(() => shapes, n => circleSvg({ cx: String(n * 10), cy: "20", r: "5", fill: () => fill }))),
    )));
    if (ssr) {
      root.innerHTML = withServerGlobals(() => renderToString(App));
      hydrate(App, root);
    } else render(App, root);
    const circles = Array.from(root.querySelectorAll("circle"));
    forceUpdate();
    circles.forEach((circleEl, i) => expect(root.querySelectorAll("circle")[i]).toBe(circleEl));
    fill = "blue";
    shapes = [2, 1, 3];
    update("graphic");
    expect(root.querySelectorAll("circle")[0]).toBe(circles[1]);
    expect(root.querySelectorAll("circle")[1]).toBe(circles[0]);
    for (const circleEl of root.querySelectorAll("circle")) {
      expect(circleEl.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(circleEl.getAttribute("fill")).toBe("blue");
    }
    forceUpdate();
    expect(root.querySelectorAll("circle")).toHaveLength(3);
  });

  it("keeps other views alive when a tracked event handler throws", () => {
    let count = 0;
    const broken = new Error("event failed");
    render(() => div(region({ id: "main", type: "stack" }),
      into("main", button({ id: "bad" }, on("click", () => { throw broken; }))),
      into("main", button({ id: "good" }, scope("good"), on("click", () => { count++; update("good"); }), () => String(count)))), root);
    forceUpdate();
    root.querySelector<HTMLButtonElement>("#bad")!.click();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.any(String), broken);
    root.querySelector<HTMLButtonElement>("#good")!.click();
    expect(root.querySelector("#good")!.textContent).toBe("1");
    forceUpdate();
    expect(root.querySelectorAll("button")).toHaveLength(2);
  });

  it("recovers a failed component build while another root keeps refreshing", () => {
    let fail = false;
    let label = "before";
    const mounted = vi.fn();
    render(() => {
      if (fail) throw new Error("build failed");
      return div(region({ id: "main" }), into("main", button({ onMount: mounted }, label)));
    }, root);
    const sibling = document.createElement("div");
    root.append(sibling);
    render(() => aside(label), sibling);
    const buttonEl = root.querySelector("button")!;
    fail = true;
    label = "after";
    forceUpdate();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(root.querySelector("button")).toBe(buttonEl);
    expect(buttonEl.textContent).toBe("before");
    expect(sibling.textContent).toBe("after");
    fail = false;
    forceUpdate();
    expect(root.querySelector("button")).toBe(buttonEl);
    expect(buttonEl.textContent).toBe("after");
    expect(mounted).toHaveBeenCalledTimes(1);
  });

  it("clears event-property handlers when a conditional view is destroyed", () => {
    let visible = true;
    const clicked = vi.fn();
    render(() => div(region({ id: "main" }), when(() => visible,
      into("main", button({ onClick: clicked })))), root);
    const buttonEl = root.querySelector("button")!;
    forceUpdate();
    visible = false;
    forceUpdate();
    expect(buttonEl.isConnected).toBe(false);
    buttonEl.click();
    expect(clicked).not.toHaveBeenCalled();
  });
});
