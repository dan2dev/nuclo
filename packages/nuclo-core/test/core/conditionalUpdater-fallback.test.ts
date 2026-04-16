/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateConditionalElements } from "../../src/core/conditionalUpdater";
import {
  storeConditionalInfo,
  unregisterConditionalNode,
  getActiveConditionalNodes,
} from "../../src/utility/conditionalInfo";
import {
  createHtmlConditionalElement,
  createSvgConditionalElement,
} from "../helpers/conditionalTestHelpers";
import * as applyModifiers from "../../src/internal/applyModifiers";

describe("conditionalUpdater - fallback paths", () => {
  let container: HTMLDivElement;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.restoreAllMocks();
  });

  describe("line 44 - updateConditionalNode returns early when getConditionalInfo is null", () => {
    it("returns early when a registered node has its conditional info removed before update", () => {
      // Create a conditional element that starts hidden (comment node)
      let visible = false;
      const node = createHtmlConditionalElement("span", () => visible, [
        "test",
      ]);
      container.appendChild(node as unknown as Node);

      // The node is now registered with conditional info.
      // Remove the conditional info but leave the node registered in the active set.
      // unregisterConditionalNode removes both info AND the active set entry,
      // so we need a different approach: we store new info then delete it from the map.
      // Actually, unregisterConditionalNode does both. Let's just verify no error occurs
      // when the node is in the active set but has no info.

      // We can verify by: creating a node, storing info, then removing just the info
      // via unregisterConditionalNode (which removes from both). But the node is still
      // in getActiveConditionalNodes because WeakRef hasn't been cleaned.
      // Actually unregisterConditionalNode DOES remove from activeConditionalNodes.

      // Alternative approach: register a bare node with info, then remove the info
      // by re-registering and unregistering on a different path.

      // Simplest: create a comment node, store conditional info, then unregister it
      // (removes info), then re-add it to active nodes by storing info and immediately
      // deleting just the info map entry.

      // Actually the cleanest way: just register a node, flip visible to true,
      // but mock getConditionalInfo to return null for that specific call.
      // Since we can't easily mock a module import, let's use a different approach.

      // The simplest test: call updateConditionalElements when there's a connected node
      // in the active set with no conditional info. We can do this by directly calling
      // storeConditionalInfo to register the node, then clearing the info.

      const comment = document.createComment("test-conditional");
      container.appendChild(comment);

      // Register with conditional info
      storeConditionalInfo(comment, {
        condition: () => true,
        tagName: "div" as ElementTagName,
        modifiers: [],
        isSvg: false,
      });

      // Now unregister and re-register just the active node (without info)
      // Since unregisterConditionalNode removes both, we need to re-add to active set.
      // But storeConditionalInfo is the only way to add to active set AND it stores info.

      // The realistic scenario: race condition where info is cleared between
      // getActiveConditionalNodes() and getConditionalInfo(). We can simulate this
      // by having the condition of a DIFFERENT node's evaluation trigger unregistration
      // of our target node.

      const comment2 = document.createComment("test-conditional-2");
      container.appendChild(comment2);

      // Register comment2 with a condition that unregisters comment when evaluated
      storeConditionalInfo(comment2, {
        condition: () => {
          // Side effect: unregister comment's conditional info
          unregisterConditionalNode(comment);
          return true;
        },
        tagName: "p" as ElementTagName,
        modifiers: [],
        isSvg: false,
      });

      // Now when updateConditionalElements runs, it iterates all active nodes.
      // If comment2 is processed first, its condition unregisters comment.
      // When comment is then processed, getConditionalInfo returns null => line 44.
      // This should not throw.
      expect(() => updateConditionalElements()).not.toThrow();
    });
  });

  describe("lines 29, 35 - SVG/HTML element creation fallback when modifiers throw", () => {
    it("falls back to basic HTML element when createHtmlElementWithModifiers throws", () => {
      // Create a hidden conditional element (comment) with a modifier that will throw
      const throwingModifier = () => {
        throw new Error("modifier error");
      };

      const comment = document.createComment("conditional-div-hidden");
      container.appendChild(comment);

      storeConditionalInfo(comment, {
        condition: () => true,
        tagName: "div" as ElementTagName,
        modifiers: [throwingModifier as unknown as NodeModFn<ElementTagName>],
        isSvg: false,
      });

      // The fallback path creates a basic element via createElement.
      // In jsdom, createElement always succeeds, so line 35 (null check throw) won't fire.
      // But we exercise the catch block and the fallback createElement path.
      expect(() => updateConditionalElements()).not.toThrow();

      // The comment should have been replaced with a div element
      const children = Array.from(container.childNodes);
      const replacedNode = children.find(
        (n) =>
          n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === "DIV",
      );
      expect(replacedNode).toBeTruthy();
    });

    it("falls back to basic SVG element when createSvgElementWithModifiers throws", () => {
      const throwingModifier = () => {
        throw new Error("svg modifier error");
      };

      const comment = document.createComment("conditional-rect-hidden");
      container.appendChild(comment);

      storeConditionalInfo(comment, {
        condition: () => true,
        tagName: "rect" as unknown as ElementTagName,
        modifiers: [throwingModifier as unknown as NodeModFn<ElementTagName>],
        isSvg: true,
      });

      // In jsdom, createElementNS always succeeds, so line 29 (null check throw) won't fire.
      // But we exercise the SVG catch block and the fallback createElementNS path.
      expect(() => updateConditionalElements()).not.toThrow();

      const children = Array.from(container.childNodes);
      const replacedNode = children.find(
        (n) =>
          n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === "rect",
      );
      expect(replacedNode).toBeTruthy();
    });

    it("throws when HTML fallback createElement returns null (line 35)", () => {
      // Mock createElement to return null so the fallback fails
      const origCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockReturnValue(null as any);

      // Also need createHtmlElementWithModifiers to throw first
      const throwingModifier = () => {
        throw new Error("modifier error");
      };

      const comment = document.createComment("conditional-div-hidden");
      // We need to manually add the comment since createElement is mocked
      // Use a container that was created before the mock
      container.appendChild(comment);

      storeConditionalInfo(comment, {
        condition: () => true,
        tagName: "div" as ElementTagName,
        modifiers: [throwingModifier as unknown as NodeModFn<ElementTagName>],
        isSvg: false,
      });

      // updateConditionalElements catches errors internally via logError,
      // but createElementFromConditionalInfo throws when fallback returns null.
      // The outer try/catch in updateConditionalElements catches it.
      expect(() => updateConditionalElements()).not.toThrow();

      // Error should have been logged
      expect(console.error).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it("throws when SVG fallback createElementNS returns null (line 29)", () => {
      // Mock createElementNS to return null so the SVG fallback fails
      const createElementNSSpy = vi
        .spyOn(document, "createElementNS")
        .mockReturnValue(null as any);

      const throwingModifier = () => {
        throw new Error("svg modifier error");
      };

      const comment = document.createComment("conditional-rect-hidden");
      container.appendChild(comment);

      storeConditionalInfo(comment, {
        condition: () => true,
        tagName: "rect" as unknown as ElementTagName,
        modifiers: [throwingModifier as unknown as NodeModFn<ElementTagName>],
        isSvg: true,
      });

      // The error from line 29 is caught by updateConditionalElements' outer try/catch
      expect(() => updateConditionalElements()).not.toThrow();

      // Error should have been logged
      expect(console.error).toHaveBeenCalled();

      createElementNSSpy.mockRestore();
    });
  });
});
