/// <reference path="../../types/index.d.ts" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { on, removeAllListeners } from "../../src/element/events";

describe("on utility listener detachment", () => {
  let element: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("button");
    document.body.appendChild(element);
  });

  it("detaches listeners with their original capture flags", () => {
    const removeSpy = vi.spyOn(element, "removeEventListener");

    on("click", vi.fn(), false)(element, 0);
    on("focus", vi.fn(), { capture: true, passive: true })(element, 0);
    removeAllListeners(element);

    expect(removeSpy).toHaveBeenCalledWith("click", expect.any(Function), false);
    expect(removeSpy).toHaveBeenCalledWith("focus", expect.any(Function), true);
  });

  it("selectively detaches matching event types", () => {
    const click = vi.fn();
    const focus = vi.fn();

    on("click", click)(element, 0);
    on("focus", focus)(element, 0);
    removeAllListeners(element, "click");

    element.click();
    element.dispatchEvent(new Event("focus"));

    expect(click).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalledOnce();
  });

  it("can detach listeners after the element leaves the document", () => {
    const listener = vi.fn();

    on("click", listener)(element, 0);
    element.remove();
    removeAllListeners(element);
    element.click();

    expect(listener).not.toHaveBeenCalled();
  });

  it("is idempotent for elements without tracked listeners", () => {
    expect(() => {
      removeAllListeners(element);
      removeAllListeners(element, "click");
      removeAllListeners(element);
    }).not.toThrow();
  });
});
