import {
  createHtmlElementWithModifiers,
  createSvgElementWithModifiers,
} from "../internal/applyModifiers";
import { isBrowser } from "../utility/environment";
import {
  ConditionalInfo,
  getConditionalInfo,
  storeConditionalInfo,
  getActiveConditionalNodes,
  unregisterConditionalNode,
} from "../utility/conditionalInfo";
import { runCondition } from "../utility/conditions";
import {
  replaceNodeSafely,
  createConditionalComment,
  createElement,
  createElementNS,
  SVG_NAMESPACE,
} from "../utility/dom";
import { logError } from "../utility/errorHandler";
import type { UpdateScope } from "./updateScope";

function createElementFromConditionalInfo<TTagName extends ElementTagName>(
  conditionalInfo: ConditionalInfo<TTagName>,
): ExpandedElement<TTagName> | SVGElement {
  try {
    if (conditionalInfo.isSvg) {
      // `tagName: TTagName` is an HTMLElement tag literal at the type level,
      // but conditionalInfo.isSvg === true signals the caller already knows
      // it is an SVG tag. The SVG factory validates at runtime.
      return createSvgElementWithModifiers(
        conditionalInfo.tagName as keyof SVGElementTagNameMap,
        conditionalInfo.modifiers,
      );
    }
    return createHtmlElementWithModifiers(
      conditionalInfo.tagName,
      conditionalInfo.modifiers,
    );
  } catch (error) {
    logError(
      `Error applying modifiers in conditional element "${conditionalInfo.tagName}"`,
      error,
    );
    // Return a basic element without modifiers as fallback
    if (conditionalInfo.isSvg) {
      const el = createElementNS(
        SVG_NAMESPACE,
        conditionalInfo.tagName as keyof SVGElementTagNameMap,
      );
      if (!el) {
        throw new Error(
          `Failed to create SVG element: ${conditionalInfo.tagName}`,
          { cause: error },
        );
      }
      return el;
    }
    const el = createElement(conditionalInfo.tagName);
    if (!el) {
      throw new Error(`Failed to create element: ${conditionalInfo.tagName}`, {
        cause: error,
      });
    }
    return el;
  }
}

function updateConditionalNode(node: Node): void {
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
    storeConditionalInfo(element, conditionalInfo);
    replaceNodeSafely(node, element);
  } else if (!shouldShow && isElement) {
    const comment = createConditionalComment(conditionalInfo.tagName);
    if (comment) {
      storeConditionalInfo(comment, conditionalInfo);
      replaceNodeSafely(node, comment);
    }
  }
}

export function updateConditionalElements(scope?: UpdateScope): void {
  if (!isBrowser) return;

  try {
    const nodes = getActiveConditionalNodes();
    for (const node of nodes) {
      if (!node.isConnected) {
        unregisterConditionalNode(node);
        continue;
      }

      if (scope && !scope.contains(node)) continue;
      updateConditionalNode(node);
    }
  } catch (error) {
    logError("Error during conditional elements update", error);
  }
}
