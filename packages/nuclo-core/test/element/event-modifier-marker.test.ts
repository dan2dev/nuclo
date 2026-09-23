/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Edge cases for the internal event-modifier marker (element/factory-meta.ts)
 * and how on() applies it (element/events.ts). list() row templates replay a
 * modifier on cloned rows only when isEventModifier() is true, so the marker
 * must be precise: exactly the native-event modifiers on() returns, nothing
 * else — not lifecycle modifiers, not plain NodeModFns, not look-alikes.
 */
import { describe, it, expect, vi } from "vitest";
import { EVENT_MODIFIER, isEventModifier, markEventModifier, getFactoryMods } from "../../src/element/factory-meta";
import { on, removeAllListeners } from "../../src/element/events";
import "../../src/index";

declare const div: ExpandedElementBuilder<"div">;

describe("isEventModifier()", () => {
  it("rejects every non-function value", () => {
    for (const value of [undefined, null, 0, 1, "", "on", true, false, Symbol("x"), 10n, [], {}]) {
      expect(isEventModifier(value)).toBe(false);
    }
  });

  it("rejects an object that carries the marker (only functions qualify)", () => {
    const lookalike = { [EVENT_MODIFIER]: true };
    expect(isEventModifier(lookalike)).toBe(false);
  });

  it("rejects plain functions, arrows, classes and bound functions", () => {
    expect(isEventModifier(function named() {})).toBe(false);
    expect(isEventModifier(() => undefined)).toBe(false);
    expect(isEventModifier((_parent: unknown) => undefined)).toBe(false);
    expect(isEventModifier(class Foo {})).toBe(false);
    expect(isEventModifier(function () {}.bind(null))).toBe(false);
  });

  it("requires the marker to be exactly true, not merely truthy", () => {
    for (const marker of [1, "true", {}, [], "yes"]) {
      const fn = () => undefined;
      (fn as unknown as Record<symbol, unknown>)[EVENT_MODIFIER] = marker;
      expect(isEventModifier(fn)).toBe(false);
    }
    const falseMarked = () => undefined;
    (falseMarked as unknown as Record<symbol, unknown>)[EVENT_MODIFIER] = false;
    expect(isEventModifier(falseMarked)).toBe(false);
  });

  it("does not treat tag-builder factories as event modifiers", () => {
    const factory = div("x");
    expect(getFactoryMods(factory)).toBeDefined();
    expect(isEventModifier(factory)).toBe(false);
  });
});

describe("markEventModifier()", () => {
  it("returns the very same function it was given", () => {
    const fn = () => undefined;
    expect(markEventModifier(fn)).toBe(fn);
    expect(isEventModifier(fn)).toBe(true);
  });

  it("is idempotent", () => {
    const fn = () => undefined;
    markEventModifier(markEventModifier(fn));
    expect(isEventModifier(fn)).toBe(true);
  });

  it("stays invisible to string-keyed enumeration and JSON", () => {
    const fn = markEventModifier(Object.assign(() => undefined, { visible: 1 }));
    expect(Object.keys(fn)).toEqual(["visible"]);
    const forInKeys: string[] = [];
    for (const key in fn) forInKeys.push(key);
    expect(forInKeys).toEqual(["visible"]);
    expect(JSON.stringify({ fn })).toBe("{}");
    expect(Object.getOwnPropertySymbols(fn)).toContain(EVENT_MODIFIER);
  });

  it("does not change what the function does or how it is called", () => {
    const impl = vi.fn((a: number, b: number) => a + b);
    const marked = markEventModifier(impl);
    expect(marked(2, 3)).toBe(5);
    expect(impl).toHaveBeenCalledWith(2, 3);
    expect(marked.length).toBe(impl.length);
  });
});

describe("on() marking", () => {
  it("marks native, custom and option-bearing event modifiers", () => {
    const handler = () => undefined;
    expect(isEventModifier(on("click", handler))).toBe(true);
    expect(isEventModifier(on("keydown", handler))).toBe(true);
    expect(isEventModifier(on("app:ready", handler))).toBe(true);
    expect(isEventModifier(on("click", handler, true))).toBe(true);
    expect(isEventModifier(on("click", handler, false))).toBe(true);
    expect(isEventModifier(on("click", handler, { capture: true, once: true, passive: true }))).toBe(true);
  });

  it("never marks the lifecycle pseudo-events", () => {
    expect(isEventModifier(on("mount", () => undefined))).toBe(false);
    expect(isEventModifier(on("destroy", () => undefined))).toBe(false);
  });

  it("returns a distinct marked modifier per call (nothing shared across listeners)", () => {
    const handler = () => undefined;
    const first = on("click", handler);
    const second = on("click", handler);
    expect(first).not.toBe(second);
    expect(isEventModifier(first) && isEventModifier(second)).toBe(true);
  });

  it("keeps the modifier's arity (templates and the normal build call it with the parent)", () => {
    expect(on("click", () => undefined).length).toBe(1);
  });

  it("still attaches, fires and tracks the listener when applied directly", () => {
    const handler = vi.fn();
    const el = document.createElement("button");
    const modifier = on("click", handler);
    modifier(el as never, 0);
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);

    removeAllListeners(el, "click");
    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("applying the same marked modifier to many elements attaches it to each", () => {
    const seen: EventTarget[] = [];
    const modifier = on("click", (e) => { seen.push(e.currentTarget!); });
    const elements = [document.createElement("a"), document.createElement("a"), document.createElement("a")];
    for (const el of elements) modifier(el as never, 0);
    for (const el of elements) el.click();
    expect(seen).toEqual(elements);
  });

  it("is harmless on parents that cannot hold listeners", () => {
    const modifier = on("click", () => undefined);
    expect(() => modifier(null as never, 0)).not.toThrow();
    expect(() => modifier({} as never, 0)).not.toThrow();
  });
});
