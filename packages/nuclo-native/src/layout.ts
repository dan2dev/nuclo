/**
 * The layout engine every native host and GPUI share: a CSS flexbox subset,
 * so a style lays out to the same boxes everywhere. The web keeps the
 * browser's CSS, which this must match (test/layout.test.ts, examples/styles).
 *
 * The style contract:
 * - Units: 1 = 1 CSS px = 1 pt (Apple) = 1 dp (Android) = 1 logical px (GTK, GPUI) = 1 DIP (WPF).
 * - Boxes are border-box. `padding` is uniform; `width` and `height` are exact.
 * - Containers are flex columns, rows with `flexDirection: "row"`; `gap` between children;
 *   `alignItems`: stretch (default), flex-start, center, flex-end. No wrapping.
 * - `flex: n` grows n from a basis of 0 (CSS `flex: n 1 0%`); other children never shrink.
 *   Against an indefinite main size (a column of auto height) the basis is the content.
 * - Text: the bundled font (Inter), 14 px by default, line height 1.35 × size; it wraps at its box.
 *   As in the browser, which lays out in device pixels: the line height sits on a 1/64 device-pixel
 *   grid (lineHeight), and the baseline is the font's ascent and descent rounded to device pixels
 *   with half the leading above them, floored to a device pixel (hosts draw text this way).
 * - Controls: checkbox 24×24; input = 1.35 × font + 2 × padding (8) tall, 160 wide unless stretched;
 *   button = its text plus 8 / 16 padding; image = `width`/`height`, else natural size and aspect.
 *
 * Hosts measure leaves (text, button, image) with the bundled font; everything
 * else is computed here, so every host gets the same frames.
 */

export type Frame = [x: number, y: number, w: number, h: number];

export interface LayoutNode {
  id: number;
  /** view | screen | text | button | input | checkbox | image */
  kind: string;
  style: Record<string, string>;
  children: LayoutNode[];
}

/** Content size of a text, button or image leaf; `maxWidth` Infinity means unconstrained. Images: natural size. */
export type Measure = (node: LayoutNode, maxWidth: number) => { w: number; h: number };

export const LINE_HEIGHT = 1.35;
export const FONT_SIZE = 14;
export const CHECKBOX = 24;
export const INPUT_WIDTH = 160;

/** The height of a line of text at `size`; with `scale` device pixels per unit, on the browser's 1/64 device-pixel grid. */
export function lineHeight(size: number, scale = 0) {
  const exact = size * LINE_HEIGHT;
  return scale > 0 ? Math.floor(exact * scale * 64 + 1e-6) / (scale * 64) : exact;
}

const px = (value: string | undefined) => {
  if (value == null || value === "") return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
};

interface Style {
  row: boolean;
  gap: number;
  align: string;
  grow: number;
  padX: number;
  padY: number;
  width?: number;
  height?: number;
}

const isContainer = (node: LayoutNode) => node.kind === "view" || node.kind === "screen";

function styleOf(node: LayoutNode): Style {
  const s = node.style;
  const padding = px(s.padding);
  const control = node.kind === "button" ? [16, 8] : node.kind === "input" ? [8, 8] : [0, 0];
  let width = px(s.width);
  let height = px(s.height);
  if (node.kind === "checkbox") {
    width ??= CHECKBOX;
    height ??= CHECKBOX;
  }
  return {
    row: s.flexDirection === "row",
    gap: px(s.gap) ?? 0,
    align: s.alignItems || "stretch",
    grow: Math.max(0, px(s.flex) ?? 0),
    padX: padding ?? control[0],
    padY: padding ?? control[1],
    width,
    height,
  };
}

const fontSize = (node: LayoutNode) => px(node.style.fontSize) ?? FONT_SIZE;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Lays `root` out at `width` (and `height` when definite); `scale`: the host's device pixels per unit. */
export function layout(root: LayoutNode, width: number, height: number | undefined, measure: Measure, scale = 0) {
  const frames = new Map<number, Frame>();
  const styles = new Map<LayoutNode, Style>();
  const st = (node: LayoutNode) => {
    let s = styles.get(node);
    if (!s) styles.set(node, (s = styleOf(node)));
    return s;
  };

  /** A leaf's border-box size with its width at most `maxWidth` (fit-content), or exactly `width`. */
  function leaf(node: LayoutNode, maxWidth: number, width?: number): { w: number; h: number } {
    const s = st(node);
    const w = s.width ?? width;
    switch (node.kind) {
      case "checkbox":
        return { w: s.width!, h: s.height! };
      case "input": {
        const h = s.height ?? lineHeight(fontSize(node), scale) + 2 * s.padY;
        return { w: w ?? Math.min(INPUT_WIDTH, maxWidth), h };
      }
      case "image": {
        const natural = measure(node, Infinity);
        const iw = w ?? Math.min(natural.w, maxWidth);
        return { w: iw, h: s.height ?? (natural.w > 0 ? (iw * natural.h) / natural.w : 0) };
      }
      default: {
        // Text and buttons: the host measures the text inside the padding.
        const room = (w ?? maxWidth) - 2 * s.padX;
        const content = measure(node, Math.max(0, room));
        return { w: w ?? content.w + 2 * s.padX, h: s.height ?? content.h + 2 * s.padY };
      }
    }
  }

  /** Border-box max-content width: the width a node takes when nothing constrains it. */
  function maxContent(node: LayoutNode): number {
    const s = st(node);
    if (s.width != null) return s.width;
    if (!isContainer(node)) return leaf(node, Infinity).w;
    const widths = node.children.map(maxContent);
    const content = s.row ? sum(widths) + s.gap * Math.max(0, widths.length - 1) : Math.max(0, ...widths);
    return content + 2 * s.padX;
  }

  /** Lays a node out at border-box width `w` (and height `h` when definite); returns its height. */
  function place(node: LayoutNode, w: number, h?: number): number {
    const s = st(node);
    if (!isContainer(node)) return h ?? leaf(node, w, w).h;
    return s.row ? row(node, s, w, h ?? s.height) : column(node, s, w, h ?? s.height);
  }

  function column(node: LayoutNode, s: Style, w: number, h: number | undefined): number {
    const kids = node.children;
    const inner = w - 2 * s.padX;
    // Cross size: a set width, stretched, or fit-content.
    const widths = kids.map((kid) => {
      const k = st(kid);
      if (k.width != null) return k.width;
      return s.align === "stretch" ? inner : Math.min(maxContent(kid), inner);
    });
    const definite = h != null;
    const grows = kids.map((kid) => st(kid).grow);
    const heights = kids.map((kid, i) => {
      const k = st(kid);
      if (k.height != null) return k.height;
      return definite && grows[i] > 0 ? 0 : place(kid, widths[i]);
    });
    const gaps = s.gap * Math.max(0, kids.length - 1);
    if (definite) grow(heights, grows, h - 2 * s.padY - sum(heights) - gaps);
    let y = s.padY;
    kids.forEach((kid, i) => {
      // Containers of a set or grown height lay their children out at it.
      if (isContainer(kid) && (st(kid).height != null || (definite && grows[i] > 0))) place(kid, widths[i], heights[i]);
      frames.set(kid.id, [s.padX + offset(s.align, inner - widths[i]), y, widths[i], heights[i]]);
      y += heights[i] + s.gap;
    });
    return h ?? sum(heights) + gaps + 2 * s.padY;
  }

  function row(node: LayoutNode, s: Style, w: number, h: number | undefined): number {
    const kids = node.children;
    const inner = w - 2 * s.padX;
    const grows = kids.map((kid) => st(kid).grow);
    const widths = kids.map((kid, i) => st(kid).width ?? (grows[i] > 0 ? 0 : maxContent(kid)));
    const gaps = s.gap * Math.max(0, kids.length - 1);
    grow(widths, grows, inner - sum(widths) - gaps);
    // Heights at the final widths; the line is as tall as the tallest, or the set height.
    const natural = kids.map((kid, i) => st(kid).height ?? place(kid, widths[i]));
    const line = h != null ? h - 2 * s.padY : Math.max(0, ...natural);
    let x = s.padX;
    kids.forEach((kid, i) => {
      const k = st(kid);
      const stretched = s.align === "stretch" && k.height == null;
      const ch = stretched ? line : natural[i];
      if (isContainer(kid) && (k.height != null || ch !== natural[i])) place(kid, widths[i], ch);
      frames.set(kid.id, [x, s.padY + offset(s.align, line - ch), widths[i], ch]);
      x += widths[i] + s.gap;
    });
    return h ?? line + 2 * s.padY;
  }

  const rootHeight = place(root, width, height);
  return { frames, height: rootHeight };
}

/** Free space shared by `flex` (CSS: all of it once the weights sum to 1 or more). */
function grow(sizes: number[], weights: number[], free: number) {
  const total = sum(weights);
  if (free <= 0 || total === 0) return;
  const share = total < 1 ? free * total : free;
  weights.forEach((weight, i) => {
    if (weight > 0) sizes[i] += (share * weight) / total;
  });
}

function offset(align: string, slack: number) {
  return align === "center" ? slack / 2 : align === "flex-end" || align === "end" ? slack : 0;
}
