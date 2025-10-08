// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { isBrowser } from '../../src/utility/environment.js';

describe("isBrowser", () => {
  it("should be true in browser environment", () => {
    expect(isBrowser).toBe(true);
  });
});
