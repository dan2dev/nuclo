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
  metadataOnlyFactoryDepth++;
  try {
    return fn();
  } finally {
    metadataOnlyFactoryDepth--;
  }
}
