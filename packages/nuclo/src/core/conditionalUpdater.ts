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

function updateConditionalNode(node: Element | Comment): void {
  const conditionalInfo = getConditionalInfo(node);
  if (!conditionalInfo) return;

  const shouldShow = runCondition(conditionalInfo.condition, (error) => {
    console.error("Error evaluating conditional condition:", error);
  });
  
  const isElement = node.nodeType === Node.ELEMENT_NODE;
  const needsUpdate = (shouldShow && !isElement) || (!shouldShow && isElement);
  
  if (!needsUpdate) return;

  let newNode: Node;
  
  if (shouldShow) {
    // Create element and apply modifiers
    newNode = document.createElement(conditionalInfo.tagName);
    try {
      applyModifiers(
        newNode as ExpandedElement<ElementTagName>,
        conditionalInfo.modifiers as ReadonlyArray<NodeMod<ElementTagName> | NodeModFn<ElementTagName>>,
        0
      );
    } catch (error) {
      console.error(`Error applying modifiers in conditional element "${conditionalInfo.tagName}":`, error);
    }
  } else {
    // Create comment placeholder
    newNode = document.createComment(`conditional-${conditionalInfo.tagName}-hidden`);
  }

  // Replace node and store info
  if (node.parentNode) {
    try {
      node.parentNode.replaceChild(newNode, node);
      storeConditionalInfo(newNode, conditionalInfo);
    } catch (error) {
      console.error("Error replacing conditional node:", error);
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
    console.error("Error during conditional elements update:", error);
  }
}
