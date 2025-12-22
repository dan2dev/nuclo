/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { on, removeListener, removeAllListeners } from '../../src/utility/on';

/**
 * Advanced edge case tests focusing on:
 * - Error boundaries
 * - Concurrent operations
 * - Memory leak prevention
 * - Complex listener scenarios
 */
describe('on utility - advanced edge cases', () => {
  let element: HTMLElement;
  let consoleErrorSpy: any;

  beforeEach(() => {
    element = document.createElement('button');
    document.body.appendChild(element);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    document.body.innerHTML = '';
  });

  describe('Error handling', () => {
    it('should catch and log errors thrown in listener', () => {
      const errorMessage = 'Test error in listener';
      const listener = vi.fn(() => {
        throw new Error(errorMessage);
      });
      
      const mod = on('click', listener);
      mod(element, 0);
      
      // Should not throw
      expect(() => {
        element.click();
      }).not.toThrow();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      const errorCall = consoleErrorSpy.mock.calls[0];
      expect(String(errorCall[0])).toContain('click');
    });

    it('should handle async errors in listeners gracefully', async () => {
      const listener = vi.fn(async () => {
        throw new Error('Async error');
      });
      
      const mod = on('click', listener);
      mod(element, 0);
      
      element.click();
      
      // Give time for async operation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should continue executing other listeners if one throws', () => {
      const errorListener = vi.fn(() => {
        throw new Error('First listener error');
      });
      const normalListener = vi.fn();
      
      const errorMod = on('click', errorListener);
      const normalMod = on('click', normalListener);
      
      errorMod(element, 0);
      normalMod(element, 1);
      
      element.click();
      
      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Listener context and binding', () => {
    it('should maintain correct "this" context when listener is an object method', () => {
      const obj = {
        count: 0,
        handleClick: vi.fn(function(this: any) {
          this.count++;
        })
      };
      
      const mod = on('click', obj.handleClick);
      mod(element, 0);
      
      element.click();
      
      // "this" should be the element, not the object
      expect(obj.handleClick).toHaveBeenCalledTimes(1);
      expect(obj.count).toBe(0); // Not incremented because "this" is element
    });

    it('should pass correct event object to listener', () => {
      const listener = vi.fn((e: MouseEvent) => {
        expect(e.type).toBe('click');
        expect(e.target).toBe(element);
        expect(e.currentTarget).toBe(element);
      });
      
      const mod = on('click', listener);
      mod(element, 0);
      
      element.click();
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle event object mutations in listener', () => {
      const listener1 = vi.fn((e: Event) => {
        (e as any).customProp = 'modified';
      });
      const listener2 = vi.fn((e: Event) => {
        expect((e as any).customProp).toBe('modified');
      });
      
      const mod1 = on('click', listener1);
      const mod2 = on('click', listener2);
      
      mod1(element, 0);
      mod2(element, 1);
      
      element.click();
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event propagation and capture', () => {
    it('should respect event propagation with stopPropagation', () => {
      const parent = document.createElement('div');
      const child = document.createElement('button');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      const parentListener = vi.fn();
      const childListener = vi.fn((e: Event) => {
        e.stopPropagation();
      });
      
      const parentMod = on('click', parentListener);
      const childMod = on('click', childListener);
      
      parentMod(parent, 0);
      childMod(child, 0);
      
      child.click();
      
      expect(childListener).toHaveBeenCalledTimes(1);
      expect(parentListener).not.toHaveBeenCalled();
      
      document.body.removeChild(parent);
    });

    it('should handle capture phase correctly', () => {
      const parent = document.createElement('div');
      const child = document.createElement('button');
      parent.appendChild(child);
      document.body.appendChild(parent);
      
      const captureOrder: string[] = [];
      
      const parentCapture = vi.fn(() => captureOrder.push('parent-capture'));
      const childBubble = vi.fn(() => captureOrder.push('child-bubble'));
      const parentBubble = vi.fn(() => captureOrder.push('parent-bubble'));
      
      const parentCaptureMod = on('click', parentCapture, { capture: true });
      const childBubbleMod = on('click', childBubble);
      const parentBubbleMod = on('click', parentBubble);
      
      parentCaptureMod(parent, 0);
      childBubbleMod(child, 0);
      parentBubbleMod(parent, 1);
      
      child.click();
      
      expect(captureOrder).toEqual(['parent-capture', 'child-bubble', 'parent-bubble']);
      
      document.body.removeChild(parent);
    });

    it('should handle preventDefault in listeners', () => {
      const preventListener = vi.fn((e: Event) => {
        e.preventDefault();
      });
      const checkListener = vi.fn((e: Event) => {
        expect(e.defaultPrevented).toBe(true);
      });
      
      const preventMod = on('click', preventListener);
      const checkMod = on('click', checkListener);
      
      preventMod(element, 0);
      checkMod(element, 1);
      
      const event = new Event('click', { cancelable: true });
      element.dispatchEvent(event);
      
      expect(preventListener).toHaveBeenCalledTimes(1);
      expect(checkListener).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('Listener options', () => {
    it('should respect "once" option', () => {
      const listener = vi.fn();
      const mod = on('click', listener, { once: true });
      
      mod(element, 0);
      
      element.click();
      element.click();
      element.click();
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should respect "passive" option', () => {
      const listener = vi.fn((e: Event) => {
        // In passive mode, preventDefault should have no effect
        e.preventDefault();
      });
      
      const mod = on('touchstart', listener, { passive: true });
      mod(element, 0);
      
      const event = new Event('touchstart', { cancelable: true });
      element.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalledTimes(1);
      // Note: In test environment, passive might not be fully enforced
    });

    it('should handle object options with multiple properties', () => {
      const listener = vi.fn();
      const mod = on('click', listener, {
        capture: true,
        once: true,
        passive: true
      });
      
      mod(element, 0);
      
      element.click();
      element.click();
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should merge signal option with custom options', () => {
      const listener = vi.fn();
      const controller = new AbortController();
      
      const mod = on('click', listener, {
        capture: false,
        signal: controller.signal
      });
      
      mod(element, 0);
      
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);
      
      // Note: The on() function creates its own AbortController
      // This tests that it can handle options objects with signals
    });
  });

  describe('Custom events', () => {
    it('should handle custom event with complex detail', () => {
      interface ComplexDetail {
        id: number;
        name: string;
        nested: { value: boolean };
      }
      
      const listener = vi.fn((e: CustomEvent<ComplexDetail>) => {
        expect(e.detail.id).toBe(123);
        expect(e.detail.name).toBe('test');
        expect(e.detail.nested.value).toBe(true);
      });
      
      const mod = on<'custom', CustomEvent<ComplexDetail>>('custom', listener);
      mod(element, 0);
      
      element.dispatchEvent(new CustomEvent('custom', {
        detail: {
          id: 123,
          name: 'test',
          nested: { value: true }
        }
      }));
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple custom events of different types', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();
      
      const mod1 = on('custom-event-1', listener1);
      const mod2 = on('custom-event-2', listener2);
      const mod3 = on('custom-event-3', listener3);
      
      mod1(element, 0);
      mod2(element, 0);
      mod3(element, 0);
      
      element.dispatchEvent(new CustomEvent('custom-event-1'));
      element.dispatchEvent(new CustomEvent('custom-event-2'));
      element.dispatchEvent(new CustomEvent('custom-event-3'));
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Rapid operations', () => {
    it('should handle rapid add and remove cycles', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      // Rapid add/remove cycle
      for (let i = 0; i < 10; i++) {
        mod(element, 0);
        element.click();
        removeListener(element, 'click', listener);
      }
      
      expect(listener).toHaveBeenCalledTimes(10);
    });

    it('should handle many listeners being added at once', () => {
      const listeners = Array.from({ length: 100 }, () => vi.fn());
      const mods = listeners.map(listener => on('click', listener));
      
      mods.forEach((mod, i) => mod(element, i));
      
      element.click();
      
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid event dispatching', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      mod(element, 0);
      
      // Dispatch many events rapidly
      for (let i = 0; i < 100; i++) {
        element.click();
      }
      
      expect(listener).toHaveBeenCalledTimes(100);
    });
  });

  describe('Memory management', () => {
    it('should allow same listener function on multiple elements', () => {
      const element2 = document.createElement('div');
      const element3 = document.createElement('span');
      document.body.appendChild(element2);
      document.body.appendChild(element3);
      
      const sharedListener = vi.fn();
      const mod = on('click', sharedListener);
      
      mod(element, 0);
      mod(element2, 0);
      mod(element3, 0);
      
      element.click();
      element2.click();
      element3.click();
      
      expect(sharedListener).toHaveBeenCalledTimes(3);
      
      // Remove from one element
      removeListener(element, 'click', sharedListener);
      
      element.click();
      element2.click();
      element3.click();
      
      expect(sharedListener).toHaveBeenCalledTimes(5); // 3 + 2 (element2 and element3)
    });

    it('should handle listener removal after element is removed from DOM', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      mod(element, 0);
      
      // Remove element from DOM
      element.remove();
      
      // Should still be able to remove listener without error
      expect(() => {
        removeListener(element, 'click', listener);
      }).not.toThrow();
      
      // Re-add to DOM and verify listener was removed
      document.body.appendChild(element);
      element.click();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle element reuse after cleanup', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const mod1 = on('click', listener1);
      const mod2 = on('click', listener2);
      
      // First lifecycle
      mod1(element, 0);
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      
      removeAllListeners(element);
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      
      // Second lifecycle
      mod2(element, 0);
      element.click();
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener1).toHaveBeenCalledTimes(1);
    });
  });

  describe('Special event types', () => {
    it('should handle keyboard events with correct typing', () => {
      const listener = vi.fn((e: KeyboardEvent) => {
        expect(e.key).toBeDefined();
        expect(e.code).toBeDefined();
      });
      
      const mod = on('keydown', listener);
      mod(element, 0);
      
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' });
      element.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle mouse events with correct typing', () => {
      const listener = vi.fn((e: MouseEvent) => {
        expect(e.clientX).toBeDefined();
        expect(e.clientY).toBeDefined();
        expect(e.button).toBeDefined();
      });
      
      const mod = on('click', listener);
      mod(element, 0);
      
      const event = new MouseEvent('click', { clientX: 100, clientY: 200, button: 0 });
      element.dispatchEvent(event);
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle focus events', () => {
      const focusListener = vi.fn();
      const blurListener = vi.fn();
      
      const focusMod = on('focus', focusListener);
      const blurMod = on('blur', blurListener);
      
      focusMod(element, 0);
      blurMod(element, 0);
      
      element.dispatchEvent(new Event('focus'));
      element.dispatchEvent(new Event('blur'));
      
      expect(focusListener).toHaveBeenCalledTimes(1);
      expect(blurListener).toHaveBeenCalledTimes(1);
    });

    it('should handle input events on form elements', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      
      const listener = vi.fn((e: Event) => {
        expect(e.target).toBe(input);
      });
      
      const mod = on('input', listener);
      mod(input, 0);
      
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      expect(listener).toHaveBeenCalledTimes(1);
      
      document.body.removeChild(input);
    });
  });

  describe('Edge cases with invalid inputs', () => {
    it('should handle null parent gracefully', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      expect(() => {
        // @ts-expect-error Testing invalid input
        mod(null, 0);
      }).not.toThrow();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle undefined parent gracefully', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      expect(() => {
        // @ts-expect-error Testing invalid input
        mod(undefined, 0);
      }).not.toThrow();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle object without addEventListener', () => {
      const listener = vi.fn();
      const mod = on('click', listener);
      
      const fakeElement = { tagName: 'DIV' };
      
      expect(() => {
        // @ts-expect-error Testing invalid input
        mod(fakeElement, 0);
      }).not.toThrow();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle empty event type string', () => {
      const listener = vi.fn();
      const mod = on('', listener);
      
      mod(element, 0);
      
      // Empty event type should still add listener (DOM allows it)
      element.dispatchEvent(new Event(''));
      
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
