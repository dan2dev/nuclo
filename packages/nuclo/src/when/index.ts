import { isBrowser } from "../utility/environment";
import { applyNodeModifier } from "../core/modifierProcessor";
import { createMarkerPair, clearBetweenMarkers, insertNodesBefore, createComment } from "../utility/dom";
import { resolveCondition } from "../utility/conditions";
import { modifierProbeCache } from "../utility/modifierPredicates";
import { isFunction, isZeroArityFunction } from "../utility/typeGuards";
import { asParentNode, withScopedInsertion } from "../utility/domTypeHelpers";

type WhenCondition = boolean | (() => boolean);
type WhenContent<TTagName extends ElementTagName = ElementTagName> = 
  NodeMod<TTagName> | NodeModFn<TTagName>;

interface WhenGroup<TTagName extends ElementTagName = ElementTagName> {
  condition: WhenCondition;
  content: WhenContent<TTagName>[];
}

interface WhenRuntime<TTagName extends ElementTagName = ElementTagName> {
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
function renderContentItems<TTagName extends ElementTagName>(
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

/**
 * Main render function for when/else conditionals.
 * Evaluates conditions, clears old content, and renders the active branch.
 */
function renderWhenContent<TTagName extends ElementTagName>(
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

class WhenBuilderImpl<TTagName extends ElementTagName = ElementTagName> {
  private groups: WhenGroup<TTagName>[] = [];
  private elseContent: WhenContent<TTagName>[] = [];

  constructor(initialCondition: WhenCondition, ...content: WhenContent<TTagName>[]) {
    this.groups.push({ condition: initialCondition, content });
  }

  when(condition: WhenCondition, ...content: WhenContent<TTagName>[]): WhenBuilderImpl<TTagName> {
    this.groups.push({ condition, content });
    return this;
  }

  else(...content: WhenContent<TTagName>[]): WhenBuilderImpl<TTagName> {
    this.elseContent = content;
    return this;
  }

  render(host: ExpandedElement<TTagName>, index: number): Node | null {
    if (!isBrowser) {
      const comment = createComment("when-ssr");
      return comment || null;
    }

    const { start: startMarker, end: endMarker } = createMarkerPair("when");

    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups: [...this.groups],
      elseContent: [...this.elseContent],
      activeIndex: null,
      update: () => renderWhenContent(runtime),
    };

    activeWhenRuntimes.add(runtime);

    const parent = asParentNode(host);
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

    return startMarker;
  }
}

function createWhenBuilderFunction<TTagName extends ElementTagName>(
  builder: WhenBuilderImpl<TTagName>
): WhenBuilder<TTagName> {
  const nodeModFn = (host: ExpandedElement<TTagName>, index: number): Node | null => {
    return builder.render(host, index);
  };

  return Object.assign(nodeModFn, {
    when: (condition: WhenCondition, ...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> => {
      builder.when(condition, ...content);
      return createWhenBuilderFunction(builder);
    },
    else: (...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> => {
      builder.else(...content);
      return createWhenBuilderFunction(builder);
    },
  }) as unknown as WhenBuilder<TTagName>;
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
export function updateWhenRuntimes(): void {
  activeWhenRuntimes.forEach((runtime) => {
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

/**
 * Creates a conditional rendering block (when/else logic).
 *
 * Renders different content based on boolean conditions, similar to if/else statements.
 * Conditions can be static booleans or reactive functions that are re-evaluated on updates.
 *
 * @param condition - Boolean value or function returning a boolean
 * @param content - Content to render when condition is true
 * @returns A builder that allows chaining additional .when() or .else() branches
 *
 * @example
 * ```ts
 * const isLoggedIn = signal(false);
 *
 * div(
 *   when(() => isLoggedIn.value,
 *     span('Welcome back!')
 *   )
 *   .else(
 *     button('Login', on('click', () => login()))
 *   )
 * )
 * ```
 *
 * @example
 * ```ts
 * // Multiple conditions
 * div(
 *   when(() => status.value === 'loading',
 *     spinner()
 *   )
 *   .when(() => status.value === 'error',
 *     errorMessage()
 *   )
 *   .else(
 *     contentView()
 *   )
 * )
 * ```
 */
export function when<TTagName extends ElementTagName = ElementTagName>(
  condition: WhenCondition,
  ...content: WhenContent<TTagName>[]
): WhenBuilder<TTagName> {
  const builder = new WhenBuilderImpl<TTagName>(condition, ...content);
  return createWhenBuilderFunction(builder);
}
