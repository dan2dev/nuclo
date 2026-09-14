/**
 * Mount/destroy lifecycle hooks.
 *
 * Two equivalent ways to register them, both funneling into this module:
 *   - `on("mount", cb)` / `on("destroy", cb)`            (./events.ts)
 *   - `{ onMount: cb }` / `{ onDestroy: cb }` attributes  (./attributes.ts)
 *
 * ── Mount timing ─────────────────────────────────────────────────────────
 * A freshly created element is still detached while its own subtree (and,
 * for the initial page render, every ancestor up to the root) is being
 * assembled — nuclo builds a tree fully off-document before attaching it in
 * one shot (render()/hydrate()), and list()/when() do the same for the
 * rows/branches they insert into an already-connected host. So onMount can't
 * fire the instant a modifier runs; the element is queued and the queue is
 * flushed once the surrounding operation (render(), hydrate(), or update())
 * finishes inserting its nodes — at that point the element is guaranteed
 * connected. See flushMountQueue() and its call sites in render.ts/update.ts.
 *
 * ── Destroy timing ───────────────────────────────────────────────────────
 * onDestroy fires eagerly and synchronously the moment nuclo removes the
 * element through its own machinery — see the disposeElementLifecycle() call
 * in shared/dom.ts's cleanupNodeTree(), which every ordinary removal
 * (list()/when() diffing, any safeRemoveChild() call) already goes through.
 * The handful of fast paths that intentionally skip that per-node walk for
 * performance (list()'s bulk clear/replace, the single-element when()/else()
 * swap) call disposeLifecyclesInSubtree() directly instead, so destroy still
 * fires exactly at removal time there too — without paying for a bookkeeping
 * walk when nothing in the affected subtree ever registered a lifecycle
 * callback (hasActiveLifecycleRegistrations() short-circuits that to a
 * single integer comparison in the — by far most common — case where
 * lifecycle hooks aren't used at all).
 *
 * An element removed through means nuclo never observes (e.g. a raw
 * `node.remove()` on a container built by render()) is only noticed the next
 * time render()/hydrate()/update() runs and finds it disconnected — this
 * file does not use a MutationObserver. That never leaks memory (all
 * bookkeeping below is WeakMap-based, exactly like every other nuclo
 * registry — see test/memory/gc-collectability.test.ts), but if an app
 * removes a node that way and never calls update() again afterwards,
 * onDestroy for it will not run either. This matches list()/when()'s own
 * documented "disconnection is noticed lazily, on the next update()"
 * contract; it is not a lifecycle-specific limitation.
 *
 * ── Memory ───────────────────────────────────────────────────────────────
 * Per-element bookkeeping lives in a WeakMap keyed by the element, so it is
 * collectible the instant nothing else references the element — exactly the
 * same shape as list/runtime.ts's and update/registry.ts's registries. The
 * only iteration structure (mountQueue) never outlives a single flush.
 */

import { logError } from "../shared/errors";
import { isBrowser } from "../shared/environment";
import { isSerializing } from "../hydration";

type CallbackSlot<T> = T | T[];

// Plain numeric constants rather than `const enum` — this project's tsconfig
// enables erasableSyntaxOnly, which `const enum` (a non-erasable construct:
// it needs its values inlined by the TS compiler itself) is incompatible
// with. Mirrors the same pattern already used by list/template.ts's
// LEAF_TEXT/LEAF_CLASSNAME/SLOT_*/ATTR_* constants.
type LifecycleStateValue = 0 | 1 | 2;
/** Registered, not yet flushed (or already disposed before it could be). */
const STATE_PENDING: LifecycleStateValue = 0;
const STATE_MOUNTED: LifecycleStateValue = 1;
const STATE_DISPOSED: LifecycleStateValue = 2;

interface LifecycleRecord {
  mount: CallbackSlot<MountCallback<Element>> | null;
  destroy: CallbackSlot<DestroyCallback<Element>> | null;
  state: LifecycleStateValue;
  /** True while this element sits in mountQueue awaiting a flush — guards
   *  against queuing the same element twice across multiple on()/attribute
   *  registrations. */
  queued: boolean;
}

const records = new WeakMap<Element, LifecycleRecord>();

/**
 * Count of Pending/Mounted records not yet disposeElementLifecycle()'d. Lets
 * the hot, lifecycle-free removal paths (list() bulk clear, the conditional-
 * element swap) skip disposeLifecyclesInSubtree()'s walk entirely with a
 * single comparison — true for the overwhelming majority of apps, which
 * never use onMount/onDestroy at all.
 *
 * Only ever incremented by ensureRecord() and decremented by
 * disposeElementLifecycle(), so an element GC'd via the raw-removal path
 * documented above (disposed by neither) leaves this one too high until the
 * page's very last such element is finally disposed — never unbounded, and
 * the cost of staying "on" a little longer than strictly necessary is just
 * the same cheap WeakMap probe this counter exists to let most apps skip
 * entirely, so it isn't worth a FinalizationRegistry to correct.
 */
let activeCount = 0;

let mountQueue: Element[] = [];

function shouldSkip(): boolean {
  // isSerializing() is checked in addition to isBrowser (unlike on()'s plain
  // DOM-event path) because renderToString() can run under jsdom, where
  // isBrowser is true. A DOM event registered there is inert (nothing ever
  // dispatches it), but a mount callback registered there would actually
  // *run* — including any side effects, like starting a timer or opening a
  // subscription — purely from serializing a page to a string. Skipping
  // registration entirely during serialization avoids that.
  return !isBrowser || isSerializing();
}

function ensureRecord(element: Element): LifecycleRecord {
  let record = records.get(element);
  if (!record) {
    record = { mount: null, destroy: null, state: STATE_PENDING, queued: false };
    records.set(element, record);
    activeCount++;
  }
  return record;
}

function pushSlot<T>(slot: CallbackSlot<T> | null, cb: T): CallbackSlot<T> {
  if (slot === null) return cb;
  if (Array.isArray(slot)) {
    slot.push(cb);
    return slot;
  }
  return [slot, cb];
}

function enqueue(element: Element, record: LifecycleRecord): void {
  if (record.queued || record.state !== STATE_PENDING) return;
  record.queued = true;
  mountQueue.push(element);
}

/** Registers a mount callback for `element`. See the module doc for timing. */
export function registerMount<TElement extends Element>(
  element: TElement,
  callback: MountCallback<TElement>,
): void {
  if (shouldSkip()) return;
  const record = ensureRecord(element);
  // Not reachable through the tag-builder DSL (every modifier — on()/attrs —
  // runs once, synchronously, while the element is still Pending) — only via
  // a direct, manual on("mount", cb)(element, 0) call on an element nuclo has
  // already disposed. Dropped rather than stored so it can't grow the
  // record's callback list for an element that will never mount again.
  if (record.state === STATE_DISPOSED) return;
  record.mount = pushSlot(record.mount, callback as MountCallback<Element>);
  enqueue(element, record);
}

/** Registers a destroy callback for `element`. See the module doc for timing. */
export function registerDestroy<TElement extends Element>(
  element: TElement,
  callback: DestroyCallback<TElement>,
): void {
  if (shouldSkip()) return;
  const record = ensureRecord(element);
  if (record.state === STATE_DISPOSED) return; // see registerMount()
  record.destroy = pushSlot(record.destroy, callback as DestroyCallback<Element>);
  enqueue(element, record);
}

function runMount(element: Element, callback: MountCallback<Element>, record: LifecycleRecord): void {
  try {
    const cleanup = callback(element);
    if (typeof cleanup === "function") {
      // A mount-returned cleanup takes no arguments (matches the
      // useEffect()/onMount() convention); wrap it to the element-taking
      // destroy shape so it can share storage/dispatch with explicit
      // onDestroy registrations.
      record.destroy = pushSlot(record.destroy, (() => cleanup()) as DestroyCallback<Element>);
    }
  } catch (error) {
    logError("Error in mount callback", error);
  }
}

function runDestroy(element: Element, callback: DestroyCallback<Element>): void {
  try {
    callback(element);
  } catch (error) {
    logError("Error in destroy callback", error);
  }
}

function fireMount(element: Element): void {
  const record = records.get(element);
  if (!record) return;
  record.queued = false;
  // Disposed before its queued turn came up (e.g. built and discarded within
  // the same pass) — the mount never observably happened, so don't fire it.
  if (record.state !== STATE_PENDING) return;
  record.state = STATE_MOUNTED;

  const mount = record.mount;
  if (mount === null) return;
  if (Array.isArray(mount)) {
    for (let i = 0; i < mount.length; i++) runMount(element, mount[i], record);
  } else {
    runMount(element, mount, record);
  }
}

/**
 * Flushes every element queued since the last flush, firing its mount
 * callback(s) now that the surrounding render()/hydrate()/update() pass has
 * finished inserting nodes into the (connected) document.
 *
 * Swaps the shared queue out to a local batch before iterating, so a mount
 * callback that itself triggers a nested update() (which pushes onto a fresh
 * queue and flushes it in its own, inner call) can't corrupt or be corrupted
 * by the batch this call is still draining.
 */
export function flushMountQueue(): void {
  if (mountQueue.length === 0) return;
  const batch = mountQueue;
  mountQueue = [];
  for (let i = 0; i < batch.length; i++) {
    fireMount(batch[i]);
  }
}

/**
 * Finalizes one element's lifecycle: silently cancels a mount that never got
 * to run (state was still Pending — built and discarded within one pass), or
 * fires its destroy callback(s) (state was Mounted). Idempotent — safe to
 * call more than once for the same element, e.g. once eagerly from
 * cleanupNodeTree() and, redundantly, once more from a fast-path caller that
 * doesn't know whether the eager walk already reached this node.
 */
export function disposeElementLifecycle(element: Element): void {
  const record = records.get(element);
  if (!record) return;
  if (record.state === STATE_DISPOSED) return;

  const wasMounted = record.state === STATE_MOUNTED;
  record.state = STATE_DISPOSED;
  activeCount--;

  if (wasMounted) {
    const destroy = record.destroy;
    if (destroy !== null) {
      if (Array.isArray(destroy)) {
        for (let i = 0; i < destroy.length; i++) runDestroy(element, destroy[i]);
      } else {
        runDestroy(element, destroy);
      }
    }
  }

  // Drop references eagerly instead of waiting for the WeakMap entry to be
  // collected along with the element — the callbacks (and anything they
  // closed over) become unreachable from here immediately.
  record.mount = null;
  record.destroy = null;
}

/**
 * True while at least one element anywhere on the page has a live (Pending
 * or Mounted) lifecycle record. See disposeLifecyclesInSubtree() in
 * shared/dom.ts, the only caller.
 */
export function hasActiveLifecycleRegistrations(): boolean {
  return activeCount > 0;
}
