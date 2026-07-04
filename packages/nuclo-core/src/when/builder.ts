import { createMarkerPair, createComment, clearBetweenMarkers, insertNodesBefore, asParentNode } from "../shared/dom";
import type { WhenCondition, WhenContent, WhenGroup, WhenRuntime } from "./runtime";
import { renderWhenContent, registerWhenRuntime, evaluateActiveCondition, renderContentItems } from "./runtime";
import { isBrowser } from "../shared/environment";
import { isHydrating, claimChild, peekChild, setCursor, skipWhitespaceText, runWithoutHydration } from "../hydration";
import { applyNodeModifier } from "../element/modifiers";

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
  private groups: WhenGroup<TTagName>[] = [];
  private elseContent: WhenContent<TTagName>[] = [];

  constructor(initialCondition: WhenCondition, ...content: WhenContent<TTagName>[]) {
    this.groups.push({ condition: initialCondition, content });
  }

  cloneWith(
    additionalGroup?: WhenGroup<TTagName>,
    newElseContent?: WhenContent<TTagName>[],
  ): WhenBuilderImpl<TTagName> {
    const b = Object.create(WhenBuilderImpl.prototype) as WhenBuilderImpl<TTagName>;
    b.groups = [...this.groups];
    if (additionalGroup) b.groups.push(additionalGroup);
    b.elseContent = newElseContent ?? [...this.elseContent];
    return b;
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
    if (!globalThis.document) {
      return null;
    }

    if (isHydrating()) {
      return this.hydrateRender(host, index);
    }

    return this.freshRender(host, index);
  }

  private freshRender(host: ExpandedElement<TTagName>, index: number): Node | null {
    const { start: startMarker, end: endMarker } = createMarkerPair("when", index);
    const runtime = this.createRuntimeFromMarkers(host, index, startMarker, endMarker);

    const parent = asParentNode(host);
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

    // Record which branch was rendered so hydration can detect mismatches.
    startMarker.textContent = encodeBranch(index, runtime.activeIndex);

    return startMarker;
  }

  private hydrateRender(host: ExpandedElement<TTagName>, index: number): Node | null {
    const parentNode = host as unknown as Node & ParentNode;

    // Check if next child is actually a when-start comment marker.
    // If the SSR HTML doesn't contain Nuclo comment markers, fall back
    // to normal rendering (create new markers + render from scratch).
    skipWhitespaceText(parentNode);
    const candidate = peekChild(parentNode);
    if (!candidate || candidate.nodeType !== 8 ||
        !(candidate as Comment).textContent?.startsWith('when-start-')) {
      return this.freshRender(host, index);
    }

    // Claim existing start marker
    const startMarker = claimChild(parentNode) as Comment;

    // Find end marker (without claiming). Directly nested when() blocks
    // share this host, so matching pairs must be depth-counted.
    let depth = 0;
    let scanNode: Node | null = peekChild(parentNode);
    while (scanNode) {
      if (scanNode.nodeType === 8) {
        const text = (scanNode as Comment).textContent || '';
        if (text.startsWith('when-start-')) {
          depth++;
        } else if (text === 'when-end') {
          if (depth === 0) break;
          depth--;
        }
      }
      scanNode = scanNode.nextSibling;
    }
    let endMarker = scanNode as Comment | null;
    let endMarkerMissing = false;
    if (!endMarker) {
      // Corrupt/truncated SSR output — recreate the end marker right after
      // the start marker and render the branch fresh.
      const created = createComment('when-end');
      if (!created) return startMarker;
      parentNode.insertBefore(created, startMarker.nextSibling);
      endMarker = created;
      endMarkerMissing = true;
    }

    // Determine which branch the client wants and which the server rendered.
    const activeIndex = evaluateActiveCondition(this.groups, this.elseContent);
    const serverBranch = decodeBranch(startMarker.textContent);
    const branchMatches = !endMarkerMissing &&
      (serverBranch === undefined || serverBranch === activeIndex);

    if (branchMatches) {
      // Re-run active branch content to register reactivity on existing nodes
      if (activeIndex !== null) {
        const contentToRender = activeIndex >= 0 ? this.groups[activeIndex].content : this.elseContent;
        for (const item of contentToRender) {
          applyNodeModifier(host, item as NodeMod<TTagName> | NodeModFn<TTagName>, index);
        }
      }
    } else {
      // Server rendered a different branch (or the markup is unusable):
      // drop the server content and render the client branch fresh.
      clearBetweenMarkers(startMarker, endMarker);
      if (activeIndex !== null) {
        const contentToRender = activeIndex >= 0 ? this.groups[activeIndex].content : this.elseContent;
        const end = endMarker;
        runWithoutHydration(() => {
          const nodes = renderContentItems(contentToRender, host, index, end);
          insertNodesBefore(nodes, end);
        });
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
      groups: [...this.groups],
      elseContent: [...this.elseContent],
      activeIndex,
      update: function() { renderWhenContent(runtime); },
    };

    if (isBrowser) {
      registerWhenRuntime(runtime);
    }

    return runtime;
  }
}

export function createWhenBuilderFunction<TTagName extends ElementTagName>(
  builder: WhenBuilderImpl<TTagName>
): WhenBuilder<TTagName> {
  const nodeModFn = function(host: ExpandedElement<TTagName>, index: number): Node | null {
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
