/// <reference path="../../types/index.d.ts" />
import { expect, it, vi } from "vitest";
import { registerMount, registerDestroy, flushMountQueue } from "../../src/element/lifecycle";
import { safeRemoveChild, disposeLifecyclesInSubtree } from "../../src/shared/dom";

it("runs cleanup returned after a mount callback removes its own element", () => {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const cleanup = vi.fn();
  const laterMount = vi.fn();
  registerMount(element, () => {
    safeRemoveChild(element);
    return cleanup;
  });
  registerMount(element, laterMount);
  flushMountQueue();
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(laterMount).not.toHaveBeenCalled();
});

it.each([safeRemoveChild, disposeLifecyclesInSubtree])(
  "destroys every sibling when a destroy callback removes itself (%s)",
  (dispose) => {
    const parent = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("span");
    parent.append(first, second);
    document.body.appendChild(parent);
    const destroySecond = vi.fn();
    registerDestroy(first, () => first.remove());
    registerDestroy(second, destroySecond);
    flushMountQueue();
    dispose(parent);
    expect(destroySecond).toHaveBeenCalledTimes(1);
    parent.remove();
  },
);
