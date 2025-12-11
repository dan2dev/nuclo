// @ts-nocheck
/**
 * Test helpers for creating conditional elements for testing conditionalUpdater
 * These replicate the functionality that was in conditionalRenderer but is now only
 * needed for tests since the factory no longer creates conditional elements.
 */

/// <reference path="../../types/index.d.ts" />

import { createHtmlElementWithModifiers, createSvgElementWithModifiers } from '../../src/internal/applyModifiers';
import { isBrowser } from '../../src/utility/environment';
import { storeConditionalInfo, type ConditionalInfo } from '../../src/utility/conditionalInfo';
import { createConditionalComment } from '../../src/utility/dom';

export function createHtmlConditionalElement<TTagName extends ElementTagName>(
  tagName: TTagName,
  condition: () => boolean,
  modifiers: Array<NodeMod<TTagName> | NodeModFn<TTagName>>
): ExpandedElement<TTagName> | Comment {
  const passed = condition();

  if (!isBrowser) {
    return passed
      ? createHtmlElementWithModifiers(tagName, modifiers as ReadonlyArray<any>)
      : (createConditionalComment(tagName, "ssr") as unknown as ExpandedElement<TTagName>);
  }

  const conditionalInfo: ConditionalInfo<TTagName> = { condition, tagName, modifiers, isSvg: false };

  if (passed) {
    const el = createHtmlElementWithModifiers(tagName, modifiers as ReadonlyArray<any>);
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
