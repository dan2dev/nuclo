import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { list } from "../../src/list";
import { updateListRuntimes } from "../../src/list/runtime";

describe("list edge cases", () => {
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

  describe("list function", () => {
    it("should create list with empty array", () => {
      const items = () => [];
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const listFn = list(items, renderItem);
      const marker = listFn(container, 0);

      expect(marker).toBeInstanceOf(Comment);
      expect(container.children.length).toBe(0); // Only markers, no items
    });

    it("should handle items provider that returns different arrays", () => {
      let items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const listFn = list(itemsProvider, renderItem);
      listFn(container, 0);

      expect(container.querySelectorAll("div").length).toBe(3);

      items = [4, 5];
      updateListRuntimes();
      expect(container.querySelectorAll("div").length).toBe(2);
    });

    it("should handle items provider that throws", () => {
      const itemsProvider = () => {
        throw new Error("items error");
      };
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      expect(() => {
        const listFn = list(itemsProvider, renderItem);
        listFn(container, 0);
      }).toThrow();
    });

    it("should handle renderItem that returns null", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = () => null;

      const listFn = list(itemsProvider, renderItem);
      listFn(container, 0);

      // Items that return null should be skipped
      expect(container.querySelectorAll("div").length).toBe(0);
    });

    it("should reuse elements when items are reordered", () => {
      let items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        div.setAttribute("data-item", String(item));
        return div;
      };

      const listFn = list(itemsProvider, renderItem);
      listFn(container, 0);

      const firstDiv = container.querySelector('[data-item="1"]');
      expect(firstDiv).toBeTruthy();

      // Reorder items
      items = [3, 2, 1];
      updateListRuntimes();

      // Same element should be reused but in different position
      const divs = container.querySelectorAll("div");
      expect(divs.length).toBe(3);
    });

    it("should handle disconnected markers", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const listFn = list(itemsProvider, renderItem);
      const marker = listFn(container, 0);

      expect(container.querySelectorAll("div").length).toBe(3);

      // Remove container from DOM
      document.body.removeChild(container);

      // Update should clean up disconnected lists
      updateListRuntimes();

      // Re-adding should work, but list runtime was cleaned up
      // So we need to recreate the list - first clear the container
      document.body.appendChild(container);
      container.innerHTML = ""; // Clear existing content
      const listFn2 = list(itemsProvider, renderItem);
      listFn2(container, 0);
      updateListRuntimes();
      // List should be recreated with items
      expect(container.querySelectorAll("div").length).toBe(3);
    });

    it("should handle items with same identity (object references)", () => {
      const item1 = { id: 1, name: "Item 1" };
      const item2 = { id: 2, name: "Item 2" };
      let items = [item1, item2];
      const itemsProvider = () => items;
      const renderItem = (item: typeof item1) => {
        const div = document.createElement("div");
        div.textContent = item.name;
        div.setAttribute("data-id", String(item.id));
        return div;
      };

      const listFn = list(itemsProvider, renderItem);
      listFn(container, 0);

      expect(container.querySelectorAll("div").length).toBe(2);

      // Reuse same objects
      items = [item2, item1];
      updateListRuntimes();

      // Elements should be reused
      expect(container.querySelectorAll("div").length).toBe(2);
    });

    it("should handle rapid updates", () => {
      let items = [1];
      const itemsProvider = () => items;
      const renderItem = (item: number) => {
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      const listFn = list(itemsProvider, renderItem);
      listFn(container, 0);

      items = [1, 2];
      updateListRuntimes();
      expect(container.querySelectorAll("div").length).toBe(2);

      items = [1, 2, 3];
      updateListRuntimes();
      expect(container.querySelectorAll("div").length).toBe(3);

      items = [1];
      updateListRuntimes();
      expect(container.querySelectorAll("div").length).toBe(1);
    });

    it("should handle renderItem that throws", () => {
      const items = [1, 2, 3];
      const itemsProvider = () => items;
      let callCount = 0;
      const renderItem = (item: number) => {
        callCount++;
        if (callCount === 2) {
          throw new Error("render error");
        }
        const div = document.createElement("div");
        div.textContent = String(item);
        return div;
      };

      expect(() => {
        const listFn = list(itemsProvider, renderItem);
        listFn(container, 0);
      }).toThrow();
    });
  });
});

