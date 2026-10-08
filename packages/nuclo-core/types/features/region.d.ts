declare global {
  /**
   * What a region does when it holds more than one view.
   *
   * - `"stack"` — renders every view, in arrival order. A view that opens over
   *   another never rebuilds it, so the content underneath keeps its DOM, its
   *   focus and its form state.
   * - `"simple"` — renders only the newest view. The default.
   */
  export type RegionType = "stack" | "simple";

  export interface RegionOptions {
    /** The name `view()` calls use to find this region. Unique in the tree. */
    id: string;
    /** Defaults to `"simple"`. */
    type?: RegionType;
    /** Rendered whenever the region holds no views. */
    empty?: WhenContent;
  }

  export function region(options: RegionOptions): NodeModFn;

  export function view(id: string, ...content: WhenContent[]): NodeModFn;
  export function view(
    regions: Readonly<Record<string, WhenContent | readonly WhenContent[]>>,
  ): NodeModFn;
}

export {};
