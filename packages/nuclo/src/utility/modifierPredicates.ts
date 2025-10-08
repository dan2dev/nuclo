import { isFunction, isNode, isObject } from "./typeGuards";

type AnyModifier = unknown;
type BooleanCondition = () => boolean;

const modifierProbeCache = new WeakMap<Function, { value: unknown; error: boolean }>();

function probeOnce(fn: Function): { value: unknown; error: boolean } {
  const cached = modifierProbeCache.get(fn);
  if (cached) {
    return cached;
  }
  try {
    const value = fn();
    const record = { value, error: false };
    modifierProbeCache.set(fn, record);
    return record;
  } catch {
    const record = { value: undefined, error: true };
    modifierProbeCache.set(fn, record);
    return record;
  }
}

function isBooleanFunction(fn: Function): fn is BooleanCondition {
  const { value, error } = probeOnce(fn);
  if (error) return false;
  return typeof value === "boolean";
}

export function isConditionalModifier(
  modifier: AnyModifier,
  allModifiers: AnyModifier[],
  currentIndex: number
): modifier is BooleanCondition {
  if (
    !isFunction(modifier) ||
    (modifier as Function).length !== 0 ||
    !isBooleanFunction(modifier as Function)
  ) {
    return false;
  }

  const otherModifiers = allModifiers.filter((_, index) => index !== currentIndex);
  if (otherModifiers.length === 0) return false;

  const hasAttributesOrElements = otherModifiers.some(
    (mod) =>
      isObject(mod) || isNode(mod) || (isFunction(mod) && (mod as Function).length > 0)
  );

  return hasAttributesOrElements;
}

export function findConditionalModifier(modifiers: AnyModifier[]): number {
  for (let i = 0; i < modifiers.length; i += 1) {
    if (isConditionalModifier(modifiers[i], modifiers, i)) {
      return i;
    }
  }
  return -1;
}

export { modifierProbeCache };
