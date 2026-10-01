/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { renderToString } from "../../src/ssr/render-to-string";
import "../../src";

/**
 * <title> and <textarea> are "escapable raw text" elements: the HTML parser
 * decodes entities inside them but does not parse markup, so nuclo's
 * `<!-- text-N -->` hydration markers must not be emitted there — they would
 * become literal content (the page title, the textarea's value).
 *
 * Every assertion parses the emitted HTML with a real parser (jsdom) and
 * checks what a browser would actually see.
 */
const parse = (html: string): Document => new JSDOM(`<!doctype html><html><head></head><body>${html}</body></html>`).window.document;
const parseHead = (html: string): Document => new JSDOM(`<!doctype html><html><head>${html}</head><body></body></html>`).window.document;

describe("renderToString — <title> (RCDATA)", () => {
  it("emits text only, no hydration markers", () => {
    expect(renderToString(title("Home"))).toBe("<title>Home</title>");
  });

  it("the parsed document title is exactly the text", () => {
    const html = renderToString(title("Dashboard — ", () => "Reports"));
    expect(html).toBe("<title>Dashboard — Reports</title>");
    expect(parseHead(html).title).toBe("Dashboard — Reports");
  });

  it("escapes markup-significant characters so they round-trip", () => {
    const text = "a < b && c > d </title><script>alert(1)</script> &amp;";
    const doc = parseHead(renderToString(title(text)));
    expect(doc.title).toBe(text.replace(/\s+/g, " ").trim());
    expect(doc.querySelector("script")).toBeNull();
  });

  it("renders reactive, numeric and empty text", () => {
    expect(renderToString(title(() => 42))).toBe("<title>42</title>");
    expect(renderToString(title(() => null))).toBe("<title></title>");
    expect(renderToString(title(""))).toBe("<title></title>");
    expect(renderToString(title())).toBe("<title></title>");
  });

  it("keeps attributes", () => {
    expect(renderToString(title({ id: "t" }, "x"))).toBe('<title id="t">x</title>');
  });

  it("works inside head() next to other elements", () => {
    const html = renderToString(head(meta({ charset: "utf-8" }), title("Site"), link({ rel: "icon", href: "/f.ico" })));
    expect(html).toContain("<title>Site</title>");
  });

  it("SVG <title> is an ordinary element and keeps its marker", () => {
    const html = renderToString(svgSvg(titleSvg("tooltip")));
    expect(html).toBe("<svg><title><!-- text-0 -->tooltip</title></svg>");
    expect(parse(html).querySelector("svg title")!.textContent).toBe("tooltip");
  });
});

describe("renderToString — <textarea> (RCDATA)", () => {
  const valueOf = (html: string): string => parse(html).querySelector("textarea")!.value;

  it("emits text children without markers", () => {
    const html = renderToString(textarea("hello", () => " world"));
    expect(html).toBe("<textarea>hello world</textarea>");
    expect(valueOf(html)).toBe("hello world");
  });

  it("renders { value } as content, not as an attribute", () => {
    const html = renderToString(textarea({ value: "typed text", name: "bio" }));
    expect(html).toBe('<textarea name="bio">typed text</textarea>');
    expect(valueOf(html)).toBe("typed text");
  });

  it("renders a reactive { value }", () => {
    const html = renderToString(textarea({ value: () => "from resolver" }));
    expect(valueOf(html)).toBe("from resolver");
  });

  it("{ value } wins over text children, like assigning .value does", () => {
    expect(valueOf(renderToString(textarea("child", { value: "prop" })))).toBe("prop");
  });

  it("escapes content so it cannot close the element", () => {
    const text = "</textarea><b>x</b> & <i>";
    const html = renderToString(textarea({ value: text }));
    const doc = parse(html);
    expect(doc.querySelector("textarea")!.value).toBe(text);
    expect(doc.querySelector("b")).toBeNull();
  });

  it("preserves a leading newline (the parser drops the first one)", () => {
    expect(valueOf(renderToString(textarea({ value: "\nline two" })))).toBe("\nline two");
    expect(valueOf(renderToString(textarea("\n\nx")))).toBe("\n\nx");
  });

  it("keeps boolean and plain attributes", () => {
    const html = renderToString(textarea({ rows: 3, disabled: true, placeholder: "p" }));
    const el = parse(html).querySelector("textarea")!;
    expect(el.rows).toBe(3);
    expect(el.disabled).toBe(true);
    expect(el.placeholder).toBe("p");
    expect(el.value).toBe("");
  });

  it("an <input> still renders value as an attribute", () => {
    expect(renderToString(input({ value: "x" }))).toBe('<input value="x" />');
  });
});

describe("renderToString — { innerHTML }", () => {
  it("emits the markup as content instead of an attribute", () => {
    const html = renderToString(div({ innerHTML: "<b>bold</b> &amp; <i>it</i>" }));
    expect(html).toBe("<div><b>bold</b> &amp; <i>it</i></div>");
  });

  it("keeps other attributes and works with a reactive resolver", () => {
    const html = renderToString(article({ id: "post", className: "md", innerHTML: () => "<p>para</p>" }));
    const el = parse(html).querySelector("article")!;
    expect(el.id).toBe("post");
    expect(el.className).toBe("md");
    expect(el.innerHTML).toBe("<p>para</p>");
  });

  it("children added after it are appended, as in the browser", () => {
    const html = renderToString(div({ innerHTML: "<b>a</b>" }, span("b")));
    expect(parse(html).querySelector("div")!.textContent).toBe("ab");
  });

  it("{ textContent } is escaped text, not markup", () => {
    const html = renderToString(p({ textContent: "<b>not bold</b> & co" }));
    const el = parse(html).querySelector("p")!;
    expect(el.textContent).toBe("<b>not bold</b> & co");
    expect(el.querySelector("b")).toBeNull();
  });
});
