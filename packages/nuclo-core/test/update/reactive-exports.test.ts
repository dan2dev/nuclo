import { describe, it, expect } from 'vitest';

describe('reactive module exports', () => {
  it('should export createReactiveTextNode from reactiveText', async () => {
    const { createReactiveTextNode } = await import('../../src/update/reactive-text');

    expect(createReactiveTextNode).toBeDefined();
    expect(typeof createReactiveTextNode).toBe('function');
  });

  it('should export notifyReactiveTextNodes from reactiveText', async () => {
    const { notifyReactiveTextNodes } = await import('../../src/update/reactive-text');

    expect(notifyReactiveTextNodes).toBeDefined();
    expect(typeof notifyReactiveTextNodes).toBe('function');
  });

  it('should export registerAttributeResolver from reactiveAttributes', async () => {
    const { registerAttributeResolver } = await import('../../src/update/reactive-attributes');

    expect(registerAttributeResolver).toBeDefined();
    expect(typeof registerAttributeResolver).toBe('function');
  });

  it('should export notifyReactiveElements from reactiveAttributes', async () => {
    const { notifyReactiveElements } = await import('../../src/update/reactive-attributes');

    expect(notifyReactiveElements).toBeDefined();
    expect(typeof notifyReactiveElements).toBe('function');
  });

  it('should have working createReactiveTextNode', async () => {
    const { createReactiveTextNode } = await import('../../src/update/reactive-text');

    const resolver = () => 'test text';
    const node = createReactiveTextNode(resolver);

    expect(node).toBeDefined();
    expect(node.textContent).toBe('test text');
  });

  it('should have working registerAttributeResolver', async () => {
    const { registerAttributeResolver } = await import('../../src/update/reactive-attributes');

    const element = document.createElement('div');
    const resolver = () => 'value';
    const attributeName = 'data-test';

    expect(() => {
      registerAttributeResolver(element, attributeName, resolver);
    }).not.toThrow();
  });
});
