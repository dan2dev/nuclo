import { isNodeConnected } from "./dom";

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

function addScopeRoot(id: ScopeId, el: Element): void {
  let set = scopeRootsById.get(id);
  if (!set) {
    set = new Set<WeakRef<Element>>();
    scopeRootsById.set(id, set);
  }
  set.add(new WeakRef(el));
}

export function getScopeRoots(ids: readonly string[]): Element[] {
  const scopeIds = normalizeScopeIds(ids);
  if (scopeIds.length === 0) return [];

  const roots = new Set<Element>();

  for (const id of scopeIds) {
    const set = scopeRootsById.get(id);
    if (!set) continue;

    const toDelete: WeakRef<Element>[] = [];

    for (const ref of set) {
      const el = ref.deref();
      if (el === undefined) {
        // Element was garbage collected
        toDelete.push(ref);
        continue;
      }
      if (!isNodeConnected(el)) {
        // Element is disconnected, clean it up
        toDelete.push(ref);
        continue;
      }
      roots.add(el);
    }

    // Clean up dead and disconnected references
    for (const ref of toDelete) {
      set.delete(ref);
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
    if (!(parent instanceof Element)) return;
    for (const id of scopeIds) addScopeRoot(id, parent);
  };
}
