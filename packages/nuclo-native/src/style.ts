/**
 * Styles the CSS way, for the native hosts: nuclo's css() rules (and globalStyle()) matched by class
 * and tag, @media queries against the window, then the inline style, with the inherited properties
 * flowing down. dom.ts resolves each node to a computed style of longhands; layout.ts reads them, and
 * the hosts get the paint ones (PAINT).
 *
 * Supported selectors: a tag, one or more classes, or both (`div`, `.a`, `.a.b`, `button.a`). Rules with
 * pseudo-classes, attributes or combinators (`:hover`, `.a > .b`) and @keyframes don't apply on native.
 */

export type Styles = Record<string, string>;

export interface Rule {
  tag?: string;
  classes: string[];
  /** Specificity: classes × 1000 + tag. */
  specificity: number;
  /** The @media condition, if any. */
  media?: string;
  decls: [key: string, value: string][];
}

/** Properties a child takes from its parent unless it sets them (CSS inherited properties). */
export const INHERITED = ["color", "fontSize", "fontWeight", "fontFamily", "textAlign"] as const;

const camel = (key: string) => (key.startsWith("--") ? key : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** `a:1;b:2` → [["a","1"],["b","2"]], camelCase keys, `!important` dropped. */
export function declarations(text: string): [string, string][] {
  const out: [string, string][] = [];
  for (const part of text.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).replace(/!important/i, "").trim();
    if (key && value) out.push([camel(key), value]);
  }
  return out;
}

/** The rules of a stylesheet's text, in order. */
export function parseRules(css: string): Rule[] {
  const rules: Rule[] = [];
  const parse = (text: string, media?: string) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) break;
      const prelude = text.slice(i, open).trim();
      // The block's end, nested blocks included.
      let depth = 1;
      let j = open + 1;
      for (; j < text.length && depth; j++) {
        if (text[j] === "{") depth++;
        else if (text[j] === "}") depth--;
      }
      const block = text.slice(open + 1, j - 1);
      i = j;
      if (prelude.startsWith("@media")) parse(block, and(media, prelude.slice(6).trim()));
      else if (!prelude.startsWith("@")) {
        const decls = declarations(block);
        for (const selector of prelude.split(",")) {
          const match = /^([a-z][a-z0-9-]*)?((?:\.[\w-]+)*)$/i.exec(selector.trim());
          if (!match || (!match[1] && !match[2])) continue; // pseudo-classes, combinators…
          const classes = match[2] ? match[2].slice(1).split(".") : [];
          const tag = match[1]?.toLowerCase();
          rules.push({ tag, classes, specificity: classes.length * 1000 + (tag ? 1 : 0), media, decls });
        }
      }
    }
  };
  parse(css);
  return rules;
}

const and = (outer: string | undefined, inner: string) => (outer ? `${outer} and ${inner}` : inner);

/** The browser's defaults the hosts don't know (the web build's base stylesheet sets the same). */
export const TAG_STYLE: Record<string, Styles> = {
  h1: { fontSize: "32px", fontWeight: "bold" },
  h2: { fontSize: "24px", fontWeight: "bold" },
  h3: { fontSize: "20px", fontWeight: "bold" },
  strong: { fontWeight: "bold" },
  b: { fontWeight: "bold" },
};

/** A stylesheet's rules, found by the class or tag they need. */
export class Sheet {
  readonly byKey = new Map<string, [Rule, number][]>();
  /** Every @media condition its rules use. */
  readonly medias: string[];

  constructor(text: string) {
    parseRules(text).forEach((rule, order) => {
      const key = rule.classes[0] ? "." + rule.classes[0] : rule.tag!;
      let bucket = this.byKey.get(key);
      if (!bucket) this.byKey.set(key, (bucket = []));
      bucket.push([rule, order]);
    });
    this.medias = [...new Set([...this.byKey.values()].flat().flatMap(([rule]) => (rule.media ? [rule.media] : [])))];
  }

  /** An element's declarations in cascade order: tag defaults, matching rules by specificity, then `inline`. */
  *cascade(tag: string, className: string, active: (media: string) => boolean, inline: Iterable<[string, string]>): Generator<[string, string]> {
    const defaults = TAG_STYLE[tag];
    if (defaults) yield* Object.entries(defaults);
    if (this.byKey.size) {
      const classes = new Set(className.split(/\s+/).filter(Boolean));
      const found: [Rule, number][] = [];
      for (const key of [tag, ...[...classes].map((c) => "." + c)]) {
        for (const entry of this.byKey.get(key) ?? []) {
          const [rule] = entry;
          if ((!rule.tag || rule.tag === tag) && rule.classes.every((c) => classes.has(c)) && (!rule.media || active(rule.media))) found.push(entry);
        }
      }
      found.sort((a, b) => a[0].specificity - b[0].specificity || a[1] - b[1]);
      for (const [rule] of found) yield* rule.decls;
    }
    yield* inline;
  }
}

/** Whether a media query list holds for a window of `width` × `height` CSS px. */
export function mediaMatches(query: string, width: number, height: number): boolean {
  return query.split(",").some((one) => {
    let q = one.trim().toLowerCase();
    const not = q.startsWith("not ");
    if (not) q = q.slice(4);
    q = q.replace(/^only\s+/, "");
    const ok = q.split(/\s+and\s+/).every((part) => {
      part = part.trim();
      if (part === "all" || part === "screen") return true;
      if (part === "print") return false;
      const feature = /^\(\s*([a-z-]+)\s*(?::\s*([^)]+))?\)$/.exec(part);
      if (!feature) return false;
      const [, name, raw = ""] = feature;
      const value = raw.trim();
      const length = (v: string) => (v.endsWith("em") ? parseFloat(v) * 16 : parseFloat(v));
      switch (name) {
        case "min-width":
          return width >= length(value);
        case "max-width":
          return width <= length(value);
        case "min-height":
          return height >= length(value);
        case "max-height":
          return height <= length(value);
        case "orientation":
          return value === (height >= width ? "portrait" : "landscape");
        case "hover":
        case "any-hover":
          return value === "none";
        case "pointer":
        case "any-pointer":
          return value === "coarse";
        default:
          return false;
      }
    });
    return ok !== not;
  });
}

/** Values of a 1–4 value box shorthand: top right bottom left. */
const sides = (value: string) => {
  const v = value.split(/\s+/);
  const [t = "0", r = t, b = t, l = r] = v;
  return [t, r, b, l] as const;
};
const SIDES = ["Top", "Right", "Bottom", "Left"] as const;
const BORDER_STYLES = new Set(["none", "hidden", "solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"]);

/** Sets a declaration on `out`, expanded to longhands: later ones win, as in the cascade. */
export function assign(out: Styles, key: string, value: string) {
  key = camel(key);
  value = String(value).trim();
  switch (key) {
    case "padding":
    case "margin":
    case "inset": {
      const v = sides(value);
      SIDES.forEach((side, i) => (out[key === "inset" ? side.toLowerCase() : key + side] = v[i]));
      return;
    }
    case "paddingInline":
    case "marginInline":
    case "paddingBlock":
    case "marginBlock": {
      const base = key.replace(/Inline|Block/, "");
      const [a, b = a] = value.split(/\s+/);
      const pair = key.endsWith("Inline") ? ["Left", "Right"] : ["Top", "Bottom"];
      out[base + pair[0]] = a;
      out[base + pair[1]] = b;
      return;
    }
    case "gap": {
      const [row, column = row] = value.split(/\s+/);
      out.rowGap = row;
      out.columnGap = column;
      return;
    }
    case "flex": {
      const v = value.split(/\s+/);
      if (value === "none") [out.flexGrow, out.flexShrink, out.flexBasis] = ["0", "0", "auto"];
      else if (value === "auto") [out.flexGrow, out.flexShrink, out.flexBasis] = ["1", "1", "auto"];
      else if (v.length === 1 && isNumber(v[0]!)) [out.flexGrow, out.flexShrink, out.flexBasis] = [v[0]!, "1", "0%"];
      else if (v.length === 1) [out.flexGrow, out.flexShrink, out.flexBasis] = ["1", "1", v[0]!];
      else {
        out.flexGrow = v[0]!;
        if (v.length === 2 && !isNumber(v[1]!)) [out.flexShrink, out.flexBasis] = ["1", v[1]!];
        else [out.flexShrink, out.flexBasis] = [v[1]!, v[2] ?? "0%"];
      }
      return;
    }
    case "flexFlow":
      // A shorthand sets the longhands it leaves out to their initial values.
      out.flexDirection = "row";
      out.flexWrap = "nowrap";
      for (const part of value.split(/\s+/)) out[part.includes("wrap") ? "flexWrap" : "flexDirection"] = part;
      return;
    case "background":
      out.backgroundColor = value.split(/\s+/).find((part) => color(part) !== undefined) ?? "transparent";
      return;
    case "border":
    case "borderTop":
    case "borderRight":
    case "borderBottom":
    case "borderLeft": {
      const parts = value.split(/\s+(?![^(]*\))/);
      const width = parts.find((p) => /^[\d.]/.test(p) || ["thin", "medium", "thick"].includes(p)) ?? "medium";
      const style = parts.find((p) => BORDER_STYLES.has(p)) ?? "none";
      const c = parts.find((p) => p !== width && p !== style) ?? "currentcolor";
      for (const side of key === "border" ? SIDES : [key.slice(6) as (typeof SIDES)[number]]) {
        out[`border${side}Width`] = width;
        out[`border${side}Style`] = style;
        out[`border${side}Color`] = c;
      }
      return;
    }
    case "borderWidth":
    case "borderStyle":
    case "borderColor": {
      const v = sides(value);
      SIDES.forEach((side, i) => (out[`border${side}${key.slice(6)}`] = v[i]!));
      return;
    }
    case "borderRadius": {
      const v = sides(value.split("/")[0]!.trim());
      ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].forEach((corner, i) => (out[`border${corner}Radius`] = v[i]!));
      return;
    }
    case "overflowX":
    case "overflowY":
      out.overflow = value;
      return;
    default:
      out[key] = value;
  }
}

const isNumber = (v: string) => /^[\d.]+$/.test(v);

/** A length in CSS px: numbers are px, rem is 16 px (the root size), em the element's font size; "%" and "auto" are undefined. */
export function length(value: string | undefined, em = 14): number | undefined {
  if (value == null || value === "" || value === "auto" || value.endsWith("%")) return undefined;
  if (value === "thin") return 1;
  if (value === "medium") return 3;
  if (value === "thick") return 5;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return undefined;
  return value.endsWith("rem") ? n * 16 : value.endsWith("em") ? n * em : n;
}

/** The width of one border side: 0 unless it has a style that draws. */
export function borderWidth(s: Styles, side: (typeof SIDES)[number]) {
  const style = s[`border${side}Style`];
  if (!style || style === "none" || style === "hidden") return 0;
  return length(s[`border${side}Width`] ?? "medium") ?? 0;
}

/** Styles compute() made: already longhands, so expanding them again changes nothing. */
const computed = new WeakSet<Styles>();
export const isComputed = (s: Styles) => computed.has(s);

/** The computed style of an element: the inherited properties of its parent, then its declarations in cascade order. */
export function compute(parent: Styles | undefined, declared: Iterable<[string, string]>): Styles {
  const out: Styles = {};
  computed.add(out);
  if (parent) for (const key of INHERITED) if (parent[key] !== undefined) out[key] = parent[key];
  for (const [key, value] of declared) {
    if (value === "inherit") {
      if (parent?.[camel(key)] !== undefined) assign(out, key, parent[camel(key)]!);
    } else if (value === "initial" || value === "unset") delete out[camel(key)];
    else assign(out, key, value);
  }
  return out;
}

/** The paint properties a host gets, as hosts read them (see README, "Styling"). */
export function paint(s: Styles, kind: string, inset: readonly number[] | undefined): Styles {
  const out: Styles = {};
  const put = (key: string, value: string | undefined) => {
    if (value !== undefined) out[key] = value;
  };
  put("backgroundColor", color(s.backgroundColor));
  put("color", color(s.color));
  put("opacity", s.opacity);
  put("fontSize", length(s.fontSize)?.toString());
  put("fontWeight", s.fontWeight);
  put("fontFamily", s.fontFamily);
  put("textAlign", s.textAlign);
  put("borderRadius", length(s.borderTopLeftRadius)?.toString());
  if (s.overflow === "hidden" || s.overflow === "clip" || s.overflow === "auto" || s.overflow === "scroll") out.overflow = "hidden";
  if (s.display === "none") out.display = "none";
  const widths = SIDES.map((side) => borderWidth(s, side));
  if (widths.some((w) => w > 0)) {
    out.borderWidth = widths.join(" ");
    const side = SIDES[widths.findIndex((w) => w > 0)]!;
    out.borderColor = color(s[`border${side}Color`] === "currentcolor" ? s.color : s[`border${side}Color`]) ?? "#000000";
  }
  if (inset && kind !== "view" && inset.some((v) => v !== 0)) out.padding = inset.join(" ");
  return out;
}

const NAMED: Record<string, string> = Object.fromEntries(
  (
    "aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 " +
    "blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 " +
    "chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b " +
    "darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b " +
    "darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f " +
    "darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 " +
    "deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 " +
    "fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f " +
    "grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa " +
    "lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff " +
    "lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a " +
    "lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 " +
    "lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd " +
    "mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a " +
    "mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 " +
    "navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 " +
    "palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 " +
    "peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f " +
    "royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d " +
    "silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f " +
    "steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 " +
    "white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32"
  )
    .match(/\S+ \S+/g)!
    .map((pair) => pair.split(" ") as [string, string]),
);

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");

/** A CSS colour as #rrggbb, or #rrggbbaa when not opaque; undefined if it is not one. */
export function color(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === "transparent") return "#00000000";
  if (NAMED[v]) return "#" + NAMED[v];
  if (v[0] === "#") {
    const h = v.slice(1);
    if (!/^[0-9a-f]+$/.test(h)) return undefined;
    if (h.length === 3 || h.length === 4) return color("#" + [...h].map((c) => c + c).join(""));
    if (h.length === 6) return v;
    if (h.length === 8) return h.endsWith("ff") ? "#" + h.slice(0, 6) : v;
    return undefined;
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(v);
  if (!fn) return undefined;
  const parts = fn[2]!.split(/[\s,/]+/).filter(Boolean);
  const alpha = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  let rgb: number[];
  if (fn[1]!.startsWith("rgb")) {
    rgb = parts.slice(0, 3).map((p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p)));
  } else {
    const h = (((parseFloat(parts[0]!) % 360) + 360) % 360) / 360;
    const s = parseFloat(parts[1]!) / 100;
    const l = parseFloat(parts[2]!) / 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = (t: number) => {
      t = (t + 1) % 1;
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    };
    rgb = [hue(h + 1 / 3), hue(h), hue(h - 1 / 3)].map((c) => c * 255);
  }
  if (rgb.some((c) => !Number.isFinite(c))) return undefined;
  return "#" + rgb.map(hex2).join("") + (alpha < 1 ? hex2(alpha * 255) : "");
}
