import { createListRuntime } from "./runtime";
import type { ListRenderer, ListItemsProvider } from "./types";

/**
 * Maps items to DOM elements, keeping them in sync with changes.
 */
export function list<TItem>(
  itemsProvider: ListItemsProvider<TItem>,
  render: ListRenderer<TItem>,
): NodeModFn<any> {
  return (host: ExpandedElement<any>) => {
    const runtime = createListRuntime(itemsProvider, render, host);
    return runtime.startMarker;
  };
}
