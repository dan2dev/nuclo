/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * HTML boolean attributes are true by presence: `inert="false"` makes an
 * element inert. A `false` value must therefore drop the attribute entirely —
 * otherwise the server-rendered page behaves differently from the client
 * render until hydration fixes it (an inert, unclickable button; a video
 * forced inline).
 *
 * Each case is checked on what a real HTML parser makes of the output.
 */
const first = <T extends Element>(html: string, selector: string): T =>
  new JSDOM(`<!doctype html><body>${html}</body>`).window.document.querySelector<T>(selector)!;

describe("renderToString — boolean attributes", () => {
  const CASES: Array<[property: string, attribute: string, build: (value: boolean) => unknown]> = [
    ["inert", "inert", (v) => button({ inert: v }, "x")],
    ["itemScope", "itemscope", (v) => div({ itemScope: v })],
    ["playsInline", "playsinline", (v) => video({ playsInline: v })],
    ["disablePictureInPicture", "disablepictureinpicture", (v) => video({ disablePictureInPicture: v })],
    ["disableRemotePlayback", "disableremoteplayback", (v) => audio({ disableRemotePlayback: v })],
    ["disabled", "disabled", (v) => button({ disabled: v }, "x")],
    ["hidden", "hidden", (v) => div({ hidden: v })],
    ["readOnly", "readonly", (v) => input({ readOnly: v })],
    ["required", "required", (v) => input({ required: v })],
    ["multiple", "multiple", (v) => select({ multiple: v })],
    ["checked", "checked", (v) => input({ type: "checkbox", checked: v })],
    ["open", "open", (v) => details({ open: v })],
    ["controls", "controls", (v) => video({ controls: v })],
    ["muted", "muted", (v) => video({ muted: v })],
    ["loop", "loop", (v) => audio({ loop: v })],
    ["autoplay", "autoplay", (v) => video({ autoplay: v })],
    ["noValidate", "novalidate", (v) => form({ noValidate: v })],
    ["allowFullscreen", "allowfullscreen", (v) => iframe({ allowFullscreen: v })],
    ["reversed", "reversed", (v) => ol({ reversed: v })],
    ["selected", "selected", (v) => option({ selected: v }, "x")],
    ["async", "async", (v) => script({ async: v })],
    ["defer", "defer", (v) => script({ defer: v })],
  ];

  for (const [property, attribute, build] of CASES) {
    it(`${property}: false is omitted, true is present`, () => {
      const off = renderToString(build(false) as never);
      const on = renderToString(build(true) as never);
      expect(off).not.toContain(attribute);
      expect(on).toMatch(new RegExp(` ${attribute}(?=[ >/])`));

      const tag = on.slice(1, on.search(/[ >]/));
      expect(first(off, tag).hasAttribute(attribute)).toBe(false);
      expect(first(on, tag).hasAttribute(attribute)).toBe(true);
    });

    it(`${property}: a reactive resolver follows the same rule`, () => {
      expect(renderToString(build(false) as never)).toBe(renderToString((build as (v: unknown) => unknown)(() => false) as never));
      expect(renderToString(build(true) as never)).toBe(renderToString((build as (v: unknown) => unknown)(() => true) as never));
    });
  }

  it("enumerated true/false attributes keep their value", () => {
    const html = renderToString(div({ draggable: false, spellcheck: false, contentEditable: "false", "aria-hidden": false, "aria-expanded": true }));
    const el = first<HTMLElement>(html, "div");
    expect(el.getAttribute("draggable")).toBe("false");
    expect(el.getAttribute("spellcheck")).toBe("false");
    expect(el.getAttribute("contenteditable")).toBe("false");
    expect(el.getAttribute("aria-hidden")).toBe("false");
    expect(el.getAttribute("aria-expanded")).toBe("true");
  });

  it("an inert:false button is clickable in the server-rendered page", () => {
    const el = first<HTMLButtonElement>(renderToString(button({ inert: false, disabled: false }, "Save")), "button");
    expect(el.hasAttribute("inert")).toBe(false);
    expect(el.disabled).toBe(false);
  });
});
