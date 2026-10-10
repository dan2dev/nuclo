/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forceUpdate, hydrate, into, list, on, region, render, scope, update, when } from "../../src";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";

// Cross nesting order with both region modes, mount paths and refresh APIs.
// Each case also combines scopes, lifecycle, both event APIs, reactive
// attributes/text, list changes and chained conditional branches.
const shapes = ["into-list", "list-into", "into-when", "when-into", "nested-region", "multi-target"] as const;

describe("region/into API combinations", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    update();
    root = document.createElement("div");
    document.body.append(root);
  });
  afterEach(() => {
    root.remove();
    update();
    forceUpdate();
  });

  for (const type of ["latest", "stack"] as const) {
    for (const mount of ["render", "hydrate"] as const) {
      for (const refresh of ["registered", "explicit"] as const) {
        describe(`${type}/${mount}/${refresh}`, () => {
          it.each(shapes)("keeps %s reactive and disposes it exactly once", (shape) => {
            let active = true;
            let model = { count: 0, branch: 0, rows: ["a", "b"] };
            const mounted = vi.fn();
            const cleanup = vi.fn();
            const destroyed = vi.fn();
            const events: string[] = [];
            const Leaf = () => {
              const current = model;
              return section({ id: "leaf", title: () => String(current.count) }, scope("leaf"),
                on("mount", el => { expect(el.isConnected).toBe(true); mounted(); return cleanup; }),
                on("destroy", destroyed),
                button({ onClick: () => { events.push(`prop:${current.count}`); } },
                  on("click", () => { events.push(`on:${current.count}`); }),
                  () => String(current.count)),
                ul(list(() => current.rows, value => li({ "data-row": value }, value))),
                when(() => current.branch === 0, p({ "data-branch": "zero" }, "zero"))
                  .when(() => current.branch === 1, p({ "data-branch": "one" }, "one"))
                  .else(p({ "data-branch": "other" }, "other")),
              );
            };
            const App = () => {
              const leaf = Leaf();
              const views = () => {
                switch (shape) {
                  case "into-list": return into("main", list(() => active ? ["leaf"] : [], () => leaf));
                  case "list-into": return list(() => active ? ["leaf"] : [], () => into("main", leaf));
                  case "into-when": return into("main", when(() => active, leaf));
                  case "when-into": return when(() => active, into("main", leaf));
                  case "nested-region": return into("main", div(region({ id: "nested", type }), when(() => active, into("nested", leaf))));
                  case "multi-target": return into({ main: when(() => active, leaf), side: span("side") });
                }
              };
              return div(
                div({ id: "destination" }, region({ id: "main", type })),
                div(region({ id: "side" })),
                div({ id: "source" }, scope("source"), views()),
                aside({ id: "outside" }, () => String(model.count)),
              );
            };
            if (mount === "hydrate") {
              root.innerHTML = withServerGlobals(() => renderToString(App));
              const serverLeaf = root.querySelector("#leaf");
              hydrate(App, root);
              expect(root.querySelector("#leaf")).toBe(serverLeaf);
            } else render(App, root);
            const force = () => refresh === "registered" ? forceUpdate() : forceUpdate(App(), root);
            const leaf = root.querySelector<HTMLElement>("#leaf")!;
            const buttonEl = leaf.querySelector("button")!;
            const rowA = leaf.querySelector('[data-row="a"]');
            expect(mounted).toHaveBeenCalledTimes(1);

            const old = model;
            model = { count: 1, branch: 1, rows: ["a", "b", "c"] };
            force();
            force();
            expect(root.querySelector("#leaf")).toBe(leaf);
            expect(leaf.querySelector("button")).toBe(buttonEl);
            expect(leaf.querySelector('[data-row="a"]')).toBe(rowA);
            expect(Array.from(leaf.querySelectorAll("li"), el => el.textContent)).toEqual(["a", "b", "c"]);
            expect(leaf.querySelector("p")!.dataset.branch).toBe("one");
            expect(leaf.title).toBe("1");
            buttonEl.click();
            expect(events).toEqual(["prop:1", "on:1"]);
            expect(mounted).toHaveBeenCalledTimes(1);
            expect(cleanup).not.toHaveBeenCalled();

            model.count = 2;
            model.branch = 2;
            model.rows = ["c", "a"];
            update("leaf");
            expect(Array.from(leaf.querySelectorAll("li"), el => el.textContent)).toEqual(["c", "a"]);
            expect(leaf.querySelectorAll("li")[1]).toBe(rowA);
            model.rows = ["a"];
            update("leaf");
            expect(buttonEl.textContent).toBe("2");
            expect(leaf.title).toBe("2");
            expect(leaf.querySelector("p")!.dataset.branch).toBe("other");
            expect(leaf.querySelectorAll("li")).toHaveLength(1);
            expect(leaf.querySelector("li")).toBe(rowA);
            expect(root.querySelector("#outside")!.textContent).toBe("1");
            expect(old.count).toBe(0);

            active = false;
            force();
            force();
            expect(root.querySelector("#leaf")).toBeNull();
            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(destroyed).toHaveBeenCalledTimes(1);
            buttonEl.click();
            expect(events).toEqual(["prop:1", "on:1"]);
            active = true;
            force();
            expect(root.querySelector("#leaf")).not.toBe(leaf);
            expect(root.querySelector("#leaf button")!.textContent).toBe("2");
            expect(mounted).toHaveBeenCalledTimes(2);
            model.count = 3;
            update("leaf");
            expect(root.querySelector("#leaf button")!.textContent).toBe("3");
            expect(console.error).not.toHaveBeenCalled();
          });
        });
      }
    }
  }

  it("scopes portal content by destination, and its conditional anchor by source", () => {
    let count = 0;
    let visible = true;
    render(() => div(
      section(scope("destination"), region({ id: "main" })),
      aside(scope("source"), when(() => visible, into("main", p(() => String(count))))),
    ), root);
    forceUpdate();
    count = 1;
    update("source");
    expect(root.querySelector("p")!.textContent).toBe("0");
    update("destination");
    expect(root.querySelector("p")!.textContent).toBe("1");
    visible = false;
    update("destination");
    expect(root.querySelector("p")).not.toBeNull();
    update("source");
    expect(root.querySelector("p")).toBeNull();
    visible = true;
    update("source", "destination");
    expect(root.querySelector("p")!.textContent).toBe("1");
  });

  it("deduplicates overlapping and repeated scopes after forced refreshes", () => {
    let count = 0;
    const resolve = vi.fn(() => String(count));
    render(() => div(scope("outer"), region({ id: "main" }),
      into("main", section(scope("inner", "shared", "shared"), p(resolve)))), root);
    forceUpdate();
    forceUpdate();
    resolve.mockClear();
    count = 1;
    update("outer", "inner", "shared", "outer");
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(root.querySelector("p")!.textContent).toBe("1");
    resolve.mockClear();
    count = 2;
    update("unknown");
    expect(resolve).not.toHaveBeenCalled();
    expect(root.querySelector("p")!.textContent).toBe("1");
  });

  it.each([false, true])("refreshes cross-root views regardless of registration order (sourceFirst=%s)", (sourceFirst) => {
    let count = 0;
    const calls = vi.fn();
    const source = document.createElement("div");
    const destination = document.createElement("div");
    root.append(source, destination);
    const Source = () => div(list(() => ["a"], () => into("main",
      button(scope("content"), on("click", calls), () => String(count)))));
    const Destination = () => section(region({ id: "main" }));
    if (sourceFirst) { render(Source, source); render(Destination, destination); }
    else { render(Destination, destination); render(Source, source); }
    const buttonEl = destination.querySelector("button")!;
    count = 1;
    forceUpdate();
    forceUpdate();
    expect(destination.querySelector("button")).toBe(buttonEl);
    expect(buttonEl.textContent).toBe("1");
    buttonEl.click();
    expect(calls).toHaveBeenCalledTimes(1);
    count = 2;
    update("content");
    expect(buttonEl.textContent).toBe("2");
  });

  it.each(["click", "custom-event"])("replaces %s listeners and honors capture/once/abort", (eventName) => {
    const events: string[] = [];
    let generation = 0;
    let controller = new AbortController();
    render(() => {
      const current = generation;
      return div(region({ id: "main" }), into("main", section(
        on(eventName, () => events.push(`capture:${current}`), true),
        on(eventName, () => events.push(`bubble:${current}`)),
        button(on(eventName, () => events.push(`once:${current}`), { once: true }),
          on(eventName, () => events.push(`signal:${current}`), { signal: controller.signal })),
      )));
    }, root);
    const buttonEl = root.querySelector("button")!;
    generation = 1;
    forceUpdate();
    forceUpdate();
    buttonEl.dispatchEvent(new Event(eventName, { bubbles: true }));
    buttonEl.dispatchEvent(new Event(eventName, { bubbles: true }));
    expect(events.splice(0)).toEqual([
      "capture:1", "once:1", "signal:1", "bubble:1", "capture:1", "signal:1", "bubble:1",
    ]);
    controller.abort();
    buttonEl.dispatchEvent(new Event(eventName, { bubbles: true }));
    expect(events.splice(0)).toEqual(["capture:1", "bubble:1"]);
    controller = new AbortController();
    generation = 2;
    forceUpdate();
    buttonEl.dispatchEvent(new Event(eventName, { bubbles: true }));
    expect(events).toEqual(["capture:2", "once:2", "signal:2", "bubble:2"]);
  });

  it("allows an event to force-refresh its own view and scope-update a nested list", () => {
    let count = 0;
    render(() => div(region({ id: "main" }), into("main", section(scope("view"),
      button(on("click", () => { count++; forceUpdate(); update("view"); }), String(count)),
      list(() => Array.from({ length: count }, (_, i) => i), value => span(String(value))),
    ))), root);
    const buttonEl = root.querySelector("button")!;
    buttonEl.click();
    buttonEl.click();
    expect(root.querySelector("button")).toBe(buttonEl);
    expect(buttonEl.textContent).toBe("2");
    expect(Array.from(root.querySelectorAll("span"), el => el.textContent)).toEqual(["0", "1"]);
  });

  it.each(["attributes", "modifiers"] as const)("preserves original %s lifecycle hooks and destroys children first", (api) => {
    let visible = true;
    let generation = 0;
    const calls: string[] = [];
    const App = () => {
      const current = generation;
      const hooks = (name: string) => {
        const mount = () => {
          calls.push(`mount:${name}:${current}`);
          return () => { calls.push(`cleanup:${name}:${current}`); };
        };
        const destroy = () => { calls.push(`destroy:${name}:${current}`); };
        return api === "attributes"
          ? [{ onMount: mount, onDestroy: destroy }]
          : [on("mount", mount), on("destroy", destroy)];
      };
      return div(region({ id: "main" }), when(() => visible, into("main",
        section(...hooks("parent"), list(() => ["child"], name => button(...hooks(name)))),
      )));
    };
    render(App, root);
    expect(calls.filter(call => call.startsWith("mount:")).sort()).toEqual(["mount:child:0", "mount:parent:0"]);
    calls.length = 0;
    generation = 1;
    forceUpdate();
    forceUpdate();
    expect(calls).toEqual([]);
    visible = false;
    forceUpdate();
    expect(calls).toHaveLength(4);
    expect(calls.slice(0, 2).sort()).toEqual(["cleanup:child:0", "destroy:child:0"]);
    expect(calls.slice(2).sort()).toEqual(["cleanup:parent:0", "destroy:parent:0"]);
    calls.length = 0;
    forceUpdate();
    update();
    expect(calls).toEqual([]);
    visible = true;
    forceUpdate();
    expect(calls.sort()).toEqual(["mount:child:1", "mount:parent:1"]);
  });

  it("continues sibling cleanup when a view's destroy callback throws", () => {
    let visible = true;
    const cleaned = vi.fn();
    render(() => div(region({ id: "main" }), when(() => visible, into("main",
      section(
        button(on("destroy", () => { throw new Error("cleanup failed"); })),
        button(on("mount", () => cleaned)),
      ),
    ))), root);
    forceUpdate();
    visible = false;
    forceUpdate();
    expect(root.querySelector("section")).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(cleaned).toHaveBeenCalledTimes(1);
    forceUpdate();
    expect(cleaned).toHaveBeenCalledTimes(1);
  });

});
