import { logError } from "../shared/errors";
import { membersOf, TEXT_KIND, type UpdateScope } from "./scope";
import { reactiveTextNodes, reactiveTextNodesByNode, registerReactiveTextNode, type TextResolver } from "./registry";
import { isBrowser } from "../shared/environment";
import { isSerializing } from "../shared/serializing";

/** DSL text semantics: nullish and non-primitive values render as "". */
export function toText(value: unknown) {
  return value == null || typeof value === "object" || typeof value === "function" ? "" : String(value);
}

/**
 * Creates a text node showing `initial` (the resolver's already-evaluated
 * value) and registers it so every update() re-evaluates `resolver` into it.
 */
export function createReactiveTextNode(resolver: TextResolver, initial: unknown): Text {
  const str = toText(initial);
  const txt = document.createTextNode(str);
  if (isBrowser && !isSerializing()) registerReactiveTextNode(txt, resolver, str);
  return txt;
}

/**
 * Re-evaluates every registered reactive text node (under `scope`'s roots,
 * if given) and writes the ones whose text changed. Disconnected and
 * collected nodes are pruned as the pass goes.
 */
export function notifyReactiveTextNodes(scope?: UpdateScope) {
  if (!scope) return notifyTextSet(reactiveTextNodes);
  for (const root of scope.roots) notifyTextSet(membersOf(root, TEXT_KIND) as Set<WeakRef<Text>>);
}

function notifyTextSet(set: Set<WeakRef<Text>>) {
  for (const ref of set) {
    const node = ref.deref();
    const entry = node && reactiveTextNodesByNode.get(node);
    // A scope member whose node was unregistered and registered again is
    // stale: its live entry carries a newer ref.
    if (!entry || entry.ref !== ref || !node.isConnected) {
      if (entry && entry.ref === ref) reactiveTextNodesByNode.delete(node);
      set.delete(ref);
      reactiveTextNodes.delete(ref);
      continue;
    }

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
