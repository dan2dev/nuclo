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
import { App } from './app.ts';
import { router } from './router.ts';
import { pageModules } from './route-definitions.ts';
import { SEO_BASE_URL, generateStructuredData, hreflangLinks, resolveMeta, type RouteInfo } from './seo.ts';
import { DEFAULT_LOCALE, LOCALES, LOCALE_CODES, isLocale, localeOfPath, type Locale } from './i18n/index.ts';

export const htmlTemplate = `<!doctype html>
<html lang="{{lang}}" dir="{{dir}}" data-theme="light">
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

function buildSeoHead(ctx: RouteInfo, data: unknown, pathname: string, known: boolean): string {
  const resolved = resolveMeta(ctx, data);
  const meta = resolved.meta;

  const pageUrl = known ? resolved.url : routeToAbsoluteUrl(pathname);
  const robots = known ? 'index, follow' : 'noindex, nofollow';
  const ogType = meta.type === 'TechArticle' ? 'article' : 'website';
  const locale = resolved.locale;
  const lang = LOCALES[locale ?? DEFAULT_LOCALE];
  const alternates = known ? hreflangLinks(resolved) : [];
  const jsonLdSchemas = known
    ? generateStructuredData(meta, pageUrl, locale)
    : [
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: meta.title,
          description: meta.description,
          url: pageUrl,
          inLanguage: lang.lang,
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
    `<meta name="language" content="${lang.lang}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    // The same page in every language, and the default for readers whose language is none of them.
    ...alternates.map(({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`),
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
    `<meta property="og:locale" content="${lang.og}" />`,
    ...(locale ? LOCALE_CODES.filter((code) => code !== locale).map((code) => `<meta property="og:locale:alternate" content="${LOCALES[code].og}" />`) : []),
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
 *
 * Besides the entry's own imports, the matched route's page chunks are
 * modulepreloaded: the router import()s them right after main.js runs, and the
 * hint lets the browser fetch them alongside it instead of after it.
 */
export function buildProdTransform(manifest: ViteManifest): (html: string, url: string) => Promise<string> {
  const entry = manifest['src/main.ts'];

  /** A chunk and its static imports, in dependency order, skipping ones already listed. */
  const collect = (key: string, seen: Set<string>): string[] => {
    const chunk = manifest[key];
    if (!chunk || seen.has(key)) return [];
    seen.add(key);
    return [...(chunk.imports ?? []).flatMap((dep) => collect(dep, seen)), chunk.file];
  };

  return async (html, url) => {
    const seen = new Set(['src/main.ts']);
    const entryImports = (entry.imports ?? []).flatMap((key) => collect(key, seen));
    const pattern = router.match(url)?.pattern ?? '*';
    const pageChunks = pageModules(pattern).flatMap((key) => collect(key, seen));

    const cssLinks = (entry.css ?? []).map((f) => `<link rel="stylesheet" href="/${f}" />`);
    const preloadLinks = [...entryImports, ...pageChunks].map((f) => `<link rel="modulepreload" href="/${f}" />`);
    const prodAssets = [...cssLinks, ...preloadLinks, `<script type="module" src="/${entry.file}"></script>`].join('\n    ');

    return html.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);
  };
}

/** The embedded routing demo's prefix: its HTML is served for every path under it. */
export const DEMO_PREFIX = '/demos/router';

/** The locale a reader without one in the URL is sent to: the one they picked (cookie), else their browser's, else English. */
export function preferredLocale(req: Request): Locale {
  const cookie = req.headers.get('cookie')?.match(/(?:^|;\s*)nuclo-locale=([^;]+)/)?.[1];
  if (isLocale(cookie)) return cookie;
  const accepted = (req.headers.get('accept-language') ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(';');
      const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
      return { tag, quality: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter(({ tag, quality }) => tag && quality > 0 && quality <= 1)
    .sort((a, b) => b.quality - a.quality);
  // The first accepted language whose primary subtag we have: "pt-PT" lands on pt-br, "zh-TW" on zh.
  for (const { tag } of accepted) {
    const primary = tag.split('-')[0];
    const hit = LOCALE_CODES.find((code) => code.split('-')[0] === primary);
    if (hit) return hit;
  }
  return DEFAULT_LOCALE;
}

/**
 * Where a URL without a locale goes. The root picks the reader's locale (302: it depends on who asks);
 * the sections' old English URLs moved to /en for good (301). null when the URL is fine as it is.
 */
export function localeRedirect(req: Request): Response | null {
  const url = new URL(req.url);
  if (localeOfPath(url.pathname)) return null;
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return redirect(`/${preferredLocale(req)}${url.search}`, 302, { Vary: 'Cookie, Accept-Language', 'Cache-Control': 'no-store' });
  }
  if (/^\/(docs|examples)(\/|$)/.test(url.pathname)) return redirect(`/${DEFAULT_LOCALE}${url.pathname.replace(/\/+$/, '')}${url.search}${url.hash}`, 301);
  return null;
}

const redirect = (location: string, status: 301 | 302, headers: Record<string, string> = {}): Response =>
  new Response(null, { status, headers: { Location: location, ...headers } });

/** Shared between dev and prod, and between the Bun server and Cloudflare Function. */
export async function appFetch(
  req: Request,
  transformHtml: (template: string, url: string) => Promise<string>,
  demoHtml?: () => Promise<string | null>,
): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (demoHtml && (pathname === DEMO_PREFIX || pathname.startsWith(`${DEMO_PREFIX}/`))) {
    const html = await demoHtml();
    if (html !== null) return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const moved = localeRedirect(req);
  if (moved) return moved;

  // One Route per request: App reads the shared router, and run() makes it this request's.
  const route = await router.start(req.url);
  // A page whose load() returned null (an example id that does not exist) is a 404 too.
  const known = route.pattern !== '*' && route.data !== null;
  const status = known ? 200 : 404;

  const ssrHtml = route.run(() => renderToString(App));

  // Full stylesheet - base rules first, then screens in theme order.
  // Generated classes are shared across pages, so shipping the full sheet costs
  // little and guarantees no flash of unstyled content on navigation.
  const nucloStyles = getCssText();

  const seoHead = buildSeoHead(route, route.data, pathname, known);
  const { lang, dir } = LOCALES[resolveMeta(route, route.data).locale ?? DEFAULT_LOCALE];
  const html = (await transformHtml(htmlTemplate, known ? pathname : '/'))
    .replace('{{lang}}', () => lang)
    .replace('{{dir}}', () => dir)
    .replace('{{seoHead}}', () => seoHead)
    .replace('{{html}}', () => ssrHtml)
    .replace('{{nucloStyles}}', () => nucloStyles);

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
