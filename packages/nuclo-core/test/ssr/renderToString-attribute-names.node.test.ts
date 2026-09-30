/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * SSR attribute names must be what a browser would have produced for the
 * same builder call. In a browser, a camelCase key like `tabIndex` hits the
 * element's IDL property and is reflected to its content attribute
 * (`tabindex`); the polyfill element has no such properties, so the key is
 * stored verbatim and mapped at serialization time.
 */
import "../../src/polyfill";
import "../../src";
import { describe, it, expect } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { propertyToAttribute } from "../../src/shared/strings";

describe("propertyToAttribute()", () => {
  it.each([
    ["tabIndex", "tabindex"],
    ["maxLength", "maxlength"],
    ["readOnly", "readonly"],
    ["contentEditable", "contenteditable"],
    ["crossOrigin", "crossorigin"],
    ["srcSet", "srcset"],
    ["dateTime", "datetime"],
    ["colSpan", "colspan"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["acceptCharset", "accept-charset"],
    ["defaultValue", "value"],
    ["defaultChecked", "checked"],
    ["defaultSelected", "selected"],
    ["ariaLabel", "aria-label"],
    ["ariaDescribedBy", "aria-describedby"],
    ["ariaHasPopup", "aria-haspopup"],
    ["ariaValueNow", "aria-valuenow"],
    ["aria-label", "aria-label"],
    ["data-key", "data-key"],
    ["data-userId", "data-userid"],
    ["aria", "aria"],
    ["arial", "arial"],
    ["id", "id"],
    ["", ""],
  ])("%s → %s", (input, output) => {
    expect(propertyToAttribute(input)).toBe(output);
  });
});

describe("renderToString — HTML attribute names match browser reflection", () => {
  it("reflects camelCase IDL property names to their content attributes", () => {
    const html = renderToString(input({
      tabIndex: 1, maxLength: 5, contentEditable: "true", crossOrigin: "anonymous",
      ariaDescribedBy: "help", ariaLabel: "Name", "data-userId": "7", "data-key": "k",
    }));
    expect(html).toBe(
      '<input tabindex="1" maxlength="5" contenteditable="true" crossorigin="anonymous"' +
      ' aria-describedby="help" aria-label="Name" data-userid="7" data-key="k" />',
    );
  });

  it("applies boolean semantics once the name is normalized", () => {
    expect(renderToString(input({ readOnly: true, autoFocus: true, defaultChecked: true }))).toBe("<input readonly autofocus checked />");
    expect(renderToString(input({ readOnly: false, autoFocus: false }))).toBe("<input />");
    expect(renderToString(form({ noValidate: true }))).toBe("<form novalidate></form>");
  });

  it("maps the renamed reflections: htmlFor, httpEquiv, acceptCharset, default*", () => {
    expect(renderToString(label({ htmlFor: "email" }, "Email"))).toBe('<label for="email"><!-- text-0 -->Email</label>');
    expect(renderToString(meta({ httpEquiv: "refresh", content: "1" }))).toBe('<meta http-equiv="refresh" content="1" />');
    expect(renderToString(form({ acceptCharset: "utf-8" }))).toBe('<form accept-charset="utf-8"></form>');
    expect(renderToString(input({ defaultValue: "x" }))).toBe('<input value="x" />');
    expect(renderToString(option({ defaultSelected: true }, "A"))).toBe('<option selected><!-- text-0 -->A</option>');
  });

  it("keeps SVG attribute names verbatim (browsers do not lowercase them)", () => {
    const html = renderToString(
      svgSvg({ viewBox: "0 0 24 24", preserveAspectRatio: "xMidYMid", "stroke-width": 2, "aria-label": "icon" },
        linearGradientSvg({ gradientUnits: "userSpaceOnUse" }, stopSvg({ offset: "0%" })),
        rectSvg({ x: 1, "clip-path": "url(#c)" }),
      ),
    );
    expect(html).toBe(
      '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid" stroke-width="2" aria-label="icon">' +
      '<lineargradient gradientUnits="userSpaceOnUse"><stop offset="0%"></stop></lineargradient>' +
      '<rect x="1" clip-path="url(#c)"></rect></svg>',
    );
  });

  it("does not touch id/class (properties) or already-kebab custom attributes", () => {
    expect(renderToString(div({ id: "a", className: "b c", "aria-hidden": "true", "x-custom": "1" })))
      .toBe('<div id="a" class="b c" aria-hidden="true" x-custom="1"></div>');
  });
});
