/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered defensive branches where the iteration set holds a live
 * WeakRef whose backing WeakMap entry is gone:
 *  - src/update/registry.ts lines 66-71: re-registration replaces info in place
 *  - src/update/reactive-text.ts lines 85-88: orphaned text ref is pruned
 *  - src/update/reactive-attributes.ts lines 158-161: orphaned element ref is pruned
 *  - src/update/conditional.ts lines 42-44: node without conditional info is skipped
 *  - src/when/runtime.ts lines 135-138: marker without a runtime is pruned
 */
import { describe, it, expect } from "vitest";
import {
  registerReactiveTextNode,
  registerReactiveElement,
  reactiveTextNodes,
  reactiveTextNodesByNode,
  reactiveElements,
  reactiveElementsByNode,
  storeConditionalInfo,
  unregisterConditionalNode,
} from "../../src/update/registry";
import { notifyReactiveTextNodes } from "../../src/update/reactive-text";
import { notifyReactiveElements } from "../../src/update/reactive-attributes";
import { updateConditionalElements } from "../../src/update/conditional";
import { registerWhenRuntime, updateWhenRuntimes, renderWhenContent } from "../../src/when/runtime";
import type { WhenRuntime } from "../../src/when/runtime";

describe("registerReactiveTextNode — re-registration", () => {
  it("replaces resolver and lastValue in place without adding a second ref", () => {
    const node = document.createTextNode("first");
    document.body.appendChild(node);

    registerReactiveTextNode(node, { resolver: () => "first", lastValue: "first" });
    const sizeAfterFirst = reactiveTextNodes.size;

    registerReactiveTextNode(node, { resolver: () => "second", lastValue: "stale" });
    expect(reactiveTextNodes.size).toBe(sizeAfterFirst);

    // The replacement info drives the next notify pass.
    notifyReactiveTextNodes();
    expect(node.textContent).toBe("second");

    node.remove();
  });
});

describe("notify passes with orphaned WeakMap entries", () => {
  it("prunes a connected text node whose info entry was removed", () => {
    const node = document.createTextNode("x");
    document.body.appendChild(node);
    registerReactiveTextNode(node, { resolver: () => "x", lastValue: "x" });

    // Orphan the iteration-set ref: entry gone, node still alive & connected.
    reactiveTextNodesByNode.delete(node);

    expect(() => notifyReactiveTextNodes()).not.toThrow();
    // The stale ref must have been dropped from the iteration set.
    for (const ref of reactiveTextNodes) {
      expect(ref.deref()).not.toBe(node);
    }
    node.remove();
  });

  it("prunes a connected element whose info entry was removed", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    registerReactiveElement(el, { attributeResolvers: [] });

    reactiveElementsByNode.delete(el);

    expect(() => notifyReactiveElements()).not.toThrow();
    for (const ref of reactiveElements) {
      expect(ref.deref()).not.toBe(el);
    }
    el.remove();
  });
});

describe("updateConditionalElements — node without conditional info", () => {
  it("skips a connected node whose info was removed but whose ref survives", () => {
    const comment = document.createComment("conditional-div-hidden");
    document.body.appendChild(comment);

    const info = {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };

    // Two stores put two WeakRefs in the active set; unregistering removes
    // only the second ref and the info map entry — the first ref survives and
    // now points at a node with no conditional info.
    storeConditionalInfo(comment, info);
    storeConditionalInfo(comment, info);
    unregisterConditionalNode(comment);

    expect(() => updateConditionalElements()).not.toThrow();
    // Without info the node must NOT be swapped for an element.
    expect(comment.isConnected).toBe(true);
    comment.remove();
  });
});

describe("updateWhenRuntimes — marker without a runtime", () => {
  it("prunes a ref whose runtime was already removed from the WeakMap", () => {
    const host = document.createElement("div") as unknown as ExpandedElement<"div">;
    const startMarker = document.createComment("when-start-0");
    const endMarker = document.createComment("when-end");
    (host as unknown as HTMLElement).append(startMarker, endMarker);
    // NOT appended to the document — the markers are disconnected.

    const makeRuntime = (): WhenRuntime<"div"> => {
      const runtime: WhenRuntime<"div"> = {
        startMarker,
        endMarker,
        host,
        index: 0,
        groups: [{ condition: () => true, content: [] }],
        elseContent: [],
        activeIndex: null,
        update() {
          renderWhenContent(runtime);
        },
      };
      return runtime;
    };

    // Two registrations on the same start marker: the second overwrites the
    // WeakMap entry, so the first ref becomes stale after the disconnected
    // runtime is cleaned up mid-sweep.
    registerWhenRuntime(makeRuntime());
    registerWhenRuntime(makeRuntime());

    expect(() => updateWhenRuntimes()).not.toThrow();
    expect(() => updateWhenRuntimes()).not.toThrow();
  });
});
