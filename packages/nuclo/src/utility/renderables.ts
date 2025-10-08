import { isFunction, isTagLike } from "./typeGuards";

export function resolveRenderable(
  result: unknown,
  host: ExpandedElement<any>,
  index: number
): ExpandedElement<any> | null {
  if (isFunction(result)) {
    const element = (result as NodeModFn<any>)(host, index);
    if (element && isTagLike(element)) {
      return element as ExpandedElement<any>;
    }
    return null;
  }

  if (result && isTagLike(result)) {
    return result as ExpandedElement<any>;
  }

  return null;
}
