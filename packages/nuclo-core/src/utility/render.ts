import { startHydration, endHydration } from "../hydration/context";

/**
 * Invokes a `NodeModFn` in a host-rendering context where the return is
 * known to be an `ExpandedElement`. Tag builders (`div()`, `h1()`, …) return
 * a `DetachedExpandedElementFactory<TTagName>`, which guarantees that shape,
 * but TS collapses `ExpandedElement<TTagName>` to `never` for unconstrained
 * `TTagName` unions — so the two `as unknown as` bridges below are the
 * single, scoped hop between the wider declared type and the narrower
 * runtime contract.
 */
function resolveFactory<TTagName extends ElementTagName>(
  factory: NodeModFn<TTagName>,
  parent: ExpandedElement<TTagName>,
  index: number,
): ExpandedElement<TTagName> {
  return factory(parent, index) as unknown as ExpandedElement<TTagName>;
}

/** Coerces `parent` (or `document.body` fallback) to the host-element shape. */
function resolveTargetParent<TTagName extends ElementTagName>(
  parent: Element | undefined,
): ExpandedElement<TTagName> {
  return (parent ?? document.body) as unknown as ExpandedElement<TTagName>;
}

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
  const targetParent = resolveTargetParent<TTagName>(parent);
  const element = resolveFactory(nodeModFn, targetParent, index);
  (parent ?? document.body).appendChild(element);
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
  const targetParent = resolveTargetParent<TTagName>(parent);
  startHydration();
  try {
    return resolveFactory(nodeModFn, targetParent, 0);
  } finally {
    endHydration();
  }
}
