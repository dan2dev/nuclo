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
  /** A column of content height: its children's y, height and width as of its last placement. */
  ys?: number[];
  hs?: number[];
  ws?: number[];
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
  const st = (node: LayoutNode) => (node.parsed ??= styleOf(node));

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
    return (node.max ??= measureContent(node));
  }

  function measureContent(node: LayoutNode): number {
    const s = st(node);
    if (s.width != null) return s.width;
    if (!isContainer(node)) return leaf(node, Infinity).w;
    const widths = node.children.map(maxContent);
    const content = s.row ? sum(widths) + s.gap * Math.max(0, widths.length - 1) : Math.max(0, ...widths);
    return content + 2 * s.padX;
  }

  /** Containers whose children got frames in this layout: placed again, they must redo them. */
  const redone = new Set<LayoutNode>();

  /** Lays a node out at border-box width `w` (and height `h` when definite); returns its height. */
  function place(node: LayoutNode, w: number, h?: number): number {
    const s = st(node);
    if (!isContainer(node)) return h ?? leaf(node, w, w).h;
    const last = node.placed;
    if (last && last[0] === w && last[1] === h && last[3] === scale && !redone.has(node)) return last[2];
    redone.add(node);
    const height = s.row ? row(node, s, w, h ?? s.height) : column(node, s, w, h ?? s.height);
    node.placed = [w, h, height, scale];
    return height;
  }

  function column(node: LayoutNode, s: Style, w: number, h: number | undefined): number {
    if (h == null) return contentColumn(node, s, w);
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

  /**
   * A column of content height: each child takes its own height, so a child that is the same node at the same y as
   * in the node this one replaces keeps its frame untouched. A long list that grew at the end, or had one row
   * replaced, costs one quick pass plus the rows that changed.
   */
  function contentColumn(node: LayoutNode, s: Style, w: number): number {
    const kids = node.children;
    const inner = w - 2 * s.padX;
    const p = node.prev;
    const same = p?.ys && p.placed?.[0] === w && p.placed[1] === undefined && p.placed[3] === scale && sameStyle(st(p), s);
    const ys: number[] = (node.ys = []);
    const hs: number[] = (node.hs = []);
    const ws: number[] = (node.ws = []);
    let y = s.padY;
    for (let i = 0; i < kids.length; i++) {
      const kid = kids[i];
      if (same && p.children[i] === kid && p.ys![i] === y) {
        ys[i] = y;
        ws[i] = p.ws![i];
        y += (hs[i] = p.hs![i]) + s.gap;
        continue;
      }
      const k = st(kid);
      const width = k.width ?? (s.align === "stretch" ? inner : Math.min(maxContent(kid), inner));
      const height = k.height ?? place(kid, width);
      // Containers of a set height lay their children out at it.
      if (isContainer(kid) && k.height != null) place(kid, width, height);
      frames.set(kid.id, [s.padX + offset(s.align, inner - width), y, width, height]);
      ys[i] = y;
      ws[i] = width;
      y += (hs[i] = height) + s.gap;
    }
    node.prev = undefined;
    return sum(hs) + s.gap * Math.max(0, kids.length - 1) + 2 * s.padY;
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

const sameStyle = (a: Style, b: Style) =>
  a.row === b.row && a.gap === b.gap && a.align === b.align && a.padX === b.padX && a.padY === b.padY && a.width === b.width;

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
