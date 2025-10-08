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
): void {
  if (raw == null) return;

  if (key === "style") {
    applyStyleAttribute(el, raw as ExpandedElementAttributes<TTagName>["style"]);
    return;
  }

  const setValue = (v: unknown): void => {
    if (v == null) return;
    if (key in el) {
      (el as Record<string, unknown>)[key as string] = v;
    } else if (el instanceof Element) {
      el.setAttribute(String(key), String(v));
    }
  };

  if (isFunction(raw) && (raw as Function).length === 0) {
    registerAttributeResolver(el, String(key), raw as () => unknown, setValue);
  } else {
    setValue(raw);
  }
}

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
): void {
  if (!attributes) return;
  for (const k of Object.keys(attributes) as Array<AttributeKey<TTagName>>) {
    const value = (attributes as Record<string, unknown>)[k as string] as
      AttributeCandidate<TTagName> | undefined;
    applySingleAttribute(element, k, value);
  }
}

export { createReactiveTextNode } from "./reactive";
