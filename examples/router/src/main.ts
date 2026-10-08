/**
 * The browser entry.
 *
 * `start()` resolves the current URL's page module before returning, so the
 * first tree is complete — then render (or `hydrate`, if the HTML came from a
 * server).
 *
 * The try/catch is not boilerplate: the *initial* load is the one failure the
 * router cannot report on a Route, because there is no Route yet. Everything
 * after this point surfaces on `route.error` instead and never throws. To see
 * it, cold-load /broken (whose chunk fails on its first attempt) — without
 * this catch that would be a blank page and an unhandled rejection.
 */
import "nuclo";
import { App } from "./app.ts";
import { router } from "./routes.ts";
import { bootFailure } from "./ui.ts";

const container = document.querySelector<HTMLDivElement>("#app")!;

try {
  const route = await router.start();
  // route.app(App): the pages are mounted beside the app and land in the
  // layout's regions through their own view() — nothing of the router's is
  // in the app's tree.
  render(route.app(App), container);
  // Exposed so pages/Api.ts (and your devtools console) can drive the router.
  Object.assign(window as unknown as Record<string, unknown>, { route, router });
} catch (error) {
  // `start()` rejects when the initial route's module fails to load, or when
  // nothing matched and the table has no "*" route.
  render(bootFailure(error), container);
}
