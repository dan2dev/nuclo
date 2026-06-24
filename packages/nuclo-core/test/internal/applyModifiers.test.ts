/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from 'vitest';
import { applyModifiers } from '../../src/internal/applyModifiers';
import { runSerializing } from '../../src/hydration/context';

/**
 * These tests assert the observable DOM behavior of applyModifiers:
 *   * Child indexing (encoded in the `text-N` comment markers) advances only
 *     for appended Nodes — attribute-only modifiers do NOT advance it
 *   * Primitives become text nodes
 *   * Existing (already parented) nodes are not re-appended
 *   * Null / undefined modifiers are skipped
 *   * NodeModFn variants returning different kinds of values
 *
 * The index is internal bookkeeping that drives the unique `text-N` markers.
 * Those markers are only emitted when building for SSR serialization (a pure
 * client render skips them — see basic-dom/div.test.ts), so the indexing tests
 * run their applyModifiers call inside runSerializing() to observe the markers.
 */
const textMarkers = (host: HTMLElement): Array<string | undefined> =>
  Array.from(host.childNodes)
    .filter(n => n.nodeType === Node.COMMENT_NODE)
    .map(n => n.textContent?.trim());

describe('internal/applyModifiers', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('appends nothing for an empty modifiers array', () => {
    applyModifiers(host, []);
    expect(host.childNodes.length).toBe(0);
  });

  it('applies primitive modifiers as text nodes, one marker index per node', () => {
    const mods = [
      'hello',
      123,
      true
    ] as Array<NodeMod<'div'>>;

    runSerializing(() => applyModifiers(host, mods, 0));
    expect(host.childNodes.length).toBe(6); // 3 comments + 3 text nodes
    expect(textMarkers(host)).toEqual(['text-0', 'text-1', 'text-2']);
    const texts = Array.from(host.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent);
    expect(texts).toEqual(['hello', '123', 'true']);
  });

  it('applies attribute-only object modifier without advancing the marker index', () => {
    const mods = [
      { id: 'alpha', title: 'First' },
      'text-node'
    ] as Array<NodeMod<'div'>>;
    runSerializing(() => applyModifiers(host, mods, 5));
    // attribute-only modifier does not advance the index; the text keeps marker 5
    expect(textMarkers(host)).toEqual(['text-5']);
    expect(host.id).toBe('alpha');
    expect(host.title).toBe('First');
    expect(host.childNodes.length).toBe(2); // 1 comment + 1 text node
    expect(host.childNodes[1]?.textContent).toBe('text-node');
  });

  it('skips null / undefined modifiers', () => {
    const mods = [
      null,
      undefined,
      'x',
      undefined,
      null,
      'y'
    ] as Array<NodeMod<'div'>>;
    runSerializing(() => applyModifiers(host, mods));
    expect(host.childNodes.length).toBe(4); // 2 comments + 2 text nodes
    expect(textMarkers(host)).toEqual(['text-0', 'text-1']);
    expect(Array.from(host.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent)).toEqual(['x', 'y']);
  });

  it('invokes NodeModFn returning an Element and appends it', () => {
    const mods = [
      (parent: ExpandedElement<'div'>, index: number) => {
        const span = document.createElement('span');
        span.textContent = `idx-${index}`;
        return span;
      },
      (parent: ExpandedElement<'div'>, index: number) => {
        const b = document.createElement('b');
        b.textContent = `bold-${index}`;
        return b;
      }
    ] as Array<NodeModFn<'div'>>;
    applyModifiers(host, mods);
    expect(host.childNodes.length).toBe(2);
    expect((host.childNodes[0] as HTMLElement).tagName.toLowerCase()).toBe('span');
    expect(host.childNodes[0].textContent).toBe('idx-0');
    expect(host.childNodes[1].textContent).toBe('bold-1');
  });

  it('NodeModFn returning primitive is converted to text node', () => {
    const mods = [
      (_parent: ExpandedElement<'div'>) => 'alpha',
      (_parent: ExpandedElement<'div'>, i: number) => i * 10
    ] as Array<NodeModFn<'div'>>;
    runSerializing(() => applyModifiers(host, mods));
    expect(host.childNodes.length).toBe(4); // 2 comments + 2 text nodes
    expect(host.childNodes[1].textContent).toBe('alpha');
    expect(host.childNodes[3].textContent).toBe('10');
  });

  it('NodeModFn returning attribute object applies attributes but does not append child', () => {
    const mods = [
      (_parent: ExpandedElement<'div'>) => ({ id: 'dynamic-id' }),
      'after'
    ] as Array<NodeMod<'div'>>;
    runSerializing(() => applyModifiers(host, mods, 10));
    expect(host.id).toBe('dynamic-id');
    // attribute-only function does not advance the index; the text keeps marker 10
    expect(textMarkers(host)).toEqual(['text-10']);
    expect(host.childNodes.length).toBe(2); // 1 comment + 1 text node
  });

  it('reuses an existing child node without re-appending', () => {
    const reused = document.createElement('i');
    reused.textContent = 'existing';
    host.appendChild(reused);

    const mods = [
      (_parent: ExpandedElement<'div'>) => reused
    ] as Array<NodeModFn<'div'>>;
    applyModifiers(host, mods, 0);
    expect(host.childNodes.length).toBe(1);
    expect(host.firstChild).toBe(reused);
  });

  it('mix: attributes, primitives, NodeModFn, existing node, nulls', () => {
    const existing = document.createElement('span');
    existing.textContent = 'keep';
    host.appendChild(existing);

    const mods: Array<NodeMod<'div'>> = [
      { title: 't1' },            // attrs only
      null,                       // skip
      'A',                        // text
      (_p: ExpandedElement<'div'>, idx: number) => {
        const em = document.createElement('em');
        em.textContent = `em-${idx}`;
        return em;
      },
      existing,                   // existing, counted
      { id: 'host-id' },          // attrs only
      undefined,                  // skip
      (_p: ExpandedElement<'div'>) => ({ 'data-x': '1' }), // attrs only
      'B'
    ];

    applyModifiers(host, mods, 2);
    expect(host.title).toBe('t1');
    expect(host.id).toBe('host-id');
    expect(host.getAttribute('data-x')).toBe('1');

    const contents = Array.from(host.childNodes).map(n => n.textContent);
    // existing first child remains first
    expect(contents[0]).toBe('keep');
    // Confirm text nodes inserted
    expect(contents.some(c => c === 'A')).toBe(true);
    expect(contents.some(c => c === 'B')).toBe(true);
  });

  it('startIndex offsets the marker index of appended nodes', () => {
    const mods: Array<NodeMod<'div'>> = ['x', 'y', 'z'];
    runSerializing(() => applyModifiers(host, mods, 7));
    expect(textMarkers(host)).toEqual(['text-7', 'text-8', 'text-9']);
  });

  it('zero-arg function returning primitive (reactive text) produces a text node', () => {
    let calls = 0;
    const valueFn = () => {
      calls += 1;
      return `val-${calls}`;
    };

    const mods: Array<NodeMod<'div'>> = [valueFn];
    runSerializing(() => applyModifiers(host, mods));
    expect(host.childNodes.length).toBe(2); // 1 comment + 1 reactive text node
    expect(host.childNodes[1]?.textContent).toBe('val-1');
  });
});
