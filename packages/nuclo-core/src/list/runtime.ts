/**
 * Keyed list runtime: renders `list(provider, render)` blocks and keeps their
 * DOM rows in sync with the provider's items on every update().
 *
 * sync() is a keyed diff over item identity (===):
 *  1. skip when the items are unchanged (arraysEqual),
 *  2. trim rows that already back the same item at the same position from both
 *     ends — pure appends, prepends, insertions and deletions then need no
 *     keying structures at all,
 *  3. key the remaining window by item identity (same-position rows pinned
 *     first, duplicate items matched FIFO), remove the rows whose item is gone,
 *  4. place the window anchored backwards from the row after it: survivors on
 *     the longest increasing subsequence of old positions never move, and runs
 *     of freshly built rows are batched into DocumentFragments.
 */
import { createMarkerPair, safeRemoveChild, disposeLifecyclesInSubtree } from "../shared/dom";
import { isHydrating, isSerializing, claimMarkerPair, peekChild, setCursor } from "../hydration";
import type { ListRuntime, ListItemRecord } from "./types";
import type { UpdateScope } from "../update/scope";
import { isBrowser } from "../shared/environment";
import { getFactoryMods, getFactoryTag, withMetadataOnlyFactories, getMetadataOnlyFactoryCheckpoint, releaseMetadataOnlyFactories } from "../element/factory-meta";
import { analyzeFactory, prepareSkeleton, instantiateTemplate, adoptTemplateLeaves, flushRowLeaves, type RowLeaves } from "./template";
import { hasActiveLifecycleRegistrations } from "../element/lifecycle";

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Registry of active list runtimes.
 *
 * The iteration set only holds WeakRefs; the runtime itself lives in a
 * WeakMap keyed by its start marker. This keeps the global registry free of
 * strong references to the runtime (which holds the host element, records,
 * and markers), so removing a list's DOM subtree makes the whole runtime
 * collectible — even if update() is never called again. The
 * FinalizationRegistry prunes dead WeakRefs from the set once the marker is
 * collected; updateListRuntimes() also prunes as it iterates.
 */
const activeListRuntimes = new Set<WeakRef<Comment>>();
const listRuntimeByMarker = new WeakMap<Comment, ListRuntime<unknown, ElementTagName>>();
const listMarkerFinalizer = typeof FinalizationRegistry !== "undefined"
  ? new FinalizationRegistry<WeakRef<Comment>>((ref) => { activeListRuntimes.delete(ref); })
  : null;
let updateListFlushEpoch = 0;

function registerListRuntime(startMarker: Comment, runtime: ListRuntime<unknown, ElementTagName>): void {
  const ref = new WeakRef(startMarker);
  activeListRuntimes.add(ref);
  listRuntimeByMarker.set(startMarker, runtime);
  listMarkerFinalizer?.register(startMarker, ref);
}

function normalizeItems<TItem>(items: ListItemsInput<TItem>): readonly TItem[] {
  return Array.isArray(items) ? items : Array.from(items);
}

/**
 * Resolves a render() result — a tag-builder factory / NodeModFn (called with
 * the host) or an already-built element — to the row element. Anything else
 * (null, primitives, attribute objects, non-element nodes) renders no row.
 */
function toRowElement<TTagName extends ElementTagName>(
  result: unknown,
  host: ExpandedElement<TTagName>,
  index: number,
): ExpandedElement<TTagName> | null {
  const value = typeof result === "function" ? (result as NodeModFn<TTagName>)(host, index) : result;
  return value !== null && typeof value === "object" && "tagName" in value
    ? value as ExpandedElement<TTagName>
    : null;
}

/**
 * Renders a row through the un-templated path. Used whenever a row's shape
 * doesn't match (or no longer matches) the list's active template — the
 * caller has already reset `runtime.template`.
 */
function rebuildRowNormally<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
  item: TItem,
  index: number,
): ExpandedElement<TTagName> | null {
  return toRowElement(runtime.renderItem(item, index), runtime.host, index);
}

/**
 * Shared collection buffer for a template row's dynamic leaves. A per-row `[]`
 * grown by push() gets a ~16-slot backing store which the record then retains
 * for the row's whole lifetime; collecting here and keeping an exact-size
 * slice() drops that slack. Each use starts at the current length and
 * truncates back to it afterwards, so a nested render (a resolver that renders
 * another list) can't clobber an outer row's leaves, and the buffer never
 * retains nodes or resolvers between rows.
 */
const leafScratch: RowLeaves = [];

function takeLeaves(start: number): RowLeaves | null {
  return leafScratch.length > start ? leafScratch.slice(start) : null;
}

function renderItem<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
  item: TItem,
  index: number,
) {
  const checkpoint = getMetadataOnlyFactoryCheckpoint();
  try {
    return renderItemWithTemplate(runtime, item, index);
  } finally {
    releaseMetadataOnlyFactories(checkpoint);
  }
}

function renderItemWithTemplate<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
  item: TItem,
  index: number,
): ExpandedElement<TTagName> | null {
  runtime.lastRenderLeaves = null;
  const template = runtime.template;
  const canUseTemplate = isBrowser && !isHydrating() && !isSerializing();

  // Row-template fast path: rows from the same render function share their
  // structure, so after analyzing the first row every following row is a
  // skeleton clone + leaf patch instead of a full per-element build.
  const result = template && canUseTemplate
    ? withMetadataOnlyFactories(runtime.renderItem, item, index)
    : runtime.renderItem(item, index);

  if (template !== null && canUseTemplate) {
    const mods = getFactoryMods(result);
    if (mods !== undefined) {
      if (template === undefined) {
        const tag = getFactoryTag(result);
        const tmpl = tag ? analyzeFactory(tag, mods) : null;
        const el = toRowElement(result, runtime.host, index);
        if (tmpl && el) {
          const skeleton = (el as unknown as Node).cloneNode(true) as Element;
          prepareSkeleton(tmpl, skeleton);
          const start = leafScratch.length;
          let adopted = false;
          try {
            adopted = adoptTemplateLeaves(tmpl, mods, el as unknown as Element, leafScratch);
            if (adopted) runtime.lastRenderLeaves = takeLeaves(start);
          } finally {
            leafScratch.length = start;
          }
          if (!adopted) {
            runtime.template = null;
            runtime.lastRenderLeaves = null;
            return el;
          }
          runtime.template = { tmpl, skeleton };
        } else {
          runtime.template = null;
        }
        return el;
      }
      const clone = template.skeleton.cloneNode(true) as Element;
      const start = leafScratch.length;
      try {
        if (getFactoryTag(result) === template.tmpl.tag && instantiateTemplate(template.tmpl, mods, clone, leafScratch)) {
          runtime.lastRenderLeaves = takeLeaves(start);
          return clone as unknown as ExpandedElement<TTagName>;
        }
      } finally {
        leafScratch.length = start;
      }
      // Heterogeneous rows: deactivate and rebuild this row normally. The
      // abandoned clone is disconnected and unregistered — plain garbage.
      // (lastRenderLeaves is already null from the top of this call.)
      runtime.template = null;
      return rebuildRowNormally(runtime, item, index);
    } else if (template === undefined) {
      runtime.template = null;
    } else {
      runtime.template = null;
      return rebuildRowNormally(runtime, item, index);
    }
  }

  return toRowElement(result, runtime.host, index);
}

/**
 * Detaches every record's row element from the DOM with a plain removeChild
 * loop — one call per top-level row, never descending into a row's subtree.
 * Each record's element is a direct child of `parent` (the rows between the two
 * list markers), so iterating records removes exactly the same nodes the
 * markers span.
 *
 * This is O(rows): removeChild is O(1) given the node. We deliberately do NOT
 * use Range.deleteContents() here. Its spec-faithful "is this node contained?"
 * check (compareBoundaryPointsPosition → isFollowing) re-walks the tree from
 * the range start for *every* spanned node, which is O(nodes²) in non-native
 * DOM implementations (jsdom) and — because the walk visits descendants — scales
 * with nodes-per-row, so a nested `tr>td>td` row template made replace/clear
 * quadratic where a flat `div` row only looked linear.
 *
 * Unlike safeRemoveChild, this does NOT eagerly walk each subtree to detach
 * listeners and prune reactive registries. That walk is the dominant per-row
 * cost when clearing/replacing a large list, and it is redundant here:
 *  - Reactive text/attribute registries hold their targets only through
 *    WeakRef/WeakMap, and every update() prunes entries whose node became
 *    disconnected (which removeChild makes them). The real-GC tests in
 *    test/memory/gc-collectability.test.ts prove a detached subtree is
 *    collectible with no eager cleanup and no extra update pass.
 *  - Event listeners are tracked in a WeakMap keyed by element, so they are
 *    released when the element is collected.
 *
 * Returns false (and mutates nothing) when the markers aren't both children of
 * `parent`, so the caller can fall back to per-node removal.
 */
function bulkClearRecords<TItem, TTagName extends ElementTagName>(
  records: ReadonlyArray<ListItemRecord<TItem, TTagName>>,
  parent: Node & ParentNode,
  startMarker: Comment,
  endMarker: Comment,
): boolean {
  if (startMarker.parentNode !== parent || endMarker.parentNode !== parent) return false;

  // Neither fast path below walks each row's subtree (that's the whole point
  // — see the class doc comment), so it can't rely on cleanupNodeTree() to
  // fire onDestroy for rows using it. Firing it here first keeps that
  // guarantee without costing anything when lifecycle hooks aren't in use
  // anywhere on the page (the single comparison inside
  // hasActiveLifecycleRegistrations() short-circuits the whole loop).
  if (hasActiveLifecycleRegistrations()) {
    for (let i = 0; i < records.length; i++) {
      const node = records[i].element as unknown as Node | null;
      if (node) disposeLifecyclesInSubtree(node);
    }
  }

  // Fastest clear: when the list spans the whole parent (the common case — a
  // tbody or ul dedicated to the list), one textContent write drops every row
  // in a single native call, then the marker pair is re-attached (same nodes,
  // so registry identity is preserved).
  if (isBrowser && parent.firstChild === startMarker && parent.lastChild === endMarker) {
    (parent as Node).textContent = "";
    parent.appendChild(startMarker);
    parent.appendChild(endMarker);
    return true;
  }

  for (let i = 0; i < records.length; i++) {
    const node = records[i].element as unknown as Node | null;
    // Detach the row (guard against an already-moved/detached element so a
    // stale record can't throw). Children of the row go with it in one call.
    if (node && node.parentNode === parent) parent.removeChild(node);
  }
  return true;
}

/** sync(): anchor on pinned rows alone when at most this many survivors move. */
const PINNED_ONLY_MAX_MOVES = 8;
/** ...and only in windows this large, where skipping the LIS actually pays. */
const PINNED_ONLY_MIN_PINNED = 32;

/**
 * Computes a longest strictly-increasing subsequence of `arr` and returns the
 * indices (into `arr`) that belong to it, in ascending order. O(n log n).
 *
 * Used so reordering only moves the minimum number of DOM nodes: records whose
 * old position sits on the increasing subsequence are already in the correct
 * relative order and never touched; everything else is repositioned.
 */
function longestIncreasingSubsequence(arr: number[]): number[] {
  const n = arr.length;
  if (n === 0) return [];
  const predecessor = new Array<number>(n);
  // tails[k] = index into arr of the smallest tail of an increasing
  // subsequence of length k+1.
  const tails: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = arr[i];
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[tails[mid]] < x) lo = mid + 1;
      else hi = mid;
    }
    predecessor[i] = lo > 0 ? tails[lo - 1] : -1;
    if (lo === tails.length) tails.push(i);
    else tails[lo] = i;
  }
  let k = tails.length;
  let idx = tails[k - 1];
  const result = new Array<number>(k);
  while (k > 0) {
    result[--k] = idx;
    idx = predecessor[idx];
  }
  return result;
}

/**
 * Renders items in [startIndex, endIndexExclusive) and inserts their elements
 * before `anchor` as a single DocumentFragment. Appends the created records to
 * `targetRecords` in order.
 */
function buildAndInsert<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
  parent: Node & ParentNode,
  items: readonly TItem[],
  startIndex: number,
  endIndexExclusive: number,
  anchor: Node,
  targetRecords: ListItemRecord<TItem, TTagName>[],
): void {
  const fragment = document.createDocumentFragment();
  for (let i = startIndex; i < endIndexExclusive; i++) {
    const item = items[i];
    const element = renderItem(runtime, item, i);
    if (!element) continue;
    const dyn = runtime.lastRenderLeaves;
    targetRecords.push({
      item,
      element,
      dyn,
      dynCreatedAt: dyn ? runtime.currentFlushEpoch : undefined,
    });
    runtime.lastRenderLeaves = null;
    fragment.appendChild(element as unknown as Node);
  }
  if (fragment.firstChild) parent.insertBefore(fragment, anchor);
}

export function sync<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>
): void {
  const { startMarker, endMarker } = runtime;
  const parent = (startMarker.parentNode ?? (runtime.host as unknown as Node & ParentNode)) as
    Node & ParentNode;

  const items = normalizeItems(runtime.itemsProvider());

  if (arraysEqual(runtime.lastSyncedItems, items)) return;

  const oldRecords = runtime.records;
  const oldLen = oldRecords.length;
  const newLen = items.length;

  // Fast path — clear: one removeChild per row, skipping the eager per-subtree
  // cleanup walk (see bulkClearRecords).
  if (newLen === 0) {
    if (oldLen > 0 && !bulkClearRecords(oldRecords, parent, startMarker, endMarker)) {
      for (let i = 0; i < oldLen; i++) safeRemoveChild(oldRecords[i].element as unknown as Node);
    }
    runtime.records = [];
    runtime.lastSyncedItems = [];
    runtime.allRecordsCreatedAt = undefined;
    return;
  }

  // Trim rows that already back the same item at the same position from both
  // ends. They never move, and most updates (append, prepend, single insert or
  // delete) reduce to an empty window on one side.
  let prefix = 0;
  const maxTrim = Math.min(oldLen, newLen);
  while (prefix < maxTrim && oldRecords[prefix].item === items[prefix]) prefix++;
  let suffix = 0;
  const maxSuffix = maxTrim - prefix;
  while (suffix < maxSuffix && oldRecords[oldLen - 1 - suffix].item === items[newLen - 1 - suffix]) {
    suffix++;
  }

  const oldStart = prefix;
  const oldEnd = oldLen - suffix;
  const newStart = prefix;
  const newEnd = newLen - suffix;

  // Every old row was trimmed → pure insertion (first render, append, prepend,
  // middle insert). Build the new rows into one fragment before the row that
  // follows the gap. (An empty new window is a no-op here.)
  if (oldStart === oldEnd) {
    const anchor: Node = oldEnd < oldLen ? (oldRecords[oldEnd].element as unknown as Node) : endMarker;
    if (oldEnd === oldLen) {
      buildAndInsert(runtime, parent, items, newStart, newEnd, anchor, oldRecords);
      runtime.allRecordsCreatedAt = oldLen === 0 ? runtime.currentFlushEpoch : undefined;
    } else {
      const fresh: ListItemRecord<TItem, TTagName>[] = [];
      buildAndInsert(runtime, parent, items, newStart, newEnd, anchor, fresh);
      runtime.records = oldRecords.slice(0, oldStart).concat(fresh, oldRecords.slice(oldStart));
      runtime.allRecordsCreatedAt = undefined;
    }
    runtime.lastSyncedItems = items.slice();
    return;
  }

  // Every new row was trimmed → pure removal. This is always partial (a full
  // clear was handled above), so remove each row eagerly.
  if (newStart === newEnd) {
    for (let i = oldStart; i < oldEnd; i++) safeRemoveChild(oldRecords[i].element as unknown as Node);
    oldRecords.splice(oldStart, oldEnd - oldStart);
    runtime.allRecordsCreatedAt = undefined;
    runtime.lastSyncedItems = items.slice();
    return;
  }

  // General keyed diff over the window ---------------------------------------
  const oldWinLen = oldEnd - oldStart;
  const newWinLen = newEnd - newStart;

  // sources[j] = index into oldRecords of the record backing new position
  // newStart + j, or -1 when the row must be freshly rendered.
  const sources = new Array<number>(newWinLen).fill(-1);
  // claimed[i - oldStart] = the old record was matched to a new position.
  const claimed = new Uint8Array(oldWinLen);
  let reusedCount = 0;

  // Pin records whose item is unchanged at the same position. This keeps
  // duplicate item references attached to their original rows.
  const pinEnd = Math.min(oldEnd, newEnd);
  for (let i = prefix; i < pinEnd; i++) {
    if (oldRecords[i].item === items[i]) {
      sources[i - newStart] = i;
      claimed[i - oldStart] = 1;
      reusedCount++;
    }
  }
  const pinnedCount = reusedCount;

  // Bucket in reverse DOM order so pop() matches duplicates FIFO in O(1). The value
  // is a single old index, promoted to an index array only when the same item
  // occurs more than once (duplicates are matched FIFO).
  const buckets = new Map<TItem, number | number[]>();
  for (let i = oldEnd - 1; i >= oldStart; i--) {
    if (claimed[i - oldStart]) continue;
    const item = oldRecords[i].item;
    const entry = buckets.get(item);
    if (entry === undefined) buckets.set(item, i);
    else if (typeof entry === "number") buckets.set(item, [entry, i]);
    else entry.push(i);
  }

  for (let j = 0; j < newWinLen; j++) {
    if (sources[j] !== -1) continue;
    const entry = buckets.get(items[newStart + j]);
    if (entry === undefined) continue;
    let oldIndex: number;
    if (typeof entry === "number") {
      oldIndex = entry;
      buckets.delete(items[newStart + j]);
    } else {
      oldIndex = entry.pop()!;
      if (entry.length === 0) buckets.delete(items[newStart + j]);
    }
    sources[j] = oldIndex;
    claimed[oldIndex - oldStart] = 1;
    reusedCount++;
  }

  // Nothing survives anywhere → full replace: bulk-detach all old rows and
  // build every new row into a single fragment.
  if (reusedCount === 0 && oldStart === 0 && oldEnd === oldLen) {
    if (!bulkClearRecords(oldRecords, parent, startMarker, endMarker)) {
      for (let i = 0; i < oldLen; i++) safeRemoveChild(oldRecords[i].element as unknown as Node);
    }
    const fresh: ListItemRecord<TItem, TTagName>[] = [];
    buildAndInsert(runtime, parent, items, 0, newLen, endMarker, fresh);
    runtime.records = fresh;
    runtime.allRecordsCreatedAt = runtime.currentFlushEpoch;
    runtime.lastSyncedItems = items.slice();
    return;
  }

  // Remove stale rows BEFORE placement. A removed element left in the DOM
  // would end up interleaved with the survivors the placement phase leaves
  // untouched.
  for (let i = oldStart; i < oldEnd; i++) {
    if (!claimed[i - oldStart]) safeRemoveChild(oldRecords[i].element as unknown as Node);
  }

  // Determine the minimal set of survivors that must move. Survivors whose old
  // positions form an increasing subsequence are already correctly ordered.
  //
  // Pinned rows (same index before and after) are such a subsequence on their
  // own. When nearly every survivor is pinned — swapping two rows of a large
  // list — anchoring on them alone moves only the few unpinned survivors and
  // skips the O(n log n) LIS pass and its arrays. The true LIS can save at
  // most `unpinned` moves over that, so the shortcut is bounded to a handful.
  let stable: Uint8Array | null = null;
  const unpinned = reusedCount - pinnedCount;
  const pinnedOnly = unpinned <= PINNED_ONLY_MAX_MOVES && pinnedCount >= PINNED_ONLY_MIN_PINNED;
  if (reusedCount > 0 && !pinnedOnly) {
    const survivorOldIndices: number[] = [];
    const survivorPositions: number[] = [];
    for (let j = 0; j < newWinLen; j++) {
      if (sources[j] !== -1) {
        survivorOldIndices.push(sources[j]);
        survivorPositions.push(j);
      }
    }
    stable = new Uint8Array(newWinLen);
    const lis = longestIncreasingSubsequence(survivorOldIndices);
    for (let k = 0; k < lis.length; k++) stable[survivorPositions[lis[k]]] = 1;
  }

  // Place the window anchored backwards from the first row after it. Runs of
  // freshly created rows are batched into a fragment; survivors on the LIS are
  // left untouched.
  const windowRecords = new Array<ListItemRecord<TItem, TTagName> | null>(newWinLen);
  let nullCount = 0;
  let anchor: Node = oldEnd < oldLen ? (oldRecords[oldEnd].element as unknown as Node) : endMarker;
  let fragment: DocumentFragment | null = null;

  for (let j = newWinLen - 1; j >= 0; j--) {
    const src = sources[j];

    if (src === -1) {
      // Fresh row. Prefer batching consecutive new rows into a fragment (one
      // DOM insert); prepending keeps ascending order.
      const item = items[newStart + j];
      const element = renderItem(runtime, item, newStart + j);
      if (!element) {
        windowRecords[j] = null;
        nullCount++;
        continue;
      }
      const dyn = runtime.lastRenderLeaves;
      windowRecords[j] = {
        item,
        element,
        dyn,
        dynCreatedAt: dyn ? runtime.currentFlushEpoch : undefined,
      };
      runtime.lastRenderLeaves = null;
      fragment ??= document.createDocumentFragment();
      fragment.insertBefore(element as unknown as Node, fragment.firstChild);
      continue;
    }

    // Survivor: flush any pending fresh rows (they belong after it), moving
    // the anchor to the first flushed node so this row lands before them.
    const record = oldRecords[src];
    windowRecords[j] = record;
    const node = record.element as unknown as Node;
    if (fragment && fragment.firstChild) {
      const firstFlushed = fragment.firstChild;
      parent.insertBefore(fragment, anchor);
      anchor = firstFlushed;
      fragment = null;
    }
    // Pinned-only mode: a survivor is pinned iff it kept its index (a bucket
    // match can never land on its own old index — the pin pass took those).
    if (stable ? !stable[j] : !(pinnedOnly && src === newStart + j)) {
      parent.insertBefore(node, anchor);
    }
    anchor = node;
  }
  if (fragment && fragment.firstChild) parent.insertBefore(fragment, anchor);

  // Stitch the untouched prefix and suffix around the window's records.
  const merged = new Array<ListItemRecord<TItem, TTagName>>(
    oldStart + (newWinLen - nullCount) + (oldLen - oldEnd),
  );
  let w = 0;
  for (let i = 0; i < oldStart; i++) merged[w++] = oldRecords[i];
  for (let j = 0; j < newWinLen; j++) {
    const record = windowRecords[j];
    if (record) merged[w++] = record;
  }
  for (let i = oldEnd; i < oldLen; i++) merged[w++] = oldRecords[i];
  runtime.records = merged;
  runtime.allRecordsCreatedAt = undefined;
  runtime.lastSyncedItems = items.slice();
}

/** Every field initialized up front so all runtimes share one object shape. */
function newRuntime<TItem, TTagName extends ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderItem: ListRenderFunction<TItem, TTagName>,
  startMarker: Comment,
  endMarker: Comment,
  records: ListItemRecord<TItem, TTagName>[],
  host: ExpandedElement<TTagName>,
  lastSyncedItems: readonly TItem[],
): ListRuntime<TItem, TTagName> {
  return {
    itemsProvider,
    renderItem,
    startMarker,
    endMarker,
    records,
    host,
    lastSyncedItems,
    template: undefined,
    lastRenderLeaves: null,
    currentFlushEpoch: undefined,
    allRecordsCreatedAt: undefined,
  };
}

export function createListRuntime<TItem, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderItem: ListRenderFunction<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ListRuntime<TItem, TTagName> {
  if (isHydrating()) {
    return hydrateListRuntime(itemsProvider, renderItem, host, index);
  }

  return createListRuntimeNormal(itemsProvider, renderItem, host, index);
}

function createListRuntimeNormal<TItem, TTagName extends ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderItem: ListRenderFunction<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ListRuntime<TItem, TTagName> {
  const { start: startMarker, end: endMarker } = createMarkerPair("list", index);

  const runtime = newRuntime(itemsProvider, renderItem, startMarker, endMarker, [], host, []);

  const parentNode = host as unknown as Node & ParentNode;
  parentNode.appendChild(startMarker);
  parentNode.appendChild(endMarker);

  sync(runtime);

  if (isBrowser) {
    // Register for future update() calls — not needed in SSR
    registerListRuntime(startMarker, runtime as ListRuntime<unknown, ElementTagName>);
  }

  return runtime;
}

function hydrateListRuntime<TItem, TTagName extends ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderFn: ListRenderFunction<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ListRuntime<TItem, TTagName> {
  const parentNode = host as unknown as Node & ParentNode;

  // No list markers at the cursor: build the list fresh. A recreated end
  // marker (corrupt/truncated SSR output) makes every item claim below miss,
  // so those rows render fresh too.
  const pair = claimMarkerPair(parentNode, "list");
  if (!pair) return createListRuntimeNormal(itemsProvider, renderFn, host, index);
  const { start: startMarker, end: endMarker } = pair;

  // Get current items and claim existing elements by running render functions
  const currentItems = normalizeItems(itemsProvider());
  const records: ListItemRecord<TItem, TTagName>[] = [];

  for (let i = 0; i < currentItems.length; i++) {
    const element = toRowElement(renderFn(currentItems[i], i), host, i);
    // Same record shape as sync() creates, so record access stays monomorphic.
    if (element) records.push({ item: currentItems[i], element, dyn: null, dynCreatedAt: undefined });
  }

  // Reconcile server/client mismatches.
  // 1) Server rendered more items than the client has: remove the leftover
  //    nodes between the claim cursor and the end marker.
  let leftover = peekChild(parentNode);
  while (leftover && leftover !== endMarker) {
    const next: Node | null = leftover.nextSibling;
    safeRemoveChild(leftover);
    leftover = next;
  }

  // 2) Client has items the claim pass could not match: place them in item
  //    order, anchored backwards from the end marker (same strategy as sync()).
  let anchor: Node = endMarker;
  for (let i = records.length - 1; i >= 0; i--) {
    const recordNode = records[i].element as unknown as Node;
    if (recordNode.parentNode !== parentNode || recordNode.nextSibling !== anchor) {
      parentNode.insertBefore(recordNode, anchor);
    }
    anchor = recordNode;
  }

  // Advance cursor past end marker
  setCursor(parentNode, endMarker.nextSibling);

  const runtime = newRuntime(itemsProvider, renderFn, startMarker, endMarker, records, host, currentItems.slice());

  if (isBrowser) {
    registerListRuntime(startMarker, runtime as ListRuntime<unknown, ElementTagName>);
  }

  return runtime;
}

export function updateListRuntimes(scope?: UpdateScope): void {
  const toDelete: WeakRef<Comment>[] = [];
  updateListFlushEpoch++;

  for (const ref of activeListRuntimes) {
    const startMarker = ref.deref();

    // Marker was garbage collected
    if (!startMarker) {
      toDelete.push(ref);
      continue;
    }

    const runtime = listRuntimeByMarker.get(startMarker);
    if (!runtime) {
      toDelete.push(ref);
      continue;
    }

    // Clean up if disconnected from DOM
    if (!startMarker.isConnected || !runtime.endMarker.isConnected) {
      listRuntimeByMarker.delete(startMarker);
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    runtime.currentFlushEpoch = updateListFlushEpoch;
    try {
      sync(runtime);
    } finally {
      runtime.currentFlushEpoch = undefined;
    }

    // Flush template rows' record-owned dynamic leaves. Rows built through
    // the normal path registered globally and are flushed by the notify
    // passes instead.
    if (runtime.allRecordsCreatedAt === updateListFlushEpoch) continue;
    const records = runtime.records;
    for (let i = 0; i < records.length; i++) {
      if (records[i].dynCreatedAt === updateListFlushEpoch) continue;
      const dyn = records[i].dyn;
      if (dyn) flushRowLeaves(dyn);
    }
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeListRuntimes.delete(ref);
  }
}
