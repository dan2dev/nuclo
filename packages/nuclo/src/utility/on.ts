/**
 * Typed event listener helper.
 *
 * Usage:
 *   button(
 *     "Click",
 *     on("click", (e) => {
 *       // e is correctly typed (e.g. MouseEvent for "click")
 *     })
 *   )
 *
 * Design notes:
 * - Returns a NodeModFn so it can be used like any other modifier.
 * - Produces no child node (returns void in the modifier body).
 * - Provides strong typing of the event object based on the DOM event name.
 * - Stores listener references in a WeakMap to prevent memory leaks.
 * - Listeners are automatically cleaned up when elements are garbage collected.
 */

import { logError } from "./errorHandler";

/**
 * WeakMap to track event listeners per element.
 * Key: HTMLElement, Value: Map of event type to Set of listener info
 */
const elementListeners = new WeakMap<
  HTMLElement,
  Map<string, Set<{ original: Function; wrapped: EventListener; options?: boolean | AddEventListenerOptions; controller?: AbortController }>>
>();

/**
 * Store listener info for an element to enable cleanup.
 */
function trackListener(
  element: HTMLElement,
  type: string,
  original: Function,
  wrapped: EventListener,
  options?: boolean | AddEventListenerOptions,
  controller?: AbortController
): void {
  let typeMap = elementListeners.get(element);
  if (!typeMap) {
    typeMap = new Map();
    elementListeners.set(element, typeMap);
  }
  
  let listeners = typeMap.get(type);
  if (!listeners) {
    listeners = new Set();
    typeMap.set(type, listeners);
  }
  
  listeners.add({ original, wrapped, options, controller });
}

/**
 * Remove a specific listener from an element.
 * This is exported for manual cleanup if needed.
 */
export function removeListener(
  element: HTMLElement,
  type: string,
  listener: Function
): void {
  const typeMap = elementListeners.get(element);
  if (!typeMap) return;
  
  const listeners = typeMap.get(type);
  if (!listeners) return;
  
  for (const info of listeners) {
    if (info.original === listener) {
      // Abort the controller if it exists (preferred method)
      if (info.controller) {
        info.controller.abort();
      } else {
        // Fallback to removeEventListener
        element.removeEventListener(type, info.wrapped, info.options);
      }
      listeners.delete(info);
      break;
    }
  }
  
  // Cleanup empty maps
  if (listeners.size === 0) {
    typeMap.delete(type);
  }
  if (typeMap.size === 0) {
    elementListeners.delete(element);
  }
}

/**
 * Remove all listeners of a specific type from an element.
 */
export function removeAllListeners(
  element: HTMLElement,
  type?: string
): void {
  const typeMap = elementListeners.get(element);
  if (!typeMap) return;
  
  if (type) {
    // Remove all listeners of a specific type
    const listeners = typeMap.get(type);
    if (listeners) {
      for (const info of listeners) {
        // Abort the controller if it exists (preferred method)
        if (info.controller) {
          info.controller.abort();
        } else {
          // Fallback to removeEventListener
          element.removeEventListener(type, info.wrapped, info.options);
        }
      }
      typeMap.delete(type);
    }
  } else {
    // Remove all listeners of all types
    for (const [eventType, listeners] of typeMap) {
      for (const info of listeners) {
        // Abort the controller if it exists (preferred method)
        if (info.controller) {
          info.controller.abort();
        } else {
          // Fallback to removeEventListener
          element.removeEventListener(eventType, info.wrapped, info.options);
        }
      }
    }
    elementListeners.delete(element);
  }
}

/**
 * Overload for standard HTMLElement events (strongly typed via lib.dom.d.ts)
 */
export function on<
  K extends keyof HTMLElementEventMap,
  TTagName extends ElementTagName = ElementTagName
>(
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => unknown,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

/**
 * Fallback / custom event overload (arbitrary event names or custom event types).
 * Specify a custom event type with the E generic if needed:
 *   on<"my-event", CustomEvent<MyDetail>>("my-event", e => { ... })
 */
export function on<
  K extends string,
  E extends Event = Event,
  TTagName extends ElementTagName = ElementTagName
>(
  type: K,
  listener: (ev: E) => unknown,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

export function on<TTagName extends ElementTagName = ElementTagName>(
  type: string,
  listener: (ev: Event) => unknown,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName> {
  return function(parent: ExpandedElement<TTagName>): void {
    // Type guard: verify parent is an HTMLElement with addEventListener
    if (!parent || typeof (parent as HTMLElement).addEventListener !== "function") {
      return;
    }

    const el = parent as HTMLElement;
    
    // Create an AbortController for this listener
    const controller = new AbortController();
    
    const wrapped = function(ev: Event): void {
      try {
        listener.call(el, ev);
      } catch (error) {
        logError(`Error in '${type}' listener`, error);
      }
    };

    // Merge options with signal
    const listenerOptions = typeof options === 'boolean' 
      ? { capture: options, signal: controller.signal }
      : { ...(options || {}), signal: controller.signal };
    
    el.addEventListener(type, wrapped as EventListener, listenerOptions);
    
    // Track the listener for potential cleanup
    trackListener(el, type, listener, wrapped as EventListener, options, controller);
  };
}
