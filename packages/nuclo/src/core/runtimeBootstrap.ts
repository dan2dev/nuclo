import { registerGlobalTagBuilders } from "./tagRegistry";
import { list } from "../list";
import { update } from "./updateController";
import { when } from "../when";
import { on } from "../utility/on";
import { render } from "../utility/render";
import { scope, cleanupAllScopes } from "../utility/scope";
import { applyNodeModifier } from "./modifierProcessor";
import { applyAttributes } from "./attributeManager";
import { appendChildren, createComment, createConditionalComment, replaceNodeSafely } from "../utility/dom";
import { isBoolean, isFunction, isNode, isObject, isPrimitive, isTagLike, isZeroArityFunction } from "../utility/typeGuards";
import { isBrowser } from "../utility/environment";
import { createHtmlTagBuilder, createSvgTagBuilder } from "./elementFactory";
import { createHtmlElementWithModifiers, createSvgElementWithModifiers } from "../internal/applyModifiers";
import * as styleExports from "../style";

/**
 * Initializes the nuclo runtime by exposing tag builders and utilities.
 */

export function initializeRuntime(): void {
  registerGlobalTagBuilders();

  const registry = globalThis as Record<string, unknown>;
  
  // Core reactive utilities
  registry.list = list;
  registry.update = update;
  registry.when = when;
  registry.on = on;
  registry.scope = scope;
  registry.cleanupAllScopes = cleanupAllScopes;
  registry.render = render;
  
  // Factory and builder functions
  registry.createHtmlTagBuilder = createHtmlTagBuilder;
  registry.createSvgTagBuilder = createSvgTagBuilder;
  registry.createHtmlElementWithModifiers = createHtmlElementWithModifiers;
  registry.createSvgElementWithModifiers = createSvgElementWithModifiers;
  
  // Core processors
  registry.applyNodeModifier = applyNodeModifier;
  registry.applyAttributes = applyAttributes;
  
  // DOM utilities
  registry.appendChildren = appendChildren;
  registry.createComment = createComment;
  registry.createConditionalComment = createConditionalComment;
  registry.replaceNodeSafely = replaceNodeSafely;
  
  // Type guards
  registry.isBoolean = isBoolean;
  registry.isFunction = isFunction;
  registry.isNode = isNode;
  registry.isObject = isObject;
  registry.isPrimitive = isPrimitive;
  registry.isTagLike = isTagLike;
  registry.isZeroArityFunction = isZeroArityFunction;
  
  // Environment detection
  registry.isBrowser = isBrowser;

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
