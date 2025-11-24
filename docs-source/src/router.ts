import "nuclo";

export type Route =
  | "home"
  | "getting-started"
  | "core-api"
  | "tag-builders"
  | "styling"
  | "pitfalls"
  | "examples"
  | string;

let currentRoute: Route = "home";

export function getCurrentRoute(): Route {
  return currentRoute;
}

export function setRoute(route: Route) {
  currentRoute = route;
  window.history.pushState({}, "", route === "home" ? "/" : `#${route}`);
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
  "examples"
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
