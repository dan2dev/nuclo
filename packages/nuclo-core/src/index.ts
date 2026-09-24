// Public entry point. Importing this module auto-registers the global tag
// builders (div, span, ...) and runtime helpers — see ./bootstrap.

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

// Auto-initialize when the module is loaded.
import "./bootstrap";
