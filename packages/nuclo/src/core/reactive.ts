/**
 * Reactive System for nuclo
 * 
 * This module handles reactive text content and reactive attributes. It tracks
 * functions that return values and automatically updates the DOM when update()
 * is called.
 */

import { logError, safeExecute } from "../utility/errorHandler";
import { isNodeConnected } from "../utility/dom";

/**
 * Type for functions that resolve to primitive values for reactive text.
 */
type TextResolver = () => Primitive;

/**
 * Type for functions that resolve to any value for reactive attributes.
 */
type AttributeResolver = () => unknown;

/**
 * Information about a reactive attribute resolver.
 */
interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
}

/**
 * Information about a reactive text node.
 */
interface ReactiveTextNodeInfo {
  resolver: TextResolver;
  lastValue: string;
}

/**
 * Information about a reactive element with reactive attributes.
 */
interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
  updateListener?: EventListener;
}

// Global maps to track reactive elements and text nodes
const reactiveTextNodes = new Map<Text, ReactiveTextNodeInfo>();
const reactiveElements = new Map<Element, ReactiveElementInfo>();

/**
 * Ensures that an element has reactive info, creating it if necessary.
 * 
 * @param el - The element to get or create info for
 * @returns The reactive element info
 */
function ensureElementInfo(el: Element): ReactiveElementInfo {
  let info = reactiveElements.get(el);
  if (!info) {
    info = { attributeResolvers: new Map() };
    reactiveElements.set(el, info);
  }
  return info;
}

/**
 * Applies all attribute resolvers for a reactive element.
 * 
 * @param el - The element to update
 * @param info - The reactive element info
 */
function applyAttributeResolvers(el: Element, info: ReactiveElementInfo): void {
  info.attributeResolvers.forEach(({ resolver, applyValue }, key) => {
    try {
      const newValue = safeExecute(resolver);
      applyValue(newValue);
    } catch (error) {
      logError(`Failed to update reactive attribute: ${key}`, error);
    }
  });
}

/**
 * Creates a reactive text node that updates automatically when update() is called.
 * 
 * @param resolver - Function that returns the text content
 * @param preEvaluated - Optional pre-evaluated value for initial render
 * @returns A text node or document fragment with reactive content
 */
export function createReactiveTextNode(resolver: TextResolver, preEvaluated?: unknown): Text | DocumentFragment {
  if (typeof resolver !== "function") {
    logError("Invalid resolver provided to createReactiveTextNode");
    return document.createTextNode("");
  }

  // Get initial value (either pre-evaluated or by calling the resolver)
  const initial = arguments.length > 1 ? preEvaluated : safeExecute(resolver, "");
  const textContent = initial === undefined ? "" : String(initial);
  const textNode = document.createTextNode(textContent);

  // Register this text node for reactive updates
  reactiveTextNodes.set(textNode, { resolver, lastValue: textContent });
  return textNode;
}

/**
 * Registers a reactive attribute resolver for an element.
 * 
 * @param element - The element to add the reactive attribute to
 * @param key - The attribute name
 * @param resolver - Function that returns the attribute value
 * @param applyValue - Function that applies the value to the element
 */
export function registerAttributeResolver<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  key: string,
  resolver: AttributeResolver,
  applyValue: (value: unknown) => void
): void {
  // Validate parameters
  if (!(element instanceof Element) || !key || typeof resolver !== "function") {
    logError("Invalid parameters for registerAttributeResolver");
    return;
  }

  const info = ensureElementInfo(element as Element);
  info.attributeResolvers.set(key, { resolver, applyValue });

  // Apply initial value
  try {
    const initialValue = safeExecute(resolver);
    applyValue(initialValue);
  } catch (error) {
    logError("Failed to apply initial attribute value", error);
  }

  // Set up update listener if not already present
  if (!info.updateListener) {
    const listener: EventListener = () => applyAttributeResolvers(element as Element, info);
    (element as Element).addEventListener("update", listener);
    info.updateListener = listener;
  }
}

/**
 * Updates all reactive text nodes.
 * 
 * This function is called by update() to refresh all reactive text content.
 */
export function notifyReactiveTextNodes(): void {
  reactiveTextNodes.forEach((info, node) => {
    // Clean up disconnected nodes
    if (!isNodeConnected(node)) {
      reactiveTextNodes.delete(node);
      return;
    }

    try {
      // Get new value from resolver
      const rawValue = safeExecute(info.resolver);
      const newValue = rawValue === undefined ? "" : String(rawValue);
      
      // Only update if the value has changed
      if (newValue !== info.lastValue) {
        node.textContent = newValue;
        info.lastValue = newValue;
      }
    } catch (error) {
      logError("Failed to update reactive text node", error);
    }
  });
}

/**
 * Updates all reactive elements (attributes).
 * 
 * This function is called by update() to refresh all reactive attributes.
 */
export function notifyReactiveElements(): void {
  reactiveElements.forEach((info, element) => {
    // Clean up disconnected elements
    if (!isNodeConnected(element)) {
      if (info.updateListener) {
        element.removeEventListener("update", info.updateListener);
      }
      reactiveElements.delete(element);
      return;
    }

    // Apply all attribute resolvers
    applyAttributeResolvers(element, info);
  });
}
