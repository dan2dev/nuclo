/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import "../../src/polyfill";
import { describe, it, expect, beforeAll } from "vitest";
import {
  renderToString,
  renderToStringWithContainer,
} from "../../src/ssr/renderToString";
import "../../src/index";

/**
 * SSR Server Render Tests
 *
 * Verifies that Nuclo components render correctly in a Node.js (server) environment
 * using the polyfill-backed document. These tests run without any browser globals —
 * only the Nuclo polyfill is in scope.
 */
describe("SSR — server render (Node.js)", () => {
  beforeAll(() => {
    if (typeof document === "undefined") {
      throw new Error("Nuclo document polyfill not loaded");
    }
  });

  describe("static HTML output", () => {
    it("renders a simple element", () => {
      const html = renderToString(div("Hello, SSR!"));
      expect(html).toBe("<div><!-- text-0 -->Hello, SSR!</div>");
    });

    it("renders nested elements preserving hierarchy", () => {
      const html = renderToString(section(h1("Title"), p("Body text")));
      expect(html).toBe(
        "<section><h1><!-- text-0 -->Title</h1><p><!-- text-1 -->Body text</p></section>",
      );
    });

    it("renders attributes in the output", () => {
      const html = renderToString(
        div({ id: "app", class: "container" }, "Content"),
      );
      expect(html).toContain('id="app"');
      expect(html).toContain('class="container"');
      expect(html).toContain("Content");
    });

    it("renders void elements as self-closing", () => {
      expect(renderToString(br())).toBe("<br />");
      expect(renderToString(hr())).toBe("<hr />");
      expect(renderToString(img({ src: "logo.png", alt: "Logo" }))).toBe(
        '<img src="logo.png" alt="Logo" />',
      );
    });

    it("renders boolean attributes correctly", () => {
      const html = renderToString(
        input({ type: "checkbox", checked: true, disabled: true }),
      );
      expect(html).toContain("checked");
      expect(html).toContain("disabled");
    });

    it("escapes HTML special characters in text content", () => {
      const html = renderToString(div('<script>alert("xss")</script>'));
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("escapes HTML special characters in attribute values", () => {
      const html = renderToString(div({ title: 'Say "hello" & goodbye' }));
      expect(html).toContain("&quot;hello&quot;");
      expect(html).toContain("&amp;");
    });

    it("renders a deeply nested structure", () => {
      const html = renderToString(
        div({ class: "root" }, ul(li("Item A"), li("Item B"), li("Item C"))),
      );
      expect(html).toContain("<ul>");
      expect(html).toContain("<li><!-- text-0 -->Item A</li>");
      expect(html).toContain("<li><!-- text-1 -->Item B</li>");
      expect(html).toContain("<li><!-- text-2 -->Item C</li>");
      expect(html).toContain("</ul>");
    });

    it("returns empty string for null input", () => {
      expect(renderToString(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(renderToString(undefined)).toBe("");
    });
  });

  describe("reactive text is evaluated once at render time", () => {
    it("evaluates a reactive text resolver and serializes its current value", () => {
      let count = 42;
      const html = renderToString(div(() => `Count: ${count}`));
      // The resolver is called once on the server; the value is frozen in the HTML
      expect(html).toBe("<div><!-- text-0 -->Count: 42</div>");
    });

    it("does not include dynamic update logic in the output", () => {
      let flag = true;
      const html = renderToString(p(() => (flag ? "on" : "off")));
      expect(html).toBe("<p><!-- text-0 -->on</p>");
      // Changing the variable after render has no effect on the already-produced string
      flag = false;
      expect(html).toBe("<p><!-- text-0 -->on</p>");
    });
  });

  describe("event handlers are not serialized", () => {
    it("omits onClick / on() handlers from the HTML output", () => {
      const html = renderToString(
        button(
          "Click me",
          on("click", () => {
            /* handler */
          }),
        ),
      );
      expect(html).toBe("<button><!-- text-0 -->Click me</button>");
      expect(html).not.toContain("onclick");
    });
  });

  describe("renderToStringWithContainer", () => {
    it("wraps content in a default div container", () => {
      const html = renderToStringWithContainer(span("Hello"));
      expect(html).toBe("<div><span><!-- text-0 -->Hello</span></div>");
    });

    it("wraps content in a custom container tag", () => {
      const html = renderToStringWithContainer(p("Content"), "main");
      expect(html).toBe("<main><p><!-- text-0 -->Content</p></main>");
    });

    it("applies attributes to the container", () => {
      const html = renderToStringWithContainer(span("Body"), "section", {
        id: "main-section",
        class: "wrapper",
      });
      expect(html).toContain("<section");
      expect(html).toContain('id="main-section"');
      expect(html).toContain('class="wrapper"');
      expect(html).toContain("<span><!-- text-0 -->Body</span>");
      expect(html).toContain("</section>");
    });
  });

  describe("full-page HTML scaffold", () => {
    it("produces a complete page structure suitable for server delivery", () => {
      const bodyContent = renderToString(
        main(
          { id: "app" },
          header(h1("My App")),
          article(p("Server-rendered with Nuclo v0.1")),
          footer(small("© 2026")),
        ),
      );

      const page = `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>My App</title></head>
  <body>${bodyContent}</body>
</html>`;

      expect(page).toContain("<h1><!-- text-0 -->My App</h1>");
      expect(page).toContain(
        "<p><!-- text-1 -->Server-rendered with Nuclo v0.1</p>",
      );
      expect(page).toContain("<small><!-- text-2 -->© 2026</small>");
      expect(page).toContain('<main id="app">');
    });
  });
});
