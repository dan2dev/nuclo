// A rich, live gallery of every nuclo styling feature — from the simplest
// css() call to variants() recipes and keyframes() — rendered on /examples.
//
// Each card shows a live Preview and the *complete* Code beside it: the css()
// style definitions AND the elements/component that consume them. All demos use
// a single self-contained themed instance so the snippets are copy-paste real.
import { css as uiCss, cx as uiCx, colors, s } from "../../styles.ts";
import { es } from "./styles.ts";
import { CodeBlock } from "../../components/CodeBlock.ts";

// ── Demo styling instance (matches the createCss() shown on the cards) ────────
const demo = createCss({
  colors: {
    primary: "#ff3f00", primaryHover: "#d92d00",
    accent: "#ff8a00", danger: "#f87171", dangerHover: "#ef4444",
    ink: "#fff8f2", dim: "#c9c1b8", muted: "#837a72",
    panel: "#14110f", panelAlt: "#1f1a17", line: "#3a3029",
  },
  fonts: {
    body: "'Space Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  shadows: { card: "0 10px 30px rgba(0,0,0,.35)", glow: "0 0 0 1px rgba(255,63,0,.5), 0 10px 30px rgba(255,63,0,.28)" },
  radii: { sm: "6px", md: "8px", lg: "8px", pill: "999px" },
  screens: { sm: "(min-width: 420px)", md: "(min-width: 640px)", dark: "(prefers-color-scheme: dark)" },
});

const { css, cx, variants, keyframes } = demo;

// ── Gallery-local chrome (docs theme, matches the rest of the page) ───────────
const gs = {
  wrap: uiCss({ padding: "8px 0 72px" }),
  headWrap: uiCss({ borderTop: `1px solid ${colors.border}`, paddingTop: "44px", marginTop: "8px" }),
  kicker: uiCss({ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0", textTransform: "uppercase", color: colors.primary, marginBottom: "12px" }),
  title: uiCss({ fontSize: "2.2rem", fontWeight: "800", letterSpacing: "0", lineHeight: "1.1", marginBottom: "14px", "@media (max-width: 600px)": { fontSize: "1.7rem" } }),
  lead: uiCss({ maxWidth: "680px", fontSize: "1.02rem", color: colors.textDim, lineHeight: "1.7", marginBottom: "6px" }),
  grid: uiCss({ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px", padding: "32px 0 0", "@media (max-width: 900px)": { gridTemplateColumns: "1fr" } }),
};

// ── Card renderer: live Preview / Code tabs, one per feature ──────────────────
interface Feature {
  level: "Basic" | "Intermediate" | "Advanced";
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

function StylingCard(feat: Feature, index: number) {
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
      div(es.cardMetaRow, div(es.cardBadge, feat.level), div(es.cardNumber, String(index + 1).padStart(2, "0"))),
      div(es.cardTitle, feat.title),
      div(es.cardDesc, feat.desc),
    ),
    div(es.tabs, Tab("Preview", "preview"), Tab("Code", "code")),
    div(
      es.pane,
      { class: () => uiCx(es.pane, activeTab === "preview" ? es.paneActive : null).className },
      div(es.previewPane, feat.preview()),
    ),
    div(
      es.pane,
      { class: () => uiCx(es.pane, activeTab === "code" ? es.codePaneActive : null).className },
      CodeBlock({ filename: `${feat.title.replace(/[^a-zA-Z0-9]+/g, "")}.ts`, code: feat.code }),
    ),
  );
}

// ── Shared recipe & keyframes (used by the demos + shown in their code) ───────
const btnRecipe = variants({
  base: { py: 10, px: 18, rounded: "md", border: "none", weight: 700, text: 13, cursor: "pointer", color: "#fff", transition: "background-color .15s, transform .1s", hover: { transform: "translateY(-1px)" } },
  variants: {
    intent: {
      primary: { bg: "primary", hover: { bg: "primaryHover" } },
      danger: { bg: "danger", hover: { bg: "dangerHover" } },
      ghost: { bg: "transparent", color: "ink", border: "1px solid", borderColor: "line" },
    },
    size: { sm: { py: 6, px: 12, text: 12 }, md: { py: 10, px: 18, text: 13 }, lg: { py: 14, px: 24, text: 15 } },
    block: { true: { display: "block", w: "100%" } },
  },
  defaultVariants: { intent: "primary", size: "md" },
  compoundVariants: [{ intent: "ghost", size: "lg", css: { borderColor: "primary", color: "primary" } }],
});
const intents = ["primary", "danger", "ghost"] as const;

const spin = keyframes({ from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } });
const pulse = keyframes({ "0%, 100%": { opacity: 1, transform: "scale(1)" }, "50%": { opacity: 0.4, transform: "scale(0.75)" } });

// ── Live components (self-contained; the code panels mirror these) ────────────
function propertiesDemo() {
  const box = css({ backgroundColor: "#ff3f00", color: "#fff", padding: 16, borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: 600 });
  return div(box, "padding: 16 → 16px");
}

function aliasesDemo() {
  const tile = css({ bg: "primary", color: "#fff", rounded: "md", py: 10, text: 13, weight: 600, align: "center" });
  return div(
    css({ row: true, gap: 10 }),
    div(cx(tile, css({ px: 8 })), "px 8"),
    div(cx(tile, css({ px: 16 })), "px 16"),
    div(cx(tile, css({ px: 28 })), "px 28"),
  );
}

function compositesDemo() {
  const panel = css({ bg: "panelAlt", border: "1px solid", borderColor: "line", rounded: "md", p: 12, color: "dim", text: 12 });
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 280 }),
    div(cx(panel, css({ row: true, items: "center", justify: "space-between" })), span("row: true"), span("→")),
    div(cx(panel, css({ center: true, h: 52, color: "accent", weight: 600 })), "center: true"),
    div(cx(panel, css({ truncate: true })), "truncate: this line is far too long to fit"),
  );
}

function colorTokensDemo() {
  const chip = css({ py: 10, px: 16, rounded: "pill", weight: 700, color: "#fff" });
  return div(
    css({ row: true, gap: 10 }),
    div(cx(chip, css({ bg: "primary" })), "primary"),
    div(cx(chip, css({ bg: "accent", color: "#04121a" })), "accent"),
    div(cx(chip, css({ bg: "danger" })), "danger"),
  );
}

function fontShadowRadiusDemo() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 280 }),
    div(css({ font: "mono", bg: "panelAlt", color: "ink", p: 12, rounded: "sm", text: 13 }), "const x = 42"),
    div(css({ bg: "panelAlt", color: "dim", p: 14, rounded: "md", shadow: "glow", align: "center", text: 13 }), 'shadow: "glow"'),
    div(
      css({ row: true, gap: 10, justify: "center" }),
      div(css({ bg: "primary", size: 40, rounded: "sm" })),
      div(css({ bg: "primary", size: 40, rounded: "md" })),
      div(css({ bg: "primary", size: 40, rounded: "lg" })),
    ),
  );
}

function pseudoDemo() {
  const btn = css({ py: 10, px: 18, rounded: "md", border: "none", weight: 600, text: 13, color: "#fff", bg: "primary", cursor: "pointer", transition: "background-color .15s, transform .1s", hover: { bg: "primaryHover" }, active: { transform: "translateY(1px)" } });
  const field = css({ py: 10, px: 12, rounded: "md", bg: "panel", color: "ink", border: "1px solid", borderColor: "line", outline: "none", focus: { borderColor: "primary", shadow: "glow" } });
  return div(css({ col: true, gap: 10, w: "100%", maxW: 240 }), button(btn, "hover / active me"), input({ placeholder: "focus me" }, field));
}

function pseudoElementsDemo() {
  const label = css({ color: "accent", weight: 700, text: 15, align: "center", before: { content: "'‹ '" }, after: { content: "' ›'" } });
  const para = css({ text: 13, color: "dim", align: "center", selection: { bg: "accent", color: "#04121a" } });
  const field = css({ py: 10, px: 12, rounded: "md", bg: "panel", color: "ink", border: "1px solid", borderColor: "line", outline: "none", placeholder: { color: "muted", fontStyle: "italic" } });
  return div(css({ col: true, gap: 12, w: "100%", maxW: 260 }), span(label, "decorated"), p(para, "select this text"), input({ placeholder: "italic placeholder" }, field));
}

function responsiveDemo() {
  const box = css({ py: 14, px: 16, rounded: "md", text: 13, weight: 600, color: "#fff", align: "center", bg: "muted", sm: { bg: "danger" }, md: { bg: "primary" } });
  return div(css({ col: true, gap: 8, w: "100%", maxW: 260 }), div(box, "resize the window ↔"), span(css({ text: 11, color: "muted", font: "mono", align: "center" }), "muted → sm → md"));
}

function nestedDemo() {
  const btn = css({ py: 10, px: 18, rounded: "md", border: "none", weight: 600, text: 13, cursor: "pointer", bg: "panelAlt", color: "ink", md: { hover: { bg: "primary", color: "#fff" } } });
  return div(css({ col: true, gap: 8, items: "center" }), button(btn, "hover me ≥640px"), span(css({ text: 11, color: "muted", font: "mono" }), "md: { hover: { … } }"));
}

function selectorsDemo() {
  const rows = css({ bg: "panel", rounded: "md", border: "1px solid", borderColor: "line", overflow: "hidden", w: "100%", maxW: 260, "& > div": { py: 8, px: 12, text: 13, color: "dim" }, "& > div:nth-child(even)": { bg: "panelAlt" }, "& > div:first-child": { color: "accent", weight: 700 } });
  return div(rows, div("first-child (accent)"), div("nth-child(even)"), div("third"), div("nth-child(even)"));
}

function atRulesRawDemo() {
  const supports = css({ p: 14, rounded: "md", bg: "panelAlt", text: 13, color: "dim", align: "center", "@supports (backdrop-filter: blur(2px))": { color: "accent" } });
  const outlined = css({ p: 14, rounded: "md", text: 22, weight: 800, align: "center", raw: { "--stroke": "#ff8a00", "-webkit-text-stroke": "0.7px var(--stroke)", color: "transparent" } });
  return div(css({ col: true, gap: 10, w: "100%", maxW: 280 }), div(supports, "@supports backdrop-filter"), div(outlined, "raw escape hatch"));
}

function cxDemo() {
  const base = css({ py: 10, px: 18, rounded: "md", text: 13, weight: 600, bg: "panelAlt", color: "ink", border: "1px solid", borderColor: "line", cursor: "pointer" });
  const active = css({ bg: "primary", color: "#fff", borderColor: "primary" });
  const danger = css({ py: 10, px: 18, rounded: "md", text: 13, weight: 700, color: "#fff", align: "center", bg: "danger" });
  let enabled = false;
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 260 }),
    div(cx(danger, css({ bg: "primary" })), "cx(danger, primary) → primary"),
    button(() => cx(base, enabled && active), () => (enabled ? "active — click to reset" : "click to toggle"), on("click", () => { enabled = !enabled; update(); })),
  );
}

function variantsDemo() {
  let i = 0;
  return div(
    css({ col: true, gap: 12, items: "center" }),
    div(css({ row: true, gap: 8 }), button(btnRecipe({ intent: "primary", size: "sm" }), "primary·sm"), button(btnRecipe({ intent: "danger" }), "danger"), button(btnRecipe({ intent: "ghost", size: "lg" }), "ghost·lg")),
    button(() => btnRecipe({ intent: intents[i] }), () => `intent: ${intents[i]}`, on("click", () => { i = (i + 1) % intents.length; update(); })),
  );
}

function keyframesDemo() {
  const spinner = css({ size: 34, rounded: "pill", border: "3px solid", borderColor: "line", borderTopColor: "primary", animation: `${spin} .8s linear infinite` });
  const dot = css({ size: 18, rounded: "pill", bg: "accent", animation: `${pulse} 1.4s ease-in-out infinite` });
  return div(css({ row: true, gap: 22, items: "center" }), div(spinner), div(dot));
}

function atomicDemo() {
  function ruleCount(): number {
    if (typeof document === "undefined" || typeof document.getElementById !== "function") return 0;
    const el = document.getElementById("nuclo-styles") as HTMLStyleElement | null;
    return el?.sheet?.cssRules.length ?? 0;
  }
  return div(css({ col: true, gap: 4, items: "center" }), div(css({ font: "mono", text: 30, weight: 800, color: "accent" }), () => String(ruleCount())), span(css({ text: 12, color: "muted", align: "center" }), "atomic rules deduped into one shared sheet"));
}

// ── The gallery data: simple → complex (code = css defs + the component) ──────
const FEATURES: Feature[] = [
  {
    level: "Basic",
    title: "css() — properties & px",
    desc: "One typed object in, atomic classes out. camelCase properties become kebab-case; bare numbers become px.",
    code: `import 'nuclo'

const box = css({
  backgroundColor: "#ff3f00",
  color: "#fff",
  padding: 16,          // number → 16px
  borderRadius: 10,
  textAlign: "center",
  fontSize: 14,
  fontWeight: 600,
})

function Box() {
  return div(box, "padding: 16 → 16px")
}`,
    preview: propertiesDemo,
  },
  {
    level: "Basic",
    title: "Style aliases",
    desc: "Short aliases (p, px, py, w, size, text, weight, rounded…) sit beside full CSS property names. cx() composes them.",
    code: `const tile = css({
  bg: "primary", color: "#fff", rounded: "md",
  py: 10, text: 13, weight: 600, align: "center",
})

function Sizes() {
  return div(
    css({ row: true, gap: 10 }),
    div(cx(tile, css({ px: 8 })),  "px 8"),
    div(cx(tile, css({ px: 16 })), "px 16"),
    div(cx(tile, css({ px: 28 })), "px 28"),
  )
}`,
    preview: aliasesDemo,
  },
  {
    level: "Basic",
    title: "Composite utilities",
    desc: "Boolean shorthands expand to several declarations at once — flex rows/columns, centering, and truncation.",
    code: `const panel = css({
  bg: "panelAlt", border: "1px solid", borderColor: "line",
  rounded: "md", p: 12, color: "dim", text: 12,
})

function Composites() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 280 }),
    div(cx(panel, css({ row: true, items: "center", justify: "space-between" })), span("row: true"), span("→")),
    div(cx(panel, css({ center: true, h: 52, color: "accent", weight: 600 })), "center: true"),
    div(cx(panel, css({ truncate: true })), "truncate: this line is far too long to fit"),
  )
}`,
    preview: compositesDemo,
  },
  {
    level: "Basic",
    title: "Theme color tokens",
    desc: "createCss() colors become autocompleted, type-checked values on bg / color / borderColor. Raw values still work.",
    code: `const { css, cx } = createCss({
  colors: { primary: "#ff3f00", accent: "#ff8a00", danger: "#f87171" },
})

const chip = css({ py: 10, px: 16, rounded: "pill", weight: 700, color: "#fff" })

function Chips() {
  return div(
    css({ row: true, gap: 10 }),
    div(cx(chip, css({ bg: "primary" })), "primary"),
    div(cx(chip, css({ bg: "accent", color: "#04121a" })), "accent"),
    div(cx(chip, css({ bg: "danger" })), "danger"),
  )
}`,
    preview: colorTokensDemo,
  },
  {
    level: "Basic",
    title: "Font, shadow & radius tokens",
    desc: "font (fonts), shadow (shadows) and rounded (radii) resolve against their own theme tables.",
    code: `const { css } = createCss({
  fonts:   { mono: "'JetBrains Mono', monospace" },
  shadows: { glow: "0 0 0 1px #ff3f0080, 0 10px 30px #ff3f0047" },
  radii:   { sm: "6px", md: "10px", lg: "16px" },
})

function Tokens() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 280 }),
    div(css({ font: "mono", bg: "panelAlt", color: "ink", p: 12, rounded: "sm", text: 13 }), "const x = 42"),
    div(css({ bg: "panelAlt", color: "dim", p: 14, rounded: "md", shadow: "glow", align: "center" }), 'shadow: "glow"'),
    div(css({ row: true, gap: 10 }),
      div(css({ bg: "primary", size: 40, rounded: "sm" })),
      div(css({ bg: "primary", size: 40, rounded: "md" })),
      div(css({ bg: "primary", size: 40, rounded: "lg" })),
    ),
  )
}`,
    preview: fontShadowRadiusDemo,
  },
  {
    level: "Intermediate",
    title: "Pseudo-classes",
    desc: "hover, focus, active, disabled and friends nest as typed keys — then bind them to real elements.",
    code: `const btn = css({
  py: 10, px: 18, rounded: "md", weight: 600, color: "#fff",
  bg: "primary", cursor: "pointer",
  hover: { bg: "primaryHover" },
  active: { transform: "translateY(1px)" },
})

const field = css({
  py: 10, px: 12, rounded: "md", bg: "panel", color: "ink",
  border: "1px solid", borderColor: "line", outline: "none",
  focus: { borderColor: "primary", shadow: "glow" },
})

function Controls() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 240 }),
    button(btn, "hover / active me"),
    input({ placeholder: "focus me" }, field),
  )
}`,
    preview: pseudoDemo,
  },
  {
    level: "Intermediate",
    title: "Pseudo-elements",
    desc: "::before, ::after, ::placeholder and ::selection are typed keys too — content strings and all.",
    code: `const label = css({
  color: "accent", weight: 700, text: 15, align: "center",
  before: { content: "'‹ '" },
  after:  { content: "' ›'" },
})

const para  = css({ text: 13, color: "dim", selection: { bg: "accent", color: "#04121a" } })
const field = css({ py: 10, px: 12, rounded: "md", bg: "panel", color: "ink",
  border: "1px solid", borderColor: "line",
  placeholder: { color: "muted", fontStyle: "italic" } })

function Text() {
  return div(
    css({ col: true, gap: 12, w: "100%", maxW: 260 }),
    span(label, "decorated"),
    p(para, "select this text"),
    input({ placeholder: "italic placeholder" }, field),
  )
}`,
    preview: pseudoElementsDemo,
  },
  {
    level: "Intermediate",
    title: "Responsive screens",
    desc: "screens declared in the theme become typed variant keys. Resize the window to see the tile restyle.",
    code: `const { css } = createCss({
  screens: { sm: "(min-width: 420px)", md: "(min-width: 640px)" },
})

const box = css({
  py: 14, px: 16, rounded: "md", weight: 600, color: "#fff", align: "center",
  bg: "muted",
  sm: { bg: "danger" },   // ≥ 420px
  md: { bg: "primary" },  // ≥ 640px
})

function Responsive() {
  return div(box, "resize the window ↔")
}`,
    preview: responsiveDemo,
  },
  {
    level: "Intermediate",
    title: "Nested variants",
    desc: "Every variant key nests recursively — combine a screen with a pseudo-class in one place.",
    code: `const btn = css({
  py: 10, px: 18, rounded: "md", weight: 600, cursor: "pointer",
  bg: "panelAlt", color: "ink",
  md: {
    hover: { bg: "primary", color: "#fff" },
  },
})

function NestedButton() {
  return button(btn, "hover me ≥640px")
}`,
    preview: nestedDemo,
  },
  {
    level: "Intermediate",
    title: "Arbitrary selectors",
    desc: 'Any "&" selector targets the element, its children, or siblings — nth-child, first-child, "& > div".',
    code: `const rows = css({
  bg: "panel", rounded: "md", border: "1px solid", borderColor: "line", overflow: "hidden",
  "& > div": { py: 8, px: 12, text: 13, color: "dim" },
  "& > div:nth-child(even)": { bg: "panelAlt" },
  "& > div:first-child": { color: "accent", weight: 700 },
})

function Rows() {
  return div(rows,
    div("first-child (accent)"),
    div("nth-child(even)"),
    div("third"),
    div("nth-child(even)"),
  )
}`,
    preview: selectorsDemo,
  },
  {
    level: "Advanced",
    title: "At-rules & raw",
    desc: "Inline @media / @supports / @container keys, plus a raw escape hatch for custom properties and vendor prefixes.",
    code: `const supports = css({
  p: 14, rounded: "md", bg: "panelAlt", color: "dim", align: "center",
  "@supports (backdrop-filter: blur(2px))": { color: "accent" },
})

const outlined = css({
  p: 14, rounded: "md", text: 22, weight: 800, align: "center",
  raw: {
    "--stroke": "#ff8a00",
    "-webkit-text-stroke": "0.7px var(--stroke)",
    color: "transparent",
  },
})

function AtRulesRaw() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 280 }),
    div(supports, "@supports backdrop-filter"),
    div(outlined, "raw escape hatch"),
  )
}`,
    preview: atRulesRawDemo,
  },
  {
    level: "Advanced",
    title: "cx() — conflict resolution",
    desc: "cx() merges with exact last-wins resolution, skips falsy inputs, and works great as a reactive className.",
    code: `const base   = css({ py: 10, px: 18, rounded: "md", weight: 600, cursor: "pointer",
  bg: "panelAlt", color: "ink", border: "1px solid", borderColor: "line" })
const active = css({ bg: "primary", color: "#fff", borderColor: "primary" })
const danger = css({ py: 10, px: 18, rounded: "md", weight: 700, color: "#fff", bg: "danger" })

let enabled = false

function Toggle() {
  return div(
    css({ col: true, gap: 10, w: "100%", maxW: 260 }),
    // last wins per (query, selector, property)
    div(cx(danger, css({ bg: "primary" })), "cx(danger, primary) → primary"),
    // reactive className — recomputed on update()
    button(
      () => cx(base, enabled && active),
      () => enabled ? "active — click to reset" : "click to toggle",
      on("click", () => { enabled = !enabled; update() }),
    ),
  )
}`,
    preview: cxDemo,
  },
  {
    level: "Advanced",
    title: "variants() — typed recipes",
    desc: "base + variant groups + defaultVariants + compoundVariants. Unknown selections are compile errors; boolean groups take true/false.",
    code: `const btn = variants({
  base: { py: 10, px: 18, rounded: "md", weight: 700, color: "#fff", cursor: "pointer",
    hover: { transform: "translateY(-1px)" } },
  variants: {
    intent: {
      primary: { bg: "primary", hover: { bg: "primaryHover" } },
      danger:  { bg: "danger",  hover: { bg: "dangerHover" } },
      ghost:   { bg: "transparent", color: "ink", border: "1px solid", borderColor: "line" },
    },
    size:  { sm: { py: 6, px: 12, text: 12 }, md: { py: 10, px: 18 }, lg: { py: 14, px: 24, text: 15 } },
    block: { true: { display: "block", w: "100%" } },
  },
  defaultVariants: { intent: "primary", size: "md" },
  compoundVariants: [{ intent: "ghost", size: "lg", css: { borderColor: "primary", color: "primary" } }],
})

const intents = ["primary", "danger", "ghost"] as const
let i = 0

function Buttons() {
  return div(
    css({ col: true, gap: 12, items: "center" }),
    div(css({ row: true, gap: 8 }),
      button(btn({ intent: "primary", size: "sm" }), "primary·sm"),
      button(btn({ intent: "danger" }), "danger"),
      button(btn({ intent: "ghost", size: "lg" }), "ghost·lg"),
    ),
    button(
      () => btn({ intent: intents[i] }),
      () => \`intent: \${intents[i]}\`,
      on("click", () => { i = (i + 1) % intents.length; update() }),
    ),
  )
}`,
    preview: variantsDemo,
  },
  {
    level: "Advanced",
    title: "keyframes() & animation",
    desc: "keyframes() registers an @keyframes block and returns its generated name — from/to and percentage stops.",
    code: `const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to:   { transform: "rotate(360deg)" },
})
const pulse = keyframes({
  "0%, 100%": { opacity: 1, transform: "scale(1)" },
  "50%":      { opacity: 0.4, transform: "scale(0.75)" },
})

const spinner = css({ size: 34, rounded: "pill", border: "3px solid",
  borderColor: "line", borderTopColor: "primary",
  animation: \`\${spin} .8s linear infinite\` })
const dot = css({ size: 18, rounded: "pill", bg: "accent",
  animation: \`\${pulse} 1.4s ease-in-out infinite\` })

function Loaders() {
  return div(css({ row: true, gap: 22, items: "center" }), div(spinner), div(dot))
}`,
    preview: keyframesDemo,
  },
  {
    level: "Advanced",
    title: "One atomic stylesheet",
    desc: "Identical declarations dedupe to a single class shared across the whole app. getCssText() serializes the sheet for SSR.",
    code: `// every css()/variants()/keyframes() call records atomic
// rules into ONE shared <style> sheet — deduped and reused.
import { getCssText } from "nuclo/ssr"

function Count() {
  const rules = () =>
    document.getElementById("nuclo-styles")?.sheet?.cssRules.length ?? 0

  return div(
    css({ col: true, gap: 4, items: "center" }),
    div(css({ font: "mono", text: 30, weight: 800, color: "accent" }), () => String(rules())),
    span(css({ text: 12, color: "muted" }), "atomic rules in one shared sheet"),
  )
}

// on the server: const cssText = getCssText()  // inline into <head>`,
    preview: atomicDemo,
  },
];

// ── Exported gallery ──────────────────────────────────────────────────────────
export function StylingGallery() {
  return section(
    gs.wrap,
    div(
      s.container,
      div(
        gs.headWrap,
        div(gs.kicker, "Styling system"),
        h2(gs.title, "Every styling feature, live"),
        p(gs.lead, "From the simplest css() call to typed variants() recipes and keyframes(). Every demo shares one instance — const { css, cx, variants, keyframes } = createCss({ … }) — and each card shows the complete component: the css() definitions and the elements that use them, beside the live preview."),
      ),
      div(gs.grid, ...FEATURES.map((feat, i) => StylingCard(feat, i))),
    ),
  );
}
