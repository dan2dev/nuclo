export type ListItemsInput<TItem> = readonly TItem[] | Iterable<TItem>;

export type ListRenderable<TTagName extends ElementTagName = ElementTagName> =
  | ExpandedElement<TTagName>
  | DetachedExpandedElementFactory<TTagName>
  | NodeModFn<TTagName>
  | DetachedSVGElementFactory
  | SVGElementModifierFn
  | Node
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
