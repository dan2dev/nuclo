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
    const resolver = raw as () => AttributeCandidate<TTagName>;
    
    // For reactive className, we need to track which classes are reactive
    // so we can preserve static classes when the reactive className changes
    if (key === 'className' && el instanceof HTMLElement) {
      // Mark this element as having a reactive className
      const reactiveClassNameKey = '__nuclo_reactive_className__';
      const staticClassNameKey = '__nuclo_static_className__';
      
      // Capture the current className as static (before this reactive className is applied)
      if (!(el as any)[staticClassNameKey]) {
        (el as any)[staticClassNameKey] = new Set(el.className.split(' ').filter(c => c));
      }
      
      // Mark that we have a reactive className
      (el as any)[reactiveClassNameKey] = true;
      
      registerAttributeResolver(el, String(key), resolver, (v) => {
        const reactiveClassName = String(v || '');
        const staticClasses = (el as any)[staticClassNameKey] as Set<string>;
        
        // Combine static classes with reactive className
        if (staticClasses && staticClasses.size > 0 && reactiveClassName) {
          const allClasses = new Set(staticClasses);
          reactiveClassName.split(' ').filter(c => c).forEach(c => allClasses.add(c));
          el.className = Array.from(allClasses).join(' ');
        } else if (reactiveClassName) {
          el.className = reactiveClassName;
        } else if (staticClasses && staticClasses.size > 0) {
          el.className = Array.from(staticClasses).join(' ');
        } else {
          el.className = '';
        }
      });
    } else {
      registerAttributeResolver(el, String(key), resolver, (v) => {
        setValue(v, false);
      });
    }
  } else {
    // Static attributes should merge classNames
    // For className, if there's already a reactive className, add to static classes
    if (key === 'className' && el instanceof HTMLElement) {
      const staticClassNameKey = '__nuclo_static_className__';
      const reactiveClassNameKey = '__nuclo_reactive_className__';
      
      if ((el as any)[reactiveClassNameKey]) {
        // There's already a reactive className, add this to static classes
        const newClassName = String(raw || '');
        if (newClassName) {
          if (!(el as any)[staticClassNameKey]) {
            (el as any)[staticClassNameKey] = new Set();
          }
          newClassName.split(' ').filter(c => c).forEach(c => {
            ((el as any)[staticClassNameKey] as Set<string>).add(c);
          });
          // Also update the current className immediately
          const currentClasses = new Set(el.className.split(' ').filter(c => c));
          newClassName.split(' ').filter(c => c).forEach(c => currentClasses.add(c));
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
