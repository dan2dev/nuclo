export type ListRenderer<TItem> = (
  item: TItem,
  index: number,
) => ExpandedElement<any> | NodeModFn<any>;

export type ListItemsProvider<TItem> = () => TItem[];

export interface ListItemRecord<TItem> {
  item: TItem;
  element: ExpandedElement<any>;
}

export interface ListRuntime<TItem> {
  itemsProvider: ListItemsProvider<TItem>;
  renderItem: ListRenderer<TItem>;
  startMarker: Comment;
  endMarker: Comment;
  records: ListItemRecord<TItem>[];
  host: ExpandedElement<any>;
  lastSyncedItems: TItem[];
}
