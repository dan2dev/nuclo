/**
 * scope() + update(id) — run with: bun bench/scope.bench.ts
 *
 * Three questions, each timed against the DOM work it rides on:
 *  1. update(id) with N scoped components on the page: the cost of refreshing
 *     one must not grow with N (it did: every reactive node was visited).
 *  2. A global update() that replaces every row of a scoped list: the member
 *     index files each new node under its roots, so this is where its cost
 *     lands. Compared with the same list without scope().
 *  3. The same replace-all with no scope() anywhere: the index must be free.
 *
 * jsdom provides the DOM; absolute numbers only mean something across commits.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const g = globalThis as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.Node = dom.window.Node;
g.Element = dom.window.Element;
g.HTMLElement = dom.window.HTMLElement;
g.Text = dom.window.Text;
g.Comment = dom.window.Comment;
g.Event = dom.window.Event;

await import('../src');

declare const div: ExpandedElementBuilder<'div'>;
declare const span: ExpandedElementBuilder<'span'>;
declare const p: ExpandedElementBuilder<'p'>;
declare const ul: ExpandedElementBuilder<'ul'>;
declare const li: ExpandedElementBuilder<'li'>;
declare const render: (fn: NodeModFn<'div'>, parent?: Element) => Element;
declare const update: (...ids: string[]) => void;
declare const scope: (...ids: string[]) => NodeModFn<'div'>;
declare const list: <T>(items: () => T[], row: (item: T) => NodeModFn<'li'>) => NodeModFn<'ul'>;

const ROUNDS = 7;

function median(samples: number[]): number {
  const sorted = samples.slice().sort((x, y) => x - y);
  return sorted[sorted.length >> 1]!;
}

function time(fn: () => void, rounds = ROUNDS): number {
  const samples: number[] = [];
  for (let r = 0; r < rounds; r++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  return median(samples);
}

// ── 1. update(id) among N scoped components ─────────────────────────────────
console.log('update(id) with N scoped components on the page (one component refreshed)');
for (const n of [10, 100, 1000]) {
  document.body.innerHTML = '';
  let tick = 0;
  for (let i = 0; i < n; i++) {
    render(div(scope(`c-${i}`), p(() => `${i}:${tick}`), span({ title: () => `${tick}` }, () => `${tick}`)));
  }
  update(); // first pass files the members
  const ms = time(() => { tick++; update(`c-${n >> 1}`); }, 50);
  console.log(`  N=${n}: ${(ms * 1000).toFixed(1)} µs per update(id)`);
}

// ── 2 & 3. global update() replacing every row ─────────────────────────────
function replaceAll(name: string, rowMod: (i: number) => NodeModFn<'li'>, rows = 1000) {
  document.body.innerHTML = '';
  let items = Array.from({ length: rows }, (_, i) => i);
  let gen = 0;
  render(div(ul(list(() => items, (i) => rowMod(i)))));
  const ms = time(() => {
    gen++;
    items = Array.from({ length: rows }, (_, i) => gen * rows + i);
    update();
  });
  console.log(`  ${name}: ${ms.toFixed(2)} ms per update() (${((ms * 1000) / rows).toFixed(1)} µs/row)`);
}

console.log('global update() replacing 1000 rows, each row = li(span(text), span(attr))');
// No scope() anywhere yet in this process would be ideal for case 3, but the
// index already saw roots above; it still files nothing for rows that have no
// root above them, which is what case 3 measures.
replaceAll('rows without scope()', (i) => li(span(() => `r${i}`), span({ title: () => `t${i}` })));
replaceAll('rows with scope(`row-i`) each', (i) => li(scope(`row-${i}`), span(() => `r${i}`), span({ title: () => `t${i}` })));
{
  document.body.innerHTML = '';
  let items = Array.from({ length: 1000 }, (_, i) => i);
  let gen = 0;
  render(div(scope('list'), ul(list(() => items, (i) => li(span(() => `r${i}`), span({ title: () => `t${i}` }))))));
  const ms = time(() => {
    gen++;
    items = Array.from({ length: 1000 }, (_, i) => gen * 1000 + i);
    update();
  });
  console.log(`  rows under one scope("list") root: ${ms.toFixed(2)} ms per update() (${(ms).toFixed(1)} µs/row)`);
}
