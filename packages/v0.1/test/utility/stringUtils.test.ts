import { describe, it, expect } from 'vitest';
import { camelToKebab, escapeHtml } from '../../src/utility/stringUtils';

describe('stringUtils', () => {
  describe('camelToKebab', () => {
    it('should convert single word camelCase to kebab-case', () => {
      expect(camelToKebab('backgroundColor')).toBe('background-color');
      expect(camelToKebab('fontSize')).toBe('font-size');
      expect(camelToKebab('marginTop')).toBe('margin-top');
    });

    it('should handle multiple uppercase letters', () => {
      expect(camelToKebab('borderTopLeftRadius')).toBe('border-top-left-radius');
      expect(camelToKebab('webkitTransform')).toBe('webkit-transform');
      expect(camelToKebab('mozBoxShadow')).toBe('moz-box-shadow');
    });

    it('should handle strings with no uppercase letters', () => {
      expect(camelToKebab('color')).toBe('color');
      expect(camelToKebab('margin')).toBe('margin');
      expect(camelToKebab('padding')).toBe('padding');
    });

    it('should handle empty string', () => {
      expect(camelToKebab('')).toBe('');
    });

    it('should handle single character strings', () => {
      expect(camelToKebab('a')).toBe('a');
      expect(camelToKebab('A')).toBe('a');
    });

    it('should handle strings starting with uppercase', () => {
      expect(camelToKebab('BackgroundColor')).toBe('background-color');
      expect(camelToKebab('FontSize')).toBe('font-size');
    });

    it('should handle consecutive uppercase letters', () => {
      expect(camelToKebab('XMLHttpRequest')).toBe('x-m-l-http-request');
      expect(camelToKebab('innerHTML')).toBe('inner-h-t-m-l');
    });

    it('should handle vendor prefixes', () => {
      expect(camelToKebab('WebkitTransform')).toBe('webkit-transform');
      expect(camelToKebab('MozTransition')).toBe('moz-transition');
      expect(camelToKebab('msFilter')).toBe('ms-filter');
    });

    it('should handle numbers in property names', () => {
      expect(camelToKebab('margin2x')).toBe('margin2x');
      expect(camelToKebab('grid1Column')).toBe('grid1-column');
    });

    it('should handle special characters (non-alphabetic)', () => {
      expect(camelToKebab('border-color')).toBe('border-color');
      expect(camelToKebab('margin_top')).toBe('margin_top');
    });

    it('should be performant with typical CSS properties', () => {
      const properties = [
        'backgroundColor',
        'fontSize',
        'marginTop',
        'paddingLeft',
        'borderRadius',
        'textAlign',
        'display',
        'position',
        'width',
        'height'
      ];

      properties.forEach(prop => {
        expect(camelToKebab(prop)).toMatch(/^[a-z-]+$/);
      });
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('&&&')).toBe('&amp;&amp;&amp;');
    });

    it('should escape less than', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
      expect(escapeHtml('5 < 10')).toBe('5 &lt; 10');
      expect(escapeHtml('<')).toBe('&lt;');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('</div>')).toBe('&lt;/div&gt;');
      expect(escapeHtml('10 > 5')).toBe('10 &gt; 5');
      expect(escapeHtml('>')).toBe('&gt;');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
      expect(escapeHtml('Say "hi"')).toBe('Say &quot;hi&quot;');
      expect(escapeHtml('"')).toBe('&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("'hello'")).toBe('&#039;hello&#039;');
      expect(escapeHtml("It's working")).toBe('It&#039;s working');
      expect(escapeHtml("'")).toBe('&#039;');
    });

    it('should escape multiple special characters', () => {
      expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
      expect(escapeHtml("Tom & Jerry's <script>")).toBe('Tom &amp; Jerry&#039;s &lt;script&gt;');
      expect(escapeHtml('<>"&\'')).toBe('&lt;&gt;&quot;&amp;&#039;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should not escape normal text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('123 ABC xyz')).toBe('123 ABC xyz');
      expect(escapeHtml('test@example.com')).toBe('test@example.com');
    });

    it('should handle strings with only special characters', () => {
      expect(escapeHtml('&<>"&\'')).toBe('&amp;&lt;&gt;&quot;&amp;&#039;');
    });

    it('should prevent XSS attacks', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
        '&lt;img src=x onerror=alert(1)&gt;'
      );
      expect(escapeHtml('<svg/onload=alert(1)>')).toBe(
        '&lt;svg/onload=alert(1)&gt;'
      );
      expect(escapeHtml('<iframe src="javascript:alert(1)">')).toBe(
        '&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;'
      );

      // Verify that escaped content doesn't contain raw HTML tags
      const dangerous = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(dangerous);
      expect(escaped).not.toContain('<script');
      expect(escaped).not.toContain('</script>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('should handle Unicode characters correctly', () => {
      expect(escapeHtml('Hello 世界')).toBe('Hello 世界');
      expect(escapeHtml('Emoji 🎉')).toBe('Emoji 🎉');
      expect(escapeHtml('Über & Åse')).toBe('Über &amp; Åse');
    });

    it('should escape in attribute values', () => {
      expect(escapeHtml('value="test"')).toBe('value=&quot;test&quot;');
      expect(escapeHtml("class='btn btn-primary'")).toBe('class=&#039;btn btn-primary&#039;');
    });
  });

  describe('integration tests', () => {
    it('should work together for style attribute generation', () => {
      const styleName = camelToKebab('backgroundColor');
      const styleValue = escapeHtml('red; border: 1px;');

      expect(styleName).toBe('background-color');
      expect(styleValue).toBe('red; border: 1px;');

      const attr = `${styleName}:${styleValue}`;
      expect(attr).toBe('background-color:red; border: 1px;');
    });

    it('should handle malicious style values', () => {
      const styleName = camelToKebab('fontFamily');
      const maliciousValue = escapeHtml('Arial"; alert("XSS");"');

      expect(styleName).toBe('font-family');
      expect(maliciousValue).toBe('Arial&quot;; alert(&quot;XSS&quot;);&quot;');
    });
  });
});
