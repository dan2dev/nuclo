/// <reference path="../../types/index.d.ts" />
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { updateConditionalElements } from "../../src/update/conditional";

describe("conditionalUpdater (node/SSR)", () => {
  it("no-ops when not in browser", () => {
    expect(() => updateConditionalElements()).not.toThrow();
  });
});

