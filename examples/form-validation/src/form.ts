/**
 * A validated field: plain mutable state plus a memoized `error`.
 *
 * Nuclo's `update()` re-runs every binding, so the validator can't rely on
 * "only run when something changed" from the framework. Instead the field
 * remembers the inputs of its last validation (its own value plus any `deps`)
 * and only calls `validate` again when one of them changed. Reading `error`
 * ten times per update() costs ten array comparisons, not ten validations.
 */
export function field<T>(
  initial: T,
  validate: (value: T) => string | undefined,
  deps: () => unknown[] = () => [],
) {
  let seen: unknown[] | undefined;
  let error: string | undefined;

  const f = {
    value: initial,
    touched: false,
    /** How many times `validate` actually ran. Only here to make the demo visible. */
    runs: 0,
    get error() {
      const inputs = [f.value, ...deps()];
      if (!seen || inputs.some((v, i) => !Object.is(v, seen![i]))) {
        seen = inputs;
        error = validate(f.value);
        f.runs++;
      }
      return error;
    },
  };
  return f;
}

export type Field<T = string> = ReturnType<typeof field<T>>;
