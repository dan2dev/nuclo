declare global {
  // Dynamic list function types
  export type ListRenderFunction<T> = (item: T, index: number) => ExpandedElement<any> | NodeModFn<any>;
  export type ListItemsProvider<T> = () => T[];
  export function list<T>(itemsProvider: ListItemsProvider<T>, render: ListRenderFunction<T>): NodeModFn<any>;
}

export {};