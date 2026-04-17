import { registerAttributeResolver } from "./reactiveAttributes";
import { setStyleProperty } from "../utility/domTypeHelpers";
import { logError } from "../utility/errorHandler";

type StyleAssignment = CSSStyleObject;
type StyleResolver = () => StyleAssignment | null | undefined;

/**
 * Values accepted by `setStyleProperty` in this loop. `undefined` is kept in
 * the union so reactive resolvers can clear a property by returning an object
 * with `{ key: undefined }`; `setStyleProperty` treats null/undefined/"" as
 * "remove". The declared CSSStyleObject value type is wider at the type level,
 * so this alias names the runtime contract the downstream helper actually honors.
 */
type InlineStyleValue = string | number | null | undefined;

/** Read-only string index view over a `CSSStyleObject` for loop iteration. */
interface IndexedStyleObject {
  readonly [property: string]: InlineStyleValue;
}

/**
 * Applies every own-key of `styles` to `element.style`.
 * Uses a plain for-in loop to avoid Object.entries allocation (2 objects per key).
 */
export function assignInlineStyles<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styles: StyleAssignment | null | undefined,
): void {
  if (!element?.style || !styles) return;

  const indexed = styles satisfies StyleAssignment as IndexedStyleObject;
  for (const property in indexed) {
    if (!Object.prototype.hasOwnProperty.call(indexed, property)) continue;
    const value = indexed[property];
    if (!setStyleProperty(element, property, value)) {
      logError(`Failed to set style property '${property}'`);
    }
  }
}

export function applyStyleAttribute<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styleValue: StyleAssignment | StyleResolver | null | undefined,
): void {
  if (!element) return;

  if (typeof styleValue === "function") {
    registerAttributeResolver(element, "style", styleValue, (resolved) => {
      assignInlineStyles(element, resolved as StyleAssignment);
    });
    return;
  }
  assignInlineStyles(element, styleValue);
}
