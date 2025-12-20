import { clearBetweenMarkers, insertNodesBefore } from "../utility/dom";
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

const activeWhenRuntimes = new Set<WhenRuntime<any>>();

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
 * Registers a when runtime for tracking and updates
 */
export function registerWhenRuntime<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>
): void {
  activeWhenRuntimes.add(runtime);
}

/**
 * Updates all active when/else conditional runtimes.
 *
 * Re-evaluates all conditional branches and re-renders if the active branch has changed.
 * Automatically cleans up runtimes that throw errors during update.
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
  activeWhenRuntimes.forEach(function(runtime) {
    if (scope && !scope.contains(runtime.startMarker)) return;

    try {
      runtime.update();
    } catch (error) {
      activeWhenRuntimes.delete(runtime);
    }
  });
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
