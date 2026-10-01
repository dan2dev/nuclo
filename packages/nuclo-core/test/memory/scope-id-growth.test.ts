/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { scopeRootsById } from "../../src/update/scope";
import "../../src";

/**
 * scope(`row-${id}`) gives every list row its own update scope. Rows come and
 * go; their ids are unique and most are never passed to update() again. The
 * scope registry must not keep an entry per row the app ever rendered.
 */
const hasGc = typeof globalThis.gc === "function";
const itGc = hasGc ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 6; i++) {
    globalThis.gc!();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

describe("scope() — per-row ids do not accumulate", () => {
  itGc("ids of removed rows are released once the rows are collected", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let nextId = 0;
    let rows: Array<{ id: number }> = [];
    render(div(list(() => rows, (row) => p(scope(`row-${row.id}`), () => `row ${row.id}`))), container);
    const baseline = scopeRootsById.size;

    // 20 generations of 200 rows: 4,000 unique scope ids over the app's life.
    for (let generation = 0; generation < 20; generation++) {
      rows = Array.from({ length: 200 }, () => ({ id: nextId++ }));
      update();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(container.getElementsByTagName("p").length).toBe(200);

    await collectGarbage();

    // Only the rows on screen (plus slack for refs awaiting finalization).
    expect(scopeRootsById.size - baseline).toBeLessThan(400);

    rows = [];
    update();
    await collectGarbage();
    expect(scopeRootsById.size - baseline).toBe(0);
    container.remove();
  }, 30_000);

  itGc("a targeted update still reaches a live row, and shared ids keep working", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const rows = Array.from({ length: 50 }, (_, id) => ({ id, label: `v0` }));
    render(div(list(() => rows, (row) => p(scope(`live-${row.id}`, "all-rows"), () => row.label))), container);
    await collectGarbage();

    for (const row of rows) row.label = "v1";
    update("live-7");
    const texts = (): string[] => Array.from(container.getElementsByTagName("p")).map((el) => el.textContent ?? "");
    expect(texts().filter((t) => t === "v1").length).toBe(1);
    expect(texts()[7]).toBe("v1");

    update("all-rows");
    expect(texts().every((t) => t === "v1")).toBe(true);
    container.remove();
  });
});
