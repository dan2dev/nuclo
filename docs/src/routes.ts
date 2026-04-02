/**
 * routes.ts — client-only.
 *
 * createPageArea() returns a reactive Nuclo element that manages the full
 * page lifecycle: loading → page content (via list()) → error.
 *
 * No innerHTML, no manual DOM clearing.
 * list() handles insert/remove by object identity when the slot changes.
 * when() shows/hides loading and error states.
 */
import { loadPageFunction, preloadRoutes, type PageFunction } from "./route-definitions.ts";

type PageSlot = { fn: PageFunction };

let pageSlot: PageSlot[] = [];
let isLoading = false;
let loadError: string | null = null;
let preloadScheduled = false;
// True after the first loadPage() call completes — guards the loading spinner
// so the initial SSR content stays in place (no CLS) until JS is ready.
let hasLoadedOnce = false;

/**
 * Pre-populate the page slot before hydration so the list() runtime starts
 * with the correct item, allowing hydrateListRuntime to claim existing SSR
 * DOM nodes instead of clearing them (which would cause CLS).
 * Call this synchronously before hydrate().
 */
export function setInitialPage(fn: PageFunction): void {
  pageSlot = [{ fn }];
}

function Spinner() {
  return div(
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "16px",
      },
    },
    div({
      style: {
        width: "32px",
        height: "32px",
        border: "2px solid var(--c-border)",
        borderTopColor: "var(--c-primary)",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      },
    }),
    span(
      { style: { fontSize: "13px", color: "var(--c-text-muted)" } },
      "Loading..."
    )
  );
}

function ErrorDisplay() {
  return div(
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "12px",
        padding: "48px",
      },
    },
    span({ style: { fontSize: "15px", fontWeight: "600", color: "#ef4444" } }, "Failed to load page"),
    span(
      { style: { fontSize: "13px", color: "var(--c-text-muted)", fontFamily: "monospace" } },
      () => loadError ?? ""
    )
  );
}

/**
 * Creates the reactive page area. Call once at app startup.
 * list() tracks the single page slot by object identity:
 *   - slot replaced → old element removed, new one inserted
 *   - same object → DOM reused, no re-render
 */
export function createPageArea() {
  const spinStyle = document.createElement("style");
  spinStyle.id = "nuclo-spin-keyframes";
  spinStyle.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(spinStyle);

  return main(
    {
      id: "page-container",
      style: { minHeight: "calc(100vh - 160px)", paddingTop: "64px" },
    },
    when(() => isLoading, Spinner()),
    when(() => loadError !== null, ErrorDisplay()),
    list(
      () => pageSlot,
      (slot) => slot.fn()
    )
  );
}

export async function loadPage(path: string): Promise<void> {
  // On the very first call the SSR content is already in the DOM — skip the
  // loading-spinner update so the footer never shifts during initial hydration.
  const showSpinner = hasLoadedOnce;

  if (showSpinner) {
    isLoading = true;
    loadError = null;
    pageSlot = [];
    update();
  }

  try {
    const fn = await loadPageFunction(path);
    isLoading = false;
    loadError = null;
    // Reuse the existing slot object when fn is unchanged (object-identity
    // check by list()) to prevent a needless remove+add of the page element.
    if (pageSlot.length !== 1 || pageSlot[0].fn !== fn) {
      pageSlot = [{ fn }];
    }
    hasLoadedOnce = true;
    update();

    if (!preloadScheduled) {
      preloadScheduled = true;
      preloadRoutes();
    }
  } catch (err) {
    isLoading = false;
    loadError = (err as Error).message;
    hasLoadedOnce = true;
    update();
  }
}
