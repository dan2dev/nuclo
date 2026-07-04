/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { when } from "../../src/when";

import { update } from "../../src/update/update";

describe("when builder independent chains", () => {
  let container1: HTMLElement;
  let container2: HTMLElement;

  beforeEach(() => {
    container1 = document.createElement("div");
    container2 = document.createElement("div");
    document.body.appendChild(container1);
    document.body.appendChild(container2);

  });

  afterEach(() => {
    if (container1.parentNode) document.body.removeChild(container1);
    if (container2.parentNode) document.body.removeChild(container2);

  });

  it("intermediate when() result is independent of further chaining on it", () => {
    const condA = true;
    const condB = false;

    const base = when(() => condA, "branch-A");
    // Extend base in two different directions
    const withB = base.when(() => condB, "branch-B");
    const _withElse = base.else("fallback");

    // base: only condA
    base(container1, 0);
    update();
    expect(container1.textContent).toContain("branch-A");
    expect(container1.textContent).not.toContain("branch-B");
    expect(container1.textContent).not.toContain("fallback");

    // withB: condA + condB
    withB(container2, 0);
    update();
    expect(container2.textContent).toContain("branch-A");
  });

  it("else() on an intermediate result does not affect sibling chains", () => {
    const flag = false;

    const w1 = when(() => flag, "yes");
    const w1WithElse = w1.else("no");
    // w1 should still have no else branch
    const w2 = w1.when(() => true, "extra");

    w1(container1, 0);
    update();
    // condA is false, no else on w1 → nothing rendered
    expect(container1.textContent).toBe("");

    w1WithElse(container2, 0);
    update();
    // else branch active
    expect(container2.textContent).toContain("no");

    // w2 should not have the else content from w1WithElse
    const container3 = document.createElement("div");
    document.body.appendChild(container3);
    w2(container3, 0);
    update();
    expect(container3.textContent).toContain("extra");
    expect(container3.textContent).not.toContain("no");
    document.body.removeChild(container3);
  });

  it("chaining does not mutate the original builder function", () => {
    const show = true;

    const original = when(() => show, "original");
    // Chain off it — must not mutate original
    original.when(() => false, "extra").else("fallback");

    original(container1, 0);
    update();
    expect(container1.textContent).toContain("original");
    expect(container1.textContent).not.toContain("extra");
    expect(container1.textContent).not.toContain("fallback");
  });
});
