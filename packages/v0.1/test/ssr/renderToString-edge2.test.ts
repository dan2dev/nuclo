/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/ssr/renderToString.ts:
 *
 *  Line 104  – getChildNodes: 'children' Array branch (node has children but
 *              no compatible childNodes)
 *  Line 142  – serializeNode element: null/falsy child in childNodes loop
 *  Line 158  – serializeNode fragment: null/falsy child in childNodes loop
 *  Line 201  – renderToString: function input returns non-element value →
 *              ternary false branch returns ''
 */

import { describe, it, expect } from 'vitest';
import { renderToString, renderManyToString, renderToStringWithContainer } from '../../src/ssr/renderToString';
import { NucloElement } from '../../src/polyfill/Element';
import { NucloDocument } from '../../src/polyfill/Document';

// ── Unit: renderToString – function returning non-element (line 201) ───────────
describe('renderToString – function returning non-element (line 201)', () => {
  it('returns empty string when NodeModFn returns undefined', () => {
    const fn = (_parent: unknown, _index: number) => undefined;
    const result = renderToString(fn as unknown as Parameters<typeof renderToString>[0]);
    expect(result).toBe('');
  });

  it('returns empty string when NodeModFn returns null', () => {
    const fn = (_parent: unknown, _index: number) => null;
    const result = renderToString(fn as unknown as Parameters<typeof renderToString>[0]);
    expect(result).toBe('');
  });

  it('returns empty string when NodeModFn returns a string (no nodeType)', () => {
    const fn = (_parent: unknown, _index: number) => 'plain text';
    const result = renderToString(fn as unknown as Parameters<typeof renderToString>[0]);
    expect(result).toBe('');
  });

  it('returns empty string when input is null', () => {
    expect(renderToString(null as unknown as Parameters<typeof renderToString>[0])).toBe('');
  });

  it('returns empty string when input is undefined', () => {
    expect(renderToString(undefined as unknown as Parameters<typeof renderToString>[0])).toBe('');
  });

  it('returns empty string when function throws during rendering', () => {
    const fn = () => { throw new Error('render error'); };
    const result = renderToString(fn as unknown as Parameters<typeof renderToString>[0]);
    expect(result).toBe('');
  });
});

// ── Unit: renderToString – real DOM element ───────────────────────────────────
describe('renderToString – real DOM element', () => {
  it('serializes a simple div', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello';
    const html = renderToString(el);
    expect(html).toBe('<div>Hello</div>');
  });

  it('serializes void elements (self-closing)', () => {
    const img = document.createElement('img');
    img.setAttribute('src', 'test.png');
    const html = renderToString(img);
    expect(html).toMatch(/<img/);
  });

  it('serializes nested elements', () => {
    const div = document.createElement('div');
    const span = document.createElement('span');
    span.textContent = 'inner';
    div.appendChild(span);
    const html = renderToString(div);
    expect(html).toBe('<div><span>inner</span></div>');
  });

  it('serializes comment nodes', () => {
    const container = document.createElement('div');
    const comment = document.createComment('my comment');
    container.appendChild(comment);
    const html = renderToString(container);
    expect(html).toContain('<!--my comment-->');
  });

  it('escapes text content', () => {
    const div = document.createElement('div');
    div.textContent = '<script>alert("xss")</script>';
    const html = renderToString(div);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── Unit: getChildNodes – 'children' array branch (line 104) ──────────────────
describe('renderToString – polyfill element with children array (line 104)', () => {
  it('serializes NucloElement children via children array path', () => {
    // NucloElement uses a children array; its childNodes may have a different interface
    const polyfillDoc = new NucloDocument();
    const parent = polyfillDoc.createElement('div') as unknown as NucloElement;
    const child = polyfillDoc.createElement('span') as unknown as NucloElement;

    // Use proper append methods so childNodes/children are kept in sync
    (child as unknown as { appendChild: (n: unknown) => void }).appendChild(
      polyfillDoc.createTextNode('polyfill text')
    );
    (parent as unknown as { appendChild: (n: unknown) => void }).appendChild(child);

    const html = renderToString(parent as unknown as Element);
    expect(html).toContain('div');
  });

  it('serializes a node that has children array but no standard childNodes length', () => {
    // Craft a minimal node object: has 'children' Array but childNodes has no .length
    const childEl = document.createElement('b');
    childEl.textContent = 'bold';

    const fakeNode = {
      nodeType: 1,
      tagName: 'DIV',
      attributes: { length: 0 } as NamedNodeMap,
      // childNodes exists but lacks .length and is not an Array
      childNodes: Object.create(null) as unknown as NodeList,
      children: [childEl],
    };

    const html = renderToString(fakeNode as unknown as Element);
    expect(html).toContain('div');
    expect(html).toContain('<b>bold</b>');
  });
});

// ── Unit: serializeNode – null/undefined child in childNodes (lines 142, 158) ──
describe('renderToString – null child in childNodes', () => {
  it('skips null child entries in element childNodes (line 142)', () => {
    const span = document.createElement('span');
    span.textContent = 'visible';

    // Use an Array-like object with a null entry (Array.isArray returns true,
    // so getChildNodes returns it directly; the null triggers the if(child) false branch)
    const nullableChildren = [null, span];

    const fakeEl = {
      nodeType: 1,
      tagName: 'DIV',
      attributes: { length: 0 } as NamedNodeMap,
      // Plain JS array with null and a real element
      childNodes: nullableChildren as unknown as NodeList,
    };

    const html = renderToString(fakeEl as unknown as Element);
    // null child is skipped; span is rendered
    expect(html).toContain('<span>visible</span>');
  });

  it('skips null child entries in document fragment childNodes (line 158)', () => {
    const span = document.createElement('span');
    span.textContent = 'frag content';

    const nullableChildren = [null, span];

    // Craft a fragment-like object with null entry in childNodes
    const fakeFragment = {
      nodeType: 11,
      childNodes: nullableChildren as unknown as NodeList,
    };

    const html = renderToString(fakeFragment as unknown as Node);
    expect(html).toContain('<span>frag content</span>');
  });
});

// ── Unit: renderManyToString ──────────────────────────────────────────────────
describe('renderManyToString', () => {
  it('renders an array of elements to strings', () => {
    const div = document.createElement('div');
    div.textContent = 'a';
    const span = document.createElement('span');
    span.textContent = 'b';

    const results = renderManyToString([div, span]);
    expect(results).toHaveLength(2);
    expect(results[0]).toBe('<div>a</div>');
    expect(results[1]).toBe('<span>b</span>');
  });

  it('handles empty array', () => {
    expect(renderManyToString([])).toHaveLength(0);
  });

  it('handles null inputs', () => {
    const results = renderManyToString([null, undefined]);
    expect(results).toEqual(['', '']);
  });
});

// ── Unit: renderToStringWithContainer ────────────────────────────────────────
describe('renderToStringWithContainer', () => {
  it('wraps content in a default div container', () => {
    const span = document.createElement('span');
    span.textContent = 'content';
    const result = renderToStringWithContainer(span);
    expect(result).toMatch(/^<div>.*<\/div>$/);
    expect(result).toContain('<span>content</span>');
  });

  it('wraps content in a custom container tag', () => {
    const p = document.createElement('p');
    p.textContent = 'text';
    const result = renderToStringWithContainer(p, 'section');
    expect(result).toMatch(/^<section>.*<\/section>$/);
  });

  it('applies container attributes', () => {
    const el = document.createElement('div');
    const result = renderToStringWithContainer(el, 'main', { id: 'app', class: 'root' });
    expect(result).toContain('id="app"');
    expect(result).toContain('class="root"');
  });

  it('handles null input with container', () => {
    const result = renderToStringWithContainer(null, 'div');
    expect(result).toBe('<div></div>');
  });
});
