import { createMarkerPair, createComment, safeRemoveChild, isNodeConnected, createDocumentFragment } from "../utility/dom";
import { resolveRenderable } from "../utility/renderables";
import { isHydrating, claimChild, peekChild, setCursor, skipWhitespaceText } from "../hydration/context";

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
import type { ListRenderer, ListRuntime, ListItemRecord, ListItemsInput, ListItemsProvider } from "./types";
import type { UpdateScope } from "../core/updateScope";
import { isBrowser } from "../utility/environment";

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

interface ReleasedListItemRecord<TItem, TTagName extends ElementTagName> {
  item: TItem | null;
  element: ExpandedElement<TTagName> | null;
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

function releaseRecord<TItem, TTagName extends ElementTagName>(
  record: ListItemRecord<TItem, TTagName>
): void {
  // Clear the references to help GC.
  const releasedRecord = record as unknown as ReleasedListItemRecord<TItem, TTagName>;
  releasedRecord.element = null;
  releasedRecord.item = null;
}

function remove<TItem, TTagName extends ElementTagName>(record: ListItemRecord<TItem, TTagName>): void {
  safeRemoveChild(record.element as unknown as Node);
  releaseRecord(record);
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
 * Like the previous Range-based clear, this does NOT eagerly walk each subtree
 * to abort listeners and prune reactive registries. That walk is the dominant
 * per-row cost when clearing/replacing a large list, and it is redundant here:
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
    const record = records[i];
    const node = record.element as unknown as Node | null;
    // Detach the row (guard against an already-moved/detached element so a
    // stale record can't throw). Children of the row go with it in one call.
    if (node && node.parentNode === parent) parent.removeChild(node);
    // Node is out of the live tree; drop the record's references.
    releaseRecord(record);
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

function isIdentityPrefix<TItem>(prefix: readonly TItem[], full: readonly TItem[]): boolean {
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== full[i]) return false;
  }
  return true;
}

export function sync<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>
): void {
  const { host, startMarker, endMarker } = runtime;
  const parent = (startMarker.parentNode ?? (host as unknown as Node & ParentNode)) as
    Node & ParentNode;

  const currentItems = normalizeItems(runtime.itemsProvider());

  if (arraysEqual(runtime.lastSyncedItems, currentItems)) return;

  const oldRecords = runtime.records;
  const newLen = currentItems.length;

  // Fast path — clear: drop every row in one DOM operation.
  if (newLen === 0) {
    if (!bulkClearRecords(oldRecords, parent, startMarker, endMarker)) {
      for (let i = 0; i < oldRecords.length; i++) remove(oldRecords[i]);
    }
    runtime.records = [];
    runtime.lastSyncedItems = [];
    return;
  }

  // Fast path — first render / re-populate after clear: build everything at
  // once and insert a single fragment.
  if (oldRecords.length === 0) {
    const fresh: ListItemRecord<TItem, TTagName>[] = [];
    buildAndInsert(runtime, parent, currentItems, 0, newLen, endMarker, fresh);
    runtime.records = fresh;
    runtime.lastSyncedItems = currentItems.slice();
    return;
  }

  // Fast path — pure append: the previous items are an identity-prefix of the
  // new items, so existing rows are untouched and only the tail is built.
  const lastItems = runtime.lastSyncedItems;
  if (newLen > lastItems.length && isIdentityPrefix(lastItems, currentItems)) {
    buildAndInsert(runtime, parent, currentItems, lastItems.length, newLen, endMarker, oldRecords);
    runtime.records = oldRecords;
    runtime.lastSyncedItems = currentItems.slice();
    return;
  }

  // General keyed diff -----------------------------------------------------
  const recordsByPosition = new Map<number, ListItemRecord<TItem, TTagName>>();
  const availableRecords = new Map<TItem, ListItemRecord<TItem, TTagName>[]>();
  // Old DOM order == index in oldRecords; used to compute minimal moves below.
  const oldIndexByRecord = new Map<ListItemRecord<TItem, TTagName>, number>();

  for (let i = 0; i < oldRecords.length; i++) {
    const record = oldRecords[i];
    oldIndexByRecord.set(record, i);
    const items = availableRecords.get(record.item);
    if (items) {
      items.push(record);
    } else {
      availableRecords.set(record.item, [record]);
    }
  }

  // Pin records whose item is unchanged at the same position. This keeps
  // duplicate object references attached to their original node.
  for (let newIndex = 0; newIndex < newLen; newIndex++) {
    const item = currentItems[newIndex];
    if (newIndex < lastItems.length && lastItems[newIndex] === item) {
      const existingRecord = oldRecords[newIndex];
      if (existingRecord && existingRecord.item === item) {
        recordsByPosition.set(newIndex, existingRecord);
        const items = availableRecords.get(item)!;
        items.splice(items.indexOf(existingRecord), 1);
        if (items.length === 0) availableRecords.delete(item);
      }
    }
  }

  // Phase 1: resolve which record backs each position (no DOM writes yet).
  const newRecords: Array<ListItemRecord<TItem, TTagName> | null> = new Array(newLen);
  const elementsToRemove = new Set<ListItemRecord<TItem, TTagName>>(oldRecords);
  let reusedCount = 0;

  for (let i = newLen - 1; i >= 0; i--) {
    const item = currentItems[i];
    let record = recordsByPosition.get(i);

    if (!record) {
      const availableItems = availableRecords.get(item);
      if (availableItems && availableItems.length > 0) {
        record = availableItems.shift()!;
        if (availableItems.length === 0) {
          availableRecords.delete(item);
        }
      }
    }

    if (record) {
      elementsToRemove.delete(record);
      reusedCount++;
    } else {
      const element = renderItem(runtime, item, i);
      if (!element) {
        newRecords[i] = null;
        continue;
      }
      record = { item, element };
    }

    newRecords[i] = record;
  }

  // Phase 2: remove stale elements BEFORE placement. A removed element left in
  // the DOM would make surviving elements before it fail the move check below.
  // When nothing survives, collapse the whole range in one operation.
  if (reusedCount === 0) {
    if (!bulkClearRecords(oldRecords, parent, startMarker, endMarker)) {
      for (const record of elementsToRemove) remove(record);
    }
  } else {
    for (const record of elementsToRemove) remove(record);
  }

  // Determine the minimal set of survivors that must move. Survivors whose old
  // positions form an increasing subsequence are already correctly ordered.
  const reusedNewPositions: number[] = [];
  const reusedOldIndices: number[] = [];
  for (let i = 0; i < newLen; i++) {
    const record = newRecords[i];
    if (!record) continue;
    const oldIndex = oldIndexByRecord.get(record);
    if (oldIndex !== undefined) {
      reusedNewPositions.push(i);
      reusedOldIndices.push(oldIndex);
    }
  }
  const stablePositions = new Set<number>();
  if (reusedOldIndices.length > 0) {
    const lis = longestIncreasingSubsequence(reusedOldIndices);
    for (let i = 0; i < lis.length; i++) {
      stablePositions.add(reusedNewPositions[lis[i]]);
    }
  }

  // Phase 3: place elements anchored backwards from the end marker. Runs of
  // freshly created nodes are batched into a fragment; reused nodes already on
  // the LIS are left untouched.
  let anchor: Node = endMarker;
  let fragment: DocumentFragment | null = null;
  for (let i = newLen - 1; i >= 0; i--) {
    const record = newRecords[i];
    if (!record) continue;
    const node = record.element as unknown as Node;

    if (!oldIndexByRecord.has(record)) {
      // Freshly created node. Prefer batching consecutive new nodes into a
      // fragment (one DOM insert); prepending keeps ascending order.
      if (!fragment) fragment = createDocumentFragment();
      if (fragment) {
        fragment.insertBefore(node, fragment.firstChild);
      } else {
        // No DocumentFragment available — insert directly and advance the
        // anchor so the next (earlier) node lands before this one.
        parent.insertBefore(node, anchor);
        anchor = node;
      }
      continue;
    }

    // Reused node: flush any pending new nodes (they belong after it), moving
    // the anchor to the first flushed node so this node lands before them.
    if (fragment && fragment.firstChild) {
      const firstFlushed = fragment.firstChild;
      parent.insertBefore(fragment, anchor);
      anchor = firstFlushed;
      fragment = null;
    }
    if (!stablePositions.has(i)) {
      parent.insertBefore(node, anchor);
    }
    anchor = node;
  }
  if (fragment && fragment.firstChild) parent.insertBefore(fragment, anchor);

  runtime.records = newRecords.filter((r): r is ListItemRecord<TItem, TTagName> => r !== null);
  runtime.lastSyncedItems = currentItems.slice();
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

function releaseRuntime(runtime: ListRuntime<unknown, ElementTagName>): void {
  for (let i = 0; i < runtime.records.length; i++) {
    const record = runtime.records[i] as unknown as ReleasedListItemRecord<unknown, ElementTagName>;
    record.element = null;
    record.item = null;
  }
  runtime.records = [];
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

