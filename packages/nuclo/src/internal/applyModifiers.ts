/**
 * Shared helper for applying an array of modifiers to an element.
 * Consolidates the previously duplicated logic in several modules:
 *  - conditionalRenderer
 *  - conditionalUpdater
 *  - elementFactory
 *
 * Goal: single, optimized, well‑typed implementation.
 *
 * A "modifier" can:
 *  - Return (or be) primitives → appended as text
 *  - Return (or be) Node → appended (if not already a child)
 *  - Return (or be) attribute objects → merged into element
 *  - Be a NodeModFn invoked with (parent, index)
 *  - Be a zero‑arg function producing reactive text (handled upstream in applyNodeModifier)
 *
 * Indexing:
 *  - startIndex allows callers to continue an index sequence if needed.
 *  - Every successfully rendered child Node increments the local index.
 */
import { applyNodeModifier } from "../core/modifierProcessor";

export type NodeModifier<TTagName extends ElementTagName = ElementTagName> =
  | NodeMod<TTagName>
  | NodeModFn<TTagName>;

export interface ApplyModifiersResult<TTagName extends ElementTagName> {
  /**
   * The element passed in (for fluent patterns if desired).
   */
  element: ExpandedElement<TTagName>;
  /**
   * The next index after processing (startIndex + rendered children count).
   */
  nextIndex: number;
  /**
   * Number of child nodes appended (not counting attributes-only modifiers).
   */
  appended: number;
}

/**
 * Applies modifiers to an element, appending newly produced Nodes while avoiding
 * duplicate DOM insertions (i.e. only appends if parentNode differs).
 *
 * Returns meta information that callers can use for continuation indexing.
 */
export function applyModifiers<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>,
  startIndex = 0
): ApplyModifiersResult<TTagName> {
  if (!modifiers || modifiers.length === 0) {
    return { element, nextIndex: startIndex, appended: 0 };
  }

  let localIndex = startIndex;
  let appended = 0;
  const parentNode = element as unknown as Node & ParentNode;

  for (let i = 0; i < modifiers.length; i += 1) {
    const mod = modifiers[i];
    // Fast null/undefined skip
    if (mod == null) continue;

    const produced = applyNodeModifier(element, mod, localIndex);
    if (!produced) continue;

    // Only append if the node isn't already where we expect
    if (produced.parentNode !== parentNode) {
      parentNode.appendChild(produced);
    }
    localIndex += 1;
    appended += 1;
  }

  return {
    element,
    nextIndex: localIndex,
    appended
  };
}

/**
 * Convenience helper: apply modifiers and return the element (fluent style).
 * Discards meta information.
 */
export function applyModifiersAndReturn<TTagName extends ElementTagName>(
  element: ExpandedElement<TTagName>,
  modifiers: ReadonlyArray<NodeModifier<TTagName>>,
  startIndex = 0
): ExpandedElement<TTagName> {
  applyModifiers(element, modifiers, startIndex);
  return element;
}