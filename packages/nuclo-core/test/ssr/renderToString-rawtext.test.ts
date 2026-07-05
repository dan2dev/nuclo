/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines in src/ssr/render-to-string.ts:
 *  - lines 174-177: escapeRawText neutralizes closing-tag sequences
 *  - lines 234-248: raw-text elements (script/style) serialize verbatim,
 *    including the textContent fallback when no child nodes exist
 *  - line 68: style-object attribute serialization skips null/empty values
 */
import { describe, it, expect } from "vitest";
import { renderToString, renderToStringWithContainer } from "../../src/ssr/render-to-string";
import { NucloElement } from "../../src/polyfill/Element";
import "../../src";

describe("raw-text element serialization (script/style)", () => {
  it("emits script content verbatim and neutralizes </script>", () => {
    const script = document.createElement("script");
    script.textContent = 'if (a < b) console.log("</script>");';

    const html = renderToString(script);

    expect(html).toContain("a < b"); // NOT escaped to &lt;
    expect(html).toContain("<\\/script>"); // closing sequence broken
    expect(html.startsWith("<script>")).toBe(true);
    expect(html.endsWith("</script>")).toBe(true);
  });

  it("emits style content verbatim", () => {
    const style = document.createElement("style");
    style.textContent = ".a > .b { color: red }";

    const html = renderToString(style);

    expect(html).toBe("<style>.a > .b { color: red }</style>");
  });

  it("skips non-text children inside raw-text elements", () => {
    const script = document.createElement("script");
    script.appendChild(document.createComment("not-code"));
    script.appendChild(document.createTextNode("var x = 1;"));

    const html = renderToString(script);

    expect(html).toBe("<script>var x = 1;</script>");
  });

  it("falls back to the textContent property when the element has no child nodes", () => {
    const fakeScript = {
      nodeType: 1,
      tagName: "SCRIPT",
      attributes: { length: 0 },
      childNodes: [],
      textContent: "var fallback = true;",
    } as unknown as Node;

    const html = renderToString(fakeScript);

    expect(html).toBe("<script>var fallback = true;</script>");
  });

  it("serializes an empty raw-text element when textContent is not a string", () => {
    const fakeScript = {
      nodeType: 1,
      tagName: "SCRIPT",
      attributes: { length: 0 },
      childNodes: [],
      textContent: undefined,
    } as unknown as Node;

    const html = renderToString(fakeScript);

    expect(html).toBe("<script></script>");
  });

  it("treats an empty text child as empty raw content", () => {
    const script = document.createElement("script");
    script.appendChild(document.createTextNode(""));

    const html = renderToString(script);

    expect(html).toBe("<script></script>");
  });
});

describe("getChildNodes with malformed childNodes", () => {
  it("falls back to an empty list when childNodes has no length", () => {
    const fakeDiv = {
      nodeType: 1,
      tagName: "DIV",
      attributes: { length: 0 },
      childNodes: {}, // neither Array nor ArrayLike
      textContent: "",
    } as unknown as Node;

    expect(renderToString(fakeDiv)).toBe("<div></div>");
  });
});

describe("boolean attribute serialization with unusual string values", () => {
  it("keeps a non-boolean-like string value as a regular attribute", () => {
    const html = renderToStringWithContainer(div("x"), "input", {
      checked: "weird",
    });

    expect(html).toContain('checked="weird"');
  });
});

describe("style-object attribute serialization", () => {
  it("skips null and empty declarations, keeps zero", () => {
    const html = renderToStringWithContainer(div("x"), "section", {
      style: {
        color: "red",
        margin: null,
        padding: "",
        opacity: 0,
      } as unknown as string,
    });

    expect(html).toContain('style="color: red; opacity: 0;"');
    expect(html).not.toContain("margin");
    expect(html).not.toContain("padding");
  });

  it("omits the style attribute entirely when every declaration is skipped", () => {
    const html = renderToStringWithContainer(div("x"), "section", {
      style: { margin: null } as unknown as string,
    });

    expect(html).not.toContain("style=");
  });

  it("omits the style attribute of a polyfill element whose declarations are all empty", () => {
    const el = new NucloElement("div");
    // Only empty-valued declarations → the kebab-cased style string is empty.
    (el.style as unknown as Record<string, string>)["color"] = "";

    const html = renderToString(el as unknown as Node);

    expect(html).toBe("<div></div>");
  });
});
