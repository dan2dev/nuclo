/// <reference path="../../types/index.d.ts" />
import { describe, it, expect, beforeEach } from "vitest";
import { update, scope } from "../../src";

describe("updateController scoped updates", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("updates reactive text nodes across multiple scopes", () => {
    const rootA = document.createElement("div");
    const rootB = document.createElement("div");
    const rootC = document.createElement("div");
    document.body.append(rootA, rootB, rootC);

    scope("a")(rootA as any, 0);
    scope("b")(rootB as any, 0);
    scope("c")(rootC as any, 0);

    let a = 0;
    let b = 0;
    let c = 0;

    const elA = (globalThis as any).div(() => `a:${a}`)(rootA as any, 0) as HTMLElement;
    const elB = (globalThis as any).div(() => `b:${b}`)(rootB as any, 0) as HTMLElement;
    const elC = (globalThis as any).div(() => `c:${c}`)(rootC as any, 0) as HTMLElement;

    rootA.appendChild(elA);
    rootB.appendChild(elB);
    rootC.appendChild(elC);

    expect(elA.textContent).toBe("a:0");
    expect(elB.textContent).toBe("b:0");
    expect(elC.textContent).toBe("c:0");

    a = 1;
    b = 1;
    c = 1;

    update("a", "b");

    expect(elA.textContent).toBe("a:1");
    expect(elB.textContent).toBe("b:1");
    // Not in the provided scopes
    expect(elC.textContent).toBe("c:0");
  });
});

