/// <reference path="../../types/index.d.ts" />
import { expect, it } from "vitest";
import { registerReactiveElement, reactiveElements, cleanupReactiveElement, storeConditionalInfo, getActiveConditionalNodes, unregisterConditionalNode } from "../../src/update/registry";

it("keeps a single reactive registration when an element is registered twice", () => {
  const element = document.createElement("div");
  const before = reactiveElements.size;
  registerReactiveElement(element, { attributeResolvers: [] });
  registerReactiveElement(element, { attributeResolvers: [] });
  expect(reactiveElements.size).toBe(before + 1);
  cleanupReactiveElement(element);
  expect(reactiveElements.size).toBe(before);
});

it("keeps a single conditional registration and fully unregisters it", () => {
  const element = document.createElement("div");
  for (let i = 0; i < 3; i++) {
    storeConditionalInfo(element, { condition: () => true, tagName: "div", modifiers: [], isSvg: false });
  }
  expect(getActiveConditionalNodes().filter(node => node === element)).toHaveLength(1);
  unregisterConditionalNode(element);
  expect(getActiveConditionalNodes()).not.toContain(element);
});
