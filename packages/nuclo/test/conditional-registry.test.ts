/**
 * @vitest-environment jsdom
 *
 * Tests for the conditional node registry optimization.
 *
 * Goals:
 *  - Ensure conditional nodes are registered when created.
 *  - Ensure registry updates when a conditional toggles (element <-> comment).
 *  - Ensure disconnected (removed) conditional nodes are pruned on update().
 *  - Ensure no DOM-wide TreeWalker scan is performed (createTreeWalker not called).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { update } from "../src";
import {
  getActiveConditionalNodes,
  unregisterConditionalNode,
  getConditionalInfo,
} from "../src/utility/conditionalInfo";

// Global tag builders (registered by runtime bootstrap)
declare const div: any;

/**
 * Utility to fully reset registry between tests. Since the registry
 * is a module-level singleton, we explicitly unregister everything.
 */
function resetConditionalRegistry(): void {
  for (const node of Array.from(getActiveConditionalNodes())) {
    unregisterConditionalNode(node);
  }
}

describe("Conditional Registry", () => {
  let container: HTMLDivElement;
  let state: { visible: boolean; flag: boolean };

  beforeEach(() => {
    // Reset DOM & registry
    document.body.innerHTML = "";
    resetConditionalRegistry();

    container = document.createElement("div");
    document.body.appendChild(container);
    state = { visible: true, flag: false };
  });

  it("registers a conditional node on creation (initially visible)", () => {
    const produced = div(
      () => state.visible,
      "Visible content",
      { id: "cond-visible" }
    )(container);

    container.appendChild(produced as unknown as Node);

    // We expect exactly one active conditional node (the element itself).
    const active = Array.from(getActiveConditionalNodes());
    expect(active.length).toBe(1);

    const node = active[0];
    expect(node.nodeType).toBe(Node.ELEMENT_NODE);
    expect((node as HTMLElement).id).toBe("cond-visible");
    // Confirm conditional info is attached
    expect(getConditionalInfo(node)).toBeTruthy();
  });

  it("registers a conditional node when initially hidden (comment placeholder)", () => {
    state.visible = false;

    const produced = div(
      () => state.visible,
      "Hidden content",
      { id: "cond-hidden" }
    )(container);

    container.appendChild(produced as unknown as Node);

    const active = Array.from(getActiveConditionalNodes());
    expect(active.length).toBe(1);

    const node = active[0];
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    expect(getConditionalInfo(node)).toBeTruthy();

    // There should be no element with the id yet
    expect(container.querySelector("#cond-hidden")).toBeNull();
  });

  it("replaces element with comment and updates registry after second update (pruning disconnected)", () => {
    const produced = div(
      () => state.visible,
      "Toggle test",
      { id: "toggle-test" }
    )(container);
    container.appendChild(produced as unknown as Node);

    const [originalNode] = Array.from(getActiveConditionalNodes());
    expect(originalNode).toBeTruthy();
    expect(originalNode.nodeType).toBe(Node.ELEMENT_NODE);

    // Toggle to hidden
    state.visible = false;
    update(); // Performs replacement (element -> comment)

    // After first update, old element still in set (will be pruned on next cycle)
    const afterFirst = Array.from(getActiveConditionalNodes());
    expect(afterFirst.length).toBe(2); // Old element + new comment (registered)
    const hasOldElement = afterFirst.includes(originalNode);
    expect(hasOldElement).toBe(true);

    // Run another update to allow pruning of disconnected old element
    update();
    const afterSecond = Array.from(getActiveConditionalNodes());

    // Should now only have the comment placeholder
    expect(afterSecond.length).toBe(1);
    expect(afterSecond.includes(originalNode)).toBe(false);
    expect(afterSecond[0].nodeType).toBe(Node.COMMENT_NODE);
  });

  it("replaces comment with element and prunes disconnected comment on next update", () => {
    state.visible = false;

    const produced = div(
      () => state.visible,
      "Cycle test",
      { id: "cycle-test" }
    )(container);
    container.appendChild(produced as unknown as Node);

    const [originalComment] = Array.from(getActiveConditionalNodes());
    expect(originalComment.nodeType).toBe(Node.COMMENT_NODE);

    // Toggle visible
    state.visible = true;
    update(); // Replaces comment with element

    // Both old comment and new element present until pruning
    const intermediate = Array.from(getActiveConditionalNodes());
    expect(intermediate.length).toBe(2);

    const hasOldComment = intermediate.includes(originalComment);
    expect(hasOldComment).toBe(true);

    update(); // Prune pass
    const finalActive = Array.from(getActiveConditionalNodes());
    expect(finalActive.length).toBe(1);
    expect(finalActive[0].nodeType).toBe(Node.ELEMENT_NODE);
    expect(finalActive.includes(originalComment)).toBe(false);
  });

  it("prunes a conditional node removed from the DOM without toggling", () => {
    const produced = div(
      () => state.visible,
      "Removable",
      { id: "removable" }
    )(container);
    container.appendChild(produced as unknown as Node);

    expect(Array.from(getActiveConditionalNodes()).length).toBe(1);

    // Remove the element directly
    const element = container.querySelector("#removable")!;
    container.removeChild(element);

    // Registry still has 1 before update
    expect(Array.from(getActiveConditionalNodes()).length).toBe(1);

    // Trigger update to prune disconnected node
    update();
    expect(Array.from(getActiveConditionalNodes()).length).toBe(0);
  });

  it("does not call document.createTreeWalker during updates (no full DOM scan)", () => {
    const originalCreateTreeWalker = document.createTreeWalker;
    let called = false;

    // Monkey patch to detect unexpected usage
    (document as any).createTreeWalker = (...args: any[]) => {
      called = true;
      return originalCreateTreeWalker.apply(document, args as any);
    };

    try {
      // Create multiple conditionals
      const a = div(() => state.visible, "A", { id: "a" })(container);
      const b = div(() => !state.visible, "B", { id: "b" })(container);
      container.appendChild(a as unknown as Node);
      container.appendChild(b as unknown as Node);

      // Multiple updates
      update();
      state.visible = !state.visible;
      update();
      state.visible = !state.visible;
      update();

      expect(called).toBe(false);
    } finally {
      document.createTreeWalker = originalCreateTreeWalker;
    }
  });

  it("maintains correct registry size with multiple independent conditionals", () => {
    const el1 = div(() => state.visible, "One", { id: "one" })(container);
    const el2 = div(() => !state.visible, "Two", { id: "two" })(container);
    const el3 = div(() => state.flag, "Three", { id: "three" })(container);

    container.appendChild(el1 as unknown as Node);
    container.appendChild(el2 as unknown as Node);
    container.appendChild(el3 as unknown as Node);

    // el1, el2, el3 (all registered regardless of visibility)
    expect(Array.from(getActiveConditionalNodes()).length).toBe(3);

    // Flip states
    state.visible = false;
    state.flag = true;
    update();     // replacement phase
    update();     // prune phase

    // Still 3 active (each conditional has current representation)
    expect(Array.from(getActiveConditionalNodes()).length).toBe(3);

    // Remove one from DOM
    const toRemove = container.querySelector("#two");
    if (toRemove) {
      container.removeChild(toRemove);
    } else {
      // If currently a comment (hidden), remove the comment node
      const comment = Array.from(container.childNodes).find(
        n => n.nodeType === Node.COMMENT_NODE && (n as Comment).nodeValue?.includes("conditional-div")
      );
      if (comment) container.removeChild(comment);
    }

    // Prune
    update();
    expect(Array.from(getActiveConditionalNodes()).length).toBe(2);
  });

  it("keeps conditional info attached after multiple toggles", () => {
    const produced = div(
      () => state.visible,
      "Multi-toggle",
      { id: "multi" }
    )(container);
    container.appendChild(produced as unknown as Node);

    // Perform several visibility flips
    for (let i = 0; i < 4; i++) {
      state.visible = !state.visible;
      update(); // replacement
      update(); // prune
      const activeNodes = Array.from(getActiveConditionalNodes());
      expect(activeNodes.length).toBe(1);
      const info = getConditionalInfo(activeNodes[0]);
      expect(info).toBeTruthy();
      expect(info?.tagName).toBe("div");
    }
  });
});