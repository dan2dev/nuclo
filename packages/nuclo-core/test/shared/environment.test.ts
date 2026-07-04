/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { isBrowser } from '../../src/shared/environment';

describe("isBrowser", () => {
  it("should be true in browser environment", () => {
    expect(isBrowser).toBe(true);
  });
});
