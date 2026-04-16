/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/utility/conditionalInfo.ts:
 *
 *  Line 53 – getActiveConditionalNodes: dead WeakRef → toDelete.push(ref)
 *  Line 60 – cleanup loop: activeConditionalNodes.delete(ref)
 *
 * We simulate a GC'd WeakRef by temporarily replacing the WeakRef constructor
 * with a fake that always returns undefined from deref(), registering a node,
 * then restoring the real WeakRef.  When getActiveConditionalNodes() runs it
 * will see a dead ref and trigger the cleanup path.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  storeConditionalInfo,
  getActiveConditionalNodes,
  hasConditionalInfo,
  getConditionalInfo,
  unregisterConditionalNode,
} from "../../src/utility/conditionalInfo";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Unit: storeConditionalInfo ────────────────────────────────────────────────
describe("storeConditionalInfo", () => {
  it("stores info and makes node retrievable", () => {
    const node = document.createElement("div");
    const info = {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };
    storeConditionalInfo(node, info);
    expect(hasConditionalInfo(node)).toBe(true);
    expect(getConditionalInfo(node)).toBe(info);
  });

  it("overwrites existing info for the same node", () => {
    const node = document.createElement("div");
    const info1 = {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };
    const info2 = {
      condition: () => false,
      tagName: "span" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };
    storeConditionalInfo(node, info1);
    storeConditionalInfo(node, info2);
    expect(getConditionalInfo(node)).toBe(info2);
  });
});

// ── Unit: getConditionalInfo ──────────────────────────────────────────────────
describe("getConditionalInfo", () => {
  it("returns null for a node with no stored info", () => {
    const node = document.createElement("div");
    expect(getConditionalInfo(node)).toBeNull();
  });
});

// ── Unit: hasConditionalInfo ──────────────────────────────────────────────────
describe("hasConditionalInfo", () => {
  it("returns false before storing", () => {
    const node = document.createElement("p");
    expect(hasConditionalInfo(node)).toBe(false);
  });

  it("returns false after unregistering", () => {
    const node = document.createElement("p");
    storeConditionalInfo(node, {
      condition: () => true,
      tagName: "p" as ElementTagName,
      modifiers: [],
      isSvg: false,
    });
    unregisterConditionalNode(node);
    expect(hasConditionalInfo(node)).toBe(false);
  });
});

// ── Unit: unregisterConditionalNode ───────────────────────────────────────────
describe("unregisterConditionalNode", () => {
  it("removes the node from both the map and the active set", () => {
    const node = document.createElement("section");
    storeConditionalInfo(node, {
      condition: () => true,
      tagName: "section" as ElementTagName,
      modifiers: [],
      isSvg: false,
    });
    expect(hasConditionalInfo(node)).toBe(true);

    unregisterConditionalNode(node);
    expect(hasConditionalInfo(node)).toBe(false);

    const activeNodes = getActiveConditionalNodes();
    expect(activeNodes).not.toContain(node);
  });

  it("is safe to call on a node that was never registered", () => {
    const node = document.createElement("em");
    expect(() => unregisterConditionalNode(node)).not.toThrow();
  });
});

// ── Unit: getActiveConditionalNodes – GC path (lines 53, 60) ──────────────────
describe("getActiveConditionalNodes – GC simulation (lines 53, 60)", () => {
  it("removes dead WeakRef entries and does not include them in results", () => {
    // Replace WeakRef globally with a version whose deref() always returns undefined
    const OriginalWeakRef = globalThis.WeakRef;

    class DeadWeakRef<T extends object> {
      deref(): T | undefined {
        return undefined;
      }
    }

    vi.stubGlobal("WeakRef", DeadWeakRef);

    // storeConditionalInfo now uses DeadWeakRef, so the entry will be "dead"
    const node = document.createElement("div");
    const info = {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };
    storeConditionalInfo(node, info);

    // Restore original WeakRef before calling getActiveConditionalNodes
    vi.stubGlobal("WeakRef", OriginalWeakRef);

    // Now getActiveConditionalNodes() finds a dead ref → lines 53 & 60
    const nodes = getActiveConditionalNodes();
    expect(nodes).not.toContain(node);
  });

  it("returns live nodes when WeakRef is working normally", () => {
    const node = document.createElement("article");
    const info = {
      condition: () => false,
      tagName: "article" as ElementTagName,
      modifiers: [],
      isSvg: false,
    };
    storeConditionalInfo(node, info);

    const nodes = getActiveConditionalNodes();
    expect(nodes).toContain(node);

    unregisterConditionalNode(node);
  });

  it("handles mix of dead and live refs in same pass", () => {
    const OriginalWeakRef = globalThis.WeakRef;

    // Register a node with dead WeakRef
    class DeadWeakRef<T extends object> {
      deref(): T | undefined {
        return undefined;
      }
    }
    vi.stubGlobal("WeakRef", DeadWeakRef);
    const deadNode = document.createElement("div");
    storeConditionalInfo(deadNode, {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    // Restore and register a live node
    vi.stubGlobal("WeakRef", OriginalWeakRef);
    const liveNode = document.createElement("span");
    storeConditionalInfo(liveNode, {
      condition: () => true,
      tagName: "span" as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    const nodes = getActiveConditionalNodes();
    expect(nodes).not.toContain(deadNode);
    expect(nodes).toContain(liveNode);

    unregisterConditionalNode(liveNode);
  });
});
