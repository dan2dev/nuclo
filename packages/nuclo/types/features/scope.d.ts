declare global {
  // Scope modifier for scoped updates
  export function scope<TTagName extends ElementTagName = ElementTagName>(...ids: string[]): NodeModFn<TTagName>;
  
  /**
   * Cleans up all disconnected elements from all scopes.
   * Call this during page transitions to prevent memory leaks.
   */
  export function cleanupAllScopes(): void;
}

export {};
