/**
 * SVG examples: charts built from the SVG tag builders, with dynamic
 * attributes for the data and SMIL elements for animation. The previews read
 * the site's theme through currentColor and CSS variables; the sources keep
 * plain colors.
 */
import { css } from "../../styles.ts";
import { es } from "./styles.ts";

export interface SvgExample {
  id: string;
  docs: string;
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

const ss = {
  wrap: css("pages-examples-svg-demos-wrap", { display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", width: "100%", maxWidth: "380px" }),
  svg: css("pages-examples-svg-demos-svg", { width: "100%", height: "auto", overflow: "visible", color: "var(--c-primary)" }),
  axis: css("pages-examples-svg-demos-axis", { raw: { stroke: "var(--c-border-light)" } }),
  label: css("pages-examples-svg-demos-label", { fontFamily: "ui-monospace, monospace", fontSize: "11px", raw: { fill: "var(--c-text-muted)" } }),
  value: css("pages-examples-svg-demos-value", { fontWeight: "700", fontSize: "22px", raw: { fill: "var(--c-text)" } }),
  bar: css("pages-examples-svg-demos-bar", { transition: "y 0.4s ease, height 0.4s ease" }),
  // A <text> y attribute does not transition, so the value label rides a group whose CSS transform does.
  barLabel: css("pages-examples-svg-demos-barLabel", { transition: "transform 0.4s ease" }),
  ring: css("pages-examples-svg-demos-ring", { transition: "stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease" }),
  track: css("pages-examples-svg-demos-track", { raw: { stroke: "var(--c-bg-light)" } }),
  dot: css("pages-examples-svg-demos-dot", { transition: "cx 0.4s ease, cy 0.4s ease", raw: { fill: "var(--c-bg-card)" } }),
  line: css("pages-examples-svg-demos-line", { transition: "d 0.4s ease" }),
  cool: css("pages-examples-svg-demos-cool", { color: "var(--c-accent-cool)" }),
  small: css("pages-examples-svg-demos-small", { maxWidth: "230px" }),
  warm: css("pages-examples-svg-demos-warm", { color: "var(--c-accent-secondary)" }),
};

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

// ── Bar chart ────────────────────────────────────────────────────────────

function BarChart() {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let data = [40, 72, 55, 90, 30, 64];
  const scale = 1.3; // 100 → 130px
  const barY = (v: number) => 140 - v * scale;

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: "0 0 320 160", role: "img", "aria-label": "Bar chart" },
      lineSvg(ss.axis, { x1: "0", y1: "140.5", x2: "320", y2: "140.5" }),
      ...labels.map((label, i) =>
        gSvg(
          rectSvg(ss.bar, {
            x: String(i * 52 + 14),
            width: "36",
            rx: "5",
            fill: "currentColor",
            y: () => String(barY(data[i])),
            height: () => String(data[i] * scale),
          }),
          textSvg(ss.label, { x: String(i * 52 + 32), y: "156", "text-anchor": "middle" }, label),
          gSvg(
            ss.barLabel,
            { style: () => ({ transform: `translateY(${barY(data[i]) - 6}px)` }) },
            textSvg(ss.label, { x: String(i * 52 + 32), y: "0", "text-anchor": "middle" }, () => String(data[i])),
          ),
        ),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "Randomize", { onClick: () => { data = data.map(() => rand(10, 100)); update(); } }),
      button(es.button, "Sort", { onClick: () => { data = [...data].sort((a, b) => a - b); update(); } }),
    ),
  );
}

const BAR_CHART_CODE = `import 'nuclo'

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
let data = [40, 72, 55, 90, 30, 64]

const rand = () => Math.round(10 + Math.random() * 90)
const barY = (value: number) => 140 - value * 1.3

// Every SVG builder ends in "Svg". Attributes that depend on
// data are functions, so update() moves the bars. A CSS
// transition on y and height animates the move.
export const BarChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 320 160', width: '320', height: '160' },
      lineSvg({ x1: 0, y1: 140.5, x2: 320, y2: 140.5, stroke: '#ccc' }),
      ...labels.map((label, i) =>
        gSvg(
          rectSvg({
            x: i * 52 + 14,
            width: 36,
            rx: 5,
            fill: '#ff3f00',
            style: { transition: 'y 0.4s, height 0.4s' },
            y: () => barY(data[i]),
            height: () => data[i] * 1.3,
          }),
          textSvg(
            { x: i * 52 + 32, y: 156, 'text-anchor': 'middle' },
            label,
          ),
          // A text's y does not transition; a CSS transform does.
          gSvg(
            {
              style: () => ({
                transition: 'transform 0.4s',
                transform: \`translateY(\${barY(data[i]) - 6}px)\`,
              }),
            },
            textSvg(
              { x: i * 52 + 32, y: 0, 'text-anchor': 'middle' },
              () => data[i],
            ),
          ),
        ),
      ),
    ),
    button('Randomize', {
      onClick: () => { data = data.map(rand); update() },
    }),
    button('Sort', {
      onClick: () => { data = [...data].sort((a, b) => a - b); update() },
    }),
  )`;

// ── Line chart ───────────────────────────────────────────────────────────

function LineChart() {
  let points = [20, 45, 30, 70, 55, 85, 60];
  const W = 320;
  const H = 150;
  const x = (i: number) => (i / (points.length - 1)) * (W - 20) + 10;
  const y = (v: number) => H - 10 - v * 1.2;
  const line = () => points.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = () => `${line()} L${x(points.length - 1)},${H} L${x(0)},${H} Z`;

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H + 10}`, role: "img", "aria-label": "Line chart" },
      defsSvg(
        linearGradientSvg(
          { id: "ex-line-fill", x1: "0", y1: "0", x2: "0", y2: "1" },
          stopSvg({ offset: "0", "stop-color": "currentColor", "stop-opacity": "0.35" }),
          stopSvg({ offset: "1", "stop-color": "currentColor", "stop-opacity": "0" }),
        ),
      ),
      ...[0, 25, 50, 75, 100].map((v) => lineSvg(ss.axis, { x1: "10", x2: String(W - 10), y1: String(y(v) + 0.5), y2: String(y(v) + 0.5), "stroke-dasharray": v ? "2 4" : "" })),
      pathSvg(ss.line, { fill: "url(#ex-line-fill)", stroke: "none", d: area }),
      pathSvg(ss.line, { fill: "none", stroke: "currentColor", "stroke-width": "2.5", "stroke-linejoin": "round", d: line }),
      ...points.map((_, i) =>
        circleSvg(ss.dot, { r: "4", stroke: "currentColor", "stroke-width": "2", cx: String(x(i)), cy: () => String(y(points[i])) }),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "New data", { onClick: () => { points = points.map(() => rand(5, 100)); update(); } }),
      button(es.button, "Smooth", { onClick: () => { points = points.map((v, i, all) => Math.round((all[i - 1] ?? v) * 0.25 + v * 0.5 + (all[i + 1] ?? v) * 0.25)); update(); } }),
    ),
  );
}

const LINE_CHART_CODE = `import 'nuclo'

let points = [20, 45, 30, 70, 55, 85, 60]

const x = (i: number) => (i / (points.length - 1)) * 300 + 10
const y = (value: number) => 140 - value * 1.2

// A path's d is a plain string, so build it from the data.
const line = () =>
  points.map((v, i) => \`\${i ? 'L' : 'M'}\${x(i)},\${y(v)}\`).join(' ')
const area = () => \`\${line()} L\${x(6)},150 L\${x(0)},150 Z\`

export const LineChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 320 160', width: '320', height: '160' },
      defsSvg(
        linearGradientSvg(
          { id: 'fill', x1: 0, y1: 0, x2: 0, y2: 1 },
          stopSvg({
            offset: 0, 'stop-color': '#ff3f00', 'stop-opacity': 0.35,
          }),
          stopSvg({
            offset: 1, 'stop-color': '#ff3f00', 'stop-opacity': 0,
          }),
        ),
      ),
      pathSvg({ fill: 'url(#fill)', d: area }),
      pathSvg({
        fill: 'none', stroke: '#ff3f00', 'stroke-width': 2.5, d: line,
      }),
      ...points.map((_, i) =>
        circleSvg({
          r: 4,
          fill: '#fff',
          stroke: '#ff3f00',
          'stroke-width': 2,
          cx: x(i),
          cy: () => y(points[i]),
        }),
      ),
    ),
    button('New data', {
      onClick: () => {
        points = points.map(() => Math.round(5 + Math.random() * 95))
        update()
      },
    }),
  )`;

// ── Donut chart ──────────────────────────────────────────────────────────

function DonutChart() {
  const names = ["Core", "Router", "Docs"];
  let parts = [52, 18, 30];
  const R = 54;
  const C = 2 * Math.PI * R;
  const total = () => parts.reduce((a, b) => a + b, 0);
  const share = (i: number) => parts[i] / total();
  const start = (i: number) => parts.slice(0, i).reduce((a, b) => a + b, 0) / total();

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "0 0 160 160", role: "img", "aria-label": "Donut chart" },
      circleSvg(ss.track, { cx: "80", cy: "80", r: String(R), fill: "none", "stroke-width": "18" }),
      ...parts.map((_, i) =>
        circleSvg(ss.ring, i === 1 ? ss.cool : i === 2 ? ss.warm : null, {
          cx: "80", cy: "80", r: String(R), fill: "none", stroke: "currentColor", "stroke-width": "18",
          transform: "rotate(-90 80 80)",
          "stroke-dasharray": () => `${share(i) * C} ${C}`,
          "stroke-dashoffset": () => String(-start(i) * C),
        }),
      ),
      textSvg(ss.value, { x: "80", y: "80", "text-anchor": "middle", "dominant-baseline": "middle" }, () => `${Math.round(share(0) * 100)}%`),
      textSvg(ss.label, { x: "80", y: "102", "text-anchor": "middle" }, names[0]),
    ),
    div(
      es.buttonRow,
      ...names.map((name, i) => button(es.button, `+ ${name}`, { onClick: () => { parts[i] += 10; update(); } })),
      button(es.button, "Reset", { onClick: () => { parts = [52, 18, 30]; update(); } }),
    ),
  );
}

const DONUT_CHART_CODE = `import 'nuclo'

const names = ['Core', 'Router', 'Docs']
const colors = ['#ff3f00', '#2563eb', '#ff8a00']
let parts = [52, 18, 30]

const C = 2 * Math.PI * 54 // the ring's circumference
const total = () => parts.reduce((a, b) => a + b, 0)
const share = (i: number) => parts[i] / total()
const before = (i: number) =>
  parts.slice(0, i).reduce((a, b) => a + b, 0) / total()

// One circle per slice: the dash array is its share of the ring,
// the dash offset moves it past the slices before it.
export const DonutChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 160 160', width: '160', height: '160' },
      ...parts.map((_, i) =>
        circleSvg({
          cx: 80, cy: 80, r: 54, fill: 'none', 'stroke-width': 18,
          stroke: colors[i],
          transform: 'rotate(-90 80 80)',
          'stroke-dasharray': () => \`\${share(i) * C} \${C}\`,
          'stroke-dashoffset': () => -before(i) * C,
        }),
      ),
      textSvg(
        { x: 80, y: 80, 'text-anchor': 'middle' },
        { 'dominant-baseline': 'middle' },
        () => \`\${Math.round(share(0) * 100)}%\`,
      ),
    ),
    ...names.map((name, i) =>
      button(\`+ \${name}\`, { onClick: () => { parts[i] += 10; update() } }),
    ),
  )`;

// ── SMIL animation ───────────────────────────────────────────────────────

function Orbit() {
  let svg: SVGSVGElement | undefined;
  let paused = false;
  let speed = 1;

  function setSpeed(next: number) {
    speed = next;
    update();
  }

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "0 0 200 200", role: "img", "aria-label": "Orbit animation" },
      ((el: SVGSVGElement) => { svg = el; }) as any,
      circleSvg(ss.track, { cx: "100", cy: "100", r: "70", fill: "none", "stroke-width": "1.5", "stroke-dasharray": "3 5" }),
      // The sun pulses: animateSvg drives one attribute between values.
      circleSvg(
        { cx: "100", cy: "100", r: "22", fill: "currentColor" },
        animateSvg({ attributeName: "r", values: "22;26;22", dur: "2s", repeatCount: "indefinite" }),
      ),
      // The planet orbits: animateTransformSvg rotates its group. dur is dynamic, so update() changes the speed.
      gSvg(
        animateTransformSvg({ attributeName: "transform", type: "rotate", from: "0 100 100", to: "360 100 100", repeatCount: "indefinite", dur: () => `${6 / speed}s` }),
        circleSvg(ss.cool, { cx: "170", cy: "100", r: "10", fill: "currentColor" }),
        gSvg(
          animateTransformSvg({ attributeName: "transform", type: "rotate", from: "0 170 100", to: "360 170 100", dur: "1.5s", repeatCount: "indefinite" }),
          circleSvg(ss.warm, { cx: "188", cy: "100", r: "4", fill: "currentColor" }),
        ),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, () => (paused ? "Play" : "Pause"), {
        onClick: () => { paused = !paused; paused ? svg?.pauseAnimations() : svg?.unpauseAnimations(); update(); },
      }),
      button(es.button, "Slower", { onClick: () => setSpeed(Math.max(0.25, speed / 2)) }),
      button(es.button, () => `${speed}×`, { onClick: () => setSpeed(1) }),
      button(es.button, "Faster", { onClick: () => setSpeed(Math.min(8, speed * 2)) }),
    ),
  );
}

const ORBIT_CODE = `import 'nuclo'

let svg: SVGSVGElement | undefined
let paused = false
let speed = 1

// SMIL elements are builders too: animateSvg drives one attribute,
// animateTransformSvg a transform. A modifier function receives the
// element, here to keep the <svg> for pauseAnimations().
export const Orbit = () =>
  div(
    svgSvg(
      { viewBox: '0 0 200 200', width: '200', height: '200' },
      (el) => { svg = el },
      circleSvg(
        { cx: 100, cy: 100, r: 22, fill: '#ff3f00' },
        animateSvg({
          attributeName: 'r', values: '22;26;22', dur: '2s',
          repeatCount: 'indefinite',
        }),
      ),
      gSvg(
        animateTransformSvg({
          attributeName: 'transform', type: 'rotate',
          from: '0 100 100', to: '360 100 100', repeatCount: 'indefinite',
          dur: () => \`\${6 / speed}s\`, // dynamic: update() changes the speed
        }),
        circleSvg({ cx: 170, cy: 100, r: 10, fill: '#2563eb' }),
      ),
    ),
    button(() => (paused ? 'Play' : 'Pause'), {
      onClick: () => {
        paused = !paused
        paused ? svg?.pauseAnimations() : svg?.unpauseAnimations()
        update()
      },
    }),
    button('Faster', { onClick: () => { speed *= 2; update() } }),
  )`;

export const SVG_EXAMPLES: SvgExample[] = [
  { id: "bar-chart", docs: "tag-builders", title: "Bar Chart", desc: "Rects from an array. Their y and height are functions of the data, so update() moves the bars.", code: BAR_CHART_CODE, preview: BarChart },
  { id: "line-chart", docs: "tag-builders", title: "Line Chart", desc: "A path whose d is built from the points, with a gradient area and one circle per point.", code: LINE_CHART_CODE, preview: LineChart },
  { id: "donut-chart", docs: "tag-builders", title: "Donut Chart", desc: "One circle per slice. stroke-dasharray gives each its share of the ring and stroke-dashoffset its start.", code: DONUT_CHART_CODE, preview: DonutChart },
  { id: "svg-animation", docs: "tag-builders", title: "SVG Animation", desc: "SMIL as builders: animateSvg pulses the sun, animateTransformSvg orbits the planet. A dynamic dur sets the speed.", code: ORBIT_CODE, preview: Orbit },
];
