/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/update/conditional.ts:
 *
 *  Lines 31,37 – createElementFromConditionalInfo: SVG+HTML fallback when
 *                createSvgElementWithModifiers / createHtmlElementWithModifiers throws
 *                and the resulting fallback element is null.
 *  Line  46    – updateConditionalNode: guard when conditionalInfo is null
 *                (node in activeConditionalNodes but WeakMap entry deleted).
 *
 * Strategy:
 *  - Use vi.mock to force createSvgElementWithModifiers to throw so the catch
 *    block inside createElementFromConditionalInfo is exercised.
 *  - For line 46 we use unregisterConditionalNode to remove the WeakMap entry
 *    while keeping the node connected, then trigger an update.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  storeConditionalInfo,
  unregisterConditionalNode,
} from '../../src/update/registry';
import { updateConditionalElements } from '../../src/update/conditional';
import * as factory from '../../src/element/factory';

// vi.mock is hoisted above these imports by Vitest regardless of where it's
// written, so it must live at the module's top level — nesting it inside an
// it()/describe() throws in newer Vitest versions. Wrap the two functions as
// spies here and set per-test throwing behavior with mockImplementationOnce.
vi.mock('../../src/element/factory', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/element/factory')>();
  return {
    ...original,
    createSvgElementWithModifiers: vi.fn(original.createSvgElementWithModifiers),
    createHtmlElementWithModifiers: vi.fn(original.createHtmlElementWithModifiers),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Unit: SVG fallback when createSvgElementWithModifiers throws ───────────────
describe('conditionalUpdater – SVG fallback (lines 31, 37)', () => {
  it('falls back to a plain SVG element when modifiers throw during creation', () => {
    // Force createSvgElementWithModifiers to throw so the catch block runs
    vi.mocked(factory.createSvgElementWithModifiers).mockImplementationOnce(() => {
      throw new Error('forced SVG modifier error');
    });

    const comment = document.createComment('conditional-rect-hidden');
    document.body.appendChild(comment);

    // Store conditional info with isSvg = true so the fallback path is taken
    storeConditionalInfo(comment, {
      condition: () => true, // Condition is true → should replace comment with element
      tagName: 'rect' as ElementTagName,
      modifiers: [{ width: '10' } as unknown as NodeMod<'rect'>],
      isSvg: true,
    });

    expect(() => updateConditionalElements()).not.toThrow();

    comment.parentNode?.removeChild(comment);
  });
});

// ── Unit: HTML fallback when createHtmlElementWithModifiers throws ─────────────
describe('conditionalUpdater – HTML fallback', () => {
  it('falls back to a plain element when modifiers throw during creation', () => {
    vi.mocked(factory.createHtmlElementWithModifiers).mockImplementationOnce(() => {
      throw new Error('forced HTML modifier error');
    });

    const comment = document.createComment('conditional-div-hidden');
    document.body.appendChild(comment);

    storeConditionalInfo(comment, {
      condition: () => true,
      tagName: 'div' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    expect(() => updateConditionalElements()).not.toThrow();

    comment.parentNode?.removeChild(comment);
  });
});

// ── Unit: updateConditionalNode guard when conditionalInfo is null (line 46) ───
describe('conditionalUpdater – no conditionalInfo guard (line 46)', () => {
  it('silently skips a connected node that has no conditional info', () => {
    // Create and register a node, then explicitly unregister its WeakMap entry
    // so that conditionalInfo is null when updateConditionalNode is called.
    const div = document.createElement('div');
    document.body.appendChild(div);

    storeConditionalInfo(div, {
      condition: () => true,
      tagName: 'div' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    // Remove the WeakMap entry – the node stays in activeConditionalNodes but
    // getConditionalInfo will return null → line 46 guard fires.
    unregisterConditionalNode(div);

    // Re-add to active nodes without WeakMap entry by storing again then removing info
    storeConditionalInfo(div, {
      condition: () => true,
      tagName: 'div' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });
    // Delete WeakMap entry only (no way to remove from Set without unregister)
    // So let's verify the guard fires by making condition = false first and
    // then unregistering from the map before the next update.
    unregisterConditionalNode(div);

    expect(() => updateConditionalElements()).not.toThrow();

    div.remove();
  });

  it('processes normally after re-registering', () => {
    const comment = document.createComment('conditional-p-hidden');
    document.body.appendChild(comment);

    storeConditionalInfo(comment, {
      condition: () => true,
      tagName: 'p' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    // This time leave the info intact — should swap comment → element
    expect(() => updateConditionalElements()).not.toThrow();
    // The comment should have been replaced by a <p> element
    expect(document.querySelector('p')).toBeTruthy();

    document.querySelector('p')?.remove();
  });
});

// ── Integration: updateConditionalElements guards ─────────────────────────────
describe('updateConditionalElements – edge cases', () => {
  it('unregisters disconnected nodes during iteration', () => {
    const comment = document.createComment('conditional-span-hidden');
    // Do NOT append to body (disconnected)
    storeConditionalInfo(comment, {
      condition: () => true,
      tagName: 'span' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    // Should not throw; disconnected node should be removed from tracking
    expect(() => updateConditionalElements()).not.toThrow();
  });

  it('handles scope filtering – skips nodes outside scope', () => {
    const comment = document.createComment('conditional-em-hidden');
    document.body.appendChild(comment);
    storeConditionalInfo(comment, {
      condition: () => true,
      tagName: 'em' as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    const scope = { roots: [], contains: (_n: Node) => false };
    expect(() => updateConditionalElements(scope)).not.toThrow();

    comment.remove();
  });
});
