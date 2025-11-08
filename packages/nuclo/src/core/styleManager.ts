import { isFunction } from "../utility/typeGuards";
import { registerAttributeResolver } from "./reactive";
import { setStyleProperty } from "../utility/domTypeHelpers";
import { logError } from "../utility/errorHandler";

type StyleAssignment = Partial<CSSStyleDeclaration>;
type StyleResolver = () => StyleAssignment | null | undefined;

/**
 * Simplified style management - basic functionality with minimal overhead
 */
export function assignInlineStyles<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styles: StyleAssignment | null | undefined,
): void {
  if (!element?.style || !styles) return;

  for (const [property, value] of Object.entries(styles)) {
    const success = setStyleProperty(
      element as HTMLElement,
      property,
      value as string | number | null
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
    registerAttributeResolver(element, 'style', () => {
      try {
        return styleValue();
      } catch (error) {
        logError('Error in style resolver function', error);
        return null;
      }
    }, (resolvedStyles) => {
      assignInlineStyles(element, resolvedStyles as StyleAssignment);
    });
  } else {
    assignInlineStyles(element, styleValue);
  }
}