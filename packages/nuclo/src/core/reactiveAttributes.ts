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

/**
 * Stores weak references to reactive elements to prevent memory leaks.
 * Elements can be garbage collected when removed from DOM.
 */
const reactiveElements = new Map<WeakRef<Element>, ReactiveElementInfo>();
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
      // Find the WeakRef that points to this element
      let foundRef: WeakRef<Element> | null = null;
      let foundInfo: ReactiveElementInfo | null = null;
      
      for (const [ref, info] of reactiveElements) {
        const el = ref.deref();
        if (el === undefined) {
          // Element was garbage collected, clean it up
          reactiveElements.delete(ref);
          continue;
        }
        if (el === node) {
          foundRef = ref;
          foundInfo = info;
          break;
        }
      }

      if (foundInfo && foundRef) {
        if (!isNodeConnected(node)) {
          reactiveElements.delete(foundRef);
        } else {
          applyAttributeResolvers(foundInfo);
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
  // Check if we already have a WeakRef for this element
  for (const [ref, info] of reactiveElements) {
    const refEl = ref.deref();
    if (refEl === undefined) {
      // Element was garbage collected, clean it up
      reactiveElements.delete(ref);
      continue;
    }
    if (refEl === el) {
      return info;
    }
  }
  
  // No existing info, create new
  const info: ReactiveElementInfo = { attributeResolvers: new Map() };
  reactiveElements.set(new WeakRef(el), info);
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
  const toDelete: WeakRef<Element>[] = [];

  for (const [ref, info] of reactiveElements) {
    const el = ref.deref();
    if (el === undefined) {
      // Element was garbage collected
      toDelete.push(ref);
      continue;
    }

    if (!isNodeConnected(el)) {
      toDelete.push(ref);
      continue;
    }

    if (scope && !scope.contains(el)) continue;
    applyAttributeResolvers(info);
  }

  // Clean up dead references
  for (const ref of toDelete) {
    reactiveElements.delete(ref);
  }
}
