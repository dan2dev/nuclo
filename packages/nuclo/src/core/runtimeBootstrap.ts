/**
 * Runtime Bootstrap for nuclo
 * 
 * This module handles the initialization of the nuclo runtime, making all
 * tag builders and utilities available globally. It's automatically executed
 * when the module is imported.
 */

import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render } from "../utility/render";

/**
 * Initializes the nuclo runtime by:
 * 1. Registering all HTML/SVG tag builders globally (div, span, button, etc.)
 * 2. Making reactive utilities available globally (update, when, list, on, render)
 * 
 * This function is called automatically when the module is imported.
 */
export function initializeRuntime(): void {
  // Register all HTML/SVG tag builders as global functions
  registerGlobalTagBuilders();

  // Make reactive utilities available globally
  if (typeof globalThis !== "undefined") {
    const globalScope = globalThis as Record<string, unknown>;
    
    // Core reactive utilities
    globalScope.list = list;      // For rendering lists of items
    globalScope.update = update;  // For triggering reactive updates
    globalScope.when = when;      // For conditional rendering
    
    // DOM utilities
    globalScope.on = on;          // For event handling
    globalScope.render = render;  // For rendering to DOM
  }
}

// Auto-initialize when the module is loaded
// This makes nuclo work with the simple import: import 'nuclo';
if (typeof globalThis !== "undefined") {
  initializeRuntime();
}
