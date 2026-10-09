// Public entry point. Importing this module auto-registers the global tag
// builders (div, span, ...) and runtime helpers — see ./bootstrap.

export { on } from "./element/events";

// Reactivity
export { update } from "./update/update";
export { scope } from "./update/scope";
export { list } from "./list";
export { when } from "./when";
export { region, view } from "./region";

// Mounting
export { render, hydrate, forceUpdate } from "./render";
export { onRootBuild } from "./shared/root-hooks";
export { viewWaiting } from "./region/runtime";

// Styling: css(), cx(), variants(), keyframes(), globalStyle(), createCss()
export * from "./style";

// Auto-initialize when the module is loaded.
import "./bootstrap";
