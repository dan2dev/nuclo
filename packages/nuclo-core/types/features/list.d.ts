declare global {
  export type ListItemsInput<T> = readonly T[] | Iterable<T>;

  // Dynamic list function types - supports both HTML and SVG builders/elements
  export type ListRenderResult<
    TTagName extends ElementTagName = ElementTagName,
  > =
    | ExpandedElement<TTagName>
    | DetachedExpandedElementFactory<TTagName>
    | NodeModFn<TTagName>
    | DetachedSVGElementFactory
    | SVGElementModifierFn
    | Node
    | null
    | undefined;

  export type ListRenderFunction<
    T,
    TTagName extends ElementTagName = ElementTagName,
  > = (item: T, index: number) => ListRenderResult<TTagName>;

  export type ListItemsProvider<T> = () => ListItemsInput<T>;

  /**
   * A list modifier uses a generic call signature so it can be attached to any
   * parent element, regardless of the tag of the items it renders.
   * (TTagName represents the child element tag, not the parent.)
   */
  export type ListModifier<TTagName extends ElementTagName = ElementTagName> =
    (<TParent extends ElementTagName>(
      parent: ExpandedElement<TParent>,
      index: number,
    ) => Comment) &
      ((parent: Node & ParentNode, index: number) => Comment);

  export function list<T, TTagName extends ElementTagName = ElementTagName>(
    itemsProvider: ListItemsProvider<T>,
    render: ListRenderFunction<T, TTagName>,
  ): ListModifier<TTagName>;
}

export {};
