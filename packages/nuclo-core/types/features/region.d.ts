declare global {
  /**
   * What a region does when it holds more than one view.
   *
   * - `"stack"` — renders every view, in arrival order. A view that opens over
   *   another never rebuilds it, so the content underneath keeps its DOM, its
   *   focus and its form state.
   * - `"latest"` — renders only the newest view. The default.
   */
  export type RegionType = "stack" | "latest";

  export interface RegionOptions {
    /** The name `into()` calls use to find this region. Unique in the tree. */
    id: string;
    /** Defaults to `"latest"`. */
    type?: RegionType;
    /** Rendered whenever the region holds no views. */
    empty?: WhenContent;
  }

  export function region(options: RegionOptions): MarkerModifier;

  export function into(id: string, ...content: WhenContent[]): MarkerModifier;
  export function into(
    regions: Readonly<Record<string, WhenContent | readonly WhenContent[]>>,
  ): MarkerModifier;
}

export {};
