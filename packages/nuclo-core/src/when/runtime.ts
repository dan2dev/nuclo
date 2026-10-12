import { clearBetweenMarkers, insertNodesBefore, withScopedInsertion } from "../shared/dom";
import type { UpdateScope } from "../update/scope";
import { applyNodeModifier } from "../element/modifiers";
import { getFactoryMods } from "../element/factory-meta";
import { mountQueueMark, cancelMountsSince } from "../element/lifecycle";
import { isFunction, isZeroArityFunction } from "../shared/type-guards";
import { logError } from "../shared/errors";

export interface WhenGroup<TTagName extends ElementTagName = ElementTagName> {
  condition: WhenCondition;
  content: ReadonlyArray<WhenContent<TTagName>>;
}

export interface WhenRuntime<TTagName extends ElementTagName = ElementTagName> {
  startMarker: Comment;
  endMarker: Comment;
  host: ExpandedElement<TTagName>;
  index: number;
  groups: ReadonlyArray<WhenGroup<TTagName>>;
  elseContent: ReadonlyArray<WhenContent<TTagName>>;
  /**
   * Tracks which branch is currently rendered:
   *  - null:  nothing rendered yet (initial state)
   *  - -1:    else branch is active
   *  - >= 0:  groups[activeIndex] is active
   */
  activeIndex: number | null;
}

/**
 * Registry of active when runtimes.
 *
 * The iteration set only holds WeakRefs; the runtime itself lives in a
 * WeakMap keyed by its start marker. This keeps the global registry free of
 * strong references to the runtime (which holds the host element, branch
 * content, and markers), so removing the surrounding DOM subtree makes the
 * runtime collectible — even if update() is never called again. The
 * FinalizationRegistry prunes dead WeakRefs once the marker is collected;
 * updateWhenRuntimes() also prunes as it iterates.
 */
const activeWhenRuntimes = new Set<WeakRef<Comment>>();
const whenRuntimeByMarker = new WeakMap<Comment, WhenRuntime<ElementTagName>>();
const whenMarkerFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<WeakRef<Comment>>((ref) => { activeWhenRuntimes.delete(ref); })
  : null;

/**
 * Evaluates which condition branch should be active.
 * Returns the index of the first truthy condition, -1 for else branch, or null for no match.
 */
export function evaluateActiveCondition<TTagName extends ElementTagName>(
  groups: ReadonlyArray<WhenGroup<TTagName>>,
  elseContent: ReadonlyArray<WhenContent<TTagName>>
): number | null {
  for (let i = 0; i < groups.length; i++) {
    const condition = groups[i].condition;
    if (typeof condition === "function" ? condition() : condition) {
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
) {
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
  renderContentItems(contentToRender, host, index, endMarker);
}

/**
 * Registers a when runtime for tracking and updates.
 * Uses WeakRef to prevent memory leaks when elements are removed.
 * The runtime object itself is mutable and will be updated in place.
 */
export function registerWhenRuntime<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>
) {
  const existing = whenRuntimeByMarker.get(runtime.startMarker);
  whenRuntimeByMarker.set(runtime.startMarker, runtime as WhenRuntime<ElementTagName>);
  // Re-registration for the same markers (forceUpdate() reclaim): the new
  // runtime replaced the old in the WeakMap; the iteration set and finalizer
  // already track this marker, so adding again would only grow the set.
  if (existing) return;
  const ref = new WeakRef(runtime.startMarker);
  activeWhenRuntimes.add(ref);
  whenMarkerFinalizer?.register(runtime.startMarker, ref);
}

/** The live runtime registered for a claimed start marker, if any. */
export function getWhenRuntime(startMarker: Comment): WhenRuntime<ElementTagName> | undefined {
  return whenRuntimeByMarker.get(startMarker);
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
export function updateWhenRuntimes(scope?: UpdateScope) {
  for (const ref of activeWhenRuntimes) {
    const startMarker = ref.deref();

    // Comment node was garbage collected
    if (startMarker === undefined) {
      activeWhenRuntimes.delete(ref);
      continue;
    }

    const runtime = whenRuntimeByMarker.get(startMarker);
    if (!runtime) {
      activeWhenRuntimes.delete(ref);
      continue;
    }

    // Check if markers are still connected to DOM
    if (!startMarker.isConnected || !runtime.endMarker.isConnected) {
      whenRuntimeByMarker.delete(startMarker);
      activeWhenRuntimes.delete(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    const mark = mountQueueMark();
    try {
      renderWhenContent(runtime);
    } catch (error) {
      // Clean up runtimes that throw errors
      logError("when() branch threw during update; unregistering this conditional", error);
      whenRuntimeByMarker.delete(startMarker);
      activeWhenRuntimes.delete(ref);
      // Content built but never inserted must not mount on the next flush.
      cancelMountsSince(mark);
    }
  }
}

// ─── Content rendering ───────────────────────────────────────────────────────
/**
 * Renders a single content item and returns the resulting node if any.
 */
function renderContentItem<TTagName extends ElementTagName>(
  item: WhenContent<TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
  endMarker: Node
): Node | null {
  // Primitives, attribute objects, reactive text and tag-builder factories
  // (which build their element detached) never append to the host themselves:
  // the caller inserts whatever node comes back. Keeping them off the scoped
  // path matters — it adds and deletes an own `appendChild` on the host, which
  // drops the element out of the engine's fast property mode for good.
  if (!isFunction(item) || isZeroArityFunction(item) || getFactoryMods(item) !== undefined) {
    return applyNodeModifier(host, item, index);
  }

  // Other functions (nested when()/list() blocks, custom modifiers) may append
  // to the host: scope those appends so they land before endMarker.
  return withScopedInsertion(host, endMarker, () => {
    const maybeNode = applyNodeModifier(host, item, index);
    // Only include nodes that weren't already inserted
    return maybeNode && !maybeNode.parentNode ? maybeNode : null;
  });
}

/**
 * Renders a list of content items before `endMarker` (any reference node in
 * the host — a region inserts ahead of its unclaimed server markup), in
 * source order.
 *
 * Each node is inserted as soon as its item produces it: nested when()/list()
 * blocks insert their own markers while they run, so collecting the element
 * nodes and inserting them afterwards would put every nested block ahead of
 * the siblings written before it.
 */
export function renderContentItems<TTagName extends ElementTagName>(
  items: ReadonlyArray<WhenContent<TTagName>>,
  host: ExpandedElement<TTagName>,
  index: number,
  endMarker: Node
) {
  for (const item of items) {
    const node = renderContentItem(item, host, index, endMarker);
    if (node) insertNodesBefore([node], endMarker);
  }
}
