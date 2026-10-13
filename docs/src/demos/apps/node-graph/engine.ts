// engine.ts: runs a function. Each node is a generator that asks for its
// inputs one at a time with yield, and one loop drives them all from its own
// stack array instead of the JavaScript call stack. A graph can be as deep as
// you like, and a function can call itself until memory or the step budget runs
// out: a call costs heap, never a stack frame. An If asks for its condition
// first and then for one branch only, so the other branch never runs, which is
// what lets a recursive function stop.
import { COMPARE, MATH, params, results, unwired, wireInto, type Fn, type GraphNode, type Value, type Wire } from "./graph.ts";

/** One function call: its arguments, and the outputs of every node it has worked out so far. */
interface Frame { fn: Fn; args: Value[] | null; done: Map<GraphNode, Value[]>; depth: number; run: Result; trace: Set<Wire> | null }
type Ask = { node: GraphNode; frame: Frame }; // "work out this node in this call"
type Body = Generator<Ask, Value[], Value[]>;

export interface Result {
  values: Map<GraphNode, Value[]>; // the outputs of the shown function's nodes
  errors: Map<GraphNode, string>;
  live: Set<GraphNode>; // the nodes an Output needed. The rest are worked out only to show their values.
  wires: Set<Wire>; // the wires an Output needed: not the ones into the branch an If skipped
  steps: number; // generator resumes, across every call
  calls: number;
  depth: number; // the deepest call
  ms: number;
}

export const BUDGET = 2_000_000; // steps: a recursion with no way out stops here

// The value on the wire into input i, or the default when nothing is wired there.
function* pull(node: GraphNode, i: number, frame: Frame): Generator<Ask, Value, Value[]> {
  const w = wireInto(frame.fn, node, i);
  if (w) frame.trace?.add(w);
  return w ? (yield { node: w.from, frame })[w.out] : unwired(node, i);
}

function* body(node: GraphNode, frame: Frame): Body {
  switch (node.kind) {
    case "number": case "text": case "switch": return [node.value];
    // Called, it reads its argument. Shown on its own, its test value.
    case "input": return [frame.args ? (frame.args[params(frame.fn).indexOf(node)] ?? 0) : node.value];
    case "output": return [yield* pull(node, 0, frame)];
    case "not": return [!(yield* pull(node, 0, frame))];
    case "if": return [(yield* pull(node, 0, frame)) ? yield* pull(node, 1, frame) : yield* pull(node, 2, frame)];
    case "compare": return [COMPARE[node.op](yield* pull(node, 0, frame), yield* pull(node, 1, frame))];
    case "math": {
      const a = yield* pull(node, 0, frame);
      const b = yield* pull(node, 1, frame);
      return [node.op === "+" && (typeof a === "string" || typeof b === "string") ? `${a}${b}` : MATH[node.op](Number(a), Number(b))];
    }
    case "logic": {
      const a = Boolean(yield* pull(node, 0, frame));
      if (node.op === "and" && !a) return [false]; // short-circuit: b is never asked for
      if (node.op === "or" && a) return [true];
      const b = Boolean(yield* pull(node, 1, frame));
      return [node.op === "xor" ? a !== b : b];
    }
    case "call": {
      const fn = node.fn!;
      const args: Value[] = [];
      for (let i = 0; i < params(fn).length; i++) args.push(yield* pull(node, i, frame));
      const inner: Frame = { fn, args, done: new Map(), depth: frame.depth + 1, run: frame.run, trace: null };
      frame.run.calls++;
      frame.run.depth = Math.max(frame.run.depth, inner.depth);
      const out: Value[] = [];
      for (const r of results(fn)) out.push((yield { node: r, frame: inner })[0]);
      return out;
    }
  }
}

// Works out one node. The stack holds the generators that are waiting for a value:
// the top one runs until it asks for a node, which is either known already in
// that call or pushed on top. When a generator returns, its value goes to the one below.
function drive(node: GraphNode, root: Frame) {
  const run = root.run;
  const stack: Ask[] = [{ node, frame: root }];
  const gens: Body[] = [body(node, root)];
  let value: Value[] = [];
  try {
    while (gens.length) {
      if (++run.steps > BUDGET) throw new Error(`Stopped after ${BUDGET.toLocaleString("en")} steps. Does every call reach a way out?`);
      const step = gens[gens.length - 1].next(value);
      if (step.done) {
        const { node, frame } = stack.pop()!;
        gens.pop();
        frame.done.set(node, (value = step.value));
      } else {
        const known = step.value.frame.done.get(step.value.node);
        if (known) value = known;
        else {
          stack.push(step.value);
          gens.push(body(step.value.node, step.value.frame));
        }
      }
    }
  } catch (e) {
    // Every node of the shown function that was waiting on this one fails with it.
    for (const ask of stack) if (ask.frame === root) run.errors.set(ask.node, (e as Error).message);
  }
}

/** Runs `fn` with its Input nodes' test values: its Outputs first, then every other node, for display. */
export function run(fn: Fn): Result {
  const start = performance.now();
  const result: Result = { values: new Map(), errors: new Map(), live: new Set(), wires: new Set(), steps: 0, calls: 0, depth: 0, ms: 0 };
  const root: Frame = { fn, args: null, done: result.values, depth: 0, run: result, trace: result.wires };
  const ask = (n: GraphNode) => { if (!result.values.has(n) && !result.errors.has(n)) drive(n, root); };
  results(fn).forEach(ask);
  result.live = new Set([...result.values.keys(), ...result.errors.keys()]);
  root.trace = null;
  fn.nodes.forEach(ask);
  result.ms = performance.now() - start;
  return result;
}
