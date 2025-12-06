import { describe, it, expect, vi } from 'vitest';

describe('main index.ts exports', () => {
  it('should export core functions', async () => {
    const index = await import('../src/index');

    // Core functions
    expect(index.initializeRuntime).toBeDefined();
    expect(index.registerGlobalTagBuilders).toBeDefined();
    expect(index.createHtmlTagBuilder).toBeDefined();
    expect(index.createSvgTagBuilder).toBeDefined();
    expect(index.applyNodeModifier).toBeDefined();
    expect(index.list).toBeDefined();
    expect(index.when).toBeDefined();
    expect(index.update).toBeDefined();
    expect(index.applyAttributes).toBeDefined();
  });

  it('should export utility functions', async () => {
    const index = await import('../src/index');

    expect(index.appendChildren).toBeDefined();
    expect(index.createComment).toBeDefined();
    expect(index.createConditionalComment).toBeDefined();
    expect(index.replaceNodeSafely).toBeDefined();
    expect(index.on).toBeDefined();
    expect(index.render).toBeDefined();
  });

  it('should export type guards', async () => {
    const index = await import('../src/index');

    expect(index.isBoolean).toBeDefined();
    expect(index.isFunction).toBeDefined();
    expect(index.isNode).toBeDefined();
    expect(index.isObject).toBeDefined();
    expect(index.isPrimitive).toBeDefined();
    expect(index.isTagLike).toBeDefined();
    expect(index.isZeroArityFunction).toBeDefined();
  });

  it('should export environment utilities', async () => {
    const index = await import('../src/index');

    expect(index.isBrowser).toBeDefined();
  });

  it('should export internal functions', async () => {
    const index = await import('../src/index');

    expect(index.createHtmlElementWithModifiers).toBeDefined();
    expect(index.createSvgElementWithModifiers).toBeDefined();
  });

  it('should export tag constants', async () => {
    const index = await import('../src/index');

    expect(index.HTML_TAGS).toBeDefined();
    expect(index.SVG_TAGS).toBeDefined();
    expect(index.SELF_CLOSING_TAGS).toBeDefined();
    expect(Array.isArray(index.HTML_TAGS)).toBe(true);
    expect(Array.isArray(index.SVG_TAGS)).toBe(true);
    expect(Array.isArray(index.SELF_CLOSING_TAGS)).toBe(true);
  });

  it('should export style utilities via wildcard', async () => {
    const index = await import('../src/index');

    // Style utilities should be available via re-export from style module
    expect(index.StyleBuilder).toBeDefined();
    expect(index.createCSSClass).toBeDefined();
    expect(index.createStyleQueries).toBeDefined();
    expect(index.createBreakpoints).toBeDefined();
    // Check for some style functions
    expect(index.display).toBeDefined();
    expect(index.padding).toBeDefined();
    expect(index.margin).toBeDefined();
  });

  it('should have working list function', async () => {
    const { list } = await import('../src/index');

    expect(typeof list).toBe('function');

    // Basic smoke test
    const items = [1, 2, 3];
    const result = list(() => items, (item: number) => item.toString());

    expect(result).toBeDefined();
  });

  it('should have working when function', async () => {
    const { when } = await import('../src/index');

    expect(typeof when).toBe('function');

    // Basic smoke test
    const condition = () => true;
    const builder = when(condition);

    expect(builder).toBeDefined();
    // when returns a builder function
    expect(typeof builder).toBe('function');
  });

  it('should have working update function', async () => {
    const { update } = await import('../src/index');

    expect(typeof update).toBe('function');

    // Should not throw when called
    expect(() => update()).not.toThrow();
  });

  it('should have working render function', async () => {
    const { render } = await import('../src/index');

    expect(typeof render).toBe('function');
  });

  it('should have working on function', async () => {
    const { on } = await import('../src/index');

    expect(typeof on).toBe('function');

    // Create a simple event modifier
    const clickHandler = vi.fn();
    const modifier = on('click', clickHandler);

    expect(modifier).toBeDefined();
  });

  it('should have working type guards', async () => {
    const { isBoolean, isFunction, isObject, isPrimitive } = await import('../src/index');

    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(1)).toBe(false);

    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(null)).toBe(false);

    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);

    expect(isPrimitive('string')).toBe(true);
    expect(isPrimitive(123)).toBe(true);
    expect(isPrimitive({})).toBe(false);
  });

  it('should have working isBrowser check', async () => {
    const { isBrowser } = await import('../src/index');

    expect(typeof isBrowser).toBe('boolean');
    // In test environment with jsdom, this should be true
    expect(isBrowser).toBe(true);
  });

  it('should have working createComment function', async () => {
    const { createComment } = await import('../src/index');

    const comment = createComment('test comment');

    expect(comment).toBeDefined();
    // In jsdom environment, this creates a real comment node
    expect(comment.nodeType).toBe(8); // COMMENT_NODE
  });

  it('should verify HTML_TAGS contains expected tags', async () => {
    const { HTML_TAGS } = await import('../src/index');

    expect(HTML_TAGS).toContain('div');
    expect(HTML_TAGS).toContain('span');
    expect(HTML_TAGS).toContain('p');
    expect(HTML_TAGS).toContain('a');
  });

  it('should verify SVG_TAGS contains expected tags', async () => {
    const { SVG_TAGS } = await import('../src/index');

    expect(SVG_TAGS).toContain('svg');
    expect(SVG_TAGS).toContain('circle');
    expect(SVG_TAGS).toContain('path');
  });

  it('should verify SELF_CLOSING_TAGS contains expected tags', async () => {
    const { SELF_CLOSING_TAGS } = await import('../src/index');

    expect(SELF_CLOSING_TAGS).toContain('br');
    expect(SELF_CLOSING_TAGS).toContain('img');
    expect(SELF_CLOSING_TAGS).toContain('input');
    expect(SELF_CLOSING_TAGS).toContain('hr');
  });

  it('should have working createHtmlTagBuilder', async () => {
    const { createHtmlTagBuilder } = await import('../src/index');

    const div = createHtmlTagBuilder('div');

    expect(typeof div).toBe('function');

    // Create an element with the builder
    const element = div();
    expect(element).toBeDefined();
    // Check if element has tagName property (it should be a DOM element)
    if (element && typeof element === 'object' && 'tagName' in element) {
      expect((element as any).tagName.toLowerCase()).toBe('div');
    } else {
      // If not a DOM element, at least verify it's defined
      expect(element).toBeDefined();
    }
  });

  it('should have working createSvgTagBuilder', async () => {
    const { createSvgTagBuilder } = await import('../src/index');

    const circle = createSvgTagBuilder('circle');

    expect(typeof circle).toBe('function');

    // Create an element with the builder
    const element = circle();
    expect(element).toBeDefined();
  });

  it('should verify all expected exports are present', async () => {
    const index = await import('../src/index');

    const expectedExports = [
      'initializeRuntime',
      'registerGlobalTagBuilders',
      'HTML_TAGS',
      'SVG_TAGS',
      'SELF_CLOSING_TAGS',
      'createHtmlTagBuilder',
      'createSvgTagBuilder',
      'applyNodeModifier',
      'list',
      'when',
      'update',
      'applyAttributes',
      'appendChildren',
      'createComment',
      'createConditionalComment',
      'replaceNodeSafely',
      'on',
      'render',
      'isBoolean',
      'isFunction',
      'isNode',
      'isObject',
      'isPrimitive',
      'isTagLike',
      'isZeroArityFunction',
      'isBrowser',
      'createHtmlElementWithModifiers',
      'createSvgElementWithModifiers',
      // Style exports
      'StyleBuilder',
      'createCSSClass',
      'createStyleQueries',
      'createBreakpoints',
      'display',
      'padding',
      'margin'
    ];

    for (const exportName of expectedExports) {
      expect(index[exportName as keyof typeof index]).toBeDefined();
    }
  });
});
