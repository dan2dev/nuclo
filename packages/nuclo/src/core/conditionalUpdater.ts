import { applyModifiers } from "../internal/applyModifiers";
import { isBrowser } from "../utility/environment";
import {
  ConditionalInfo,
  getConditionalInfo,
  storeConditionalInfo,
  getActiveConditionalNodes,
  unregisterConditionalNode,
} from "../utility/conditionalInfo";
import { runCondition } from "../utility/conditions";

function createElementFromConditionalInfo<TTagName extends ElementTagName>(
  conditionalInfo: ConditionalInfo<TTagName>
): ExpandedElement<TTagName> {
  const element = document.createElement(conditionalInfo.tagName) as ExpandedElement<TTagName>;

  try {
    applyModifiers(element, conditionalInfo.modifiers, 0);
  } catch (error) {
    console.error(`Error applying modifiers in conditional element "${conditionalInfo.tagName}":`, error);
  }
  return element;
}

function createCommentPlaceholder<TTagName extends ElementTagName>(
  conditionalInfo: ConditionalInfo<TTagName>
): Comment {
  return document.createComment(`conditional-${conditionalInfo.tagName}-hidden`);
}

function replaceNodeSafely(oldNode: Node, newNode: Node): void {
  if (oldNode.parentNode) {
    try {
      oldNode.parentNode.replaceChild(newNode, oldNode);
    } catch (error) {
      console.error("Error replacing conditional node:", error);
    }
  }
}

function updateConditionalNode(node: Element | Comment): void {
  const conditionalInfo = getConditionalInfo(node);
  if (!conditionalInfo) {
    return;
  }

  const shouldShow = runCondition(conditionalInfo.condition, (error) => {
    console.error("Error evaluating conditional condition:", error);
  });
  const isElement = node.nodeType === Node.ELEMENT_NODE;

  if (shouldShow && !isElement) {
    const element = createElementFromConditionalInfo(conditionalInfo);
    storeConditionalInfo(element as Node, conditionalInfo);
    replaceNodeSafely(node, element as Node);
  } else if (!shouldShow && isElement) {
    const comment = createCommentPlaceholder(conditionalInfo);
    storeConditionalInfo(comment, conditionalInfo);
    replaceNodeSafely(node, comment);
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
    console.error("Error during conditional elements update:", error);
  }
}
