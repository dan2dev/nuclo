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
/**
 * Marks the modifier returned by on() for a native DOM event. Applying it only
 * attaches a listener to its parent (it produces no node and reads no row
 * state), so the list() template engine can replay it on a skeleton clone
 * exactly as the normal build path would.
 */
export const EVENT_MODIFIER = Symbol("nuclo.event.modifier");
let metadataOnlyFactoryDepth = 0;

/**
 * Metadata-only factories (list() template rows past the first) are read
 * once, via getFactoryTag/getFactoryMods, during the same synchronous render
 * pass that created them, and are never invoked or retained afterward — so a
 * small pool of stub functions can be reused across rows instead of
 * allocating a fresh closure per tag-builder call. Each row checkpoints the
 * pool before rendering and releases its metadata after consumption, including
 * on failure. Nested renders use later slots so they cannot overwrite an
 * outer row's still-live factory tree.
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

export function markEventModifier<T extends object>(fn: T): T {
  (fn as { [EVENT_MODIFIER]?: boolean })[EVENT_MODIFIER] = true;
  return fn;
}

/** True for a modifier returned by on() for a native DOM event. */
export function isEventModifier(fn: unknown): boolean {
  return typeof fn === "function" && (fn as { [EVENT_MODIFIER]?: boolean })[EVENT_MODIFIER] === true;
}

export function isMetadataOnlyFactoryMode(): boolean {
  return metadataOnlyFactoryDepth > 0;
}

/**
 * Takes the render function and its two args directly (rather than a `() =>`
 * thunk) so the hot per-row call in list/runtime.ts doesn't allocate a
 * closure just to defer a single call.
 */
export function withMetadataOnlyFactories<TItem, T>(fn: (item: TItem, index: number) => T, item: TItem, index: number): T {
  metadataOnlyFactoryDepth++;
  try {
    return fn(item, index);
  } finally {
    metadataOnlyFactoryDepth--;
  }
}

export function getMetadataOnlyFactoryCheckpoint() {
  return metadataOnlyPoolIndex;
}

export function releaseMetadataOnlyFactories(checkpoint: number) {
  while (metadataOnlyPoolIndex > checkpoint) {
    const factory = metadataOnlyStubPool[--metadataOnlyPoolIndex] as TaggedFactory;
    factory[FACTORY_TAG] = undefined;
    factory[FACTORY_MODS] = undefined;
  }
}
