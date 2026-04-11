/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { notifyReactiveElements, registerAttributeResolver } from "../../src/core/reactiveAttributes";
import * as dom from "../../src/utility/dom";

describe("reactiveAttributes update event cleanup", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("removes reactive element info when update event sees it as disconnected", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    let resolverCalls = 0;
    registerAttributeResolver(
      el,
      "data-x",
      () => {
        resolverCalls += 1;
        return resolverCalls;
      },
      (value) => el.setAttribute("data-x", String(value))
    );
    expect(resolverCalls).toBe(1);
    expect(el.getAttribute("data-x")).toBe("1");

    const connectedSpy = vi.spyOn(dom, "isNodeConnected").mockReturnValue(false);
    el.dispatchEvent(new Event("update", { bubbles: true }));
    connectedSpy.mockRestore();

    notifyReactiveElements();
    expect(resolverCalls).toBe(1);
    expect(el.getAttribute("data-x")).toBe("1");
  });
});

