/**
 * The layout engine every native host and GPUI share: CSS flexbox, so a style lays out to the same boxes
 * everywhere. The web keeps the browser's CSS, which this must match (test/layout.test.ts, examples/styles).
 *
 * The style contract:
 * - Units: 1 = 1 CSS px = 1 pt (Apple) = 1 dp (Android) = 1 logical px (GTK, GPUI) = 1 DIP (WPF).
 * - Boxes are border-box: `width`/`height` (px or % of the parent's content box), `min*`/`max*`, `padding`
 *   and `border` per side, `margin` per side (`auto` takes free space). Every container is a flex
 *   container (a column unless `flexDirection: "row"`) and a containing block for `position: absolute`
 *   children; `position: relative` shifts a box by its insets. `display: "none"` takes a box out.
 * - Flex: `flexDirection` (and -reverse), `flexWrap`, `justifyContent`, `alignItems`, `alignSelf`,
 *   `alignContent`, `gap` / `rowGap` / `columnGap`, `flexGrow`, `flexShrink`, `flexBasis` and `flex`.
 *   `flex: n` grows n from a basis of 0 (CSS `flex: n 1 0%`). Children do not shrink unless they set
 *   `flexShrink` (the web build sets `flex-shrink: 0`, as React Native does); against an indefinite main
 *   size (a column of auto height) a percentage basis is the content.
 * - Text: the bundled font (Inter), 14 px by default, line height 1.35 × size; it wraps at its box.
 *   As in the browser, which lays out in device pixels: the line height sits on a 1/64 device-pixel
 *   grid (lineHeight), and the baseline is the font's ascent and descent rounded to device pixels
 *   with half the leading above them, floored to a device pixel (hosts draw text this way).
 * - Controls: checkbox 24×24; input = 1.35 × font + padding (8) tall, its content 144 wide (160 with its
 *   padding) unless stretched;
 *   button = its text plus 8 / 16 padding; image = `width`/`height`, else natural size and aspect;
 *   video = `width`/`height`, else the width it is given (320 unconstrained) at 16:9.
 *
 * Hosts measure leaves (text, button, image) with the bundled font; everything
 * else is computed here, so every host gets the same frames.
 */
import { type Styles, borderWidth, compute, isComputed, length } from "./style";

export interface LayoutNode {
  id: number;
  /** view | screen | text | button | input | checkbox | image | video */
  kind: string;
  /** The node's style: dom.ts gives the computed longhands; shorthands work too. */
  style: Styles;
  children: LayoutNode[];
  /** What a host that sizes by content is asked with (dom.ts): a text's text, an image's src. */
  content?: string;
  /**
   * Written by layout(): the node's last placement [w, h, height, scale] and max-content width. A caller that
   * reuses the node object across layouts promises its subtree did not change (dom.ts rebuilds changed nodes);
   * a container placed again as before then keeps its children where they are, and they get no frames.
   */
  placed?: [w: number, h: number | undefined, height: number, scale: number];
  max?: number;
  parsed?: Style;
  /** The node this one replaces (dom.ts): a column of content height keeps the frames of children it shares with it. */
  prev?: LayoutNode;
  /** With prev: the children before `from` are prev's first ones, and those from `to` on are prev's last ones. */
  span?: [from: number, to: number];
  /** A column of content height: its children's y, height and width as of its last placement; flow: all are in flow. */
  ys?: number[];
  hs?: number[];
  ws?: number[];
  flow?: boolean;
}

/** Content size of a text, button or image leaf; `maxWidth` Infinity means unconstrained. Images: natural size. */
export type Measure = (node: LayoutNode, maxWidth: number) => { w: number; h: number };
export type Frame = [x: number, y: number, w: number, h: number];

export const LINE_HEIGHT = 1.35;
export const FONT_SIZE = 14;
export const CHECKBOX = 24;
/** A text field's content width: 160 with its default padding. */
export const INPUT_WIDTH = 144;

/** The height of a line of text at `size`; with `scale` device pixels per unit, on the browser's 1/64 device-pixel grid. */
export function lineHeight(size: number, scale = 0) {
  const exact = size * LINE_HEIGHT;
  return scale > 0 ? Math.floor(exact * scale * 64 + 1e-6) / (scale * 64) : exact;
}

/** A length: px, or a percentage of a base. */
type Len = { px: number; pct: boolean } | undefined;
type Sides = [top: number, right: number, bottom: number, left: number];

interface Style {
  row: boolean;
  reverse: boolean;
  wrap: boolean;
  wrapReverse: boolean;
  justify: string;
  align: string;
  self?: string;
  content: string;
  rowGap: Len;
  columnGap: Len;
  padding: [Len, Len, Len, Len];
  border: Sides;
  /** "auto" margins take free space. */
  margin: [Len | "auto", Len | "auto", Len | "auto", Len | "auto"];
  width: Len;
  height: Len;
  minWidth: Len;
  maxWidth: Len;
  minHeight: Len;
  maxHeight: Len;
  grow: number;
  shrink: number;
  /** undefined: auto (the main size, else the content). */
  basis: Len;
  absolute: boolean;
  relative: boolean;
  /** top right bottom left */
  insets: [Len, Len, Len, Len];
  none: boolean;
  fontSize: number;
}

const SIDES = ["Top", "Right", "Bottom", "Left"] as const;

function len(value: string | undefined, em: number): Len {
  if (value == null || value === "" || value === "auto" || value === "none") return undefined;
  if (value.endsWith("%")) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? { px: n, pct: true } : undefined;
  }
  const n = length(value, em);
  return n === undefined ? undefined : { px: n, pct: false };
}

/** A length against `base` (undefined: a percentage of an indefinite size is auto). */
const at = (l: Len, base: number | undefined) => (!l ? undefined : !l.pct ? l.px : base === undefined ? undefined : (l.px * base) / 100);
const at0 = (l: Len | "auto", base: number | undefined) => (l === "auto" ? 0 : (at(l, base) ?? 0));

/** A control's default padding: [vertical, horizontal]. */
const CONTROL_PADDING: Record<string, [number, number]> = { button: [8, 16], input: [8, 8] };

/** What was read from each computed style (dom.ts shares one between like nodes); controls read theirs their own way. */
const read = new WeakMap<Styles, Style>();

function styleOf(node: LayoutNode): Style {
  if (!isComputed(node.style) || node.kind in CONTROL_PADDING || node.kind === "checkbox") return parse(node);
  let found = read.get(node.style);
  if (!found) read.set(node.style, (found = parse(node)));
  return found;
}

function parse(node: LayoutNode): Style {
  const s = isComputed(node.style) ? node.style : compute(undefined, Object.entries(node.style));
  const fontSize = length(s.fontSize) ?? FONT_SIZE;
  const l = (key: string) => len(s[key], fontSize);
  const control = CONTROL_PADDING[node.kind];
  const pad = (i: number) => l("padding" + SIDES[i]) ?? (control ? { px: control[i % 2]!, pct: false } : undefined);
  const margin = (i: number) => (s["margin" + SIDES[i]] === "auto" ? "auto" : l("margin" + SIDES[i]));
  const direction = s.flexDirection ?? "column";
  let width = l("width");
  let height = l("height");
  if (node.kind === "checkbox") {
    width ??= { px: CHECKBOX, pct: false };
    height ??= { px: CHECKBOX, pct: false };
  }
  const self = s.alignSelf && s.alignSelf !== "auto" ? s.alignSelf : undefined;
  return {
    row: direction.startsWith("row"),
    reverse: direction.endsWith("reverse"),
    wrap: s.flexWrap === "wrap" || s.flexWrap === "wrap-reverse",
    wrapReverse: s.flexWrap === "wrap-reverse",
    justify: s.justifyContent || "flex-start",
    align: s.alignItems && s.alignItems !== "normal" ? s.alignItems : "stretch",
    self,
    content: s.alignContent || "normal",
    rowGap: l("rowGap"),
    columnGap: l("columnGap"),
    padding: [pad(0), pad(1), pad(2), pad(3)],
    border: SIDES.map((side) => borderWidth(s, side)) as Sides,
    margin: [margin(0), margin(1), margin(2), margin(3)],
    width,
    height,
    minWidth: l("minWidth"),
    maxWidth: l("maxWidth"),
    minHeight: l("minHeight"),
    maxHeight: l("maxHeight"),
    grow: Math.max(0, parseFloat(s.flexGrow ?? "0") || 0),
    shrink: Math.max(0, parseFloat(s.flexShrink ?? "0") || 0),
    basis: s.flexBasis === "content" ? undefined : l("flexBasis"),
    absolute: s.position === "absolute" || s.position === "fixed",
    relative: s.position === "relative" || s.position === "sticky",
    insets: [l("top"), l("right"), l("bottom"), l("left")],
    none: s.display === "none",
    fontSize,
  };
}

/** A node's padding plus border per side (the inset of its content) against a containing block of width `cb`. */
export function insets(node: LayoutNode, cb?: number): Sides {
  const s = (node.parsed ??= styleOf(node));
  return s.padding.map((p, i) => (at(p, cb) ?? 0) + s.border[i]!) as Sides;
}

const isContainer = (node: LayoutNode) => node.kind === "view" || node.kind === "screen";
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const clamp = (v: number, min: number | undefined, max: number | undefined) => Math.max(min ?? 0, Math.min(v, max ?? Infinity));

/** Lays `root` out at `width` (and `height` when definite); `scale`: the host's device pixels per unit. */
export function layout(root: LayoutNode, width: number, height: number | undefined, measure: Measure, scale = 0) {
  const frames = new Map<number, Frame>();
  const st = (node: LayoutNode) => (node.parsed ??= styleOf(node));
  const inFlow = (node: LayoutNode) => {
    const s = st(node);
    return !s.none && !s.absolute;
  };

  /** A leaf's border-box size with its width at most `maxWidth` (fit-content), or exactly `width`. */
  function leaf(node: LayoutNode, maxWidth: number, width: number | undefined, cb: number | undefined): { w: number; h: number } {
    const s = st(node);
    const [t, r, b, l] = insets(node, cb);
    const w = width ?? at(s.width, cb);
    const h = at(s.height, undefined);
    switch (node.kind) {
      case "checkbox":
        return { w: w ?? CHECKBOX, h: h ?? CHECKBOX };
      case "input":
        return { w: w ?? Math.min(INPUT_WIDTH + l + r, maxWidth), h: h ?? lineHeight(s.fontSize, scale) + t + b };
      case "image": {
        const natural = measure(node, Infinity);
        const iw = w ?? Math.min(natural.w, maxWidth);
        return { w: iw, h: h ?? (natural.w > 0 ? (iw * natural.h) / natural.w : 0) };
      }
      case "video": {
        // Its frame is known before the file loads: the host fits the picture in it.
        const vw = w ?? (Number.isFinite(maxWidth) ? maxWidth : 320);
        return { w: vw, h: h ?? (vw * 9) / 16 };
      }
      default: {
        // Text and buttons: the host measures the text inside the padding and border.
        const room = (w ?? maxWidth) - l - r;
        const content = measure(node, Math.max(0, room));
        return { w: w ?? content.w + l + r, h: h ?? content.h + t + b };
      }
    }
  }

  /** Border-box max-content width: the width a node takes when nothing constrains it. */
  function maxContent(node: LayoutNode): number {
    return (node.max ??= measureContent(node));
  }

  function measureContent(node: LayoutNode): number {
    const s = st(node);
    const fixed = at(s.width, undefined);
    const clampW = (v: number) => clamp(v, at(s.minWidth, undefined), at(s.maxWidth, undefined));
    if (fixed != null) return clampW(fixed);
    if (!isContainer(node)) return clampW(leaf(node, Infinity, undefined, undefined).w);
    const kids = node.children.filter(inFlow);
    const outer = kids.map((kid) => {
      const k = st(kid);
      return maxContent(kid) + at0(k.margin[1], undefined) + at0(k.margin[3], undefined);
    });
    const [, r, , l] = insets(node);
    const content = s.row
      ? sum(outer) + (at(s.columnGap, undefined) ?? 0) * Math.max(0, kids.length - 1)
      : Math.max(0, ...outer);
    return clampW(content + l + r);
  }

  /** Containers whose children got frames in this layout: placed again, they must redo them. */
  const redone = new Set<LayoutNode>();

  /** Lays a node out at border-box width `w` (and height `h` when definite); returns its height. `cb`: the parent's content width. */
  function place(node: LayoutNode, w: number, h?: number, cb = w): number {
    const s = st(node);
    if (!isContainer(node)) return h ?? clampHeight(s, leaf(node, w, w, cb).h, undefined);
    const last = node.placed;
    if (last && last[0] === w && last[1] === h && last[3] === scale && !redone.has(node)) return last[2];
    redone.add(node);
    const height = flex(node, s, w, h, cb);
    node.placed = [w, h, height, scale];
    return height;
  }

  const clampHeight = (s: Style, v: number, base: number | undefined) => clamp(v, at(s.minHeight, base), at(s.maxHeight, base));
  const clampWidth = (s: Style, v: number, base: number | undefined) => clamp(v, at(s.minWidth, base), at(s.maxWidth, base));

  function flex(node: LayoutNode, s: Style, w: number, h: number | undefined, cb: number): number {
    const [t, r, b, l] = insets(node, cb);
    const innerW = w - l - r;
    // A content-height column whose children run top to bottom: the long-list path.
    if (!s.row && !s.reverse && !s.wrap && h === undefined && !s.minHeight && !s.maxHeight && isStart(s.justify)) {
      const absolute: LayoutNode[] = [];
      const height = contentColumn(node, s, w, innerW, t, b, l, absolute);
      positionAbsolute(absolute, s, w, height, [t, r, b, l]);
      return height;
    }
    let height = s.row ? row(node, s, innerW, h, t, b, l, cb) : column(node, s, innerW, h, t, b, l, cb);
    if (h === undefined) {
      // Auto height: min/max clamp it, and the content lays out again in the clamped height.
      const clamped = clampHeight(s, height, undefined);
      if (clamped !== height) height = s.row ? row(node, s, innerW, clamped, t, b, l, cb) : column(node, s, innerW, clamped, t, b, l, cb);
    }
    positionAbsolute(node.children.filter((kid) => st(kid).absolute), s, w, height, [t, r, b, l]);
    return height;
  }

  interface Item {
    node: LayoutNode;
    s: Style;
    /** Margins: top right bottom left, auto as 0, and which are auto. */
    m: Sides;
    auto: [boolean, boolean, boolean, boolean];
    base: number;
    main: number;
    cross: number;
    frozen: boolean;
    x: number;
    y: number;
  }

  const item = (node: LayoutNode, inner: number): Item => {
    const s = st(node);
    return {
      node,
      s,
      m: s.margin.map((m) => at0(m, inner)) as Sides,
      auto: s.margin.map((m) => m === "auto") as Item["auto"],
      base: 0,
      main: 0,
      cross: 0,
      frozen: false,
      x: 0,
      y: 0,
    };
  };

  /** Splits items into lines of at most `room` (all one line unless wrapping into a definite size). */
  function lines(items: Item[], wrap: boolean, room: number | undefined, gap: number, outer: (i: Item) => number) {
    if (!wrap || room === undefined) return [items];
    const out: Item[][] = [];
    let line: Item[] = [];
    let used = 0;
    for (const it of items) {
      const size = outer(it);
      if (line.length && used + gap + size > room + 1e-6) {
        out.push(line);
        line = [];
        used = 0;
      }
      used += (line.length ? gap : 0) + size;
      line.push(it);
    }
    if (line.length) out.push(line);
    return out;
  }

  /** CSS "resolve the flexible lengths" for one line: grows or shrinks `main` from `base` into `room`, with min/max. */
  function resolve(line: Item[], room: number, gap: number, margins: (i: Item) => number, min: (i: Item) => number | undefined, max: (i: Item) => number | undefined) {
    const gaps = gap * Math.max(0, line.length - 1) + sum(line.map(margins));
    const hypothetical = (i: Item) => clamp(i.base, min(i), max(i));
    const growing = sum(line.map(hypothetical)) + gaps < room;
    const factor = (i: Item) => (growing ? i.s.grow : i.s.shrink * i.base);
    for (const it of line) {
      it.main = it.base;
      it.frozen = factor(it) === 0 || (growing ? it.base > hypothetical(it) : it.base < hypothetical(it));
      if (it.frozen) it.main = hypothetical(it);
    }
    const initial = room - gaps - sum(line.map((i) => (i.frozen ? i.main : i.base)));
    for (let round = 0; round <= line.length; round++) {
      const open = line.filter((i) => !i.frozen);
      if (!open.length) break;
      let free = room - gaps - sum(line.map((i) => (i.frozen ? i.main : i.base)));
      const grows = sum(open.map((i) => i.s.grow));
      if (growing && grows < 1) free = Math.min(free, initial * grows);
      const total = sum(open.map(factor));
      let violation = 0;
      const clamped = open.map((it) => {
        const target = it.base + (total > 0 ? (free * factor(it)) / total : 0);
        const c = clamp(target, min(it), max(it));
        violation += c - target;
        it.main = target;
        return c;
      });
      open.forEach((it, i) => {
        const c = clamped[i]!;
        if (Math.abs(violation) < 1e-9 || (violation > 0 && c > it.main) || (violation < 0 && c < it.main)) it.frozen = true;
        it.main = c;
      });
    }
  }

  /** Main-axis start offsets for a line: auto margins take free space first, else justifyContent spreads it. */
  function justify(line: Item[], free: number, gap: number, justifyContent: string, autoStart: (i: Item) => boolean, autoEnd: (i: Item) => boolean) {
    const autos = sum(line.map((i) => Number(autoStart(i)) + Number(autoEnd(i))));
    let lead = 0;
    let between = gap;
    let per = 0;
    if (free > 0 && autos > 0) per = free / autos;
    else if (free > 0 || justifyContent === "center" || isEnd(justifyContent)) {
      const n = line.length;
      switch (justifyContent) {
        case "center":
          lead = free / 2;
          break;
        case "flex-end":
        case "end":
          lead = free;
          break;
        case "space-between":
          if (n > 1 && free > 0) between += free / (n - 1);
          break;
        case "space-around":
          if (free > 0) {
            lead = free / n / 2;
            between += free / n;
          } else lead = free / 2;
          break;
        case "space-evenly":
          if (free > 0) {
            lead = free / (n + 1);
            between += free / (n + 1);
          } else lead = free / 2;
          break;
      }
    }
    return { lead, between, per };
  }

  /** Where an item sits in a line's cross size, and its cross size if stretched. */
  function crossPlace(it: Item, line: number, before: number, after: number, autoBefore: boolean, autoAfter: boolean, size: number, align: string) {
    const free = line - size - before - after;
    if (autoBefore || autoAfter) {
      if (free <= 0) return before;
      return before + (autoBefore && autoAfter ? free / 2 : autoBefore ? free : 0);
    }
    return before + (align === "center" ? free / 2 : isEnd(align) ? free : 0);
  }

  function row(node: LayoutNode, s: Style, innerW: number, h: number | undefined, t: number, b: number, l: number, cb: number): number {
    const kids = node.children.filter(inFlow);
    const innerH = h === undefined ? undefined : h - t - b;
    const gap = at(s.columnGap, innerW) ?? 0;
    const rowGap = at(s.rowGap, innerH) ?? 0;
    const items = kids.map((kid) => item(kid, innerW));
    const minW = (i: Item) => at(i.s.minWidth, innerW);
    const maxW = (i: Item) => at(i.s.maxWidth, innerW);
    for (const it of items) {
      const basis = at(it.s.basis, innerW) ?? at(it.s.width, innerW);
      it.base = basis ?? maxContent(it.node);
    }
    const marginsX = (i: Item) => i.m[1] + i.m[3];
    const all = lines(items, s.wrap, innerW, gap, (i) => clamp(i.base, minW(i), maxW(i)) + marginsX(i));
    // Main sizes, then each item's natural height at its width.
    for (const line of all) {
      resolve(line, innerW, gap, marginsX, minW, maxW);
      for (const it of line) {
        const set = at(it.s.height, innerH);
        it.cross = clampHeight(it.s, set ?? place(it.node, it.main, undefined, innerW), innerH);
      }
    }
    const lineCross = all.map((line) => Math.max(0, ...line.map((i) => i.cross + i.m[0] + i.m[2])));
    if (innerH !== undefined && all.length === 1 && !s.wrap) lineCross[0] = innerH;
    const content = sum(lineCross) + rowGap * Math.max(0, all.length - 1);
    // alignContent: lines share what is left of a definite height.
    let lead = 0;
    let between = rowGap;
    if (innerH !== undefined && s.wrap) {
      const free = innerH - content;
      const n = all.length;
      const how = s.content === "normal" ? "stretch" : s.content;
      if (how === "stretch" && free > 0) lineCross.forEach((_, i) => (lineCross[i]! += free / n));
      else if (how === "center") lead = free / 2;
      else if (isEnd(how)) lead = free;
      else if (how === "space-between" && n > 1 && free > 0) between += free / (n - 1);
      else if (how === "space-around" && free > 0) [lead, between] = [free / n / 2, rowGap + free / n];
      else if (how === "space-evenly" && free > 0) [lead, between] = [free / (n + 1), rowGap + free / (n + 1)];
    }
    let y = t + lead;
    all.forEach((line, li) => {
      const cross = lineCross[li]!;
      const used = sum(line.map((i) => i.main + marginsX(i))) + gap * Math.max(0, line.length - 1);
      const j = justify(line, innerW - used, gap, s.justify, (i) => i.auto[3], (i) => i.auto[1]);
      let x = l + j.lead;
      for (const it of line) {
        const align = it.s.self ?? s.align;
        const stretch = align === "stretch" && at(it.s.height, innerH) === undefined && !it.auto[0] && !it.auto[2];
        if (stretch) it.cross = clampHeight(it.s, cross - it.m[0] - it.m[2], innerH);
        x += it.m[3] + (it.auto[3] ? j.per : 0);
        it.x = x;
        it.y = y + crossPlace(it, cross, it.m[0], it.m[2], it.auto[0], it.auto[2], it.cross, align);
        x += it.main + it.m[1] + (it.auto[1] ? j.per : 0) + j.between;
      }
      y += cross + between;
    });
    const height = h ?? content + t + b;
    for (const it of items) {
      if (s.reverse) it.x = l + innerW - (it.x - l) - it.main;
      if (s.wrapReverse) it.y = t + (height - t - b) - (it.y - t) - it.cross;
      settle(it, it.main, it.cross, innerW, innerH);
    }
    return height;
  }

  function column(node: LayoutNode, s: Style, innerW: number, h: number | undefined, t: number, b: number, l: number, cb: number): number {
    const kids = node.children.filter(inFlow);
    const innerH = h === undefined ? undefined : h - t - b;
    const gap = at(s.rowGap, innerH) ?? 0;
    const colGap = at(s.columnGap, innerW) ?? 0;
    const items = kids.map((kid) => item(kid, innerW));
    const minH = (i: Item) => at(i.s.minHeight, innerH);
    const maxH = (i: Item) => at(i.s.maxHeight, innerH);
    // Cross sizes first: set, stretched, or fit-content.
    for (const it of items) it.cross = crossWidth(it, s, innerW, s.wrap);
    for (const it of items) it.base = columnBasis(it, innerH, innerW);
    const marginsY = (i: Item) => i.m[0] + i.m[2];
    const all = lines(items, s.wrap, innerH, gap, (i) => clamp(i.base, minH(i), maxH(i)) + marginsY(i));
    for (const line of all) {
      const used = sum(line.map((i) => i.base + marginsY(i))) + gap * Math.max(0, line.length - 1);
      resolve(line, innerH ?? used, gap, marginsY, minH, maxH);
    }
    const lineMain = all.map((line) => sum(line.map((i) => i.main + marginsY(i))) + gap * Math.max(0, line.length - 1));
    const height = h ?? Math.max(0, ...lineMain) + t + b;
    const room = height - t - b;
    // Line widths: one line is the content box; wrapped lines are as wide as their widest item.
    const lineCross = all.length === 1 && !s.wrap ? [innerW] : all.map((line) => Math.max(0, ...line.map((i) => i.cross + i.m[1] + i.m[3])));
    let x = l;
    all.forEach((line, li) => {
      const cross = lineCross[li]!;
      const j = justify(line, room - lineMain[li]!, gap, s.justify, (i) => i.auto[0], (i) => i.auto[2]);
      let y = t + j.lead;
      for (const it of line) {
        const align = it.s.self ?? s.align;
        if (s.wrap && align === "stretch" && at(it.s.width, innerW) === undefined && !it.auto[1] && !it.auto[3]) {
          it.cross = clampWidth(it.s, cross - it.m[1] - it.m[3], innerW);
        }
        y += it.m[0] + (it.auto[0] ? j.per : 0);
        it.y = y;
        it.x = x + crossPlace(it, cross, it.m[3], it.m[1], it.auto[3], it.auto[1], it.cross, align);
        y += it.main + it.m[2] + (it.auto[2] ? j.per : 0) + j.between;
      }
      x += cross + colGap;
    });
    for (const it of items) {
      if (s.reverse) it.y = t + room - (it.y - t) - it.main;
      if (s.wrapReverse) it.x = l + innerW - (it.x - l) - it.cross;
      settle(it, it.cross, it.main, innerW, innerH);
    }
    return height;
  }

  /**
   * A column child's flex basis: a length; `auto`, its height if set; else its content height. A percentage of an
   * indefinite height is the content too, as CSS has it: the child's own `height` then does not count.
   */
  function columnBasis(it: Item, innerH: number | undefined, innerW: number) {
    const basis = at(it.s.basis, innerH);
    if (basis !== undefined) return basis;
    const height = it.s.basis ? undefined : at(it.s.height, innerH);
    return height ?? (isContainer(it.node) ? place(it.node, it.cross, undefined, innerW) : contentHeight(it.node, it.cross, innerW));
  }

  /** A leaf's height from its content alone (no set height). */
  function contentHeight(node: LayoutNode, w: number, cb: number) {
    const s = st(node);
    return leaf(s.height ? { ...node, parsed: { ...s, height: undefined } } : node, w, w, cb).h;
  }

  /** A column child's width: set, stretched, or fit-content. */
  function crossWidth(it: Item, s: Style, innerW: number, wrap: boolean) {
    const set = at(it.s.width, innerW);
    if (set !== undefined) return clampWidth(it.s, set, innerW);
    const room = innerW - it.m[1] - it.m[3];
    const stretch = (it.s.self ?? s.align) === "stretch" && !it.auto[1] && !it.auto[3] && !wrap;
    return clampWidth(it.s, stretch ? room : Math.min(maxContent(it.node), Math.max(0, room)), innerW);
  }

  /** Lays an item's own children out at its final size and gives it its frame (relative offsets applied). */
  function settle(it: Item, w: number, h: number, cbW: number, cbH: number | undefined) {
    // A container laid out at its content height already has its children where they go.
    const p = it.node.placed;
    if (isContainer(it.node) && !(p && p[0] === w && p[1] === undefined && p[2] === h && p[3] === scale)) place(it.node, w, h, cbW);
    let { x, y } = it;
    if (it.s.relative) [x, y] = shift(it.s, x, y, cbW, cbH);
    frames.set(it.node.id, [x, y, w, h]);
  }

  const shift = (s: Style, x: number, y: number, cbW: number, cbH: number | undefined): [number, number] => {
    const [top, right, bottom, left] = s.insets;
    const dx = at(left, cbW) ?? -(at(right, cbW) ?? 0);
    const dy = at(top, cbH) ?? -(at(bottom, cbH) ?? 0);
    return [x + dx, y + dy];
  };

  /**
   * A column of content height: each child takes its own height, so a child that is the same node at the same y as
   * in the node this one replaces keeps its frame untouched. A long list that grew at the end costs one quick pass
   * plus the new rows. Told where it differs from that node (span), it takes the children before as they were, and
   * those after too when they start at the same y: one row replaced by one as tall costs that row.
   */
  function contentColumn(node: LayoutNode, s: Style, w: number, innerW: number, t: number, b: number, l: number, absolute: LayoutNode[]): number {
    const kids = node.children;
    const gap = at(s.rowGap, undefined) ?? 0;
    const p = node.prev;
    const same = p?.ys && p.placed?.[0] === w && p.placed[1] === undefined && p.placed[3] === scale && sameStyle(st(p), s);
    // Children out of flow are placed each time, so only a column without any is taken in runs.
    const span = same && p.flow && (p.ys![0] ?? t) === t ? node.span : undefined;
    const from = span?.[0] ?? 0;
    // How many more children prev had. With as many, prev's own arrays go on, written where the children differ.
    const d = span ? p!.children.length - kids.length : 0;
    const take = (of: number[] | undefined) => (!span ? [] : d ? of!.slice(0, from) : of!);
    let ys = take(p?.ys);
    let hs = take(p?.hs);
    let ws = take(p?.ws);
    let flow = true;
    let first = from === 0;
    let y = first ? t : ys[from - 1]! + hs[from - 1]!;
    for (let i = from; i < kids.length; i++) {
      if (span && i === span[1]) {
        if (p!.ys![i + d] === (first ? y : y + gap)) {
          if (d) {
            ys = ys.concat(p!.ys!.slice(i + d));
            hs = hs.concat(p!.hs!.slice(i + d));
            ws = ws.concat(p!.ws!.slice(i + d));
          }
          y = ys.at(-1)! + hs.at(-1)!;
          break;
        }
      }
      const kid = kids[i]!;
      if (!inFlow(kid)) {
        flow = false;
        if (st(kid).absolute) absolute.push(kid);
        ys[i] = hs[i] = ws[i] = NaN;
        continue;
      }
      if (!first) y += gap;
      first = false;
      if (same && p.children[i] === kid && p.ys![i] === y) {
        ys[i] = y;
        ws[i] = p.ws![i]!;
        y += hs[i] = p.hs![i]!;
        continue;
      }
      const it = item(kid, innerW);
      it.cross = crossWidth(it, s, innerW, false);
      it.main = clampHeight(it.s, columnBasis(it, undefined, innerW), undefined);
      y += it.m[0];
      it.y = y;
      it.x = l + crossPlace(it, innerW, it.m[3], it.m[1], it.auto[3], it.auto[1], it.cross, it.s.self ?? s.align);
      settle(it, it.cross, it.main, innerW, undefined);
      ys[i] = y - it.m[0];
      ws[i] = it.cross;
      // A child's slot: its margins and height, so a reused one moves as a whole.
      hs[i] = it.m[0] + it.main + it.m[2];
      y += it.main + it.m[2];
    }
    node.ys = ys;
    node.hs = hs;
    node.ws = ws;
    node.flow = flow;
    node.prev = undefined;
    return y + b;
  }

  /** `position: absolute` children, against the node's padding box. */
  function positionAbsolute(kids: LayoutNode[], s: Style, w: number, h: number, [t, r, b, l]: Sides) {
    const [bt, br, bb, bl] = s.border;
    const cbW = w - bl - br;
    const cbH = h - bt - bb;
    for (const kid of kids) {
      const k = st(kid);
      if (k.none) continue;
      const it = item(kid, cbW);
      const [top, right, bottom, left] = k.insets.map((v, i) => at(v, i % 2 ? cbW : cbH));
      const mx = it.m[1] + it.m[3];
      const my = it.m[0] + it.m[2];
      let width = at(k.width, cbW);
      if (width === undefined && left !== undefined && right !== undefined) width = cbW - left - right - mx;
      width = clampWidth(k, width ?? Math.min(maxContent(kid), Math.max(0, cbW - (left ?? 0) - (right ?? 0) - mx)), cbW);
      let height = at(k.height, cbH);
      if (height === undefined && top !== undefined && bottom !== undefined) height = cbH - top - bottom - my;
      height = clampHeight(k, height ?? place(kid, width, undefined, cbW), cbH);
      // Without insets, the static position: where it would sit as the only child.
      const innerW = w - l - r;
      const innerH = h - t - b;
      const mainStatic = (size: number, inner: number, start: number) => start + (s.justify === "center" ? (inner - size) / 2 : isEnd(s.justify) ? inner - size : 0);
      const align = k.self ?? s.align;
      const crossStatic = (size: number, inner: number, start: number) => start + (align === "center" ? (inner - size) / 2 : isEnd(align) ? inner - size : 0);
      const x =
        left !== undefined ? bl + left + it.m[3]
        : right !== undefined ? bl + cbW - right - it.m[1] - width
        : s.row ? mainStatic(width + mx, innerW, l) + it.m[3] : crossStatic(width + mx, innerW, l) + it.m[3];
      const y =
        top !== undefined ? bt + top + it.m[0]
        : bottom !== undefined ? bt + cbH - bottom - it.m[2] - height
        : s.row ? crossStatic(height + my, innerH, t) + it.m[0] : mainStatic(height + my, innerH, t) + it.m[0];
      if (isContainer(kid)) place(kid, width, height, cbW);
      frames.set(kid.id, [x, y, width, height]);
    }
  }

  const rootHeight = place(root, width, height);
  return { frames, height: rootHeight };
}

const isStart = (v: string) => v === "flex-start" || v === "start" || v === "normal" || v === "left";
const isEnd = (v: string) => v === "flex-end" || v === "end" || v === "right";

const sameStyle = (a: Style, b: Style) =>
  a.row === b.row &&
  a.align === b.align &&
  JSON.stringify([a.rowGap, a.padding, a.border, a.width]) === JSON.stringify([b.rowGap, b.padding, b.border, b.width]);
