/**
 * Type-safe DOM helper utilities to reduce type assertions across the codebase.
 * These helpers provide proper typing for DOM operations while maintaining runtime safety.
 */

/**
 * Structural bridge for monkey-patching `appendChild` on a host without
 * widening to `any` or `Record<string, unknown>`. `ParentNode.appendChild` is
 * declared `readonly` on some DOM lib definitions, so we isolate the reassignment
 * to this local shape.
 */
interface MutableAppendChild {
  appendChild: (node: Node) => Node;
}

/**
 * Creates a scoped DOM insertion context that temporarily redirects appendChild
 * to insertBefore at a specific reference node. This is useful for inserting
 * content at specific positions in the DOM tree.
 *
 * @template T Callback return type.
 * @param host - The parent-capable host element.
 * @param referenceNode - The node before which new nodes should be inserted.
 * @param callback - Function to execute with the scoped context.
 * @returns The value returned by `callback`.
 */
export function withScopedInsertion<T>(
  host: Node & ParentNode,
  referenceNode: Node,
  callback: () => T,
): T {
  const originalAppend = host.appendChild.bind(host);
  const originalInsert = host.insertBefore.bind(host);
  const patchable = host satisfies Node & ParentNode as MutableAppendChild;

  patchable.appendChild = (node) => originalInsert(node, referenceNode);

  try {
    return callback();
  } finally {
    patchable.appendChild = originalAppend;
  }
}

/**
 * `CSSStyleDeclaration` is declared with keyed camelCase getters/setters in
 * the DOM lib, but at runtime it accepts arbitrary string keys (including
 * kebab-case CSS property names like `background-color`). This shape lets us
 * write that dynamic indexed assignment without widening to `any`.
 */
interface StyleIndex {
  [property: string]: string;
}

/**
 * Type-safe wrapper for setting CSS style properties.
 * Provides better error handling than direct CSSStyleDeclaration access.
 * Supports both camelCase and kebab-case property names.
 *
 * @param element - The element to apply styles to
 * @param property - The CSS property name (camelCase or kebab-case)
 * @param value - The value to set. `null`, `undefined`, and `""` all clear the property.
 * @returns true if the style was applied successfully, false otherwise
 */
export function setStyleProperty(
  element: HTMLElement,
  property: string,
  value: string | number | null | undefined,
): boolean {
  try {
    // CSSStyleDeclaration has camelCase named getters/setters but *also*
    // accepts arbitrary string keys at runtime — the DOM lib just doesn't
    // model the dynamic part. One-shot erasure to a string-indexed view.
    const target = element.style as unknown as StyleIndex;
    target[property] =
      value === null || value === undefined || value === ""
        ? ""
        : String(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type-safe wrapper for reading CSS style properties.
 *
 * @param element - The element to read styles from
 * @param property - The CSS property name
 * @returns The computed style value or empty string if not found
 */
export function getStyleProperty(
  element: HTMLElement,
  property: string,
): string {
  try {
    return element.style.getPropertyValue(property);
  } catch {
    return "";
  }
}
