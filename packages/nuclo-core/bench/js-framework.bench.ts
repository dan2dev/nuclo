/**
 * js-framework-benchmark parity benchmark.
 *   Run:  bun run bench:jfb         (or: bun bench/js-framework.bench.ts)
 *   Quick smoke run:
 *     NUCLO_BENCH_ROWS=200 NUCLO_BENCH_LOTS=1000 NUCLO_BENCH_ROUNDS=2 bun run bench:jfb
 *
 * Drives the exact component and operations used by the keyed Nuclo entry in
 * js-framework-benchmark (frameworks/keyed/nuclo/src/main.ts) and times the JS
 * work of each operation: the keyed list() diff plus reactive text / className
 * re-evaluation flushed by update().
 *
 * Unlike the real benchmark we cannot measure paint, but every operation runs
 * the identical mutation + update() the click handlers perform, so this pins the
 * framework-side cost (list diff, reactive flush) that the browser harness times.
 *
 * jsdom provides the DOM. Globals MUST be installed before importing nuclo: the
 * runtime computes `isBrowser` (and gates reactive/list registration on it) at
 * module-evaluation time from window/document.
 *
 * NOTE: jsdom is ~100× slower than a browser, so absolute numbers are only
 * meaningful relative to each other / across commits. It is kept out of the
 * default `bench` script intentionally.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="main"></div></body></html>');
const g = globalThis as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.Node = dom.window.Node;
g.Element = dom.window.Element;
g.HTMLElement = dom.window.HTMLElement;
g.Text = dom.window.Text;
g.Comment = dom.window.Comment;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
// on() builds listeners with an AbortController; jsdom's addEventListener only
// accepts a signal from jsdom's own AbortSignal, so use jsdom's implementation.
g.AbortController = dom.window.AbortController;
g.AbortSignal = dom.window.AbortSignal;

// Registers global tag builders (div, table, tr, …) + list/on/render/update.
await import('../src/index');
const { update } = await import('../src/core/updateController');
const { list } = await import('../src/list');
const { render } = await import('../src/utility/render');
const { on } = await import('../src/utility/on');

declare const div: ExpandedElementBuilder<'div'>;
declare const h1: ExpandedElementBuilder<'h1'>;
declare const button: ExpandedElementBuilder<'button'>;
declare const table: ExpandedElementBuilder<'table'>;
declare const tbody: ExpandedElementBuilder<'tbody'>;
declare const tr: ExpandedElementBuilder<'tr'>;
declare const td: ExpandedElementBuilder<'td'>;
declare const a: ExpandedElementBuilder<'a'>;
declare const span: ExpandedElementBuilder<'span'>;

// ── Data model (identical to main.ts) ──────────────────────────────────────
const adjectives = [
  'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint',
  'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly',
  'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy',
];
const colors = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'];

function random(max: number): number {
  return Math.round(Math.random() * 1000) % max;
}

interface Row {
  id: number;
  label: string;
}

let nextId = 1;
let rows: Row[] = [];
let selectedId: number | null = null;

function buildData(count: number): Row[] {
  const data: Row[] = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${adjectives[random(adjectives.length)]} ${colors[random(colors.length)]} ${nouns[random(nouns.length)]}`,
    };
  }
  return data;
}

// ── Operations (identical to main.ts click handlers; sizes are overridable
//    via env and default to the js-framework-benchmark values) ──────────────
function doRun(): void { rows = buildData(ROWS); selectedId = null; update(); }
function doRunLots(): void { rows = buildData(LOTS); selectedId = null; update(); }
function doAdd(): void { rows = rows.concat(buildData(ROWS)); update(); }
function doUpdate(): void {
  for (let i = 0; i < rows.length; i += 10) rows[i]!.label += ' !!!';
  update();
}
function doClear(): void { rows = []; selectedId = null; update(); }
function doSwapRows(): void {
  // jfb swaps row 1 and row 998; rows.length - 2 == 998 at the default size.
  const hi = rows.length - 2;
  if (hi > 1) {
    const tmp = rows[1]!;
    rows[1] = rows[hi]!;
    rows[hi] = tmp;
    update();
  }
}
function doSelect(id: number): void { selectedId = id; update(); }
function doDelete(id: number): void { rows = rows.filter((r) => r.id !== id); update(); }

// ── Component tree (identical to main.ts) ───────────────────────────────────
function createApp() {
  return div(
    { className: 'container' },
    div(
      { className: 'jumbotron' },
      div(
        { className: 'row' },
        div({ className: 'col-md-6' }, h1('Nuclo')),
        div(
          { className: 'col-md-6' },
          div(
            { className: 'row' },
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'run' }, on('click', doRun), 'Create 1,000 rows')),
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'runlots' }, on('click', doRunLots), 'Create 10,000 rows')),
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'add' }, on('click', doAdd), 'Append 1,000 rows')),
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'update' }, on('click', doUpdate), 'Update every 10th row')),
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'clear' }, on('click', doClear), 'Clear')),
            div({ className: 'col-sm-6 smallpad' }, button({ type: 'button', className: 'btn btn-primary btn-block', id: 'swaprows' }, on('click', doSwapRows), 'Swap Rows')),
          ),
        ),
      ),
    ),
    table(
      { className: 'table table-hover table-striped test-data' },
      tbody(
        list(
          () => rows,
          (row: Row) =>
            tr(
              { className: () => (selectedId === row.id ? 'danger' : '') },
              td({ className: 'col-md-1' }, String(row.id)),
              td({ className: 'col-md-4' }, a(on('click', () => doSelect(row.id)), () => row.label)),
              td({ className: 'col-md-1' }, a(on('click', () => doDelete(row.id)), span({ className: 'glyphicon glyphicon-remove', 'aria-hidden': 'true' }))),
              td({ className: 'col-md-6' }),
            ),
        ),
      ),
    ),
    span({ className: 'preloadicon glyphicon glyphicon-remove', 'aria-hidden': 'true' }),
  );
}

const main = document.getElementById('main')!;
render(createApp(), main);

function rowCount(): number {
  return main.querySelectorAll('tbody tr').length;
}

// jsdom is ~100× slower than a real browser, so the default jfb sizes can take
// a long time here. Override for a quick smoke run, e.g.
//   NUCLO_BENCH_ROWS=200 NUCLO_BENCH_LOTS=1000 NUCLO_BENCH_ROUNDS=2 bun bench/js-framework.bench.ts
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const ROWS = Number(env.NUCLO_BENCH_ROWS ?? 1000);
const LOTS = Number(env.NUCLO_BENCH_LOTS ?? 10000);
const ROUNDS = env.NUCLO_BENCH_ROUNDS ? Number(env.NUCLO_BENCH_ROUNDS) : undefined;

// ── Harness ─────────────────────────────────────────────────────────────────
const gc: (() => void) | undefined =
  (globalThis as { Bun?: { gc: (force: boolean) => void } }).Bun
    ? () => (globalThis as unknown as { Bun: { gc: (force: boolean) => void } }).Bun.gc(true)
    : (globalThis as { gc?: () => void }).gc;

/**
 * Time `run()` over `rounds` measured iterations. `prepare()` brings the app to
 * the operation's precondition and is never timed. A check after each run guards
 * against silently measuring a no-op.
 */
function bench(
  name: string,
  prepare: () => void,
  run: () => void,
  opts: { rounds?: number; warmup?: number; expectRows?: number; perRow?: number } = {},
): void {
  const { rounds = ROUNDS ?? 3, warmup = 1, expectRows, perRow } = opts;

  for (let i = 0; i < warmup; i++) { prepare(); run(); }
  gc?.();

  const samples: number[] = [];
  for (let r = 0; r < rounds; r++) {
    prepare();
    const start = performance.now();
    run();
    samples.push(performance.now() - start);
  }

  if (expectRows !== undefined && rowCount() !== expectRows) {
    console.log(`${name}: ✗ expected ${expectRows} rows, got ${rowCount()}`);
    return;
  }

  samples.sort((a, b) => a - b);
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
  const min = samples[0]!;
  const median = samples[Math.floor(samples.length / 2)]!;
  const perRowStr = perRow ? ` — ${((avg / perRow) * 1000).toFixed(1)} µs/row` : '';
  console.log(`${name}: avg ${avg.toFixed(2)} ms (min ${min.toFixed(2)}, median ${median.toFixed(2)})${perRowStr}`);
}

function reset(count: number): void {
  rows = count > 0 ? buildData(count) : [];
  selectedId = null;
  update();
}

console.log('js-framework-benchmark parity — Nuclo keyed (list diff + reactive flush)');
console.log(`rows=${ROWS}  lots=${LOTS}  rounds=${ROUNDS ?? 'default'}\n`);

const bigRounds = ROUNDS ?? 2;

// 1. create rows: ROWS rows into an empty table.
bench('create rows', () => reset(0), doRun, { expectRows: ROWS, perRow: ROWS });

// 2. replace all rows: ROWS fresh identities over an existing ROWS.
bench('replace all rows', () => reset(ROWS), doRun, { expectRows: ROWS, perRow: ROWS });

// 3. partial update: append " !!!" to every 10th row.
bench('partial update (every 10th)', () => reset(ROWS), doUpdate, { expectRows: ROWS });

// 4. select row: highlight one row via reactive className.
bench('select row', () => reset(ROWS), () => doSelect(rows[Math.floor(rows.length / 2)]!.id), { expectRows: ROWS });

// 5. swap rows: swap row 1 and row (n-2).
bench('swap rows', () => reset(ROWS), doSwapRows, { expectRows: ROWS });

// 6. remove row: delete a single row.
bench('remove row', () => reset(ROWS), () => doDelete(rows[Math.floor(rows.length / 2)]!.id), { expectRows: ROWS - 1 });

// 7. create many rows: LOTS rows into an empty table.
bench('create many rows', () => reset(0), doRunLots, { rounds: bigRounds, expectRows: LOTS, perRow: LOTS });

// 8. append rows: append ROWS rows to an existing LOTS.
bench('append rows', () => reset(LOTS), doAdd, { rounds: bigRounds, expectRows: LOTS + ROWS, perRow: ROWS });

// 9. clear rows: clear a ROWS-row table.
bench('clear rows', () => reset(ROWS), doClear, { expectRows: 0 });
