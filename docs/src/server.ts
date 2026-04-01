// SSR import order: CSS stubs → polyfill → nuclo bootstrap → pages.
import './css-polyfill.ts';
import 'nuclo/polyfill';
import 'nuclo';
import { renderToString } from 'nuclo/ssr';
import { dirname, resolve } from 'node:path';
import { ssrMatchRoute } from './ssr-app.ts';
import { routeMap } from './route-definitions.ts';
import { SEO_BASE_URL, generateStructuredData, getMetaForRoute } from './seo.ts';
import { globalCss } from './styles.ts';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);

const htmlTemplate = `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/nuclo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    {{seoHead}}

    <meta name="theme-color" content="#646cff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Nuclo" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />

    <!-- Global styles injected server-side -->
    <style id="nuclo-global">{{styles}}</style>

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

  const element = await ssrMatchRoute(renderRoute);
  const ssrHtml = renderToString(element);

  const seoHead = buildSeoHead(renderRoute, pathname, known);
  const html = (await transformHtml(htmlTemplate, known ? pathname : '/'))
    .replace('{{seoHead}}', seoHead)
    .replace('{{html}}', ssrHtml)
    .replace('{{styles}}', globalCss);

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
