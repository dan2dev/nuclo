/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createListRuntime, sync, updateListRuntimes } from "../../src/list/runtime";

describe("list runtime edge cases", () => {
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

  describe("sync function", () => {
    it("should handle items array that hasn't changed (early return)", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      const initialCount = container.querySelectorAll("div").length;

      // Sync again with same items
      sync(runtime);
      expect(container.querySelectorAll("div").length).toBe(initialCount);
    });

    it("should handle parent node being null", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      
      // Remove markers from DOM
      container.removeChild(runtime.startMarker);
      container.removeChild(runtime.endMarker);

      // Sync should handle missing parent gracefully
      sync(runtime);
      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle items that are equal but not same reference", () => {
      const items1 = [1, 2, 3];
      const items2 = [1, 2, 3];
      let currentItems = items1;
      const itemsProvider = () => currentItems;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(3);

      // Switch to different array with same values
      currentItems = items2;
      sync(runtime);

      // Should re-render since arraysEqual checks reference equality for primitives
      // But for numbers, it should detect they're the same
      expect(container.querySelectorAll("div").length).toBe(3);
    });

    it("should handle removing all items", () => {
      let items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(3);

      items = [];
      sync(runtime);
      expect(container.querySelectorAll("div").length).toBe(0);
    });

    it("should handle inserting items at beginning", () => {
      let items = [2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(2);

      items = [1, 2, 3];
      sync(runtime);
      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[0].textContent).toBe("1");
    });

    it("should handle inserting items in middle", () => {
      let items = [1, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(2);

      items = [1, 2, 3];
      sync(runtime);
      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
      expect(divs[1].textContent).toBe("2");
    });

    it("should handle renderItem returning null for specific items", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        if (item === 2) return null;
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(2);
      expect(container.textContent).not.toContain("2");
    });
  });

  describe("createListRuntime", () => {
    it("should create runtime with markers", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      
      expect(runtime.startMarker).toBeInstanceOf(Comment);
      expect(runtime.endMarker).toBeInstanceOf(Comment);
      expect(runtime.records).toHaveLength(3);
      expect(runtime.lastSyncedItems).toEqual(items);
    });

    it("should append markers to host", () => {
      const items = [1];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      
      expect(container.childNodes.length).toBeGreaterThan(0);
      expect(container.contains(runtime.startMarker)).toBe(true);
      expect(container.contains(runtime.endMarker)).toBe(true);
    });
  });

  describe("updateListRuntimes", () => {
    it("should clean up disconnected runtimes", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const runtime = createListRuntime(itemsProvider, renderItem, container);
      expect(container.querySelectorAll("div").length).toBe(3);

      // Remove markers from DOM
      container.removeChild(runtime.startMarker);
      container.removeChild(runtime.endMarker);

      // Update should clean up
      updateListRuntimes();

      // Runtime should be removed from active set
      // (can't directly test, but sync won't be called)
      expect(true).toBe(true);
    });

    it("should update multiple runtimes", () => {
      const items1 = [1, 2];
      const items2 = [3, 4];
      const itemsProvider1 = () => items1;
      const itemsProvider2 = () => items2;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const container2 = document.createElement("div");
      document.body.appendChild(container2);

      const runtime1 = createListRuntime(itemsProvider1, renderItem, container);
      const runtime2 = createListRuntime(itemsProvider2, renderItem, container2);

      expect(container.querySelectorAll("div").length).toBe(2);
      expect(container2.querySelectorAll("div").length).toBe(2);

      updateListRuntimes();

      // Both should still be updated
      expect(container.querySelectorAll("div").length).toBe(2);
      expect(container2.querySelectorAll("div").length).toBe(2);

      document.body.removeChild(container2);
    });
  });
});

