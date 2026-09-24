/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { assignInlineStyles, applyStyleAttribute } from '../../src/element/inline-style';
import { notifyReactiveElements } from '../../src/update/reactive-attributes';

describe('styleManager defensive guards & edge cases', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  describe('assignInlineStyles guards', () => {

    it('returns early when element has no style property', () => {
      const fake = {} as any;
      expect(() => assignInlineStyles(fake, { color: 'red' })).not.toThrow();
      // No style applied (no style object existed)
      expect((fake.style)).toBeUndefined();
    });

    it('returns early when styles argument is null', () => {
      assignInlineStyles(el, null);
      // Style attribute remains empty
      expect(el.getAttribute('style')).toBeNull();
    });

    it('returns early when styles argument is undefined', () => {
      assignInlineStyles(el, undefined);
      expect(el.getAttribute('style')).toBeNull();
    });

    it('silently ignores empty string / null values (removal path)', () => {
      el.style.color = 'red';
      el.style.fontSize = '20px';

      assignInlineStyles(el, { color: '', fontSize: null } as any);
      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });
  });

  describe('assignInlineStyles values', () => {
    it('sets string and number values', () => {
      assignInlineStyles(el, { color: 'red', opacity: 0.5 } as any);
      expect(el.style.color).toBe('red');
      expect(el.style.opacity).toBe('0.5');
    });

    it('accepts camelCase and kebab-case property names', () => {
      assignInlineStyles(el, { fontSize: '16px', 'margin-top': '4px' } as any);
      expect(el.style.fontSize).toBe('16px');
      expect(el.style.getPropertyValue('margin-top')).toBe('4px');
    });

    it('removes a property for null, undefined and ""', () => {
      el.style.color = 'red';
      el.style.fontSize = '20px';
      el.style.margin = '1px';
      assignInlineStyles(el, { color: null, fontSize: undefined, margin: '' } as any);
      expect(el.getAttribute('style')).toBe('');
    });

    it('logs a value whose toString throws and still applies the other properties', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const bad = { toString: () => { throw new Error('toString error'); } };
      assignInlineStyles(el, { color: bad, fontSize: '12px' } as any);
      expect(el.style.fontSize).toBe('12px');
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("Failed to set style property 'color'"), undefined);
      spy.mockRestore();
    });
  });

  describe('applyStyleAttribute guards', () => {
    it('passes static object through to assignInlineStyles (smoke)', () => {
      applyStyleAttribute(el, { color: 'green', fontSize: '18px' });
      expect(el.style.color).toBe('green');
      expect(el.style.fontSize).toBe('18px');
    });

    it('returns early (no error) if style resolver target element is invalid', () => {
      const fake = {} as any;
      expect(() => applyStyleAttribute(fake, () => ({ color: 'red' }))).not.toThrow();
    });

    it('style resolver that throws initially is safely ignored then applies on update event', () => {
      let first = true;
      applyStyleAttribute(el, () => {
        if (first) {
          first = false;
          throw new Error('initial failure');
        }
        return { color: 'purple' };
      });

      // After initial application (which threw), color not set
      expect(el.style.color).toBe('');

      // The next update pass re-evaluates the resolver
      notifyReactiveElements();
      expect(el.style.color).toBe('purple');
    });

    it('style resolver returning null results in no style changes', () => {
      el.style.color = 'orange';
      applyStyleAttribute(el, () => null);
      notifyReactiveElements();
      // Color remains previous value (resolver produced null which remove path ignores)
      expect(el.style.color).toBe('orange');
    });
  });

  describe('combined defensive scenarios', () => {
    it('does nothing when both element invalid and resolver throws', () => {
      const badEl = { nodeType: 1 } as any; // object masquerading as element but missing style/addEventListener
      expect(() => applyStyleAttribute(badEl, () => { throw new Error('boom'); })).not.toThrow();
    });

    it('does not crash when removing properties after multiple updates with empty values', () => {
      let toggle = true;
      applyStyleAttribute(el, () => {
        if (toggle) {
          toggle = false;
          return { color: 'red', fontSize: '22px' };
        }
        return { color: '', fontSize: null };
      });

      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('22px');

      notifyReactiveElements();
      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });
  });
});