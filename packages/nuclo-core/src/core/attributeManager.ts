import { registerAttributeResolver } from "./reactiveAttributes";
import { applyStyleAttribute } from "./styleManager";
import { SVG_NAMESPACE } from "../utility/dom";
import { isZeroArityFunction } from "../utility/typeGuards";
import {
  initReactiveClassName,
  hasReactiveClassName,
  addStaticClasses,
  mergeReactiveClassName,
  mergeStaticClassName,
} from "./classNameMerger";

/**
 * Known template-literal keys that the attribute pipeline handles
 * specially. Other string keys fall through to the generic property /
 * `setAttribute` branch.
 */
type DataAttributeKey = `data-${string}`;
type AriaAttributeKey = `aria-${string}`;

/**
 * Any key of `ExpandedElementAttributes<TTagName>` — narrowed further in
 * `applySingleAttribute` via literal discrimination on `"style"` /
 * `"className"` and prefix tests for `data-*` / `aria-*`.
 *
 * @template TTagName Host element tag literal.
 */
type AttributeKey<TTagName extends ElementTagName> =
  keyof ExpandedElementAttributes<TTagName>;

/**
 * Element-plus-string-index shape used to assign native DOM properties by
 * key name without resorting to `as unknown as Record<string, unknown>`.
 * The cast happens once inside `setValue` and stays scoped to that helper.
 */
interface IndexableElement extends Element {
  [prop: string]: unknown;
}

function setValue(el: Element, key: string, v: unknown, merge: boolean): void {
  if (v == null) return;

  // Guard against non-Element fakes (plain objects in tests, detached proxies) —
  // silently ignore rather than crashing on a missing setAttribute.
  if (typeof el.setAttribute !== "function") return;

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
      (el as IndexableElement)[key] = v;
      return;
    } catch {
      // Fall through to setAttribute.
    }
  }
  el.setAttribute(key, String(v));
}

/**
 * Applies a single attribute to an element. Branches are driven by
 * literal-key equality (`"style"` / `"className"`) and function-arity
 * probing — both of which narrow `raw` without requiring casts.
 *
 * @template TTagName Host element tag literal.
 */
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
  if (isZeroArityFunction(raw)) {
    if (key === "className" && el instanceof HTMLElement) {
      initReactiveClassName(el);
      registerAttributeResolver(el, "className", raw, (v) => {
        mergeReactiveClassName(el, String(v ?? ""));
      });
      return;
    }

    const keyStr = String(key);
    registerAttributeResolver(el, keyStr, raw, (v) => {
      setValue(el, keyStr, v, false);
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

  setValue(el, String(key), raw, shouldMergeClassName);
}

/**
 * Applies a bag of attributes to an element. `data-*` / `aria-*` keys are
 * template-literal-typed via {@link DataAttributeKey} / {@link AriaAttributeKey},
 * so callers get autocomplete for the prefix while the runtime still
 * handles arbitrary strings.
 *
 * @template TTagName Host element tag literal.
 */
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

/**
 * Internal: is `key` a `data-*` template-literal attribute name?
 * Exposed for tests / callers that need to mirror the library's
 * classification without duplicating the prefix check.
 */
export function isDataAttributeKey(key: string): key is DataAttributeKey {
  return key.startsWith("data-");
}

/**
 * Internal: is `key` an `aria-*` template-literal attribute name?
 */
export function isAriaAttributeKey(key: string): key is AriaAttributeKey {
  return key.startsWith("aria-");
}

export { createReactiveTextNode } from "./reactiveText";
