/**
 * app-handler.ts - runtime-agnostic SSR request handler.
 *
 * Pure Request -> Response logic, shared by every server entry point:
 * - the Bun production server / dev server (src/server.ts)
 * - the Cloudflare Pages Function (functions/[[path]].ts)
 *
 * Only Fetch API + Nuclo's isomorphic renderer are used here - no Bun.*,
 * node:*, or Workers-binding APIs belong in this file. Each entry point is
 * responsible for its own static-asset serving and for calling
 * `transformHtml` to inject the built <script>/<link> tags.
 */
import { renderToString, getCssText } from 'nuclo/ssr';
import { ssrMatchRoute } from './ssr-app.ts';
import { routeMap } from './route-definitions.ts';
import { SEO_BASE_URL, generateStructuredData, getMetaForRoute } from './seo.ts';

export const htmlTemplate = `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <!-- Blocking theme script: runs synchronously before first paint so there
         is no flash regardless of saved preference or system color scheme. -->
    <script>!function(){var t=localStorage.getItem('nuclo-theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);if('IntersectionObserver' in window&&!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))document.documentElement.setAttribute('data-anim','');}();</script>
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    {{seoHead}}

    <meta name="theme-color" content="#FF3F00" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Nuclo" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />

    <!-- Nuclo style system output - prevents layout shift before JS hydrates -->
    <style id="nuclo-styles">{{nucloStyles}}</style>

    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
    <div id="app">{{html}}</div>
  </body>
</html>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function routeToAbsoluteUrl(pathname: string): string {
  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/+$/, '');
  return `${SEO_BASE_URL.replace(/\/$/, '')}${normalizedPath}`;
}

function buildSeoHead(route: string, pathname: string, known: boolean): string {
  const meta = known
    ? getMetaForRoute(route)
    : {
        title: 'Page Not Found - Nuclo',
        description: 'The requested page could not be found on the Nuclo documentation site.',
      };

  const pageUrl = known ? (route === 'home' ? SEO_BASE_URL : `${SEO_BASE_URL}${route}`) : routeToAbsoluteUrl(pathname);
  const robots = known ? 'index, follow' : 'noindex, nofollow';
  const ogType = meta.type === 'TechArticle' ? 'article' : 'website';
  const jsonLdSchemas = known
    ? generateStructuredData(route)
    : [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: meta.title,
          description: meta.description,
          url: pageUrl,
          isPartOf: { '@id': `${SEO_BASE_URL}#website` },
        },
      ];
  const jsonLd = JSON.stringify(jsonLdSchemas).replace(/<\//g, '<\\/');

  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />` : '',
    `<meta name="author" content="Danilo Castro (@dan2dev)" />`,
    `<meta name="language" content="English" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${SEO_BASE_URL}og-image.png" />`,
    `<meta property="og:image:secure_url" content="${SEO_BASE_URL}og-image.png" />`,
    '<meta property="og:image:type" content="image/png" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="Nuclo - a lightweight DOM framework" />',
    '<meta property="og:site_name" content="Nuclo" />',
    '<meta property="og:locale" content="en_US" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${SEO_BASE_URL}og-image.png" />`,
    '<meta name="twitter:image:alt" content="Nuclo - a lightweight DOM framework" />',
    '<meta name="twitter:creator" content="@dan2dev" />',
    '<meta name="twitter:site" content="@dan2dev" />',
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].filter(Boolean);

  return tags.join('\n    ');
}

export type ViteManifest = Record<string, { file: string; css?: string[]; imports?: string[] }>;

/**
 * Builds the <link>/<script> tags for the built client entry from a Vite
 * manifest, and returns a transformHtml callback that swaps them into the
 * dev-time <script src="/src/main.ts"> tag. Shared by the Bun prod server
 * and the Cloudflare Pages Function - both just need to supply the manifest.
 */
export function buildProdTransform(manifest: ViteManifest): (html: string) => Promise<string> {
  const entry = manifest['src/main.ts'];
  const cssLinks = (entry.css ?? [])
    .map((f) => `<link rel="stylesheet" href="/${f}" />`)
    .join('\n    ');
  const preloadLinks = (entry.imports ?? [])
    .map((key) => manifest[key]?.file)
    .filter(Boolean)
    .map((f) => `<link rel="modulepreload" href="/${f}" />`)
    .join('\n    ');
  const prodAssets = [cssLinks, preloadLinks, `<script type="module" src="/${entry.file}"></script>`]
    .filter(Boolean)
    .join('\n    ');

  return async (html: string) =>
    html.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);
}

/** Shared between dev and prod, and between the Bun server and Cloudflare Function. */
export async function appFetch(
  req: Request,
  transformHtml: (template: string, url: string) => Promise<string>,
): Promise<Response> {
  const { pathname } = new URL(req.url);

  const route = pathname === '/' ? 'home' : pathname.replace(/^\/|\/+$/g, '');
  const known = routeMap.has(route);
  const renderRoute = known ? route : 'home';
  const status = known ? 200 : 404;

  const element = await ssrMatchRoute(renderRoute);
  const ssrHtml = renderToString(element);

  // Full atomic stylesheet - base rules first, then screens in theme order.
  // Atomic classes are shared across pages, so shipping the full sheet costs
  // little and guarantees no flash of unstyled content on navigation.
  const nucloStyles = getCssText();

  const seoHead = buildSeoHead(renderRoute, pathname, known);
  const html = (await transformHtml(htmlTemplate, known ? pathname : '/'))
    .replace('{{seoHead}}', seoHead)
    .replace('{{html}}', ssrHtml)
    .replace('{{nucloStyles}}', nucloStyles);

  const responseHeaders: Record<string, string> = {
    'Content-Type': 'text/html; charset=utf-8',
  };
  if (!known) {
    responseHeaders['X-Robots-Tag'] = 'noindex, nofollow';
  }

  return new Response(html, {
    status,
    headers: responseHeaders,
  });
}
