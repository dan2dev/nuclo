import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render } from "../utility/render";
import { scope } from "../utility/scope";
import * as styleExports from "../style";

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

  // Register all style utilities globally
  // Use individual assignments to avoid errors with readonly properties (like window.top)
  for (const [key, value] of Object.entries(styleExports)) {
    try {
      registry[key] = value;
    } catch {
      // Skip properties that can't be set (e.g., readonly window properties)
    }
  }
}

initializeRuntime();
