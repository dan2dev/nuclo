import { logError } from "../shared/errors";
import type { UpdateScope } from "./scope";
import { reactiveTextNodes, reactiveTextNodesByNode, registerReactiveTextNode, type TextResolver } from "./registry";
import { isBrowser } from "../shared/environment";

/** DSL text semantics: nullish and non-primitive values render as "". */
export function toText(value: unknown): string {
  return value == null || typeof value === "object" || typeof value === "function" ? "" : String(value);
}

/**
 * Creates a text node showing `initial` (the resolver's already-evaluated
 * value) and registers it so every update() re-evaluates `resolver` into it.
 */
export function createReactiveTextNode(resolver: TextResolver, initial: unknown): Text {
  const str = toText(initial);
  const txt = document.createTextNode(str);
  if (isBrowser) registerReactiveTextNode(txt, resolver, str);
  return txt;
}

/**
 * Re-evaluates every registered reactive text node (in `scope`, if given) and
 * writes the ones whose text changed. Disconnected and collected nodes are
 * pruned as the pass goes.
 */
export function notifyReactiveTextNodes(scope?: UpdateScope): void {
  for (const ref of reactiveTextNodes) {
    const node = ref.deref();
    const entry = node && reactiveTextNodesByNode.get(node);
    if (!entry || !node.isConnected) {
      if (node) reactiveTextNodesByNode.delete(node);
      reactiveTextNodes.delete(ref);
      continue;
    }

    if (scope && !scope.contains(node)) continue;

    let value: string;
    try {
      value = toText(entry.resolver());
    } catch (e) {
      logError("Failed to update reactive text node", e);
      value = "";
    }
    if (value !== entry.lastValue) {
      node.textContent = value;
      entry.lastValue = value;
    }
  }
}
