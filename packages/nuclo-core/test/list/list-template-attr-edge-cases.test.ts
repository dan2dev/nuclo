/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import "../../src";

/**
 * The list() row-template engine clones the first row and patches only what
 * differs. These rows are shapes where "the clone already has it" is false —
 * each must render exactly like the normal (un-templated) build path.
 */
describe("list() row template — attribute edge cases", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  const rows = <T extends Element>(selector: string): T[] => Array.from(container.querySelectorAll<T>(selector));

  describe("the same key in two attribute objects (last one wins)", () => {
    it("a later object equal to the first row's value still overrides an earlier one", () => {
      const items = [{ a: "a", b: "b" }, { a: "x", b: "b" }, { a: "y", b: "z" }, { a: "a", b: "b" }];
      render(div(list(() => items, (it) => span({ id: it.a }, { id: it.b }))), container);
      expect(rows("span").map((s) => s.id)).toEqual(["b", "b", "z", "b"]);
    });

    it("stays correct for rows appended by update()", () => {
      let items = [{ a: "a", b: "b" }];
      render(div(list(() => items, (it) => span({ title: it.a }, { title: it.b }))), container);
      items = [...items, { a: "q", b: "b" }, { a: "a", b: "w" }];
      update();
      expect(rows("span").map((s) => s.title)).toEqual(["b", "b", "w"]);
    });

    it("static className in two objects merges on every row", () => {
      const items = [{ c: "one" }, { c: "two" }, { c: "one" }];
      render(div(list(() => items, (it) => span({ className: "base" }, { className: it.c }))), container);
      expect(rows("span").map((s) => s.className)).toEqual(["base one", "base two", "base one"]);
    });

    it("static + reactive className on one element stay merged and reactive", () => {
      const items = [{ on: true }, { on: false }, { on: true }];
      render(div(list(() => items, (it) => span({ className: "base" }, { className: () => (it.on ? "on" : "") }))), container);
      expect(rows("span").map((s) => s.className)).toEqual(["base on", "base", "base on"]);
      items[1]!.on = true;
      items[2]!.on = false;
      update();
      expect(rows("span").map((s) => s.className)).toEqual(["base on", "base on", "base"]);
    });

    it("two onClick objects: only the last handler fires, per row", () => {
      const calls: string[] = [];
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      render(
        div(list(() => items, (it) =>
          button({ onClick: () => { calls.push(`first-${it.id}`); } }, { onClick: () => { calls.push(`last-${it.id}`); } }))),
        container,
      );
      for (const b of rows<HTMLButtonElement>("button")) b.click();
      expect(calls).toEqual(["last-1", "last-2", "last-3"]);
    });

    it("a nullish earlier value does not count as a duplicate", () => {
      const items = [{ t: "a" }, { t: "b" }, { t: "a" }];
      render(div(list(() => items, (it) => span({ title: null }, { title: it.t }, "x"))), container);
      expect(rows("span").map((s) => s.title)).toEqual(["a", "b", "a"]);
    });
  });

  describe("state cloneNode() does not copy", () => {
    it("<select> value set after its options is applied to every row", () => {
      const items = [{ v: "b" }, { v: "b" }, { v: "c" }, { v: "a" }, { v: "b" }];
      render(
        div(list(() => items, (it) =>
          select(option({ value: "a" }, "A"), option({ value: "b" }, "B"), option({ value: "c" }, "C"), { value: it.v }))),
        container,
      );
      expect(rows<HTMLSelectElement>("select").map((s) => s.value)).toEqual(["b", "b", "c", "a", "b"]);
    });

    it("rows added later by update() get the value too", () => {
      let items = [{ v: "c" }];
      render(
        div(list(() => items, (it) =>
          select(option({ value: "a" }, "A"), option({ value: "c" }, "C"), { value: it.v }))),
        container,
      );
      items = [...items, { v: "c" }, { v: "a" }, { v: "c" }];
      update();
      expect(rows<HTMLSelectElement>("select").map((s) => s.value)).toEqual(["c", "c", "a", "c"]);
    });

    it("form control values equal to the first row's are preserved", () => {
      const items = [{ v: "x", c: true }, { v: "x", c: true }, { v: "y", c: false }, { v: "x", c: true }];
      render(
        div(list(() => items, (it) =>
          div(input({ value: it.v }), input({ type: "checkbox", checked: it.c }), textarea({ value: it.v })))),
        container,
      );
      expect(rows<HTMLInputElement>("input[type=checkbox]").map((i) => i.checked)).toEqual([true, true, false, true]);
      expect(rows<HTMLInputElement>("input:not([type])").map((i) => i.value)).toEqual(["x", "x", "y", "x"]);
      expect(rows<HTMLTextAreaElement>("textarea").map((t) => t.value)).toEqual(["x", "x", "y", "x"]);
    });

    it("numeric property values (coerced by the DOM) are written on every row", () => {
      const items = [{ n: 3 }, { n: 3 }, { n: 7 }];
      render(div(list(() => items, (it) => section({ tabIndex: it.n }, input({ value: it.n as unknown as string })))), container);
      expect(rows<HTMLElement>("section").map((d) => d.tabIndex)).toEqual([3, 3, 7]);
      expect(rows<HTMLInputElement>("input").map((i) => i.value)).toEqual(["3", "3", "7"]);
    });

    it("plain attributes keep the fast path and stay correct", () => {
      const items = Array.from({ length: 200 }, (_, i) => ({ id: i, even: i % 2 === 0 }));
      render(
        div(list(() => items, (it) => section({ className: "row", "data-kind": it.even ? "even" : "odd", title: "t" }, String(it.id)))),
        container,
      );
      const els = rows<HTMLElement>("section");
      expect(els.length).toBe(200);
      for (let i = 0; i < els.length; i++) {
        expect(els[i]!.className).toBe("row");
        expect(els[i]!.getAttribute("data-kind")).toBe(i % 2 === 0 ? "even" : "odd");
        expect(els[i]!.title).toBe("t");
        expect(els[i]!.textContent).toBe(String(i));
      }
    });
  });
});
