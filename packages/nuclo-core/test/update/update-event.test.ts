/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dispatchGlobalUpdateEvent, update } from '../../src/update/update';
import { scope } from '../../src/update/scope';
import type { UpdateScope } from '../../src/update/scope';
import '../../src';

describe('utility/events.dispatchGlobalUpdateEvent', () => {
  let origConsoleError: any;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clean document listeners between tests
    document.body.innerHTML = '';
    // Spy on console.error for error branch test
    origConsoleError = console.error;
    consoleErrorSpy = vi.fn();
    console.error = consoleErrorSpy as any;
  });

  afterEach(() => {
    console.error = origConsoleError;
  });

  it('dispatches exactly one event: body listener and document listener each fire once', () => {
    const order: string[] = [];
    const bodyHandler = vi.fn((e: Event) => {
      order.push('body');
      expect(e.type).toBe('update');
    });
    const docHandler = vi.fn((e: Event) => {
      order.push('document');
      expect(e.type).toBe('update');
    });

    document.body.addEventListener('update', bodyHandler);
    document.addEventListener('update', docHandler);

    dispatchGlobalUpdateEvent();

    // Single dispatch on body; document sees it via bubbling only —
    // no second direct dispatch.
    expect(bodyHandler).toHaveBeenCalledTimes(1);
    expect(docHandler).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['body', 'document']);

    document.body.removeEventListener('update', bodyHandler);
    document.removeEventListener('update', docHandler);
  });

  it('logs the error when the body dispatch throws', () => {
    const docHandler = vi.fn();
    document.addEventListener('update', docHandler);

    // Replace body.dispatchEvent to throw
    const originalBodyDispatch = document.body.dispatchEvent.bind(document.body);
    (document.body as any).dispatchEvent = vi.fn(() => {
      throw new Error('boom-body-dispatch');
    });

    dispatchGlobalUpdateEvent();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const firstErrorMsg = consoleErrorSpy.mock.calls[0][0];
    expect(String(firstErrorMsg)).toContain('Error dispatching global update event');

    // Single-dispatch semantics: the failed body dispatch is the only
    // dispatch, so nothing reaches document either.
    expect(docHandler).toHaveBeenCalledTimes(0);

    // Restore original
    (document.body as any).dispatchEvent = originalBodyDispatch;
    document.removeEventListener('update', docHandler);
  });

  it('multiple listeners each fire exactly once (body and document alike)', () => {
    const bodyA = vi.fn();
    const bodyB = vi.fn();
    const docA = vi.fn();
    const docB = vi.fn();

    document.body.addEventListener('update', bodyA);
    document.body.addEventListener('update', bodyB);
    document.addEventListener('update', docA);
    document.addEventListener('update', docB);

    dispatchGlobalUpdateEvent();

    expect(bodyA).toHaveBeenCalledTimes(1);
    expect(bodyB).toHaveBeenCalledTimes(1);
    expect(docA).toHaveBeenCalledTimes(1);
    expect(docB).toHaveBeenCalledTimes(1);

    expect((docA.mock.calls[0][0] as Event).type).toBe('update');

    document.body.removeEventListener('update', bodyA);
    document.body.removeEventListener('update', bodyB);
    document.removeEventListener('update', docA);
    document.removeEventListener('update', docB);
  });

  describe('scoped dispatch', () => {
    it('dispatches on each scope root instead of body/document', () => {
      const rootA = document.createElement('section');
      const rootB = document.createElement('aside');
      document.body.appendChild(rootA);
      document.body.appendChild(rootB);

      const handlerA = vi.fn();
      const handlerB = vi.fn();
      rootA.addEventListener('update', handlerA);
      rootB.addEventListener('update', handlerB);

      const fakeScope: UpdateScope = {
        roots: [rootA, rootB],
        contains: (node) => rootA.contains(node) || rootB.contains(node),
      };

      dispatchGlobalUpdateEvent(fakeScope);

      expect(handlerA).toHaveBeenCalledTimes(1);
      expect(handlerB).toHaveBeenCalledTimes(1);
    });

    it('dispatches nothing when the scope has no roots', () => {
      const bodyHandler = vi.fn();
      const docHandler = vi.fn();
      document.body.addEventListener('update', bodyHandler);
      document.addEventListener('update', docHandler);

      const emptyScope: UpdateScope = { roots: [], contains: () => false };
      dispatchGlobalUpdateEvent(emptyScope);

      expect(bodyHandler).toHaveBeenCalledTimes(0);
      expect(docHandler).toHaveBeenCalledTimes(0);

      document.body.removeEventListener('update', bodyHandler);
      document.removeEventListener('update', docHandler);
    });

    it('update("id") fires listeners on the scope root but not on sibling subtrees', () => {
      const scopedEl = div(scope('evt-scope-a'))(
        document.body as unknown as ExpandedElement<'div'>,
      ) as unknown as HTMLElement;
      const sibling = document.createElement('div');
      document.body.appendChild(scopedEl);
      document.body.appendChild(sibling);

      const scopedHandler = vi.fn();
      const siblingHandler = vi.fn();
      scopedEl.addEventListener('update', scopedHandler);
      sibling.addEventListener('update', siblingHandler);

      update('evt-scope-a');

      expect(scopedHandler).toHaveBeenCalledTimes(1);
      expect(siblingHandler).toHaveBeenCalledTimes(0);
      // Note: the event bubbles from the scope root, so *ancestors* of the
      // root (body, document) do observe it — same semantics as the manual
      // element.dispatchEvent(new Event('update')) workflow.
    });

    it('update("unknown-id") with no registered roots dispatches nothing', () => {
      const bodyHandler = vi.fn();
      document.body.addEventListener('update', bodyHandler);

      update('evt-scope-that-does-not-exist');

      expect(bodyHandler).toHaveBeenCalledTimes(0);

      document.body.removeEventListener('update', bodyHandler);
    });
  });
});
