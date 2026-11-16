/**
 * nuclo-core's style objects, read as the native Style: short keys, CSS strings, pseudo-class keys, @media blocks,
 * theme tokens and animations become the native keys every runtime implements.
 *
 * Two readers share it. The web runtime runs an app's style objects as they are, so it calls normalizeStyle() on
 * them; the compiler reads the same values ahead of time where a style writes them as literals (lowerEntry()), and
 * reports what it can't. Nothing here touches the DOM or the TypeScript compiler.
 */

/** The native Style keys, in the order the Swift and Kotlin `Style` initializers declare them. */
export const NATIVE_STYLE_KEYS = [
  "flexDirection", "alignItems", "alignSelf", "justifyContent", "flexWrap", "flex", "gap",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "width", "widthPct", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "aspectRatio",
  "overflow", "position", "top", "right", "bottom", "left", "zIndex", "display",
  "backgroundColor", "color", "opacity", "borderRadius", "borderWidth", "borderColor",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
  "shadowColor", "shadowRadius", "shadowOffsetX", "shadowOffsetY",
  "fontSize", "fontWeight", "fontStyle", "fontFamily", "lineHeight", "letterSpacing", "textAlign", "textDecoration", "textTransform",
  "numberOfLines", "placeholderColor", "objectFit", "pointerEvents",
  "translateX", "translateY", "scale", "rotate", "transitionDuration", "transitionDelay", "transitionEasing",
  "animation", "media",
  "pressed", "hover", "focused", "disabled", "enabled", "checked", "placeholderShown", "first", "last", "only", "odd", "even", "empty",
] as const;

/** Native keys whose value is a style merged while a state holds. */
export const STATE_KEYS = new Set(["pressed", "hover", "focused", "disabled", "enabled", "checked", "placeholderShown", "first", "last", "only", "odd", "even", "empty"]);

/** CSS state keys → the native state they are. */
export const STATE_ALIASES: Record<string, string> = {
  pressed: "pressed", active: "pressed", hover: "hover",
  focused: "focused", focus: "focused", focusVisible: "focused", focusWithin: "focused",
  disabled: "disabled", enabled: "enabled", checked: "checked", placeholderShown: "placeholderShown",
  first: "first", last: "last", only: "only", odd: "odd", even: "even", empty: "empty",
};

/** `&:…` selectors → state keys. */
const SELECTORS: Record<string, string> = {
  ":hover": "hover", ":active": "pressed", ":focus": "focused", ":focus-visible": "focused", ":focus-within": "focused",
  ":disabled": "disabled", ":enabled": "enabled", ":checked": "checked", ":placeholder-shown": "placeholderShown", "::placeholder": "placeholder",
  ":first-child": "first", ":last-child": "last", ":only-child": "only", ":empty": "empty",
  ":nth-child(odd)": "odd", ":nth-child(2n+1)": "odd", ":nth-child(even)": "even", ":nth-child(2n)": "even",
};

/** nuclo-core's pseudo keys that have no native counterpart: a style using one is reported, not half-applied. */
export const UNSUPPORTED_PSEUDOS = new Set(["visited", "required", "invalid", "valid", "readOnly", "before", "after", "selection", "marker", "firstLine", "firstLetter"]);

/** nuclo-core's short keys (`px`, `bg`, `rounded`…) and the keys they stand for. */
export const STYLE_ALIASES: Record<string, string[]> = {
  p: ["padding"], px: ["paddingLeft", "paddingRight"], py: ["paddingTop", "paddingBottom"],
  pt: ["paddingTop"], pr: ["paddingRight"], pb: ["paddingBottom"], pl: ["paddingLeft"],
  m: ["margin"], mx: ["marginLeft", "marginRight"], my: ["marginTop", "marginBottom"],
  mt: ["marginTop"], mr: ["marginRight"], mb: ["marginBottom"], ml: ["marginLeft"],
  w: ["width"], h: ["height"], minW: ["minWidth"], maxW: ["maxWidth"], minH: ["minHeight"], maxH: ["maxHeight"],
  size: ["width", "height"], text: ["fontSize"], font: ["fontFamily"], weight: ["fontWeight"], leading: ["lineHeight"], tracking: ["letterSpacing"],
  align: ["textAlign"], items: ["alignItems"], justify: ["justifyContent"], z: ["zIndex"], bg: ["backgroundColor"], background: ["backgroundColor"],
  rounded: ["borderRadius"], shadow: ["boxShadow"], select: ["userSelect"], flexGrow: ["flex"],
  inset: ["top", "right", "bottom", "left"], overflowX: ["overflow"], overflowY: ["overflow"], transitionTimingFunction: ["transitionEasing"],
};

/** Composite flags (`row: true`): the native keys and values they set. */
export const STYLE_FLAGS: Record<string, [string, string | number][]> = {
  row: [["flexDirection", "row"]],
  col: [["flexDirection", "column"]],
  center: [["alignItems", "center"], ["justifyContent", "center"]],
  truncate: [["numberOfLines", 1]],
};

/** CSS keys natively decided by the platform: accepted and dropped (the web runtime drops them too, for the same boxes). */
export const IGNORED_KEYS = new Set(["flexShrink", "flexBasis", "cursor", "userSelect", "boxSizing", "outline", "appearance", "willChange", "touchAction", "textOverflow"]);

/** Native keys holding a number of points. */
const SIZE_KEYS = new Set([
  "gap", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "top", "right", "bottom", "left", "fontSize", "letterSpacing",
  "borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderRadius",
]);
const NUMBER_KEYS = new Set(["shadowRadius", "shadowOffsetX", "shadowOffsetY", "numberOfLines", "translateX", "translateY", "scale", "rotate"]);
/** Native keys holding a colour (theme `colors` tokens apply). */
export const COLOR_KEYS = new Set([
  "backgroundColor", "color", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "shadowColor", "placeholderColor",
]);
/** Native keys whose value is one of a few words. */
export const ENUM_VALUES: Record<string, Record<string, string>> = {
  flexDirection: { row: "row", column: "column" },
  alignItems: { "flex-start": "flex-start", center: "center", "flex-end": "flex-end", stretch: "stretch", start: "flex-start", end: "flex-end", baseline: "flex-start" },
  alignSelf: { "flex-start": "flex-start", center: "center", "flex-end": "flex-end", stretch: "stretch", start: "flex-start", end: "flex-end", baseline: "flex-start" },
  justifyContent: {
    "flex-start": "flex-start", center: "center", "flex-end": "flex-end", "space-between": "space-between", "space-around": "space-around",
    "space-evenly": "space-evenly", start: "flex-start", end: "flex-end", stretch: "flex-start",
  },
  flexWrap: { nowrap: "nowrap", wrap: "wrap" },
  overflow: { visible: "visible", hidden: "hidden", scroll: "scroll", auto: "scroll", clip: "hidden" },
  position: { relative: "relative", absolute: "absolute", static: "relative" },
  display: { flex: "flex", none: "none", block: "flex", inline: "flex", "inline-block": "flex", "inline-flex": "flex" },
  fontWeight: {
    normal: "normal", bold: "bold", lighter: "light", bolder: "bold", light: "light", medium: "medium", semibold: "semibold",
    "100": "light", "200": "light", "300": "light", "400": "normal", "500": "medium", "600": "semibold", "700": "bold", "800": "bold", "900": "bold",
  },
  fontStyle: { normal: "normal", italic: "italic", oblique: "italic" },
  textAlign: { left: "left", center: "center", right: "right", start: "left", end: "right", justify: "left" },
  textDecoration: { none: "none", underline: "underline", "line-through": "line-through" },
  textTransform: { none: "none", uppercase: "uppercase", lowercase: "lowercase", capitalize: "capitalize" },
  transitionEasing: { linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "spring" },
  objectFit: { cover: "cover", contain: "contain", fill: "fill", "scale-down": "contain", none: "cover" },
  pointerEvents: { auto: "auto", none: "none" },
};

export interface Theme {
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  shadows?: Record<string, string>;
  radii?: Record<string, string | number>;
  screens?: Record<string, string>;
}

/** A style merged while the window's width is in [min, max]. */
export interface MediaRule {
  min?: number;
  max?: number;
  style: NativeStyle;
}

export interface KeyframeStop {
  /** 0…1. */
  at: number;
  style: NativeStyle;
}

export interface Animation {
  name: string;
  frames: KeyframeStop[];
  /** Milliseconds. */
  duration: number;
  delay: number;
  easing: string;
  /** -1: forever. */
  iterations: number;
  alternate: boolean;
}

export type NativeStyle = Record<string, unknown>;

/** What lowerEntry() could not read: the message names the key and the value. */
export class StyleError extends Error {}

const fail = (message: string): never => {
  throw new StyleError(message);
};

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** `12`, `"12px"`, `"1.5rem"` / `"1.5em"` (16 points each), `"0"` → points; `"auto"` → undefined. */
export function parseLength(value: unknown, key = "a length"): number | undefined {
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (text === "auto" || text === "") return undefined;
  const m = /^(-?\d*\.?\d+)(px|rem|em|pt)?$/.exec(text);
  if (!m) return fail(`${key}: "${text}" is not a length natively (points, "12px" or "1rem").`);
  const n = Number(m[1]);
  return m[2] === "rem" || m[2] === "em" ? n * 16 : n;
}

/** `"200ms"`, `"0.2s"`, `200` → milliseconds. */
export function parseTime(value: unknown): number {
  if (typeof value === "number") return value;
  const m = /^(-?\d*\.?\d+)(ms|s)$/.exec(String(value).trim());
  if (!m) return fail(`"${String(value)}" is not a time ("200ms" or "0.2s").`);
  return Number(m[1]) * (m[2] === "s" ? 1000 : 1);
}

const isTime = (word: string) => /^-?\d*\.?\d+(ms|s)$/.test(word);
const EASINGS = new Set(["linear", "ease", "ease-in", "ease-out", "ease-in-out"]);
/** `cubic-bezier()` and `steps()` are the nearest named curve natively. */
const easingOf = (word: string) => (EASINGS.has(word) ? word : word.startsWith("cubic-bezier") || word.startsWith("steps") ? "ease" : undefined);

/** Splits on spaces outside parentheses: `"0 1px 3px rgba(0, 0, 0, .2)"` → 4 words. */
export function words(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text.trim()) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (current) out.push(current);
      current = "";
    } else current += ch;
  }
  if (current) out.push(current);
  return out;
}

/** Splits on commas outside parentheses. */
function commas(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(current.trim());
      current = "";
    } else current += ch;
  }
  out.push(current.trim());
  return out;
}

const isLength = (word: string) => /^-?\d*\.?\d+(px|rem|em|pt)?$/.test(word);
const BORDER_STYLES = new Set(["solid", "none", "hidden", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"]);

/** `"1px solid #e5e7eb"` (any order, any part left out) → width and colour; `none` / `0` → no border. */
export function parseBorder(text: string): { width?: number; color?: string } {
  const out: { width?: number; color?: string } = {};
  for (const word of words(text)) {
    if (isLength(word)) out.width = parseLength(word);
    else if (BORDER_STYLES.has(word)) {
      if (word === "none" || word === "hidden") out.width = 0;
      else out.width ??= 3; // CSS's `medium`
    } else out.color = word;
  }
  return out;
}

/** `"0 1px 3px rgba(0,0,0,.2)"` → the first shadow's offset, blur and colour; `none` → no shadow. */
export function parseShadow(text: string): { x: number; y: number; blur: number; color?: string } {
  const first = commas(text)[0] ?? "";
  if (first === "none") return { x: 0, y: 0, blur: 0, color: "transparent" };
  const lengths: number[] = [];
  let color: string | undefined;
  for (const word of words(first)) {
    if (word === "inset") continue;
    if (isLength(word)) lengths.push(parseLength(word)!);
    else color = word;
  }
  return { x: lengths[0] ?? 0, y: lengths[1] ?? 0, blur: lengths[2] ?? 0, color };
}

/** `"translate(4px, -2px) rotate(45deg) scale(1.1)"` → the native transform keys. */
export function parseTransform(text: string): NativeStyle {
  const out: NativeStyle = {};
  if (text.trim() === "none") return { translateX: 0, translateY: 0, rotate: 0, scale: 1 };
  for (const m of text.matchAll(/([a-zA-Z0-9]+)\(([^)]*)\)/g)) {
    const fn = m[1]!;
    const args = m[2]!.split(/[\s,]+/).filter(Boolean);
    const length = (i: number) => parseLength(args[i] ?? "0") ?? 0;
    const angle = (word: string) => {
      const a = /^(-?\d*\.?\d+)(deg|turn|rad)?$/.exec(word);
      if (!a) return fail(`transform: "${word}" is not an angle.`);
      const n = Number(a[1]);
      return a[2] === "turn" ? n * 360 : a[2] === "rad" ? (n * 180) / Math.PI : n;
    };
    switch (fn) {
      case "translate":
        out.translateX = length(0);
        out.translateY = length(1);
        break;
      case "translateX":
        out.translateX = length(0);
        break;
      case "translateY":
        out.translateY = length(0);
        break;
      case "scale":
        out.scale = Number(args[0]);
        break;
      case "rotate":
        out.rotate = angle(args[0] ?? "0");
        break;
      default:
        fail(`transform: ${fn}() has no native equivalent (translate, translateX, translateY, scale and rotate do).`);
    }
  }
  return out;
}

/** `"opacity 200ms ease-out 50ms"` (the first transition of a list) → duration, easing and delay. */
export function parseTransition(text: string): NativeStyle {
  const out: NativeStyle = {};
  const times: number[] = [];
  for (const word of words(commas(text)[0] ?? "")) {
    if (isTime(word)) times.push(parseTime(word));
    else if (easingOf(word)) out.transitionEasing = easingOf(word);
  }
  out.transitionDuration = times[0] ?? 0;
  if (times[1] !== undefined) out.transitionDelay = times[1];
  return out;
}

/** `"(min-width: 768px)"`, `"(max-width: 600px)"`, both with `and`, after an optional `@media` / `screen and`. */
export function parseMedia(query: string): { min?: number; max?: number } {
  const text = query.replace(/^@media\s*/, "").replace(/^(only\s+)?(screen|all)\s+and\s+/, "").trim();
  const out: { min?: number; max?: number } = {};
  const parts = text.split(/\s+and\s+/);
  for (const part of parts) {
    const m = /^\(\s*(min|max)-width\s*:\s*([^)]+)\)$/.exec(part.trim());
    if (!m) return fail(`@media "${query}": only (min-width: …) and (max-width: …) have a native equivalent (the window's width).`);
    out[m[1] as "min" | "max"] = parseLength(m[2]!.trim())!;
  }
  return out;
}

/** A font stack's first family, without quotes; `system-ui` and its kin are the platform's sans-serif. */
export function firstFont(stack: string): string {
  const first = (commas(stack)[0] ?? "").replace(/^["']|["']$/g, "");
  return /^(system-ui|-apple-system|BlinkMacSystemFont|ui-sans-serif|Inter var)$/i.test(first) ? "sans-serif" : first === "ui-monospace" ? "monospace" : first === "ui-serif" ? "serif" : first;
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const token = (theme: Theme | undefined, group: keyof Theme, value: unknown) =>
  typeof value === "string" ? (theme?.[group] as Record<string, unknown> | undefined)?.[value] ?? value : value;

/**
 * One CSS key and its value (a string or number, not a nested style) → the native keys and values it sets.
 * Throws a StyleError for what has no native equivalent.
 */
export function lowerEntry(key: string, value: unknown, theme?: Theme): [string, unknown][] {
  if (value == null || value === false) return [];
  if (IGNORED_KEYS.has(key)) return [];
  const alias = STYLE_ALIASES[key];
  if (alias) return alias.flatMap((target) => lowerEntry(target, value, theme));
  const flag = STYLE_FLAGS[key];
  if (flag) return value === true ? flag : [];
  if (COLOR_KEYS.has(key)) return [[key, token(theme, "colors", value)]];
  if (key in ENUM_VALUES) {
    const word = ENUM_VALUES[key]![String(value)];
    if (key === "alignSelf" && value === "auto") return [];
    if (word === undefined) return fail(`${key}: "${String(value)}" has no native equivalent (${Object.keys(ENUM_VALUES[key]!).join(", ")}).`);
    return [[key, word]];
  }
  switch (key) {
    case "width":
      if (typeof value === "string" && value.trim().endsWith("%")) return [["widthPct", Number(value.trim().slice(0, -1))]];
      break;
    case "height":
    case "minWidth":
    case "maxWidth":
    case "minHeight":
    case "maxHeight":
      if (typeof value === "string" && value.trim().endsWith("%")) {
        // A box is never wider than its parent natively.
        if (value.trim() === "100%" && key === "maxWidth") return [];
        return fail(`${key}: "${value}": only width takes a percentage natively.`);
      }
      break;
    case "borderRadius": {
      const r = token(theme, "radii", value);
      if (typeof r === "string" && r.trim().endsWith("%")) return [["borderRadius", 9999]];
      return [["borderRadius", parseLength(r, key)]];
    }
    case "zIndex":
      return value === "auto" ? [] : [["zIndex", Number(value)]];
    case "flex": {
      if (typeof value === "number") return [["flex", value]];
      const text = String(value).trim();
      if (text === "auto") return [["flex", 1]];
      if (text === "none") return [["flex", 0]];
      const grow = Number(words(text)[0]);
      return Number.isNaN(grow) ? fail(`flex: "${text}" has no native equivalent.`) : [["flex", grow]];
    }
    case "opacity": {
      const text = String(value).trim();
      return [["opacity", text.endsWith("%") ? Number(text.slice(0, -1)) / 100 : Number(text)]];
    }
    case "aspectRatio": {
      if (typeof value === "number") return [["aspectRatio", value]];
      const [w, h] = String(value).split("/").map((part) => Number(part.trim()));
      return [["aspectRatio", h ? w! / h : w]];
    }
    case "lineHeight": {
      if (typeof value === "number") return [["lineHeight", value]];
      const text = String(value).trim();
      if (/^\d*\.?\d+$/.test(text)) return [["lineHeight", Number(text)]];
      if (text.endsWith("%")) return [["lineHeight", Number(text.slice(0, -1)) / 100]];
      return [["lineHeight", parseLength(text, key)]];
    }
    case "fontFamily":
      return [["fontFamily", firstFont(String(token(theme, "fonts", value)))]];
    case "visibility":
      return value === "hidden" ? [["opacity", 0], ["pointerEvents", "none"]] : [];
    case "whiteSpace":
      return value === "nowrap" || value === "pre" ? [["numberOfLines", 1]] : [];
    case "borderStyle":
      return value === "none" || value === "hidden" ? [["borderWidth", 0], ...SIDES.map((side): [string, unknown] => [`border${side}Width`, 0])] : [];
    case "border": {
      const b = parseBorder(String(value));
      return [
        ...(b.width !== undefined ? [["borderWidth", b.width] as [string, unknown]] : []),
        ...(b.color !== undefined ? [["borderColor", token(theme, "colors", b.color)] as [string, unknown]] : []),
      ];
    }
    case "borderTop":
    case "borderRight":
    case "borderBottom":
    case "borderLeft": {
      const b = parseBorder(String(value));
      return [
        ...(b.width !== undefined ? [[`${key}Width`, b.width] as [string, unknown]] : []),
        ...(b.color !== undefined ? [[`${key}Color`, token(theme, "colors", b.color)] as [string, unknown]] : []),
      ];
    }
    case "boxShadow": {
      const s = parseShadow(String(token(theme, "shadows", value)));
      return [["shadowOffsetX", s.x], ["shadowOffsetY", s.y], ["shadowRadius", s.blur], ...(s.color ? [["shadowColor", token(theme, "colors", s.color)] as [string, unknown]] : [])];
    }
    case "transform":
      return Object.entries(parseTransform(String(value)));
    case "transition":
      return Object.entries(parseTransition(String(value)));
    case "transitionDuration":
    case "transitionDelay":
      return [[key, parseTime(value)]];
  }
  if (SIZE_KEYS.has(key)) {
    const n = parseLength(value, key);
    return n === undefined ? [] : [[key, n]];
  }
  if (NUMBER_KEYS.has(key)) return [[key, Number(value)]];
  if (key === "numberOfLines") return [[key, Number(value)]];
  return fail(`The style key ${key} has no native equivalent.`);
}

const SIDES = ["Top", "Right", "Bottom", "Left"];

/** Keys a later shorthand in the same object resets, as the CSS cascade does within one rule. */
export const SHORTHAND_RESETS: Record<string, string[]> = {
  padding: SIDES.map((side) => `padding${side}`),
  margin: SIDES.map((side) => `margin${side}`),
  borderWidth: SIDES.map((side) => `border${side}Width`),
  borderColor: SIDES.map((side) => `border${side}Color`),
};

const camel = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** The keyframes() registry: name → its stops, written as native styles. */
const keyframeTable = new Map<string, KeyframeStop[]>();
let keyframeCount = 0;

/** `{ from: {…}, "50%": {…}, to: {…} }` → stops at 0…1, in order. */
export function keyframeStops(frames: Record<string, unknown>, theme?: Theme): KeyframeStop[] {
  const stops: KeyframeStop[] = [];
  for (const [selector, style] of Object.entries(frames)) {
    for (const part of selector.split(",")) {
      const p = part.trim();
      const at = p === "from" ? 0 : p === "to" ? 1 : Number(p.replace("%", "")) / 100;
      if (Number.isNaN(at)) fail(`keyframes: "${p}" is not a stop (from, to or a percentage).`);
      stops.push({ at, style: normalizeStyle(style as Record<string, unknown>, theme) });
    }
  }
  return stops.sort((a, b) => a.at - b.at);
}

export function registerKeyframes(frames: Record<string, unknown>, theme?: Theme): string {
  const name = `nk${++keyframeCount}`;
  keyframeTable.set(name, keyframeStops(frames, theme));
  return name;
}

export const keyframesNamed = (name: string) => keyframeTable.get(name);

/** `` `${name} 1s ease-in-out 200ms infinite alternate` `` (the first of a list) → an Animation over `name`'s stops. */
export function parseAnimation(text: string, stopsOf: (name: string) => KeyframeStop[] | undefined): Animation {
  const anim: Animation = { name: "", frames: [], duration: 0, delay: 0, easing: "ease", iterations: 1, alternate: false };
  const times: number[] = [];
  for (const word of words(commas(text)[0] ?? "")) {
    if (isTime(word)) times.push(parseTime(word));
    else if (easingOf(word)) anim.easing = easingOf(word)!;
    else if (word === "infinite") anim.iterations = -1;
    else if (/^\d*\.?\d+$/.test(word)) anim.iterations = Number(word);
    else if (word === "alternate" || word === "alternate-reverse") anim.alternate = true;
    else if (["normal", "reverse", "forwards", "backwards", "both", "none", "running", "paused"].includes(word)) continue;
    else {
      const stops = stopsOf(word);
      if (!stops) fail(`animation: "${word}" is not a keyframes() name.`);
      anim.name = word;
      anim.frames = stops!;
    }
  }
  anim.duration = times[0] ?? 0;
  anim.delay = times[1] ?? 0;
  if (!anim.name) fail(`animation "${text}" names no keyframes().`);
  return anim;
}

/**
 * A whole nuclo-core style object → a native one: nested states, `&:` selectors, `@media` and screen keys, `raw`
 * and `animation` included. Native keys pass through, so a native style is returned as it is (a copy).
 */
export function normalizeStyle(style: Record<string, unknown>, theme?: Theme): NativeStyle {
  const out: NativeStyle = {};
  const media: MediaRule[] = [];
  const set = (key: string, value: unknown) => {
    for (const reset of SHORTHAND_RESETS[key] ?? []) delete out[reset];
    out[key] = value;
  };
  const state = (key: string, value: unknown) => {
    if (key === "placeholder") {
      const color = normalizeStyle(value as Record<string, unknown>, theme).color;
      if (color !== undefined) set("placeholderColor", color);
      return;
    }
    const nested = normalizeStyle(value as Record<string, unknown>, theme);
    out[key] = out[key] ? { ...(out[key] as NativeStyle), ...nested } : nested;
  };
  for (const [key, value] of Object.entries(style)) {
    if (value == null) continue;
    if (key === "media" && Array.isArray(value)) {
      media.push(...(value as MediaRule[]));
      continue;
    }
    if (key === "animation" && typeof value === "object") {
      out.animation = value;
      continue;
    }
    if (STATE_ALIASES[key] || key === "placeholder") {
      if (typeof value === "object") state(STATE_ALIASES[key] ?? key, value);
      else if (key === "placeholder") continue;
      continue;
    }
    if (UNSUPPORTED_PSEUDOS.has(key)) fail(`The pseudo key ${key} has no native equivalent.`);
    if (key.startsWith("&")) {
      const target = SELECTORS[key.slice(1)];
      if (!target) fail(`The selector "${key}" has no native equivalent (the state keys do: ${Object.keys(SELECTORS).join(" ")}).`);
      state(target!, value);
      continue;
    }
    const screen = theme?.screens?.[key];
    if (key.startsWith("@") || screen !== undefined) {
      media.push({ ...parseMedia(screen ?? key), style: normalizeStyle(value as Record<string, unknown>, theme) });
      continue;
    }
    if (key === "raw") {
      for (const [prop, v] of Object.entries(value as Record<string, unknown>)) for (const [k, x] of lowerEntry(camel(prop), v, theme)) set(k, x);
      continue;
    }
    if (key === "animation") {
      out.animation = parseAnimation(String(value), keyframesNamed);
      continue;
    }
    if (NATIVE_KEY_SET.has(key) && !SIZE_KEYS.has(key) && !COLOR_KEYS.has(key) && !(key in ENUM_VALUES) && typeof value === "number") {
      set(key, value);
      continue;
    }
    for (const [k, v] of lowerEntry(key, value, theme)) set(k, v);
  }
  if (media.length) out.media = media;
  return out;
}

const NATIVE_KEY_SET: ReadonlySet<string> = new Set(NATIVE_STYLE_KEYS);

/** Old name: a style with its short keys written as native ones. */
export const expandStyle = <S extends object>(style: S): S => normalizeStyle(style as Record<string, unknown>) as S;
