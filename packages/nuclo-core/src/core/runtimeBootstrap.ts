import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render, hydrate } from "../utility/render";
import { scope } from "../utility/scope";

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
}

initializeRuntime();
