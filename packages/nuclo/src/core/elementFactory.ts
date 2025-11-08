import { createConditionalElement, processConditionalModifiers } from "./conditionalRenderer";
import { applyModifiers, type NodeModifier } from "../internal/applyModifiers";
import { SVG_TAGS } from "./tagRegistry";

/**
 * Checks if a tag name is an SVG tag.
 */
function isSVGTag(tagName: string): tagName is keyof SVGElementTagNameMap {
  return (SVG_TAGS as readonly string[]).includes(tagName);
}

/**
 * Creates an element with proper namespace handling for SVG elements.
 */
function createElementWithNamespace<TTagName extends ElementTagName>(
  tagName: TTagName
): Element {
  if (isSVGTag(tagName)) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }
  return document.createElement(tagName);
}

export function createElementFactory<TTagName extends ElementTagName>(
  tagName: TTagName,
  ...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): NodeModFn<TTagName> {
  return (parent: ExpandedElement<TTagName>, index: number): ExpandedElement<TTagName> => {
    const { condition, otherModifiers } = processConditionalModifiers(modifiers);

    if (condition) {
      return createConditionalElement(tagName, condition, otherModifiers) as ExpandedElement<TTagName>;
    }

    const el = createElementWithNamespace(tagName) as ExpandedElement<TTagName>;
    applyModifiers(el, otherModifiers as ReadonlyArray<NodeModifier<TTagName>>, index);
    return el;
  };
}

export function createTagBuilder<TTagName extends ElementTagName>(
  tagName: TTagName,
): (...modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>) => NodeModFn<TTagName> {
  return (...mods) => createElementFactory(tagName, ...mods);
}