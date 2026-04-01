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
  isLoading = true;
  loadError = null;
  pageSlot = [];
  update();

  try {
    const fn = await loadPageFunction(path);
    isLoading = false;
    pageSlot = [{ fn }];
    update();

    if (!preloadScheduled) {
      preloadScheduled = true;
      preloadRoutes();
    }
  } catch (err) {
    isLoading = false;
    loadError = (err as Error).message;
    update();
  }
}
