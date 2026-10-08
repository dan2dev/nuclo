/**
 * The browser entry. Two lines of real work:
 *   1. resolve the current URL to its page module (await — the tree must be
 *      complete before hydrating, or the markup would not line up),
 *   2. hydrate the server's DOM in place.
 * Nothing else: links, history, hash scrolling and preloading are already wired.
 */
import "nuclo";
import { router, App } from "./routes.ts";

const container = document.getElementById("app")!;

// The server's page node, taken before hydration. Hydration that rebuilt the
// markup instead of claiming it would look identical on screen, so identity is
// the only honest check — and the page lands inside a region(), which claims
// through a cursor of its own because the page's view() runs outside the
// app's tree entirely.
const outlet = container.querySelector("main#outlet");
const serverPage = outlet?.firstElementChild ?? null;

const route = await router.start();
// route.app(App) mounts the pages on the document root before the app's tree
// hydrates, so each page's view() is waiting when the region claims its nodes.
hydrate(route.app(App), container);

const claimed = serverPage !== null && outlet?.firstElementChild === serverPage;
console.info(
  claimed
    ? "hydration: claimed the server's page node in place"
    : "hydration: the server's page node was replaced — check the region markers",
);

// Handy for poking at the router from the devtools console.
Object.assign(window as unknown as Record<string, unknown>, { route, router, claimed });
