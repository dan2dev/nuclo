import { findConditionalModifier } from "./modifierProcessor";
import { isBrowser } from "../utility/environment";
import { storeConditionalInfo } from "../utility/conditionalInfo";
import type { ConditionalInfo } from "../utility/conditionalInfo";
import { createHtmlElementWithModifiers, createSvgElementWithModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createConditionalComment } from "../utility/dom";

export function createHtmlConditionalElement<TTagName extends ElementTagName>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): ExpandedElement<TTagName> | Comment {
  const passed = condition();

  if (!isBrowser) {
    return passed
      ? createHtmlElementWithModifiers(tagName, modifiers as ReadonlyArray<NodeModifier<TTagName>>)
      : (createConditionalComment(tagName, "ssr") as unknown as ExpandedElement<TTagName>);
  }

  const conditionalInfo: ConditionalInfo<TTagName> = { condition, tagName, modifiers, isSvg: false };

  if (passed) {
    const el = createHtmlElementWithModifiers(tagName, modifiers as ReadonlyArray<NodeModifier<TTagName>>);
    storeConditionalInfo(el as Node, conditionalInfo);
    return el;
  }

  const comment = createConditionalComment(tagName);
  if (!comment) {
    throw new Error(`Failed to create conditional comment for ${tagName}`);
  }
  storeConditionalInfo(comment as Node, conditionalInfo);
  return comment as unknown as ExpandedElement<TTagName>;
}

export function createSvgConditionalElement<TTagName extends keyof SVGElementTagNameMap>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<unknown>
): SVGElementTagNameMap[TTagName] | Comment {
  const passed = condition();

  if (!isBrowser) {
    return passed
      ? createSvgElementWithModifiers(tagName, modifiers)
      : (createConditionalComment(tagName, "ssr") as unknown as SVGElementTagNameMap[TTagName]);
  }

  const conditionalInfo: ConditionalInfo<ElementTagName> = {
    condition,
    tagName: tagName as unknown as ElementTagName,
    modifiers: modifiers as Array<NodeMod<ElementTagName> | NodeModFn<ElementTagName>>,
    isSvg: true
  };

  if (passed) {
    const el = createSvgElementWithModifiers(tagName, modifiers);
    storeConditionalInfo(el as Node, conditionalInfo);
    return el;
  }

  const comment = createConditionalComment(tagName);
  if (!comment) {
    throw new Error(`Failed to create conditional comment for ${tagName}`);
  }
  storeConditionalInfo(comment as Node, conditionalInfo);
  return comment as unknown as SVGElementTagNameMap[TTagName];
}

export function processConditionalModifiers<TTagName extends ElementTagName>(
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): {
  condition: (() => boolean) | null;
  otherModifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>;
} {
  const conditionalIndex = findConditionalModifier(modifiers);

  if (conditionalIndex === -1) {
    return { condition: null, otherModifiers: modifiers };
  }

  return {
    condition: modifiers[conditionalIndex] as () => boolean,
    otherModifiers: modifiers.filter((_, index) => index !== conditionalIndex)
  };
}
