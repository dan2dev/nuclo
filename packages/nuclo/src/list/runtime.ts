import { createMarkerPair, safeRemoveChild, isNodeConnected } from "../utility/dom";
import { arraysEqual } from "../utility/arrayUtils";
import { resolveRenderable } from "../utility/renderables";
import type { ListRenderer, ListRuntime, ListItemRecord, ListItemsProvider } from "./types";
import type { UpdateScope } from "../core/updateScope";

/**
 * Stores weak references to list runtime markers to prevent memory leaks.
 * Comment nodes can be garbage collected when removed from DOM.
 * The runtime object itself is mutable and will be updated in place.
 */
interface ListRuntimeInfo<TItem = unknown, TTagName extends ElementTagName = ElementTagName> {
  runtime: ListRuntime<TItem, TTagName>;
}

const activeListRuntimes = new Map<WeakRef<Comment>, ListRuntimeInfo<unknown, ElementTagName>>();

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
  (record as any).element = null;
  (record as any).item = null;
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

  const newRecords: Array<ListItemRecord<TItem, TTagName> | null> = new Array(currentItems.length);
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

  runtime.records = newRecords.filter(Boolean) as Array<ListItemRecord<TItem, TTagName>>;
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

  // Store runtime with WeakRef to startMarker to prevent memory leaks
  // The runtime object itself is mutable and will be updated by sync()
  const runtimeInfo: ListRuntimeInfo<TItem, TTagName> = {
    runtime,
  };
  activeListRuntimes.set(new WeakRef(startMarker), runtimeInfo as ListRuntimeInfo<unknown, ElementTagName>);
  sync(runtime);

  return runtime;
}

export function updateListRuntimes(scope?: UpdateScope): void {
  const toDelete: WeakRef<Comment>[] = [];

  for (const [ref, info] of activeListRuntimes) {
    const startMarker = ref.deref();
    
    // Comment node was garbage collected
    if (startMarker === undefined) {
      // Clean up records before deleting runtime
      if (info.runtime.records) {
        for (let i = 0; i < info.runtime.records.length; i++) {
          const record = info.runtime.records[i] as any;
          record.element = null;
          record.item = null;
        }
        info.runtime.records = [];
      }
      toDelete.push(ref);
      continue;
    }

    // Check if markers are still connected to DOM
    if (!isNodeConnected(startMarker) || !isNodeConnected(info.runtime.endMarker)) {
      // Clean up records before deleting runtime
      if (info.runtime.records) {
        for (let i = 0; i < info.runtime.records.length; i++) {
          const record = info.runtime.records[i] as any;
          record.element = null;
          record.item = null;
        }
        info.runtime.records = [];
      }
      toDelete.push(ref);
      continue;
    }

    // Skip if outside update scope
    if (scope && !scope.contains(startMarker)) continue;

    // Sync the runtime (runtime object is mutated in place)
    sync(info.runtime);
  }

  // Clean up dead references
  for (const ref of toDelete) {
    activeListRuntimes.delete(ref);
  }
}
