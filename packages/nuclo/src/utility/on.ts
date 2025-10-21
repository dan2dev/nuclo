/**
 * Event Handler for nuclo
 * 
 * This module provides the on() function for attaching event listeners to elements
 * with full TypeScript support for event types.
 */

/**
 * Creates an event listener modifier for HTML elements.
 * 
 * This function provides strongly-typed event handling for DOM elements.
 * It returns a modifier that can be used with any tag builder.
 * 
 * @param type - The event type (e.g., 'click', 'input', 'change')
 * @param listener - The event listener function
 * @param options - Optional event listener options
 * @returns A modifier function that attaches the event listener
 * 
 * @example
 * ```ts
 * button('Click me',
 *   on('click', (e) => {
 *     console.log('Button clicked!', e.target);
 *   })
 * )
 * 
 * input(
 *   on('input', (e) => {
 *     console.log('Input value:', e.target.value);
 *   })
 * )
 * ```
 */

/**
 * Overload for standard HTMLElement events with full type safety.
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
 * Overload for custom events or arbitrary event names.
 * 
 * @example
 * ```ts
 * on<"my-event", CustomEvent<MyDetail>>("my-event", e => {
 *   console.log(e.detail);
 * })
 * ```
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
    const element = parent as unknown as HTMLElement | null | undefined;
    
    // Validate that the element supports addEventListener
    if (!element || typeof element.addEventListener !== "function") {
      return;
    }

    // Wrap the listener with error handling
    const wrappedListener = (ev: Event) => {
      try {
        listener.call(element, ev);
      } catch (error) {
        // Log errors to console if available
        if (typeof console !== "undefined" && console.error) {
          console.error(`[nuclo:on] Error in '${type}' listener:`, error);
        }
      }
    };

    // Attach the event listener
    element.addEventListener(type, wrappedListener as EventListener, options);
  };
}

/**
 * Checks if a function is an on() modifier.
 * 
 * This is a utility function for detecting event listener modifiers.
 * Currently used internally but may be useful for debugging.
 * 
 * @param fn - The function to check
 * @returns True if the function is an on() modifier
 */
export function isOnModifier(fn: unknown): boolean {
  return typeof fn === "function" && Object.prototype.hasOwnProperty.call(fn, "__nucloOn");
}