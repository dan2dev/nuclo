export function isPrimitive(value: unknown): value is Primitive {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}

export function isNode<T>(value: T): value is T & Node {
  return value instanceof Node;
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isTagLike<T>(value: T): value is T & { tagName?: string } {
  return isObject(value) && "tagName" in (value as object);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isFunction<T extends Function>(value: unknown): value is T {
  return typeof value === "function";
}
