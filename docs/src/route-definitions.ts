import type { RouteLoader } from "nuclo-router";

// A page: its loader for the router, and its Vite manifest key so the prod
// servers can modulepreload the chunk the matched route is about to import().
interface Page { module: string; loader: RouteLoader<any> }

const exampleDetail: Page = {
  module: "src/pages/ExampleDetail.ts",
  loader: () => import("./pages/ExampleDetail.ts"),
};

// Each site section is one route under the locale prefix (/en, /pt-br/docs, …);
// the standalone apps sit at the root. A section with `children` is a nested
// table: the section page is the layout and each child renders inside its outlet().
export const LOCALE_PREFIX = "/:locale";

export const routeDefinitions = [
  {
    path: "home",
    module: "src/pages/Home.ts",
    loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage, load: m.load })),
  },
  {
    path: "apps/:id",
    module: "src/pages/StandaloneExample.ts",
    loader: () => import("./pages/StandaloneExample.ts"),
  },
  {
    path: "desktop",
    module: "src/pages/StandaloneExample.ts",
    loader: () => import("./pages/StandaloneExample.ts"),
  },
  {
    path: "docs",
    module: "src/pages/Docs.ts",
    loader: () => import("./pages/Docs.ts").then(m => ({ default: m.DocsPage, load: m.load })),
    // /docs/example-<id>: an example over the docs. Params are whole segments, so the page strips the prefix.
    children: { "./:example": exampleDetail },
  },
  {
    path: "examples",
    module: "src/pages/Examples.ts",
    loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage, load: m.load })),
    children: { "./:id": exampleDetail },
  },
] as const satisfies readonly (Page & { path: string; children?: Record<string, Page> })[];

export type RouteDefinition = (typeof routeDefinitions)[number];
export type RoutePath = RouteDefinition["path"];

const childrenOf = (def: RouteDefinition): Record<string, Page> => ("children" in def ? def.children : {});

/** The standalone apps are not localized; everything else is. */
const STANDALONE: ReadonlySet<string> = new Set(["apps/:id", "desktop"]);
export const isLocalized = (def: RouteDefinition): boolean => !STANDALONE.has(def.path);

/** A section's route pattern: "/:locale", "/:locale/docs", "/apps/:id". */
export const routePattern = (def: RouteDefinition): string =>
  isLocalized(def) ? (def.path === "home" ? LOCALE_PREFIX : `${LOCALE_PREFIX}/${def.path}`) : `/${def.path}`;

/** A matched pattern without the locale prefix: "/:locale/examples/:id" is "/examples/:id". */
export const unprefixed = (pattern: string): string =>
  pattern.startsWith(LOCALE_PREFIX) ? pattern.slice(LOCALE_PREFIX.length) || "/" : pattern;

/** Every page module loader, for the servers' style warm-up. */
export const pageLoaders: RouteLoader<any>[] = routeDefinitions.flatMap((def) => [
  def.loader,
  ...Object.values(childrenOf(def)).map((page) => page.loader),
]);

/** The section a matched pattern belongs to: "/examples/:id" renders inside "examples". */
export function routeName(pattern: string): RoutePath {
  const section = unprefixed(pattern).split("/")[1];
  return routeDefinitions.find((def) => def.path.split("/")[0] === section)?.path ?? "home";
}

/** The manifest keys of the page modules a matched pattern imports: the section and, nested, its child. */
export function pageModules(pattern: string): string[] {
  const def = routeDefinitions.find((d) => d.path === routeName(pattern))!;
  const child = childrenOf(def)[`.${unprefixed(pattern).slice(`/${def.path}`.length)}`];
  return child ? [def.module, child.module] : [def.module];
}
