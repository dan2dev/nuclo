/**
 * app.ts - isomorphic.
 *
 * App() builds the full app tree (Header + page outlet + Footer). The server
 * renders it inside the request's route.run() and the browser hydrates it after
 * router.start(), so the two DOM trees are structurally identical and the client
 * claims existing SSR nodes instead of re-rendering.
 */
import { Header } from './components/Header.ts';
import { Footer } from './components/Footer.ts';
import { router } from './router.ts';
import { css, colors } from './styles.ts';
import { animations } from './styles/animations.ts';
import { ExampleFrame } from './pages/examples/frame.ts';

const appStyles = {
	// --header-h is the fixed header's height; docs sticky offsets read it too.
	// --frame is the site's width and --gutter its side margin: s.container's, and the home hero works from them.
	root: css("app-app-root", { minHeight: '100vh', raw: { '--header-h': '64px', '--frame': '1336px', '--gutter': '28px' }, '@media (max-width: 767px)': { raw: { '--header-h': '56px' } }, '@media (min-width: 601px) and (max-width: 900px)': { raw: { '--gutter': '24px' } }, '@media (max-width: 600px)': { raw: { '--gutter': '18px' } } }),
  main: css("app-main", { minHeight: 'calc(100vh - 160px)', paddingTop: 'calc(var(--header-h) + 20px)', animation: `${animations.pageFadeIn} 0.28s ease backwards` }), // not `both`: a leftover transform would trap the docs' fixed elements
  errorState: css("app-errorState", { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px', padding: '48px' }),
  errorTitle: css("app-errorTitle", { fontSize: '15px', fontWeight: '600', color: '#ef4444' }),
  errorMessage: css("app-errorMessage", { fontSize: '13px', color: colors.textMuted, fontFamily: 'monospace' }),
};

function ErrorDisplay() {
  return div(
    appStyles.errorState,
    span(appStyles.errorTitle, 'Failed to load page'),
    span(appStyles.errorMessage, () => router.error?.message ?? ''),
  );
}

export function App() {
  // Standalone apps own the viewport, without the documentation shell.
  if (router.pattern === '/desktop' || router.pattern === '/apps/:id') return div(router.outlet());
  return div(
    appStyles.root,
    Header(),
    main(
      { id: 'page-container' },
      appStyles.main,
      // The current page stays on screen while the next one loads.
      when(() => router.error !== null, ErrorDisplay()),
      router.outlet(),
    ),
    Footer(),
    // The examples modal, outside main's transform. Example pages fill its regions.
    ExampleFrame(),
  );
}
