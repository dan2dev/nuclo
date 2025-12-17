import { logError } from "../utility/errorHandler";
import { isNodeConnected, createTextNode } from "../utility/dom";
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
    const fallbackNode = createTextNode("");
    if (!fallbackNode) {
      throw new Error("Failed to create text node: document not available");
    }
    return fallbackNode;
  }

  let initial: unknown;
  if (arguments.length > 1) {
    initial = preEvaluated;
  } else {
    try {
      initial = resolver();
    } catch (e) {
      logError("Failed to evaluate reactive text resolver", e);
      initial = "";
    }
  }
  const str = initial === undefined ? "" : String(initial);
  const txt = createTextNode(str);
  
  if (!txt) {
    throw new Error("Failed to create text node: document not available");
  }

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
  for (const [node, info] of reactiveTextNodes) {
    if (!isNodeConnected(node)) {
      reactiveTextNodes.delete(node);
      continue;
    }

    if (scope && !scope.contains(node)) continue;

    let raw: unknown;
    try {
      raw = info.resolver();
    } catch (e) {
      logError("Failed to update reactive text node", e);
      raw = undefined;
    }

    const newVal = raw === undefined ? "" : String(raw);
    if (newVal !== info.lastValue) {
      node.textContent = newVal;
      info.lastValue = newVal;
    }
  }
}
