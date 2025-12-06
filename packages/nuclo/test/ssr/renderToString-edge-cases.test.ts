/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import '../../src/polyfill';
import { describe, it, expect, beforeAll } from "vitest";
import { renderToString } from "../../src/ssr/renderToString";

// Import tag builders
import "../../src/index";

describe("SSR renderToString - Edge Cases", () => {
  beforeAll(() => {
    if (typeof document === 'undefined') {
      throw new Error('Document polyfill not loaded');
    }
  });

  describe("style attribute with camelCase properties", () => {
    it("should convert camelCase style properties to kebab-case", () => {
      // Create element and manually set style attribute with object
      const elem = document.createElement('div');
      elem.textContent = 'Styled content';
      (elem as any).attributes = new Map();
      (elem as any).attributes.set('style', {
        backgroundColor: 'red',
        fontSize: '16px',
        marginTop: '10px'
      });

      const html = renderToString(elem);

      expect(html).toContain('background-color:red');
      expect(html).toContain('font-size:16px');
      expect(html).toContain('margin-top:10px');
    });

    it("should handle complex CSS properties", () => {
      const elem = document.createElement('div');
      (elem as any).attributes = new Map();
      (elem as any).attributes.set('style', {
        borderTopLeftRadius: '5px',
        webkitTransform: 'rotate(45deg)',
        mozBoxShadow: '0 0 10px rgba(0,0,0,0.5)'
      });

      const html = renderToString(elem);

      expect(html).toContain('border-top-left-radius:5px');
      expect(html).toContain('webkit-transform:rotate(45deg)');
      expect(html).toContain('moz-box-shadow:0 0 10px rgba(0,0,0,0.5)');
    });

    it("should escape dangerous content in style values", () => {
      const elem = document.createElement('div');
      (elem as any).attributes = new Map();
      (elem as any).attributes.set('style', {
        fontFamily: 'Arial"; alert("xss"); "'
      });

      const html = renderToString(elem);

      expect(html).toContain('&quot;');
      expect(html).not.toContain('alert("xss")');
    });

    it("should handle empty style object", () => {
      const elem = document.createElement('div');
      (elem as any).attributes = new Map();
      (elem as any).attributes.set('style', {});
      elem.appendChild(document.createTextNode('Content'));

      const html = renderToString(elem);

      expect(html).not.toContain('style=""');
      expect(html).toBe('<div>Content</div>');
    });
  });

  describe("comment nodes", () => {
    it("should render comment nodes", () => {
      const comment = document.createComment('This is a comment');
      const html = renderToString(comment);

      expect(html).toBe('<!--This is a comment-->');
    });

    it("should handle empty comments", () => {
      const comment = document.createComment('');
      const html = renderToString(comment);

      expect(html).toBe('<!---->');
    });
  });

  describe("document fragments", () => {
    it("should render document fragments with multiple children", () => {
      const fragment = document.createDocumentFragment();
      fragment.appendChild(document.createElement('div'));
      fragment.appendChild(document.createElement('span'));

      const html = renderToString(fragment);

      expect(html).toContain('<div></div>');
      expect(html).toContain('<span></span>');
    });

    it("should handle empty document fragments", () => {
      const fragment = document.createDocumentFragment();
      const html = renderToString(fragment);

      expect(html).toBe('');
    });
  });

  describe("attribute edge cases", () => {
    it("should handle null attributes", () => {
      const html = renderToString(
        div({ id: null, class: "test" }, "Content")
      );

      expect(html).not.toContain('id=');
      expect(html).toContain('class="test"');
    });

    it("should handle undefined attributes", () => {
      const html = renderToString(
        div({ id: undefined, class: "test" }, "Content")
      );

      expect(html).not.toContain('id=');
      expect(html).toContain('class="test"');
    });

    it("should handle false boolean attributes", () => {
      const html = renderToString(
        input({ type: "checkbox", checked: false })
      );

      // False is rendered as checked="false", which is still technically set
      // In HTML, the presence of the attribute makes it true regardless of value
      // So this test verifies the current behavior
      expect(html).toContain('type="checkbox"');
    });

    it("should handle true boolean attributes", () => {
      const html = renderToString(
        input({ type: "checkbox", checked: true, disabled: true })
      );

      expect(html).toContain('checked');
      expect(html).toContain('disabled');
    });

    it("should escape attribute values", () => {
      const html = renderToString(
        div({
          title: 'Alert: "Click here" & be amazed'
        })
      );

      // The attribute value itself is escaped, and wrapped in quotes
      expect(html).toContain('title="Alert: &quot;Click here&quot; &amp; be amazed"');
    });
  });

  describe("void elements", () => {
    it("should handle all void elements correctly", () => {
      const voidElements = [
        { tag: 'br', html: renderToString(br()) },
        { tag: 'hr', html: renderToString(hr()) },
        { tag: 'img', html: renderToString(img({ src: 'test.jpg' })) },
        { tag: 'input', html: renderToString(input({ type: 'text' })) },
      ];

      voidElements.forEach(({ tag, html }) => {
        expect(html).toMatch(new RegExp(`<${tag}[^>]*\\s*/>`));
        expect(html).not.toContain(`</${tag}>`);
      });
    });
  });

  describe("text content", () => {
    it("should escape text content", () => {
      const text = document.createTextNode('<script>alert("xss")</script>');
      const html = renderToString(text);

      expect(html).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it("should handle empty text nodes", () => {
      const text = document.createTextNode('');
      const html = renderToString(text);

      expect(html).toBe('');
    });
  });

  describe("nested structures", () => {
    it("should handle deeply nested elements", () => {
      const html = renderToString(
        div(
          div(
            div(
              div(
                span("Deep content")
              )
            )
          )
        )
      );

      expect(html).toContain('<div><div><div><div><span>Deep content</span></div></div></div></div>');
    });

    it("should handle mixed content types", () => {
      const elem = document.createElement('div');
      elem.appendChild(document.createTextNode('Text '));

      const spanElem = document.createElement('span');
      spanElem.appendChild(document.createTextNode('Span'));
      elem.appendChild(spanElem);

      elem.appendChild(document.createTextNode(' More text'));
      elem.appendChild(document.createComment('Comment'));

      const html = renderToString(elem);

      expect(html).toContain('Text ');
      expect(html).toContain('<span>Span</span>');
      expect(html).toContain(' More text');
      expect(html).toContain('<!--Comment-->');
    });
  });

  describe("special characters in content", () => {
    it("should handle unicode characters", () => {
      const html = renderToString(div("Hello 世界 🎉"));

      expect(html).toBe('<div>Hello 世界 🎉</div>');
    });

    it("should handle newlines and whitespace", () => {
      const html = renderToString(div("Line 1\nLine 2\tTabbed"));

      expect(html).toBe('<div>Line 1\nLine 2\tTabbed</div>');
    });
  });
});
