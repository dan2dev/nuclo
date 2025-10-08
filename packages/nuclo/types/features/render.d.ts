declare global {
  /**
   * Renders a NodeModFn to a parent element by calling it and appending the result.
   *
   * @param nodeModFn The NodeModFn to render (created by tag builders like div(), h1(), etc.)
   * @param parent The parent element to render into (defaults to document.body)
   * @param index The index to pass to the NodeModFn (defaults to 0)
   * @returns The rendered element
   *
   * @example
   * ```ts
   * const app = div(
   *   h1('Hello World'),
   *   button('Click me')
   * );
   *
   * render(app); // Renders to document.body
   * render(app, container); // Renders to specific container
   * ```
   */
  function render<TTagName extends ElementTagName = ElementTagName>(
    nodeModFn: NodeModFn<TTagName>,
    parent?: Element,
    index?: number
  ): ExpandedElement<TTagName>;
}

export {};
