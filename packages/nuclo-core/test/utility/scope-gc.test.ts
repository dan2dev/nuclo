/// <reference path="../../types/index.d.ts" />

/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines 53-54 in src/utility/scope.ts:
 *
 *   const el = ref.deref();
 *   if (el === undefined) {
 *     toDelete.push(ref);  // line 53
 *     continue;             // line 54
 *   }
 *
 * These lines execute when a WeakRef's target Element has been garbage
 * collected. Because GC timing is non-deterministic and cannot be forced
 * reliably in tests, we intercept the WeakRef constructor so that specific
 * refs return `undefined` from `.deref()`, simulating the post-GC state.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { scope, getScopeRoots } from '../../src/utility/scope';

// ── helpers ───────────────────────────────────────────────────────────────────

const OriginalWeakRef = globalThis.WeakRef;

/**
 * Replaces the global WeakRef so that refs created for a specific element
 * will return `undefined` from `.deref()` after `invalidate()` is called.
 *
 * All other WeakRefs behave normally.
 */
function installGCSimulator() {
  const invalidatedTargets = new Set<object>();

  class SimulatedWeakRef<T extends WeakRef.Prototype> extends OriginalWeakRef<T> {
    #target: T;

    constructor(target: T) {
      super(target);
      this.#target = target;
    }

    deref(): T | undefined {
      if (invalidatedTargets.has(this.#target)) {
        return undefined;
      }
      return super.deref();
    }
  }

  globalThis.WeakRef = SimulatedWeakRef as typeof WeakRef;

  return {
    /** Mark a target as "garbage collected" so deref() returns undefined. */
    invalidate(target: object) {
      invalidatedTargets.add(target);
    },
    restore() {
      globalThis.WeakRef = OriginalWeakRef;
      invalidatedTargets.clear();
    },
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('getScopeRoots – garbage-collected WeakRef cleanup (lines 53-54)', () => {
  let gcSim: ReturnType<typeof installGCSimulator>;

  afterEach(() => {
    gcSim?.restore();
    document.body.innerHTML = '';
  });

  it('removes a garbage-collected ref and returns an empty array', () => {
    gcSim = installGCSimulator();

    const el = document.createElement('div');
    document.body.appendChild(el);

    scope('gc-test')(el as ExpandedElement<'div'>, 0);

    // Sanity check: scope root is found while element is alive
    expect(getScopeRoots(['gc-test'])).toContain(el);

    // Simulate GC: WeakRef.deref() will now return undefined for `el`
    gcSim.invalidate(el);

    // getScopeRoots should hit lines 53-54, clean up the ref, return []
    const roots = getScopeRoots(['gc-test']);
    expect(roots).toHaveLength(0);

    // A second call confirms the ref was permanently removed from the set
    const rootsAgain = getScopeRoots(['gc-test']);
    expect(rootsAgain).toHaveLength(0);
  });

  it('removes only the garbage-collected ref and keeps live refs', () => {
    gcSim = installGCSimulator();

    const alive = document.createElement('div');
    const collected = document.createElement('span');
    document.body.appendChild(alive);
    document.body.appendChild(collected);

    scope('mixed-gc')(alive as ExpandedElement<'div'>, 0);
    scope('mixed-gc')(collected as ExpandedElement<'span'>, 0);

    // Both are initially reachable
    expect(getScopeRoots(['mixed-gc'])).toContain(alive);
    expect(getScopeRoots(['mixed-gc'])).toContain(collected);

    // Simulate GC of only one element
    gcSim.invalidate(collected);

    const roots = getScopeRoots(['mixed-gc']);
    expect(roots).toContain(alive);
    expect(roots).not.toContain(collected);
    expect(roots).toHaveLength(1);
  });

  it('handles all refs being garbage-collected across multiple scope ids', () => {
    gcSim = installGCSimulator();

    const elA = document.createElement('div');
    const elB = document.createElement('div');
    document.body.appendChild(elA);
    document.body.appendChild(elB);

    scope('gc-multi-a')(elA as ExpandedElement<'div'>, 0);
    scope('gc-multi-b')(elB as ExpandedElement<'div'>, 0);

    gcSim.invalidate(elA);
    gcSim.invalidate(elB);

    const roots = getScopeRoots(['gc-multi-a', 'gc-multi-b']);
    expect(roots).toHaveLength(0);
  });
});
