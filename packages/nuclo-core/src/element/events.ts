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

import { logError } from "../shared/errors";
import { isBrowser } from "../shared/environment";

type EventListenerOptions = boolean | AddEventListenerOptions;

interface TrackedListener {
  type: string;
  wrapped: EventListener;
  options?: EventListenerOptions;
}

/**
 * Tracks attached listeners per element so removeAllListeners() can detach them.
 *
 * A flat array per element (rather than a Map<type, Set>) keeps the common
 * case — one or two listeners on a node, as in a list row — down to a single
 * allocation. The WeakMap keying means a collected element drops its listener
 * array automatically, and the listeners themselves are released with the
 * element by the DOM, so no per-listener AbortController is needed: detach is a
 * plain removeEventListener with the tracked wrapper + options.
 */
const elementListeners = new WeakMap<HTMLElement, TrackedListener[]>();

/**
 * Store listener info for an element to enable cleanup.
 */
function trackListener(
  element: HTMLElement,
  info: TrackedListener
): void {
  const list = elementListeners.get(element);
  if (list) {
    list.push(info);
  } else {
    elementListeners.set(element, [info]);
  }
}

/**
 * Detach a single tracked listener from the DOM.
 */
function detachListener(element: HTMLElement, info: TrackedListener): void {
  element.removeEventListener(info.type, info.wrapped, info.options);
}

/**
 * Remove all listeners of a specific type from an element.
 */
export function removeAllListeners(
  element: HTMLElement,
  type?: string
): void {
  const list = elementListeners.get(element);
  if (!list) return;

  if (type === undefined) {
    for (let i = 0; i < list.length; i++) detachListener(element, list[i]);
    elementListeners.delete(element);
    return;
  }

  // Detach matching listeners, compacting survivors back into the same array.
  let write = 0;
  for (let i = 0; i < list.length; i++) {
    const info = list[i];
    if (info.type === type) {
      detachListener(element, info);
    } else {
      list[write++] = info;
    }
  }
  list.length = write;
  if (write === 0) elementListeners.delete(element);
}

/**
 * Overload for standard HTMLElement events (strongly typed via lib.dom.d.ts)
 */
export function on<
  K extends keyof HTMLElementEventMap,
  TTagName extends ElementTagName = ElementTagName
>(
  type: K,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], HTMLElementEventMap[K]>,
  options?: EventListenerOptions
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
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], E>,
  options?: EventListenerOptions
): NodeModFn<TTagName>;

export function on<TTagName extends ElementTagName = ElementTagName>(
  type: string,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], Event>,
  options?: EventListenerOptions
): NodeModFn<TTagName> {
  return function(parent: ExpandedElement<TTagName>): void {
    if (!isBrowser) return;

    // Type guard: verify parent is an HTMLElement with addEventListener
    if (!parent || typeof (parent as HTMLElement).addEventListener !== "function") {
      return;
    }

    const el = parent as HTMLElementTagNameMap[TTagName];

    const wrapped = function(ev: Event): void {
      try {
        listener.call(
          el,
          ev as Event & { currentTarget: HTMLElementTagNameMap[TTagName] }
        );
      } catch (error) {
        logError(`Error in '${type}' listener`, error);
      }
    };

    el.addEventListener(type, wrapped as EventListener, options);

    // Track the listener so removeAllListeners() can detach it later.
    trackListener(el, { type, wrapped: wrapped as EventListener, options });
  };
}
