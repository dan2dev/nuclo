import { expect, test } from "bun:test";
import type { Op } from "../src/dom";

const ops: Op[] = [];
globalThis.__nuclo_host = (json) => ops.push(...JSON.parse(json));
globalThis.__nuclo_measure = () => "80 20";
globalThis.__nuclo_device = (name) => name === "nativeViews" ? "test.component" : "";
const { nativeView } = await import("../src/index");

test("a registered view receives its frame and props, sends data back, and stops reporting after removal", () => {
  let props = { title: "First" };
  let show = true;
  const received: string[] = [];
  render(() => div(when(() => show, nativeView<typeof props, typeof props>("test.component", {
    props: () => props,
    style: { height: 180 },
    fallback: div("fallback"),
    onEvent: (event) => received.push(event.title),
  }))), document.body);
  globalThis.__nuclo_event(1, "resize", "375 800 3");
  const id = ops.find((op) => op[0] === "create" && op[2] === "native:test.component")![1];
  expect(ops).toContainEqual(["frame", id, 0, 0, 375, 180]);
  expect(ops).toContainEqual(["set", id, "native-props", JSON.stringify(props)]);
  props = { title: "Second" };
  update();
  expect(ops).toContainEqual(["set", id, "native-props", JSON.stringify(props)]);
  globalThis.__nuclo_event(id, "nativeevent", JSON.stringify(props));
  expect(received).toEqual(["Second"]);
  show = false;
  update();
  expect(ops).toContainEqual(["remove", id]);
  globalThis.__nuclo_event(id, "nativeevent", '{"title":"late"}');
  expect(received).toEqual(["Second"]);
});

test("a missing native component renders the app's fallback", () => {
  ops.length = 0;
  render(() => nativeView("test.missing", { props: {}, style: {}, fallback: div("available everywhere") }), document.body);
  expect(ops.some((op) => op[0] === "create" && op[2].startsWith("native:"))).toBe(false);
  expect(ops).toContainEqual(["set", expect.any(Number), "text", "available everywhere"]);
});
