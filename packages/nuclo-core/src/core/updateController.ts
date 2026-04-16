import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements } from "./reactiveAttributes";
import { notifyReactiveTextNodes } from "./reactiveText";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditionalUpdater";
import { dispatchGlobalUpdateEvent } from "../utility/events";
import { getScopeRoots } from "../utility/scope";
import type { UpdateScope } from "./updateScope";

/**
 * Scope implementation as a class instead of a per-call closure.
 * Avoids allocating a fresh `contains` function every `update()` tick.
 */
class PipelineScope implements UpdateScope {
  readonly roots: ReadonlyArray<Element>;
  constructor(roots: ReadonlyArray<Element>) {
    this.roots = roots;
  }
  contains(node: Node): boolean {
    const roots = this.roots;
    // Single-root fast path is the common case for `update("id")`.
    if (roots.length === 1) return roots[0]!.contains(node);
    for (let i = 0, n = roots.length; i < n; i++) {
      if (roots[i]!.contains(node)) return true;
    }
    return false;
  }
}

function buildScope(scopeIds: string[]): UpdateScope | undefined {
  const roots = getScopeRoots(scopeIds);
  return roots.length === 0 ? undefined : new PipelineScope(roots);
}

/**
 * Synchronously drains the 6-stage update pipeline.
 *
 *  1. list runtimes  →  2. when runtimes  →  3. conditional elements
 *  4. reactive attributes  →  5. reactive text  →  6. global "update" event
 *
 * Passing one or more scope ids confines the pipeline to those subtrees.
 */
export function update(...scopeIds: string[]): void {
  const scope = scopeIds.length === 0 ? undefined : buildScope(scopeIds);
  // Inline ordering avoids the satisfies-tuple iteration overhead and keeps
  // the call sequence inspectable in stack traces.
  updateListRuntimes(scope);
  updateWhenRuntimes(scope);
  updateConditionalElements(scope);
  notifyReactiveElements(scope);
  notifyReactiveTextNodes(scope);
  dispatchGlobalUpdateEvent();
}
