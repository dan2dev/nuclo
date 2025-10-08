import { describe, it, expect, beforeEach } from 'vitest';
import { applyAttributes } from '../../src/core/attributeManager';
import { update } from '../../src';
import { assignInlineStyles } from '../../src/core/styleManager';

describe('attributeManager', () => {
  let el: HTMLDivElement;
  let data: {
    id: string;
    title: string;
    cls: string;
    val: string | undefined;
    color: string;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    el = document.createElement('div');
    document.body.appendChild(el);
    data = {
      id: 'start-id',
      title: 'Initial Title',
      cls: 'one',
      val: 'first',
      color: 'red'
    };
  });

  describe('static attributes', () => {
    it('applies standard DOM property attributes directly', () => {
      applyAttributes(el, {
        id: 'my-id',
        className: 'foo bar',
        title: 'Hello'
      } as any);

      expect(el.id).toBe('my-id');
      expect(el.className).toBe('foo bar');
      expect(el.title).toBe('Hello');
    });

    it('falls back to setAttribute for non-property names', () => {
      applyAttributes(el, {
        'data-custom': 'abc',
        'aria-label': 'label'
      } as any);

      expect(el.getAttribute('data-custom')).toBe('abc');
      expect(el.getAttribute('aria-label')).toBe('label');
    });

    it('skips null / undefined values', () => {
      applyAttributes(el, {
        id: null,
        title: undefined,
        'data-something': null
      } as any);

      expect(el.hasAttribute('id')).toBe(false);
      expect(el.hasAttribute('title')).toBe(false);
      expect(el.hasAttribute('data-something')).toBe(false);
    });
  });

  describe('reactive attributes (zero-arg functions)', () => {
    it('reactively updates a property-backed attribute', () => {
      applyAttributes(el, {
        className: () => data.cls
      } as any);

      // Initial
      expect(el.className).toBe('one');

      data.cls = 'two';
      update(); // triggers notifyReactiveElements
      expect(el.className).toBe('two');

      data.cls = 'three';
      update();
      expect(el.className).toBe('three');
    });

    it('reactively updates a setAttribute-based attribute', () => {
      applyAttributes(el, {
        'data-val': () => data.val
      } as any);

      expect(el.getAttribute('data-val')).toBe('first');

      data.val = 'second';
      update();
      expect(el.getAttribute('data-val')).toBe('second');

      // Returning undefined should not overwrite with "undefined" or remove existing value
      data.val = undefined;
      update();
      expect(el.getAttribute('data-val')).toBe('second');
    });

    it('handles multiple reactive attributes simultaneously', () => {
      applyAttributes(el, {
        id: () => data.id,
        title: () => data.title,
        'data-color': () => data.color
      } as any);

      expect(el.id).toBe('start-id');
      expect(el.title).toBe('Initial Title');
      expect(el.getAttribute('data-color')).toBe('red');

      data.id = 'next-id';
      data.title = 'Updated Title';
      data.color = 'blue';
      update();

      expect(el.id).toBe('next-id');
      expect(el.title).toBe('Updated Title');
      expect(el.getAttribute('data-color')).toBe('blue');
    });
  });

  describe('style attribute integration', () => {
    it('applies static style object', () => {
      applyAttributes(el, {
        style: {
          color: 'green',
          fontSize: '18px'
        }
      } as any);

      expect(el.style.color).toBe('green');
      expect(el.style.fontSize).toBe('18px');
    });

    it('reactively updates style object', () => {
      applyAttributes(el, {
        style: () => ({
          color: data.color,
          fontSize: data.color === 'red' ? '12px' : '20px'
        })
      } as any);

      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('12px');

      data.color = 'blue';
      update();

      expect(el.style.color).toBe('blue');
      expect(el.style.fontSize).toBe('20px');
    });

    it('removes style properties when resolver returns empty values', () => {
      data.color = 'purple';
      applyAttributes(el, {
        style: () => ({
          color: data.color,
          fontSize: data.color === 'purple' ? '24px' : ''
        })
      } as any);

      expect(el.style.color).toBe('purple');
      expect(el.style.fontSize).toBe('24px');

      data.color = 'orange'; // fontSize should become empty + removed
      update();

      expect(el.style.color).toBe('orange');
      // JSDOM sets removed property to empty string
      expect(el.style.fontSize).toBe('');
    });
  });

  describe('integration: mixed static + reactive', () => {
    it('does not overwrite static props when separate reactive ones update', () => {
      applyAttributes(el, {
        id: 'fixed-id',
        title: () => data.title
      } as any);

      expect(el.id).toBe('fixed-id');
      expect(el.title).toBe('Initial Title');

      data.title = 'New Title';
      update();

      expect(el.id).toBe('fixed-id');
      expect(el.title).toBe('New Title');
    });
  });

  describe('edge cases', () => {
    it('ignores non-function reactive candidate (function length > 0)', () => {
      // A function with parameters is treated as NodeModFn elsewhere; here it should
      // simply be assigned directly (since attributeManager only treats zero-arg
      // functions as reactive values). We simulate by passing a function with length 1.
      const fn = (x: any) => `value-${x}`;
      applyAttributes(el, {

        title: fn
      });

      // attributeManager will call setValue with the function reference (stringified)
      // because key exists in el, it sets el['title'] = fn (object property assignment)
      // In the DOM, setting title to a function object coerces to string "[object Function]"
      expect(el.title).toBe(String(fn));
    });

    it('does nothing when attributes object is falsy', () => {
      applyAttributes(el, null as any);
      expect(el.attributes.length).toBe(0);
    });
  });
});