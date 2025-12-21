import { clearBetweenMarkers, insertNodesBefore } from "../utility/dom";
import { isNodeConnected } from "../utility/dom";
import { resolveCondition } from "../utility/conditions";
import { renderContentItems } from "./renderer";
import type { UpdateScope } from "../core/updateScope";

export type WhenCondition = boolean | (() => boolean);
export type WhenContent<TTagName extends ElementTagName = ElementTagName> =
  NodeMod<TTagName> | NodeModFn<TTagName>;

export interface WhenGroup<TTagName extends ElementTagName = ElementTagName> {
  condition: WhenCondition;
  content: WhenContent<TTagName>[];
}

export interface WhenRuntime<TTagName extends ElementTagName = ElementTagName> {
  startMarker: Comment;
  endMarker: Comment;
  host: ExpandedElement<TTagName>;
  index: number;
  groups: WhenGroup<TTagName>[];
  elseContent: WhenContent<TTagName>[];
  /**
   * Tracks which branch is currently rendered:
   *  - null: nothing rendered yet
   *  - -1: else branch
   *  - >=0: index of groups[]
   */
  activeIndex: number | -1 | null;
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

const activeWhenRuntimes = new Map<WeakRef<Comment>, WhenRuntimeInfo<ElementTagName>>();

/**
 * Evaluates which condition branch should be active.
 * Returns the index of the first truthy condition, -1 for else branch, or null for no match.
 */
function evaluateActiveCondition<TTagName extends ElementTagName>(
  groups: ReadonlyArray<WhenGroup<TTagName>>,
  elseContent: ReadonlyArray<WhenContent<TTagName>>
): number | -1 | null {
  for (let i = 0; i < groups.length; i++) {
    if (resolveCondition(groups[i].condition)) {
      return i;
    }
  }
  return elseContent.length > 0 ? -1 : null;
}

/**
 * Main render function for when/else conditionals.
 * Evaluates conditions, clears old content, and renders the active branch.
 */
export function renderWhenContent<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>
): void {
  const { groups, elseContent, host, index, endMarker } = runtime;

  const newActive = evaluateActiveCondition(groups, elseContent);

  // No change needed
  if (newActive === runtime.activeIndex) return;

  // Clear previous content and update active index
  clearBetweenMarkers(runtime.startMarker, runtime.endMarker);
  runtime.activeIndex = newActive;

  // Nothing to render
  if (newActive === null) return;

  // Render the active branch
  const contentToRender = newActive >= 0 ? groups[newActive].content : elseContent;
  const nodes = renderContentItems(contentToRender, host, index, endMarker);

  insertNodesBefore(nodes, endMarker);
}

/**
 * Registers a when runtime for tracking and updates.
 * Uses WeakRef to prevent memory leaks when elements are removed.
 * The runtime object itself is mutable and will be updated in place.
 */
export function registerWhenRuntime<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>
): void {
  const runtimeInfo: WhenRuntimeInfo<TTagName> = {
    runtime,
  };
  activeWhenRuntimes.set(new WeakRef(runtime.startMarker), runtimeInfo);
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
    if (!isNodeConnected(startMarker) || !isNodeConnected(info.runtime.endMarker)) {
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
