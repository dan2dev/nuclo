import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createElement, createElementNS, SVG_NAMESPACE } from "../utility/dom";
import { claimElement, cleanupUnclaimedChildren } from "../hydration/context";

/**
 * Factory shape shared by HTML and SVG branches.
 * Captures `tagName` + `modifiers` in closure; each call either claims a
 * hydration target or creates a fresh element, then applies the pre-bound
 * modifier list.
 *
 * Split hot path (no parent) vs. claim path so the common case has zero
 * branching on hydration internals.
 *
 * @template TTagName Tag literal key of `HTMLElementTagNameMap`.
 */
function createHtmlElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: ReadonlyArray<NodeModLike<TTagName>>
): DetachedExpandedElementFactory<TTagName> {
  const mods = modifiers as ReadonlyArray<NodeModifier<TTagName>>;

  const factory = (
    _parent?: ExpandedElement<TTagName>,
    index = 0,
  ): ExpandedElement<TTagName> => {
    if (_parent) {
      const claimed = claimElement(_parent, tagName);
      if (claimed) {
        const initialChildCount = claimed.childNodes.length;
        applyModifiers(claimed, mods, index);
        cleanupUnclaimedChildren(claimed, initialChildCount);
        return claimed;
      }
    }
    const el = createElement(tagName);
    if (!el) {
      throw new Error(`Failed to create HTML element: ${tagName}`);
    }
    applyModifiers(el, mods, index);
    return el;
  };

  return factory satisfies DetachedExpandedElementFactory<TTagName>;
}

/**
 * SVG elements share the `applyModifiers` pipeline with HTML elements — the
 * pipeline only uses structural operations (`appendChild`, child reads) that
 * every `Element` supports. Centralising the HTML-typed bridge here keeps
 * the single `as unknown as` erasure out of the factory body.
 *
 * @template TTagName SVG tag literal.
 */
function applySvgModifiers<TTagName extends keyof SVGElementTagNameMap>(
  element: SVGElementTagNameMap[TTagName],
  modifiers: ReadonlyArray<NodeModifier<ElementTagName>>,
  index: number,
): void {
  applyModifiers(
    element as unknown as ExpandedElement<ElementTagName>,
    modifiers,
    index,
  );
}

/**
 * SVG counterpart of {@link createHtmlElementFactory}.
 *
 * Unlike the HTML factory, the SVG modifier list is typed as
 * `SVGElementModifierLike<TTagName>` so the tag literal narrows what
 * modifiers and attribute bags are accepted. Internally we funnel through
 * {@link applySvgModifiers}, which performs the single HTML/SVG type bridge.
 *
 * @template TTagName Tag literal key of `SVGElementTagNameMap`.
 */
function createSvgElementFactory<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  ...modifiers: ReadonlyArray<SVGElementModifierLike<TTagName>>
): DetachedSVGElementFactory<TTagName> {
  // SVG modifiers travel through the same pipeline as HTML modifiers; the
  // pipeline treats them structurally and ignores the tag-specific event
  // surface, so this single erasure is safe.
  const mods = modifiers as unknown as ReadonlyArray<
    NodeModifier<ElementTagName>
  >;

  const factory = (
    _parent?: SVGElementTagNameMap[TTagName] | ExpandedElement<ElementTagName>,
    index = 0,
  ): SVGElementTagNameMap[TTagName] => {
    if (_parent) {
      const claimed = claimElement(_parent, tagName);
      if (claimed) {
        const initialChildCount = claimed.childNodes.length;
        applySvgModifiers(claimed, mods, index);
        cleanupUnclaimedChildren(claimed, initialChildCount);
        return claimed;
      }
    }
    const created = createElementNS(SVG_NAMESPACE, tagName);
    if (!created) {
      throw new Error(`Failed to create SVG element: ${tagName}`);
    }
    applySvgModifiers(created, mods, index);
    return created;
  };

  return factory satisfies DetachedSVGElementFactory<TTagName>;
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
