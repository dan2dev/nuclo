import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRenderable } from '../../src/utility/renderables';
import '../../src'; // Ensure runtime bootstrap registers global tag builders (div, span, etc.)

// Tag builders (div, span, etc.) are globally registered by runtime bootstrap side effects

describe('utility/resolveRenderable', () => {
  let host: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('resolves a NodeModFn produced by a tag builder to an element', () => {
    const nodeModFn = (globalThis as any).div('Hello World');
    const el = resolveRenderable(nodeModFn, host as any, 0);
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el?.textContent).toBe('Hello World');
    // Element should not be auto-attached to host
    expect(host.contains(el as Node)).toBe(false);
  });

  it('returns null when NodeModFn returns null', () => {
    const nodeModFn: NodeModFn<any> = () => null;
    const el = resolveRenderable(nodeModFn, host as any, 0);
    expect(el).toBeNull();
  });

  it('returns null when NodeModFn returns primitive', () => {
    const nodeModFn: NodeModFn<any> = () => 'primitive' as any;
    const el = resolveRenderable(nodeModFn, host as any, 0);
    expect(el).toBeNull();
  });

  it('returns null when NodeModFn returns attribute object', () => {
    const nodeModFn: NodeModFn<any> = () => ({ id: 'x' }) as any;
    const el = resolveRenderable(nodeModFn, host as any, 0);
    expect(el).toBeNull();
  });

  it('returns the element itself when result is already an element', () => {
    const produced = (globalThis as any).span('Inside')(host as any, 0) as HTMLElement;
    // Sanity
    expect(produced).toBeInstanceOf(HTMLSpanElement);
    const resolved = resolveRenderable(produced, host as any, 1);
    expect(resolved).toBe(produced);
  });

  it('returns null for non-function, non-element values', () => {
    expect(resolveRenderable('text' as any, host as any, 0)).toBeNull();
    expect(resolveRenderable(123 as any, host as any, 0)).toBeNull();
    expect(resolveRenderable(true as any, host as any, 0)).toBeNull();
    expect(resolveRenderable({ notTag: true } as any, host as any, 0)).toBeNull();
  });

  it('propagates errors thrown by a NodeModFn', () => {
    const err = new Error('boom');
    const nodeModFn: NodeModFn<any> = () => { throw err; };
    expect(() => resolveRenderable(nodeModFn, host as any, 0)).toThrowError(err);
  });

  it('does not append returned element to host (caller decides)', () => {
    const nodeModFn = (globalThis as any).div('Detached');
    const el = resolveRenderable(nodeModFn, host as any, 0)!;
    expect(host.contains(el)).toBe(false);
    host.appendChild(el);
    expect(host.contains(el)).toBe(true);
  });

  it('can resolve multiple distinct NodeModFns independently', () => {
    const one = (globalThis as any).div('One');
    const two = (globalThis as any).div('Two');
    const el1 = resolveRenderable(one, host as any, 0)!;
    const el2 = resolveRenderable(two, host as any, 1)!;
    expect(el1).not.toBe(el2);
    expect(el1.textContent).toBe('One');
    expect(el2.textContent).toBe('Two');
  });
});