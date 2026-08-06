/**
 * Typed event listener helper.
 *
 * Usage:
 *   button(
 *     "Click",
 *     on("click", (e) => {
 *       // e and currentTarget are inferred from the native event map
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
  capture: boolean;
}

type TrackedListeners = TrackedListener | TrackedListener[];

/**
 * Tracks attached listeners per element so removeAllListeners() can detach them.
 *
 * The common single-listener case stores its registration directly. An array
 * is allocated only when an element has multiple distinct listeners. A
 * registration belongs to the reusable modifier rather than an attachment, so
 * applying one modifier to many elements adds no per-element metadata objects.
 * Only the capture flag is retained because it is the sole option compared by
 * removeEventListener.
 */
const elementListeners = new WeakMap<HTMLElement, TrackedListeners>();

/**
 * Store listener info for an element to enable cleanup.
 */
function trackListener(
  element: HTMLElement,
  info: TrackedListener,
): void {
  const tracked = elementListeners.get(element);
  if (!tracked) {
    elementListeners.set(element, info);
  } else if (Array.isArray(tracked)) {
    if (!tracked.includes(info)) tracked.push(info);
  } else if (tracked !== info) {
    elementListeners.set(element, [tracked, info]);
  }
}

/**
 * Detach a single tracked listener from the DOM.
 */
function detachListener(
  element: HTMLElement,
  info: TrackedListener,
): void {
  element.removeEventListener(info.type, info.wrapped, info.capture);
}

/**
 * Remove all listeners of a specific type from an element.
 */
export function removeAllListeners(
  element: HTMLElement,
  type?: string
): void {
  const tracked = elementListeners.get(element);
  if (!tracked) return;

  if (type === undefined) {
    if (Array.isArray(tracked)) {
      for (let i = 0; i < tracked.length; i++) {
        detachListener(element, tracked[i]);
      }
    } else {
      detachListener(element, tracked);
    }
    elementListeners.delete(element);
    return;
  }

  if (!Array.isArray(tracked)) {
    if (tracked.type === type) {
      detachListener(element, tracked);
      elementListeners.delete(element);
    }
    return;
  }

  // Detach matching listeners, compacting survivors back into the same array.
  let write = 0;
  for (let read = 0; read < tracked.length; read++) {
    const info = tracked[read];
    if (info.type === type) {
      detachListener(element, info);
    } else {
      tracked[write++] = info;
    }
  }
  if (write === 0) {
    elementListeners.delete(element);
  } else if (write === 1) {
    elementListeners.set(element, tracked[0]);
  } else {
    tracked.length = write;
  }
}

function noopEventModifier(_parent: ExpandedElement<ElementTagName>): void {}

function createTrackedListener<TTagName extends ElementTagName>(
  type: string,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], Event>,
  capture: boolean,
): TrackedListener {
  const wrapped = function(this: EventTarget, event: Event): void {
    const currentTarget = this as HTMLElementTagNameMap[TTagName];
    try {
      listener.call(
        currentTarget,
        event as Event & { currentTarget: HTMLElementTagNameMap[TTagName] },
      );
    } catch (error) {
      logError(`Error in '${type}' listener`, error);
    }
  };

  return { type, wrapped, capture };
}

/**
 * Overload for standard HTMLElement events (strongly typed via lib.dom.d.ts)
 */
export function on<
  K extends NucloHTMLElementEventName,
  TTagName extends NucloHTMLElementTagNameForEvent<K> = NucloHTMLElementTagNameForEvent<K>,
>(
  type: K,
  listener: TypedEventListener<
    HTMLElementTagNameMap[TTagName],
    NucloHTMLElementEventForName<K>
  >,
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
  if (!isBrowser) return noopEventModifier as NodeModFn<TTagName>;

  const capture = options === true
    || (options !== null && typeof options === "object" && options.capture === true);
  const info = createTrackedListener(type, listener, capture);

  return function(parent: ExpandedElement<TTagName>): void {
    // Type guard: verify parent is an HTMLElement with addEventListener
    if (!parent || typeof (parent as HTMLElement).addEventListener !== "function") {
      return;
    }

    const el = parent as HTMLElementTagNameMap[TTagName];

    el.addEventListener(type, info.wrapped, options);

    // Track the listener so removeAllListeners() can detach it later.
    trackListener(el, info);
  };
}
