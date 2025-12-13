declare global {
  // Group modifier for scoped updates
  export function group<TTagName extends ElementTagName = ElementTagName>(...ids: string[]): NodeModFn<TTagName>;
}

export {};

