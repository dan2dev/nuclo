/**
 * Type-safe DOM helper utilities to reduce type assertions across the codebase.
 * These helpers provide proper typing for DOM operations while maintaining runtime safety.
 */

/**
 * Safely casts an Element-like object to Node & ParentNode interface.
 * This is a common pattern needed when working with DOM manipulation.
 *
 * @param element - The element to cast
 * @returns The element typed as Node & ParentNode
 */
export function asParentNode<T extends Element | object>(element: T): Node & ParentNode {
  return element as unknown as Node & ParentNode;
}

/**
 * Creates a scoped DOM insertion context that temporarily redirects appendChild
 * to insertBefore at a specific reference node. This is useful for inserting
 * content at specific positions in the DOM tree.
 *
 * @param host - The host element
 * @param referenceNode - The node before which new nodes should be inserted
 * @param callback - Function to execute with the scoped context
 * @returns The result of the callback
 */
export function withScopedInsertion<T, THost extends Element | object>(
  host: THost,
  referenceNode: Node,
  callback: () => T
): T {
  const parent = asParentNode(host);
  const originalAppend = parent.appendChild.bind(parent);
  const originalInsert = parent.insertBefore.bind(parent);

  // Temporarily override appendChild to insert before the reference node
  // TypeScript doesn't like this override but it's safe at runtime
  (parent as unknown as Record<string, unknown>).appendChild = function(node: Node): Node {
    return originalInsert(node, referenceNode);
  };

  try {
    return callback();
  } finally {
    // Restore original method
    (parent as unknown as Record<string, unknown>).appendChild = originalAppend;
  }
}

/**
 * Type-safe wrapper for setting CSS style properties.
 * Provides better error handling than direct CSSStyleDeclaration access.
 * Supports both camelCase and kebab-case property names.
 *
 * @param element - The element to apply styles to
 * @param property - The CSS property name (camelCase or kebab-case)
 * @param value - The value to set (string, number, or null to remove)
 * @returns true if the style was applied successfully, false otherwise
 */
export function setStyleProperty(
  element: HTMLElement,
  property: string,
  value: string | number | null
): boolean {
  try {
    if (value === null || value === undefined || value === '') {
      // Use bracket notation to remove property (works with camelCase)
      (element.style as unknown as Record<string, string>)[property] = '';
      return true;
    }

    // Convert value to string first (might throw if toString() throws)
    const stringValue = String(value);
    // Use bracket notation to set property (works with camelCase)
    (element.style as unknown as Record<string, string>)[property] = stringValue;
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
  property: string
): string {
  try {
    return element.style.getPropertyValue(property);
  } catch {
    return '';
  }
}
