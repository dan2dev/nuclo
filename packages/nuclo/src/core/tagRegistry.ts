/**
 * Tag Registry for nuclo
 * 
 * This module manages the registration of HTML and SVG tag builders as global functions.
 * It provides the core functionality that makes div(), span(), button(), etc. available
 * globally when nuclo is imported.
 */

import { createTagBuilder } from "./elementFactory";

/**
 * Complete list of HTML tag names supported by nuclo.
 * These become global functions when the library is imported.
 */
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

/**
 * Complete list of SVG tag names supported by nuclo.
 * These become global functions when the library is imported.
 */
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

/**
 * HTML tags that are self-closing (void elements).
 * These don't have closing tags in HTML.
 */
export const SELF_CLOSING_TAGS = [
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "source", "track", "wbr",
] as const satisfies ReadonlyArray<ElementTagName>;

/**
 * Registers a single HTML tag as a global function.
 * 
 * @param target - The global scope object to register the tag on
 * @param tagName - The name of the HTML tag to register
 */
function registerHtmlTag(target: Record<string, unknown>, tagName: ElementTagName): void {
  // Only register if not already present (prevents overwriting existing globals)
  if (!(tagName in target)) {
    target[tagName] = createTagBuilder(tagName);
  }
}

/**
 * Registers all HTML tag builders as global functions.
 * 
 * This function creates global functions like div(), span(), button(), etc.
 * that can be used to create DOM elements with nuclo's reactive system.
 * 
 * @param target - The global scope object to register tags on (defaults to globalThis)
 */
export function registerGlobalTagBuilders(target: Record<string, unknown> = globalThis): void {
  const registrationMarker = "__nuclo_tags_registered";
  
  // Prevent duplicate registration
  if ((target as Record<string, boolean>)[registrationMarker]) {
    return;
  }

  // Register all HTML tags as global functions
  HTML_TAGS.forEach((tagName) => registerHtmlTag(target, tagName));
  
  // Mark as registered to prevent duplicate calls
  (target as Record<string, boolean>)[registrationMarker] = true;
}
