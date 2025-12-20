import { isFunction } from "../utility/typeGuards";
import { registerAttributeResolver } from "./reactive";
import { applyStyleAttribute } from "./styleManager";
import {
	initReactiveClassName,
	hasReactiveClassName,
	addStaticClasses,
	mergeReactiveClassName,
	mergeStaticClassName
} from "./classNameMerger";

type AttributeKey<TTagName extends ElementTagName> = keyof ExpandedElementAttributes<TTagName>;
type AttributeCandidate<TTagName extends ElementTagName> =
  ExpandedElementAttributes<TTagName>[AttributeKey<TTagName>];

function applySingleAttribute<TTagName extends ElementTagName>(
  el: ExpandedElement<TTagName>,
  key: AttributeKey<TTagName>,
  raw: AttributeCandidate<TTagName> | undefined,
  shouldMergeClassName = false,
): void {
  if (raw == null) return;

  if (key === "style") {
    applyStyleAttribute(el, raw as ExpandedElementAttributes<TTagName>["style"]);
    return;
  }

  const setValue = (v: unknown, merge = false): void => {
    if (v == null) return;

    // Special handling for className to merge instead of replace (only for non-reactive updates)
    if (key === 'className' && el instanceof HTMLElement && merge) {
      mergeStaticClassName(el, String(v));
      return;
    }

    // SVG elements should always use setAttribute for most attributes
    // because many SVG properties are read-only
    const isSVGElement = el instanceof Element && el.namespaceURI === 'http://www.w3.org/2000/svg';

    if (isSVGElement) {
      // Always use setAttribute for SVG elements
      el.setAttribute(String(key), String(v));
    } else if (key in el) {
      // For HTML elements, try to set as property first
      try {
        (el as Record<string, unknown>)[key as string] = v;
      } catch {
        // If property is read-only, fall back to setAttribute
        if (el instanceof Element) {
          el.setAttribute(String(key), String(v));
        }
      }
    } else if (el instanceof Element) {
      el.setAttribute(String(key), String(v));
    }
  };

  if (isFunction(raw) && raw.length === 0) {
    // Type narrowing: zero-arity function that returns an attribute value
    const resolver = raw as () => AttributeCandidate<TTagName>;

    // For reactive className, we need to track which classes are reactive
    // so we can preserve static classes when the reactive className changes
    if (key === 'className' && el instanceof HTMLElement) {
      initReactiveClassName(el);

      registerAttributeResolver(el, String(key), resolver, function(v) {
        mergeReactiveClassName(el, String(v || ''));
      });
    } else {
      registerAttributeResolver(el, String(key), resolver, function(v) {
        setValue(v, false);
      });
    }
  } else {
    // Static attributes should merge classNames
    // For className, if there's already a reactive className, add to static classes
    if (key === 'className' && el instanceof HTMLElement) {
      if (hasReactiveClassName(el)) {
        // There's already a reactive className, add this to static classes
        const newClassName = String(raw || '');
        if (newClassName) {
          addStaticClasses(el, newClassName);
          // Also update the current className immediately
          const currentClasses = new Set(el.className.split(' ').filter(function(c) { return c; }));
          newClassName.split(' ').filter(function(c) { return c; }).forEach(function(c) { currentClasses.add(c); });
          el.className = Array.from(currentClasses).join(' ');
        }
        return;
      }
    }
    setValue(raw, shouldMergeClassName);
  }
}

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
  mergeClassName = true,
): void {
  if (!attributes) return;
  for (const k of Object.keys(attributes) as Array<AttributeKey<TTagName>>) {
    const value = (attributes as Record<string, unknown>)[k as string] as
      AttributeCandidate<TTagName> | undefined;
    // Only merge className for non-className keys OR when explicitly enabled for className
    const shouldMerge = mergeClassName && k === 'className';
    applySingleAttribute(element, k, value, shouldMerge);
  }
}

export { createReactiveTextNode } from "./reactive";
