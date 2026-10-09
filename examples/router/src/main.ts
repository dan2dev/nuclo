/**
 * The browser entry.
 *
 * `start()` resolves the current URL's page module before returning, so the
 * first tree is complete — then render (or `hydrate`, if the HTML came from a
 * server).
 *
 * The try/catch is not boilerplate: the *initial* load is the one failure the
 * router cannot report on a Route, because there is no Route yet. Everything
 * after this point surfaces on `router.error` instead and never throws. To see
 * it, cold-load /broken (whose chunk fails on its first attempt) — without
 * this catch that would be a blank page and an unhandled rejection.
 */
import "nuclo";
import { App } from "./app.ts";
import { router } from "./routes.ts";
import { bootFailure } from "./ui.ts";

const container = document.querySelector<HTMLDivElement>("#app")!;

try {
  await router.start();
  render(App, container);
  // Exposed so your devtools console can drive the router.
  Object.assign(window as unknown as Record<string, unknown>, { router });
} catch (error) {
  // `start()` rejects when the initial route's module fails to load, or when
  // nothing matched and the table has no "*" route.
  render(bootFailure(error), container);
}
