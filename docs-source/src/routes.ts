import "nuclo";
import type { Route } from "./router.ts";

export type PageFunction = () => ReturnType<typeof div>;
export type PageLoader = () => Promise<{ default: PageFunction }>;

// Route configuration with lazy loading
export const routes: Record<Route, PageLoader> = {
  "home": () => import("./pages/Home.ts").then((m) => ({ default: m.HomePage })),
  "getting-started": () => import("./pages/GettingStarted.ts").then((m) => ({ default: m.GettingStartedPage })),
  "core-api": () => import("./pages/CoreApi.ts").then((m) => ({ default: m.CoreApiPage })),
  "tag-builders": () => import("./pages/TagBuilders.ts").then((m) => ({ default: m.TagBuildersPage })),
  "styling": () => import("./pages/Styling.ts").then((m) => ({ default: m.StylingPage })),
  "pitfalls": () => import("./pages/Pitfalls.ts").then((m) => ({ default: m.PitfallsPage })),
  "examples": () => import("./pages/Examples.ts").then((m) => ({ default: m.ExamplesPage })),
  "example-counter": () => import("./pages/examples/CounterExample.ts").then((m) => ({ default: m.CounterExamplePage })),
  "example-todo": () => import("./pages/examples/TodoExample.ts").then((m) => ({ default: m.TodoExamplePage })),
  "example-subtasks": () => import("./pages/examples/SubtasksExample.ts").then((m) => ({ default: m.SubtasksExamplePage })),
  "example-search": () => import("./pages/examples/SearchExample.ts").then((m) => ({ default: m.SearchExamplePage })),
  "example-async": () => import("./pages/examples/AsyncExample.ts").then((m) => ({ default: m.AsyncExamplePage })),
  "example-forms": () => import("./pages/examples/FormsExample.ts").then((m) => ({ default: m.FormsExamplePage })),
  "example-nested": () => import("./pages/examples/NestedExample.ts").then((m) => ({ default: m.NestedExamplePage })),
  "example-animations": () => import("./pages/examples/AnimationsExample.ts").then((m) => ({ default: m.AnimationsExamplePage })),
  "example-routing": () => import("./pages/examples/RoutingExample.ts").then((m) => ({ default: m.RoutingExamplePage })),
  "example-styled-card": () => import("./pages/examples/StyledCardExample.ts").then((m) => ({ default: m.StyledCardExamplePage })),
};

// Cache for loaded page functions
const pageCache = new Map<Route, PageFunction>();

// Container element reference
let pageContainerElement: HTMLElement | null = null;

export function setPageContainer(container: HTMLElement) {
  pageContainerElement = container;
}

export async function loadPage(route: Route): Promise<void> {
  if (!pageContainerElement) {
    console.error("Page container not set");
    return;
  }

  try {
    // Show loading state
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
    const spinStyle = document.createElement("style");
    spinStyle.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(spinStyle);
    const label = document.createElement("span");
    label.style.cssText = "font-size: 13px; color: var(--c-text-muted); font-family: inherit;";
    label.textContent = "Loading...";
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(label);
    pageContainerElement.appendChild(loadingContainer);

    // Check cache first
    let pageFunction: PageFunction;
    if (pageCache.has(route)) {
      pageFunction = pageCache.get(route)!;
    } else {
      // Load the page
      const loader = routes[route];
      if (!loader) {
        throw new Error(`No loader found for route: ${route}`);
      }

      const module = await loader();
      pageFunction = module.default;

      // Cache the loaded page function
      pageCache.set(route, pageFunction);
    }

    // Render the page
    pageContainerElement.innerHTML = "";
    const pageElement = pageFunction();
    render(pageElement, pageContainerElement);
  } catch (error) {
    console.error(`Failed to load page for route: ${route}`, error);
    // Show error state
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
