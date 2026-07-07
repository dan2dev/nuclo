import { css as uiCss, cx as uiCx, colors, s } from "../../styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";
import { es } from "./styles.ts";

const demo = createCss({
  colors: {
    primary: "#ff3f00",
    surface: "#fff7ed",
    border: "#ffd7c2",
    text: "#1f2937",
    muted: "#6b7280",
  },
  screens: {
    sm: "(min-width: 520px)",
  },
});

const { css, cx } = demo;

const gs = {
  wrap: uiCss({ padding: "8px 0 72px" }),
  headWrap: uiCss({ borderTop: `1px solid ${colors.border}`, paddingTop: "44px", marginTop: "8px" }),
  kicker: uiCss({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  title: uiCss({ fontSize: "2.2rem", fontWeight: "800", letterSpacing: "0", lineHeight: "1.1", marginBottom: "14px", "@media (max-width: 600px)": { fontSize: "1.7rem" } }),
  lead: uiCss({ maxWidth: "620px", fontSize: "1.02rem", color: colors.textDim, lineHeight: "1.7", marginBottom: "6px" }),
  grid: uiCss({ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "18px", padding: "32px 0 0", "@media (max-width: 980px)": { gridTemplateColumns: "1fr" } }),
};

interface StylingFeature {
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

function StylingCard(feature: StylingFeature, index: number) {
  let activeTab: "preview" | "code" = "preview";

  function Tab(label: string, tab: "preview" | "code") {
    return button(
      es.tab,
      { class: () => uiCx(es.tab, activeTab === tab ? es.tabActive : null).className },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    es.card,
    div(
      es.cardTop,
      div(
        es.cardMetaRow,
        div(es.cardBadge, "Styling"),
        div(es.cardNumber, String(index + 1).padStart(2, "0")),
      ),
      div(es.cardTitle, feature.title),
      div(es.cardDesc, feature.desc),
    ),
    div(es.tabs, Tab("Preview", "preview"), Tab("Code", "code")),
    div(
      es.pane,
      { class: () => uiCx(es.pane, activeTab === "preview" ? es.paneActive : null).className },
      div(es.previewPane, feature.preview()),
    ),
    div(
      es.pane,
      { class: () => uiCx(es.pane, activeTab === "code" ? es.codePaneActive : null).className },
      CodeBlock({ filename: `${feature.title.replace(/[^a-zA-Z0-9]+/g, "")}.ts`, code: feature.code }),
    ),
  );
}

const cardStyle = css({
  p: 16,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
});

const quietText = css({ color: "muted", text: 13, lineHeight: "1.5", marginTop: 6 });

function CssPreview() {
  return div(
    cardStyle,
    strong("Simple card"),
    p(quietText, "One style object returns one reusable class."),
  );
}

const baseButton = css({
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
  color: "text",
  cursor: "pointer",
});

const selectedButton = css({
  bg: "primary",
  color: "white",
  borderColor: "primary",
});

function CxPreview() {
  let selected = false;

  return div(
    css({ col: true, gap: 10, items: "center" }),
    button(
      () => cx(baseButton, selected ? selectedButton : null),
      () => selected ? "Selected" : "Select",
      on("click", () => { selected = !selected; update(); }),
    ),
    span(css({ color: "muted", text: 12 }), "cx() adds the selected class."),
  );
}

const responsiveCard = css({
  p: 12,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
  w: "100%",
  maxW: 260,
  sm: {
    p: 20,
    borderColor: "primary",
  },
});

function ThemePreview() {
  return div(
    responsiveCard,
    strong("Theme tokens"),
    p(quietText, "Resize above 520px to use the sm screen rule."),
  );
}

const FEATURES: StylingFeature[] = [
  {
    title: "css()",
    desc: "Create a class from one typed style object.",
    code: `const card = css({
  p: 16,
  rounded: 8,
  border: "1px solid",
  borderColor: "border",
  bg: "surface",
  color: "text",
})

function Card() {
  return div(card, "Simple card")
}`,
    preview: CssPreview,
  },
  {
    title: "cx()",
    desc: "Compose classes conditionally. Later styles win.",
    code: `const baseButton = css({
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
})

const selectedButton = css({
  bg: "primary",
  color: "white",
  borderColor: "primary",
})

let selected = false

function Button() {
  return button(
    () => cx(baseButton, selected && selectedButton),
    () => selected ? "Selected" : "Select",
    on("click", () => { selected = !selected; update() }),
  )
}`,
    preview: CxPreview,
  },
  {
    title: "createCss()",
    desc: "Define a small theme and use its tokens.",
    code: `const { css } = createCss({
  colors: {
    primary: "#ff3f00",
    surface: "#fff7ed",
    border: "#ffd7c2",
  },
  screens: {
    sm: "(min-width: 520px)",
  },
})

const box = css({
  p: 12,
  bg: "surface",
  borderColor: "border",
  sm: { p: 20, borderColor: "primary" },
})`,
    preview: ThemePreview,
  },
];

export function StylingGallery() {
  return section(
    gs.wrap,
    div(
      s.container,
      div(
        gs.headWrap,
        div(gs.kicker, "Styling"),
        h2(gs.title, "Styling basics"),
        p(gs.lead, "A short set of styling examples: create a class, compose a class, and use a tiny theme."),
      ),
      div(gs.grid, ...FEATURES.map((feature, index) => StylingCard(feature, index))),
    ),
  );
}
