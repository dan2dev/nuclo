/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/utility/scope.ts:
 *
 *  Lines 52-53 – getScopeRoots: element is disconnected from DOM  →
 *                toDelete.push(ref); continue; (else branch of isNodeConnected)
 *
 * Strategy:
 *  1. Register a scope root via scope() modifier.
 *  2. Connect the element to the DOM briefly then REMOVE it (disconnects it).
 *  3. Call getScopeRoots() – the disconnected element should be cleaned up and
 *     the returned array should be empty.
 */

import { describe, it, expect } from 'vitest';
import { scope, getScopeRoots } from '../../src/utility/scope';

// ── Unit: getScopeRoots ────────────────────────────────────────────────────────
describe('getScopeRoots', () => {
  describe('Happy path', () => {
    it('returns the connected root element for the given scope id', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const modifier = scope('test-scope-happy');
      modifier(el as ExpandedElement<'div'>, 0);

      const roots = getScopeRoots(['test-scope-happy']);
      expect(roots).toContain(el);

      el.remove();
    });

    it('returns empty array when scope id has no registrations', () => {
      const roots = getScopeRoots(['nonexistent-scope']);
      expect(roots).toHaveLength(0);
    });

    it('deduplicates when the same element is added under the same scope multiple times', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const modifier = scope('dedup-scope');
      modifier(el as ExpandedElement<'div'>, 0);
      modifier(el as ExpandedElement<'div'>, 0);

      const roots = getScopeRoots(['dedup-scope']);
      const occurrences = roots.filter((r) => r === el).length;
      expect(occurrences).toBe(1);

      el.remove();
    });

    it('returns elements for multiple scope ids', () => {
      const el1 = document.createElement('div');
      const el2 = document.createElement('section');
      document.body.appendChild(el1);
      document.body.appendChild(el2);

      scope('multi-a')(el1 as ExpandedElement<'div'>, 0);
      scope('multi-b')(el2 as ExpandedElement<'section'>, 0);

      const roots = getScopeRoots(['multi-a', 'multi-b']);
      expect(roots).toContain(el1);
      expect(roots).toContain(el2);

      el1.remove();
      el2.remove();
    });
  });

  describe('Edge cases', () => {
    it('returns empty array for empty input list', () => {
      expect(getScopeRoots([])).toHaveLength(0);
    });

    it('ignores non-string entries in ids list', () => {
      const roots = getScopeRoots([42 as unknown as string, null as unknown as string]);
      expect(roots).toHaveLength(0);
    });

    it('ignores blank-string entries', () => {
      const roots = getScopeRoots(['  ', '']);
      expect(roots).toHaveLength(0);
    });

    it('deduplicates repeated scope ids in the input list', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      scope('dup-input')(el as ExpandedElement<'div'>, 0);

      // Passing the same scope id twice should not double-count
      const roots = getScopeRoots(['dup-input', 'dup-input']);
      const count = roots.filter((r) => r === el).length;
      expect(count).toBe(1);

      el.remove();
    });
  });

  describe('Disconnected element cleanup (lines 52-53)', () => {
    it('removes disconnected element from scope registry and returns empty array', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);

      const id = 'disconnected-scope-test';
      scope(id)(el as ExpandedElement<'div'>, 0);

      // Verify connected initially
      let roots = getScopeRoots([id]);
      expect(roots).toContain(el);

      // Disconnect element from DOM
      el.remove();

      // getScopeRoots should clean up disconnected element and return []
      roots = getScopeRoots([id]);
      expect(roots).toHaveLength(0);
    });

    it('removes multiple disconnected elements, keeps connected ones', () => {
      const connected = document.createElement('div');
      const disconnected = document.createElement('div');
      document.body.appendChild(connected);
      document.body.appendChild(disconnected);

      scope('mixed-scope')(connected as ExpandedElement<'div'>, 0);
      scope('mixed-scope')(disconnected as ExpandedElement<'div'>, 0);

      // Disconnect one
      disconnected.remove();

      const roots = getScopeRoots(['mixed-scope']);
      expect(roots).toContain(connected);
      expect(roots).not.toContain(disconnected);

      connected.remove();
    });
  });
});

// ── Unit: scope() modifier ────────────────────────────────────────────────────
describe('scope() modifier', () => {
  it('ignores non-Element parent', () => {
    const modifier = scope('guard-test');
    // Should not throw when called with a non-Element
    expect(() => modifier({} as ExpandedElement<'div'>, 0)).not.toThrow();
  });

  it('registers element under multiple ids', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    scope('id-a', 'id-b')(el as ExpandedElement<'div'>, 0);

    expect(getScopeRoots(['id-a'])).toContain(el);
    expect(getScopeRoots(['id-b'])).toContain(el);

    el.remove();
  });

  it('handles ids with extra whitespace (trimmed)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    scope('  trimmed  ')(el as ExpandedElement<'div'>, 0);

    const roots = getScopeRoots(['trimmed']);
    expect(roots).toContain(el);

    el.remove();
  });
});
