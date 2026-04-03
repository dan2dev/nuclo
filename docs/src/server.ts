// SSR import order matters: ssr-css-setup MUST be first so the CSS collector
// is installed before any module with module-level cn() calls is evaluated.
import { globalSSRRules, ssrStylesALS, withSSRStyles } from './ssr-css-setup.ts';
import './css-polyfill.ts';
import 'nuclo/polyfill';
import 'nuclo';
import { renderToString } from 'nuclo/ssr';
import { dirname, resolve } from 'node:path';
import { ssrMatchRoute } from './ssr-app.ts';
import { routeMap, routeDefinitions } from './route-definitions.ts';
import { SEO_BASE_URL, generateStructuredData, getMetaForRoute } from './seo.ts';
import { globalCss } from './styles.ts';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);

// Warm up: eagerly import all page modules so their module-level cn() calls
// fire inside an ALS context and populate globalSSRRules before the first
// request is served.  After this completes the CSS set is stable.
await ssrStylesALS.run(new Set<string>(), async () => {
  for (const def of routeDefinitions) {
    try { await def.loader(); } catch { /* skip broken routes */ }
  }
});

const htmlTemplate = `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <!-- Blocking theme script: runs synchronously before first paint so there
         is no flash regardless of saved preference or system color scheme. -->
    <script>!function(){var t=localStorage.getItem('nuclo-theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',t);}();</script>
    <link rel="icon" type="image/svg+xml" href="/nuclo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Font preconnects -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <!-- JetBrains Mono — non-blocking; display=optional prevents CLS -->
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=optional" onload="this.rel='stylesheet'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&display=optional" /></noscript>

    {{seoHead}}

    <meta name="theme-color" content="#646cff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Nuclo" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />

    <!-- Global styles injected server-side -->
    <style id="nuclo-global">{{styles}}</style>
    <!-- cn() class styles — prevents layout shift before JS hydrates -->
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
    `<meta property="og:image" content="${SEO_BASE_URL}nuclo.svg" />`,
    '<meta property="og:image:alt" content="Nuclo framework logo" />',
    '<meta property="og:site_name" content="Nuclo" />',
    '<meta property="og:locale" content="en_US" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${SEO_BASE_URL}nuclo.svg" />`,
    '<meta name="twitter:creator" content="@dan2dev" />',
    '<meta name="twitter:site" content="@dan2dev" />',
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].filter(Boolean);

  return tags.join('\n    ');
}

// --- App handler (shared between dev and prod) ---

async function appFetch(
  req: Request,
  transformHtml: (template: string, url: string) => Promise<string>,
): Promise<Response> {
  const { pathname } = new URL(req.url);

  const route = pathname === '/' ? 'home' : pathname.replace(/^\/|\/+$/g, '');
  const known = routeMap.has(route);
  const renderRoute = known ? route : 'home';
  const status = known ? 200 : 404;

  const { result: element, rules: renderRules } = await withSSRStyles(() => ssrMatchRoute(renderRoute));
  const ssrHtml = renderToString(element);

  // Union of warm-up rules (module-level cn()) and this render's rules (component cn()).
  // After warm-up renderRules is a strict subset of globalSSRRules, so the Set union
  // is effectively free — just globalSSRRules serialised once.
  const nucloStyles = renderRules.size > globalSSRRules.size
    ? [...new Set([...globalSSRRules, ...renderRules])].join('\n')
    : [...globalSSRRules].join('\n');

  const seoHead = buildSeoHead(renderRoute, pathname, known);
  const html = (await transformHtml(htmlTemplate, known ? pathname : '/'))
    .replace('{{seoHead}}', seoHead)
    .replace('{{html}}', ssrHtml)
    .replace('{{styles}}', globalCss)
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

// --- Gzip compression ---

function shouldGzip(contentType: string): boolean {
  return /text\/|application\/(javascript|json|xml)|image\/svg/.test(contentType);
}

async function resolveProdDistDir(): Promise<string | null> {
  const candidates = [
    resolve(dirname(process.execPath), 'dist'),
    resolve(import.meta.dir, 'dist'),
    resolve(import.meta.dir, '../build/dist'),
    resolve(process.cwd(), 'dist'),
  ];

  for (const dir of candidates) {
    if (await Bun.file(resolve(dir, '.vite/manifest.json')).exists()) {
      return dir;
    }
  }

  return null;
}

async function gzipResponse(req: Request, res: Response): Promise<Response> {
  const acceptEncoding = req.headers.get('accept-encoding') ?? '';
  if (!acceptEncoding.includes('gzip')) return res;
  const contentType = res.headers.get('Content-Type') ?? '';
  if (!shouldGzip(contentType)) return res;

  const compressed = Bun.gzipSync(new Uint8Array(await res.arrayBuffer()));
  const headers = new Headers(res.headers);
  headers.set('Content-Encoding', 'gzip');
  headers.set('Vary', 'Accept-Encoding');
  headers.delete('Content-Length');

  return new Response(compressed, { status: res.status, headers });
}

// --- Production ---

if (isProd) {
  const distDir = await resolveProdDistDir();

  if (!distDir) {
    console.error("Could not find a built Vite manifest. Run 'pnpm build' first.");
    process.exit(1);
  }

  const manifestFile = Bun.file(resolve(distDir, '.vite/manifest.json'));

  const manifest: Record<string, { file: string; css?: string[]; imports?: string[] }> = JSON.parse(
    await manifestFile.text(),
  );
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

  const transformHtml = async (html: string) =>
    html.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);

  Bun.serve({
    port,
    async fetch(req) {
      const { pathname } = new URL(req.url);

      // Serve static assets from dist/.
      if (pathname !== '/' && pathname !== '/index.html') {
        const file = Bun.file(resolve(distDir, `.${pathname}`));
        if (await file.exists()) return gzipResponse(req, new Response(file));
      }

      return gzipResponse(req, await appFetch(req, transformHtml));
    },
  });

  console.log(`Server running at http://localhost:${port}`);
}

// --- Development ---

else {
  const { createServer } = await import('vite');

  const vite = await createServer({
    server: { port },
    appType: 'custom',
    plugins: [
      {
        name: 'ssr-dev',
        configureServer(server) {
          // Run after Vite's internal handlers (HMR, transforms, static).
          return () =>
            server.middlewares.use(async (nodeReq, nodeRes, next) => {
              try {
                const origin = `http://${nodeReq.headers.host ?? `localhost:${port}`}`;
                const req = new Request(`${origin}${nodeReq.url ?? '/'}`, {
                  method: nodeReq.method,
                  headers: nodeReq.headers as HeadersInit,
                });

                const res = await appFetch(req, (html, url) =>
                  server.transformIndexHtml(url, html),
                );

                nodeRes.writeHead(res.status, Object.fromEntries(res.headers.entries()));
                nodeRes.end(await res.text());
              } catch (e) {
                if (e instanceof Error) server.ssrFixStacktrace(e);
                next(e);
              }
            });
        },
      },
    ],
  });

  await vite.listen();
  vite.printUrls();
}
