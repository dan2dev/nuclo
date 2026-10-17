import { css, cx } from "../styles.ts";
import { brandBox, brandIcon, glyphs, icon, pathD, GRADIENT, INK, N, STROKE, type Icon } from "./brand-geometry.ts";

// The icon and the lockup, drawn the way they were designed and read: left to right. A Spirograph
// wheel draws the icon and its ink sets; then a pen draws each letter in turn, n to o, each inking
// as the next begins. SSR paints the finished logo; in the browser an animated instance starts
// over: once on mount, or each time more than half of it scrolls into view (it clears again when it
// leaves). `html[data-anim]` (set when JS runs and motion is allowed) hides it until then, so the
// finished logo never flashes first. With `hideWordAfter`, the word runs on a clock of its own: once the
// page scrolls past that many px it is un-drawn, o to n, each ink lifting back to its line and the pen
// winding it up; back above, it is drawn again. The svg's `data-word="off"` marks it gone, for a layout
// that closes the space it leaves. `data-draw="on"` marks a drawing begun: a data attribute, not a class,
// because a forceUpdate() rebuild re-applies the build's classes and would drop it.
//
// Build an animated instance once (a module-level const) where its host can be rebuilt by forceUpdate():
// the rebuild then re-applies this same closure, whose clock, scope and listeners carry on. A new
// Drawing() over the old element would start a second clock the element never hears from.

const svg = css("components-nuclobrand-svg", { display: "block", height: "auto", flexShrink: 0 });

let instances = 0;

type Options = { animate?: boolean | "visible"; hideWordAfter?: number; class?: ReturnType<typeof css> | null; label?: string | (() => string) };

// One drawn thing: its contours, its fill, and when its pen runs. k is how many points are drawn, ink its fill.
// A letter runs on the word's clock
type Piece = { contours: number[][][]; fill: string; start: number; end: number; letter: boolean; k: number; ink: number };

const ICON_DRAW = 1.4; // seconds the wheel takes
const LETTER_DRAW = 0.34; // seconds a pen takes per letter
const INK_SET = 0.28; // seconds the ink takes to set, starting just before the pen finishes
const LEAD = 0.1;
const UNDRAW = 1.6; // how much faster the word is un-drawn than drawn

function Drawing(ic: Icon, letters: number[][][][], view: [number, number, number, number], width: number, { animate = false, hideWordAfter, class: extra = null, label = "Nuclo" }: Options) {
  const id = `nuclo-brand-${instances++}`;

  // The timeline: the icon's two pens share the wheel's window; each letter follows the last
  const piece = (contours: number[][][], fill: string, start: number, end: number, letter = false): Piece => ({ contours, fill, start, end, letter, k: N, ink: 1 });
  const pieces = [piece([ic.shape], `url(#${id}-fill)`, 0, ICON_DRAW), piece([ic.play], INK, 0, ICON_DRAW)];
  let t = ICON_DRAW;
  for (const contours of letters) {
    pieces.push(piece(contours, "currentColor", t - LEAD, t - LEAD + LETTER_DRAW, true));
    t += LETTER_DRAW - LEAD;
  }
  const wheel = pieces[0];
  const total = pieces[pieces.length - 1].end + INK_SET;
  const bare = ICON_DRAW - LEAD; // the word's clock with no letter begun

  let el: SVGSVGElement;
  let now = Infinity; // seconds into the drawing; the finished logo for SSR
  let wt = Infinity; // seconds into the word's part of it: it follows `now`, and runs back to `bare` while the word is hidden
  let showWord = true;
  let still = false; // no motion: the word goes and comes back at once
  let last = 0;
  let raf = 0;
  const seg = (at: number, from: number, to: number) => Math.min(1, Math.max(0, (at - from) / (to - from)));
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  const at = (p: Piece) => (p.letter ? wt : now);
  function paint() {
    for (const p of pieces) {
      p.k = Math.round(ease(seg(at(p), p.start, p.end)) * N);
      p.ink = seg(at(p), p.end - LEAD, p.end - LEAD + INK_SET);
    }
    update(id);
  }
  function tick(ms: number) {
    const dt = Math.max(0, ms - last) / 1000;
    last = ms;
    now = Math.min(total, now + dt);
    wt = showWord ? Math.min(now, wt + dt) : Math.min(wt, Math.max(bare, wt - dt * UNDRAW));
    paint();
    if (!showWord && wt <= bare) el.dataset.word = "off";
    raf = now < total || (showWord ? wt < now : wt > bare) ? requestAnimationFrame(tick) : 0;
  }
  function run() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function start() {
    el.dataset.draw = "on";
    now = wt = 0;
    paint();
    run();
  }
  // Back to the blank page, hidden, ready to be drawn again
  function clear() {
    cancelAnimationFrame(raf);
    raf = 0;
    delete el.dataset.draw;
    now = wt = -1;
    paint();
  }
  function setWord(on: boolean) {
    if (on === showWord) return;
    showWord = on;
    if (on) el.dataset.word = "on";
    now = Math.min(now, total); // the finished logo's clock, from SSR
    wt = Math.min(wt, now);
    if (!still) return run();
    wt = on ? now : bare;
    paint();
    if (!on) el.dataset.word = "off";
  }

  // A pen is on the page from the moment it starts until its ink has set
  const penOpacity = (p: Piece) => (at(p) <= p.start ? 0 : 1 - p.ink);
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
      onMount: animate || hideWordAfter !== undefined
        ? (node: SVGSVGElement) => {
            el = node;
            still = !document.documentElement.hasAttribute("data-anim");
            const ac = new AbortController();
            let io: IntersectionObserver | undefined;
            if (animate === "visible" && !still) {
              io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : clear()), { threshold: 0.5 });
              io.observe(el);
            } else if (animate && !still) start();
            if (hideWordAfter !== undefined) {
              const check = () => setWord(scrollY <= hideWordAfter);
              addEventListener("scroll", check, { passive: true, signal: ac.signal });
              check();
            }
            return () => { ac.abort(); io?.disconnect(); cancelAnimationFrame(raf); };
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
