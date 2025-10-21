/**
 * Render Utility for nuclo
 * 
 * This module provides the render() function for rendering nuclo elements
 * to the DOM. It's the main entry point for getting your nuclo components
 * into the browser.
 */

/**
 * Renders a nuclo element to a parent element in the DOM.
 * 
 * This function takes a NodeModFn (created by tag builders like div(), span(), etc.)
 * and renders it to the specified parent element. If no parent is provided,
 * it defaults to document.body.
 * 
 * @param nodeModFn - The nuclo element to render (created by tag builders)
 * @param parent - The parent element to render into (defaults to document.body)
 * @param index - The index to pass to the NodeModFn (defaults to 0)
 * @returns The rendered element
 * 
 * @example
 * ```ts
 * const app = div(
 *   h1('Hello World'),
 *   button('Click me', on('click', () => console.log('clicked')))
 * );
 * 
 * // Render to document.body
 * render(app);
 * 
 * // Render to a specific container
 * const container = document.getElementById('app');
 * render(app, container);
 * ```
 */
export function render<TTagName extends ElementTagName = ElementTagName>(
  nodeModFn: NodeModFn<TTagName>,
  parent?: Element,
  index: number = 0
): ExpandedElement<TTagName> {
  // Use provided parent or default to document.body
  const targetParent = (parent || document.body) as ExpandedElement<TTagName>;
  
  // Call the NodeModFn to create the element
  const element = nodeModFn(targetParent, index) as ExpandedElement<TTagName>;
  
  // Append the element to the parent
  (parent || document.body).appendChild(element as Node);
  
  return element;
}
