import "nuclo";
import { updatePageMeta } from "./seo.ts";
import { loadPage } from "./routes.ts";

const EXAMPLE_SLUGS = [
  "counter",
  "todo",
  "subtasks",
  "search",
  "async",
  "forms",
  "nested",
  "animations",
  "routing",
  "styled-card",
] as const;

export type ExampleSlug = (typeof EXAMPLE_SLUGS)[number];

/** Top-level + /examples/:slug */
export type Route =
  | "home"
  | "getting-started"
  | "core-api"
  | "tag-builders"
  | "styling"
  | "pitfalls"
  | "examples"
  | `examples/${ExampleSlug}`
  | string;

let currentRoute: Route = "home";

export function getCurrentRoute(): Route {
  return currentRoute;
}

export function setCurrentRoute(route: Route) {
  currentRoute = route;
}

export function setRoute(route: Route) {
  currentRoute = route;
  const base = import.meta.env.BASE_URL || "/";
  if (route === "home") {
    window.history.pushState({}, "", base);
  } else {
    const url = base.endsWith("/") ? `${base}${route}` : `${base}/${route}`;
    window.history.pushState({}, "", url);
  }
  window.scrollTo(0, 0);
  updatePageMeta(route);

  loadPage(route);
}

function isValidRoute(routePath: string): boolean {
  if (
    [
      "home",
      "getting-started",
      "core-api",
      "tag-builders",
      "styling",
      "pitfalls",
      "examples",
    ].includes(routePath)
  ) {
    return true;
  }
  if (routePath.startsWith("examples/")) {
    const slug = routePath.slice("examples/".length);
    return EXAMPLE_SLUGS.includes(slug as ExampleSlug);
  }
  return false;
}

export function initRouter() {
  const base = import.meta.env.BASE_URL || "/";
  const pathname = window.location.pathname;

  let routePath = pathname.replace(base, "");
  routePath = routePath.replace(/^\/+|\/+$/g, "");

  const route = routePath || "home";
  if (isValidRoute(route)) {
    currentRoute = route as Route;
  }

  updatePageMeta(currentRoute);
  loadPage(currentRoute);

  window.addEventListener("popstate", () => {
    const pathname = window.location.pathname;
    let routePath = pathname.replace(base, "");
    routePath = routePath.replace(/^\/+|\/+$/g, "");

    const newRoute = routePath || "home";
    currentRoute = isValidRoute(newRoute) ? (newRoute as Route) : "home";
    updatePageMeta(currentRoute);
    loadPage(currentRoute);
  });
}
