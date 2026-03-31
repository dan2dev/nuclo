import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../utility/dom";
import { isHydrating, claimChild, getCursor } from "../hydration/context";

/**
 * Creates an HTML element factory with the given modifiers.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  return function(_parent?: ExpandedElement<TTagName>, index = 0): ExpandedElement<TTagName> {
    let el: ExpandedElement<TTagName> | null = null;
    let claimed = false;
    if (isHydrating() && _parent) {
      const parentNode = _parent as unknown as Node;
      const candidate = parentNode.childNodes[getCursor(parentNode)];
      if (candidate && candidate.nodeType === 1 && (candidate as Element).tagName.toLowerCase() === tagName) {
        el = claimChild(parentNode) as ExpandedElement<TTagName>;
        claimed = true;
      }
    }
    if (!el) {
      el = createElement(tagName) as ExpandedElement<TTagName>;
    }
    const elNode = el as unknown as Node;
    const initialChildCount = claimed ? elNode.childNodes.length : 0;
    applyModifiers(el, modifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    if (claimed) {
      const cursorAfter = getCursor(elNode);
      for (let i = cursorAfter; i < initialChildCount; i++) {
        const child = elNode.childNodes[cursorAfter];
        if (child) elNode.removeChild(child);
      }
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
    let el: ExpandedElement | null = null;
    let claimed = false;
    if (isHydrating() && _parent) {
      const parentNode = _parent as unknown as Node;
      const candidate = parentNode.childNodes[getCursor(parentNode)];
      if (candidate && candidate.nodeType === 1 && (candidate as Element).tagName.toLowerCase() === tagName) {
        el = claimChild(parentNode) as ExpandedElement;
        claimed = true;
      }
    }
    if (!el) {
      el = createElementNS(SVG_NAMESPACE, tagName);
      if (!el) {
        throw new Error(`Failed to create SVG element: ${tagName}`);
      }
    }
    const elNode = el as unknown as Node;
    const initialChildCount = claimed ? elNode.childNodes.length : 0;
    applyModifiers(el as unknown as ExpandedElement<ElementTagName>, modifiers as ReadonlyArray<NodeModifier<ElementTagName>>, index);
    if (claimed) {
      const cursorAfter = getCursor(elNode);
      for (let i = cursorAfter; i < initialChildCount; i++) {
        const child = elNode.childNodes[cursorAfter];
        if (child) elNode.removeChild(child);
      }
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
