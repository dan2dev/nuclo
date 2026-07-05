/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Targets uncovered line 94 in src/element/modifiers.ts: a zero-arity modifier
 * that threw on its first probe is cached as an error record, and every later
 * use of the same function short-circuits to an empty reactive text node.
 */
import { describe, it, expect } from "vitest";
import { render } from "../../src/render";
import { notifyReactiveTextNodes } from "../../src/update/reactive-text";
import "../../src";

describe("modifier probe cache — cached error path", () => {
  it("reuses the cached error record instead of re-invoking a throwing modifier", () => {
    let calls = 0;
    const bad = () => {
      calls++;
      throw new Error("probe failure");
    };

    // First use: probe throws, error is cached (catch path).
    const first = render(div(bad), document.body);
    expect(first.textContent).toBe("");
    expect(calls).toBe(1);

    // Second use: record.error is true — the function must NOT run again.
    const second = render(div(bad), document.body);
    expect(second.textContent).toBe("");
    expect(calls).toBe(1);

    // The empty fallback resolver runs on the next notify pass and keeps the
    // node blank instead of re-invoking the failed modifier.
    notifyReactiveTextNodes();
    expect(second.textContent).toBe("");
    expect(calls).toBe(1);

    first.remove();
    second.remove();
  });
});
