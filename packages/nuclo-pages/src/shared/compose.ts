import { list } from "nuclo";
import { isRedirect } from "./errors";
import type { Action, Definition, RouteModule, View } from "./types";

/** One rendered level: a layout, the page, or an error view. */
export interface Level {
  /** Levels with equal keys are kept across navigations. */
  key: string;
  view: View;
  props: Record<string, unknown>;
  head?: Definition["head"];
}

/** A layout's `children`: a single-item list whose item is swapped on navigation. */
export interface Outlet {
  items: Slot[];
}

interface Slot {
  create: () => NodeModFn;
}

export const defaultLayout: View = ({ children }) => div(children);
export const defaultError: View = ({ status, message }) => div(h1(String(status)), p(message));

/**
 * Builds levels[from] and, below it, one outlet per layout (written to
 * `outlets[from…]`). Server and client call it with the same levels and data,
 * so the SSR markup and the hydrated tree match.
 */
export function compose(levels: readonly Level[], outlets: Outlet[], from = 0): Slot {
  const level = levels[from];
  const props = { ...level.props };
  if (from < levels.length - 1) {
    const outlet: Outlet = { items: [compose(levels, outlets, from + 1)] };
    outlets[from] = outlet;
    props.children = list(() => outlet.items, (slot) => slot.create());
  }
  return {
    create: () => {
      const factory = level.view(props);
      if (typeof factory !== "function") {
        throw new TypeError(`${level.key}: a page or layout view must return an element, e.g. div(...)`);
      }
      return factory;
    },
  };
}

let errorSeq = 0;

/** A route module's Page/Layout/ErrorPage definition; the built-in layout and error view (-1) have none. */
function definitionOf(mod: RouteModule, module: number): Definition | undefined {
  const definition = mod.default;
  if (definition !== undefined && typeof definition?.render !== "function") {
    throw new TypeError(`Route module ${module}: the default export must come from Page(), Layout() or ErrorPage()`);
  }
  return definition;
}

export function layoutLevel(module: number, mod: RouteModule, names: readonly string[], params: Record<string, string>, data: unknown): Level {
  const definition = definitionOf(mod, module);
  const own = pick(params, names);
  return {
    key: `${module}:${names.map((name) => own[name]).join("/")}`,
    view: definition?.render ?? defaultLayout,
    props: { data, params: own },
    head: definition?.head,
  };
}

export function pageLevel(
  module: number,
  mod: RouteModule,
  params: Record<string, string>,
  url: URL,
  data: unknown,
  actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {},
): Level {
  const definition = definitionOf(mod, module);
  if (!definition) throw new TypeError(`Route module ${module} has no default export`);
  return {
    // The search string only matters to pages that load data from it.
    key: `${module}:${JSON.stringify(params)}${definition.load ? url.search : ""}`,
    view: definition.render,
    props: { data, params, url, actions },
    head: definition.head,
  };
}

export function errorLevel(mod: RouteModule, status: number, message: string): Level {
  const definition = definitionOf(mod, -1);
  return { key: `!${++errorSeq}`, view: definition?.render ?? defaultError, props: { status, message }, head: definition?.head };
}

/** A page's actions as its view calls them: `run` decides what happens around each call. */
export function bindActions(
  mod: RouteModule,
  run: (action: Action, args: unknown[]) => Promise<unknown>,
): Record<string, (...args: unknown[]) => Promise<unknown>> {
  const bound: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  for (const [name, action] of Object.entries(mod.default?.actions ?? {})) bound[name] = (...args) => run(action, args);
  return bound;
}

export function pick(params: Record<string, string>, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) out[name] = params[name];
  return out;
}

/** Runs a definition's load(); synchronous throws become rejections. */
export async function runLoad(mod: RouteModule, event: object): Promise<unknown> {
  return mod.default?.load?.(event as never);
}

/** The shallowest redirect, else the shallowest error. */
export function firstFailure(results: readonly PromiseSettledResult<unknown>[]): { index: number; reason: unknown } | undefined {
  let failure: { index: number; reason: unknown } | undefined;
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    if (result.status === "fulfilled") continue;
    if (isRedirect(result.reason)) return { index, reason: result.reason };
    failure ??= { index, reason: result.reason };
  }
  return failure;
}
