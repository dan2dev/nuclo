import { describe, it, expect, beforeEach } from 'vitest';
import { applyModifiers } from '../../src/internal/applyModifiers';

/**
 * NOTE:
 *  - These tests focus on behavioral guarantees of applyModifiers:
 *      * Return meta (nextIndex, appended)
 *      * Child indexing only increments for appended (rendered) Nodes
 *      * Attribute-only modifiers do NOT increment index
 *      * Primitives become text nodes
 *      * Existing (already parented) nodes are not re-appended
 *      * Null / undefined modifiers are skipped
 *      * NodeModFn variants returning different kinds of values
 */

describe('internal/applyModifiers', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('returns unchanged meta for empty modifiers array', () => {
    const result = applyModifiers(host, []);
    expect(result.element).toBe(host);
    expect(result.nextIndex).toBe(0);
    expect(result.appended).toBe(0);
    expect(host.childNodes.length).toBe(0);
  });

  it('applies primitive modifiers as text nodes and increments index per appended node', () => {
    const mods = [
      'hello',
      123,
      true
    ] as Array<NodeMod<'div'>>;

    const result = applyModifiers(host, mods, 0);
    expect(result.appended).toBe(3);
    expect(result.nextIndex).toBe(3);
    expect(host.childNodes.length).toBe(6); // 3 comments + 3 text nodes
    const texts = Array.from(host.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent);
    expect(texts).toEqual(['hello', '123', 'true']);
  });

  it('applies attribute-only object modifier without incrementing index', () => {
    const mods = [
      { id: 'alpha', title: 'First' },
      'text-node'
    ] as Array<NodeMod<'div'>>;
    const result = applyModifiers(host, mods, 5);
    // One appended node (the text); index should advance by 1 from startIndex
    expect(result.nextIndex).toBe(6);
    expect(result.appended).toBe(1);
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
    const result = applyModifiers(host, mods);
    expect(result.appended).toBe(2);
    expect(result.nextIndex).toBe(2);
    expect(host.childNodes.length).toBe(4); // 2 comments + 2 text nodes
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
    const result = applyModifiers(host, mods);
    expect(result.appended).toBe(2);
    expect(result.nextIndex).toBe(2);
    expect(host.childNodes.length).toBe(2);
    expect((host.childNodes[0] as HTMLElement).tagName.toLowerCase()).toBe('span');
    expect(host.childNodes[0].textContent).toBe('idx-0');
    expect(host.childNodes[1].textContent).toBe('bold-1');
  });

  it('NodeModFn returning primitive is converted to text node', () => {
    const mods = [
      (parent: ExpandedElement<'div'>) => 'alpha',
      (parent: ExpandedElement<'div'>, i: number) => i * 10
    ] as Array<NodeModFn<'div'>>;
    const result = applyModifiers(host, mods);
    expect(result.appended).toBe(2);
    expect(host.childNodes.length).toBe(4); // 2 comments + 2 text nodes
    expect(host.childNodes[1].textContent).toBe('alpha');
    expect(host.childNodes[3].textContent).toBe('10');
  });

  it('NodeModFn returning attribute object applies attributes but does not append child', () => {
    const mods = [
      (parent: ExpandedElement<'div'>) => ({ id: 'dynamic-id' }),
      'after'
    ] as Array<NodeMod<'div'>>;
    const result = applyModifiers(host, mods, 10);
    expect(host.id).toBe('dynamic-id');
    expect(result.appended).toBe(1); // only the 'after' text
    expect(result.nextIndex).toBe(11);
    expect(host.childNodes.length).toBe(2); // 1 comment + 1 text node
  });

  it('reuses an existing child node without re-appending (but counts toward appended)', () => {
    const reused = document.createElement('i');
    reused.textContent = 'existing';
    host.appendChild(reused);

    const mods = [
      (parent: ExpandedElement<'div'>) => reused
    ] as Array<NodeModFn<'div'>>;
    const result = applyModifiers(host, mods, 0);
    // It was "produced" so appended++ and index++ even though not re-inserted
    expect(result.appended).toBe(1);
    expect(result.nextIndex).toBe(1);
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
      (p: ExpandedElement<'div'>, idx: number) => {
        const em = document.createElement('em');
        em.textContent = `em-${idx}`;
        return em;
      },
      existing,                   // existing, counted
      { id: 'host-id' },          // attrs only
      undefined,                  // skip
      (p: ExpandedElement<'div'>) => ({ 'data-x': '1' }), // attrs only
      'B'
    ];

    const result = applyModifiers(host, mods, 2);
    // Appended nodes: 'A' (text), <em>, existing <span>, 'B' (text) => 4
    expect(result.appended).toBe(4);
    // nextIndex = startIndex (2) + 4
    expect(result.nextIndex).toBe(6);
    expect(host.title).toBe('t1');
    expect(host.id).toBe('host-id');
    expect(host.getAttribute('data-x')).toBe('1');

    const contents = Array.from(host.childNodes).map(n => {
      if (n.nodeType === Node.TEXT_NODE) return n.textContent;
      if (n.nodeType === Node.COMMENT_NODE) return n.textContent;
      return (n as HTMLElement).outerHTML.includes('<em')
        ? (n as HTMLElement).textContent
        : (n as HTMLElement).textContent;
    });
    // existing first child remains first
    expect(contents[0]).toBe('keep');
    // Confirm text nodes inserted
    expect(contents.some(c => c === 'A')).toBe(true);
    expect(contents.some(c => c === 'B')).toBe(true);
  });

  it('startIndex influences resulting nextIndex correctly', () => {
    const mods: Array<NodeMod<'div'>> = ['x', 'y', 'z'];
    const result = applyModifiers(host, mods, 7);
    expect(result.appended).toBe(3);
    expect(result.nextIndex).toBe(10);
  });

  it('zero-arg function returning primitive (reactive text) produces a text node', () => {
    let calls = 0;
    const valueFn = () => {
      calls += 1;
      return `val-${calls}`;
    };

    const mods: Array<NodeMod<'div'>> = [valueFn];
    const result = applyModifiers(host, mods);
    expect(result.appended).toBe(1);
    expect(host.childNodes.length).toBe(2); // 1 comment + 1 reactive text node
    expect(host.childNodes[1]?.textContent).toBe('val-1');
  });
});