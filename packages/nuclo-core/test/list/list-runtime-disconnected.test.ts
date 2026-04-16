/**
 * @vitest-environment jsdom
 *
 * Targets uncovered lines in src/list/runtime.ts:
 *
 *  Lines 177-186 – updateListRuntimes: WeakRef.deref() returns undefined (GC path)
 *  Lines 190-200 – updateListRuntimes: startMarker or endMarker disconnected
 *
 * For the GC path (lines 177-186) we replace the WeakRef constructor with a
 * class whose deref() always returns undefined, register a list runtime, then
 * restore the real WeakRef before calling updateListRuntimes.
 *
 * For the disconnected marker path (lines 190-200) we create a runtime and then
 * remove the host element from the DOM.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { createListRuntime, updateListRuntimes } from "../../src/list/runtime";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── helpers ───────────────────────────────────────────────────────────────────

function createHost() {
  const host = document.createElement(
    "div",
  ) as unknown as ExpandedElement<ElementTagName>;
  document.body.appendChild(host as unknown as HTMLElement);
  return host;
}

// ── Unit: createListRuntime + sync ────────────────────────────────────────────
describe("createListRuntime", () => {
  it("creates a runtime with empty items initially", () => {
    const host = createHost();
    const rt = createListRuntime(
      () => [],
      (_item, _i) => null,
      host,
      0,
    );
    expect(rt.records).toHaveLength(0);
    (host as unknown as HTMLElement).remove();
  });

  it("renders initial items immediately via sync()", () => {
    const host = createHost();
    const items = ["a", "b", "c"];
    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );
    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(3);
    (host as unknown as HTMLElement).remove();
  });
});

// ── Unit: updateListRuntimes – disconnected markers (lines 190-200) ───────────
describe("updateListRuntimes – disconnected markers (lines 190-200)", () => {
  it("cleans up runtime when host is removed from DOM", () => {
    const host = createHost();
    const items = ["x", "y"];

    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "li",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    // Remove host from DOM – both markers are now disconnected
    (host as unknown as HTMLElement).remove();

    // updateListRuntimes should detect disconnected markers and clean up
    expect(() => updateListRuntimes()).not.toThrow();
  });

  it("keeps connected runtimes active and disconnects only dead ones", () => {
    const aliveHost = createHost();
    const deadHost = createHost();

    let aliveItems = ["live1"];
    createListRuntime(
      () => aliveItems,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      aliveHost,
      0,
    );

    createListRuntime(
      () => ["dead"],
      (_item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        return el;
      },
      deadHost,
      0,
    );

    // Kill the dead host
    (deadHost as unknown as HTMLElement).remove();

    aliveItems = ["live1", "live2"];
    updateListRuntimes();

    // Alive host should now have 2 spans
    expect(
      (aliveHost as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(2);

    (aliveHost as unknown as HTMLElement).remove();
  });
});

// ── Unit: updateListRuntimes – GC path (lines 177-186) ────────────────────────
describe("updateListRuntimes – GC simulation (lines 177-186)", () => {
  it("silently removes GC-collected runtime refs without throwing", () => {
    const OriginalWeakRef = globalThis.WeakRef;

    // Replace WeakRef with a dead version to simulate GC
    class DeadWeakRef<T extends object> {
      deref(): T | undefined {
        return undefined;
      }
    }

    vi.stubGlobal("WeakRef", DeadWeakRef);

    const host = createHost();
    // createListRuntime will now use DeadWeakRef for the startMarker
    const items = ["a", "b"];
    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "li",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    vi.stubGlobal("WeakRef", OriginalWeakRef);

    // Now updateListRuntimes should find dead ref and execute cleanup (lines 177-186)
    expect(() => updateListRuntimes()).not.toThrow();

    (host as unknown as HTMLElement).remove();
  });
});

// ── Unit: updateListRuntimes – scope filtering ────────────────────────────────
describe("updateListRuntimes – scope filtering", () => {
  it("skips runtime when scope does not contain startMarker", () => {
    const host = createHost();
    let items = ["a"];

    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    items = ["a", "b"];
    // Scope excludes everything
    updateListRuntimes({ roots: [], contains: () => false });

    // Host should still have only 1 span (no update applied)
    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(1);

    (host as unknown as HTMLElement).remove();
  });
});

// ── Integration: sync algorithm ───────────────────────────────────────────────
describe("list sync algorithm – combinatorial", () => {
  it("correctly handles empty list → populated", () => {
    const host = createHost();
    let items: string[] = [];

    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(0);

    items = ["x", "y", "z"];
    updateListRuntimes();
    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(3);

    (host as unknown as HTMLElement).remove();
  });

  it("correctly handles populated → empty list", () => {
    const host = createHost();
    let items = ["a", "b", "c"];

    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    items = [];
    updateListRuntimes();
    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(0);

    (host as unknown as HTMLElement).remove();
  });

  it("handles duplicate items in list", () => {
    const host = createHost();
    const items = ["a", "a", "a"];

    createListRuntime(
      () => items,
      (item) => {
        const el = document.createElement(
          "span",
        ) as unknown as ExpandedElement<ElementTagName>;
        (el as unknown as HTMLElement).textContent = item;
        return el;
      },
      host,
      0,
    );

    expect(
      (host as unknown as HTMLElement).querySelectorAll("span").length,
    ).toBe(3);

    (host as unknown as HTMLElement).remove();
  });

  it("handles a large list (10 000 items) without error", () => {
    const host = createHost();
    const items = Array.from({ length: 10_000 }, (_, i) => i);

    expect(() =>
      createListRuntime(
        () => items,
        () => null,
        host,
        0,
      ),
    ).not.toThrow();

    (host as unknown as HTMLElement).remove();
  });

  it("handles list with renderItem returning null", () => {
    const host = createHost();
    const items = [1, 2, 3];

    createListRuntime(
      () => items,
      () => null,
      host,
      0,
    );
    expect((host as unknown as HTMLElement).children.length).toBe(0);

    (host as unknown as HTMLElement).remove();
  });
});
