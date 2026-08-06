import { isFunction } from "../shared/type-guards";
import { registerAttributeResolver } from "../update/reactive-attributes";
import { applyStyleAttribute } from "./inline-style";
import { SVG_NAMESPACE } from "../shared/dom";
import { eventAttributeToProperty, setEventAttribute } from "./event-attributes";
import {
	initReactiveClassName,
	hasReactiveClassName,
	addStaticClasses,
	mergeReactiveClassName,
	mergeStaticClassName
} from "./class-name";

type AttributeKey<TTagName extends ElementTagName> = keyof ExpandedElementAttributes<TTagName>;
type AttributeCandidate<TTagName extends ElementTagName> =
  ExpandedElementAttributes<TTagName>[AttributeKey<TTagName>];

/**
 * Applies a resolved (non-function) attribute value to an element.
 *
 * Module-level rather than a closure inside applySingleAttribute so the
 * static-attribute path — the bulk of attributes in list rows — allocates
 * nothing per attribute.
 */
function setAttributeValue(
  el: ExpandedElement<ElementTagName>,
  key: string,
  v: unknown,
  merge: boolean,
): void {
  if (v == null) return;

  // Special handling for className to merge instead of replace (only for non-reactive updates)
  if (merge && key === 'className' && el instanceof HTMLElement) {
    mergeStaticClassName(el, String(v));
    return;
  }

  // SVG elements should always use setAttribute for most attributes
  // because many SVG properties are read-only
  if (el instanceof Element && el.namespaceURI === SVG_NAMESPACE) {
    el.setAttribute(key, String(v));
  } else if (key in el) {
    // For HTML elements, try to set as property first
    try {
      (el as Record<string, unknown>)[key] = v;
    } catch {
      // If property is read-only, fall back to setAttribute
      if (el instanceof Element) {
        el.setAttribute(key, String(v));
      }
    }
  } else if (el instanceof Element) {
    el.setAttribute(key, String(v));
  }
}

export function applySingleAttribute<TTagName extends ElementTagName>(
  el: ExpandedElement<TTagName>,
  key: AttributeKey<TTagName>,
  raw: AttributeCandidate<TTagName> | undefined,
  shouldMergeClassName = false,
): void {
  if (raw == null) return;
  const k = key as string;

  if (k === "style") {
    applyStyleAttribute(el, raw as unknown as ValueOrFactory<CSSStyleObject>);
    return;
  }

  if (isFunction(raw)) {
    // Keep the dominant event path to one comparison and one assignment.
    if (k === "onClick") {
      (el as Record<string, unknown>).onclick = raw;
      return;
    }

    if (
      k.charCodeAt(0) === 111 /* o */
      && k.charCodeAt(1) === 110 /* n */
    ) {
      // Camel-cased `on*` props are handlers, not reactive value resolvers.
      const eventProperty = eventAttributeToProperty(k);
      if (eventProperty) {
        setEventAttribute(el as HTMLElement, eventProperty, raw as EventListener);
        return;
      }

      // Preserve runtime compatibility for native lowercase IDL properties
      // passed from untyped JavaScript. Public types reject these names.
      if (k in el) {
        (el as Record<string, unknown>)[k] = raw;
        return;
      }
    }

    if (raw.length === 0) {
      // Type narrowing: zero-arity function that returns an attribute value
      const resolver = raw as () => AttributeCandidate<TTagName>;

      // For reactive className, we need to track which classes are reactive
      // so we can preserve static classes when the reactive className changes
      if (k === 'className' && el instanceof HTMLElement) {
        initReactiveClassName(el);

        registerAttributeResolver(el, k, resolver, function(v) {
          mergeReactiveClassName(el, String(v || ''));
        });
      } else {
        registerAttributeResolver(el, k, resolver, function(v) {
          setAttributeValue(el, k, v, false);
        });
      }
      return;
    }
    // Non-event functions with parameters fall through and are assigned as-is
    // (same as any other static value), matching previous behavior.
  }

  // Static attributes should merge classNames
  // For className, if there's already a reactive className, add to static classes
  if (k === 'className' && el instanceof HTMLElement && hasReactiveClassName(el)) {
    // There's already a reactive className; update the tracked set and DOM atomically.
    const newClassName = String(raw || '');
    if (newClassName) {
      addStaticClasses(el, newClassName);
      mergeStaticClassName(el, newClassName);
    }
    return;
  }
  setAttributeValue(el, k, raw, shouldMergeClassName);
}

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
  mergeClassName = true,
): void {
  if (!attributes) return;
  // for-in over Object.keys() avoids allocating a key array per element —
  // attribute objects are always plain literals, so no prototype keys leak in.
  for (const k in attributes) {
    const key = k as AttributeKey<TTagName>;
    const value = (attributes as Record<string, unknown>)[k] as
      AttributeCandidate<TTagName> | undefined;
    // Only merge className for non-className keys OR when explicitly enabled for className
    const shouldMerge = mergeClassName && key === 'className';
    applySingleAttribute(element, key, value, shouldMerge);
  }
}

export { createReactiveTextNode } from "../update/reactive-text";
