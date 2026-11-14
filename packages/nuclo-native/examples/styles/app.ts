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

const example = (title: string, ...content: unknown[]) =>
  div({ style: { gap: 6 } }, label(title), div({ style: { backgroundColor: "#f3f4f6" } }, ...(content as never[])));

let result = "Not checked yet.";
let details: string[] = [];
const run = () => {
  const r = check();
  result = `${r.matched}/${r.total} boxes match ${r.against} (±0.5)`;
  // Native hosts have no console: the first mismatches go on screen.
  details = r.mismatches
    .slice(0, 5)
    .map((m) => `#${m.id}: expected ${m.expected.join(" ")}, got ${m.actual?.join(" ") ?? "nothing"}`);
  update();
};

const lorem = "The quick brown fox jumps over the lazy dog, then naps in the warm afternoon sun.";

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
