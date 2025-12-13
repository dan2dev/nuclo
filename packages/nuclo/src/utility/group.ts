import { isNodeConnected } from "./dom";

type GroupId = string;

const groupRootsById = new Map<GroupId, Set<Element>>();

function normalizeGroupIds(ids: readonly string[]): GroupId[] {
  const normalized: GroupId[] = [];
  const seen = new Set<GroupId>();

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

function addGroupRoot(id: GroupId, el: Element): void {
  let set = groupRootsById.get(id);
  if (!set) {
    set = new Set<Element>();
    groupRootsById.set(id, set);
  }
  set.add(el);
}

export function getGroupRoots(ids: readonly string[]): Element[] {
  const groupIds = normalizeGroupIds(ids);
  if (groupIds.length === 0) return [];

  const roots = new Set<Element>();

  for (const id of groupIds) {
    const set = groupRootsById.get(id);
    if (!set) continue;

    for (const el of set) {
      if (!isNodeConnected(el)) {
        set.delete(el);
        continue;
      }
      roots.add(el);
    }

    if (set.size === 0) groupRootsById.delete(id);
  }

  return Array.from(roots);
}

export function group<TTagName extends ElementTagName = ElementTagName>(
  ...ids: string[]
): NodeModFn<TTagName> {
  const groupIds = normalizeGroupIds(ids);

  return (parent: ExpandedElement<TTagName>): void => {
    if (!(parent instanceof Element)) return;
    for (const id of groupIds) addGroupRoot(id, parent);
  };
}

