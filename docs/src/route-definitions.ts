import type { RouteLoader } from "nuclo-router";

export const routeDefinitions = [
  { path: "home",     loader: () => import("./pages/Home.ts").then(m => ({ default: m.HomePage })) },
  { path: "docs",     loader: () => import("./pages/Docs.ts").then(m => ({ default: m.DocsPage })) },
  { path: "examples", loader: () => import("./pages/Examples.ts").then(m => ({ default: m.ExamplesPage })) },
] as const satisfies readonly { path: string; loader: RouteLoader }[];

export type RouteDefinition = (typeof routeDefinitions)[number];
export type RoutePath = RouteDefinition["path"];
