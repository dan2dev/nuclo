export type ConditionInput = boolean | (() => boolean);

export function runCondition(
  condition: () => boolean,
  onError?: (error: unknown) => void
): boolean {
  try {
    return condition();
  } catch (error) {
    if (!onError) {
      throw error;
    }
    onError(error);
    return false;
  }
}

export function resolveCondition(
  value: ConditionInput,
  onError?: (error: unknown) => void
): boolean {
  return typeof value === "function"
    ? runCondition(value as () => boolean, onError)
    : Boolean(value);
}
