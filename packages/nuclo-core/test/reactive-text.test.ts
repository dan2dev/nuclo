/**
 * @vitest-environment jsdom
 */

/// <reference path="../types/index.d.ts" />

import { describe, it, expect, beforeEach } from 'vitest';
import '../src'; // Import to initialize runtime

// Mock data object for testing
const mockData = {
  color: 'red',
  count: 0,
  message: 'Hello World'
};

describe('Reactive Text', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockData.color = 'red';
    mockData.count = 0;
    mockData.message = 'Hello World';
  });

  it('should create reactive text node from function returning string', () => {
    const element = (globalThis as any).div(() => mockData.message)(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Hello World');
    
    // Update the data and call update()
    mockData.message = 'Updated Message';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('Updated Message');
  });

  it('should create reactive text node from function returning number', () => {
    const element = (globalThis as any).div(() => mockData.count)(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('0');
    
    // Update the data and call update()
    mockData.count = 42;
    (globalThis as any).update();
    
    expect(element.textContent).toBe('42');
  });

  it('should handle multiple reactive text nodes', () => {
    const container = (globalThis as any).div(
      () => `Color: ${mockData.color}`,
      " - ",
      () => `Count: ${mockData.count}`
    )(document.body);
    document.body.appendChild(container as Node);
    
    expect(container.textContent).toBe('Color: red - Count: 0');
    
    // Update the data and call update()
    mockData.color = 'blue';
    mockData.count = 10;
    (globalThis as any).update();
    
    expect(container.textContent).toBe('Color: blue - Count: 10');
  });

  it('should mix static and reactive text content', () => {
    const element = (globalThis as any).div(
      "Static text: ",
      () => mockData.message,
      " (end)"
    )(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Static text: Hello World (end)');
    
    // Update the data and call update()
    mockData.message = 'Dynamic Content';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('Static text: Dynamic Content (end)');
  });

  it('should handle reactive text alongside reactive attributes', () => {
    const element = (globalThis as any).div(
      { style: () => ({ color: mockData.color }) },
      () => mockData.message
    )(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Hello World');
    expect(element.style.color).toBe('red');
    
    // Update the data and call update()
    mockData.message = 'New Text';
    mockData.color = 'green';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('New Text');
    expect(element.style.color).toBe('green');
  });

  it('should handle errors in reactive text functions gracefully', () => {
    const errorFunction = () => {
      throw new Error('Test error');
    };
    
    // Should not throw when creating the element
    expect(() => {
      const element = (globalThis as any).div(errorFunction)(document.body);
      document.body.appendChild(element as Node);
    }).not.toThrow();
  });

  it('should clean up disconnected reactive text nodes', () => {
    const element = (globalThis as any).div(() => mockData.message)(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Hello World');
    
    // Remove the element from DOM
    element.remove();
    
    // Update should not affect the removed element
    mockData.message = 'Should not update';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('Hello World');
  });

  it('should render empty reactive text for functions that return null or undefined', () => {
    const testData = {
      value1: 'hello',
      value2: null as string | null,
      value3: undefined as string | undefined,
      value4: 'world'
    };

    const element = (globalThis as any).div(
      () => testData.value1,        // Reactive text: "hello"
      () => testData.value2,        // Reactive text, empty for now (null)
      () => testData.value3,        // Reactive text, empty for now (undefined)
      () => testData.value4         // Reactive text: "world"
    )(document.body);
    document.body.appendChild(element as Node);

    // Nullish resolvers render as empty text but still occupy a child slot.
    expect(element.textContent).toBe('helloworld');
    // Pure client render: 4 bare reactive text nodes, no <!-- text-N --> markers.
    expect(element.childNodes.length).toBe(4);

    // Every resolver stays reactive — including the initially-nullish ones.
    testData.value1 = 'updated';
    testData.value2 = ' & ';
    testData.value4 = 'text';
    (globalThis as any).update();

    expect(element.textContent).toBe('updated & text');
  });

  it('should handle boolean values in reactive text', () => {
    const testData = { 
      boolValue: true,
      stringValue: 'test'
    };
    
    const element = (globalThis as any).div(
      () => testData.boolValue,
      ' - ',
      () => testData.stringValue
    )(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('true - test');
    
    testData.boolValue = false;
    testData.stringValue = 'updated';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('false - updated');
  });

  it('should handle functions that switch between null and valid values', () => {
    const testData = { 
      value: 'initial' as string | null
    };
    
    const element = (globalThis as any).div(
      "Start: ",
      () => testData.value,
      " :End"
    )(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Start: initial :End');
    
    // Update to a different valid value
    testData.value = 'updated';
    (globalThis as any).update();
    
    expect(element.textContent).toBe('Start: updated :End');
    
    // Update to null — renders as empty text, not the string 'null'
    testData.value = null;
    (globalThis as any).update();

    expect(element.textContent).toBe('Start:  :End');

    // And back to a valid value — the node is still reactive
    testData.value = 'again';
    (globalThis as any).update();

    expect(element.textContent).toBe('Start: again :End');
  });

  it('should work with nested elements containing reactive text', () => {
    const element = (globalThis as any).div(
      (globalThis as any).p(() => `Message: ${mockData.message}`),
      (globalThis as any).span(() => `Count: ${mockData.count}`)
    )(document.body);
    document.body.appendChild(element as Node);
    
    expect(element.textContent).toBe('Message: Hello WorldCount: 0');
    
    mockData.message = 'Updated';
    mockData.count = 5;
    (globalThis as any).update();
    
    expect(element.textContent).toBe('Message: UpdatedCount: 5');
  });
});