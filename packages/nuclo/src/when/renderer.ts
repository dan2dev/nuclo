import { applyNodeModifier } from "../core/modifierProcessor";
import { modifierProbeCache } from "../utility/modifierPredicates";
import { isFunction, isZeroArityFunction } from "../utility/typeGuards";
import { withScopedInsertion } from "../utility/domTypeHelpers";
import type { WhenContent } from "./runtime";

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
