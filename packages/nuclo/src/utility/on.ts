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
  listener: (ev: HTMLElementEventMap[K]) => any,
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
  listener: (ev: E) => any,
  options?: boolean | AddEventListenerOptions
): NodeModFn<TTagName>;

export function on(
  type: string,
  listener: (ev: Event) => any,
  options?: boolean | AddEventListenerOptions
): NodeModFn<any> {
  return (parent: ExpandedElement<any>) => {
    const el = parent as unknown as HTMLElement | null | undefined;
    if (!el || typeof el.addEventListener !== "function") {
      return;
    }

    const wrapped = (ev: Event) => {
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