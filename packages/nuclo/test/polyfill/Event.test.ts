import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NucloEvent, NucloCustomEvent } from '../../src/polyfill/Event';

describe('NucloEvent', () => {
  describe('constructor', () => {
    it('should create an event with type only', () => {
      const event = new NucloEvent('click');

      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(false);
      expect(event.cancelable).toBe(false);
      expect(event.composed).toBe(false);
      expect(event.currentTarget).toBe(null);
      expect(event.defaultPrevented).toBe(false);
      expect(event.eventPhase).toBe(0);
      expect(event.isTrusted).toBe(false);
      expect(event.target).toBe(null);
      expect(event.returnValue).toBe(true);
      expect(event.srcElement).toBe(null);
      expect(event.cancelBubble).toBe(false);
      expect(event.timeStamp).toBeGreaterThan(0);
    });

    it('should create an event with eventInitDict', () => {
      const event = new NucloEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true
      });

      expect(event.type).toBe('click');
      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('should handle partial eventInitDict', () => {
      const event = new NucloEvent('submit', { bubbles: true });

      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(false);
      expect(event.composed).toBe(false);
    });

    it('should set timestamp to current time', () => {
      const before = Date.now();
      const event = new NucloEvent('test');
      const after = Date.now();

      expect(event.timeStamp).toBeGreaterThanOrEqual(before);
      expect(event.timeStamp).toBeLessThanOrEqual(after);
    });
  });

  describe('constants', () => {
    it('should have correct event phase constants', () => {
      const event = new NucloEvent('test');

      expect(event.NONE).toBe(0);
      expect(event.CAPTURING_PHASE).toBe(1);
      expect(event.AT_TARGET).toBe(2);
      expect(event.BUBBLING_PHASE).toBe(3);
    });
  });

  describe('composedPath', () => {
    it('should return empty array', () => {
      const event = new NucloEvent('test');
      const path = event.composedPath();

      expect(path).toEqual([]);
      expect(Array.isArray(path)).toBe(true);
    });
  });

  describe('initEvent', () => {
    it('should be a no-op (legacy method)', () => {
      const event = new NucloEvent('test');

      // Should not throw and should not change anything
      event.initEvent('newType', true, true);

      // Type should remain unchanged (it's a legacy no-op)
      expect(event.type).toBe('test');
    });
  });

  describe('preventDefault', () => {
    it('should set defaultPrevented to true when event is cancelable', () => {
      const event = new NucloEvent('test', { cancelable: true });

      expect(event.defaultPrevented).toBe(false);
      event.preventDefault();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should not set defaultPrevented when event is not cancelable', () => {
      const event = new NucloEvent('test', { cancelable: false });

      event.preventDefault();
      expect(event.defaultPrevented).toBe(false);
    });

    it('should not affect non-cancelable event by default', () => {
      const event = new NucloEvent('test');

      event.preventDefault();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('stopImmediatePropagation', () => {
    it('should set cancelBubble to true', () => {
      const event = new NucloEvent('test');

      expect(event.cancelBubble).toBe(false);
      event.stopImmediatePropagation();
      expect(event.cancelBubble).toBe(true);
    });
  });

  describe('stopPropagation', () => {
    it('should set cancelBubble to true', () => {
      const event = new NucloEvent('test');

      expect(event.cancelBubble).toBe(false);
      event.stopPropagation();
      expect(event.cancelBubble).toBe(true);
    });
  });

  describe('property mutations', () => {
    it('should allow currentTarget to be set', () => {
      const event = new NucloEvent('test');
      const target = {} as EventTarget;

      event.currentTarget = target;
      expect(event.currentTarget).toBe(target);
    });

    it('should allow target to be set', () => {
      const event = new NucloEvent('test');
      const target = {} as EventTarget;

      event.target = target;
      expect(event.target).toBe(target);
    });

    it('should allow eventPhase to be set', () => {
      const event = new NucloEvent('test');

      event.eventPhase = 2;
      expect(event.eventPhase).toBe(2);
    });

    it('should allow isTrusted to be set', () => {
      const event = new NucloEvent('test');

      event.isTrusted = true;
      expect(event.isTrusted).toBe(true);
    });

    it('should allow returnValue to be set', () => {
      const event = new NucloEvent('test');

      event.returnValue = false;
      expect(event.returnValue).toBe(false);
    });

    it('should allow srcElement to be set', () => {
      const event = new NucloEvent('test');
      const element = {} as EventTarget;

      event.srcElement = element;
      expect(event.srcElement).toBe(element);
    });
  });
});

describe('NucloCustomEvent', () => {
  describe('constructor', () => {
    it('should create a custom event with type only', () => {
      const event = new NucloCustomEvent('custom');

      expect(event.type).toBe('custom');
      expect(event.detail).toBeUndefined();
      expect(event.bubbles).toBe(false);
      expect(event.cancelable).toBe(false);
    });

    it('should create a custom event with detail', () => {
      const detail = { foo: 'bar', count: 42 };
      const event = new NucloCustomEvent('custom', { detail });

      expect(event.type).toBe('custom');
      expect(event.detail).toEqual(detail);
      expect(event.detail).toBe(detail);
    });

    it('should support typed detail', () => {
      interface CustomDetail {
        message: string;
        code: number;
      }

      const detail: CustomDetail = { message: 'test', code: 123 };
      const event = new NucloCustomEvent<CustomDetail>('custom', { detail });

      expect(event.detail.message).toBe('test');
      expect(event.detail.code).toBe(123);
    });

    it('should create custom event with bubbles and cancelable', () => {
      const event = new NucloCustomEvent('custom', {
        detail: { value: 1 },
        bubbles: true,
        cancelable: true
      });

      expect(event.bubbles).toBe(true);
      expect(event.cancelable).toBe(true);
      expect(event.detail).toEqual({ value: 1 });
    });

    it('should handle null detail', () => {
      const event = new NucloCustomEvent('custom', { detail: null });

      expect(event.detail).toBe(null);
    });

    it('should handle undefined detail explicitly', () => {
      const event = new NucloCustomEvent('custom', { detail: undefined });

      expect(event.detail).toBeUndefined();
    });

    it('should handle primitive detail values', () => {
      const stringEvent = new NucloCustomEvent('str', { detail: 'hello' });
      expect(stringEvent.detail).toBe('hello');

      const numberEvent = new NucloCustomEvent('num', { detail: 42 });
      expect(numberEvent.detail).toBe(42);

      const boolEvent = new NucloCustomEvent('bool', { detail: true });
      expect(boolEvent.detail).toBe(true);
    });

    it('should handle complex detail objects', () => {
      const detail = {
        nested: {
          deep: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        fn: () => 'function'
      };

      const event = new NucloCustomEvent('complex', { detail });

      expect(event.detail.nested.deep.value).toBe('test');
      expect(event.detail.array).toEqual([1, 2, 3]);
      expect(event.detail.fn()).toBe('function');
    });
  });

  describe('initCustomEvent', () => {
    it('should be a no-op (legacy method)', () => {
      const event = new NucloCustomEvent('test', { detail: 'original' });

      // Should not throw and should not change anything
      event.initCustomEvent('newType', true, true, 'new detail');

      // Should remain unchanged (it's a legacy no-op)
      expect(event.type).toBe('test');
      expect(event.detail).toBe('original');
    });
  });

  describe('inheritance from NucloEvent', () => {
    it('should inherit Event properties and methods', () => {
      const event = new NucloCustomEvent('custom', {
        detail: 'data',
        cancelable: true
      });

      // Should have Event properties
      expect(event.bubbles).toBeDefined();
      expect(event.cancelable).toBe(true);
      expect(event.timeStamp).toBeGreaterThan(0);

      // Should have Event methods
      expect(typeof event.preventDefault).toBe('function');
      expect(typeof event.stopPropagation).toBe('function');
      expect(typeof event.stopImmediatePropagation).toBe('function');
    });

    it('should support preventDefault', () => {
      const event = new NucloCustomEvent('custom', {
        detail: 'data',
        cancelable: true
      });

      event.preventDefault();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should support stopPropagation', () => {
      const event = new NucloCustomEvent('custom', { detail: 'data' });

      event.stopPropagation();
      expect(event.cancelBubble).toBe(true);
    });

    it('should be instance of NucloEvent', () => {
      const event = new NucloCustomEvent('custom');

      expect(event).toBeInstanceOf(NucloEvent);
    });
  });
});

describe('Event polyfill exports', () => {
  it('should export Event and CustomEvent', async () => {
    const module = await import('../../src/polyfill/Event');

    expect(module.Event).toBeDefined();
    expect(module.CustomEvent).toBeDefined();
  });
});
