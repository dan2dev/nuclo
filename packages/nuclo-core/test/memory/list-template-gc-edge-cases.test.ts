/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
/**
 * Real-GC collectability edge cases for the list() template changes:
 * pinned-only placement, flat record-owned leaves, the shared leafScratch
 * buffer, template deactivation, failed clones, on() rows and the retained
 * skeleton. Each case removes rows (or the whole list), drops every strong
 * reference, forces GC and asserts the rows and their items are gone.
 *
 * Same rules as gc-collectability.test.ts: nodes under test are captured from
 * childNodes/children/records — never via querySelector(), whose per-document
 * cache would itself keep them alive — and update() is only called where the
 * scenario needs it.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "../../src/render";
import { update } from "../../src/update/update";
import { list } from "../../src/list";
import { createListRuntime } from "../../src/list/runtime";
import { on } from "../../src/element/events";
import "../../src";

declare const div: ExpandedElementBuilder<"div">;
declare const span: ExpandedElementBuilder<"span">;
declare const p: ExpandedElementBuilder<"p">;

const gc = (globalThis as { gc?: () => void }).gc;
const itGc = typeof gc === "function" ? it : it.skip;

async function collectGarbage(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    gc!();
    // Yield a macrotask so FinalizationRegistry callbacks can run too.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

interface Row {
  id: number;
  label: string;
}

const makeRows = (n: number, from = 0): Row[] => Array.from({ length: n }, (_, i) => ({ id: from + i, label: `L${from + i}` }));

function allCollected(refs: Array<WeakRef<object>>): boolean {
  return refs.every((ref) => ref.deref() === undefined);
}

describe("real GC — list template edge cases", () => {
  itGc("releases rows moved by a pinned-only swap once they are removed", async () => {
    const state = (() => {
      let rows = makeRows(100);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = render(div(list(() => rows, (row: Row) => span(on("click", () => { void row.label; }), () => row.label))), host) as HTMLElement;

      const swapped = rows.slice();
      [swapped[10], swapped[90]] = [swapped[90]!, swapped[10]!];
      rows = swapped;
      update();

      const refs: Array<WeakRef<object>> = [
        new WeakRef(root.children[10]!), new WeakRef(root.children[90]!),
        new WeakRef(rows[10]!), new WeakRef(rows[90]!),
      ];
      rows = rows.filter((_, i) => i !== 10 && i !== 90);
      update();
      return { refs, host, root };
    })();

    await collectGarbage();
    expect(allCollected(state.refs)).toBe(true);
    expect(state.root.children.length).toBe(98);
    state.host.remove();
  });

  itGc("releases rows cloned before the template was deactivated", async () => {
    const state = (() => {
      let rows = makeRows(4);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = render(
        div(list(() => rows, (row: Row) => (row.id >= 100 ? p(() => row.label) : span({ className: () => `c${row.id}` }, () => row.label)))),
        host,
      ) as HTMLElement;
      rows = [...rows, ...makeRows(2, 100)]; // heterogeneous rows deactivate the template
      update();

      const refs: Array<WeakRef<object>> = [];
      for (let i = 0; i < rows.length; i++) refs.push(new WeakRef(root.children[i]!), new WeakRef(rows[i]!));
      rows = [];
      update();
      return { refs, host };
    })();

    await collectGarbage();
    expect(allCollected(state.refs)).toBe(true);
    state.host.remove();
  });

  itGc("does not retain an item whose clone failed mid-row (abandoned clone + scratch)", async () => {
    const state = (() => {
      let rows = makeRows(4);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = render(
        div(list(() => rows, (row: Row) =>
          div({ className: () => `r${row.id}` }, span(() => { if (row.id === 2) throw new Error("bad row"); return row.label; })))),
        host,
      ) as HTMLElement;

      const refs: Array<WeakRef<object>> = [new WeakRef(rows[2]!), new WeakRef(root.children[2]!)];
      rows = rows.filter((row) => row.id !== 2);
      update();
      return { refs, host };
    })();

    // The normal-path rebuild logs the resolver's Error; the suite-wide
    // console.error spy keeps it in mock.calls, and an unformatted V8 Error
    // holds its stack frames' closures (which capture the row). That is the
    // test harness retaining it, not nuclo — drop the recorded calls first.
    vi.mocked(console.error).mockClear();
    await collectGarbage();
    expect(allCollected(state.refs)).toBe(true);
    state.host.remove();
  });

  itGc("releases outer and nested rows rendered re-entrantly through the scratch buffer", async () => {
    const state = (() => {
      const innerHosts: HTMLElement[] = [];
      const inner = [{ label: "i0" }, { label: "i1" }];
      let rows = makeRows(3);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const rendered = new Set<number>();
      const root = render(
        div(list(() => rows, (row: Row) =>
          div({ className: () => `o${row.id}` }, span(() => {
            if (!rendered.has(row.id)) {
              rendered.add(row.id);
              const innerHost = document.createElement("div");
              document.body.appendChild(innerHost);
              innerHosts.push(innerHost);
              createListRuntime(() => inner, (item) => span(() => item.label), innerHost as never, 0);
            }
            return row.label;
          })))),
        host,
      ) as HTMLElement;

      const refs: Array<WeakRef<object>> = [...inner.map((i) => new WeakRef(i))];
      for (let i = 0; i < rows.length; i++) refs.push(new WeakRef(root.children[i]!), new WeakRef(rows[i]!));
      for (const innerHost of innerHosts) refs.push(new WeakRef(innerHost.children[0]!), new WeakRef(innerHost));

      rows = [];
      update();
      for (const innerHost of innerHosts) innerHost.remove();
      innerHosts.length = 0;
      inner.length = 0;
      return { refs, host };
    })();

    await collectGarbage();
    expect(allCollected(state.refs)).toBe(true);
    state.host.remove();
  });

  itGc("releases the template skeleton and runtime with a detached list", async () => {
    const refs = (() => {
      const rows = makeRows(5);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const runtime = createListRuntime(() => rows, (row: Row) => span({ className: () => "" }, () => row.label), host as never, 0);
      const out: Array<WeakRef<object>> = [new WeakRef(runtime.template!.skeleton), new WeakRef(runtime), new WeakRef(rows[4]!)];
      host.remove();
      return out;
    })();

    await collectGarbage();
    expect(allCollected(refs)).toBe(true);
  });

  itGc("releases rows re-created after a clear (the retained template holds no row state)", async () => {
    const state = (() => {
      let rows = makeRows(3);
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = render(div(list(() => rows, (row: Row) => span(on("click", () => { void row.id; }), () => row.label))), host) as HTMLElement;

      const refs: Array<WeakRef<object>> = [];
      for (let round = 0; round < 3; round++) {
        for (let i = 0; i < rows.length; i++) refs.push(new WeakRef(root.children[i]!), new WeakRef(rows[i]!));
        rows = [];
        update();
        rows = makeRows(3, (round + 1) * 10);
        update();
      }
      rows = [];
      update();
      return { refs, host };
    })();

    await collectGarbage();
    expect(allCollected(state.refs)).toBe(true);
    state.host.remove();
  });
});
