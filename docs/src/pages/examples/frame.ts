/**
 * The examples modal frame: a backdrop, a panel, a bar and a body. The app
 * shell builds it once while an example route is active, and each example
 * page fills its two regions with into(). Stepping to another example pushes
 * another page, so only the regions' content changes; the frame stays.
 */
import { router } from "../../router.ts";
import { es } from "./styles.ts";

export const BAR_REGION = "example-bar";
export const BODY_REGION = "example-body";

/** An example route is the active one: /examples/:id, or /docs/example-:id. */
export const isExampleOpen = () => router.pattern === "/examples/:id" || router.pattern === "/docs/:example";

export function ExampleFrame() {
  return when(
    isExampleOpen,
    div(
      es.overlay,
      div(
        es.panel,
        { role: "dialog", "aria-modal": "true", "aria-label": "Example" },
        div(es.bar, region({ id: BAR_REGION })),
        div(es.body, region({ id: BODY_REGION })),
      ),
    ),
  );
}
