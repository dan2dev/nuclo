/**
 * Responsive styles: every kind of style property, changed by the window's width. Each card names what changes and
 * at which width; resize the window across 480, 768 and 1024 px to see each one switch.
 *
 *   Colour      background, text and border colours per screen, theme tokens inside a screen
 *   Box         padding, radius, border width / sides, shadow, opacity, visibility
 *   Text        size, weight, style, family, spacing, line height, alignment, transform, decoration, line clamp
 *   Transform   translate / rotate / scale per screen, animated by a transition
 *   Size        width (points and percent), height, min / max, aspect ratio
 *   Classes     a css() class and a variants() recipe with screens, composed with cx()
 *   States      hover / pressed styles that differ per screen
 *   Dynamic     a style function with @media blocks: state and width together
 *   Ranges      max-width only, a closed range, and nested min + max
 */
import { button, createCss, div, h1, list, p, render, span, update } from "../../src/index.ts";

const { css, cx, variants, globalStyle } = createCss({
  colors: { ink: "#111827", soft: "#6b7280", line: "#e5e7eb", page: "#f9fafb", card: "#ffffff", a: "#7c3aed", b: "#0891b2", c: "#ea580c" },
  fonts: { mono: "ui-monospace, Menlo, monospace", serif: "Georgia, serif" },
  shadows: { sm: "0 1px 2px rgba(0, 0, 0, 0.08)", lg: "0 12px 28px rgba(0, 0, 0, 0.18)" },
  radii: { sm: 4, lg: 20, pill: 999 },
  screens: { sm: "(min-width: 480px)", md: "(min-width: 768px)", lg: "(min-width: 1024px)" },
});

globalStyle("body", { bg: "page", color: "ink" });

let on = false;
let size = 1;

const card = css({ bg: "card", rounded: 14, border: "1px solid line", p: 16, gap: 10 });
const cell = css({ width: "100%", p: 6, md: { width: "50%" }, lg: { width: "33.333%" } });
const title = css({ text: 15, weight: 700 });
const note = css({ font: "mono", text: 11, color: "soft" });
const demo = css({ p: 12, rounded: 8, bg: "#f3f4f6" });

const Head = (heading: string, rule: string) => div({ style: { gap: 2 } }, span(heading, title), span(rule, note));

const chip = variants({
  base: { px: 10, py: 6, rounded: "pill", text: 12, weight: 600, "@media (min-width: 480px)": { px: 14, text: 13 }, "@media (min-width: 1024px)": { px: 18, py: 8, text: 15 } },
  variants: {
    tone: { a: { bg: "a", color: "#ffffff" }, b: { bg: "b", color: "#ffffff" }, c: { bg: "c", color: "#ffffff", "@media (min-width: 768px)": { bg: "ink" } } },
    outline: { true: { bg: "transparent", border: "2px solid a", color: "a", "@media (min-width: 768px)": { borderWidth: 3 } } },
  },
  defaultVariants: { tone: "a" },
});

const App = () =>
  div(
    { style: { p: 12, gap: 12, maxWidth: 1100, width: "100%", alignSelf: "center", "@media (min-width: 768px)": { p: 24, gap: 16 } } },
    h1("Responsive styles", css({ text: 22, weight: 800, md: { text: 30 }, lg: { text: 38, tracking: "-1px" } })),
    p("Each card below restyles at 480 / 768 / 1024 px.", { style: { color: "soft" } }),

    // Two columns of cards from md, three from lg.
    div(
      { style: { row: true, flexWrap: "wrap", margin: -6 } },
          div(cell, div(card, Head("Colour", "bg / color / border: xs grey · sm violet · md cyan · lg orange"),
                div(css({ p: 12, rounded: 8, bg: "#e5e7eb", color: "ink", border: "2px solid #9ca3af", sm: { bg: "#ede9fe", color: "a", borderColor: "a" }, md: { bg: "#cffafe", color: "b", borderColor: "b" }, lg: { bg: "#ffedd5", color: "c", borderColor: "c" } }),
                  span("This box changes colour"),
                ))),
          div(cell, div(card, Head("Box", "padding 8→24 · radius 0→pill · border 1→4 · shadow none→lg"),
                div(css({ p: 8, rounded: 0, border: "1px solid ink", bg: "card", sm: { p: 12, rounded: "sm", borderWidth: 2 }, md: { p: 18, rounded: "lg", borderWidth: 3, shadow: "sm" }, lg: { p: 24, rounded: "pill", borderWidth: 4, shadow: "lg" } }),
                  span("Padding, corners, border and shadow"),
                ),
                div(css({ row: true, gap: 8 }),
                  div(css({ size: 32, bg: "a", opacity: 0.25, sm: { opacity: 0.5 }, md: { opacity: 0.75 }, lg: { opacity: 1 } })),
                  div(css({ size: 32, bg: "b", visibility: "hidden", md: { visibility: "visible" } })),
                  div(css({ size: 32, bg: "c", borderLeft: "6px solid ink", md: { borderLeftWidth: 0, borderTop: "6px solid ink" } })),
                ),
                span("opacity 25→100% · hidden until md · left border, top from md", note),
              )),
          div(cell, div(card, Head("Text", "size, weight, style, family, spacing, alignment"),
                span("Headline", css({ text: 16, weight: 400, sm: { text: 20, weight: 600 }, md: { text: 24, weight: 800, fontStyle: "italic" }, lg: { text: 30, font: "serif" } })),
                span("letter spacing", css({ tracking: 0, sm: { tracking: 2 }, lg: { tracking: 6 } })),
                span("uppercase from md, underlined from lg", css({ textTransform: "none", md: { textTransform: "uppercase" }, lg: { textDecoration: "underline" } })),
                span("centred from sm, right from lg", css({ textAlign: "left", sm: { textAlign: "center" }, lg: { textAlign: "right" } })),
                span("mono only on phones", css({ font: "mono", sm: { fontFamily: "sans-serif" } })),
              )),
          div(cell, div(card, Head("Line clamp and height", "2 lines on xs, 4 from sm, all from md · line height 1.2→1.8"),
                p("Text that is long enough to need several lines on a narrow screen. A phone shows two of them and an ellipsis, a tablet four, and a desktop shows everything with looser lines in between.",
                  css({ numberOfLines: 2, leading: 1.2, sm: { numberOfLines: 4 }, md: { numberOfLines: 0, leading: 1.8 } })),
              )),
          div(cell, div(card, Head("Transform", "translate · rotate · scale per screen, with a transition"),
                div(css({ h: 90, center: true, bg: "#f3f4f6", rounded: 8 }),
                  div(css({ size: 40, bg: "a", rounded: 8, transition: "transform 400ms ease-in-out", sm: { transform: "translateX(-40px)" }, md: { transform: "rotate(45deg)" }, lg: { transform: "translateX(40px) rotate(90deg) scale(1.4)" } })),
                ))),
          div(cell, div(card, Head("Size", "width 100% → 50% → 160 px · height · min / max · aspect ratio"),
                div(demo,
                  div(css({ h: 20, bg: "b", rounded: 4, width: "100%", sm: { width: "50%" }, lg: { width: 160 } })),
                ),
                div(demo,
                  div(css({ bg: "c", rounded: 4, h: 20, sm: { h: 40 }, md: { h: 60 } })),
                ),
                div(demo,
                  div(css({ bg: "a", rounded: 4, aspectRatio: 1, maxWidth: 60, md: { aspectRatio: "16 / 9", maxWidth: 200, minWidth: 120 } })),
                ))),
          div(cell, div(card, Head("Classes and variants", "variants() with screens in base and in a variant · cx()"),
                div(css({ row: true, flexWrap: "wrap", gap: 8 }),
                  span("tone a", cx(chip({ tone: "a" }))),
                  span("tone b", cx(chip({ tone: "b" }))),
                  span("c, ink from md", cx(chip({ tone: "c" }))),
                  span("outline", cx(chip({ outline: true }))),
                ))),
          div(cell, div(card, Head("States per screen", "hover / pressed differ: phone presses dark, desktop hovers lifted"),
                button("Press or hover me", css({
                  bg: "a", color: "#ffffff", rounded: 10, px: 16, py: 12, transition: "all 150ms ease-out",
                  active: { bg: "ink" },
                  md: { hover: { transform: "translateY(-2px)", shadow: "lg" }, active: { bg: "b" } },
                })),
              )),
          div(cell, div(card, Head("Dynamic + @media", "a style function: on/off decides the colour, the width decides the shape"),
                div({
                  style: () => ({
                    h: 48, center: true, rounded: 6, bg: on ? "#16a34a" : "#dc2626", transitionDuration: 250,
                    "@media (min-width: 768px)": { rounded: 24, bg: on ? "#22c55e" : "#f87171" },
                  }),
                }, span(() => (on ? "ON" : "OFF"), { style: { color: "#ffffff", weight: 700 } })),
                button("Toggle", { style: { alignSelf: "flex-start", px: 12, py: 6, rounded: 6, border: "1px solid line" }, onClick: () => { on = !on; update(); } }),
              )),
          div(cell, div(card, Head("Ranges", "max-width only · a closed range · two rules overlapping"),
                div({ style: { p: 8, rounded: 6, bg: "#f3f4f6", "@media (max-width: 767px)": { bg: "#fde68a" } } }, span("yellow below 768")),
                div({ style: { p: 8, rounded: 6, bg: "#f3f4f6", "@media (min-width: 480px) and (max-width: 1023px)": { bg: "#a7f3d0" } } }, span("green from 480 to 1023")),
                div({ style: { p: 8, rounded: 6, bg: "#f3f4f6", "@media (min-width: 480px)": { bg: "#bfdbfe" }, "@media (min-width: 1024px)": { bg: "#fbcfe8", weight: 700 } } }, span("blue from 480, pink and bold from 1024 (later wins)")),
              )),
          div(cell, div(card, Head("Scale", "a dynamic size multiplied by a per-screen factor"),
                div(css({ row: true, items: "flex-end", gap: 6, h: 90 }),
                  list(() => [1, 2, 3, 4, 5], (n) =>
                    div({ style: () => ({ w: 18, h: n * 10 * size, bg: "b", rounded: 3, transitionDuration: 200, "@media (min-width: 768px)": { w: 28 } }) }),
                  ),
                ),
                button(() => `Height × ${size}`, { style: { alignSelf: "flex-start", px: 12, py: 6, rounded: 6, border: "1px solid line" }, onClick: () => { size = size === 1 ? 1.5 : size === 1.5 ? 0.5 : 1; update(); } }),
              )),
    ),
  );

render(App);
