// sidebar.ts: an independent area with a router of its own. The second router
// is created but never started: start() is what attaches the history and click
// listeners, and one started router per document is the rule. match() attaches
// nothing, so the sidebar resolves the live URL against its own table and
// loads its own data with its own loading flag — its spinner is independent
// from the main router's pending.
import { createRouter } from "nuclo-router";
import { s } from "./styles.ts";

// The sidebar's own table, never started. The views are stand-in page
// modules: nothing ever renders them, because the router is only ever
// matched. The sidebar branches on the matched pattern and params.
const standIn = () => ({ default: () => div() });

const sidebarRouter = createRouter(
  {
    "/shop": standIn,
    "/shop/:section": standIn,
    "*": standIn,
  },
  { base: "/demos/router" }, // the same base as the main router
);

export interface SidebarInfo {
  pattern: string;
  label: string;
  items: string[];
}

export const sidebar = {
  loading: false,
  info: null as SidebarInfo | null,
};

const catalog: Record<string, string[]> = {
  toys: ["Blocks", "Train", "Kite"],
  books: ["Atlas", "Almanac", "Novel"],
  music: ["Drum", "Lyre", "Whistle"],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Like the main router's generation counter: a newer navigation overtakes an
// older fetch, so a slow reply never lands on the wrong section.
let generation = 0;

/** Reloads the sidebar for a URL, resolved by the sidebar's own router. */
export async function refreshSidebar(at: string): Promise<void> {
  const hit = sidebarRouter.match(at);
  const mine = ++generation;
  if (!hit || (hit.pattern !== "/shop" && hit.pattern !== "/shop/:section")) {
    sidebar.loading = false;
    sidebar.info = null;
    update();
    return;
  }
  sidebar.loading = true; // the main router's pending says nothing here
  sidebar.info = null;
  update();
  await wait(800); // a slow API, independent of the route's loaders
  if (generation !== mine) return;
  const section = hit.pattern === "/shop/:section" ? String(hit.params.section) : "";
  sidebar.loading = false;
  sidebar.info = section
    ? { pattern: hit.pattern, label: section, items: catalog[section] ?? [] }
    : { pattern: hit.pattern, label: "shop", items: Object.keys(catalog) };
  update();
}

export function Sidebar() {
  return div(
    s.sidebarBox,
    h2("Related"),
    p(s.muted, () => `second router: ${sidebar.info?.pattern ?? "no match"}`),
    when(() => sidebar.loading, p("Sidebar loading…")),
    when(
      () => sidebar.info !== null,
      div(
        () => `Sidebar for ${sidebar.info?.label ?? ""}`,
        ul(list(() => sidebar.info?.items ?? [], (item) => li(item))),
        button("Reload", { onClick: () => refreshSidebar(location.pathname + location.search) }),
      ),
    ),
  );
}
