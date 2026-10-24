import "nuclo";
import { styles as s } from "./styles";

// The Nuclo mark, drawn the way nuclo.dev draws it: a Spirograph wheel rolls inside a ring and
// two pens on the wheel trace the mark and its play triangle, then the ink sets.
// Every animated value is a plain variable read by a () => attribute; update("logo") repaints
// only this svg each frame.

const N = 360; // points per pen lap
const R = 96; // the fixed ring
const r = 32; // the rolling wheel: R / r = 3 gives three lobes
const S = 88 / (R - r + 90); // fits the mark in the 200 × 200 box
const DRAW = 1.4; // seconds for one lap of the wheel
const INK = 0.2; // seconds for the ink to set

// One lap of a pen at distance d from the wheel's center
const lap = (d: number) =>
	Array.from({ length: N + 1 }, (_, i) => {
		const t = (i / N) * 2 * Math.PI;
		const u = ((R - r) / r) * t;
		return [100 + S * ((R - r) * Math.cos(t) + d * Math.cos(u)), 100 + S * ((R - r) * Math.sin(t) - d * Math.sin(u))];
	});
const hub = lap(0);
const shape = lap(90);
const play = lap(12);

let k = 0; // points drawn so far
let ink = 0; // 0 → 1 once the outline is closed

const path = (pts: number[][]) =>
	"M" + pts.slice(0, k + 1).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + (k === N ? "Z" : "");

function draw() {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
		k = N;
		ink = 1;
		return update("logo");
	}
	const start = performance.now();
	const frame = (now: number) => {
		const t = (now - start) / 1000;
		k = Math.round((0.5 - Math.cos(Math.PI * Math.min(1, t / DRAW)) / 2) * N);
		ink = Math.min(1, Math.max(0, (t - DRAW) / INK));
		update("logo");
		if (ink < 1) requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
}

const arm = (pts: number[][]) =>
	lineSvg({ x1: () => hub[k][0], y1: () => hub[k][1], x2: () => pts[k][0], y2: () => pts[k][1] });

const pen = (pts: number[][]) =>
	circleSvg({ cx: () => pts[k][0], cy: () => pts[k][1], r: 5, fill: "currentColor", stroke: "#f26a2e", "stroke-width": 1.5, opacity: () => 1 - ink });

const trace = (pts: number[][], fill: string) =>
	pathSvg({ d: () => path(pts), fill, "fill-opacity": () => ink, stroke: "#f26a2e", "stroke-width": 2, "stroke-opacity": () => 1 - ink });

export const Logo = () => svgSvg(
	s.logo,
	{ viewBox: "0 0 200 200", width: 128, height: 128, role: "img", "aria-label": "Nuclo", onMount: draw },
	scope("logo"),
	defsSvg(
		linearGradientSvg(
			{ id: "nuclo-fill", x1: 0, y1: 0, x2: 0, y2: 1 },
			stopSvg({ offset: "0", "stop-color": "#ea3f25" }),
			stopSvg({ offset: "1", "stop-color": "#ed6a2c" }),
		),
	),
	// The ring, the wheel and its arms fade out as the ink sets
	gSvg(
		{ fill: "none", stroke: "#f26a2e", "stroke-width": 2, opacity: () => 1 - ink },
		circleSvg({ cx: 100, cy: 100, r: R * S, "stroke-opacity": 0.25 }),
		circleSvg({ cx: () => hub[k][0], cy: () => hub[k][1], r: r * S }),
		arm(shape),
		arm(play),
	),
	trace(shape, "url(#nuclo-fill)"),
	trace(play, "#111"),
	pen(shape),
	pen(play),
);
