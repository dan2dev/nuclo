import { isFunction } from "../shared/type-guards";
import { registerAttributeResolver } from "../update/reactive-attributes";
import { applyStyleAttribute } from "./inline-style";
import { SVG_NAMESPACE } from "../shared/dom";
import { eventAttributeToProperty, setEventAttribute } from "./event-attributes";
import { registerMount, registerDestroy } from "./lifecycle";
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
 * The value each <select> was last asked to show.
 *
 * A select only accepts a value one of its options carries, and attributes
 * are applied before children — so `select({ value }, option(...), ...)`
 * writes the value into a select that has no options yet and the browser
 * drops it. hydrate()/forceUpdate() have the mirror problem: the value is
 * applied against the old options, which are then re-labelled in place. The
 * element factory therefore re-applies it once the children are settled.
 */
const selectValues = new WeakMap<Element, unknown>();

/**
 * Sets a <select>'s value. When no option carries it (yet) the assignment
 * would only deselect everything, so the previous selection is put back;
 * `false` keeps a reactive value uncached so every update() retries it until
 * an option matches.
 */
function setSelectValue(select: HTMLSelectElement, v: unknown): boolean | void {
  const value = String(v);
  selectValues.set(select, v);
  if (select.value === value) return;
  const previous = select.selectedIndex;
  select.value = value;
  if (select.value === value) return;
  select.selectedIndex = previous;
  return false;
}

/**
 * Re-applies a <select>'s value once its children are built (called by the
 * element factory): the options it needs exist only now.
 */
export function retrySelectValue(el: Element) {
  const value = selectValues.get(el);
  if (value !== undefined) setSelectValue(el as HTMLSelectElement, value);
}

/** Drops a reused <select>'s remembered value before its new build re-applies (or omits) it. */
export function forgetSelectValue(el: Element) {
  selectValues.delete(el);
}

/**
 * Applies a resolved (non-function) attribute value to an element.
 *
 * Module-level rather than a closure inside applySingleAttribute so neither
 * the static-attribute path (the bulk of attributes in list rows) nor a
 * reactive attribute (it is the registered applier, `merge` left unset)
 * allocates anything per attribute.
 *
 * Returns false when the write did not take (see setSelectValue), which keeps
 * a reactive value from being cached until it does.
 */
function setAttributeValue(
  el: Element,
  key: string,
  v: unknown,
  merge?: boolean,
): boolean | void {
  if (v == null) return;

  // Special handling for className to merge instead of replace (only for non-reactive updates)
  if (merge && key === 'className') {
    mergeStaticClassName(el, String(v));
    return;
  }

  // SVG elements should always use setAttribute for most attributes
  // because many SVG properties are read-only (className included)
  if (el instanceof Element && el.namespaceURI === SVG_NAMESPACE) {
    el.setAttribute(key === 'className' ? 'class' : key, String(v));
  } else if (key in el) {
    // For HTML elements, try to set as property first
    if (key === 'value' && el.localName === 'select') return setSelectValue(el as HTMLSelectElement, v);
    try {
      (el as unknown as Record<string, unknown>)[key] = v;
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

function applyReactiveClassName(el: Element, _key: string, v: unknown) {
  mergeReactiveClassName(el, String(v || ''));
}

export function applySingleAttribute<TTagName extends ElementTagName>(
  el: ExpandedElement<TTagName>,
  key: AttributeKey<TTagName>,
  raw: AttributeCandidate<TTagName> | undefined,
  shouldMergeClassName = false,
) {
  if (raw == null) return;
  const k = key as string;

  if (k === "style") {
    applyStyleAttribute(el, raw as unknown as ValueOrFactory<CSSStyleObject>);
    return;
  }

  if (isFunction(raw)) {
    // onMount/onDestroy aren't real DOM events (no native onmount/ondestroy
    // IDL property exists) — checked first so they never fall into the
    // generic on* handling below, which would silently register a dead
    // addEventListener("mount"/"destroy", ...) that the browser never fires.
    if (k === "onMount") {
      registerMount(el as unknown as Element, raw as MountCallback<Element>);
      return;
    }
    if (k === "onDestroy") {
      registerDestroy(el as unknown as Element, raw as DestroyCallback<Element>);
      return;
    }

    // Keep the dominant event path free of event-name normalization.
    if (k === "onClick") {
      setEventAttribute(el as HTMLElement, "onclick", raw as EventListener);
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
        setEventAttribute(el as HTMLElement, k, raw as EventListener);
        return;
      }
    }

    if (raw.length === 0) {
      // Type narrowing: zero-arity function that returns an attribute value
      const resolver = raw as () => AttributeCandidate<TTagName>;

      // For reactive className, we need to track which classes are reactive
      // so we can preserve static classes when the reactive className changes
      if (k === 'className') {
        initReactiveClassName(el as unknown as Element);
        registerAttributeResolver(el, k, resolver, applyReactiveClassName);
      } else {
        registerAttributeResolver(el, k, resolver, setAttributeValue);
      }
      return;
    }
    // Non-event functions with parameters fall through and are assigned as-is
    // (same as any other static value), matching previous behavior.
  }

  // Static attributes should merge classNames
  // For className, if there's already a reactive className, add to static classes
  const node = el as unknown as Element;
  if (k === 'className' && hasReactiveClassName(node)) {
    // There's already a reactive className; update the tracked set and DOM atomically.
    const newClassName = String(raw || '');
    if (newClassName) {
      addStaticClasses(node, newClassName);
      mergeStaticClassName(node, newClassName);
    }
    return;
  }
  setAttributeValue(node, k, raw, shouldMergeClassName);
}

export function applyAttributes<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  attributes: ExpandedElementAttributes<TTagName>,
  mergeClassName = true,
) {
  // An <input>'s value is sanitized against its type/min/max/step as they
  // stand when it is written (a range input clamps it), so it is applied
  // after the object's other keys — `{ value: 150, max: 200 }` must not
  // clamp to the default max of 100.
  let valueLast = false;
  // for-in over Object.keys() avoids allocating a key array per element —
  // attribute objects are always plain literals, so no prototype keys leak in.
  for (const k in attributes) {
    if (k === 'value' && (element as unknown as Element).localName === 'input') {
      valueLast = true;
      continue;
    }
    const key = k as AttributeKey<TTagName>;
    const value = (attributes as Record<string, unknown>)[k] as
      AttributeCandidate<TTagName> | undefined;
    // Only merge className for non-className keys OR when explicitly enabled for className
    const shouldMerge = mergeClassName && key === 'className';
    applySingleAttribute(element, key, value, shouldMerge);
  }
  if (valueLast) {
    applySingleAttribute(
      element,
      'value' as AttributeKey<TTagName>,
      (attributes as Record<string, unknown>).value as AttributeCandidate<TTagName> | undefined,
    );
  }
}
