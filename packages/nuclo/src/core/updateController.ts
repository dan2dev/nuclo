import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements, notifyReactiveTextNodes } from "./reactive";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditionalUpdater";
import { dispatchGlobalUpdateEvent } from "../utility/events";
import { getGroupRoots } from "../utility/group";
import type { UpdateScope } from "./updateScope";

const updaters: ReadonlyArray<(scope?: UpdateScope) => void> = [
  updateListRuntimes,
  updateWhenRuntimes,
  updateConditionalElements,
  notifyReactiveElements,
  notifyReactiveTextNodes,
  dispatchGlobalUpdateEvent,
] as const;

export function update(...groupIds: string[]): void {
  const roots = groupIds.length > 0 ? getGroupRoots(groupIds) : [];
  const scope: UpdateScope | undefined =
    groupIds.length > 0
      ? {
          roots,
          contains: (node) => roots.some((root) => root.contains(node)),
        }
      : undefined;

  for (const fn of updaters) fn(scope);
}
