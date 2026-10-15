// The Nuclo mark and wordmark as point lists: pure math, no DOM. The components
// draw them and scripts/render-brand.ts writes the static SVG and PNG assets
// from them, so every logo on the site comes from this one source.

export const N = 360; // points per contour. One wheel lap draws the icon; each pen draws its glyph in the same N steps
const PI = Math.PI;

// ── The icon: a hypotrochoid with two pens on one wheel ──────────────────
export const R = 96; // the fixed ring
export const r = 32; // the rolling wheel. R / r = 3 gives three lobes
const outer = 90; // the shape's pen. d > r: the lobes overlap
const inner = 12; // the play triangle's pen. d < r: a rounded triangle

// One lap of a pen at distance d from the wheel's center, around the origin
const lap = (d: number) =>
  Array.from({ length: N + 1 }, (_, i) => {
    const t = (i / N) * 2 * PI;
    return [(R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)];
  });
const rawShape = lap(outer);
const rawPlay = lap(inner);
const rawHub = lap(0);

export type Icon = { hub: number[][]; shape: number[][]; play: number[][]; cx: number; cy: number; ring: number; wheel: number };

/** The icon scaled by s with the wheel's center at (cx, cy). */
export function placeIcon(s: number, cx: number, cy: number): Icon {
  const place = (pts: number[][]) => pts.map(([x, y]) => [cx + s * x, cy + s * y]);
  return { hub: place(rawHub), shape: place(rawShape), play: place(rawPlay), cx, cy, ring: R * s, wheel: r * s };
}

/** The icon alone in a 200 × 200 box, the outer pen touching the box's margin. */
export const icon = placeIcon(88 / (R - r + outer), 100, 100);

// ── The wordmark on its unit grid. U is the module; the sizes are multiples of it ──
const U = 24;
const stem = U; // every stroke, straight or round, is one unit thick
const xh = 6 * U; // x-height
const pad = 2 * U;
const base = 9 * U + pad; // the baseline. The l is 9 units tall
const top = base - xh; // the x-height line
const mid = top + xh / 2;
const ovr = 4; // round forms overshoot the x-height and the baseline, so they look aligned
const ro = xh / 2 + ovr; // outer radius of c and o
const ri = ro - stem; // their counter
const A = 2.5 * U; // arch radius of n and u: narrower than the bowls
const lw = stem + 2; // the l is two units wider: a lone stem with round ends looks lighter
const a = (34 * PI) / 180; // half of the c's opening
// The space between the inks of each pair, set by eye: n–u, u–c, c–l, l–o
const kern = [36, 27, 20, 25];

// Each contour is a chain of lines and arcs. Angles turn counterclockwise and 0 points right
type Seg = { len: number; at: (t: number) => number[] };
const line = (x0: number, y0: number, x1: number, y1: number): Seg => ({
  len: Math.hypot(x1 - x0, y1 - y0),
  at: (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t],
});
const arc = (cx: number, cy: number, rad: number, from: number, to: number): Seg => ({
  len: rad * Math.abs(to - from),
  at: (t) => [cx + rad * Math.cos(from + (to - from) * t), cy - rad * Math.sin(from + (to - from) * t)],
});
// N + 1 points along the chain, the same distance apart
const trace = (segs: Seg[]) => {
  const L = segs.reduce((sum, s) => sum + s.len, 0);
  let i = 0;
  let done = 0;
  return Array.from({ length: N + 1 }, (_, n) => {
    const d = (n / N) * L;
    while (i < segs.length - 1 && done + segs[i].len < d) done += segs[i++].len;
    return segs[i].at((d - done) / segs[i].len);
  });
};

// n: two stems and an arch over the top. u: the same glyph, arch under the bottom
const arch = (x: number, up: boolean) => {
  const y = up ? base : top; // where the stems end, flat on the line
  const c = up ? top + A - ovr : base - A + ovr; // the arch's center. The arch overshoots the line like the o does
  const end = up ? 0 : 2 * PI; // the arch turns over the top, or under the bottom
  const rx = x + 2 * A;
  return trace([
    line(x, y, x, c),
    arc(x + A, c, A, PI, end),
    line(rx, c, rx, y),
    line(rx, y, rx - stem, y),
    line(rx - stem, y, rx - stem, c),
    arc(x + A, c, A - stem, end, PI),
    line(x + stem, c, x + stem, y),
    line(x + stem, y, x, y),
  ]);
};
// c: the o cut open on the right, 34° above and below the center line. The cuts point at the center.
// Their four corners are rounded by q, so the cut ends sit with the pill of the l
const open = (cx: number) => {
  const q = 3;
  const fo = Math.asin(q / (ro - q)); // where a corner arc meets the outer circle, from the cut
  const fi = Math.asin(q / (ri + q)); // and the inner circle
  const at = (rad: number, ang: number): [number, number] => [cx + rad * Math.cos(ang), mid - rad * Math.sin(ang)];
  const cut = (r0: number, r1: number, ang: number) => line(...at(r0, ang), ...at(r1, ang));
  const corner = (cr: number, ang: number, from: number, to: number) => arc(...at(cr, ang), q, from, to);
  return trace([
    arc(cx, mid, ro, a + fo, 2 * PI - a - fo), // the outer curve, over the top and down the left
    corner(ro - q, -a - fo, -a - fo, -a + PI / 2), // the lower cut: outer corner,
    cut((ro - q) * Math.cos(fo), (ri + q) * Math.cos(fi), -a), // the cut,
    corner(ri + q, -a - fi, -a + PI / 2, -a - fi + PI), // inner corner
    arc(cx, mid, ri, 2 * PI - a - fi, a + fi), // the counter, back up the left
    corner(ri + q, a + fi, a + fi + PI, a + 1.5 * PI), // the upper cut: inner corner,
    cut((ri + q) * Math.cos(fi), (ro - q) * Math.cos(fo), a), // the cut,
    corner(ro - q, a + fo, a + 1.5 * PI, a + fo + 2 * PI), // outer corner
  ]);
};
// l: a pill from the ascender line to the baseline. Its round ends overshoot both lines like the bowls do
const pill = (x: number) => {
  const rad = lw / 2;
  const y0 = base - 9 * U - ovr + rad; // the center of the top cap
  const y1 = base + ovr - rad; // and of the bottom cap
  return trace([arc(x + rad, y0, rad, PI, 0), line(x + lw, y0, x + lw, y1), arc(x + rad, y1, rad, 0, -PI), line(x, y1, x, y0)]);
};
// o: two circles. They run in opposite directions, so the fill leaves the counter open
const ring = (cx: number) => [trace([arc(cx, mid, ro, PI, 3 * PI)]), trace([arc(cx, mid, ri, PI, -PI)])];

// Each letter: its contours at x, and the width of its ink. The c's ink stops at its terminals
const letters: [(x: number) => number[][][], number][] = [
  [(x) => [arch(x, true)], 2 * A],
  [(x) => [arch(x, false)], 2 * A],
  [(x) => [open(x + ro)], ro + ro * Math.cos(a)],
  [(x) => [pill(x)], lw],
  [(x) => ring(x + ro), 2 * ro],
];

// ── The lockup: icon and wordmark on one baseline ────────────────────────
// The icon is 1.45 x-heights tall, so it leads but does not overpower the word; its lowest lobe
// touches the baseline; the n starts 1.5 stems after the tip of the right lobe
const xs = rawShape.map((p) => p[0]);
const ys = rawShape.map((p) => p[1]);
const S = (1.45 * xh) / (Math.max(...ys) - Math.min(...ys));
export const brandIcon = placeIcon(S, pad - S * Math.min(...xs), base - S * Math.max(...ys));

let x = brandIcon.cx + S * Math.max(...xs) + 1.5 * stem;
/** The wordmark: one list of contours per letter. */
export const glyphs = letters.map(([glyph, w], i) => {
  const contours = glyph(x);
  x += w + (kern[i] ?? 0);
  return contours;
});

/** The box around a drawing: [x, y, width, height], with room for the pens that ride the outlines. */
export function box(contours: number[][][], margin = 5): [number, number, number, number] {
  const pts = contours.flat();
  const x0 = Math.floor(Math.min(...pts.map((p) => p[0])) - margin);
  const y0 = Math.floor(Math.min(...pts.map((p) => p[1])) - margin);
  const x1 = Math.ceil(Math.max(...pts.map((p) => p[0])) + margin);
  const y1 = Math.ceil(Math.max(...pts.map((p) => p[1])) + margin);
  return [x0, y0, x1 - x0, y1 - y0];
}
export const brandBox = box([brandIcon.shape, ...glyphs.flat()]);

/** The path of the first k points of each contour, closed once the contour is complete. */
export const pathD = (contours: number[][][], k = N) =>
  contours.map((pts) => "M" + pts.slice(0, k + 1).map((p) => p.map((v) => Math.round(v * 10) / 10).join(",")).join("L") + (k === N ? "Z" : "")).join("");

export const GRADIENT = { from: "#ea3f25", to: "#ed6a2c" };
export const INK = "#111";
export const STROKE = "#f26a2e";
