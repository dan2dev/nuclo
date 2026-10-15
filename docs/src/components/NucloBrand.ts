import { css, cx } from "../styles.ts";
import { brandBox, brandIcon, glyphs, icon, pathD, GRADIENT, INK, N, STROKE, type Icon } from "./brand-geometry.ts";

// The icon and the lockup, drawn the way they were designed and read: left to right. A Spirograph
// wheel draws the icon and its ink sets; then a pen draws each letter in turn, n to o, each inking
// as the next begins. SSR paints the finished logo; in the browser an animated instance starts
// over: once on mount, or each time more than half of it scrolls into view (it clears again when it
// leaves). `html[data-anim]` (set when JS runs and motion is allowed) hides it until then, so the
// finished logo never flashes first.

const svg = css("components-nuclobrand-svg", { display: "block", height: "auto", flexShrink: 0 });

let instances = 0;

type Options = { animate?: boolean | "visible"; class?: ReturnType<typeof css> | null; label?: string };

// One drawn thing: its contours, its fill, and when its pen runs. k is how many points are drawn, ink its fill
type Piece = { contours: number[][][]; fill: string; start: number; end: number; k: number; ink: number };

const ICON_DRAW = 1.4; // seconds the wheel takes
const LETTER_DRAW = 0.34; // seconds a pen takes per letter
const INK_SET = 0.28; // seconds the ink takes to set, starting just before the pen finishes
const LEAD = 0.1;

function Drawing(ic: Icon, letters: number[][][][], view: [number, number, number, number], width: number, { animate = false, class: extra = null, label = "Nuclo" }: Options) {
  const id = `nuclo-brand-${instances++}`;

  // The timeline: the icon's two pens share the wheel's window; each letter follows the last
  const piece = (contours: number[][][], fill: string, start: number, end: number): Piece => ({ contours, fill, start, end, k: N, ink: 1 });
  const pieces = [piece([ic.shape], `url(#${id}-fill)`, 0, ICON_DRAW), piece([ic.play], INK, 0, ICON_DRAW)];
  let t = ICON_DRAW;
  for (const contours of letters) {
    pieces.push(piece(contours, "currentColor", t - LEAD, t - LEAD + LETTER_DRAW));
    t += LETTER_DRAW - LEAD;
  }
  const wheel = pieces[0];
  const total = pieces[pieces.length - 1].end + INK_SET;

  let t0 = 0;
  let now = Infinity; // seconds into the drawing; the finished logo for SSR
  let raf = 0;
  const seg = (at: number, from: number, to: number) => Math.min(1, Math.max(0, (at - from) / (to - from)));
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  function tick(ms: number) {
    now = (ms - t0) / 1000;
    for (const p of pieces) {
      p.k = Math.round(ease(seg(now, p.start, p.end)) * N);
      p.ink = seg(now, p.end - LEAD, p.end - LEAD + INK_SET);
    }
    update(id);
    if (now < total) raf = requestAnimationFrame(tick);
  }
  function start(el: SVGSVGElement) {
    el.classList.add("nuclo-draw-on");
    for (const p of pieces) { p.k = 0; p.ink = 0; }
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  }
  // Back to the blank page, hidden, ready to be drawn again
  function clear(el: SVGSVGElement) {
    cancelAnimationFrame(raf);
    el.classList.remove("nuclo-draw-on");
    now = -1;
    for (const p of pieces) { p.k = 0; p.ink = 0; }
    update(id);
  }

  // A pen is on the page from the moment it starts until its ink has set
  const penOpacity = (p: Piece) => (now < p.start ? 0 : 1 - p.ink);
  const Pen = (p: Piece, pts: number[][]) =>
    circleSvg({ cx: () => pts[p.k][0], cy: () => pts[p.k][1], r: 5, fill: "currentColor", stroke: STROKE, "stroke-width": 1.5, opacity: () => penOpacity(p) });
  const Arm = (p: Piece) => lineSvg({ x1: () => ic.hub[p.k][0], y1: () => ic.hub[p.k][1], x2: () => p.contours[0][p.k][0], y2: () => p.contours[0][p.k][1] });
  // The line a pen has drawn so far. It fills when the contour closes
  const Ink = (p: Piece) =>
    pathSvg({ d: () => pathD(p.contours, p.k), fill: p.fill, "fill-opacity": () => p.ink, stroke: STROKE, "stroke-width": 3, "stroke-opacity": () => 1 - p.ink });

  return svgSvg(
    cx(svg, extra, animate ? "nuclo-draw" : null),
    {
      viewBox: view.join(" "),
      width,
      height: Math.round((width * view[3]) / view[2]),
      role: "img",
      "aria-label": label,
      onMount: animate
        ? (el: SVGSVGElement) => {
            if (!document.documentElement.hasAttribute("data-anim")) return;
            if (animate !== "visible") { start(el); return () => cancelAnimationFrame(raf); }
            const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start(el) : clear(el)), { threshold: 0.5 });
            io.observe(el);
            return () => { io.disconnect(); cancelAnimationFrame(raf); };
          }
        : undefined,
    },
    scope(id),
    defsSvg(
      linearGradientSvg(
        { id: `${id}-fill`, x1: 0, y1: 0, x2: 0, y2: 1 },
        stopSvg({ offset: "0", "stop-color": GRADIENT.from }),
        stopSvg({ offset: "1", "stop-color": GRADIENT.to }),
      ),
    ),
    // The spirograph: ring, wheel and arms. The ring is a dim orange plate under the drawing.
    // All of it fades out with the pens when the ink fills the icon
    gSvg(
      { fill: "none", stroke: STROKE, "stroke-width": 2, opacity: () => 1 - wheel.ink },
      circleSvg({ cx: ic.cx, cy: ic.cy, r: ic.ring, fill: STROKE, "fill-opacity": 0.2, "stroke-opacity": 0.25 }),
      circleSvg({ cx: () => ic.hub[wheel.k][0], cy: () => ic.hub[wheel.k][1], r: ic.wheel }),
      ...pieces.slice(0, 2).map(Arm),
    ),
    ...pieces.map(Ink),
    ...pieces.flatMap((p) => p.contours.map((pts) => Pen(p, pts))),
  );
}

/** The icon alone. `size` is its width and height in px. */
export const NucloLogo = ({ size = 138, ...opts }: Options & { size?: number } = {}) =>
  Drawing(icon, [], [0, 0, 200, 200], size, opts);

/** The icon and the wordmark. `height` is the lockup's height in px. */
export const NucloBrand = ({ height = 26, ...opts }: Options & { height?: number } = {}) =>
  Drawing(brandIcon, glyphs, brandBox, Math.round((height * brandBox[2]) / brandBox[3]), opts);
