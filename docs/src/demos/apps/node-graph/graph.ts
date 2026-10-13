// graph.ts: the model. A function is a plain object that holds its nodes and
// wires. A node is a plain object with a position and its own fields, and a
// wire points straight at the two node objects it joins. "main" is a function
// like any other: its Input and Output nodes are the ports of every Call to it,
// and a Call can name any function, itself included. Nothing here knows about the UI.

export type Value = number | boolean | string;
export type Kind = "number" | "text" | "switch" | "math" | "compare" | "logic" | "not" | "if" | "input" | "output" | "call";

export interface GraphNode {
  id: number;
  kind: Kind;
  x: number; y: number; // px, on the canvas
  value: Value; // number, text, switch: the value. input: the test value used when its function runs on its own
  op: string; // math, compare, logic
  name: string; // input, output: the parameter or result name
  fn: Fn | null; // call: the function it calls
}
export interface Wire { from: GraphNode; out: number; to: GraphNode; in: number }
export interface View { x: number; y: number; zoom: number }
export interface Fn { name: string; nodes: GraphNode[]; wires: Wire[]; view: View | null } // view: null until it is first shown

export const MATH: Record<string, (a: number, b: number) => number> = {
  "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => a / b, "%": (a, b) => a % b, min: Math.min, max: Math.max,
};
export const COMPARE: Record<string, (a: Value, b: Value) => boolean> = {
  "<": (a, b) => a < b, "≤": (a, b) => a <= b, "=": (a, b) => a === b, "≠": (a, b) => a !== b, "≥": (a, b) => a >= b, ">": (a, b) => a > b,
};
export const LOGIC = ["and", "or", "xor"];

/** The parameters and results of a function: its Input and Output nodes, in order. */
export const params = (fn: Fn) => fn.nodes.filter((n) => n.kind === "input");
export const results = (fn: Fn) => fn.nodes.filter((n) => n.kind === "output");

/** The names of a node's input ports (left) and output ports (right). */
export function inputs(n: GraphNode): string[] {
  switch (n.kind) {
    case "math": case "compare": case "logic": return ["a", "b"];
    case "not": return ["in"];
    case "if": return ["if", "then", "else"];
    case "output": return [n.name];
    case "call": return params(n.fn!).map((p) => p.name);
    default: return [];
  }
}
export function outputs(n: GraphNode): string[] {
  switch (n.kind) {
    case "output": return [];
    case "input": return [n.name];
    case "call": return results(n.fn!).map((r) => r.name);
    default: return ["out"];
  }
}

/** An input with no wire into it reads false where a condition is expected, and 0 everywhere else. */
export const unwired = (n: GraphNode, i: number): Value => (n.kind === "logic" || n.kind === "not" || (n.kind === "if" && i === 0) ? false : 0);

export const wireInto = (fn: Fn, to: GraphNode, i: number) => fn.wires.find((w) => w.to === to && w.in === i);

let nextId = 1;
const DEFAULTS: Partial<Record<Kind, Partial<GraphNode>>> = {
  text: { value: "" }, switch: { value: false }, math: { op: "+" }, compare: { op: "<" }, logic: { op: "and" }, output: { name: "result" },
};

export function addNode(fn: Fn, kind: Kind, x: number, y: number, fields: Partial<GraphNode> = {}): GraphNode {
  const node: GraphNode = { id: nextId++, kind, x, y, value: 0, op: "", name: "", fn: null, ...DEFAULTS[kind], ...fields };
  if (kind === "input" && !fields.name) node.name = String.fromCharCode(97 + (params(fn).length % 26)); // a, b, c…
  fn.nodes.push(node);
  return node;
}

/** True when a path of wires already leads from `a` to `b`. */
function reaches(fn: Fn, a: GraphNode, b: GraphNode) {
  const seen = new Set<GraphNode>();
  const todo = [a];
  for (let n = todo.pop(); n; n = todo.pop()) {
    if (n === b) return true;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const w of fn.wires) if (w.from === n) todo.push(w.to);
  }
  return false;
}

/**
 * Wires an output to an input, replacing any wire already in that input.
 * Refuses a loop: a node that feeds itself has no first value. A Call
 * is how a function uses its own result.
 */
export function connect(fn: Fn, from: GraphNode, out: number, to: GraphNode, i: number): boolean {
  if (reaches(fn, to, from)) return false;
  const old = wireInto(fn, to, i);
  if (old) disconnect(fn, old);
  fn.wires.push({ from, out, to, in: i });
  return true;
}

export function disconnect(fn: Fn, wire: Wire) {
  fn.wires.splice(fn.wires.indexOf(wire), 1);
}

/**
 * Removes a node and its wires. An Input or Output node is also a port of
 * every Call to its function, in every function: the wire on that port goes,
 * and the wires on the ports after it move up one.
 */
export function removeNode(fn: Fn, node: GraphNode) {
  const port = node.kind === "input" ? params(fn).indexOf(node) : node.kind === "output" ? results(fn).indexOf(node) : -1;
  fn.wires = fn.wires.filter((w) => w.from !== node && w.to !== node);
  fn.nodes.splice(fn.nodes.indexOf(node), 1);
  if (port === -1) return;
  for (const other of functions) {
    other.wires = other.wires.filter((w) => {
      const [call, key] = node.kind === "input" ? [w.to, "in" as const] : [w.from, "out" as const];
      if (call.fn !== fn) return true; // only a Call has a fn
      if (w[key] === port) return false;
      if (w[key] > port) w[key]--;
      return true;
    });
  }
}

/** The Call nodes, outside `fn` itself, that would break if it went away. */
export const callers = (fn: Fn) => functions.filter((f) => f !== fn).flatMap((f) => f.nodes.filter((n) => n.fn === fn));

export function addFunction(): Fn {
  const fn: Fn = { name: `function${functions.length}`, nodes: [], wires: [], view: null };
  const x = addNode(fn, "input", 40, 60, { name: "x" });
  connect(fn, x, 0, addNode(fn, "output", 300, 60), 0);
  functions.push(fn);
  return fn;
}

export function removeFunction(fn: Fn) {
  functions.splice(functions.indexOf(fn), 1);
}

// ── The starting graphs ──────────────────────────────────────────────────

const define = (name: string): Fn => ({ name, nodes: [], wires: [], view: null });
const main = define("main");
const factorial = define("factorial");
const sum = define("sum");
export const functions: Fn[] = [main, factorial, sum];

// Wires `ins` into the inputs of `to`, in order: [node, output] pairs.
function feed(fn: Fn, to: GraphNode, ...ins: [GraphNode, number][]) {
  ins.forEach(([from, out], i) => connect(fn, from, out, to, i));
  return to;
}

// n! = n ≤ 1 ? 1 : n × (n − 1)!   and   sum(n) = n ≤ 0 ? 0 : n + sum(n − 1)
// Same shape: the If asks for its condition, then for one branch only, so the
// branch that calls the function again is skipped once n reaches the bottom.
function recursive(fn: Fn, test: number, base: number, op: string, result: string) {
  const n = addNode(fn, "input", 30, 40, { name: "n", value: test });
  const one = addNode(fn, "number", 30, 180, { value: 1 });
  const stop = base === 1 ? one : addNode(fn, "number", 240, 290, { value: base });
  const done = feed(fn, addNode(fn, "compare", 240, 30, { op: "≤" }), [n, 0], [stop, 0]);
  const less = feed(fn, addNode(fn, "math", 240, 150, { op: "−" }), [n, 0], [one, 0]);
  const again = feed(fn, addNode(fn, "call", 450, 170, { fn }), [less, 0]);
  const step = feed(fn, addNode(fn, "math", 660, 110, { op }), [n, 0], [again, 0]);
  const pick = feed(fn, addNode(fn, "if", 870, 40), [done, 0], [stop, 0], [step, 0]);
  feed(fn, addNode(fn, "output", 1080, 60, { name: result }), [pick, 0]);
}
recursive(factorial, 5, 1, "×", "n!");
recursive(sum, 100, 0, "+", "total");

{
  // A grade: pass when the score is at least 50 and the work was handed in.
  const score = addNode(main, "number", 30, 30, { value: 72 });
  const bar = addNode(main, "number", 30, 110, { value: 50 });
  const enough = feed(main, addNode(main, "compare", 240, 30, { op: "≥" }), [score, 0], [bar, 0]);
  const handedIn = addNode(main, "switch", 240, 140, { value: true });
  const both = feed(main, addNode(main, "logic", 450, 60, { op: "and" }), [enough, 0], [handedIn, 0]);
  const pass = addNode(main, "text", 450, 170, { value: "pass" });
  const fail = addNode(main, "text", 450, 240, { value: "fail" });
  const pick = feed(main, addNode(main, "if", 660, 90), [both, 0], [pass, 0], [fail, 0]);
  feed(main, addNode(main, "output", 870, 110, { name: "grade" }), [pick, 0]);

  // Recursion: 6! asks factorial for 5!, which asks for 4!, down to 1!.
  const six = addNode(main, "number", 30, 340, { value: 6 });
  const fact = feed(main, addNode(main, "call", 240, 340, { fn: factorial }), [six, 0]);
  feed(main, addNode(main, "output", 450, 330, { name: "6!" }), [fact, 0]);

  // Depth: sum(1000) is a thousand calls inside each other.
  const deep = addNode(main, "number", 30, 460, { value: 1000 });
  const total = feed(main, addNode(main, "call", 240, 460, { fn: sum }), [deep, 0]);
  feed(main, addNode(main, "output", 450, 450, { name: "1 + … + n" }), [total, 0]);
}
