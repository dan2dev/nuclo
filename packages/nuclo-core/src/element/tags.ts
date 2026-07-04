/**
 * The HTML/SVG tag catalogue and the code that turns every tag into a global
 * builder function (`div(...)`, `span(...)`, `rectSvg(...)`, ...).
 */
import { createHtmlTagBuilder, createSvgTagBuilder } from "./factory";

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
  const builder = createHtmlTagBuilder(tagName);
  target[tagName] = builder;
  // `var` is a reserved word, so the declared global is `var_` — register it
  // under that name too (the bare `var` key stays for globalThis["var"] access).
  if (tagName === "var") {
    target["var_"] = builder;
  }
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
