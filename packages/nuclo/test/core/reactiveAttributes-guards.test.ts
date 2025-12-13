/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi } from "vitest";
import { registerAttributeResolver } from "../../src/core/reactiveAttributes";

describe("reactiveAttributes guards", () => {
  it("does not require document.addEventListener to exist", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const original = document.addEventListener;
    (document as any).addEventListener = undefined;

    try {
      expect(() =>
        registerAttributeResolver(el as any, "data-x", () => "1", () => {})
      ).not.toThrow();
    } finally {
      (document as any).addEventListener = original;
    }
  });

  it("ignores update events when global Node is unavailable", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let value = "a";
    let calls = 0;
    registerAttributeResolver(
      el as any,
      "data-x",
      () => {
        calls += 1;
        return value;
      },
      (v) => el.setAttribute("data-x", String(v))
    );

    value = "b";
    vi.stubGlobal("Node", undefined as any);
    try {
      el.dispatchEvent(new Event("update", { bubbles: true }));
    } finally {
      vi.unstubAllGlobals();
    }

    expect(calls).toBe(1);
    expect(el.getAttribute("data-x")).toBe("a");
  });
});

