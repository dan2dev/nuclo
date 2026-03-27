/**
 * ssr-app.ts — server-only.
 *
 * No imports from router.ts (client code).
 * No global state mutations — route is passed explicitly through the call chain.
 */
import { loadPageFunction } from './route-definitions.ts';
import { Header } from './components/Header.ts';
import { Footer } from './components/Footer.ts';

export async function ssrMatchRoute(route: string): Promise<ReturnType<typeof div>> {
  const pageFactory = await loadPageFunction(route);

  // In the browser the page is rendered via render(pageEl, pageContainerElement)
  // which always passes index=0. We replicate that by wrapping so it ignores
  // the parent's localIndex, keeping text-N / when-N markers identical
  // between SSR and browser.
  const pageEl = pageFactory();
  const pageAtZero = (parent: ExpandedElement<ElementTagName>) =>
    (pageEl as NodeModFn<ElementTagName>)(parent, 0);

  return div(
    Header({ activeRoute: route }),
    main(
      {
        id: 'page-container',
        style: {
          minHeight: 'calc(100vh - 160px)',
          paddingTop: '64px',
        },
      },
      pageAtZero as NodeModFn<'main'>,
    ),
    Footer(),
  );
}
