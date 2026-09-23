// @vitest-environment node
/// <reference path="../../types/index.d.ts" />
/**
 * Server side, on() returns one shared inert modifier. It must never carry the
 * event-modifier marker: marking the shared function would flag every
 * listener in the process at once, and there is nothing to replay on the
 * server anyway (list() templates are browser-only).
 */
import { describe, expect, it } from "vitest";
import { on } from "../../src/element/events";
import { isEventModifier } from "../../src/element/factory-meta";

describe("on() event-modifier marker in SSR", () => {
  it("leaves the shared inert native-event modifier unmarked", () => {
    const click = on("click", () => undefined);
    const custom = on("app:ready", () => undefined, { capture: true });
    expect(click).toBe(custom);
    expect(isEventModifier(click)).toBe(false);
  });

  it("leaves lifecycle modifiers unmarked", () => {
    expect(isEventModifier(on("mount", () => undefined))).toBe(false);
    expect(isEventModifier(on("destroy", () => undefined))).toBe(false);
  });
});
