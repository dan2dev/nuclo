/**
 * @vitest-environment jsdom
 */

/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from 'vitest';
import { arraysEqual } from '../../src/utility/arrayUtils';

describe('arrayUtils', () => {
  describe('arraysEqual', () => {
    it('returns true for the same array reference', () => {
      const arr = [1, 2, 3];
      expect(arraysEqual(arr, arr)).toBe(true);
    });

    it('returns true for identical arrays', () => {
      expect(arraysEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('returns false for different lengths', () => {
      expect(arraysEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it('compares by reference for objects', () => {
      const obj = { id: 1 };
      expect(arraysEqual([obj], [obj])).toBe(true);
      expect(arraysEqual([obj], [{ id: 1 }])).toBe(false);
    });

    it('handles null and undefined values distinctly', () => {
      expect(arraysEqual([null], [null])).toBe(true);
      expect(arraysEqual([undefined], [undefined])).toBe(true);
      expect(arraysEqual([null], [undefined])).toBe(false);
    });

    it('handles sparse arrays consistently', () => {
      const sparse: Array<number | undefined> = [1, undefined, 3];
      expect(arraysEqual(sparse, [1, undefined, 3])).toBe(true);
      expect(arraysEqual(sparse, [1, 2, 3])).toBe(false);
      expect(arraysEqual(sparse, [1, 2, 4])).toBe(false);
    });

    it('treats array holes as undefined', () => {
      const withHole = new Array<number | undefined>(3);
      withHole[0] = 1;
      withHole[2] = 3;
      expect(arraysEqual(withHole, [1, undefined, 3])).toBe(true);
      expect(arraysEqual([1, undefined, 3], withHole)).toBe(true);
    });

    it('short-circuits when arrays differ early', () => {
      expect(arraysEqual([1, 2, 3, 4], [1, 9, 3, 4])).toBe(false);
    });
  });
});
