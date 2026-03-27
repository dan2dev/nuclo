/**
 * routes.ts — client-only.
 * Handles dynamic page loading into the DOM container.
 */
import "nuclo";
import { loadPageFunction } from "./route-definitions.ts";

let pageContainerElement: HTMLElement | null = null;

export function setPageContainer(container: HTMLElement) {
  pageContainerElement = container;
}

export async function loadPage(path: string): Promise<void> {
  if (!pageContainerElement) {
    console.error("Page container not set");
    return;
  }

  try {
    pageContainerElement.innerHTML = "";

    const loadingContainer = document.createElement("div");
    loadingContainer.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 400px; gap: 16px;
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

    const pageFunction = await loadPageFunction(path);
    pageContainerElement.innerHTML = "";
    render(pageFunction(), pageContainerElement);
  } catch (error) {
    console.error(`Failed to load page for route: ${path}`, error);
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
