import { isFunction } from "../shared/type-guards";
import { registerAttributeResolver } from "../update/reactive-attributes";
import { setStyleProperty } from "../shared/dom";
import { logError } from "../shared/errors";

type StyleAssignment = CSSStyleObject;
type StyleResolver = () => StyleAssignment | null | undefined;

/**
 * Simplified style management - basic functionality with minimal overhead
 */
export function assignInlineStyles<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styles: StyleAssignment | null | undefined,
): void {
  if (!element?.style || !styles) return;

  for (const property in styles) {
    const success = setStyleProperty(
      element as HTMLElement,
      property,
      (styles as Record<string, string | number | null>)[property]
    );

    if (!success) {
      // Don't try to stringify value in error message as it might throw
      logError(`Failed to set style property '${property}'`);
    }
  }
}

export function applyStyleAttribute<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styleValue: StyleAssignment | StyleResolver | null | undefined
): void {
  if (!element) return;

  if (isFunction(styleValue)) {
    registerAttributeResolver(element, 'style', styleValue, function(resolvedStyles) {
      assignInlineStyles(element, resolvedStyles as StyleAssignment);
    });
  } else {
    assignInlineStyles(element, styleValue);
  }
}
