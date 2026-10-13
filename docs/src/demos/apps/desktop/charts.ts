// charts.ts: hand-rolled SVG charts for Finance — a line/area chart with a
// hover readout, grouped bars, and a donut. Each chart is one svgSvg() with
// viewBox coordinates and width 100%, so it scales with the window.
//
// The desktop's update() re-evaluates function bindings, it does not rebuild
// components — so every chart takes its data as a factory: the elements are
// built once, and each data-driven attribute, label and text re-derives from
// the factory on every update. That is how editing the ledger moves a chart
// without rebuilding it.
import "nuclo";

const TEXT = { "font-size": 9.5, "font-family": "ui-monospace, monospace" } as const;

// ---------------------------------------------------------------------------
// Line chart (with optional area fill, dots and labels). The hover marker is
// one shared state: moving over a chart updates its index and update() redraws.
// ---------------------------------------------------------------------------
export interface LinePoint { label: string; value: number }
export interface LineOpts { width?: number; height?: number; color?: string; area?: boolean; dots?: boolean; labels?: boolean; format?: (n: number) => string; scope?: string }

let hover: { id: string; index: number } | null = null;

export function LineChart(id: string, points: () => LinePoint[], opts: LineOpts = {}) {
  const W = opts.width ?? 360;
  const H = opts.height ?? 160;
  const pad = { l: 10, r: 10, t: 12, b: 18 };
  const color = opts.color ?? "var(--os-accent)";
  const fmt = opts.format ?? ((n: number) => String(Math.round(n)));
  const refresh = () => (opts.scope ? update(opts.scope) : update());
  const pts = () => points();
  const values = () => pts().map((p) => p.value);
  const min = () => Math.min(0, ...values());
  const max = () => Math.max(0, ...values());
  const span = () => max() - min() || 1;
  const x = (i: number) => pad.l + (pts().length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (pts().length - 1));
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - min()) / span());
  const step = () => (W - pad.l - pad.r) / Math.max(1, pts().length - 1);
  const line = () => pts().map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = () => `${line()} L${x(pts().length - 1).toFixed(1)},${H - pad.b} L${x(0).toFixed(1)},${H - pad.b} Z`;
  const show = () => (hover && hover.id === id ? hover.index : -1);
  const tip = () => { const i = show(); return i >= 0 ? `${pts()[i].label} · ${fmt(pts()[i].value)}` : ""; };
  const tipX = () => x(Math.max(0, show()));
  const tipY = () => y(pts()[Math.max(0, show())].value);
  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, role: "img", "aria-label": "Line chart", style: { display: "block" } },
    { onPointerMove: (e) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      if (!rect.width || pts().length < 2) return;
      const xv = ((e.clientX - rect.left) / rect.width) * W;
      const index = Math.max(0, Math.min(pts().length - 1, Math.round((xv - pad.l) / step())));
      if (hover?.id === id && hover.index === index) return;
      hover = { id, index };
      refresh();
    }, onPointerLeave: () => { if (hover?.id === id) { hover = null; refresh(); } } },
    lineSvg({ x1: pad.l, x2: W - pad.r, y1: H - pad.b, y2: H - pad.b, style: { stroke: "var(--os-line)" } }),
    textSvg({ x: W - pad.r, y: pad.t - 3, "text-anchor": "end", fill: "var(--os-muted)", ...TEXT }, () => fmt(max())),
    textSvg({ x: W - pad.r, y: H - pad.b - 5, "text-anchor": "end", fill: "var(--os-muted)", ...TEXT }, () => fmt(min())),
    ...(opts.area ? [pathSvg({ d: () => area(), fill: color, opacity: 0.14, stroke: "none" })] : []),
    pathSvg({ d: () => line(), fill: "none", stroke: color, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }),
    ...(opts.dots === false ? [] : pts().map((_, i) => circleSvg({ cx: () => x(i), cy: () => y(pts()[i].value), r: 2.6, fill: "var(--os-panel)", stroke: color, "stroke-width": 1.6 }))),
    ...(opts.labels === false ? [] : pts().flatMap((_, i) => (i === 0 || i === pts().length - 1 || pts().length <= 6) ? [textSvg({ x: () => x(i), y: H - 5, "text-anchor": "middle", fill: "var(--os-muted)", ...TEXT }, () => pts()[i].label)] : [])),
    gSvg({},
      lineSvg({ x1: () => tipX(), x2: () => tipX(), y1: pad.t, y2: H - pad.b, stroke: color, "stroke-width": 1, "stroke-dasharray": "3 3", opacity: () => (show() < 0 ? 0 : 0.35) }),
      circleSvg({ cx: () => tipX(), cy: () => tipY(), r: 4, fill: color, stroke: "var(--os-panel)", "stroke-width": 2, opacity: () => (show() < 0 ? 0 : 1) }),
      rectSvg({ x: () => Math.min(W - tip().length * 5.6 - 18, Math.max(4, tipX() - tip().length * 2.8 - 9)), y: () => Math.max(2, tipY() - 26), width: () => tip().length * 5.6 + 18, height: 16, rx: 5, fill: "var(--os-panel)", stroke: "var(--os-line)", "stroke-width": 1, opacity: () => (show() < 0 ? 0 : 1) }),
      textSvg({ x: () => Math.min(W - tip().length * 2.8 - 9, Math.max(13, tipX())), y: () => (tipY() > 26 ? tipY() - 14 : tipY() + 20), "text-anchor": "middle", fill: "var(--os-text)", "font-size": 9, "font-family": "ui-monospace, monospace", opacity: () => (show() < 0 ? 0 : 1) }, () => tip()),
    ),
  );
}

// ---------------------------------------------------------------------------
// Grouped bars: one bar per series, side by side for every group.
// ---------------------------------------------------------------------------
export interface BarSeries { value: number; color: string }
export interface BarGroup { label: string; values: BarSeries[] }
export interface BarOpts { height?: number; format?: (n: number) => string }

export function BarChart(groups: () => BarGroup[], opts: BarOpts = {}) {
  const W = 360;
  const H = opts.height ?? 170;
  const pad = { l: 10, r: 10, t: 14, b: 18 };
  const fmt = opts.format ?? ((n: number) => String(Math.round(n)));
  const grp = () => groups();
  const max = () => Math.max(1, ...grp().flatMap((g) => g.values.map((v) => v.value)));
  const groupW = () => (W - pad.l - pad.r) / Math.max(1, grp().length);
  const bars = () => grp()[0]?.values.length ?? 1;
  const barW = () => Math.min(18, Math.max(3, (groupW() - 10) / bars()));
  const xOf = (gi: number, si: number) => pad.l + gi * groupW() + (groupW() - grp()[gi].values.length * barW()) / 2 + si * barW();
  const yOf = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max());
  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, role: "img", "aria-label": "Bar chart", style: { display: "block" } },
    lineSvg({ x1: pad.l, x2: W - pad.r, y1: H - pad.b, y2: H - pad.b, style: { stroke: "var(--os-line)" } }),
    textSvg({ x: W - pad.r, y: pad.t - 3, "text-anchor": "end", fill: "var(--os-muted)", ...TEXT }, () => fmt(max())),
    ...grp().flatMap((_, gi) => grp()[gi].values.map((v, si) => rectSvg({ x: () => xOf(gi, si), y: () => yOf(grp()[gi].values[si].value), width: () => barW(), height: () => Math.max(0.5, H - pad.b - yOf(grp()[gi].values[si].value)), rx: () => Math.min(3, barW() / 2), fill: v.color, style: { transition: "height .35s ease, y .35s ease" } }))),
    ...grp().map((_, gi) => textSvg({ x: () => pad.l + gi * groupW() + groupW() / 2, y: H - 5, "text-anchor": "middle", fill: "var(--os-muted)", ...TEXT }, () => grp()[gi].label)),
  );
}

// ---------------------------------------------------------------------------
// Donut: circle strokes with dasharray segments, one per slice, plus the
// total in the hole. The slices are a factory, but the ring keeps a fixed
// number of segment circles, so updates only re-size the arcs.
// ---------------------------------------------------------------------------
export interface DonutSlice { label: string; value: number; color: string }
export interface DonutOpts { size?: number; thickness?: number }

export function DonutChart(slices: () => DonutSlice[], center: { value: () => string; sub: string }, opts: DonutOpts = {}) {
  const size = opts.size ?? 150;
  const thickness = opts.thickness ?? 20;
  const r = (size - thickness) / 2 - 2;
  const c = size / 2;
  const segs = () => {
    const list = slices();
    const total = list.reduce((a, s) => a + s.value, 0) || 1;
    const C = 2 * Math.PI * r;
    let acc = 0;
    return list.map((s) => {
      const frac = s.value / total;
      const seg = { dash: Math.max(0, frac * C - 1.5), offset: acc }; // the 1.5 leaves a hairline gap
      acc += frac * C;
      return seg;
    });
  };
  const C = 2 * Math.PI * r;
  return svgSvg(
    { viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: "img", "aria-label": "Donut chart", style: { display: "block" } },
    ...(slices().length ? slices().map((_, i) => circleSvg({ cx: c, cy: c, r, fill: "none", stroke: () => slices()[i].color, "stroke-width": thickness, "stroke-dasharray": () => `${segs()[i].dash} ${C - segs()[i].dash}`, "stroke-dashoffset": () => -segs()[i].offset, transform: `rotate(-90 ${c} ${c})`, style: { transition: "stroke-dasharray .4s ease, stroke-dashoffset .4s ease" } }))
      : [circleSvg({ cx: c, cy: c, r, fill: "none", stroke: "var(--os-line)", "stroke-width": thickness })]),
    textSvg({ x: c, y: c - 4, "text-anchor": "middle", fill: "var(--os-text)", "font-size": 15, "font-weight": 600 }, () => center.value()),
    textSvg({ x: c, y: c + 11, "text-anchor": "middle", fill: "var(--os-muted)", ...TEXT }, () => center.sub),
  );
}
