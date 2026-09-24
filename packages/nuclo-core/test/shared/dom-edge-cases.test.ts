/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  safeRemoveChild,
  createMarkerPair,
  clearBetweenMarkers,
  insertNodesBefore,
} from "../../src/shared/dom";

describe("dom utility edge cases", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe("safeRemoveChild", () => {
    it("should return false for null child", () => {
      expect(safeRemoveChild(null as any)).toBe(false);
    });

    it("should return false for child without parent", () => {
      const child = document.createElement("div");
      expect(safeRemoveChild(child)).toBe(false);
    });

    it("should return true for valid removal", () => {
      const child = document.createElement("div");
      container.appendChild(child);
      expect(safeRemoveChild(child)).toBe(true);
      expect(container.contains(child)).toBe(false);
    });

    it("should handle removal errors gracefully", () => {
      const child = document.createElement("div");
      container.appendChild(child);
      
      // Mock parentNode.removeChild to throw
      const originalRemove = child.parentNode!.removeChild;
      child.parentNode!.removeChild = () => {
        throw new Error("remove error");
      };

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(safeRemoveChild(child)).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      child.parentNode!.removeChild = originalRemove;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("createMarkerPair", () => {
    it("should create start and end markers", () => {
      const pair = createMarkerPair("test", 0);
      expect(pair.start).toBeInstanceOf(Comment);
      expect(pair.end).toBeInstanceOf(Comment);
      expect(pair.start.textContent).toBe("test-start-0");
      expect(pair.end.textContent).toBe("test-end");
    });

  });

  describe("clearBetweenMarkers", () => {
    it("should clear nodes between markers", () => {
      const start = document.createComment("start");
      const end = document.createComment("end");
      const node1 = document.createElement("div");
      const node2 = document.createElement("span");
      
      container.appendChild(start as Node);
      container.appendChild(node1);
      container.appendChild(node2);
      container.appendChild(end as Node);

      clearBetweenMarkers(start, end);
      
      expect(container.contains(node1)).toBe(false);
      expect(container.contains(node2)).toBe(false);
      expect(container.contains(start)).toBe(true);
      expect(container.contains(end)).toBe(true);
    });

    it("should handle no nodes between markers", () => {
      const start = document.createComment("start") as Comment;
      const end = document.createComment("end") as Comment;
      
      container.appendChild(start);
      container.appendChild(end);

      clearBetweenMarkers(start, end);
      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle markers that are adjacent", () => {
      const start = document.createComment("start") as Comment;
      const end = document.createComment("end") as Comment;
      
      container.appendChild(start);
      container.appendChild(end);

      clearBetweenMarkers(start, end);
      expect(container.childNodes.length).toBe(2);
    });
  });

  describe("insertNodesBefore", () => {
    it("should insert nodes before reference", () => {
      const reference = document.createElement("div");
      const node1 = document.createElement("span");
      const node2 = document.createElement("p");
      
      container.appendChild(reference);
      insertNodesBefore([node1, node2], reference);
      
      expect(container.childNodes[0]).toBe(node1);
      expect(container.childNodes[1]).toBe(node2);
      expect(container.childNodes[2]).toBe(reference);
    });

    it("should handle empty nodes array", () => {
      const reference = document.createElement("div");
      container.appendChild(reference);
      
      insertNodesBefore([], reference);
      expect(container.childNodes.length).toBe(1);
    });

    it("should handle reference without parent", () => {
      const reference = document.createElement("div");
      const node = document.createElement("span");
      
      // Should not throw, just do nothing
      insertNodesBefore([node], reference);
      expect(reference.parentNode).toBeNull();
    });
  });

});

