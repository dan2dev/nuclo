import { describe, it, expect, vi } from 'vitest';
import { NucloNode } from '../../src/polyfill/Node';

describe('NucloNode', () => {
  describe('constructor', () => {
    it('should create a node with default values', () => {
      const node = new NucloNode();

      expect(node.nodeType).toBe(1); // ELEMENT_NODE
      expect(node.nodeName).toBe('');
      expect(node.nodeValue).toBe(null);
      expect(node.parentNode).toBe(null);
      expect(node.textContent).toBe('');
    });
  });

  describe('childNodes', () => {
    it('should return empty NodeList initially', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      expect(childNodes.length).toBe(0);
      expect(childNodes).toBeDefined();
    });

    it('should return NodeList with item method', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      expect(typeof childNodes.item).toBe('function');
      expect(childNodes.item(0)).toBe(null);
    });

    it('should support iteration', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      // Should be iterable
      const items = [...childNodes];
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('should support forEach', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      const callback = vi.fn();
      childNodes.forEach(callback);

      expect(callback).not.toHaveBeenCalled(); // No children
    });

    it('should support entries', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      const entries = [...childNodes.entries()];
      expect(entries).toEqual([]);
    });

    it('should support keys', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      const keys = [...childNodes.keys()];
      expect(keys).toEqual([]);
    });

    it('should support values', () => {
      const node = new NucloNode();
      const childNodes = node.childNodes;

      const values = [...childNodes.values()];
      expect(values).toEqual([]);
    });
  });

  describe('childNodes with items', () => {
    it('should return correct length when children are added', () => {
      const node = new NucloNode();
      const child1 = {} as Node;
      const child2 = {} as Node;

      // Access internal _childNodes
      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      expect(childNodes.length).toBe(2);
    });

    it('should support item method with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      expect(childNodes.item(0)).toBe(child1);
      expect(childNodes.item(1)).toBe(child2);
      expect(childNodes.item(2)).toBe(null);
      expect(childNodes.item(-1)).toBe(null);
    });

    it('should support iteration with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const items = [...childNodes];

      expect(items).toEqual([child1, child2]);
    });

    it('should support forEach with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const callback = vi.fn();

      childNodes.forEach(callback);

      expect(callback).toHaveBeenCalledTimes(2);
      // Check first call
      expect(callback.mock.calls[0][0]).toBe(child1);
      expect(callback.mock.calls[0][1]).toBe(0);
      // Check second call
      expect(callback.mock.calls[1][0]).toBe(child2);
      expect(callback.mock.calls[1][1]).toBe(1);
    });

    it('should support entries with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const entries = [...childNodes.entries()];

      expect(entries).toEqual([
        [0, child1],
        [1, child2]
      ]);
    });

    it('should support keys with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const keys = [...childNodes.keys()];

      expect(keys).toEqual([0, 1]);
    });

    it('should support values with children', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const values = [...childNodes.values()];

      expect(values).toEqual([child1, child2]);
    });

    it('should support Symbol.iterator', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;

      (node as any)._childNodes = [child1, child2];

      const childNodes = node.childNodes;
      const iterator = childNodes[Symbol.iterator]();

      expect(iterator.next().value).toBe(child1);
      expect(iterator.next().value).toBe(child2);
      expect(iterator.next().done).toBe(true);
    });
  });

  describe('property mutations', () => {
    it('should allow nodeType to be changed', () => {
      const node = new NucloNode();

      node.nodeType = 3; // TEXT_NODE
      expect(node.nodeType).toBe(3);
    });

    it('should allow nodeName to be changed', () => {
      const node = new NucloNode();

      node.nodeName = 'DIV';
      expect(node.nodeName).toBe('DIV');
    });

    it('should allow nodeValue to be changed', () => {
      const node = new NucloNode();

      node.nodeValue = 'test value';
      expect(node.nodeValue).toBe('test value');
    });

    it('should allow parentNode to be changed', () => {
      const node = new NucloNode();
      const parent = new NucloNode();

      node.parentNode = parent;
      expect(node.parentNode).toBe(parent);
    });

    it('should allow textContent to be changed', () => {
      const node = new NucloNode();

      node.textContent = 'Hello World';
      expect(node.textContent).toBe('Hello World');
    });
  });

  describe('childNodes array spread', () => {
    it('should spread childNodes like an array', () => {
      const node = new NucloNode();
      const child1 = { nodeName: 'child1' } as Node;
      const child2 = { nodeName: 'child2' } as Node;
      const child3 = { nodeName: 'child3' } as Node;

      (node as any)._childNodes = [child1, child2, child3];

      const childNodes = node.childNodes;
      const spread = [...childNodes];

      expect(spread.length).toBe(3);
      expect(spread[0]).toBe(child1);
      expect(spread[1]).toBe(child2);
      expect(spread[2]).toBe(child3);
    });
  });

  describe('childNodes immutability', () => {
    it('should return a fresh NodeList on each access', () => {
      const node = new NucloNode();
      const child = {} as Node;

      (node as any)._childNodes = [child];

      const childNodes1 = node.childNodes;
      const childNodes2 = node.childNodes;

      // Should be different objects but same content
      expect(childNodes1).not.toBe(childNodes2);
      expect([...childNodes1]).toEqual([...childNodes2]);
    });
  });
});
