import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createReactiveTextNode,
  registerAttributeResolver,
  notifyReactiveTextNodes,
  notifyReactiveElements
} from '../../src/core/reactive';

describe('reactive system (reactive.ts)', () => {
  let originalConsoleError: any;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalConsoleError = console.error;
    errorSpy = vi.fn();
    console.error = errorSpy as any;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('createReactiveTextNode', () => {
    it('creates a text node that updates when resolver value changes', () => {
      const state = { count: 0 };
      const txt = createReactiveTextNode(() => state.count);
      // Must attach so the reactive system keeps tracking it
      document.body.appendChild(txt);
      expect(txt.textContent).toBe('0');

      state.count = 1;
      notifyReactiveTextNodes();
      expect(txt.textContent).toBe('1');

      state.count = 42;
      notifyReactiveTextNodes();
      expect(txt.textContent).toBe('42');
    });

    it('uses preEvaluated value without invoking resolver initially', () => {
      const resolver = vi.fn(() => 5);
      const txt = createReactiveTextNode(resolver, 10);
      document.body.appendChild(txt);
      expect(txt.textContent).toBe('10');
      expect(resolver).not.toHaveBeenCalled();

      notifyReactiveTextNodes();
      expect(resolver).toHaveBeenCalledTimes(1);
      expect(txt.textContent).toBe('5');
    });

    it('handles resolver throwing (keeps previous value) without requiring error assertion', () => {
      let toggle = true;
      const txt = createReactiveTextNode(() => {
        if (toggle) {
          toggle = false;
          throw new Error('boom');
        }
        return 'ok';
      }, '');
      document.body.appendChild(txt);

      // First notify should catch error, keep ""
      notifyReactiveTextNodes();
      expect(txt.textContent).toBe('');

      // Second notify should succeed and update content
      notifyReactiveTextNodes();
      expect(txt.textContent).toBe('ok');
    });

    it('logs error when provided resolver is not a function', () => {
      const txt = createReactiveTextNode('not-a-fn' as any);
      document.body.appendChild(txt);
      expect(txt.textContent).toBe('');
      expect(errorSpy).toHaveBeenCalled();
      const firstCallArg = errorSpy.mock.calls[0][0];
      expect(String(firstCallArg)).toContain('Invalid resolver');
      expect(txt).toBeInstanceOf(Text);
    });

    it('stops updating once the node is detached from DOM', () => {
      let calls = 0;
      const state = { value: 'A' };
      const txt = createReactiveTextNode(() => {
        calls += 1;
        return state.value;
      });

      document.body.appendChild(txt);
      notifyReactiveTextNodes(); // first update after initial creation call
      expect(calls).toBe(2); // 1 (creation) + 1 (first notify)

      state.value = 'B';
      notifyReactiveTextNodes();
      expect(txt.textContent).toBe('B');
      expect(calls).toBe(3);

      // Detach
      txt.remove();

      state.value = 'C';
      notifyReactiveTextNodes();
      // Resolver should not run again (pruned)
      expect(calls).toBe(3);
      expect(txt.textContent).toBe('B');
    });
  });

  describe('registerAttributeResolver / notifyReactiveElements', () => {
    it('reactively updates an element attribute using notifyReactiveElements', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      let color = 'red';

      registerAttributeResolver(
        el,
        'title',
        () => color,
        (v) => {
          if (v != null) el.title = String(v);
        }
      );

      expect(el.title).toBe('red');

      color = 'blue';
      notifyReactiveElements();
      expect(el.title).toBe('blue');

      color = 'green';
      el.dispatchEvent(new Event('update'));
      expect(el.title).toBe('green');
    });

    it('does not update attributes after element is detached (resolver pruned)', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      let value = 'one';

      registerAttributeResolver(
        el,
        'data-test',
        () => value,
        (v) => {
          if (v != null) el.setAttribute('data-test', String(v));
        }
      );

      expect(el.getAttribute('data-test')).toBe('one');

      value = 'two';
      notifyReactiveElements();
      expect(el.getAttribute('data-test')).toBe('two');

      // Detach
      el.remove();
      value = 'three';
      notifyReactiveElements();
      // Should remain 'two'
      expect(el.getAttribute('data-test')).toBe('two');
    });

    it('logs error for invalid element parameter', () => {
      registerAttributeResolver(
        {} as any,
        'foo',
        () => 'bar',
        () => {}
      );
      expect(errorSpy).toHaveBeenCalled();
      const msg = errorSpy.mock.calls[0][0];
      expect(String(msg)).toContain('Invalid parameters for registerAttributeResolver');
    });

    it('logs error when applyValue throws during initial application', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      const err = new Error('apply failure');

      registerAttributeResolver(
        el,
        'data-x',
        () => 'abc',
        () => {
          throw err;
        }
      );

      expect(errorSpy).toHaveBeenCalled();
      const calls = errorSpy.mock.calls.map(c => c[0] as string);
      expect(calls.some(line => String(line).includes('Failed to apply initial attribute value'))).toBe(true);
    });

    it('continues updating other attributes when one resolver throws', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      let ok = 'A';
      let explode = true;

      registerAttributeResolver(
        el,
        'data-ok',
        () => ok,
        (v) => el.setAttribute('data-ok', String(v))
      );

      registerAttributeResolver(
        el,
        'data-bad',
        () => {
          if (explode) throw new Error('bad resolver');
          return 'fine';
        },
        (v) => el.setAttribute('data-bad', String(v))
      );

      // Initial: bad resolver error logged, ok applied
      expect(el.getAttribute('data-ok')).toBe('A');
      expect(errorSpy).toHaveBeenCalled();

      ok = 'B';
      explode = false;
      notifyReactiveElements();

      expect(el.getAttribute('data-ok')).toBe('B');
      expect(el.getAttribute('data-bad')).toBe('fine');
    });
  });

  describe('integration: reactive text + attribute in same update cycle', () => {
    it('updates both reactive text nodes and reactive attributes in a single notification cycle', () => {
      const host = document.createElement('div');
      document.body.appendChild(host);

      const state = { label: 'Start', title: 'T1' };
      const txt = createReactiveTextNode(() => state.label);
      host.appendChild(txt);

      registerAttributeResolver(
        host,
        'title',
        () => state.title,
        (v) => {
          if (v != null) host.title = String(v);
        }
      );

      expect(host.title).toBe('T1');
      expect(txt.textContent).toBe('Start');

      state.label = 'Next';
      state.title = 'T2';
      notifyReactiveTextNodes();
      notifyReactiveElements();

      expect(txt.textContent).toBe('Next');
      expect(host.title).toBe('T2');
    });
  });
});
