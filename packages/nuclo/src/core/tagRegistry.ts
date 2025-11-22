import { createTagBuilder } from "./elementFactory";
import { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./tagConstants";

// Re-export constants for public API
export { HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS };

function registerHtmlTag(target: Record<string, unknown>, tagName: ElementTagName): void {
  // Don't overwrite non-function properties (safety check)
  if (tagName in target && typeof target[tagName] !== 'function') {
    return;
  }
  // Register HTML tags - they override SVG tags with same name
  target[tagName] = createTagBuilder(tagName);
}

function registerSvgTag(target: Record<string, unknown>, tagName: keyof SVGElementTagNameMap): void {
  // Some SVG tags conflict with HTML tags or DOM globals
  // Use suffix convention: a_svg, script_svg, style_svg, title_svg, text_svg, stop_
  const conflictingTags = ['a', 'script', 'style', 'title', 'text'];
  const globalConflicts = ['stop']; // 'stop' conflicts with DOM stop property

  let exportName: string = tagName;
  if (conflictingTags.includes(tagName)) {
    exportName = `${tagName}_svg`;
  } else if (globalConflicts.includes(tagName)) {
    exportName = `${tagName}_`;
  }

  if (!(exportName in target)) {
    target[exportName] = createTagBuilder(tagName as ElementTagName);
  }
}

export function registerGlobalTagBuilders(target: Record<string, unknown> = globalThis): void {
  const marker = "__nuclo_tags_registered";
  if ((target as Record<string, boolean>)[marker]) return;

  // Register SVG tags first with special names for conflicts
  SVG_TAGS.forEach((tagName) => registerSvgTag(target, tagName));

  // Then register HTML tags - these will take precedence for conflicting names
  // So 'a' will be HTML by default, and 'a_svg' will be available for SVG anchors
  HTML_TAGS.forEach((tagName) => registerHtmlTag(target, tagName));

  (target as Record<string, boolean>)[marker] = true;
}
