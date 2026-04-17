import { createMarkerPair } from "../utility/dom";
import type {
  WhenActive,
  WhenCondition,
  WhenContent,
  WhenGroup,
  WhenRuntime,
} from "./runtime";
import {
  renderWhenContent,
  registerWhenRuntime,
  evaluateActiveCondition,
  WHEN_NONE,
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

    host.appendChild(startMarker);
    host.appendChild(endMarker);

    renderWhenContent(runtime);

    return startMarker;
  }

  private hydrateRender(
    host: ExpandedElement<TTagName>,
    index: number,
  ): Node | null {
    // Check if next child is actually a when-start comment marker.
    // If the SSR HTML doesn't contain Nuclo comment markers, fall back
    // to normal rendering (create new markers + render from scratch).
    const cursor = getCursor(host);
    const candidate = host.childNodes[cursor];
    if (
      !candidate ||
      candidate.nodeType !== 8 ||
      !candidate.textContent?.startsWith("when-start-")
    ) {
      return this.freshRender(host, index);
    }

    // Claim existing start marker. `claimChild` returns the child at the
    // current cursor; a comment's concrete DOM type is Comment, and we rely
    // on that for the runtime struct.
    const startMarker = claimChild(host) as Comment;

    // Find end marker position (without claiming)
    let endMarkerIdx = getCursor(host);
    while (endMarkerIdx < host.childNodes.length) {
      const node = host.childNodes[endMarkerIdx];
      if (node.nodeType === 8 && node.textContent === "when-end") break;
      endMarkerIdx++;
    }
    const endMarker = host.childNodes[endMarkerIdx] as Comment;

    // Determine which branch is currently active
    const active = evaluateActiveCondition(
      [...this.groups],
      [...this.elseContent],
    );

    // Re-run active branch content to register reactivity on existing nodes
    if (active.kind !== "none") {
      const contentToRender: ReadonlyArray<WhenContent<TTagName>> =
        active.kind === "group"
          ? this.groups[active.index].content
          : this.elseContent;
      for (const item of contentToRender) {
        applyNodeModifier(host, item, index);
      }
    }

    // Advance cursor past end marker
    setCursor(host, endMarkerIdx + 1);

    const runtime = this.createRuntimeFromMarkers(
      host,
      index,
      startMarker,
      endMarker,
      active,
    );

    return startMarker;
  }

  private createRuntimeFromMarkers(
    host: ExpandedElement<TTagName>,
    index: number,
    startMarker: Comment,
    endMarker: Comment,
    active: WhenActive = WHEN_NONE,
  ): WhenRuntime<TTagName> {
    const runtime: WhenRuntime<TTagName> = {
      startMarker,
      endMarker,
      host,
      index,
      groups: [...this.groups],
      elseContent: [...this.elseContent],
      active,
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
  // The runtime shape is a function (the NodeModFn) with `.when` / `.else`
  // methods attached — exactly the surface `WhenBuilder<TTagName>` declares
  // via its extension of NodeModFn. TS can't re-derive that intersection
  // through `Object.assign`, so we satisfy it once here.
  const nodeModFn: NodeModFn<TTagName> = (host, index) =>
    builder.render(host, index) ?? undefined;

  const methods = {
    when(
      condition: WhenCondition,
      ...content: WhenContent<TTagName>[]
    ): WhenBuilder<TTagName> {
      builder.when(condition, ...content);
      return createWhenBuilderFunction(builder);
    },
    else(...content: WhenContent<TTagName>[]): WhenBuilder<TTagName> {
      builder.else(...content);
      return createWhenBuilderFunction(builder);
    },
  };

  return Object.assign(nodeModFn, methods) satisfies WhenBuilder<TTagName>;
}

export { WhenBuilderImpl };
