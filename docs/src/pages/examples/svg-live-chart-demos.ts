/**
 * Live chart examples: data that keeps moving. A stream that scrolls, candles
 * that tick and a ranking race that reorders itself. Each one steps its data
 * on a timer or on animation frames and updates only its own scope().
 */
import { es } from "./styles.ts";
import { cs, every, seeded, sum } from "./chart-kit.ts";
import { ss, type SvgExample } from "./svg-demos.ts";
import { clamp, frames, pointer } from "./svg-interactive-demos.ts";

// ── Live stream ──────────────────────────────────────────────────────────

function LiveStream() {
  const N = 48;
  const W = 320;
  const H = 140;
  const STEP = W / N;
  const random = seeded(11);
  const walk = (v: number, k: number) => clamp(v + (random() - 0.48) * k, 4, 100);
  let ticks = 0;
  const a: number[] = [];
  const b: number[] = [];
  for (let i = 0, p = 50, q = 30; i <= N; i++) {
    p = walk(p, 14);
    q = walk(q, 10);
    a.push(p);
    b.push(q);
  }
  let top = 100;
  let paused = false;
  let hover: number | null = null;

  // A sample keeps its x for as long as it lives: the group slides left by one step per tick instead.
  const x = (j: number) => (ticks - N + j) * STEP;
  const y = (v: number) => H - 6 - (v / top) * (H - 18);
  const line = (s: number[]) => s.map((v, j) => `${j ? "L" : "M"}${x(j).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  function tick() {
    if (paused) return false;
    ticks++;
    a.push(walk(a[N], 14));
    b.push(walk(b[N], 10));
    a.shift();
    b.shift();
    top += (Math.max(60, ...a, ...b) * 1.15 - top) * 0.25;
  }
  const at = () => hover ?? N;

  return div(
    ss.wrap,
    scope("ex-stream"),
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Live stream chart", onMount: every("ex-stream", 120, tick) },
      defsSvg(
        linearGradientSvg(
          { id: "ex-stream-fill", x1: "0", y1: "0", x2: "0", y2: "1" },
          stopSvg({ offset: "0", "stop-color": "currentColor", "stop-opacity": "0.3" }),
          stopSvg({ offset: "1", "stop-color": "currentColor", "stop-opacity": "0" }),
        ),
        clipPathSvg({ id: "ex-stream-clip" }, rectSvg({ x: 0, y: 0, width: W, height: H })),
      ),
      ...[0.25, 0.5, 0.75, 1].map((f) =>
        gSvg(
          lineSvg(ss.axis, { x1: 0, x2: W, "stroke-dasharray": "2 4", y1: () => String(y(top * f) + 0.5), y2: () => String(y(top * f) + 0.5) }),
          textSvg(ss.label, { x: W - 2, "text-anchor": "end", y: () => String(y(top * f) - 3) }, () => String(Math.round(top * f))),
        ),
      ),
      gSvg(
        { "clip-path": "url(#ex-stream-clip)" },
        gSvg(
          cs.glide,
          { style: () => ({ transform: `translateX(${(N - ticks) * STEP}px)` }) },
          pathSvg({ fill: "url(#ex-stream-fill)", d: () => `${line(a)} L${x(N)},${H} L${x(0)},${H} Z` }),
          pathSvg({ fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linejoin": "round", d: () => line(a) }),
          pathSvg(ss.cool, { fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linejoin": "round", d: () => line(b) }),
          circleSvg({ r: 4, fill: "currentColor", cx: () => String(x(N)), cy: () => String(y(a[N])) }),
        ),
      ),
      gSvg(
        cs.ghost,
        { opacity: () => (hover === null ? "0" : "1") },
        lineSvg({ y1: 0, y2: H, x1: () => String(at() * STEP), x2: () => String(at() * STEP) }),
        circleSvg(ss.dot, { r: 4, stroke: "currentColor", "stroke-width": 2, cx: () => String(at() * STEP), cy: () => String(y(a[at()])) }),
        circleSvg(ss.dot, ss.cool, { r: 4, stroke: "currentColor", "stroke-width": 2, cx: () => String(at() * STEP), cy: () => String(y(b[at()])) }),
      ),
      rectSvg(cs.hit, {
        x: 0, y: 0, width: W, height: H,
        onPointerMove: (e) => { hover = Math.round(clamp(pointer(e, 1, 1)[0], 0, 1) * N); update("ex-stream"); },
        onPointerLeave: () => { hover = null; update("ex-stream"); },
      }),
    ),
    div(ss.caption, () => `${hover === null ? "now" : `-${((N - at()) * 0.12).toFixed(1)}s`} · requests ${Math.round(a[at()])} · latency ${Math.round(b[at()])} · peak ${Math.round(Math.max(...a))}`),
    div(
      es.buttonRow,
      button(es.button, cs.toggle, { "aria-pressed": () => String(paused) }, () => (paused ? "Resume" : "Pause"), { onClick: () => { paused = !paused; update("ex-stream"); } }),
      button(es.button, es.buttonPrimary, "Spike", { onClick: () => { a[N] = clamp(a[N] + 45, 4, 100); b[N] = clamp(b[N] + 25, 4, 100); update("ex-stream"); } }),
    ),
  );
}

const STREAM_CODE = `import 'nuclo'

const N = 48
const W = 320
const H = 140
const STEP = W / N

// Seeded random numbers, so the first frame is always the same.
let seed = 11
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const walk = (v: number, k: number) =>
  Math.max(4, Math.min(100, v + (random() - 0.48) * k))

let ticks = 0
let top = 100
let paused = false
let hover: number | null = null
const a: number[] = []
const b: number[] = []
for (let i = 0, p = 50, q = 30; i <= N; i++) {
  p = walk(p, 14)
  q = walk(q, 10)
  a.push(p)
  b.push(q)
}

// A sample keeps the same x for as long as it lives. The whole
// group slides left by one step per tick, and a CSS transition
// that lasts exactly one tick makes the scroll smooth.
const x = (j: number) => (ticks - N + j) * STEP
const y = (v: number) => H - 6 - (v / top) * (H - 18)
const line = (s: number[]) =>
  s.map((v, j) => (j ? 'L' : 'M') + x(j).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')
const at = () => hover ?? N

// Each tick adds a sample, drops the oldest one and updates only
// this scope. The y scale eases toward the peak.
function tick() {
  if (paused) return
  ticks++
  a.push(walk(a[N], 14)); a.shift()
  b.push(walk(b[N], 10)); b.shift()
  top += (Math.max(60, ...a, ...b) * 1.15 - top) * 0.25
  update('stream')
}

const muted = { 'font-family': 'ui-monospace, monospace', 'font-size': 11, fill: '#8a8a8a' }

export const LiveStream = () =>
  div(
    { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', width: '100%', maxWidth: '380px' } },
    scope('stream'),
    svgSvg(
      {
        viewBox: '0 0 320 140', role: 'img', 'aria-label': 'Live stream chart',
        style: { width: '100%', height: 'auto', overflow: 'visible' },
        // onMount starts the timer and returns its cleanup.
        onMount: () => {
          const timer = setInterval(tick, 120)
          return () => clearInterval(timer)
        },
      },
      defsSvg(
        linearGradientSvg(
          { id: 'fill', x1: '0', y1: '0', x2: '0', y2: '1' },
          stopSvg({ offset: '0', 'stop-color': '#ff3f00', 'stop-opacity': 0.3 }),
          stopSvg({ offset: '1', 'stop-color': '#ff3f00', 'stop-opacity': 0 }),
        ),
        clipPathSvg({ id: 'clip' }, rectSvg({ x: 0, y: 0, width: W, height: H })),
      ),
      // Grid lines and their labels follow the y scale.
      ...[0.25, 0.5, 0.75, 1].map((f) =>
        gSvg(
          lineSvg({
            x1: 0, x2: W, stroke: '#ddd', 'stroke-dasharray': '2 4',
            y1: () => y(top * f) + 0.5, y2: () => y(top * f) + 0.5,
          }),
          textSvg(muted, { x: W - 2, 'text-anchor': 'end', y: () => y(top * f) - 3 }, () => Math.round(top * f)),
        ),
      ),
      gSvg(
        { 'clip-path': 'url(#clip)' },
        gSvg(
          {
            style: () => ({
              transition: 'transform 0.12s linear',
              transform: 'translateX(' + (N - ticks) * STEP + 'px)',
            }),
          },
          pathSvg({
            fill: 'url(#fill)',
            d: () => line(a) + ' L' + x(N) + ',' + H + ' L' + x(0) + ',' + H + ' Z',
          }),
          pathSvg({ fill: 'none', stroke: '#ff3f00', 'stroke-width': 2, 'stroke-linejoin': 'round', d: () => line(a) }),
          pathSvg({ fill: 'none', stroke: '#2563eb', 'stroke-width': 1.5, 'stroke-linejoin': 'round', d: () => line(b) }),
          circleSvg({ r: 4, fill: '#ff3f00', cx: () => x(N), cy: () => y(a[N]) }),
        ),
      ),
      // The hover cursor: a line and one dot per series.
      gSvg(
        { stroke: '#8a8a8a', 'pointer-events': 'none', opacity: () => (hover === null ? 0 : 1) },
        lineSvg({ y1: 0, y2: H, x1: () => at() * STEP, x2: () => at() * STEP }),
        circleSvg({ r: 4, fill: '#fff', stroke: '#ff3f00', 'stroke-width': 2, cx: () => at() * STEP, cy: () => y(a[at()]) }),
        circleSvg({ r: 4, fill: '#fff', stroke: '#2563eb', 'stroke-width': 2, cx: () => at() * STEP, cy: () => y(b[at()]) }),
      ),
      // A transparent rect on top follows the pointer.
      rectSvg({
        x: 0, y: 0, width: W, height: H, fill: 'transparent', style: { cursor: 'crosshair', touchAction: 'none' },
        onPointerMove: (e) => {
          const box = e.currentTarget.getBoundingClientRect()
          hover = Math.round(Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * N)
          update('stream')
        },
        onPointerLeave: () => { hover = null; update('stream') },
      }),
    ),
    div(
      { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#8a8a8a', textAlign: 'center' } },
      () =>
        (hover === null ? 'now' : '-' + ((N - at()) * 0.12).toFixed(1) + 's') +
        ' · requests ' + Math.round(a[at()]) +
        ' · latency ' + Math.round(b[at()]) +
        ' · peak ' + Math.round(Math.max(...a)),
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      button(() => (paused ? 'Resume' : 'Pause'), {
        onClick: () => { paused = !paused; update('stream') },
      }),
      button('Spike', {
        onClick: () => {
          a[N] = Math.min(100, a[N] + 45)
          b[N] = Math.min(100, b[N] + 25)
          update('stream')
        },
      }),
    ),
  )`;

// ── Candlesticks ─────────────────────────────────────────────────────────

function Candles() {
  type Candle = { o: number; h: number; l: number; c: number; v: number };
  const W = 320;
  const H = 196;
  const PW = 282; // the plot; the price labels sit to its right
  const PH = 130;
  const SLOTS = 40;
  const UP = "var(--c-accent-cool)";
  const DOWN = "var(--c-primary)";
  const random = seeded(5);
  const candle = (o: number): Candle => {
    const c = o + (random() - 0.48) * 4;
    return { o, c, h: Math.max(o, c) + random() * 2, l: Math.min(o, c) - random() * 2, v: 20 + random() * 80 };
  };
  const raw: Candle[] = [];
  for (let i = 0, p = 100; i < 120; i++) {
    const k = candle(p);
    raw.push(k);
    p = k.c;
  }
  let agg = 1;
  let showSma = true;
  let live = true;
  let hover: number | null = null;
  let view: Candle[] = [];
  let lo = 0;
  let hi = 1;
  let vmax = 1;
  let n = 0;

  // The raw candles grouped by `agg` from the newest one backwards, so the last group is always complete.
  function refresh() {
    view = [];
    for (let end = raw.length; end > 0 && view.length < SLOTS; end -= agg) {
      const g = raw.slice(Math.max(0, end - agg), end);
      view.unshift({ o: g[0].o, c: g[g.length - 1].c, h: Math.max(...g.map((k) => k.h)), l: Math.min(...g.map((k) => k.l)), v: sum(g.map((k) => k.v)) });
    }
    const span = Math.max(...view.map((k) => k.h)) - Math.min(...view.map((k) => k.l));
    lo = Math.min(...view.map((k) => k.l)) - span * 0.06;
    hi = Math.max(...view.map((k) => k.h)) + span * 0.06;
    vmax = Math.max(...view.map((k) => k.v));
  }
  refresh();

  const cx = (i: number) => ((i + 0.5) * PW) / view.length;
  const y = (v: number) => 4 + (1 - (v - lo) / (hi - lo)) * (PH - 8);
  const pick = (i: number) => view[Math.min(i, view.length - 1)];
  const color = (i: number) => (pick(i).c >= pick(i).o ? UP : DOWN);
  const sma = () => view.map((_, i) => [cx(i), i < 4 ? NaN : y(sum(view.slice(i - 4, i + 1).map((k) => k.c)) / 5)]).filter((p) => !Number.isNaN(p[1])).map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = () => view[view.length - 1];

  function tick() {
    if (!live) return false;
    const k = raw[raw.length - 1];
    k.c += (random() - 0.5) * 2.4;
    k.h = Math.max(k.h, k.c);
    k.l = Math.min(k.l, k.c);
    k.v += random() * 8;
    if (++n % 8 === 0) {
      raw.push(candle(k.c));
      raw.shift();
    }
    refresh();
  }
  const set = (fn: () => void) => () => { fn(); refresh(); update("ex-candles"); };

  return div(
    ss.wrap,
    scope("ex-candles"),
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Candlestick chart", onMount: every("ex-candles", 450, tick) },
      ...[0.1, 0.35, 0.6, 0.85].map((f) =>
        gSvg(
          lineSvg(ss.axis, { x1: 0, x2: PW, "stroke-dasharray": "2 4", y1: () => String(y(lo + (hi - lo) * f) + 0.5), y2: () => String(y(lo + (hi - lo) * f) + 0.5) }),
          textSvg(ss.label, { x: PW + 4, y: () => String(y(lo + (hi - lo) * f) + 4) }, () => (lo + (hi - lo) * f).toFixed(0)),
        ),
      ),
      ...Array.from({ length: SLOTS }, (_, i) =>
        gSvg(
          { opacity: () => (i < view.length ? "1" : "0") },
          lineSvg({ "stroke-width": 1.4, x1: () => String(cx(i)), x2: () => String(cx(i)), y1: () => String(y(pick(i).h)), y2: () => String(y(pick(i).l)), stroke: () => color(i) }),
          rectSvg({
            rx: 1,
            x: () => String(cx(i) - (PW / view.length) * 0.31),
            width: () => String((PW / view.length) * 0.62),
            y: () => String(y(Math.max(pick(i).o, pick(i).c))),
            height: () => String(Math.max(1.5, Math.abs(y(pick(i).o) - y(pick(i).c)))),
            fill: () => color(i),
          }),
          rectSvg({
            "fill-opacity": 0.35,
            x: () => String(cx(i) - (PW / view.length) * 0.31),
            width: () => String((PW / view.length) * 0.62),
            y: () => String(H - 2 - (pick(i).v / vmax) * 38),
            height: () => String((pick(i).v / vmax) * 38),
            fill: () => color(i),
          }),
        ),
      ),
      pathSvg(ss.warm, { fill: "none", stroke: "currentColor", "stroke-width": 1.6, "stroke-linejoin": "round", opacity: () => (showSma ? "1" : "0"), d: sma }),
      lineSvg({ "stroke-dasharray": "3 3", stroke: () => (last().c >= last().o ? UP : DOWN), x1: 0, x2: PW, y1: () => String(y(last().c)), y2: () => String(y(last().c)) }),
      rectSvg({ rx: 3, x: PW + 1, width: 37, height: 14, fill: () => (last().c >= last().o ? UP : DOWN), y: () => String(y(last().c) - 7) }),
      textSvg(ss.label, { x: PW + 4, "fill-opacity": 1, style: { fill: "#fff" }, y: () => String(y(last().c) + 4) }, () => last().c.toFixed(1)),
      gSvg(
        cs.ghost,
        { opacity: () => (hover === null ? "0" : "1") },
        lineSvg({ y1: 0, y2: H, x1: () => String(cx(hover ?? 0)), x2: () => String(cx(hover ?? 0)) }),
        lineSvg({ x1: 0, x2: PW, y1: () => String(y(pick(hover ?? 0).c)), y2: () => String(y(pick(hover ?? 0).c)) }),
      ),
      rectSvg(cs.hit, {
        x: 0, y: 0, width: PW, height: H,
        onPointerMove: (e) => { hover = clamp(Math.floor((pointer(e, PW, H)[0] / PW) * view.length), 0, view.length - 1); update("ex-candles"); },
        onPointerLeave: () => { hover = null; update("ex-candles"); },
      }),
    ),
    div(ss.caption, cs.stat, () => {
      const k = pick(hover ?? view.length - 1);
      return `O ${k.o.toFixed(1)} · H ${k.h.toFixed(1)} · L ${k.l.toFixed(1)} · C ${k.c.toFixed(1)} · ${(((k.c - k.o) / k.o) * 100).toFixed(2)}%`;
    }),
    div(
      es.buttonRow,
      ...[1, 3, 5].map((m) => button(es.button, cs.toggle, { "aria-pressed": () => String(agg === m) }, `${m}m`, { onClick: set(() => { agg = m; hover = null; }) })),
      button(es.button, cs.toggle, { "aria-pressed": () => String(showSma) }, "SMA", { onClick: set(() => { showSma = !showSma; }) }),
      button(es.button, es.buttonPrimary, () => (live ? "Live" : "Paused"), { onClick: set(() => { live = !live; }) }),
    ),
  );
}

const CANDLES_CODE = `import 'nuclo'

type Candle = { o: number; h: number; l: number; c: number; v: number }

const W = 320
const H = 196
const PW = 282 // the plot; the price labels sit to its right
const PH = 130
const SLOTS = 40
const UP = '#2563eb'
const DOWN = '#ff3f00'

// Seeded random numbers, so the first frame is always the same.
let seed = 5
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const next = (o: number): Candle => {
  const c = o + (random() - 0.48) * 4
  return {
    o, c,
    h: Math.max(o, c) + random() * 2,
    l: Math.min(o, c) - random() * 2,
    v: 20 + random() * 80,
  }
}
const raw: Candle[] = []
for (let i = 0, p = 100; i < 120; i++) { raw.push(next(p)); p = raw[i].c }

let agg = 1 // 1, 3 or 5 raw candles per candle
let showSma = true
let live = true
let hover: number | null = null
let view: Candle[] = []
let lo = 0
let hi = 1
let vmax = 1
let n = 0
const sum = (list: number[]) => list.reduce((s, v) => s + v, 0)

// Group the raw candles from the newest backwards, so the last one
// is always complete, then fit the scales to what is visible.
function refresh() {
  view = []
  for (let end = raw.length; end > 0 && view.length < SLOTS; end -= agg) {
    const g = raw.slice(Math.max(0, end - agg), end)
    view.unshift({
      o: g[0].o, c: g[g.length - 1].c,
      h: Math.max(...g.map((k) => k.h)), l: Math.min(...g.map((k) => k.l)),
      v: sum(g.map((k) => k.v)),
    })
  }
  const span = Math.max(...view.map((k) => k.h)) - Math.min(...view.map((k) => k.l))
  lo = Math.min(...view.map((k) => k.l)) - span * 0.06
  hi = Math.max(...view.map((k) => k.h)) + span * 0.06
  vmax = Math.max(...view.map((k) => k.v))
}
refresh()

const cx = (i: number) => ((i + 0.5) * PW) / view.length
const y = (v: number) => 4 + (1 - (v - lo) / (hi - lo)) * (PH - 8)
const pick = (i: number) => view[Math.min(i, view.length - 1)]
const color = (i: number) => (pick(i).c >= pick(i).o ? UP : DOWN)
const last = () => view[view.length - 1]
const lastColor = () => (last().c >= last().o ? UP : DOWN)
const slotWidth = () => (PW / view.length) * 0.62

// Simple moving average of the last five closes.
const sma = () =>
  view
    .map((_, i) => [cx(i), y(sum(view.slice(i - 4, i + 1).map((k) => k.c)) / 5)])
    .filter((_, i) => i >= 4)
    .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ')

// The live timer moves the newest raw candle; every 8th tick opens a new one.
function tick() {
  if (!live) return
  const k = raw[raw.length - 1]
  k.c += (random() - 0.5) * 2.4
  k.h = Math.max(k.h, k.c)
  k.l = Math.min(k.l, k.c)
  k.v += random() * 8
  if (++n % 8 === 0) {
    raw.push(next(k.c))
    raw.shift()
  }
  refresh()
  update('candles')
}
// Run a change, refit the scales, update only this scope.
const set = (change: () => void) => () => { change(); refresh(); update('candles') }

const muted = { 'font-family': 'ui-monospace, monospace', 'font-size': 11, fill: '#8a8a8a' }

// A fixed number of slots, each reading its own candle. When
// fewer candles exist, the extra slots fade out.
export const Candles = () =>
  div(
    { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', width: '100%', maxWidth: '380px' } },
    scope('candles'),
    svgSvg(
      {
        viewBox: '0 0 320 196', role: 'img', 'aria-label': 'Candlestick chart',
        style: { width: '100%', height: 'auto', overflow: 'visible' },
        onMount: () => {
          const timer = setInterval(tick, 450)
          return () => clearInterval(timer)
        },
      },
      // Price grid
      ...[0.1, 0.35, 0.6, 0.85].map((f) =>
        gSvg(
          lineSvg({
            x1: 0, x2: PW, stroke: '#ddd', 'stroke-dasharray': '2 4',
            y1: () => y(lo + (hi - lo) * f) + 0.5, y2: () => y(lo + (hi - lo) * f) + 0.5,
          }),
          textSvg(muted, { x: PW + 4, y: () => y(lo + (hi - lo) * f) + 4 }, () => (lo + (hi - lo) * f).toFixed(0)),
        ),
      ),
      ...Array.from({ length: SLOTS }, (_, i) =>
        gSvg(
          { opacity: () => (i < view.length ? 1 : 0) },
          // wick
          lineSvg({
            'stroke-width': 1.4, stroke: () => color(i),
            x1: () => cx(i), x2: () => cx(i),
            y1: () => y(pick(i).h), y2: () => y(pick(i).l),
          }),
          // body
          rectSvg({
            rx: 1, fill: () => color(i),
            x: () => cx(i) - slotWidth() / 2,
            width: () => slotWidth(),
            y: () => y(Math.max(pick(i).o, pick(i).c)),
            height: () => Math.max(1.5, Math.abs(y(pick(i).o) - y(pick(i).c))),
          }),
          // volume
          rectSvg({
            'fill-opacity': 0.35, fill: () => color(i),
            x: () => cx(i) - slotWidth() / 2,
            width: () => slotWidth(),
            y: () => H - 2 - (pick(i).v / vmax) * 38,
            height: () => (pick(i).v / vmax) * 38,
          }),
        ),
      ),
      pathSvg({
        fill: 'none', stroke: '#ff8a00', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
        opacity: () => (showSma ? 1 : 0), d: sma,
      }),
      // The last price: a dashed line and a tag on the axis.
      lineSvg({
        'stroke-dasharray': '3 3', x1: 0, x2: PW,
        stroke: lastColor, y1: () => y(last().c), y2: () => y(last().c),
      }),
      rectSvg({ rx: 3, x: PW + 1, width: 37, height: 14, fill: lastColor, y: () => y(last().c) - 7 }),
      textSvg(muted, { x: PW + 4, style: { fill: '#fff' }, y: () => y(last().c) + 4 }, () => last().c.toFixed(1)),
      // The hover cursor
      gSvg(
        { stroke: '#8a8a8a', 'pointer-events': 'none', opacity: () => (hover === null ? 0 : 1) },
        lineSvg({ y1: 0, y2: H, x1: () => cx(hover ?? 0), x2: () => cx(hover ?? 0) }),
        lineSvg({ x1: 0, x2: PW, y1: () => y(pick(hover ?? 0).c), y2: () => y(pick(hover ?? 0).c) }),
      ),
      // A transparent rect on top follows the pointer.
      rectSvg({
        x: 0, y: 0, width: PW, height: H, fill: 'transparent', style: { cursor: 'crosshair', touchAction: 'none' },
        onPointerMove: (e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const i = Math.floor(((e.clientX - box.left) / box.width) * view.length)
          hover = Math.max(0, Math.min(view.length - 1, i))
          update('candles')
        },
        onPointerLeave: () => { hover = null; update('candles') },
      }),
    ),
    div(
      { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#8a8a8a', textAlign: 'center', minHeight: '36px' } },
      () => {
        const k = pick(hover ?? view.length - 1)
        return 'O ' + k.o.toFixed(1) + ' · H ' + k.h.toFixed(1) + ' · L ' + k.l.toFixed(1) +
          ' · C ' + k.c.toFixed(1) + ' · ' + (((k.c - k.o) / k.o) * 100).toFixed(2) + '%'
      },
    ),
    div(
      { style: { display: 'flex', gap: '8px', justifyContent: 'center' } },
      ...[1, 3, 5].map((m) =>
        button(m + 'm', {
          'aria-pressed': () => String(agg === m),
          style: () => ({ outline: agg === m ? '2px solid currentColor' : 'none', outlineOffset: '2px' }),
          onClick: set(() => { agg = m; hover = null }),
        }),
      ),
      button('SMA', {
        'aria-pressed': () => String(showSma),
        style: () => ({ outline: showSma ? '2px solid currentColor' : 'none', outlineOffset: '2px' }),
        onClick: set(() => { showSma = !showSma }),
      }),
      button(() => (live ? 'Live' : 'Paused'), { onClick: set(() => { live = !live }) }),
    ),
  )`;

// ── Bar chart race ───────────────────────────────────────────────────────

function Race() {
  const W = 320;
  const ROW = 24;
  const TOP = 6;
  const LABEL = 68;
  const H = TOP * ROW + 6;
  const KEYS = 13;
  const FIRST = 2012;
  const random = seeded(23);
  const names = ["Atlas", "Borealis", "Cobalt", "Delta", "Ember", "Fjord", "Garnet", "Helix", "Indigo", "Juno"];
  // Each name grows at its own pace with some noise, so the ranking keeps changing.
  const series = names.map(() => {
    let v = 20 + random() * 60;
    const g = -0.04 + random() * 0.34;
    return Array.from({ length: KEYS }, () => {
      const out = v;
      v *= 1 + g + (random() - 0.5) * 0.3;
      return out;
    });
  });
  let t = 0;
  let playing = true;
  let value: number[] = [];
  let rank: number[] = [];
  let peak = 1;

  // The value is interpolated between two years; the rank comes from sorting the interpolated values.
  function measure() {
    const k = Math.min(KEYS - 2, Math.floor(t));
    value = series.map((s) => s[k] + (s[k + 1] - s[k]) * (t - k));
    const order = value.map((_, i) => i).sort((p, q) => value[q] - value[p]);
    order.forEach((item, r) => (rank[item] = r));
    peak = value[order[0]];
  }
  measure();
  const fill = (i: number) => `hsl(${(i * 47 + 12) % 360} 72% 52%)`;
  const year = () => FIRST + Math.floor(t + 0.001);

  return div(
    ss.wrap,
    scope("ex-race"),
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bar chart race", onMount: frames("ex-race", () => {
        if (!playing) return false;
        t = Math.min(KEYS - 1, t + 0.012);
        if (t >= KEYS - 1) playing = false;
        measure();
      }) },
      textSvg(cs.big, { x: W - 4, y: H - 8, "text-anchor": "end" }, () => String(year())),
      ...names.map((name, i) =>
        gSvg(
          { opacity: () => (rank[i] < TOP ? "1" : "0"), style: () => ({ transform: `translateY(${Math.min(rank[i], TOP) * ROW}px)`, transition: "transform 0.45s ease, opacity 0.3s ease" }) },
          textSvg(cs.name, { x: LABEL - 6, y: 15, "text-anchor": "end" }, name),
          rectSvg({ x: LABEL, y: 3, height: ROW - 6, rx: 4, fill: fill(i), width: () => String(Math.max(2, (value[i] / peak) * (W - LABEL - 44))) }),
          textSvg(ss.label, { y: 15, x: () => String(LABEL + Math.max(2, (value[i] / peak) * (W - LABEL - 44)) + 5) }, () => String(Math.round(value[i]))),
        ),
      ),
    ),
    div(
      cs.row,
      button(es.button, es.buttonPrimary, () => (playing ? "Pause" : t >= KEYS - 1 ? "Replay" : "Play"), {
        onClick: () => {
          if (t >= KEYS - 1) { t = 0; measure(); }
          playing = !playing;
          update("ex-race");
        },
      }),
      input(cs.slide, {
        type: "range", min: "0", max: String((KEYS - 1) * 100), step: "1", "aria-label": "Year",
        value: () => String(Math.round(t * 100)),
        onInput: (e) => { t = Number(e.currentTarget.value) / 100; playing = false; measure(); update("ex-race"); },
      }),
    ),
    div(ss.caption, () => `${year()} · ${names[rank.indexOf(0)]} leads · sample data`),
  );
}

const RACE_CODE = `import 'nuclo'

const W = 320
const ROW = 24
const TOP = 6
const LABEL = 68
const H = TOP * ROW + 6
const KEYS = 13
const FIRST = 2012
const names = ['Atlas', 'Borealis', 'Cobalt', 'Delta', 'Ember', 'Fjord', 'Garnet', 'Helix', 'Indigo', 'Juno']

// Seeded random numbers, so the first frame is always the same.
let seed = 23
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647

// One value per name per year. Each name grows at its own pace.
const series = names.map(() => {
  let v = 20 + random() * 60
  const g = -0.04 + random() * 0.34
  return Array.from({ length: KEYS }, () => {
    const out = v
    v *= 1 + g + (random() - 0.5) * 0.3
    return out
  })
})

let t = 0 // 0 to 12, with decimals: how far between two years
let playing = true
let value: number[] = []
let rank: number[] = []
let peak = 1

// Interpolate the years, then rank the interpolated values.
function measure() {
  const k = Math.min(KEYS - 2, Math.floor(t))
  value = series.map((s) => s[k] + (s[k + 1] - s[k]) * (t - k))
  const order = value.map((_, i) => i).sort((p, q) => value[q] - value[p])
  order.forEach((item, r) => (rank[item] = r))
  peak = value[order[0]]
}
measure()

const year = () => FIRST + Math.floor(t + 0.001)
const barWidth = (i: number) => Math.max(2, (value[i] / peak) * (W - LABEL - 44))

// The list never reorders: every bar keeps its place in the DOM
// and moves with translateY(rank), so a CSS transition slides it
// to its new row. Names below the top six fade out below the chart.
// The bar's width is a plain function of the value, so it follows
// every frame. The frame loop updates only the 'race' scope.
export const Race = () =>
  div(
    { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', width: '100%', maxWidth: '380px' } },
    scope('race'),
    svgSvg(
      {
        viewBox: '0 0 320 150', role: 'img', 'aria-label': 'Bar chart race',
        style: { width: '100%', height: 'auto', overflow: 'visible' },
        onMount: () => {
          let id = requestAnimationFrame(function frame() {
            if (playing) {
              t = Math.min(KEYS - 1, t + 0.012)
              if (t >= KEYS - 1) playing = false
              measure()
              update('race')
            }
            id = requestAnimationFrame(frame)
          })
          return () => cancelAnimationFrame(id)
        },
      },
      // The big year sits behind the bars.
      textSvg(
        { x: W - 4, y: H - 8, 'text-anchor': 'end', 'font-size': 54, 'font-weight': 800, 'fill-opacity': 0.12, 'pointer-events': 'none' },
        () => year(),
      ),
      ...names.map((name, i) =>
        gSvg(
          {
            opacity: () => (rank[i] < TOP ? 1 : 0),
            style: () => ({
              transition: 'transform 0.45s ease, opacity 0.3s ease',
              transform: 'translateY(' + Math.min(rank[i], TOP) * ROW + 'px)',
            }),
          },
          textSvg({ x: LABEL - 6, y: 15, 'text-anchor': 'end', 'font-size': 11, 'font-weight': 600 }, name),
          rectSvg({
            x: LABEL, y: 3, height: ROW - 6, rx: 4,
            fill: 'hsl(' + ((i * 47 + 12) % 360) + ' 72% 52%)',
            width: () => barWidth(i),
          }),
          textSvg(
            { y: 15, 'font-family': 'ui-monospace, monospace', 'font-size': 11, fill: '#8a8a8a', x: () => LABEL + barWidth(i) + 5 },
            () => Math.round(value[i]),
          ),
        ),
      ),
    ),
    div(
      { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px' } },
      button(() => (playing ? 'Pause' : t >= KEYS - 1 ? 'Replay' : 'Play'), {
        onClick: () => {
          if (t >= KEYS - 1) { t = 0; measure() }
          playing = !playing
          update('race')
        },
      }),
      input({
        type: 'range', min: '0', max: String((KEYS - 1) * 100), step: '1', 'aria-label': 'Year',
        style: { width: '100%', maxWidth: '320px' },
        value: () => String(Math.round(t * 100)),
        onInput: (e) => {
          t = Number(e.currentTarget.value) / 100
          playing = false
          measure()
          update('race')
        },
      }),
    ),
    div(
      { style: { fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#8a8a8a', textAlign: 'center' } },
      () => year() + ' · ' + names[rank.indexOf(0)] + ' leads · sample data',
    ),
  )`;

export const LIVE_CHART_EXAMPLES: SvgExample[] = [
  { id: "live-stream", docs: "api-scope", title: "Live Stream", desc: "Two series scroll left on a timer. A CSS transition as long as one tick makes the slide smooth, and hovering reads any sample.", code: STREAM_CODE, preview: LiveStream },
  { id: "candlestick-chart", docs: "api-scope", title: "Candlestick Chart", desc: "Forty slots read their own candle. Change the timeframe, toggle the average, hover for the numbers, or let the live candle tick.", code: CANDLES_CODE, preview: Candles },
  { id: "bar-chart-race", docs: "api-scope", title: "Bar Chart Race", desc: "Ten bars never leave the DOM. Their rank sets a translateY, so a transition slides each one to its row as the values change.", code: RACE_CODE, preview: Race },
];
