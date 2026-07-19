import type { ListTemplate, RowLeaf } from "./template";

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
  /**
   * Template rows own their dynamic leaves (reactive text / className)
   * instead of registering them globally; update() flushes them via the
   * list runtime. Null/absent for rows built through the normal path.
   */
  dyn?: RowLeaf[] | null;
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
}
