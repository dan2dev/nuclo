import { isFunction } from "../utility/typeGuards";
import { registerAttributeResolver } from "./reactive";

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
    if (value == null || value === '') {
      element.style.removeProperty(property);
      (element.style as unknown as Record<string, string>)[property] = '';
    } else {
      try {
        (element.style as unknown as Record<string, string>)[property] = String(value);
      } catch {
        // Ignore invalid style properties
      }
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
      } catch {
        return null;
      }
    }, (resolvedStyles) => {
      assignInlineStyles(element, resolvedStyles as StyleAssignment);
    });
  } else {
    assignInlineStyles(element, styleValue);
  }
}