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

import { safeRemoveChild } from "./shared/dom";

// The serialization flag is realm-shared state (see shared/serializing.ts);
// re-exported here for callers that already import hydration helpers.
export { isSerializing, runSerializing } from "./shared/serializing";

let _hydrating = false;
// True while forceUpdate() re-hydrates a live, client-rendered tree: text
// claims work without `<!-- text-N -->` markers and reused elements get their
// previous listeners/class state reset before modifiers re-apply.
let _force = false;
// Missing entry = cursor at parent.firstChild; null = past the last child.
let _cursors = new WeakMap<Node, Node | null>();

export function isHydrating(): boolean {
  return _hydrating;
}

/** True only inside a forceUpdate() pass (never during plain hydrate()). */
export function isForceHydrating(): boolean {
  return _hydrating && _force;
}

export function startHydration(force = false): void {
  _hydrating = true;
  _force = force;
  // Each hydration pass starts with a clean cursor slate. Stale cursors from
  // a previous pass would desynchronize claims when a container's content is
  // replaced and re-hydrated (HMR, islands re-mounting).
  _cursors = new WeakMap<Node, Node | null>();
}

export function endHydration(): void {
  _hydrating = false;
  _force = false;
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
 * forceUpdate() text claim: claims the next child when it is a bare text node
 * (client renders emit no `<!-- text-N -->` markers). Whitespace-only text
 * that is followed by a text marker is SSR template formatting, not content —
 * it is left for the marker path, which skips it. Returns null when nothing
 * claimable is at the cursor.
 */
export function claimBareText(parent: Node): Text | null {
  const next = peekChild(parent);
  if (!next || next.nodeType !== 3) return null;
  if (isWhitespaceText(next)) {
    let sibling = next.nextSibling;
    while (sibling && isWhitespaceText(sibling)) sibling = sibling.nextSibling;
    if (
      sibling && sibling.nodeType === 8 &&
      (sibling.textContent ?? "").trimStart().startsWith("text-")
    ) return null;
  }
  claimChild(parent);
  return next as Text;
}

/**
 * Claims a server-rendered `<!--{prefix}-start-…-->` … `<!--{prefix}-end-->`
 * block (list()/when()) at the cursor, leaving the cursor just after the start
 * marker. Returns null, claiming nothing, when the next child isn't a start
 * marker. Pairs are depth-counted because directly nested blocks share a
 * host. A missing end marker (corrupt/truncated SSR output) is recreated right
 * after the start marker and reported as `recreated`.
 */
export function claimMarkerPair(
  parent: Node,
  prefix: "list" | "when",
): { start: Comment; end: Comment; recreated: boolean } | null {
  skipWhitespaceText(parent);
  const start = peekChild(parent);
  const startPrefix = prefix + "-start-";
  if (!start || start.nodeType !== 8 || !start.textContent?.startsWith(startPrefix)) return null;
  claimChild(parent);
  const endText = prefix + "-end";
  let depth = 0;
  for (let node = start.nextSibling; node; node = node.nextSibling) {
    if (node.nodeType !== 8) continue;
    const text = node.textContent;
    if (text === endText) {
      if (depth === 0) return { start: start as Comment, end: node as Comment, recreated: false };
      depth--;
    } else if (text?.startsWith(startPrefix)) {
      depth++;
    }
  }
  const end = document.createComment(endText);
  parent.insertBefore(end, start.nextSibling);
  return { start: start as Comment, end, recreated: true };
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
    // safeRemoveChild (not a bare removeChild): during forceUpdate() the
    // unclaimed nodes were live — their listeners, registrations and
    // onDestroy hooks must be released, not just detached.
    safeRemoveChild(current);
    current = next;
  }
  setCursor(node, null);
}
