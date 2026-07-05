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
import { createMarkerPair, createComment, safeRemoveChild, isNodeConnected, createDocumentFragment } from "../shared/dom";
import { resolveRenderable } from "../shared/renderables";
import { isHydrating, claimChild, peekChild, setCursor, skipWhitespaceText } from "../hydration";
import type { ListRenderer, ListRuntime, ListItemRecord, ListItemsInput, ListItemsProvider } from "./types";
import type { UpdateScope } from "../update/scope";
import { isBrowser } from "../shared/environment";

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

function registerListRuntime(startMarker: Comment, runtime: ListRuntime<unknown, ElementTagName>): void {
  const ref = new WeakRef(startMarker);
  activeListRuntimes.add(ref);
  listRuntimeByMarker.set(startMarker, runtime);
  listMarkerFinalizer?.register(startMarker, ref);
}

function normalizeItems<TItem>(items: ListItemsInput<TItem>): readonly TItem[] {
  return Array.isArray(items) ? items : Array.from(items);
}

function renderItem<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
  item: TItem,
  index: number,
): ExpandedElement<TTagName> | null {
  const result = runtime.renderItem(item, index);
  return resolveRenderable<TTagName>(result, runtime.host, index);
}

/**
 * Detaches one row eagerly: safeRemoveChild walks the subtree to abort
 * listeners and prune reactive registries before removing the node. Used for
 * partial removals, where the walk is cheap; full clears/replaces use
 * bulkClearRecords instead.
 */
function removeRecord<TItem, TTagName extends ElementTagName>(record: ListItemRecord<TItem, TTagName>): void {
  safeRemoveChild(record.element as unknown as Node);
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
 * Unlike removeRecord, this does NOT eagerly walk each subtree to abort
 * listeners and prune reactive registries. That walk is the dominant per-row
 * cost when clearing/replacing a large list, and it is redundant here:
 *  - Reactive text/attribute registries hold their targets only through
 *    WeakRef/WeakMap, and every update() prunes entries whose node became
 *    disconnected (which removeChild makes them). The real-GC tests in
 *    test/memory/gc-collectability.test.ts prove a detached subtree is
 *    collectible with no eager cleanup and no extra update pass.
 *  - Event listeners are tracked in a WeakMap keyed by element and registered
 *    with an AbortSignal, so they are released when the element is collected.
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

  for (let i = 0; i < records.length; i++) {
    const node = records[i].element as unknown as Node | null;
    // Detach the row (guard against an already-moved/detached element so a
    // stale record can't throw). Children of the row go with it in one call.
    if (node && node.parentNode === parent) parent.removeChild(node);
  }
  return true;
}

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
 * before `anchor` as a single DocumentFragment (falling back to per-node
 * insertion when fragments are unavailable). Appends the created records to
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
  const fragment = createDocumentFragment();
  let buffered = 0;
  for (let i = startIndex; i < endIndexExclusive; i++) {
    const item = items[i];
    const element = renderItem(runtime, item, i);
    if (!element) continue;
    targetRecords.push({ item, element });
    const node = element as unknown as Node;
    if (fragment) {
      fragment.appendChild(node);
      buffered++;
    } else {
      parent.insertBefore(node, anchor);
    }
  }
  if (fragment && buffered > 0) parent.insertBefore(fragment, anchor);
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
      for (let i = 0; i < oldLen; i++) removeRecord(oldRecords[i]);
    }
    runtime.records = [];
    runtime.lastSyncedItems = [];
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
    } else {
      const fresh: ListItemRecord<TItem, TTagName>[] = [];
      buildAndInsert(runtime, parent, items, newStart, newEnd, anchor, fresh);
      runtime.records = oldRecords.slice(0, oldStart).concat(fresh, oldRecords.slice(oldStart));
    }
    runtime.lastSyncedItems = items.slice();
    return;
  }

  // Every new row was trimmed → pure removal. This is always partial (a full
  // clear was handled above), so remove each row eagerly.
  if (newStart === newEnd) {
    for (let i = oldStart; i < oldEnd; i++) removeRecord(oldRecords[i]);
    oldRecords.splice(oldStart, oldEnd - oldStart);
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

  // Bucket the remaining old records by item identity, in DOM order. The value
  // is a single old index, promoted to an index array only when the same item
  // occurs more than once (duplicates are matched FIFO).
  const buckets = new Map<TItem, number | number[]>();
  for (let i = oldStart; i < oldEnd; i++) {
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
      oldIndex = entry.shift()!;
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
      for (let i = 0; i < oldLen; i++) removeRecord(oldRecords[i]);
    }
    const fresh: ListItemRecord<TItem, TTagName>[] = [];
    buildAndInsert(runtime, parent, items, 0, newLen, endMarker, fresh);
    runtime.records = fresh;
    runtime.lastSyncedItems = items.slice();
    return;
  }

  // Remove stale rows BEFORE placement. A removed element left in the DOM
  // would end up interleaved with the survivors the placement phase leaves
  // untouched.
  for (let i = oldStart; i < oldEnd; i++) {
    if (!claimed[i - oldStart]) removeRecord(oldRecords[i]);
  }

  // Determine the minimal set of survivors that must move. Survivors whose old
  // positions form an increasing subsequence are already correctly ordered.
  let stable: Uint8Array | null = null;
  if (reusedCount > 0) {
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
      windowRecords[j] = { item, element };
      const node = element as unknown as Node;
      if (!fragment) fragment = createDocumentFragment();
      if (fragment) {
        fragment.insertBefore(node, fragment.firstChild);
      } else {
        // No DocumentFragment available — insert directly and advance the
        // anchor so the next (earlier) row lands before this one.
        parent.insertBefore(node, anchor);
        anchor = node;
      }
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
    if (!stable || !stable[j]) {
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
  runtime.lastSyncedItems = items.slice();
}

export function createListRuntime<TItem, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderItem: ListRenderer<TItem, TTagName>,
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
  renderItem: ListRenderer<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ListRuntime<TItem, TTagName> {
  const { start: startMarker, end: endMarker } = createMarkerPair("list", index);

  const runtime: ListRuntime<TItem, TTagName> = {
    itemsProvider,
    renderItem,
    startMarker,
    endMarker,
    records: [],
    host,
    lastSyncedItems: [],
  };

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
  renderFn: ListRenderer<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
  index: number,
): ListRuntime<TItem, TTagName> {
  const parentNode = host as unknown as Node & ParentNode;

  // Check if next child is actually a list-start comment marker.
  // If not, fall back to normal (non-hydration) list creation.
  skipWhitespaceText(parentNode);
  const candidate = peekChild(parentNode);
  if (!candidate || candidate.nodeType !== 8 ||
      !(candidate as Comment).textContent?.startsWith('list-start-')) {
    return createListRuntimeNormal(itemsProvider, renderFn, host, index);
  }

  // Claim existing start marker
  const startMarker = claimChild(parentNode) as Comment;

  // Find end marker (without claiming) so we know when to stop.
  // Pairs are depth-counted in case nested list markers share this host.
  let depth = 0;
  let scanNode: Node | null = peekChild(parentNode);
  while (scanNode) {
    if (scanNode.nodeType === 8) {
      const text = (scanNode as Comment).textContent || '';
      if (text.startsWith('list-start-')) {
        depth++;
      } else if (text === 'list-end') {
        if (depth === 0) break;
        depth--;
      }
    }
    scanNode = scanNode.nextSibling;
  }
  let endMarker = scanNode as Comment | null;
  if (!endMarker) {
    // Corrupt/truncated SSR output — recreate the end marker; every item
    // claim below will miss and render fresh.
    const created = createComment('list-end');
    if (created) {
      parentNode.insertBefore(created, startMarker.nextSibling);
      endMarker = created;
    }
  }
  if (!endMarker) {
    return createListRuntimeNormal(itemsProvider, renderFn, host, index);
  }

  // Get current items and claim existing elements by running render functions
  const currentItems = normalizeItems(itemsProvider());
  const records: ListItemRecord<TItem, TTagName>[] = [];

  for (let i = 0; i < currentItems.length; i++) {
    const result = renderFn(currentItems[i], i);
    const element = resolveRenderable<TTagName>(result, host, i);
    if (element) {
      records.push({ item: currentItems[i], element });
    }
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

  const runtime: ListRuntime<TItem, TTagName> = {
    itemsProvider,
    renderItem: renderFn,
    startMarker,
    endMarker,
    records,
    host,
    lastSyncedItems: currentItems.slice(),
  };

  if (isBrowser) {
    registerListRuntime(startMarker, runtime as ListRuntime<unknown, ElementTagName>);
  }

  return runtime;
}

/**
 * Drops a disconnected runtime's item/element references. The runtime object
 * can outlive its list (it stays reachable through the WeakMap entry while
 * someone still references the detached subtree), so clearing the records
 * keeps it from pinning the items.
 */
function releaseRuntime(runtime: ListRuntime<unknown, ElementTagName>): void {
  for (let i = 0; i < runtime.records.length; i++) {
    const record = runtime.records[i] as { item: unknown; element: unknown };
    record.element = null;
    record.item = null;
  }
  runtime.records = [];
  runtime.lastSyncedItems = [];
}

export function updateListRuntimes(scope?: UpdateScope): void {
  const toDelete: WeakRef<Comment>[] = [];

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
    if (!isNodeConnected(startMarker) || !isNodeConnected(runtime.endMarker)) {
      releaseRuntime(runtime);
      listRuntimeByMarker.delete(startMarker);
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    sync(runtime);
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeListRuntimes.delete(ref);
  }
}
