/**
 * update() – the heart of nuclo's reactivity. Re-runs every registered
 * reactive part of the page: lists, when() blocks, function-valued
 * attributes and text.
 */
import { updateListRuntimes } from "../list/runtime";
import { notifyReactiveElements } from "./reactive-attributes";
import { notifyReactiveTextNodes } from "./reactive-text";
import { updateWhenRuntimes } from "../when";
import { getScopeRoots } from "./scope";
import { flushMountQueue } from "../element/lifecycle";
import type { UpdateScope } from "./scope";

// `satisfies` checks every entry matches the signature without widening the tuple type.
const updaters = [
	updateListRuntimes,
	updateWhenRuntimes,
	notifyReactiveElements,
	notifyReactiveTextNodes,
] satisfies ReadonlyArray<(scope?: UpdateScope) => void>;

export function update(...scopeIds: string[]): void {
	let scope: UpdateScope | undefined;

	if (scopeIds.length > 0) {
		const roots = getScopeRoots(scopeIds);

		if (roots.length === 1) {
			const root = roots[0]!;
			scope = { contains: (node) => root.contains(node) };
		} else {
			scope = {
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

	// Every updater above may have inserted new nodes (a new list() row or a
	// newly-true when() branch) into an already-connected host. Flush once,
	// after all of them ran, so onMount fires exactly once per pass with the
	// DOM already settled — not once per updater.
	flushMountQueue();
}
