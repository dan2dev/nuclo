// Theme + chrome styles for the editor itself, built with nuclo's css() so the
// tool dogfoods the engine. The user's CSS never touches these classes: the
// generated class names are hashed, and user rules are scoped to the preview stage.
import "nuclo";

export const ui = createCss({
  colors: {
    bg: "#0a0c12",
    panel: "#10131a",
    panel2: "#171b25",
    field: "#0c0f16",
    border: "#1f2533",
    border2: "#2d3546",
    text: "#e7eaf0",
    dim: "#98a2b3",
    muted: "#5f6b7d",
    accent: "#7c8cff",
    accentSoft: "rgba(124, 140, 255, 0.16)",
    danger: "#f87171",
    ok: "#34d399",
    sel: "#fbbf24",
    prop: "#7dd3fc",
    punct: "#5b6475",
  },
  fonts: {
    body: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  shadows: {
    ring: "0 0 0 3px rgba(124, 140, 255, 0.28)",
    thumb: "0 0 0 1px rgba(124, 140, 255, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4)",
    inset: "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 1px 2px rgba(0, 0, 0, 0.4)",
    pop: "0 16px 48px rgba(0, 0, 0, 0.55)",
  },
  radii: { sm: "6px", md: "10px", lg: "14px", pill: "999px" },
  screens: { narrow: "(max-width: 980px)" },
});

export const { css, cx, globalStyle, keyframes } = ui;

globalStyle("*, *::before, *::after", { boxSizing: "border-box" });
globalStyle("html, body", { m: 0, h: "100%" });
globalStyle("body", { font: "body", bg: "bg", color: "text", text: 13, lineHeight: 1.45, raw: { "-webkit-font-smoothing": "antialiased" } });
globalStyle("button, input, select, textarea", { font: "inherit", color: "inherit" });
globalStyle("::-webkit-scrollbar", { w: 10, h: 10 });
globalStyle("::-webkit-scrollbar-thumb", { bg: "border2", rounded: "pill", border: "3px solid #10131a" });

const flash = keyframes({ from: { bg: "accentSoft" }, to: { bg: "transparent" } });
const rise = keyframes({ from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } });

const chevron =
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%2398a2b3' stroke-width='1.5' stroke-linecap='round'/></svg>")`;

export const s = {
  // ── shell: sidebar | main | code ──
  app: css({
    display: "grid",
    gridTemplateColumns: "250px minmax(0, 1fr) minmax(380px, 36%)",
    h: "100vh",
    overflow: "hidden",
    narrow: { gridTemplateColumns: "1fr", h: "auto", overflow: "visible" },
  }),

  side: css({
    col: true, minH: 0, bg: "panel", borderRight: "1px solid", borderColor: "border",
    narrow: { borderRight: "none", borderBottom: "1px solid", maxH: "50vh" },
  }),
  brand: css({ row: true, items: "center", gap: 10, px: 16, py: 14, borderBottom: "1px solid", borderColor: "border" }),
  logo: css({
    size: 28, rounded: "md", row: true, center: true, flexShrink: 0,
    font: "mono", weight: 800, text: 12, color: "#0a0c12",
    backgroundImage: "linear-gradient(135deg, #7c8cff, #2dd4bf)",
  }),
  brandTitle: css({ weight: 700, text: 14, lineHeight: 1.1 }),
  brandSub: css({ text: 11, color: "muted", mt: 2 }),
  newRow: css({ p: 10, borderBottom: "1px solid", borderColor: "border" }),
  ruleList: css({ flex: 1, overflow: "auto", p: 8, minH: 0 }),
  rule: css({
    row: true, items: "center", gap: 8, px: 10, py: 7, rounded: "md", cursor: "pointer",
    color: "dim", font: "mono", text: 12.5, outline: "none",
    transition: "background-color .1s, color .1s",
    hover: { bg: "panel2", color: "text" },
    focusVisible: { shadow: "ring" },
    "&:hover > button, &:focus-within > button": { opacity: 1 },
  }),
  ruleOn: css({ bg: "accentSoft", color: "text", hover: { bg: "accentSoft" } }),
  ruleName: css({ flex: 1, truncate: true }),
  ruleDel: css({ opacity: 0, focusVisible: { opacity: 1 } }),
  sideFoot: css({ row: true, gap: 8, p: 10, borderTop: "1px solid", borderColor: "border" }),

  // ── main column: preview stage + grouped controls ──
  main: css({ col: true, minH: 0, bg: "bg" }),
  preview: css({ borderBottom: "1px solid", borderColor: "border", bg: "panel", flexShrink: 0 }),
  toolbar: css({ row: true, items: "center", gap: 8, px: 12, h: 44, borderBottom: "1px solid", borderColor: "border" }),
  toolLabel: css({ text: 11, weight: 700, color: "muted", textTransform: "uppercase", letterSpacing: "0.08em", mr: 4 }),
  toolSel: css({ w: "auto", minW: 96 }),
  toolInput: css({ flex: 1, minW: 120 }),
  stage: css({
    row: true, center: true, minH: 200, maxH: "40vh", overflow: "auto", p: 28,
    transition: "background-color .2s", backgroundSize: "18px 18px",
  }),
  stageLight: css({ bg: "#f4f5f8", color: "#0f172a", backgroundImage: "radial-gradient(rgba(15, 23, 42, 0.14) 1px, transparent 1px)" }),
  stageDark: css({ bg: "#0a0c12", color: "#e7eaf0", backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)" }),

  editor: css({ flex: 1, overflow: "auto", p: 14, minH: 0, narrow: { overflow: "visible" } }),
  editorHead: css({ row: true, items: "center", gap: 10, mb: 12, flexWrap: "wrap" }),
  selInput: css({
    flex: 1, minW: 160, font: "mono", text: 15, weight: 600, color: "sel",
    bg: "transparent", border: "none", borderBottom: "1px dashed", borderColor: "border2",
    px: 2, py: 6, outline: "none",
    focus: { borderColor: "accent" },
  }),
  hint: css({ text: 12, color: "muted" }),

  group: css({
    border: "1px solid", borderColor: "border", rounded: "lg", bg: "panel", mb: 10, overflow: "hidden",
    "& > summary": { row: true, items: "center", gap: 8, px: 14, py: 10, cursor: "pointer", weight: 600, text: 13, userSelect: "none", listStyle: "none" },
    "& > summary:hover": { bg: "panel2" },
    "& > summary::-webkit-details-marker": { display: "none" },
    "& > summary::before": {
      content: "''", size: 6, borderRight: "1.5px solid", borderBottom: "1.5px solid", borderColor: "muted",
      transform: "rotate(-45deg)", transition: "transform .15s", ml: 2, mr: 6, flexShrink: 0,
    },
    "&[open] > summary::before": { transform: "rotate(45deg)" },
  }),
  groupBody: css({ px: 14, pt: 4, pb: 12 }),
  badge: css({ text: 11, font: "mono", color: "dim", bg: "field", border: "1px solid", borderColor: "border", px: 6, py: 1, rounded: "pill", lineHeight: 1.4 }),

  // ── controls ──
  row: css({ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr)", items: "center", gap: 10, py: 5 }),
  label: css({ text: 12, color: "dim", truncate: true }),
  ctl: css({ row: true, items: "center", gap: 6, minW: 0 }),
  field: css({
    h: 28, px: 8, rounded: "sm", bg: "field", border: "1px solid", borderColor: "border", color: "text",
    text: 12.5, outline: "none", w: "100%", minW: 0,
    transition: "border-color .12s, box-shadow .12s",
    hover: { borderColor: "border2" },
    focus: { borderColor: "accent", shadow: "ring" },
    placeholder: { color: "muted" },
  }),
  select: css({
    appearance: "none", raw: { "-webkit-appearance": "none" }, cursor: "pointer",
    backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", pr: 24,
  }),
  mono: css({ font: "mono", text: 12 }),
  num: css({ font: "mono", text: 12, w: 76, flexShrink: 0, textAlign: "right" }),
  unit: css({ w: 66, flexShrink: 0, px: 6, pr: 20 }),
  slider: css({
    flex: 1, minW: 50, h: 4, m: 0, rounded: "pill", bg: "border2", outline: "none", cursor: "pointer",
    appearance: "none", raw: { "-webkit-appearance": "none" },
    "&::-webkit-slider-thumb": {
      appearance: "none", raw: { "-webkit-appearance": "none" }, size: 14, rounded: "pill", bg: "accent",
      border: "2px solid #0c0f16", shadow: "thumb", transition: "transform .1s",
    },
    "&::-webkit-slider-thumb:hover": { transform: "scale(1.15)" },
    "&:focus-visible::-webkit-slider-thumb": { shadow: "ring" },
    "&::-moz-range-thumb": { size: 10, rounded: "pill", bg: "accent", border: "2px solid #0c0f16" },
    disabled: { opacity: 0.35, cursor: "not-allowed" },
  }),
  iconBtn: css({
    size: 24, flexShrink: 0, display: "inline-flex", center: true, p: 0, rounded: "sm",
    border: "1px solid transparent", bg: "transparent", color: "muted", cursor: "pointer", text: 14, lineHeight: 1,
    transition: "background-color .1s, color .1s",
    hover: { bg: "panel2", color: "text" },
    focusVisible: { shadow: "ring", outline: "none" },
  }),
  iconOn: css({ color: "accent", bg: "accentSoft", borderColor: "accent", hover: { bg: "accentSoft", color: "accent" } }),
  ghost: css({ visibility: "hidden", pointerEvents: "none" }),
  seg: css({ row: true, flexWrap: "wrap", gap: 2, p: 2, bg: "field", border: "1px solid", borderColor: "border", rounded: "sm" }),
  segBtn: css({
    h: 22, px: 8, rounded: 4, border: "none", bg: "transparent", color: "dim", text: 11.5, cursor: "pointer",
    whiteSpace: "nowrap", transition: "background-color .1s, color .1s",
    hover: { color: "text" },
    focusVisible: { shadow: "ring", outline: "none" },
  }),
  segOn: css({ bg: "panel2", color: "text", shadow: "inset" }),
  swatch: css({
    size: 28, flexShrink: 0, rounded: "sm", border: "1px solid", borderColor: "border2", position: "relative", overflow: "hidden",
    bg: "#1a1f2b",
    backgroundImage: "linear-gradient(45deg, #2a3040 25%, transparent 25%, transparent 75%, #2a3040 75%), linear-gradient(45deg, #2a3040 25%, transparent 25%, transparent 75%, #2a3040 75%)",
    backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px",
  }),
  swatchFill: css({ position: "absolute", inset: 0 }),
  colorInput: css({ position: "absolute", inset: 0, w: "100%", h: "100%", opacity: 0, cursor: "pointer", p: 0, m: 0, border: "none" }),
  boxGrid: css({ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, flex: 1, minW: 0 }),
  boxCell: css({ col: true, gap: 3, minW: 0 }),
  boxCap: css({ text: 10, color: "muted", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }),
  boxNum: css({ w: "100%", px: 4, textAlign: "center" }),
  declRow: css({ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr) 24px 24px", gap: 6, items: "center", mb: 6 }),

  // ── code pane ──
  codePane: css({
    col: true, minH: 0, bg: "panel", borderLeft: "1px solid", borderColor: "border",
    narrow: { borderLeft: "none", borderTop: "1px solid", minH: 420 },
  }),
  codeHead: css({ row: true, items: "center", gap: 8, px: 12, h: 44, borderBottom: "1px solid", borderColor: "border", flexShrink: 0 }),
  codeTitle: css({ weight: 700, text: 13 }),
  status: css({ text: 11, font: "mono", px: 7, py: 2, rounded: "pill", border: "1px solid" }),
  statusOk: css({ color: "ok", borderColor: "rgba(52, 211, 153, 0.35)", bg: "rgba(52, 211, 153, 0.08)" }),
  statusErr: css({ color: "danger", borderColor: "rgba(248, 113, 113, 0.35)", bg: "rgba(248, 113, 113, 0.08)" }),
  spacer: css({ flex: 1 }),
  btn: css({
    h: 26, px: 10, rounded: "sm", border: "1px solid", borderColor: "border", bg: "panel2", color: "text", text: 12,
    cursor: "pointer", whiteSpace: "nowrap", transition: "background-color .1s, border-color .1s",
    hover: { borderColor: "border2", bg: "#1d2230" },
    focusVisible: { shadow: "ring", outline: "none" },
    disabled: { opacity: 0.45, cursor: "not-allowed" },
  }),
  btnAccent: css({ bg: "accent", borderColor: "accent", color: "#0a0c12", weight: 600, hover: { bg: "#8f9dff", borderColor: "#8f9dff" } }),
  codeWrap: css({ position: "relative", flex: 1, minH: 0 }),
  // The highlighted <pre> and the transparent <textarea> share this exact box so the text lines up.
  codeLayer: css({
    position: "absolute", inset: 0, m: 0, p: 16, font: "mono", text: 12.5, lineHeight: 1.65,
    whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "auto",
    raw: { "tab-size": "2", "-moz-tab-size": "2" },
  }),
  codePre: css({ color: "text", pointerEvents: "none" }),
  codeTa: css({ bg: "transparent", color: "transparent", caretColor: "#e7eaf0", border: "none", outline: "none", resize: "none", selection: { bg: "rgba(124, 140, 255, 0.3)" } }),
  tSel: css({ color: "sel" }),
  tProp: css({ color: "prop" }),
  tVal: css({ color: "text" }),
  tPunct: css({ color: "punct" }),
  tComment: css({ color: "muted", fontStyle: "italic" }),
  errorBar: css({ px: 14, py: 8, bg: "rgba(248, 113, 113, 0.08)", color: "danger", text: 12, font: "mono", borderTop: "1px solid", borderColor: "rgba(248, 113, 113, 0.3)", flexShrink: 0 }),

  // ── palettes (class switcher, property quick-add) ──
  pal: css({ position: "relative", row: true, items: "center", gap: 6, flex: 1, minW: 0 }),
  palInput: css({ flex: 1 }),
  palInputKbd: css({ pr: 48 }),
  palChip: css({ font: "mono", text: 12, color: "accent", bg: "accentSoft", px: 7, py: 3, rounded: "sm", whiteSpace: "nowrap", flexShrink: 0 }),
  palList: css({
    position: "absolute", top: "100%", left: 0, right: 0, mt: 4, zIndex: 30, p: 4,
    bg: "panel2", border: "1px solid", borderColor: "border2", rounded: "md", shadow: "pop", maxH: 300, overflow: "auto",
  }),
  palItem: css({ row: true, items: "center", gap: 10, px: 10, py: 6, rounded: "sm", cursor: "pointer", text: 12.5, color: "dim", hover: { bg: "panel", color: "text" } }),
  palItemOn: css({ bg: "accentSoft", color: "text", hover: { bg: "accentSoft" } }),
  palLabel: css({ font: "mono", truncate: true }),
  palHint: css({ ml: "auto", text: 11, color: "muted", truncate: true, maxW: "55%", flexShrink: 0 }),
  palBar: css({ position: "sticky", top: 0, zIndex: 10, bg: "bg", pb: 10, mb: 2 }),
  kbd: css({ font: "mono", text: 10.5, color: "muted", bg: "panel", border: "1px solid", borderColor: "border2", rounded: 4, px: 5, py: 1, lineHeight: 1.4, whiteSpace: "nowrap", shadow: "0 1px 0 #2d3546" }),
  kbdHint: css({ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }),
  flash: css({ animation: `${flash} 1.4s ease-out`, rounded: "sm" }),
  btnOn: css({ borderColor: "accent", color: "accent", bg: "accentSoft", hover: { bg: "accentSoft", borderColor: "accent" } }),
  presetRow: css({ row: true, flexWrap: "wrap", gap: 6, justify: "center", mt: 10 }),

  // ── toasts & help ──
  toasts: css({ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", col: true, items: "center", gap: 6, zIndex: 50, pointerEvents: "none" }),
  toast: css({ bg: "panel2", border: "1px solid", borderColor: "border2", color: "text", text: 12.5, px: 14, py: 8, rounded: "md", shadow: "pop", animation: `${rise} .18s ease-out` }),
  overlay: css({ position: "fixed", inset: 0, zIndex: 60, row: true, center: true, p: 20, bg: "rgba(5, 7, 12, 0.6)", backdropFilter: "blur(2px)" }),
  dialog: css({ bg: "panel", border: "1px solid", borderColor: "border2", rounded: "lg", shadow: "pop", p: 22, w: "100%", maxW: 620, maxH: "85vh", overflow: "auto" }),
  dialogTitle: css({ text: 16, weight: 700, m: 0, mb: 4 }),
  shortcuts: css({ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 16px", items: "center", mt: 16, text: 12.5, color: "dim" }),
  keys: css({ row: true, gap: 4, justify: "flex-end" }),

  empty: css({ col: true, gap: 6, p: 20, color: "muted", text: 12.5, textAlign: "center" }),
  emptyBig: css({ col: true, center: true, h: "100%", color: "muted", textAlign: "center", gap: 4 }),
};
