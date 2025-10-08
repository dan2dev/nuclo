import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements, notifyReactiveTextNodes } from "./reactive";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditionalUpdater";
import { dispatchGlobalUpdateEvent } from "../utility/events";

const updaters = [
  updateListRuntimes,
  updateWhenRuntimes,
  updateConditionalElements,
  notifyReactiveElements,
  notifyReactiveTextNodes,
  dispatchGlobalUpdateEvent,
] as const;

export function update(): void {
  for (const fn of updaters) fn();
}
