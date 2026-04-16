import { startHydration, endHydration } from "../hydration/context";

/**
 * Renders a NodeModFn to a parent element by calling it and appending the result.
 *
 * @param nodeModFn The NodeModFn to render (created by tag builders like div(), h1(), etc.)
 * @param parent The parent element to render into (defaults to document.body)
 * @param index The index to pass to the NodeModFn (defaults to 0)
 * @returns The rendered element
 */
export function render<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
  index: number = 0,
): ExpandedElement<TTagName> {
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  const element = nodeModFn(targetParent, index) as ExpandedElement<TTagName>;
  (parent || document.body).appendChild(element as Node);
  return element;
}

/**
 * Hydrates an existing server-rendered DOM tree by walking it in parallel with
 * the component tree, reusing existing nodes and re-attaching reactivity.
 *
 * Instead of clearing the container and creating new DOM nodes (like render()),
 * hydrate() claims existing nodes from the SSR output and registers reactive
 * text nodes, attributes, event listeners, list runtimes, and when runtimes
 * on them.
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
 * // app.innerHTML already contains the SSR HTML
 * hydrate(div(h1("Hello")), app);
 * ```
 */
export function hydrate<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
): ExpandedElement<TTagName> {
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  startHydration();
  try {
    const element = nodeModFn(targetParent, 0) as ExpandedElement<TTagName>;
    return element;
  } finally {
    endHydration();
  }
}
