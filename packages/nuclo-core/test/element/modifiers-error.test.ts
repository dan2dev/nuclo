/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { applyNodeModifier } from '../../src/element/modifiers';

describe('modifierProcessor zero-arg reactive error branch', () => {
  let parent: HTMLDivElement;
  let originalConsoleError: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    parent = document.createElement('div');
    document.body.appendChild(parent);
    originalConsoleError = console.error;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('creates a fallback reactive text node and logs an error when zero-arg modifier throws', () => {
    const consoleSpy = vi.fn();
    console.error = consoleSpy as any;

    let calls = 0;
    const badFn = () => {
      calls += 1;
      throw new Error('explode-once');
    };

    const node = applyNodeModifier(parent, badFn, 0);
    expect(node).toBeInstanceOf(Text); // fallback empty reactive text node (client render: no marker fragment)
    expect(node?.textContent).toBe('');
    expect(calls).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const firstArgs = consoleSpy.mock.calls[0];
    expect(String(firstArgs[0])).toContain('nuclo: Error evaluating reactive text function:');
  });

  it('re-evaluates a previously failed zero-arg modifier on its next application', () => {
    const consoleSpy = vi.fn();
    console.error = consoleSpy as any;

    let calls = 0;
    let fail = true;
    const flaky = () => {
      calls += 1;
      if (fail) throw new Error('transient');
      return 'recovered';
    };

    // First application fails: empty fallback text, one logged error.
    const firstNode = applyNodeModifier(parent, flaky, 0);
    expect(firstNode).toBeInstanceOf(Text);
    expect(firstNode?.textContent).toBe('');
    expect(calls).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    // A failure is not remembered: the next application calls it again.
    fail = false;
    const secondNode = applyNodeModifier(parent, flaky, 1);
    expect(calls).toBe(2);
    expect(secondNode).not.toBe(firstNode);
    expect(secondNode?.textContent).toBe('recovered');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});