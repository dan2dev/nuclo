/**
 * @vitest-environment jsdom
 *
 * Tests focused specifically on:
 *  1. SSR branch of createConditionalElement (when isBrowser === false)
 *  2. processConditionalModifiers logic & edge cases
 *
 * These areas were previously uncovered / lightly covered compared to broader
 * conditional system tests that exercise runtime updating (handled in other files).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// NOTE: We intentionally import only the helper under test for the
// processConditionalModifiers suite first (real browser path).
import { processConditionalModifiers } from '../../src/core/conditionalRenderer';

describe('processConditionalModifiers', () => {
  beforeEach(() => {
    // Reset module state between tests so modifier probe cache does not
    // accidentally conceal multiple executions assertions. We cannot
    // clear the WeakMap directly (not exported) but resetting modules
    // ensures fresh copies when re-importing in SSR suite later.
    vi.resetModules();
  });

  it('returns null condition when there is no boolean function', () => {
    const mods = ['text', { id: 'x' }];
    const { condition, otherModifiers } = processConditionalModifiers(mods);
    expect(condition).toBeNull();
    expect(otherModifiers).toEqual(mods);
  });

  it('does not treat a lone boolean function (with only primitive siblings) as conditional', () => {
    let calls = 0;
    const boolFn = () => {
      calls += 1;
      return true;
    };
    const mods = [boolFn, 'only primitive sibling'];
    const { condition, otherModifiers } = processConditionalModifiers(mods);
    // Because only primitive siblings exist, predicate should reject
    expect(condition).toBeNull();
    expect(otherModifiers).toEqual(mods);
    expect(calls).toBe(1); // Probed exactly once
  });

  it('identifies a boolean function as conditional when attributes are present', () => {
    let calls = 0;
    const cond = () => {
      calls += 1;
      return false;
    };
    const mods = [cond, 'text node', { className: 'demo' }];
    const { condition, otherModifiers } = processConditionalModifiers(mods);
    expect(typeof condition).toBe('function');
    expect(otherModifiers).toEqual(['text node', { className: 'demo' }]);
    expect(calls).toBe(1); // Single probe execution
  });

  it('identifies a boolean function as conditional when placed mid-array', () => {
    let calls = 0;
    const cond = () => {
      calls += 1;
      return true;
    };
    const mods = ['leading text', cond, { id: 'mid' }, 'trailing'];
    const { condition, otherModifiers } = processConditionalModifiers(mods);
    expect(condition).toBe(cond);
    // Order preserved minus the condition
    expect(otherModifiers).toEqual(['leading text', { id: 'mid' }, 'trailing']);
    expect(calls).toBe(1);
  });

  it('treats only the first qualifying boolean function as conditional (subsequent remain modifiers)', () => {
    let firstCalls = 0;
    let secondCalls = 0;
    const first = () => {
      firstCalls += 1;
      return true;
    };
    const second = () => {
      secondCalls += 1;
      return false;
    };
    const mods = [first, 'text', second, { title: 'attr' }];
    const { condition, otherModifiers } = processConditionalModifiers(mods);
    expect(condition).toBe(first);
    // Second boolean function should remain as a normal modifier (will later act as reactive text probe)
    expect(otherModifiers).toEqual(['text', second, { title: 'attr' }]);
    expect(firstCalls).toBe(1);
    expect(secondCalls).toBe(0); // Second function not probed: loop exits after first conditional found
  });

  it('returns original array reference when no conditional modifier detected', () => {
    const mods = ['a', 'b', { id: 'c' }];
    const result = processConditionalModifiers(mods);
    expect(result.condition).toBeNull();
    // Implementation returns same array (no copy) when not conditional
    expect(result.otherModifiers).toBe(mods);
  });
  
  it('treats throwing zero-arg function as non-conditional', () => {
    let calls = 0;
    const throwing = () => {
      calls += 1;
      throw new Error('boom');
    };
    const mods = [throwing, { id: 'attr' }];
    const { condition, otherModifiers } = processConditionalModifiers(mods as any);
    expect(condition).toBeNull();
    expect(otherModifiers).toBe(mods);
    expect(calls).toBe(1); // Probed exactly once
  });
});

describe('createConditionalElement SSR branch', () => {
  // We import inside each test after mocking environment to ensure
  // conditionalRenderer sees the mocked isBrowser value at module init.

  beforeEach(() => {
    vi.resetModules();
  });

  it('returns an element without storing conditional info when condition passes (SSR)', async () => {
    vi.doMock('../../src/utility/environment', () => ({
      isBrowser: false
    }));
    const { createConditionalElement } = await import('../../src/core/conditionalRenderer');

    const condCalls: number[] = [];
    const el = createConditionalElement(
      'div',
      () => {
        condCalls.push(1);
        return true;
      },
      ['hello', { id: 'ssr-true' }]
    );

    expect(el.nodeType).toBe(Node.ELEMENT_NODE);
    const divEl = el as HTMLElement;
    expect(divEl.id).toBe('ssr-true');
    expect(divEl.textContent).toBe('hello');

    // No conditional info stored in SSR mode
    expect((divEl as any)._conditionalInfo).toBeUndefined();
    expect(condCalls.length).toBe(1);
  });

  it('returns a comment placeholder without conditional info when condition fails (SSR)', async () => {
    vi.doMock('../../src/utility/environment', () => ({
      isBrowser: false
    }));
    const { createConditionalElement } = await import('../../src/core/conditionalRenderer');

    const el = createConditionalElement(
      'span',
      () => false,
      ['invisible text', { className: 'ssr-hidden' }]
    );

    expect(el.nodeType).toBe(Node.COMMENT_NODE);
    const comment = el as unknown as Comment;
    expect(comment.nodeValue).toBe('conditional-span-ssr');
    // Confirm no accidental property
    expect((comment as any)._conditionalInfo).toBeUndefined();
  });

  it('applies modifiers in SSR path when condition passes (attributes + text)', async () => {
    vi.doMock('../../src/utility/environment', () => ({
      isBrowser: false
    }));
    const { createConditionalElement } = await import('../../src/core/conditionalRenderer');

    const element = createConditionalElement(
      'p',
      () => true,
      ['text', { className: 'cls', title: 't' }]
    ) as HTMLElement;

    expect(element.nodeType).toBe(Node.ELEMENT_NODE);
    expect(element.className).toBe('cls');
    expect(element.title).toBe('t');
    expect(element.textContent).toBe('text');
  });

  it('does not execute modifiers for hidden branch (comment) beyond condition evaluation', async () => {
    vi.doMock('../../src/utility/environment', () => ({
      isBrowser: false
    }));
    const { createConditionalElement } = await import('../../src/core/conditionalRenderer');

    let sideEffect = 0;
    const reactive = () => {
      sideEffect += 1;
      return 'should not run because element not created';
    };
    const element = createConditionalElement(
      'div',
      () => false,
      [reactive, { id: 'never' }]
    );

    expect(element.nodeType).toBe(Node.COMMENT_NODE);
    // Since element branch not taken, modifiers (other than condition) not applied/executed
    expect(sideEffect).toBe(0);
  });
});