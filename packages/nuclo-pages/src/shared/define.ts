import type { ErrorDefinition, LayoutDefinition, PageDefinition } from "../../types/index";

// The definitions are plain objects: the helpers exist for their types, and to
// mark what the build compiles (a page's load and actions only run on the server).

function define<T extends { render: unknown }>(helper: string, definition: T): T {
  if (typeof definition?.render !== "function") {
    throw new TypeError(`${helper}() needs a render function: export default ${helper}({ render: … })`);
  }
  return definition;
}

export function Page<D, E, A>(definition: PageDefinition<D, E, A>): PageDefinition<D, E, A> {
  return define("Page", definition);
}

export function Layout<D>(definition: LayoutDefinition<D>): LayoutDefinition<D> {
  return define("Layout", definition);
}

export function ErrorPage(definition: ErrorDefinition): ErrorDefinition {
  return define("ErrorPage", definition);
}
