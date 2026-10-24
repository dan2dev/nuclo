/**
 * nuclo/nuclo-logo — the Nuclo logo (mark and name) as a nuclo component, drawn the
 * way nuclo.dev draws it: a Spirograph wheel rolls inside a ring and its two pens
 * trace the mark; then a pen writes each letter, n to o, each inking as the next begins.
 *
 *   import nucloLogo from "nuclo/nuclo-logo";
 *   main(nucloLogo({ height: 48 }));
 *
 * Its own entry, so apps that never show the logo never ship it. It builds on the
 * runtime's globals (svgSvg, scope, update, …), so the app imports "nuclo" as usual.
 * The svg starts finished, which is what SSR sends; on mount it is drawn again unless
 * `animate` is off or the visitor prefers reduced motion.
 */
import { brandBox, brandIcon as ic, glyphs, pathD, GRADIENT, INK, N, STROKE } from "./geometry";

export type NucloLogoOptions = {
	/** Height in px; the width follows the logo's proportions. Default 32. */
	height?: number;
	/** Draw the logo when it mounts. Default true. */
	animate?: boolean;
};

const ICON_DRAW = 1.4; // seconds the wheel takes
const LETTER_DRAW = 0.6; // seconds a pen takes per letter
const LEAD = 0.2; // how early each letter starts, before the last one ends
const INK_SET = 0.2; // seconds the ink takes to set, once the pen has closed the outline

// One drawn thing: its contours, its fill and when its pen runs. k is how many points are drawn, ink its fill
type Piece = { contours: number[][][]; fill: string; start: number; end: number; letter: boolean; k: number; ink: number };

let instances = 0;

export default function nucloLogo({ height = 32, animate = true }: NucloLogoOptions = {}, ...mods: SVGElementModifierLike<"svg">[]) {
	const id = `nuclo-logo-${instances++}`;
	const width = Math.round((height * brandBox[2]) / brandBox[3]);
	const sw = +(1.2 / (width / brandBox[2])).toFixed(2); // a ~1.2px pen line whatever the size

	const piece = (contours: number[][][], fill: string, start: number, letter = false): Piece =>
		({ contours, fill, start, end: start + (letter ? LETTER_DRAW : ICON_DRAW), letter, k: N, ink: 1 });
	const pieces = [
		piece([ic.shape], `url(#${id}-fill)`, 0),
		piece([ic.play], INK, 0),
		...glyphs.map((contours, i) => piece(contours, "currentColor", ICON_DRAW - LEAD + i * (LETTER_DRAW - LEAD), true)),
	];
	const wheel = pieces[0];
	const total = pieces[pieces.length - 1].end + INK_SET;
	let now = total; // seconds into the drawing: the finished logo until it is drawn

	function paint() {
		const seg = (from: number, to: number) => Math.min(1, Math.max(0, (now - from) / (to - from)));
		for (const p of pieces) {
			p.k = Math.round((0.5 - Math.cos(Math.PI * seg(p.start, p.end)) / 2) * N);
			p.ink = seg(p.end, p.end + INK_SET); // fills only once the outline is closed
		}
		update(id);
	}

	// onMount runs before the first paint, so the finished logo never flashes
	function draw() {
		if (!animate || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		const start = performance.now();
		let raf = 0;
		const frame = (ms: number) => {
			now = Math.min(total, (ms - start) / 1000);
			paint();
			if (now < total) raf = requestAnimationFrame(frame);
		};
		now = 0;
		paint();
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}

	// A pen is on the page from the moment it starts until its ink has set
	const pen = (p: Piece, pts: number[][]) =>
		circleSvg({ cx: () => pts[p.k][0], cy: () => pts[p.k][1], r: 5, fill: "currentColor", stroke: STROKE, "stroke-width": 1.5, opacity: () => (now <= p.start ? 0 : 1 - p.ink) });

	const arm = (p: Piece) =>
		lineSvg({ x1: () => ic.hub[p.k][0], y1: () => ic.hub[p.k][1], x2: () => p.contours[0][p.k][0], y2: () => p.contours[0][p.k][1] });

	// The line a pen has drawn so far. It fills when the contour closes
	const trace = (p: Piece) =>
		pathSvg({ d: () => pathD(p.contours, p.k), fill: p.fill, "fill-opacity": () => p.ink, stroke: p.letter ? p.fill : STROKE, "stroke-width": sw, "stroke-opacity": () => (p.letter || p.ink < 1 ? 1 : 0) });

	return svgSvg(
		{ viewBox: brandBox.join(" "), width, height, role: "img", "aria-label": "Nuclo", onMount: draw },
		...mods,
		scope(id),
		defsSvg(
			linearGradientSvg(
				{ id: `${id}-fill`, x1: 0, y1: 0, x2: 0, y2: 1 },
				stopSvg({ offset: "0", "stop-color": GRADIENT.from }),
				stopSvg({ offset: "1", "stop-color": GRADIENT.to }),
			),
		),
		// The ring, the wheel and its arms fade out as the mark's ink sets
		gSvg(
			{ fill: "none", stroke: STROKE, "stroke-width": sw, opacity: () => 1 - wheel.ink },
			circleSvg({ cx: ic.cx, cy: ic.cy, r: ic.ring, "stroke-opacity": 0.25 }),
			circleSvg({ cx: () => ic.hub[wheel.k][0], cy: () => ic.hub[wheel.k][1], r: ic.wheel }),
			arm(pieces[0]),
			arm(pieces[1]),
		),
		...pieces.map(trace),
		...pieces.flatMap((p) => p.contours.map((pts) => pen(p, pts))),
	);
}
