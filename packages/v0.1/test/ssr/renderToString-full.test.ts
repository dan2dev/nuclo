/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
/**
 * Comprehensive SSR tests for renderToString.
 *
 * Covers every edge case not already addressed in the other SSR test files:
 *   - Text content types (string, number, boolean, mixed)
 *   - HTML attribute variations (className, data-*, aria-*, numeric, null/false)
 *   - Style via tag builder object and string path
 *   - Reactive text (zero-arity resolver functions)
 *   - Reactive attributes (zero-arity attribute functions)
 *   - when() — true, false, else, chained conditions, nested, string content
 *   - list() — empty, with items, numeric items
 *   - Mixed text + element siblings
 *   - All 14 void elements (self-closing)
 *   - SVG elements (nested, with attributes)
 *   - XSS / escaping scenarios
 *   - Deep nesting
 *   - Event handlers must not appear in SSR output
 *   - renderManyToString and renderToStringWithContainer variants
 *   - NucloElement direct instantiation / polyfill edge cases
 */

import "../../src/polyfill";
import { describe, it, expect, beforeAll } from "vitest";
import { renderToString, renderManyToString, renderToStringWithContainer } from "../../src/ssr/renderToString";
import "../../src/index";

beforeAll(() => {
  if (typeof document === "undefined") {
    throw new Error("Polyfill not loaded — document is undefined");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Text content types
// ─────────────────────────────────────────────────────────────────────────────
describe("text content types", () => {
  it("renders a string child", () => {
    expect(renderToString(div("hello"))).toBe("<div><!-- text-0 -->hello</div>");
  });

  it("renders a numeric child", () => {
    expect(renderToString(div(42))).toBe("<div><!-- text-0 -->42</div>");
  });

  it("renders zero (falsy number)", () => {
    expect(renderToString(div(0))).toBe("<div><!-- text-0 -->0</div>");
  });

  it("renders boolean true as text", () => {
    expect(renderToString(div(true))).toBe("<div><!-- text-0 -->true</div>");
  });

  it("renders boolean false as text", () => {
    expect(renderToString(div(false))).toBe("<div><!-- text-0 -->false</div>");
  });

  it("renders multiple string children in order", () => {
    expect(renderToString(div("a", "b", "c"))).toBe("<div><!-- text-0 -->a<!-- text-1 -->b<!-- text-2 -->c</div>");
  });

  it("renders interleaved text and element siblings", () => {
    const html = renderToString(p("Text ", span("bold"), " end"));
    expect(html).toContain("Text ");
    expect(html).toContain("<span><!-- text-1 -->bold</span>");
    expect(html).toContain(" end");
    expect(html).toMatch(/^<p>.*<\/p>$/);
  });

  it("renders an empty element with no children", () => {
    expect(renderToString(div())).toBe("<div></div>");
  });

  it("renders deeply nested text", () => {
    const html = renderToString(div(span(em("deep"))));
    expect(html).toBe("<div><span><em><!-- text-0 -->deep</em></span></div>");
  });

  it("renders unicode text without escaping", () => {
    expect(renderToString(div("日本語 🌸"))).toBe("<div><!-- text-0 -->日本語 🌸</div>");
  });

  it("renders text with newline and tab characters", () => {
    expect(renderToString(div("line1\nline2\ttab"))).toBe("<div><!-- text-0 -->line1\nline2\ttab</div>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HTML attribute variations
// ─────────────────────────────────────────────────────────────────────────────
describe("HTML attribute variations", () => {
  it("renders id and className attributes", () => {
    const html = renderToString(div({ id: "root", className: "wrapper" }));
    expect(html).toContain('id="root"');
    expect(html).toContain('class="wrapper"');
  });

  it("renders className with multiple space-separated classes", () => {
    const html = renderToString(div({ className: "foo bar baz" }));
    expect(html).toContain('class="foo bar baz"');
  });

  it("renders data-* attributes", () => {
    const html = renderToString(div({ "data-testid": "my-div", "data-count": "3" }));
    expect(html).toContain('data-testid="my-div"');
    expect(html).toContain('data-count="3"');
  });

  it("renders aria-* attributes", () => {
    const html = renderToString(button({ "aria-label": "Close", "aria-expanded": "false" }));
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("renders numeric attribute values", () => {
    const html = renderToString(div({ tabIndex: 0 }));
    // tabIndex property is set on the element; serialized as attribute
    expect(html).toContain("0");
  });

  it("renders true boolean attributes without a value", () => {
    const html = renderToString(input({ type: "checkbox", checked: true, disabled: true }));
    expect(html).toContain("checked");
    expect(html).toContain("disabled");
    // Boolean true should render as bare attribute, not checked="true"
    expect(html).not.toContain('checked="true"');
  });

  it("omits false boolean attributes from output", () => {
    const html = renderToString(input({ type: "checkbox", checked: false }));
    expect(html).not.toContain("checked");
  });

  it("omits null attribute values", () => {
    const html = renderToString(div({ id: null as unknown as string, className: "ok" }));
    expect(html).not.toContain("id=");
    expect(html).toContain('class="ok"');
  });

  it("omits undefined attribute values", () => {
    const html = renderToString(div({ id: undefined as unknown as string, className: "ok" }));
    expect(html).not.toContain("id=");
    expect(html).toContain('class="ok"');
  });

  it("escapes special characters in attribute values", () => {
    const html = renderToString(div({ title: 'Say "hello" & goodbye' }));
    expect(html).toContain('title="Say &quot;hello&quot; &amp; goodbye"');
  });

  it("renders multiple attributes in the same element", () => {
    const html = renderToString(
      a({ href: "/page", target: "_blank", rel: "noopener" }, "link")
    );
    expect(html).toContain('href="/page"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
    expect(html).toContain("link");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Style attribute via tag builder
// ─────────────────────────────────────────────────────────────────────────────
describe("style attribute via tag builder", () => {
  it("renders a single style property with camelCase → kebab-case", () => {
    const html = renderToString(div({ style: { color: "red" } }));
    expect(html).toContain("color:red");
    expect(html).toContain("style=");
  });

  it("converts camelCase backgroundColor to background-color", () => {
    const html = renderToString(div({ style: { backgroundColor: "#fff" } }));
    expect(html).toContain("background-color:#fff");
  });

  it("renders multiple style properties", () => {
    const html = renderToString(
      div({ style: { marginTop: "10px", paddingLeft: "5px", fontSize: "14px" } })
    );
    expect(html).toContain("margin-top:10px");
    expect(html).toContain("padding-left:5px");
    expect(html).toContain("font-size:14px");
  });

  it("renders complex CSS property names", () => {
    const html = renderToString(
      div({ style: { borderTopLeftRadius: "4px", webkitTransform: "rotate(45deg)" } })
    );
    expect(html).toContain("border-top-left-radius:4px");
    expect(html).toContain("webkit-transform:rotate(45deg)");
  });

  it("escapes style values to prevent XSS", () => {
    const html = renderToString(
      div({ style: { fontFamily: '"Arial"; alert("xss")' } })
    );
    expect(html).not.toContain('alert("xss")');
    expect(html).toContain("&quot;");
  });

  it("renders style attribute set via setAttribute (string path)", () => {
    const el = document.createElement("div");
    el.setAttribute("style", "color:blue;margin:0");
    const html = renderToString(el);
    expect(html).toContain("color:blue");
    expect(html).toContain("margin:0");
  });

  it("renders element with both style and other attributes", () => {
    const html = renderToString(
      div({ id: "box", className: "card", style: { display: "flex" } }, "content")
    );
    expect(html).toContain('id="box"');
    expect(html).toContain('class="card"');
    expect(html).toContain("display:flex");
    expect(html).toContain("content");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Reactive text (zero-arity resolver functions)
// ─────────────────────────────────────────────────────────────────────────────
describe("reactive text — zero-arity resolver functions", () => {
  it("renders the initial value of a string resolver", () => {
    expect(renderToString(div(() => "reactive"))).toBe("<div><!-- text-0 -->reactive</div>");
  });

  it("renders the initial value of a numeric resolver", () => {
    expect(renderToString(span(() => 99))).toBe("<span><!-- text-0 -->99</span>");
  });

  it("renders multiple reactive text resolvers in order", () => {
    const html = renderToString(div(() => "hello", () => " ", () => "world"));
    expect(html).toContain("hello");
    expect(html).toContain("world");
  });

  it("renders reactive text alongside static text", () => {
    const html = renderToString(p("static ", () => "dynamic"));
    expect(html).toContain("static ");
    expect(html).toContain("dynamic");
  });

  it("escapes reactive text values (XSS)", () => {
    const html = renderToString(div(() => "<script>alert('xss')</script>"));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders an empty string from a resolver gracefully", () => {
    expect(renderToString(div(() => ""))).toBe("<div><!-- text-0 --></div>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reactive attributes (zero-arity attribute functions)
// ─────────────────────────────────────────────────────────────────────────────
describe("reactive attributes — zero-arity attribute functions", () => {
  it("evaluates and renders a reactive className", () => {
    const html = renderToString(div({ className: () => "active" }));
    expect(html).toContain("active");
    expect(html).toContain("class");
  });

  it("evaluates and renders a reactive id", () => {
    const html = renderToString(div({ id: () => "dynamic-id" }));
    expect(html).toContain("dynamic-id");
  });

  it("evaluates a reactive style function and applies styles", () => {
    const html = renderToString(div({ style: () => ({ color: "green" }) }));
    expect(html).toContain("color:green");
  });

  it("evaluates a reactive data attribute", () => {
    const html = renderToString(div({ "data-value": () => "42" } as any));
    expect(html).toContain("42");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. when() conditional rendering
// ─────────────────────────────────────────────────────────────────────────────
describe("when() conditional rendering in SSR", () => {
  it("renders the if-branch when condition is true", () => {
    const html = renderToString(div(when(() => true, span("yes"))));
    expect(html).toContain("<span><!-- text-0 -->yes</span>");
  });

  it("does not render if-branch content when condition is false", () => {
    const html = renderToString(div(when(() => false, span("no"))));
    expect(html).not.toContain("<span><!-- text-0 -->no</span>");
  });

  it("renders the else-branch when condition is false", () => {
    const html = renderToString(
      div(when(() => false, span("no")).else(span("fallback")))
    );
    expect(html).not.toContain("<span><!-- text-0 -->no</span>");
    expect(html).toContain("<span><!-- text-0 -->fallback</span>");
  });

  it("renders if-branch and omits else when condition is true", () => {
    const html = renderToString(
      div(when(() => true, span("active")).else(span("inactive")))
    );
    expect(html).toContain("<span><!-- text-0 -->active</span>");
    expect(html).not.toContain("<span><!-- text-0 -->inactive</span>");
  });

  it("evaluates chained .when() and picks the first truthy condition", () => {
    const html = renderToString(
      div(
        when(() => false, span("a"))
          .when(() => true, span("b"))
          .when(() => true, span("c"))
      )
    );
    expect(html).toContain("<span><!-- text-0 -->b</span>");
    expect(html).not.toContain("<span><!-- text-0 -->a</span>");
    expect(html).not.toContain("<span><!-- text-0 -->c</span>");
  });

  it("evaluates chained .when() and uses else when all are false", () => {
    const html = renderToString(
      div(
        when(() => false, span("a"))
          .when(() => false, span("b"))
          .else(span("default"))
      )
    );
    expect(html).toContain("<span><!-- text-0 -->default</span>");
    expect(html).not.toContain("<span><!-- text-0 -->a</span>");
    expect(html).not.toContain("<span><!-- text-0 -->b</span>");
  });

  it("renders nothing between markers when no condition matches and no else", () => {
    const html = renderToString(div(when(() => false, span("hidden"))));
    expect(html).not.toContain("<span>");
    expect(html).toMatch(/^<div>/);
  });

  it("renders string content inside when()", () => {
    const html = renderToString(div(when(() => true, "plain text")));
    expect(html).toContain("plain text");
  });

  it("renders multiple content items in a when() branch", () => {
    const html = renderToString(
      div(when(() => true, span("first"), span("second")))
    );
    expect(html).toContain("<span><!-- text-0 -->first</span>");
    expect(html).toContain("<span><!-- text-0 -->second</span>");
  });

  it("renders nested when() inside another element", () => {
    const html = renderToString(
      div(
        section(
          when(() => true, p("nested content"))
        )
      )
    );
    expect(html).toContain("<p><!-- text-0 -->nested content</p>");
    expect(html).toContain("<section>");
  });

  it("renders nested when() inside when()", () => {
    const html = renderToString(
      div(
        when(() => true,
          span(
            when(() => true, em("deep"))
          )
        )
      )
    );
    expect(html).toContain("<em><!-- text-0 -->deep</em>");
  });

  it("when() with a static boolean true condition", () => {
    const html = renderToString(div(when(true, span("static-true"))));
    expect(html).toContain("<span><!-- text-0 -->static-true</span>");
  });

  it("when() with a static boolean false condition", () => {
    const html = renderToString(div(when(false, span("static-false"))));
    expect(html).not.toContain("<span>static-false</span>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. list() rendering in SSR
// ─────────────────────────────────────────────────────────────────────────────
describe("list() rendering in SSR", () => {
  it("renders an empty list without crashing", () => {
    const html = renderToString(div(list(() => [], (_item) => span("x"))));
    // No span content, just the outer div and markers
    expect(html).not.toContain("<span>");
    expect(html).toMatch(/^<div>/);
  });

  it("renders each item returned by the provider", () => {
    const html = renderToString(
      div(list(() => ["a", "b", "c"], (item) => span(item)))
    );
    expect(html).toContain("<span><!-- text-0 -->a</span>");
    expect(html).toContain("<span><!-- text-1 -->b</span>");
    expect(html).toContain("<span><!-- text-2 -->c</span>");
  });

  it("renders items in order", () => {
    const html = renderToString(
      div(list(() => [1, 2, 3], (item) => li(String(item))))
    );
    const aIdx = html.indexOf("<li><!-- text-0 -->1</li>");
    const bIdx = html.indexOf("<li><!-- text-1 -->2</li>");
    const cIdx = html.indexOf("<li><!-- text-2 -->3</li>");
    expect(aIdx).toBeLessThan(bIdx);
    expect(bIdx).toBeLessThan(cIdx);
  });

  it("renders a list with a single item", () => {
    const html = renderToString(
      ul(list(() => ["only"], (item) => li(item)))
    );
    expect(html).toContain("<li><!-- text-0 -->only</li>");
  });

  it("renders list items with nested elements", () => {
    const html = renderToString(
      div(
        list(
          () => ["Alice", "Bob"],
          (name) => div(span(name))
        )
      )
    );
    expect(html).toContain("<span><!-- text-0 -->Alice</span>");
    expect(html).toContain("<span><!-- text-1 -->Bob</span>");
  });

  it("renders a list inside an ordered list", () => {
    const html = renderToString(
      ol(list(() => ["one", "two", "three"], (item) => li(item)))
    );
    expect(html).toContain("<li><!-- text-0 -->one</li>");
    expect(html).toContain("<li><!-- text-1 -->two</li>");
    expect(html).toContain("<li><!-- text-2 -->three</li>");
    expect(html).toMatch(/^<ol>/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Mixed content — text + element siblings
// ─────────────────────────────────────────────────────────────────────────────
describe("mixed content — text and element siblings", () => {
  it("renders text before and after a child element", () => {
    const html = renderToString(p("Hello, ", strong("world"), "!"));
    expect(html).toContain("Hello, ");
    expect(html).toContain("<strong><!-- text-1 -->world</strong>");
    expect(html).toContain("!");
  });

  it("preserves ordering of text and element siblings", () => {
    const html = renderToString(div("start", span("middle"), "end"));
    const start = html.indexOf("start");
    const middle = html.indexOf("<span><!-- text-1 -->middle</span>");
    const end = html.indexOf("end");
    expect(start).toBeLessThan(middle);
    expect(middle).toBeLessThan(end);
  });

  it("renders an element with text content set via property", () => {
    const el = document.createElement("p");
    el.textContent = "direct text";
    expect(renderToString(el)).toBe("<p>direct text</p>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. All 14 void elements (self-closing)
// ─────────────────────────────────────────────────────────────────────────────
describe("void elements — all 14 must be self-closing", () => {
  const VOID_TAGS = [
    "area", "base", "br", "col", "embed", "hr",
    "img", "input", "link", "meta", "param", "source", "track", "wbr",
  ] as const;

  for (const tag of VOID_TAGS) {
    it(`<${tag}> is self-closing`, () => {
      const el = document.createElement(tag);
      const html = renderToString(el);
      // Must end with ' />' and must NOT contain a closing tag
      expect(html).toMatch(/\/>$/);
      expect(html).not.toContain(`</${tag}>`);
    });
  }

  it("void elements include their attributes", () => {
    const html = renderToString(img({ src: "/logo.png", alt: "Logo" }));
    expect(html).toContain('src="/logo.png"');
    expect(html).toContain('alt="Logo"');
    expect(html).toMatch(/\/>$/);
  });

  it("input element with type and value is self-closing", () => {
    const html = renderToString(input({ type: "text", value: "hello" }));
    expect(html).toContain('type="text"');
    expect(html).toMatch(/\/>$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. SVG elements
// ─────────────────────────────────────────────────────────────────────────────
describe("SVG elements in SSR", () => {
  it("renders an <svg> root element", () => {
    const html = renderToString(svgSvg({ width: "200", height: "200" }));
    expect(html).toContain("<svg");
    expect(html).toContain('width="200"');
    expect(html).toContain("</svg>");
  });

  it("renders a circle inside svg", () => {
    const html = renderToString(
      svgSvg({ viewBox: "0 0 100 100" },
        circleSvg({ cx: "50", cy: "50", r: "40", fill: "blue" })
      )
    );
    expect(html).toContain("<circle");
    expect(html).toContain('cx="50"');
    expect(html).toContain('fill="blue"');
  });

  it("renders rect inside svg", () => {
    const html = renderToString(
      svgSvg(rectSvg({ x: "0", y: "0", width: "100", height: "100" }))
    );
    expect(html).toContain("<rect");
    expect(html).toContain('width="100"');
  });

  it("renders path inside svg", () => {
    const html = renderToString(
      svgSvg(pathSvg({ d: "M10 10 L90 90", stroke: "black" }))
    );
    expect(html).toContain("<path");
    expect(html).toContain('d="M10 10 L90 90"');
  });

  it("renders nested SVG group (g) with children", () => {
    const html = renderToString(
      svgSvg(
        gSvg(
          circleSvg({ cx: "10", cy: "10", r: "5" }),
          circleSvg({ cx: "20", cy: "20", r: "5" })
        )
      )
    );
    expect(html).toContain("<g>");
    expect(html).toContain("</g>");
    // Both circles inside g
    const firstCircle = html.indexOf('<circle');
    const closingG = html.indexOf('</g>');
    expect(firstCircle).toBeLessThan(closingG);
  });

  it("renders SVG with text element", () => {
    const html = renderToString(
      svgSvg(
        textSvg({ x: "10", y: "20", fill: "red" }, "SVG text")
      )
    );
    expect(html).toContain("<text");
    expect(html).toContain("SVG text");
    expect(html).toContain("</text>");
  });

  it("renders SVG with defs and linearGradient", () => {
    const html = renderToString(
      svgSvg(
        defsSvg(
          linearGradientSvg({ id: "grad1" },
            stopSvg({ offset: "0%", "stop-color": "red" }),
            stopSvg({ offset: "100%", "stop-color": "blue" })
          )
        )
      )
    );
    expect(html).toContain("<defs>");
    expect(html).toContain("<linearGradient".toLowerCase());
    expect(html).toContain("<stop");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. XSS / HTML escaping edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe("XSS and HTML escaping", () => {
  it("escapes < and > in text content", () => {
    const html = renderToString(div("<b>not bold</b>"));
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("escapes & in text content", () => {
    const html = renderToString(div("cats & dogs"));
    expect(html).toContain("cats &amp; dogs");
  });

  it("escapes double quotes in text content", () => {
    const html = renderToString(div('say "hello"'));
    expect(html).toContain("&quot;");
  });

  it("escapes single quotes in text content", () => {
    const html = renderToString(div("it's fine"));
    expect(html).toContain("&#039;");
  });

  it("escapes a full script-injection attempt in text", () => {
    const html = renderToString(div('<script>alert(1)</script>'));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes a script-injection attempt in an attribute value", () => {
    const html = renderToString(div({ title: '"><script>alert(1)</script>' }));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes & in attribute values", () => {
    const html = renderToString(a({ href: "/search?q=cats&page=1" }));
    expect(html).toContain("&amp;");
    expect(html).not.toContain("q=cats&page");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. Deep nesting
// ─────────────────────────────────────────────────────────────────────────────
describe("deep nesting", () => {
  it("handles 10 levels of nested divs", () => {
    const html = renderToString(
      div(div(div(div(div(div(div(div(div(div("leaf"))))))))))
    );
    expect(html).toContain("leaf");
    const openDivs = (html.match(/<div>/g) || []).length;
    expect(openDivs).toBe(10);
  });

  it("handles mixed tag nesting with text at the leaf", () => {
    const html = renderToString(
      article(
        section(
          div(
            p(
              span(
                strong(em("very deep"))
              )
            )
          )
        )
      )
    );
    expect(html).toContain("<em><!-- text-0 -->very deep</em>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<span>");
    expect(html).toContain("<p>");
    expect(html).toContain("<section>");
    expect(html).toContain("<article>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. Event handlers must not appear in SSR output
// ─────────────────────────────────────────────────────────────────────────────
describe("event handlers omitted from SSR output", () => {
  it("does not include a zero-arity onclick resolver value in the output", () => {
    // Zero-arity fn as attribute: resolver returns undefined → attribute not set
    const html = renderToString(div({ onclick: () => {} } as any));
    expect(html).not.toContain("onclick");
    expect(html).toBe("<div></div>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. renderManyToString — additional edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe("renderManyToString — additional cases", () => {
  it("renders an array of tag-builder factories", () => {
    const results = renderManyToString([div("one"), span("two"), p("three")]);
    expect(results).toEqual([
      "<div><!-- text-0 -->one</div>",
      "<span><!-- text-0 -->two</span>",
      "<p><!-- text-0 -->three</p>",
    ]);
  });

  it("preserves input length when all items are null or undefined", () => {
    const results = renderManyToString([null, undefined, null]);
    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r).toBe(""));
  });

  it("handles a mix of valid and null inputs", () => {
    const results = renderManyToString([div("ok"), null, span("also ok")]);
    expect(results[0]).toBe("<div><!-- text-0 -->ok</div>");
    expect(results[1]).toBe("");
    expect(results[2]).toBe("<span><!-- text-0 -->also ok</span>");
  });

  it("returns an empty array for an empty input", () => {
    expect(renderManyToString([])).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. renderToStringWithContainer — additional edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe("renderToStringWithContainer — additional cases", () => {
  it("wraps content in an <article> tag", () => {
    const html = renderToStringWithContainer(p("text"), "article");
    expect(html).toBe("<article><p><!-- text-0 -->text</p></article>");
  });

  it("wraps content in a <main> with id and class", () => {
    const html = renderToStringWithContainer(div("content"), "main", {
      id: "app",
      class: "container",
    });
    expect(html).toContain('<main');
    expect(html).toContain('id="app"');
    expect(html).toContain('class="container"');
    expect(html).toContain("<div><!-- text-0 -->content</div>");
    expect(html).toContain("</main>");
  });

  it("renders empty container when content is null", () => {
    expect(renderToStringWithContainer(null, "section")).toBe(
      "<section></section>"
    );
  });

  it("renders empty container when content is undefined", () => {
    expect(renderToStringWithContainer(undefined, "footer")).toBe(
      "<footer></footer>"
    );
  });

  it("escapes container attribute values", () => {
    const html = renderToStringWithContainer(null, "div", {
      title: 'A & B "test"',
    });
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. Polyfill / NucloElement direct instantiation edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe("polyfill — NucloElement edge cases", () => {
  it("serializes a NucloElement created directly via document.createElement", () => {
    const el = document.createElement("article");
    el.setAttribute("id", "post-1");
    el.setAttribute("class", "entry");
    const child = document.createElement("h2");
    child.appendChild(document.createTextNode("Title"));
    el.appendChild(child);

    const html = renderToString(el);
    expect(html).toContain('id="post-1"');
    expect(html).toContain('class="entry"');
    expect(html).toContain("<h2>Title</h2>");
  });

  it("serializes a text node created directly", () => {
    const text = document.createTextNode("bare text");
    const html = renderToString(text);
    expect(html).toBe("bare text");
  });

  it("serializes a comment node created directly", () => {
    const comment = document.createComment("a comment");
    const html = renderToString(comment);
    expect(html).toBe("<!--a comment-->");
  });

  it("serializes a document fragment with element children", () => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createElement("span"));
    frag.appendChild(document.createElement("em"));

    const html = renderToString(frag);
    expect(html).toContain("<span></span>");
    expect(html).toContain("<em></em>");
  });

  it("handles NucloElement with classList manipulation before serialization", () => {
    const el = document.createElement("div");
    (el as any).classList.add("foo");
    (el as any).classList.add("bar");

    const html = renderToString(el);
    expect(html).toContain("foo");
    expect(html).toContain("bar");
  });

  it("handles style set via style Proxy then serialized", () => {
    const el = document.createElement("div");
    (el as any).style.color = "purple";
    (el as any).style.fontWeight = "bold";

    const html = renderToString(el);
    expect(html).toContain("color:purple");
    expect(html).toContain("font-weight:bold");
  });

  it("renders an element whose id is set via property assignment", () => {
    const el = document.createElement("div");
    (el as any).id = "direct-id";

    const html = renderToString(el);
    expect(html).toContain('id="direct-id"');
  });

  it("handles an element with textContent set directly", () => {
    const el = document.createElement("p");
    (el as any).textContent = "direct content";
    const child = document.createTextNode("direct content");
    el.appendChild(child);

    const html = renderToString(el);
    expect(html).toContain("direct content");
  });

  it("serializes an element appended to document.body without error", () => {
    const el = document.createElement("div");
    el.appendChild(document.createTextNode("body child"));
    document.body.appendChild(el);

    const html = renderToString(el);
    expect(html).toBe("<div>body child</div>");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. Structural HTML elements
// ─────────────────────────────────────────────────────────────────────────────
describe("structural HTML elements", () => {
  it("renders a table with thead, tbody, tr, th, td", () => {
    const html = renderToString(
      table(
        thead(tr(th("Name"), th("Age"))),
        tbody(
          tr(td("Alice"), td("30")),
          tr(td("Bob"), td("25"))
        )
      )
    );
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<th><!-- text-0 -->Name</th>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<td><!-- text-1 -->Alice</td>");
    expect(html).toContain("</table>");
  });

  it("renders a form with input, label, and button", () => {
    const html = renderToString(
      form({ action: "/submit", method: "post" },
        label({ for: "name" }, "Name:"),
        input({ type: "text", id: "name", name: "name" }),
        button({ type: "submit" }, "Submit")
      )
    );
    expect(html).toContain('action="/submit"');
    expect(html).toContain("<label");
    expect(html).toContain("Name:");
    expect(html).toContain("<button");
    expect(html).toContain("Submit");
  });

  it("renders a nav with an unordered list of links", () => {
    const links = ["Home", "About", "Contact"];
    const html = renderToString(
      nav(
        ul(
          ...links.map((text) => li(a({ href: `/${text.toLowerCase()}` }, text)))
        )
      )
    );
    expect(html).toContain("<nav>");
    expect(html).toContain("<ul>");
    expect(html).toContain('href="/home"');
    expect(html).toContain("Contact");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. Interaction between when() + list()
// ─────────────────────────────────────────────────────────────────────────────
describe("when() combined with list()", () => {
  it("renders list inside a true when() branch", () => {
    const html = renderToString(
      div(
        when(() => true,
          ul(list(() => ["x", "y"], (item) => li(item)))
        )
      )
    );
    expect(html).toContain("<li><!-- text-0 -->x</li>");
    expect(html).toContain("<li><!-- text-1 -->y</li>");
  });

  it("omits list inside a false when() branch", () => {
    const html = renderToString(
      div(
        when(() => false,
          ul(list(() => ["x", "y"], (item) => li(item)))
        )
      )
    );
    expect(html).not.toContain("<li>");
  });

  it("renders when() inside each list item", () => {
    const items = [{ name: "Alice", active: true }, { name: "Bob", active: false }];
    const html = renderToString(
      ul(
        list(
          () => items,
          (item) =>
            li(
              item.name,
              when(() => item.active, span(" (active)"))
            )
        )
      )
    );
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
    expect(html).toContain("<span><!-- text-1 --> (active)</span>");
  });
});
