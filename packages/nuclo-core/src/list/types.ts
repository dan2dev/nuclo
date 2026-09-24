import type { ListTemplate, RowLeaves } from "./template";

export interface ListItemRecord<TItem, TTagName extends ElementTagName = ElementTagName> {
  item: TItem;
  element: ExpandedElement<TTagName>;
  /**
   * Template rows own their dynamic leaves (reactive text / className)
   * instead of registering them globally; update() flushes them via the
   * list runtime. Null for rows built through the normal path.
   */
  dyn: RowLeaves | null;
  /**
   * Internal updateListRuntimes() epoch in which this record's dynamic leaves
   * were initialized. Fresh template rows already hold current values, so that
   * same update pass can skip re-flushing them.
   */
  dynCreatedAt: number | undefined;
}

export interface ListRuntime<TItem, TTagName extends ElementTagName = ElementTagName> {
  itemsProvider: ListItemsProvider<TItem>;
  renderItem: ListRenderFunction<TItem, TTagName>;
  startMarker: Comment;
  endMarker: Comment;
  records: ListItemRecord<TItem, TTagName>[];
  host: ExpandedElement<TTagName>;
  lastSyncedItems: readonly TItem[];
  /**
   * Row-template state: undefined = not analyzed yet, null = unsupported
   * shape (build rows normally forever), object = clone-and-patch active.
   */
  template: ListTemplate | null | undefined;
  /**
   * Dynamic leaves of the most recent template-built row, for the record
   * creation sites to attach to the new record. Null when the row was built
   * through the normal path.
   */
  lastRenderLeaves: RowLeaves | null;
  /**
   * Set only while updateListRuntimes() is syncing this runtime.
   */
  currentFlushEpoch: number | undefined;
  /**
   * Internal updateListRuntimes() epoch in which every current record was
   * freshly initialized.
   */
  allRecordsCreatedAt: number | undefined;
}
