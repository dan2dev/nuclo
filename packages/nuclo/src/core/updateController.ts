/**
 * Update Controller for nuclo
 * 
 * This module orchestrates all reactive updates in nuclo. When update() is called,
 * it triggers updates across all reactive systems: lists, conditional rendering,
 * reactive text, and reactive attributes.
 */

import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements, notifyReactiveTextNodes } from "./reactive";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditionalUpdater";
import { dispatchGlobalUpdateEvent } from "../utility/events";

/**
 * Array of all update functions that need to be called when update() is invoked.
 * 
 * The order matters for some updates:
 * 1. Lists - Update list runtimes first
 * 2. Conditional rendering - Update when() conditions
 * 3. Conditional elements - Update individual conditional elements
 * 4. Reactive elements - Update reactive attributes
 * 5. Reactive text - Update reactive text content
 * 6. Global events - Dispatch update events
 */
const updateFunctions = [
  updateListRuntimes,        // Update list() runtimes
  updateWhenRuntimes,        // Update when() conditional rendering
  updateConditionalElements, // Update individual conditional elements
  notifyReactiveElements,     // Update reactive attributes
  notifyReactiveTextNodes,   // Update reactive text content
  dispatchGlobalUpdateEvent, // Dispatch global update events
] as const;

/**
 * Triggers a complete reactive update across all nuclo systems.
 * 
 * This is the core function that powers nuclo's reactivity. When you call update(),
 * it updates all reactive elements, lists, conditional rendering, and text content
 * in the correct order.
 * 
 * @example
 * ```ts
 * let count = 0;
 * const counter = div(() => `Count: ${count}`);
 * 
 * // Change state
 * count = 5;
 * 
 * // Trigger update - this will update the counter display
 * update();
 * ```
 */
export function update(): void {
  // Execute all update functions in sequence
  for (const updateFunction of updateFunctions) {
    updateFunction();
  }
}
