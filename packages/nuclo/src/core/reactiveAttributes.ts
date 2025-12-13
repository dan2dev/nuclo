import { logError, safeExecute } from "../utility/errorHandler";
import { isNodeConnected } from "../utility/dom";
import type { UpdateScope } from "./updateScope";

type AttributeResolver = () => unknown;

interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
}

interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
  updateListener?: EventListener;
}

const reactiveElements = new Map<Element, ReactiveElementInfo>();

function ensureElementInfo(el: Element): ReactiveElementInfo {
  let info = reactiveElements.get(el);
  if (!info) {
    info = { attributeResolvers: new Map() };
    reactiveElements.set(el, info);
  }
  return info;
}

function applyAttributeResolvers(el: Element, info: ReactiveElementInfo): void {
  info.attributeResolvers.forEach(({ resolver, applyValue }, key) => {
    try {
      applyValue(safeExecute(resolver));
    } catch (e) {
      logError(`Failed to update reactive attribute: ${key}`, e);
    }
  });
}

/**
 * Registers a reactive attribute resolver for an element.
 *
 * The resolver will be called whenever the element receives an 'update' event,
 * allowing attributes to reactively update based on application state.
 *
 * @param element - The DOM element to make reactive
 * @param key - The attribute name being made reactive (e.g., 'class', 'style', 'disabled')
 * @param resolver - Function that returns the new attribute value
 * @param applyValue - Callback that applies the resolved value to the element
 *
 * @example
 * ```ts
 * const isActive = signal(false);
 * const button = document.createElement('button');
 * registerAttributeResolver(
 *   button,
 *   'class',
 *   () => isActive.value ? 'active' : 'inactive',
 *   (value) => button.className = String(value)
 * );
 * ```
 */
export function registerAttributeResolver<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  key: string,
  resolver: AttributeResolver,
  applyValue: (value: unknown) => void
): void {
  if (!(element instanceof Element) || !key || typeof resolver !== "function") {
    logError("Invalid parameters for registerAttributeResolver");
    return;
  }
  const info = ensureElementInfo(element as Element);
  info.attributeResolvers.set(key, { resolver, applyValue });

  try {
    applyValue(safeExecute(resolver));
  } catch (e) {
    logError("Failed to apply initial attribute value", e);
  }

  if (!info.updateListener) {
    const listener: EventListener = () => applyAttributeResolvers(element as Element, info);
    (element as Element).addEventListener("update", listener);
    info.updateListener = listener;
  }
}

/**
 * Updates all registered reactive elements by re-evaluating their attribute resolvers.
 *
 * Iterates through all reactive elements and triggers their registered attribute resolvers
 * to update. Automatically cleans up disconnected elements and their event listeners.
 *
 * This function should be called after state changes to synchronize element attributes
 * with application state.
 *
 * @example
 * ```ts
 * // After updating application state
 * isActive.value = true;
 * notifyReactiveElements(); // All reactive attributes update
 * ```
 */
export function notifyReactiveElements(scope?: UpdateScope): void {
  reactiveElements.forEach((info, el) => {
    if (!isNodeConnected(el)) {
      if (info.updateListener) el.removeEventListener("update", info.updateListener);
      reactiveElements.delete(el);
      return;
    }

    if (scope && !scope.contains(el)) return;
    applyAttributeResolvers(el, info);
  });
}
