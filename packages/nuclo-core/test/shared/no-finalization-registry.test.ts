/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets the `typeof FinalizationRegistry === "undefined"` fallback branches
 * in src/update/registry.ts, src/list/runtime.ts and src/when/runtime.ts:
 * every module must keep working (registration, sync, updates) with a null
 * finalizer, relying on the notify-pass pruning alone.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function stubFinalizationRegistry(): void {
  vi.stubGlobal("FinalizationRegistry", undefined);
  vi.resetModules();
}

describe("modules without FinalizationRegistry", () => {
  it("update registry registers text nodes, elements and conditionals", async () => {
    stubFinalizationRegistry();
    const registry = await import("../../src/update/registry");

    const text = document.createTextNode("x");
    registry.registerReactiveTextNode(text, { resolver: () => "x", lastValue: "x" });
    expect(registry.reactiveTextNodesByNode.get(text)).toBeDefined();

    const el = document.createElement("div");
    registry.registerReactiveElement(el, { attributeResolvers: [] });
    expect(registry.reactiveElementsByNode.get(el)).toBeDefined();

    registry.storeConditionalInfo(el, {
      condition: () => true,
      tagName: "div",
      modifiers: [],
      isSvg: false,
    });
    expect(registry.getConditionalInfo(el)).not.toBeNull();
    registry.unregisterConditionalNode(el);
    registry.cleanupReactiveTextNode(text);
    registry.cleanupReactiveElement(el);
  });

  it("list runtime creates and syncs without a marker finalizer", async () => {
    stubFinalizationRegistry();
    const { createListRuntime } = await import("../../src/list/runtime");

    const host = document.createElement("div") as unknown as ExpandedElement<"div">;
    document.body.appendChild(host as unknown as Node);

    const runtime = createListRuntime(
      () => ["a", "b"],
      (item: string) => {
        const el = document.createElement("li");
        el.textContent = item;
        return el as unknown as ExpandedElement;
      },
      host,
      0,
    );

    expect(runtime.records.length).toBe(2);
    (host as unknown as HTMLElement).remove();
  });

  it("when runtime registers without a marker finalizer", async () => {
    stubFinalizationRegistry();
    const runtimeModule = await import("../../src/when/runtime");

    const host = document.createElement("div") as unknown as ExpandedElement<"div">;
    const startMarker = document.createComment("when-start-0");
    const endMarker = document.createComment("when-end");
    (host as unknown as HTMLElement).append(startMarker, endMarker);
    document.body.appendChild(host as unknown as Node);

    const runtime = {
      startMarker,
      endMarker,
      host,
      index: 0,
      groups: [{ condition: () => true, content: ["yes"] }],
      elseContent: [],
      activeIndex: null as number | null,
      update() {
        runtimeModule.renderWhenContent(runtime);
      },
    };

    expect(() => runtimeModule.registerWhenRuntime(runtime)).not.toThrow();
    expect(() => runtimeModule.updateWhenRuntimes()).not.toThrow();
    expect((host as unknown as HTMLElement).textContent).toBe("yes");
    (host as unknown as HTMLElement).remove();
  });
});
