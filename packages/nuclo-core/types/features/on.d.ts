/**
 * Typed event listener helper types for the `on()` modifier function.
 *
 * Usage example:
 *   button(
 *     "Click me",
 *     on("click", (e) => {
 *       // e and currentTarget come from the native event map
 *       // example: console.log(e.clientX);
 *     })
 *   );
 *
 * Overloads:
 * 1. DOM standard events (strongly typed via the tag's native event map)
 * 2. Custom / arbitrary event names with user-specified event type
 */

declare global {
  /**
   * Add a strongly typed DOM event listener as a View Craft modifier.
   *
   * The returned modifier attaches the listener when the element is created.
   *
   * @param type Standard DOM event name (e.g. "click", "input", "change").
   * @param listener Event listener with fully typed event object.
   * @param options Native addEventListener options.
   */
  function on<
    K extends NucloHTMLElementEventName,
    TTagName extends NucloHTMLElementTagNameForEvent<K> = NucloHTMLElementTagNameForEvent<K>,
  >(
    type: K,
    listener: TypedEventListener<
      HTMLElementTagNameMap[TTagName],
      NucloHTMLElementEventForName<K>
    >,
    options?: boolean | AddEventListenerOptions
  ): NodeModFn<TTagName>;

  /**
   * Add a custom / arbitrary event listener (e.g. "my-event").
   *
   * Provide a custom Event subtype via the generic parameter E when needed:
   *   on<"my-event", CustomEvent<MyDetail>>("my-event", (e) => { ... })
   */
  function on<
    K extends string,
    E extends Event = Event,
    TTagName extends ElementTagName = ElementTagName
  >(
    type: K,
    listener: TypedEventListener<HTMLElementTagNameMap[TTagName], E>,
    options?: boolean | AddEventListenerOptions
  ): NodeModFn<TTagName>;
}

export {};
