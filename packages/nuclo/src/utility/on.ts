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
 */

import { logError } from "./errorHandler";

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
  return (parent: ExpandedElement<TTagName>): void => {
    // Type guard: verify parent is an HTMLElement with addEventListener
    if (!parent || typeof (parent as HTMLElement).addEventListener !== "function") {
      return;
    }

    const el = parent as HTMLElement;
    const wrapped = (ev: Event): void => {
      try {
        listener.call(el, ev);
      } catch (error) {
        logError(`Error in '${type}' listener`, error);
      }
    };

    el.addEventListener(type, wrapped as EventListener, options);
  };
}

/**
 * (Optional) Helper to detect an on()-produced modifier (placeholder for future use).
 */
export function isOnModifier(fn: unknown): boolean {
  return typeof fn === "function" && Object.prototype.hasOwnProperty.call(fn, "__nucloOn");
}