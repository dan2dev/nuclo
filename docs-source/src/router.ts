import "nuclo";

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
    // Ensure we land under the base path (e.g., /nuclo/ on GitHub Pages)
    window.history.pushState({}, "", base);
  } else {
    // Keep hash routing anchored to the base path
    const url = base.endsWith("/") ? `${base}#${route}` : `${base}/#${route}`;
    window.history.pushState({}, "", url);
  }
  window.scrollTo(0, 0);
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
  // Parse initial route from hash
  const hash = window.location.hash.slice(1) as Route;
  if (validRoutes.includes(hash)) {
    currentRoute = hash;
  }

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    const newHash = window.location.hash.slice(1) as Route;
    currentRoute = validRoutes.includes(newHash) ? newHash : "home";
    update();
  });
}
