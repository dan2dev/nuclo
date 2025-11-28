import "nuclo";
import { updatePageMeta } from "./seo.ts";

export type Route =
  | "home"
  | "getting-started"
  | "core-api"
  | "tag-builders"
  | "styling"
  | "pitfalls"
  | "examples"
  | "example-counter"
  | "example-todo"
  | "example-subtasks"
  | "example-search"
  | "example-async"
  | "example-forms"
  | "example-nested"
  | "example-animations"
  | "example-routing"
  | "example-styled-card"
  | string;

let currentRoute: Route = "home";

export function getCurrentRoute(): Route {
  return currentRoute;
}

export function setRoute(route: Route) {
  currentRoute = route;
  const base = import.meta.env.BASE_URL || "/";
  if (route === "home") {
    window.history.pushState({}, "", base);
  } else {
    // Use clean URLs without hash
    const url = base.endsWith("/") ? `${base}${route}` : `${base}/${route}`;
    window.history.pushState({}, "", url);
  }
  window.scrollTo(0, 0);
  updatePageMeta(route);
  update();
}

const validRoutes: Route[] = [
  "home",
  "getting-started",
  "core-api",
  "tag-builders",
  "styling",
  "pitfalls",
  "examples",
  "example-counter",
  "example-todo",
  "example-subtasks",
  "example-search",
  "example-async",
  "example-forms",
  "example-nested",
  "example-animations",
  "example-routing",
  "example-styled-card"
];

export function initRouter() {
  // Parse initial route from pathname
  const base = import.meta.env.BASE_URL || "/";
  const pathname = window.location.pathname;

  // Remove base path from pathname to get the route
  let routePath = pathname.replace(base, "");
  // Remove leading and trailing slashes
  routePath = routePath.replace(/^\/+|\/+$/g, "");

  const route = routePath || "home";
  if (validRoutes.includes(route)) {
    currentRoute = route as Route;
  }

  // Update meta tags for initial route
  updatePageMeta(currentRoute);

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    const pathname = window.location.pathname;
    let routePath = pathname.replace(base, "");
    routePath = routePath.replace(/^\/+|\/+$/g, "");

    const newRoute = routePath || "home";
    currentRoute = validRoutes.includes(newRoute) ? newRoute as Route : "home";
    updatePageMeta(currentRoute);
    update();
  });
}
