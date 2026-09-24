// Bundle-size measurement only — not a shipped entry point. Mirrors
// src/index.ts's public exports and src/bootstrap.ts's initializeRuntime(),
// minus every style-related import and registry assignment, so
// build-and-diff.ts can measure how many bytes src/style/ actually
// contributes to dist/nuclo.mjs (nothing here imports "./style").
// Keep in sync with src/index.ts / src/bootstrap.ts if their non-style
// surface changes.
import { registerGlobalTagBuilders } from "../../src/element/tags";
import { on } from "../../src/element/events";
import { update } from "../../src/update/update";
import { scope } from "../../src/update/scope";
import { list } from "../../src/list";
import { when } from "../../src/when";
import { render, hydrate } from "../../src/render";

export { on, update, scope, list, when, render, hydrate };

registerGlobalTagBuilders();
const registry = globalThis as Record<string, unknown>;
registry.list = list;
registry.update = update;
registry.when = when;
registry.on = on;
registry.scope = scope;
registry.render = render;
registry.hydrate = hydrate;
