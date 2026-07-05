/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Targets the SSR-only (non-browser) code paths of src/polyfill/Element.ts:
 *  - SSRStyle (lazy `style` getter): cssText, setProperty, getPropertyValue
 *  - SSRClassList (lazy `classList` getter): full DOMTokenList surface
 *  - addEventListener early return when _listeners is null (SSR path)
 */
import { describe, it, expect } from "vitest";
import { NucloElement } from "../../src/polyfill/Element";

describe("NucloElement SSR style (SSRStyle)", () => {
  it("cssText is empty before any property is set", () => {
    const el = new NucloElement("div");
    expect(el.style.cssText).toBe("");
  });

  it("setProperty/getPropertyValue round-trip and serialize via cssText", () => {
    const el = new NucloElement("div");
    el.style.setProperty("color", "red");
    (el.style as unknown as Record<string, unknown>)["background"] = "blue";

    expect(el.style.getPropertyValue("color")).toBe("red");
    expect(el.style.getPropertyValue("missing")).toBe("");
    expect(el.style.cssText).toContain("color: red");
    expect(el.style.cssText).toContain("background: blue");
  });
});

describe("NucloElement SSR classList (SSRClassList)", () => {
  it("add() dedupes, skips falsy tokens, and joins with spaces", () => {
    const el = new NucloElement("div");
    el.classList.add("a", "", "b");
    el.classList.add("a");
    expect(el.className).toBe("a b");
    expect(el.classList.length).toBe(2);
  });

  it("remove() filters tokens and no-ops on an empty className", () => {
    const el = new NucloElement("div");
    el.classList.remove("anything"); // early return: no className yet
    expect(el.className).toBe("");

    el.classList.add("a", "b", "c");
    el.classList.remove("b", "missing");
    expect(el.className).toBe("a c");
  });

  it("contains() reflects the current class set", () => {
    const el = new NucloElement("div");
    expect(el.classList.contains("x")).toBe(false);
    el.classList.add("x");
    expect(el.classList.contains("x")).toBe(true);
  });

  it("toggle() with and without force", () => {
    const el = new NucloElement("div");
    expect(el.classList.toggle("t")).toBe(true);
    expect(el.classList.toggle("t")).toBe(false);
    expect(el.classList.toggle("f", true)).toBe(true);
    expect(el.classList.contains("f")).toBe(true);
    expect(el.classList.toggle("f", false)).toBe(false);
    expect(el.classList.contains("f")).toBe(false);
  });

  it("replace() swaps existing tokens and rejects missing ones", () => {
    const el = new NucloElement("div");
    el.classList.add("old");
    expect(el.classList.replace("old", "new")).toBe(true);
    expect(el.className).toContain("new");
    expect(el.classList.replace("ghost", "x")).toBe(false);
  });

  it("item(), value, toString() and supports()", () => {
    const el = new NucloElement("div");
    el.classList.add("a", "b");
    expect(el.classList.item(0)).toBe("a");
    expect(el.classList.item(9)).toBeNull();
    expect(el.classList.value).toBe("a b");
    expect(el.classList.toString()).toBe("a b");
    expect(el.classList.supports("a")).toBe(false);

    el.classList.value = "p q";
    expect(el.className).toBe("p q");
  });

  it("length is 0 for an empty className", () => {
    const el = new NucloElement("div");
    expect(el.classList.length).toBe(0);
  });

  it("iteration: Symbol.iterator, forEach, entries, keys, values", () => {
    const el = new NucloElement("div");
    el.classList.add("a", "b");

    expect([...el.classList]).toEqual(["a", "b"]);

    const seen: Array<[number, string]> = [];
    el.classList.forEach((value, key) => seen.push([key, value]));
    expect(seen).toEqual([[0, "a"], [1, "b"]]);

    const entries = el.classList.entries();
    expect(entries.next().value).toEqual([0, "a"]);
    expect(entries.next().value).toEqual([1, "b"]);
    expect(entries.next().done).toBe(true);

    const keys = el.classList.keys();
    expect(keys.next().value).toBe(0);
    expect(keys.next().value).toBe(1);
    expect(keys.next().done).toBe(true);

    const values = el.classList.values();
    expect(values.next().value).toBe("a");
    expect(values.next().value).toBe("b");
    expect(values.next().done).toBe(true);
  });
});

describe("NucloElement SSR event listeners", () => {
  it("addEventListener is a no-op when _listeners is null (SSR path)", () => {
    const el = new NucloElement("div");
    const handler = () => {};
    expect(() => el.addEventListener("click", handler)).not.toThrow();
    expect(() => el.removeEventListener("click", handler)).not.toThrow();
    // dispatchEvent finds no listeners and does not bubble anywhere.
    expect(
      el.dispatchEvent({ type: "click", bubbles: false } as unknown as Event),
    ).toBe(true);
  });
});
