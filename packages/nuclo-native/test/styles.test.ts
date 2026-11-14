import { expect, test } from "bun:test";
import type { Op } from "../src/dom";

// css(), createCss() screens, cx(), globalStyle() and inline styles on a mock host, without the router:
// the body is the layout root, so a resize is the window's.
const ops: Op[] = [];
globalThis.__nuclo_host = (json) => ops.push(...JSON.parse(json));
globalThis.__nuclo_measure = (_id, max) => `${max < 0 ? 50 : Math.min(50, max)} 18.9`;
await import("../src/index");

const styleOf = (id: number) => {
  const out: Record<string, string> = {};
  for (const op of ops) if (op[0] === "style" && op[1] === id) out[op[2]] = op[3];
  for (const k in out) if (out[k] === "") delete out[k];
  return out;
};
const frameOf = (id: number) => ops.findLast((op): op is Extract<Op, { 0: "frame" }> => op[0] === "frame" && op[1] === id)?.slice(2);
/** The node created with `id` (an attribute the host gets as a "set" op). */
const byId = (id: string) => ops.find((op) => op[0] === "set" && op[2] === "id" && op[3] === id)![1];
const byText = (text: string) => ops.findLast((op) => op[0] === "set" && op[2] === "text" && op[3] === text)![1];

const { css: themed } = createCss({ colors: { brand: "#14b8a6" }, screens: { md: "(min-width: 600px)" } });
const card = themed({ p: 12, bg: "brand", rounded: 8, border: "2px solid #000", color: "#fff", text: 18 });
const layoutClass = themed({ flexDirection: "column", md: { flexDirection: "row" } });
globalStyle("article", { padding: "4px" });

render(
  () =>
    div(
      div(card, { id: "card" }, span("Inherits")),
      div(layoutClass, div({ id: "a", style: { width: 40, height: 10 } }), div({ id: "b", style: { width: 40, height: 10 } })),
      div({ id: "raw", style: { borderBottom: "1px solid red", backgroundColor: "rgb(0 0 255 / 50%)" } }),
      article({ id: "art" }, "x"),
    ),
  document.body,
);
globalThis.__nuclo_event(1, "resize", "400 800 1");

test("a css() class reaches the host as computed paint", () => {
  expect(styleOf(byId("card"))).toEqual({
    backgroundColor: "#14b8a6",
    borderRadius: "8",
    borderWidth: "2 2 2 2",
    borderColor: "#000000",
    color: "#ffffff",
    fontSize: "18",
  });
  // Layout properties stay in JS: no padding op for a container.
  expect(ops.some((op) => op[0] === "style" && op[1] === byId("card") && op[2] === "padding")).toBe(false);
});

test("text inherits colour and size from its container", () => {
  expect(styleOf(byText("Inherits"))).toMatchObject({ color: "#ffffff", fontSize: "18" });
  // Laid out inside the padding and border: 12 + 2.
  expect(frameOf(byText("Inherits"))?.slice(0, 2)).toEqual([14, 14]);
});

test("@media screens follow the window", () => {
  expect(frameOf(byId("b"))?.slice(0, 2)).toEqual([0, 10]); // a column below 600 px
  globalThis.__nuclo_event(1, "resize", "700 800 1");
  expect(frameOf(byId("b"))?.slice(0, 2)).toEqual([40, 0]); // a row from 600 px
  globalThis.__nuclo_event(1, "resize", "400 800 1");
  expect(frameOf(byId("b"))?.slice(0, 2)).toEqual([0, 10]);
});

test("CSS colours and per-side borders", () => {
  expect(styleOf(byId("raw"))).toEqual({ backgroundColor: "#0000ff80", borderWidth: "0 0 1 0", borderColor: "#ff0000" });
  expect(frameOf(byId("raw"))?.[3]).toBe(1);
});

test("globalStyle() rules by tag; class changes restyle", () => {
  expect(frameOf(byId("art"))?.[3]).toBeCloseTo(18.9 + 8);
  const before = ops.length;
  const a = document.getElementById("a")!;
  a.className = card.className;
  update();
  expect(ops.slice(before).some((op) => op[0] === "style" && op[1] === byId("a") && op[2] === "backgroundColor")).toBe(true);
  a.className = "";
  update();
  expect(styleOf(byId("a"))).toEqual({});
});

test("class and style attributes never reach the host", () => {
  expect(ops.some((op) => op[0] === "set" && (op[2] === "class" || op[2] === "style"))).toBe(false);
  expect(document.getElementById("nuclo-styles")).not.toBeNull();
});
