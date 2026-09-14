/**
 * Mount/unmount lifecycle hook types.
 *
 * Two equivalent ways to register them (both typed from these two aliases):
 *   - `on("mount", cb)` / `on("unmount", cb)`            (types/features/on.d.ts)
 *   - `{ onMount: cb }` / `{ onUnmount: cb }` attributes  (LifecycleElementAttributes below)
 *
 * See src/element/lifecycle.ts for exactly when each callback fires.
 */

declare global {
  /** Cleanup returned by a mount callback, run once the element unmounts. */
  export type MountCleanup = () => void;

  /**
   * Called once, after the element has been created and connected to the
   * live document. May return a cleanup function — equivalent to also
   * registering it with `on("unmount", ...)` / `{ onUnmount }`.
   */
  export type MountCallback<TElement extends Element = HTMLElement> =
    (element: TElement) => void | MountCleanup;

  /** Called once the element has been removed. */
  export type UnmountCallback<TElement extends Element = HTMLElement> =
    (element: TElement) => void;
}

export {};
