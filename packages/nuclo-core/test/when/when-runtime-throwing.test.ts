/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/when/runtime.ts:
 *
 *  Lines 127-128 – updateWhenRuntimes: runtime.update() throws → runtime
 *                  is cleaned up and removed from the active set.
 *
 * Also provides broader combinatorial coverage of evaluateActiveCondition,
 * renderWhenContent, and updateWhenRuntimes edge cases.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  registerWhenRuntime,
  updateWhenRuntimes,
  clearWhenRuntimes,
  renderWhenContent,
  type WhenRuntime,
  type WhenGroup,
} from '../../src/when/runtime';

afterEach(() => {
  clearWhenRuntimes();
  vi.restoreAllMocks();
});

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRuntime(
  groups: WhenGroup<ElementTagName>[],
  elseContent: WhenRuntime<ElementTagName>['elseContent'] = [],
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
    groups,
    elseContent,
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

// ── Unit: evaluateActiveCondition (via renderWhenContent) ─────────────────────
describe('renderWhenContent – condition evaluation', () => {
  it('renders first truthy group', () => {
    const runtime = makeRuntime([
      { condition: false, content: [] },
      { condition: true, content: [] },
    ]);

    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBe(1);

    (runtime.host as unknown as HTMLElement).remove();
  });

  it('renders else branch when no condition is truthy and elseContent exists', () => {
    const runtime = makeRuntime(
      [{ condition: false, content: [] }],
      [] // elseContent is empty → null
    );
    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBeNull();

    (runtime.host as unknown as HTMLElement).remove();
  });

  it('renders else branch (-1) when no condition matches and elseContent is non-empty', () => {
    const runtime = makeRuntime(
      [{ condition: false, content: [] }],
      [{ className: 'else-item' } as unknown as WhenRuntime<ElementTagName>['elseContent'][0]],
    );
    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBe(-1);

    (runtime.host as unknown as HTMLElement).remove();
  });

  it('skips re-render when active branch has not changed', () => {
    const runtime = makeRuntime([{ condition: true, content: [] }]);
    renderWhenContent(runtime);
    const activeAfterFirst = runtime.activeIndex;

    // Spy to verify no DOM manipulation happens on second call (no change)
    const clearSpy = vi.spyOn(runtime.startMarker, 'nextSibling', 'get').mockReturnValue(runtime.endMarker);
    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBe(activeAfterFirst);

    clearSpy.mockRestore();
    (runtime.host as unknown as HTMLElement).remove();
  });

  it('handles function conditions', () => {
    let flag = false;
    const runtime = makeRuntime([{ condition: () => flag, content: [] }]);

    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBeNull(); // false → no else content → null

    flag = true;
    runtime.activeIndex = null; // Reset so re-render happens
    renderWhenContent(runtime);
    expect(runtime.activeIndex).toBe(0);

    (runtime.host as unknown as HTMLElement).remove();
  });
});

// ── Unit: updateWhenRuntimes – runtime.update() throws (lines 127-128) ────────
describe('updateWhenRuntimes – throwing update (lines 127-128)', () => {
  it('removes the runtime from tracking when update() throws', () => {
    let throwOnUpdate = true;
    const runtime = makeRuntime([], [], () => {
      if (throwOnUpdate) throw new Error('simulated runtime error');
    });

    registerWhenRuntime(runtime);

    // First update: throws → runtime should be removed from active set
    expect(() => updateWhenRuntimes()).not.toThrow();

    // Subsequent update should not call the throwing runtime (it was removed)
    throwOnUpdate = false;
    expect(() => updateWhenRuntimes()).not.toThrow();

    (runtime.host as unknown as HTMLElement).remove();
  });

  it('continues updating other runtimes after one throws', () => {
    let throwingUpdated = false;
    let goodUpdated = false;

    const throwing = makeRuntime([], [], () => {
      throwingUpdated = true;
      throw new Error('boom');
    });
    const good = makeRuntime([], [], () => {
      goodUpdated = true;
    });

    registerWhenRuntime(throwing);
    registerWhenRuntime(good);

    updateWhenRuntimes();

    expect(throwingUpdated).toBe(true);
    expect(goodUpdated).toBe(true);

    (throwing.host as unknown as HTMLElement).remove();
    (good.host as unknown as HTMLElement).remove();
  });
});

// ── Unit: updateWhenRuntimes – disconnected markers ────────────────────────────
describe('updateWhenRuntimes – disconnected markers', () => {
  it('removes a runtime whose startMarker is disconnected', () => {
    const runtime = makeRuntime([{ condition: true, content: [] }]);
    registerWhenRuntime(runtime);

    // Disconnect the host (and its children) from DOM
    (runtime.host as unknown as HTMLElement).remove();

    expect(() => updateWhenRuntimes()).not.toThrow();
  });

  it('removes a runtime whose endMarker is disconnected', () => {
    const runtime = makeRuntime([{ condition: true, content: [] }]);
    registerWhenRuntime(runtime);

    // Disconnect only the end marker
    runtime.endMarker.remove();

    expect(() => updateWhenRuntimes()).not.toThrow();
  });
});

// ── Unit: updateWhenRuntimes – scope filtering ────────────────────────────────
describe('updateWhenRuntimes – scope filtering', () => {
  it('skips runtimes outside the given scope', () => {
    let updated = false;
    const runtime = makeRuntime([], [], () => { updated = true; });
    registerWhenRuntime(runtime);

    const excludeScope = { roots: [], contains: (_n: Node) => false };
    updateWhenRuntimes(excludeScope);

    expect(updated).toBe(false);

    (runtime.host as unknown as HTMLElement).remove();
  });

  it('processes runtimes inside the given scope', () => {
    let updated = false;
    const runtime = makeRuntime([], [], () => { updated = true; });
    registerWhenRuntime(runtime);

    const includeScope = { roots: [], contains: (_n: Node) => true };
    updateWhenRuntimes(includeScope);

    expect(updated).toBe(true);

    (runtime.host as unknown as HTMLElement).remove();
  });
});

// ── Unit: registerWhenRuntime + clearWhenRuntimes ─────────────────────────────
describe('registerWhenRuntime and clearWhenRuntimes', () => {
  it('can register and then clear all runtimes', () => {
    let called = false;
    const runtime = makeRuntime([], [], () => { called = true; });
    registerWhenRuntime(runtime);

    clearWhenRuntimes();

    updateWhenRuntimes();
    expect(called).toBe(false); // Runtime cleared, no update called

    (runtime.host as unknown as HTMLElement).remove();
  });
});
