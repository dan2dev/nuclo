import { WhenBuilderImpl, createWhenBuilderFunction } from "./builder";
import type { WhenCondition, WhenContent } from "./runtime";

export { updateWhenRuntimes, clearWhenRuntimes } from "./runtime";

/**
 * Creates a conditional rendering block (when/else logic).
 *
 * Renders different content based on boolean conditions, similar to if/else statements.
 * Conditions can be static booleans or reactive functions that are re-evaluated on updates.
 *
 * @param condition - Boolean value or function returning a boolean
 * @param content - Content to render when condition is true
 * @returns A builder that allows chaining additional .when() or .else() branches
 *
 * @example
 * ```ts
 * const isLoggedIn = signal(false);
 *
 * div(
 *   when(() => isLoggedIn.value,
 *     span('Welcome back!')
 *   )
 *   .else(
 *     button('Login', on('click', () => login()))
 *   )
 * )
 * ```
 *
 * @example
 * ```ts
 * // Multiple conditions
 * div(
 *   when(() => status.value === 'loading',
 *     spinner()
 *   )
 *   .when(() => status.value === 'error',
 *     errorMessage()
 *   )
 *   .else(
 *     contentView()
 *   )
 * )
 * ```
 */
export function when<TTagName extends ElementTagName = ElementTagName>(
  condition: WhenCondition,
  ...content: WhenContent<TTagName>[]
): WhenBuilder<TTagName> {
  const builder = new WhenBuilderImpl<TTagName>(condition, ...content);
  return createWhenBuilderFunction(builder);
}
