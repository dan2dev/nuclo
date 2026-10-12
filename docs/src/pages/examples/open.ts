import { router } from "../../router.ts";

/** Where an example is opened from. It decides the URL, so the page beneath stays in the address bar's section. */
export type ExampleSource = "examples" | "docs";

export const EXAMPLE_PREFIX = "example-";

/** /examples/<id> from the grid, /docs/example-<id> from the docs. */
export const exampleHref = (id: string, from: ExampleSource = "examples") =>
  router.href(from === "docs" ? `/docs/${EXAMPLE_PREFIX}${id}` : `/examples/${id}`);

/**
 * Click handler for a link to an example. A plain left click opens it as a layer
 * over the current page (docs, the grid, …), so that page stays mounted beneath
 * the modal and closing returns to it. Modified clicks keep the plain link.
 */
export function onOpenExample(id: string, from: ExampleSource = "examples") {
  return (e: MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void router.push(exampleHref(id, from));
  };
}
