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
    nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
    parent?: Element,
    index?: number
  ): ExpandedElement<TTagName>;

  /**
   * Hydrates an existing server-rendered DOM tree by walking it in parallel with
   * the component tree, reusing existing nodes and re-registering their
   * state-dependent values for future `update()` calls.
   *
   * @param nodeModFn The NodeModFn to hydrate (same component used for SSR)
   * @param parent The parent element containing the SSR HTML (defaults to document.body)
   * @returns The hydrated root element
   *
   * @example
   * ```ts
   * // Server: const html = renderToString(div(h1("Hello")));
   * // Client:
   * const app = document.getElementById("app")!;
   * hydrate(div(h1("Hello")), app);
   * ```
   */
  function hydrate<TTagName extends ElementTagName = ElementTagName>(
    nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
    parent?: Element,
  ): ExpandedElement<TTagName>;

  /**
   * Re-evaluates every component-rendered root against its live DOM —
   * including static values that update() never touches — reusing existing
   * elements in place (focus, input values and scroll survive).
   *
   * Roots become refreshable by rendering the component function itself:
   *
   * @example
   * ```ts
   * const App = () => div(h1(labels[language].title));
   * render(App, container);  // the function, not App()
   * // later, after `language` changed:
   * forceUpdate();
   * ```
   *
   * The explicit form forceUpdate(App(), parent) force-rehydrates one tree
   * manually and returns its root element.
   */
  function forceUpdate(): void;
  function forceUpdate<TTagName extends ElementTagName = ElementTagName>(
    nodeModFn: NodeModFn<TTagName> | (() => NodeModFn<TTagName>),
    parent?: Element,
  ): ExpandedElement<TTagName>;
}

export {};
