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
 * Overloads (order matters — TS resolves the first structural match, and the
 * "mount"/"destroy" and custom-event overloads all accept `string`, so the
 * more specific ones must come first):
 * 1. DOM standard events (strongly typed via the tag's native event map)
 * 2. "mount" / "destroy" lifecycle pseudo-events (not real DOM events)
 * 3. Custom / arbitrary event names with user-specified event type
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
   * Fires once, after the element has been created and connected to the live
   * document. Equivalent to `{ onMount: ... }`. May return a cleanup function
   * — equivalent to also registering it with `on("destroy", ...)`.
   *
   * See src/element/lifecycle.ts for exactly when "connected" is guaranteed.
   */
  function on<TTagName extends ElementTagName = ElementTagName>(
    type: "mount",
    listener: MountCallback<HTMLElementTagNameMap[TTagName]>,
  ): NodeModFn<TTagName>;

  /**
   * Fires once the element has been removed. Equivalent to `{ onDestroy: ... }`.
   *
   * See src/element/lifecycle.ts for exactly when this is guaranteed to run.
   */
  function on<TTagName extends ElementTagName = ElementTagName>(
    type: "destroy",
    listener: DestroyCallback<HTMLElementTagNameMap[TTagName]>,
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
