import type { RouteLoader } from "nuclo-router";

// A page: its loader for the router, and its Vite manifest key so the prod
// servers can modulepreload the chunk the matched route is about to import().
interface Page { module: string; loader: RouteLoader<any> }

const exampleDetail: Page = {
  module: "src/pages/ExampleDetail.ts",
  loader: () => import("./pages/ExampleDetail.ts"),
};

// Each site section is one route. A section with `children` is a nested table:
// the section page is the layout and each child renders inside its outlet().
export const routeDefinitions = [
  {
    path: "home",
    module: "src/pages/Home.ts",
    loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage })),
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
    loader: () => import("./pages/Docs.ts").then(m => ({ default: m.DocsPage })),
    // /docs/example-<id>: an example over the docs. Params are whole segments, so the page strips the prefix.
    children: { "./:example": exampleDetail },
  },
  {
    path: "examples",
    module: "src/pages/Examples.ts",
    loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage })),
    children: { "./:id": exampleDetail },
  },
] as const satisfies readonly (Page & { path: string; children?: Record<string, Page> })[];

export type RouteDefinition = (typeof routeDefinitions)[number];
export type RoutePath = RouteDefinition["path"];

const childrenOf = (def: RouteDefinition): Record<string, Page> => ("children" in def ? def.children : {});

/** Every page module loader, for the servers' style warm-up. */
export const pageLoaders: RouteLoader<any>[] = routeDefinitions.flatMap((def) => [
  def.loader,
  ...Object.values(childrenOf(def)).map((page) => page.loader),
]);

/** The section a matched pattern belongs to: "/examples/:id" renders inside "examples". */
export function routeName(pattern: string): RoutePath {
  const section = pattern.split("/")[1];
  return routeDefinitions.find((def) => def.path.split("/")[0] === section)?.path ?? "home";
}

/** The manifest keys of the page modules a matched pattern imports: the section and, nested, its child. */
export function pageModules(pattern: string): string[] {
  const def = routeDefinitions.find((d) => d.path === routeName(pattern))!;
  const child = childrenOf(def)[`.${pattern.slice(`/${def.path}`.length)}`];
  return child ? [def.module, child.module] : [def.module];
}
