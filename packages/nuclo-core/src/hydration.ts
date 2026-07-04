/**
 * Hydration context — tracks global hydration state and per-parent cursor positions.
 *
 * During hydration the component tree is built against an existing DOM tree
 * (produced by SSR).  Instead of creating new nodes, factories claim existing
 * children from their parent element by advancing a cursor.
 *
 * The cursor is a *node pointer* (the next unclaimed child), not an index.
 * Indexed childNodes access is O(n) after any tree/attribute mutation in
 * jsdom (live NodeList re-materialization) which made hydration O(n²);
 * firstChild/nextSibling pointers are O(1) in every DOM implementation.
 */

let _hydrating = false;
// True while renderToString() is building a tree destined for serialization.
let _serializing = false;
// Missing entry = cursor at parent.firstChild; null = past the last child.
let _cursors = new WeakMap<Node, Node | null>();

export function isHydrating(): boolean {
  return _hydrating;
}

/**
 * True while a tree is being built for SSR serialization (inside
 * renderToString). Text children must keep their `<!-- text-N -->` markers in
 * this mode so the emitted HTML stays hydratable — even when `isBrowser` is
 * true (SSR running under jsdom, or an isomorphic worker that provides a DOM).
 * A pure client render leaves this false and skips the markers.
 */
export function isSerializing(): boolean {
  return _serializing;
}

/**
 * Runs `fn` with serialization mode enabled, restoring the previous state
 * afterwards (so nested/re-entrant renderToString calls behave correctly).
 */
export function runSerializing<T>(fn: () => T): T {
  const previous = _serializing;
  _serializing = true;
  try {
    return fn();
  } finally {
    _serializing = previous;
  }
}

export function startHydration(): void {
  _hydrating = true;
  // Each hydration pass starts with a clean cursor slate. Stale cursors from
  // a previous pass would desynchronize claims when a container's content is
  // replaced and re-hydrated (HMR, islands re-mounting).
  _cursors = new WeakMap<Node, Node | null>();
}

export function endHydration(): void {
  _hydrating = false;
}

/**
 * Runs a callback with hydration temporarily disabled, restoring the previous
 * state afterwards.  Used when a server/client mismatch forces a subtree to be
 * rendered fresh in the middle of a hydration pass — fresh rendering must not
 * claim nodes from the surrounding SSR DOM.
 */
export function runWithoutHydration<T>(fn: () => T): T {
  const wasHydrating = _hydrating;
  _hydrating = false;
  try {
    return fn();
  } finally {
    _hydrating = wasHydrating;
  }
}

/**
 * Returns the next unclaimed child of a parent node (or null at the end)
 * without advancing the cursor.
 */
export function peekChild(parent: Node): Node | null {
  const entry = _cursors.get(parent);
  return entry === undefined ? parent.firstChild : entry;
}

/**
 * Sets the cursor to a specific child node (or null for "past the end").
 */
export function setCursor(parent: Node, node: Node | null): void {
  _cursors.set(parent, node);
}

function isWhitespaceText(node: Node): boolean {
  return node.nodeType === 3 && !/\S/.test(node.textContent || '');
}

/**
 * Advances the cursor past whitespace-only text nodes.
 *
 * Nuclo's own SSR output never produces bare whitespace text nodes (text
 * children are always preceded by a `<!-- text-N -->` marker), so unmarked
 * whitespace comes from the surrounding template or an HTML
 * formatter/minifier.  Skipping (without removing) keeps the cursor aligned
 * while leaving the document's visual whitespace untouched.
 */
export function skipWhitespaceText(parent: Node): void {
  let child = peekChild(parent);
  let advanced = false;
  while (child && isWhitespaceText(child)) {
    child = child.nextSibling;
    advanced = true;
  }
  if (advanced) {
    setCursor(parent, child);
  }
}

/**
 * Claims the next child node from parent at the current cursor position.
 * Advances the cursor by one.
 */
export function claimChild(parent: Node): Node | null {
  const child = peekChild(parent);
  if (child) {
    setCursor(parent, child.nextSibling);
  }
  return child;
}

/**
 * Attempts to claim an existing element from the parent during hydration.
 * Returns the claimed element if the next child matches the expected tag, or null.
 */
export function claimElement(parent: Node, tagName: string): Element | null {
  if (!_hydrating) return null;
  skipWhitespaceText(parent);
  const candidate = peekChild(parent);
  if (candidate && candidate.nodeType === 1 && (candidate as Element).tagName.toLowerCase() === tagName) {
    return claimChild(parent) as Element;
  }
  return null;
}

/**
 * Removes unclaimed SSR children from a hydrated element.
 * Must be called after modifiers have been applied to a claimed element.
 * Removes nodes from the cursor through `lastOriginalChild` (the element's
 * last child before modifiers ran) — nodes appended by modifiers come after
 * that boundary and are preserved.
 */
export function cleanupUnclaimedChildren(node: Node, lastOriginalChild: Node | null): void {
  if (!lastOriginalChild) return;
  let current = peekChild(node);
  while (current) {
    const next = current === lastOriginalChild ? null : current.nextSibling;
    node.removeChild(current);
    current = next;
  }
  setCursor(node, null);
}
