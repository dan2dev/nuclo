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

/**
 * Narrows `value` to a callable. The generic `<T extends Function>` is intentionally
 * removed: it allowed callers to assert any specific function signature via the type
 * parameter without a runtime check, which is unsafe. Use explicit casts at call sites
 * when a more specific signature is needed.
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}

export function isZeroArityFunction(value: unknown): value is () => unknown {
	return isFunction(value) && (value as { length: number }).length === 0;
}
