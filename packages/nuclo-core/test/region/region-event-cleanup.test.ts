/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { forceUpdate, hydrate, into, list, on, region, render, update, when } from "../../src";
import { applyAttributes } from "../../src/element/attributes";
import { removeAllListeners } from "../../src/element/events";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";

const registrations = ["onClick", "onDoubleClick", "onCompositionEnd", "on", "lowercase"] as const;
const removals = ["conditional", "partial-list", "clear-list", "replace-list", "cover", "retarget", "tag-mismatch"] as const;

describe("event cleanup across regions and forced refreshes", () => {
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

  for (const registration of registrations) {
    const eventName = registration === "onDoubleClick" ? "dblclick"
      : registration === "onCompositionEnd" ? "compositionend" : "click";
    const modifiers = (handler: () => void) => {
      if (registration === "on") return [on("click", handler)];
      if (registration === "lowercase") {
        // Untyped JavaScript's supported native-property spelling.
        return [{ onclick: handler } as unknown as ExpandedElementAttributes<"button">];
      }
      return [{ [registration]: handler }];
    };
    const fire = (el: Element) => el.dispatchEvent(new Event(eventName, { bubbles: true }));

    describe(registration, () => {
      it.each(removals)("removes retained descendant handlers on %s", removal => {
        let visible = true;
        let cover = false;
        let replace = false;
        let target = "main";
        let rows = [0, 1, 2];
        const clicked = vi.fn();
        const neighborClicked = vi.fn();
        const row = (id: number) => div(button({ "data-row": String(id) }, ...modifiers(() => clicked(id))));
        render(() => div(
          region({ id: "main" }), region({ id: "other" }),
          when(() => visible, into(target, replace ? article("replacement") : section(
            list(() => rows, row),
          ))),
          when(() => cover, into("main", article("cover"))),
          button({ id: "neighbor", onClick: neighborClicked }),
        ), root);
        const old = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-row]"));
        old.forEach(fire);
        expect(clicked.mock.calls).toEqual([[0], [1], [2]]);
        clicked.mockClear();
        forceUpdate();
        forceUpdate();
        old.forEach((el, i) => expect(root.querySelectorAll("[data-row]")[i]).toBe(el));
        switch (removal) {
          case "conditional": visible = false; forceUpdate(); break;
          case "partial-list": rows = [0, 2]; update(); break;
          case "clear-list": rows = []; update(); break;
          case "replace-list": rows = [3, 4, 5]; update(); break;
          case "cover": cover = true; update(); break;
          case "retarget": target = "other"; forceUpdate(); break;
          case "tag-mismatch": replace = true; forceUpdate(); break;
        }
        const removed = removal === "partial-list" ? [old[1]!] : old;
        for (const el of removed) {
          expect(el.isConnected).toBe(false);
          fire(el);
        }
        expect(clicked).not.toHaveBeenCalled();
        root.querySelector<HTMLButtonElement>("#neighbor")!.click();
        expect(neighborClicked).toHaveBeenCalledTimes(1);
        for (const el of root.querySelectorAll<HTMLButtonElement>("[data-row]")) {
          fire(el);
          expect(clicked).toHaveBeenLastCalledWith(Number(el.dataset.row));
        }
        expect(clicked).toHaveBeenCalledTimes(root.querySelectorAll("[data-row]").length);
        expect(console.error).not.toHaveBeenCalled();
      });

      // Lowercase spellings are a client-side compatibility path, outside the public SSR API.
      it.each(registration === "lowercase" ? ["render"] : ["render", "hydrate"])("drops omitted handlers on reused %s nodes and can register again", mount => {
        let enabled = true;
        let generation = 0;
        const clicked = vi.fn();
        const App = () => {
          const captured = generation;
          return div(region({ id: "main" }), into("main",
            button(...(enabled ? modifiers(() => clicked(captured)) : [])),
          ));
        };
        if (mount === "hydrate") {
          root.innerHTML = withServerGlobals(() => renderToString(App));
          hydrate(App, root);
        } else render(App, root);
        const el = root.querySelector("button")!;
        fire(el);
        expect(clicked.mock.calls).toEqual([[0]]);
        enabled = false;
        forceUpdate();
        forceUpdate();
        expect(root.querySelector("button")).toBe(el);
        fire(el);
        expect(clicked.mock.calls).toEqual([[0]]);
        generation = 1;
        enabled = true;
        forceUpdate();
        forceUpdate();
        fire(el);
        expect(clicked.mock.calls).toEqual([[0], [1]]);
      });

      it("cleans optimized list clones without a preceding forceUpdate", () => {
        let rows = [0, 1, 2, 3];
        const clicked = vi.fn();
        render(div(region({ id: "main" }), into("main", section(
          list(() => rows, id => div(button(...modifiers(() => clicked(id))))),
        ))), root);
        const buttons = Array.from(root.querySelectorAll("button"));
        buttons.forEach(fire);
        expect(clicked.mock.calls).toEqual([[0], [1], [2], [3]]);
        clicked.mockClear();
        rows = [];
        update();
        buttons.forEach(fire);
        expect(clicked).not.toHaveBeenCalled();
      });
    });
  }

  it("cleans multiple property/fallback/on listeners idempotently and preserves external listeners", () => {
    const el = document.createElement("button");
    const click = vi.fn();
    const key = vi.fn();
    const composition = vi.fn();
    const focus = vi.fn();
    const tracked = vi.fn();
    const external = vi.fn();
    applyAttributes(el, { onClick: click, onKeyDown: key, onCompositionEnd: composition, onFocusIn: focus });
    on("click", tracked)(el, 0);
    el.addEventListener("click", external);
    removeAllListeners(el);
    removeAllListeners(el);
    el.click();
    for (const eventName of ["keydown", "compositionend", "focusin"]) el.dispatchEvent(new Event(eventName));
    for (const handler of [click, key, composition, focus, tracked]) expect(handler).not.toHaveBeenCalled();
    expect(el.onclick).toBeNull();
    expect(el.onkeydown).toBeNull();
    expect(external).toHaveBeenCalledTimes(1);
    applyAttributes(el, { onCompositionEnd: composition });
    el.dispatchEvent(new Event("compositionend"));
    expect(composition).toHaveBeenCalledTimes(1);
  });

  it("preserves native handlers replaced externally after nuclo's assignment", () => {
    const el = document.createElement("button");
    const old = vi.fn();
    const external = vi.fn();
    applyAttributes(el, { onClick: old });
    el.onclick = external;
    removeAllListeners(el);
    expect(el.onclick).toBe(external);
    el.click();
    expect(external).toHaveBeenCalledTimes(1);
    expect(old).not.toHaveBeenCalled();
  });

  it.each([false, true])("removes listeners before bulk-list destroy callbacks (siblings=%s)", siblings => {
    let rows = [0, 1];
    const clicked = vi.fn();
    const destroyed = vi.fn();
    render(() => div(region({ id: "main" }), into("main", section(
      ...(siblings ? [p("before")] : []),
      list(() => rows, () => button({ onClick: clicked, onDestroy: el => { el.click(); destroyed(); } }, on("click", clicked))),
      ...(siblings ? [p("after")] : []),
    ))), root);
    rows = [];
    update();
    expect(clicked).not.toHaveBeenCalled();
    expect(destroyed).toHaveBeenCalledTimes(2);
    expect(root.querySelector("section")!.textContent).toBe(siblings ? "beforeafter" : "");
  });
});
