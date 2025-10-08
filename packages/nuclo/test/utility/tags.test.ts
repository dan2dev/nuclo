import { describe, it, expect } from 'vitest';
import {
  HTML_TAGS as htmlTags,
  SVG_TAGS as svgTags,
  SELF_CLOSING_TAGS as selfClosingTags,
} from '../../src/core/tagRegistry.js';

describe('tags arrays', () => {
  describe('htmlTags', () => {
    it('should be an array of valid HTML tag names', () => {
      expect(Array.isArray(htmlTags)).toBe(true);
      expect(htmlTags.length).toBeGreaterThan(0);
    });

    it('should contain common HTML elements', () => {
      const commonTags = ['div', 'span', 'p', 'a', 'img', 'input', 'button', 'form'];
      commonTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should contain HTML5 semantic elements', () => {
      const semanticTags = ['header', 'footer', 'nav', 'article', 'section', 'aside', 'main'];
      semanticTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should contain form elements', () => {
      const formTags = ['form', 'input', 'button', 'select', 'textarea', 'label', 'fieldset', 'legend'];
      formTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should contain table elements', () => {
      const tableTags = ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col'];
      tableTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should contain media elements', () => {
      const mediaTags = ['audio', 'video', 'source', 'track', 'canvas', 'picture'];
      mediaTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should contain all heading elements', () => {
      const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      headings.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should not contain duplicates', () => {
      const uniqueTags = [...new Set(htmlTags)];
      expect(htmlTags).toHaveLength(uniqueTags.length);
    });

    it('should contain only lowercase strings', () => {
      htmlTags.forEach(tag => {
        expect(typeof tag).toBe('string');
        expect(tag).toBe(tag.toLowerCase());
      });
    });
  });

  describe('svgTags', () => {
    it('should be an array of valid SVG tag names', () => {
      expect(Array.isArray(svgTags)).toBe(true);
      expect(svgTags.length).toBeGreaterThan(0);
    });

    it('should contain basic SVG elements', () => {
      const basicSvgTags = ['svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'path', 'text'];
      basicSvgTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should contain gradient elements', () => {
      const gradientTags = ['linearGradient', 'radialGradient', 'stop'];
      gradientTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should contain filter elements', () => {
      const filterTags = ['filter', 'feBlend', 'feColorMatrix', 'feGaussianBlur', 'feOffset'];
      filterTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should contain animation elements', () => {
      const animationTags = ['animate', 'animateMotion', 'animateTransform', 'set'];
      animationTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should contain structural elements', () => {
      const structuralTags = ['defs', 'use', 'symbol', 'marker', 'clipPath', 'mask'];
      structuralTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should not contain duplicates', () => {
      const uniqueTags = [...new Set(svgTags)];
      expect(svgTags).toHaveLength(uniqueTags.length);
    });

    it('should contain valid SVG tag names (some camelCase)', () => {
      svgTags.forEach(tag => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });

      // SVG htmlTags can have camelCase (unlike HTML htmlTags)
      const camelCaseTags = ['animateMotion', 'animateTransform', 'feColorMatrix', 'feGaussianBlur'];
      camelCaseTags.forEach(tag => {
        expect(svgTags).toContain(tag);
      });
    });

    it('should have some overlap with HTML htmlTags but be distinct', () => {
      // SVG and HTML share some tag names like 'a', 'script', 'style', 'title'
      const sharedTags = svgTags.filter(tag => htmlTags.includes(tag as typeof htmlTags[number]));
      expect(sharedTags.length).toBeGreaterThan(0);
      expect(sharedTags).toContain('a');
      expect(sharedTags).toContain('script');
      expect(sharedTags).toContain('style');
      expect(sharedTags).toContain('title');

      // But SVG should have many unique htmlTags
      const uniqueSvgTags = svgTags.filter(tag => !htmlTags.includes(tag as typeof htmlTags[number]));
      expect(uniqueSvgTags.length).toBeGreaterThan(0);
      expect(uniqueSvgTags).toContain('svg');
      expect(uniqueSvgTags).toContain('circle');
      expect(uniqueSvgTags).toContain('path');
    });
  });

  describe('selfClosingTags', () => {
    it('should be an array of self-closing HTML tag names', () => {
      expect(Array.isArray(selfClosingTags)).toBe(true);
      expect(selfClosingTags.length).toBeGreaterThan(0);
    });

    it('should contain all void elements according to HTML specification', () => {
      const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
      voidElements.forEach(tag => {
        expect(selfClosingTags).toContain(tag);
      });
    });

    it('should be a subset of HTML htmlTags', () => {
      selfClosingTags.forEach(tag => {
        expect(htmlTags).toContain(tag);
      });
    });

    it('should not contain duplicates', () => {
      const uniqueTags = [...new Set(selfClosingTags)];
      expect(selfClosingTags).toHaveLength(uniqueTags.length);
    });

    it('should contain only lowercase strings', () => {
      selfClosingTags.forEach(tag => {
        expect(typeof tag).toBe('string');
        expect(tag).toBe(tag.toLowerCase());
      });
    });

    it('should not contain container elements', () => {
      const containerElements = ['div', 'span', 'p', 'body', 'html', 'head', 'title'];
      containerElements.forEach(tag => {
        expect(selfClosingTags).not.toContain(tag);
      });
    });

    it('should be much smaller than the full htmlTags array', () => {
      expect(selfClosingTags.length).toBeLessThan(htmlTags.length / 2);
    });
  });

  describe('array relationships', () => {
    it('should have no overlap between selfClosingTags and non-self-closing htmlTags', () => {
      const nonSelfClosingTags = htmlTags.filter(
        tag => !selfClosingTags.includes(tag as (typeof selfClosingTags)[number]),
      );
      const overlap = selfClosingTags.filter(tag => nonSelfClosingTags.includes(tag));
      expect(overlap).toHaveLength(0);
    });

    it('should have selfClosingTags + non-self-closing htmlTags equal total HTML htmlTags', () => {
      const nonSelfClosingTags = htmlTags.filter(
        tag => !selfClosingTags.includes(tag as (typeof selfClosingTags)[number]),
      );
      expect(selfClosingTags.length + nonSelfClosingTags.length).toBe(htmlTags.length);
    });
  });

  describe('tag validation', () => {
    it('should not contain any empty strings', () => {
      [...htmlTags, ...svgTags, ...selfClosingTags].forEach(tag => {
        expect(tag.trim()).toBe(tag);
        expect(tag.length).toBeGreaterThan(0);
      });
    });

    it('should not contain any invalid characters', () => {
      const validHtmlTagPattern = /^[a-z][a-z0-9]*$/;
      const validSvgTagPattern = /^[a-zA-Z][a-zA-Z0-9]*$/; // SVG allows camelCase

      htmlTags.forEach(tag => {
        expect(validHtmlTagPattern.test(tag)).toBe(true);
      });

      svgTags.forEach(tag => {
        expect(validSvgTagPattern.test(tag)).toBe(true);
      });

      selfClosingTags.forEach(tag => {
        expect(validHtmlTagPattern.test(tag)).toBe(true);
      });
    });
  });
});
