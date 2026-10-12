/**
 * Data chart examples: charts that re-layout themselves. A stacked area that
 * morphs between three layouts, a treemap you drill into and a histogram that
 * fills up with samples. Each is a few plain functions over plain state.
 */
import { colors, css } from "../../styles.ts";
import { es } from "./styles.ts";
import { cs, every, SERIES, seeded, smooth, sum } from "./chart-kit.ts";
import { ss, type SvgExample } from "./svg-demos.ts";
import { clamp, pointer, Slider } from "./svg-interactive-demos.ts";

const fade = keyframes({ from: { opacity: "0" }, to: { opacity: "1" } });

const ds = {
  enter: css("pages-examples-svg-chart-demos-enter", { animation: `${fade} 0.45s ease both` }),
  cell: css("pages-examples-svg-chart-demos-cell", { transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }),
  box: css("pages-examples-svg-chart-demos-box", { transition: "width 0.45s cubic-bezier(0.22, 1, 0.36, 1), height 0.45s cubic-bezier(0.22, 1, 0.36, 1), fill-opacity 0.2s ease", raw: { stroke: "var(--c-bg-card)" } }),
  trail: css("pages-examples-svg-chart-demos-trail", { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px", fontSize: "0.8125rem", color: colors.textMuted }),
  crumb: css("pages-examples-svg-chart-demos-crumb", { padding: "2px 8px", borderRadius: "10px", color: colors.text, cursor: "pointer", hover: { backgroundColor: colors.bgSecondary }, "&[aria-current=true]": { fontWeight: "700", cursor: "default" } }),
  fit: css("pages-examples-svg-chart-demos-fit", { pointerEvents: "none", raw: { fill: "none", stroke: "var(--c-text)" } }),
};

// ── Stacked area ─────────────────────────────────────────────────────────

function StackedArea() {
  type Mode = "stacked" | "stream" | "percent";
  const W = 320;
  const H = 170;
  const PT = 6;
  const PH = 142;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const names = ["Core", "Router", "Docs", "Tools"];
  const random = seeded(3);
  const data = names.map((_, k) => {
    let v = 16 + k * 6 + random() * 8;
    return months.map(() => Math.round((v = clamp(v + (random() - 0.45) * 10, 6, 52))));
  });
  const on = names.map(() => true);
  let mode: Mode = "stacked";
  let hover: number | null = null;
  const x = (i: number) => 28 + (i / (months.length - 1)) * (W - 34);

  // Every series is a band between two edges. Hiding one only gives it zero thickness, so every path keeps
  // its shape and the d transition can morph between layouts.
  function layout() {
    const rows = months.map((_, i) => data.map((s, k) => (on[k] ? s[i] : 0)));
    const totals = rows.map(sum);
    const peak = Math.max(1, ...totals);
    const lo = names.map((): number[] => []);
    const hi = names.map((): number[] => []);
    rows.forEach((row, i) => {
      const unit = mode === "percent" ? totals[i] || 1 : 1;
      let acc = mode === "stream" ? -totals[i] / 2 : 0;
      row.forEach((v, k) => {
        lo[k][i] = acc / unit;
        acc += v;
        hi[k][i] = acc / unit;
      });
    });
    const [d0, d1] = mode === "percent" ? [0, 1] : mode === "stream" ? [-peak / 2, peak / 2] : [0, peak];
    return { lo, hi, d0, d1, totals };
  }
  const py = (v: number, d0: number, d1: number) => PT + (1 - (v - d0) / (d1 - d0)) * PH;
  function band(k: number) {
    const { lo, hi, d0, d1 } = layout();
    const top = hi[k].map((v, i) => [x(i), py(v, d0, d1)]);
    const bottom = lo[k].map((v, i) => [x(i), py(v, d0, d1)]).reverse();
    return `${smooth(top)} ${smooth(bottom, "L")} Z`;
  }
  const level = (f: number) => {
    const { d0, d1 } = layout();
    return py(d0 + (d1 - d0) * f, d0, d1);
  };
  const label = (f: number) => {
    const { d0, d1 } = layout();
    return mode === "stream" ? "" : mode === "percent" ? `${Math.round(f * 100)}%` : String(Math.round(d0 + (d1 - d0) * f));
  };

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Stacked area chart", onPointerLeave: () => { hover = null; update(); } },
      ...[0, 0.25, 0.5, 0.75, 1].map((f) =>
        gSvg(
          lineSvg(ss.axis, { x1: 24, x2: W, "stroke-dasharray": "2 4", y1: () => String(level(f) + 0.5), y2: () => String(level(f) + 0.5) }),
          textSvg(ss.label, { x: 20, "text-anchor": "end", y: () => String(level(f) + 4) }, () => label(f)),
        ),
      ),
      ...names.map((_, k) => pathSvg(cs.band, { "stroke-width": 1, "fill-opacity": 0.88, fill: SERIES[k], d: () => band(k) })),
      lineSvg(cs.ghost, { y1: PT, y2: PT + PH, "stroke-dasharray": "3 3", x1: 0, x2: 0, opacity: () => (hover === null ? "0" : "1"), style: () => ({ transform: `translateX(${x(hover ?? 0)}px)`, transition: "transform 0.12s ease-out" }) }),
      ...months.map((m, i) => textSvg(ss.label, { x: x(i), y: H - 4, "text-anchor": "middle", opacity: i % 2 ? "0" : "1" }, m.slice(0, 3))),
      rectSvg(cs.hit, {
        x: 0, y: 0, width: W, height: PT + PH,
        onPointerMove: (e) => { hover = Math.round(clamp(pointer(e, 1, 1)[0], 0, 1) * (months.length - 1)); update(); },
      }),
    ),
    div(ss.caption, cs.stat, () => (hover === null ? "Hover a month. Click a name to hide it." : `${months[hover]} · ${names.filter((_, k) => on[k]).map((n) => `${n} ${data[names.indexOf(n)][hover!]}`).join(" · ")}`)),
    div(
      cs.legend,
      ...names.map((name, k) =>
        button(cs.chip, { "aria-pressed": () => String(on[k]), onClick: () => { on[k] = !on[k]; update(); } }, span(cs.pip, { style: { backgroundColor: SERIES[k] } }), name),
      ),
    ),
    div(
      es.buttonRow,
      ...(["stacked", "stream", "percent"] as const).map((m) =>
        button(es.button, cs.toggle, { "aria-pressed": () => String(mode === m) }, m, { onClick: () => { mode = m; update(); } }),
      ),
    ),
  );
}

const STACKED_CODE = `import 'nuclo'

type Mode = 'stacked' | 'stream' | 'percent'

const W = 320
const PT = 6
const PH = 142
const names = ['Core', 'Router', 'Docs', 'Tools']
const colors = ['#ff3f00', '#2563eb', '#ff8a00', '#6b7280']
const data = names.map(() =>
  Array.from({ length: 12 }, () => 10 + Math.round(Math.random() * 40)),
)
const on = names.map(() => true)
let mode: Mode = 'stacked'

const x = (i: number) => 28 + (i / 11) * (W - 34)

// Every series is a band between a low edge and a high edge.
// A hidden series only gets zero thickness, so every path keeps
// the same shape and the CSS transition on d can morph it.
//   stacked: the edges pile up from zero
//   stream:  the pile is centered on zero
//   percent: each month is divided by its total
function layout() {
  const rows = data[0].map((_, i) => data.map((s, k) => (on[k] ? s[i] : 0)))
  const totals = rows.map((r) => r.reduce((a, b) => a + b, 0))
  const peak = Math.max(1, ...totals)
  const lo = names.map((): number[] => [])
  const hi = names.map((): number[] => [])
  rows.forEach((row, i) => {
    const unit = mode === 'percent' ? totals[i] || 1 : 1
    let acc = mode === 'stream' ? -totals[i] / 2 : 0
    row.forEach((v, k) => {
      lo[k][i] = acc / unit
      acc += v
      hi[k][i] = acc / unit
    })
  })
  const [d0, d1] =
    mode === 'percent' ? [0, 1] : mode === 'stream' ? [-peak / 2, peak / 2] : [0, peak]
  return { lo, hi, d0, d1 }
}

const py = (v: number, d0: number, d1: number) =>
  PT + (1 - (v - d0) / (d1 - d0)) * PH

// Curves with horizontal tangents never overshoot the data.
function smooth(pts: number[][], from: 'M' | 'L') {
  let d = from + pts[0]
  for (let i = 1; i < pts.length; i++) {
    const mid = (pts[i - 1][0] + pts[i][0]) / 2
    d += ' C' + mid + ',' + pts[i - 1][1] + ' ' + mid + ',' + pts[i][1] + ' ' + pts[i]
  }
  return d
}

// The high edge forward, the low edge back, then close.
function band(k: number) {
  const { lo, hi, d0, d1 } = layout()
  const top = hi[k].map((v, i) => [x(i), py(v, d0, d1)])
  const bottom = lo[k].map((v, i) => [x(i), py(v, d0, d1)]).reverse()
  return smooth(top, 'M') + ' ' + smooth(bottom, 'L') + ' Z'
}

export const StackedArea = () =>
  div(
    svgSvg(
      { viewBox: '0 0 320 170', width: '320', height: '170' },
      ...names.map((_, k) =>
        pathSvg({
          fill: colors[k], 'fill-opacity': 0.88, stroke: '#fff',
          style: { transition: 'd 0.5s cubic-bezier(0.22, 1, 0.36, 1)' },
          d: () => band(k),
        }),
      ),
    ),
    ...names.map((name, k) =>
      button(name, {
        'aria-pressed': () => String(on[k]),
        onClick: () => { on[k] = !on[k]; update() },
      }),
    ),
    ...(['stacked', 'stream', 'percent'] as const).map((m) =>
      button(m, { onClick: () => { mode = m; update() } }),
    ),
  )`;

// ── Treemap ──────────────────────────────────────────────────────────────

type TreeNode = { name: string; kb: number; gz: number; hue: number; parent?: TreeNode; children?: TreeNode[] };
type Rect = { x: number; y: number; w: number; h: number };

const leaf = (name: string, kb: number, gz: number): TreeNode => ({ name, kb, gz, hue: 0 });
const group = (name: string, ...children: TreeNode[]): TreeNode => ({ name, kb: 0, gz: 0, hue: 0, children });
const BUNDLE = group(
  "bundle",
  group("core", leaf("element", 14, 5.1), leaf("list", 9, 3.2), leaf("when", 4, 1.6), leaf("update", 6, 2.4), leaf("style", 11, 3.9), leaf("svg", 8, 2.1), leaf("ssr", 12, 4.4)),
  group("router", leaf("match", 5, 1.9), leaf("layers", 4, 1.5), leaf("loaders", 6, 2.2), leaf("link", 2, 0.9), leaf("history", 3, 1.3)),
  group("docs", group("pages", leaf("home", 18, 5), leaf("api", 24, 7.5), leaf("examples", 30, 9.4)), group("demos", leaf("charts", 22, 7.1), leaf("forms", 16, 5.2), leaf("apps", 34, 10.2))),
  group("tools", leaf("cli", 10, 3.7), leaf("vite", 7, 2.8), leaf("lint", 5, 1.8)),
);
(function paint(node: TreeNode, hue = 0) {
  node.children?.forEach((child, i) => {
    child.parent = node;
    child.hue = node.parent ? hue : i;
    paint(child, child.hue);
  });
})(BUNDLE);

function Treemap() {
  const W = 320;
  const H = 200;
  type Metric = "kb" | "gz" | "count";
  let metric: Metric = "kb";
  let focus = BUNDLE;
  let hover: TreeNode | null = null;
  let shown: TreeNode[] = [];
  let pos = new Map<TreeNode, Rect>();

  const weight = (n: TreeNode): number => (n.children ? sum(n.children.map(weight)) : metric === "count" ? 1 : n[metric]);
  const path = (n: TreeNode): TreeNode[] => (n.parent ? [...path(n.parent), n] : [n]);
  const format = (n: TreeNode) => (metric === "count" ? `${weight(n)} ${weight(n) === 1 ? "module" : "modules"}` : `${weight(n).toFixed(1)} KB`);

  // Squarified layout: add to a row while the worst aspect ratio of the row keeps improving.
  function tile(nodes: TreeNode[], box: Rect) {
    const total = sum(nodes.map(weight));
    let rest = nodes.map((node) => ({ node, area: (weight(node) / total) * box.w * box.h })).sort((a, b) => b.area - a.area);
    let { x, y, w, h } = box;
    const worst = (row: number[], side: number) => {
      const s = sum(row);
      return Math.max(...row.map((a) => Math.max((side * side * a) / (s * s), (s * s) / (side * side * a))));
    };
    while (rest.length) {
      const side = Math.min(w, h);
      let n = 1;
      while (n < rest.length && worst(rest.slice(0, n + 1).map((r) => r.area), side) <= worst(rest.slice(0, n).map((r) => r.area), side)) n++;
      const row = rest.slice(0, n);
      const s = sum(row.map((r) => r.area));
      if (w >= h) {
        let cy = y;
        for (const r of row) {
          pos.set(r.node, { x, y: cy, w: s / h, h: r.area / (s / h) });
          cy += r.area / (s / h);
        }
        x += s / h;
        w -= s / h;
      } else {
        let cx = x;
        for (const r of row) {
          pos.set(r.node, { x: cx, y, w: r.area / (s / w), h: s / w });
          cx += r.area / (s / w);
        }
        y += s / w;
        h -= s / w;
      }
      rest = rest.slice(n);
    }
  }

  // Two levels: the children of the focus, and inside each the children it has.
  function relayout() {
    pos = new Map();
    tile(focus.children!, { x: 0, y: 0, w: W, h: H });
    for (const n of focus.children!) {
      const r = pos.get(n)!;
      if (n.children) tile(n.children, { x: r.x + 3, y: r.y + 17, w: Math.max(1, r.w - 6), h: Math.max(1, r.h - 20) });
    }
  }
  function go(node: TreeNode) {
    focus = node;
    hover = null;
    shown = focus.children!.flatMap((n) => (n.children ? [n, ...n.children] : [n]));
    relayout();
    update();
  }
  focus = BUNDLE;
  shown = BUNDLE.children!.flatMap((n) => (n.children ? [n, ...n.children] : [n]));
  relayout();

  const r = (n: TreeNode) => pos.get(n) ?? { x: 0, y: 0, w: 0, h: 0 };
  const fits = (n: TreeNode, w: number, h: number) => (r(n).w > w && r(n).h > h ? "1" : "0");

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Treemap", onPointerLeave: () => { hover = null; update(); } },
      list(() => shown, (n) =>
        gSvg(
          ds.cell,
          ds.enter,
          { style: () => ({ transform: `translate(${r(n).x}px, ${r(n).y}px)`, cursor: n.children ? "pointer" : "default" }), onClick: () => { if (n.children) go(n); }, onPointerEnter: () => { hover = n; update(); } },
          rectSvg(ds.box, { x: 0.5, y: 0.5, rx: 3, fill: SERIES[n.hue], "fill-opacity": () => (n.children ? (n.parent === focus ? "0.18" : hover === n ? "0.8" : "0.55") : hover === n ? "1" : "0.82"), width: () => String(Math.max(0, r(n).w - 1)), height: () => String(Math.max(0, r(n).h - 1)) }),
          textSvg(n.children ? cs.name : cs.nameOn, { x: 6, y: n.children ? 12 : 14, opacity: () => fits(n, n.name.length * 5.6 + 12, 16) }, n.name),
          n.children ? null : textSvg(cs.nameOn, { x: 6, y: 26, "fill-opacity": 0.8, opacity: () => fits(n, 54, 34) }, () => format(n)),
        ),
      ),
    ),
    div(ds.trail, list(() => path(focus), (n) => button(ds.crumb, { "aria-current": () => String(n === focus), onClick: () => { if (n !== focus) go(n); } }, n.name))),
    div(ss.caption, cs.stat, () => (hover ? `${path(hover).slice(1).map((n) => n.name).join(" / ")} · ${format(hover)} · ${Math.round((weight(hover) / weight(focus)) * 100)}%` : `${format(focus)} · ${focus.children!.some((n) => n.children) ? "click a group to zoom in" : `${focus.children!.length} modules`}`)),
    div(
      es.buttonRow,
      ...([["kb", "Size"], ["gz", "Gzip"], ["count", "Modules"]] as const).map(([m, name]) =>
        button(es.button, cs.toggle, { "aria-pressed": () => String(metric === m) }, name, { onClick: () => { metric = m; relayout(); update(); } }),
      ),
    ),
  );
}

const TREEMAP_CODE = `import 'nuclo'

type Node = { name: string; kb: number; hue: number; parent?: Node; children?: Node[] }
type Rect = { x: number; y: number; w: number; h: number }

const W = 320
const H = 200
const colors = ['#ff3f00', '#2563eb', '#ff8a00', '#6b7280']

const leaf = (name: string, kb: number): Node => ({ name, kb, hue: 0 })
const group = (name: string, ...children: Node[]): Node =>
  ({ name, kb: 0, hue: 0, children })

const root = group('bundle',
  group('core', leaf('element', 14), leaf('list', 9), leaf('update', 6), leaf('ssr', 12)),
  group('router', leaf('match', 5), leaf('layers', 4), leaf('link', 2)),
  group('docs',
    group('pages', leaf('home', 18), leaf('api', 24)),
    group('demos', leaf('charts', 22), leaf('forms', 16)),
  ),
  group('tools', leaf('cli', 10), leaf('vite', 7)),
)
// parents and colors: one hue per top-level child
root.children!.forEach((n, i) => {
  const set = (c: Node, parent: Node) => {
    c.parent = parent; c.hue = i
    c.children?.forEach((cc) => set(cc, c))
  }
  set(n, root)
})

let focus = root
let metric: 'kb' | 'count' = 'kb'
let shown: Node[] = []
let pos = new Map<Node, Rect>()

const weight = (n: Node): number =>
  n.children ? n.children.reduce((s, c) => s + weight(c), 0) : metric === 'kb' ? n.kb : 1

// Squarified layout: keep adding to the row while the worst
// aspect ratio of the row gets better, then start a new row.
function tile(nodes: Node[], box: Rect) {
  const total = nodes.reduce((s, n) => s + weight(n), 0)
  let rest = nodes
    .map((node) => ({ node, area: (weight(node) / total) * box.w * box.h }))
    .sort((a, b) => b.area - a.area)
  let { x, y, w, h } = box
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0)
    return Math.max(...row.map((a) => Math.max((side * side * a) / (s * s), (s * s) / (side * side * a))))
  }
  while (rest.length) {
    const side = Math.min(w, h)
    let n = 1
    while (n < rest.length &&
      worst(rest.slice(0, n + 1).map((r) => r.area), side) <=
      worst(rest.slice(0, n).map((r) => r.area), side)) n++
    const row = rest.slice(0, n)
    const s = row.reduce((a, r) => a + r.area, 0)
    if (w >= h) { // a column on the left
      let cy = y
      for (const r of row) { pos.set(r.node, { x, y: cy, w: s / h, h: r.area / (s / h) }); cy += r.area / (s / h) }
      x += s / h; w -= s / h
    } else { // a row on top
      let cx = x
      for (const r of row) { pos.set(r.node, { x: cx, y, w: r.area / (s / w), h: s / w }); cx += r.area / (s / w) }
      y += s / w; h -= s / w
    }
    rest = rest.slice(n)
  }
}

// Two levels: the children of the focus, and inside each its own.
function relayout() {
  pos = new Map()
  tile(focus.children!, { x: 0, y: 0, w: W, h: H })
  for (const n of focus.children!) {
    const r = pos.get(n)!
    if (n.children) tile(n.children, { x: r.x + 3, y: r.y + 17, w: r.w - 6, h: r.h - 20 })
  }
}

function go(node: Node) {
  focus = node
  shown = node.children!.flatMap((n) => (n.children ? [n, ...n.children] : [n]))
  relayout()
  update()
}
go(root)

// list() matches nodes by identity. Switching the metric keeps
// every cell, so the CSS transition on width, height and
// transform slides it to its new place. Drilling into a node
// swaps the cells, and a fade animation brings the new ones in.
export const Treemap = () =>
  div(
    svgSvg(
      { viewBox: '0 0 320 200', width: '320', height: '200' },
      list(() => shown, (n) =>
        gSvg(
          {
            style: () => ({
              transition: 'transform 0.45s',
              transform: 'translate(' + pos.get(n)!.x + 'px,' + pos.get(n)!.y + 'px)',
              cursor: n.children ? 'pointer' : 'default',
            }),
            onClick: () => { if (n.children) go(n) },
          },
          rectSvg({
            x: 0.5, y: 0.5, rx: 3, fill: colors[n.hue],
            'fill-opacity': n.children ? 0.18 : 0.82,
            style: { transition: 'width 0.45s, height 0.45s' },
            width: () => pos.get(n)!.w - 1,
            height: () => pos.get(n)!.h - 1,
          }),
          textSvg({ x: 6, y: n.children ? 12 : 14, 'font-size': 10 }, n.name),
        ),
      ),
    ),
    button('Size', { onClick: () => { metric = 'kb'; relayout(); update() } }),
    button('Modules', { onClick: () => { metric = 'count'; relayout(); update() } }),
    button('Back', { onClick: () => { if (focus.parent) go(focus.parent) } }),
  )`;

// ── Histogram ────────────────────────────────────────────────────────────

function Histogram() {
  type Dist = "normal" | "uniform" | "bimodal" | "skewed";
  const W = 320;
  const H = 150;
  const BASE = H - 14;
  const MAX_BINS = 40;
  const random = seeded(41);
  const gauss = (mean: number, sd: number) => mean + sd * Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const draw: Record<Dist, () => number> = {
    normal: () => gauss(50, 14),
    uniform: () => random() * 100,
    bimodal: () => (random() < 0.5 ? gauss(27, 8) : gauss(72, 10)),
    skewed: () => -Math.log(1 - random()) * 18,
  };
  const slots = Array.from({ length: MAX_BINS }, (_, i) => ({ i }));
  let dist: Dist = "normal";
  let bins = 20;
  let samples: number[] = [];
  let streaming = false;
  let fit = true;
  let counts: number[] = [];
  let peak = 4;
  let mean = 0;
  let sd = 1;

  function recount() {
    counts = Array(bins).fill(0);
    for (const s of samples) if (s >= 0 && s < 100) counts[Math.floor((s / 100) * bins)]++;
    peak = Math.max(4, ...counts);
    mean = sum(samples) / (samples.length || 1);
    sd = Math.sqrt(sum(samples.map((s) => (s - mean) ** 2)) / (samples.length || 1)) || 1;
  }
  function add(count: number) {
    for (let i = 0; i < count; i++) samples.push(draw[dist]());
    if (samples.length > 6000) samples = samples.slice(-6000);
    recount();
  }
  add(500);

  const scale = () => (BASE - 6) / (peak * 1.15);
  // The bell the samples would follow if they were normal: a count per bin from the density at each x.
  const curve = () =>
    Array.from({ length: 61 }, (_, i) => {
      const v = (i / 60) * 100;
      const count = samples.length * (100 / bins) * (Math.exp(-0.5 * ((v - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)));
      return `${i ? "L" : "M"}${((v / 100) * W).toFixed(1)},${(BASE - Math.min(count * scale(), BASE)).toFixed(1)}`;
    }).join(" ");
  const run = (fn: () => void) => () => { fn(); recount(); update("ex-hist"); };

  return div(
    ss.wrap,
    scope("ex-hist"),
    svgSvg(
      ss.svg,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Histogram", onMount: every("ex-hist", 60, () => { if (!streaming) return false; add(6); }) },
      lineSvg(ss.axis, { x1: 0, x2: W, y1: BASE + 0.5, y2: BASE + 0.5 }),
      list(() => slots.slice(0, bins), (s) =>
        rectSvg(cs.tween, {
          rx: 2, fill: "currentColor", "fill-opacity": 0.85,
          x: () => String((s.i * W) / bins + 0.75),
          width: () => String(W / bins - 1.5),
          y: () => String(BASE - counts[s.i] * scale()),
          height: () => String(counts[s.i] * scale()),
        }),
      ),
      pathSvg(ds.fit, { "stroke-width": 2, "stroke-linejoin": "round", opacity: () => (fit && samples.length > 1 ? "1" : "0"), d: curve }),
      lineSvg(cs.ghost, { "stroke-dasharray": "3 3", y1: 4, y2: BASE, x1: () => String((mean / 100) * W), x2: () => String((mean / 100) * W) }),
      ...[0, 25, 50, 75, 100].map((v) => textSvg(ss.label, { x: (v / 100) * W, y: H - 2, "text-anchor": v === 0 ? "start" : v === 100 ? "end" : "middle" }, String(v))),
    ),
    div(ss.caption, cs.stat, () => `n ${samples.length} · mean ${mean.toFixed(1)} · σ ${sd.toFixed(1)} · tallest bin ${peak}`),
    div(
      es.buttonRow,
      ...(["normal", "uniform", "bimodal", "skewed"] as const).map((d) =>
        button(es.button, cs.toggle, { "aria-pressed": () => String(dist === d) }, d, { onClick: run(() => { dist = d; samples = []; add(500); }) }),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "+100", { onClick: run(() => add(100)) }),
      button(es.button, cs.toggle, { "aria-pressed": () => String(streaming) }, "Stream", { onClick: () => { streaming = !streaming; update("ex-hist"); } }),
      button(es.button, cs.toggle, { "aria-pressed": () => String(fit) }, "Normal fit", { onClick: () => { fit = !fit; update("ex-hist"); } }),
    ),
    Slider("Bins", 5, MAX_BINS, 1, () => bins, (v) => { bins = v; recount(); update("ex-hist"); }),
  );
}

const HISTOGRAM_CODE = `import 'nuclo'

type Dist = 'normal' | 'uniform' | 'bimodal' | 'skewed'

const W = 320
const BASE = 136
const gauss = (mean: number, sd: number) =>
  mean + sd * Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())

const draw: Record<Dist, () => number> = {
  normal: () => gauss(50, 14),
  uniform: () => Math.random() * 100,
  bimodal: () => (Math.random() < 0.5 ? gauss(27, 8) : gauss(72, 10)),
  skewed: () => -Math.log(1 - Math.random()) * 18,
}

let dist: Dist = 'normal'
let bins = 20
let samples: number[] = []
let streaming = false
let counts: number[] = []
let peak = 4
let mean = 0
let sd = 1

// One pass over the samples gives the counts per bin and the stats.
function recount() {
  counts = Array(bins).fill(0)
  for (const s of samples) if (s >= 0 && s < 100) counts[Math.floor((s / 100) * bins)]++
  peak = Math.max(4, ...counts)
  mean = samples.reduce((a, b) => a + b, 0) / (samples.length || 1)
  sd = Math.sqrt(samples.reduce((a, s) => a + (s - mean) ** 2, 0) / (samples.length || 1)) || 1
}
function add(count: number) {
  for (let i = 0; i < count; i++) samples.push(draw[dist]())
  recount()
}
add(500)

const scale = () => (BASE - 6) / (peak * 1.15)

// The bell a normal distribution with this mean and spread would draw.
const curve = () =>
  Array.from({ length: 61 }, (_, i) => {
    const v = (i / 60) * 100
    const n = samples.length * (100 / bins) *
      (Math.exp(-0.5 * ((v - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)))
    return (i ? 'L' : 'M') + (v / 100) * W + ',' + (BASE - Math.min(n * scale(), BASE))
  }).join(' ')

// The bars come from a list of slots, and the slider only
// changes how many of them are shown. Every bar reads its count,
// so a stream of samples grows them, and a CSS transition on
// x, width, y and height smooths both that and a new bin count.
const slots = Array.from({ length: 40 }, (_, i) => ({ i }))

export const Histogram = () =>
  div(
    scope('hist'),
    svgSvg(
      {
        viewBox: '0 0 320 150', width: '320', height: '150',
        onMount: () => {
          const timer = setInterval(() => {
            if (!streaming) return
            add(6)
            update('hist')
          }, 60)
          return () => clearInterval(timer)
        },
      },
      list(() => slots.slice(0, bins), (s) =>
        rectSvg({
          rx: 2, fill: '#ff3f00',
          style: { transition: 'x 0.25s, y 0.25s, width 0.25s, height 0.25s' },
          x: () => (s.i * W) / bins + 0.75,
          width: () => W / bins - 1.5,
          y: () => BASE - counts[s.i] * scale(),
          height: () => counts[s.i] * scale(),
        }),
      ),
      pathSvg({ d: curve, fill: 'none', stroke: '#222', 'stroke-width': 2 }),
    ),
    p(() => 'n ' + samples.length + ' · mean ' + mean.toFixed(1) + ' · σ ' + sd.toFixed(1)),
    ...(['normal', 'uniform', 'bimodal', 'skewed'] as const).map((d) =>
      button(d, { onClick: () => { dist = d; samples = []; add(500); update('hist') } }),
    ),
    button('+100', { onClick: () => { add(100); update('hist') } }),
    button('Stream', { onClick: () => { streaming = !streaming; update('hist') } }),
    input({
      type: 'range', min: 5, max: 40, value: () => bins,
      onInput: (e) => { bins = Number(e.currentTarget.value); recount(); update('hist') },
    }),
  )`;

export const DATA_CHART_EXAMPLES: SvgExample[] = [
  { id: "stacked-area-chart", docs: "api-update", title: "Stacked Area Chart", desc: "Four bands morph between stacked, stream and percent layouts. Hiding a series only gives its band zero thickness, so every path keeps its shape.", code: STACKED_CODE, preview: StackedArea },
  { id: "treemap", docs: "api-list", title: "Treemap", desc: "A squarified layout you drill into. Switching the metric slides every cell to its new box, and clicking a group swaps in its children.", code: TREEMAP_CODE, preview: Treemap },
  { id: "live-histogram", docs: "api-list", title: "Live Histogram", desc: "Samples pour in from four distributions. The bins re-count on every change, a fitted bell follows the mean, and a slider sets the bin count.", code: HISTOGRAM_CODE, preview: Histogram },
];
