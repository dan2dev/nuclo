/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { withServerGlobals } from "../integration/fuzz-harness";
import "../../src";

/**
 * An <input>'s `value` is sanitized against its type/min/max/step as they
 * stand at the moment it is written — a range input clamps it. Attribute
 * objects are applied key by key, so without care `{ value: 150, max: 200 }`
 * would clamp to the default max (100) before max is set. nuclo applies an
 * input's `value` after the other keys of the same object.
 */
describe("<input> value is applied after the attributes it depends on", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  const inputs = (): HTMLInputElement[] => Array.from(container.getElementsByTagName("input"));

  it("range: every key order yields the same value", () => {
    render(
      div(
        input({ type: "range", value: "150", min: "0", max: "200" }),
        input({ value: "150", type: "range", max: "200" }),
        input({ max: "200", value: "150", type: "range" }),
        input({ type: "range", min: "0", max: "200", value: "150" }),
      ),
      container,
    );
    expect(inputs().map((el) => el.value)).toEqual(["150", "150", "150", "150"]);
  });

  it("range: min and step are honoured too", () => {
    render(
      div(
        input({ type: "range", value: "-40", min: "-50", max: "50" }),
        input({ type: "range", value: "0.25", step: "0.25", max: "1" }),
      ),
      container,
    );
    expect(inputs().map((el) => el.value)).toEqual(["-40", "0.25"]);
  });

  it("a value outside the declared range is still clamped by the browser", () => {
    render(input({ type: "range", value: "500", max: "200" }), container);
    expect(inputs()[0]!.value).toBe("200");
  });

  it("reactive value and reactive max change in the same update()", () => {
    const state = { value: 150, max: 200 };
    render(input({ type: "range", value: () => String(state.value), max: () => String(state.max) }), container);
    const el = inputs()[0]!;
    expect(el.value).toBe("150");

    state.max = 1000;
    state.value = 900;
    update();
    expect(el.value).toBe("900");
    expect(el.max).toBe("1000");
  });

  it("list rows (first row and template clones) all get their own value", () => {
    const rows = Array.from({ length: 40 }, (_, k) => ({ id: k, level: 100 + k * 5 }));
    render(div(list(() => rows, (row) => label(input({ type: "range", value: String(row.level), max: "400" })))), container);
    expect(inputs().map((el) => el.value)).toEqual(rows.map((row) => String(row.level)));
  });

  it("text, checkbox and number inputs are unaffected", () => {
    render(
      div(
        input({ value: "hello", type: "text", maxLength: 3 }),
        input({ value: "on-value", type: "checkbox", checked: true }),
        input({ value: "42", type: "number", min: "50" }),
      ),
      container,
    );
    const [text, box, num] = inputs();
    expect(text!.value).toBe("hello");
    expect(box!.value).toBe("on-value");
    expect(box!.checked).toBe(true);
    expect(num!.value).toBe("42");
  });

  it("hydrate() and forceUpdate() keep the unclamped value", () => {
    let level = "150";
    const App = () => div(input({ type: "range", value: level, max: "200" }));
    container.innerHTML = withServerGlobals(() => renderToString(App));
    const el = inputs()[0]!;
    // (No assertion on the parsed value: jsdom sanitizes attribute by attribute
    // while parsing, a browser only once the element is complete.)

    hydrate(App, container);
    expect(inputs()[0]).toBe(el);
    expect(el.value).toBe("150");

    level = "180";
    forceUpdate();
    expect(el.value).toBe("180");
  });

  it("other elements keep plain key order (a <progress> value is not deferred)", () => {
    render(div(progress({ value: 150, max: 200 }), meter({ value: 0.7, min: 0, max: 1 })), container);
    expect(container.querySelector("progress")!.value).toBe(150);
    expect(container.querySelector("meter")!.value).toBe(0.7);
  });
});
