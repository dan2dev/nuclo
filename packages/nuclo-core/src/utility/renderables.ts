import { isFunction, isTagLike } from "./typeGuards";

type RenderableInput<TTagName extends ElementTagName = ElementTagName> =
  | NodeModFn<TTagName>
  | DetachedExpandedElementFactory<TTagName>
  | DetachedSVGElementFactory
  | SVGElementModifierFn
  | ExpandedElement<TTagName>
  | SVGElement
  | Node
  | null
  | undefined;

export function resolveRenderable<
  TTagName extends ElementTagName = ElementTagName,
>(
  result: RenderableInput<TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ExpandedElement<TTagName> | null {
  if (isFunction(result)) {
    const element = (
      result as (parent: ExpandedElement<TTagName>, index: number) => unknown
    )(host, index);
    if (element && isTagLike(element)) {
      return element as ExpandedElement<TTagName>;
    }
    return null;
  }

  if (result && isTagLike(result)) {
    return result as ExpandedElement<TTagName>;
  }

  return null;
}
