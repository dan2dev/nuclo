/**
 * SSR benchmark — run with: bun bench/ssr.bench.ts
 *
 * Measures renderToString throughput on a representative website page
 * (header/nav/content/footer + large product grid) and checks recursion
 * depth safety on a pathologically deep tree.
 */
import '../src/polyfill';
import { renderToString } from '../src/ssr/render-to-string';
import '../src';
import { when } from '../src/when';
import { list } from '../src/list';

declare const div: ExpandedElementBuilder<'div'>;
declare const span: ExpandedElementBuilder<'span'>;
declare const p: ExpandedElementBuilder<'p'>;
declare const a: ExpandedElementBuilder<'a'>;
declare const h1: ExpandedElementBuilder<'h1'>;
declare const h2: ExpandedElementBuilder<'h2'>;
declare const ul: ExpandedElementBuilder<'ul'>;
declare const li: ExpandedElementBuilder<'li'>;
declare const img: ExpandedElementBuilder<'img'>;
declare const header: ExpandedElementBuilder<'header'>;
declare const footer: ExpandedElementBuilder<'footer'>;
declare const section: ExpandedElementBuilder<'section'>;
declare const nav: ExpandedElementBuilder<'nav'>;
declare const button: ExpandedElementBuilder<'button'>;

interface Product {
  id: number;
  name: string;
  price: number;
  tags: string[];
  inStock: boolean;
}

const products: Product[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Product <${i}> & "special"`,
  price: (i * 7.13) % 500,
  tags: [`tag-${i % 7}`, `cat-${i % 13}`],
  inStock: i % 3 !== 0,
}));

function page() {
  return div(
    { className: 'page', id: 'app' },
    header(
      { className: 'site-header', style: { backgroundColor: '#fff', paddingTop: '12px' } },
      h1('Nuclo Store'),
      nav(
        ul(
          ...['Home', 'Products', 'About', 'Contact'].map((label) =>
            li(a({ href: `/${label.toLowerCase()}` }, label))
          )
        )
      )
    ),
    section(
      { className: 'products' },
      h2(() => `Products (${products.length})`),
      list(
        () => products,
        (product) =>
          div(
            { className: 'card', 'data-id': product.id },
            img({ src: `/img/${product.id}.jpg`, alt: product.name }),
            h2(product.name),
            p({ className: 'price' }, () => `$${product.price.toFixed(2)}`),
            div(...product.tags.map((tag) => span({ className: 'tag' }, tag))),
            when(() => product.inStock, button('Add to cart')).else(span('Out of stock'))
          )
      )
    ),
    footer(p('© 2026 Nuclo'))
  );
}

function bench(name: string, fn: () => string, iterations: number): void {
  // Warmup
  for (let i = 0; i < 3; i++) fn();
  let bytes = 0;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    bytes += fn().length;
  }
  const ms = performance.now() - start;
  const perIter = ms / iterations;
  const mbps = bytes / 1024 / 1024 / (ms / 1000);
  console.log(
    `${name}: ${perIter.toFixed(2)} ms/render, ${mbps.toFixed(1)} MB/s (html ${(bytes / iterations / 1024).toFixed(0)} KB)`
  );
}

bench('page (1000 products)', () => renderToString(page()), 50);

// Deep nesting — recursion safety probe
function deepTree(depth: number) {
  let node = div('leaf');
  for (let i = 0; i < depth; i++) {
    const child = node;
    node = div(child);
  }
  return node;
}

for (const depth of [500, 2000, 5000]) {
  try {
    const html = renderToString(deepTree(depth));
    console.log(`deep tree depth=${depth}: ok (${(html.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`deep tree depth=${depth}: FAILED — ${(e as Error).message}`);
  }
}

// Phase split: building the polyfill DOM vs serializing it
import { createElement } from '../src/shared/dom';
import { renderToString as rts } from '../src/ssr/render-to-string';

function buildOnly() {
  const container = createElement('div')!;
  return page()(container as ExpandedElement<'div'>, 0);
}

{
  for (let i = 0; i < 3; i++) buildOnly();
  let start = performance.now();
  for (let i = 0; i < 50; i++) buildOnly();
  console.log(`build only: ${((performance.now() - start) / 50).toFixed(2)} ms`);

  const prebuilt = buildOnly();
  for (let i = 0; i < 3; i++) rts(prebuilt as unknown as Node as Element);
  start = performance.now();
  for (let i = 0; i < 50; i++) rts(prebuilt as unknown as Node as Element);
  console.log(`serialize only: ${((performance.now() - start) / 50).toFixed(2)} ms`);
}
