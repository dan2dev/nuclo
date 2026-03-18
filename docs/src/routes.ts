import "nuclo";
import type { Route } from "./router.ts";

export type PageFunction = () => ReturnType<typeof div>;
export type PageLoader = () => Promise<{ default: PageFunction }>;

const exampleLoaders: Record<string, PageLoader> = {
  counter: () => import("./pages/examples/CounterExample.ts").then((m) => ({ default: m.CounterExamplePage })),
  todo: () => import("./pages/examples/TodoExample.ts").then((m) => ({ default: m.TodoExamplePage })),
  subtasks: () => import("./pages/examples/SubtasksExample.ts").then((m) => ({ default: m.SubtasksExamplePage })),
  search: () => import("./pages/examples/SearchExample.ts").then((m) => ({ default: m.SearchExamplePage })),
  async: () => import("./pages/examples/AsyncExample.ts").then((m) => ({ default: m.AsyncExamplePage })),
  forms: () => import("./pages/examples/FormsExample.ts").then((m) => ({ default: m.FormsExamplePage })),
  nested: () => import("./pages/examples/NestedExample.ts").then((m) => ({ default: m.NestedExamplePage })),
  animations: () => import("./pages/examples/AnimationsExample.ts").then((m) => ({ default: m.AnimationsExamplePage })),
  routing: () => import("./pages/examples/RoutingExample.ts").then((m) => ({ default: m.RoutingExamplePage })),
  "styled-card": () =>
    import("./pages/examples/StyledCardExample.ts").then((m) => ({ default: m.StyledCardExamplePage })),
};

export const routes: Record<string, PageLoader> = {
  home: () => import("./pages/Home.ts").then((m) => ({ default: m.HomePage })),
  "getting-started": () => import("./pages/GettingStarted.ts").then((m) => ({ default: m.GettingStartedPage })),
  "core-api": () => import("./pages/CoreApi.ts").then((m) => ({ default: m.CoreApiPage })),
  "tag-builders": () => import("./pages/TagBuilders.ts").then((m) => ({ default: m.TagBuildersPage })),
  styling: () => import("./pages/Styling.ts").then((m) => ({ default: m.StylingPage })),
  pitfalls: () => import("./pages/Pitfalls.ts").then((m) => ({ default: m.PitfallsPage })),
  examples: () => import("./pages/Examples.ts").then((m) => ({ default: m.ExamplesPage })),
  ...Object.fromEntries(
    Object.entries(exampleLoaders).map(([slug, loader]) => [`examples/${slug}`, loader])
  ),
};

const pageCache = new Map<string, PageFunction>();

let pageContainerElement: HTMLElement | null = null;

export function setPageContainer(container: HTMLElement) {
  pageContainerElement = container;
}

function resolveLoader(route: Route): PageLoader | undefined {
  if (route === "home") return routes.home;
  if (route.startsWith("examples/")) {
    return routes[route];
  }
  return routes[route];
}

export async function loadPage(route: Route): Promise<void> {
  if (!pageContainerElement) {
    console.error("Page container not set");
    return;
  }

  try {
    pageContainerElement.innerHTML = "";
    const loadingContainer = document.createElement("div");
    loadingContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
    `;
    const spinner = document.createElement("div");
    spinner.style.cssText = `
      width: 32px; height: 32px;
      border: 2px solid var(--c-border);
      border-top-color: var(--c-primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    `;
    if (!document.getElementById("nuclo-spin-keyframes")) {
      const spinStyle = document.createElement("style");
      spinStyle.id = "nuclo-spin-keyframes";
      spinStyle.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(spinStyle);
    }
    const label = document.createElement("span");
    label.style.cssText = "font-size: 13px; color: var(--c-text-muted); font-family: inherit;";
    label.textContent = "Loading...";
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(label);
    pageContainerElement.appendChild(loadingContainer);

    let pageFunction: PageFunction;
    if (pageCache.has(route)) {
      pageFunction = pageCache.get(route)!;
    } else {
      const loader = resolveLoader(route);
      if (!loader) {
        throw new Error(`No loader found for route: ${route}`);
      }
      const module = await loader();
      pageFunction = module.default;
      pageCache.set(route, pageFunction);
    }

    pageContainerElement.innerHTML = "";
    const pageElement = pageFunction();
    render(pageElement, pageContainerElement);
  } catch (error) {
    console.error(`Failed to load page for route: ${route}`, error);
    pageContainerElement.innerHTML = "";
    const errorContainer = document.createElement("div");
    errorContainer.style.cssText = `
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 400px; gap: 12px; padding: 48px;
    `;
    const errorTitle = document.createElement("span");
    errorTitle.style.cssText = "font-size: 15px; font-weight: 600; color: #ef4444;";
    errorTitle.textContent = "Failed to load page";
    const errorMsg = document.createElement("span");
    errorMsg.style.cssText = "font-size: 13px; color: var(--c-text-muted); font-family: monospace;";
    errorMsg.textContent = (error as Error).message;
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMsg);
    pageContainerElement.appendChild(errorContainer);
  }
}
