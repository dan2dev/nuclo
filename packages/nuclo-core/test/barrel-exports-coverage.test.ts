/**
 * @vitest-environment jsdom
 *
 * Covers the 0%-statement barrel/re-export files by simply importing them and
 * exercising a representative export from each.  These files contain only
 * re-exports and type definitions; the test just ensures the module graph is
 * walked by the coverage tool.
 *
 * Files covered:
 *  - src/index.ts                 (0 % stmts)
 *  - src/core/reactive.ts         (0 % stmts – re-exports)
 *  - src/list/index.ts            (0 % stmts – re-exports)
 *  - src/when/index.ts            (re-exports)
 *  - src/ssr/index.ts             (re-exports)
 *  - src/style/index.ts           (re-exports)
 */

import { describe, it, expect } from 'vitest';

// ── src/index.ts ────────────────────────────────────────────────────────────
describe('src/index.ts barrel', () => {
  it('exports key runtime symbols', async () => {
    const mod = await import('../src/index');

    expect(typeof mod.initializeRuntime).toBe('function');
    expect(typeof mod.createHtmlTagBuilder).toBe('function');
    expect(typeof mod.createSvgTagBuilder).toBe('function');
    expect(typeof mod.applyNodeModifier).toBe('function');
    expect(typeof mod.list).toBe('function');
    expect(typeof mod.when).toBe('function');
    expect(typeof mod.update).toBe('function');
    expect(typeof mod.on).toBe('function');
    expect(typeof mod.scope).toBe('function');
    expect(typeof mod.render).toBe('function');
    expect(typeof mod.isBrowser).toBe('boolean');
    expect(typeof mod.isFunction).toBe('function');
    expect(typeof mod.isPrimitive).toBe('function');
  });

  it('exports style utilities', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.display).toBe('function');
    expect(typeof mod.flex).toBe('function');
    expect(typeof mod.backgroundColor).toBe('function');
    expect(typeof mod.fontSize).toBe('function');
    expect(typeof mod.StyleBuilder).toBe('function');
  });

  it('exports DOM helpers', async () => {
    const mod = await import('../src/index');
    expect(typeof mod.appendChildren).toBe('function');
    expect(typeof mod.createComment).toBe('function');
    expect(typeof mod.replaceNodeSafely).toBe('function');
  });
});

// ── src/core/reactiveText.ts & reactiveAttributes.ts ────────────────────────
describe('reactive modules', () => {
  it('exports reactive text utilities', async () => {
    const mod = await import('../src/core/reactiveText');
    expect(typeof mod.createReactiveTextNode).toBe('function');
    expect(typeof mod.notifyReactiveTextNodes).toBe('function');
  });

  it('exports reactive attribute utilities', async () => {
    const mod = await import('../src/core/reactiveAttributes');
    expect(typeof mod.registerAttributeResolver).toBe('function');
    expect(typeof mod.notifyReactiveElements).toBe('function');
  });

  it('exports reactive cleanup utilities', async () => {
    const mod = await import('../src/core/reactiveCleanup');
    expect(typeof mod.cleanupReactiveTextNode).toBe('function');
    expect(typeof mod.cleanupReactiveElement).toBe('function');
  });
});

// ── src/list/index.ts ────────────────────────────────────────────────────────
describe('src/list/index.ts barrel', () => {
  it('re-exports list()', async () => {
    const mod = await import('../src/list/index');
    expect(typeof mod.list).toBe('function');
  });
});

// ── src/ssr/index.ts ─────────────────────────────────────────────────────────
describe('src/ssr/index.ts barrel', () => {
  it('re-exports SSR utilities', async () => {
    const mod = await import('../src/ssr/index');
    expect(typeof mod.renderToString).toBe('function');
    expect(typeof mod.renderManyToString).toBe('function');
    expect(typeof mod.renderToStringWithContainer).toBe('function');
  });
});

// ── src/style/index.ts ───────────────────────────────────────────────────────
describe('src/style/index.ts barrel', () => {
  it('re-exports style utilities', async () => {
    const mod = await import('../src/style/index');
    expect(typeof mod.StyleBuilder).toBe('function');
    expect(typeof mod.createStyleQueries).toBe('function');
    expect(typeof mod.createBreakpoints).toBe('function');
    expect(typeof mod.createCSSClass).toBe('function');
  });
});
