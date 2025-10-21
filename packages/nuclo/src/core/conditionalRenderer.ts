import { findConditionalModifier } from "./modifierProcessor";
import { isBrowser } from "../utility/environment";
import { storeConditionalInfo } from "../utility/conditionalInfo";
import type { ConditionalInfo } from "../utility/conditionalInfo";
import { applyModifiers } from "../internal/applyModifiers";

export function createConditionalElement<TTagName extends ElementTagName>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): ExpandedElement<TTagName> | Comment {
  const passed = condition();
  const conditionalInfo: ConditionalInfo = { condition, tagName, modifiers };

  if (passed) {
    const element = document.createElement(tagName) as ExpandedElement<TTagName>;
    applyModifiers(element, modifiers, 0);
    if (isBrowser) storeConditionalInfo(element as Node, conditionalInfo);
    return element;
  }

  const comment = document.createComment(`conditional-${tagName}-${isBrowser ? 'hidden' : 'ssr'}`);
  if (isBrowser) storeConditionalInfo(comment, conditionalInfo);
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
