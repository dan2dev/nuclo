import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../utility/dom";
import { claimElement, cleanupUnclaimedChildren } from "../hydration/context";

/**
 * Factory shape shared by HTML and SVG branches.
 * Captures `tagName` + `modifiers` in closure; each call either claims a hydration
 * target or creates a fresh element, then applies the pre-bound modifier list.
 *
 * Split hot path (no parent) vs. claim path so the common case has zero branching
 * on hydration internals.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  const mods = modifiers as ReadonlyArray<NodeModifier<TTagName>>;

  return function (
    _parent?: ExpandedElement<TTagName>,
    index = 0,
  ): ExpandedElement<TTagName> {
    if (_parent) {
      const parentNode = _parent as unknown as Node;
      const claimed = claimElement(
        parentNode,
        tagName,
      ) as ExpandedElement<TTagName> | null;
      if (claimed) {
        const elNode = claimed as unknown as Node;
        const initialChildCount = elNode.childNodes.length;
        applyModifiers(claimed, mods, index);
        cleanupUnclaimedChildren(elNode, initialChildCount);
        return claimed;
      }
    }
    const el = createElement(tagName) as ExpandedElement<TTagName>;
    applyModifiers(el, mods, index);
    return el;
  } as DetachedExpandedElementFactory<TTagName>;
}

function createSvgElementFactory<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  ...modifiers: Array<unknown>
): DetachedSVGElementFactory<TTagName> {
  const mods = modifiers as ReadonlyArray<NodeModifier<ElementTagName>>;

  return function (_parent?, index = 0): SVGElementTagNameMap[TTagName] {
    if (_parent) {
      const parentNode = _parent as unknown as Node;
      const claimed = claimElement(
        parentNode,
        tagName,
      ) as ExpandedElement | null;
      if (claimed) {
        const elNode = claimed as unknown as Node;
        const initialChildCount = elNode.childNodes.length;
        applyModifiers(
          claimed as unknown as ExpandedElement<ElementTagName>,
          mods,
          index,
        );
        cleanupUnclaimedChildren(elNode, initialChildCount);
        return claimed as unknown as SVGElementTagNameMap[TTagName];
      }
    }
    const created = createElementNS(SVG_NAMESPACE, tagName);
    if (!created) {
      throw new Error(`Failed to create SVG element: ${tagName}`);
    }
    applyModifiers(
      created as unknown as ExpandedElement<ElementTagName>,
      mods,
      index,
    );
    return created as unknown as SVGElementTagNameMap[TTagName];
  } as DetachedSVGElementFactory<TTagName>;
}

export function createHtmlTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): ExpandedElementBuilder<TTagName> {
  return (...mods) => createHtmlElementFactory(tagName, ...mods);
}

export function createSvgTagBuilder<
  TTagName extends keyof SVGElementTagNameMap,
>(tagName: TTagName): ExpandedSVGElementBuilder<TTagName> {
  return (...mods) => createSvgElementFactory(tagName, ...mods);
}
