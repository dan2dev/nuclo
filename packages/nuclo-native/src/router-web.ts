/**
 * The web router: the same API as router.ts, rendered as an app shell on the
 * real DOM. A top bar (title, back button), the screen, and a bottom tab bar.
 *
 * The browser history is the stack and the route lives in the URL hash
 * (#/gallery/dunes), so links, reloads and the back button work on any static
 * host. Screens change with a directional view transition; a browser that
 * already animated its own swipe-back (popstate.hasUAVisualTransition) skips it.
 * Tabs reset to their root screen: the history has one stack, not one per tab.
 */
import { type Entry, type Route, type RouterOptions, matcher, tabOf } from "./routes";

export type { Route, RouterOptions, Tab } from "./routes";

// Material Symbols paths (Apache-2.0), 24×24.
const ICONS: Record<string, string> = {
  back: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  chart: "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z",
  photo:
    "M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z",
  person:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.947 9.947 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20z",
};

const icon = (name = "") =>
  svgSvg({ viewBox: "0 0 24 24", "aria-hidden": "true" } as never, pathSvg({ d: ICONS[name] ?? "" } as never));

type Motion = "push" | "pop" | "tab";

export function createRouter(routes: Record<string, Route>, { initial = "/", tabs = [] }: RouterOptions = {}) {
  const resolve = matcher(routes);
  const fromUrl = (): Entry => {
    try {
      return resolve(location.hash.slice(1) || initial);
    } catch {
      return resolve(initial);
    }
  };
  const depth = (): number => history.state?.depth ?? 0;

  let current = fromUrl();
  let shown = depth();
  document.title = current.title || document.title;
  if (history.state?.depth === undefined) history.replaceState({ depth: 0 }, "");

  /** Applies a navigation, animated the way it moved. */
  function show(motion: Motion | null) {
    const run = () => {
      current = fromUrl();
      shown = depth();
      document.title = current.title || document.title;
      update();
    };
    const doc = document as Document & { startViewTransition?: (arg: unknown) => unknown };
    if (!motion || !doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return run();
    try {
      doc.startViewTransition({ update: run, types: [motion] });
    } catch {
      doc.startViewTransition(run); // Engines without transition types.
    }
  }

  addEventListener("popstate", (event) => {
    const visual = (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition;
    show(visual ? null : depth() < shown ? "pop" : "push");
  });

  const goTo = (path: string, nextDepth: number, motion: Motion) => {
    history.pushState({ depth: nextDepth }, "", `#${path}`);
    show(motion);
  };

  const activeTab = () => tabOf(tabs, current.path);

  const router = {
    get path() {
      return current.path;
    },
    get canGoBack() {
      return depth() > 0;
    },
    go(path: string) {
      goTo(path, depth() + 1, "push");
    },
    reset(path: string) {
      goTo(path, 0, tabOf(tabs, path) === activeTab() ? "pop" : "tab");
    },
    back() {
      history.back();
    },
    outlet: () =>
      div(
        { className: "nuclo-app" },
        header(
          { className: "nuclo-bar" },
          when(
            () => depth() > 0,
            button({ className: "nuclo-back", "aria-label": "Back", onClick: () => history.back() } as never, icon("back")),
          ),
          h1(() => current.title),
        ),
        main(
          { className: "nuclo-screen" },
          list(() => [current], (entry) => entry.view(entry.params) as never),
        ),
        ...(tabs.length
          ? [
              nav(
                { className: "nuclo-tabs" },
                ...tabs.map((tab, i) =>
                  button(
                    {
                      className: "nuclo-tab",
                      "aria-current": () => (activeTab() === i ? "page" : "false"),
                      onClick: () => router.reset(tab.path),
                    } as never,
                    icon(tab.icon),
                    span(tab.title),
                  ),
                ),
              ),
            ]
          : []),
      ),
  };
  return router;
}
