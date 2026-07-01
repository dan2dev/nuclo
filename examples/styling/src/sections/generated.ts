// The atomic stylesheet. Every css()/variants()/keyframes()/globalStyle() call
// records rules into one shared <style id="nuclo-styles"> sheet, injected via
// CSSOM. Identical declarations dedupe to a single class shared across every
// component, so reuse grows as the app grows. On the server the same sheet is
// serialized with getCssText() (from "nuclo/ssr") and inlined into <head>.
import { css } from "../theme.ts";
import { feature } from "../ui.ts";

// In the browser, read the live injected sheet the engine writes to. Guarded so
// it stays safe under SSR (the nuclo polyfill's document has no getElementById).
function liveSheet(): CSSStyleSheet | null {
  if (typeof document === "undefined" || typeof document.getElementById !== "function") return null;
  const el = document.getElementById("nuclo-styles") as HTMLStyleElement | null;
  return el?.sheet ?? null;
}

function readSheet(): string {
  const sheet = liveSheet();
  if (!sheet) return "/* stylesheet is injected in the browser */";
  let out = "";
  for (const rule of Array.from(sheet.cssRules)) out += rule.cssText + "\n";
  return out;
}

function summary(): string {
  const count = liveSheet()?.cssRules.length ?? 0;
  return `${count} atomic rules · ${(readSheet().length / 1024).toFixed(1)} KB — one shared sheet`;
}

const label = css({ font: "mono", text: 12, color: "accent", mb: 10 });
const sheetBox = css({
  font: "mono", text: 11, color: "textDim", bg: "bg", border: "1px solid", borderColor: "border",
  rounded: "md", p: 12, m: 0, maxH: 260, overflow: "auto",
  raw: { "white-space": "pre-wrap", "word-break": "break-all" },
});

export const generatedSection = feature(
  "The atomic stylesheet",
  "Declarations dedupe to reusable atomic classes in one shared sheet (getCssText() serializes it for SSR). This is the live sheet for everything on this page:",
  div(
    div(label, () => summary()),
    pre(sheetBox, () => readSheet()),
  ),
);
