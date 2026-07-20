/**
 * Internal factory metadata.
 *
 * Tag builders return opaque factory closures; the list() template engine
 * needs to see through them (tag name + modifier list) to decide whether a
 * row can be built by cloning a skeleton instead of running the factory.
 * The metadata is attached under symbols so nothing leaks into the public
 * API surface or enumerable properties.
 */

export const FACTORY_TAG = Symbol("nuclo.factory.tag");
export const FACTORY_MODS = Symbol("nuclo.factory.mods");
let metadataOnlyFactoryDepth = 0;

/**
 * Metadata-only factories (list() template rows past the first) are read
 * once, via getFactoryTag/getFactoryMods, during the same synchronous render
 * pass that created them, and are never invoked or retained afterward — so a
 * small pool of stub functions can be reused across rows instead of
 * allocating a fresh closure per tag-builder call. The pool rewinds to index
 * 0 at the outermost withMetadataOnlyFactories entry: one row's tree needs at
 * most one live slot per factory call within it, and the next row's pass
 * only starts once the previous row's tree has been fully consumed by the
 * caller (list runtime template instantiation is fully synchronous per row).
 */
const metadataOnlyStubPool: Array<() => null> = [];
let metadataOnlyPoolIndex = 0;

export function acquireMetadataOnlyFactory(): () => null {
  if (metadataOnlyPoolIndex >= metadataOnlyStubPool.length) {
    metadataOnlyStubPool.push(() => null);
  }
  return metadataOnlyStubPool[metadataOnlyPoolIndex++]!;
}

interface TaggedFactory {
  [FACTORY_TAG]?: string;
  [FACTORY_MODS]?: readonly unknown[];
}

export function setFactoryMeta(
  factory: unknown,
  tag: string,
  mods: readonly unknown[],
): void {
  (factory as TaggedFactory)[FACTORY_TAG] = tag;
  (factory as TaggedFactory)[FACTORY_MODS] = mods;
}

/** Returns the modifier list of a tag-builder factory, or undefined. */
export function getFactoryMods(fn: unknown): readonly unknown[] | undefined {
  return typeof fn === "function" ? (fn as TaggedFactory)[FACTORY_MODS] : undefined;
}

/** Returns the tag name of a tag-builder factory, or undefined. */
export function getFactoryTag(fn: unknown): string | undefined {
  return typeof fn === "function" ? (fn as TaggedFactory)[FACTORY_TAG] : undefined;
}

export function isMetadataOnlyFactoryMode(): boolean {
  return metadataOnlyFactoryDepth > 0;
}

export function withMetadataOnlyFactories<T>(fn: () => T): T {
  const isOutermost = metadataOnlyFactoryDepth === 0;
  metadataOnlyFactoryDepth++;
  if (isOutermost) metadataOnlyPoolIndex = 0;
  try {
    return fn();
  } finally {
    metadataOnlyFactoryDepth--;
  }
}
