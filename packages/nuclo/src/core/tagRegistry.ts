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
  if (!(tagName in target)) {
    target[tagName] = createTagBuilder(tagName);
  }
}

export function registerGlobalTagBuilders(target: Record<string, unknown> = globalThis): void {
  const marker = "__vc_tags_registered";
  if ((target as Record<string, boolean>)[marker]) return;

  HTML_TAGS.forEach((tagName) => registerHtmlTag(target, tagName));
  (target as Record<string, boolean>)[marker] = true;
}
