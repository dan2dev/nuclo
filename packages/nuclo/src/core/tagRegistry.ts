import { createTagBuilder } from "./elementFactory";

export const HTML_TAGS = [
  "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base",
  "bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption",
  "cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details",
  "dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption",
  "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head",
  "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins",
  "kbd", "label", "legend", "li", "link", "main", "map", "mark", "menu",
  "meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option",
  "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s",
  "samp", "script", "search", "section", "select", "slot", "small", "source",
  "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td",
  "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr",
  "track", "u", "ul", "var", "video", "wbr",
] as const satisfies ReadonlyArray<ElementTagName>;

export const SVG_TAGS = [
  "a", "animate", "animateMotion", "animateTransform", "circle", "clipPath",
  "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer",
  "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
  "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG",
  "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology",
  "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile",
  "feTurbulence", "filter", "foreignObject", "g", "image", "line", "linearGradient",
  "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline",
  "radialGradient", "rect", "script", "set", "stop", "style", "svg", "switch",
  "symbol", "text", "textPath", "title", "tspan", "use", "view",
] as const satisfies ReadonlyArray<keyof SVGElementTagNameMap>;

export const SELF_CLOSING_TAGS = [
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
] as const satisfies ReadonlyArray<ElementTagName>;

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
