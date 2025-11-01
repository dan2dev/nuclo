/**
 * Element Factory for nuclo
 * 
 * This module provides the core functionality for creating DOM elements with
 * nuclo's reactive system. It handles both regular elements and conditional
 * elements (when conditions are present).
 */

import { createConditionalElement, processConditionalModifiers } from "./conditionalRenderer";
import { applyModifiers } from "../internal/applyModifiers";
import type { NodeModifier } from "../internal/applyModifiers";

/**
 * Creates an element factory function for a specific HTML tag.
 * 
 * This is the core function that powers all tag builders like div(), span(), etc.
 * It handles both regular elements and conditional elements (when conditions are present).
 * 
 * @param tagName - The HTML tag name (e.g., 'div', 'span', 'button')
 * @param modifiers - Array of modifiers (content, attributes, event handlers, etc.)
 * @returns A function that creates the element when called
 */
export function createElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): NodeModFn<TTagName> {
  return (parent: ExpandedElement<TTagName>, index: number): ExpandedElement<TTagName> => {
    // Check if this element has conditional rendering
    const { condition, otherModifiers } = processConditionalModifiers(modifiers);

    // If there's a condition, create a conditional element
    if (condition) {
      return createConditionalElement(tagName, condition, otherModifiers) as ExpandedElement<TTagName>;
    }

    // Create a regular element
    const element = document.createElement(tagName) as ExpandedElement<TTagName>;
    
    // Apply all modifiers (content, attributes, event handlers, etc.)
    applyModifiers(element, otherModifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    
    return element;
  };
}

/**
 * Creates a tag builder function for a specific HTML tag.
 * 
 * This is what gets registered globally as div(), span(), button(), etc.
 * It returns a function that can be called with modifiers to create elements.
 * 
 * @param tagName - The HTML tag name to create a builder for
 * @returns A function that creates elements with the given tag name
 * 
 * @example
 * ```ts
 * const divBuilder = createTagBuilder('div');
 * const element = divBuilder('Hello', { className: 'greeting' });
 * ```
 */
export function createTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): (...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>) => NodeModFn<TTagName> {
  return (...modifiers) => createElementFactory(tagName, ...modifiers);
}