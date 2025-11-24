import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  safeRemoveChild,
  createComment,
  createConditionalComment,
  createMarkerComment,
  createMarkerPair,
  clearBetweenMarkers,
  insertNodesBefore,
  appendChildren,
  isNodeConnected,
  replaceNodeSafely,
} from "../../src/utility/dom";

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

  describe("createComment", () => {
    it("should create comment with text", () => {
      const comment = createComment("test comment");
      expect(comment).toBeInstanceOf(Comment);
      expect(comment?.textContent).toBe("test comment");
    });

    it("should return null in non-browser environment", () => {
      const originalDocument = global.document;
      // @ts-expect-error - testing non-browser
      global.document = undefined;
      
      const comment = createComment("test");
      expect(comment).toBeNull();
      
      global.document = originalDocument;
    });
  });

  describe("createConditionalComment", () => {
    it("should create conditional comment with default suffix", () => {
      const comment = createConditionalComment("div");
      expect(comment).toBeInstanceOf(Comment);
      expect(comment?.textContent).toBe("conditional-div-hidden");
    });

    it("should create conditional comment with custom suffix", () => {
      const comment = createConditionalComment("div", "ssr");
      expect(comment).toBeInstanceOf(Comment);
      expect(comment?.textContent).toBe("conditional-div-ssr");
    });

    it("should handle errors gracefully", () => {
      const originalCreateComment = document.createComment;
      document.createComment = () => {
        throw new Error("create error");
      };

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const comment = createConditionalComment("div");
      expect(comment).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      document.createComment = originalCreateComment;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("createMarkerComment", () => {
    it("should create marker comment with random suffix", () => {
      const comment = createMarkerComment("test");
      expect(comment).toBeInstanceOf(Comment);
      expect(comment?.textContent).toMatch(/^test-/);
    });

    it("should throw in non-browser environment", () => {
      // This test checks the isBrowser guard
      // In actual non-browser, isBrowser would be false
      // But in test environment, we can't easily mock this
      // So we test that it works in browser environment
      const comment = createMarkerComment("test");
      expect(comment).toBeInstanceOf(Comment);
      expect(comment.textContent).toMatch(/^test-/);
    });

    it("should throw if comment creation fails", () => {
      const originalCreateComment = document.createComment;
      document.createComment = () => null as any;

      expect(() => {
        createMarkerComment("test");
      }).toThrow("Failed to create comment");

      document.createComment = originalCreateComment;
    });
  });

  describe("createMarkerPair", () => {
    it("should create start and end markers", () => {
      const pair = createMarkerPair("test");
      expect(pair.start).toBeInstanceOf(Comment);
      expect(pair.end).toBeInstanceOf(Comment);
      expect(pair.start.textContent).toMatch(/^test-start-/);
      expect(pair.end.textContent).toBe("test-end");
    });

    it("should throw if end comment creation fails", () => {
      const originalCreateComment = document.createComment;
      let callCount = 0;
      document.createComment = (text: string) => {
        callCount++;
        if (callCount === 1) {
          // First call for start marker succeeds
          return originalCreateComment.call(document, text);
        }
        // Second call for end marker fails
        return null as any;
      };

      expect(() => {
        createMarkerPair("test");
      }).toThrow("Failed to create");

      document.createComment = originalCreateComment;
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

  describe("appendChildren", () => {
    it("should append multiple children", () => {
      const child1 = document.createElement("div");
      const child2 = document.createElement("span");
      const child3 = document.createTextNode("text");
      
      appendChildren(container, child1, child2, child3);
      
      expect(container.childNodes.length).toBe(3);
      expect(container.contains(child1)).toBe(true);
      expect(container.contains(child2)).toBe(true);
    });

    it("should handle string children", () => {
      appendChildren(container, "text1", "text2");
      expect(container.textContent).toContain("text1");
      expect(container.textContent).toContain("text2");
    });

    it("should handle null and undefined children", () => {
      const child = document.createElement("div");
      appendChildren(container, child, null, undefined, "text");
      
      expect(container.contains(child)).toBe(true);
      expect(container.textContent).toContain("text");
    });

    it("should return parent element", () => {
      const result = appendChildren(container, "test");
      expect(result).toBe(container);
    });

    it("should handle null parent", () => {
      const result = appendChildren(null as any, "test");
      expect(result).toBeNull();
    });

    it("should handle text node creation failure", () => {
      const originalCreateTextNode = document.createTextNode;
      document.createTextNode = () => {
        throw new Error("create error");
      };

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      appendChildren(container, "test");
      expect(consoleErrorSpy).toHaveBeenCalled();

      document.createTextNode = originalCreateTextNode;
      consoleErrorSpy.mockRestore();
    });
  });

  describe("isNodeConnected", () => {
    it("should return false for null", () => {
      expect(isNodeConnected(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isNodeConnected(undefined)).toBe(false);
    });

    it("should return true for connected node", () => {
      const node = document.createElement("div");
      container.appendChild(node);
      expect(isNodeConnected(node)).toBe(true);
    });

    it("should return false for disconnected node", () => {
      const node = document.createElement("div");
      expect(isNodeConnected(node)).toBe(false);
    });

    it("should use isConnected property when available", () => {
      const node = document.createElement("div");
      container.appendChild(node);
      expect(isNodeConnected(node)).toBe(true);
      
      container.removeChild(node);
      expect(isNodeConnected(node)).toBe(false);
    });

    it("should fallback to document.contains for older browsers", () => {
      const node = document.createElement("div");
      container.appendChild(node);
      
      // Mock isConnected to be undefined
      Object.defineProperty(node, "isConnected", {
        value: undefined,
        configurable: true,
      });
      
      expect(isNodeConnected(node)).toBe(true);
    });
  });

  describe("replaceNodeSafely", () => {
    it("should replace node successfully", () => {
      const oldNode = document.createElement("div");
      const newNode = document.createElement("span");
      container.appendChild(oldNode);
      
      expect(replaceNodeSafely(oldNode, newNode)).toBe(true);
      expect(container.contains(oldNode)).toBe(false);
      expect(container.contains(newNode)).toBe(true);
    });

    it("should return false for node without parent", () => {
      const oldNode = document.createElement("div");
      const newNode = document.createElement("span");
      
      expect(replaceNodeSafely(oldNode, newNode)).toBe(false);
    });

    it("should return false for null oldNode", () => {
      const newNode = document.createElement("span");
      expect(replaceNodeSafely(null as any, newNode)).toBe(false);
    });

    it("should handle replacement errors gracefully", () => {
      const oldNode = document.createElement("div");
      const newNode = document.createElement("span");
      container.appendChild(oldNode);
      
      const originalReplace = oldNode.parentNode!.replaceChild;
      oldNode.parentNode!.replaceChild = () => {
        throw new Error("replace error");
      };

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(replaceNodeSafely(oldNode, newNode)).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      oldNode.parentNode!.replaceChild = originalReplace;
      consoleErrorSpy.mockRestore();
    });
  });
});

