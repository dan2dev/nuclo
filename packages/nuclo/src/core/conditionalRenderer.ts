/**
 * Conditional Renderer for nuclo
 * 
 * This module handles conditional rendering of elements based on boolean conditions.
 * It creates either the actual element or a placeholder comment based on the condition.
 */

import { findConditionalModifier } from "./modifierProcessor";
import { isBrowser } from "../utility/environment";
import { storeConditionalInfo } from "../utility/conditionalInfo";
import type { ConditionalInfo } from "../utility/conditionalInfo";
import { applyModifiers } from "../internal/applyModifiers";

/**
 * Creates a conditional element that renders based on a boolean condition.
 * 
 * If the condition is true, creates the actual element with all modifiers applied.
 * If the condition is false, creates a placeholder comment node.
 * 
 * @param tagName - The HTML tag name for the element
 * @param condition - Function that returns the boolean condition
 * @param modifiers - Array of modifiers to apply to the element
 * @returns Either the element or a placeholder comment
 */
export function createConditionalElement<TTagName extends ElementTagName>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): ExpandedElement<TTagName> | Comment {
  const conditionPassed = condition();
  const conditionalInfo: ConditionalInfo = { condition, tagName, modifiers };

  if (conditionPassed) {
    // Create the actual element and apply all modifiers
    const element = document.createElement(tagName) as ExpandedElement<TTagName>;
    applyModifiers(element, modifiers, 0);
    
    // Store conditional info for updates (browser only)
    if (isBrowser) {
      storeConditionalInfo(element as Node, conditionalInfo);
    }
    
    return element;
  }

  // Create a placeholder comment for when condition is false
  const placeholderComment = document.createComment(
    `conditional-${tagName}-${isBrowser ? 'hidden' : 'ssr'}`
  );
  
  // Store conditional info for updates (browser only)
  if (isBrowser) {
    storeConditionalInfo(placeholderComment, conditionalInfo);
  }
  
  return placeholderComment as unknown as ExpandedElement<TTagName>;
}

/**
 * Processes modifiers to separate conditional modifiers from other modifiers.
 * 
 * This function looks for conditional modifiers (functions that return booleans)
 * and separates them from the rest of the modifiers.
 * 
 * @param modifiers - Array of modifiers to process
 * @returns Object with condition function and other modifiers
 */
export function processConditionalModifiers<TTagName extends ElementTagName>(
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): {
  condition: (() => boolean) | null;
  otherModifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>;
} {
  const conditionalIndex = findConditionalModifier(modifiers);

  // No conditional modifier found
  if (conditionalIndex === -1) {
    return { condition: null, otherModifiers: modifiers };
  }

  // Extract the condition and filter out the conditional modifier
  return {
    condition: modifiers[conditionalIndex] as () => boolean,
    otherModifiers: modifiers.filter((_, index) => index !== conditionalIndex)
  };
}
