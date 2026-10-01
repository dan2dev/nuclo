/// <reference path="../../types/index.d.ts" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, hydrate, forceUpdate } from "../../src/render";
import { update } from "../../src/update/update";
import { renderToString } from "../../src/ssr/render-to-string";
import { mulberry32, runSeed, snap, withServerGlobals, type Mode, type RunOptions } from "./fuzz-harness";
import "../../src";

/**
 * Large trees and long operation sequences: every feature combined at a scale
 * where an off-by-one in the list diff, a claim cursor drifting during
 * hydration, or a registration that is not released shows up as a wrong DOM.
 *
 * Expectations are always computed from the data, never from another nuclo
 * render. Server HTML comes from nuclo's SSR polyfill (withServerGlobals), the
 * same markup a Node server emits.
 */
describe("large DOM", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const ssr = (app: () => unknown): string => withServerGlobals(() => renderToString(app as never));
  const kids = (el: Element): Element[] => Array.from(el.children);

  // ───────────────────────────────────────────────────────────────────────
  // Keyed table — the js-framework-benchmark operations, verified row by row
  // ───────────────────────────────────────────────────────────────────────
  interface Row { id: number; label: string }

  function makeTable() {
    const store = {
      rows: [] as Row[],
      selected: -1,
      nextId: 1,
      clicks: [] as string[],
    };
    const build = (count: number): Row[] =>
      Array.from({ length: count }, () => {
        const id = store.nextId++;
        return { id, label: `item ${id}` };
      });
    const App = () =>
      table(
        tbody(
          list(() => store.rows, (row) =>
            tr(
              { className: () => (store.selected === row.id ? "danger" : "") },
              td({ className: "col-md-1" }, String(row.id)),
              td({ className: "col-md-4" }, a({ onClick: () => { store.clicks.push(`select ${row.id}`); } }, () => row.label)),
              td({ className: "col-md-1" }, button({ onClick: () => { store.clicks.push(`remove ${row.id}`); } }, "x")),
            ),
          ),
        ),
      );
    return { store, build, App };
  }

  /** Asserts the table body mirrors `store` exactly. */
  function expectTable(root: Element, store: { rows: Row[]; selected: number }): void {
    const body = root.firstElementChild!;
    expect(body.children.length).toBe(store.rows.length);
    let tr = body.firstElementChild;
    for (let i = 0; i < store.rows.length; i++) {
      const row = store.rows[i]!;
      const cells = tr!.children;
      if (
        cells[0]!.textContent !== String(row.id) ||
        cells[1]!.textContent !== row.label ||
        tr!.className !== (store.selected === row.id ? "danger" : "")
      ) {
        throw new Error(
          `row ${i}: expected #${row.id} "${row.label}" selected=${store.selected === row.id}, ` +
            `got #${cells[0]!.textContent} "${cells[1]!.textContent}" class="${tr!.className}"`,
        );
      }
      tr = tr!.nextElementSibling;
    }
  }

  function runTableOperations(root: Element, t: ReturnType<typeof makeTable>, size: number): void {
    const { store, build } = t;
    const body = root.firstElementChild!;
    expectTable(root, store);

    // partial update: every 10th label
    for (let i = 0; i < store.rows.length; i += 10) store.rows[i]!.label += " !!!";
    update();
    expectTable(root, store);

    // select, then move the selection
    store.selected = store.rows[5]!.id;
    update();
    store.selected = store.rows[size - 2]!.id;
    update();
    expectTable(root, store);

    // swap two far-apart rows: the row elements themselves move
    const first = body.children[1]!;
    const second = body.children[size - 2]!;
    const swapped = store.rows.slice();
    [swapped[1], swapped[size - 2]] = [swapped[size - 2]!, swapped[1]!];
    store.rows = swapped;
    update();
    expectTable(root, store);
    expect(body.children[size - 2]).toBe(first);
    expect(body.children[1]).toBe(second);

    // remove one row in the middle, then a block, then every other row
    store.rows = store.rows.filter((_, i) => i !== (size >> 1));
    update();
    store.rows = store.rows.filter((_, i) => i < 100 || i >= 400);
    update();
    const survivor = body.children[3]!;
    store.rows = store.rows.filter((_, i) => i % 2 === 1);
    update();
    expectTable(root, store);
    expect(body.children[1]).toBe(survivor);

    // handlers still belong to their own row after all the moves
    const third = body.children[2]!;
    (third.children[1]!.firstElementChild as HTMLElement).click();
    (third.children[2]!.firstElementChild as HTMLElement).click();
    expect(store.clicks.splice(0)).toEqual([`select ${store.rows[2]!.id}`, `remove ${store.rows[2]!.id}`]);

    // append, prepend, insert in the middle
    store.rows = [...build(50), ...store.rows.slice(0, 200), ...build(50), ...store.rows.slice(200), ...build(1000)];
    update();
    expectTable(root, store);

    // reverse, then sort back
    store.rows = store.rows.slice().reverse();
    update();
    expectTable(root, store);
    store.rows = store.rows.slice().sort((x, y) => x.id - y.id);
    update();
    expectTable(root, store);

    // replace everything, clear, create again
    store.rows = build(size >> 2);
    update();
    expectTable(root, store);
    store.rows = [];
    update();
    expect(body.children.length).toBe(0);
    store.rows = build(300);
    update();
    expectTable(root, store);
  }

  it("10,000-row keyed table — client render through every list operation", () => {
    const t = makeTable();
    t.store.rows = t.build(10_000);
    const root = render(t.App, container);
    runTableOperations(root, t, 10_000);
  });

  it("5,000-row keyed table — server-rendered, hydrated in place, then every list operation", () => {
    const t = makeTable();
    t.store.rows = t.build(5_000);
    container.innerHTML = ssr(t.App);
    const serverRows = kids(container.firstElementChild!.firstElementChild!);
    expect(serverRows.length).toBe(5_000);

    const root = hydrate(t.App, container);

    const hydratedRows = kids(root.firstElementChild!);
    expect(hydratedRows.length).toBe(5_000);
    for (let i = 0; i < serverRows.length; i++) {
      if (hydratedRows[i] !== serverRows[i]) throw new Error(`row ${i} was rebuilt during hydration`);
    }
    runTableOperations(root, t, 5_000);
  });

  it("5,000-row table — server state differs from client state on hydration", () => {
    const t = makeTable();
    t.store.rows = t.build(5_000);
    container.innerHTML = ssr(t.App);

    // Client data moved on: rows dropped, labels changed, rows added, one selected.
    t.store.rows = t.store.rows.filter((_, i) => i % 7 !== 0);
    for (let i = 0; i < t.store.rows.length; i += 3) t.store.rows[i]!.label = `changed ${i}`;
    t.store.rows = [...t.store.rows, ...t.build(250)];
    t.store.selected = t.store.rows[10]!.id;

    const root = hydrate(t.App, container);
    expectTable(root, t.store);

    t.store.rows = t.store.rows.slice().reverse();
    t.store.selected = t.store.rows[0]!.id;
    update();
    expectTable(root, t.store);
  });

  it("forceUpdate() re-evaluates 5,000 rows of static text in place", () => {
    const words: Record<string, string[]> = { en: ["Name", "Edit", "Delete"], pt: ["Nome", "Editar", "Excluir"] };
    let lang = "en";
    const rows = Array.from({ length: 5_000 }, (_, i) => ({ id: i }));
    const App = () =>
      ul(list(() => rows, (row) => li(span(`${words[lang]![0]} ${row.id}`), button(words[lang]![1]!), button(words[lang]![2]!))));

    const root = render(App, container);
    const before = kids(root);

    lang = "pt";
    forceUpdate();

    const after = kids(root);
    expect(after.length).toBe(5_000);
    for (let i = 0; i < after.length; i++) {
      const row = after[i]!;
      if (row !== before[i]) throw new Error(`row ${i} was rebuilt by forceUpdate()`);
      if (row.textContent !== `Nome ${i}EditarExcluir`) throw new Error(`row ${i}: ${row.textContent}`);
    }
  });

  // ───────────────────────────────────────────────────────────────────────
  // Nested lists × when()
  // ───────────────────────────────────────────────────────────────────────
  interface Cell { id: number; on: boolean; v: number }
  interface Line { id: number; cells: Cell[] }

  function makeGrid(lines: number, cols: number) {
    let nextId = 1;
    const data = {
      lines: Array.from({ length: lines }, (_, r): Line => ({
        id: r,
        cells: Array.from({ length: cols }, (_, c): Cell => ({ id: nextId++, on: (r + c) % 3 === 0, v: r * cols + c })),
      })),
    };
    const App = () =>
      section(
        list(() => data.lines, (line) =>
          div(
            { className: "line", "data-line": String(line.id) },
            list(() => line.cells, (cell) =>
              span(
                { className: () => (cell.on ? "on" : "off") },
                when(() => cell.on, b(() => cell.v)).else(i("-")),
              ),
            ),
          ),
        ),
      );
    const expected = (): string =>
      "<section>" +
      data.lines
        .map((line) =>
          `<div class="line" data-line="${line.id}">` +
          line.cells.map((cell) => (cell.on ? `<span class="on"><b>"${cell.v}"</b></span>` : `<span class="off"><i>"-"</i></span>`)).join("") +
          "</div>")
        .join("") +
      "</section>";
    // snap() prints attributes as name="value" with JSON-quoted values.
    const normalized = (): string => expected().replace(/="([^"]*)"/g, (_, v: string) => `=${JSON.stringify(v)}`);
    return { data, App, expected: normalized };
  }

  function runGridOperations(g: ReturnType<typeof makeGrid>): void {
    const { data } = g;
    const rng = mulberry32(7);
    expect(snap(container)).toBe(g.expected());

    // toggle a third of the cells and bump every value
    for (const line of data.lines) for (const cell of line.cells) {
      if (cell.id % 3 === 0) cell.on = !cell.on;
      cell.v += 1;
    }
    update();
    expect(snap(container)).toBe(g.expected());

    // reverse the cells of every other line, drop some, add some
    for (const line of data.lines) {
      if (line.id % 2 === 0) line.cells = line.cells.slice().reverse();
      else line.cells = line.cells.filter((cell) => cell.id % 5 !== 0);
      if (line.id % 4 === 0) line.cells.push({ id: 1_000_000 + line.id, on: true, v: -line.id });
    }
    update();
    expect(snap(container)).toBe(g.expected());

    // shuffle the lines, remove half, toggle everything
    for (let k = data.lines.length - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [data.lines[k], data.lines[j]] = [data.lines[j]!, data.lines[k]!];
    }
    update();
    expect(snap(container)).toBe(g.expected());
    data.lines = data.lines.filter((line) => line.id % 2 === 0);
    for (const line of data.lines) for (const cell of line.cells) cell.on = !cell.on;
    update();
    expect(snap(container)).toBe(g.expected());

    // forceUpdate() with everything unchanged keeps the DOM identical
    forceUpdate();
    expect(snap(container)).toBe(g.expected());

    // and reactivity still works afterwards
    for (const line of data.lines) for (const cell of line.cells) cell.v *= 2;
    data.lines = data.lines.slice().reverse();
    update();
    expect(snap(container)).toBe(g.expected());
  }

  // Sizes of the when()-heavy tests below are bounded by jsdom, not nuclo:
  // jsdom re-walks the whole document on the first `document.createElement`
  // after every mutation of the connected tree, which makes each branch swap
  // O(document size) there (a browser has no such cost).
  it("40 × 40 nested lists with a when() in every cell — client", () => {
    const g = makeGrid(40, 40);
    render(g.App, container);
    runGridOperations(g);
  });

  it("30 × 30 nested lists with a when() in every cell — server-rendered and hydrated", () => {
    const g = makeGrid(30, 30);
    container.innerHTML = ssr(g.App);
    const serverCells = container.getElementsByTagName("span").length;
    const first = container.getElementsByTagName("span")[0];

    hydrate(g.App, container);

    expect(container.getElementsByTagName("span").length).toBe(serverCells);
    expect(container.getElementsByTagName("span")[0]).toBe(first);
    runGridOperations(g);
  });

  // ───────────────────────────────────────────────────────────────────────
  // Depth and width
  // ───────────────────────────────────────────────────────────────────────
  function makeDeep(depth: number) {
    const state = { leaf: "leaf", gates: Array.from({ length: Math.ceil(depth / 25) }, () => true) };
    const App = () => {
      let node: unknown = strong(() => state.leaf);
      for (let level = depth - 1; level >= 0; level--) {
        if (level % 25 === 0) {
          const gate = level / 25;
          node = div({ "data-level": String(level) }, when(() => state.gates[gate]!, node as never).else(`closed ${level}`));
        } else {
          node = div(node as never);
        }
      }
      return node as never;
    };
    /** Depth of the chain down to the first closed gate (or the leaf). */
    const walk = (): { depth: number; text: string } => {
      let el: Element = container.firstElementChild!;
      let d = 1;
      while (el.firstElementChild) {
        el = el.firstElementChild;
        d++;
      }
      return { depth: d, text: el.textContent ?? "" };
    };
    return { state, App, walk };
  }

  it("a 600-level deep tree with a when() gate every 25 levels — render, update, forceUpdate", () => {
    const deep = makeDeep(600);
    render(deep.App, container);
    expect(deep.walk()).toEqual({ depth: 601, text: "leaf" });

    deep.state.leaf = "changed";
    update();
    expect(deep.walk()).toEqual({ depth: 601, text: "changed" });

    deep.state.gates[12] = false; // level 300
    update();
    expect(deep.walk()).toEqual({ depth: 301, text: "closed 300" });

    deep.state.gates[12] = true;
    deep.state.gates[20] = false; // level 500
    deep.state.leaf = "again";
    update();
    expect(deep.walk()).toEqual({ depth: 501, text: "closed 500" });

    forceUpdate();
    deep.state.gates[20] = true;
    update();
    expect(deep.walk()).toEqual({ depth: 601, text: "again" });
  });

  it("a 600-level deep tree — server-rendered and hydrated without rebuilding a level", () => {
    const deep = makeDeep(600);
    container.innerHTML = ssr(deep.App);
    const chain: Element[] = [];
    for (let el = container.firstElementChild; el; el = el.firstElementChild) chain.push(el);
    expect(chain.length).toBe(601);

    hydrate(deep.App, container);

    let el = container.firstElementChild;
    for (let k = 0; k < chain.length; k++) {
      if (el !== chain[k]) throw new Error(`level ${k} was rebuilt during hydration`);
      el = el!.firstElementChild;
    }
    deep.state.leaf = "hydrated";
    deep.state.gates[3] = false;
    update();
    expect(deep.walk()).toEqual({ depth: 76, text: "closed 75" });
    deep.state.gates[3] = true;
    update();
    expect(deep.walk()).toEqual({ depth: 601, text: "hydrated" });
  });

  it("one element with 6,000 mixed children — static text, reactive text, elements, when()", () => {
    const state = { tick: 0, flip: false };
    const COUNT = 1_500;
    const App = () => {
      const children: unknown[] = [];
      for (let k = 0; k < COUNT; k++) {
        children.push(`s${k};`, () => `r${k}:${state.tick};`, em(String(k)), when(() => state.flip === (k % 2 === 0), u("w")));
      }
      return (div as (...mods: unknown[]) => never)(...children);
    };
    const expected = (): string => {
      let out = "";
      for (let k = 0; k < COUNT; k++) out += `s${k};r${k}:${state.tick};${k}${state.flip === (k % 2 === 0) ? "w" : ""}`;
      return out;
    };

    container.innerHTML = ssr(App);
    const root = container.firstElementChild!;
    const ems = Array.from(root.getElementsByTagName("em"));
    hydrate(App, container);
    expect(root.textContent).toBe(expected());
    expect(Array.from(root.getElementsByTagName("em"))).toEqual(ems);

    state.tick = 1;
    state.flip = true;
    update();
    expect(root.textContent).toBe(expected());

    state.tick = 2;
    forceUpdate();
    expect(root.textContent).toBe(expected());
    expect(root.getElementsByTagName("em")[COUNT - 1]).toBe(ems[COUNT - 1]);

    state.tick = 3;
    state.flip = false;
    update();
    expect(root.textContent).toBe(expected());
  });

  // ───────────────────────────────────────────────────────────────────────
  // Many independent blocks
  // ───────────────────────────────────────────────────────────────────────
  it("1,200 independent when().when().else() chains toggled in bulk", () => {
    const N = 1_200;
    const stage = new Uint8Array(N); // 0 → first branch, 1 → second, 2 → else
    const App = () => {
      const blocks: unknown[] = [];
      for (let k = 0; k < N; k++) {
        blocks.push(when(() => stage[k] === 0, b(`a${k}`)).when(() => stage[k] === 1, i(`b${k}`), u("+")).else(`c${k}`));
      }
      return (div as (...mods: unknown[]) => never)(...blocks);
    };
    const expected = (): string => {
      let out = "";
      for (let k = 0; k < N; k++) out += stage[k] === 0 ? `a${k}` : stage[k] === 1 ? `b${k}+` : `c${k}`;
      return out;
    };

    const root = render(App, container);
    expect(root.textContent).toBe(expected());

    const rng = mulberry32(99);
    for (let round = 0; round < 6; round++) {
      for (let k = 0; k < N; k++) if (rng() < 0.4) stage[k] = Math.floor(rng() * 3);
      update();
      expect(root.textContent).toBe(expected());
      expect(root.getElementsByTagName("b").length).toBe(stage.filter((s) => s === 0).length);
      expect(root.getElementsByTagName("i").length).toBe(stage.filter((s) => s === 1).length);
    }
  });

  it("800 small lists side by side, each mutated independently", () => {
    const N = 800;
    const lists = Array.from({ length: N }, (_, k) => Array.from({ length: k % 6 }, (_, j) => k * 10 + j));
    const App = () => {
      const blocks: unknown[] = [];
      for (let k = 0; k < N; k++) blocks.push(list(() => lists[k]!, (n) => i(String(n))), "|");
      return (div as (...mods: unknown[]) => never)(...blocks);
    };
    const expected = (): string => lists.map((items) => items.join("") + "|").join("");

    container.innerHTML = ssr(App);
    const root = hydrate(App, container);
    expect(root.textContent).toBe(expected());

    const rng = mulberry32(5);
    for (let round = 0; round < 5; round++) {
      for (let k = 0; k < N; k++) {
        const r = rng();
        if (r < 0.2) lists[k] = lists[k]!.slice().reverse();
        else if (r < 0.4) lists[k]!.push(round * 1000 + k);
        else if (r < 0.5) lists[k] = [];
        else if (r < 0.6) lists[k]!.shift();
        else if (r < 0.7) lists[k] = [k, k, k]; // duplicates
      }
      update();
      expect(root.textContent).toBe(expected());
    }
    forceUpdate();
    expect(root.textContent).toBe(expected());
  });

  // ───────────────────────────────────────────────────────────────────────
  // Long random operation sequences on one big list
  // ───────────────────────────────────────────────────────────────────────
  it("3,000 keyed rows through 60 random splices — survivors keep their element", () => {
    interface Entry { id: number }
    let nextId = 0;
    let items: Entry[] = Array.from({ length: 3_000 }, () => ({ id: nextId++ }));
    const root = render(ol(list(() => items, (entry) => li(String(entry.id)))), container);
    const rng = mulberry32(2024);

    for (let round = 0; round < 60; round++) {
      const elementOf = new Map<Entry, Element>();
      let el = root.firstElementChild;
      for (const entry of items) {
        elementOf.set(entry, el!);
        el = el!.nextElementSibling;
      }

      const next = items.slice();
      const ops = 1 + Math.floor(rng() * 6);
      for (let o = 0; o < ops; o++) {
        const at = Math.floor(rng() * (next.length + 1));
        const r = rng();
        if (r < 0.3) next.splice(at, Math.floor(rng() * 40));
        else if (r < 0.6) next.splice(at, 0, ...Array.from({ length: Math.floor(rng() * 40) }, () => ({ id: nextId++ })));
        else if (r < 0.8 && next.length > 1) {
          const moved = next.splice(Math.floor(rng() * next.length), Math.floor(rng() * 25));
          next.splice(Math.floor(rng() * (next.length + 1)), 0, ...moved);
        } else next.reverse();
      }
      items = next;
      update();

      expect(root.children.length).toBe(items.length);
      el = root.firstElementChild;
      for (let k = 0; k < items.length; k++) {
        const entry = items[k]!;
        if (el!.textContent !== String(entry.id)) throw new Error(`round ${round}, position ${k}: expected ${entry.id}, got ${el!.textContent}`);
        const previous = elementOf.get(entry);
        if (previous && previous !== el) throw new Error(`round ${round}: surviving row ${entry.id} was rebuilt`);
        el = el!.nextElementSibling;
      }
    }
  });

  it("2,000 primitive rows with heavy duplication through random permutations", () => {
    let items: number[] = Array.from({ length: 2_000 }, (_, k) => k % 37);
    const root = render(div(list(() => items, (n) => span(String(n), ","))), container);
    const rng = mulberry32(31337);
    for (let round = 0; round < 25; round++) {
      const next = items.slice();
      for (let k = next.length - 1; k > 0; k--) {
        if (rng() < 0.15) {
          const j = Math.floor(rng() * (k + 1));
          [next[k], next[j]] = [next[j]!, next[k]!];
        }
      }
      if (round % 5 === 4) next.splice(Math.floor(rng() * next.length), 300);
      if (round % 7 === 6) next.push(...Array.from({ length: 500 }, (_, k) => (k * 7) % 41));
      items = next;
      update();
      expect(root.children.length).toBe(items.length);
      expect(root.textContent).toBe(items.join(",") + (items.length ? "," : ""));
    }
  });

  // ───────────────────────────────────────────────────────────────────────
  // Randomly generated apps, large
  // ───────────────────────────────────────────────────────────────────────
  const BIG_MODES: Array<[Mode, RunOptions["ssr"]]> = [
    ["client", "dom"],
    ["hydrate", "polyfill"],
    ["hydrate-mismatch", "polyfill"],
  ];
  for (const [mode, ssrOn] of BIG_MODES) {
    it(`random apps with lists of up to 400 items — ${mode}`, async () => {
      for (let seed = 500_000; seed < 500_012; seed++) {
        runSeed(seed, mode, { lifecycle: true, maxListSize: 400, maxDepth: 4, rounds: 4, ssr: ssrOn });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }, 120_000);
  }
});
