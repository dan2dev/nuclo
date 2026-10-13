import { expect, test } from "bun:test";
import { BUDGET, run } from "../src/demos/apps/node-graph/engine.ts";
import { addFunction, addNode, connect, functions, params, removeNode, results, type Fn } from "../src/demos/apps/node-graph/graph.ts";

const [main, factorial, sum] = functions;
const output = (fn: Fn, name: string) => run(fn).values.get(results(fn).find((n) => n.name === name)!)?.[0];
const param = (fn: Fn) => params(fn)[0];

test("the seed graph: a conditional and two recursive calls", () => {
  expect(output(main, "grade")).toBe("pass");
  expect(output(main, "6!")).toBe(720);
  expect(output(main, "1 + … + n")).toBe(500500);
  const switchNode = main.nodes.find((n) => n.kind === "switch")!;
  switchNode.value = false;
  expect(output(main, "grade")).toBe("fail");
  switchNode.value = true;
});

test("an If runs one branch: the recursive call is skipped at the bottom", () => {
  param(factorial).value = 1;
  const r = run(factorial);
  const call = factorial.nodes.find((n) => n.kind === "call")!;
  expect(r.values.get(results(factorial)[0])?.[0]).toBe(1);
  expect(r.live.has(call)).toBe(false); // shown, but no Output needed it
  param(factorial).value = 5;
  expect(run(factorial).live.has(call)).toBe(true);
});

test("depth costs heap, not the JavaScript call stack", () => {
  param(sum).value = 50_000;
  const r = run(sum);
  expect(r.values.get(results(sum)[0])?.[0]).toBe(1_250_025_000);
  expect(r.depth).toBe(50_000);
  param(sum).value = 100;
});

test("a recursion with no way out stops at the step budget", () => {
  const loop = addFunction(); // x → result, then make result call itself
  const [x] = params(loop);
  const call = addNode(loop, "call", 0, 0, { fn: loop });
  connect(loop, x, 0, call, 0);
  connect(loop, call, 0, results(loop)[0], 0);
  const r = run(loop);
  expect(r.steps).toBeGreaterThan(BUDGET);
  expect(r.errors.get(results(loop)[0])).toContain("Stopped after");
  functions.pop();
});

test("wires refuse loops, and removing a parameter shifts the Call wires after it", () => {
  const f = addFunction();
  const [a, b] = [params(f)[0], addNode(f, "input", 0, 0)];
  const math = addNode(f, "math", 0, 0);
  connect(f, a, 0, math, 0);
  expect(connect(f, math, 0, math, 1)).toBe(false);
  const n1 = addNode(main, "number", 0, 0, { value: 1 });
  const n2 = addNode(main, "number", 0, 0, { value: 2 });
  const call = addNode(main, "call", 0, 0, { fn: f });
  connect(main, n1, 0, call, 0);
  connect(main, n2, 0, call, 1);
  removeNode(f, a);
  const left = main.wires.filter((w) => w.to === call);
  expect(left.map((w) => [w.from, w.in])).toEqual([[n2, 0]]);
  expect(params(f)).toEqual([b]);
  [n1, n2, call].forEach((n) => removeNode(main, n));
  functions.pop();
});
