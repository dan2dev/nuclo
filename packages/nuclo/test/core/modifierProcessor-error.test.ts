/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { applyNodeModifier } from '../../src/core/modifierProcessor';

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
    expect(node).toBeInstanceOf(DocumentFragment);
    expect(node?.textContent).toBe(''); // fallback empty reactive text node
    expect(calls).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const firstArgs = consoleSpy.mock.calls[0];
    expect(String(firstArgs[0])).toContain('nuclo: Error evaluating reactive text function:');
  });

  it('does not re-evaluate a previously failed zero-arg modifier (uses cached error record)', () => {
    const consoleSpy = vi.fn();
    console.error = consoleSpy as any;

    let calls = 0;
    const badFn = () => {
      calls += 1;
      throw new Error('always-bad');
    };

    // First attempt (records failure)
    const firstNode = applyNodeModifier(parent, badFn, 0);
    expect(firstNode).toBeInstanceOf(DocumentFragment);
    expect(calls).toBe(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    // Second attempt should NOT invoke badFn again (cached error path)
    const secondNode = applyNodeModifier(parent, badFn, 1);
    expect(secondNode).toBeInstanceOf(DocumentFragment);
    expect(secondNode).not.toBe(firstNode); // new fallback reactive text node each time
    expect(calls).toBe(1); // no additional executions
    expect(consoleSpy).toHaveBeenCalledTimes(1); // no extra logging
  });
});