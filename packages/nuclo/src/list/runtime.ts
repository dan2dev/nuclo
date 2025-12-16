import { createMarkerPair, safeRemoveChild } from "../utility/dom";
import { arraysEqual } from "../utility/arrayUtils";
import { resolveRenderable } from "../utility/renderables";
import type { ListRenderer, ListRuntime, ListItemRecord, ListItemsProvider } from "./types";
import type { UpdateScope } from "../core/updateScope";

/**
 * Tracks all active list runtimes for update notifications.
 * Uses Set (not WeakSet) because we need iteration support.
 * Cleanup happens automatically in updateListRuntimes() when markers are disconnected.
 */
const activeListRuntimes = new Set<ListRuntime<unknown, keyof HTMLElementTagNameMap>>();

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
}

export function sync<TItem, TTagName extends ElementTagName>(
  runtime: ListRuntime<TItem, TTagName>
): void {
  const { host, startMarker, endMarker } = runtime;
  const parent = (startMarker.parentNode ?? (host as unknown as Node & ParentNode)) as
    Node & ParentNode;

  const currentItems = runtime.itemsProvider();

  if (arraysEqual(runtime.lastSyncedItems, currentItems)) return;

  const recordsByPosition = new Map<number, ListItemRecord<TItem, TTagName>>();
  const availableRecords = new Map<TItem, ListItemRecord<TItem, TTagName>[]>();

  runtime.records.forEach((record) => {
    const items = availableRecords.get(record.item);
    if (items) {
      items.push(record);
    } else {
      availableRecords.set(record.item, [record]);
    }
  });

  currentItems.forEach((item, newIndex) => {
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
  });

  const newRecords: Array<ListItemRecord<TItem, TTagName>> = [];
  const elementsToRemove = new Set<ListItemRecord<TItem, TTagName>>(runtime.records);
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
      if (!element) continue;
      record = { item, element };
    }

    newRecords.unshift(record);

    const recordNode = record.element as unknown as Node;
    if (recordNode.nextSibling !== nextSibling) {
      parent.insertBefore(recordNode, nextSibling);
    }
    nextSibling = recordNode;
  }

  elementsToRemove.forEach(remove);

  runtime.records = newRecords;
  runtime.lastSyncedItems = [...currentItems];
}

export function createListRuntime<TItem, TTagName extends ElementTagName = ElementTagName>(
  itemsProvider: ListItemsProvider<TItem>,
  renderItem: ListRenderer<TItem, TTagName>,
  host: ExpandedElement<TTagName>,
): ListRuntime<TItem, TTagName> {
  const { start: startMarker, end: endMarker } = createMarkerPair("list");

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

  activeListRuntimes.add(runtime as ListRuntime<unknown, keyof HTMLElementTagNameMap>);
  sync(runtime);

  return runtime;
}

export function updateListRuntimes(scope?: UpdateScope): void {
  activeListRuntimes.forEach((runtime) => {
    if (!runtime.startMarker.isConnected || !runtime.endMarker.isConnected) {
      activeListRuntimes.delete(runtime);
      return;
    }

    if (scope && !scope.contains(runtime.startMarker)) return;
    sync(runtime);
  });
}
