// app.ts: the editor. The picture is one plain array of colors, and each of
// its 1024 cells reads its color from that array. A stroke writes into the
// array and calls update(); when it ends, history.ts keeps a copy. Undo, redo
// and the history panel only put an older copy back.
import "nuclo";
import { SIZE, at, blank, commit, fill, get, history, jump, line, load, mushroom, pixels, redo, undo, type Snapshot } from "./history.ts";
import { s } from "./styles.ts";

const TOOLS = [
  { name: "Pencil", key: "B" },
  { name: "Eraser", key: "E" },
  { name: "Fill", key: "G" },
  { name: "Picker", key: "I" },
] as const;
type Tool = (typeof TOOLS)[number]["name"];

const PALETTE = ["#1f2937", "#6b7280", "#d1d5db", "#ffffff", "#ef4444", "#f97316", "#facc15", "#fde68a", "#22c55e", "#15803d", "#14b8a6", "#38bdf8", "#2563eb", "#8b5cf6", "#ec4899", "#92400e"];

let tool: Tool = "Pencil";
let color = "#ef4444";
let stroke: { tool: Tool; ink: string; x: number; y: number; changed: number } | null = null; // a pencil or eraser drag

// Picking a color means painting with it next: leave the eraser and the picker.
function choose(c: string) {
  color = c;
  if (tool !== "Fill") tool = "Pencil";
}

function replace(label: string, next: string[]) {
  load(next);
  commit(label);
  update();
}

// The cell under the pointer, from coordinates rather than from the event
// target: with pointer capture, a drag keeps reporting to the canvas, even
// outside it (those cells are off the picture and paint nothing).
function cellAt(e: PointerEvent, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return [Math.floor(((e.clientX - r.left) / r.width) * SIZE), Math.floor(((e.clientY - r.top) / r.height) * SIZE)];
}

function Canvas() {
  return div(
    s.canvas,
    { role: "img", "aria-label": `Canvas, ${SIZE} by ${SIZE} pixels` },
    {
      onPointerDown: (e) => {
        if (e.button !== 0) return;
        const [x, y] = cellAt(e, e.currentTarget);
        if (tool === "Picker") { const c = get(x, y); if (c) choose(c); }
        else if (tool === "Fill") commit(`Fill · ${fill(x, y, color)} px`);
        else {
          e.currentTarget.setPointerCapture(e.pointerId);
          const ink = tool === "Eraser" ? "" : color;
          stroke = { tool, ink, x, y, changed: line(x, y, x, y, ink) };
        }
        update();
      },
      onPointerMove: (e) => {
        if (!stroke) return;
        const [x, y] = cellAt(e, e.currentTarget);
        if (x === stroke.x && y === stroke.y) return;
        stroke.changed += line(stroke.x, stroke.y, x, y, stroke.ink); // the whole segment: fast drags skip cells
        stroke.x = x;
        stroke.y = y;
        update();
      },
      // Fires when the stroke's pointer goes up, and when the browser cancels it.
      onLostPointerCapture: () => {
        if (stroke) commit(`${stroke.tool} · ${stroke.changed} px`);
        stroke = null;
        update();
      },
    },
    // The cells never come and go, so they are built once; only their color is read again.
    ...pixels.map((_, i) => div(s.cell, { style: () => ({ backgroundColor: pixels[i] }) })),
  );
}

const ToolButton = (t: (typeof TOOLS)[number]) =>
  button(
    s.tool,
    { class: () => cx(s.tool, tool === t.name ? s.on : null).className, "aria-pressed": () => String(tool === t.name), title: `${t.name} (${t.key})` },
    t.name,
    kbd(t.key),
    { onClick: () => { tool = t.name; update(); } },
  );

const Swatch = (c: string) =>
  button(s.swatch, {
    style: { backgroundColor: c },
    title: c,
    "aria-label": `Color ${c}`,
    class: () => cx(s.swatch, c === color ? s.picked : null).className,
    onClick: () => { choose(c); update(); },
  });

// A snapshot never changes, so its thumbnail is drawn once, when its row mounts.
const Thumb = (snap: Snapshot) =>
  canvas(s.thumb, { width: SIZE, height: SIZE, "aria-hidden": "true" }, on("mount", (el) => {
    const ctx = el.getContext("2d")!;
    snap.pixels.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(i % SIZE, Math.floor(i / SIZE), 1, 1); } });
  }));

function Entry(snap: Snapshot) {
  const i = () => history.indexOf(snap);
  return button(
    s.entry,
    { class: () => cx(s.entry, i() === at ? s.current : i() > at ? s.future : null).className, "aria-current": () => String(i() === at) },
    Thumb(snap),
    span(snap.label),
    { onClick: () => { jump(i()); update(); } }, // time travel: any snapshot, either direction
  );
}

// Shortcuts listen on the document in the capture phase: they work wherever
// the focus is, and a key handled here is defaultPrevented before the modal sees it.
function shortcuts(el: HTMLElement) {
  const onKey = (e: KeyboardEvent) => {
    // Not while a source tab hides the editor, nor while typing in the color field.
    if (!el.offsetParent || e.altKey || e.target instanceof HTMLInputElement) return;
    const key = e.key.toUpperCase();
    const t = TOOLS.find((t) => t.key === key);
    if (e.ctrlKey || e.metaKey) {
      if (key === "Z") (e.shiftKey ? redo : undo)();
      else if (key === "Y") redo();
      else return;
    } else if (t) tool = t.name;
    else return;
    e.preventDefault();
    update();
  };
  document.addEventListener("keydown", onKey, true);
  return () => {
    document.removeEventListener("keydown", onKey, true);
    stroke = null; // a drag cut short by closing the example must not go on at the next visit
  };
}

export function PixelEditor() {
  return div(
    s.app,
    on("mount", shortcuts),
    div(
      s.tools,
      ...TOOLS.map(ToolButton),
      div(s.palette, ...PALETTE.map(Swatch)),
      label(s.custom, input({ type: "color", value: () => color }, { onInput: (e) => { choose(e.currentTarget.value); update(); } }), "Custom"),
      div(
        s.actions,
        button(s.btn, "Clear", { onClick: () => replace("Clear", blank()) }),
        button(s.btn, "Mushroom", { title: "Start again from the mushroom", onClick: () => replace("Mushroom", mushroom()) }),
      ),
    ),
    div(s.stage, Canvas()),
    aside(
      s.history,
      div(
        s.head,
        strong("History"),
        button(s.btn, "Undo", { title: "Undo (Ctrl+Z)", disabled: () => at === 0, onClick: () => { undo(); update(); } }),
        button(s.btn, "Redo", { title: "Redo (Ctrl+Shift+Z)", disabled: () => at === history.length - 1, onClick: () => { redo(); update(); } }),
      ),
      p(s.stats, () => `${history.length} snapshots · each a plain array of ${SIZE * SIZE} strings`),
      // Newest first. Rows are the snapshot objects: a new step builds one row, nothing else.
      div(s.entries, list(() => history.slice().reverse(), Entry)),
    ),
  );
}
