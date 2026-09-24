import { isFunction } from "../shared/type-guards";
import { registerAttributeResolver } from "../update/reactive-attributes";
import { logError } from "../shared/errors";

type StyleAssignment = CSSStyleObject;
type StyleResolver = () => StyleAssignment | null | undefined;

/**
 * Assigns each property of `styles` to the element's inline style (camelCase
 * or kebab-case keys); null, undefined and "" remove the property.
 */
export function assignInlineStyles<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styles: StyleAssignment | null | undefined,
): void {
  const style = element.style as unknown as Record<string, string> | undefined;
  if (!style || !styles) return;

  for (const property in styles) {
    const value = (styles as Record<string, unknown>)[property];
    try {
      style[property] = value == null ? "" : String(value);
    } catch {
      // Don't stringify the value in the message: that may be what threw.
      logError(`Failed to set style property '${property}'`);
    }
  }
}

function applyReactiveStyle(element: Element, _key: string, styles: unknown): void {
  assignInlineStyles(element as unknown as ExpandedElement, styles as StyleAssignment | null | undefined);
}

export function applyStyleAttribute<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  styleValue: StyleAssignment | StyleResolver | null | undefined
): void {
  if (isFunction(styleValue)) {
    registerAttributeResolver(element, 'style', styleValue, applyReactiveStyle);
  } else {
    assignInlineStyles(element, styleValue);
  }
}
