// Hot-path type guards. Each is a single typeof check where possible — the JS
// engine inlines typeof aggressively, so avoiding helper indirection is worth it.

export function isPrimitive(value: unknown): value is Primitive {
  if (value === null) return true;
  const t = typeof value;
  return t !== "object" && t !== "function";
}

export function isNode<T>(value: T): value is T & Node {
  if (typeof Node !== "undefined" && value instanceof Node) return true;
  if (typeof value !== "object" || value === null) return false;
  // Polyfill DOM objects: plain objects carrying a numeric nodeType.
  return typeof (value as { nodeType?: unknown }).nodeType === "number";
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function isTagLike<T>(value: T): value is T & { tagName?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "tagName" in (value as object)
  );
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

export function isZeroArityFunction(value: unknown): value is () => unknown {
  return (
    typeof value === "function" && (value as { length: number }).length === 0
  );
}
