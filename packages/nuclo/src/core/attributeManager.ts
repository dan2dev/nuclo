import { isFunction } from "../utility/typeGuards";
import { registerAttributeResolver, createReactiveTextNode } from "./reactive";
import { applyStyleAttribute } from "./styleManager";

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
): void {
  if (!attributes) return;

  for (const [key, value] of Object.entries(attributes)) {
    if (value == null) continue;

    // Handle style attribute specially
    if (key === "style") {
      applyStyleAttribute(element, value as any);
      continue;
    }

    const setValue = (v: unknown): void => {
      if (v == null) return;
      if (key in element) {
        (element as any)[key] = v;
      } else if (element instanceof Element) {
        element.setAttribute(key, String(v));
      }
    };

    // Handle reactive attributes (functions with no parameters)
    if (isFunction(value) && value.length === 0) {
      registerAttributeResolver(element, key, value as () => unknown, setValue);
    } else {
      setValue(value);
    }
  }
}

export { createReactiveTextNode } from "./reactive";
