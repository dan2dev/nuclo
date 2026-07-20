import type { ListTemplate, RowLeaf } from "./template";

export type ListItemsInput<TItem> = readonly TItem[] | Iterable<TItem>;

export interface ListRenderedRow<TTagName extends ElementTagName = ElementTagName> {
  element: ExpandedElement<TTagName>;
  update?: () => void;
}

export type ListRenderable<TTagName extends ElementTagName = ElementTagName> =
  | ExpandedElement<TTagName>
  | DetachedExpandedElementFactory<TTagName>
  | NodeModFn<TTagName>
  | DetachedSVGElementFactory
  | SVGElementModifierFn
  | Node
  | ListRenderedRow<TTagName>
  | null
  | undefined;

export type ListRenderer<TItem, TTagName extends ElementTagName = ElementTagName> = (
  item: TItem,
  index: number,
) => ListRenderable<TTagName>;

export type ListItemsProvider<TItem> = () => ListItemsInput<TItem>;

export interface ListItemRecord<TItem, TTagName extends ElementTagName = ElementTagName> {
  item: TItem;
  element: ExpandedElement<TTagName>;
  /**
   * Template rows own their dynamic leaves (reactive text / className)
   * instead of registering them globally; update() flushes them via the
   * list runtime. Null/absent for rows built through the normal path.
   */
  dyn?: RowLeaf[] | null;
  refresh?: (() => void) | null;
  /**
   * Internal updateListRuntimes() epoch in which this record's dynamic leaves
   * were initialized. Fresh template rows already hold current values, so that
   * same update pass can skip re-flushing them.
   */
  dynCreatedAt?: number;
}

export interface ListRuntime<TItem, TTagName extends ElementTagName = ElementTagName> {
  itemsProvider: ListItemsProvider<TItem>;
  renderItem: ListRenderer<TItem, TTagName>;
  startMarker: Comment;
  endMarker: Comment;
  records: ListItemRecord<TItem, TTagName>[];
  host: ExpandedElement<TTagName>;
  lastSyncedItems: readonly TItem[];
  /**
   * Row-template state: undefined = not analyzed yet, null = unsupported
   * shape (build rows normally forever), object = clone-and-patch active.
   */
  template?: ListTemplate | null;
  /**
   * Dynamic leaves of the most recent template-built row, for the record
   * creation sites to attach to the new record. Null when the row was built
   * through the normal path.
   */
  lastRenderLeaves?: RowLeaf[] | null;
  lastRenderRefresh?: (() => void) | null;
  /**
   * Set only while updateListRuntimes() is syncing this runtime.
   */
  currentFlushEpoch?: number;
  /**
   * Internal updateListRuntimes() epoch in which every current record was
   * freshly initialized.
   */
  allRecordsCreatedAt?: number;
}
