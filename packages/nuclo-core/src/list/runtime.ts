import { createMarkerPair, createComment, safeRemoveChild, isNodeConnected } from "../utility/dom";
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

function remove<TItem, TTagName extends ElementTagName>(record: ListItemRecord<TItem, TTagName>): void {
  safeRemoveChild(record.element as unknown as Node);
  // Clear the reference to help GC
  const releasedRecord = record as unknown as ReleasedListItemRecord<TItem, TTagName>;
  releasedRecord.element = null;
  releasedRecord.item = null;
}

export function sync<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>
): void {
  const { host, startMarker, endMarker } = runtime;
  const parent = (startMarker.parentNode ?? (host as unknown as Node & ParentNode)) as
    Node & ParentNode;

  const currentItems = normalizeItems(runtime.itemsProvider());

  if (arraysEqual(runtime.lastSyncedItems, currentItems)) return;

  const recordsByPosition = new Map<number, ListItemRecord<TItem, TTagName>>();
  const availableRecords = new Map<TItem, ListItemRecord<TItem, TTagName>[]>();

  for (let i = 0; i < runtime.records.length; i++) {
    const record = runtime.records[i];
    const items = availableRecords.get(record.item);
    if (items) {
      items.push(record);
    } else {
      availableRecords.set(record.item, [record]);
    }
  }

  for (let newIndex = 0; newIndex < currentItems.length; newIndex++) {
    const item = currentItems[newIndex];
    if (
      newIndex < runtime.lastSyncedItems.length &&
      runtime.lastSyncedItems[newIndex] === item
    ) {
      const existingRecord = runtime.records[newIndex];
      if (existingRecord && existingRecord.item === item) {
        recordsByPosition.set(newIndex, existingRecord);
        const items = availableRecords.get(item)!;
        items.splice(items.indexOf(existingRecord), 1);
        if (items.length === 0) availableRecords.delete(item);
      }
    }
  }

  // Phase 1: resolve which record backs each position (no DOM writes yet)
  const newRecords: Array<ListItemRecord<TItem, TTagName> | null> = new Array(currentItems.length);
  const elementsToRemove = new Set<ListItemRecord<TItem, TTagName>>(runtime.records);

  for (let i = currentItems.length - 1; i >= 0; i--) {
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

  // Phase 2: remove stale elements BEFORE placement. A removed element left
  // in the DOM would make every surviving element before it fail the
  // nextSibling check below, turning a single removal into O(n) moves.
  for (const record of elementsToRemove) {
    remove(record);
  }

  // Phase 3: place survivors/new elements, anchored backwards from the end
  // marker — elements already in position are not touched.
  let nextSibling: Node = endMarker;
  for (let i = currentItems.length - 1; i >= 0; i--) {
    const record = newRecords[i];
    if (!record) continue;
    const recordNode = record.element as unknown as Node;
    if (recordNode.nextSibling !== nextSibling) {
      parent.insertBefore(recordNode, nextSibling);
    }
    nextSibling = recordNode;
  }

  runtime.records = newRecords.filter((r): r is ListItemRecord<TItem, TTagName> => r !== null);
  runtime.lastSyncedItems = currentItems.slice();
  
  // If list is now empty, explicitly clear the records array to help GC
  if (newRecords.length === 0) {
    runtime.records = [];
    runtime.lastSyncedItems = [];
  }
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

