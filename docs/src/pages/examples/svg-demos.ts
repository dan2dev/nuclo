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

export const ss = {
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
  ink: css("pages-examples-svg-demos-ink", { raw: { stroke: "var(--c-text)" } }),
  caption: css("pages-examples-svg-demos-caption", { fontFamily: "ui-monospace, monospace", fontSize: "12px", color: "var(--c-text-muted)", textAlign: "center" }),
  arc: css("pages-examples-svg-demos-arc", { transition: "stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }),
  needle: css("pages-examples-svg-demos-needle", { transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)", transformOrigin: "100px 110px" }),
  cell: css("pages-examples-svg-demos-cell", { cursor: "pointer", transition: "fill-opacity 0.2s ease", hover: { raw: { stroke: "var(--c-text)" } } }),
  point: css("pages-examples-svg-demos-point", { cursor: "pointer", transition: "r 0.15s ease, fill-opacity 0.15s ease" }),
  tip: css("pages-examples-svg-demos-tip", { pointerEvents: "none", transition: "opacity 0.15s ease, transform 0.15s ease" }),
  tipBox: css("pages-examples-svg-demos-tipBox", { raw: { fill: "var(--c-text)" } }),
  tipText: css("pages-examples-svg-demos-tipText", { fontFamily: "ui-monospace, monospace", fontSize: "11px", raw: { fill: "var(--c-bg)" } }),
  drag: css("pages-examples-svg-demos-drag", { touchAction: "none" }),
  handle: css("pages-examples-svg-demos-handle", { cursor: "grab", raw: { fill: "var(--c-bg-card)" } }),
  iconRow: css("pages-examples-svg-demos-iconRow", { display: "flex", gap: "28px" }),
  icon: css("pages-examples-svg-demos-icon", { width: "64px", height: "64px", cursor: "pointer" }),
  menuIcon: css("pages-examples-svg-demos-menuIcon", { color: "var(--c-text)", hover: { color: "var(--c-primary)" } }),
  heartIcon: css("pages-examples-svg-demos-heartIcon", { color: "var(--c-primary)" }),
  iconLine: css("pages-examples-svg-demos-iconLine", { transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease", transformOrigin: "12px 12px" }),
  heart: css("pages-examples-svg-demos-heart", { transition: "fill 0.2s ease" }),
};

export const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

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
const rand = () => Math.round(5 + Math.random() * 95)

// A path's d is a plain string, so build it from the data.
const line = () =>
  points.map((v, i) => \`\${i ? 'L' : 'M'}\${x(i)},\${y(v)}\`).join(' ')
const area = () => \`\${line()} L\${x(6)},150 L\${x(0)},150 Z\`

// Each point becomes the average of itself and its neighbours.
const smooth = () =>
  points.map((v, i, all) =>
    Math.round((all[i - 1] ?? v) * 0.25 + v * 0.5 + (all[i + 1] ?? v) * 0.25),
  )

export const LineChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 320 160', width: '320', height: '160' },
      defsSvg(
        linearGradientSvg(
          { id: 'fill', x1: 0, y1: 0, x2: 0, y2: 1 },
          stopSvg({
            offset: '0', 'stop-color': '#ff3f00', 'stop-opacity': 0.35,
          }),
          stopSvg({
            offset: '1', 'stop-color': '#ff3f00', 'stop-opacity': 0,
          }),
        ),
      ),
      // Grid lines at fixed values.
      ...[0, 25, 50, 75, 100].map((v) =>
        lineSvg({
          x1: 10, x2: 310, y1: y(v) + 0.5, y2: y(v) + 0.5,
          stroke: '#ddd', 'stroke-dasharray': v ? '2 4' : '',
        }),
      ),
      pathSvg({
        fill: 'url(#fill)', stroke: 'none', d: area,
        style: { transition: 'd 0.4s' },
      }),
      pathSvg({
        fill: 'none', stroke: '#ff3f00', 'stroke-width': 2.5,
        'stroke-linejoin': 'round', style: { transition: 'd 0.4s' }, d: line,
      }),
      ...points.map((_, i) =>
        circleSvg({
          r: 4,
          fill: '#fff',
          stroke: '#ff3f00',
          'stroke-width': 2,
          style: { transition: 'cx 0.4s, cy 0.4s' },
          cx: x(i),
          cy: () => y(points[i]),
        }),
      ),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button('New data', {
        onClick: () => { points = points.map(rand); update() },
      }),
      button('Smooth', { onClick: () => { points = smooth(); update() } }),
    ),
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
const start = [52, 18, 30]
let parts = [...start]

const C = 2 * Math.PI * 54 // the ring's circumference
const total = () => parts.reduce((a, b) => a + b, 0)
const share = (i: number) => parts[i] / total()
const before = (i: number) =>
  parts.slice(0, i).reduce((a, b) => a + b, 0) / total()

const ring = { cx: 80, cy: 80, r: 54, fill: 'none', 'stroke-width': 18 }

// One circle per slice: the dash array is its share of the ring,
// the dash offset moves it past the slices before it.
export const DonutChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 160 160', width: '160', height: '160' },
      circleSvg(ring, { stroke: '#eee' }),
      ...parts.map((_, i) =>
        circleSvg(ring, {
          stroke: colors[i],
          transform: 'rotate(-90 80 80)',
          style: {
            transition: 'stroke-dasharray 0.5s, stroke-dashoffset 0.5s',
          },
          'stroke-dasharray': () => \`\${share(i) * C} \${C}\`,
          'stroke-dashoffset': () => -before(i) * C,
        }),
      ),
      textSvg(
        {
          x: 80, y: 80, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
          'font-size': 22, 'font-weight': 700,
        },
        () => \`\${Math.round(share(0) * 100)}%\`,
      ),
      textSvg(
        { x: 80, y: 102, 'text-anchor': 'middle', 'font-size': 11 },
        names[0],
      ),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      ...names.map((name, i) =>
        button(\`+ \${name}\`, { onClick: () => { parts[i] += 10; update() } }),
      ),
      button('Reset', { onClick: () => { parts = [...start]; update() } }),
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

const setSpeed = (next: number) => {
  speed = next
  update()
}

// SMIL elements are builders too: animateSvg drives one attribute,
// animateTransformSvg a transform. A modifier function receives the
// element, here to keep the <svg> for pauseAnimations().
export const Orbit = () =>
  div(
    svgSvg(
      { viewBox: '0 0 200 200', width: '200', height: '200' },
      (el: SVGSVGElement) => { svg = el },
      circleSvg({
        cx: 100, cy: 100, r: 70, fill: 'none', stroke: '#eee',
        'stroke-width': 1.5, 'stroke-dasharray': '3 5',
      }),
      // The sun pulses.
      circleSvg(
        { cx: 100, cy: 100, r: 22, fill: '#ff3f00' },
        animateSvg({
          attributeName: 'r', values: '22;26;22', dur: '2s',
          repeatCount: 'indefinite',
        }),
      ),
      // The planet orbits; its moon spins around it.
      gSvg(
        animateTransformSvg({
          attributeName: 'transform', type: 'rotate',
          from: '0 100 100', to: '360 100 100', repeatCount: 'indefinite',
          dur: () => \`\${6 / speed}s\`, // dynamic: update() changes the speed
        }),
        circleSvg({ cx: 170, cy: 100, r: 10, fill: '#2563eb' }),
        gSvg(
          animateTransformSvg({
            attributeName: 'transform', type: 'rotate',
            from: '0 170 100', to: '360 170 100', dur: '1.5s',
            repeatCount: 'indefinite',
          }),
          circleSvg({ cx: 188, cy: 100, r: 4, fill: '#ff8a00' }),
        ),
      ),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button(() => (paused ? 'Play' : 'Pause'), {
        onClick: () => {
          paused = !paused
          paused ? svg?.pauseAnimations() : svg?.unpauseAnimations()
          update()
        },
      }),
      button('Slower', { onClick: () => setSpeed(Math.max(0.25, speed / 2)) }),
      button(() => \`\${speed}×\`, { onClick: () => setSpeed(1) }),
      button('Faster', { onClick: () => setSpeed(Math.min(8, speed * 2)) }),
    ),
  )`;

// ── Gauge ────────────────────────────────────────────────────────────────

function Gauge() {
  let value = 62;
  const ARC = Math.PI * 70; // length of the half circle
  const set = (next: number) => { value = Math.max(0, Math.min(100, next)); update(); };

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "0 0 200 150", role: "img", "aria-label": "Gauge" },
      pathSvg(ss.track, { d: "M30,110 A70,70 0 0 1 170,110", fill: "none", "stroke-width": "14", "stroke-linecap": "round" }),
      pathSvg(ss.arc, {
        d: "M30,110 A70,70 0 0 1 170,110", fill: "none", stroke: "currentColor", "stroke-width": "14", "stroke-linecap": "round",
        "stroke-dasharray": `${ARC} ${ARC}`,
        "stroke-dashoffset": () => String(ARC * (1 - value / 100)),
      }),
      gSvg(
        ss.needle,
        { style: () => ({ transform: `rotate(${-90 + value * 1.8}deg)` }) },
        lineSvg(ss.ink, { x1: "100", y1: "110", x2: "100", y2: "54", "stroke-width": "3", "stroke-linecap": "round" }),
        circleSvg(ss.dot, { cx: "100", cy: "110", r: "6", stroke: "currentColor", "stroke-width": "3" }),
      ),
      textSvg(ss.value, { x: "100", y: "144", "text-anchor": "middle" }, () => `${value}%`),
    ),
    div(
      es.buttonRow,
      button(es.button, "−10", { onClick: () => set(value - 10) }),
      button(es.button, es.buttonPrimary, "Random", { onClick: () => set(rand(0, 100)) }),
      button(es.button, "+10", { onClick: () => set(value + 10) }),
    ),
  );
}

const GAUGE_CODE = `import 'nuclo'

let value = 62
const ARC = Math.PI * 70 // length of the half circle
const set = (next: number) => {
  value = Math.max(0, Math.min(100, next))
  update()
}

// The arc is a dash as long as the half circle; the offset hides
// the part past the value. The needle is a group whose CSS
// transform rotates it around the pivot.
export const Gauge = () =>
  div(
    svgSvg(
      { viewBox: '0 0 200 150', width: '200', height: '150' },
      pathSvg({
        d: 'M30,110 A70,70 0 0 1 170,110', fill: 'none',
        stroke: '#eee', 'stroke-width': 14, 'stroke-linecap': 'round',
      }),
      pathSvg({
        d: 'M30,110 A70,70 0 0 1 170,110', fill: 'none',
        stroke: '#ff3f00', 'stroke-width': 14, 'stroke-linecap': 'round',
        'stroke-dasharray': \`\${ARC} \${ARC}\`,
        style: { transition: 'stroke-dashoffset 0.5s' },
        'stroke-dashoffset': () => ARC * (1 - value / 100),
      }),
      gSvg(
        {
          style: () => ({
            transition: 'transform 0.5s',
            transformOrigin: '100px 110px',
            transform: \`rotate(\${-90 + value * 1.8}deg)\`,
          }),
        },
        lineSvg({
          x1: 100, y1: 110, x2: 100, y2: 54,
          stroke: '#222', 'stroke-width': 3, 'stroke-linecap': 'round',
        }),
        circleSvg({
          cx: 100, cy: 110, r: 6, fill: '#fff',
          stroke: '#ff3f00', 'stroke-width': 3,
        }),
      ),
      textSvg(
        { x: 100, y: 144, 'text-anchor': 'middle', 'font-size': 22 },
        () => \`\${value}%\`,
      ),
    ),
    button('−10', { onClick: () => set(value - 10) }),
    button('Random', { onClick: () => set(Math.round(Math.random() * 100)) }),
    button('+10', { onClick: () => set(value + 10) }),
  )`;

// ── Radar chart ──────────────────────────────────────────────────────────

function RadarChart() {
  const axes = ["Speed", "Size", "DX", "SSR", "Docs"];
  let values = [90, 95, 80, 70, 60];
  const R = 68;
  const angle = (i: number) => (-90 + i * 72) * (Math.PI / 180);
  const px = (i: number, v: number) => 100 + Math.cos(angle(i)) * R * (v / 100);
  const py = (i: number, v: number) => 100 + Math.sin(angle(i)) * R * (v / 100);
  const ring = (v: number) => axes.map((_, i) => `${i ? "L" : "M"}${px(i, v)},${py(i, v)}`).join(" ") + " Z";
  const shape = () => axes.map((_, i) => `${i ? "L" : "M"}${px(i, values[i])},${py(i, values[i])}`).join(" ") + " Z";

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "0 0 200 200", role: "img", "aria-label": "Radar chart" },
      ...[25, 50, 75, 100].map((v) => pathSvg(ss.axis, { d: ring(v), fill: "none" })),
      ...axes.map((_, i) => lineSvg(ss.axis, { x1: "100", y1: "100", x2: String(px(i, 100)), y2: String(py(i, 100)) })),
      pathSvg(ss.line, { d: shape, fill: "currentColor", "fill-opacity": "0.25", stroke: "currentColor", "stroke-width": "2", "stroke-linejoin": "round" }),
      ...axes.map((_, i) => circleSvg(ss.dot, { r: "3.5", stroke: "currentColor", "stroke-width": "2", cx: () => String(px(i, values[i])), cy: () => String(py(i, values[i])) })),
      ...axes.map((name, i) =>
        textSvg(ss.label, { x: String(px(i, 126)), y: String(py(i, 126) + 4), "text-anchor": "middle" }, name),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "Randomize", { onClick: () => { values = values.map(() => rand(20, 100)); update(); } }),
      button(es.button, "Reset", { onClick: () => { values = [90, 95, 80, 70, 60]; update(); } }),
    ),
  );
}

const RADAR_CODE = `import 'nuclo'

const axes = ['Speed', 'Size', 'DX', 'SSR', 'Docs']
const start = [90, 95, 80, 70, 60]
let values = [...start]

// Axis i points at -90° + i * 72°; a value is a distance along it.
const angle = (i: number) => ((-90 + i * 72) * Math.PI) / 180
const px = (i: number, v: number) => 100 + Math.cos(angle(i)) * 68 * (v / 100)
const py = (i: number, v: number) => 100 + Math.sin(angle(i)) * 68 * (v / 100)

// A closed path through one point per axis. The grid rings are
// the same path at fixed values; the data shape reads the values.
const ring = (v: number) =>
  axes.map((_, i) => \`\${i ? 'L' : 'M'}\${px(i, v)},\${py(i, v)}\`).join(' ') + ' Z'
const shape = () =>
  axes
    .map((_, i) => \`\${i ? 'L' : 'M'}\${px(i, values[i])},\${py(i, values[i])}\`)
    .join(' ') + ' Z'

export const RadarChart = () =>
  div(
    svgSvg(
      { viewBox: '0 0 200 200', width: '200', height: '200' },
      ...[25, 50, 75, 100].map((v) =>
        pathSvg({ d: ring(v), fill: 'none', stroke: '#ddd' }),
      ),
      ...axes.map((_, i) =>
        lineSvg({
          x1: 100, y1: 100, x2: px(i, 100), y2: py(i, 100), stroke: '#ddd',
        }),
      ),
      pathSvg({
        fill: '#ff3f00', 'fill-opacity': 0.25, stroke: '#ff3f00',
        'stroke-width': 2, 'stroke-linejoin': 'round',
        style: { transition: 'd 0.4s' },
        d: shape,
      }),
      ...axes.map((_, i) =>
        circleSvg({
          r: 3.5, fill: '#fff', stroke: '#ff3f00', 'stroke-width': 2,
          style: { transition: 'cx 0.4s, cy 0.4s' },
          cx: () => px(i, values[i]),
          cy: () => py(i, values[i]),
        }),
      ),
      ...axes.map((name, i) =>
        textSvg(
          { x: px(i, 126), y: py(i, 126) + 4, 'text-anchor': 'middle' },
          { 'font-size': 11 },
          name,
        ),
      ),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button('Randomize', {
        onClick: () => {
          values = values.map(() => Math.round(20 + Math.random() * 80))
          update()
        },
      }),
      button('Reset', { onClick: () => { values = [...start]; update() } }),
    ),
  )`;

// ── Heatmap ──────────────────────────────────────────────────────────────

function Heatmap() {
  const COLS = 14;
  const ROWS = 7;
  const CELL = 17;
  const OPACITY = [0.08, 0.3, 0.55, 0.8, 1];
  let levels = Array.from({ length: COLS * ROWS }, () => rand(0, 4));
  const total = () => levels.reduce((a, b) => a + b, 0);

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${COLS * CELL - 3} ${ROWS * CELL - 3}`, role: "img", "aria-label": "Heatmap" },
      ...levels.map((_, i) =>
        rectSvg(ss.cell, {
          x: String(Math.floor(i / ROWS) * CELL),
          y: String((i % ROWS) * CELL),
          width: "14", height: "14", rx: "3",
          fill: "currentColor",
          "fill-opacity": () => String(OPACITY[levels[i]]),
          onClick: () => { levels[i] = (levels[i] + 1) % 5; update(); },
        }, titleSvg(() => `${levels[i]} commits`)),
      ),
    ),
    div(ss.caption, () => `${total()} commits · click a cell`),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "Shuffle", { onClick: () => { levels = levels.map(() => rand(0, 4)); update(); } }),
      button(es.button, "Clear", { onClick: () => { levels = levels.map(() => 0); update(); } }),
    ),
  );
}

const HEATMAP_CODE = `import 'nuclo'

const COLS = 14
const ROWS = 7
const OPACITY = [0.08, 0.3, 0.55, 0.8, 1]
const random = () => Math.floor(Math.random() * 5)
let levels = Array.from({ length: COLS * ROWS }, random)

// One rect per cell, column by column. Its fill-opacity is a
// function of the cell's level, and a titleSvg child is the
// browser's own tooltip. onClick works on SVG elements as on any.
export const Heatmap = () =>
  div(
    svgSvg(
      { viewBox: '0 0 235 116', width: '235', height: '116' },
      ...levels.map((_, i) =>
        rectSvg(
          {
            x: Math.floor(i / ROWS) * 17,
            y: (i % ROWS) * 17,
            width: 14, height: 14, rx: 3,
            fill: '#ff3f00',
            style: { cursor: 'pointer', transition: 'fill-opacity 0.2s' },
            'fill-opacity': () => OPACITY[levels[i]],
            onClick: () => { levels[i] = (levels[i] + 1) % 5; update() },
          },
          titleSvg(() => \`\${levels[i]} commits\`),
        ),
      ),
    ),
    div(() => \`\${levels.reduce((a, b) => a + b, 0)} commits · click a cell\`),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button('Shuffle', {
        onClick: () => { levels = levels.map(random); update() },
      }),
      button('Clear', {
        onClick: () => { levels = levels.map(() => 0); update() },
      }),
    ),
  )`;

// ── Hover tooltip ────────────────────────────────────────────────────────

function Scatter() {
  const W = 320;
  const H = 180;
  let points = Array.from({ length: 24 }, () => ({ x: rand(0, 100), y: rand(0, 100) }));
  let active: number | null = null;
  const sx = (v: number) => 16 + (v / 100) * (W - 32);
  const sy = (v: number) => H - 16 - (v / 100) * (H - 32);

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Scatter plot", onPointerLeave: () => { active = null; update(); } },
      lineSvg(ss.axis, { x1: "16", y1: String(H - 16), x2: String(W - 16), y2: String(H - 16) }),
      lineSvg(ss.axis, { x1: "16", y1: "16", x2: "16", y2: String(H - 16) }),
      ...points.map((_, i) =>
        circleSvg(ss.point, {
          fill: "currentColor",
          cx: () => String(sx(points[i].x)),
          cy: () => String(sy(points[i].y)),
          r: () => (active === i ? "7" : "4.5"),
          "fill-opacity": () => (active === null || active === i ? "0.9" : "0.35"),
          onPointerEnter: () => { active = i; update(); },
        }),
      ),
      gSvg(
        ss.tip,
        {
          opacity: () => (active === null ? "0" : "1"),
          style: () => {
            const p = points[active ?? 0];
            return { transform: `translate(${sx(p.x)}px, ${sy(p.y) - 16}px)` };
          },
        },
        rectSvg(ss.tipBox, { x: "-30", y: "-20", width: "60", height: "20", rx: "5" }),
        textSvg(ss.tipText, { x: "0", y: "-6", "text-anchor": "middle" }, () => (active === null ? "" : `${points[active].x}, ${points[active].y}`)),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "New data", { onClick: () => { points = points.map(() => ({ x: rand(0, 100), y: rand(0, 100) })); update(); } }),
    ),
  );
}

const SCATTER_CODE = `import 'nuclo'

const random = () => ({
  x: Math.round(Math.random() * 100),
  y: Math.round(Math.random() * 100),
})
let points = Array.from({ length: 24 }, random)
let active: number | null = null

const sx = (v: number) => 16 + (v / 100) * 288
const sy = (v: number) => 164 - (v / 100) * 148

// onPointerEnter on a circle sets the active index; the svg's
// onPointerLeave clears it. The tooltip is a group whose opacity
// and transform read the active point, so it slides between them.
export const Scatter = () =>
  div(
    svgSvg(
      {
        viewBox: '0 0 320 180', width: '320', height: '180',
        onPointerLeave: () => { active = null; update() },
      },
      lineSvg({ x1: 16, y1: 164, x2: 304, y2: 164, stroke: '#ddd' }),
      lineSvg({ x1: 16, y1: 16, x2: 16, y2: 164, stroke: '#ddd' }),
      ...points.map((_, i) =>
        circleSvg({
          fill: '#ff3f00',
          style: {
            cursor: 'pointer', transition: 'r 0.15s, fill-opacity 0.15s',
          },
          cx: () => sx(points[i].x),
          cy: () => sy(points[i].y),
          r: () => (active === i ? 7 : 4.5),
          'fill-opacity': () => (active === null || active === i ? 0.9 : 0.35),
          onPointerEnter: () => { active = i; update() },
        }),
      ),
      gSvg(
        {
          'pointer-events': 'none',
          opacity: () => (active === null ? 0 : 1),
          style: () => {
            const p = points[active ?? 0]
            return {
              transition: 'opacity 0.15s, transform 0.15s',
              transform: \`translate(\${sx(p.x)}px, \${sy(p.y) - 16}px)\`,
            }
          },
        },
        rectSvg({ x: -30, y: -20, width: 60, height: 20, rx: 5, fill: '#222' }),
        textSvg(
          { x: 0, y: -6, 'text-anchor': 'middle', fill: '#fff', 'font-size': 11 },
          () => (active === null ? '' : \`\${points[active].x}, \${points[active].y}\`),
        ),
      ),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button('New data', {
        onClick: () => { points = points.map(random); update() },
      }),
    ),
  )`;

// ── Curve editor ─────────────────────────────────────────────────────────

function CurveEditor() {
  const W = 320;
  const H = 180;
  const pts = [[20, 150], [90, 20], [230, 160], [300, 40]];
  let drag: number | null = null;
  const d = () => `M${pts[0]} C${pts[1]} ${pts[2]} ${pts[3]}`;

  function move(e: PointerEvent) {
    if (drag === null) return;
    const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    pts[drag] = [
      Math.round(Math.max(0, Math.min(W, ((e.clientX - box.left) / box.width) * W))),
      Math.round(Math.max(0, Math.min(H, ((e.clientY - box.top) / box.height) * H))),
    ];
    update();
  }

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.drag,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Curve editor", onPointerMove: move, onPointerUp: () => { drag = null; } },
      lineSvg(ss.axis, { "stroke-dasharray": "3 4", x1: () => String(pts[0][0]), y1: () => String(pts[0][1]), x2: () => String(pts[1][0]), y2: () => String(pts[1][1]) }),
      lineSvg(ss.axis, { "stroke-dasharray": "3 4", x1: () => String(pts[3][0]), y1: () => String(pts[3][1]), x2: () => String(pts[2][0]), y2: () => String(pts[2][1]) }),
      pathSvg({ d, fill: "none", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round" }),
      ...pts.map((_, i) =>
        circleSvg(ss.handle, i === 1 || i === 2 ? ss.cool : null, {
          r: "7", stroke: "currentColor", "stroke-width": "2.5",
          cx: () => String(pts[i][0]),
          cy: () => String(pts[i][1]),
          onPointerDown: (e) => { drag = i; e.currentTarget.setPointerCapture(e.pointerId); },
        }),
      ),
    ),
    div(ss.caption, d),
  );
}

const CURVE_CODE = `import 'nuclo'

const pts = [[20, 150], [90, 20], [230, 160], [300, 40]]
let drag: number | null = null

// The path is one cubic Bézier through the four points.
const d = () => \`M\${pts[0]} C\${pts[1]} \${pts[2]} \${pts[3]}\`

// onPointerDown on a handle remembers which point is held and
// captures the pointer; onPointerMove on the svg maps the pointer
// to viewBox units and moves it. Everything else is a function of pts.
function move(e: PointerEvent) {
  if (drag === null) return
  const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
  pts[drag] = [
    Math.round(((e.clientX - box.left) / box.width) * 320),
    Math.round(((e.clientY - box.top) / box.height) * 180),
  ]
  update()
}

export const CurveEditor = () =>
  div(
    svgSvg(
      {
        viewBox: '0 0 320 180', width: '320', height: '180',
        style: { touchAction: 'none' },
        onPointerMove: move,
        onPointerUp: () => { drag = null },
      },
      lineSvg({
        stroke: '#ccc', 'stroke-dasharray': '3 4',
        x1: () => pts[0][0], y1: () => pts[0][1],
        x2: () => pts[1][0], y2: () => pts[1][1],
      }),
      lineSvg({
        stroke: '#ccc', 'stroke-dasharray': '3 4',
        x1: () => pts[3][0], y1: () => pts[3][1],
        x2: () => pts[2][0], y2: () => pts[2][1],
      }),
      pathSvg({ d, fill: 'none', stroke: '#ff3f00', 'stroke-width': 3 }),
      ...pts.map((_, i) =>
        circleSvg({
          r: 7, fill: '#fff', 'stroke-width': 2.5,
          stroke: i === 1 || i === 2 ? '#2563eb' : '#ff3f00',
          style: { cursor: 'grab' },
          cx: () => pts[i][0],
          cy: () => pts[i][1],
          onPointerDown: (e) => {
            drag = i
            e.currentTarget.setPointerCapture(e.pointerId)
          },
        }),
      ),
    ),
    code(d),
  )`;

// ── Clock ────────────────────────────────────────────────────────────────

function Clock() {
  let now = new Date();
  const hours = () => (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const minutes = () => now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const seconds = () => now.getSeconds() * 6;

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      {
        viewBox: "0 0 200 200", role: "img", "aria-label": "Clock",
        onMount: () => {
          const id = setInterval(() => { now = new Date(); update(); }, 1000);
          return () => clearInterval(id);
        },
      },
      circleSvg(ss.track, { cx: "100", cy: "100", r: "92", fill: "none", "stroke-width": "4" }),
      ...Array.from({ length: 60 }, (_, i) =>
        lineSvg(i % 5 ? ss.axis : ss.ink, { x1: "100", y1: "12", x2: "100", y2: i % 5 ? "17" : "24", "stroke-width": i % 5 ? "1" : "2.5", "stroke-linecap": "round", transform: `rotate(${i * 6} 100 100)` }),
      ),
      lineSvg(ss.ink, { x1: "100", y1: "108", x2: "100", y2: "52", "stroke-width": "6", "stroke-linecap": "round", transform: () => `rotate(${hours()} 100 100)` }),
      lineSvg(ss.ink, { x1: "100", y1: "110", x2: "100", y2: "30", "stroke-width": "4", "stroke-linecap": "round", transform: () => `rotate(${minutes()} 100 100)` }),
      lineSvg({ x1: "100", y1: "118", x2: "100", y2: "22", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", transform: () => `rotate(${seconds()} 100 100)` }),
      circleSvg({ cx: "100", cy: "100", r: "4", fill: "currentColor" }),
    ),
  );
}

const CLOCK_CODE = `import 'nuclo'

let now = new Date()
const hours = () => (now.getHours() % 12) * 30 + now.getMinutes() * 0.5
const minutes = () => now.getMinutes() * 6 + now.getSeconds() * 0.1
const seconds = () => now.getSeconds() * 6

// Each hand's transform is a function of now. onMount starts the
// interval and returns its cleanup, which runs when the svg is
// removed, so the clock stops when it leaves the page.
export const Clock = () =>
  svgSvg(
    {
      viewBox: '0 0 200 200', width: '200', height: '200',
      onMount: () => {
        const id = setInterval(() => { now = new Date(); update() }, 1000)
        return () => clearInterval(id)
      },
    },
    circleSvg({ cx: 100, cy: 100, r: 92, fill: 'none', stroke: '#eee', 'stroke-width': 4 }),
    ...Array.from({ length: 12 }, (_, i) =>
      lineSvg({
        x1: 100, y1: 12, x2: 100, y2: 24, stroke: '#222', 'stroke-width': 2.5,
        transform: \`rotate(\${i * 30} 100 100)\`,
      }),
    ),
    lineSvg({
      x1: 100, y1: 108, x2: 100, y2: 52, stroke: '#222', 'stroke-width': 6,
      'stroke-linecap': 'round', transform: () => \`rotate(\${hours()} 100 100)\`,
    }),
    lineSvg({
      x1: 100, y1: 110, x2: 100, y2: 30, stroke: '#222', 'stroke-width': 4,
      'stroke-linecap': 'round', transform: () => \`rotate(\${minutes()} 100 100)\`,
    }),
    lineSvg({
      x1: 100, y1: 118, x2: 100, y2: 22, stroke: '#ff3f00', 'stroke-width': 1.5,
      'stroke-linecap': 'round', transform: () => \`rotate(\${seconds()} 100 100)\`,
    }),
    circleSvg({ cx: 100, cy: 100, r: 4, fill: '#ff3f00' }),
  )`;

// ── Icon toggles ─────────────────────────────────────────────────────────

function IconToggles() {
  let open = false;
  let liked = false;

  return div(
    ss.wrap,
    div(
      ss.iconRow,
      // Menu → cross: three lines whose CSS transforms depend on `open`.
      svgSvg(
        ss.icon,
        ss.menuIcon,
        { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", role: "button", "aria-label": "Menu", "aria-expanded": () => String(open), onClick: () => { open = !open; update(); } },
        lineSvg(ss.iconLine, { x1: "4", y1: "6", x2: "20", y2: "6", style: () => ({ transform: open ? "translateY(6px) rotate(45deg)" : "" }) }),
        lineSvg(ss.iconLine, { x1: "4", y1: "12", x2: "20", y2: "12", style: () => ({ transform: open ? "scaleX(0)" : "", opacity: open ? "0" : "1" }) }),
        lineSvg(ss.iconLine, { x1: "4", y1: "18", x2: "20", y2: "18", style: () => ({ transform: open ? "translateY(-6px) rotate(-45deg)" : "" }) }),
      ),
      // Heart: the fill depends on `liked`; a SMIL scale that begins on click makes it pop.
      svgSvg(
        ss.icon,
        ss.heartIcon,
        { viewBox: "0 0 24 24", stroke: "currentColor", "stroke-width": "2", "stroke-linejoin": "round", role: "button", "aria-label": "Like", "aria-pressed": () => String(liked), onClick: () => { liked = !liked; update(); } },
        gSvg(
          { transform: "translate(12 12)" },
          animateTransformSvg({ attributeName: "transform", type: "scale", values: "1;1.3;1", dur: "0.35s", begin: "click", additive: "sum" }),
          pathSvg(ss.heart, {
            transform: "translate(-12 -12)",
            d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
            fill: () => (liked ? "currentColor" : "none"),
          }),
        ),
      ),
    ),
    div(ss.caption, () => `menu ${open ? "open" : "closed"} · ${liked ? "liked" : "not liked"}`),
  );
}

const ICONS_CODE = `import 'nuclo'

let open = false
let liked = false

const line = (y: number, transform: () => string) =>
  lineSvg({
    x1: 4, y1: y, x2: 20, y2: y,
    style: () => ({
      transition: 'transform 0.3s', transformOrigin: '12px 12px',
      transform: transform(),
    }),
  })

// Menu → cross: each line's CSS transform is a function of \`open\`.
const MenuIcon = () =>
  svgSvg(
    {
      viewBox: '0 0 24 24', width: '64', height: '64', fill: 'none',
      stroke: '#222', 'stroke-width': 2, 'stroke-linecap': 'round',
      style: { cursor: 'pointer' },
      onClick: () => { open = !open; update() },
    },
    line(6, () => (open ? 'translateY(6px) rotate(45deg)' : '')),
    line(12, () => (open ? 'scaleX(0)' : '')),
    line(18, () => (open ? 'translateY(-6px) rotate(-45deg)' : '')),
  )

// Heart: the fill is a function of \`liked\`. A SMIL scale that
// begins on click pops it, with no state of its own.
const HeartIcon = () =>
  svgSvg(
    {
      viewBox: '0 0 24 24', width: '64', height: '64',
      stroke: '#ff3f00', 'stroke-width': 2, 'stroke-linejoin': 'round',
      style: { cursor: 'pointer' },
      onClick: () => { liked = !liked; update() },
    },
    gSvg(
      { transform: 'translate(12 12)' },
      animateTransformSvg({
        attributeName: 'transform', type: 'scale', additive: 'sum',
        values: '1;1.3;1', dur: '0.35s', begin: 'click',
      }),
      pathSvg({
        transform: 'translate(-12 -12)',
        d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
        style: { transition: 'fill 0.2s' },
        fill: () => (liked ? '#ff3f00' : 'none'),
      }),
    ),
  )

// Both icons side by side, and a text that reads the same two variables.
export const IconToggles = () =>
  div(
    div(
      { style: { display: 'flex', gap: '28px', justifyContent: 'center' } },
      MenuIcon(),
      HeartIcon(),
    ),
    div(
      { style: { textAlign: 'center', fontSize: '12px', color: '#666' } },
      () => \`menu \${open ? 'open' : 'closed'} · \${liked ? 'liked' : 'not liked'}\`,
    ),
  )`;

export const SVG_EXAMPLES: SvgExample[] = [
  { id: "bar-chart", docs: "tag-builders", title: "Bar Chart", desc: "Rects from an array. Their y and height are functions of the data, so update() moves the bars.", code: BAR_CHART_CODE, preview: BarChart },
  { id: "line-chart", docs: "tag-builders", title: "Line Chart", desc: "A path whose d is built from the points, with a gradient area and one circle per point.", code: LINE_CHART_CODE, preview: LineChart },
  { id: "donut-chart", docs: "tag-builders", title: "Donut Chart", desc: "One circle per slice. stroke-dasharray gives each its share of the ring and stroke-dashoffset its start.", code: DONUT_CHART_CODE, preview: DonutChart },
  { id: "svg-animation", docs: "tag-builders", title: "SVG Animation", desc: "SMIL as builders: animateSvg pulses the sun, animateTransformSvg orbits the planet. A dynamic dur sets the speed.", code: ORBIT_CODE, preview: Orbit },
  { id: "gauge", docs: "tag-builders", title: "Gauge", desc: "An arc that fills with stroke-dashoffset and a needle that turns with a CSS transform. Both are functions of one number.", code: GAUGE_CODE, preview: Gauge },
  { id: "radar-chart", docs: "tag-builders", title: "Radar Chart", desc: "Five values on five axes. The shape is one path whose d is computed from the data, so update() morphs it.", code: RADAR_CODE, preview: RadarChart },
  { id: "heatmap", docs: "tag-builders", title: "Heatmap", desc: "A grid of rects whose fill-opacity follows a level. Click a cell to bump it; a titleSvg child is its tooltip.", code: HEATMAP_CODE, preview: Heatmap },
  { id: "hover-tooltip", docs: "tag-builders", title: "Hover Tooltip", desc: "Pointer events on SVG elements. onPointerEnter picks the active point and a tooltip group slides to it.", code: SCATTER_CODE, preview: Scatter },
  { id: "curve-editor", docs: "tag-builders", title: "Curve Editor", desc: "Drag the handles of a cubic Bézier. onPointerDown picks a point, onPointerMove on the svg moves it and the path follows.", code: CURVE_CODE, preview: CurveEditor },
  { id: "clock", docs: "tag-builders", title: "Clock", desc: "Hands are lines whose transform is a function of the time. onMount starts the ticking and returns the cleanup.", code: CLOCK_CODE, preview: Clock },
  { id: "icon-toggles", docs: "tag-builders", title: "Icon Toggles", desc: "A menu icon that morphs into a cross with CSS transitions, and a heart that pops with a SMIL animation that begins on click.", code: ICONS_CODE, preview: IconToggles },
];
