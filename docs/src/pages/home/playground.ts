import { css, cx } from "../../styles.ts";
import { animations } from "../../styles/animations.ts";
import { terminalCodeTokenStyle } from "../../components/CodeBlock.ts";
import { hs } from "./styles.ts";
import { ex, EASE, motion, svgPoint, type HeroExample } from "./examples.ts";

// The hero's first example: Nuclo's whole model in one card. The left grid is a plain array of
// booleans; painting it is a mutation and nothing more. The right grid is the DOM: it moves only
// when update() runs, and then only the cells that changed are patched. The card is a scope(), so
// every interaction calls update(SCOPE) and leaves the rest of the page alone. SSR paints the blank
// canvas; in the browser the card paints the play triangle by itself once, until someone touches it.

const COLS = 8;
const ROWS = 5;
const CELL = 22;
const GAP = 5;
const STEP = CELL + GAP;
const GW = COLS * STEP - GAP; // a grid's width
const GH = ROWS * STEP - GAP;
const MID = 76; // the arrow's lane between the grids
const TOP = 24; // room for the labels
const W = GW * 2 + MID;
const H = TOP + GH + 4;
const DOM_X = GW + MID;
const ARROW = { x0: GW + 16, x1: DOM_X - 16, y: TOP + GH / 2 };
const TOTAL = COLS * ROWS;
const SCOPE = "hero-play";
const MONO = "ui-monospace, monospace";

// The play triangle the self-demo paints, as cell indices (row * COLS + col)
const PLAY = [2, 10, 11, 18, 19, 20, 26, 27, 34];
const SELF_DEMO_AT = 1100; // ms after mount
const SELF_DEMO_STEP = 120;
const TRAVEL_MS = 380; // the update's trip along the arrow

const reduced = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;

const ps = {
  label: css("pages-home-playground-label", { fontFamily: MONO, fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", raw: { fill: "var(--c-text-muted)" } }),
  labelHint: css("pages-home-playground-labelHint", { fontWeight: "500", letterSpacing: "0", textTransform: "none", raw: { fill: "var(--c-text-muted)" } }),
  cell: css("pages-home-playground-cell", { transition: `fill 0.22s ${EASE}`, raw: { fill: "var(--c-bg-light)", "transform-box": "fill-box", "transform-origin": "center" } }),
  cellOn: css("pages-home-playground-cellOn", { raw: { fill: "var(--c-primary)" } }),
  cellState: css("pages-home-playground-cellState", { cursor: "pointer" }),
  // A state cell the DOM has not seen yet wears a marching dashed ring
  cellPending: css("pages-home-playground-cellPending", { animation: `${animations.dashMarch} 0.7s linear infinite`, raw: { stroke: "var(--c-primary-ink)", "stroke-width": "1.5", "stroke-dasharray": "3 2" }, ...reduced }),
  cellPatched: css("pages-home-playground-cellPatched", { animation: `${animations.patchPop} 0.55s ${EASE}`, ...reduced }),
  arrow: css("pages-home-playground-arrow", { raw: { stroke: "var(--c-border-light)", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" } }),
  dot: css("pages-home-playground-dot", { raw: { fill: "var(--c-primary)" } }),

  pill: css("pages-home-playground-pill", { minWidth: "20px", height: "20px", padding: "0 6px", borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.22)", fontSize: "0.75rem", lineHeight: "20px", textAlign: "center", fontVariantNumeric: "tabular-nums" }),
  hidden: css("pages-home-playground-hidden", { display: "none" }),

  codeLog: css("pages-home-playground-codeLog", { minHeight: "calc(3 * 1.7em)", marginTop: "1.7em" }),
};

export const Paint: HeroExample = {
  api: "update()",
  build,
};

function build() {
  let pixels: boolean[] = Array(TOTAL).fill(false); // the state: plain booleans
  let dom: boolean[] = pixels.slice(); // what the DOM shows
  let mutations = 0;
  let updates = 0;
  let patched = 0;
  let flash = new Set<number>(); // cells patched by the last update(), while they pop
  let log: { i: number; on: boolean }[] = []; // the last mutations, for the code pane
  let touched = false; // someone painted: the self-demo stands down
  let drawing: boolean | null = null; // the value the pointer paints while it is down
  let travel = -1; // the update's progress along the arrow, -1 when idle

  const pending = () => pixels.reduce((n, v, i) => n + (v !== dom[i] ? 1 : 0), 0);

  function paint(i: number, on = !pixels[i]) {
    if (pixels[i] === on) return;
    pixels[i] = on;
    mutations++;
    log.push({ i, on });
    if (log.length > 3) log.shift();
    update(SCOPE);
  }

  function commit() {
    if (travel >= 0) return; // one trip at a time
    const changed = pixels.map((v, i) => (v !== dom[i] ? i : -1)).filter((i) => i >= 0);
    updates++;
    const apply = () => {
      travel = -1;
      dom = pixels.slice();
      patched = changed.length;
      flash = new Set(changed);
      update(SCOPE);
      setTimeout(() => { flash = new Set(); update(SCOPE); }, 600);
    };
    if (!motion()) return apply();
    const t0 = performance.now();
    const tick = (now: number) => {
      travel = Math.min(1, (now - t0) / TRAVEL_MS);
      update(SCOPE);
      if (travel < 1) requestAnimationFrame(tick);
      else apply();
    };
    travel = 0;
    requestAnimationFrame(tick);
  }

  function clear() {
    touched = true;
    pixels.forEach((v, i) => v && paint(i, false));
  }

  // The cell under the pointer, or -1
  function cellAt(e: PointerEvent): number {
    const [x, top] = svgPoint(e);
    const y = top - TOP;
    const col = Math.floor(x / STEP);
    const row = Math.floor(y / STEP);
    return x < 0 || y < 0 || col >= COLS || row >= ROWS ? -1 : row * COLS + col;
  }

  function Grid(x: number, label: string, hint: string, side: "state" | "dom", get: (i: number) => boolean, mark: (i: number) => ReturnType<typeof css> | null) {
    return gSvg(
      { transform: `translate(${x} 0)` },
      textSvg(ps.label, { x: 0, y: 11 }, label, tspanSvg(ps.labelHint, { dx: 6 }, hint)),
      ...Array.from({ length: TOTAL }, (_, i) =>
        rectSvg({
          x: (i % COLS) * STEP,
          y: TOP + Math.floor(i / COLS) * STEP,
          width: CELL,
          height: CELL,
          rx: 5,
          "data-cell": `${side}-${i}`,
          "data-on": () => String(get(i)),
          class: () => cx(ps.cell, side === "state" ? ps.cellState : null, get(i) ? ps.cellOn : null, mark(i)).className,
        }),
      ),
    );
  }

  function Canvas() {
    return svgSvg(
      ex.canvas,
      {
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "data-grab": "",
        "aria-label": "Paint the state grid, then press update() to patch the DOM grid",
        onPointerDown: (e: PointerEvent) => {
          const i = cellAt(e);
          if (i < 0) return;
          touched = true;
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          drawing = !pixels[i];
          paint(i, drawing);
        },
        onPointerMove: (e: PointerEvent) => {
          if (drawing === null) return;
          const i = cellAt(e);
          if (i >= 0) paint(i, drawing);
        },
        onPointerUp: () => { drawing = null; },
        onPointerCancel: () => { drawing = null; },
      },
      Grid(0, "state", "plain array · tap or drag", "state", (i) => pixels[i], (i) => (pixels[i] !== dom[i] ? ps.cellPending : null)),
      // The arrow: update() carries the state across, and the dot rides it
      gSvg(
        ps.arrow,
        lineSvg({ x1: ARROW.x0, y1: ARROW.y, x2: ARROW.x1, y2: ARROW.y }),
        pathSvg({ d: `M${ARROW.x1 - 6},${ARROW.y - 5}L${ARROW.x1},${ARROW.y}L${ARROW.x1 - 6},${ARROW.y + 5}` }),
      ),
      textSvg(ps.label, { x: (ARROW.x0 + ARROW.x1) / 2, y: ARROW.y - 12, "text-anchor": "middle" }, "update()"),
      circleSvg(ps.dot, { cx: () => ARROW.x0 + (ARROW.x1 - ARROW.x0) * Math.max(0, travel), cy: ARROW.y, r: 5, opacity: () => (travel >= 0 ? 1 : 0) }),
      Grid(DOM_X, "dom", "real nodes", "dom", (i) => dom[i], (i) => (flash.has(i) ? ps.cellPatched : null)),
    );
  }

  function Bar() {
    return div(
      ex.bar,
      button(
        ex.btn,
        { type: "button", class: () => cx(ex.btn, pending() > 0 ? ex.btnLive : null).className, onClick: commit },
        "update()",
        span(ps.pill, { "data-demo-pending": "", class: () => cx(ps.pill, pending() > 0 ? null : ps.hidden).className }, () => String(pending())),
      ),
      button(ex.ghost, { type: "button", onClick: clear }, "clear"),
      div(
        ex.status,
        b(() => String(mutations)), " mutations · ",
        b(() => String(updates)), " update() · ",
        b(() => String(patched)), " patched",
      ),
    );
  }

  // The same thing, as the code someone would write
  function Code() {
    const pendingLine = () => {
      const n = pending();
      if (n) return `// ${n} pending · DOM untouched`;
      return mutations ? "// nothing pending" : "// tap the canvas to mutate";
    };
    const updateLine = () => (updates ? `  // ${patched} patched, ${TOTAL - patched} untouched` : "  // one call syncs the DOM");
    return div(
      hs.demoCodePane, ex.code, terminalCodeTokenStyle,
      { "data-demo-pane": "code" },
      pre(
        hs.preWrap,
        div(span({ className: "kw" }, "let "), span({ className: "pr" }, "pixels"), span({ className: "pt" }, " = "), span({ className: "fn" }, "Array"), span({ className: "pt" }, "("), span({ className: "nm" }, String(TOTAL)), span({ className: "pt" }, ")."), span({ className: "fn" }, "fill"), span({ className: "pt" }, "("), span({ className: "kw" }, "false"), span({ className: "pt" }, ")"), span({ className: "cm" }, "  // plain state")),
        div(
          ps.codeLog,
          list(() => log, (e) => div(span({ className: "pr" }, "pixels"), span({ className: "pt" }, "["), span({ className: "nm" }, String(e.i)), span({ className: "pt" }, "] = "), span({ className: "kw" }, String(e.on)))),
        ),
        div(span({ className: "cm" }, pendingLine)),
        div(span({ className: "fn" }, "update"), span({ className: "pt" }, "()"), span({ className: "cm" }, updateLine)),
      ),
    );
  }

  return {
    preview: [div(ex.stage, Canvas()), Bar()],
    code: Code(),
    root: [
      scope(SCOPE),
      {
        // The self-demo: the triangle, cell by cell, then one update(). It stands down once someone paints
        onMount: () => {
          if (!motion()) return;
          const timers: number[] = [];
          const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => { if (!touched) fn(); }, ms));
          PLAY.forEach((i, k) => at(SELF_DEMO_AT + k * SELF_DEMO_STEP, () => paint(i, true)));
          at(SELF_DEMO_AT + PLAY.length * SELF_DEMO_STEP + 650, () => { commit(); touched = true; }); // once is enough
          return () => timers.forEach(clearTimeout);
        },
      },
    ],
  };
}
