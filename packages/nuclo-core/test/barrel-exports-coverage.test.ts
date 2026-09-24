/**
 * @vitest-environment jsdom
 *
 * Covers the 0%-statement barrel/re-export files by simply importing them and
 * exercising a representative export from each.  These files contain only
 * re-exports and type definitions; the test just ensures the module graph is
 * walked by the coverage tool.
 *
 * Files covered (src/index.ts is pinned by index-exports.test.ts):
 *  - src/update/reactive-text.ts         (0 % stmts – re-exports)
 *  - src/list/index.ts            (0 % stmts – re-exports)
 *  - src/when/index.ts            (re-exports)
 *  - src/ssr/index.ts             (re-exports)
 *  - src/style/index.ts           (re-exports)
 */

import { describe, it, expect } from 'vitest';

// ── src/update/reactive-text.ts & reactive-attributes.ts ────────────────────────
describe('reactive modules', () => {
  it('exports reactive text utilities', async () => {
    const mod = await import('../src/update/reactive-text');
    expect(typeof mod.createReactiveTextNode).toBe('function');
    expect(typeof mod.notifyReactiveTextNodes).toBe('function');
  });

  it('exports reactive attribute utilities', async () => {
    const mod = await import('../src/update/reactive-attributes');
    expect(typeof mod.registerAttributeResolver).toBe('function');
    expect(typeof mod.notifyReactiveElements).toBe('function');
  });

  it('exports reactive cleanup utilities', async () => {
    const mod = await import('../src/update/registry');
    expect(typeof mod.cleanupReactiveTextNode).toBe('function');
    expect(typeof mod.cleanupReactiveElement).toBe('function');
  });
});

// ── src/list/index.ts ────────────────────────────────────────────────────────
describe('src/list/index.ts barrel', () => {
  it('re-exports list()', async () => {
    const mod = await import('../src/list');
    expect(typeof mod.list).toBe('function');
  });
});

// ── src/ssr/index.ts ─────────────────────────────────────────────────────────
describe('src/ssr/index.ts barrel', () => {
  it('re-exports SSR utilities', async () => {
    const mod = await import('../src/ssr');
    expect(typeof mod.renderToString).toBe('function');
    expect(typeof mod.renderManyToString).toBe('function');
    expect(typeof mod.renderToStringWithContainer).toBe('function');
    expect(typeof mod.getCssText).toBe('function');
    expect(Object.keys(mod).sort()).toEqual(['getCssText', 'renderManyToString', 'renderToString', 'renderToStringWithContainer']);
  });
});

// ── src/style/index.ts ───────────────────────────────────────────────────────
describe('src/style/index.ts barrel', () => {
  it('re-exports style utilities', async () => {
    const mod = await import('../src/style');
    expect(typeof mod.createCss).toBe('function');
    expect(typeof mod.css).toBe('function');
    expect(typeof mod.cx).toBe('function');
    expect(typeof mod.getCssText).toBe('function');
    expect(typeof mod.resetStyles).toBe('function');
  });
});
