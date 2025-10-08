import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMarkerComment,
  createMarkerPair,
  clearBetweenMarkers,
  insertNodesBefore,
  appendChildren,
  safeRemoveChild,
  isNodeConnected
} from '../../src/utility/dom';

describe('utility/dom edge & failure branches', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('appendChildren edge cases', () => {
    it('returns parent immediately when parent is null/undefined', () => {
      const result = appendChildren(null as any, 'x', 'y');
      expect(result).toBeNull();
    });

    it('skips null / undefined children and appends valid ones', () => {
      const span = document.createElement('span');
      span.textContent = 'ok';
      appendChildren(container, null, undefined, 'hello', span, undefined, 'world', null);
      const texts = Array.from(container.childNodes)
        .map(n => n.textContent)
        .filter(Boolean);
      expect(texts).toEqual(['hello', 'ok', 'world']);
    });

    it('handles empty invocation (no children) without modifying DOM', () => {
      appendChildren(container);
      expect(container.childNodes.length).toBe(0);
    });
  });

  describe('safeRemoveChild behavior', () => {
    it('returns false for node without parent', () => {
      const lone = document.createElement('p');
      expect(safeRemoveChild(lone)).toBe(false);
    });

    it('removes a child node and returns true then false on second attempt', () => {
      const child = document.createElement('div');
      container.appendChild(child);
      expect(safeRemoveChild(child)).toBe(true);
      expect(safeRemoveChild(child)).toBe(false);
    });
  });

  describe('marker utilities', () => {
    it('createMarkerComment produces unique comment nodes', () => {
      const a = createMarkerComment('test');
      const b = createMarkerComment('test');
      expect(a).toBeInstanceOf(Comment);
      expect(b).toBeInstanceOf(Comment);
      expect(a).not.toBe(b);
      expect(a.textContent).not.toBe(b.textContent);
      expect(a.textContent).toMatch(/^test-/);
    });

    it('createMarkerPair returns start & end comments with end marker suffix', () => {
      const { start, end } = createMarkerPair('section');
      expect(start).toBeInstanceOf(Comment);
      expect(end).toBeInstanceOf(Comment);
      expect(start.textContent).toMatch(/^section-start-/);
      expect(end.textContent).toBe('section-end');
    });

    it('clearBetweenMarkers removes only nodes between markers (including text)', () => {
      const { start, end } = createMarkerPair('blk');
      container.appendChild(start);
      const mid1 = document.createElement('span');
      mid1.textContent = 'one';
      const mid2 = document.createTextNode('two');
      const mid3 = document.createElement('i');
      mid3.textContent = 'three';
      container.appendChild(mid1);
      container.appendChild(mid2);
      container.appendChild(mid3);
      container.appendChild(end);

      expect(container.childNodes.length).toBe(5);
      clearBetweenMarkers(start, end);
      // Only start + end remain
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0]).toBe(start);
      expect(container.childNodes[1]).toBe(end);
    });

    it('clearBetweenMarkers no-ops when nothing between markers', () => {
      const { start, end } = createMarkerPair('solo');
      container.appendChild(start);
      container.appendChild(end);
      clearBetweenMarkers(start, end);
      expect(container.childNodes.length).toBe(2);
    });
  });

  describe('insertNodesBefore edge cases', () => {
    it('does nothing when reference node is detached', () => {
      const ref = document.createComment('detached-ref');
      const n1 = document.createElement('div');
      n1.textContent = 'A';
      insertNodesBefore([n1], ref);
      expect(n1.parentNode).toBeNull();
    });

    it('inserts multiple nodes in correct order before reference', () => {
      const ref = document.createElement('p');
      ref.textContent = 'ref';
      container.appendChild(ref);

      const a = document.createElement('span');
      a.textContent = 'A';
      const b = document.createElement('span');
      b.textContent = 'B';
      insertNodesBefore([a, b], ref);

      const texts = Array.from(container.childNodes).map(n => n.textContent);
      expect(texts).toEqual(['A', 'B', 'ref']);
    });
  });

  describe('isNodeConnected behavior', () => {
    it('returns false for null / undefined', () => {
      expect(isNodeConnected(null as any)).toBe(false);
      expect(isNodeConnected(undefined as any)).toBe(false);
    });

    it('detects connected node', () => {
      const el = document.createElement('div');
      container.appendChild(el);
      expect(isNodeConnected(el)).toBe(true);
    });

    it('detects disconnected node after removal', () => {
      const el = document.createElement('div');
      container.appendChild(el);
      expect(isNodeConnected(el)).toBe(true);
      container.removeChild(el);
      expect(isNodeConnected(el)).toBe(false);
    });

    it('detects detached subtree child nodes', () => {
      const wrapper = document.createElement('section');
      const child = document.createElement('em');
      wrapper.appendChild(child);
      // wrapper not attached to DOM
      expect(isNodeConnected(wrapper)).toBe(false);
      expect(isNodeConnected(child)).toBe(false);
      container.appendChild(wrapper);
      expect(isNodeConnected(child)).toBe(true);
    });
  });

  describe('mixed scenario: markers & insertion interplay', () => {
    it('can insert new nodes before marker end after clearing', () => {
      const { start, end } = createMarkerPair('mix');
      container.appendChild(start);
      container.appendChild(end);

      // Populate region
      const temp = document.createElement('div');
      temp.textContent = 'temp';
      container.insertBefore(temp, end);
      expect(container.childNodes.length).toBe(3);

      clearBetweenMarkers(start, end);
      expect(container.childNodes.length).toBe(2);

      const n1 = document.createElement('strong');
      n1.textContent = 'S1';
      const n2 = document.createElement('strong');
      n2.textContent = 'S2';
      insertNodesBefore([n1, n2], end);

      const texts = Array.from(container.childNodes).map(n => n.textContent);
      // start marker (comment text), S1, S2, end marker (comment text)
      expect(texts.length).toBe(4);
      expect(texts[1]).toBe('S1');
      expect(texts[2]).toBe('S2');
    });
  });
});