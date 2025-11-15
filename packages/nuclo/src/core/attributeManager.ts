import { isFunction } from "../utility/typeGuards";
import { registerAttributeResolver, createReactiveTextNode } from "./reactive";
import { applyStyleAttribute } from "./styleManager";

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
      const newClassName = String(v);
      const currentClassName = el.className;

      // If there's already a className, merge them (avoid duplicates)
      if (currentClassName && currentClassName !== newClassName) {
        const existing = new Set(currentClassName.split(' ').filter(c => c));
        const newClasses = newClassName.split(' ').filter(c => c);
        newClasses.forEach(c => existing.add(c));
        el.className = Array.from(existing).join(' ');
      } else if (newClassName) {
        el.className = newClassName;
      }
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
    // Reactive attributes should replace, not merge (including className)
    const resolver = raw as () => AttributeCandidate<TTagName>;
    registerAttributeResolver(el, String(key), resolver, (v) => {
      // For reactive className, always replace
      if (key === 'className' && el instanceof HTMLElement) {
        el.className = String(v || '');
      } else {
        setValue(v, false);
      }
    });
  } else {
    // Static attributes should merge classNames
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
