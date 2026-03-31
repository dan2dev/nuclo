import { createMarkerPair } from "../utility/dom";
import { asParentNode } from "../utility/domTypeHelpers";
import type { WhenCondition, WhenContent, WhenGroup, WhenRuntime } from "./runtime";
import { renderWhenContent, registerWhenRuntime, evaluateActiveCondition } from "./runtime";
import { isBrowser } from "../utility/environment";
import { isHydrating, claimChild, getCursor, setCursor } from "../hydration/context";
import { applyNodeModifier } from "../core/modifierProcessor";

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
    if (!globalThis.document) {
      return null;
    }

    if (isHydrating()) {
      return this.hydrateRender(host, index);
    }

    const { start: startMarker, end: endMarker } = createMarkerPair("when", index);

    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups: [...this.groups],
      elseContent: [...this.elseContent],
      activeIndex: null,
      update: function() { renderWhenContent(runtime); },
    };

    if (isBrowser) {
      registerWhenRuntime(runtime);
    }

    const parent = asParentNode(host);
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

    return startMarker;
  }

  private hydrateRender(host: ExpandedElement<TTagName>, index: number): Node | null {
    const parentNode = host as unknown as Node & ParentNode;

    // Claim existing start marker
    const startMarker = claimChild(parentNode) as Comment;

    // Find end marker position (without claiming)
    let endMarkerIdx = getCursor(parentNode);
    while (endMarkerIdx < parentNode.childNodes.length) {
      const node = parentNode.childNodes[endMarkerIdx];
      if (node.nodeType === 8 && (node as Comment).textContent === 'when-end') break;
      endMarkerIdx++;
    }
    const endMarker = parentNode.childNodes[endMarkerIdx] as Comment;

    const groups = [...this.groups];
    const elseContent = [...this.elseContent];

    // Determine which branch is currently active
    const activeIndex = evaluateActiveCondition(groups, elseContent);

    // Re-run active branch content to register reactivity on existing nodes
    if (activeIndex !== null) {
      const contentToRender = activeIndex >= 0 ? groups[activeIndex].content : elseContent;
      for (const item of contentToRender) {
        applyNodeModifier(host, item as NodeMod<TTagName> | NodeModFn<TTagName>, index);
      }
    }

    // Advance cursor past end marker
    setCursor(parentNode, endMarkerIdx + 1);

    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups,
      elseContent,
      activeIndex,
      update: function() { renderWhenContent(runtime); },
    };

    if (isBrowser) {
      registerWhenRuntime(runtime);
    }

    return startMarker;
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
      builder.when(condition, ...content);
      return createWhenBuilderFunction(builder);
    },
    else: function(...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> {
      builder.else(...content);
      return createWhenBuilderFunction(builder);
    },
  }) as unknown as WhenBuilder<TTagName>;
}

export { WhenBuilderImpl };
