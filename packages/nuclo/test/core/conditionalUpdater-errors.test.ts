import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { createConditionalElement } from '../../src/core/conditionalRenderer';
import { updateConditionalElements } from '../../src/core/conditionalUpdater';

/**
 * Tests for error-handling branches inside conditionalUpdater.ts:
 *  - replaceNodeSafely() try/catch when parentNode.replaceChild throws
 *  - createElementFromConditionalInfo() try/catch when applyModifiers (via a throwing modifier) throws
 *  - Overall updateConditionalElements() outer try/catch resilience
 *
 * We monkey-patch DOM APIs (replaceChild) and inject throwing modifiers to exercise
 * these branches without modifying library source.
 */

describe('conditionalUpdater error paths', () => {
  let container: HTMLDivElement;
  let originalConsoleError: any;
  let consoleSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    originalConsoleError = console.error;
    consoleSpy = vi.fn();
    console.error = consoleSpy as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  function getConsoleMessages(): string[] {
    return consoleSpy.mock.calls.map(call => String(call[0]));
  }

  it('logs error when replacing comment with element (hidden -> show) fails', () => {
    // Start hidden
    let visible = false;
    const node = createConditionalElement(
      'div',
      () => visible,
      ['Content']
    ) as unknown as Node;
    // Should be a comment node
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    container.appendChild(node);

    // Monkey-patch replaceChild on the container to throw
    const originalReplace = container.replaceChild.bind(container);
    (container as any).replaceChild = vi.fn(() => {
      throw new Error('replace-failure-1');
    });

    // Flip condition to force comment -> element replacement
    visible = true;
    updateConditionalElements();

    // Expect error logged, node remains a comment (no replacement)
    expect(consoleSpy).toHaveBeenCalled();
    const messages = getConsoleMessages();
    expect(messages.some(m => m.includes('Error replacing conditional node'))).toBe(true);
    expect(container.firstChild?.nodeType).toBe(Node.COMMENT_NODE);

    // Restore
    (container as any).replaceChild = originalReplace;
  });

  it('logs error when replacing element with comment (show -> hide) fails', () => {
    // Start visible
    let visible = true;
    const node = createConditionalElement(
      'div',
      () => visible,
      ['Visible']
    ) as unknown as HTMLElement;
    expect(node.nodeType).toBe(Node.ELEMENT_NODE);
    container.appendChild(node);

    // Monkey-patch replaceChild to throw
    const originalReplace = container.replaceChild.bind(container);
    (container as any).replaceChild = vi.fn(() => {
      throw new Error('replace-failure-2');
    });

    // Flip condition to force element -> comment replacement
    visible = false;
    updateConditionalElements();

    // Error logged; element should remain (no comment inserted)
    expect(consoleSpy).toHaveBeenCalled();
    const msgs = getConsoleMessages();
    expect(msgs.some(m => m.includes('Error replacing conditional node'))).toBe(true);
    expect(container.firstChild?.nodeType).toBe(Node.ELEMENT_NODE);

    (container as any).replaceChild = originalReplace;
  });

  it('catches and logs errors thrown during modifier application when element is recreated from a comment (safe path)', () => {
    // Start hidden so initial creation yields a comment (no modifier execution yet)
    let visible = false;
    const throwingModifier = (parent: any) => {
      throw new Error('applyModifiers boom');
    };
    const node = createConditionalElement(
      'div',
      () => visible,
      [
        'prefix-text',
        throwingModifier,
        'suffix-text'
      ]
    ) as unknown as Node;
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    container.appendChild(node);
    // Flip visibility to trigger element creation via conditionalUpdater (wrapped in try/catch internally)
    visible = true;
    updateConditionalElements();
    // Error from applyModifiers should have been logged
    expect(consoleSpy).toHaveBeenCalled();
    const msgs = getConsoleMessages();
    expect(msgs.some(m => m.includes('Error applying modifiers in conditional element'))).toBe(true);
    // After update we should still have a node (comment if replacement failed, element if succeeded)
    expect(container.firstChild).toBeTruthy();
  });

  it('handles combined error: modifier throws during recreation AND replaceChild also throws', () => {
    // Start hidden with a conditional node (comment)
    let visible = false;
    const throwingModifier = (parent: any) => {
      throw new Error('modifier-failure');
    };
    const node = createConditionalElement(
      'div',
      () => visible,
      [throwingModifier]
    ) as unknown as Node;

    // Ensure we begin with a comment
    expect(node.nodeType).toBe(Node.COMMENT_NODE);
    container.appendChild(node);

    // Patch replaceChild to throw (replacement stage)
    const originalReplace = container.replaceChild.bind(container);
    (container as any).replaceChild = vi.fn(() => {
      throw new Error('replace-failure-combined');
    });

    // Trigger recreation path
    visible = true;
    updateConditionalElements();

    // Expect at least two error logs: one for applying modifiers, one for replace failure
    expect(consoleSpy).toHaveBeenCalled();
    const msgs = getConsoleMessages();
    const applyError = msgs.some(m => m.includes('Error applying modifiers in conditional element'));
    const replaceError = msgs.some(m => m.includes('Error replacing conditional node'));
    expect(applyError).toBe(true);
    expect(replaceError).toBe(true);

    // Node remains a comment due to failed replacement
    expect(container.firstChild?.nodeType).toBe(Node.COMMENT_NODE);

    (container as any).replaceChild = originalReplace;
  });

  it('does not throw even if updateConditionalElements outer try/catch wraps an internal failure', () => {
    // Monkey patch document.body to simulate failure in tree walker usage by temporarily nulling parentNode on a node mid-process.
    // Simplest approach: throw in container.replaceChild again.
    let visible = true;
    const el = createConditionalElement('div', () => visible, ['X']) as unknown as Node;
    container.appendChild(el);

    const originalReplace = container.replaceChild.bind(container);
    (container as any).replaceChild = vi.fn(() => {
      throw new Error('outer-wrapper-test');
    });

    // Flip condition to trigger replacement to comment
    visible = false;

    // Should not throw outward
    expect(() => updateConditionalElements()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    (container as any).replaceChild = originalReplace;
  });
});
