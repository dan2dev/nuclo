import { isBrowser } from "../utility/environment";
import { createMarkerPair, createComment } from "../utility/dom";
import { asParentNode } from "../utility/domTypeHelpers";
import type { WhenCondition, WhenContent, WhenGroup, WhenRuntime } from "./runtime";
import { renderWhenContent, registerWhenRuntime } from "./runtime";

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
      update: function() { renderWhenContent(runtime); },
    };

    registerWhenRuntime(runtime);

    const parent = asParentNode(host);
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);

    renderWhenContent(runtime);

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
