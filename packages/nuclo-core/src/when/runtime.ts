import { clearBetweenMarkers, insertNodesBefore } from "../utility/dom";
import { isNodeConnected } from "../utility/dom";
import { resolveCondition } from "../utility/conditions";
import { renderContentItems } from "./renderer";
import type { UpdateScope } from "../core/updateScope";

export type WhenCondition = boolean | (() => boolean);
export type WhenContent<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

export interface WhenGroup<TTagName extends ElementTagName = ElementTagName> {
  condition: WhenCondition;
  content: WhenContent<TTagName>[];
}

/**
 * Discriminated union describing which branch of a `when()` chain is
 * currently rendered.
 *
 *  - `{ kind: "none" }`  — nothing is rendered (no conditions matched and no
 *    else branch exists, or the runtime hasn't rendered yet).
 *  - `{ kind: "group", index }` — the `index`-th `when()` branch is active.
 *  - `{ kind: "else" }`  — the `else` branch is active.
 *
 * Using a tagged shape lets `switch (active.kind)` narrow exhaustively in
 * both the renderer and in tests, replacing the previous sentinel pattern
 * (`number | -1 | null`) which had no discriminant for TS to narrow on.
 */
export type WhenActive =
  | { readonly kind: "none" }
  | { readonly kind: "group"; readonly index: number }
  | { readonly kind: "else" };

/** Shared singletons for the branchless `WhenActive` variants. */
export const WHEN_NONE = { kind: "none" } as const satisfies WhenActive;
export const WHEN_ELSE = { kind: "else" } as const satisfies WhenActive;

/**
 * True when two `WhenActive` values represent the same branch. Cheap
 * structural equality — faster than `JSON.stringify`, and expressive
 * enough for the renderer's "no change → skip re-render" guard.
 */
export function isSameWhenActive(a: WhenActive, b: WhenActive): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind !== "group" || a.index === (b as { index: number }).index;
}

export interface WhenRuntime<TTagName extends ElementTagName = ElementTagName> {
  startMarker: Comment;
  endMarker: Comment;
  host: ExpandedElement<TTagName>;
  index: number;
  groups: WhenGroup<TTagName>[];
  elseContent: WhenContent<TTagName>[];
  /** Currently rendered branch — see {@link WhenActive}. */
  active: WhenActive;
  update(): void;
}

/**
 * Stores weak references to when runtime markers to prevent memory leaks.
 * Comment nodes can be garbage collected when removed from DOM.
 * The runtime object itself is mutable and will be updated in place.
 */
interface WhenRuntimeInfo<TTagName extends ElementTagName = ElementTagName> {
  runtime: WhenRuntime<TTagName>;
}

const activeWhenRuntimes = new Map<
  WeakRef<Comment>,
  WhenRuntimeInfo<ElementTagName>
>();

/**
 * Evaluates which branch of the `when()` chain should be active by
 * resolving each group's condition in order. First truthy group wins;
 * otherwise falls back to the `else` branch if one was provided.
 *
 * @template TTagName Host element tag literal.
 */
export function evaluateActiveCondition<TTagName extends ElementTagName>(
  groups: ReadonlyArray<WhenGroup<TTagName>>,
  elseContent: ReadonlyArray<WhenContent<TTagName>>,
): WhenActive {
  for (let i = 0; i < groups.length; i++) {
    if (resolveCondition(groups[i].condition)) {
      return { kind: "group", index: i };
    }
  }
  return elseContent.length > 0 ? WHEN_ELSE : WHEN_NONE;
}

/**
 * Main render function for `when()` / `else` conditionals.
 * Evaluates conditions, clears old content, and renders the active branch.
 *
 * @template TTagName Host element tag literal.
 */
export function renderWhenContent<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>,
): void {
  const { groups, elseContent, host, index, endMarker } = runtime;

  const newActive = evaluateActiveCondition(groups, elseContent);

  if (isSameWhenActive(newActive, runtime.active)) return;

  clearBetweenMarkers(runtime.startMarker, runtime.endMarker);
  runtime.active = newActive;

  if (newActive.kind === "none") return;

  const contentToRender =
    newActive.kind === "group"
      ? groups[newActive.index].content
      : elseContent;
  const nodes = renderContentItems(contentToRender, host, index, endMarker);

  insertNodesBefore(nodes, endMarker);
}

/**
 * Registers a when runtime for tracking and updates.
 * Uses WeakRef to prevent memory leaks when elements are removed.
 * The runtime object itself is mutable and will be updated in place.
 */
export function registerWhenRuntime<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>,
): void {
  const runtimeInfo: WhenRuntimeInfo<TTagName> = {
    runtime,
  };
  activeWhenRuntimes.set(
    new WeakRef(runtime.startMarker),
    runtimeInfo as WhenRuntimeInfo<ElementTagName>,
  );
}

/**
 * Updates all active when/else conditional runtimes.
 *
 * Re-evaluates all conditional branches and re-renders if the active branch has changed.
 * Automatically cleans up runtimes that are garbage collected or disconnected from DOM.
 *
 * This function should be called after state changes that affect conditional expressions.
 *
 * @example
 * ```ts
 * isLoggedIn.value = true;
 * updateWhenRuntimes(); // All when() conditionals re-evaluate
 * ```
 */
export function updateWhenRuntimes(scope?: UpdateScope): void {
  const toDelete: WeakRef<Comment>[] = [];

  for (const [ref, info] of activeWhenRuntimes) {
    const startMarker = ref.deref();

    // Comment node was garbage collected
    if (startMarker === undefined) {
      toDelete.push(ref);
      continue;
    }

    // Check if markers are still connected to DOM
    if (
      !isNodeConnected(startMarker) ||
      !isNodeConnected(info.runtime.endMarker)
    ) {
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    try {
      info.runtime.update();
    } catch {
      // Clean up runtimes that throw errors
      toDelete.push(ref);
    }
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeWhenRuntimes.delete(ref);
  }
}

/**
 * Clears all active when/else conditional runtimes.
 *
 * This is typically used for cleanup or testing purposes.
 * After calling this, no when() conditionals will be tracked for updates.
 */
export function clearWhenRuntimes(): void {
  activeWhenRuntimes.clear();
}
