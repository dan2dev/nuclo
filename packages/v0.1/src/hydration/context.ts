/**
 * Hydration context — tracks global hydration state and per-parent cursor positions.
 *
 * During hydration the component tree is built against an existing DOM tree
 * (produced by SSR).  Instead of creating new nodes, factories claim existing
 * children from their parent element by advancing a cursor.
 */

let _hydrating = false;
const _cursors = new WeakMap<Node, number>();

export function isHydrating(): boolean {
  return _hydrating;
}

export function startHydration(): void {
  _hydrating = true;
}

export function endHydration(): void {
  _hydrating = false;
}

/**
 * Returns the current cursor position for a parent node.
 */
export function getCursor(parent: Node): number {
  return _cursors.get(parent) ?? 0;
}

/**
 * Sets the cursor position for a parent node.
 */
export function setCursor(parent: Node, index: number): void {
  _cursors.set(parent, index);
}

/**
 * Claims the next child node from parent at the current cursor position.
 * Advances the cursor by one.
 */
export function claimChild(parent: Node): Node | null {
  const cursor = getCursor(parent);
  const child = parent.childNodes[cursor] ?? null;
  if (child) {
    setCursor(parent, cursor + 1);
  }
  return child;
}

/**
 * Attempts to claim an existing element from the parent during hydration.
 * Returns the claimed element if the next child matches the expected tag, or null.
 */
export function claimElement(parent: Node, tagName: string): Element | null {
  if (!_hydrating) return null;
  const candidate = parent.childNodes[getCursor(parent)];
  if (candidate && candidate.nodeType === 1 && (candidate as Element).tagName.toLowerCase() === tagName) {
    return claimChild(parent) as Element;
  }
  return null;
}

/**
 * Removes unclaimed SSR children from a hydrated element.
 * Must be called after modifiers have been applied to a claimed element.
 * Children from [cursor, initialChildCount) are removed.
 */
export function cleanupUnclaimedChildren(node: Node, initialChildCount: number): void {
  const cursorAfter = getCursor(node);
  for (let i = cursorAfter; i < initialChildCount; i++) {
    const child = node.childNodes[cursorAfter];
    if (child) node.removeChild(child);
  }
}
