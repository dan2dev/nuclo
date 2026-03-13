declare global {
  export type ListItemsInput<T> = readonly T[] | Iterable<T>;

  // Dynamic list function types - supports both HTML and SVG builders/elements
  export type ListRenderResult<TTagName extends ElementTagName = ElementTagName> =
    | ExpandedElement<TTagName>
    | DetachedExpandedElementFactory<TTagName>
    | NodeModFn<TTagName>
    | DetachedSVGElementFactory
    | SVGElementModifierFn
    | Node
    | null
    | undefined;

  export type ListRenderFunction<T, TTagName extends ElementTagName = ElementTagName> = (
    item: T,
    index: number
  ) => ListRenderResult<TTagName>;

  export type ListItemsProvider<T> = () => ListItemsInput<T>;

  export type ListModifier<TTagName extends ElementTagName = ElementTagName> =
    NodeModFn<TTagName> & ((parent: Node & ParentNode, index: number) => Comment);

  export function list<T, TTagName extends ElementTagName = ElementTagName>(
    itemsProvider: ListItemsProvider<T>,
    render: ListRenderFunction<T, TTagName>
  ): ListModifier<TTagName>;
}

export {};
