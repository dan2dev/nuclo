import { registerAttributeResolver } from "./reactiveAttributes";
import { applyStyleAttribute } from "./styleManager";
import { SVG_NAMESPACE } from "../utility/dom";
import {
  initReactiveClassName,
  hasReactiveClassName,
  addStaticClasses,
  mergeReactiveClassName,
  mergeStaticClassName,
} from "./classNameMerger";

type AttributeKey<TTagName extends ElementTagName> =
  keyof ExpandedElementAttributes<TTagName>;
type AttributeCandidate<TTagName extends ElementTagName> =
  ExpandedElementAttributes<TTagName>[AttributeKey<TTagName>];

function setValue(el: Element, key: string, v: unknown, merge: boolean): void {
  if (v == null) return;

  // Guard against non-Element fakes (plain objects in tests, detached proxies) —
  // silently ignore rather than crashing on a missing setAttribute.
  if (typeof (el as Element).setAttribute !== "function") return;

  if (key === "className" && merge && el instanceof HTMLElement) {
    mergeStaticClassName(el, String(v));
    return;
  }

  // SVG uses setAttribute for most attributes (many properties are read-only).
  if (el.namespaceURI === SVG_NAMESPACE) {
    el.setAttribute(key, String(v));
    return;
  }

  if (key in el) {
    try {
      (el as unknown as Record<string, unknown>)[key] = v;
      return;
    } catch {
      // Fall through to setAttribute.
    }
  }
  el.setAttribute(key, String(v));
}

function applySingleAttribute<TTagName extends ElementTagName>(
  el: ExpandedElement<TTagName>,
  key: AttributeKey<TTagName>,
  raw: unknown,
  shouldMergeClassName: boolean,
): void {
  if (raw == null) return;

  if (key === "style") {
    applyStyleAttribute(
      el,
      raw as ExpandedElementAttributes<TTagName>["style"],
    );
    return;
  }

  // Reactive (zero-arity function) attribute
  if (typeof raw === "function" && (raw as { length: number }).length === 0) {
    const resolver = raw as () => unknown;

    if (key === "className" && el instanceof HTMLElement) {
      initReactiveClassName(el);
      registerAttributeResolver(el, "className", resolver, (v) => {
        mergeReactiveClassName(el, String(v ?? ""));
      });
      return;
    }

    const element = el as unknown as Element;
    const keyStr = String(key);
    registerAttributeResolver(el, keyStr, resolver, (v) => {
      setValue(element, keyStr, v, false);
    });
    return;
  }

  // Static className + existing reactive → merge instead of overwrite.
  if (
    key === "className" &&
    el instanceof HTMLElement &&
    hasReactiveClassName(el)
  ) {
    const newClassName = String(raw);
    if (newClassName) {
      addStaticClasses(el, newClassName);
      mergeStaticClassName(el, newClassName);
    }
    return;
  }

  setValue(el as unknown as Element, String(key), raw, shouldMergeClassName);
}

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
  mergeClassName: boolean = true,
): void {
  if (!attributes) return;
  // for...in is cheaper than Object.keys() — no array allocation.
  for (const k in attributes) {
    if (!Object.prototype.hasOwnProperty.call(attributes, k)) continue;
    const value = (attributes as Record<string, unknown>)[k];
    if (value == null) continue;
    applySingleAttribute(
      element,
      k as AttributeKey<TTagName>,
      value,
      mergeClassName && k === "className",
    );
  }
}

export { createReactiveTextNode } from "./reactiveText";
