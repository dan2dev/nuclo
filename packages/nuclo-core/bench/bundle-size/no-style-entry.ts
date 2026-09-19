// Bundle-size measurement only — not a shipped entry point. Mirrors
// src/index.ts's public exports and src/bootstrap.ts's initializeRuntime(),
// minus every style-related import and registry assignment, so
// build-and-diff.ts can measure how many bytes src/style/ actually
// contributes to dist/nuclo.mjs (nothing here imports "./style").
// Keep in sync with src/index.ts / src/bootstrap.ts if their non-style
// surface changes.
import { registerGlobalTagBuilders, HTML_TAGS, SVG_TAGS, SELF_CLOSING_TAGS } from "../../src/element/tags";
import {
	createHtmlTagBuilder,
	createSvgTagBuilder,
	createHtmlElementWithModifiers,
	createSvgElementWithModifiers,
} from "../../src/element/factory";
import { applyNodeModifier } from "../../src/element/modifiers";
import { applyAttributes } from "../../src/element/attributes";
import { on } from "../../src/element/events";
import { update } from "../../src/update/update";
import { scope } from "../../src/update/scope";
import { list } from "../../src/list";
import { when } from "../../src/when";
import { render, hydrate } from "../../src/render";
import {
	appendChildren,
	createComment,
	createConditionalComment,
	replaceNodeSafely,
} from "../../src/shared/dom";
import {
	isBoolean,
	isFunction,
	isNode,
	isObject,
	isPrimitive,
	isTagLike,
	isZeroArityFunction,
} from "../../src/shared/type-guards";
import { isBrowser } from "../../src/shared/environment";

export {
	registerGlobalTagBuilders,
	HTML_TAGS,
	SVG_TAGS,
	SELF_CLOSING_TAGS,
	createHtmlTagBuilder,
	createSvgTagBuilder,
	createHtmlElementWithModifiers,
	createSvgElementWithModifiers,
	applyNodeModifier,
	applyAttributes,
	on,
	update,
	scope,
	list,
	when,
	render,
	hydrate,
	appendChildren,
	createComment,
	createConditionalComment,
	replaceNodeSafely,
	isBoolean,
	isFunction,
	isNode,
	isObject,
	isPrimitive,
	isTagLike,
	isZeroArityFunction,
	isBrowser,
};

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
