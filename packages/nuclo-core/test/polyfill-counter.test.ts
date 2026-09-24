/// <reference path="../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import '../src/polyfill';
import '../src';
import { renderToString } from '../src/ssr/render-to-string';

describe('Simple counter example in Node.js with polyfills', () => {
  beforeEach(() => {
    // Clear the document body before each test
    if (document.body && document.body.children) {
      document.body.children.length = 0;
    }
  });

  it('should render a simple counter structure', () => {
    const count = 0;

    // Create a simple counter component
    const counter = div(
      { id: 'counter' },
      h1('Counter App'),
      div({ className: 'display' }, `Count: ${count}`),
      button('Increment'),
      button('Decrement')
    );

    // Render to document body
    render(counter);

    // Verify the div was created
    expect(document.body.children.length).toBe(1);
    const divEl = document.body.children[0];
    expect(divEl.tagName.toLowerCase()).toBe('div');
    expect(divEl.id).toBe('counter');

    // Verify children were created
    expect(divEl.children.length).toBe(4); // h1, div, button, button

    // The first child is the heading
    const h1El = divEl.children[0];
    expect(h1El.tagName.toLowerCase()).toBe('h1');

    // Count button children directly
    let buttonCount = 0;
    for (const child of divEl.children) {
      if (child.tagName.toLowerCase() === 'button') {
        buttonCount++;
      }
    }
    expect(buttonCount).toBe(2);
  });

  it('should set static attributes correctly', () => {
    const element = div(
      { 
        id: 'test-id', 
        className: 'test-class',
        'data-value': '42'
      },
      'Content'
    );

    render(element);

    const divEl = document.body.children[0];
    expect(divEl.id).toBe('test-id');
    expect(divEl.className).toBe('test-class');
    expect(divEl.getAttribute('data-value')).toBe('42');
  });

  it('should handle nested elements', () => {
    const app = div(
      { id: 'app' },
      div(
        { className: 'header' },
        h1('Title')
      ),
      div(
        { className: 'content' },
        p('Paragraph'),
        button('Button')
      )
    );

    render(app);

    const appDiv = document.body.children[0];
    expect(appDiv.id).toBe('app');
    expect(appDiv.children.length).toBe(2);
    
    // Check first child (header)
    const header = appDiv.children[0];
    expect(header.className).toBe('header');
    expect(header.children.length).toBe(1);
    expect(header.children[0].tagName.toLowerCase()).toBe('h1');
    
    // Check second child (content)
    const content = appDiv.children[1];
    expect(content.className).toBe('content');
    expect(content.children.length).toBe(2);
  });

  it('should serialize basic HTML structure', () => {
    const element = div(
      { id: 'test', className: 'container' },
      h1('Hello'),
      button('Click')
    );

    const html = renderToString(element);

    expect(html).toContain('<div');
    expect(html).toContain('id="test"');
    expect(html).toContain('class="container"');
    expect(html).toContain('<h1');
    expect(html).toContain('<button');
    expect(html).toContain('</div>');
  });

  it('returns no query results: SSR output is serialized, not queried', () => {
    render(div(div({ id: 'unique-id' }, 'By ID'), span('By Tag')));
    const root = document.body.children[0];
    expect(root.querySelector('#unique-id')).toBeNull();
    expect(Array.from(root.querySelectorAll('span'))).toEqual([]);
  });
});
