/// <reference path="../../types/index.d.ts" />
import { describe, it, expect } from "vitest";
import {
  storeConditionalInfo,
  getConditionalInfo,
  hasConditionalInfo,
  type ConditionalInfo,
} from "../../src/utility/conditionalInfo";

describe("conditionalInfo", () => {
  it("reports presence/absence of stored info", () => {
    const node = document.createElement("div");

    expect(hasConditionalInfo(node)).toBe(false);
    expect(getConditionalInfo(node)).toBeNull();

    const info: ConditionalInfo<"div"> = {
      condition: () => true,
      tagName: "div",
      modifiers: [],
      isSvg: false,
    };

    storeConditionalInfo(node, info);
    expect(hasConditionalInfo(node)).toBe(true);
    expect(getConditionalInfo(node)).toEqual(info);

    delete (node as any)._conditionalInfo;
    expect(hasConditionalInfo(node)).toBe(false);
    expect(getConditionalInfo(node)).toBeNull();
  });
});

