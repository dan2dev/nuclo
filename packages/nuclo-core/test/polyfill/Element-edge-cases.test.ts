/// <reference path="../../types/index.d.ts" />
import { NucloElement } from "../../src/polyfill/Element";
import { describe, it, expect } from "vitest";

describe("NucloElement edge cases", () => {
  describe("removeChild with _childNodes (browser path)", () => {
    it("should remove from _childNodes when present", () => {
      const el = new NucloElement("div");
      const child = new NucloElement("span");
      el.children.push(child);

      // Simulate browser path _childNodes array
      (el as any)["_childNodes"] = [child];

      el.removeChild(child as unknown as Node);

      expect(el.children).toEqual([]);
      expect((el as any)["_childNodes"]).toEqual([]);
    });
  });

  describe("replaceChild with _childNodes (browser path)", () => {
    it("should update _childNodes when present", () => {
      const el = new NucloElement("div");
      const oldChild = new NucloElement("span");
      const newChild = new NucloElement("p");
      el.children.push(oldChild);

      // Simulate browser path _childNodes array
      (el as any)["_childNodes"] = [oldChild];

      el.replaceChild(newChild as unknown as Node, oldChild as unknown as Node);

      expect(el.children[0]).toBe(newChild);
      expect((el as any)["_childNodes"][0]).toBe(newChild);
    });
  });

  describe("SSRClassList iterator methods", () => {
    it("Symbol.iterator yields class tokens", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      const items = [...el.classList];
      expect(items).toEqual(["foo", "bar"]);
    });

    it("entries() yields [index, className] tuples", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      const entries = [...el.classList.entries()];
      expect(entries).toEqual([
        [0, "foo"],
        [1, "bar"],
      ]);
    });

    it("keys() yields indices", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      const keys = [...el.classList.keys()];
      expect(keys).toEqual([0, 1]);
    });

    it("values() yields class names", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      const vals = [...el.classList.values()];
      expect(vals).toEqual(["foo", "bar"]);
    });

    it("value getter returns className", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      expect(el.classList.value).toBe("foo bar");
    });

    it("value setter sets className", () => {
      const el = new NucloElement("div");
      el.classList.value = "baz qux";
      expect(el.className).toBe("baz qux");
    });
  });

  describe("classList.toggle with force parameter", () => {
    it("toggle with force=true adds the class", () => {
      const el = new NucloElement("div");
      const result = el.classList.toggle("x", true);
      expect(result).toBe(true);
      expect(el.classList.contains("x")).toBe(true);
    });

    it("toggle with force=true when already present keeps it", () => {
      const el = new NucloElement("div");
      el.className = "x";
      const result = el.classList.toggle("x", true);
      expect(result).toBe(true);
      expect(el.classList.contains("x")).toBe(true);
    });

    it("toggle with force=false removes the class", () => {
      const el = new NucloElement("div");
      el.className = "x";
      const result = el.classList.toggle("x", false);
      expect(result).toBe(false);
      expect(el.classList.contains("x")).toBe(false);
    });

    it("toggle with force=false when absent is a no-op", () => {
      const el = new NucloElement("div");
      const result = el.classList.toggle("x", false);
      expect(result).toBe(false);
      expect(el.classList.contains("x")).toBe(false);
    });
  });

  describe("classList.replace", () => {
    it("replaces an existing token with a new one", () => {
      const el = new NucloElement("div");
      el.className = "foo bar";
      const result = el.classList.replace("foo", "baz");
      expect(result).toBe(true);
      expect(el.classList.contains("baz")).toBe(true);
      expect(el.classList.contains("foo")).toBe(false);
    });

    it("returns false when old token is not present", () => {
      const el = new NucloElement("div");
      el.className = "foo";
      const result = el.classList.replace("missing", "baz");
      expect(result).toBe(false);
      expect(el.className).toBe("foo");
    });
  });

  describe("classList.forEach", () => {
    it("iterates over all class tokens", () => {
      const el = new NucloElement("div");
      el.className = "a b c";
      const collected: [string, number][] = [];
      el.classList.forEach((value, key) => {
        collected.push([value, key]);
      });
      expect(collected).toEqual([
        ["a", 0],
        ["b", 1],
        ["c", 2],
      ]);
    });
  });

  describe("replaceChild basic (SSR path)", () => {
    it("updates children array and sets parentNode correctly", () => {
      const el = new NucloElement("div");
      const oldChild = new NucloElement("span");
      const newChild = new NucloElement("p");
      el.appendChild(oldChild as unknown as Node);

      expect((oldChild as any).parentNode).toBe(el);

      el.replaceChild(newChild as unknown as Node, oldChild as unknown as Node);

      expect(el.children.length).toBe(1);
      expect(el.children[0]).toBe(newChild);
      expect((newChild as any).parentNode).toBe(el);
      expect((oldChild as any).parentNode).toBe(null);
    });
  });

  describe("removeChild when child not in children", () => {
    it("should be a no-op for unknown child", () => {
      const el = new NucloElement("div");
      const existing = new NucloElement("span");
      const stranger = new NucloElement("p");
      el.appendChild(existing as unknown as Node);

      el.removeChild(stranger as unknown as Node);

      expect(el.children.length).toBe(1);
      expect(el.children[0]).toBe(existing);
    });
  });
});
