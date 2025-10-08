import { describe, it, expect, beforeEach } from 'vitest';
import { assignInlineStyles, applyStyleAttribute } from '../../src/core/styleManager';

describe('styleManager defensive guards & edge cases', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  describe('assignInlineStyles guards', () => {
    it('returns early when element is null', () => {
      // Should not throw
      expect(() => assignInlineStyles(null as any, { color: 'red' })).not.toThrow();
    });

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

  describe('applyStyleAttribute guards', () => {
    it('returns early when element is null', () => {
      expect(() => applyStyleAttribute(null as any, { color: 'red' })).not.toThrow();
    });

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

      // Dispatch "update" to trigger reactive attribute re-evaluation
      el.dispatchEvent(new Event('update'));
      expect(el.style.color).toBe('purple');
    });

    it('style resolver returning null results in no style changes', () => {
      el.style.color = 'orange';
      applyStyleAttribute(el, () => null);
      el.dispatchEvent(new Event('update'));
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

      el.dispatchEvent(new Event('update'));
      expect(el.style.color).toBe('');
      expect(el.style.fontSize).toBe('');
    });
  });
});