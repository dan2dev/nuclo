/**
 * when() branch rendering — run with: bun bench/when.bench.ts
 *
 * Renders many when() blocks into one host and re-renders their branches.
 * The host is kept out of the document: jsdom re-walks the whole document on
 * the first `document.createElement` after any connected mutation, which would
 * drown the library's own cost (a browser has no such behavior).
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
const { when } = await import('../src/when');
const { renderWhenContent } = await import('../src/when/runtime');
type Runtime = Parameters<typeof renderWhenContent>[0];

declare const div: ExpandedElementBuilder<'div'>;
declare const span: ExpandedElementBuilder<'span'>;
declare const b: ExpandedElementBuilder<'b'>;

function median(samples: number[]): number {
  const sorted = samples.slice().sort((x, y) => x - y);
  return sorted[sorted.length >> 1]!;
}

function run(name: string, blocks: number, rounds: number, setup: (flags: boolean[], k: number) => NodeModFn<'div'>): void {
  const createMs: number[] = [];
  const toggleMs: number[] = [];
  for (let round = 0; round < rounds; round++) {
    const flags = Array.from({ length: blocks }, (_, k) => k % 2 === 0);
    const mods = flags.map((_, k) => setup(flags, k));
    const host = document.createElement('div') as unknown as ExpandedElement<'div'>;

    let start = performance.now();
    for (let k = 0; k < blocks; k++) mods[k]!(host, k);
    createMs.push(performance.now() - start);

    // Re-render every block's branch through the same path update() uses.
    const runtimes: Runtime[] = [];
    const proto = { collect: true };
    void proto;
    const starts = Array.from((host as unknown as Element).childNodes).filter((n) => n.nodeType === 8 && n.textContent!.startsWith('when-start'));
    const ends = Array.from((host as unknown as Element).childNodes).filter((n) => n.nodeType === 8 && n.textContent === 'when-end');
    for (let k = 0; k < blocks; k++) {
      runtimes.push({
        startMarker: starts[k] as Comment,
        endMarker: ends[k] as Comment,
        host,
        index: k,
        groups: [{ condition: () => flags[k]!, content: [span('on ', b(String(k)))] }],
        elseContent: [span('off')],
        activeIndex: flags[k] ? 0 : -1,
      } as Runtime);
    }
    start = performance.now();
    for (let pass = 0; pass < 4; pass++) {
      for (let k = 0; k < blocks; k++) flags[k] = !flags[k];
      for (let k = 0; k < blocks; k++) renderWhenContent(runtimes[k]!);
    }
    toggleMs.push((performance.now() - start) / 4);
  }
  console.log(
    `${name}: create ${median(createMs).toFixed(2)} ms (${((median(createMs) * 1000) / blocks).toFixed(2)} µs/block), ` +
      `toggle ${median(toggleMs).toFixed(2)} ms (${((median(toggleMs) * 1000) / blocks).toFixed(2)} µs/block)`,
  );
}

console.log('when() branch rendering — one host, detached');
run('element branches (when(cond, span).else(span))', 5000, 9, (flags, k) =>
  when(() => flags[k]!, span('on ', b(String(k)))).else(span('off')) as unknown as NodeModFn<'div'>);
run('text branches (when(cond, "on").else("off"))', 5000, 9, (flags, k) =>
  when(() => flags[k]!, 'on').else('off') as unknown as NodeModFn<'div'>);
run('nested when inside when', 3000, 9, (flags, k) =>
  when(() => flags[k]!, when(() => true, span('inner'))).else(div('off')) as unknown as NodeModFn<'div'>);
