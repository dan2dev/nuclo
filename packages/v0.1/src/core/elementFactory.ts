import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../utility/dom";
import { isHydrating, claimChild } from "../hydration/context";

/**
 * Creates an HTML element factory with the given modifiers.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  return function(_parent?: ExpandedElement<TTagName>, index = 0): ExpandedElement<TTagName> {
    let el: ExpandedElement<TTagName> | null = null;
    if (isHydrating() && _parent) {
      const claimed = claimChild(_parent as unknown as Node);
      if (claimed && claimed.nodeType === 1 && (claimed as Element).tagName.toLowerCase() === tagName) {
        el = claimed as ExpandedElement<TTagName>;
      }
    }
    if (!el) {
      el = createElement(tagName) as ExpandedElement<TTagName>;
    }
    applyModifiers(el, modifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    return el;
  } as DetachedExpandedElementFactory<TTagName>;
}

/**
 * Creates an SVG element factory with the given modifiers.
 */
function createSvgElementFactory<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  ...modifiers: Array<unknown>
): DetachedSVGElementFactory<TTagName> {
  return function(_parent?, index = 0): SVGElementTagNameMap[TTagName] {
    let el: ExpandedElement | null = null;
    if (isHydrating() && _parent) {
      const claimed = claimChild(_parent as unknown as Node);
      if (claimed && claimed.nodeType === 1 && (claimed as Element).tagName.toLowerCase() === tagName) {
        el = claimed as ExpandedElement;
      }
    }
    if (!el) {
      el = createElementNS(SVG_NAMESPACE, tagName);
      if (!el) {
        throw new Error(`Failed to create SVG element: ${tagName}`);
      }
    }
    applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, index);
    return el as unknown as SVGElementTagNameMap[TTagName];
  } as DetachedSVGElementFactory<TTagName>;
}

/**
 * Creates an HTML tag builder function.
 */
export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): ExpandedElementBuilder<TTagName> {
  return (...mods) => createHtmlElementFactory(tagName, ...mods);
}

/**
 * Creates an SVG tag builder function.
 */
export function createSvgTagBuilder<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
): ExpandedSVGElementBuilder<TTagName> {
  return (...mods) => createSvgElementFactory(tagName, ...mods);
}
