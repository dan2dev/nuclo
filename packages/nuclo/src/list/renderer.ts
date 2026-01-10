import { createListRuntime } from "./runtime";
import type { ListRenderer, ListItemsProvider } from "./types";

/**
 * Maps items to DOM elements, keeping them in sync with changes.
 * Returns a function compatible with both HTML and SVG contexts.
 */
export function list<TItem, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  render: ListRenderer<TItem, TTagName>,
): (parent: ExpandedElement<TTagName>, index: number) => Comment {
  return function(host: ExpandedElement<TTagName>): Comment {
    const runtime = createListRuntime(itemsProvider, render, host);
    // Return the start marker comment node
    // Comment is a Node, making this compatible with both HTML and SVG modifiers
    return runtime.startMarker;
  };
}
