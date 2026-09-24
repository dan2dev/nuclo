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
    it('is empty for a bare node', () => {
      const node = new NucloNode();
      expect(node.childNodes.length).toBe(0);
      expect(Array.from(node.childNodes)).toEqual([]);
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

});
