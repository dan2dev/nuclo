declare global {
  // Scope modifier for scoped updates
  export function scope<TTagName extends ElementTagName = ElementTagName>(...ids: string[]): NodeModFn<TTagName>;
}

export {};
