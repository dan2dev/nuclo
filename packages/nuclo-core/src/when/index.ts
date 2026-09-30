import { WhenBuilderImpl, createWhenBuilderFunction } from "./builder";

export { updateWhenRuntimes } from "./runtime";

/**
 * Creates a conditional rendering block (when/else logic).
 *
 * Renders different content based on boolean conditions, similar to if/else statements.
 * Conditions can be static booleans (read once) or functions that are re-evaluated
 * on every update().
 *
 * @param condition - Boolean value or function returning a boolean
 * @param content - Content to render when condition is true
 * @returns A builder that allows chaining additional .when() or .else() branches
 *
 * @example
 * ```ts
 * let isLoggedIn = false;
 *
 * div(
 *   when(() => isLoggedIn,
 *     span('Welcome back!')
 *   )
 *   .else(
 *     button('Login', { onClick: () => { isLoggedIn = true; update(); } })
 *   )
 * )
 * ```
 *
 * @example
 * ```ts
 * // Multiple conditions
 * let status: 'loading' | 'error' | 'ready' = 'loading';
 *
 * div(
 *   when(() => status === 'loading',
 *     p('Loading…')
 *   )
 *   .when(() => status === 'error',
 *     p('Something went wrong')
 *   )
 *   .else(
 *     p('Ready')
 *   )
 * )
 * ```
 */
export function when<TTagName extends ElementTagName = ElementTagName>(
  condition: WhenCondition,
  ...content: WhenContent<TTagName>[]
): WhenBuilder<TTagName> {
  const builder = new WhenBuilderImpl<TTagName>([{ condition, content }], []);
  return createWhenBuilderFunction(builder);
}
