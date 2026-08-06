/// <reference path="../../types/index.d.ts" />
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyAttributes } from "../../src/element/attributes";
import { eventAttributeToProperty } from "../../src/element/event-attributes";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

describe("camel-cased event attributes", () => {
  let button: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    button = document.createElement("button");
    document.body.appendChild(button);
  });

  it("assigns onClick to the native lowercase event property", () => {
    const handler = vi.fn();

    applyAttributes(button, { onClick: handler });

    expect(button.onclick).toBe(handler);
    expect((button as unknown as Record<string, unknown>).onClick).toBeUndefined();

    const event = new MouseEvent("click", { bubbles: true });
    button.dispatchEvent(event);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("does not evaluate a zero-arity handler as a reactive attribute", () => {
    const handler = vi.fn();

    applyAttributes(button, { onClick: handler });

    expect(handler).not.toHaveBeenCalled();
    button.click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("normalizes compound event names", () => {
    const keyDown = vi.fn();
    const beforeInput = vi.fn();

    applyAttributes(button, { onKeyDown: keyDown, onBeforeInput: beforeInput });

    expect(button.onkeydown).toBe(keyDown);
    expect(button.onbeforeinput).toBe(beforeInput);

    button.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    button.dispatchEvent(new InputEvent("beforeinput", { data: "x" }));
    expect(keyDown).toHaveBeenCalledOnce();
    expect(beforeInput).toHaveBeenCalledOnce();
  });

  it("maps the conventional onDoubleClick alias to ondblclick", () => {
    const handler = vi.fn();

    applyAttributes(button, { onDoubleClick: handler });

    expect(button.ondblclick).toBe(handler);
    button.dispatchEvent(new MouseEvent("dblclick"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("normalizes aliases, vendor events, and tag-specific events", () => {
    expect(eventAttributeToProperty("onDblClick")).toBe("ondblclick");
    expect(eventAttributeToProperty("onWebkitAnimationEnd")).toBe("onwebkitanimationend");
    expect(eventAttributeToProperty("onEnterPictureInPicture")).toBe(
      "onenterpictureinpicture",
    );
    expect(eventAttributeToProperty("onBeforeUnload")).toBe("onbeforeunload");
  });

  it.each([
    "",
    "on",
    "onclick",
    "OnClick",
    "once",
    "on1Click",
    "on-click",
  ])("rejects non-camel-cased event attribute %j", (attribute) => {
    expect(eventAttributeToProperty(attribute)).toBeNull();
  });

  it.each([
    ["onCompositionStart", "compositionstart"],
    ["onCompositionUpdate", "compositionupdate"],
    ["onCompositionEnd", "compositionend"],
    ["onFocusIn", "focusin"],
    ["onFocusOut", "focusout"],
  ])("handles %s when the native IDL property is absent", (attribute, type) => {
    const handler = vi.fn();

    applyAttributes(button, { [attribute]: handler });
    button.dispatchEvent(new Event(type));

    expect(handler).toHaveBeenCalledOnce();
  });

  it("replaces a fallback listener assigned to the same attribute", () => {
    const first = vi.fn();
    const second = vi.fn();

    applyAttributes(button, { onCompositionEnd: first });
    applyAttributes(button, { onCompositionEnd: second });
    button.dispatchEvent(new Event("compositionend"));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("tracks multiple fallback event types on one element", () => {
    const composition = vi.fn();
    const focus = vi.fn();

    applyAttributes(button, {
      onCompositionEnd: composition,
      onFocusIn: focus,
    });
    button.dispatchEvent(new Event("compositionend"));
    button.dispatchEvent(new Event("focusin"));

    expect(composition).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
  });

  it("does not register the same fallback handler twice", () => {
    const handler = vi.fn();

    applyAttributes(button, { onCompositionEnd: handler });
    applyAttributes(button, { onCompositionEnd: handler });
    button.dispatchEvent(new Event("compositionend"));

    expect(handler).toHaveBeenCalledOnce();
  });

  it("replaces a previously assigned handler", () => {
    const first = vi.fn();
    const second = vi.fn();

    applyAttributes(button, { onClick: first });
    applyAttributes(button, { onClick: second });
    button.click();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("does not mistake lowercase custom attributes beginning with on for events", () => {
    const value = "first";

    applyAttributes(button, { once: () => value });
    expect(button.getAttribute("once")).toBe("first");
  });

  it("preserves lowercase native event properties for untyped JavaScript", () => {
    const handler = vi.fn();

    applyAttributes(
      button,
      { onclick: handler } as unknown as ExpandedElementAttributes<"button">,
    );
    button.click();

    expect(handler).toHaveBeenCalledOnce();
  });

  it("omits camel-cased handlers from SSR output", () => {
    const html = renderToString(
      globalThis.button("Remove", { onClick: () => undefined }),
    );

    expect(html).toBe("<button><!-- text-0 -->Remove</button>");
    expect(html).not.toContain("onClick");
    expect(html).not.toContain("onclick");
  });
});
