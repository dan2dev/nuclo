import { isFunction, isTagLike } from "./typeGuards";

export function resolveRenderable<TTagName extends ElementTagName = ElementTagName>(
  result: unknown,
  host: ExpandedElement<TTagName>,
  index: number
): ExpandedElement<TTagName> | null {
  if (isFunction(result)) {
    const element = (result as NodeModFn<TTagName>)(host, index);
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
