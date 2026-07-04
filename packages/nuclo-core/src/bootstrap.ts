import { registerGlobalTagBuilders } from "./element/tags";
import { list } from "./list";
import { update } from "./update/update";
import { when } from "./when";
import { on } from "./element/events";
import { render, hydrate } from "./render";
import { scope } from "./update/scope";
import { createCss, css, cx, variants, keyframes, globalStyle } from "./style";

/**
 * Initializes the nuclo runtime by exposing tag builders and utilities.
 */

export function initializeRuntime(): void {
  registerGlobalTagBuilders();

  const registry = globalThis as Record<string, unknown>;
  registry.list = list;
  registry.update = update;
  registry.when = when;
  registry.on = on;
  registry.scope = scope;
  registry.render = render;
  registry.hydrate = hydrate;

  // Styling — a themeless default instance plus the factory for themed ones.
  // None of these names collide with window/globalThis properties.
  registry.createCss = createCss;
  registry.css = css;
  registry.cx = cx;
  registry.variants = variants;
  registry.keyframes = keyframes;
  registry.globalStyle = globalStyle;
}

initializeRuntime();
