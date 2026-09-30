/// <reference path="../../types/index.d.ts" />
/**
 * (jsdom environment on purpose: isBrowser is true here.)
 *
 * The serialization flag is realm-shared state. `nuclo` and `nuclo/ssr` ship
 * as separate bundles, so renderToString() (nuclo/ssr) and the tag builders
 * (nuclo) run from different module instances; the flag one sets must be the
 * flag the other reads. Two fresh module instances stand in for the two
 * bundles below.
 *
 * Also covers what that flag protects under a DOM-providing server runtime:
 * a renderToString() tree keeps its hydration markers and registers nothing.
 */
import "../../src";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "../../src/ssr/render-to-string";
import { render } from "../../src/render";
import { reactiveTextNodes, reactiveElements } from "../../src/update/registry";
import { getScopeRoots } from "../../src/update/scope";
import { hasActiveLifecycleRegistrations, flushMountQueue } from "../../src/element/lifecycle";
import { isSerializing } from "../../src/shared/serializing";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("serializing flag is shared across module instances", () => {
  it("a second module instance observes the first instance's flag", async () => {
    vi.resetModules();
    const a = await import("../../src/shared/serializing");
    vi.resetModules();
    const b = await import("../../src/shared/serializing");
    expect(a).not.toBe(b);
    expect(a.isSerializing()).toBe(false);
    expect(b.isSerializing()).toBe(false);
    a.runSerializing(() => {
      expect(b.isSerializing()).toBe(true);
      b.runSerializing(() => expect(a.isSerializing()).toBe(true));
      expect(b.isSerializing()).toBe(true);
    });
    expect(a.isSerializing()).toBe(false);
    expect(b.isSerializing()).toBe(false);
    expect(isSerializing()).toBe(false);
  });

  it("renderToString from a separate module graph still emits hydration markers", async () => {
    // Tag builders come from the statically imported graph; renderToString
    // from a fresh one — the published nuclo + nuclo/ssr split.
    vi.resetModules();
    const ssr = await import("../../src/ssr/render-to-string");
    expect(ssr.renderToString).not.toBe(renderToString);
    let mounted = 0;
    const html = ssr.renderToString(div({ onMount: () => { mounted++; } }, "hello", span(() => "reactive")));
    expect(html).toBe("<div><!-- text-0 -->hello<span><!-- text-1 -->reactive</span></div>");
    flushMountQueue();
    expect(mounted).toBe(0);
  });
});

describe("renderToString under a DOM runtime (isBrowser === true)", () => {
  it("registers nothing for the throwaway tree", () => {
    const texts = reactiveTextNodes.size;
    const elements = reactiveElements.size;
    let hooks = 0;
    const items = ["a", "b"];
    const tree = () => div(
      { className: () => "x", onMount: () => { hooks++; }, onDestroy: () => { hooks++; } },
      scope("ssr-scope"),
      span(() => "text"),
      ul(list(() => items, (i) => li(i))),
      when(() => true, p("yes")).else(p("no")),
      on("mount", () => { hooks++; }),
      on("click", () => { hooks++; }),
    );
    for (let i = 0; i < 25; i++) {
      const html = renderToString(tree());
      expect(html).toContain("<!-- text-");
      expect(html).toContain('class="x"');
    }
    flushMountQueue();
    expect(hooks).toBe(0);
    expect(reactiveTextNodes.size).toBe(texts);
    expect(reactiveElements.size).toBe(elements);
    expect(getScopeRoots(["ssr-scope"])).toEqual([]);
    expect(hasActiveLifecycleRegistrations()).toBe(false);
  });

  it("a live client render in the same realm still registers (gating is not over-broad)", () => {
    const texts = reactiveTextNodes.size;
    const elements = reactiveElements.size;
    let mounted = 0;
    render(div({ className: () => "live", onMount: () => { mounted++; } }, scope("live-scope"), span(() => "t")), document.body);
    expect(reactiveTextNodes.size).toBe(texts + 1);
    expect(reactiveElements.size).toBe(elements + 1);
    expect(getScopeRoots(["live-scope"])).toHaveLength(1);
    expect(mounted).toBe(1);
  });
});
