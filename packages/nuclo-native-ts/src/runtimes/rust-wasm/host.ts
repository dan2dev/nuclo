// The DOM half of the wasm host. The core (compiled from Rust to app.wasm) decides everything
// about the app: what views exist, where each one is, how it looks. This file only does what a
// browser must: one element per view at the frame the core computed, the CSS web_backend.rs wrote,
// the browser's own text layout for `measure`, its input as events for the core, and its timers,
// frames, network and navigation chrome. See web_backend.rs for the other half of the interface.

interface Exports {
  memory: WebAssembly.Memory;
  nuclo_alloc(len: number): number;
  nuclo_free(ptr: number, len: number): void;
  nuclo_start(): void;
  nuclo_measure_root(root: number, width: number): number;
  nuclo_layout_root(root: number, width: number, height: number): void;
  nuclo_screen_scrolled(root: number, top: number, visible: number): void;
  nuclo_event(view: number, event: number): void;
  nuclo_control(view: number, ptr: number, len: number, checked: number): void;
  nuclo_pointer(view: number, phase: number, x: number, y: number, pageX: number, pageY: number, pointerId: number): void;
  nuclo_pan(view: number, state: number, tx: number, ty: number, vx: number, vy: number, x: number, y: number): void;
  nuclo_pinch(view: number, state: number, scale: number, fx: number, fy: number): void;
  nuclo_key(view: number, ptr: number, len: number): void;
  nuclo_scroll(view: number, top: number, left: number, sh: number, sw: number, ch: number, cw: number): void;
  nuclo_hover(view: number, over: number): void;
  nuclo_nav_popped(tab: number, root: number): void;
  nuclo_nav_tab(tab: number): void;
  nuclo_timer(id: number): void;
  nuclo_frame(id: number): void;
  nuclo_wake(): void;
  nuclo_http_done(id: number, status: number, ptr: number, len: number, ok: number): void;
  nuclo_callback(id: number, ptr: number, len: number): void;
  nuclo_native_done(id: number, ok: number, ptr: number, len: number): void;
}

import { type NativeComponent, registry } from "./native.ts";

let wasm!: Exports;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

const read = (ptr: number, len: number) => decoder.decode(new Uint8Array(wasm.memory.buffer, ptr, len));

/** Sends bytes into the module's memory for the duration of `use`. */
function send<T>(data: Uint8Array, use: (ptr: number, len: number) => T): T {
  const ptr = wasm.nuclo_alloc(data.length);
  new Uint8Array(wasm.memory.buffer, ptr, data.length).set(data);
  try {
    return use(ptr, data.length);
  } finally {
    wasm.nuclo_free(ptr, data.length);
  }
}
const sendText = <T>(text: string, use: (ptr: number, len: number) => T) => send(encoder.encode(text), use);

// ---------------------------------------------------------------------------
// Calls into the core
// ---------------------------------------------------------------------------

// The core is not re-entrant. A DOM event can fire while the core is changing the DOM (removing a
// focused element blurs it, synchronously): such an event waits until the core's call returns.
let depth = 0;
const waiting: (() => void)[] = [];

function enter<T>(call: () => T): T {
  depth++;
  try {
    return call();
  } finally {
    depth--;
  }
}

/** Runs a call into the core now, or once the core is back from the one it is in. */
function run(call: () => void) {
  if (depth > 0) {
    if (waiting.push(call) === 1) queueMicrotask(flush);
    return;
  }
  enter(call);
}

function flush() {
  for (let call = waiting.shift(); call; call = waiting.shift()) run(call);
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

const BOX = 0, TEXT = 1, BUTTON = 2, INPUT = 3, CHECKBOX = 4, TEXTAREA = 5, IMAGE = 6, NATIVE = 7;
const TAGS = ["div", "div", "button", "input", "input", "textarea", "img", "div"];

interface View {
  el: HTMLElement;
  kind: number;
  /** Where the children go: the element, or the content of a scrolling box. */
  host: HTMLElement;
  kids: number[];
  frame: string;
  box: string;
  text: string;
  extra: string;
  words: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The last text measured, with the style and width it was measured at. */
  measured?: { key: string; size: [number, number] };
  /** The text fits one line: it is set not to wrap, whatever sub-pixel difference there is between this measure and the layout's. */
  single?: boolean;
  image?: string;
}

const views: (View | undefined)[] = [];
const view = (id: number) => views[id]!;

// Styles are written in one go, not as the core asks. Measuring text reads layout from the
// browser, and a read after a write makes the browser lay out everything written so far: a
// thousand views painted and measured one by one would be a thousand layouts of the whole page.
const stale = new Set<View>();
let flushQueued = false;

function apply(v: View) {
  stale.add(v);
  if (!flushQueued) {
    flushQueued = true;
    queueMicrotask(flushStyles);
  }
}

function flushStyles() {
  flushQueued = false;
  for (const v of stale) v.el.style.cssText = v.frame + v.box + v.text + v.extra + (v.single ? "white-space:pre;" : "");
  stale.clear();
}

const CSS = `
html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none}
body{font:15px system-ui,sans-serif;color:#000;background:#fff;-webkit-text-size-adjust:100%}
.n{position:absolute;box-sizing:border-box;margin:0;padding:0;border:0;outline:none;background:none;font:inherit;color:inherit;pointer-events:none;
user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;display:block}
.n.k1{white-space:pre-wrap;overflow-wrap:anywhere}
.n.k2{display:flex;align-items:center;justify-content:center;white-space:pre-wrap;overflow-wrap:anywhere;appearance:none;cursor:pointer;pointer-events:auto;text-align:center!important}
.n.k2:hover{background-image:linear-gradient(rgba(0,0,0,.06),rgba(0,0,0,.06))}
.n.k2:active{background-image:linear-gradient(rgba(0,0,0,.16),rgba(0,0,0,.16))}
.n.k3,.n.k5{pointer-events:auto;user-select:text;-webkit-user-select:text;appearance:none;border-radius:0;resize:none}
.n.k4{pointer-events:auto;accent-color:#4f46e5;cursor:pointer}
.n.k6{object-fit:cover}
.n::placeholder{color:var(--ph,#757575)}
.n.k7{pointer-events:auto}
.n:disabled{opacity:.4;cursor:default}
.n.off{pointer-events:none!important}
.n.scroll{overscroll-behavior:contain}
#nuclo{position:fixed;inset:0;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.nuclo-main{flex:1;min-height:0;position:relative;display:flex;flex-direction:column}
.nuclo-screen{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;background:#fff}
.nuclo-layer{position:absolute;inset:0;pointer-events:none;z-index:10}
.nuclo-bar{height:56px;flex:none;display:flex;align-items:center;background:#fff;box-shadow:0 1px 3px #0003;z-index:2;font-size:20px;font-weight:bold}
.nuclo-back{width:56px;height:56px;font:24px system-ui;background:none;border:0;cursor:pointer}
.nuclo-tabs{height:64px;flex:none;display:flex;background:#f8fafc;box-shadow:0 -1px 4px #0002;z-index:2}
.nuclo-tabs button{flex:1;border:0;background:none;font:12px system-ui;color:#64748b;white-space:pre-line;cursor:pointer}
.nuclo-tabs button.active{color:#4f46e5}
.nuclo-stack{flex:1;min-height:0;position:relative;overflow:hidden}
.nuclo-sheet{z-index:3}
`;

/** Where a root view is shown: the box it is as wide as, and (a screen) as tall as or taller than. */
interface Root {
  box: HTMLElement;
  overlay: boolean;
}
const roots = new Map<number, Root>();

let container!: HTMLElement;
let main!: HTMLElement;
let layer!: HTMLElement;

function createView(id: number, kind: number) {
  const el = document.createElement(TAGS[kind]!);
  el.className = `n k${kind}`;
  if (kind === CHECKBOX) (el as HTMLInputElement).type = "checkbox";
  wire(id, el, kind);
}

function wire(id: number, el: HTMLElement, kind: number) {
  const v: View = { el, kind, host: el, kids: [], frame: "", box: "", text: "", extra: "", words: "", x: NaN, y: NaN, w: NaN, h: NaN };
  views[id] = v;
  const control = () => {
    const field = el as HTMLInputElement;
    sendText(field.value, (ptr, len) => wasm.nuclo_control(id, ptr, len, kind === CHECKBOX && field.checked ? 1 : 0));
  };
  const emit = (event: number, sync = false) => run(() => {
    if (sync) control();
    wasm.nuclo_event(id, event);
  });
  switch (kind) {
    case BUTTON:
      el.addEventListener("click", () => emit(0));
      break;
    case INPUT:
      el.addEventListener("input", () => emit(1, true));
      el.addEventListener("keydown", (e) => e.key === "Enter" && !e.isComposing && emit(2, true));
      el.addEventListener("focus", () => emit(3));
      el.addEventListener("blur", () => emit(4));
      break;
    case CHECKBOX:
      el.addEventListener("change", () => emit(2, true));
      break;
    case TEXTAREA:
      el.addEventListener("input", () => emit(1, true));
      el.addEventListener("focus", () => emit(3));
      el.addEventListener("blur", () => emit(4));
      break;
  }
}

function measureView(v: View, maxWidth: number): [number, number] {
  switch (v.kind) {
    case TEXT:
    case BUTTON:
      return probe(v.text, v.words, maxWidth, v);
    case INPUT:
      return [maxWidth, probe(v.text, "Ag", maxWidth, v)[1]];
    case TEXTAREA:
      return probe(v.text, (v.el as HTMLTextAreaElement).value || "Ag", maxWidth, v);
    case CHECKBOX:
      return [20, 20];
    case NATIVE: {
      // A component the page made: the size it takes on its own.
      const inner = v.el.firstElementChild as HTMLElement;
      const [position, width, height] = [inner.style.position, inner.style.width, inner.style.height];
      const style = v.el.style.cssText;
      inner.style.position = "static";
      inner.style.width = inner.style.height = "auto";
      v.el.style.cssText = `position:absolute;left:0;top:0;width:max-content;max-width:${maxWidth}px;visibility:hidden`;
      const size = v.el.getBoundingClientRect();
      v.el.style.cssText = style;
      [inner.style.position, inner.style.width, inner.style.height] = [position, width, height];
      return [Math.ceil(size.width - 0.01), Math.ceil(size.height - 0.01)];
    }
    default:
      return [0, 0];
  }
}

/** The element text is laid out in to be measured: in an iframe of its own, so reading its size does not lay out the app's views. */
let probeEl: HTMLElement;

const canvas = document.createElement("canvas").getContext("2d")!;
// The layout kerns pairs ("AV"); the canvas does so only when asked.
canvas.fontKerning = "normal";
const widths = new Map<string, number>();
const lineHeights = new Map<string, number>();

/** Text the primary font covers, set on one line without special spaces: its width is the canvas's, no layout needed. */
const PLAIN = /^[\x21-\x7e\u00a1-\u024f]+(?: [\x21-\x7e\u00a1-\u024f]+)*$/;

/** The size of `content` set in `css`, wrapped at `maxWidth`: its natural width if that is less. */
function probe(css: string, content: string, maxWidth: number, v: View): [number, number] {
  const key = `${css}|${content}|${maxWidth}`;
  if (v.measured?.key === key) return v.measured.size;
  const size = quick(css, content, maxWidth) ?? slow(css, content, maxWidth);
  v.measured = { key, size };
  const single = size[1] <= (lineHeights.get(css) ?? lineHeight(css));
  if (single !== v.single) {
    v.single = single;
    apply(v);
  }
  return size;
}

/** One line of plain text is measured by the canvas (as fast as a lookup); `null` when it needs the browser's layout. */
function quick(css: string, content: string, maxWidth: number): [number, number] | null {
  // Letter spacing is also added after the last letter, and the canvas and the layout differ on that.
  if (css.includes("letter-spacing")) return null;
  if (content !== "" && !PLAIN.test(content)) return null;
  const font = /font:([^;]+);/.exec(css)?.[1];
  if (!font) return null;
  const height = lineHeights.get(css) ?? lineHeight(css);
  if (content === "") return [0, height];
  const wide = `${font}|${content}`;
  let width = widths.get(wide);
  if (width === undefined) {
    canvas.font = font;
    width = canvas.measureText(content).width;
    if (widths.size > 20000) widths.clear();
    widths.set(wide, width);
  }
  return width > maxWidth ? null : [Math.ceil(width - 0.01), height];
}

function lineHeight(css: string): number {
  const height = slow(css, "Ag", 1e6)[1];
  lineHeights.set(css, height);
  return height;
}

function slow(css: string, content: string, maxWidth: number): [number, number] {
  probeEl.style.cssText = `${css};position:absolute;left:0;top:0;white-space:pre-wrap;overflow-wrap:anywhere;width:max-content;max-width:${maxWidth}px;box-sizing:content-box`;
  // An empty line still has its height.
  probeEl.textContent = content || "\u200b";
  const { width, height } = probeEl.getBoundingClientRect();
  return [Math.ceil(width - 0.01), Math.ceil(height - 0.01)];
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const SLOP = 8;

function pointerAt(el: HTMLElement, e: PointerEvent | MouseEvent) {
  const rect = el.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, pageX: e.clientX, pageY: e.clientY, id: "pointerId" in e ? e.pointerId : 0 };
}

function listen(id: number, input: number) {
  const v = view(id);
  const el = v.el;
  const pointer = (phase: number, e: PointerEvent | MouseEvent) => {
    const p = pointerAt(el, e);
    run(() => wasm.nuclo_pointer(id, phase, p.x, p.y, p.pageX, p.pageY, p.id));
  };
  if (input !== 6 || v.kind === BOX || v.kind === TEXT) v.extra += "pointer-events:auto;";
  switch (input) {
    case 0: // click
      if (v.kind === BUTTON) break;
      v.extra += "cursor:pointer;";
      el.addEventListener("click", () => run(() => wasm.nuclo_event(id, 0)));
      break;
    case 1: {
      // down, move (while down), up, cancel
      let down = false;
      el.addEventListener("pointerdown", (e) => {
        down = true;
        // A child control (a button inside) keeps its own clicks: the pointer is captured only when this view is hit itself.
        if (e.target === el) el.setPointerCapture(e.pointerId);
        pointer(0, e);
      });
      el.addEventListener("pointermove", (e) => down && pointer(1, e));
      el.addEventListener("pointerup", (e) => {
        if (!down) return;
        down = false;
        pointer(2, e);
      });
      el.addEventListener("pointercancel", (e) => {
        if (!down) return;
        down = false;
        pointer(3, e);
      });
      break;
    }
    case 2:
      pan(id, el);
      v.extra += "touch-action:none;";
      break;
    case 3:
      pinch(id, el);
      v.extra += "touch-action:none;";
      break;
    case 4:
      longPress(el, (e) => pointer(4, e));
      break;
    case 5:
      el.addEventListener("dblclick", (e) => pointer(5, e));
      break;
    case 6:
      el.addEventListener("pointerenter", () => run(() => wasm.nuclo_hover(id, 1)));
      el.addEventListener("pointerleave", () => run(() => wasm.nuclo_hover(id, 0)));
      break;
    case 7:
      // A box takes keys while it has the focus: a click gives it.
      if (v.kind === BOX) el.tabIndex = 0;
      el.addEventListener("keydown", (e) => run(() => sendText(e.key, (ptr, len) => wasm.nuclo_key(id, ptr, len))));
      break;
    case 8:
      el.addEventListener(
        "scroll",
        () => run(() => wasm.nuclo_scroll(id, el.scrollTop, el.scrollLeft, el.scrollHeight, el.scrollWidth, el.clientHeight, el.clientWidth)),
        { passive: true },
      );
      break;
  }
  apply(v);
}

function longPress(el: HTMLElement, call: (e: PointerEvent) => void) {
  let timer = 0;
  let startX = 0;
  let startY = 0;
  const cancel = () => clearTimeout(timer);
  el.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    cancel();
    timer = window.setTimeout(() => call(e), 500);
  });
  el.addEventListener("pointermove", (e) => Math.hypot(e.clientX - startX, e.clientY - startY) > SLOP && cancel());
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) el.addEventListener(type, cancel);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

/** A drag: it starts once the pointer has left the slop, then owns the pointer until it is released. */
function pan(id: number, el: HTMLElement) {
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let active = false;
  let samples: { t: number; x: number; y: number }[] = [];
  const emit = (state: number, e: PointerEvent) => {
    const now = performance.now();
    samples.push({ t: now, x: e.clientX, y: e.clientY });
    samples = samples.filter((s) => now - s.t <= 100);
    const first = samples[0]!;
    const dt = (now - first.t) / 1000;
    const point = pointerAt(el, e);
    run(() => wasm.nuclo_pan(id, state, e.clientX - startX, e.clientY - startY, dt > 0 ? (e.clientX - first.x) / dt : 0, dt > 0 ? (e.clientY - first.y) / dt : 0, point.x, point.y));
  };
  el.addEventListener("pointerdown", (e) => {
    if (pointerId !== -1) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    active = false;
    samples = [];
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    if (!active) {
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < SLOP) return;
      active = true;
      el.setPointerCapture(pointerId);
      // The translation counts from where the drag was recognized, so the view does not jump.
      startX = e.clientX;
      startY = e.clientY;
      return emit(0, e);
    }
    emit(1, e);
  });
  const end = (state: number) => (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = -1;
    if (active) emit(state, e);
    active = false;
  };
  el.addEventListener("pointerup", end(2));
  el.addEventListener("pointercancel", end(3));
}

function pinch(id: number, el: HTMLElement) {
  const points = new Map<number, PointerEvent>();
  let startDistance = 0;
  let scale = 1;
  const call = (state: number, s: number, x: number, y: number) => run(() => wasm.nuclo_pinch(id, state, s, x, y));
  const measure = () => {
    const [a, b] = [...points.values()];
    const rect = el.getBoundingClientRect();
    return { distance: Math.hypot(a!.clientX - b!.clientX, a!.clientY - b!.clientY), x: (a!.clientX + b!.clientX) / 2 - rect.left, y: (a!.clientY + b!.clientY) / 2 - rect.top };
  };
  el.addEventListener("pointerdown", (e) => {
    points.set(e.pointerId, e);
    if (points.size !== 2) return;
    el.setPointerCapture(e.pointerId);
    const m = measure();
    startDistance = m.distance || 1;
    scale = 1;
    call(0, scale, m.x, m.y);
  });
  el.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) return;
    points.set(e.pointerId, e);
    if (points.size !== 2) return;
    const m = measure();
    scale = m.distance / startDistance;
    call(1, scale, m.x, m.y);
  });
  const end = (state: number) => (e: PointerEvent) => {
    if (points.size === 2 && points.has(e.pointerId)) {
      const m = measure();
      call(state, scale, m.x, m.y);
    }
    points.delete(e.pointerId);
  };
  el.addEventListener("pointerup", end(2));
  el.addEventListener("pointercancel", end(3));
  // A trackpad pinch (and ctrl + wheel) arrives as wheel events: each one is a whole small gesture.
  let wheelScale = 1;
  let wheelTimer = 0;
  el.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const point = pointerAt(el, e);
      const starting = wheelTimer === 0;
      if (starting) wheelScale = 1;
      wheelScale *= Math.exp(-e.deltaY / 100);
      call(starting ? 0 : 1, wheelScale, point.x, point.y);
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelTimer = 0;
        call(2, wheelScale, point.x, point.y);
      }, 150);
    },
    { passive: false },
  );
}

// ---------------------------------------------------------------------------
// Layout, frames and timers
// ---------------------------------------------------------------------------

let layoutQueued = false;
const afterLayout: (() => void)[] = [];

/** The roots' frames are stale: lay them out once the current turn is done. */
function requestLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  queueMicrotask(() => run(layoutPass));
}

function layoutPass() {
  layoutQueued = false;
  for (const [id, root] of roots) {
    const v = views[id];
    if (!v) {
      roots.delete(id);
      continue;
    }
    const width = root.box.clientWidth;
    const available = root.box.clientHeight;
    if (!width || !available) continue;
    // A screen is as tall as its content, or the window; a root that scrolls itself fills the window.
    const height = root.overlay || v.host !== v.el ? available : Math.max(available, Math.ceil(wasm.nuclo_measure_root(id, width)));
    placeView(v, 0, 0, width, height);
    wasm.nuclo_layout_root(id, width, height);
    if (!root.overlay && v.host === v.el) wasm.nuclo_screen_scrolled(id, root.box.scrollTop, available);
  }
  flushStyles();
  // What was asked to wait for the frame: timers that came due while the layout was stale.
  for (let call = afterLayout.shift(); call; call = afterLayout.shift()) call();
}

function placeView(v: View, x: number, y: number, w: number, h: number) {
  if (v.x === x && v.y === y && v.w === w && v.h === h) return;
  v.x = x;
  v.y = y;
  v.w = w;
  v.h = h;
  v.frame = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  apply(v);
}

const timers = new Map<number, number>();
const frames = new Set<number>();
let frameScheduled = false;

function tickFrames() {
  frameScheduled = false;
  const due = [...frames];
  frames.clear();
  for (const id of due) run(() => wasm.nuclo_frame(id));
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

interface Page {
  root: number;
  title: string;
  header: boolean;
  modal: boolean;
  el: HTMLElement;
}

interface Navigation {
  stacks: Page[][];
  active: number;
  bar: HTMLElement;
  title: HTMLElement;
  back: HTMLElement;
  stack: HTMLElement;
  tabs: HTMLElement[];
}

let nav: Navigation | null = null;

const GLYPHS: Record<string, string> = { home: "⌂", list: "☰", cloud: "☁", star: "★", person: "◉", settings: "⚙", search: "⌕" };

const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "") => Object.assign(document.createElement(tag), { className });

function screenOf(root: number, modal: boolean): HTMLElement {
  const el = make("div", modal ? "nuclo-screen nuclo-sheet" : "nuclo-screen");
  el.append(view(root).el);
  // For the route's onEndReached.
  el.addEventListener("scroll", () => run(() => wasm.nuclo_screen_scrolled(root, el.scrollTop, el.clientHeight)), { passive: true });
  roots.set(root, { box: el, overlay: false });
  return el;
}

function pageOf(root: number, title: string, flags: number): Page {
  const modal = (flags & 1) !== 0;
  return { root, title, header: (flags & 2) !== 0, modal, el: screenOf(root, modal) };
}

function navCreate(tabs: { title: string; icon: string }[], active: number) {
  const bar = make("div", "nuclo-bar");
  const back = Object.assign(make("button", "nuclo-back"), { textContent: "←", onclick: () => back_() });
  back.setAttribute("aria-label", "Back");
  const title = make("div");
  bar.append(back, title);
  const stack = make("div", "nuclo-stack");
  main.replaceChildren(bar, stack);
  const state: Navigation = { stacks: (tabs.length ? tabs : [0]).map(() => []), active, bar, title, back, stack, tabs: [] };
  if (tabs.length) {
    const bottom = make("div", "nuclo-tabs");
    tabs.forEach((tab, at) => {
      const item = Object.assign(make("button"), { textContent: `${GLYPHS[tab.icon] ?? "●"}\n${tab.title}`, onclick: () => selectTab(at) });
      state.tabs.push(item);
      bottom.append(item);
    });
    main.append(bottom);
  }
  nav = state;
}

/** The back button: the active stack's top screen leaves. */
function back_() {
  if (!nav) return;
  const stack = nav.stacks[nav.active]!;
  if (stack.length < 2) return;
  const popped = stack.pop()!;
  show(-1, popped);
  run(() => wasm.nuclo_nav_popped(nav!.active, popped.root));
}

function selectTab(at: number) {
  if (!nav || at === nav.active) return;
  nav.active = at;
  show(0);
  run(() => wasm.nuclo_nav_tab(at));
}

/** Shows the active stack's top screen: slid in on a push (+1), out on a pop (-1). */
function show(direction: number, popped?: Page) {
  if (!nav) return;
  const stack = nav.stacks[nav.active]!;
  const top = stack.at(-1);
  if (!top) return;
  const slide = (page: Page, from: string, to: string, done: () => void) => {
    const axis = page.modal ? "Y" : "X";
    const animation = page.el.animate([{ transform: `translate${axis}(${from})` }, { transform: `translate${axis}(${to})` }], { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" });
    // A timer, not the animation's end: a hidden tab does not run animations, and the stack must still settle.
    setTimeout(() => {
      animation.cancel();
      done();
    }, 240);
  };
  const hostOf = (page: Page) => (page.modal ? main : nav!.stack);
  if (direction > 0) {
    hostOf(top).append(top.el);
    slide(top, "100%", "0", () => {
      for (const el of [...nav!.stack.children]) if (el !== top.el && !top.modal) el.remove();
    });
  } else if (direction < 0 && popped) {
    if (!top.el.isConnected) nav.stack.prepend(top.el);
    slide(popped, "0", "100%", () => {
      popped.el.remove();
      roots.delete(popped.root);
    });
  } else {
    for (const el of [...main.querySelectorAll(".nuclo-sheet")]) el.remove();
    nav.stack.replaceChildren(top.el);
  }
  nav.title.textContent = top.title;
  nav.bar.style.display = top.header ? "" : "none";
  nav.back.style.visibility = stack.length > 1 ? "visible" : "hidden";
  nav.back.style.width = stack.length > 1 ? "" : "20px";
  nav.tabs.forEach((el, at) => el.classList.toggle("active", at === nav!.active));
  document.title = top.title || document.title;
  requestLayout();
}

// ---------------------------------------------------------------------------
// The imports of the module
// ---------------------------------------------------------------------------

const natives = new Map<number, { component: NativeComponent<never>; el: HTMLElement }>();
let nextNative = 1;

/** A function prop of a native component was called with `args`. */
function callback(id: number, args: unknown[]) {
  run(() => sendText(JSON.stringify(args), (ptr, len) => wasm.nuclo_callback(id, ptr, len)));
}

/** A function the app declared with `declare function`: the page's own, exported by native/. */
function callFunction(name: string, args: string): unknown {
  const fn = registry.functions[name];
  if (typeof fn !== "function") throw new Error(`no native function "${name}": native/web/index.ts must export it`);
  return fn(...(JSON.parse(args) as unknown[]));
}

const imports = {
  view_create: createView,
  view_destroy(id: number) {
    views[id]?.el.remove();
    views[id] = undefined;
    roots.delete(id);
  },
  view_children(parentId: number, ptr: number, len: number) {
    const parent = view(parentId);
    const ids = new Uint32Array(wasm.memory.buffer, ptr, len).slice();
    const wanted = new Set(ids);
    for (const old of parent.kids) {
      // A view the core already moved elsewhere is not this parent's to remove.
      const el = views[old]?.el;
      if (el && !wanted.has(old) && el.parentNode === parent.host) el.remove();
    }
    for (const id of ids) {
      const el = view(id).el;
      if (el.parentNode !== parent.host) parent.host.append(el);
    }
    parent.kids = [...ids];
  },
  view_reorder(parentId: number, ptr: number, len: number) {
    const parent = view(parentId);
    for (const id of new Uint32Array(wasm.memory.buffer, ptr, len).slice()) parent.host.append(view(id).el);
  },
  view_frame(id: number, x: number, y: number, w: number, h: number) {
    const v = view(id);
    // The scrolled content of a box is as large as its content size says, wherever the box is.
    placeView(v, x, y, w, h);
  },
  view_style(id: number, ptr: number, len: number) {
    const v = view(id);
    v.box = read(ptr, len);
    apply(v);
  },
  view_text_style(id: number, ptr: number, len: number) {
    const v = view(id);
    v.text = read(ptr, len);
    apply(v);
  },
  view_measure(id: number, maxWidth: number, out: number) {
    const [w, h] = measureView(view(id), maxWidth);
    const size = new Float32Array(wasm.memory.buffer, out, 2);
    size[0] = w;
    size[1] = h;
  },
  view_scrollable(id: number, horizontal: number) {
    const v = view(id);
    const content = make("div", "n");
    content.style.cssText = "left:0;top:0;pointer-events:none";
    v.el.append(content);
    v.host = content;
    v.el.classList.add("scroll");
    v.extra += `pointer-events:auto;${horizontal ? "overflow-x:auto;overflow-y:hidden;scrollbar-width:none;" : "overflow-y:auto;overflow-x:hidden;"}`;
    apply(v);
  },
  view_content_size(id: number, w: number, h: number) {
    const content = view(id).host;
    content.style.width = `${w}px`;
    content.style.height = `${h}px`;
  },
  view_text(id: number, ptr: number, len: number) {
    const v = view(id);
    v.words = read(ptr, len);
    v.el.textContent = v.words;
  },
  view_value(id: number, ptr: number, len: number) {
    const field = view(id).el as HTMLInputElement;
    const text = read(ptr, len);
    // Never reset what the user is typing to the same text: the caret would jump.
    if (field.value !== text) field.value = text;
  },
  view_placeholder(id: number, ptr: number, len: number) {
    (view(id).el as HTMLInputElement).placeholder = read(ptr, len);
  },
  view_input_type(id: number, ptr: number, len: number) {
    (view(id).el as HTMLInputElement).type = read(ptr, len);
  },
  view_label(id: number, ptr: number, len: number) {
    view(id).el.setAttribute("aria-label", read(ptr, len));
  },
  view_image_url(id: number, ptr: number, len: number) {
    (view(id).el as HTMLImageElement).src = read(ptr, len);
  },
  view_image(id: number, ptr: number, len: number) {
    const v = view(id);
    if (v.image) URL.revokeObjectURL(v.image);
    v.image = URL.createObjectURL(new Blob([new Uint8Array(wasm.memory.buffer, ptr, len).slice()]));
    (v.el as HTMLImageElement).src = v.image;
  },
  view_checked(id: number, on: number) {
    (view(id).el as HTMLInputElement).checked = on !== 0;
  },
  view_enabled(id: number, on: number) {
    const v = view(id);
    if (v.kind === BUTTON || v.kind === INPUT || v.kind === CHECKBOX || v.kind === TEXTAREA) (v.el as HTMLInputElement).disabled = on === 0;
    v.el.classList.toggle("off", on === 0);
  },
  view_listen: listen,
  view_adopt(id: number, handle: number) {
    // The component's element sits in a box of the host's, which the core places and paints: the host
    // writes that box's whole style on every change, and would erase what the component sets on its element.
    const inner = natives.get(handle)!.el;
    inner.style.cssText += ";position:absolute;left:0;top:0;width:100%;height:100%";
    const box = make("div", "n k7");
    box.append(inner);
    wire(id, box, NATIVE);
  },
  native_create(ptr: number, len: number) {
    const name = read(ptr, len);
    const handle = nextNative++;
    const factory = registry.components.get(name);
    if (!factory) console.error(`nuclo: no native component "${name}" is registered (native/web/index.ts: registerNative("${name}", …))`);
    const component = factory?.() ?? { create: () => document.createElement("div"), update() {} };
    natives.set(handle, { component, el: component.create() });
    return handle;
  },
  native_update(handle: number, ptr: number, len: number) {
    const native = natives.get(handle)!;
    // A function prop arrives as {"$cb": id}: the function the core's closure answers.
    const props = JSON.parse(read(ptr, len), (_, value) => (value && typeof value === "object" && "$cb" in value ? (...args: unknown[]) => callback(value.$cb as number, args) : value));
    native.component.update(native.el, props as never);
  },
  native_destroy(handle: number) {
    const native = natives.get(handle);
    native?.component.destroy?.(native.el);
    natives.delete(handle);
  },
  native_call_sync(np: number, nl: number, ap: number, al: number, out: number) {
    const name = read(np, nl);
    let ok = 1;
    let text: string;
    try {
      text = JSON.stringify(callFunction(name, read(ap, al)) ?? null);
    } catch (error) {
      ok = 0;
      text = String(error);
    }
    // The result is written into memory the module owns, which it frees once it has read it.
    const bytes = encoder.encode(text);
    const ptr = wasm.nuclo_alloc(bytes.length);
    new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
    new Uint32Array(wasm.memory.buffer, out, 3).set([ptr, bytes.length, ok]);
  },
  native_call(id: number, np: number, nl: number, ap: number, al: number) {
    const name = read(np, nl);
    const args = read(ap, al);
    const done = (ok: number, text: string) => run(() => sendText(text, (ptr, len) => wasm.nuclo_native_done(id, ok, ptr, len)));
    Promise.resolve()
      .then(() => callFunction(name, args))
      .then((result) => done(1, JSON.stringify(result ?? null)), (error) => done(0, String(error)));
  },
  open_url(ptr: number, len: number) {
    window.open(read(ptr, len), "_blank", "noopener,noreferrer");
  },
  screen_show(root: number) {
    nav = null;
    main.replaceChildren(screenOf(root, false));
    requestLayout();
  },
  overlay_show(root: number) {
    layer.append(view(root).el);
    roots.set(root, { box: layer, overlay: true });
    requestLayout();
  },
  layout_request: requestLayout,
  viewport_width: () => innerWidth,
  nav_create(ptr: number, len: number, active: number) {
    const list = read(ptr, len);
    navCreate(
      list ? list.split("\n").map((line) => ({ title: line.split("\t")[0]!, icon: line.split("\t")[1] ?? "" })) : [],
      active,
    );
  },
  nav_push(tab: number, root: number, ptr: number, len: number, flags: number) {
    if (!nav) return;
    nav.stacks[tab]!.push(pageOf(root, read(ptr, len), flags));
    if (tab === nav.active) show(1);
  },
  nav_pop(tab: number) {
    if (!nav) return;
    const stack = nav.stacks[tab]!;
    const popped = stack.pop();
    if (!popped) return;
    if (tab === nav.active) show(-1, popped);
    // Every pop is reported, the app's as well as the user's.
    run(() => wasm.nuclo_nav_popped(tab, popped.root));
  },
  nav_replace(tab: number, root: number, ptr: number, len: number, flags: number) {
    if (!nav) return;
    for (const page of nav.stacks[tab]!) {
      page.el.remove();
      roots.delete(page.root);
    }
    nav.stacks[tab] = [pageOf(root, read(ptr, len), flags)];
    if (tab === nav.active) show(0);
  },
  nav_select(tab: number) {
    if (!nav || tab === nav.active) return;
    nav.active = tab;
    show(0);
  },
  timer_set(id: number, ms: number) {
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        // After the frame that shows what changed before the timer was due.
        const fire = () => run(() => wasm.nuclo_timer(id));
        if (layoutQueued) afterLayout.push(fire);
        else fire();
      }, ms),
    );
  },
  timer_clear(id: number) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  },
  frame_request(id: number) {
    frames.add(id);
    if (!frameScheduled) {
      frameScheduled = true;
      requestAnimationFrame(tickFrames);
    }
  },
  frame_cancel(id: number) {
    frames.delete(id);
  },
  wake() {
    queueMicrotask(() => run(() => wasm.nuclo_wake()));
  },
  now: () => Date.now(),
  log(ptr: number, len: number, error: number) {
    (error ? console.error : console.log)(read(ptr, len));
  },
  http(id: number, mp: number, ml: number, up: number, ul: number, hp: number, hl: number, bp: number, bl: number, hasBody: number) {
    const method = read(mp, ml);
    const url = read(up, ul);
    const headers = new Headers();
    for (const line of read(hp, hl).split("\n")) {
      const colon = line.indexOf(":");
      if (colon > 0) headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim());
    }
    const body = hasBody ? read(bp, bl) : undefined;
    const done = (status: number, data: Uint8Array, ok: number) =>
      run(() => send(data, (ptr, len) => wasm.nuclo_http_done(id, status, ptr, len, ok)));
    fetch(url, { method, headers, body }).then(
      async (response) => done(response.status, new Uint8Array(await response.arrayBuffer()), 1),
      (error) => done(0, encoder.encode(String(error instanceof Error ? error.message : error)), 0),
    );
  },
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

/** With `?profile` in the address, `nucloProfile()` lists the time spent in each import (the rest of a call's time is the core's). */
function profile() {
  const totals: Record<string, [number, number]> = {};
  const table = imports as Record<string, (...args: never[]) => unknown>;
  for (const name of Object.keys(table)) {
    const call = table[name]!;
    table[name] = (...args) => {
      const started = performance.now();
      try {
        return call(...args);
      } finally {
        const total = (totals[name] ??= [0, 0]);
        total[0] += performance.now() - started;
        total[1]++;
      }
    };
  }
  Object.assign(window, {
    /** The canvas's size of some text and the browser's layout of it, to check they agree. */
    nucloMeasure: (css: string, content: string, maxWidth: number) => [quick(css, content, maxWidth), slow(css, content, maxWidth)],
    nucloProfile: () => Object.entries(totals).sort((a, b) => b[1][0] - a[1][0]).map(([name, [ms, calls]]) => `${name} ${ms.toFixed(1)} ms in ${calls} calls`).join("\n"),
    nucloProfileReset: () => Object.keys(totals).forEach((name) => delete totals[name]),
  });
}

async function start() {
  document.head.append(Object.assign(make("style"), { textContent: CSS }));
  container = Object.assign(make("div"), { id: "nuclo" });
  main = make("div", "nuclo-main");
  layer = make("div", "nuclo-layer");
  container.append(main, layer);
  document.body.append(container);
  const frame = Object.assign(make("iframe"), { srcdoc: "<!doctype html><body style='margin:0'>" });
  frame.style.cssText = "position:fixed;left:-100px;top:0;width:10px;height:10px;border:0;visibility:hidden";
  await new Promise((resolve) => {
    frame.onload = resolve;
    document.body.append(frame);
  });
  probeEl = frame.contentDocument!.body.appendChild(frame.contentDocument!.createElement("div"));
  // Laid out again whenever the window changes size.
  new ResizeObserver(requestLayout).observe(container);

  if (location.search.includes("profile")) profile();
  const url = new URL("app.wasm", import.meta.url);
  const response = await fetch(url);
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), { nuclo: imports });
  wasm = instance.exports as unknown as Exports;
  run(() => wasm.nuclo_start());
}

start();
