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

  // Pre-create the page element once so it renders at index 0 inside list(),
  // matching the browser's behaviour where list renders the single slot at index 0.
  const pageEl = pageFactory();

  // Mirror the exact when() + list() structure from routes.ts createPageArea().
  // SSR must output the same comment markers (<!--when-start-N-->, <!--list-start-2-->)
  // so the client's hydrateListRuntime finds them and claims existing DOM nodes
  // instead of clearing and re-rendering, which would cause CLS.
  const ssrSlot = { fn: pageFactory };

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
      when(() => false),                         // mirrors: when(() => isLoading, Spinner())
      when(() => false),                         // mirrors: when(() => loadError !== null, ErrorDisplay())
      list(
        () => [ssrSlot],
        (_slot: typeof ssrSlot) =>
          (parent: ExpandedElement<ElementTagName>) =>
            (pageEl as NodeModFn<ElementTagName>)(parent, 0),
      ),
    ),
    Footer(),
  );
}
