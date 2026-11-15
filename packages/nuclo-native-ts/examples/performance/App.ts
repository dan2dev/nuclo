/**
 * How fast update() is: every frame, requestAnimationFrame moves hundreds of views by changing plain
 * numbers and calling update("stage"). Each view's style is re-run and compared; only its transform
 * is written to the platform view, and no layout pass runs.
 *
 * The readout is measured by the app itself: frames per second, and the time update() took.
 * examples/bench times list operations (create, replace, swap, remove rows).
 */
import { type Style, css, div, h2, list, render, requestAnimationFrame, scope, small, span, strong, update } from "../../src/index.ts";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const STAGE_WIDTH = 320;
const STAGE_HEIGHT = 340;
const COLORS = ["#4f46e5", "#0d9488", "#db2777", "#ea580c", "#0ea5e9", "#84cc16"];

let dots: Dot[] = [];
let count = 200;
let running = false;
let lastTime = 0;
let frames = 0;
let windowStart = 0;
let fps = 0;
let updateTime = 0;
let updateMs = 0;

function makeDots(total: number): Dot[] {
  const out: Dot[] = [];
  for (let n = 0; n < total; n++) {
    const size = 8 + Math.random() * 14;
    out.push({
      x: Math.random() * (STAGE_WIDTH - size),
      y: Math.random() * (STAGE_HEIGHT - size),
      vx: (Math.random() - 0.5) * 240,
      vy: (Math.random() - 0.5) * 240,
      size,
      color: COLORS[n % COLORS.length] ?? "#4f46e5",
    });
  }
  return out;
}

function step(time: number) {
  if (!running) return;
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  for (const dot of dots) {
    dot.x += dot.vx * dt;
    dot.y += dot.vy * dt;
    if (dot.x < 0 || dot.x > STAGE_WIDTH - dot.size) {
      dot.vx = -dot.vx;
      dot.x = Math.max(0, Math.min(STAGE_WIDTH - dot.size, dot.x));
    }
    if (dot.y < 0 || dot.y > STAGE_HEIGHT - dot.size) {
      dot.vy = -dot.vy;
      dot.y = Math.max(0, Math.min(STAGE_HEIGHT - dot.size, dot.y));
    }
  }
  const before = Date.now();
  update("stage");
  updateTime += Date.now() - before;
  frames++;
  if (time - windowStart >= 500) {
    fps = Math.round((frames * 1000) / (time - windowStart));
    updateMs = updateTime / frames;
    frames = 0;
    updateTime = 0;
    windowStart = time;
    update("stats");
  }
  requestAnimationFrame(step);
}

function start() {
  if (running) return;
  running = true;
  lastTime = Date.now();
  windowStart = lastTime;
  frames = 0;
  updateTime = 0;
  requestAnimationFrame(step);
}

function setCount(next: number) {
  count = next;
  dots = makeDots(next);
  update();
}

const page: Style = { padding: 20, gap: 16, backgroundColor: "#0f172a", alignItems: "center" };
const chip = css({ paddingLeft: 14, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 999, pressed: { opacity: 0.6 } });

const DotView = (dot: Dot) =>
  div({
    style: () => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: dot.size,
      height: dot.size,
      borderRadius: dot.size / 2,
      backgroundColor: dot.color,
      translateX: dot.x,
      translateY: dot.y,
    }),
  });

const CountChip = (value: number) =>
  div(
    chip,
    {
      style: () => ({ backgroundColor: count === value ? "#4f46e5" : "#1e293b" }),
      onClick: () => setCount(value),
    },
    span(`${value}`, { style: { color: "#ffffff", fontWeight: "bold", fontSize: 14 } }),
  );

const App = () =>
  div(
    { style: page },
    h2("update() every frame", { style: { color: "#ffffff" } }),
    div(
      scope("stats"),
      { style: { flexDirection: "row", gap: 24 } },
      div({ style: { alignItems: "center" } }, strong(() => `${fps}`, { style: { color: "#ffffff", fontSize: 28 } }), small("frames / s", { style: { color: "#94a3b8" } })),
      div({ style: { alignItems: "center" } }, strong(() => updateMs.toFixed(2), { style: { color: "#ffffff", fontSize: 28 } }), small("ms per update()", { style: { color: "#94a3b8" } })),
      div({ style: { alignItems: "center" } }, strong(() => `${dots.length}`, { style: { color: "#ffffff", fontSize: 28 } }), small("views moved", { style: { color: "#94a3b8" } })),
    ),
    div(
      scope("stage"),
      { style: { width: STAGE_WIDTH, height: STAGE_HEIGHT, borderRadius: 20, backgroundColor: "#1e293b", overflow: "hidden" } },
      list(() => dots, (dot) => DotView(dot)),
    ),
    div({ style: { flexDirection: "row", gap: 8 } }, CountChip(100), CountChip(200), CountChip(500), CountChip(1000)),
    div(
      chip,
      {
        style: () => ({ backgroundColor: running ? "#dc2626" : "#16a34a", width: 160, alignItems: "center" }),
        onClick: () => {
          if (running) running = false;
          else start();
          update();
        },
      },
      span(() => (running ? "Stop" : "Start"), { style: { color: "#ffffff", fontWeight: "bold" } }),
    ),
    small("Each dot is a real platform view. Nothing is drawn on a canvas.", { style: { color: "#64748b", textAlign: "center" } }),
  );

dots = makeDots(count);
start();
render(App);
