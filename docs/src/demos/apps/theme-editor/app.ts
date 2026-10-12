// app.ts: the editor. The preview's classes are compiled once, by createCss()
// and variants() in theme.ts, and editing the theme never compiles them again.
// Every control writes the plain `theme` object and calls update(). What
// changes is the text of one <style> element, the theme as CSS variables, and
// the browser re-applies those to the preview.
import "nuclo";
import { Gallery } from "./gallery.ts";
import { FONTS, PRESETS, theme, variables, type Preset, type Theme } from "./theme.ts";
import { s } from "./styles.ts";

const COLORS = {
  primary: "Primary", onPrimary: "On primary", accent: "Accent", background: "Background", surface: "Surface",
  text: "Text", muted: "Muted text", border: "Border", danger: "Danger", success: "Success",
} satisfies Partial<Record<keyof Theme, string>>;
type ColorKey = keyof typeof COLORS;

let preset: Preset = "Nuclo";
let exporting = false;
let copyLabel = "Copy";
let copyTimer: ReturnType<typeof setTimeout> | undefined;

function set<K extends keyof Theme>(key: K, value: Theme[K]) {
  theme[key] = value;
  update();
}

function apply(name: Preset) {
  preset = name;
  Object.assign(theme, PRESETS[name]);
  update();
}

function copy() {
  const show = (text: string) => {
    copyLabel = text;
    update();
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyLabel = "Copy"; update(); }, 1500);
  };
  navigator.clipboard.writeText(variables(":root")).then(() => show("Copied"), () => show("Copy failed"));
}

// WCAG 2 contrast: the relative luminance of each #rrggbb, then (lighter + 0.05) / (darker + 0.05).
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function Contrast(name: string, fg: ColorKey, bg: ColorKey) {
  const ratio = () => contrast(theme[fg], theme[bg]);
  return div(
    s.contrast,
    span(s.sample, { style: () => ({ color: theme[fg], backgroundColor: theme[bg] }) }, "Aa"),
    span(name),
    strong(() => `${ratio().toFixed(2)}:1`),
    span(() => cx(s.verdict, ratio() >= 4.5 ? s.pass : s.fail), () => (ratio() >= 4.5 ? "AA ✓" : "fails")),
  );
}

function ColorField(key: ColorKey) {
  return label(
    s.color,
    input({ type: "color", value: () => theme[key] }, { onInput: (e) => set(key, e.currentTarget.value) }),
    span(COLORS[key]),
    input(s.hex, { "aria-label": `${COLORS[key]} hex`, spellcheck: false, value: () => theme[key] }, {
      // Only a complete #rrggbb reaches the theme; leaving the field puts the last good one back.
      onInput: (e) => { if (/^#[0-9a-f]{6}$/i.test(e.currentTarget.value)) set(key, e.currentTarget.value); },
      onChange: (e) => { e.currentTarget.value = theme[key]; },
    }),
  );
}

// `value` comes last: a range clamps it to the min, max and step already set.
function Range(name: string, key: "radius" | "density" | "shadow", min: string, max: string, step: string, show: (v: number) => string) {
  return label(
    s.field,
    span(name),
    input({ type: "range", min, max, step, value: () => String(theme[key]) }, { onInput: (e) => set(key, Number(e.currentTarget.value)) }),
    span(s.value, () => show(theme[key])),
  );
}

function Panel() {
  return aside(
    s.panel,
    div(
      s.head,
      strong("Theme"),
      button(() => cx(s.btn, exporting && s.active), "Export", { "aria-pressed": () => String(exporting), onClick: () => { exporting = !exporting; update(); } }),
    ),
    p(s.hint, "The preview's classes were compiled once. These controls only rewrite the CSS variables those classes read."),
    when(
      () => exporting,
      div(
        s.group,
        div(s.head, h3(s.label, "CSS variables"), button(s.btn, () => copyLabel, { onClick: copy })),
        pre(s.pre, () => variables(":root")),
      ),
    ),
    div(
      s.group,
      h3(s.label, "Presets"),
      div(
        s.row,
        ...(Object.keys(PRESETS) as Preset[]).map((name) =>
          button(() => cx(s.btn, preset === name && s.active), name, { "aria-pressed": () => String(preset === name), onClick: () => apply(name) }),
        ),
        button(s.btn, "Reset", { title: "Drop your edits: back to the preset", onClick: () => apply(preset) }),
      ),
    ),
    div(s.group, h3(s.label, "Colors"), ...(Object.keys(COLORS) as ColorKey[]).map(ColorField)),
    div(s.group, h3(s.label, "Contrast"), Contrast("Text on background", "text", "background"), Contrast("Label on primary", "onPrimary", "primary")),
    div(
      s.group,
      h3(s.label, "Shape and type"),
      Range("Radius", "radius", "0", "24", "1", (v) => `${v}px`),
      Range("Density", "density", "0.75", "1.5", "0.05", (v) => `${v}×`),
      Range("Shadow", "shadow", "0", "60", "1", (v) => `${v}%`),
      label(
        s.field,
        span("Font"),
        select(s.select, { value: () => theme.font }, { onChange: (e) => set("font", e.currentTarget.value as Theme["font"]) }, ...Object.keys(FONTS).map((font) => option({ value: font }, font))),
      ),
    ),
  );
}

export function ThemeEditor() {
  return div(
    s.app,
    on("destroy", () => { clearTimeout(copyTimer); copyLabel = "Copy"; }),
    Panel(),
    section(
      s.preview,
      { "data-te-preview": "", "aria-label": "Preview" },
      // The live theme: one <style> with one dynamic text. An inline style
      // object can't set custom properties, so the variables are written as CSS.
      style(() => variables("[data-te-preview]")),
      Gallery(),
    ),
  );
}
