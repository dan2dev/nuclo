// Hot-path type guards. Each is a single typeof check where possible — the JS
// engine inlines typeof aggressively, so avoiding helper indirection is worth it.

/**
 * `true` iff `value` is a JS primitive (`string | number | bigint | boolean |
 * symbol | null | undefined`). Narrows `unknown` to `Primitive`.
 */
export function isPrimitive(value: unknown): value is Primitive {
  if (value === null) return true;
  const t = typeof value;
  return t !== "object" && t !== "function";
}

/**
 * Minimal structural shape that distinguishes a DOM node from a plain object.
 * Real `Node` instances always carry a numeric `nodeType`; the SSR polyfill
 * mirrors that field, so this structural check covers both runtimes.
 */
interface NodeLike {
  readonly nodeType?: unknown;
}

/**
 * `true` iff `value` is a DOM Node (real or polyfilled). Uses `instanceof` in
 * browsers and falls back to a structural `nodeType` probe in non-browser
 * environments (SSR polyfill).
 *
 * @template T Caller-visible type to intersect with `Node` on success.
 */
export function isNode<T>(value: T): value is T & Node {
  if (typeof Node !== "undefined" && value instanceof Node) return true;
  if (typeof value !== "object" || value === null) return false;
  // Polyfill DOM objects: plain objects carrying a numeric nodeType.
  const probe = value satisfies object as NodeLike;
  return typeof probe.nodeType === "number";
}

/**
 * `true` iff `value` is a non-null object. Does NOT include functions.
 */
export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * `true` iff `value` looks like an HTML/SVG element — i.e. has a `tagName`
 * property. Useful for distinguishing attribute bags from element-shaped
 * renderables in hot paths.
 *
 * @template T Caller-visible type to intersect with `{ tagName?: string }`.
 */
export function isTagLike<T>(value: T): value is T & { tagName?: string } {
  return (
    typeof value === "object" && value !== null && "tagName" in (value as object)
  );
}

/** `true` iff `value` is a boolean. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * `true` iff `value` is callable. Returns a signature that accepts any
 * arguments and produces `unknown` so downstream code must either narrow
 * further or explicitly handle the unknown return.
 */
export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * Minimal shape we use to read `.length` off of functions — every function
 * value exposes `length` per ECMA-262, so this is safe to project.
 */
interface ArityProbe {
  readonly length: number;
}

/**
 * `true` iff `value` is a function declared with zero parameters.
 * Used to distinguish reactive resolvers (`() => T`) from modifier
 * callbacks (`(parent, index) => T`).
 */
export function isZeroArityFunction(value: unknown): value is () => unknown {
  return typeof value === "function" && (value satisfies Function as ArityProbe).length === 0;
}
