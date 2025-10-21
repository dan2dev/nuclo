/**
 * nuclo - A simple, explicit DOM library for building reactive user interfaces.
 * 
 * This module exports the core functionality of nuclo, including:
 * - Global tag builders (div, span, button, etc.)
 * - Reactive utilities (update, when, list)
 * - DOM manipulation helpers (render, on)
 * - Type guards and utilities
 * 
 * The library auto-initializes when imported, making all HTML/SVG tag builders
 * available globally.
 */

// Core runtime and tag registration
export { initializeRuntime } from "./core/runtimeBootstrap";
export { registerGlobalTagBuilders, HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "./core/tagRegistry";
export { createElementFactory, createTagBuilder } from "./core/elementFactory";

// Modifier processing and DOM manipulation
export { applyNodeModifier } from "./core/modifierProcessor";
export { applyAttributes } from "./core/attributeManager";
export { appendChildren } from "./utility/dom";

// Reactive utilities
export { list } from "./list";
export { when } from "./when";
export { update } from "./core/updateController";

// Event handling and rendering
export { on } from "./utility/on";
export { render } from "./utility/render";

// Type guards and utilities
export { isBoolean, isFunction, isNode, isObject, isPrimitive, isTagLike } from "./utility/typeGuards";
export { isBrowser } from "./utility/environment";

// Auto-initialize the runtime when the module is loaded.
// This registers all HTML/SVG tag builders globally and makes them available.
import "./core/runtimeBootstrap";
