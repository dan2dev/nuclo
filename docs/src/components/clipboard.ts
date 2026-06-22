// ── Robust clipboard helper ────────────────────────────────────────────────
// Copies text without ever throwing or producing an unhandled promise
// rejection. The async Clipboard API can reject for many legitimate reasons
// (denied permission, insecure context, no user gesture, headless browser).
// We catch those and fall back to a hidden-textarea + execCommand copy so a
// Copy button can never crash the page. Resolves to whether the copy worked.

export async function copyText(text: string): Promise<boolean> {
  // Preferred path: async Clipboard API (secure contexts, granted permission).
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy fallback below.
    }
  }

  // Legacy fallback: works without the Clipboard API / explicit permission.
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
