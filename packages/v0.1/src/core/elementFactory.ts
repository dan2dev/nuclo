import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../utility/dom";
import { claimElement, cleanupUnclaimedChildren } from "../hydration/context";

/**
 * Creates an HTML element factory with the given modifiers.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  return function(_parent?: ExpandedElement<TTagName>, index = 0): ExpandedElement<TTagName> {
    const parentNode = _parent as unknown as Node | undefined;
    const claimed = parentNode ? claimElement(parentNode, tagName) as ExpandedElement<TTagName> | null : null;
    const el = claimed ?? createElement(tagName) as ExpandedElement<TTagName>;
    const elNode = el as unknown as Node;
    const initialChildCount = claimed ? elNode.childNodes.length : 0;
    applyModifiers(el, modifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    if (claimed) {
      cleanupUnclaimedChildren(elNode, initialChildCount);
    }
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
    const parentNode = _parent as unknown as Node | undefined;
    const claimed = parentNode ? claimElement(parentNode, tagName) as ExpandedElement | null : null;
    let el: ExpandedElement;
    if (claimed) {
      el = claimed;
    } else {
      const created = createElementNS(SVG_NAMESPACE, tagName);
      if (!created) {
        throw new Error(`Failed to create SVG element: ${tagName}`);
      }
      el = created;
    }
    const elNode = el as unknown as Node;
    const initialChildCount = claimed ? elNode.childNodes.length : 0;
    applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, index);
    if (claimed) {
      cleanupUnclaimedChildren(elNode, initialChildCount);
    }
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
