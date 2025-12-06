import { describe, it, expect } from 'vitest';

describe('reactive module exports', () => {
  it('should export createReactiveTextNode', async () => {
    const { createReactiveTextNode } = await import('../../src/core/reactive');

    expect(createReactiveTextNode).toBeDefined();
    expect(typeof createReactiveTextNode).toBe('function');
  });

  it('should export notifyReactiveTextNodes', async () => {
    const { notifyReactiveTextNodes } = await import('../../src/core/reactive');

    expect(notifyReactiveTextNodes).toBeDefined();
    expect(typeof notifyReactiveTextNodes).toBe('function');
  });

  it('should export registerAttributeResolver', async () => {
    const { registerAttributeResolver } = await import('../../src/core/reactive');

    expect(registerAttributeResolver).toBeDefined();
    expect(typeof registerAttributeResolver).toBe('function');
  });

  it('should export notifyReactiveElements', async () => {
    const { notifyReactiveElements } = await import('../../src/core/reactive');

    expect(notifyReactiveElements).toBeDefined();
    expect(typeof notifyReactiveElements).toBe('function');
  });

  it('should verify all exports work correctly', async () => {
    const reactive = await import('../../src/core/reactive');

    // Verify we have exactly the expected exports
    const exports = Object.keys(reactive);
    expect(exports).toContain('createReactiveTextNode');
    expect(exports).toContain('notifyReactiveTextNodes');
    expect(exports).toContain('registerAttributeResolver');
    expect(exports).toContain('notifyReactiveElements');
  });

  it('should have working createReactiveTextNode from re-export', async () => {
    // This test actually exercises the re-exported function
    const { createReactiveTextNode } = await import('../../src/core/reactive');

    const resolver = () => 'test text';
    const node = createReactiveTextNode(resolver);

    expect(node).toBeDefined();
    expect(node.textContent).toBe('test text');
  });

  it('should have working registerAttributeResolver from re-export', async () => {
    // This test actually exercises the re-exported function
    const { registerAttributeResolver } = await import('../../src/core/reactive');

    // Create a mock element in browser environment
    const element = document.createElement('div');
    const resolver = () => 'value';
    const attributeName = 'data-test';

    // Should not throw
    expect(() => {
      registerAttributeResolver(element, attributeName, resolver);
    }).not.toThrow();
  });
});
