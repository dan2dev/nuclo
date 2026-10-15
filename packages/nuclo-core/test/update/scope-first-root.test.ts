/// <reference path="../../types/index.d.ts" />
/** @vitest-environment jsdom */
/**
 * Own file: these depend on no scope() having run yet in the module. Until
 * the first root exists the index drops what update() drains; a root applied
 * afterwards to an element already in the document must still adopt the
 * members below it.
 */
import { it, expect } from "vitest";
import "../../src";

it("members drained before any scope existed are adopted by a root applied later", () => {
  let n = 0;
  const host = render(div(span({ id: "pre" }, () => `${n}`), when(() => n > 0, b({ id: "w" })))) as unknown as HTMLElement;
  update(); // nothing is indexed: no root anywhere yet
  scope("first")(host as never, 0);
  n = 1;
  update("first");
  expect(document.querySelector("#pre")!.textContent).toBe("1");
  expect(document.querySelector("#w")).not.toBeNull();
});

it("a tree built after the first root exists is indexed as usual", () => {
  let n = 0;
  render(div(scope("second"), span({ id: "s" }, () => `${n}`)));
  n = 1;
  update("second");
  expect(document.querySelector("#s")!.textContent).toBe("1");
});
