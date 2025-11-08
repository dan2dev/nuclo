import { isFunction, isNode, isObject } from "./typeGuards";

type BooleanCondition = () => boolean;
type ZeroArityFunction = () => unknown;

const modifierProbeCache = new WeakMap<ZeroArityFunction, { value: unknown; error: boolean }>();

function probeOnce(fn: ZeroArityFunction): { value: unknown; error: boolean } {
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

function isBooleanFunction(fn: ZeroArityFunction): fn is BooleanCondition {
  const { value, error } = probeOnce(fn);
  if (error) return false;
  return typeof value === "boolean";
}

export function isConditionalModifier(
  modifier: unknown,
  allModifiers: unknown[],
  currentIndex: number
): modifier is BooleanCondition {
  if (!isFunction(modifier) || modifier.length !== 0) {
    return false;
  }

  // After checking length === 0, we know it's a ZeroArityFunction
  const zeroArityFn = modifier as ZeroArityFunction;
  if (!isBooleanFunction(zeroArityFn)) {
    return false;
  }

  const otherModifiers = allModifiers.filter((_, index) => index !== currentIndex);
  if (otherModifiers.length === 0) return false;

  const hasAttributesOrElements = otherModifiers.some((mod) => {
    if (isObject(mod) || isNode(mod)) return true;
    if (isFunction(mod) && mod.length > 0) return true;
    return false;
  });

  return hasAttributesOrElements;
}

export function findConditionalModifier(modifiers: unknown[]): number {
  for (let i = 0; i < modifiers.length; i += 1) {
    if (isConditionalModifier(modifiers[i], modifiers, i)) {
      return i;
    }
  }
  return -1;
}

export { modifierProbeCache };
