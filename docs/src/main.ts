import 'nuclo';
import { registerGlobalStyles } from './styles.ts';
import { initTheme } from './theme.ts';
import { router } from './router.ts';
import { App } from './app.ts';
import { scanReveals } from './reveal.ts';
import { markHydrated } from './pages/examples/frame.ts';

// Theme before styles so CSS vars are set on first paint.
initTheme();

// Register Nuclo globalStyle() rules on the client for SPA-only fallback pages.
registerGlobalStyles();

// iOS Safari only applies :active (the controls' press feedback; the tap highlight is off) when the body listens for touchstart.
document.body.addEventListener('touchstart', () => {}, { passive: true });

// Resolve the current page first so the outlet starts populated.
// hydrate() then claims existing SSR nodes - no remove+add, no CLS.
await router.start();
hydrate(App, document.getElementById('app')!);
markHydrated();

// Reveal-on-scroll: observe SSR'd nodes now; the router rescans after every navigation.
scanReveals();

