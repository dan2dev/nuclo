/**
 * app.ts - isomorphic.
 *
 * createApp() builds the full app tree (Header + page area + Footer) using
 * closure-based state so each call is fully isolated.  The same function is
 * used on the server (renderToString) and on the browser (hydrate), which
 * guarantees the two DOM trees are structurally identical and lets the client
 * claim existing SSR nodes instead of re-rendering.
 */
import { Header } from './components/Header.ts';
import { Footer } from './components/Footer.ts';
import { loadPageFunction, preloadRoutes, type PageFunction } from './route-definitions.ts';
import { css, colors } from './styles.ts';
import { animations } from './styles/animations.ts';

type PageSlot = { fn: PageFunction };

const appStyles = {
  root: css({ minHeight: '100vh' }),
  main: css({ minHeight: 'calc(100vh - 160px)', paddingTop: '96px', animation: `${animations.pageFadeIn} 0.28s ease both` }),
  centerState: css({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }),
  spinner: css({ width: '32px', height: '32px', border: `2px solid ${colors.border}`, borderTopColor: colors.primary, borderRadius: '50%', animation: `${animations.spin} 0.6s linear infinite` }),
  loadingText: css({ fontSize: '13px', color: colors.textMuted }),
  errorState: css({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px', padding: '48px' }),
  errorTitle: css({ fontSize: '15px', fontWeight: '600', color: '#ef4444' }),
  errorMessage: css({ fontSize: '13px', color: colors.textMuted, fontFamily: 'monospace' }),
};

function Spinner() {
  return div(
    appStyles.centerState,
    div(appStyles.spinner),
    span(appStyles.loadingText, 'Loading...'),
  );
}

/**
 * Creates the full app element tree and a loadPage function for navigation.
 *
 * @param initialFn  The page factory for the route being rendered first.
 *                   Pre-populates the list() slot so SSR → hydration is seamless.
 * @param initialRoute  Passed to Header so SSR can highlight the active nav link
 *                      without relying on the client-side getCurrentRoute() singleton.
 */
export function createApp(
  initialFn: PageFunction,
  initialRoute?: string,
): { element: ReturnType<typeof div>; loadPage: (path: string) => Promise<void> } {
  let pageSlot: PageSlot[] = [{ fn: initialFn }];
  let isLoading = false;
  let loadError: string | null = null;
  let preloadScheduled = false;
  // Guards the loading spinner: stays false until the first loadPage() resolves,
  // so the initial SSR content is never cleared during hydration (no CLS).
  let hasLoadedOnce = false;

  function ErrorDisplay() {
    return div(
      appStyles.errorState,
      span(appStyles.errorTitle, 'Failed to load page'),
      span(appStyles.errorMessage, () => loadError ?? ''),
    );
  }

  const element = div(
    appStyles.root,
    Header({ activeRoute: initialRoute }),
    main(
      { id: 'page-container' },
      appStyles.main,
      when(() => isLoading, Spinner()),
      when(() => loadError !== null, ErrorDisplay()),
      list(() => pageSlot, (slot) => slot.fn()),
    ),
    Footer(),
  );

  async function loadPage(path: string): Promise<void> {
    const showSpinner = hasLoadedOnce;
    if (showSpinner) {
      isLoading = true;
      loadError = null;
      pageSlot = [];
      update();
    }

    try {
      const fn = await loadPageFunction(path);
      isLoading = false;
      loadError = null;
      // Reuse the existing slot when fn is unchanged so list() skips remove+add.
      if (pageSlot.length !== 1 || pageSlot[0].fn !== fn) {
        pageSlot = [{ fn }];
      }
      hasLoadedOnce = true;
      update();

      if (!preloadScheduled) {
        preloadScheduled = true;
        preloadRoutes();
      }
    } catch (err) {
      isLoading = false;
      loadError = (err as Error).message;
      hasLoadedOnce = true;
      update();
    }
  }

  return { element, loadPage };
}
