import { createMarkerPair } from "../utility/dom";
import { asParentNode } from "../utility/domTypeHelpers";
import type {
  WhenCondition,
  WhenContent,
  WhenGroup,
  WhenRuntime,
} from "./runtime";
import {
  renderWhenContent,
  registerWhenRuntime,
  evaluateActiveCondition,
} from "./runtime";
import { isBrowser } from "../utility/environment";
import {
  isHydrating,
  claimChild,
  getCursor,
  setCursor,
} from "../hydration/context";
import { applyNodeModifier } from "../core/modifierProcessor";

class WhenBuilderImpl<TTagName extends ElementTagName = ElementTagName> {
  private groups: WhenGroup<TTagName>[] = [];
  private elseContent: WhenContent<TTagName>[] = [];

  constructor(
    initialCondition: WhenCondition,
    ...content: WhenContent<TTagName>[]
  ) {
    this.groups.push({ condition: initialCondition, content });
  }

  when(
    condition: WhenCondition,
    ...content: WhenContent<TTagName>[]
  ): WhenBuilderImpl<TTagName> {
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

  private freshRender(
    host: ExpandedElement<TTagName>,
    index: number,
  ): Node | null {
    const { start: startMarker, end: endMarker } = createMarkerPair(
      "when",
      index,
    );
    const runtime = this.createRuntimeFromMarkers(
      host,
      index,
      startMarker,
      endMarker,
    );

    const parent = asParentNode(host);
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

    return startMarker;
  }

  private hydrateRender(
    host: ExpandedElement<TTagName>,
    index: number,
  ): Node | null {
    const parentNode = host as unknown as Node & ParentNode;

    // Check if next child is actually a when-start comment marker.
    // If the SSR HTML doesn't contain Nuclo comment markers, fall back
    // to normal rendering (create new markers + render from scratch).
    const cursor = getCursor(parentNode);
    const candidate = parentNode.childNodes[cursor];
    if (
      !candidate ||
      candidate.nodeType !== 8 ||
      !(candidate as Comment).textContent?.startsWith("when-start-")
    ) {
      return this.freshRender(host, index);
    }

    // Claim existing start marker
    const startMarker = claimChild(parentNode) as Comment;

    // Find end marker position (without claiming)
    let endMarkerIdx = getCursor(parentNode);
    while (endMarkerIdx < parentNode.childNodes.length) {
      const node = parentNode.childNodes[endMarkerIdx];
      if (node.nodeType === 8 && (node as Comment).textContent === "when-end")
        break;
      endMarkerIdx++;
    }
    const endMarker = parentNode.childNodes[endMarkerIdx] as Comment;

    // Determine which branch is currently active
    const activeIndex = evaluateActiveCondition(
      [...this.groups],
      [...this.elseContent],
    );

    // Re-run active branch content to register reactivity on existing nodes
    if (activeIndex !== null) {
      const contentToRender =
        activeIndex >= 0 ? this.groups[activeIndex].content : this.elseContent;
      for (const item of contentToRender) {
        applyNodeModifier(
          host,
          item as NodeMod<TTagName> | NodeModFn<TTagName>,
          index,
        );
      }
    }

    // Advance cursor past end marker
    setCursor(parentNode, endMarkerIdx + 1);

    const runtime = this.createRuntimeFromMarkers(
      host,
      index,
      startMarker,
      endMarker,
      activeIndex,
    );

    return startMarker;
  }

  private createRuntimeFromMarkers(
    host: ExpandedElement<TTagName>,
    index: number,
    startMarker: Comment,
    endMarker: Comment,
    activeIndex: number | -1 | null = null,
  ): WhenRuntime<TTagName> {
    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups: [...this.groups],
      elseContent: [...this.elseContent],
      activeIndex,
      update: function () {
        renderWhenContent(runtime);
      },
    };

    if (isBrowser) {
      registerWhenRuntime(runtime);
    }

    return runtime;
  }
}

export function createWhenBuilderFunction<TTagName extends ElementTagName>(
  builder: WhenBuilderImpl<TTagName>,
): WhenBuilder<TTagName> {
  const nodeModFn = function (
    host: ExpandedElement<TTagName>,
    index: number,
  ): Node | null {
    return builder.render(host, index);
  };

  return Object.assign(nodeModFn, {
    when: function (
      condition: WhenCondition,
      ...content: WhenContent<TTagName>[]
    ): WhenBuilder<TTagName> {
      builder.when(condition, ...content);
      return createWhenBuilderFunction(builder);
    },
    else: function (
      ...content: WhenContent<TTagName>[]
    ): WhenBuilder<TTagName> {
      builder.else(...content);
      return createWhenBuilderFunction(builder);
    },
  }) as unknown as WhenBuilder<TTagName>;
}

export { WhenBuilderImpl };
