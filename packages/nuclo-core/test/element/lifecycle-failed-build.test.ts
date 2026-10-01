/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, hydrate } from "../../src/render";
import { update } from "../../src/update/update";
import "../../src";

/**
 * onMount is queued while a tree is built and fired once the surrounding
 * render()/hydrate()/update() has attached it. When the build throws half
 * way, the elements already built are discarded — they must not mount on a
 * later flush: a mount on a detached element starts timers/subscriptions whose
 * cleanup can never run, because nuclo never removes an element it never
 * attached.
 */
describe("lifecycle — a build that throws never mounts what it discarded", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  interface Probe {
    log: string[];
    hooks: (name: string) => NodeModFn<ElementTagName>[];
  }

  function probe(): Probe {
    const log: string[] = [];
    return {
      log,
      hooks: (name) => [
        on("mount", (el) => {
          log.push(`mount ${name}${el.isConnected ? "" : " (detached)"}`);
          return () => { log.push(`cleanup ${name}`); };
        }),
        on("destroy", () => { log.push(`destroy ${name}`); }),
      ],
    };
  }

  const thrower = ((): never => { throw new Error("boom"); }) as unknown as NodeModFn<ElementTagName>;
  // A modifier with parameters is called as a NodeModFn, so its throw escapes
  // the element being built (zero-arity functions are reactive text: caught).
  const throwingModifier = ((_parent: unknown, _index: number): never => { throw new Error("boom"); }) as unknown as NodeModFn<ElementTagName>;
  void thrower;

  it("list(): rows built before a throwing row do not mount; the rebuilt rows do, once", () => {
    const { log, hooks } = probe();
    const state = { items: [{ id: 1 }], failOn: -1 };
    render(
      div(list(() => state.items, (it) => {
        if (it.id === state.failOn) throw new Error("boom");
        return p(String(it.id), ...hooks(String(it.id)));
      })),
      container,
    );
    expect(log).toEqual(["mount 1"]);

    state.items = [...state.items, { id: 2 }, { id: 3 }, { id: 4 }];
    state.failOn = 4;
    expect(() => update()).toThrow("boom");

    state.failOn = -1;
    update();
    update();

    expect(log.filter((entry) => entry.includes("detached"))).toEqual([]);
    const count = (entry: string): number => log.filter((l) => l === entry).length;
    for (const id of [1, 2, 3, 4]) {
      // Exactly one live mount per row, every cleanup paired with its destroy.
      expect(count(`mount ${id}`) - count(`destroy ${id}`)).toBe(1);
      expect(count(`cleanup ${id}`)).toBe(count(`destroy ${id}`));
    }
    expect(Array.from(container.querySelectorAll("p")).map((el) => el.textContent)).toEqual(["1", "2", "3", "4"]);
  });

  it("nested list: inner rows of a discarded outer row do not mount", () => {
    const { log, hooks } = probe();
    const state = {
      groups: [{ id: "a", rows: [1, 2] }],
      failOn: "",
    };
    render(
      div(list(() => state.groups, (group) => {
        if (group.id === state.failOn) throw new Error("boom");
        return section(...hooks(group.id), list(() => group.rows, (n) => i(String(n), ...hooks(`${group.id}${n}`))));
      })),
      container,
    );
    log.length = 0;

    state.groups = [...state.groups, { id: "b", rows: [1, 2, 3] }, { id: "c", rows: [1] }];
    state.failOn = "c";
    expect(() => update()).toThrow();
    // Give a later, unrelated flush the chance to fire leftovers.
    state.groups = [];
    state.failOn = "";
    update();
    update();

    expect(log.filter((entry) => entry.startsWith("mount b"))).toEqual([]);
    expect(log.filter((entry) => entry.includes("detached"))).toEqual([]);
  });

  it("when(): content discarded by a throwing modifier does not mount", () => {
    const { log, hooks } = probe();
    let show = false;
    render(
      div(when(() => show, section(span("kept?", ...hooks("inner")), throwingModifier))),
      container,
    );

    show = true;
    update(); // the branch throws; when() logs and unregisters itself
    update();
    update();

    expect(log).toEqual([]);
    expect(container.querySelector("section")).toBeNull();
  });

  it("when(): content inserted before the throwing item stays and mounts", () => {
    const { log, hooks } = probe();
    let show = false;
    render(
      div(when(() => show, b("first", ...hooks("first")), section(i("second", ...hooks("second")), throwingModifier))),
      container,
    );

    show = true;
    update();
    update();

    // <b> was inserted before the branch threw: it is live, so it mounts.
    expect(container.querySelector("b")).not.toBeNull();
    expect(log).toEqual(["mount first"]);
  });

  it("render(): a root that throws while building mounts nothing, ever", () => {
    const { log, hooks } = probe();
    expect(() =>
      render(div(header("h", ...hooks("header")), main(span("deep", ...hooks("deep"))), throwingModifier), container),
    ).toThrow("boom");
    expect(container.childNodes.length).toBe(0);

    // A later, successful render and update flush the queue.
    render(div("ok", ...hooks("ok")), container);
    update();

    expect(log).toEqual(["mount ok"]);
  });

  it("hydrate(): a root that throws mounts none of its fresh, discarded nodes", () => {
    const { log, hooks } = probe();
    container.innerHTML = ""; // nothing to claim — the whole tree would be fresh
    expect(() =>
      hydrate(div(header("h", ...hooks("header")), throwingModifier), container),
    ).toThrow("boom");

    render(div("ok", ...hooks("ok")), container);
    update();

    expect(log.filter((entry) => entry.includes("detached"))).toEqual([]);
    expect(log).toEqual(["mount ok"]);
  });

  it("a successful build is unaffected: every hook mounts once, in tree order", () => {
    const { log, hooks } = probe();
    render(div(...hooks("root"), section(...hooks("section"), span(...hooks("span"))), list(() => [1, 2], (n) => i(...hooks(`row${n}`)))), container);
    expect(log).toEqual(["mount root", "mount section", "mount span", "mount row1", "mount row2"]);
  });

  it("rendering into a container that is attached later still mounts (unchanged behavior)", () => {
    const { log, hooks } = probe();
    const offscreen = document.createElement("div");
    render(div(span(...hooks("offscreen"))), offscreen);
    // Not in the document yet — but the build succeeded, so the hook ran.
    expect(log).toEqual(["mount offscreen (detached)"]);
    document.body.appendChild(offscreen);
    update();
    expect(log).toEqual(["mount offscreen (detached)"]);
  });
});
