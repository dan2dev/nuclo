// @vitest-environment node
/// <reference path="../../types/index.d.ts" />
import { describe, expect, it, vi } from "vitest";
import { on } from "../../src/element/events";
import { registerMount, registerUnmount } from "../../src/element/lifecycle";

describe("lifecycle in a pure Node environment (no window/document at all)", () => {
  it("on(\"mount\"/\"unmount\") return a shared inert modifier and never call the callback", () => {
    const mount = vi.fn();
    const unmount = vi.fn();
    const mountMod = on("mount", mount);
    const unmountMod = on("unmount", unmount);

    expect(() => mountMod({} as ExpandedElement<"div">, 0)).not.toThrow();
    expect(() => unmountMod({} as ExpandedElement<"div">, 0)).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
    expect(unmount).not.toHaveBeenCalled();
  });

  it("registerMount()/registerUnmount() are no-ops without a browser environment", () => {
    const mount = vi.fn();
    const unmount = vi.fn();
    // A plain object stands in for an element — if these weren't no-ops they
    // would still just queue/store, but nothing should even get that far.
    const fakeElement = {} as unknown as Element;

    expect(() => registerMount(fakeElement, mount)).not.toThrow();
    expect(() => registerUnmount(fakeElement, unmount)).not.toThrow();
    expect(mount).not.toHaveBeenCalled();
    expect(unmount).not.toHaveBeenCalled();
  });
});
