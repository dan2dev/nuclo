import {
  createMarkerPair,
  safeRemoveChild,
  isNodeConnected,
} from "../utility/dom";
import { resolveRenderable } from "../utility/renderables";
import {
  isHydrating,
  claimChild,
  getCursor,
  setCursor,
} from "../hydration/context";

function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
import type {
  ListRenderer,
  ListRuntime,
  ListItemRecord,
  ListItemsInput,
  ListItemsProvider,
} from "./types";
import type { UpdateScope } from "../core/updateScope";
import { isBrowser } from "../utility/environment";

/**
 * Stores weak references to list runtime markers to prevent memory leaks.
 * Comment nodes can be garbage collected when removed from DOM.
 * The runtime object itself is mutable and will be updated in place.
 */
interface ListRuntimeInfo<
  TItem = unknown,
  TTagName extends ElementTagName = ElementTagName,
> {
  runtime: ListRuntime<TItem, TTagName>;
}

const activeListRuntimes = new Map<
  WeakRef<Comment>,
  ListRuntimeInfo<unknown, ElementTagName>
>();

/**
 * Type-erasing accessor for the runtimes map. We store heterogeneous
 * `ListRuntimeInfo<TItem, TTagName>` values but consumers only depend on
 * structural properties — `TItem` / `TTagName` are contravariant in
 * render callbacks, so the erasure must bridge via `unknown` once here.
 */
function storeListRuntimeInfo<TItem, TTagName extends ElementTagName>(
  ref: WeakRef<Comment>,
  info: ListRuntimeInfo<TItem, TTagName>,
): void {
  activeListRuntimes.set(
    ref,
    info as unknown as ListRuntimeInfo<unknown, ElementTagName>,
  );
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

function remove<TItem, TTagName extends ElementTagName>(
  record: ListItemRecord<TItem, TTagName>,
): void {
  safeRemoveChild(record.element as unknown as Node);
  // Clear the reference to help GC
  const releasedRecord = record as unknown as ReleasedListItemRecord<
    TItem,
    TTagName
  >;
  releasedRecord.element = null;
  releasedRecord.item = null;
}

export function sync<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>,
): void {
  const { host, startMarker, endMarker } = runtime;
  const parent = (startMarker.parentNode ??
    (host as unknown as Node & ParentNode)) as Node & ParentNode;

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

  const newRecords: Array<ListItemRecord<TItem, TTagName> | null> = new Array(
    currentItems.length,
  );
  const elementsToRemove = new Set<ListItemRecord<TItem, TTagName>>(
    runtime.records,
  );
  let nextSibling: Node = endMarker;

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

    const recordNode = record.element as unknown as Node;
    if (recordNode.nextSibling !== nextSibling) {
      parent.insertBefore(recordNode, nextSibling);
    }
    nextSibling = recordNode;
  }

  for (const record of elementsToRemove) {
    remove(record);
  }

  runtime.records = newRecords.filter(
    (r): r is ListItemRecord<TItem, TTagName> => r !== null,
  );
  runtime.lastSyncedItems = currentItems.slice();

  // If list is now empty, explicitly clear the records array to help GC
  if (newRecords.length === 0) {
    runtime.records = [];
    runtime.lastSyncedItems = [];
  }
}

export function createListRuntime<
  TItem,
  TTagName extends ElementTagName = ElementTagName,
>(
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
  const { start: startMarker, end: endMarker } = createMarkerPair(
    "list",
    index,
  );

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
    storeListRuntimeInfo(new WeakRef(startMarker), { runtime });
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
  const cursor = getCursor(parentNode);
  const candidate = parentNode.childNodes[cursor];
  if (
    !candidate ||
    candidate.nodeType !== 8 ||
    !(candidate as Comment).textContent?.startsWith("list-start-")
  ) {
    return createListRuntimeNormal(itemsProvider, renderFn, host, index);
  }

  // Claim existing start marker
  const startMarker = claimChild(parentNode) as Comment;

  // Find end marker position (without claiming) so we know when to stop
  let endMarkerIdx = getCursor(parentNode);
  while (endMarkerIdx < parentNode.childNodes.length) {
    const node = parentNode.childNodes[endMarkerIdx];
    if (node.nodeType === 8 && (node as Comment).textContent === "list-end")
      break;
    endMarkerIdx++;
  }
  const endMarker = parentNode.childNodes[endMarkerIdx] as Comment;

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

  // Advance cursor past end marker
  setCursor(parentNode, endMarkerIdx + 1);

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
    storeListRuntimeInfo(new WeakRef(startMarker), { runtime });
  }

  return runtime;
}

function releaseRuntime(runtime: ListRuntime<unknown, ElementTagName>): void {
  for (let i = 0; i < runtime.records.length; i++) {
    const record = runtime.records[i] as unknown as ReleasedListItemRecord<
      unknown,
      ElementTagName
    >;
    record.element = null;
    record.item = null;
  }
  runtime.records = [];
}

export function updateListRuntimes(scope?: UpdateScope): void {
  const toDelete: WeakRef<Comment>[] = [];

  for (const [ref, info] of activeListRuntimes) {
    const startMarker = ref.deref();

    // Clean up if marker was GC'd or disconnected from DOM
    if (
      !startMarker ||
      !isNodeConnected(startMarker) ||
      !isNodeConnected(info.runtime.endMarker)
    ) {
      releaseRuntime(info.runtime);
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    sync(info.runtime);
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeListRuntimes.delete(ref);
  }
}
