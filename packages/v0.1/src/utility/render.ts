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
  index: number = 0
): ExpandedElement<TTagName> {
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  const element = nodeModFn(targetParent, index) as ExpandedElement<TTagName>;
  (parent || document.body).appendChild(element as Node);
  return element;
}
