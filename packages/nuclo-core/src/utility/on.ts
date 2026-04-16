/**
 * Typed event listener helper.
 *
 * Usage:
 *   button(
 *     "Click",
 *     on("click", (e) => {
 *       // `e` is typed as MouseEvent + { currentTarget: HTMLButtonElement, target: HTMLButtonElement | null }
 *     })
 *   )
 *
 * Design notes:
 * - Returns a `NodeModFn` so it plugs in like any other modifier.
 * - No child node is produced (the modifier body returns void).
 * - Event type is inferred from the event name via `HTMLElementEventMap`.
 * - Listener references are stored in a `WeakMap` to avoid leaks;
 *   they're automatically cleaned up when elements are GC'd.
 */

import { logError } from "./errorHandler";
import { isBrowser } from "./environment";

type EventListenerOptions = boolean | AddEventListenerOptions;

/**
 * Type-erased shape used inside the tracked-listener map. Every concrete
 * `TypedEventListener<E, TEv>` is structurally compatible with this shape
 * (contravariant-in-argument / returns `unknown`), so erasure is safe.
 */
type TrackedEventListener = TypedEventListener<HTMLElement, Event>;

/**
 * Internal record for one tracked listener. `original` is the user-supplied
 * function (used for identity-based removal); `wrapped` is the error-trapping
 * closure actually attached to the DOM.
 */
interface TrackedListener {
  readonly original: TrackedEventListener;
  readonly wrapped: EventListener;
  readonly options?: EventListenerOptions;
  readonly controller?: AbortController;
}

/**
 * Per-element listener registry. Outer key is the element; inner key is the
 * DOM event name; value is the set of tracked listener records for that pair.
 */
const elementListeners = new WeakMap<
  HTMLElement,
  Map<string, Set<TrackedListener>>
>();

/**
 * Stores a tracked-listener record on the element for later cleanup.
 */
function trackListener(
  element: HTMLElement,
  type: string,
  record: TrackedListener,
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

  listeners.add(record);
}

/**
 * Detach a single tracked listener from the DOM.
 */
function detachListener(
  element: HTMLElement,
  type: string,
  info: TrackedListener,
): void {
  if (info.controller) {
    info.controller.abort();
  } else {
    element.removeEventListener(type, info.wrapped, info.options);
  }
}

/**
 * Remove a specific listener from an element. Exported for manual cleanup.
 *
 * @template TElement Target element subtype (defaults to `HTMLElement`).
 * @template TEvent Event subtype the listener expects (defaults to `Event`).
 */
export function removeListener<
  TElement extends HTMLElement = HTMLElement,
  TEvent extends Event = Event,
>(
  element: TElement,
  type: string,
  listener: TypedEventListener<TElement, TEvent>,
): void {
  const typeMap = elementListeners.get(element);
  if (!typeMap) return;

  const listeners = typeMap.get(type);
  if (!listeners) return;

  // Identity compare via shared erased shape — the generic parameters are
  // purely for caller ergonomics; runtime identity is unaffected.
  const erased = listener as unknown as TrackedEventListener;
  for (const info of listeners) {
    if (info.original === erased) {
      detachListener(element, type, info);
      listeners.delete(info);
      break;
    }
  }

  if (listeners.size === 0) typeMap.delete(type);
  if (typeMap.size === 0) elementListeners.delete(element);
}

/**
 * Remove all listeners of a specific type from an element.
 */
export function removeAllListeners(element: HTMLElement, type?: string): void {
  const typeMap = elementListeners.get(element);
  if (!typeMap) return;

  if (type) {
    const listeners = typeMap.get(type);
    if (listeners) {
      for (const info of listeners) detachListener(element, type, info);
      typeMap.delete(type);
    }
  } else {
    for (const [eventType, listeners] of typeMap) {
      for (const info of listeners) detachListener(element, eventType, info);
    }
    elementListeners.delete(element);
  }
}

/**
 * Creates the wrapped DOM listener once, centralizing the single required
 * cast from `Event` to the enriched event type carried by `TypedEventListener`.
 *
 * Call-site invariants guarantee `ev.currentTarget === element`, so the
 * narrowing of `currentTarget` / `target` to `TElement` is safe.
 *
 * @template TElement DOM element subtype bound to the listener.
 * @template TEvent Event subtype the listener expects.
 */
function wrapListener<TElement extends HTMLElement, TEvent extends Event>(
  element: TElement,
  type: string,
  listener: TypedEventListener<TElement, TEvent>,
): EventListener {
  return function (ev: Event): void {
    try {
      listener.call(
        element,
        ev as TEvent & {
          currentTarget: TElement;
          target: TElement | null;
        },
      );
    } catch (error) {
      logError(`Error in '${type}' listener`, error);
    }
  };
}

/**
 * Add a strongly typed DOM event listener as a Nuclo modifier.
 *
 * The returned modifier attaches the listener when the element is created.
 * Event type is inferred via template-literal lookup against
 * `HTMLElementEventMap` — passing `"click"` yields `MouseEvent`, `"input"`
 * yields `InputEvent`, etc.
 *
 * @template K DOM event name — restricted to `keyof HTMLElementEventMap`.
 * @template TTagName Host element tag — defaults to `ElementTagName`.
 */
export function on<
  K extends keyof HTMLElementEventMap,
  TTagName extends ElementTagName = ElementTagName,
>(
  type: K,
  listener: TypedEventListener<
    HTMLElementTagNameMap[TTagName],
    HTMLElementEventMap[K]
  >,
  options?: EventListenerOptions,
): NodeModFn<TTagName>;

/**
 * Fallback overload for custom / arbitrary event names.
 * Specify a custom event subtype via `E` when needed:
 *   on<"my-event", CustomEvent<MyDetail>>("my-event", e => { ... })
 *
 * @template K Custom event name — any string.
 * @template E Event subtype.
 * @template TTagName Host element tag.
 */
export function on<
  K extends string,
  E extends Event = Event,
  TTagName extends ElementTagName = ElementTagName,
>(
  type: K,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], E>,
  options?: EventListenerOptions,
): NodeModFn<TTagName>;

export function on<TTagName extends ElementTagName = ElementTagName>(
  type: string,
  listener: TypedEventListener<HTMLElementTagNameMap[TTagName], Event>,
  options?: EventListenerOptions,
): NodeModFn<TTagName> {
  return function (parent: ExpandedElement<TTagName>): void {
    if (!isBrowser) return;

    // Runtime narrow: in polyfill / SSR environments `parent` may not be a
    // real HTMLElement — bail out cleanly rather than crashing.
    if (!(parent instanceof HTMLElement)) return;

    const el = parent as HTMLElementTagNameMap[TTagName];

    const controller = new AbortController();
    const wrapped = wrapListener(el, type, listener);

    const listenerOptions: AddEventListenerOptions =
      typeof options === "boolean"
        ? { capture: options, signal: controller.signal }
        : { ...(options ?? {}), signal: controller.signal };

    el.addEventListener(type, wrapped, listenerOptions);

    trackListener(el, type, {
      original: listener as unknown as TrackedEventListener,
      wrapped,
      options,
      controller,
    });
  };
}
