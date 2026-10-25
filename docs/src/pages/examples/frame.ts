/**
 * The examples modal frame: a backdrop, a panel, a bar and a body. The app
 * shell builds it once while an example route is active, and each example
 * page fills its two regions with into(). Stepping to another example pushes
 * another page, so only the regions' content changes; the frame stays.
 */
import { router } from "../../router.ts";
import { es } from "./styles.ts";
import { t } from "../../i18n/index.ts";

export const BAR_REGION = "example-bar";
export const BODY_REGION = "example-body";

/** An example route is the active one: /examples/:id, or /docs/example-:id. */
export const isExampleOpen = () => router.pattern.endsWith("/examples/:id") || router.pattern.endsWith("/docs/:example");

let hydrated = false;

/** main.ts, once hydrate() claimed the server's nodes: the page beneath a directly loaded example fills in. */
export function markHydrated() {
  hydrated = true;
  update();
}

/**
 * Whether a parent page (the grid, the docs) builds its content beneath the modal. Not on the server
 * for an example URL, nor in the client build that hydrates it: that HTML is the example alone, so
 * crawlers don't read every example as the grid or the docs with a little extra.
 */
export const showPageBeneath = () => hydrated || !isExampleOpen();

export function ExampleFrame() {
  return when(
    isExampleOpen,
    div(
      es.overlay,
      div(
        es.panel,
        { role: "dialog", "aria-modal": "true", "aria-label": t.nav.examples },
        div(es.bar, region({ id: BAR_REGION })),
        div(es.body, region({ id: BODY_REGION })),
      ),
    ),
  );
}
