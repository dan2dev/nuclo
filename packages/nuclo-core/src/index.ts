// Public entry point. Importing this module auto-registers the global tag
// builders (div, span, ...) and runtime helpers — see ./bootstrap.

// Runtime setup
export { initializeRuntime } from "./bootstrap";

// Elements: tag builders and modifier plumbing
export { registerGlobalTagBuilders, HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./element/tags";
export {
  createHtmlTagBuilder,
  createSvgTagBuilder,
  createHtmlElementWithModifiers,
  createSvgElementWithModifiers,
} from "./element/factory";
export { applyNodeModifier } from "./element/modifiers";
export { applyAttributes } from "./element/attributes";
export { on } from "./element/events";

// Reactivity
export { update } from "./update/update";
export { scope } from "./update/scope";
export { list } from "./list";
export { when } from "./when";

// Mounting
export { render, hydrate } from "./render";

// Styling: css(), cx(), variants(), keyframes(), globalStyle(), createCss()
export * from "./style";

// Low-level helpers
export { appendChildren, createComment, createConditionalComment, replaceNodeSafely } from "./shared/dom";
export { isBoolean, isFunction, isNode, isObject, isPrimitive, isTagLike, isZeroArityFunction } from "./shared/type-guards";
export { isBrowser } from "./shared/environment";

// Auto-initialize when the module is loaded.
import "./bootstrap";
