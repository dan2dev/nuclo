import { applyAttributes } from "./attributeManager";
import { createReactiveTextNode } from "./reactive";
import { logError } from "../utility/errorHandler";
import { isFunction, isNode, isObject, isPrimitive } from "../utility/typeGuards";
import { modifierProbeCache } from "../utility/modifierPredicates";
export { isConditionalModifier, findConditionalModifier } from "../utility/modifierPredicates";

/**
 * A modifier that can be applied to a DOM element.
 * Can be a static value, a function that returns a value, or a function that modifies the element.
 */
export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

/**
 * Applies a modifier to a DOM element and returns the resulting node.
 * 
 * @param parent - The parent element to apply the modifier to
 * @param modifier - The modifier to apply (can be a value, function, or object)
 * @param index - The index of this modifier for debugging purposes
 * @returns The resulting DOM node, or null if no node should be created
 */
export function applyNodeModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeModifier<TTagName>,
  index: number,
): Node | null {
  if (modifier == null) return null;

  // Handle function modifiers
  if (isFunction(modifier)) {
    return handleFunctionModifier(parent, modifier, index);
  }

  // Handle non-function modifiers
  return handleStaticModifier(parent, modifier, index);
}

/**
 * Handles function-based modifiers (both reactive and non-reactive).
 */
function handleFunctionModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: Function,
  index: number,
): Node | null {
  // Reactive function (no parameters) - creates reactive text content
  if (modifier.length === 0) {
    return handleReactiveFunction(modifier as () => unknown, index);
  }

  // Non-reactive function - calls the function and processes its result
  const result = (modifier as NodeModFn<TTagName>)(parent, index);
  return result != null ? processModifierResult(parent, result, index) : null;
}

/**
 * Handles reactive functions that return primitive values.
 * These functions are called to create reactive text content.
 */
function handleReactiveFunction(
  fn: () => unknown,
  index: number,
): Node | null {
  try {
    // Check cache for this function
    let record = modifierProbeCache.get(fn);
    if (!record) {
      const value = fn();
      record = { value, error: false };
      modifierProbeCache.set(fn, record);
    }

    // If function previously errored, create empty reactive text
    if (record.error) {
      return createTextFragment(index, () => "");
    }

    const value = record.value;
    
    // Only create reactive text for non-null primitive values
    if (isPrimitive(value) && value != null) {
      return createTextFragment(index, fn as () => Primitive, value);
    }

    return null;
  } catch (error) {
    // Cache the error to avoid repeated calls
    modifierProbeCache.set(fn, { value: undefined, error: true });
    logError("Error evaluating reactive text function:", error);
    return createTextFragment(index, () => "");
  }
}

/**
 * Handles static (non-function) modifiers.
 */
function handleStaticModifier<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  modifier: NodeMod<TTagName>,
  index: number,
): Node | null {
  return processModifierResult(parent, modifier, index);
}

/**
 * Processes the result of a modifier and returns the appropriate DOM node.
 */
function processModifierResult<TTagName extends ElementTagName>(
  parent: ExpandedElement<TTagName>,
  result: NodeMod<TTagName> | null,
  index: number,
): Node | null {
  if (result == null) return null;

  // Handle primitive values (strings, numbers, etc.)
  if (isPrimitive(result)) {
    return createTextFragment(index, String(result));
  }

  // Handle DOM nodes
  if (isNode(result)) {
    return result;
  }

  // Handle attribute objects
  if (isObject(result)) {
    applyAttributes(parent, result as ExpandedElementAttributes<TTagName>);
  }

  return null;
}

/**
 * Creates a document fragment with a comment and text node for debugging.
 * Used for text content that needs to be tracked in the DOM.
 */
function createTextFragment(
  index: number,
  textContent: string | (() => Primitive),
  initialValue?: Primitive,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const comment = document.createComment(` text-${index} `);
  
  const textNode = typeof textContent === "function"
    ? createReactiveTextNode(textContent, initialValue)
    : document.createTextNode(textContent);
  
  fragment.appendChild(comment);
  fragment.appendChild(textNode);
  return fragment;
}
