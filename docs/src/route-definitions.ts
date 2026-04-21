/**
 * route-definitions.ts — isomorphic, no DOM, no side-effects.
 *
 * Single place to register routes. Both the server (SSR) and the client
 * derive everything from this file. To add a route: add one entry here.
 */

export type PageFunction = () => ReturnType<typeof div>;
export type PageLoader = () => Promise<{ default: PageFunction }>;

export interface RouteDefinition {
  path: string;
  loader: PageLoader;
}

export const routeDefinitions: RouteDefinition[] = [
  { path: "home",            loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage })) },
  { path: "getting-started", loader: () => import("./pages/GettingStarted.ts").then(m => ({ default: m.GettingStartedPage })) },
  { path: "core-api",        loader: () => import("./pages/CoreApi.ts").then(m => ({ default: m.CoreApiPage })) },
  { path: "tag-builders",    loader: () => import("./pages/TagBuilders.ts").then(m => ({ default: m.TagBuildersPage })) },
  { path: "styling",         loader: () => import("./pages/Styling.ts").then(m => ({ default: m.StylingPage })) },
  { path: "pitfalls",        loader: () => import("./pages/Pitfalls.ts").then(m => ({ default: m.PitfallsPage })) },
  { path: "examples",        loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage })) },

  // examples/*
  { path: "examples/counter",     loader: () => import("./pages/examples/CounterExample.ts").then(m => ({ default: m.CounterExamplePage })) },
  { path: "examples/todo",        loader: () => import("./pages/examples/TodoExample.ts").then(m => ({ default: m.TodoExamplePage })) },
  { path: "examples/subtasks",    loader: () => import("./pages/examples/SubtasksExample.ts").then(m => ({ default: m.SubtasksExamplePage })) },
  { path: "examples/search",      loader: () => import("./pages/examples/SearchExample.ts").then(m => ({ default: m.SearchExamplePage })) },
  { path: "examples/async",       loader: () => import("./pages/examples/AsyncExample.ts").then(m => ({ default: m.AsyncExamplePage })) },
  { path: "examples/forms",       loader: () => import("./pages/examples/FormsExample.ts").then(m => ({ default: m.FormsExamplePage })) },
  { path: "examples/nested",      loader: () => import("./pages/examples/NestedExample.ts").then(m => ({ default: m.NestedExamplePage })) },
  { path: "examples/animations",  loader: () => import("./pages/examples/AnimationsExample.ts").then(m => ({ default: m.AnimationsExamplePage })) },
  { path: "examples/routing",     loader: () => import("./pages/examples/RoutingExample.ts").then(m => ({ default: m.RoutingExamplePage })) },
  { path: "examples/styled-card", loader: () => import("./pages/examples/StyledCardExample.ts").then(m => ({ default: m.StyledCardExamplePage })) },
];

/** O(1) path → definition lookup. */
export const routeMap = new Map<string, RouteDefinition>(
  routeDefinitions.map(def => [def.path, def])
);

/**
 * Module-level page function cache.
 *
 * Safe to share across server requests: cached values are pure factory
 * functions (no request state, no DOM), equivalent to Node's own module cache.
 */
const pageCache = new Map<string, PageFunction>();

/** Number of dynamic imports currently in-flight. */
let pendingLoads = 0;

/**
 * Isomorphic page loader — works identically on server and client.
 * Dynamically imports only the module required for the requested path.
 * Tracks in-flight loads via pendingLoads so preloadRoutes can yield to them.
 */
export async function loadPageFunction(path: string): Promise<PageFunction> {
  const cached = pageCache.get(path);
  if (cached) return cached;

  pendingLoads++;
  try {
    const def = routeMap.get(path) ?? routeMap.get("home")!;
    const { default: fn } = await def.loader();
    pageCache.set(path, fn);
    return fn;
  } finally {
    pendingLoads--;
  }
}

/**
 * Schedules background preloading of all not-yet-cached routes using a
 * sequential idle queue.
 *
 * Why sequential: scheduling all N callbacks at once causes them to fire in
 * the same idle period — the first increments pendingLoads and the rest see
 * pendingLoads > 0, skip, and are never retried.
 *
 * Strategy: process one route per idle tick; if pendingLoads > 0 (navigation
 * in-flight), retry the same route next idle.  Falls back to setTimeout(0).
 * Client-only — do not call on the server.
 */
export function preloadRoutes(): void {
  const schedule = typeof requestIdleCallback !== "undefined"
    ? (cb: () => void) => requestIdleCallback(cb, { timeout: 5000 })
    : (cb: () => void) => setTimeout(cb, 0);

  function processAt(index: number): void {
    if (index >= routeDefinitions.length) return;

    const def = routeDefinitions[index];

    schedule(async () => {
      if (pendingLoads > 0) {
        // A navigation is in-flight — retry this same route next idle slot.
        processAt(index);
        return;
      }

      if (!pageCache.has(def.path)) {
        await loadPageFunction(def.path);
      }

      processAt(index + 1);
    });
  }

  processAt(0);
}
