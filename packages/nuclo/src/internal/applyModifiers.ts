/**
 * Apply Modifiers Utility for nuclo
 * 
 * This module provides utilities for applying arrays of modifiers to DOM elements.
 * It consolidates the logic for processing modifiers across different parts of
 * the nuclo system.
 */

import { applyNodeModifier } from "../core/modifierProcessor";

/**
 * A modifier that can be applied to a DOM element.
 * Can be a static value, a function that returns a value, or a function that modifies the element.
 */
export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

/**
 * Result of applying modifiers to an element.
 */
export interface ApplyModifiersResult<TTagName extends ElementTagName> {
  /**
   * The element that modifiers were applied to.
   */
  element: ExpandedElement<TTagName>;
  /**
   * The next index after processing (startIndex + rendered children count).
   */
  nextIndex: number;
  /**
   * Number of child nodes appended (not counting attributes-only modifiers).
   */
  appended: number;
}

/**
 * Applies an array of modifiers to an element.
 * 
 * This function processes each modifier in sequence and appends any resulting
 * DOM nodes to the element. It avoids duplicate DOM insertions by checking
 * if nodes are already in the correct parent.
 * 
 * A "modifier" can be:
 * - Primitives (strings, numbers) → appended as text nodes
 * - DOM Nodes → appended directly
 * - Attribute objects → applied to element
 * - Functions → called and result processed
 * - Zero-arg functions → create reactive text content
 * 
 * @param element - The element to apply modifiers to
 * @param modifiers - Array of modifiers to apply
 * @param startIndex - Starting index for modifier processing
 * @returns Result with element, next index, and appended count
 */
export function applyModifiers<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>,
  startIndex = 0
): ApplyModifiersResult<TTagName> {
  // Handle empty modifiers array
  if (!modifiers || modifiers.length === 0) {
    return { element, nextIndex: startIndex, appended: 0 };
  }

  let currentIndex = startIndex;
  let appendedCount = 0;
  const parentNode = element as unknown as Node & ParentNode;

  // Process each modifier in sequence
  for (let i = 0; i < modifiers.length; i += 1) {
    const modifier = modifiers[i];
    
    // Skip null/undefined modifiers
    if (modifier == null) continue;

    // Apply the modifier and get the resulting node
    const producedNode = applyNodeModifier(element, modifier, currentIndex);
    if (!producedNode) continue;

    // Only append if the node isn't already in the correct parent
    if (producedNode.parentNode !== parentNode) {
      parentNode.appendChild(producedNode);
    }
    
    currentIndex += 1;
    appendedCount += 1;
  }

  return {
    element,
    nextIndex: currentIndex,
    appended: appendedCount
  };
}

/**
 * Convenience helper that applies modifiers and returns the element.
 * 
 * This is a fluent-style helper that discards the meta information
 * returned by applyModifiers.
 * 
 * @param element - The element to apply modifiers to
 * @param modifiers - Array of modifiers to apply
 * @param startIndex - Starting index for modifier processing
 * @returns The element with modifiers applied
 */
export function applyModifiersAndReturn<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>,
  startIndex = 0
): ExpandedElement<TTagName> {
  applyModifiers(element, modifiers, startIndex);
  return element;
}