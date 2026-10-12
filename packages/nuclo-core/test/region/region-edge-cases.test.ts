/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { forceUpdate, hydrate, render } from "../../src/render";
import { pendingViewCount } from "../../src/region/runtime";
import { renderToString } from "../../src/ssr/render-to-string";
import { update } from "../../src/update/update";
import "../../src";

describe("region/view edge cases", () => {
  let root: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = "";
    update();
    root = document.createElement("div");
    document.body.append(root);
  });
  afterEach(() => {
    render(div(), root);
    root.remove();
    update();
  });

  it.each(["latest", "stack"] as const)("retargets a live %s view without leaving old content", (type) => {
    let target = "edge-a";
    render(() => div(
      div({ id: "a" }, region({ id: "edge-a", type, empty: "empty-a" })),
      div({ id: "b" }, region({ id: "edge-b", type, empty: "empty-b" })),
      into(target, span("content")),
    ), root);
    target = "edge-b";
    forceUpdate();
    expect(root.querySelector("#a")!.textContent).toBe("empty-a");
    expect(root.querySelector("#b")!.textContent).toBe("content");
  });

  it("removes targets from a multi-region view, including waiting targets", () => {
    let active = true;
    render(() => div(
      region({ id: "edge-a", empty: "empty" }),
      into(active ? { "edge-a": "a", "edge-missing": "missing" } : {}),
    ), root);
    active = false;
    forceUpdate();
    expect(root.textContent).toBe("empty");
    expect(pendingViewCount("edge-missing")).toBe(0);
  });

  it.each([0, 1, 2])("grows a view from %i nodes without claiming the next view", (count) => {
    let size = count;
    render(() => div(
      div({ id: "host" }, region({ id: "edge-a", type: "stack" })),
      into("edge-a", ...Array.from({ length: size }, (_, i) => input({ id: `field-${i}` }))),
      into("edge-a", input({ id: "neighbor" })),
    ), root);
    const neighbor = root.querySelector<HTMLInputElement>("#neighbor")!;
    neighbor.value = "keep me";
    size = 3;
    forceUpdate();
    expect(root.querySelector("#neighbor")).toBe(neighbor);
    expect(neighbor.value).toBe("keep me");
    expect([...root.querySelector("#host")!.children].map(n => n.id)).toEqual([
      "field-0", "field-1", "field-2", "neighbor",
    ]);
  });

  it("changes a region id and releases its old views to wait", () => {
    let id = "edge-a";
    render(() => div(
      div({ id: "host" }, region({ id, empty: "empty" })),
      into("edge-a", "a"),
      into("edge-b", "b"),
    ), root);
    id = "edge-b";
    forceUpdate();
    expect(root.querySelector("#host")!.textContent).toBe("b");
    expect(pendingViewCount("edge-a")).toBe(1);
    expect(pendingViewCount("edge-b")).toBe(0);
  });

  it.each(["latest", "stack"] as const)("changes region mode from %s and back", (initial) => {
    let type: RegionType = initial;
    let top = true;
    render(() => div(
      region({ id: "edge-mode", type, empty: "empty" }),
      into("edge-mode", span("base")),
      when(() => top, into("edge-mode", span("top"))),
    ), root);
    type = initial === "latest" ? "stack" : "latest";
    forceUpdate();
    expect(root.textContent).toBe(type === "stack" ? "basetop" : "top");
    type = initial;
    forceUpdate();
    expect(root.textContent).toBe(type === "stack" ? "basetop" : "top");
    top = false;
    update();
    expect(root.textContent).toBe("base");
  });

  it("retargets a waiting view and drains only its new queue", () => {
    let target = "edge-wait-a";
    render(() => div(into(target, "content")), root);
    target = "edge-wait-b";
    forceUpdate();
    expect(pendingViewCount("edge-wait-a")).toBe(0);
    expect(pendingViewCount("edge-wait-b")).toBe(1);
    const layout = document.createElement("div");
    root.append(layout);
    render(div(region({ id: "edge-wait-b" })), layout);
    expect(layout.textContent).toBe("content");
    expect(pendingViewCount("edge-wait-b")).toBe(0);
  });

  it("keeps retained multi-region targets and disposes removed ones once", () => {
    let active = true;
    let destroyed = 0;
    render(() => div(
      region({ id: "edge-a" }),
      region({ id: "edge-b" }),
      into(active
        ? { "edge-a": span({ onDestroy: () => { destroyed++; } }, "a"), "edge-b": input({ id: "kept" }) }
        : { "edge-b": input({ id: "kept" }) }),
    ), root);
    const kept = root.querySelector("#kept");
    active = false;
    forceUpdate();
    forceUpdate();
    expect(root.querySelector("#kept")).toBe(kept);
    expect(root.textContent).toBe("");
    expect(destroyed).toBe(1);
  });

  it("removes a retargeted hidden view instead of restoring stale content", () => {
    let target = "edge-a";
    let top = true;
    render(() => div(
      div({ id: "a" }, region({ id: "edge-a", empty: "empty" })),
      region({ id: "edge-b" }),
      into(target, "base"),
      when(() => top, into("edge-a", "top")),
    ), root);
    target = "edge-b";
    forceUpdate();
    top = false;
    update();
    expect(root.querySelector("#a")!.textContent).toBe("empty");
    expect(root.textContent).toBe("emptybase");
  });

  it.each(["text", "element", "when", "list", "region"])("grows and empties %s content before a neighbor", (kind) => {
    let full = false;
    const content = () => {
      if (!full) return [];
      switch (kind) {
        case "text": return ["hello", "world"];
        case "element": return [span("hello"), span("world")];
        case "when": return [when(() => true, "helloworld")];
        case "list": return [list(() => ["hello", "world"], value => span(value))];
        default: return [region({ id: "edge-nested", empty: "helloworld" })];
      }
    };
    render(() => div(
      div({ id: "host" }, region({ id: "edge-a", type: "stack" })),
      into("edge-a", ...content()),
      into("edge-a", input({ id: "neighbor" })),
    ), root);
    const neighbor = root.querySelector("#neighbor");
    for (let i = 0; i < 3; i++) {
      full = true;
      forceUpdate();
      expect(root.querySelector("#host")!.textContent).toBe("helloworld");
      expect(root.querySelector("#neighbor")).toBe(neighbor);
      full = false;
      forceUpdate();
      expect(root.querySelector("#host")!.textContent).toBe("");
      expect(root.querySelector("#neighbor")).toBe(neighbor);
    }
    expect(root.innerHTML).not.toContain("region-claim-boundary");
  });

  it.each(["", "__proto__", "constructor", "toString"])("supports the id %j through SSR and hydration", (id) => {
    const app = () => div(region({ id }), into({ [id]: span("content") }));
    root.innerHTML = renderToString(app());
    const content = root.querySelector("span");
    hydrate(app, root);
    expect(root.querySelector("span")).toBe(content);
    expect(root.textContent).toBe("content");
  });


  it("keeps consecutive empty views in arrival order when they acquire content", () => {
    let filled = false;
    render(() => div(
      region({ id: "edge-a", type: "stack" }),
      into("edge-a", ...(filled ? [span("first")] : [])),
      into("edge-a"),
      into("edge-a", ...(filled ? [span("third")] : [])),
      into("edge-a", input({ id: "last" })),
    ), root);
    const last = root.querySelector("#last");
    filled = true;
    forceUpdate();
    expect(root.textContent).toBe("firstthird");
    expect(root.querySelector("#last")).toBe(last);
    filled = false;
    forceUpdate();
    expect(root.textContent).toBe("");
    expect(root.querySelectorAll("input").length).toBe(1);
  });

  it("grows empty fallback content without consuming host siblings", () => {
    let full = false;
    render(() => div(
      region({ id: "edge-a", empty: full ? input({ id: "fallback" }) : undefined }),
      input({ id: "sibling" }),
    ), root);
    const sibling = root.querySelector("#sibling");
    full = true;
    forceUpdate();
    expect(root.querySelector("#sibling")).toBe(sibling);
    expect(root.querySelectorAll("input").length).toBe(2);
    full = false;
    forceUpdate();
    expect(root.querySelector("#fallback")).toBeNull();
    expect(root.querySelector("#sibling")).toBe(sibling);
  });

});
