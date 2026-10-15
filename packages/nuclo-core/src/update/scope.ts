/**
 * scope() – tags an element as the root of a named update scope so
 * `update("name")` can refresh just that part of the page.
 *
 * ── Membership index ─────────────────────────────────────────────────────
 * update("id") must not visit every reactive node on the page and ask
 * `root.contains(node)`: with N scoped components each refreshing itself
 * per frame that is O(N²) per frame. Instead every registry (list markers,
 * when markers, reactive elements, reactive text nodes) is a *kind* here:
 * the global iteration set of each kind lives in `all`, and every member
 * also goes through `pending`. The next update() drains `pending`, walking
 * each new node's ancestors once and adding it to the member set of every
 * scope root above it — nested roots included, so update("outer") reaches
 * what update("inner") does. A scoped update then iterates only the member
 * sets of its roots.
 *
 * Membership is computed from the DOM when the node is first seen by an
 * update(), not at registration: nuclo builds subtrees detached and attaches
 * them in one shot, so at registration time a node's ancestors are not in
 * place yet. A node still detached at that point is left out — the passes
 * prune disconnected nodes from the registries anyway.
 *
 * Member sets hold the registries' own WeakRefs, so they pin nothing: a
 * collected member is swept amortized O(1) on insert, and the passes drop
 * disconnected members as they go.
 */
import { isBrowser } from "../shared/environment";
import { isSerializing } from "../shared/serializing";

/** The roots update(...ids) resolved; the passes iterate their members. */
export interface UpdateScope {
  roots: readonly Element[];
}

/** Member kinds, in the order update() runs them. */
export const LIST_KIND = 0;
export const WHEN_KIND = 1;
export const ELEMENT_KIND = 2;
export const TEXT_KIND = 3;
const KINDS = 4;

type Members = Set<WeakRef<Node>>[];

/** Global iteration set per kind — the registries' sets. */
export const all: Members = [new Set(), new Set(), new Set(), new Set()];
/** Members registered since the last update(), per kind, not yet indexed. */
const pending: WeakRef<Node>[][] = [[], [], [], []];
let membersByRoot = new WeakMap<Element, Members>();
/** No scope() ever ran: pending is dropped instead of indexed. */
let hasRoots = false;
/** A scope() ran on an element already in the document, whose descendants may already be indexed. */
let reindex = false;

const EMPTY: Set<WeakRef<Node>> = new Set();

/** Registers a member: in its kind's global set now, indexed by the next update(). */
export function track(kind: number, ref: WeakRef<Node>) {
  all[kind].add(ref);
  pending[kind].push(ref);
}

/** The members of `kind` under `root` (empty if none were indexed). */
export function membersOf(root: Element, kind: number): Set<WeakRef<Node>> {
  return membersByRoot.get(root)?.[kind] ?? EMPTY;
}

function indexMember(kind: number, ref: WeakRef<Node>) {
  const node = ref.deref();
  if (!node || !node.isConnected) return;
  for (let a: Node | null = node; a; a = a.parentNode) {
    if (a.nodeType !== 1 || !idsByRoot.has(a as Element)) continue;
    let members = membersByRoot.get(a as Element);
    if (!members) membersByRoot.set(a as Element, members = [new Set(), new Set(), new Set(), new Set()]);
    const set = members[kind];
    set.add(ref);
    if (set.size >= (sweepAt.get(set) ?? MIN_SWEEP)) sweepCollected(set);
  }
}

/** Indexes everything registered since the last update(). Called by update() before its passes. */
export function indexPending() {
  if (reindex) {
    reindex = false;
    membersByRoot = new WeakMap();
    for (let k = 0; k < KINDS; k++) {
      pending[k].length = 0;
      for (const ref of all[k]) indexMember(k, ref);
    }
    return;
  }
  for (let k = 0; k < KINDS; k++) {
    const queue = pending[k];
    if (queue.length === 0) continue;
    if (hasRoots) for (let i = 0; i < queue.length; i++) indexMember(k, queue[i]);
    queue.length = 0;
  }
}

type ScopeId = string;

/**
 * Stores weak references to scope root elements.
 * Using WeakRef prevents memory leaks - elements can be garbage collected when removed from DOM.
 */
export const scopeRootsById = new Map<ScopeId, Set<WeakRef<Element>>>();

/**
 * Drops a collected root's entry — and its id, once no root is left under it.
 * Without this, per-row ids (scope(`row-${id}`)) that are never passed to
 * update() again would stay in the map forever: one id, one Set and one dead
 * WeakRef per row the app ever rendered. The sweeps below only bound a single
 * id's set, not the number of ids.
 */
const scopeRootFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<{ id: ScopeId; ref: WeakRef<Element> }>(({ id, ref }) => {
      const set = scopeRootsById.get(id);
      if (set?.delete(ref) && set.size === 0) scopeRootsById.delete(id);
    })
  : null;

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
const sweepAt = new WeakMap<Set<WeakRef<object>>, number>();
const MIN_SWEEP = 64;

/** Drops collected refs at amortized O(1) per add. Detached ones are kept. */
function sweepCollected(set: Set<WeakRef<object>>) {
  for (const ref of set) if (ref.deref() === undefined) set.delete(ref);
  sweepAt.set(set, Math.max(MIN_SWEEP, set.size * 2));
}

function addScopeRoot(id: ScopeId, el: Element) {
  let ids = idsByRoot.get(el);
  if (!ids) idsByRoot.set(el, ids = new Set());
  // Re-registration (forceUpdate() reclaim) must not grow the set.
  if (ids.has(id)) return;
  ids.add(id);
  hasRoots = true;
  // A root that is already in the document (hydration, or scope() applied by
  // hand) may have descendants the index already filed elsewhere.
  if (el.isConnected) reindex = true;

  let set = scopeRootsById.get(id);
  if (!set) scopeRootsById.set(id, set = new Set());
  const ref = new WeakRef(el);
  set.add(ref);
  scopeRootFinalizer?.register(el, { id, ref });

  // Ids that are never passed to update(id) are never pruned by getScopeRoots(),
  // so list rows scoped with scope("row") would grow the set forever. Detached
  // roots are kept: they are legitimately unattached while their tree is still
  // being built.
  if (set.size >= (sweepAt.get(set) ?? MIN_SWEEP)) sweepCollected(set);
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

  // A root inside another root in the set is covered by it: its members are
  // a subset of the outer root's, so visiting both would run them twice.
  if (roots.size > 1) {
    for (const root of roots) {
      for (let a = root.parentNode; a; a = a.parentNode) {
        if (roots.has(a as Element)) { roots.delete(root); break; }
      }
    }
  }

  return Array.from(roots);
}

export function scope<TTagName extends ElementTagName = ElementTagName>(
  ...ids: string[]
): NodeModFn<TTagName> {
  const scopeIds = normalizeScopeIds(ids);

  return function(parent: ExpandedElement<TTagName>) {
    if (!isBrowser || isSerializing()) return;
    if (!(parent instanceof Element)) return;
    for (const id of scopeIds) addScopeRoot(id, parent);
  };
}
