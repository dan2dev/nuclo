import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements, notifyReactiveTextNodes } from "./reactive";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditionalUpdater";
import { dispatchGlobalUpdateEvent } from "../utility/events";
import { getScopeRoots } from "../utility/scope";
import type { UpdateScope } from "./updateScope";

const updaters: ReadonlyArray<(scope?: UpdateScope) => void> = [
  updateListRuntimes,
  updateWhenRuntimes,
  updateConditionalElements,
  notifyReactiveElements,
  notifyReactiveTextNodes,
  dispatchGlobalUpdateEvent,
] as const;

export function update(...scopeIds: string[]): void {
  let scope: UpdateScope | undefined;
  if (scopeIds.length > 0) {
    const roots = getScopeRoots(scopeIds);

    if (roots.length === 1) {
      const root = roots[0]!;
      scope = { 
        roots, 
        contains: function(node) { 
          return root.contains(node);
        }
      };
    } else {
      scope = {
        roots,
        contains: function(node) {
          for (const root of roots) {
            if (root.contains(node)) return true;
          }
          return false;
        },
      };
    }
  }

  for (const fn of updaters) fn(scope);
}
