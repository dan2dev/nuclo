/**
 * When Builder for nuclo
 * 
 * This module provides the when() function for conditional rendering with
 * chaining support. It allows you to create complex conditional logic
 * with multiple conditions and an else clause.
 */

import { isBrowser } from "../utility/environment";
import { applyNodeModifier } from "../core/modifierProcessor";
import { createMarkerPair, clearBetweenMarkers, insertNodesBefore } from "../utility/dom";
import { resolveCondition } from "../utility/conditions";
import { modifierProbeCache } from "../utility/modifierPredicates";
import { isFunction } from "../utility/typeGuards";

/**
 * A condition that can be evaluated for when() rendering.
 * Can be a boolean value or a function that returns a boolean.
 */
type WhenCondition = boolean | (() => boolean);

/**
 * Content that can be rendered in a when() branch.
 * Can be static values, DOM nodes, or functions.
 */
type WhenContent<TTagName extends ElementTagName = ElementTagName> = 
  NodeMod<TTagName> | NodeModFn<TTagName>;

/**
 * A group of content with an associated condition.
 */
interface WhenGroup<TTagName extends ElementTagName = ElementTagName> {
  condition: WhenCondition;
  content: WhenContent<TTagName>[];
}

/**
 * Runtime information for a when() conditional renderer.
 */
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

// Global set to track all active when runtimes
const activeWhenRuntimes = new Set<WhenRuntime<any>>();

/**
 * Renders the content for a when() conditional renderer.
 * 
 * This function evaluates all conditions in order and renders the content
 * for the first matching condition, or the else content if no conditions match.
 * 
 * @param runtime - The when runtime to render
 */
function renderWhenContent<TTagName extends ElementTagName>(
  runtime: WhenRuntime<TTagName>
): void {
  const { groups, elseContent, host, index, endMarker } = runtime;

  // Find the first matching condition
  let newActiveIndex: number | -1 | null = null;
  for (let i = 0; i < groups.length; i++) {
    if (resolveCondition(groups[i].condition)) {
      newActiveIndex = i;
      break;
    }
  }
  
  // If no condition matched and there's else content, use else
  if (newActiveIndex === null && elseContent.length > 0) {
    newActiveIndex = -1;
  }

  // If the active branch hasn't changed, don't re-render
  if (newActiveIndex === runtime.activeIndex) return;

  // Clear existing content between markers
  clearBetweenMarkers(runtime.startMarker, runtime.endMarker);
  runtime.activeIndex = newActiveIndex;

  // If no branch is active, we're done
  if (newActiveIndex === null) return;

  const nodesToInsert: Node[] = [];

  // Render the content for the active branch
  if (newActiveIndex >= 0) {
    renderItemsToNodes(groups[newActiveIndex].content, host, index, endMarker, nodesToInsert);
  } else if (newActiveIndex === -1) {
    renderItemsToNodes(elseContent, host, index, endMarker, nodesToInsert);
  }

  // Insert all rendered nodes before the end marker
  insertNodesBefore(nodesToInsert, endMarker);
}

/**
 * Renders a list of items to DOM nodes.
 * 
 * This helper function processes each item in the content array and converts
 * them to DOM nodes, handling both static content and reactive functions.
 * 
 * @param items - Array of content items to render
 * @param host - The host element
 * @param index - The current index
 * @param endMarker - The end marker for insertion
 * @param nodesToInsert - Array to collect rendered nodes
 */
function renderItemsToNodes<TTagName extends ElementTagName>(
  items: ReadonlyArray<WhenContent<TTagName>>,
  host: ExpandedElement<TTagName>,
  index: number,
  endMarker: Comment,
  nodesToInsert: Node[]
): void {
  for (const item of items) {
    if (isFunction(item)) {
      // Handle reactive functions (zero parameters)
      if ((item as Function).length === 0) {
        modifierProbeCache.delete(item as Function);
        const node = applyNodeModifier(host, item, index);
        if (node) nodesToInsert.push(node);
        continue;
      }

      // Handle non-reactive functions with complex DOM manipulation
      const realHost = host as unknown as Element & {
        appendChild: (n: Node) => Node;
        insertBefore: (n: Node, ref: Node | null) => Node;
      };
      const originalAppend = realHost.appendChild;
      
      // Temporarily override appendChild to insert before end marker
      (realHost as unknown as Record<string, Function>).appendChild = function (n: Node) {
        return (realHost as unknown as Record<string, Function>).insertBefore(
          n,
          endMarker
        ) as Node;
      };
      
      try {
        const maybeNode = applyNodeModifier(host, item, index);
        if (maybeNode && !maybeNode.parentNode) {
          nodesToInsert.push(maybeNode);
        }
      } finally {
        // Restore original appendChild
        (realHost as unknown as Record<string, Function>).appendChild = originalAppend;
      }
      continue;
    }

    // Handle static content
    const node = applyNodeModifier(host, item, index);
    if (node) nodesToInsert.push(node);
  }
}

/**
 * Implementation of the when builder that supports chaining.
 */
class WhenBuilderImpl<TTagName extends ElementTagName = ElementTagName> {
  private groups: WhenGroup<TTagName>[] = [];
  private elseContent: WhenContent<TTagName>[] = [];

  constructor(initialCondition: WhenCondition, ...content: WhenContent<TTagName>[]) {
    this.groups.push({ condition: initialCondition, content });
  }

  /**
   * Adds another condition to the when chain.
   * 
   * @param condition - The condition to check
   * @param content - Content to render if condition is true
   * @returns The builder for chaining
   */
  when(condition: WhenCondition, ...content: WhenContent<TTagName>[]): WhenBuilderImpl<TTagName> {
    this.groups.push({ condition, content });
    return this;
  }

  /**
   * Sets the else content for when no conditions match.
   * 
   * @param content - Content to render if no conditions match
   * @returns The builder for chaining
   */
  else(...content: WhenContent<TTagName>[]): WhenBuilderImpl<TTagName> {
    this.elseContent = content;
    return this;
  }

  /**
   * Renders the when conditional to the DOM.
   * 
   * @param host - The host element
   * @param index - The current index
   * @returns The start marker node
   */
  render(host: ExpandedElement<TTagName>, index: number): Node | null {
    // Server-side rendering support
    if (!isBrowser) return document.createComment("when-ssr");

    // Create marker pair for tracking the when block
    const { start: startMarker, end: endMarker } = createMarkerPair("when");

    // Create runtime for managing the when block
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

    // Register runtime for updates
    activeWhenRuntimes.add(runtime);

    // Insert markers into DOM
    const parent = host as unknown as Node & ParentNode;
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    // Initial render
    renderWhenContent(runtime);

    return startMarker;
  }
}

/**
 * Creates a when builder function with chaining support.
 * 
 * @param builder - The builder implementation
 * @returns A function with when() and else() methods
 */
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
 * Updates all active when runtimes.
 * 
 * This function is called by update() to refresh all when() conditional renderers.
 */
export function updateWhenRuntimes(): void {
  activeWhenRuntimes.forEach((runtime) => {
    try {
      runtime.update();
    } catch (error) {
      // Remove failed runtimes to prevent memory leaks
      activeWhenRuntimes.delete(runtime);
    }
  });
}

/**
 * Clears all when runtimes.
 * 
 * This function is used for cleanup and testing.
 */
export function clearWhenRuntimes(): void {
  activeWhenRuntimes.clear();
}

/**
 * Creates a conditional renderer with chaining support.
 * 
 * The when() function creates a conditional renderer that can be chained
 * with additional conditions and an else clause. The first matching condition
 * will be rendered.
 * 
 * @param condition - The initial condition to check
 * @param content - Content to render if condition is true
 * @returns A when builder with chaining support
 * 
 * @example
 * ```ts
 * when(() => user.isAdmin,
 *   div('Admin Panel')
 * ).when(() => user.isLoggedIn,
 *   div('User Dashboard')
 * ).else(
 *   div('Please log in')
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
