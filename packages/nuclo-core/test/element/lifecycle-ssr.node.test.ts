// @vitest-environment node
/// <reference path="../../types/index.d.ts" />
import { describe, expect, it, vi } from "vitest";
import { on } from "../../src/element/events";
import { registerMount, registerDestroy } from "../../src/element/lifecycle";

describe("lifecycle in a pure Node environment (no window/document at all)", () => {
  it("on(\"mount\"/\"destroy\") return a shared inert modifier and never call the callback", () => {
    const mount = vi.fn();
    const destroy = vi.fn();
    const mountMod = on("mount", mount);
    const destroyMod = on("destroy", destroy);

    expect(() => mountMod({} as ExpandedElement<"div">, 0)).not.toThrow();
    expect(() => destroyMod({} as ExpandedElement<"div">, 0)).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it("registerMount()/registerDestroy() are no-ops without a browser environment", () => {
    const mount = vi.fn();
    const destroy = vi.fn();
    // A plain object stands in for an element — if these weren't no-ops they
    // would still just queue/store, but nothing should even get that far.
    const fakeElement = {} as unknown as Element;

    expect(() => registerMount(fakeElement, mount)).not.toThrow();
    expect(() => registerDestroy(fakeElement, destroy)).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });
});
