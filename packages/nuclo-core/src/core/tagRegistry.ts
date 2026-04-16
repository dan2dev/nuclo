import { createHtmlTagBuilder, createSvgTagBuilder } from "./elementFactory";
import { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./tagConstants";

export { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS };

const MARKER = "__nuclo_tags_registered";

export function registerGlobalTagBuilders(
  target: Record<string, unknown> = globalThis,
): void {
  if ((target as Record<string, unknown>)[MARKER] === true) return;

  // Register HTML tags first — they are looked up far more frequently than SVG.
  for (let i = 0, n = HTML_TAGS.length; i < n; i++) {
    const tag = HTML_TAGS[i];
    // Don't overwrite a non-function value already on the target.
    if (tag in target && typeof target[tag] !== "function") continue;
    target[tag] = createHtmlTagBuilder(tag);
  }

  for (let i = 0, n = SVG_TAGS.length; i < n; i++) {
    const tag = SVG_TAGS[i];
    const exportName = tag + "Svg";
    if (exportName in target) continue;
    target[exportName] = createSvgTagBuilder(tag);
  }

  (target as Record<string, unknown>)[MARKER] = true;
}
