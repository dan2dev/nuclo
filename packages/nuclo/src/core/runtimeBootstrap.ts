import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render } from "../utility/render";

/**
 * Initializes the View Craft runtime by exposing tag builders and utilities.
 */
export function initializeRuntime(): void {
  registerGlobalTagBuilders();

  if (typeof globalThis !== "undefined") {
    const registry = globalThis as Record<string, unknown>;
    registry.list = list;
    registry.update = update;
    registry.when = when;
    registry.on = on;
    registry.render = render;
  }
}

if (typeof globalThis !== "undefined") {
  initializeRuntime();
}
