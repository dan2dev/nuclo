/// <reference path="../../types/index.d.ts" />
/// <reference types="node" />
// @vitest-environment jsdom
import { expect, it } from "vitest";
import { applyAttributes } from "../../src/element/attributes";
import { on } from "../../src/element/events";
import { safeRemoveChild } from "../../src/shared/dom";

function removeWithCapturedPayload(kind: "native" | "fallback" | "on") {
  const element = document.createElement("button");
  document.body.append(element);
  const payload = { calls: 0 };
  const listener = () => { payload.calls++; };
  if (kind === "on") on("click", listener)(element, 0);
  else applyAttributes(element, kind === "native" ? { onClick: listener } : { onCompositionEnd: listener });
  safeRemoveChild(element);
  return { element, payload: new WeakRef(payload) };
}

const itGc = typeof globalThis.gc === "function" ? it : it.skip;

itGc.each(["native", "fallback", "on"] as const)("releases %s handler closures even while the removed element is retained", async kind => {
  const retained = removeWithCapturedPayload(kind);
  for (let pass = 0; pass < 5; pass++) {
    globalThis.gc!();
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  expect(retained.element.isConnected).toBe(false);
  expect(retained.payload.deref()).toBeUndefined();
});
