const ON_DOUBLE_CLICK = "onDoubleClick";

/**
 * `onMount`/`onDestroy` look like `on*` event attributes but aren't real DOM
 * events — there is no native `onmount`/`ondestroy` IDL property for
 * `"onmount" in element` to find, so without this exclusion they'd fall into
 * the generic addEventListener fallback below and silently never fire (the
 * browser never dispatches a "mount"/"destroy" event). attributes.ts special-
 * cases these two keys before ever calling this function; the exclusion here
 * is what makes list/template.ts's row-template analysis correctly bail its
 * skeleton-clone fast path for rows using them too (see element/lifecycle.ts).
 */
const RESERVED_LIFECYCLE_ATTRIBUTES = new Set(["onMount", "onDestroy"]);

type FallbackEventListenerList = Array<string | EventListener>;

const fallbackEventListeners = new WeakMap<EventTarget, FallbackEventListenerList>();
const nativeEventHandlers = new WeakMap<HTMLElement, Map<string, EventListener>>();

/** Converts a public camel-cased event attribute to its native IDL property. */
export function eventAttributeToProperty(attribute: string): string | null {
  if (
    attribute.length <= 2
    || attribute.charCodeAt(0) !== 111 /* o */
    || attribute.charCodeAt(1) !== 110 /* n */
  ) {
    return null;
  }

  const firstEventCharacter = attribute.charCodeAt(2);
  if (firstEventCharacter < 65 /* A */ || firstEventCharacter > 90 /* Z */) {
    return null;
  }

  if (RESERVED_LIFECYCLE_ATTRIBUTES.has(attribute)) return null;
  if (attribute === ON_DOUBLE_CLICK) return "ondblclick";
  return attribute.toLowerCase();
}

/** Assigns an event attribute, falling back when the IDL property is absent. */
export function setEventAttribute(
  element: HTMLElement,
  property: string,
  listener: EventListener,
) {
  if (property in element) {
    (element as unknown as Record<string, unknown>)[property] = listener;
    let handlers = nativeEventHandlers.get(element);
    if (!handlers) nativeEventHandlers.set(element, handlers = new Map());
    handlers.set(property, listener);
    return;
  }

  const type = property.slice(2);
  const list = fallbackEventListeners.get(element);
  if (list) {
    for (let i = 0; i < list.length; i += 2) {
      if (list[i] !== type) continue;

      const previous = list[i + 1] as EventListener;
      if (previous === listener) return;
      element.removeEventListener(type, previous);
      element.addEventListener(type, listener);
      list[i + 1] = listener;
      return;
    }

    element.addEventListener(type, listener);
    list.push(type, listener);
    return;
  }

  element.addEventListener(type, listener);
  fallbackEventListeners.set(element, [type, listener]);
}

/** Releases only handlers installed through nuclo's event attributes. */
export function removeEventAttributes(element: HTMLElement) {
  const handlers = nativeEventHandlers.get(element);
  if (handlers) {
    const target = element as unknown as Record<string, unknown>;
    for (const [property, listener] of handlers) {
      // Leave a handler that external code replaced after our assignment alone.
      if (target[property] === listener) target[property] = null;
    }
    nativeEventHandlers.delete(element);
  }
  const listeners = fallbackEventListeners.get(element);
  if (listeners) {
    for (let i = 0; i < listeners.length; i += 2) {
      element.removeEventListener(listeners[i] as string, listeners[i + 1] as EventListener);
    }
    fallbackEventListeners.delete(element);
  }
}
