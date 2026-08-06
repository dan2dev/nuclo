const ON_DOUBLE_CLICK = "onDoubleClick";

type FallbackEventListenerList = Array<string | EventListener>;

const fallbackEventListeners = new WeakMap<EventTarget, FallbackEventListenerList>();

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

  if (attribute === ON_DOUBLE_CLICK) return "ondblclick";
  return attribute.toLowerCase();
}

/** Assigns an event attribute, falling back when the IDL property is absent. */
export function setEventAttribute(
  element: HTMLElement,
  property: string,
  listener: EventListener,
): void {
  if (property in element) {
    (element as unknown as Record<string, unknown>)[property] = listener;
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
