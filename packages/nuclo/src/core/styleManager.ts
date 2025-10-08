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
  if (!element) return;
  if (!element.style) return; // Guard against elements without style
  if (!styles) return;

  Object.entries(styles).forEach(([property, value]) => {
    if (value == null || value === '') {
      // Try both camelCase and kebab-case removal
      element.style!.removeProperty(property);
      // Also set to empty string as fallback
      (element.style as any)[property] = '';
    } else {
      try {
        (element.style as any)[property] = String(value);
      } catch {
        // Ignore invalid style properties
      }
    }
  });
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