/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import "../../src";

beforeEach(() => { document.body.innerHTML = ""; });

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    globalThis.gc!();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

function mountCycle(capture: "root" | "container"): WeakRef<object>[] {
  const container = document.createElement("div");
  document.body.append(container);
  const state: { node?: object } = {};
  const component = () => div(String(!!state.node));
  const root = render(component, container);
  state.node = capture === "root" ? root : container;
  container.remove();
  return [new WeakRef(root), new WeakRef(container), new WeakRef(component), new WeakRef(state)];
}

it.each(["root", "container"] as const)("collects a component closure that captures its %s", async capture => {
  expect(typeof globalThis.gc).toBe("function");
  const refs = mountCycle(capture);
  await collectGarbage();
  expect(refs.map(ref => ref.deref())).toEqual([undefined, undefined, undefined, undefined]);
});

it("repeated hydration registers only the latest component for a root", () => {
  const container = document.createElement("div");
  document.body.append(container);
  let firstCalls = 0;
  let latestCalls = 0;
  render(() => { firstCalls++; return div("first"); }, container);
  const latest = () => { latestCalls++; return div("latest"); };
  hydrate(latest, container);
  hydrate(latest, container);
  firstCalls = latestCalls = 0;
  forceUpdate();
  expect(firstCalls).toBe(0);
  expect(latestCalls).toBe(1);
  expect(container.textContent).toBe("latest");
});

const replacementComponent = () => div("new");

function replaceComponent(): WeakRef<object> {
  const container = document.createElement("div");
  document.body.append(container);
  const payload = { label: "old" };
  render(() => div(payload.label), container);
  hydrate(replacementComponent, container);
  return new WeakRef(payload);
}

it("releases a superseded component while its root remains mounted", async () => {
  const ref = replaceComponent();
  await collectGarbage();
  expect(ref.deref()).toBeUndefined();
  forceUpdate();
  expect(document.body.textContent).toBe("new");
});

function replaceRootAndRemove(): WeakRef<object>[] {
  const container = document.createElement("div");
  document.body.append(container);
  const state: { changed: boolean; node?: object } = { changed: false };
  render(() => state.changed ? section(String(!!state.node)) : div("old"), container);
  state.changed = true;
  forceUpdate();
  state.node = container.firstChild!;
  const refs = [new WeakRef(state), new WeakRef(container.firstChild!)];
  container.remove();
  return refs;
}

it("collects a captured replacement root after a tag change", async () => {
  const refs = replaceRootAndRemove();
  await collectGarbage();
  expect(refs.map(ref => ref.deref())).toEqual([undefined, undefined]);
});
