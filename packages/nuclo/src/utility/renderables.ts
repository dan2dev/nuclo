import { isFunction, isTagLike } from "./typeGuards";

type RenderableInput<TTagName extends ElementTagName = ElementTagName> =
  | NodeModFn<TTagName>
  | ExpandedElement<TTagName>
  | Node
  | null
  | undefined;

export function resolveRenderable<TTagName extends ElementTagName = ElementTagName>(
  result: RenderableInput<TTagName>,
  host: ExpandedElement<TTagName>,
  index: number
): ExpandedElement<TTagName> | null {
  if (isFunction(result)) {
    const element = result(host, index);
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
