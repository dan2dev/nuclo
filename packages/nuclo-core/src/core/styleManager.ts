import { registerAttributeResolver } from "./reactiveAttributes";
import { setStyleProperty } from "../utility/domTypeHelpers";
import { logError } from "../utility/errorHandler";

type StyleAssignment = CSSStyleObject;
type StyleResolver = () => StyleAssignment | null | undefined;

/**
 * Applies every own-key of `styles` to `element.style`.
 * Uses a plain for-in loop to avoid Object.entries allocation (2 objects per key).
 */
export function assignInlineStyles<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styles: StyleAssignment | null | undefined,
): void {
  if (!element?.style || !styles) return;

  for (const property in styles) {
    if (!Object.prototype.hasOwnProperty.call(styles, property)) continue;
    const value = (styles as Record<string, unknown>)[property] as
      | string
      | number
      | null;
    if (!setStyleProperty(element as HTMLElement, property, value)) {
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
    registerAttributeResolver(
      element,
      "style",
      styleValue as StyleResolver,
      (resolved) => {
        assignInlineStyles(element, resolved as StyleAssignment);
      },
    );
    return;
  }
  assignInlineStyles(element, styleValue);
}
