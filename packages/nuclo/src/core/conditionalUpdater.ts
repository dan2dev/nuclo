import { createHtmlElementWithModifiers, createSvgElementWithModifiers } from "../internal/applyModifiers";
import { isBrowser } from "../utility/environment";
import {
  ConditionalInfo,
  getConditionalInfo,
  storeConditionalInfo,
  getActiveConditionalNodes,
  unregisterConditionalNode,
} from "../utility/conditionalInfo";
import { runCondition } from "../utility/conditions";
import { replaceNodeSafely, createConditionalComment } from "../utility/dom";
import { logError } from "../utility/errorHandler";

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createElementFromConditionalInfo<TTagName extends ElementTagName>(
  conditionalInfo: ConditionalInfo<TTagName>
): ExpandedElement<TTagName> | SVGElement {
  try {
    if (conditionalInfo.isSvg) {
      return createSvgElementWithModifiers(conditionalInfo.tagName as keyof SVGElementTagNameMap, conditionalInfo.modifiers);
    }
    return createHtmlElementWithModifiers(conditionalInfo.tagName, conditionalInfo.modifiers);
  } catch (error) {
    logError(`Error applying modifiers in conditional element "${conditionalInfo.tagName}"`, error);
    // Return a basic element without modifiers as fallback
    if (conditionalInfo.isSvg) {
      return document.createElementNS(SVG_NAMESPACE, conditionalInfo.tagName);
    }
    return document.createElement(conditionalInfo.tagName) as ExpandedElement<TTagName>;
  }
}

function updateConditionalNode(node: Element | Comment): void {
  const conditionalInfo = getConditionalInfo(node);
  if (!conditionalInfo) {
    return;
  }

  const shouldShow = runCondition(conditionalInfo.condition, (error) => {
    logError("Error evaluating conditional condition", error);
  });
  const isElement = node.nodeType === Node.ELEMENT_NODE;

  if (shouldShow && !isElement) {
    const element = createElementFromConditionalInfo(conditionalInfo);
    storeConditionalInfo(element as Node, conditionalInfo);
    replaceNodeSafely(node, element as Node);
  } else if (!shouldShow && isElement) {
    const comment = createConditionalComment(conditionalInfo.tagName);
    if (comment) {
      storeConditionalInfo(comment, conditionalInfo);
      replaceNodeSafely(node, comment);
    }
  }
}

export function updateConditionalElements(): void {
  if (!isBrowser) return;

  try {
    getActiveConditionalNodes().forEach((node) => {
      if (!node.isConnected) {
        unregisterConditionalNode(node);
        return;
      }
      updateConditionalNode(node as Element | Comment);
    });
  } catch (error) {
    logError("Error during conditional elements update", error);
  }
}
