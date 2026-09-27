import { list } from "nuclo";
import { isRedirect } from "./errors";
import type { RouteModule, View } from "./types";

/** One rendered level: a layout, the page, or an error view. */
export interface Level {
  /** Levels with equal keys are kept across navigations. */
  key: string;
  view: View;
  props: Record<string, unknown>;
  head?: RouteModule["head"];
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

export function layoutLevel(module: number, mod: RouteModule, names: readonly string[], params: Record<string, string>, data: unknown): Level {
  const own = pick(params, names);
  return {
    key: `${module}:${names.map((name) => own[name]).join("/")}`,
    view: mod.default ?? defaultLayout,
    props: { data, params: own },
    head: mod.head,
  };
}

export function pageLevel(module: number, mod: RouteModule, params: Record<string, string>, url: URL, data: unknown): Level {
  if (!mod.default) throw new TypeError(`Route module ${module} has no default export`);
  return {
    // The search string only matters to pages that load data from it.
    key: `${module}:${JSON.stringify(params)}${mod.load ? url.search : ""}`,
    view: mod.default,
    props: { data, params, url },
    head: mod.head,
  };
}

export function errorLevel(mod: RouteModule, status: number, message: string): Level {
  return { key: `!${++errorSeq}`, view: mod.default ?? defaultError, props: { status, message }, head: mod.head };
}

export function pick(params: Record<string, string>, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) out[name] = params[name];
  return out;
}

/** Runs a module's load(); synchronous throws become rejections. */
export async function runLoad(mod: RouteModule, event: object): Promise<unknown> {
  return mod.load?.(event as never);
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
