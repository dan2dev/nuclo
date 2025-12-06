/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import '../../src/polyfill';
import { describe, it, expect, beforeAll } from "vitest";
import { renderToString, renderManyToString, renderToStringWithContainer } from "../../src/ssr/renderToString";

// Import tag builders from main entry point
import "../../src/index";

describe("SSR renderToString", () => {
  beforeAll(() => {
    // Ensure polyfills are loaded
    if (typeof document === 'undefined') {
      throw new Error('Document polyfill not loaded');
    }
  });

  describe("renderToString", () => {
    it("should render a simple div element", () => {
      const html = renderToString(div("Hello, World!"));
      expect(html).toBe('<div>Hello, World!</div>');
    });

    it("should render nested elements", () => {
      const html = renderToString(
        div(
          span("Nested"),
          span("Content")
        )
      );
      expect(html).toContain('<div>');
      expect(html).toContain('<span>Nested</span>');
      expect(html).toContain('<span>Content</span>');
      expect(html).toContain('</div>');
    });

    it("should render elements with attributes", () => {
      const html = renderToString(
        div({ id: "test-id", class: "test-class" }, "Content")
      );
      expect(html).toContain('id="test-id"');
      expect(html).toContain('class="test-class"');
      expect(html).toContain('Content');
    });

    it("should escape HTML special characters", () => {
      const html = renderToString(div("<script>alert('xss')</script>"));
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it("should handle void elements correctly", () => {
      const html = renderToString(br());
      expect(html).toBe('<br />');
    });

    it("should return empty string for null input", () => {
      const html = renderToString(null);
      expect(html).toBe('');
    });

    it("should return empty string for undefined input", () => {
      const html = renderToString(undefined);
      expect(html).toBe('');
    });

    it("should handle boolean attributes", () => {
      const html = renderToString(
        input({ type: "checkbox", checked: true })
      );
      expect(html).toContain('checked');
    });

    it("should handle complex nested structures", () => {
      const html = renderToString(
        div({ class: "container" },
          h1("Title"),
          p("Paragraph 1"),
          ul(
            li("Item 1"),
            li("Item 2"),
            li("Item 3")
          )
        )
      );
      expect(html).toContain('<div');
      expect(html).toContain('class="container"');
      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<p>Paragraph 1</p>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('</ul>');
    });
  });

  describe("renderManyToString", () => {
    it("should render multiple components", () => {
      const htmlArray = renderManyToString([
        div("First"),
        div("Second"),
        div("Third")
      ]);

      expect(htmlArray).toHaveLength(3);
      expect(htmlArray[0]).toBe('<div>First</div>');
      expect(htmlArray[1]).toBe('<div>Second</div>');
      expect(htmlArray[2]).toBe('<div>Third</div>');
    });

    it("should handle empty array", () => {
      const htmlArray = renderManyToString([]);
      expect(htmlArray).toHaveLength(0);
    });

    it("should handle null values in array", () => {
      const htmlArray = renderManyToString([
        div("Valid"),
        null,
        div("Also Valid")
      ]);

      expect(htmlArray).toHaveLength(3);
      expect(htmlArray[0]).toBe('<div>Valid</div>');
      expect(htmlArray[1]).toBe('');
      expect(htmlArray[2]).toBe('<div>Also Valid</div>');
    });
  });

  describe("renderToStringWithContainer", () => {
    it("should wrap content in default div container", () => {
      const html = renderToStringWithContainer(span("Content"));
      expect(html).toBe('<div><span>Content</span></div>');
    });

    it("should wrap content in custom container", () => {
      const html = renderToStringWithContainer(span("Content"), "section");
      expect(html).toBe('<section><span>Content</span></section>');
    });

    it("should apply container attributes", () => {
      const html = renderToStringWithContainer(
        span("Content"),
        "div",
        { id: "wrapper", class: "container" }
      );
      expect(html).toContain('<div');
      expect(html).toContain('id="wrapper"');
      expect(html).toContain('class="container"');
      expect(html).toContain('<span>Content</span>');
      expect(html).toContain('</div>');
    });
  });

  describe("SVG elements", () => {
    it("should render SVG elements", () => {
      const html = renderToString(
        svgSvg({ width: "100", height: "100" },
          circleSvg({ cx: "50", cy: "50", r: "40" })
        )
      );
      expect(html).toContain('<svg');
      expect(html).toContain('width="100"');
      expect(html).toContain('height="100"');
      expect(html).toContain('<circle');
      expect(html).toContain('cx="50"');
      expect(html).toContain('</svg>');
    });
  });
});
