/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines/branches in src/update/reactive-text.ts:
 *
 *  - createReactiveTextNode: initial value rendering, no-document contract
 *  - notifyReactiveTextNodes: WeakRef.deref() returns undefined (GC path),
 *    unchanged values, throwing resolvers, scope filtering
 *
 * For the GC path we inject a fake dead WeakRef directly into the exported Set.
 */

import { describe, it, expect, vi } from 'vitest';
import { createReactiveTextNode, notifyReactiveTextNodes } from '../../src/update/reactive-text';
import { reactiveTextNodes } from '../../src/update/registry';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Create a fake WeakRef that always returns undefined (simulates GC). */
function deadRef<T extends object>(): WeakRef<T> {
  const fake = Object.create(WeakRef.prototype) as WeakRef<T>;
  Object.defineProperty(fake, 'deref', { value: () => undefined, configurable: true });
  return fake;
}

// ── Unit: createReactiveTextNode ──────────────────────────────────────────────
describe('createReactiveTextNode', () => {
  it('shows the pre-evaluated initial value without calling the resolver', () => {
    const resolver = vi.fn(() => 'live');
    const node = createReactiveTextNode(resolver, 'pre');
    expect(node.textContent).toBe('pre');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('renders primitives with String() and nullish/non-primitive initial values as ""', () => {
    expect(createReactiveTextNode(() => 42, 42).textContent).toBe('42');
    expect(createReactiveTextNode(() => true, true).textContent).toBe('true');
    expect(createReactiveTextNode(() => 10n, 10n).textContent).toBe('10');
    expect(createReactiveTextNode(() => null, null).textContent).toBe('');
    expect(createReactiveTextNode(() => undefined, undefined).textContent).toBe('');
    expect(createReactiveTextNode(() => ({}), {}).textContent).toBe('');
  });

  it('throws without a document (the SSR polyfill is required)', () => {
    const original = globalThis.document;
    Object.defineProperty(globalThis, 'document', { value: undefined, writable: true, configurable: true });
    try {
      expect(() => createReactiveTextNode(() => 'hello', 'hello')).toThrow();
    } finally {
      Object.defineProperty(globalThis, 'document', { value: original, writable: true, configurable: true });
    }
  });
});

// ── Unit: notifyReactiveTextNodes ─────────────────────────────────────────────
describe('notifyReactiveTextNodes', () => {
  describe('Happy path', () => {
    it('updates text content when resolver returns new value', () => {
      let value = 'initial';
      const node = createReactiveTextNode(() => value, value);
      document.body.appendChild(node);
      value = 'updated';
      notifyReactiveTextNodes();
      expect(node.textContent).toBe('updated');
      node.remove();
    });

    it('skips update when value has not changed', () => {
      let callCount = 0;
      const node = createReactiveTextNode(() => {
        callCount++;
        return 'same';
      }, 'same');
      document.body.appendChild(node);
      let writes = 0;
      const observer = new MutationObserver((records) => { writes += records.length; });
      observer.observe(node, { characterData: true });
      notifyReactiveTextNodes();
      expect(node.textContent).toBe('same');
      expect(callCount).toBe(1);
      observer.takeRecords().forEach(() => writes++);
      observer.disconnect();
      expect(writes).toBe(0); // same value: no DOM write
      node.remove();
    });

    it('clears the text and logs when the resolver throws during update', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let shouldThrow = false;
      const node = createReactiveTextNode(() => {
        if (shouldThrow) throw new Error('update error');
        return 'ok';
      }, 'ok');
      document.body.appendChild(node);
      shouldThrow = true;
      expect(() => notifyReactiveTextNodes()).not.toThrow();
      expect(node.textContent).toBe('');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      node.remove();
    });

    it('renders a resolver that starts returning an object as ""', () => {
      let value: unknown = 'text';
      const node = createReactiveTextNode(() => value, value);
      document.body.appendChild(node);
      value = { not: 'text' };
      notifyReactiveTextNodes();
      expect(node.textContent).toBe('');
      node.remove();
    });
  });

  describe('GC path – dead WeakRef in reactiveTextNodes (lines 84-85)', () => {
    it('silently removes GC-collected refs and does not throw', () => {
      // Inject a fake dead WeakRef directly into the shared iteration set
      const dead = deadRef<Text>();
      reactiveTextNodes.add(dead);

      expect(() => notifyReactiveTextNodes()).not.toThrow();

      // The dead ref should have been cleaned up
      expect(reactiveTextNodes.has(dead)).toBe(false);
    });

    it('handles multiple dead refs in one pass', () => {
      const dead1 = deadRef<Text>();
      const dead2 = deadRef<Text>();
      reactiveTextNodes.add(dead1);
      reactiveTextNodes.add(dead2);

      expect(() => notifyReactiveTextNodes()).not.toThrow();
      expect(reactiveTextNodes.has(dead1)).toBe(false);
      expect(reactiveTextNodes.has(dead2)).toBe(false);
    });
  });

  describe('Scope filtering', () => {
    it('skips nodes outside the given scope', () => {
      let value = 'initial';
      const node = createReactiveTextNode(() => value, value);
      document.body.appendChild(node);

      value = 'changed';
      const outsideScope = {
        contains: (_n: Node) => false,
      };
      notifyReactiveTextNodes(outsideScope);
      // Value should NOT be updated since node is outside scope
      expect(node.textContent).toBe('initial');

      node.remove();
    });
  });
});
