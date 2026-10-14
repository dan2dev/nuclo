// GUI controls. Each one edits a single CSS property on the selected rule
// through a tiny get/set pair, so controls know nothing about the rule list,
// the selection, or the code pane.
import "nuclo";
import { fmt, joinSides, nudge, parseLen, splitSides, withUnit, type Sides } from "./css.ts";
import { cx, s } from "./theme.ts";

export type Bind = { get(): string | undefined; set(v: string): void };

type LengthDef = {
  kind: "length"; prop: string; label: string;
  units?: string[]; keywords?: string[];
  /** px slider range (also the fallback for other units). */
  min?: number; max?: number; step?: number;
  /** [min, max, step] for the unitless slider (opacity, line-height, z-index). */
  unitless?: [number, number, number];
};
type BoxDef = { kind: "box"; prop: string; label: string; sides: [string, string, string, string] };
export type Def =
  | LengthDef
  | BoxDef
  | { kind: "color"; prop: string; label: string }
  | { kind: "select"; prop: string; label: string; options: string[] }
  | { kind: "seg"; prop: string; label: string; options: string[] }
  | { kind: "text"; prop: string; label: string; suggestions?: string[]; placeholder?: string };

export type Group = { name: string; open?: boolean; defs: Def[] };

export function control(def: Def, b: Bind) {
  switch (def.kind) {
    case "length": return lengthCtl(def, b);
    case "box": return boxCtl(def, b);
    case "color": return colorCtl(def, b);
    case "select": return selectCtl(def, b);
    case "seg": return segCtl(def, b);
    case "text": return textCtl(def, b);
  }
}

// ── shared bits ──────────────────────────────────────────────────────────────

/** View flags shared by every control (toggled from the editor head). */
export const view = { onlySet: false };

const row = (prop: string, label: string, b: Bind, ...body: NodeModLike<"div">[]) =>
  div(
    s.row,
    { "data-prop": prop, hidden: () => view.onlySet && b.get() === undefined },
    span(s.label, { title: prop }, label),
    div(s.ctl, ...body),
  );

/** "×" that removes the declaration; invisible (but keeps its space) while there is nothing to remove. */
const clearBtn = (b: Bind) =>
  button(
    { type: "button", title: "Remove declaration", "aria-label": "Remove declaration", onClick: () => b.set("") },
    () => cx(s.iconBtn, b.get() === undefined && s.ghost),
    "×",
  );

/** ↑/↓ nudge the number in a text field, shift = ×10. Non-numeric values are left alone. */
const arrowKeys = (step: () => number, apply: (v: string) => void) =>
  (e: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    const dir = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    apply(nudge(e.currentTarget.value, dir * step() * (e.shiftKey ? 10 : 1)));
  };

/** `list` is read-only on HTMLInputElement, so the datalist is wired through the attribute. */
export const listAttr = (id: string) => (el: ExpandedElement<"input">) => { el.setAttribute?.("list", id); };

// ── length: slider + value + unit ────────────────────────────────────────────

const LEN_UNITS = ["px", "%", "em", "rem", "vw", "vh"];

function sliderRange(def: LengthDef, unit: string): [number, number, number] {
  switch (unit) {
    case "": return def.unitless ?? [def.min ?? 0, def.max ?? 100, def.step ?? 1];
    case "px": return [def.min ?? 0, def.max ?? 200, def.step ?? 1];
    case "em": case "rem": return [(def.min ?? 0) < 0 ? -2 : 0, 8, 0.05];
    case "deg": return [0, 360, 1];
    case "s": return [0, 3, 0.05];
    case "ms": return [0, 3000, 50];
    default: return [0, 100, 1]; // %, vw, vh
  }
}

function lengthCtl(def: LengthDef, b: Bind) {
  const units = def.units ?? LEN_UNITS;
  const len = () => parseLen(b.get());
  const unit = () => len()?.unit ?? units[0];
  const range = () => sliderRange(def, unit());
  return row(
    def.prop,
    def.label,
    b,
    input(s.slider, {
      type: "range", "aria-label": `${def.label} slider`,
      min: () => String(range()[0]), max: () => String(range()[1]), step: () => String(range()[2]),
      value: () => String(len()?.n ?? range()[0]),
      // Only a non-numeric value (auto, calc(), var()) disables the slider; an unset value starts at the default unit.
      disabled: () => b.get() !== undefined && !len(),
      onInput: (e) => b.set(fmt(Number(e.currentTarget.value), unit())),
    }),
    input(cx(s.field, s.num), {
      type: "text", inputMode: "decimal", "aria-label": def.label, placeholder: "–",
      value: () => b.get() ?? "",
      onInput: (e) => b.set(e.currentTarget.value),
      onChange: (e) => b.set(withUnit(e.currentTarget.value, units[0])),
      onKeyDown: arrowKeys(() => range()[2], b.set),
    }),
    select(
      cx(s.field, s.select, s.unit),
      {
        "aria-label": `${def.label} unit`,
        onChange: (e) => { const u = e.currentTarget.value; b.set(units.includes(u) ? fmt(len()?.n ?? 0, u) : u); },
      },
      ...units.map((u) => option({ value: u, selected: () => !!len() && unit() === u }, u || "num")),
      ...(def.keywords ?? []).map((k) => option({ value: k, selected: () => b.get() === k }, k)),
    ),
    clearBtn(b),
  );
}

// ── color: swatch picker + free text ─────────────────────────────────────────

const ctx = document.createElement("canvas").getContext("2d");

/** Normalise any color the browser understands (names, rgb(), hsl()) to #rrggbb for <input type=color>. */
export function toHex(v: string | undefined) {
  if (!ctx || !v) return "#000000";
  ctx.fillStyle = "#000000";
  ctx.fillStyle = v;
  const r = String(ctx.fillStyle);
  if (r.startsWith("#")) return r;
  const m = r.match(/\d+/g);
  return m ? `#${m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : "#000000";
}

function colorCtl(def: { prop: string; label: string }, b: Bind) {
  return row(
    def.prop,
    def.label,
    b,
    span(
      s.swatch,
      span(s.swatchFill, { style: () => ({ background: b.get() ?? "transparent" }) }),
      input(s.colorInput, {
        type: "color", "aria-label": `${def.label} picker`,
        value: () => toHex(b.get()),
        onInput: (e) => b.set(e.currentTarget.value),
      }),
    ),
    input(cx(s.field, s.mono), {
      type: "text", "aria-label": def.label, placeholder: "none",
      value: () => b.get() ?? "",
      onInput: (e) => b.set(e.currentTarget.value),
    }),
    clearBtn(b),
  );
}

// ── select / segmented ───────────────────────────────────────────────────────

/** The current value when it is not one of the predefined options (typed in the code pane). */
const otherValue = (b: Bind, options: string[]) => {
  const v = b.get();
  return v !== undefined && !options.includes(v) ? v : "";
};

function selectCtl(def: { prop: string; label: string; options: string[] }, b: Bind) {
  const other = () => otherValue(b, def.options);
  return row(
    def.prop,
    def.label,
    b,
    select(
      cx(s.field, s.select),
      { "aria-label": def.label, onChange: (e) => b.set(e.currentTarget.value) },
      option({ value: "", selected: () => b.get() === undefined }, "—"),
      ...def.options.map((o) => option({ value: o, selected: () => b.get() === o }, o)),
      option({ value: () => other(), hidden: () => !other(), selected: () => !!other() }, () => other()),
    ),
    clearBtn(b),
  );
}

function segCtl(def: { prop: string; label: string; options: string[] }, b: Bind) {
  const other = () => otherValue(b, def.options);
  const idx = () => def.options.indexOf(b.get() ?? "");
  return row(
    def.prop,
    def.label,
    b,
    div(
      s.seg,
      {
        role: "radiogroup", "aria-label": def.label,
        // ←/→ move between options like native radios; the active (or first) option is the only tab stop.
        onKeyDown: (e) => {
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const n = def.options.length;
          const j = ((Math.max(idx(), 0) + d) % n + n) % n;
          b.set(def.options[j]);
          e.currentTarget.querySelectorAll("button")[j]?.focus();
        },
      },
      ...def.options.map((o, i) =>
        button(
          {
            type: "button", role: "radio",
            "aria-checked": () => String(b.get() === o),
            tabIndex: () => (idx() === i || (idx() < 0 && i === 0) ? 0 : -1),
            onClick: () => b.set(b.get() === o ? "" : o),
          },
          () => cx(s.segBtn, b.get() === o && s.segOn),
          o,
        ),
      ),
      when(() => !!other(), span(cx(s.segBtn, s.segOn), () => other())),
    ),
    clearBtn(b),
  );
}

// ── text with suggestions ────────────────────────────────────────────────────

function textCtl(def: { prop: string; label: string; suggestions?: string[]; placeholder?: string }, b: Bind) {
  const id = `dl-${def.prop}`;
  return row(
    def.prop,
    def.label,
    b,
    input(
      cx(s.field, s.mono),
      {
        type: "text", "aria-label": def.label, placeholder: def.placeholder ?? "",
        value: () => b.get() ?? "",
        onInput: (e) => b.set(e.currentTarget.value),
      },
      ...(def.suggestions ? [listAttr(id)] : []),
    ),
    ...(def.suggestions ? [datalist({ id }, ...def.suggestions.map((v) => option({ value: v })))] : []),
    clearBtn(b),
  );
}

// ── box: four sides of a shorthand, optionally linked ───────────────────────

const linkIcon = () =>
  svgSvg(
    { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
    pathSvg({ d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }),
  );

function boxCtl(def: BoxDef, b: Bind) {
  let linked = false;
  const sides = () => splitSides(b.get());
  const write = (i: number, v: string) => {
    const cur: Sides = sides() ?? ["", "", "", ""];
    if (linked) cur.fill(v);
    else cur[i] = v;
    b.set(joinSides(cur));
  };
  return row(
    def.prop,
    def.label,
    b,
    when(
      () => sides() !== null,
      div(
        s.boxGrid,
        ...def.sides.map((cap, i) =>
          div(
            s.boxCell,
            input(cx(s.field, s.num, s.boxNum), {
              type: "text", inputMode: "decimal", "aria-label": `${def.label} ${cap}`, placeholder: "–",
              value: () => sides()?.[i] ?? "",
              onInput: (e) => write(i, e.currentTarget.value),
              onChange: (e) => write(i, withUnit(e.currentTarget.value, "px")),
              onKeyDown: arrowKeys(() => 1, (v) => write(i, v)),
            }),
            span(s.boxCap, cap),
          ),
        ),
      ),
      button(
        { type: "button", title: "Edit all sides together", "aria-pressed": () => String(linked), onClick: () => { linked = !linked; update(); } },
        () => cx(s.iconBtn, linked && s.iconOn),
        linkIcon(),
      ),
    ).else(
      // calc(), var(), "a / b" radii… — anything we can't split is edited as one value.
      input(cx(s.field, s.mono), { type: "text", "aria-label": def.label, value: () => b.get() ?? "", onInput: (e) => b.set(e.currentTarget.value) }),
    ),
    clearBtn(b),
  );
}

// ── the property catalogue ───────────────────────────────────────────────────
// Anything not listed here is still editable in the "All declarations" table.

const FONTS = [
  "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  "Inter, system-ui, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Playfair Display', Georgia, serif",
  "ui-monospace, SFMono-Regular, Menlo, monospace",
  "'Courier New', monospace",
  "Verdana, Geneva, sans-serif",
];

export const GROUPS: Group[] = [
  {
    name: "Layout", open: true, defs: [
      { kind: "seg", prop: "display", label: "Display", options: ["block", "flex", "grid", "inline-flex", "inline-block", "none"] },
      { kind: "seg", prop: "flex-direction", label: "Direction", options: ["row", "column", "row-reverse", "column-reverse"] },
      { kind: "select", prop: "justify-content", label: "Justify", options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] },
      { kind: "select", prop: "align-items", label: "Align", options: ["stretch", "flex-start", "center", "flex-end", "baseline"] },
      { kind: "seg", prop: "flex-wrap", label: "Wrap", options: ["nowrap", "wrap"] },
      { kind: "length", prop: "gap", label: "Gap", max: 80 },
      { kind: "text", prop: "grid-template-columns", label: "Grid cols", suggestions: ["repeat(2, 1fr)", "repeat(3, 1fr)", "repeat(auto-fill, minmax(200px, 1fr))", "1fr 2fr", "240px 1fr"], placeholder: "repeat(3, 1fr)" },
      { kind: "select", prop: "position", label: "Position", options: ["static", "relative", "absolute", "fixed", "sticky"] },
      { kind: "box", prop: "inset", label: "Inset", sides: ["top", "right", "bottom", "left"] },
      { kind: "length", prop: "z-index", label: "Z-index", units: [""], unitless: [-10, 100, 1] },
      { kind: "select", prop: "overflow", label: "Overflow", options: ["visible", "hidden", "auto", "scroll", "clip"] },
    ],
  },
  {
    name: "Size", open: true, defs: [
      { kind: "length", prop: "width", label: "Width", keywords: ["auto", "fit-content", "max-content"], max: 800 },
      { kind: "length", prop: "height", label: "Height", keywords: ["auto", "fit-content"], max: 800 },
      { kind: "length", prop: "min-width", label: "Min width", max: 800 },
      { kind: "length", prop: "max-width", label: "Max width", keywords: ["none"], max: 1200 },
      { kind: "length", prop: "min-height", label: "Min height", max: 800 },
      { kind: "length", prop: "max-height", label: "Max height", keywords: ["none"], max: 1200 },
      { kind: "seg", prop: "box-sizing", label: "Box sizing", options: ["content-box", "border-box"] },
    ],
  },
  {
    name: "Spacing", open: true, defs: [
      { kind: "box", prop: "margin", label: "Margin", sides: ["top", "right", "bottom", "left"] },
      { kind: "box", prop: "padding", label: "Padding", sides: ["top", "right", "bottom", "left"] },
    ],
  },
  {
    name: "Typography", open: true, defs: [
      { kind: "text", prop: "font-family", label: "Font", suggestions: FONTS, placeholder: "system-ui, sans-serif" },
      { kind: "length", prop: "font-size", label: "Size", units: ["px", "rem", "em", "%"], min: 8, max: 96 },
      { kind: "select", prop: "font-weight", label: "Weight", options: ["100", "200", "300", "400", "500", "600", "700", "800", "900", "normal", "bold"] },
      { kind: "length", prop: "line-height", label: "Line height", units: ["", "px", "em", "rem"], unitless: [0.8, 3, 0.05], max: 80 },
      { kind: "length", prop: "letter-spacing", label: "Tracking", units: ["px", "em", "rem"], min: -4, max: 20, step: 0.1 },
      { kind: "color", prop: "color", label: "Color" },
      { kind: "seg", prop: "text-align", label: "Align", options: ["left", "center", "right", "justify"] },
      { kind: "seg", prop: "font-style", label: "Style", options: ["normal", "italic"] },
      { kind: "seg", prop: "text-transform", label: "Case", options: ["none", "uppercase", "lowercase", "capitalize"] },
      { kind: "seg", prop: "text-decoration", label: "Decoration", options: ["none", "underline", "line-through"] },
      { kind: "select", prop: "white-space", label: "Wrapping", options: ["normal", "nowrap", "pre", "pre-wrap", "pre-line"] },
    ],
  },
  {
    name: "Background", defs: [
      { kind: "color", prop: "background-color", label: "Color" },
      { kind: "text", prop: "background-image", label: "Image", suggestions: ["linear-gradient(135deg, #6366f1, #2dd4bf)", "linear-gradient(180deg, #ffffff, #f1f5f9)", "radial-gradient(circle at top, #fde68a, #f97316)", "url(https://picsum.photos/400)"], placeholder: "linear-gradient(…) or url(…)" },
      { kind: "select", prop: "background-size", label: "Size", options: ["auto", "cover", "contain"] },
      { kind: "select", prop: "background-position", label: "Position", options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"] },
      { kind: "select", prop: "background-repeat", label: "Repeat", options: ["repeat", "no-repeat", "repeat-x", "repeat-y"] },
    ],
  },
  {
    name: "Border", defs: [
      { kind: "length", prop: "border-width", label: "Width", max: 20 },
      { kind: "select", prop: "border-style", label: "Style", options: ["none", "solid", "dashed", "dotted", "double"] },
      { kind: "color", prop: "border-color", label: "Color" },
      { kind: "box", prop: "border-radius", label: "Radius", sides: ["tl", "tr", "br", "bl"] },
      { kind: "text", prop: "outline", label: "Outline", suggestions: ["2px solid #6366f1", "1px dashed currentColor", "none"], placeholder: "2px solid #6366f1" },
      { kind: "length", prop: "outline-offset", label: "Offset", min: -8, max: 16 },
    ],
  },
  {
    name: "Effects", defs: [
      { kind: "length", prop: "opacity", label: "Opacity", units: [""], unitless: [0, 1, 0.01] },
      { kind: "text", prop: "box-shadow", label: "Shadow", suggestions: ["0 1px 2px rgba(0, 0, 0, 0.08)", "0 4px 12px rgba(0, 0, 0, 0.12)", "0 10px 30px rgba(15, 23, 42, 0.18)", "0 0 0 3px rgba(99, 102, 241, 0.35)", "inset 0 2px 4px rgba(0, 0, 0, 0.15)", "none"], placeholder: "0 4px 12px rgba(0, 0, 0, 0.12)" },
      { kind: "text", prop: "transform", label: "Transform", suggestions: ["translateY(-2px)", "scale(1.05)", "rotate(3deg)", "translateX(4px) scale(1.02)", "none"], placeholder: "scale(1.05)" },
      { kind: "text", prop: "transition", label: "Transition", suggestions: ["all .2s ease", "background-color .15s ease, transform .1s ease", "opacity .3s", "none"], placeholder: "all .2s ease" },
      { kind: "text", prop: "filter", label: "Filter", suggestions: ["blur(4px)", "grayscale(1)", "brightness(1.1)", "saturate(1.4)", "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))", "none"], placeholder: "blur(4px)" },
      { kind: "text", prop: "backdrop-filter", label: "Backdrop", suggestions: ["blur(8px)", "blur(12px) saturate(1.4)", "none"], placeholder: "blur(8px)" },
      { kind: "select", prop: "cursor", label: "Cursor", options: ["auto", "default", "pointer", "text", "move", "grab", "not-allowed", "crosshair", "zoom-in"] },
      { kind: "seg", prop: "visibility", label: "Visibility", options: ["visible", "hidden"] },
      { kind: "seg", prop: "pointer-events", label: "Pointer", options: ["auto", "none"] },
      { kind: "select", prop: "user-select", label: "Select", options: ["auto", "none", "text", "all"] },
    ],
  },
];

// ── lookups shared with the palettes ─────────────────────────────────────────

export const DEFS = new Map<string, Def>(GROUPS.flatMap((g) => g.defs.map((d): [string, Def] => [d.prop, d])));
export const GROUP_OF = new Map<string, string>(GROUPS.flatMap((g) => g.defs.map((d): [string, string] => [d.prop, g.name])));

/** Value suggestions for a property: the control's own options, keywords or presets, then the generic keywords. */
export function valueOptions(prop: string) {
  const d = DEFS.get(prop);
  const own = !d ? []
    : d.kind === "select" || d.kind === "seg" ? d.options
    : d.kind === "length" ? (d.keywords ?? [])
    : d.kind === "text" ? (d.suggestions ?? [])
    : [];
  return [...own, "inherit", "initial", "unset"];
}

/** The unit a bare number gets for this property. */
export function defaultUnit(prop: string) {
  const d = DEFS.get(prop);
  return d?.kind === "length" ? (d.units ?? LEN_UNITS)[0] : "px";
}

/** Emmet-style abbreviations the property palette expands. */
export const ALIASES: Record<string, string> = {
  bg: "background-color", bgi: "background-image", c: "color", d: "display", p: "padding", m: "margin",
  w: "width", h: "height", minw: "min-width", maxw: "max-width", minh: "min-height", maxh: "max-height",
  fs: "font-size", fw: "font-weight", ff: "font-family", lh: "line-height", ls: "letter-spacing",
  ta: "text-align", td: "text-decoration", tt: "text-transform",
  br: "border-radius", bw: "border-width", bs: "border-style", bc: "border-color", bsh: "box-shadow",
  op: "opacity", pos: "position", z: "z-index", g: "gap", jc: "justify-content", ai: "align-items", fd: "flex-direction",
  cur: "cursor", tr: "transition", tf: "transform", ov: "overflow",
};

/** Starting points for a new class. */
export const PRESETS: { name: string; decls: [string, string][] }[] = [
  { name: "button", decls: [["display", "inline-flex"], ["align-items", "center"], ["justify-content", "center"], ["gap", "8px"], ["padding", "10px 18px"], ["border-radius", "10px"], ["border-width", "0"], ["background-color", "#6366f1"], ["color", "#ffffff"], ["font-size", "14px"], ["font-weight", "600"], ["cursor", "pointer"], ["transition", "background-color .15s ease, transform .1s ease"]] },
  { name: "card", decls: [["display", "flex"], ["flex-direction", "column"], ["gap", "12px"], ["padding", "24px"], ["background-color", "#ffffff"], ["border-radius", "16px"], ["border-width", "1px"], ["border-style", "solid"], ["border-color", "#e5e7eb"], ["box-shadow", "0 10px 30px rgba(15, 23, 42, 0.08)"]] },
  { name: "badge", decls: [["display", "inline-block"], ["padding", "2px 10px"], ["border-radius", "999px"], ["background-color", "#ecfeff"], ["color", "#0e7490"], ["font-size", "12px"], ["font-weight", "600"], ["letter-spacing", "0.02em"], ["text-transform", "uppercase"]] },
  { name: "input", decls: [["display", "block"], ["width", "100%"], ["padding", "10px 12px"], ["border-radius", "8px"], ["border-width", "1px"], ["border-style", "solid"], ["border-color", "#d1d5db"], ["background-color", "#ffffff"], ["color", "#111827"], ["font-size", "14px"], ["outline", "none"]] },
  { name: "heading", decls: [["font-size", "28px"], ["font-weight", "800"], ["line-height", "1.2"], ["letter-spacing", "-0.02em"], ["color", "#0f172a"]] },
  { name: "muted text", decls: [["font-size", "13px"], ["line-height", "1.5"], ["color", "#6b7280"]] },
  { name: "flex row", decls: [["display", "flex"], ["align-items", "center"], ["gap", "12px"]] },
  { name: "flex column", decls: [["display", "flex"], ["flex-direction", "column"], ["gap", "12px"]] },
  { name: "grid", decls: [["display", "grid"], ["grid-template-columns", "repeat(auto-fill, minmax(200px, 1fr))"], ["gap", "16px"]] },
];
