/**
 * List Renderer for nuclo
 * 
 * This module provides the list() function for rendering arrays of items
 * with automatic synchronization when the array changes.
 */

import { createListRuntime } from "./runtime";
import type { ListRenderer, ListItemsProvider } from "./types";

/**
 * Creates a reactive list that automatically syncs with array changes.
 * 
 * The list() function creates a reactive list that renders each item using
 * the provided render function. When the array changes (items added, removed,
 * or reordered), the DOM is automatically updated to reflect the changes.
 * 
 * @param itemsProvider - Function that returns the array of items to render
 * @param render - Function that renders each item into a DOM element
 * @returns A modifier function that creates the list when applied
 * 
 * @example
 * ```ts
 * const items = ['apple', 'banana', 'cherry'];
 * 
 * const listElement = list(
 *   () => items,  // Provider function
 *   (item, index) => div(`${index}: ${item}`)  // Render function
 * );
 * 
 * // Later, when items change:
 * items.push('date');
 * update(); // DOM automatically updates
 * ```
 */
export function list<TItem>(
  itemsProvider: ListItemsProvider<TItem>,
  render: ListRenderer<TItem>,
): NodeModFn<any> {
  return (host: ExpandedElement<any>) => {
    // Create a runtime to manage the list's lifecycle
    const runtime = createListRuntime(itemsProvider, render, host);
    
    // Return the start marker so the list can be tracked in the DOM
    return runtime.startMarker;
  };
}
