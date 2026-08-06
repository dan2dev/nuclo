// @vitest-environment node
/// <reference path="../../types/index.d.ts" />
import { describe, expect, it, vi } from "vitest";
import { on } from "../../src/element/events";

describe("on utility in SSR", () => {
  it("returns a shared inert modifier without allocating listener wrappers", () => {
    const listener = vi.fn();
    const first = on("click", listener);
    const second = on("online", listener);

    expect(first).toBe(second);
    expect(first.length).toBe(1);
    expect(() => first({} as ExpandedElement<"button">, 0)).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});
