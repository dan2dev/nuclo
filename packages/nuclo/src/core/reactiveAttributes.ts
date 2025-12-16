import { logError } from "../utility/errorHandler";
import { isNodeConnected } from "../utility/dom";
import type { UpdateScope } from "./updateScope";

type AttributeResolver = () => unknown;

interface AttributeResolverRecord {
  resolver: AttributeResolver;
  applyValue: (value: unknown) => void;
  lastValue: unknown;
}

interface ReactiveElementInfo {
  attributeResolvers: Map<string, AttributeResolverRecord>;
}

const reactiveElements = new WeakMap<Element, ReactiveElementInfo>();
const reactiveElementsSet = new Set<Element>();
const UNSET_LAST_VALUE = {};
let updateEventListenerRegistered = false;

function handleUpdateEvent(event: Event): void {
  // Update all reactive elements on the event's target ancestor chain.
  // This preserves the "dispatchEvent(new Event('update'))" workflow without
  // per-element event listeners.
  const target = event.target;
  if (!target || typeof Node === "undefined" || !(target instanceof Node)) return;

  let node: Node | null = target;
  while (node) {
    if (node instanceof Element) {
      const info = reactiveElements.get(node);
      if (info) {
        if (!isNodeConnected(node)) {
          reactiveElementsSet.delete(node);
          // WeakMap entry will be garbage collected automatically
        } else {
          applyAttributeResolvers(info);
        }
      }
    }
    node = node.parentNode;
  }
}

function ensureGlobalUpdateEventListener(): void {
  if (updateEventListenerRegistered) return;
  if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
  document.addEventListener("update", handleUpdateEvent, true);
  updateEventListenerRegistered = true;
}

function ensureElementInfo(el: Element): ReactiveElementInfo {
  let info = reactiveElements.get(el);
  if (!info) {
    info = { attributeResolvers: new Map() };
    reactiveElements.set(el, info);
    reactiveElementsSet.add(el);
  }
  return info;
}

function isCacheableValue(value: unknown): boolean {
  // Avoid caching objects/arrays that may be mutated in place (e.g. style objects).
  return value === null || typeof value !== "object";
}

function updateAttributeResolverRecord(key: string, record: AttributeResolverRecord): void {
  let nextValue: unknown;
  try {
    nextValue = record.resolver();
  } catch (e) {
    logError(`Failed to resolve reactive attribute: ${key}`, e);
    return;
  }

  const cacheable = isCacheableValue(nextValue);
  if (cacheable && Object.is(nextValue, record.lastValue)) return;

  try {
    record.applyValue(nextValue);
    record.lastValue = cacheable ? nextValue : UNSET_LAST_VALUE;
  } catch (e) {
    logError(`Failed to apply reactive attribute: ${key}`, e);
  }
}

function applyAttributeResolvers(info: ReactiveElementInfo): void {
  for (const [key, record] of info.attributeResolvers) {
    updateAttributeResolverRecord(key, record);
  }
}

/**
 * Registers a reactive attribute resolver for an element.
 *
 * The resolver will be called whenever reactive updates run (e.g. via `update()`),
 * or when an `"update"` event is dispatched on the element (or a descendant),
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
  ensureGlobalUpdateEventListener();
  const info = ensureElementInfo(element as Element);
  const record: AttributeResolverRecord = { resolver, applyValue, lastValue: UNSET_LAST_VALUE };
  info.attributeResolvers.set(key, record);
  updateAttributeResolverRecord(key, record);
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
  for (const el of reactiveElementsSet) {
    if (!isNodeConnected(el)) {
      reactiveElementsSet.delete(el);
      // WeakMap entry will be garbage collected automatically
      continue;
    }

    const info = reactiveElements.get(el);
    if (!info) {
      reactiveElementsSet.delete(el);
      continue;
    }

    if (scope && !scope.contains(el)) continue;
    applyAttributeResolvers(info);
  }
}
