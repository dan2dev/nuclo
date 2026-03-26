import './style.css';
import 'nuclo';
import { matchRoute } from './router.ts';

const app = document.getElementById('app')!;

function mountPage(pathname: string): void {
  app.innerHTML = '';
  render(matchRoute(pathname), app);
}

// --- Initial hydration ---
// Replace server-rendered HTML with a live Nuclo component tree.
mountPage(window.location.pathname);

// --- SPA navigation ---
// Intercept clicks on internal <a> links.
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
  if (!link) return;

  const href = link.getAttribute('href')!;
  // Let the browser handle external links, hash links, and modifier+clicks.
  if (
    href.startsWith('http') ||
    href.startsWith('//') ||
    href.startsWith('#') ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  ) return;

  e.preventDefault();
  history.pushState(null, '', href);
  mountPage(href);
});

// Handle browser back / forward.
window.addEventListener('popstate', () => {
  mountPage(window.location.pathname);
});
