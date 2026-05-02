export type PageFunction = () => ReturnType<typeof div>;
export type PageLoader = () => Promise<{ default: PageFunction }>;

export const routeDefinitions = [
  { path: "home",     loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage })) },
  { path: "docs",     loader: () => import("./pages/Docs.ts").then(m => ({ default: m.DocsPage })) },
  { path: "examples", loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage })) },
] as const satisfies readonly { path: string; loader: PageLoader }[];

export type RouteDefinition = (typeof routeDefinitions)[number];
export type RoutePath = RouteDefinition["path"];

export const routeMap = new Map<string, RouteDefinition>(
  routeDefinitions.map(def => [def.path, def])
);

const pageCache = new Map<string, PageFunction>();
let pendingLoads = 0;

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

export function preloadRoutes(): void {
  let i = 0;
  function next() {
    if (pendingLoads > 0) { setTimeout(next, 50); return; }
    if (i >= routeDefinitions.length) return;
    const def = routeDefinitions[i++];
    if (pageCache.has(def.path)) { next(); return; }
    const cb = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;
    (cb as (fn: () => void) => void)(() => {
      def.loader().then(({ default: fn }) => {
        pageCache.set(def.path, fn);
        next();
      }).catch(next);
    });
  }
  next();
}
