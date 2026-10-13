/**
 * Interactive SVG examples: drawing, dragging, physics and games. Pointer
 * handlers map the pointer into viewBox units from the svg's box, and the
 * demos that animate every frame update only their own scope(). Like
 * svg-demos.ts, the previews follow the site's theme and the sources keep
 * plain colors.
 */
import { colors, css } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { es } from "./styles.ts";
import { rand, ss, type SvgExample } from "./svg-demos.ts";

// A stroke with pathLength="1" and a dash of 1 is drawn in by animating its offset from 1 to 0.
const draw = keyframes({ from: { raw: { "stroke-dashoffset": "1" } }, to: { raw: { "stroke-dashoffset": "0" } } });

const is = {
  row: css("pages-examples-svg-interactive-demos-row", { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "8px" }),
  board: css("pages-examples-svg-interactive-demos-board", { raw: { fill: "var(--c-bg)", stroke: "var(--c-border-light)" } }),
  pad: css("pages-examples-svg-interactive-demos-pad", { cursor: "crosshair" }),
  tool: css("pages-examples-svg-interactive-demos-tool", { display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", border: `1px solid ${colors.borderLight}`, color: colors.text, hover: { backgroundColor: colors.bgSecondary }, "&[aria-pressed=true]": { outline: `2px solid ${colors.text}`, outlineOffset: "2px" } }),
  dot: css("pages-examples-svg-interactive-demos-dot", { display: "block", borderRadius: "50%", backgroundColor: "currentColor" }),
  orange: css("pages-examples-svg-interactive-demos-orange", { color: colors.primary }),
  ink: css("pages-examples-svg-interactive-demos-ink", { color: colors.text }),
  field: css("pages-examples-svg-interactive-demos-field", { display: "grid", gridTemplateColumns: "52px 1fr 32px", alignItems: "center", gap: "10px", width: "100%", maxWidth: "300px", fontSize: "0.8125rem", color: colors.textDim, "& input": { width: "100%", accentColor: colors.primary }, "& span:last-child": { fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", textAlign: "right", color: colors.textMuted, fontVariantNumeric: "tabular-nums" } }),

  knob: css("pages-examples-svg-interactive-demos-knob", { cursor: "grab", borderRadius: "50%", outline: "none", focusVisible: { outline: `2px solid ${colors.primary}`, outlineOffset: "6px" } }),
  knobBody: css("pages-examples-svg-interactive-demos-knobBody", { filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.22))", raw: { fill: "var(--c-bg-card)", stroke: "var(--c-border-light)" } }),
  knobArc: css("pages-examples-svg-interactive-demos-knobArc", { transition: "stroke-dasharray 0.12s ease-out" }),
  knobTick: css("pages-examples-svg-interactive-demos-knobTick", { transition: "stroke 0.15s ease" }),
  indicator: css("pages-examples-svg-interactive-demos-indicator", { transition: "transform 0.12s ease-out", transformOrigin: "100px 100px" }),
  big: css("pages-examples-svg-interactive-demos-big", { fontWeight: "700", fontSize: "30px", fontVariantNumeric: "tabular-nums", raw: { fill: "var(--c-text)" } }),

  picker: css("pages-examples-svg-interactive-demos-picker", { filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.45))" }),
  swatch: css("pages-examples-svg-interactive-demos-swatch", { width: "40px", height: "40px", borderRadius: "10px", border: `1px solid ${colors.borderLight}`, flexShrink: 0 }),
  hex: css("pages-examples-svg-interactive-demos-hex", { minWidth: "80px", fontFamily: "ui-monospace, monospace", fontSize: "0.9375rem", fontWeight: "600", color: colors.text }),
  chips: css("pages-examples-svg-interactive-demos-chips", { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", minHeight: "26px" }),
  chip: css("pages-examples-svg-interactive-demos-chip", { width: "26px", height: "26px", borderRadius: "7px", border: `1px solid ${colors.borderLight}`, transition: "transform 0.15s ease", hover: { transform: "scale(1.12)" } }),

  ghost: css("pages-examples-svg-interactive-demos-ghost", { raw: { "stroke-opacity": "0.14" } }),
  gear: css("pages-examples-svg-interactive-demos-gear", { color: colors.accentCool, transition: "opacity 0.4s ease" }),

  shine: css("pages-examples-svg-interactive-demos-shine", { pointerEvents: "none", raw: { fill: "#fff", "fill-opacity": "0.35" } }),
  aim: css("pages-examples-svg-interactive-demos-aim", { pointerEvents: "none", raw: { stroke: "var(--c-text-muted)", fill: "none" } }),

  link: css("pages-examples-svg-interactive-demos-link", { raw: { stroke: "var(--c-border-light)" } }),
  node: css("pages-examples-svg-interactive-demos-node", { cursor: "grab", raw: { stroke: "var(--c-bg-card)" } }),

  brushBox: css("pages-examples-svg-interactive-demos-brushBox", { pointerEvents: "none", raw: { fill: "var(--c-primary)", "fill-opacity": "0.1", stroke: "var(--c-primary)" } }),
  hit: css("pages-examples-svg-interactive-demos-hit", { cursor: "crosshair", raw: { fill: "transparent" } }),

  grid: css("pages-examples-svg-interactive-demos-grid", { animation: `${draw} 0.6s ease-out both`, raw: { stroke: "var(--c-border-light)" } }),
  cell: css("pages-examples-svg-interactive-demos-cell", { cursor: "pointer", outline: "none", transition: "fill 0.15s ease", raw: { fill: "transparent" }, hover: { raw: { fill: "var(--c-primary-alpha-08)" } }, focusVisible: { raw: { fill: "var(--c-primary-alpha-13)" } } }),
  mark: css("pages-examples-svg-interactive-demos-mark", { pointerEvents: "none", animation: `${draw} 0.35s ease-out both` }),
  // The computer's O and the winning line draw in after the move that caused them.
  late: css("pages-examples-svg-interactive-demos-late", { raw: { "animation-delay": "0.3s" } }),
  winLine: css("pages-examples-svg-interactive-demos-winLine", { color: colors.text, raw: { "animation-delay": "0.6s" } }),
  status: css("pages-examples-svg-interactive-demos-status", { fontSize: "0.9375rem", fontWeight: "600", color: colors.text, textAlign: "center" }),

  spin: css("pages-examples-svg-interactive-demos-spin", { transformOrigin: "100px 100px", animation: `${animations.spin} 18s linear infinite` }),
  ringText: css("pages-examples-svg-interactive-demos-ringText", { fontWeight: "700", raw: { fill: "var(--c-text)" } }),
  guide: css("pages-examples-svg-interactive-demos-guide", { transition: "opacity 0.2s ease", raw: { stroke: "var(--c-border-light)" } }),
  disc: css("pages-examples-svg-interactive-demos-disc", { transition: "r 0.2s ease", raw: { fill: "var(--c-primary)" } }),
  monogram: css("pages-examples-svg-interactive-demos-monogram", { fontWeight: "800", raw: { fill: "#fff" } }),
  textInput: css("pages-examples-svg-interactive-demos-textInput", { flex: "none", width: "100%", maxWidth: "300px" }),
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** The pointer in viewBox units: the svg is scaled to its box, so a fraction of the box is a fraction of the viewBox. */
export function pointer(e: PointerEvent, w: number, h: number) {
  const box = (e.currentTarget as Element).getBoundingClientRect();
  return [((e.clientX - box.left) / box.width) * w, ((e.clientY - box.top) / box.height) * h];
}

/**
 * An onMount handler that runs step() on every animation frame, then updates
 * only the scope `id`: the rest of the page is left alone 60 times a second.
 * dt is the frame's length in 60 fps frames. step() returns false when nothing
 * moved, which skips the update.
 */
export const frames = (id: string, step: (dt: number) => boolean | void) => () => {
  let last = performance.now();
  let raf = requestAnimationFrame(function tick(now: number) {
    // rAF's timestamp is the frame's start, which can precede the performance.now() above
    const dt = clamp((now - last) / (1000 / 60), 0, 2);
    last = now;
    if (step(dt) !== false) update(id);
    raf = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(raf);
};

/** A labeled range input with its value beside it. */
export function Slider(name: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void) {
  return label(
    is.field,
    span(name),
    input({ type: "range", min: String(min), max: String(max), step: String(step), value: () => String(get()), onInput: (e) => set(Number(e.currentTarget.value)) }),
    span(() => String(get())),
  );
}

// ── Drawing pad ──────────────────────────────────────────────────────────

function DrawingPad() {
  const W = 320;
  const H = 200;
  const COLORS = [["Orange", is.orange], ["Blue", ss.cool], ["Amber", ss.warm], ["Ink", is.ink]] as const;
  const SIZES = [2, 5, 10];
  type Stroke = { color: (typeof COLORS)[number][1]; size: number; points: number[][] };
  let strokes: Stroke[] = [];
  let color: Stroke["color"] = COLORS[0][1];
  let size = SIZES[1];
  let current: Stroke | null = null;

  // Kept inside the pad: the pointer is captured, so a stroke can leave the box.
  const at = (e: PointerEvent) => {
    const [x, y] = pointer(e, W, H);
    return [Math.round(clamp(x, 4, W - 4)), Math.round(clamp(y, 4, H - 4))];
  };
  const end = () => { current = null; };

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.drag,
      is.pad,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Drawing pad",
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = at(e);
          current = { color, size, points: [p, p] }; // two points, so a tap leaves a dot
          strokes.push(current);
          update();
        },
        onPointerMove: (e) => {
          if (!current) return;
          const p = at(e);
          const last = current.points[current.points.length - 1];
          if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
          current.points.push(p);
          update();
        },
        onPointerUp: end,
        onPointerCancel: end,
      },
      rectSvg(is.board, { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 12 }),
      textSvg(ss.label, { x: W / 2, y: H / 2 + 4, "text-anchor": "middle", opacity: () => (strokes.length ? 0 : 1) }, "draw here"),
      list(() => strokes, (s) =>
        polylineSvg(s.color, { points: () => s.points.join(" "), fill: "none", stroke: "currentColor", "stroke-width": s.size, "stroke-linecap": "round", "stroke-linejoin": "round" }),
      ),
    ),
    div(
      is.row,
      ...COLORS.map(([name, c]) =>
        button(is.tool, { "aria-label": name, "aria-pressed": () => String(color === c), onClick: () => { color = c; update(); } }, span(is.dot, c, { style: { width: "20px", height: "20px" } })),
      ),
      ...SIZES.map((s) =>
        button(is.tool, { "aria-label": `Size ${s}`, "aria-pressed": () => String(size === s), onClick: () => { size = s; update(); } }, span(is.dot, { style: { width: `${s + 4}px`, height: `${s + 4}px` } })),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, "Undo", { onClick: () => { strokes.pop(); update(); } }),
      button(es.button, "Clear", { onClick: () => { strokes = []; update(); } }),
    ),
    div(ss.caption, () => `${strokes.length} ${strokes.length === 1 ? "stroke" : "strokes"}`),
  );
}

const DRAWING_PAD_CODE = `import 'nuclo'

type Stroke = { color: string; size: number; points: number[][] }

const COLORS = ['#ff3f00', '#2563eb', '#ff8a00', '#222']
const SIZES = [2, 5, 10]
let strokes: Stroke[] = []
let color = COLORS[0]
let size = 5
let current: Stroke | null = null

// The pointer in viewBox units, kept inside the pad: the pointer
// is captured, so a stroke can leave the box.
const at = (e: PointerEvent) => {
  const box = (e.currentTarget as Element).getBoundingClientRect()
  const x = ((e.clientX - box.left) / box.width) * 320
  const y = ((e.clientY - box.top) / box.height) * 200
  return [
    Math.round(Math.max(0, Math.min(320, x))),
    Math.round(Math.max(0, Math.min(200, y))),
  ]
}

// list() renders one polyline per stroke. Its points are a
// function, so the stroke being drawn grows on every update().
// Undo is strokes.pop().
export const DrawingPad = () =>
  div(
    svgSvg(
      {
        viewBox: '0 0 320 200', width: '320', height: '200',
        style: { touchAction: 'none', cursor: 'crosshair', background: '#fafafa' },
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = at(e)
          current = { color, size, points: [p, p] } // a tap leaves a dot
          strokes.push(current)
          update()
        },
        onPointerMove: (e) => {
          if (!current) return
          current.points.push(at(e))
          update()
        },
        onPointerUp: () => { current = null },
      },
      list(() => strokes, (stroke) =>
        polylineSvg({
          points: () => stroke.points.join(' '),
          fill: 'none',
          stroke: stroke.color,
          'stroke-width': stroke.size,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      ),
    ),
    ...COLORS.map((c) =>
      button({
        'aria-label': c,
        'aria-pressed': () => String(color === c),
        style: { width: '28px', height: '28px', borderRadius: '50%', background: c },
        onClick: () => { color = c; update() },
      }),
    ),
    ...SIZES.map((s) =>
      button(\`\${s}px\`, {
        'aria-pressed': () => String(size === s),
        onClick: () => { size = s; update() },
      }),
    ),
    button('Undo', { onClick: () => { strokes.pop(); update() } }),
    button('Clear', { onClick: () => { strokes = []; update() } }),
  )`;

// ── Rotary knob ──────────────────────────────────────────────────────────

function Knob() {
  const TICKS = 27;
  const KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10, Home: -100, End: 100 };
  let value = 40;
  const set = (next: number) => { value = Math.round(clamp(next, 0, 100)); update(); };
  const polar = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(100 + r * Math.sin(a)).toFixed(2)},${(100 - r * Math.cos(a)).toFixed(2)}`;
  };
  const ARC = `M${polar(-135, 76)} A76,76 0 1 1 ${polar(135, 76)}`;

  function turn(e: PointerEvent) {
    if (!e.buttons) return;
    const [x, y] = pointer(e, 200, 200);
    let deg = (Math.atan2(x - 100, 100 - y) * 180) / Math.PI;
    if (Math.abs(deg) > 135) deg = value > 50 ? 135 : -135; // in the gap at the bottom, stay at the nearer end
    set((deg + 135) / 2.7);
  }

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      ss.drag,
      is.knob,
      {
        viewBox: "0 0 200 200", tabindex: "0", role: "slider", "aria-label": "Volume", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": () => String(value),
        onPointerDown: (e) => { e.currentTarget.setPointerCapture(e.pointerId); turn(e); },
        onPointerMove: turn,
        onKeyDown: (e) => {
          if (!(e.key in KEYS)) return;
          e.preventDefault();
          set(value + KEYS[e.key]);
        },
      },
      ...Array.from({ length: TICKS }, (_, i) =>
        lineSvg(is.knobTick, {
          x1: 100, y1: 4, x2: 100, y2: 11, "stroke-width": 2.5, "stroke-linecap": "round",
          transform: `rotate(${-135 + (i * 270) / (TICKS - 1)} 100 100)`,
          style: () => ({ stroke: (i / (TICKS - 1)) * 100 <= value ? "var(--c-primary)" : "var(--c-border-light)" }),
        }),
      ),
      pathSvg(ss.track, { d: ARC, pathLength: "100", fill: "none", "stroke-width": 7, "stroke-linecap": "round" }),
      pathSvg(is.knobArc, { d: ARC, pathLength: "100", fill: "none", stroke: "currentColor", "stroke-width": 7, "stroke-linecap": "round", "stroke-dasharray": () => `${value} 100` }),
      circleSvg(is.knobBody, { cx: 100, cy: 100, r: 58 }),
      gSvg(
        is.indicator,
        { style: () => ({ transform: `rotate(${-135 + value * 2.7}deg)` }) },
        lineSvg({ x1: 100, y1: 50, x2: 100, y2: 64, stroke: "currentColor", "stroke-width": 4, "stroke-linecap": "round" }),
      ),
      textSvg(is.big, { x: 100, y: 112, "text-anchor": "middle" }, () => String(value)),
      textSvg(ss.label, { x: 100, y: 130, "text-anchor": "middle" }, "VOLUME"),
    ),
    div(
      es.buttonRow,
      button(es.button, "Mute", { onClick: () => set(0) }),
      button(es.button, "Half", { onClick: () => set(50) }),
      button(es.button, es.buttonPrimary, "Max", { onClick: () => set(100) }),
    ),
    div(ss.caption, "drag it, or focus it and use the arrow keys"),
  );
}

const KNOB_CODE = `import 'nuclo'

let value = 40

const set = (next: number) => {
  value = Math.round(Math.max(0, Math.min(100, next)))
  update()
}

// 0..100 maps to -135°..135°, clockwise from 12 o'clock.
const angle = () => -135 + value * 2.7
const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return \`\${100 + r * Math.sin(rad)},\${100 - r * Math.cos(rad)}\`
}
const ARC = \`M\${polar(-135, 76)} A76,76 0 1 1 \${polar(135, 76)}\`

// The pointer's angle around the center is the value.
function turn(e: PointerEvent) {
  if (!e.buttons) return
  const box = (e.currentTarget as Element).getBoundingClientRect()
  const x = e.clientX - box.left - box.width / 2
  const y = e.clientY - box.top - box.height / 2
  let deg = (Math.atan2(x, -y) * 180) / Math.PI
  if (Math.abs(deg) > 135) deg = value > 50 ? 135 : -135
  set((deg + 135) / 2.7)
}

const KEYS: Record<string, number> = {
  ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1,
  PageUp: 10, PageDown: -10, Home: -100, End: 100,
}

// pathLength="100" makes the arc 100 units long, whatever its
// real length, so the value is the dash length as it is.
export const Knob = () =>
  svgSvg(
    {
      viewBox: '0 0 200 200', width: '200', height: '200',
      tabindex: '0', role: 'slider', 'aria-label': 'Volume',
      'aria-valuemin': '0', 'aria-valuemax': '100',
      'aria-valuenow': () => String(value),
      style: { touchAction: 'none', cursor: 'grab' },
      onPointerDown: (e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        turn(e)
      },
      onPointerMove: turn,
      onKeyDown: (e) => {
        if (!(e.key in KEYS)) return
        e.preventDefault()
        set(value + KEYS[e.key])
      },
    },
    ...Array.from({ length: 27 }, (_, i) =>
      lineSvg({
        x1: 100, y1: 4, x2: 100, y2: 11,
        'stroke-width': 2.5, 'stroke-linecap': 'round',
        transform: \`rotate(\${-135 + i * 10.38} 100 100)\`,
        stroke: () => (i * 3.85 <= value ? '#ff3f00' : '#ddd'),
      }),
    ),
    pathSvg({
      d: ARC, pathLength: '100', fill: 'none', stroke: '#eee',
      'stroke-width': 7, 'stroke-linecap': 'round',
    }),
    pathSvg({
      d: ARC, pathLength: '100', fill: 'none', stroke: '#ff3f00',
      'stroke-width': 7, 'stroke-linecap': 'round',
      'stroke-dasharray': () => \`\${value} 100\`,
    }),
    circleSvg({ cx: 100, cy: 100, r: 58, fill: '#fff', stroke: '#ddd' }),
    lineSvg({
      x1: 100, y1: 50, x2: 100, y2: 64,
      stroke: '#ff3f00', 'stroke-width': 4, 'stroke-linecap': 'round',
      transform: () => \`rotate(\${angle()} 100 100)\`,
    }),
    textSvg(
      { x: 100, y: 112, 'text-anchor': 'middle', 'font-size': 30 },
      () => String(value),
    ),
  )`;

// ── Color wheel ──────────────────────────────────────────────────────────

function ColorWheel() {
  const R = 90;
  type Swatch = { hue: number; sat: number; val: number; hex: string };
  let hue = 18;
  let sat = 0.9;
  let val = 1;
  let saved: Swatch[] = [];
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const at = (deg: number) => `${(100 + R * Math.cos(rad(deg))).toFixed(2)},${(100 + R * Math.sin(rad(deg))).toFixed(2)}`;
  // HSV to RGB, one channel per n: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative
  const hex = (h: number, s: number, v: number) =>
    "#" + [5, 3, 1].map((n) => {
      const k = (n + h / 60) % 6;
      return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255).toString(16).padStart(2, "0");
    }).join("");
  const current = () => hex(hue, sat, val);

  function pick(e: PointerEvent) {
    if (!e.buttons) return;
    const [x, y] = pointer(e, 200, 200);
    hue = Math.round(((Math.atan2(y - 100, x - 100) * 180) / Math.PI + 360) % 360);
    sat = Math.min(1, Math.hypot(x - 100, y - 100) / R);
    update();
  }

  function save() {
    const c = current();
    saved = [{ hue, sat, val, hex: c }, ...saved.filter((s) => s.hex !== c)].slice(0, 8);
    update();
  }

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      ss.drag,
      {
        viewBox: "0 0 200 200", role: "img", "aria-label": "Color wheel",
        onPointerDown: (e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); },
        onPointerMove: pick,
      },
      defsSvg(
        radialGradientSvg({ id: "ex-wheel-white" }, stopSvg({ offset: "0", "stop-color": "#fff" }), stopSvg({ offset: "1", "stop-color": "#fff", "stop-opacity": 0 })),
      ),
      // 90 wedges, each 0.5° wider than its step so no seam shows between them.
      ...Array.from({ length: 90 }, (_, i) =>
        pathSvg({ d: `M100,100 L${at(i * 4)} A${R},${R} 0 0 1 ${at(i * 4 + 4.5)} Z`, fill: `hsl(${i * 4 + 2}, 100%, 50%)` }),
      ),
      circleSvg({ cx: 100, cy: 100, r: R, fill: "url(#ex-wheel-white)" }),
      circleSvg({ cx: 100, cy: 100, r: R, fill: "#000", "fill-opacity": () => (1 - val).toFixed(2) }),
      circleSvg(is.picker, {
        r: 9, fill: current, stroke: "#fff", "stroke-width": 3,
        cx: () => (100 + sat * R * Math.cos(rad(hue))).toFixed(1),
        cy: () => (100 + sat * R * Math.sin(rad(hue))).toFixed(1),
      }),
    ),
    Slider("Bright", 0, 100, 1, () => Math.round(val * 100), (v) => { val = v / 100; update(); }),
    div(
      is.row,
      div(is.swatch, { style: () => ({ backgroundColor: current() }) }),
      span(is.hex, current),
      button(es.button, es.buttonPrimary, "Save", { onClick: save }),
    ),
    div(
      is.chips,
      list(() => saved, (s) =>
        button(is.chip, { style: { backgroundColor: s.hex }, title: s.hex, "aria-label": `Use ${s.hex}`, onClick: () => { hue = s.hue; sat = s.sat; val = s.val; update(); } }),
      ),
      when(() => !saved.length, span(ss.caption, "saved colors land here")),
    ),
  );
}

const COLOR_WHEEL_CODE = `import 'nuclo'

type Swatch = { hue: number; sat: number; val: number; hex: string }

let hue = 18  // the angle, 0..360
let sat = 0.9 // the distance from the center, 0..1
let val = 1   // the brightness slider, 0..1
let saved: Swatch[] = []

// HSV to hex, one channel per n.
const hex = (h: number, s: number, v: number) =>
  '#' + [5, 3, 1]
    .map((n) => {
      const k = (n + h / 60) % 6
      const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
      return Math.round(c * 255).toString(16).padStart(2, '0')
    })
    .join('')
const current = () => hex(hue, sat, val)

const rad = (deg: number) => (deg * Math.PI) / 180
const at = (deg: number) =>
  \`\${100 + 90 * Math.cos(rad(deg))},\${100 + 90 * Math.sin(rad(deg))}\`

// The pointer's angle is the hue, its distance the saturation.
function pick(e: PointerEvent) {
  if (!e.buttons) return
  const box = (e.currentTarget as Element).getBoundingClientRect()
  const x = ((e.clientX - box.left) / box.width) * 200 - 100
  const y = ((e.clientY - box.top) / box.height) * 200 - 100
  hue = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360)
  sat = Math.min(1, Math.hypot(x, y) / 90)
  update()
}

// 90 wedges of hue, a radial gradient from white on top for the
// saturation, and a black disc whose opacity is the darkness.
export const ColorWheel = () =>
  div(
    svgSvg(
      {
        viewBox: '0 0 200 200', width: '200', height: '200',
        style: { touchAction: 'none' },
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        },
        onPointerMove: pick,
      },
      defsSvg(
        radialGradientSvg(
          { id: 'white' },
          stopSvg({ offset: '0', 'stop-color': '#fff' }),
          stopSvg({ offset: '1', 'stop-color': '#fff', 'stop-opacity': 0 }),
        ),
      ),
      ...Array.from({ length: 90 }, (_, i) =>
        pathSvg({
          d: \`M100,100 L\${at(i * 4)} A90,90 0 0 1 \${at(i * 4 + 4.5)} Z\`,
          fill: \`hsl(\${i * 4 + 2}, 100%, 50%)\`,
        }),
      ),
      circleSvg({ cx: 100, cy: 100, r: 90, fill: 'url(#white)' }),
      circleSvg({
        cx: 100, cy: 100, r: 90, fill: '#000',
        'fill-opacity': () => 1 - val,
      }),
      circleSvg({
        r: 9, fill: current, stroke: '#fff', 'stroke-width': 3,
        cx: () => 100 + sat * 90 * Math.cos(rad(hue)),
        cy: () => 100 + sat * 90 * Math.sin(rad(hue)),
      }),
    ),
    input({
      type: 'range', min: '0', max: '100',
      value: () => String(Math.round(val * 100)),
      onInput: (e) => { val = Number(e.currentTarget.value) / 100; update() },
    }),
    code(current),
    button('Save', {
      onClick: () => {
        const c = current()
        saved = [{ hue, sat, val, hex: c }, ...saved.filter((s) => s.hex !== c)]
        update()
      },
    }),
    div(
      list(() => saved, (s) =>
        button({
          title: s.hex,
          style: { width: '24px', height: '24px', background: s.hex },
          onClick: () => { hue = s.hue; sat = s.sat; val = s.val; update() },
        }),
      ),
    ),
  )`;

// ── Spirograph ───────────────────────────────────────────────────────────

function Spirograph() {
  const R = 96; // the fixed ring
  const STEPS = 180; // points per lap of the wheel around the ring
  let r = 60; // the rolling wheel
  let d = 52; // the pen's distance from the wheel's center
  let pts: number[][] = [];
  let lens: number[] = []; // the curve's length up to each point
  let line = "";
  let s = 1; // the scale that fits the drawing in the box
  let k = 0; // how many points are drawn
  let playing = true;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

  function trace() {
    const n = (r / gcd(R, r)) * STEPS; // the pen is back at its start after r / gcd(R, r) laps
    s = 88 / Math.max(R, R - r + d);
    pts = [];
    lens = [0];
    for (let i = 0; i <= n; i++) {
      const t = (i / STEPS) * 2 * Math.PI;
      const p = [
        100 + s * ((R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)),
        100 + s * ((R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)),
      ].map((v) => Math.round(v * 10) / 10);
      if (i) lens.push(lens[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]));
      pts.push(p);
    }
    line = pts.join(" ");
    k = 0;
    playing = true;
  }
  trace();

  const last = () => pts.length - 1;
  const done = () => k >= last();
  const pen = () => pts[Math.floor(k)];
  const wheel = () => {
    const t = (Math.floor(k) / STEPS) * 2 * Math.PI;
    return [100 + s * (R - r) * Math.cos(t), 100 + s * (R - r) * Math.sin(t)];
  };

  return div(
    ss.wrap,
    scope("ex-spiro"),
    svgSvg(
      ss.svg,
      ss.small,
      {
        viewBox: "0 0 200 200", role: "img", "aria-label": "Spirograph",
        onMount: frames("ex-spiro", (dt) => {
          if (!playing || done()) return false;
          k = Math.min(last(), k + Math.max(3, last() / 300) * dt);
        }),
      },
      polylineSvg(is.ghost, { points: () => line, fill: "none", stroke: "currentColor" }),
      polylineSvg({ points: () => line, fill: "none", stroke: "currentColor", "stroke-width": 1.4, "stroke-linejoin": "round", "stroke-dasharray": () => `${lens[Math.floor(k)]} ${lens[last()]}` }),
      gSvg(
        is.gear,
        { opacity: () => (done() ? 0 : 1) },
        circleSvg({ cx: 100, cy: 100, r: () => R * s, fill: "none", stroke: "currentColor", "stroke-opacity": 0.4 }),
        circleSvg({ cx: () => wheel()[0], cy: () => wheel()[1], r: () => r * s, fill: "none", stroke: "currentColor" }),
        lineSvg({ x1: () => wheel()[0], y1: () => wheel()[1], x2: () => pen()[0], y2: () => pen()[1], stroke: "currentColor" }),
        circleSvg({ cx: () => pen()[0], cy: () => pen()[1], r: 3, fill: "currentColor" }),
      ),
    ),
    Slider("Wheel", 24, 84, 4, () => r, (v) => { r = v; trace(); }),
    Slider("Pen", 10, 90, 2, () => d, (v) => { d = v; trace(); }),
    div(
      es.buttonRow,
      button(es.button, () => (done() ? "Replay" : playing ? "Pause" : "Play"), {
        onClick: () => {
          if (done()) { k = 0; playing = true; } else playing = !playing;
          update("ex-spiro");
        },
      }),
      button(es.button, es.buttonPrimary, "Random", { onClick: () => { r = rand(6, 21) * 4; d = rand(5, 45) * 2; trace(); } }),
    ),
  );
}

const SPIROGRAPH_CODE = `import 'nuclo'

const R = 96 // the fixed ring
let r = 60   // the rolling wheel
let d = 52   // the pen's distance from the wheel's center
let line = ''
let lens: number[] = [] // the curve's length up to each point
let k = 0               // how many points are drawn

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

// A hypotrochoid. The pen is back at its start after
// r / gcd(R, r) laps, 180 points per lap.
function trace() {
  const n = (r / gcd(R, r)) * 180
  const s = 88 / Math.max(R, R - r + d) // fit it in the box
  const pts: number[][] = []
  lens = [0]
  for (let i = 0; i <= n; i++) {
    const t = (i / 180) * 2 * Math.PI
    const p = [
      100 + s * ((R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)),
      100 + s * ((R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)),
    ]
    if (i) lens.push(lens[i - 1] + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]))
    pts.push(p)
  }
  line = pts.join(' ')
  k = 0
}
trace()

// The points are computed once per shape. Drawing it is only a
// longer dash on every frame, and update('spiro') refreshes the
// scoped element alone instead of the whole page.
export const Spirograph = () =>
  div(
    scope('spiro'),
    svgSvg(
      {
        viewBox: '0 0 200 200', width: '200', height: '200',
        onMount: () => {
          let id = requestAnimationFrame(function frame() {
            const last = lens.length - 1
            if (k < last) {
              k = Math.min(last, k + Math.max(3, last / 300))
              update('spiro')
            }
            id = requestAnimationFrame(frame)
          })
          return () => cancelAnimationFrame(id)
        },
      },
      polylineSvg({
        points: () => line, fill: 'none',
        stroke: '#ff3f00', 'stroke-opacity': 0.15,
      }),
      polylineSvg({
        points: () => line, fill: 'none',
        stroke: '#ff3f00', 'stroke-width': 1.4,
        'stroke-dasharray': () =>
          \`\${lens[Math.floor(k)]} \${lens[lens.length - 1]}\`,
      }),
    ),
    label(
      'Wheel',
      input({
        type: 'range', min: '24', max: '84', step: '4',
        value: () => String(r),
        onInput: (e) => { r = Number(e.currentTarget.value); trace() },
      }),
    ),
    label(
      'Pen',
      input({
        type: 'range', min: '10', max: '90', step: '2',
        value: () => String(d),
        onInput: (e) => { d = Number(e.currentTarget.value); trace() },
      }),
    ),
  )`;

// ── Bouncing balls ───────────────────────────────────────────────────────

function Balls() {
  const W = 320;
  const H = 200;
  const TONES = [null, ss.cool, ss.warm];
  type Ball = { x: number; y: number; vx: number; vy: number; r: number; tone: number };
  let balls: Ball[] = Array.from({ length: 7 }, (_, i) => ({ x: 30 + i * 42, y: 40 + (i % 3) * 30, vx: i % 2 ? 2 : -2, vy: 0, r: 10 + (i % 3) * 4, tone: i % 3 }));
  let gravity = true;
  let aim: { x: number; y: number; toX: number; toY: number } | null = null;

  function step(dt: number) {
    for (const b of balls) {
      if (gravity) b.vy += 0.3 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.85; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.85; b.vx *= 0.98; }
    }
    // Ball against ball: push the pair apart, then trade momentum along the line between the centers.
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const overlap = a.r + b.r - dist;
        if (overlap <= 0) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= (nx * overlap) / 2;
        a.y -= (ny * overlap) / 2;
        b.x += (nx * overlap) / 2;
        b.y += (ny * overlap) / 2;
        const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (v >= 0) continue;
        const ma = a.r * a.r;
        const mb = b.r * b.r;
        const impulse = (1.85 * v) / (ma + mb);
        a.vx += impulse * mb * nx;
        a.vy += impulse * mb * ny;
        b.vx -= impulse * ma * nx;
        b.vy -= impulse * ma * ny;
      }
    }
  }

  return div(
    ss.wrap,
    scope("ex-balls"),
    svgSvg(
      ss.svg,
      ss.drag,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bouncing balls",
        onMount: frames("ex-balls", step),
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const [x, y] = pointer(e, W, H);
          aim = { x, y, toX: x, toY: y };
        },
        onPointerMove: (e) => {
          if (!aim) return;
          [aim.toX, aim.toY] = pointer(e, W, H);
        },
        onPointerUp: () => {
          if (!aim) return;
          balls.push({ x: aim.x, y: aim.y, vx: (aim.x - aim.toX) / 8, vy: (aim.y - aim.toY) / 8, r: rand(8, 18), tone: balls.length % 3 });
          if (balls.length > 30) balls.shift();
          aim = null;
        },
      },
      rectSvg(is.board, { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 12 }),
      list(() => balls, (b) =>
        gSvg(
          TONES[b.tone],
          { transform: () => `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})` },
          circleSvg({ r: b.r, fill: "currentColor" }),
          circleSvg(is.shine, { cx: -b.r * 0.35, cy: -b.r * 0.35, r: b.r * 0.32 }),
        ),
      ),
      // Pull back to aim: the dashed line points where the ball will fly.
      when(
        () => aim !== null,
        lineSvg(is.aim, { "stroke-width": 2, "stroke-dasharray": "4 4", x1: () => aim?.x ?? 0, y1: () => aim?.y ?? 0, x2: () => (aim ? 2 * aim.x - aim.toX : 0), y2: () => (aim ? 2 * aim.y - aim.toY : 0) }),
        circleSvg(is.aim, { r: 12, "stroke-width": 2, cx: () => aim?.x ?? 0, cy: () => aim?.y ?? 0 }),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, { "aria-pressed": () => String(gravity) }, () => (gravity ? "Gravity on" : "Gravity off"), { onClick: () => { gravity = !gravity; } }),
      button(es.button, es.buttonPrimary, "Shake", { onClick: () => { for (const b of balls) { b.vx += rand(-6, 6); b.vy -= rand(4, 9); } } }),
      button(es.button, "Clear", { onClick: () => { balls = []; } }),
    ),
    div(ss.caption, () => `${balls.length} balls · pull back and let go to launch one`),
  );
}

const BALLS_CODE = `import 'nuclo'

type Ball = { x: number; y: number; vx: number; vy: number; r: number; color: string }

const W = 320
const H = 200
const COLORS = ['#ff3f00', '#2563eb', '#ff8a00']
let balls: Ball[] = Array.from({ length: 7 }, (_, i) => ({
  x: 30 + i * 42, y: 40, vx: i % 2 ? 2 : -2, vy: 0,
  r: 10 + (i % 3) * 4, color: COLORS[i % 3],
}))
let gravity = true
let aim: { x: number; y: number; toX: number; toY: number } | null = null

const at = (e: PointerEvent) => {
  const box = (e.currentTarget as Element).getBoundingClientRect()
  return [
    ((e.clientX - box.left) / box.width) * W,
    ((e.clientY - box.top) / box.height) * H,
  ]
}

function step() {
  for (const b of balls) {
    if (gravity) b.vy += 0.3
    b.x += b.vx
    b.y += b.vy
    // Walls: back inside, bounce, lose a little energy.
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85 }
    if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.85 }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.85 }
    if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.85 }
  }
  // Ball against ball: push the pair apart, then trade momentum
  // along the line between the centers. The mass is r².
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i]
      const b = balls[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy) || 1
      const overlap = a.r + b.r - dist
      if (overlap <= 0) continue
      const nx = dx / dist
      const ny = dy / dist
      a.x -= (nx * overlap) / 2; a.y -= (ny * overlap) / 2
      b.x += (nx * overlap) / 2; b.y += (ny * overlap) / 2
      const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
      if (v >= 0) continue
      const impulse = (1.85 * v) / (a.r ** 2 + b.r ** 2)
      a.vx += impulse * b.r ** 2 * nx; a.vy += impulse * b.r ** 2 * ny
      b.vx -= impulse * a.r ** 2 * nx; b.vy -= impulse * a.r ** 2 * ny
    }
  }
}

// The frame loop steps the physics and calls update('balls'),
// which refreshes only the scoped element, so the handlers just
// change state. when() shows the aiming line while pulling back.
export const Balls = () =>
  div(
    scope('balls'),
    svgSvg(
      {
        viewBox: '0 0 320 200', width: '320', height: '200',
        style: { touchAction: 'none', background: '#fafafa' },
        onMount: () => {
          let id = requestAnimationFrame(function frame() {
            step()
            update('balls')
            id = requestAnimationFrame(frame)
          })
          return () => cancelAnimationFrame(id)
        },
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const [x, y] = at(e)
          aim = { x, y, toX: x, toY: y }
        },
        onPointerMove: (e) => {
          if (aim) [aim.toX, aim.toY] = at(e)
        },
        onPointerUp: () => {
          if (!aim) return
          balls.push({
            x: aim.x, y: aim.y,
            vx: (aim.x - aim.toX) / 8, vy: (aim.y - aim.toY) / 8,
            r: 8 + Math.random() * 10, color: COLORS[balls.length % 3],
          })
          if (balls.length > 30) balls.shift()
          aim = null
        },
      },
      list(() => balls, (b) =>
        circleSvg({ r: b.r, fill: b.color, cx: () => b.x, cy: () => b.y }),
      ),
      when(() => aim !== null,
        lineSvg({
          stroke: '#999', 'stroke-dasharray': '4 4',
          x1: () => aim?.x ?? 0, y1: () => aim?.y ?? 0,
          x2: () => (aim ? 2 * aim.x - aim.toX : 0),
          y2: () => (aim ? 2 * aim.y - aim.toY : 0),
        }),
      ),
    ),
    button(() => (gravity ? 'Gravity on' : 'Gravity off'), {
      onClick: () => { gravity = !gravity },
    }),
    button('Clear', { onClick: () => { balls = [] } }),
  )`;

// ── Gooey blobs ──────────────────────────────────────────────────────────

function Goo() {
  const W = 320;
  const H = 200;
  const SIZES = [24, 21, 18, 16, 14, 12, 10, 9, 8];
  const trail = SIZES.map(() => ({ x: W / 2, y: H / 2 }));
  let target: number[] | null = null;
  let blur = 10;
  let goo = true;
  let t = 0;

  // Each blob eases toward the one before it; the first follows the pointer, or a figure eight without one.
  function step(dt: number) {
    t += 0.016 * dt;
    const [x, y] = target ?? [W / 2 + Math.sin(t * 1.3) * 110, H / 2 + Math.sin(t * 2.6) * 55];
    const ease = 1 - 0.7 ** dt;
    trail.forEach((p, i) => {
      const to = i ? trail[i - 1] : { x, y };
      p.x += (to.x - p.x) * ease;
      p.y += (to.y - p.y) * ease;
    });
  }

  const follow = (e: PointerEvent) => { target = pointer(e, W, H); };

  return div(
    ss.wrap,
    scope("ex-goo"),
    svgSvg(
      ss.svg,
      ss.drag,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Gooey blobs",
        onMount: frames("ex-goo", step),
        onPointerDown: follow,
        onPointerMove: follow,
        onPointerLeave: () => { target = null; },
      },
      defsSvg(
        filterSvg(
          { id: "ex-goo", filterUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H },
          feGaussianBlurSvg({ in: "SourceGraphic", stdDeviation: () => blur }),
          feColorMatrixSvg({ mode: "matrix", values: "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" }),
        ),
      ),
      rectSvg(is.board, { x: 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 12 }),
      gSvg(
        { filter: () => (goo ? "url(#ex-goo)" : "none") },
        circleSvg(ss.cool, { cx: 64, cy: () => (100 + Math.sin(t * 2) * 14).toFixed(1), r: 28, fill: "currentColor" }),
        circleSvg(ss.warm, { cx: 256, cy: () => (100 + Math.cos(t * 2) * 14).toFixed(1), r: 28, fill: "currentColor" }),
        ...trail.map((p, i) => circleSvg({ r: SIZES[i], fill: "currentColor", cx: () => p.x.toFixed(1), cy: () => p.y.toFixed(1) })),
      ),
    ),
    Slider("Blur", 0, 16, 1, () => blur, (v) => { blur = v; }),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, { "aria-pressed": () => String(goo) }, () => (goo ? "Goo on" : "Goo off"), { onClick: () => { goo = !goo; } }),
    ),
    div(ss.caption, "move the pointer over it"),
  );
}

const GOO_CODE = `import 'nuclo'

const W = 320
const H = 200
const SIZES = [24, 21, 18, 16, 14, 12, 10, 9, 8]
const trail = SIZES.map(() => ({ x: W / 2, y: H / 2 }))
let target: { x: number; y: number } | null = null
let blur = 10
let goo = true
let t = 0

// Each blob eases toward the one before it. The first follows
// the pointer, or a figure eight while there is none.
function step() {
  t += 0.016
  const lead = target ?? {
    x: W / 2 + Math.sin(t * 1.3) * 110,
    y: H / 2 + Math.sin(t * 2.6) * 55,
  }
  trail.forEach((p, i) => {
    const to = i ? trail[i - 1] : lead
    p.x += (to.x - p.x) * 0.3
    p.y += (to.y - p.y) * 0.3
  })
}

// The filter blurs the blobs, then a color matrix multiplies the
// alpha by 20 and subtracts 8. Soft edges snap back to hard ones,
// and blobs whose blurs overlap melt into one shape.
export const Goo = () =>
  div(
    scope('goo'),
    svgSvg(
      {
        viewBox: '0 0 320 200', width: '320', height: '200',
        style: { touchAction: 'none' },
        onMount: () => {
          let id = requestAnimationFrame(function frame() {
            step()
            update('goo')
            id = requestAnimationFrame(frame)
          })
          return () => cancelAnimationFrame(id)
        },
        onPointerMove: (e) => {
          const box = e.currentTarget.getBoundingClientRect()
          target = {
            x: ((e.clientX - box.left) / box.width) * W,
            y: ((e.clientY - box.top) / box.height) * H,
          }
        },
        onPointerLeave: () => { target = null },
      },
      defsSvg(
        filterSvg(
          {
            id: 'goo', filterUnits: 'userSpaceOnUse',
            x: 0, y: 0, width: W, height: H,
          },
          feGaussianBlurSvg({ in: 'SourceGraphic', stdDeviation: () => blur }),
          feColorMatrixSvg({
            mode: 'matrix',
            values: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8',
          }),
        ),
      ),
      gSvg(
        { fill: '#ff3f00', filter: () => (goo ? 'url(#goo)' : 'none') },
        circleSvg({ cx: 64, cy: () => 100 + Math.sin(t * 2) * 14, r: 28 }),
        circleSvg({ cx: 256, cy: () => 100 + Math.cos(t * 2) * 14, r: 28 }),
        ...trail.map((p, i) =>
          circleSvg({ r: SIZES[i], cx: () => p.x, cy: () => p.y }),
        ),
      ),
    ),
    input({
      type: 'range', min: '0', max: '16', value: '10',
      onInput: (e) => { blur = Number(e.currentTarget.value) },
    }),
    button(() => (goo ? 'Goo on' : 'Goo off'), {
      onClick: () => { goo = !goo },
    }),
  )`;

// ── Force graph ──────────────────────────────────────────────────────────

function ForceGraph() {
  const W = 320;
  const H = 220;
  const TONES = [null, ss.warm, ss.cool];
  type Node = { x: number; y: number; vx: number; vy: number; depth: number };
  let nodes: Node[] = [];
  let links: [Node, Node][] = [];
  let heat = 1; // scales every force and cools each frame; at zero the loop stops updating
  let held: Node | null = null;
  let press = [0, 0];
  let moved = false;

  function grow(parent?: Node) {
    const a = nodes.length * 2.4;
    const node = { x: (parent?.x ?? W / 2) + Math.cos(a) * 24, y: (parent?.y ?? H / 2) + Math.sin(a) * 24, vx: 0, vy: 0, depth: parent ? parent.depth + 1 : 0 };
    nodes.push(node);
    if (parent) links.push([parent, node]);
    heat = 1;
  }

  function reset() {
    nodes = [];
    links = [];
    grow();
    for (let i = 1; i < 10; i++) grow(nodes[Math.floor((i - 1) / 2)]);
  }
  reset();

  // Every pair repels, every link pulls toward 32px, everything drifts to the center.
  function step() {
    if (heat < 0.005) return false;
    for (const a of nodes) {
      for (const b of nodes) {
        if (a === b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = Math.max(dx * dx + dy * dy, 25);
        a.vx -= (dx / d2) * 14 * heat;
        a.vy -= (dy / d2) * 14 * heat;
      }
    }
    for (const [a, b] of links) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const f = ((dist - 32) / dist) * 0.1 * heat;
      a.vx += dx * f;
      a.vy += dy * f;
      b.vx -= dx * f;
      b.vy -= dy * f;
    }
    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * 0.015 * heat;
      n.vy += (H / 2 - n.y) * 0.015 * heat;
      if (n !== held) {
        n.x = clamp(n.x + n.vx, 10, W - 10);
        n.y = clamp(n.y + n.vy, 10, H - 10);
      }
      n.vx *= 0.6;
      n.vy *= 0.6;
    }
    heat = held ? Math.max(heat, 0.3) : heat * 0.985;
  }

  return div(
    ss.wrap,
    scope("ex-graph"),
    svgSvg(
      ss.svg,
      ss.drag,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Force-directed graph",
        onMount: frames("ex-graph", step),
        onPointerMove: (e) => {
          if (!held) return;
          if (Math.hypot(e.clientX - press[0], e.clientY - press[1]) > 4) moved = true;
          if (moved) [held.x, held.y] = pointer(e, W, H);
        },
        onPointerUp: () => {
          if (held && !moved && nodes.length < 40) grow(held); // a press that did not move is a click
          held = null;
        },
      },
      list(() => links, ([a, b]) =>
        lineSvg(is.link, { "stroke-width": 1.5, x1: () => a.x.toFixed(1), y1: () => a.y.toFixed(1), x2: () => b.x.toFixed(1), y2: () => b.y.toFixed(1) }),
      ),
      list(() => nodes, (n) =>
        circleSvg(is.node, TONES[n.depth % 3], {
          r: n.depth ? 7 : 10, fill: "currentColor", "stroke-width": 2,
          cx: () => n.x.toFixed(1), cy: () => n.y.toFixed(1),
          onPointerDown: (e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            held = n;
            press = [e.clientX, e.clientY];
            moved = false;
            heat = Math.max(heat, 0.3);
          },
        }),
      ),
    ),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, "Shake", { onClick: () => { for (const n of nodes) { n.x = rand(20, W - 20); n.y = rand(20, H - 20); } heat = 1; } }),
      button(es.button, "Reset", { onClick: reset }),
    ),
    div(ss.caption, () => `${nodes.length} nodes · click one to grow it, drag to move it`),
  );
}

const FORCE_GRAPH_CODE = `import 'nuclo'

type Node = { x: number; y: number; vx: number; vy: number; depth: number }

const W = 320
const H = 220
const COLORS = ['#ff3f00', '#ff8a00', '#2563eb']
let nodes: Node[] = []
let links: [Node, Node][] = []
let heat = 1 // scales the forces and cools each frame
let held: Node | null = null
let moved = false

function grow(parent?: Node) {
  const a = nodes.length * 2.4
  const node = {
    x: (parent?.x ?? W / 2) + Math.cos(a) * 24,
    y: (parent?.y ?? H / 2) + Math.sin(a) * 24,
    vx: 0, vy: 0, depth: parent ? parent.depth + 1 : 0,
  }
  nodes.push(node)
  if (parent) links.push([parent, node])
  heat = 1
}

grow()
for (let i = 1; i < 10; i++) grow(nodes[Math.floor((i - 1) / 2)])

// Every pair repels, every link pulls toward 32px, everything
// drifts to the center. Once the heat is gone the loop stops
// calling update(), so a settled graph costs nothing.
function step() {
  for (const a of nodes) {
    for (const b of nodes) {
      if (a === b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = Math.max(dx * dx + dy * dy, 25)
      a.vx -= (dx / d2) * 14 * heat
      a.vy -= (dy / d2) * 14 * heat
    }
  }
  for (const [a, b] of links) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy) || 1
    const f = ((dist - 32) / dist) * 0.1 * heat
    a.vx += dx * f; a.vy += dy * f
    b.vx -= dx * f; b.vy -= dy * f
  }
  for (const n of nodes) {
    n.vx += (W / 2 - n.x) * 0.015 * heat
    n.vy += (H / 2 - n.y) * 0.015 * heat
    if (n !== held) { n.x += n.vx; n.y += n.vy }
    n.vx *= 0.6
    n.vy *= 0.6
  }
  heat = held ? Math.max(heat, 0.3) : heat * 0.985
}

export const Graph = () =>
  div(
    scope('graph'),
    svgSvg(
      {
        viewBox: '0 0 320 220', width: '320', height: '220',
        style: { touchAction: 'none' },
        onMount: () => {
          let id = requestAnimationFrame(function frame() {
            if (heat > 0.005) { step(); update('graph') }
            id = requestAnimationFrame(frame)
          })
          return () => cancelAnimationFrame(id)
        },
        onPointerMove: (e) => {
          if (!held) return
          const box = e.currentTarget.getBoundingClientRect()
          held.x = ((e.clientX - box.left) / box.width) * W
          held.y = ((e.clientY - box.top) / box.height) * H
          moved = true
        },
        onPointerUp: () => {
          // A press that did not move is a click: grow a child.
          if (held && !moved && nodes.length < 40) grow(held)
          held = null
        },
      },
      list(() => links, ([a, b]) =>
        lineSvg({
          stroke: '#ccc', 'stroke-width': 1.5,
          x1: () => a.x, y1: () => a.y, x2: () => b.x, y2: () => b.y,
        }),
      ),
      list(() => nodes, (n) =>
        circleSvg({
          r: n.depth ? 7 : 10, fill: COLORS[n.depth % 3],
          stroke: '#fff', 'stroke-width': 2, style: { cursor: 'grab' },
          cx: () => n.x, cy: () => n.y,
          onPointerDown: (e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            held = n
            moved = false
            heat = Math.max(heat, 0.3)
          },
        }),
      ),
    ),
  )`;

// ── Brush and zoom ───────────────────────────────────────────────────────

function BrushZoom() {
  const W = 320;
  const N = 120;
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // seeded, so the server and the client agree
  const data: number[] = [];
  for (let i = 0, v = 50; i < N; i++) {
    v = clamp(v + (random() - 0.5) * 16, 5, 95);
    data.push(Math.round(v * 10) / 10);
  }
  let from = 30;
  let to = 70;
  let grab: { move: boolean; at: number } | null = null;

  const ox = (i: number) => (i / (N - 1)) * W;
  const overview = data.map((v, i) => `${i ? "L" : "M"}${ox(i).toFixed(1)},${(196 - v * 0.42).toFixed(1)}`).join(" ");
  const slice = () => data.slice(from, to + 1);
  // The brushed days across the full width, the y scale fitted to their own min and max.
  function focus() {
    const s = slice();
    const min = Math.min(...s);
    const max = Math.max(...s);
    return s.map((v, j) => `${j ? "L" : "M"}${((j / Math.max(1, to - from)) * W).toFixed(1)},${(112 - ((v - min) / Math.max(1, max - min)) * 100).toFixed(1)}`).join(" ");
  }
  const index = (e: PointerEvent) => Math.round(clamp(pointer(e, 1, 1)[0], 0, 1) * (N - 1));

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.drag,
      { viewBox: `0 0 ${W} 200`, role: "img", "aria-label": "Brush and zoom chart" },
      defsSvg(
        linearGradientSvg(
          { id: "ex-brush-fill", x1: "0", y1: "0", x2: "0", y2: "1" },
          stopSvg({ offset: "0", "stop-color": "currentColor", "stop-opacity": "0.3" }),
          stopSvg({ offset: "1", "stop-color": "currentColor", "stop-opacity": "0" }),
        ),
        clipPathSvg({ id: "ex-brush-clip" }, rectSvg({ y: 136, height: 64, x: () => ox(from).toFixed(1), width: () => (ox(to) - ox(from)).toFixed(1) })),
      ),
      ...[12, 62, 112].map((y) => lineSvg(ss.axis, { x1: 0, x2: W, y1: y + 0.5, y2: y + 0.5, "stroke-dasharray": "2 4" })),
      pathSvg({ d: () => `${focus()} L${W},120 L0,120 Z`, fill: "url(#ex-brush-fill)" }),
      pathSvg({ d: focus, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linejoin": "round" }),
      textSvg(ss.label, { x: 0, y: 132 }, () => `day ${from}`),
      textSvg(ss.label, { x: W, y: 132, "text-anchor": "end" }, () => `day ${to}`),
      pathSvg(ss.axis, { d: overview, fill: "none", "stroke-width": 1.5 }),
      pathSvg({ d: overview, fill: "none", stroke: "currentColor", "stroke-width": 1.5, "clip-path": "url(#ex-brush-clip)" }),
      rectSvg(is.brushBox, { y: 140, height: 58, rx: 4, x: () => ox(from).toFixed(1), width: () => (ox(to) - ox(from)).toFixed(1) }),
      rectSvg(is.hit, {
        x: 0, y: 136, width: W, height: 64,
        // Inside the brush, a drag moves it; outside, it draws a new one.
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const i = index(e);
          grab = i >= from && i <= to ? { move: true, at: i - from } : { move: false, at: i };
          if (!grab.move) from = to = i;
          update();
        },
        onPointerMove: (e) => {
          if (!grab) return;
          const i = index(e);
          if (grab.move) {
            const len = to - from;
            from = clamp(i - grab.at, 0, N - 1 - len);
            to = from + len;
          } else {
            from = Math.min(grab.at, i);
            to = Math.max(grab.at, i);
          }
          update();
        },
        onPointerUp: () => {
          grab = null;
          if (to - from < 4) { to = Math.min(N - 1, from + 4); from = to - 4; }
          update();
        },
      }),
    ),
    div(ss.caption, () => `${to - from + 1} days · avg ${(slice().reduce((a, b) => a + b, 0) / slice().length).toFixed(1)} · max ${Math.max(...slice())}`),
    div(
      es.buttonRow,
      button(es.button, "All", { onClick: () => { from = 0; to = N - 1; update(); } }),
      button(es.button, "Last 30", { onClick: () => { from = N - 30; to = N - 1; update(); } }),
    ),
  );
}

const BRUSH_CODE = `import 'nuclo'

const W = 320
const N = 120

// A random walk, seeded so it is the same on every load.
let seed = 7
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const data: number[] = []
for (let i = 0, v = 50; i < N; i++) {
  v = Math.max(5, Math.min(95, v + (random() - 0.5) * 16))
  data.push(v)
}

let from = 30
let to = 70
let grab: { move: boolean; at: number } | null = null

// The overview: every day in the strip at the bottom.
const ox = (i: number) => (i / (N - 1)) * W
const overview = data
  .map((v, i) => \`\${i ? 'L' : 'M'}\${ox(i)},\${196 - v * 0.42}\`)
  .join(' ')

// The focus: the brushed days across the full width, with the
// y scale fitted to their own min and max.
function focus() {
  const days = data.slice(from, to + 1)
  const min = Math.min(...days)
  const max = Math.max(...days)
  return days
    .map((v, j) => {
      const x = (j / (to - from)) * W
      const y = 112 - ((v - min) / (max - min)) * 100
      return \`\${j ? 'L' : 'M'}\${x},\${y}\`
    })
    .join(' ')
}

const index = (e: PointerEvent) => {
  const box = (e.currentTarget as Element).getBoundingClientRect()
  const f = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width))
  return Math.round(f * (N - 1))
}

// A clipPath whose rect follows the brush paints the brushed
// part of the overview in color. A transparent rect on top takes
// the pointer: inside the brush a drag moves it, outside it
// draws a new one.
export const BrushZoom = () =>
  svgSvg(
    { viewBox: '0 0 320 200', width: '320', height: '200' },
    defsSvg(
      clipPathSvg(
        { id: 'brush' },
        rectSvg({
          y: 136, height: 64,
          x: () => ox(from), width: () => ox(to) - ox(from),
        }),
      ),
    ),
    pathSvg({ d: focus, fill: 'none', stroke: '#ff3f00', 'stroke-width': 2 }),
    pathSvg({ d: overview, fill: 'none', stroke: '#ccc' }),
    pathSvg({
      d: overview, fill: 'none', stroke: '#ff3f00', 'clip-path': 'url(#brush)',
    }),
    rectSvg({
      y: 140, height: 58, fill: '#ff3f00', 'fill-opacity': 0.1,
      x: () => ox(from), width: () => ox(to) - ox(from),
    }),
    rectSvg({
      x: 0, y: 136, width: W, height: 64, fill: 'transparent',
      style: { cursor: 'crosshair', touchAction: 'none' },
      onPointerDown: (e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        const i = index(e)
        grab = i >= from && i <= to
          ? { move: true, at: i - from }
          : { move: false, at: i }
        if (!grab.move) from = to = i
        update()
      },
      onPointerMove: (e) => {
        if (!grab) return
        const i = index(e)
        if (grab.move) {
          const len = to - from
          from = Math.max(0, Math.min(N - 1 - len, i - grab.at))
          to = from + len
        } else {
          from = Math.min(grab.at, i)
          to = Math.max(grab.at, i)
        }
        update()
      },
      onPointerUp: () => {
        grab = null
        if (to - from < 4) { to = Math.min(N - 1, from + 4); from = to - 4 }
        update()
      },
    }),
  )`;

// ── Tic-tac-toe ──────────────────────────────────────────────────────────

function TicTacToe() {
  type Mark = "X" | "O" | null;
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const INK = { fill: "none", stroke: "currentColor", "stroke-width": 7, "stroke-linecap": "round", pathLength: "1", "stroke-dasharray": "1" } as const;
  let board: Mark[] = Array(9).fill(null);
  const score = { you: 0, cpu: 0, draw: 0 };

  const winner = () => LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
  const full = () => board.every(Boolean);
  const over = () => !!winner() || full();
  const center = (i: number) => [(i % 3) * 70 + 35, Math.floor(i / 3) * 70 + 35];

  // Win if possible, else block, else the center, else any free cell.
  function computer() {
    const free = board.flatMap((m, i) => (m ? [] : [i]));
    const wins = (who: Mark) => free.find((i) => LINES.some((l) => l.includes(i) && l.every((j) => j === i || board[j] === who)));
    return wins("O") ?? wins("X") ?? (board[4] ? free[Math.floor(Math.random() * free.length)] : 4);
  }

  function play(i: number) {
    if (board[i] || over()) return;
    board[i] = "X";
    if (!over()) board[computer()] = "O";
    const w = winner();
    if (w) score[board[w[0]] === "X" ? "you" : "cpu"]++;
    else if (full()) score.draw++;
    update();
  }

  function winLine() {
    const w = winner();
    if (!w) return "";
    const [x1, y1] = center(w[0]);
    const [x2, y2] = center(w[2]);
    const dx = Math.sign(x2 - x1) * 24;
    const dy = Math.sign(y2 - y1) * 24;
    return `M${x1 - dx},${y1 - dy} L${x2 + dx},${y2 + dy}`;
  }

  function status() {
    const w = winner();
    if (w) return board[w[0]] === "X" ? "You win!" : "The computer wins.";
    return full() ? "A draw." : "Your move. You are X.";
  }

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "-5 -5 220 220", role: "group", "aria-label": "Tic-tac-toe board" },
      pathSvg(is.grid, { d: "M70,4 V206 M140,4 V206 M4,70 H206 M4,140 H206", fill: "none", "stroke-width": 3, "stroke-linecap": "round", pathLength: "1", "stroke-dasharray": "1" }),
      ...Array.from({ length: 9 }, (_, i) => {
        const [cx, cy] = center(i);
        return gSvg(
          when(() => board[i] === "X", pathSvg(is.mark, { ...INK, d: `M${cx - 17},${cy - 17} L${cx + 17},${cy + 17} M${cx + 17},${cy - 17} L${cx - 17},${cy + 17}` }))
            .when(() => board[i] === "O", circleSvg(is.mark, is.late, ss.cool, { ...INK, cx, cy, r: 19 })),
          rectSvg(is.cell, {
            x: cx - 33, y: cy - 33, width: 66, height: 66, rx: 8, tabindex: "0", role: "button",
            "aria-label": () => `Row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}: ${board[i] ?? "empty"}`,
            onClick: () => play(i),
            onKeyDown: (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              play(i);
            },
          }),
        );
      }),
      when(() => !!winner(), pathSvg(is.mark, is.winLine, { ...INK, "stroke-width": 5, d: winLine })),
    ),
    div(is.status, { "aria-live": "polite" }, status),
    div(ss.caption, () => `you ${score.you} · draws ${score.draw} · computer ${score.cpu}`),
    div(es.buttonRow, button(es.button, es.buttonPrimary, "New game", { onClick: () => { board = Array(9).fill(null); update(); } })),
  );
}

const TIC_TAC_TOE_CODE = `import 'nuclo'

type Mark = 'X' | 'O' | null

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6],
  [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
]
let board: Mark[] = Array(9).fill(null)

const winner = () =>
  LINES.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])
const over = () => !!winner() || board.every(Boolean)

// Win if possible, else block, else the center, else any free cell.
function computer() {
  const free = board.flatMap((m, i) => (m ? [] : [i]))
  const wins = (who: Mark) =>
    free.find((i) =>
      LINES.some((l) => l.includes(i) && l.every((j) => j === i || board[j] === who)),
    )
  return wins('O') ?? wins('X') ??
    (board[4] ? free[Math.floor(Math.random() * free.length)] : 4)
}

function play(i: number) {
  if (board[i] || over()) return
  board[i] = 'X'
  if (!over()) board[computer()] = 'O'
  update()
}

// pathLength '1' makes every stroke 1 unit long, so a dash of 1
// is the whole stroke. Animating its offset from 1 to 0 draws it,
// and a mark that when() adds starts drawing as soon as it is in.
const draw = keyframes({
  from: { raw: { 'stroke-dashoffset': 1 } },
  to: { raw: { 'stroke-dashoffset': 0 } },
})
const drawn = css({ animation: \`\${draw} 0.35s ease-out both\` })
const drawnLate = css({ animation: \`\${draw} 0.35s 0.3s ease-out both\` })
const ink = {
  fill: 'none', 'stroke-width': 7, 'stroke-linecap': 'round',
  pathLength: '1', 'stroke-dasharray': '1',
} as const

export const TicTacToe = () =>
  div(
    svgSvg(
      { viewBox: '-5 -5 220 220', width: '220', height: '220' },
      pathSvg({
        d: 'M70,4 V206 M140,4 V206 M4,70 H206 M4,140 H206',
        stroke: '#ccc', 'stroke-width': 3, 'stroke-linecap': 'round',
      }),
      ...Array.from({ length: 9 }, (_, i) => {
        const x = (i % 3) * 70 + 35
        const y = Math.floor(i / 3) * 70 + 35
        return gSvg(
          when(() => board[i] === 'X',
            pathSvg(drawn, ink, {
              stroke: '#ff3f00',
              d: \`M\${x - 17},\${y - 17} L\${x + 17},\${y + 17} M\${x + 17},\${y - 17} L\${x - 17},\${y + 17}\`,
            }),
          ).when(() => board[i] === 'O',
            circleSvg(drawnLate, ink, { stroke: '#2563eb', cx: x, cy: y, r: 19 }),
          ),
          rectSvg({
            x: x - 35, y: y - 35, width: 70, height: 70,
            fill: 'transparent', style: { cursor: 'pointer' },
            onClick: () => play(i),
          }),
        )
      }),
    ),
    p(() => {
      const w = winner()
      if (w) return board[w[0]] === 'X' ? 'You win!' : 'The computer wins.'
      return over() ? 'A draw.' : 'Your move. You are X.'
    }),
    button('New game', {
      onClick: () => { board = Array(9).fill(null); update() },
    }),
  )`;

// ── Circular text ────────────────────────────────────────────────────────

function CircularText() {
  let text = "Nuclo • SVG • Builders";
  let radius = 66;
  let spinning = true;
  let guide = false;

  // A circle as a path: from the top, clockwise, so the letters stand on its outside.
  const ring = () => `M100,${100 - radius} a${radius},${radius} 0 1,1 0,${radius * 2} a${radius},${radius} 0 1,1 0,${-radius * 2}`;
  const length = () => 2 * Math.PI * radius;
  const words = () => {
    const unit = `${text.trim() || "Nuclo"} • `;
    return unit.repeat(Math.max(1, Math.floor(length() / (unit.length * 11))));
  };

  return div(
    ss.wrap,
    svgSvg(
      ss.svg,
      ss.small,
      { viewBox: "0 0 200 200", role: "img", "aria-label": () => `Badge: ${text}` },
      defsSvg(pathSvg({ id: "ex-ring", d: ring })),
      circleSvg(is.disc, { cx: 100, cy: 100, r: () => radius - 24 }),
      textSvg(is.monogram, { x: 100, y: 100, "text-anchor": "middle", "dominant-baseline": "central", "font-size": () => Math.round(radius * 0.8) }, () => (text.trim()[0] ?? "N").toUpperCase()),
      gSvg(
        is.spin,
        { style: () => ({ animationPlayState: spinning ? "running" : "paused" }) },
        pathSvg(is.guide, { d: ring, fill: "none", "stroke-dasharray": "3 4", opacity: () => (guide ? 1 : 0) }),
        textSvg(
          is.ringText,
          { "font-size": () => Math.min(20, length() / (words().length * 0.64)).toFixed(1) },
          textPathSvg({ href: "#ex-ring", textLength: () => (length() - 4).toFixed(1), lengthAdjust: "spacing" }, words),
        ),
      ),
    ),
    input(es.input, is.textInput, { value: text, maxLength: 40, "aria-label": "Badge text", onInput: (e) => { text = e.currentTarget.value; update(); } }),
    Slider("Radius", 48, 80, 1, () => radius, (v) => { radius = v; update(); }),
    div(
      es.buttonRow,
      button(es.button, es.buttonPrimary, () => (spinning ? "Pause" : "Spin"), { onClick: () => { spinning = !spinning; update(); } }),
      button(es.button, { "aria-pressed": () => String(guide) }, () => (guide ? "Hide path" : "Show path"), { onClick: () => { guide = !guide; update(); } }),
    ),
  );
}

const CIRCULAR_TEXT_CODE = `import 'nuclo'

let text = 'Nuclo • SVG • Builders'
let radius = 66
let spinning = true

// A circle as a path: from the top, clockwise, so the letters
// stand on its outside.
const ring = () =>
  \`M100,\${100 - radius} a\${radius},\${radius} 0 1,1 0,\${radius * 2} \` +
  \`a\${radius},\${radius} 0 1,1 0,\${-radius * 2}\`

// Repeat the text until it is long enough, size the font to it,
// and textLength spreads it over exactly one lap.
const length = () => 2 * Math.PI * radius
const words = () => {
  const unit = \`\${text.trim() || 'Nuclo'} • \`
  return unit.repeat(Math.max(1, Math.floor(length() / (unit.length * 11))))
}

const spin = keyframes({ to: { transform: 'rotate(360deg)' } })

export const CircularText = () =>
  div(
    svgSvg(
      { viewBox: '0 0 200 200', width: '200', height: '200' },
      defsSvg(pathSvg({ id: 'ring', d: ring })),
      circleSvg({ cx: 100, cy: 100, r: () => radius - 24, fill: '#ff3f00' }),
      textSvg(
        {
          x: 100, y: 100, fill: '#fff', 'font-weight': 800,
          'text-anchor': 'middle', 'dominant-baseline': 'central',
          'font-size': () => Math.round(radius * 0.8),
        },
        () => (text.trim()[0] ?? 'N').toUpperCase(),
      ),
      gSvg(
        {
          style: () => ({
            transformOrigin: '100px 100px',
            animation: \`\${spin} 18s linear infinite\`,
            animationPlayState: spinning ? 'running' : 'paused',
          }),
        },
        textSvg(
          {
            'font-weight': 700,
            'font-size': () => Math.min(20, length() / (words().length * 0.64)),
          },
          textPathSvg(
            { href: '#ring', textLength: () => length() - 4, lengthAdjust: 'spacing' },
            words,
          ),
        ),
      ),
    ),
    input({
      value: text, maxLength: 40,
      onInput: (e) => { text = e.currentTarget.value; update() },
    }),
    input({
      type: 'range', min: '48', max: '80', value: String(radius),
      onInput: (e) => { radius = Number(e.currentTarget.value); update() },
    }),
    button(() => (spinning ? 'Pause' : 'Spin'), {
      onClick: () => { spinning = !spinning; update() },
    }),
  )`;

export const SVG_INTERACTIVE_EXAMPLES: SvgExample[] = [
  { id: "drawing-pad", docs: "api-list", title: "Drawing Pad", desc: "Pointer events draw polylines. list() renders one per stroke, and the stroke in progress grows on every update().", code: DRAWING_PAD_CODE, preview: DrawingPad },
  { id: "rotary-knob", docs: "events", title: "Rotary Knob", desc: "A custom slider: the pointer's angle sets the value, the arrow keys step it, and pathLength=\"100\" turns the value into a dash.", code: KNOB_CODE, preview: Knob },
  { id: "color-wheel", docs: "events", title: "Color Wheel", desc: "Pick a hue by angle and a saturation by distance. Ninety wedges, a radial gradient and a dark disc make the wheel.", code: COLOR_WHEEL_CODE, preview: ColorWheel },
  { id: "spirograph", docs: "api-scope", title: "Spirograph", desc: "A wheel rolls inside a ring and a pen traces it. Each frame lengthens one dash and updates only its scope().", code: SPIROGRAPH_CODE, preview: Spirograph },
  { id: "bouncing-balls", docs: "api-scope", title: "Bouncing Balls", desc: "Gravity, walls and collisions in a requestAnimationFrame loop. Pull back and let go to launch a ball.", code: BALLS_CODE, preview: Balls },
  { id: "gooey-blobs", docs: "tag-builders", title: "Gooey Blobs", desc: "A blur and a color matrix filter melt blobs together. A trail of circles follows the pointer.", code: GOO_CODE, preview: Goo },
  { id: "force-graph", docs: "api-list", title: "Force Graph", desc: "Nodes repel, links pull, and the layout cools until it rests. Drag a node, or click one to grow a child.", code: FORCE_GRAPH_CODE, preview: ForceGraph },
  { id: "brush-zoom", docs: "events", title: "Brush & Zoom", desc: "Brush a range on the overview to zoom the chart above. A clipPath that follows the brush colors the selection.", code: BRUSH_CODE, preview: BrushZoom },
  { id: "tic-tac-toe", docs: "api-when", title: "Tic-Tac-Toe", desc: "Play the computer. when() adds each mark, and a CSS animation on its dash draws it in.", code: TIC_TAC_TOE_CODE, preview: TicTacToe },
  { id: "circular-text", docs: "api-keyframes", title: "Circular Text", desc: "Type a badge. textPath bends the text around a circle and textLength fits it to exactly one lap.", code: CIRCULAR_TEXT_CODE, preview: CircularText },
];
