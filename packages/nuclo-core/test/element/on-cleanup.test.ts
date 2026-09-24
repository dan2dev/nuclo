/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { on, removeAllListeners } from '../../src/element/events';

describe('on utility - cleanup and memory management', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('button');
    document.body.appendChild(element);
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners when no type specified', () => {
      const clickListener = vi.fn();
      const focusListener = vi.fn();
      const mouseoverListener = vi.fn();

      const clickMod = on('click', clickListener);
      const focusMod = on('focus', focusListener);
      const mouseoverMod = on('mouseover', mouseoverListener);

      clickMod(element, 0);
      focusMod(element, 0);
      mouseoverMod(element, 0);

      // All should work initially
      element.click();
      element.dispatchEvent(new Event('focus'));
      element.dispatchEvent(new Event('mouseover'));

      expect(clickListener).toHaveBeenCalledTimes(1);
      expect(focusListener).toHaveBeenCalledTimes(1);
      expect(mouseoverListener).toHaveBeenCalledTimes(1);

      // Remove all listeners
      removeAllListeners(element);

      // None should work now
      element.click();
      element.dispatchEvent(new Event('focus'));
      element.dispatchEvent(new Event('mouseover'));

      expect(clickListener).toHaveBeenCalledTimes(1);
      expect(focusListener).toHaveBeenCalledTimes(1);
      expect(mouseoverListener).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if element has no listeners', () => {
      expect(() => {
        removeAllListeners(element);
      }).not.toThrow();

      expect(() => {
        removeAllListeners(element);
      }).not.toThrow();
    });

    it('should cleanup type map when removing last event type', () => {
      const clickListener = vi.fn();
      const clickMod = on('click', clickListener);

      clickMod(element, 0);

      // Remove all click listeners (the only type)
      removeAllListeners(element);

      // Should be able to add new listeners without issues
      const newListener = vi.fn();
      const newMod = on('click', newListener);
      newMod(element, 0);

      element.click();
      expect(newListener).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple listeners of same type being removed together', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      const mod1 = on('click', listener1);
      const mod2 = on('click', listener2);
      const mod3 = on('click', listener3);

      mod1(element, 0);
      mod2(element, 1);
      mod3(element, 2);

      // All should work
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);

      // Remove all at once
      removeAllListeners(element);

      // None should work
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });
  });

  describe('WeakMap behavior and memory management', () => {
    it('should track multiple listeners on same element', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      const mod1 = on('click', listener1);
      const mod2 = on('focus', listener2);
      const mod3 = on('click', listener3);

      mod1(element, 0);
      mod2(element, 0);
      mod3(element, 1);

      element.click();
      element.dispatchEvent(new Event('focus'));

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should handle listener removal and re-addition', () => {
      const listener = vi.fn();
      const mod = on('click', listener);

      // Add listener
      mod(element, 0);
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);

      // Remove listener
      removeAllListeners(element);
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);

      // Re-add the same listener
      mod(element, 0);
      element.click();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should track listeners on multiple elements independently', () => {
      const element2 = document.createElement('div');
      document.body.appendChild(element2);

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const mod1 = on('click', listener1);
      const mod2 = on('click', listener2);

      mod1(element, 0);
      mod2(element2, 0);

      element.click();
      element2.click();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      // Remove listeners from element1 only
      removeAllListeners(element);

      element.click();
      element2.click();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tracked listener cleanup', () => {
    it('should detach listeners of a selected type', () => {
      const listener = vi.fn();
      const mod = on('click', listener);

      mod(element, 0);

      // Listener works initially
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);

      // Remove the selected listener type.
      removeAllListeners(element);

      // Listener should not work after abort
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should detach every tracked listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const mod1 = on('click', listener1);
      const mod2 = on('click', listener2);

      mod1(element, 0);
      mod2(element, 1);

      // Both work initially
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      // Remove all
      removeAllListeners(element);

      // None should work
      element.click();
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {

    it('should handle listener options correctly during removal', () => {
      const listener = vi.fn();
      const mod = on('click', listener, { once: true });

      mod(element, 0);

      // First click should work
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);

      // Second click should not work (once: true)
      element.click();
      expect(listener).toHaveBeenCalledTimes(1);

      // Manual removal should not throw even if already removed
      expect(() => {
        removeAllListeners(element);
      }).not.toThrow();
    });

    it('should handle custom events with typed details', () => {
      interface CustomDetail { value: number; }
      const listener = vi.fn((e: CustomEvent<CustomDetail>) => {
        return e.detail.value;
      });

      const mod = on<'custom', CustomEvent<CustomDetail>>('custom', listener);
      mod(element, 0);

      // Dispatch custom event
      element.dispatchEvent(new CustomEvent('custom', { detail: { value: 42 } }));
      expect(listener).toHaveBeenCalledTimes(1);

      // Remove listener
      removeAllListeners(element);

      // Should not fire after removal
      element.dispatchEvent(new CustomEvent('custom', { detail: { value: 99 } }));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('removes both capture and bubble phase listeners via removeAllListeners', () => {
      const bubbleListener = vi.fn();
      const captureListener = vi.fn();

      const bubbleMod = on('click', bubbleListener, false);
      const captureMod = on('click', captureListener, true);

      bubbleMod(element, 0);
      captureMod(element, 0);

      element.click();

      expect(bubbleListener).toHaveBeenCalledTimes(1);
      expect(captureListener).toHaveBeenCalledTimes(1);

      // Removing the type tears down both capture and bubble registrations
      removeAllListeners(element);

      element.click();

      expect(bubbleListener).toHaveBeenCalledTimes(1);
      expect(captureListener).toHaveBeenCalledTimes(1);
    });

    it('uses the capture value from attachment time when options are mutated', () => {
      const listener = vi.fn();
      const options: AddEventListenerOptions = { capture: true, passive: true };
      const mod = on('click', listener, options);

      mod(element, 0);
      options.capture = false;
      options.passive = false;

      removeAllListeners(element);
      element.click();

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
