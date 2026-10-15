import { css, cx } from "../styles.ts";
import { brandBox, brandIcon, glyphs, icon, pathD, GRADIENT, INK, N, STROKE, type Icon } from "./brand-geometry.ts";

// The icon and the lockup, drawn the way they were designed: a Spirograph wheel draws the
// icon, pens draw the letters, then the ink fills everything at once. SSR paints the finished
// logo; in the browser an animated instance starts over on mount and replays on click.
// `html[data-anim]` (set when JS runs and motion is allowed) hides it until hydration starts
// the drawing, so the finished logo never flashes first.

const svg = css("components-nuclobrand-svg", { display: "block", height: "auto", flexShrink: 0 });

let instances = 0;

type Options = { animate?: boolean; class?: ReturnType<typeof css> | null; label?: string };

function Drawing(ic: Icon, contours: number[][][][], view: [number, number, number, number], width: number, { animate = false, class: extra = null, label = "Nuclo" }: Options) {
  const id = `nuclo-brand-${instances++}`;
  // Timeline in seconds: the pens draw (0–2.2), the ink fills everything (2–2.7)
  let t0 = 0;
  let k = N; // points drawn
  let ink = 1; // fill opacity
  const seg = (now: number, from: number, to: number) => Math.min(1, Math.max(0, (now - from) / (to - from)));
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  function tick(ms: number) {
    const now = (ms - t0) / 1000;
    k = Math.round(ease(seg(now, 0, 2.2)) * N);
    ink = seg(now, 2, 2.7);
    update(id);
    if (now < 2.7) requestAnimationFrame(tick);
  }
  function replay() {
    t0 = performance.now();
    requestAnimationFrame(tick);
  }

  const Pen = (pts: number[][]) => circleSvg({ cx: () => pts[k][0], cy: () => pts[k][1], r: 5, fill: "currentColor", stroke: STROKE, "stroke-width": 1.5 });
  const Arm = (pts: number[][]) => lineSvg({ x1: () => ic.hub[k][0], y1: () => ic.hub[k][1], x2: () => pts[k][0], y2: () => pts[k][1] });
  // The lines the pens have drawn so far. They fill when the contours close
  const Ink = (cs: number[][][], fill: string) =>
    pathSvg({ d: () => pathD(cs, k), fill, "fill-opacity": () => ink, stroke: STROKE, "stroke-width": 3, "stroke-opacity": () => 1 - ink });

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
            el.classList.add("nuclo-draw-on");
            k = 0;
            ink = 0;
            replay();
          }
        : undefined,
      onClick: animate ? replay : undefined,
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
    // All of it fades out with the pens when the ink fills the shapes
    gSvg(
      { fill: "none", stroke: STROKE, "stroke-width": 2, opacity: () => 1 - ink },
      circleSvg({ cx: ic.cx, cy: ic.cy, r: ic.ring, fill: STROKE, "fill-opacity": 0.2, "stroke-opacity": 0.25 }),
      circleSvg({ cx: () => ic.hub[k][0], cy: () => ic.hub[k][1], r: ic.wheel }),
      Arm(ic.shape),
      Arm(ic.play),
    ),
    Ink([ic.shape], `url(#${id}-fill)`),
    Ink([ic.play], INK),
    ...contours.map((cs) => Ink(cs, "currentColor")),
    gSvg({ opacity: () => 1 - ink }, Pen(ic.shape), Pen(ic.play), ...contours.flat().map(Pen)),
  );
}

/** The icon alone. `size` is its width and height in px. */
export const NucloLogo = ({ size = 138, ...opts }: Options & { size?: number } = {}) =>
  Drawing(icon, [], [0, 0, 200, 200], size, opts);

/** The icon and the wordmark. `height` is the lockup's height in px. */
export const NucloBrand = ({ height = 26, ...opts }: Options & { height?: number } = {}) =>
  Drawing(brandIcon, glyphs, brandBox, Math.round((height * brandBox[2]) / brandBox[3]), opts);
