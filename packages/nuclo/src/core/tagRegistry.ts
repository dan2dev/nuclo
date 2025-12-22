import { createHtmlTagBuilder, createSvgTagBuilder } from "./elementFactory";
import { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./tagConstants";

// Re-export constants for public API
export { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS };

function registerHtmlTag(target: Record<string, unknown>, tagName: ElementTagName): void {
  // Don't overwrite non-function properties (safety check)
  if (tagName in target && typeof target[tagName] !== 'function') {
    return;
  }
  target[tagName] = createHtmlTagBuilder(tagName);
}

function registerSvgTag(target: Record<string, unknown>, tagName: keyof SVGElementTagNameMap): void {
  // All SVG tags use camelCase Svg suffix: aSvg, rectSvg, pathSvg, etc.
  const exportName = `${tagName}Svg`;

  if (!(exportName in target)) {
    target[exportName] = createSvgTagBuilder(tagName);
  }
}

export function registerGlobalTagBuilders(target: Record<string, unknown> = globalThis): void {
  const marker = "__nuclo_tags_registered";
  if ((target as Record<string, boolean>)[marker]) return;

  // Register SVG tags with Svg suffix
  for (let i = 0; i < SVG_TAGS.length; i++) {
    registerSvgTag(target, SVG_TAGS[i]);
  }

  // Register HTML tags
  for (let i = 0; i < HTML_TAGS.length; i++) {
    registerHtmlTag(target, HTML_TAGS[i]);
  }

  (target as Record<string, boolean>)[marker] = true;
}
