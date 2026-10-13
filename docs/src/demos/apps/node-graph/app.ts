// app.ts: the editor. The nodes are HTML boxes in a list() over the shown
// function's node objects, and the wires are SVG paths in a list() over its
// wire objects, drawn from the same x and y. A drag writes x and y and calls
// update("ng-canvas"), which leaves the toolbar and the side panel alone. An
// edit runs the graph again, then calls update(). The run count on screen
// shows that moving things never runs it.
import "nuclo";
import { run } from "./engine.ts";
import { addFunction, addNode, callers, COMPARE, connect, disconnect, functions, inputs, LOGIC, MATH, outputs, params, removeFunction, removeNode, results, wireInto, type Fn, type GraphNode, type Kind, type Value, type View, type Wire } from "./graph.ts";
import { HEAD, ROW, W, s } from "./styles.ts";

const TITLES: Record<Kind, string> = { number: "Number", text: "Text", switch: "Switch", math: "Math", compare: "Compare", logic: "Logic", not: "Not", if: "If", input: "Input", output: "Output", call: "Call" };
const GROUPS: { label: string; kinds: Kind[] }[] = [
  { label: "Values", kinds: ["number", "text", "switch"] },
  { label: "Operators", kinds: ["math", "compare", "logic", "not"] },
  { label: "Conditional", kinds: ["if"] },
  { label: "Function ports", kinds: ["input", "output"] },
];
const TONE: Record<Kind, keyof typeof s> = { number: "value", text: "value", switch: "value", math: "op", compare: "op", logic: "op", not: "op", if: "flow", input: "port", output: "port", call: "call" };
const OPS: Partial<Record<Kind, string[]>> = { math: Object.keys(MATH), compare: Object.keys(COMPARE), logic: LOGIC };

let fn = functions[0]; // the function on the canvas
let trail = [{ fn }]; // how you got here: Open on a Call goes one level deeper. Wrapped, since a function can appear twice.
let result = run(fn);
let runs = 1;
let selected: GraphNode | null = null;
let notice = "";
let canvasEl: HTMLElement | null = null;
let drag:
  | { kind: "pan"; x: number; y: number; from: View } // where the pointer went down, and the view then
  | { kind: "node"; node: GraphNode; dx: number; dy: number } // the grab point, inside the node
  | { kind: "wire"; from: GraphNode; out: number; x: number; y: number; over: GraphNode | null } // the loose end
  | null = null;

const HOME: View = { x: 24, y: 24, zoom: 1 };
const view = () => fn.view ?? HOME;

/** An edit: run the graph again and show everything it changed. */
function edited() {
  result = run(fn);
  runs++;
  update();
}

function enter(next: Fn) {
  fn = next;
  selected = null;
  notice = "";
  if (!fn.view) fit(fn);
  edited();
}

function show(next: Fn, deeper = false) {
  trail = deeper ? [...trail, { fn: next }] : [{ fn: next }];
  enter(next);
}

// ── Geometry ─────────────────────────────────────────────────────────────

const rows = (n: GraphNode) => Math.max(inputs(n).length, outputs(n).length, 1) + (n.kind === "input" || n.kind === "output" ? 1 : 0);
const portY = (n: GraphNode, i: number) => n.y + HEAD + i * ROW + ROW / 2;

function curve(x1: number, y1: number, x2: number, y2: number) {
  const d = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + d},${y1} ${x2 - d},${y2} ${x2},${y2}`;
}
const path = (w: Wire) => curve(w.from.x + W, portY(w.from, w.out), w.to.x, portY(w.to, w.in));

/** Pointer to canvas coordinates: undo the view's pan and zoom. */
function world(e: MouseEvent): [number, number] {
  const r = canvasEl!.getBoundingClientRect();
  const v = view();
  return [(e.clientX - r.left - v.x) / v.zoom, (e.clientY - r.top - v.y) / v.zoom];
}

function fit(f: Fn) {
  const w = canvasEl?.clientWidth || 800;
  const h = canvasEl?.clientHeight || 500;
  if (!f.nodes.length) return void (f.view = { ...HOME });
  const x0 = Math.min(...f.nodes.map((n) => n.x));
  const y0 = Math.min(...f.nodes.map((n) => n.y));
  const x1 = Math.max(...f.nodes.map((n) => n.x + W));
  const y1 = Math.max(...f.nodes.map((n) => n.y + HEAD + rows(n) * ROW));
  const zoom = Math.max(0.3, Math.min(1, (w - 48) / (x1 - x0), (h - 72) / (y1 - y0)));
  f.view = { zoom, x: (w - (x1 - x0) * zoom) / 2 - x0 * zoom, y: (h - 24 - (y1 - y0) * zoom) / 2 - y0 * zoom };
}

function zoomAt(px: number, py: number, factor: number) {
  const v = view();
  const zoom = Math.min(2, Math.max(0.25, v.zoom * factor));
  fn.view = { zoom, x: px - ((px - v.x) * zoom) / v.zoom, y: py - ((py - v.y) * zoom) / v.zoom }; // the point under the pointer stays put
}

const nodeAt = (e: MouseEvent) => {
  const id = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-node]")?.dataset.node;
  return fn.nodes.find((n) => String(n.id) === id) ?? null;
};

// ── Editing ──────────────────────────────────────────────────────────────

function place(kind: Kind, fields: Partial<GraphNode> = {}) {
  const v = view();
  const step = (fn.nodes.length % 5) * 18; // a few in a row do not land on top of each other
  const x = ((canvasEl?.clientWidth ?? 800) / 2 - v.x) / v.zoom - W / 2 + step;
  const y = ((canvasEl?.clientHeight ?? 500) / 2 - v.y) / v.zoom - 60 + step;
  selected = addNode(fn, kind, Math.round(x), Math.round(y), fields);
  edited();
}

function remove(node: GraphNode) {
  removeNode(fn, node);
  if (selected === node) selected = null;
  edited();
}

// Every drag captures the pointer on the canvas, so the canvas hears the moves
// and the release wherever the pointer goes.
function capture(e: PointerEvent, next: NonNullable<typeof drag>) {
  e.stopPropagation();
  drag = next;
  notice = "";
  canvasEl!.setPointerCapture(e.pointerId);
  update("ng-canvas");
}

function grabNode(e: PointerEvent, node: GraphNode) {
  if (e.button !== 0) return;
  e.stopPropagation();
  selected = node;
  if ((e.target as Element).closest("input, select, button, label")) return update("ng-canvas"); // the control keeps the pointer
  const [x, y] = world(e);
  capture(e, { kind: "node", node, dx: x - node.x, dy: y - node.y });
}

function grabOutput(e: PointerEvent, node: GraphNode, out: number) {
  if (e.button !== 0) return;
  const [x, y] = world(e);
  capture(e, { kind: "wire", from: node, out, x, y, over: null });
}

// Grabbing a wired input pulls the wire off it, still attached to its source.
function grabInput(e: PointerEvent, node: GraphNode, i: number) {
  const w = wireInto(fn, node, i);
  if (e.button !== 0 || !w) return;
  disconnect(fn, w);
  const [x, y] = world(e);
  capture(e, { kind: "wire", from: w.from, out: w.out, x, y, over: node });
  edited();
}

function moved(e: PointerEvent) {
  if (!drag) return;
  if (drag.kind === "pan") fn.view = { ...drag.from, x: drag.from.x + e.clientX - drag.x, y: drag.from.y + e.clientY - drag.y };
  else if (drag.kind === "node") {
    const [x, y] = world(e);
    drag.node.x = Math.round(x - drag.dx);
    drag.node.y = Math.round(y - drag.dy);
  } else {
    [drag.x, drag.y] = world(e);
    drag.over = nodeAt(e);
  }
  update("ng-canvas");
}

// A wire dropped anywhere on a node goes into the input nearest the pointer.
function released(e: PointerEvent) {
  const loose = drag?.kind === "wire" ? drag : null;
  drag = null;
  const to = loose && nodeAt(e);
  if (!loose || !to || !inputs(to).length) return update("ng-canvas");
  const i = Math.max(0, Math.min(inputs(to).length - 1, Math.floor((world(e)[1] - to.y - HEAD) / ROW)));
  if (!connect(fn, loose.from, loose.out, to, i)) notice = "That wire would make a loop: a node can't wait for its own value. A Call can, so recurse with one.";
  edited();
}

// ── Values ───────────────────────────────────────────────────────────────

function fmt(v: Value | undefined) {
  if (v === undefined) return "—";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return String(v);
  return Math.abs(v) >= 1e15 ? v.toExponential(3) : v.toLocaleString("en", { maximumFractionDigits: 4 });
}

const tone = (v: Value | undefined) => (typeof v === "number" ? s.num : typeof v === "string" ? s.str : v === true ? s.yes : v === false ? s.no : null);

// A typed test value: a number, true or false, or else text.
const parse = (text: string): Value => (text === "true" ? true : text === "false" ? false : text.trim() !== "" && !Number.isNaN(Number(text)) ? Number(text) : text);

// ── Nodes ────────────────────────────────────────────────────────────────

const Field = (label: string, value: string, write: (text: string) => void, rerun = true) =>
  input(s.field, { value, "aria-label": label, onInput: (e) => { write(e.currentTarget.value); if (rerun) edited(); else update(); } });

// The middle of row i: the node's own field, if it has one there. Built once:
// a field keeps what you type, and update() never writes it back.
function control(node: GraphNode, i: number): NodeModLike[] {
  const ops = OPS[node.kind];
  if (ops && i === 0) {
    return [select(s.select, { "aria-label": "Operator", onChange: (e) => { node.op = e.currentTarget.value; edited(); } }, ...ops.map((op) => option({ value: op, selected: op === node.op }, op)))];
  }
  if (i === 0) {
    switch (node.kind) {
      case "number": return [input(s.field, { type: "number", value: String(node.value), "aria-label": "Number", onInput: (e) => { node.value = e.currentTarget.valueAsNumber || 0; edited(); } })];
      case "text": return [Field("Text", String(node.value), (t) => (node.value = t))];
      case "switch": return [label(s.toggle, input({ type: "checkbox", checked: () => node.value === true, onChange: (e) => { node.value = e.currentTarget.checked; edited(); } }), span(() => String(node.value)))];
      case "input": return [Field("Parameter name", node.name, (t) => (node.name = t), false)];
      case "output": return [Field("Result name", node.name, (t) => (node.name = t), false)];
    }
  }
  if (node.kind === "input") return [span(s.label, "test"), Field("Test value", String(node.value), (t) => (node.value = parse(t)))];
  if (node.kind === "output") {
    return [div(s.big, { title: () => result.errors.get(node) ?? "" }, () => (result.errors.has(node) ? "stopped" : fmt(result.values.get(node)?.[0])))];
  }
  return [];
}

function Row(node: GraphNode, i: number) {
  const named = OPS[node.kind] || node.kind === "not" || node.kind === "if" || node.kind === "call"; // ports with labels and values
  return div(
    s.row,
    when(
      () => i < inputs(node).length,
      span(s.socket, s.in, { title: () => `Input: ${inputs(node)[i]}`, onPointerDown: (e) => grabInput(e, node, i) }),
      named ? span(s.label, () => inputs(node)[i] ?? "") : null,
    ),
    ...control(node, i),
    when(
      () => i < outputs(node).length,
      named ? span(s.result, node.kind === "call" ? span(s.label, () => outputs(node)[i] ?? "") : null, span(() => (result.errors.has(node) ? "!" : fmt(result.values.get(node)?.[i])))) : null,
      span(s.socket, s.out, { title: () => `Output: ${outputs(node)[i]}. Drag to an input.`, onPointerDown: (e) => grabOutput(e, node, i) }),
    ),
  );
}

function NodeView(node: GraphNode) {
  return div(
    s.node,
    {
      "data-node": String(node.id),
      class: () => cx(s.node, s[TONE[node.kind]], result.live.has(node) ? null : s.dim, result.errors.has(node) ? s.failed : null, node === selected ? s.selected : null, drag?.kind === "wire" && drag.over === node ? s.target : null).className,
      style: () => ({ transform: `translate(${node.x}px, ${node.y}px)` }),
      title: () => result.errors.get(node) ?? "",
      onPointerDown: (e) => grabNode(e, node),
    },
    div(
      s.head,
      span(s.dot),
      span(s.title, () => (node.kind === "call" ? `${node.fn!.name}()` : TITLES[node.kind])),
      node.kind === "call" ? button(s.icon, { title: `Open ${node.fn!.name}`, "aria-label": "Open this function", onClick: () => show(node.fn!, true) }, "↗") : null,
      button(s.icon, { title: "Delete node (Delete)", "aria-label": "Delete node", onClick: () => remove(node) }, "×"),
    ),
    // A Call grows a row when its function gets a parameter: rows are plain indexes, so the others stay.
    list(() => Array.from({ length: rows(node) }, (_, i) => i), (i) => Row(node, i)),
  );
}

// Each wire is two paths: the one you see, colored by the value on it, and a
// wide invisible one that is easy to hit. Clicking it cuts the wire.
const WireView = (w: Wire) =>
  gSvg(
    s.link,
    pathSvg(s.wire, { d: () => path(w), class: () => cx(s.wire, tone(result.values.get(w.from)?.[w.out]), result.wires.has(w) ? null : s.faint).className }),
    pathSvg(s.hit, { d: () => path(w), onPointerDown: (e) => { if (e.button !== 0) return; e.stopPropagation(); disconnect(fn, w); edited(); } }),
  );

function Canvas() {
  return div(
    s.canvas,
    scope("ng-canvas"),
    {
      style: () => ({ backgroundSize: `${20 * view().zoom}px ${20 * view().zoom}px`, backgroundPosition: `${view().x}px ${view().y}px` }),
      onPointerDown: (e) => {
        if (e.button !== 0 || (e.target as Element).closest("button")) return;
        selected = null;
        capture(e, { kind: "pan", x: e.clientX, y: e.clientY, from: view() });
      },
      onPointerMove: moved,
      onPointerUp: released,
      onLostPointerCapture: () => { if (drag) { drag = null; update("ng-canvas"); } }, // the browser cancelled it
    },
    // Scroll pans, like a page. Pinch, or Ctrl or ⌘ with the wheel, zooms. Not passive: the page must not scroll or zoom too.
    on("wheel", (e) => {
      e.preventDefault();
      const r = canvasEl!.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01));
      else fn.view = { ...view(), x: view().x - e.deltaX, y: view().y - e.deltaY };
      update("ng-canvas");
    }, { passive: false }),
    on("mount", (el) => {
      canvasEl = el;
      requestAnimationFrame(() => { if (canvasEl && !fn.view) { fit(fn); update("ng-canvas"); } });
      return () => { canvasEl = null; drag = null; }; // a drag cut short by closing the example must not go on at the next visit
    }),
    div(
      s.world,
      { style: () => ({ transform: `translate(${view().x}px, ${view().y}px) scale(${view().zoom})` }) },
      svgSvg(
        s.wires,
        { "aria-hidden": "true" },
        list(() => fn.wires, WireView),
        pathSvg(s.wire, s.loose, { d: () => (drag?.kind === "wire" ? curve(drag.from.x + W, portY(drag.from, drag.out), drag.x, drag.y) : "") }),
      ),
      list(() => fn.nodes, NodeView),
    ),
    p(s.hint, when(() => notice !== "", span(s.notice, () => notice)).else("Drag from an output dot to a node. Click a wire to cut it. Drag the background or scroll to pan; pinch or ⌘/Ctrl + scroll to zoom.")),
    div(
      s.zoom,
      button(s.btn, { "aria-label": "Zoom out", onClick: () => { const r = canvasEl!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1 / 1.25); update("ng-canvas"); } }, "−"),
      button(s.btn, { title: "Fit the graph in view", onClick: () => { fit(fn); update("ng-canvas"); } }, () => `${Math.round(view().zoom * 100)}%`),
      button(s.btn, { "aria-label": "Zoom in", onClick: () => { const r = canvasEl!.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, 1.25); update("ng-canvas"); } }, "+"),
    ),
  );
}

// ── Panels ───────────────────────────────────────────────────────────────

const signature = (f: Fn) => `(${params(f).map((n) => n.name).join(", ")}) → ${results(f).map((n) => n.name).join(", ") || "nothing"}`;

const FnItem = (f: Fn) =>
  button(
    s.fn,
    { class: () => cx(s.fn, f === fn ? s.current : null).className, "aria-current": () => String(f === fn), onClick: () => show(f) },
    span(() => f.name),
    span(s.sig, () => signature(f)),
  );

function Side() {
  return aside(
    s.side,
    div(
      s.section,
      h3("Functions"),
      list(() => functions, FnItem),
      button(s.btn, { onClick: () => show(addFunction()) }, "+ New function"),
    ),
    div(
      s.section,
      h3("Add node"),
      ...GROUPS.map((g) => div(s.group, span(g.label), ...g.kinds.map((k) => button(s.add, s[TONE[k]], { onClick: () => place(k) }, TITLES[k])))),
      div(s.group, span("Call"), list(() => functions, (f) => button(s.add, s.call, { title: `Call ${f.name}`, onClick: () => place("call", { fn: f }) }, () => f.name))),
    ),
  );
}

function Bar() {
  const users = () => callers(fn).length;
  return div(
    s.bar,
    nav(
      s.crumbs,
      { "aria-label": "Call path" },
      list(() => trail, (c) => span(
        when(() => trail.indexOf(c) > 0, span({ "aria-hidden": "true" }, "›")),
        button(s.crumb, { "aria-current": () => String(c === trail.at(-1)), onClick: () => { trail = trail.slice(0, trail.indexOf(c) + 1); enter(c.fn); } }, () => c.fn.name),
      )),
    ),
    input(s.name, { value: () => fn.name, "aria-label": "Function name", onInput: (e) => { fn.name = e.currentTarget.value; update(); } }),
    button(s.btn, {
      disabled: () => fn === functions[0] || users() > 0,
      title: () => (fn === functions[0] ? "The first function stays" : users() ? `${users()} calls use it` : "Delete this function"),
      onClick: () => { removeFunction(fn); show(functions[0]); },
    }, "Delete"),
    span(s.stats, () => `${runs} run${runs === 1 ? "" : "s"} · ${result.steps.toLocaleString("en")} steps · ${result.calls.toLocaleString("en")} calls · ${result.depth.toLocaleString("en")} deep · ${result.ms.toFixed(1)} ms`),
  );
}

// Delete removes the selected node and Escape lets go of it, unless you are typing.
function shortcuts(el: HTMLElement) {
  const onKey = (e: KeyboardEvent) => {
    if (!el.offsetParent || !selected || (e.target as Element).closest?.("input, select, textarea")) return;
    if (e.key === "Delete" || e.key === "Backspace") remove(selected);
    else if (e.key === "Escape") { selected = null; update("ng-canvas"); }
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey, true);
  return () => document.removeEventListener("keydown", onKey, true);
}

export function NodeGraph() {
  return div(s.app, on("mount", shortcuts), Side(), div(s.main, Bar(), Canvas()));
}
