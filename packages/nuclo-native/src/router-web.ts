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
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  search:
    "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  bell: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
};

const icon = (name = "") =>
  svgSvg({ viewBox: "0 0 24 24", "aria-hidden": "true" }, pathSvg({ d: ICONS[name] ?? "" }));

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

  // The page scrolls: a route's onEndReached runs when its end is within half a window, once per page height.
  let endedAt = 0;
  const reachEnd = () => {
    const height = document.documentElement.scrollHeight;
    if (!current.onEndReached || height === endedAt || scrollY + innerHeight * 1.5 < height) return;
    endedAt = height;
    current.onEndReached();
    reachEnd(); // Still short of filling the window: load again.
  };
  addEventListener("scroll", reachEnd, { passive: true });
  addEventListener("resize", reachEnd);
  queueMicrotask(reachEnd); // After the app's first render.

  /** Applies a navigation, animated the way it moved. */
  function show(motion: Motion | null) {
    const run = () => {
      current = fromUrl();
      shown = depth();
      document.title = current.title || document.title;
      update();
      endedAt = 0;
      reachEnd();
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

  // The tab a screen was pushed from: a path any tab can push (a profile) does not say which.
  const activeTab = (): number => history.state?.tab ?? tabOf(tabs, current.path);

  const goTo = (path: string, nextDepth: number, motion: Motion, tab = activeTab()) => {
    history.pushState({ depth: nextDepth, tab }, "", `#${path}`);
    show(motion);
  };

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
      const tab = tabOf(tabs, path);
      goTo(path, 0, tab === activeTab() ? "pop" : "tab", tab);
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
            button({ className: "nuclo-back", "aria-label": "Back", onClick: () => history.back() }, icon("back")),
          ),
          h1(() => current.title),
        ),
        main(
          { className: "nuclo-screen" },
          list(() => [current], (entry) => entry.view(entry.params)),
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
                    },
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
