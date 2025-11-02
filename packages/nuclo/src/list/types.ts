export type ListRenderer<TItem, TTagName extends ElementTagName = ElementTagName> = (
  item: TItem,
  index: number,
) => ExpandedElement<TTagName> | NodeModFn<TTagName> | Node | null;

export type ListItemsProvider<TItem> = () => readonly TItem[];

export interface ListItemRecord<TItem, TTagName extends ElementTagName = ElementTagName> {
  item: TItem;
  element: ExpandedElement<TTagName>;
}

export interface ListRuntime<TItem, TTagName extends ElementTagName = ElementTagName> {
  itemsProvider: ListItemsProvider<TItem>;
  renderItem: ListRenderer<TItem, TTagName>;
  startMarker: Comment;
  endMarker: Comment;
  records: ListItemRecord<TItem, TTagName>[];
  host: ExpandedElement<TTagName>;
  lastSyncedItems: readonly TItem[];
}
