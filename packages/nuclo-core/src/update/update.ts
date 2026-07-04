/**
 * update() – the heart of nuclo's reactivity. Re-runs every registered
 * reactive part of the page: lists, when() blocks, conditional elements,
 * function-valued attributes and text, then fires a global "update" event.
 */
import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements } from "./reactive-attributes";
import { notifyReactiveTextNodes } from "./reactive-text";
import { updateWhenRuntimes } from "../when";
import { updateConditionalElements } from "./conditional";
import { getScopeRoots } from "./scope";
import { logError } from "../shared/errors";
import type { UpdateScope } from "./scope";

// `satisfies` checks every entry matches the signature without widening the tuple type.
const updaters = [
	updateListRuntimes,
	updateWhenRuntimes,
	updateConditionalElements,
	notifyReactiveElements,
	notifyReactiveTextNodes,
	dispatchGlobalUpdateEvent,
] satisfies ReadonlyArray<(scope?: UpdateScope) => void>;

export function update(...scopeIds: string[]): void {
	let scope: UpdateScope | undefined;

	if (scopeIds.length > 0) {
		const roots = getScopeRoots(scopeIds);

		if (roots.length === 1) {
			const root = roots[0]!;
			scope = {
				roots,
				contains: (node) => root.contains(node),
			};
		} else {
			scope = {
				roots,
				contains: (node) => {
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

export function dispatchGlobalUpdateEvent(scope?: UpdateScope): void {
  if (typeof document === "undefined") return;

  // Scoped update: the event fires on the scope roots (bubbling up from
  // there), not on the whole document — listeners outside the scope's
  // ancestor chain must not observe a scoped update. An unknown scope id
  // (zero roots) dispatches nothing.
  // Unscoped: a single dispatch on body (or document as fallback) — the
  // event bubbles to document on its own; dispatching on both would run
  // document-level listeners twice.
  const targets: readonly EventTarget[] = scope
    ? scope.roots
    : [document.body ?? document];

  for (const target of targets) {
    try {
      target.dispatchEvent(new Event("update", { bubbles: true }));
    } catch (error) {
      logError("Error dispatching global update event", error);
    }
  }
}
