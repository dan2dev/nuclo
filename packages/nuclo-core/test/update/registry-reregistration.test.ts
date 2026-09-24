/// <reference path="../../types/index.d.ts" />
import { expect, it } from "vitest";
import { registerReactiveElement, reactiveElements, cleanupReactiveElement } from "../../src/update/registry";

it("keeps a single reactive registration when an element is registered twice", () => {
  const element = document.createElement("div");
  const before = reactiveElements.size;
  const first = registerReactiveElement(element);
  expect(registerReactiveElement(element)).toBe(first);
  expect(reactiveElements.size).toBe(before + 1);
  cleanupReactiveElement(element);
  expect(reactiveElements.size).toBe(before);
});
