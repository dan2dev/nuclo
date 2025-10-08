// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { appendChildren } from "../../src/utility/dom";

describe('appendChildren', () => {
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement('div');
  });

  it('should append a single string as text node', () => {
    const result = appendChildren(parent, 'Hello');
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(1);
    expect(parent.childNodes[0]).toBeInstanceOf(Text);
    expect(parent.textContent).toBe('Hello');
  });

  it('should append a single HTMLElement', () => {
    const span = document.createElement('span');
    span.textContent = 'World';
    
    const result = appendChildren(parent, span);
    
    expect(result).toBe(parent);
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0]).toBe(span);
    expect(parent.textContent).toBe('World');
  });

  it('should append multiple strings as text nodes', () => {
    const result = appendChildren(parent, 'Hello', ' ', 'World');
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(3);
    expect(parent.childNodes[0]).toBeInstanceOf(Text);
    expect(parent.childNodes[1]).toBeInstanceOf(Text);
    expect(parent.childNodes[2]).toBeInstanceOf(Text);
    expect(parent.textContent).toBe('Hello World');
  });

  it('should append multiple HTMLElements', () => {
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    span1.textContent = 'First';
    span2.textContent = 'Second';
    
    const result = appendChildren(parent, span1, span2);
    
    expect(result).toBe(parent);
    expect(parent.children).toHaveLength(2);
    expect(parent.children[0]).toBe(span1);
    expect(parent.children[1]).toBe(span2);
    expect(parent.textContent).toBe('FirstSecond');
  });

  it('should append mixed strings and HTMLElements', () => {
    const span = document.createElement('span');
    span.textContent = 'Middle';
    
    const result = appendChildren(parent, 'Start', span, 'End');
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(3);
    expect(parent.childNodes[0]).toBeInstanceOf(Text);
    expect(parent.childNodes[1]).toBe(span);
    expect(parent.childNodes[2]).toBeInstanceOf(Text);
    expect(parent.textContent).toBe('StartMiddleEnd');
  });

  it('should handle empty string', () => {
    const result = appendChildren(parent, '');
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(1);
    expect(parent.childNodes[0]).toBeInstanceOf(Text);
    expect(parent.textContent).toBe('');
  });

  it('should handle no children', () => {
    const result = appendChildren(parent);
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(0);
    expect(parent.textContent).toBe('');
  });

  it('should preserve existing children when appending', () => {
    const existingSpan = document.createElement('span');
    existingSpan.textContent = 'Existing';
    parent.appendChild(existingSpan);
    
    const newSpan = document.createElement('div');
    newSpan.textContent = 'New';
    
    const result = appendChildren(parent, 'Text', newSpan);
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(3);
    expect(parent.children[0]).toBe(existingSpan);
    expect(parent.childNodes[1]).toBeInstanceOf(Text);
    expect(parent.children[1]).toBe(newSpan);
    expect(parent.textContent).toBe('ExistingTextNew');
  });

  it('should work with different HTML element types', () => {
    const button = document.createElement('button');
    const input = document.createElement('input');
    const p = document.createElement('p');
    
    button.textContent = 'Click me';
    input.value = 'test';
    p.textContent = 'Paragraph';
    
    const result = appendChildren(parent, button, input, p);
    
    expect(result).toBe(parent);
    expect(parent.children).toHaveLength(3);
    expect(parent.children[0]).toBe(button);
    expect(parent.children[1]).toBe(input);
    expect(parent.children[2]).toBe(p);
  });

  it('should handle special characters in strings', () => {
    const specialText = '<script>alert("xss")</script> & "quotes" & \'apostrophes\'';
    
    const result = appendChildren(parent, specialText);
    
    expect(result).toBe(parent);
    expect(parent.childNodes).toHaveLength(1);
    expect(parent.childNodes[0]).toBeInstanceOf(Text);
    expect(parent.textContent).toBe(specialText);
    // Ensure it's treated as text, not HTML
    expect(parent.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt; &amp; "quotes" &amp; \'apostrophes\'');
  });
});
