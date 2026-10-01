import { createMarkerPair, clearBetweenMarkers, safeRemoveChild } from "../shared/dom";
import type { WhenGroup, WhenRuntime } from "./runtime";
import { renderWhenContent, registerWhenRuntime, getWhenRuntime, evaluateActiveCondition, renderContentItems } from "./runtime";
import { isBrowser } from "../shared/environment";
import { isHydrating, isSerializing, claimMarkerPair, peekChild, setCursor, runWithoutHydration, runFreshAtCursor } from "../hydration";
import { applyModifiers } from "../element/factory";
import type { NodeModifier } from "../element/modifiers";

/**
 * Encodes the active branch into the start marker so hydration can detect
 * server/client branch mismatches: `when-start-{index}-b{branch}` where
 * branch is the group index, -1 for the else branch, or `n` for none.
 */
function encodeBranch(index: number, activeIndex: number | null): string {
  return `when-start-${index}-b${activeIndex === null ? 'n' : activeIndex}`;
}

/**
 * Reads the branch encoded in an SSR start marker.
 * Returns `undefined` for legacy markers without branch info.
 */
function decodeBranch(markerText: string | null): number | null | undefined {
  const match = /-b(n|-?\d+)$/.exec(markerText || '');
  if (!match) return undefined;
  return match[1] === 'n' ? null : parseInt(match[1], 10);
}

class WhenBuilderImpl<TTagName extends ElementTagName = ElementTagName> {
  // Never mutated after construction, so chained builders and every runtime
  // rendered from this builder share them instead of copying.
  private readonly groups: ReadonlyArray<WhenGroup<TTagName>>;
  private readonly elseContent: ReadonlyArray<WhenContent<TTagName>>;

  constructor(groups: ReadonlyArray<WhenGroup<TTagName>>, elseContent: ReadonlyArray<WhenContent<TTagName>>) {
    this.groups = groups;
    this.elseContent = elseContent;
  }

  cloneWith(
    additionalGroup?: WhenGroup<TTagName>,
    newElseContent?: ReadonlyArray<WhenContent<TTagName>>,
  ): WhenBuilderImpl<TTagName> {
    return new WhenBuilderImpl(
      additionalGroup ? [...this.groups, additionalGroup] : this.groups,
      newElseContent ?? this.elseContent,
    );
  }

  render(host: ExpandedElement<TTagName>, index: number): Node {
    return isHydrating() ? this.hydrateRender(host, index) : this.freshRender(host, index);
  }

  private freshRender(host: ExpandedElement<TTagName>, index: number): Node {
    const { start: startMarker, end: endMarker } = createMarkerPair("when", index);
    const runtime = this.createRuntimeFromMarkers(host, index, startMarker, endMarker);

    const parent = host as unknown as Node & ParentNode;
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

    // Record which branch was rendered so hydration can detect mismatches.
    startMarker.textContent = encodeBranch(index, runtime.activeIndex);

    return startMarker;
  }

  private hydrateRender(host: ExpandedElement<TTagName>, index: number): Node {
    const parentNode = host as unknown as Node & ParentNode;

    // No when markers at the cursor (SSR output without Nuclo markers):
    // create new markers and render from scratch.
    const pair = claimMarkerPair(parentNode, "when");
    if (!pair) return runFreshAtCursor(parentNode, () => this.freshRender(host, index));
    const { start: startMarker, end: endMarker } = pair;

    // Determine which branch the client wants and which is rendered. A live
    // runtime (forceUpdate() reclaim) knows its actual branch — the marker
    // text only encodes the branch at SSR time and goes stale after
    // client-side toggles.
    const activeIndex = evaluateActiveCondition(this.groups, this.elseContent);
    const existing = getWhenRuntime(startMarker);
    const serverBranch = existing ? existing.activeIndex : decodeBranch(startMarker.textContent);
    const branchMatches = !pair.recreated &&
      (serverBranch === undefined || serverBranch === activeIndex);

    if (branchMatches) {
      // Re-run active branch content to register reactivity on existing nodes
      if (activeIndex !== null) {
        const contentToRender = activeIndex >= 0 ? this.groups[activeIndex].content : this.elseContent;
        // applyModifiers (not a bare applyNodeModifier): a node that could
        // not be claimed is inserted at the claim cursor instead of dropped.
        // One call per item — every branch item shares the block's `index`,
        // as in renderContentItems.
        for (const item of contentToRender) {
          applyModifiers(host, [item as NodeModifier<TTagName>], index);
        }
      }
      // Remove the SSR nodes the branch did not claim (same as list()).
      let leftover = peekChild(parentNode);
      while (leftover && leftover !== endMarker) {
        const next: Node | null = leftover.nextSibling;
        safeRemoveChild(leftover);
        leftover = next;
      }
    } else {
      // Server rendered a different branch (or the markup is unusable):
      // drop the server content and render the client branch fresh.
      clearBetweenMarkers(startMarker, endMarker);
      if (activeIndex !== null) {
        const contentToRender = activeIndex >= 0 ? this.groups[activeIndex].content : this.elseContent;
        runWithoutHydration(() => renderContentItems(contentToRender, host, index, endMarker));
      }
    }

    // Advance cursor past end marker
    setCursor(parentNode, endMarker.nextSibling);

    this.createRuntimeFromMarkers(host, index, startMarker, endMarker, activeIndex);

    return startMarker;
  }

  private createRuntimeFromMarkers(
    host: ExpandedElement<TTagName>,
    index: number,
    startMarker: Comment,
    endMarker: Comment,
    activeIndex: number | null = null,
  ): WhenRuntime<TTagName> {
    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups: this.groups,
      elseContent: this.elseContent,
      activeIndex,
    };

    if (isBrowser && !isSerializing()) {
      registerWhenRuntime(runtime);
    }

    return runtime;
  }
}

export function createWhenBuilderFunction<TTagName extends ElementTagName>(
  builder: WhenBuilderImpl<TTagName>
): WhenBuilder<TTagName> {
  const nodeModFn = function(host: ExpandedElement<TTagName>, index: number): Node {
    return builder.render(host, index);
  };

  return Object.assign(nodeModFn, {
    when: function(condition: WhenCondition, ...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> {
      return createWhenBuilderFunction(builder.cloneWith({ condition, content }));
    },
    else: function(...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> {
      return createWhenBuilderFunction(builder.cloneWith(undefined, content));
    },
  }) as unknown as WhenBuilder<TTagName>;
}

export { WhenBuilderImpl };
