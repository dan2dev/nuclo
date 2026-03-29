/// <reference path="../../types/index.d.ts" />

/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines 127-128 in src/when/runtime.ts:
 *
 *   const startMarker = ref.deref();
 *   if (startMarker === undefined) {
 *     toDelete.push(ref);  // line 127
 *     continue;             // line 128
 *   }
 *
 * These lines execute when a WeakRef's target Comment node has been garbage
 * collected. Because GC timing is non-deterministic and cannot be forced
 * reliably in tests, we intercept the WeakRef constructor so that specific
 * refs return `undefined` from `.deref()`, simulating the post-GC state.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  registerWhenRuntime,
  updateWhenRuntimes,
  clearWhenRuntimes,
  renderWhenContent,
  type WhenRuntime,
} from '../../src/when/runtime';

// ── helpers ───────────────────────────────────────────────────────────────────

const OriginalWeakRef = globalThis.WeakRef;

/**
 * Replaces the global WeakRef so that refs created for a specific target
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

function makeRuntime(
  updateFn?: () => void,
): WhenRuntime<ElementTagName> {
  const host = document.createElement('div') as unknown as ExpandedElement<ElementTagName>;
  document.body.appendChild(host as unknown as HTMLElement);

  const start = document.createComment('when-start');
  const end = document.createComment('when-end');
  (host as unknown as HTMLElement).appendChild(start);
  (host as unknown as HTMLElement).appendChild(end);

  const runtime: WhenRuntime<ElementTagName> = {
    startMarker: start,
    endMarker: end,
    host,
    index: 0,
    groups: [{ condition: true, content: [] }],
    elseContent: [],
    activeIndex: null,
    update() {
      if (updateFn) {
        updateFn();
      } else {
        renderWhenContent(this);
      }
    },
  };
  return runtime;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('updateWhenRuntimes – garbage-collected WeakRef cleanup (lines 127-128)', () => {
  let gcSim: ReturnType<typeof installGCSimulator>;

  afterEach(() => {
    gcSim?.restore();
    clearWhenRuntimes();
    document.body.innerHTML = '';
  });

  it('removes a runtime whose startMarker WeakRef has been garbage collected', () => {
    gcSim = installGCSimulator();

    let updateCount = 0;
    const runtime = makeRuntime(() => { updateCount++; });
    registerWhenRuntime(runtime);

    // First update: runtime is alive, update() is called
    updateWhenRuntimes();
    expect(updateCount).toBe(1);

    // Simulate GC of the startMarker Comment node
    gcSim.invalidate(runtime.startMarker);

    // This call should hit lines 127-128, cleaning up the dead ref
    updateWhenRuntimes();
    expect(updateCount).toBe(1); // not called again

    // Confirm the runtime was permanently removed
    updateWhenRuntimes();
    expect(updateCount).toBe(1);
  });

  it('continues processing other runtimes when one is garbage collected', () => {
    gcSim = installGCSimulator();

    let collectedCount = 0;
    let aliveCount = 0;

    const collected = makeRuntime(() => { collectedCount++; });
    const alive = makeRuntime(() => { aliveCount++; });

    registerWhenRuntime(collected);
    registerWhenRuntime(alive);

    // Both are alive initially
    updateWhenRuntimes();
    expect(collectedCount).toBe(1);
    expect(aliveCount).toBe(1);

    // Simulate GC of only one runtime's startMarker
    gcSim.invalidate(collected.startMarker);

    updateWhenRuntimes();
    expect(collectedCount).toBe(1); // not called again (cleaned up)
    expect(aliveCount).toBe(2);     // still active, updated again

    (collected.host as unknown as HTMLElement).remove();
    (alive.host as unknown as HTMLElement).remove();
  });

  it('handles all runtimes being garbage collected at once', () => {
    gcSim = installGCSimulator();

    let countA = 0;
    let countB = 0;

    const runtimeA = makeRuntime(() => { countA++; });
    const runtimeB = makeRuntime(() => { countB++; });

    registerWhenRuntime(runtimeA);
    registerWhenRuntime(runtimeB);

    // Both alive
    updateWhenRuntimes();
    expect(countA).toBe(1);
    expect(countB).toBe(1);

    // Simulate GC of both
    gcSim.invalidate(runtimeA.startMarker);
    gcSim.invalidate(runtimeB.startMarker);

    // Should clean up both without throwing
    expect(() => updateWhenRuntimes()).not.toThrow();
    expect(countA).toBe(1);
    expect(countB).toBe(1);

    // Confirm nothing left to update
    updateWhenRuntimes();
    expect(countA).toBe(1);
    expect(countB).toBe(1);

    (runtimeA.host as unknown as HTMLElement).remove();
    (runtimeB.host as unknown as HTMLElement).remove();
  });
});
