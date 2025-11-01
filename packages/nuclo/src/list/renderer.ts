import { createListRuntime } from "./runtime";
import type { ListRenderer, ListItemsProvider } from "./types";

/**
 * Maps items to DOM elements, keeping them in sync with changes.
 */
export function list<TItem, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  render: ListRenderer<TItem, TTagName>,
): NodeModFn<TTagName> {
  return (host: ExpandedElement<TTagName>) => {
    const runtime = createListRuntime(itemsProvider, render, host);
    return runtime.startMarker;
  };
}
