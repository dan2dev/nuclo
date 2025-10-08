import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { applyModifiers } from '../../src/internal/applyModifiers';
import { createConditionalElement } from '../../src/core/conditionalRenderer';
import { updateConditionalElements } from '../../src/core/conditionalUpdater';
import { insertNodesBefore, appendChildren, createMarkerPair } from '../../src/utility/dom';

/**
 * Synthetic / contrived tests to exercise difficult defensive branches:
 * 1. applyModifiers branch where produced node already has the correct parent (skips append)
 * 2. conditionalUpdater consecutive error paths (multiple failing replacements)
 * 3. DOM utils failure paths (safeAppendChild / safeInsertBefore) via appendChildren + insertNodesBefore
 * 4. insertNodesBefore failure (parent.insertBefore throwing)
 *
 * NOTE: These tests intentionally monkey‑patch DOM behaviors to trigger
 * guarded error branches that are unlikely in normal usage.
 */

describe('synthetic DOM failure / defensive branch coverage', () => {
  let host: HTMLDivElement;
  let originalConsoleError: any;
  let consoleSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
    originalConsoleError = console.error;
    consoleSpy = vi.fn();
    console.error = consoleSpy as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('applyModifiers already-parented node scenario', () => {
    it('does not re-append node when produced node is already a child of host', () => {
      const existing = document.createElement('span');
      existing.textContent = 'existing';
      host.appendChild(existing);

      let appendedCountBefore = host.childNodes.length;
      const mods: Array<NodeModFn<'div'>> = [
        (_parent: any) => existing // already has parent -> should skip append branch (length > 0 so treated as NodeModFn)
      ];

      const result = applyModifiers(host, mods, 5);
      // Index should still increment (considered a rendered node logically)
      expect(result.nextIndex).toBe(6);
      expect(result.appended).toBe(1);
      expect(host.childNodes.length).toBe(appendedCountBefore); // no new child appended
      expect(host.firstChild).toBe(existing);
    });
  });

  describe('conditionalUpdater multiple consecutive replacement failures', () => {
    it('logs errors on repeated element <-> comment replacement attempts', () => {
      let visible = false; // start hidden => comment
      const conditionalNode = createConditionalElement(
        'div',
        () => visible,
        ['content']
      ) as unknown as Node;

      // Start with a comment node in DOM
      expect(conditionalNode.nodeType).toBe(Node.COMMENT_NODE);
      host.appendChild(conditionalNode);

      // Monkey-patch replaceChild to always throw
      const originalReplace = host.replaceChild.bind(host);
      const replaceSpy = vi.fn(() => {
        throw new Error('synthetic-replace-error');
      });
      (host as any).replaceChild = replaceSpy;

      // Attempt comment -> element (should log)
      visible = true;
      updateConditionalElements();

      // Attempt element -> comment (still failing; visibility forces second flip)
      visible = false;
      updateConditionalElements();

      // Attempt another comment -> element
      visible = true;
      updateConditionalElements();

      expect(consoleSpy).toHaveBeenCalled();
      const messages = consoleSpy.mock.calls.map(c => String(c[0]));
      // We should have multiple replacement error logs
      const replacementErrors = messages.filter(m => m.includes('Error replacing conditional node'));
      expect(replacementErrors.length).toBeGreaterThanOrEqual(2);

      // Node never successfully replaced (still original comment node)
      expect(host.firstChild?.nodeType).toBe(Node.COMMENT_NODE);

      (host as any).replaceChild = originalReplace;
    });
  });

  describe('DOM utility failure simulations', () => {
    it('appendChildren handles parent.appendChild throwing (safeAppendChild failure path)', () => {
      const throwingParent: any = {
        childNodes: [] as Node[],
        appendChild: vi.fn((_n: Node) => {
          throw new Error('append-failure');
        }),
      };

      // Should not throw outward
      expect(() => appendChildren(throwingParent, 'text1', 'text2')).not.toThrow();
      expect(throwingParent.appendChild).toHaveBeenCalled();
      // No children recorded because every append failed
      expect(throwingParent.childNodes.length).toBe(0);
    });

    it('insertNodesBefore handles parent.insertBefore throwing (safeInsertBefore failure path)', () => {
      const ref = document.createComment('ref');
      host.appendChild(ref);
      const originalInsert = host.insertBefore.bind(host);
      const failing = vi.fn(() => {
        throw new Error('insert-before-failure');
      });
      (host as any).insertBefore = failing;

      const a = document.createElement('div');
      a.textContent = 'A';
      const b = document.createElement('div');
      b.textContent = 'B';

      expect(() => insertNodesBefore([a, b], ref)).not.toThrow();
      expect(failing).toHaveBeenCalledTimes(2);
      expect(a.parentNode).toBeNull();
      expect(b.parentNode).toBeNull();

      // restore
      (host as any).insertBefore = originalInsert;
    });

    it('insertNodesBefore no-ops gracefully when nodes array empty', () => {
      const { start, end } = createMarkerPair('empty');
      host.appendChild(start);
      host.appendChild(end);
      expect(() => insertNodesBefore([], end)).not.toThrow();
      expect(host.childNodes.length).toBe(2);
    });
  });

  describe('combined synthetic scenario', () => {
    it('fails insert then succeeds after restoring insertBefore', () => {
      const ref = document.createComment('combo-ref');
      host.appendChild(ref);

      const originalInsert = host.insertBefore.bind(host);
      (host as any).insertBefore = vi.fn(() => {
        throw new Error('first-wave-fail');
      });

      const n1 = document.createElement('i');
      n1.textContent = 'N1';
      const n2 = document.createElement('i');
      n2.textContent = 'N2';

      // First attempt (failure)
      insertNodesBefore([n1, n2], ref);
      expect(n1.parentNode).toBeNull();
      expect(n2.parentNode).toBeNull();

      // Restore and try again
      (host as any).insertBefore = originalInsert;
      insertNodesBefore([n1, n2], ref);
      expect(n1.parentNode).toBe(host);
      expect(n2.parentNode).toBe(host);

      // Ensure order: n1, n2, ref
      const children = Array.from(host.childNodes);
      expect(children[0]).toBe(n1);
      expect(children[1]).toBe(n2);
      expect(children[2]).toBe(ref);
    });
  });
});
