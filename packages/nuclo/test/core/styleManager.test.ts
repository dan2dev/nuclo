import { describe, it, expect, beforeEach } from 'vitest';
import { assignInlineStyles, applyStyleAttribute } from '../../src/core/styleManager';
import { update } from '../../src';

describe('styleManager', () => {
  let el: HTMLDivElement;
  let data: {
    color: string;
    size: string;
    border: string | null;
    throwMode: boolean;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('div');
    document.body.appendChild(el);
    data = {
      color: 'red',
      size: '14px',
      border: '1px solid black',
      throwMode: false
    };
  });

  describe('assignInlineStyles', () => {
    it('applies basic camelCase and kebab-able properties', () => {
      assignInlineStyles(el, {
        color: 'green',
        fontSize: '16px',
        backgroundColor: 'blue'
      });
      expect(el.style.color).toBe('green');
      expect(el.style.fontSize).toBe('16px');
      expect(el.style.backgroundColor).toBe('blue');
    });

    it('removes properties when value is null', () => {
      el.style.color = 'purple';
      el.style.fontSize = '20px';

      assignInlineStyles(el, {
        color: null,
        fontSize: null
      });

      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });

    it('removes properties when value is empty string', () => {
      el.style.color = 'purple';
      el.style.fontSize = '20px';

      assignInlineStyles(el, {
        color: '',
        fontSize: ''
      });

      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });

    it('handles undefined styles object safely', () => {
      assignInlineStyles(el, undefined);
      expect(el.getAttribute('style')).toBeNull();
    });

    it('handles null styles object safely', () => {
      assignInlineStyles(el, null);
      expect(el.getAttribute('style')).toBeNull();
    });

    it('ignores invalid style property assignments (throws inside toString)', () => {
      const badValue = {
        toString() {
          throw new Error('boom');
        }
      };
      // Should be caught and not crash
      assignInlineStyles(el, {
        color: 'red',
        fontSize: badValue as unknown as string
      });

      // color applied; fontSize unchanged / empty
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('');
    });
  });

  describe('applyStyleAttribute (static)', () => {
    it('applies static style object immediately', () => {
      applyStyleAttribute(el, {
        color: 'orange',
        fontSize: '22px'
      });

      expect(el.style.color).toBe('orange');
      expect(el.style.fontSize).toBe('22px');
    });

    it('removes properties in static object when set to null / empty', () => {
      el.style.color = 'cyan';
      el.style.fontSize = '30px';

      applyStyleAttribute(el, {
        color: null,
        fontSize: ''
      });

      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });

    it('gracefully handles null static value', () => {
      el.style.color = 'pink';
      applyStyleAttribute(el, null);
      expect(el.style.color).toBe('pink'); // unchanged
    });
  });

  describe('applyStyleAttribute (reactive)', () => {
    it('reactively updates styles on update()', () => {
      applyStyleAttribute(el, () => ({
        color: data.color,
        fontSize: data.size
      }));

      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('14px');

      data.color = 'blue';
      data.size = '18px';
      update();

      expect(el.style.color).toBe('blue');
      expect(el.style.fontSize).toBe('18px');
    });

    it('removes style property when reactive resolver returns empty string', () => {
      applyStyleAttribute(el, () => ({
        color: data.color,
        fontSize: data.size
      }));

      expect(el.style.fontSize).toBe('14px');
      data.size = ''; // removal path
      update();
      expect(el.style.fontSize).toBe('');
    });

    it('removes style property when reactive resolver returns null', () => {
      applyStyleAttribute(el, () => ({
        border: data.border
      }));

      expect(el.style.border).toContain('1px solid black');

      data.border = null;
      update();

      // Removed => empty
      expect(el.style.border).toBe('');
    });

    it('preserves last good styles if resolver starts throwing', () => {
      applyStyleAttribute(el, () => {
        if (data.throwMode) {
          throw new Error('style calc failed');
        }
        return {
          color: data.color,
          fontSize: data.size
        };
      });

      // Initial
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('14px');

      // Change normally
      data.color = 'green';
      update();
      expect(el.style.color).toBe('green');

      // Now cause throws; previous styles should persist (no wipe)
      data.throwMode = true;
      data.color = 'purple'; // would have been applied if not throwing
      update();
      expect(el.style.color).toBe('green'); // unchanged due to throw
    });

    it('handles resolver returning undefined (treated as no-op)', () => {
      applyStyleAttribute(el, () => ({
        color: data.color
      }));

      expect(el.style.color).toBe('red');

      // Return undefined — assignInlineStyles will skip
      applyStyleAttribute(el, () => undefined as any);
      update();
      // Still red
      expect(el.style.color).toBe('red');
    });

    it('mixed retained + removed properties on successive updates', () => {
      applyStyleAttribute(el, () => ({
        color: data.color,
        fontSize: data.size,
        border: data.border ?? ''
      }));

      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('14px');
      expect(el.style.border).toContain('1px solid black');

      // Remove border & change color
      data.border = null;
      data.color = 'black';
      update();

      expect(el.style.color).toBe('black');
      expect(el.style.border).toBe('');
    });
  });

  describe('integration sanity (style + other updates coexist)', () => {
    it('style updates do not remove unrelated attributes', () => {
      el.id = 'fixed';
      applyStyleAttribute(el, () => ({
        color: data.color
      }));

      expect(el.id).toBe('fixed');
      expect(el.style.color).toBe('red');

      data.color = 'yellow';
      update();

      expect(el.id).toBe('fixed');
      expect(el.style.color).toBe('yellow');
    });
  });
});