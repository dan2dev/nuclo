/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeRemoveChild } from '../../src/utility/dom';
import { createReactiveTextNode, notifyReactiveTextNodes } from '../../src/core/reactiveText';
import { reactiveTextNodesByNode } from '../../src/core/reactiveCleanup';

describe('dom.ts - cleanupEventListeners for text nodes (lines 73-74)', () => {
  let container: HTMLDivElement;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('cleans up a reactive text node when safeRemoveChild is called', () => {
    let value = 'initial';
    const resolver = () => value;

    // Create a reactive text node
    const textNode = createReactiveTextNode(resolver) as Text;
    container.appendChild(textNode);

    expect(textNode.textContent).toBe('initial');

    // Verify the text node is registered as reactive
    expect(reactiveTextNodesByNode.has(textNode)).toBe(true);

    // Remove the text node via safeRemoveChild which calls cleanupEventListeners
    // This should trigger the TEXT_NODE branch (lines 73-74) calling cleanupReactiveTextNode
    const removed = safeRemoveChild(textNode);
    expect(removed).toBe(true);

    // After cleanup, the reactive text node should be unregistered
    expect(reactiveTextNodesByNode.has(textNode)).toBe(false);
  });

  it('reactive text node no longer updates after being cleaned up via safeRemoveChild', () => {
    let value = 'hello';
    const resolver = () => value;

    const textNode = createReactiveTextNode(resolver) as Text;
    container.appendChild(textNode);

    expect(textNode.textContent).toBe('hello');

    // Update the value and notify
    value = 'world';
    notifyReactiveTextNodes();
    expect(textNode.textContent).toBe('world');

    // Remove the text node (triggers cleanupEventListeners -> cleanupReactiveTextNode)
    safeRemoveChild(textNode);

    // Re-add the text node to DOM (to make it connected again)
    container.appendChild(textNode);

    // Change value and notify - the text node should NOT update since it was cleaned up
    value = 'should not appear';
    notifyReactiveTextNodes();

    // The text content stays at the old value because the reactive binding was cleaned up
    expect(textNode.textContent).toBe('world');
  });

  it('handles non-reactive text nodes gracefully in cleanupEventListeners', () => {
    // A plain text node (not created via createReactiveTextNode) should not throw
    const plainText = document.createTextNode('plain text');
    container.appendChild(plainText);

    // safeRemoveChild calls cleanupEventListeners which hits the TEXT_NODE branch
    // cleanupReactiveTextNode should handle nodes not in the registry gracefully
    const removed = safeRemoveChild(plainText);
    expect(removed).toBe(true);
  });

  it('cleans up reactive text nodes nested inside an element', () => {
    let value = 'nested';
    const resolver = () => value;

    const textNode = createReactiveTextNode(resolver) as Text;
    const wrapper = document.createElement('div');
    wrapper.appendChild(textNode);
    container.appendChild(wrapper);

    expect(textNode.textContent).toBe('nested');
    expect(reactiveTextNodesByNode.has(textNode)).toBe(true);

    // Remove the wrapper element - cleanupEventListeners recurses into children
    // and should clean up the nested reactive text node
    safeRemoveChild(wrapper);

    expect(reactiveTextNodesByNode.has(textNode)).toBe(false);
  });

  it('cleans up multiple reactive text nodes in a subtree', () => {
    let value1 = 'first';
    let value2 = 'second';
    const resolver1 = () => value1;
    const resolver2 = () => value2;

    const textNode1 = createReactiveTextNode(resolver1) as Text;
    const textNode2 = createReactiveTextNode(resolver2) as Text;

    const inner = document.createElement('span');
    inner.appendChild(textNode2);

    const wrapper = document.createElement('div');
    wrapper.appendChild(textNode1);
    wrapper.appendChild(inner);
    container.appendChild(wrapper);

    expect(reactiveTextNodesByNode.has(textNode1)).toBe(true);
    expect(reactiveTextNodesByNode.has(textNode2)).toBe(true);

    // Remove the wrapper - should clean up both reactive text nodes recursively
    safeRemoveChild(wrapper);

    expect(reactiveTextNodesByNode.has(textNode1)).toBe(false);
    expect(reactiveTextNodesByNode.has(textNode2)).toBe(false);
  });
});
