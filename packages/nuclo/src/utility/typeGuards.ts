/**
 * Type Guards for nuclo
 * 
 * This module provides type guard functions to safely check the types of values
 * in nuclo's reactive system. These functions help determine how to process
 * different types of modifiers and values.
 */

/**
 * Checks if a value is a primitive type (string, number, boolean, null, undefined).
 * 
 * @param value - The value to check
 * @returns True if the value is a primitive type
 */
export function isPrimitive(value: unknown): value is Primitive {
  return value === null || (typeof value !== "object" && typeof value !== "function");
}

/**
 * Checks if a value is a DOM Node.
 * 
 * @param value - The value to check
 * @returns True if the value is a DOM Node
 */
export function isNode<T>(value: T): value is T & Node {
  return value instanceof Node;
}

/**
 * Checks if a value is an object (but not null).
 * 
 * @param value - The value to check
 * @returns True if the value is an object
 */
export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

/**
 * Checks if a value is tag-like (has a tagName property).
 * 
 * @param value - The value to check
 * @returns True if the value has a tagName property
 */
export function isTagLike<T>(value: T): value is T & { tagName?: string } {
  return isObject(value) && "tagName" in (value as object);
}

/**
 * Checks if a value is a boolean.
 * 
 * @param value - The value to check
 * @returns True if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Checks if a value is a function.
 * 
 * @param value - The value to check
 * @returns True if the value is a function
 */
export function isFunction<T extends Function>(value: unknown): value is T {
  return typeof value === "function";
}
