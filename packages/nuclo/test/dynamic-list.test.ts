// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { list } from '../src/list/index.js';
import { update } from '../src/core/updateController.js';

describe('Dynamic List - Comment Markers', () => {
  let testItems: Array<{ id: number; name: string; }>;
  let container: HTMLElement;

  beforeEach(() => {
    testItems = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('list function - comment markers', () => {
    it('should create comment markers and render items inline', () => {
      const listFn = list(() => testItems, (item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.setAttribute('data-item-id', item.id.toString());
        return div as any;
      });

      const marker = listFn(container as any, 0) as Comment;

      // Should return a comment marker
      expect(marker.nodeType).toBe(Node.COMMENT_NODE);
      expect(marker.textContent).toMatch(/list-start-/);

      // Container should have: start-comment, 3 items, end-comment = 5 children
      expect(container.childNodes).toHaveLength(5);

      // Check structure: comment, item1, item2, item3, comment
      expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(container.childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
      expect(container.childNodes[2].nodeType).toBe(Node.ELEMENT_NODE);
      expect(container.childNodes[3].nodeType).toBe(Node.ELEMENT_NODE);
      expect(container.childNodes[4].nodeType).toBe(Node.COMMENT_NODE);

      // Check content
      expect((container.childNodes[1] as Element).textContent).toBe('Item 1');
      expect((container.childNodes[2] as Element).textContent).toBe('Item 2');
      expect((container.childNodes[3] as Element).textContent).toBe('Item 3');
    });

    it('should preserve siblings when rendering list', () => {
      // Add some siblings first
      const before = document.createElement('p');
      before.textContent = 'Before list';
      container.appendChild(before);

      const listFn = list(() => testItems, (item) => {
        const span = document.createElement('span');
        span.textContent = item.name;
        return span as any;
      });

      listFn(container as any, 0);

      const after = document.createElement('p');
      after.textContent = 'After list';
      container.appendChild(after);

      // Should have: before, start-comment, 3 items, end-comment, after = 7 children
      expect(container.childNodes).toHaveLength(7);
      expect((container.childNodes[0] as Element).textContent).toBe('Before list');
      expect(container.childNodes[1].nodeType).toBe(Node.COMMENT_NODE);
      expect((container.childNodes[2] as Element).textContent).toBe('Item 1');
      expect((container.childNodes[6] as Element).textContent).toBe('After list');
    });

    it('should handle empty arrays', () => {
      const emptyItems: any[] = [];
      const listFn = list(() => emptyItems, (item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        return div as any;
      });

      listFn(container as any, 0);

      // Should only have start and end comments
      expect(container.childNodes).toHaveLength(2);
      expect(container.childNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(container.childNodes[1].nodeType).toBe(Node.COMMENT_NODE);
    });
  });

  describe('update function - reordering and preservation', () => {
    let listElements: Element[];

    beforeEach(() => {
      const listFn = list(() => testItems, (item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.setAttribute('data-item-id', item.id.toString());
        return div as any;
      });

      listFn(container as any, 0);

      // Store references to original elements
      listElements = Array.from(container.querySelectorAll('[data-item-id]'));
    });

    it('should preserve DOM elements when reordering', () => {
      // Reverse the array
      testItems.reverse();
      update();

      // Elements should be reordered but same instances
      const newElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(newElements).toHaveLength(3);

      // Check order is reversed
      expect(newElements[0].textContent).toBe('Item 3');
      expect(newElements[1].textContent).toBe('Item 2');
      expect(newElements[2].textContent).toBe('Item 1');

      // Original elements should be reused (same object references)
      expect(newElements[0]).toBe(listElements[2]); // Item 3 element
      expect(newElements[1]).toBe(listElements[1]); // Item 2 element
      expect(newElements[2]).toBe(listElements[0]); // Item 1 element
    });

    it('should add new items without recreating existing ones', () => {
      const originalElement1 = container.querySelector('[data-item-id="1"]');

      testItems.push({ id: 4, name: 'Item 4' });
      update();

      const newElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(newElements).toHaveLength(4);
      expect(newElements[3].textContent).toBe('Item 4');

      // Original elements should still be the same instances
      expect(container.querySelector('[data-item-id="1"]')).toBe(originalElement1);
    });

    it('should remove items while preserving others', () => {
      const originalElement1 = container.querySelector('[data-item-id="1"]');
      const originalElement3 = container.querySelector('[data-item-id="3"]');

      // Remove middle item
      testItems.splice(1, 1); // Remove Item 2
      update();

      const newElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(newElements).toHaveLength(2);
      expect(newElements[0].textContent).toBe('Item 1');
      expect(newElements[1].textContent).toBe('Item 3');

      // Remaining elements should be the same instances
      expect(newElements[0]).toBe(originalElement1);
      expect(newElements[1]).toBe(originalElement3);
    });

    it('should handle complex reordering with additions and removals', () => {
      const originalElement1 = container.querySelector('[data-item-id="1"]');
      const originalElement3 = container.querySelector('[data-item-id="3"]');
      const originalItem1 = testItems[0]; // Keep reference to original object
      const originalItem3 = testItems[2]; // Keep reference to original object

      // Complex change: remove item 2, add item 4, reorder using original object references
      testItems.splice(0, testItems.length); // Clear array
      testItems.push(
        { id: 4, name: 'Item 4' }, // new
        originalItem3,             // preserved reference
        originalItem1              // preserved reference
        // originalItem2 removed
      );
      update();

      const newElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(newElements).toHaveLength(3);
      expect(newElements[0].textContent).toBe('Item 4'); // new
      expect(newElements[1].textContent).toBe('Item 3'); // preserved
      expect(newElements[2].textContent).toBe('Item 1'); // preserved

      // Check that preserved elements are same instances
      expect(newElements[1]).toBe(originalElement3);
      expect(newElements[2]).toBe(originalElement1);
    });

    it('should preserve siblings during updates', () => {
      // Add siblings
      const before = document.createElement('h1');
      before.textContent = 'Title';
      container.insertBefore(before, container.firstChild);

      const after = document.createElement('footer');
      after.textContent = 'Footer';
      container.appendChild(after);

      // Modify list
      testItems.reverse();
      update();

      // Check that siblings are preserved in correct positions
      expect(container.firstChild).toBe(before);
      expect(container.lastChild).toBe(after);
      expect(container.firstChild!.textContent).toBe('Title');
      expect(container.lastChild!.textContent).toBe('Footer');

      // List should be reordered between siblings
      const listElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(listElements[0].textContent).toBe('Item 3');
      expect(listElements[1].textContent).toBe('Item 2');
      expect(listElements[2].textContent).toBe('Item 1');
    });

    it('should keep duplicate object references in sync with the array order', () => {
      document.body.removeChild(container);
      container = document.createElement('div');
      document.body.appendChild(container);

      const shared = { id: 1, name: 'Shared' };
      const other = { id: 2, name: 'Other' };
      const itemsWithDuplicates = [shared, other, shared];

      const listFn = list(() => itemsWithDuplicates, (item, index) => {
        const div = document.createElement('div');
        div.textContent = `${item.name} - ${index}`;
        div.setAttribute('data-item-id', item.id.toString());
        return div as any;
      });

      listFn(container as any, 0);

      const initialElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(initialElements).toHaveLength(3);
      expect(initialElements.map(el => el.getAttribute('data-item-id'))).toEqual(['1', '2', '1']);

      const duplicateNodes = Array.from(container.querySelectorAll('[data-item-id="1"]'));
      expect(duplicateNodes).toHaveLength(2);

      itemsWithDuplicates.sort((a, b) => a.id - b.id);
      update();

      const sortedElements = Array.from(container.querySelectorAll('[data-item-id]'));
      expect(sortedElements).toHaveLength(3);
      expect(sortedElements.map(el => el.getAttribute('data-item-id'))).toEqual(['1', '1', '2']);

      const updatedDuplicates = Array.from(container.querySelectorAll('[data-item-id="1"]'));
      expect(updatedDuplicates).toHaveLength(2);
      expect(updatedDuplicates[0]).toBe(duplicateNodes[0]);
      expect(updatedDuplicates[1]).toBe(duplicateNodes[1]);
    });
  });

  describe('multiple lists in same container', () => {
    it('should handle multiple independent lists', () => {
      const items1 = [{ id: 1, name: 'List1-Item1' }, { id: 2, name: 'List1-Item2' }];
      const items2 = [{ id: 1, name: 'List2-Item1' }, { id: 2, name: 'List2-Item2' }];

      const list1Fn = list(() => items1, (item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.className = 'list1';
        return div as any;
      });

      const separator = document.createElement('hr');
      container.appendChild(separator);

      const list2Fn = list(() => items2, (item) => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.className = 'list2';
        return div as any;
      });

      list1Fn(container as any, 0);
      list2Fn(container as any, 0);

      // Should have: separator, comment, 2 items, comment, comment, 2 items, comment = 9 children
      expect(container.childNodes).toHaveLength(9);

      // Modify only first list
      items1.reverse();
      update();

      const list1Elements = container.querySelectorAll('.list1');
      const list2Elements = container.querySelectorAll('.list2');

      expect(list1Elements).toHaveLength(2);
      expect(list2Elements).toHaveLength(2);

      // First list should be reversed
      expect(list1Elements[0].textContent).toBe('List1-Item2');
      expect(list1Elements[1].textContent).toBe('List1-Item1');

      // Second list should be unchanged
      expect(list2Elements[0].textContent).toBe('List2-Item1');
      expect(list2Elements[1].textContent).toBe('List2-Item2');
    });
  });

  describe('render function types', () => {
    it('should handle render functions that return NodeModFn', () => {
      const listFn = list(() => testItems, (item) => {
        return (parent: any, index: number) => {
          const div = document.createElement('div');
          div.textContent = `${item.name} at ${index}`;
          return div;
        };
      });

      listFn(container as any, 0);

      const elements = Array.from(container.querySelectorAll('div'));
      expect(elements).toHaveLength(3);
      expect(elements[0].textContent).toBe('Item 1 at 0');
      expect(elements[1].textContent).toBe('Item 2 at 1');
      expect(elements[2].textContent).toBe('Item 3 at 2');
    });

    it('should preserve element instances across different render patterns', () => {
      const item = { id: 1, name: 'Test Item', count: 0 };
      const items = [item];

      const listFn = list(() => items, (item) => {
        const div = document.createElement('div');
        div.textContent = `${item.name} - ${item.count}`;
        div.setAttribute('data-item-id', item.id.toString());
        return div as any;
      });

      listFn(container as any, 0);

      const originalElement = container.querySelector('[data-item-id="1"]');
      expect(originalElement!.textContent).toBe('Test Item - 0');

      // Modify item and update
      item.count = 1;
      update();

      const updatedElement = container.querySelector('[data-item-id="1"]');
      // Element should be the same instance (because we preserve based on item reference)
      expect(updatedElement).toBe(originalElement);
    });
  });

  describe('performance optimizations', () => {
    it('should not trigger DOM operations when list is unchanged', () => {
      // Track DOM insertions by spying on container's insertBefore
      const originalInsertBefore = container.insertBefore;
      let insertCallCount = 0;
      container.insertBefore = function<T extends Node>(child: T, reference: Node | null): T {
        insertCallCount++;
        return originalInsertBefore.call(this, child, reference) as T;
      };

      try {
        const listFn = list(() => testItems, (item) => {
          const div = document.createElement('div');
          div.textContent = item.name;
          div.setAttribute('data-item-id', item.id.toString());
          return div as any;
        });

        listFn(container as any, 0);
        
        // Reset counter after initial render
        insertCallCount = 0;

        // Call update() without changing the items array
        update();

        // Should not have triggered any DOM insertions in this container
        expect(insertCallCount).toBe(0);

        // Call update() multiple times - still no changes
        update();
        update();
        expect(insertCallCount).toBe(0);

        // Verify elements are still there and in correct order
        const elements = Array.from(container.querySelectorAll('[data-item-id]'));
        expect(elements).toHaveLength(3);
        expect(elements[0].textContent).toBe('Item 1');
        expect(elements[1].textContent).toBe('Item 2');
        expect(elements[2].textContent).toBe('Item 3');

      } finally {
        // Restore original method
        container.insertBefore = originalInsertBefore;
      }
    });

    it('should only trigger DOM operations when list actually changes', () => {
      const originalInsertBefore = container.insertBefore;
      let insertCallCount = 0;
      container.insertBefore = function<T extends Node>(child: T, reference: Node | null): T {
        insertCallCount++;
        return originalInsertBefore.call(this, child, reference) as T;
      };

      try {
        const listFn = list(() => testItems, (item) => {
          const div = document.createElement('div');
          div.textContent = item.name;
          return div as any;
        });

        listFn(container as any, 0);
        insertCallCount = 0;

        // No change - should not trigger DOM operations in this container
        update();
        expect(insertCallCount).toBe(0);

        // Make a change - should trigger DOM operations
        testItems.reverse();
        update();
        expect(insertCallCount).toBeGreaterThan(0);

        // Reset and verify no operations when unchanged again
        insertCallCount = 0;
        update();
        expect(insertCallCount).toBe(0);

      } finally {
        container.insertBefore = originalInsertBefore;
      }
    });
  });

});
