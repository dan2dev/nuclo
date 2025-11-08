import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { on } from '../../src';

describe('utility/on (event listener helper)', () => {
  let originalConsoleError: any;

  beforeEach(() => {
    document.body.innerHTML = '';
    originalConsoleError = console.error;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('attaches a basic click listener and invokes handler', () => {
    const handler = vi.fn();
    const btnBuilder = (globalThis as any).button(
      'Click Me',
      on('click', handler)
    );
    const btn = btnBuilder(document.body as any, 0) as HTMLButtonElement;
    document.body.appendChild(btn);

    btn.dispatchEvent(new Event('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
  });

  it('supports multiple listeners on the same element', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const divBuilder = (globalThis as any).div(
      on('click', h1),
      on('click', h2),
      'Dual'
    );
    const el = divBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(el);

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('handler "this" context is the element the listener was attached to', () => {
    const ctxs: any[] = [];
    const handler = vi.fn(function (this: any) {
      ctxs.push(this);
    });
    const spanBuilder = (globalThis as any).span(on('click', handler), 'Tap');
    const el = spanBuilder(document.body as any, 0) as HTMLSpanElement;
    document.body.appendChild(el);

    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ctxs[0]).toBe(el);
  });

  it('supports AddEventListenerOptions (once: true)', () => {
    const handler = vi.fn();
    const divBuilder = (globalThis as any).div(
      on('click', handler, { once: true }),
      'Once'
    );
    const el = divBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(el);

    el.dispatchEvent(new Event('click'));
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('works with custom events and typed detail', () => {
    interface Detail { value: number; }
    const received: number[] = [];
    const handler = vi.fn((e: CustomEvent<Detail>) => {
      received.push(e.detail.value);
    });

    const boxBuilder = (globalThis as any).div(on<'my-event', CustomEvent<Detail>>('my-event', handler));
    const box = boxBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(box);

    box.dispatchEvent(new CustomEvent<Detail>('my-event', { detail: { value: 42 } }));
    box.dispatchEvent(new CustomEvent<Detail>('my-event', { detail: { value: 7 } }));
    expect(handler).toHaveBeenCalledTimes(2);
    expect(received).toEqual([42, 7]);
  });

  it('does not throw and does nothing if parent lacks addEventListener', () => {
    const handler = vi.fn();
    const modifier = on('click', handler);
    const fakeParent = {} as any;
    // Should not throw
    modifier(fakeParent, 0);
    // Dispatching is impossible; ensure handler never called
    expect(handler).not.toHaveBeenCalled();
  });

  it('logs error when handler throws, but does not rethrow', () => {
    const errorSpy = vi.fn();
    console.error = errorSpy as any;

    const failing = on('click', () => {
      throw new Error('boom');
    });

    const elBuilder = (globalThis as any).div(failing);
    const el = elBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(el);

    // Should not throw out of dispatch
    el.dispatchEvent(new Event('click'));

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const firstArgs = errorSpy.mock.calls[0];
    expect(String(firstArgs[0])).toContain("nuclo: Error in 'click' listener");
  });

  it('can attach multiple distinct event types to same element', () => {
    const clickHandler = vi.fn();
    const focusHandler = vi.fn();
    const inputBuilder = (globalThis as any).input(
      on('click', clickHandler),
      on('focus', focusHandler)
    );
    const input = inputBuilder(document.body as any, 0) as HTMLInputElement;
    document.body.appendChild(input);

    input.dispatchEvent(new Event('click'));
    input.dispatchEvent(new Event('focus'));
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(focusHandler).toHaveBeenCalledTimes(1);
  });

  it('accepts boolean options parameter (capture=false / default)', () => {
    const handler = vi.fn();
    const divBuilder = (globalThis as any).div(on('click', handler, false));
    const el = divBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(el);

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles successive invocations adding separate listeners', () => {
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    const divBuilder = (globalThis as any).div(
      on('click', handlerA),
      on('click', handlerB)
    );
    const el = divBuilder(document.body as any, 0) as HTMLDivElement;
    document.body.appendChild(el);

    el.dispatchEvent(new Event('click'));
    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it('listener still fires after dynamic DOM re-append (retains reference)', () => {
    const handler = vi.fn();
    const pBuilder = (globalThis as any).p(on('click', handler), 'Paragraph');
    const p = pBuilder(document.body as any, 0) as HTMLParagraphElement;
    document.body.appendChild(p);
    // Detach and re-append
    p.remove();
    document.body.appendChild(p);
    p.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});