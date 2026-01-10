declare global {
  // Dynamic list function types - supports both HTML and SVG elements
  export type ListRenderFunction<T, TTagName extends ElementTagName = ElementTagName> = (
    item: T, 
    index: number
  ) => ExpandedElement<TTagName> 
    | NodeModFn<TTagName> 
    | Node 
    | null
    | ((parent?: ExpandedElement<TTagName>, index?: number) => ExpandedElement<TTagName> | SVGElement | Node); // Support functions with optional params (like SVG builders)
    
  export type ListItemsProvider<T> = () => readonly T[];
  
  // List returns a function typed to be compatible with both HTML (NodeModFn) and SVG (SVGElementModifierFn) contexts
  // Note: The implementation allows optional parameters, but the type signature matches the stricter requirement
  export function list<T, TTagName extends ElementTagName = ElementTagName>(
    itemsProvider: ListItemsProvider<T>, 
    render: ListRenderFunction<T, TTagName>
  ): (parent: ExpandedElement<TTagName>, index: number) => Comment;
}

export {};