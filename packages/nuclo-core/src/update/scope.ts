/**
 * scope() – tags an element as the root of a named update scope so
 * `update("name")` can refresh just that part of the page.
 */
import { isBrowser } from "../shared/environment";
import { isSerializing } from "../shared/serializing";

export interface UpdateScope {
  contains(node: Node): boolean;
}


type ScopeId = string;

/**
 * Stores weak references to scope root elements.
 * Using WeakRef prevents memory leaks - elements can be garbage collected when removed from DOM.
 */
const scopeRootsById = new Map<ScopeId, Set<WeakRef<Element>>>();

function normalizeScopeIds(ids: readonly string[]): ScopeId[] {
  const normalized: ScopeId[] = [];
  const seen = new Set<ScopeId>();

  for (const raw of ids) {
    if (typeof raw !== "string") continue;
    const id = raw.trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }

  return normalized;
}

/** Ids each root is already registered under: O(1) dedup instead of a set scan. */
const idsByRoot = new WeakMap<Element, Set<ScopeId>>();
/** Sweep a set of dead refs once it grows past this; doubles with the live size. */
const sweepAt = new WeakMap<Set<WeakRef<Element>>, number>();
const MIN_SWEEP = 64;

function addScopeRoot(id: ScopeId, el: Element): void {
  let ids = idsByRoot.get(el);
  if (!ids) idsByRoot.set(el, ids = new Set());
  // Re-registration (forceUpdate() reclaim) must not grow the set.
  if (ids.has(id)) return;
  ids.add(id);

  let set = scopeRootsById.get(id);
  if (!set) scopeRootsById.set(id, set = new Set());
  set.add(new WeakRef(el));

  // Ids that are never passed to update(id) are never pruned by getScopeRoots(),
  // so list rows scoped with scope("row") would grow the set forever. Sweep
  // collected refs at amortized O(1) per add. Detached roots are kept: they
  // are legitimately unattached while their tree is still being built.
  if (set.size >= (sweepAt.get(set) ?? MIN_SWEEP)) {
    for (const ref of set) if (ref.deref() === undefined) set.delete(ref);
    sweepAt.set(set, Math.max(MIN_SWEEP, set.size * 2));
  }
}

export function getScopeRoots(ids: readonly string[]): Element[] {
  const scopeIds = normalizeScopeIds(ids);
  if (scopeIds.length === 0) return [];

  const roots = new Set<Element>();

  for (const id of scopeIds) {
    const set = scopeRootsById.get(id);
    if (!set) continue;

    for (const ref of set) {
      const el = ref.deref();
      // Collected or disconnected: drop it (deleting while iterating a Set is safe).
      if (el === undefined) set.delete(ref);
      else if (!el.isConnected) {
        set.delete(ref);
        idsByRoot.get(el)?.delete(id); // let scope() re-register it if it comes back
      } else roots.add(el);
    }

    if (set.size === 0) scopeRootsById.delete(id);
  }

  return Array.from(roots);
}

export function scope<TTagName extends ElementTagName = ElementTagName>(
  ...ids: string[]
): NodeModFn<TTagName> {
  const scopeIds = normalizeScopeIds(ids);

  return function(parent: ExpandedElement<TTagName>): void {
    if (!isBrowser || isSerializing()) return;
    if (!(parent instanceof Element)) return;
    for (const id of scopeIds) addScopeRoot(id, parent);
  };
}
