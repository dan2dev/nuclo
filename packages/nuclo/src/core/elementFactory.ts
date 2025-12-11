import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * Creates an HTML element factory with the given modifiers.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): NodeModFn<TTagName> {
  return (parent: ExpandedElement<TTagName>, index: number): ExpandedElement<TTagName> => {
    const el = document.createElement(tagName) as ExpandedElement<TTagName>;
    applyModifiers(el, modifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    return el;
  };
}

/**
 * Creates an SVG element factory with the given modifiers.
 */
function createSvgElementFactory<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  ...modifiers: Array<unknown>
): SVGElementModifierFn<TTagName> {
  return (parent, index): SVGElementTagNameMap[TTagName] => {
    const el = document.createElementNS(SVG_NAMESPACE, tagName);
    applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, index);
    return el;
  };
}

/**
 * Creates an HTML tag builder function.
 */
export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): (...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>) => NodeModFn<TTagName> {
  return (...mods) => createHtmlElementFactory(tagName, ...mods);
}

/**
 * Creates an SVG tag builder function.
 */
export function createSvgTagBuilder<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
): (...modifiers: Array<SVGElementModifier<TTagName> | SVGElementModifierFn<TTagName>>) => SVGElementModifierFn<TTagName> {
  return (...mods) => createSvgElementFactory(tagName, ...mods);
}
