import { isNodeConnected } from "./dom";

type ScopeId = string;

const scopeRootsById = new Map<ScopeId, Set<Element>>();

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
    set = new Set<Element>();
    scopeRootsById.set(id, set);
  }
  set.add(el);
}

export function getScopeRoots(ids: readonly string[]): Element[] {
  const scopeIds = normalizeScopeIds(ids);
  if (scopeIds.length === 0) return [];

  const roots = new Set<Element>();

  for (const id of scopeIds) {
    const set = scopeRootsById.get(id);
    if (!set) continue;

    for (const el of set) {
      if (!isNodeConnected(el)) {
        set.delete(el);
        continue;
      }
      roots.add(el);
    }

    if (set.size === 0) scopeRootsById.delete(id);
  }

  return Array.from(roots);
}

export function scope<TTagName extends ElementTagName = ElementTagName>(
  ...ids: string[]
): NodeModFn<TTagName> {
  const scopeIds = normalizeScopeIds(ids);

  return (parent: ExpandedElement<TTagName>): void => {
    if (!(parent instanceof Element)) return;
    for (const id of scopeIds) addScopeRoot(id, parent);
  };
}
