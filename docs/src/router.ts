/**
 * router.ts — client-only.
 * Manages browser navigation state. Never imported by server code.
 */
import { updatePageMeta } from "./seo.ts";
import { loadPage } from "./routes.ts";
import { routeMap } from "./route-definitions.ts";

export type Route = string;

let currentRoute: Route = "home";

export function getCurrentRoute(): Route {
  return currentRoute;
}

export function setCurrentRoute(route: Route) {
  currentRoute = route;
}

export function isValidRoute(path: string): boolean {
  return routeMap.has(path);
}

export function setRoute(route: Route) {
  currentRoute = route;
  const base = import.meta.env.BASE_URL || "/";
  const url = route === "home"
    ? base
    : base.endsWith("/") ? `${base}${route}` : `${base}/${route}`;
  window.history.pushState({}, "", url);
  window.scrollTo(0, 0);
  updatePageMeta(route);
  update();
  loadPage(route);
}

export function initRouter() {
  const base = import.meta.env.BASE_URL || "/";
  const routePath = window.location.pathname
    .replace(base, "")
    .replace(/^\/+|\/+$/g, "");
  const route = routePath || "home";
  currentRoute = isValidRoute(route) ? route : "home";

  updatePageMeta(currentRoute);
  update();
  loadPage(currentRoute);

  window.addEventListener("popstate", () => {
    const newPath = window.location.pathname
      .replace(base, "")
      .replace(/^\/+|\/+$/g, "");
    const newRoute = newPath || "home";
    currentRoute = isValidRoute(newRoute) ? newRoute : "home";
    updatePageMeta(currentRoute);
    loadPage(currentRoute);
  });
}
