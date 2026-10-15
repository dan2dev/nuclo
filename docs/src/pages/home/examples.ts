import { css, colors, cx } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { highlightCode, terminalCodeTokenStyle } from "../../components/CodeBlock.ts";
import { hs } from "./styles.ts";
import { icon, pathD, N as POINTS, STROKE } from "../../components/brand-geometry.ts";

// The hero's examples. Each one is a small app on Nuclo's own API: plain state, dynamic
// values, one update(). A build() returns the preview's nodes, the code for the code view, and
// what the example wants on its root (its scope, its lifecycle). hero-card.ts frames them.

type Child = NodeModLike<any>; // anything div() accepts: nodes, modifiers, attributes
export type HeroExample = {
  api: string; // the feature on show, as written in code
  title: string;
  note: string; // what to look for, shown beside the code
  build: () => { preview: Child[]; code: Child; root?: Child[] };
};

const MONO = "ui-monospace, monospace";
export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const reduced = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;
const focus = { outline: `2px solid ${colors.primary}`, outlineOffset: "3px" } as const;
const noSelect = (touchAction: string) => ({ "touch-action": touchAction, "-webkit-user-select": "none" });

// Shared by every example: the preview pane, its canvases, its bar, its buttons
export const ex = {
  // A fixed height, so the card never jumps between examples; the code view sets its own
  pane: css("pages-home-examples-pane", { position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "12px", height: "340px", padding: "16px", backgroundColor: colors.bgCard, raw: { "background-image": "radial-gradient(var(--c-border) 1px, transparent 1.4px)", "background-size": "20px 20px", "background-position": "center" }, medium: { height: "380px", padding: "20px 22px 16px" } }),
  stage: css("pages-home-examples-stage", { flex: "1 1 auto", minHeight: "0", display: "flex", alignItems: "center", justifyContent: "center" }),
  canvas: css("pages-home-examples-canvas", { display: "block", width: "100%", height: "100%", userSelect: "none", raw: noSelect("pan-y") }),
  // Edge to edge behind the bar. Drawing past the viewBox still shows, so the art fills any pane
  bleed: css("pages-home-examples-bleed", { position: "absolute", inset: "0", display: "block", width: "100%", height: "100%", userSelect: "none", raw: noSelect("pan-y") }),
  bar: css("pages-home-examples-bar", { position: "relative", display: "flex", alignItems: "center", gap: "8px 10px", flexWrap: "wrap", marginTop: "auto" }),
  // A bar over a bleed canvas lets the pointer through, except on its controls
  barFloat: css("pages-home-examples-barFloat", { pointerEvents: "none", "& button, & input": { pointerEvents: "auto" } }),
  status: css("pages-home-examples-status", { marginLeft: "auto", fontFamily: MONO, fontSize: "0.75rem", color: colors.textMuted, fontVariantNumeric: "tabular-nums", "& b": { fontWeight: "600", color: colors.text } }),
  btn: css("pages-home-examples-btn", { display: "inline-flex", alignItems: "center", gap: "8px", height: "38px", padding: "0 14px", borderRadius: "10px", fontFamily: MONO, fontSize: "0.8125rem", fontWeight: "600", color: "#fff", backgroundColor: colors.primaryDark, transition: `transform 0.2s ${EASE}, filter 0.2s ${EASE}`, hover: { filter: "brightness(0.94)" }, active: { transform: "scale(0.96)" }, focusVisible: focus }),
  btnLive: css("pages-home-examples-btnLive", { animation: `${animations.ringPulse} 1.3s ${EASE} infinite`, ...reduced }),
  ghost: css("pages-home-examples-ghost", { height: "38px", padding: "0 12px", borderRadius: "10px", fontFamily: MONO, fontSize: "0.8125rem", fontWeight: "500", color: colors.textDim, border: `1px solid ${colors.borderLight}`, backgroundColor: "rgba(18,18,18,0.6)", transition: `color 0.2s ${EASE}, background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, hover: { color: colors.text, backgroundColor: colors.bgSecondary }, active: { transform: "scale(0.96)" }, focusVisible: focus }),
  rise: css("pages-home-examples-rise", { animation: `${animations.riseIn} 0.5s ${EASE} both`, ...reduced }),
  pop: css("pages-home-examples-pop", { animation: `${animations.popIn} 0.45s ${EASE} both`, ...reduced }),
  code: css("pages-home-examples-code", { padding: "18px 22px", minHeight: "0", overflow: "auto" }),
  codePre: css("pages-home-examples-codePre", { margin: "0", whiteSpace: "pre", minWidth: "max-content" }),
};

/** A static, highlighted code pane. */
export function StaticCode(code: string) {
  return div(hs.demoCodePane, ex.code, terminalCodeTokenStyle, { "data-demo-pane": "code", innerHTML: `<pre class="${ex.codePre.className}">${highlightCode(code)}</pre>` });
}

export const motion = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-anim");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pick = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

/** The pointer in an SVG's own units, whatever its size and aspect. */
export function svgPoint(e: PointerEvent): [number, number] {
  const svg = e.currentTarget as SVGSVGElement;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
  return [p.x, p.y];
}

/**
 * A frame loop for onMount: tick(dt) runs while el is on screen, dt in 60fps frames (0.5 on a
 * 120Hz screen). Returns the cleanup that stops it.
 */
export function frames(el: Element, tick: (dt: number) => void) {
  let raf = 0, last = 0;
  const loop = (t: number) => { tick(last ? Math.min(2, (t - last) / 16.67) : 1); last = t; raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf); raf = 0; last = 0;
    if (e.isIntersecting) raf = requestAnimationFrame(loop);
  });
  io.observe(el);
  return () => { io.disconnect(); cancelAnimationFrame(raf); };
}

// ── Fireworks: list() adds a node per spark and drops it when the spark leaves the array ─
const PALETTES = [["#ff4a17", "#ffb545"], ["#ffd166", "#fff8f2"], ["#ff5d8f", "#ff9a00"], ["#79c7ff", "#fff8f2"], ["#ff6a3d", "#f0a7ff"]];

export const Fireworks: HeroExample = {
  api: "list()",
  title: "Tap the sky",
  note: "Every spark is a plain object in an array. list() gives each one a <line>, and drops it the frame its object leaves the array. One update() a frame; nothing is diffed.",
  build() {
    const S = "hero-fireworks", W = 480, H = 300, G = 0.12;
    type Rocket = { x: number; y: number; vy: number; pal: string[] };
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; w: number };
    let rockets: Rocket[] = [];
    let sparks: Spark[] = [];
    let created = 0, removed = 0, flash = 0, wait = 24, finale = 0;

    // Rise to `top` and stall there: v² = 2·g·distance
    function launch(x = 110 + Math.random() * (W - 220), top = 40 + Math.random() * 90) {
      rockets.push({ x, y: H + 12, vy: -Math.sqrt(2 * G * (H + 12 - top)), pal: pick(PALETTES) });
      created++;
    }
    function burst(r: Rocket) {
      const n = 64, ring = Math.random() < 0.4, speed = 2.6 + Math.random() * 1.8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.12;
        const v = ring ? speed : speed * (0.2 + Math.random() * 0.8);
        const max = 50 + Math.random() * 36;
        sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color: r.pal[i % 2], w: 2 + Math.random() * 2 });
      }
      created += n;
      flash = 1;
    }
    function tick(dt: number) {
      if (motion() && (wait -= dt) <= 0) { launch(); wait = 60 + Math.random() * 50; }
      if (finale > 0 && Math.random() < 0.12 * dt) { launch(); finale--; }
      if (!rockets.length && !sparks.length && flash < 0.005) return;
      const drag = 0.97 ** dt;
      for (const r of rockets) { r.vy += G * dt; r.y += r.vy * dt; if (r.vy > -0.4) burst(r); }
      for (const s of sparks) { s.vx *= drag; s.vy = s.vy * drag + 0.045 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
      const before = rockets.length + sparks.length;
      rockets = rockets.filter((r) => r.vy <= -0.4);
      sparks = sparks.filter((s) => s.life > 0);
      removed += before - rockets.length - sparks.length;
      flash *= 0.9 ** dt;
      update(S);
    }

    const sky = svgSvg(
      ex.bleed,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Fireworks: tap to launch a rocket", "data-grab": "",
        onPointerDown: (e: PointerEvent) => { const [x, y] = svgPoint(e); launch(x, clamp(y, 24, H - 70)); },
      },
      defsSvg(radialGradientSvg({ id: "hero-fw-glow", cx: "50%", cy: "100%", r: "70%" }, stopSvg({ offset: "0", "stop-color": "#ff6a3d", "stop-opacity": "0.6" }), stopSvg({ offset: "1", "stop-color": "#ff6a3d", "stop-opacity": "0" }))),
      rectSvg({ x: -W, y: -H, width: W * 3, height: H * 2.2, fill: "url(#hero-fw-glow)", opacity: () => flash }),
      list(() => rockets, (r) => gSvg(
        lineSvg({ x1: () => r.x, y1: () => r.y, x2: () => r.x, y2: () => r.y - r.vy * 6, stroke: r.pal[0], "stroke-width": 2, "stroke-linecap": "round", opacity: 0.55 }),
        circleSvg({ cx: () => r.x, cy: () => r.y, r: 2.4, fill: "#fff8f2" }),
      )),
      list(() => sparks, (s) => lineSvg({
        x1: () => s.x, y1: () => s.y, x2: () => s.x - s.vx * 5, y2: () => s.y - s.vy * 5,
        stroke: s.color, "stroke-width": s.w, "stroke-linecap": "round", opacity: () => Math.min(1, (s.life / s.max) * 1.6),
      })),
    );

    return {
      preview: [
        sky,
        div(
          ex.bar, ex.barFloat,
          button(ex.btn, { type: "button", onClick: () => { finale += 6; } }, "finale"),
          div(ex.status, b(() => String(rockets.length + sparks.length)), " nodes · ", b(() => String(created)), " added · ", b(() => String(removed)), " removed"),
        ),
      ],
      code: StaticCode(`let sparks = []                          // plain objects

const Sky = () => svgSvg(
  list(() => sparks, s => lineSvg({      // one <line> per spark
    x1: () => s.x, y1: () => s.y,
    x2: () => s.x - s.vx * 3, y2: () => s.y - s.vy * 3,
    opacity: () => s.life / s.max,
  })),
)

function frame() {
  for (const s of sparks) {
    s.vy += 0.045; s.x += s.vx; s.y += s.vy; s.life--
  }
  sparks = sparks.filter(s => s.life > 0) // out of the array, out of the DOM
  update('sky')
  requestAnimationFrame(frame)
}`),
      root: [scope(S), { onMount: (el: Element) => frames(el, tick) }],
    };
  },
};

// ── Sort: list() keys a node to each object; reordering moves nodes, it never rebuilds them ─
const so = {
  bars: css("pages-home-examples-sortBars", { display: "flex", alignItems: "flex-end", gap: "4px", width: "100%", height: "100%", paddingTop: "8px", medium: { gap: "6px" } }),
  bar: css("pages-home-examples-sortBar", { position: "relative", flex: "1 1 0", minWidth: "0", borderRadius: "7px 7px 3px 3px", transformOrigin: "bottom", transition: `box-shadow 0.18s ${EASE}, filter 0.18s ${EASE}`, animation: `${animations.growUp} 0.7s ${EASE} both`, ...reduced }),
  barHot: css("pages-home-examples-sortBarHot", { filter: "brightness(1.25)", boxShadow: "0 0 0 2px #fff8f2, 0 0 22px rgba(255, 248, 242, 0.4)" }),
};

export const Sort: HeroExample = {
  api: "list()",
  title: "Sorted, never rebuilt",
  note: "Bubble sort swaps objects in a plain array. list() keys each bar to its object, so update() moves the existing nodes into the new order. Watch the counter: no bar is ever recreated.",
  build() {
    const S = "hero-sort", N = 18;
    type Bar = { v: number; color: string };
    const mix = <T>(xs: T[]) => { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return xs; };
    let bars: Bar[] = mix(Array.from({ length: N }, (_, i) => ({ v: i + 1, color: `hsl(${6 + (40 * i) / (N - 1)} 96% ${50 + (14 * i) / (N - 1)}%)` })));
    let hot: Bar[] = [];
    let swaps = 0, created = 0, touched = false, timer = 0, later = 0;
    let steps: Generator<Bar[]> | null = null;
    const nodes = new Map<Bar, HTMLElement>();

    function* bubble(): Generator<Bar[]> {
      for (let end = bars.length - 1; end > 0; end--) {
        let swapped = false;
        for (let i = 0; i < end; i++) {
          if (bars[i].v > bars[i + 1].v) { [bars[i], bars[i + 1]] = [bars[i + 1], bars[i]]; swaps++; swapped = true; }
          yield [bars[i], bars[i + 1]];
        }
        if (!swapped) return;
      }
    }

    // FLIP: measure, mutate, update(), then slide each node from where it was
    function act(fn: () => void, ms: number) {
      const was = new Map([...nodes].map(([bar, el]) => [bar, el.getBoundingClientRect().left]));
      fn();
      update(S);
      for (const [bar, el] of nodes) {
        const dx = (was.get(bar) ?? 0) - el.getBoundingClientRect().left;
        if (dx) el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: ms, easing: EASE });
      }
    }
    const after = (ms: number, fn: () => void) => { clearTimeout(later); later = window.setTimeout(fn, ms); };
    function pause() { clearInterval(timer); timer = 0; }
    function play() {
      pause();
      steps ??= bubble();
      timer = window.setInterval(() => act(() => {
        const r = steps!.next();
        hot = r.done ? [] : r.value;
        if (!r.done) return;
        pause(); steps = null;
        // On its own, it loops: a beat, a shuffle, another sort
        if (!touched && motion()) after(1500, () => { act(() => mix(bars), 560); after(900, play); });
      }, 260), 80);
    }
    const user = (fn: () => void) => () => { touched = true; clearTimeout(later); fn(); update(S); };

    const chart = div(
      so.bars,
      { role: "list", "aria-label": "Bars to sort" },
      list(() => bars, (bar) =>
        div(so.bar, {
          role: "listitem", "aria-label": String(bar.v),
          style: { height: `${(bar.v / N) * 100}%`, backgroundColor: bar.color },
          class: () => cx(so.bar, hot.includes(bar) ? so.barHot : null).className,
          onMount: (el: HTMLElement) => { nodes.set(bar, el); created++; return () => nodes.delete(bar); },
        }),
      ),
    );

    return {
      preview: [
        div(ex.stage, chart),
        div(
          ex.bar,
          button(ex.btn, { type: "button", onClick: user(() => (timer ? pause() : play())) }, () => (timer ? "pause" : "sort")),
          button(ex.ghost, { type: "button", onClick: user(() => { pause(); steps = null; hot = []; act(() => mix(bars), 560); }) }, "shuffle"),
          button(ex.ghost, { type: "button", onClick: user(() => { pause(); steps = null; hot = []; act(() => bars.reverse(), 560); }) }, "reverse"),
          div(ex.status, b(() => String(swaps)), " swaps · ", b(() => String(created)), " nodes ever created"),
        ),
      ],
      code: StaticCode(`let bars = shuffle([...Array(18)].map((_, i) => ({ v: i + 1 })))

const Chart = () => div(
  list(() => bars, bar =>                 // a node per object
    div({ style: { height: \`\${bar.v * 5}%\` } })),
)

function* bubble() {
  for (let end = bars.length - 1; end > 0; end--)
    for (let i = 0; i < end; i++) {
      if (bars[i].v > bars[i + 1].v)
        [bars[i], bars[i + 1]] = [bars[i + 1], bars[i]]  // swap objects
      yield
    }
}

const steps = bubble()
setInterval(() => {
  steps.next()
  update()                                // nodes move. none is rebuilt
}, 80)`),
      root: [
        scope(S),
        {
          onMount: () => {
            if (!touched && motion() && !timer) after(700, play);
            return () => { pause(); clearTimeout(later); hot = []; created = 0; }; // the next mount counts afresh
          },
        },
      ],
    };
  },
};

// ── Waves: a path's d is a function; sliders and the frame loop move the numbers it reads ──
const wv = {
  slider: css("pages-home-examples-slider", { display: "inline-flex", alignItems: "center", gap: "8px", height: "38px", padding: "0 10px 0 12px", borderRadius: "10px", fontFamily: MONO, fontSize: "0.75rem", color: colors.textDim, backgroundColor: "rgba(18,18,18,0.6)", border: `1px solid ${colors.border}`, raw: { "backdrop-filter": "blur(6px)", "-webkit-backdrop-filter": "blur(6px)" } }),
  range: css("pages-home-examples-range", { width: "76px", raw: { "accent-color": "var(--c-primary)" }, medium: { width: "104px" }, focusVisible: focus }),
  bead: css("pages-home-examples-bead", { raw: { fill: "#fff8f2" } }),
};

export const Waves: HeroExample = {
  api: "() => values",
  title: "Bend the wave",
  note: "Each path's d is a plain function of three numbers. The sliders and the frame loop only change the numbers; update('waves') re-runs the functions that read them.",
  build() {
    const S = "hero-waves", W = 480, H = 300, MID = H / 2 - 8;
    let amp = 54, freq = 2.2, phase = 0;
    const layers = [
      { k: 0.7, a: 0.8, off: 3.1, stroke: "url(#hero-wave-c)", w: 1.5 },
      { k: 1.6, a: 0.55, off: 1.7, stroke: "url(#hero-wave-b)", w: 2 },
      { k: 1, a: 1, off: 0, stroke: "url(#hero-wave-a)", w: 3.5 },
    ];
    const main = layers[2];
    const y = (x: number, l: typeof main) => MID + amp * l.a * Math.sin((x / W) * Math.PI * 2 * freq * l.k + phase * (0.7 + l.k * 0.5) + l.off);
    function d(l: typeof main) {
      let path = "";
      for (let x = -200; x <= W + 200; x += 8) path += `${path ? "L" : "M"}${x} ${y(x, l).toFixed(1)}`;
      return path;
    }
    const beadX = (i: number) => ((i / 7) * (W + 120) + phase * 24) % (W + 120) - 60;
    const slider = (name: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void) =>
      label(wv.slider, name, input(wv.range, { type: "range", min: String(min), max: String(max), step: String(step), value: String(get()), onInput: (e: Event) => { set(+(e.target as HTMLInputElement).value); update(S); } }));

    const grad = (id: string, a: string, z: string) => linearGradientSvg({ id }, stopSvg({ offset: "0", "stop-color": a }), stopSvg({ offset: "1", "stop-color": z }));
    const canvas = svgSvg(
      ex.bleed,
      { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Three sine waves; the sliders bend them" },
      defsSvg(
        grad("hero-wave-a", "#ea3f25", "#ffb545"),
        grad("hero-wave-b", "#79c7ff", "#f0a7ff"),
        grad("hero-wave-c", "rgba(255,248,242,0.15)", "rgba(255,248,242,0.6)"),
        linearGradientSvg({ id: "hero-wave-fill", x1: "0", y1: "0", x2: "0", y2: "1" }, stopSvg({ offset: "0", "stop-color": "#ff4a17", "stop-opacity": "0.35" }), stopSvg({ offset: "1", "stop-color": "#ff4a17", "stop-opacity": "0" })),
      ),
      pathSvg({ d: () => `${d(main)}L${W + 200} ${H * 2}L-200 ${H * 2}Z`, fill: "url(#hero-wave-fill)" }),
      ...layers.map((l) => pathSvg({ d: () => d(l), fill: "none", stroke: l.stroke, "stroke-width": l.w, "stroke-linecap": "round" })),
      ...Array.from({ length: 7 }, (_, i) => circleSvg(wv.bead, { cx: () => beadX(i), cy: () => y(beadX(i), main), r: 3.5 })),
    );

    return {
      preview: [
        canvas,
        div(
          ex.bar, ex.barFloat,
          slider("amp", 0, 100, 1, () => amp, (v) => { amp = v; }),
          slider("freq", 0.5, 5, 0.1, () => freq, (v) => { freq = v; }),
          div(ex.status, "d = f(", b(() => String(amp)), ", ", b(() => freq.toFixed(1)), ", ", b(() => (phase % 10).toFixed(1)), ")"),
        ),
      ],
      code: StaticCode(`let amp = 54, freq = 2.2, phase = 0

const wave = () => {                  // a plain function of three numbers
  let d = 'M0 150'
  for (let x = 0; x <= 480; x += 8)
    d += \` L\${x} \${150 + amp * Math.sin(x / 76 * freq + phase)}\`
  return d
}

div(
  svgSvg(pathSvg({ d: wave })),       // d is a function: update() re-runs it
  input({ type: 'range', value: amp,
    onInput: e => { amp = +e.target.value; update('waves') } }),
)

function frame() {
  phase += 0.05; update('waves'); requestAnimationFrame(frame)
}`),
      root: [scope(S), { onMount: (el: Element) => frames(el, (dt) => { if (!motion()) return; phase += 0.045 * dt; update(S); }) }],
    };
  },
};

// ── Chase: 32 points chase the pointer; update('chase') touches only this card ───────────
const ch = {
  ring: css("pages-home-examples-chaseRing", { animation: `${animations.spin} 6s linear infinite`, raw: { fill: "none", stroke: "rgba(255,248,242,0.4)", "stroke-width": "1.5", "stroke-dasharray": "3 5", "transform-box": "fill-box", "transform-origin": "center" }, ...reduced }),
};

export const Chase: HeroExample = {
  api: "scope()",
  title: "Lead the rope",
  note: "The card is a scope(). Every frame moves 32 plain points and calls update('chase'): Nuclo recomputes the attributes in this card and leaves the rest of the page alone.",
  build() {
    const S = "hero-chase", W = 480, H = 300, N = 32, GAP = 7;
    const pts = Array.from({ length: N }, (_, i) => ({ x: W / 2 - i * GAP, y: H / 2 }));
    const target = { x: W / 2, y: H / 2 };
    let led = false, t = 0, ticks = 0;

    function tick(dt: number) {
      t += dt;
      if (!led && motion()) { target.x = W / 2 + Math.sin(t * 0.021) * W * 0.36; target.y = H / 2 - 10 + Math.sin(t * 0.034 + 1) * H * 0.3; }
      const head = pts[0], k = 1 - 0.82 ** dt;
      head.x += (target.x - head.x) * k;
      head.y += (target.y - head.y) * k;
      // Each point keeps GAP from the one before it: a rope
      for (let i = 1; i < N; i++) {
        const p = pts[i], q = pts[i - 1];
        const dx = p.x - q.x, dy = p.y - q.y, len = Math.hypot(dx, dy) || 1;
        p.x = q.x + (dx / len) * GAP;
        p.y = q.y + (dy / len) * GAP;
      }
      ticks++;
      update(S);
    }
    const aim = (e: PointerEvent) => { [target.x, target.y] = svgPoint(e); led = true; };

    const canvas = svgSvg(
      ex.bleed,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "A glowing rope that follows the pointer", "data-grab": "",
        onPointerMove: aim, onPointerDown: aim, onPointerLeave: () => { led = false; },
      },
      defsSvg(radialGradientSvg({ id: "hero-chase-glow" }, stopSvg({ offset: "0", "stop-color": "#ffb545", "stop-opacity": "0.55" }), stopSvg({ offset: "1", "stop-color": "#ffb545", "stop-opacity": "0" }))),
      circleSvg(ch.ring, { cx: () => target.x, cy: () => target.y, r: 14, opacity: () => (led ? 1 : 0.45) }),
      circleSvg({ cx: () => pts[0].x, cy: () => pts[0].y, r: 54, fill: "url(#hero-chase-glow)" }),
      // Tail first, so the head draws on top
      ...pts.map((p, i) => {
        const f = i / (N - 1);
        return circleSvg({ cx: () => p.x, cy: () => p.y, r: 2 + 12 * (1 - f) ** 1.3, fill: `hsl(${46 - 42 * f} 100% ${66 - 24 * f}% / ${1 - 0.8 * f})` });
      }).reverse(),
    );

    return {
      preview: [
        canvas,
        div(ex.bar, ex.barFloat, div(ex.status, b(String(N)), " nodes · ", b(() => String(ticks)), " × update('chase')")),
      ],
      code: StaticCode(`const points = [...Array(32)].map(() => ({ x: 240, y: 150 }))
let target = { x: 240, y: 150 }

const Rope = () => svgSvg(
  { onPointerMove: e => { target = toSvg(e) } },
  ...points.map((p, i) => circleSvg({
    cx: () => p.x, cy: () => p.y, r: 14 - i * 0.4,
  })),
)

function frame() {
  ease(points[0], target)               // the head eases to the pointer
  points.slice(1).forEach((p, i) => keepDistance(p, points[i], 7))
  update('chase')                       // patches this scope only
  requestAnimationFrame(frame)
}

div(scope('chase'), Rope())`),
      root: [scope(S), { onMount: (el: Element) => frames(el, tick) }],
    };
  },
};

// ── Reflex: when() shows one branch at a time; the stage's colour follows the state ──────
type ReflexState = "idle" | "wait" | "go" | "early" | "result";
const rx = {
  stage: css("pages-home-examples-rxStage", { flex: "1 1 auto", minHeight: "0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", borderRadius: "14px", color: "#fff8f2", textAlign: "center", cursor: "pointer", userSelect: "none", transition: `background-color 0.2s ${EASE}, transform 0.2s ${EASE}`, raw: { "touch-action": "manipulation", "-webkit-tap-highlight-color": "transparent" }, active: { transform: "scale(0.985)" }, focusVisible: focus }),
  idle: css("pages-home-examples-rxIdle", { backgroundColor: colors.bgLight }),
  wait: css("pages-home-examples-rxWait", { backgroundColor: "#6b1405" }),
  go: css("pages-home-examples-rxGo", { backgroundColor: "#16a34a" }),
  early: css("pages-home-examples-rxEarly", { backgroundColor: "#9a3412" }),
  result: css("pages-home-examples-rxResult", { backgroundColor: colors.bgSecondary }),
  col: css("pages-home-examples-rxCol", { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }),
  big: css("pages-home-examples-rxBig", { display: "block", fontSize: "2.4rem", fontWeight: "800", letterSpacing: "-0.03em", lineHeight: "1", fontVariantNumeric: "tabular-nums", medium: { fontSize: "3.2rem" } }),
  prompt: css("pages-home-examples-rxPrompt", { fontSize: "1.5rem", letterSpacing: "-0.02em", medium: { fontSize: "1.75rem" } }),
  sub: css("pages-home-examples-rxSub", { display: "block", fontSize: "0.875rem", opacity: "0.78" }),
  rating: css("pages-home-examples-rxRating", { display: "block", fontFamily: MONO, fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: colors.primaryInk }),
  target: css("pages-home-examples-rxTarget", { display: "block", width: "18px", height: "18px", marginBottom: "6px", borderRadius: "50%", backgroundColor: colors.primary, animation: `${animations.ringPulse} 1.3s ${EASE} infinite`, ...reduced }),
  dots: css("pages-home-examples-rxDots", { display: "flex", gap: "6px", marginTop: "4px", "& i": { display: "block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "currentColor", animation: `${animations.pulse} 1s ease-in-out infinite`, ...reduced }, "& i:nth-child(2)": { raw: { "animation-delay": "0.15s" } }, "& i:nth-child(3)": { raw: { "animation-delay": "0.3s" } } }),
  chart: css("pages-home-examples-rxChart", { display: "flex", alignItems: "flex-end", gap: "3px", height: "28px" }),
  tick: css("pages-home-examples-rxTick", { width: "6px", borderRadius: "2px", backgroundColor: colors.borderLight, transformOrigin: "bottom", animation: `${animations.growUp} 0.4s ${EASE} both`, ...reduced }),
  tickBest: css("pages-home-examples-rxTickBest", { backgroundColor: colors.primary }),
};

export const Reflex: HeroExample = {
  api: "when()",
  title: "Tap on green",
  note: "One plain string decides what the stage shows. Each when() branch is built when its condition comes true and removed when it goes; the stage's class is a function of the same string.",
  build() {
    const S = "hero-reflex";
    let state: ReflexState = "idle";
    let ms = 0, best = 0, t0 = 0, timer = 0;
    let tries: { ms: number }[] = [];

    function press() {
      if (state === "wait") { clearTimeout(timer); state = "early"; }
      else if (state === "go") {
        ms = Math.round(performance.now() - t0);
        best = best ? Math.min(best, ms) : ms;
        tries = [...tries.slice(-9), { ms }];
        state = "result";
      } else {
        state = "wait";
        timer = window.setTimeout(() => {
          state = "go";
          update(S);
          requestAnimationFrame(() => { t0 = performance.now(); }); // from the frame green is painted
        }, 1200 + Math.random() * 2200);
      }
      update(S);
    }
    const rating = () => (ms < 200 ? "lightning" : ms < 260 ? "sharp" : ms < 340 ? "solid" : "sleepy");

    const stage = button(
      rx.stage,
      {
        type: "button",
        class: () => cx(rx.stage, rx[state]).className,
        onPointerDown: (e: PointerEvent) => { if (e.button === 0) press(); },
        onKeyDown: (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) press(); } },
      },
      when(() => state === "wait", span(rx.col, ex.rise, span(rx.big, "Wait…"), span(rx.sub, "for green"), span(rx.dots, i(), i(), i())))
        .when(() => state === "go", span(rx.col, ex.pop, span(rx.big, "TAP!")))
        .when(() => state === "early", span(rx.col, ex.rise, span(rx.big, "Too soon"), span(rx.sub, "tap to try again")))
        .when(() => state === "result", span(rx.col, ex.pop, span(rx.rating, rating), span(rx.big, () => `${ms} ms`), span(rx.sub, "tap to go again")))
        .else(span(rx.col, ex.rise, span(rx.target), span(rx.big, rx.prompt, "Tap when it turns green"), span(rx.sub, "tap here to start"))),
    );

    return {
      preview: [
        stage,
        div(
          ex.bar,
          div(rx.chart, { "aria-hidden": "true" }, list(() => tries, (t) => div(rx.tick, { style: { height: `${clamp((600 - t.ms) / 450, 0.15, 1) * 100}%` }, class: () => cx(rx.tick, t.ms === best ? rx.tickBest : null).className }))),
          div(ex.status, "state = ", b(() => `'${state}'`), " · best ", b(() => (best ? `${best} ms` : "–"))),
        ),
      ],
      code: StaticCode(`let state = 'idle'        // 'wait' | 'go' | 'early' | 'result'
let ms = 0, t0 = 0, timer

function press() {
  if (state === 'wait') { clearTimeout(timer); state = 'early' }
  else if (state === 'go') { ms = performance.now() - t0; state = 'result' }
  else {
    state = 'wait'
    timer = setTimeout(() => {
      state = 'go'; t0 = performance.now(); update()
    }, 1200 + Math.random() * 2200)
  }
  update()                 // one branch comes on, the last one goes
}

button({ onPointerDown: press },
  when(() => state === 'wait', p('Wait…'))
    .when(() => state === 'go', strong('TAP!'))
    .when(() => state === 'early', p('Too soon'))
    .when(() => state === 'result', p(() => \`\${ms} ms\`))
    .else(p('Tap when it turns green')),
)`),
      root: [scope(S), { onMount: () => () => { clearTimeout(timer); if (state === "wait" || state === "go") state = "idle"; } }],
    };
  },
};

// ── Warp: onMount starts the loop and returns its cleanup; unmounting runs it ─────────────
const wp = {
  gone: css("pages-home-examples-warpGone", { position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 56px", fontSize: "0.9375rem", color: colors.textDim, textAlign: "center" }),
  star: css("pages-home-examples-warpStar", { raw: { "stroke-linecap": "round" } }),
};

export const Warp: HeroExample = {
  api: "onMount",
  title: "Hold to warp",
  note: "onMount starts the frame loop and returns its cleanup. Unmount the field and Nuclo runs that cleanup: the loop stops and nothing is left running.",
  build() {
    const S = "hero-warp", W = 480, H = 300, N = 200, F = 120, CRUISE = 0.005;
    type Star = { x: number; y: number; z: number; sx: number; sy: number; px: number; py: number; color: string };
    const center = { x: W / 2, y: H / 2 - 10 }, aim = { x: W / 2, y: H / 2 - 10 };
    let mounted = true, held = false, speed = 0, loops = 0, cleanups = 0;

    const place = (s: Star, z: number) => { s.x = (Math.random() - 0.5) * 4; s.y = (Math.random() - 0.5) * 2.8; s.z = z; };
    const stars: Star[] = Array.from({ length: N }, (_, i) => {
      const s = { x: 0, y: 0, z: 1, sx: 0, sy: 0, px: 0, py: 0, color: i % 6 ? "#fff8f2" : i % 12 ? "#ffb545" : "#ff6a3d" };
      place(s, 0.05 + Math.random() * 0.95);
      return s;
    });
    // Each star on screen, and where it was a moment ago: the streak
    function project(s: Star) {
      s.sx = center.x + (s.x / s.z) * F; s.sy = center.y + (s.y / s.z) * F;
      const back = s.z + 0.006 + speed * 5;
      s.px = center.x + (s.x / back) * F; s.py = center.y + (s.y / back) * F;
    }
    stars.forEach(project); // a still first frame
    function fly(dt: number) {
      speed += ((held ? 0.03 : motion() ? CRUISE : 0) - speed) * (1 - 0.94 ** dt);
      center.x += (aim.x - center.x) * 0.05 * dt;
      center.y += (aim.y - center.y) * 0.05 * dt;
      for (const s of stars) {
        s.z -= speed * dt;
        if (s.z < 0.04) place(s, 1);
        project(s);
      }
      update(S);
    }

    const Field = () => svgSvg(
      ex.bleed,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "A starfield; hold to warp", "data-grab": "",
        onMount: (el: Element) => {
          loops++;
          const stop = frames(el, fly);
          return () => { stop(); loops--; cleanups++; }; // the cleanup, run on unmount
        },
        onPointerDown: (e: PointerEvent) => { held = true; (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); },
        onPointerMove: (e: PointerEvent) => { const [x, y] = svgPoint(e); aim.x = W / 2 + (x - W / 2) * 0.35; aim.y = H / 2 + (y - H / 2) * 0.35; },
        onPointerUp: () => { held = false; },
        onPointerCancel: () => { held = false; },
      },
      defsSvg(radialGradientSvg({ id: "hero-warp-core" }, stopSvg({ offset: "0", "stop-color": "#ff6a3d", "stop-opacity": "0.45" }), stopSvg({ offset: "1", "stop-color": "#ff6a3d", "stop-opacity": "0" }))),
      circleSvg({ cx: () => center.x, cy: () => center.y, r: 190, fill: "url(#hero-warp-core)", opacity: () => clamp(speed / 0.03, 0.08, 1) }),
      ...stars.map((s) => lineSvg(wp.star, {
        x1: () => s.px, y1: () => s.py, x2: () => s.sx, y2: () => s.sy, stroke: s.color,
        "stroke-width": () => 0.6 + (1 - s.z) * 2.2, opacity: () => clamp((1 - s.z) * 1.4, 0, 1),
      })),
    );
    // The cleanup ran during the first pass; the second shows its count
    const toggle = () => { mounted = !mounted; held = false; update(S); update(S); };

    return {
      preview: [
        when(() => mounted, Field()).else(div(wp.gone, ex.rise, "Unmounted. The loop's cleanup ran, and nothing is left running.")),
        div(
          ex.bar, ex.barFloat,
          button(ex.btn, { type: "button", onClick: toggle }, () => (mounted ? "unmount" : "mount")),
          div(ex.status, b(() => String(loops)), " loop · ", b(() => String(cleanups)), " cleanups · warp ", b(() => (speed / CRUISE).toFixed(1))),
        ),
      ],
      code: StaticCode(`let mounted = true, speed = 0.004

const Stars = () => svgSvg(
  { onMount() {                                // in the document
      let raf = requestAnimationFrame(function frame() {
        for (const s of stars) fly(s, speed)
        update('warp'); raf = requestAnimationFrame(frame)
      })
      return () => cancelAnimationFrame(raf)    // run once it is removed
  } },
  ...stars.map(s => lineSvg({
    x1: () => s.px, y1: () => s.py, x2: () => s.sx, y2: () => s.sy,
  })),
)

when(() => mounted, Stars()).else(p('Unmounted.'))
button('unmount', { onClick: () => { mounted = !mounted; update() } })`),
      root: [scope(S)],
    };
  },
};

// ── Life: a plain array a tick; each cell's class is a function of its age ───────────────
const lf = {
  cell: css("pages-home-examples-lifeCell", { transition: `fill 0.35s ${EASE}`, raw: { fill: "var(--c-bg-light)" } }),
  born: css("pages-home-examples-lifeBorn", { raw: { fill: "#ffd166" } }),
  young: css("pages-home-examples-lifeYoung", { raw: { fill: "#ff6a3d" } }),
  old: css("pages-home-examples-lifeOld", { raw: { fill: "#b8270b" } }),
};

export const Life: HeroExample = {
  api: "class: () =>",
  title: "Game of Life",
  note: "The board is a plain array of ages. A tick computes the next one and calls update(); every cell's class is a function of its age, so only the cells that changed are patched.",
  build() {
    const S = "hero-life", C = 30, R = 18, STEP = 14;
    const W = C * STEP - 2, H = R * STEP - 2;
    const CLASSES = [lf.cell, cx(lf.cell, lf.born), cx(lf.cell, lf.young), cx(lf.cell, lf.old)].map((c) => c.className);
    const kind = (a: number) => (a === 0 ? 0 : a === 1 ? 1 : a < 6 ? 2 : 3);
    let age: number[] = [];
    let gen = 0, patched = 0, acc = 0, playing = true, touched = false, drawing = false;

    function seed() { age = Array.from({ length: C * R }, () => (Math.random() < 0.26 ? 1 : 0)); gen = 0; }
    seed();
    function step() {
      const next = age.map((a, i) => {
        const c = i % C, r = (i / C) | 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && age[((r + dy + R) % R) * C + ((c + dx + C) % C)]) n++;
        return n === 3 || (a && n === 2) ? Math.min(a + 1, 9) : 0;
      });
      patched = next.reduce((k, a, i) => k + (kind(a) !== kind(age[i]) ? 1 : 0), 0);
      age = next;
      gen++;
      // Left alone, a fresh soup once this one has settled
      if (!touched && (gen > 320 || !age.some(Boolean))) seed();
      update(S);
    }
    function drawAt(e: PointerEvent) {
      const [x, y] = svgPoint(e);
      const c = Math.floor(x / STEP), r = Math.floor(y / STEP);
      if (c < 0 || r < 0 || c >= C || r >= R) return;
      touched = true;
      age[r * C + c] = 1;
      update(S);
    }

    const board = svgSvg(
      ex.canvas,
      {
        viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Conway's Game of Life: tap or drag to draw cells", "data-grab": "",
        onPointerDown: (e: PointerEvent) => { drawing = true; drawAt(e); },
        onPointerMove: (e: PointerEvent) => { if (drawing) drawAt(e); },
        onPointerUp: () => { drawing = false; },
        onPointerCancel: () => { drawing = false; },
      },
      ...Array.from({ length: C * R }, (_, i) => rectSvg({ x: (i % C) * STEP, y: ((i / C) | 0) * STEP, width: STEP - 2, height: STEP - 2, rx: 3, class: () => CLASSES[kind(age[i])] })),
    );
    const user = (fn: () => void) => () => { touched = true; fn(); update(S); };

    return {
      preview: [
        div(ex.stage, board),
        div(
          ex.bar,
          button(ex.btn, { type: "button", onClick: user(() => { playing = !playing; }) }, () => (playing ? "pause" : "play")),
          button(ex.ghost, { type: "button", onClick: user(step) }, "step"),
          button(ex.ghost, { type: "button", onClick: user(seed) }, "random"),
          button(ex.ghost, { type: "button", onClick: user(() => { age = age.map(() => 0); gen = 0; }) }, "clear"),
          div(ex.status, "gen ", b(() => String(gen)), " · ", b(() => String(patched)), " patched"),
        ),
      ],
      code: StaticCode(`let age = new Array(30 * 18).fill(0)   // 0 = dead, else ticks alive

const Board = () => svgSvg(
  ...age.map((_, i) => rectSvg({
    x: (i % 30) * 14, y: Math.floor(i / 30) * 14, width: 12, height: 12,
    class: () => age[i] === 0 ? 'dead' : age[i] === 1 ? 'born' : 'alive',
  })),
)

function tick() {
  age = age.map((a, i) => {
    const n = neighbours(i)
    return n === 3 || (a && n === 2) ? a + 1 : 0
  })
  update()          // only the cells whose class changed are touched
}

setInterval(tick, 120)`),
      root: [
        scope(S),
        {
          onMount: (el: Element) => {
            if (!touched) playing = motion();
            return frames(el, (dt) => { if (playing && (acc += dt) >= 7) { acc = 0; step(); } });
          },
        },
      ],
    };
  },
};

// ── Draw: the logo's wheel, arms, pens and lines all read one number; a timeline scrubs it ─
const dw = {
  track: css("pages-home-examples-drawTrack", { flex: "1 1 160px", minWidth: "0" }),
  range: css("pages-home-examples-drawRange", { flex: "1 1 auto", minWidth: "0", raw: { "accent-color": "var(--c-primary)" }, focusVisible: focus }),
  toggle: css("pages-home-examples-drawToggle", { minWidth: "84px", justifyContent: "center" }),
};

export const Draw: HeroExample = {
  api: "d: () =>",
  title: "Draw the mark",
  note: "The Nuclo mark is a Spirograph: one wheel rolling inside a ring, two pens on it. The wheel, its arms, the pens and the lines are all functions of one number, t. The timeline and the frame loop only set t; update('draw') re-runs what reads it.",
  build() {
    const S = "hero-draw", DRAW = 3.2, FADE = 0.6, TOTAL = DRAW + FADE; // seconds: one lap, then the guides fade
    let t = TOTAL; // SSR paints the finished mark
    let playing = false, touched = false;
    const k = () => Math.round((0.5 - Math.cos(Math.PI * Math.min(1, t / DRAW)) / 2) * POINTS); // points drawn, eased like the site's logo
    const guides = () => 1 - clamp((t - DRAW) / FADE, 0, 1);
    const at = (pts: number[][], i: number) => () => pts[k()][i];
    const pens = [icon.shape, icon.play];

    const mark = svgSvg(
      ex.canvas,
      { viewBox: "0 0 200 200", role: "img", "aria-label": "The Nuclo mark drawn by a Spirograph; the timeline scrubs the drawing" },
      gSvg(
        { fill: "none", stroke: STROKE, "stroke-width": 1.5, opacity: guides },
        circleSvg({ cx: icon.cx, cy: icon.cy, r: icon.ring, "stroke-opacity": 0.4, "stroke-dasharray": "2 4" }),
        circleSvg({ cx: at(icon.hub, 0), cy: at(icon.hub, 1), r: icon.wheel, fill: STROKE, "fill-opacity": 0.1 }),
        ...pens.map((pts) => lineSvg({ x1: at(icon.hub, 0), y1: at(icon.hub, 1), x2: at(pts, 0), y2: at(pts, 1) })),
      ),
      // Lines only: the mark is never filled
      ...pens.map((pts) => pathSvg({ d: () => pathD([pts], k()), fill: "none", stroke: STROKE, "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" })),
      ...pens.map((pts) => circleSvg({ cx: at(pts, 0), cy: at(pts, 1), r: 5, fill: "#fff8f2", stroke: STROKE, "stroke-width": 1.5, opacity: guides })),
    );
    function toggle() {
      touched = true;
      if (!playing && t >= TOTAL) t = 0;
      playing = !playing;
      update(S);
    }
    function scrub(e: Event) {
      touched = true;
      playing = false;
      t = +(e.target as HTMLInputElement).value;
      update(S);
    }

    return {
      preview: [
        div(ex.stage, mark),
        div(
          ex.bar,
          button(ex.btn, dw.toggle, { type: "button", onClick: toggle }, () => (playing ? "pause" : t >= TOTAL ? "replay" : "play")),
          label(wv.slider, dw.track, "t", input(dw.range, { type: "range", min: "0", max: String(TOTAL), step: "0.01", value: () => String(t), "aria-label": "Timeline", onInput: scrub })),
          div(ex.status, b(() => String(k())), `/${POINTS} pts · `, b(() => t.toFixed(2)), "s"),
        ),
      ],
      code: StaticCode(`let t = 0                                 // seconds: the drawing reads only this
const k = () => Math.round(ease(t / 3.2) * 360)  // points drawn so far
const at = (pts, i) => () => pts[k()][i]

svgSvg(
  circleSvg({ cx: at(hub, 0), cy: at(hub, 1), r: 18 }),         // the wheel rolls
  pathSvg({ d: () => path(outline, k()), fill: 'none' }),       // the line it has drawn
  circleSvg({ cx: at(outline, 0), cy: at(outline, 1), r: 5 }),  // its pen
)

input({ type: 'range', max: 3.8, step: 0.01, value: () => t,
  onInput: e => { t = +e.target.value; update('draw') } })

function frame() {
  if (playing) { t += 1 / 60; update('draw') }
  requestAnimationFrame(frame)
}`),
      root: [
        scope(S),
        {
          // Left alone, it draws itself each time it comes on; a touch hands the timeline over
          onMount: (el: Element) => {
            if (!touched && motion()) { if (t >= TOTAL) t = 0; playing = true; }
            return frames(el, (dt) => {
              if (!playing) return;
              t = Math.min(TOTAL, t + dt / 60);
              if (t >= TOTAL) playing = false;
              update(S);
            });
          },
        },
      ],
    };
  },
};
