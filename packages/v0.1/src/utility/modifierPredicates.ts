type ZeroArityFunction = () => unknown;

const modifierProbeCache = new WeakMap<ZeroArityFunction, { value: unknown; error: boolean }>();

export { modifierProbeCache };
