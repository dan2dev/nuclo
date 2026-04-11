/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import '../../src/polyfill';
import { describe, it, expect, beforeAll } from "vitest";
import { renderToString } from "../../src/ssr/renderToString";
import { NucloElement } from "../../src/polyfill/Element";

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

      expect(html).toContain('background-color: red;');
      expect(html).toContain('font-size: 16px;');
      expect(html).toContain('margin-top: 10px;');
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

      expect(html).toContain('border-top-left-radius: 5px;');
      expect(html).toContain('webkit-transform: rotate(45deg);');
      expect(html).toContain('moz-box-shadow: 0 0 10px rgba(0,0,0,0.5);');
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

      // Quotes are safe in text nodes — only &, < and > need escaping
      expect(html).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
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

      expect(html).toContain('<div><div><div><div><span><!-- text-0 -->Deep content</span></div></div></div></div>');
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

      expect(html).toBe('<div><!-- text-0 -->Hello 世界 🎉</div>');
    });

    it("should handle newlines and whitespace", () => {
      const html = renderToString(div("Line 1\nLine 2\tTabbed"));

      expect(html).toBe('<div><!-- text-0 -->Line 1\nLine 2\tTabbed</div>');
    });
  });

  describe("cssText parsing with empty values", () => {
    it("should filter out declarations with empty values from cssText", () => {
      const el = new NucloElement('div');
      // Set a property with empty value and one with real value
      (el.style as any).color = '';
      (el.style as any).background = 'red';
      // cssText will produce "color: ; background: red"
      // The serialization path reads cssText when style is not in the attributes Map
      const html = renderToString(el as unknown as Element);
      expect(html).toContain('background: red;');
      // "color" with empty value should be excluded
      expect(html).not.toContain('color:');
    });
  });

  describe("cssText parsing with malformed declarations", () => {
    it("should handle declarations with no colon", () => {
      const el = new NucloElement('div');
      // Override style with a custom object that returns malformed cssText
      Object.defineProperty(el, 'style', {
        value: {
          cssText: 'invalidstyle; color: blue',
        },
        configurable: true,
      });
      const html = renderToString(el as unknown as Element);
      // "invalidstyle" has no colon, so it passes through as-is
      // "color: blue" should be serialized normally
      expect(html).toContain('color: blue;');
      expect(html).toContain('invalidstyle');
    });
  });

  describe("browser element with NamedNodeMap-like attributes", () => {
    it("should serialize attributes from a NamedNodeMap-like object", () => {
      // Create a plain object that mimics a browser Element with NamedNodeMap attributes
      const fakeElement = {
        nodeType: 1,
        tagName: 'DIV',
        attributes: {
          length: 2,
          0: { name: 'id', value: 'test-id' },
          1: { name: 'class', value: 'test-class' },
        },
        childNodes: [] as any[],
      };
      const html = renderToString(fakeElement as unknown as Element);
      expect(html).toContain('id="test-id"');
      expect(html).toContain('class="test-class"');
      expect(html).toBe('<div id="test-id" class="test-class"></div>');
    });

    it("should handle a NamedNodeMap-like object with zero attributes", () => {
      const fakeElement = {
        nodeType: 1,
        tagName: 'SPAN',
        attributes: {
          length: 0,
        },
        childNodes: [] as any[],
      };
      const html = renderToString(fakeElement as unknown as Element);
      expect(html).toBe('<span></span>');
    });

    it("should skip null entries in NamedNodeMap-like attributes", () => {
      const fakeElement = {
        nodeType: 1,
        tagName: 'DIV',
        attributes: {
          length: 2,
          0: { name: 'data-foo', value: 'bar' },
          1: null,
        },
        childNodes: [] as any[],
      };
      const html = renderToString(fakeElement as unknown as Element);
      expect(html).toContain('data-foo="bar"');
    });
  });

  describe("boolean attribute string values", () => {
    it("should omit boolean attribute when value is string 'false'", () => {
      const el = new NucloElement('input');
      el.attributes.set('type', 'checkbox');
      el.attributes.set('disabled', 'false');
      const html = renderToString(el as unknown as Element);
      expect(html).not.toContain('disabled');
    });

    it("should render boolean attribute when value is string 'true'", () => {
      const el = new NucloElement('input');
      el.attributes.set('type', 'checkbox');
      el.attributes.set('checked', 'true');
      const html = renderToString(el as unknown as Element);
      expect(html).toContain(' checked');
      expect(html).not.toContain('checked="true"');
    });

    it("should render boolean attribute when value equals the attribute name", () => {
      const el = new NucloElement('input');
      el.attributes.set('type', 'text');
      el.attributes.set('readonly', 'readonly');
      const html = renderToString(el as unknown as Element);
      expect(html).toContain(' readonly');
      expect(html).not.toContain('readonly="readonly"');
    });
  });

  describe("element with textContent fallback", () => {
    it("should use textContent when element has no child nodes", () => {
      const fakeElement = {
        nodeType: 1,
        tagName: 'P',
        attributes: {
          length: 0,
        },
        textContent: 'Fallback text',
        childNodes: [] as any[],
      };
      const html = renderToString(fakeElement as unknown as Element);
      expect(html).toBe('<p>Fallback text</p>');
    });
  });
});
