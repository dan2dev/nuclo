/**
 * nuclo-core's styling system, natively: one screen that uses each part of it.
 *
 *   createCss   theme tokens (colors, fonts, shadows, radii) and screens (responsive keys)
 *   css / cx    short keys, CSS strings ("12px", "1px solid …", "0 4px 12px rgba(…)", "translateY(-2px)"), raw
 *   states      hover / active / focus / disabled / checked / placeholder, first / last / odd / even / empty, "&:…"
 *   @media      by the window's width; the theme's `md` screen
 *   keyframes   an animation named in a style
 *   variants    a recipe on the theme
 *   globalStyle the page and the h2 tag
 */
import { button, createCss, div, h2, input, list, p, render, span, update } from "../../src/index.ts";

const { css, cx, variants, keyframes, globalStyle, theme } = createCss({
  colors: { ink: "#0f172a", soft: "#64748b", brand: "#7c3aed", brandSoft: "#ede9fe", line: "#e2e8f0", card: "#ffffff", page: "#f8fafc", ok: "#16a34a" },
  fonts: { mono: "ui-monospace, Menlo, monospace" },
  shadows: { card: "0 4px 12px rgba(15, 23, 42, 0.12)" },
  radii: { card: "16px", pill: 999 },
  screens: { md: "(min-width: 600px)" },
});

globalStyle("body", { bg: "page", color: "ink" });
globalStyle("h2", { text: 13, weight: 600, color: "soft", textTransform: "uppercase", tracking: "0.5px" });

const pulse = keyframes({ from: { opacity: 0.35, scale: 0.9 }, "50%": { opacity: 1, scale: 1 }, to: { opacity: 0.35, scale: 0.9 } });

const card = css({ bg: "card", rounded: "card", shadow: "card", p: "16px", gap: "0.75rem", md: { p: 24 } });
const label = css({ font: "mono", text: 12, color: "soft" });

const swatch = variants({
  base: { size: 40, rounded: 12, center: true, border: "2px solid transparent" },
  variants: {
    tone: { brand: { bg: "brand" }, soft: { bg: "brandSoft" }, ok: { bg: "ok" } },
    picked: { true: { border: "2px solid ink" } },
  },
  defaultVariants: { tone: "brand" },
  compoundVariants: [{ tone: "soft", picked: true, css: { borderColor: "brand" } }],
});

let picked = "brand";
let typed = "";
let agree = false;
let rows = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];

const App = () =>
  div(
    { style: { p: 16, gap: 16, maxWidth: 720, alignSelf: "center", width: "100%", "@media (min-width: 900px)": { p: 32 } } },
    div(
      card,
      h2("Tokens and shorthands"),
      p("Theme colour, font, shadow and radius tokens; CSS strings for lengths, borders and transforms.", { style: { leading: 1.4, color: "ink" } }),
      div(
        { style: { row: true, gap: 12, items: "center", flexWrap: "wrap" } },
        span("brand", label, { style: { color: "brand", borderBottom: "2px solid brand", pb: "2px" } }),
        span(theme.colors.ok, label),
        div({ style: { size: 28, rounded: "50%", bg: "hsl(262, 83%, 58%)" } }),
        div({ style: { w: 28, h: 28, bg: "rgba(124, 58, 237, 0.35)", transform: "rotate(45deg) scale(0.8)" } }),
        div({ style: { w: 56, aspectRatio: "16 / 9", bg: "#0ea5e9", rounded: 6, opacity: "70%" } }),
      ),
      span("Semibold 600 · medium 500 · light 300", { style: { weight: 600 } }),
      span("medium", { style: { weight: "500" } }),
      span("light", { style: { fontWeight: 300 } }),
      span("capitalize every word", { style: { textTransform: "capitalize" } }),
      span("raw declarations", { style: { raw: { "letter-spacing": "2px", "border-left": "3px solid #f59e0b", "padding-left": 8 } } }),
    ),
    div(
      card,
      h2("States"),
      button("Hover, press me", {
        style: {
          bg: "brand", color: "#ffffff", rounded: "pill", px: 18, py: 10, transition: "all 150ms ease-out",
          hover: { bg: "#6d28d9" }, active: { transform: "translateY(1px) scale(0.98)" }, "&:disabled": { opacity: 0.5 },
        },
      }),
      button("Disabled", { disabled: true, style: { bg: "line", color: "soft", rounded: "pill", px: 18, py: 10, disabled: { bg: "#f1f5f9" } } }),
      input({
        placeholder: "Focus me",
        value: () => typed,
        style: { border: "1px solid line", rounded: 10, p: 10, focus: { borderColor: "brand" }, placeholder: { color: "#a78bfa" }, placeholderShown: { bg: "#faf5ff" } },
        onInput: (e) => {
          typed = e.target.value;
          update();
        },
      }),
      div(
        { style: { row: true, gap: 10, items: "center" } },
        input({
          type: "checkbox",
          checked: () => agree,
          onChange: (e) => {
            agree = e.target.checked;
            update();
          },
        }),
        span(() => (agree ? "Checked" : "Not checked"), { style: () => ({ color: agree ? "ok" : "soft" }) }),
      ),
    ),
    div(
      card,
      h2("Lists: first, last, odd, even, empty"),
      div(
        { style: { rounded: 12, overflow: "hidden", border: "1px solid line" } },
        list(
          () => rows,
          (row) =>
            div(
              { style: { p: 10, borderTop: "1px solid line", first: { borderTopWidth: 0, bg: "brandSoft" }, odd: { bg: "#fafafa" }, last: { weight: "bold" } } },
              row,
            ),
        ),
      ),
      div(
        { style: { row: true, gap: 8 } },
        button("Rotate", {
          onClick: () => {
            const next = rows.slice(1);
            next.push(rows[0]!);
            rows = next.slice();
            update();
          },
        }),
        button("Drop first", {
          onClick: () => {
            rows = rows.slice(1);
            update();
          },
        }),
      ),
      div({ style: { h: 24, bg: "#fee2e2", rounded: 6, empty: { bg: "#dcfce7" } } }),
    ),
    div(
      card,
      h2("Responsive and animated"),
      div(
        { style: { row: true, gap: 12, items: "center" } },
        div({ style: { size: 18, rounded: "pill", bg: "ok", animation: `${pulse} 1.2s ease-in-out infinite` } }),
        span("Pulsing with keyframes()"),
      ),
      div(
        { style: { p: 12, rounded: 10, bg: "#e0f2fe", "@media (max-width: 599px)": { bg: "#fef3c7" } } },
        span("Blue at 600 px and wider, amber when narrower", css({ md: { weight: "bold" } })),
      ),
      div(
        { style: { row: true, gap: 8 } },
        list(() => ["brand", "soft", "ok"], (tone) =>
          div(cx(swatch({ tone: tone === "ok" ? "ok" : tone === "soft" ? "soft" : "brand", picked: picked === tone })), {
            onClick: () => {
              picked = tone;
              update();
            },
          }),
        ),
      ),
    ),
  );

render(App);
