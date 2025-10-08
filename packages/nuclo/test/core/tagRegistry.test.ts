import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerGlobalTagBuilders,
  HTML_TAGS,
  SELF_CLOSING_TAGS
} from '../../src/core/tagRegistry';

// Helper to create a fresh target object per test (not polluting globalThis)
function freshTarget(): Record<string, unknown> {
  return {};
}

describe('tagRegistry.registerGlobalTagBuilders', () => {
  let target: Record<string, unknown>;

  beforeEach(() => {
    target = freshTarget();
  });

  it('registers all HTML tag builders as functions on a fresh target', () => {
    registerGlobalTagBuilders(target);

    // Internal marker is set
    expect((target as any).__vc_tags_registered).toBe(true);

    // All tags exist and are functions
    for (const tag of HTML_TAGS) {
      expect(typeof target[tag]).toBe('function');
    }

    // Spot check that a known self-closing tag exists
    for (const tag of SELF_CLOSING_TAGS) {
      expect(typeof target[tag]).toBe('function');
    }
  });

  it('is idempotent (second call does not overwrite existing builders)', () => {
    registerGlobalTagBuilders(target);
    const firstDivRef = target['div'];
    const firstSpanRef = target['span'];

    // Call again
    registerGlobalTagBuilders(target);

    expect(target['div']).toBe(firstDivRef);
    expect(target['span']).toBe(firstSpanRef);
  });

  it('does not overwrite an existing non-function property with the same tag name', () => {
    // Predefine a sentinel value for "div"
    const sentinel = { custom: true };
    target['div'] = sentinel;

    registerGlobalTagBuilders(target);

    // "div" stays untouched
    expect(target['div']).toBe(sentinel);

    // Another tag is still registered
    expect(typeof target['span']).toBe('function');
  });

  it('builder returns a NodeModFn that creates an element when executed', () => {
    registerGlobalTagBuilders(target);

    const divBuilder = target['div'] as (...mods: any[]) => NodeModFn<'div'>;
    expect(typeof divBuilder).toBe('function');

    // Call builder to get NodeModFn
    const nodeModFn = divBuilder('Hello World');
    expect(typeof nodeModFn).toBe('function');

    const host = document.createElement('div');
    document.body.appendChild(host);

    // Execute NodeModFn (simulating framework usage)
    const produced = nodeModFn(host as any, 0);
    expect(produced).toBeInstanceOf(HTMLDivElement);
    expect((produced as HTMLElement).tagName.toLowerCase()).toBe('div');

    // Child text node is on the produced element, but the element itself is NOT auto‑attached
    expect(produced?.textContent).toBe('Hello World');
    expect(host.contains(produced as Node)).toBe(false);

    // Attach manually to confirm normal DOM usage
    host.appendChild(produced as Node);
    expect(host.contains(produced as Node)).toBe(true);
  });

  it('builder supports passing attribute objects and primitive/text modifiers', () => {
    registerGlobalTagBuilders(target);

    const divBuilder = target['div'] as (...mods: any[]) => NodeModFn<'div'>;

    const host = document.createElement('div');
    document.body.appendChild(host);

    const nodeModFn = divBuilder(
      { id: 'outer', className: 'box' },
      'Some text',
      { title: 'tooltip' }
    );

    const el = nodeModFn(host as any, 0) as HTMLElement;
    expect(el).toBeInstanceOf(HTMLDivElement);
    expect(el.id).toBe('outer');
    expect(el.className).toBe('box');
    // Text node present
    expect(el.textContent).toContain('Some text');
    expect(el.title).toBe('tooltip');
  });

  it('multiple different tag builders create distinct elements', () => {
    registerGlobalTagBuilders(target);

    const divBuilder = target['div'] as (...mods: any[]) => NodeModFn<'div'>;
    const spanBuilder = target['span'] as (...mods: any[]) => NodeModFn<'span'>;

    const host = document.createElement('div');
    document.body.appendChild(host);

    const divEl = divBuilder('A')(host as any, 0) as HTMLElement;
    const spanEl = spanBuilder('B')(host as any, 1) as HTMLElement;

    expect(divEl.tagName.toLowerCase()).toBe('div');
    expect(spanEl.tagName.toLowerCase()).toBe('span');
    expect(divEl.textContent).toBe('A');
    expect(spanEl.textContent).toBe('B');
  });

  it('marker prevents re-registration on the same target', () => {
    registerGlobalTagBuilders(target);
    const markerBefore = (target as any).__vc_tags_registered;
    expect(markerBefore).toBe(true);

    // Manually null out one builder to test that idempotent guard prevents recreation
    target['p'] = undefined;

    registerGlobalTagBuilders(target);

    // Since marker was set, "p" should remain undefined (no re-run)
    expect(target['p']).toBeUndefined();
  });

  it('can register on globalThis without throwing (smoke test)', () => {
    // Use a unique property to detect existing global registration state
    const hadMarkerBefore = (globalThis as any).__vc_tags_registered;
    registerGlobalTagBuilders(); // default target is globalThis
    expect((globalThis as any).__vc_tags_registered).toBe(true);

    // If it was already registered by earlier imports, this should still pass
    registerGlobalTagBuilders();
    expect((globalThis as any).__vc_tags_registered).toBe(true);

    // Clean-up note: We intentionally do not remove the marker since other tests rely on global tags.
    // This test only asserts stability.
    if (!hadMarkerBefore) {
      // If this test was first to register, at least ensure a common tag is present
      expect(typeof (globalThis as any).div).toBe('function');
    }
  });
});