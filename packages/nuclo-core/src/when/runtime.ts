import { clearBetweenMarkers, insertNodesBefore, isNodeConnected, withScopedInsertion } from "../shared/dom";
import { resolveCondition } from "../shared/conditions";
import type { UpdateScope } from "../update/scope";
import { applyNodeModifier, modifierProbeCache } from "../element/modifiers";
import { isFunction, isZeroArityFunction } from "../shared/type-guards";
import { logError } from "../shared/errors";

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
   *  - null:  nothing rendered yet (initial state)
   *  - -1:    else branch is active
   *  - >= 0:  groups[activeIndex] is active
   */
  activeIndex: number | null;
  update(): void;
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
  const ref = new WeakRef(runtime.startMarker);
  activeWhenRuntimes.add(ref);
  whenRuntimeByMarker.set(runtime.startMarker, runtime as WhenRuntime<ElementTagName>);
  whenMarkerFinalizer?.register(runtime.startMarker, ref);
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

  for (const ref of activeWhenRuntimes) {
    const startMarker = ref.deref();

    // Comment node was garbage collected
    if (startMarker === undefined) {
      toDelete.push(ref);
      continue;
    }

    const runtime = whenRuntimeByMarker.get(startMarker);
    if (!runtime) {
      toDelete.push(ref);
      continue;
    }

    // Check if markers are still connected to DOM
    if (!isNodeConnected(startMarker) || !isNodeConnected(runtime.endMarker)) {
      whenRuntimeByMarker.delete(startMarker);
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    try {
      runtime.update();
    } catch (error) {
      // Clean up runtimes that throw errors
      logError("when() branch threw during update; unregistering this conditional", error);
      whenRuntimeByMarker.delete(startMarker);
      toDelete.push(ref);
    }
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeWhenRuntimes.delete(ref);
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
  endMarker: Comment
): Node | null {
  if (!isFunction(item)) {
    return applyNodeModifier(host, item, index);
  }

  // Zero-arity functions need cache cleared
  if (isZeroArityFunction(item)) {
    modifierProbeCache.delete(item);
    return applyNodeModifier(host, item, index);
  }

  // Non-zero-arity functions need scoped insertion to insert before endMarker
  return withScopedInsertion(host, endMarker, () => {
    const maybeNode = applyNodeModifier(host, item, index);
    // Only include nodes that weren't already inserted
    return maybeNode && !maybeNode.parentNode ? maybeNode : null;
  });
}

/**
 * Renders a list of content items and collects the resulting nodes.
 */
export function renderContentItems<TTagName extends ElementTagName>(
  items: ReadonlyArray<WhenContent<TTagName>>,
  host: ExpandedElement<TTagName>,
  index: number,
  endMarker: Comment
): Node[] {
  const nodes: Node[] = [];
  for (const item of items) {
    const node = renderContentItem(item, host, index, endMarker);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}
