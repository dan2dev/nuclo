/**
 * Hydration benchmark — run with: bun bench/hydrate.bench.ts
 *
 * Renders a large page to an HTML string, parses it with jsdom, and measures
 * hydrate() walking/claiming the whole tree. Guards against accidental
 * O(n²) behavior in cursor claiming or marker scanning.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>');
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

const { renderToString } = await import('../src/ssr/render-to-string');
const { hydrate } = await import('../src/render');
const { update } = await import('../src/update/update');
const { list } = await import('../src/list');
const { when } = await import('../src/when');
await import('../src');

declare const div: ExpandedElementBuilder<'div'>;
declare const span: ExpandedElementBuilder<'span'>;
declare const p: ExpandedElementBuilder<'p'>;
declare const h2: ExpandedElementBuilder<'h2'>;
declare const button: ExpandedElementBuilder<'button'>;

interface Product { id: number; name: string; price: number; inStock: boolean }

function makeComponent(products: Product[]) {
  return div(
    { className: 'page' },
    h2(() => `Products (${products.length})`),
    list(
      () => products,
      (product) =>
        div(
          { className: 'card', 'data-id': product.id },
          h2(product.name),
          p(() => `$${product.price.toFixed(2)}`),
          when(() => product.inStock, button('Add to cart')).else(span('Out of stock'))
        )
    )
  );
}

for (const count of [100, 1000, 4000]) {
  const products: Product[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Product ${i}`,
    price: (i * 7.13) % 500,
    inStock: i % 3 !== 0,
  }));

  const html = renderToString(makeComponent(products));
  const app = document.getElementById('app')!;

  // Warmup + measure (fresh DOM each round — hydration mutates claims)
  const rounds = 5;
  let total = 0;
  for (let r = 0; r < rounds + 1; r++) {
    app.innerHTML = html;
    const start = performance.now();
    hydrate(makeComponent(products), app);
    const ms = performance.now() - start;
    if (r > 0) total += ms; // skip warmup round
  }
  console.log(`hydrate ${count} items: ${(total / rounds).toFixed(2)} ms (${((total / rounds / count) * 1000).toFixed(0)} µs/item)`);
}

// Sanity: reactivity still works at scale
{
  const products: Product[] = Array.from({ length: 1000 }, (_, i) => ({
    id: i, name: `P${i}`, price: i, inStock: true,
  }));
  const app = document.getElementById('app')!;
  app.innerHTML = renderToString(makeComponent(products));
  hydrate(makeComponent(products), app);
  products.pop();
  let start = performance.now();
  update();
  console.log(`update() #1 after hydration (incl. lazy cleanup of dead registry entries from prior rounds): ${(performance.now() - start).toFixed(2)} ms`);
  products.pop();
  start = performance.now();
  update();
  console.log(`update() #2 steady state (1000 reactive nodes): ${(performance.now() - start).toFixed(2)} ms`);
}
