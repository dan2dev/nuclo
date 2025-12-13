import { logError, safeExecute } from "../utility/errorHandler";
import { isNodeConnected } from "../utility/dom";
import type { UpdateScope } from "./updateScope";

type TextResolver = () => Primitive;

interface ReactiveTextNodeInfo {
  resolver: TextResolver;
  lastValue: string;
}

const reactiveTextNodes = new Map<Text, ReactiveTextNodeInfo>();

/**
 * Creates a reactive text node that automatically updates when its resolver function changes.
 *
 * The text node will be registered for reactive updates and its content will be synchronized
 * whenever notifyReactiveTextNodes() is called.
 *
 * @param resolver - Function that returns the text content (string, number, boolean, etc.)
 * @param preEvaluated - Optional pre-evaluated value to avoid calling resolver immediately
 * @returns A Text node that will reactively update its content
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const textNode = createReactiveTextNode(() => `Count: ${count.value}`);
 * // Later, when count changes and notifyReactiveTextNodes() is called,
 * // the text content automatically updates
 * ```
 */
export function createReactiveTextNode(resolver: TextResolver, preEvaluated?: unknown): Text | DocumentFragment {
  if (typeof resolver !== "function") {
    logError("Invalid resolver provided to createReactiveTextNode");
    return document.createTextNode("");
  }

  const initial = arguments.length > 1 ? preEvaluated : safeExecute(resolver, "");
  const str = initial === undefined ? "" : String(initial);
  const txt = document.createTextNode(str);

  reactiveTextNodes.set(txt, { resolver, lastValue: str });
  return txt;
}

/**
 * Updates all registered reactive text nodes.
 *
 * Iterates through all reactive text nodes, re-evaluates their resolver functions,
 * and updates their content if it has changed. Automatically cleans up disconnected nodes.
 *
 * This function should be called after state changes to synchronize the DOM with application state.
 *
 * @example
 * ```ts
 * // After updating application state
 * count.value++;
 * notifyReactiveTextNodes(); // All reactive text nodes update
 * ```
 */
export function notifyReactiveTextNodes(scope?: UpdateScope): void {
  reactiveTextNodes.forEach((info, node) => {
    if (!isNodeConnected(node)) {
      reactiveTextNodes.delete(node);
      return;
    }

    if (scope && !scope.contains(node)) return;
    try {
      const raw = safeExecute(info.resolver);
      const newVal = raw === undefined ? "" : String(raw);
      if (newVal !== info.lastValue) {
        node.textContent = newVal;
        info.lastValue = newVal;
      }
    } catch (e) {
      logError("Failed to update reactive text node", e);
    }
  });
}
