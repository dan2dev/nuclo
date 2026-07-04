/**
 * Type declarations for the `nuclo/ssr` subpath.
 *
 * Hand-written (mirroring src/ssr/index.ts) and shipped from `types/` so the
 * subpath stays typed even when `dist/` holds only watch-mode JS bundles —
 * `tsdown --watch` cleans dist and emits no declarations. Keep in sync with
 * src/ssr/index.ts.
 */

// Load the ambient nuclo globals (NodeModFn, ElementTagName, tag builders, …)
// so SSR-only consumers get them without importing the main entry.
import "./index";

/** Anything renderToString accepts: a component factory, a DOM node, or nothing. */
export type RenderableInput =
  | NodeModFn<ElementTagName>
  | Element
  | Node
  | null
  | undefined;

/**
 * Renders a Nuclo component (or DOM node) to an HTML string.
 * Text children keep their `<!-- text-N -->` markers so the output is hydratable.
 */
export function renderToString(input: RenderableInput): string;

/** Renders multiple Nuclo components to HTML strings. */
export function renderManyToString(inputs: RenderableInput[]): string[];

/** Renders a Nuclo component wrapped in a container element. */
export function renderToStringWithContainer(
  input: RenderableInput,
  containerTag?: string,
  containerAttrs?: Record<string, string>,
): string;

/**
 * Install a hook receiving every newly minted CSS rule (wrapped in its
 * at-rule, if any). Installed once at server startup; pass null to remove.
 */
export function setSSRCollector(fn: ((rule: string) => void) | null): void;

/** Serialize every registered atomic CSS rule (for a <style> tag in SSR output). */
export function getCssText(): string;
