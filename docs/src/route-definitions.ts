import type { RouteLoader } from "nuclo-router";

// Each site section is one route. A section with `children` is a nested table:
// the section page is the layout and each child renders inside its outlet().
export const routeDefinitions = [
  { path: "home",     loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage })) },
  { path: "docs",     loader: () => import("./pages/Docs.ts").then(m => ({ default: m.DocsPage })) },
  {
    path: "examples",
    loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage })),
    children: { "./:id": () => import("./pages/ExampleDetail.ts") },
  },
] as const satisfies readonly { path: string; loader: RouteLoader; children?: Record<string, RouteLoader<any>> }[];

export type RouteDefinition = (typeof routeDefinitions)[number];
export type RoutePath = RouteDefinition["path"];

/** Every page module loader, for the servers' style warm-up. */
export const pageLoaders: RouteLoader<any>[] = routeDefinitions.flatMap((def) => [
  def.loader,
  ...Object.values("children" in def ? def.children : {}),
]);

/** The section a matched pattern belongs to: "/examples/:id" renders inside "examples". */
export function routeName(pattern: string): RoutePath {
  const section = pattern.split("/")[1];
  return (!section || pattern === "*" ? "home" : section) as RoutePath;
}
