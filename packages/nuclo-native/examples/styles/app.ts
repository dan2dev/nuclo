// Style conformance: one labelled case per rule of the style contract (src/layout.ts).
// "Run check" compares every box: on the web, the layout engine against the browser's
// CSS; on a native host, the frames JS sent against the views' real frames.
import "nuclo-native";
import { check } from "nuclo-native/check";
import { createRouter } from "nuclo-native/router";

const tint = ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1"];
const swatch = (style: Record<string, unknown> = {}, i = 0) =>
  div({ style: { backgroundColor: tint[i % 4], height: 24, ...style } });

const label = (text: string) => span(text, { style: { fontSize: 12, color: "#6b7280" } });

const example = (title: string, ...content: NodeModLike<"div">[]) =>
  div({ style: { gap: 6 } }, label(title), div({ style: { backgroundColor: "#f3f4f6" } }, ...content));

let result = "Not checked yet.";
let details: string[] = [];
const run = () => {
  const r = check();
  result = `${r.matched}/${r.total} boxes match ${r.against} (±${r.tolerance})`;
  // Native hosts have no console: the first mismatches go on screen.
  details = r.mismatches
    .slice(0, 5)
    .map((m) => `#${m.id}: expected ${m.expected.join(" ")}, got ${m.actual?.join(" ") ?? "nothing"}`);
  update();
};

const lorem = "The quick brown fox jumps over the lazy dog, then naps in the warm afternoon sun.";

// css(): classes, a theme, responsive screens, cx() and variants(); the native hosts resolve them as the browser does.
const { css: themed, variants: themedVariants } = createCss({
  colors: { soft: tint[0]!, mid: tint[1]!, strong: tint[3]! },
  screens: { md: "(min-width: 600px)", lg: "(min-width: 900px)" },
});
const card = themed({ p: 12, bg: "soft", rounded: 8, gap: 6, color: "#1f2937", text: 15 });
const responsive = themed({ flexDirection: "column", gap: 8, md: { flexDirection: "row" } });
const roomy = themed({ p: 4, bg: "mid", md: { p: 16 }, lg: { p: 28 } });
const chip = themedVariants({
  base: { rounded: 6, color: "#fff" },
  variants: {
    tone: { quiet: { bg: "mid" }, loud: { bg: "strong" } },
    size: { sm: { px: 6, py: 2 }, lg: { px: 14, py: 8 } },
  },
  defaultVariants: { tone: "quiet", size: "sm" },
});
const outlined = css({ border: "2px solid #6366f1", p: 8, rounded: 10 });
const clipped = css({ overflow: "hidden", rounded: 16, w: 120, h: 60, bg: "#c7d2fe" });
globalStyle("article", { padding: "6px 10px", backgroundColor: "#e0e7ff" });
const row = (style: Record<string, unknown>, ...children: NodeModLike<"div">[]) => div({ style: { flexDirection: "row", ...style } }, ...children);

const Styles = () =>
  div(
    { style: { padding: 16, gap: 16 } },
    div(
      { style: { backgroundColor: "#eef2ff", padding: 12, gap: 8 } },
      button("Run check", { onClick: run }),
      span(() => result, { style: { fontWeight: "bold" } }),
      list(() => details, (line) => span(line, { style: { fontSize: 12, color: "#dc2626" } })),
    ),
    example("Fixed box 120×40", swatch({ width: 120, height: 40 })),
    example("Padding 16", div({ style: { padding: 16 } }, swatch())),
    example("Gap 8, column", div({ style: { gap: 8 } }, swatch(), swatch({}, 1), swatch({}, 2))),
    example(
      "Row, gap 8: fixed widths",
      div({ style: { flexDirection: "row", gap: 8 } }, swatch({ width: 40 }), swatch({ width: 60 }, 1), swatch({ width: 80 }, 2)),
    ),
    ...(["flex-start", "center", "flex-end", "stretch"] as const).map((align) =>
      example(
        `Row, alignItems ${align}`,
        div(
          { style: { flexDirection: "row", gap: 8, alignItems: align, height: 56 } },
          swatch({ width: 40, height: 20 }),
          div({ style: { width: 40, backgroundColor: tint[1] } }),
          swatch({ width: 40, height: 40 }, 2),
        ),
      ),
    ),
    ...(["flex-start", "center", "flex-end"] as const).map((align) =>
      example(`Column, alignItems ${align}`, div({ style: { alignItems: align, gap: 4 } }, swatch({ width: 80 }), span("fit-content"))),
    ),
    example("flex 1 : 1", div({ style: { flexDirection: "row", gap: 8 } }, swatch({ flex: 1 }), swatch({ flex: 1 }, 1))),
    example("flex 1 : 2", div({ style: { flexDirection: "row", gap: 8 } }, swatch({ flex: 1 }), swatch({ flex: 2 }, 1))),
    example(
      "flex 1, fixed 60, flex 1",
      div({ style: { flexDirection: "row", gap: 8 } }, swatch({ flex: 1 }), swatch({ width: 60 }, 1), swatch({ flex: 1 }, 2)),
    ),
    example(
      "flex ignores content",
      div(
        { style: { flexDirection: "row", gap: 8 } },
        div({ style: { flex: 1, backgroundColor: tint[0], padding: 4 } }, span("short")),
        div({ style: { flex: 1, backgroundColor: tint[1], padding: 4 } }, span("a much longer piece of text")),
      ),
    ),
    example(
      "Nesting",
      div(
        { style: { padding: 8, gap: 8, backgroundColor: tint[0] } },
        div(
          { style: { flexDirection: "row", gap: 8, padding: 8, backgroundColor: tint[1] } },
          swatch({ width: 32, height: 32 }, 3),
          div({ style: { flex: 1, gap: 4 } }, span("Title", { style: { fontWeight: "bold" } }), span("Subtitle", { style: { fontSize: 12 } })),
        ),
      ),
    ),
    example(
      "Text sizes and weights",
      div(
        { style: { gap: 2 } },
        ...[12, 14, 17, 22, 28].map((size) => span(`${size} px regular`, { style: { fontSize: size } })),
        span("14 px bold", { style: { fontWeight: "bold" } }),
        h1("h1"),
        h2("h2"),
        h3("h3"),
      ),
    ),
    example("Wrapping text", span(lorem)),
    example("Wrapping in a padded box", div({ style: { padding: 12 } }, span(lorem, { style: { fontSize: 16 } }))),
    ...(["left", "center", "right"] as const).map((textAlign) => example(`textAlign ${textAlign}`, span("Aligned", { style: { textAlign } }))),
    example(
      "Controls",
      div(
        { style: { gap: 8, padding: 8, alignItems: "flex-start" } },
        input({ type: "checkbox", checked: true }),
        input({ placeholder: "Input" }),
        input({ placeholder: "Stretched input", style: { width: 240 } }),
        button("Button"),
        div({ style: { flexDirection: "row", gap: 8, alignItems: "center" } }, input({ type: "checkbox" }), span("Label"), input({ placeholder: "In a row" })),
      ),
    ),
    example(
      "Image, natural aspect and sized",
      div({ style: { gap: 8 } }, img({ src: "assets/dunes.jpg" }), img({ src: "assets/dunes.jpg", style: { width: 120, height: 60 } })),
    ),
    example(
      "Radius clips children",
      div(
        { style: { width: 120, height: 60, borderRadius: 16, backgroundColor: tint[0] } },
        swatch({ width: 120, height: 30 }, 3),
      ),
    ),
    example("css() class, inherited colour and size", div(card, span("Inherits 15 px"), span("and #1f2937"))),
    example("css() with screens: a column, a row from 600 px", div(responsive, swatch({ flexGrow: 1 }), swatch({ flexGrow: 1 }, 1))),
    example("css() padding 4, 16 from 600 px, 28 from 900 px", div(roomy, swatch({}, 3))),
    example("cx() and variants()", row({ gap: 8, alignItems: "flex-start" }, span(chip(), "quiet sm"), span(chip({ tone: "loud", size: "lg" }), "loud lg"), span(cx(chip(), outlined), "cx"))),
    example("globalStyle() on a tag", article(span("An article"))),
    example(
      "Per-side padding and margins",
      div({ style: { paddingTop: 4, paddingRight: 8, paddingBottom: 12, paddingLeft: 24 } }, swatch({ marginLeft: 16, marginTop: 8, marginBottom: 4 }, 2), swatch({ margin: "4px 40px" }, 3)),
    ),
    example("margin auto", div({ style: { gap: 4 } }, swatch({ width: 80, margin: "0 auto" }, 2), row({}, swatch({ width: 40, marginLeft: "auto" }, 3)))),
    example(
      "Borders",
      div(
        { style: { gap: 8 } },
        div(outlined, swatch()),
        div({ style: { borderBottom: "1px solid #9ca3af", padding: 4 } }, span("A divider below")),
        span("Bordered text", { style: { border: "3px solid #818cf8", padding: "2px 6px", borderRadius: 6 } }),
      ),
    ),
    ...(["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] as const).map((justifyContent) =>
      example(`Row, justifyContent ${justifyContent}`, row({ justifyContent }, swatch({ width: 40 }), swatch({ width: 40 }, 1), swatch({ width: 40 }, 2))),
    ),
    example("Column of height 100, justifyContent center", div({ style: { height: 100, justifyContent: "center", gap: 4 } }, swatch({}, 1), swatch({}, 2))),
    example("flexWrap", row({ flexWrap: "wrap", gap: 8 }, ...[0, 1, 2, 3, 4, 5, 6].map((i) => swatch({ width: 90 }, i)))),
    example("flexWrap, rowGap 4, alignContent flex-start", row({ flexWrap: "wrap", columnGap: 6, rowGap: 4, height: 90, alignContent: "flex-start" }, ...[0, 1, 2, 3, 4].map((i) => swatch({ width: 120 }, i)))),
    example("alignSelf", row({ height: 56, gap: 8, alignItems: "flex-start" }, swatch({ width: 40 }), swatch({ width: 40, alignSelf: "center" }, 1), swatch({ width: 40, alignSelf: "flex-end" }, 2), div({ style: { width: 40, alignSelf: "stretch", backgroundColor: tint[3] } }))),
    example("flexBasis and flexGrow", row({ gap: 8 }, swatch({ flexBasis: 100, flexGrow: 1 }), swatch({ flexBasis: 50, flexGrow: 2 }, 1))),
    example("flexShrink", row({ width: 200, gap: 8 }, swatch({ flexBasis: 150, flexShrink: 1 }), swatch({ flexBasis: 150, flexShrink: 3 }, 1))),
    example("min and max widths", row({ gap: 8 }, swatch({ flex: 1, maxWidth: 80 }), swatch({ flex: 1, minWidth: 160 }, 1), swatch({ flex: 1 }, 2))),
    example("Percentages", div({ style: { gap: 4, height: 80 } }, swatch({ width: "50%" }), swatch({ width: "25%", height: "40%" }, 1))),
    example(
      "position absolute and relative",
      div(
        { style: { height: 80, backgroundColor: tint[0], padding: 8 } },
        swatch({ position: "absolute", top: 8, right: 8, width: 40, height: 20 }, 3),
        swatch({ position: "absolute", left: 8, right: 8, bottom: 8, height: 12 }, 2),
        swatch({ position: "relative", top: 4, left: 12, width: 60 }, 1),
      ),
    ),
    example("display none", row({ gap: 8 }, swatch({ width: 40 }), swatch({ width: 40, display: "none" }, 1), swatch({ width: 40 }, 2))),
    example("Row and column reverse", div({ style: { gap: 4 } }, row({ flexDirection: "row-reverse", gap: 8 }, swatch({ width: 40 }), swatch({ width: 60 }, 2)), div({ style: { flexDirection: "column-reverse", height: 60 } }, swatch({}, 1), swatch({}, 3)))),
    example("overflow hidden with a radius", div(clipped, swatch({ width: 120, height: 30 }, 3))),
    example(
      "Opacity and colours",
      div(
        { style: { flexDirection: "row", gap: 8 } },
        ...[1, 0.75, 0.5, 0.25].map((opacity) => swatch({ width: 40, opacity }, 3)),
        span("colour", { style: { color: "#dc2626" } }),
      ),
    ),
  );

const router = createRouter({ "/": { view: Styles, title: "Styles" } });
render(router.outlet, document.body);
