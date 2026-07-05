/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered lines 33-35 in src/update/conditional.ts: the HTML
 * fallback path when modifiers throw AND createElement returns null — the
 * conditional swap throws, and updateConditionalElements' outer catch logs it.
 */
import { describe, it, expect, vi } from "vitest";
import { storeConditionalInfo } from "../../src/update/registry";
import { updateConditionalElements } from "../../src/update/conditional";

vi.mock("../../src/element/factory", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/element/factory")>();
  return {
    ...original,
    createHtmlElementWithModifiers: () => {
      throw new Error("forced HTML modifier error");
    },
  };
});

vi.mock("../../src/shared/dom", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/shared/dom")>();
  return {
    ...original,
    createElement: () => null,
  };
});

describe("conditional HTML fallback with unavailable document", () => {
  it("logs the failure without crashing the update pass", () => {
    const comment = document.createComment("conditional-div-hidden");
    document.body.appendChild(comment);

    storeConditionalInfo(comment, {
      condition: () => true,
      tagName: "div" as ElementTagName,
      modifiers: [],
      isSvg: false,
    });

    // The inner throw ("Failed to create element: div") is caught by
    // updateConditionalElements and logged.
    expect(() => updateConditionalElements()).not.toThrow();
    // The comment could not be replaced.
    expect(comment.isConnected).toBe(true);

    comment.remove();
  });
});
