export type ConditionInput = boolean | (() => boolean);

export function runCondition(
  condition: () => boolean,
  onError?: (error: unknown) => void
): boolean {
  try {
    return condition();
  } catch (error) {
    if (onError) {
      onError(error);
      return false;
    }
    throw error;
  }
}

export function resolveCondition(
  value: ConditionInput,
  onError?: (error: unknown) => void
): boolean {
  return typeof value === "function" ? runCondition(value, onError) : Boolean(value);
}
