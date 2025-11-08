import { findConditionalModifier } from "./modifierProcessor";
import { isBrowser } from "../utility/environment";
import { storeConditionalInfo } from "../utility/conditionalInfo";
import type { ConditionalInfo } from "../utility/conditionalInfo";
import { createElementWithModifiers, type NodeModifier } from "../internal/applyModifiers";
import { createConditionalComment } from "../utility/dom";

export function createConditionalElement<TTagName extends ElementTagName>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): ExpandedElement<TTagName> | Comment {
  const passed = condition();

  if (!isBrowser) {
    return passed
      ? createElementWithModifiers(tagName, modifiers as ReadonlyArray<NodeModifier<TTagName>>)
      : (createConditionalComment(tagName, "ssr") as unknown as ExpandedElement<TTagName>);
  }

  const conditionalInfo: ConditionalInfo<TTagName> = { condition, tagName, modifiers };

  if (passed) {
    const el = createElementWithModifiers(tagName, modifiers as ReadonlyArray<NodeModifier<TTagName>>);
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
