import { describe, it, expect, vi } from 'vitest';

describe('main index.ts exports', () => {
  it('exports exactly the public API (no internal helpers leak out)', async () => {
    const index = await import('../src');
    expect(Object.keys(index).sort()).toEqual([
      'createCss',
      'css',
      'cx',
      'getCssText',
      'globalStyle',
      'hydrate',
      'keyframes',
      'list',
      'on',
      'render',
      'resetStyles',
      'scope',
      'update',
      'variants',
      'when',
    ]);
    for (const value of Object.values(index)) expect(typeof value).toBe('function');
  });

  it('should have working list function', async () => {
    const { list } = await import('../src');
    const result = list(() => [1, 2, 3], (item: number) => item.toString());
    expect(typeof result).toBe('function');
  });

  it('should have working when function', async () => {
    const { when } = await import('../src');
    const builder = when(() => true);
    expect(typeof builder).toBe('function');
    expect(typeof builder.when).toBe('function');
    expect(typeof builder.else).toBe('function');
  });

  it('should have working update function', async () => {
    const { update } = await import('../src');
    expect(() => update()).not.toThrow();
  });

  it('should have working on function', async () => {
    const { on } = await import('../src');
    const modifier = on('click', vi.fn());
    expect(typeof modifier).toBe('function');
  });
});
