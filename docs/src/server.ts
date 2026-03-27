// SSR import order: CSS stubs → polyfill → nuclo bootstrap → pages.
import './css-polyfill.ts';
import 'nuclo/polyfill';
import 'nuclo';
import { renderToString } from 'nuclo/ssr';
import { ssrMatchRoute } from './ssr-app.ts';
import { routeMap } from './route-definitions.ts';
import { globalCss } from './styles.ts';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);

const htmlTemplate = `<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/nuclo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta Tags -->
    <title>Nuclo - Imperative DOM Framework</title>
    <meta name="title" content="Nuclo - Imperative DOM Framework" />
    <meta name="description" content="Nuclo is a lightweight, imperative DOM framework with explicit update() calls. Build interactive web apps with plain functions, mutable state, and direct DOM rendering." />
    <meta name="keywords" content="nuclo, imperative dom framework, explicit updates, javascript, typescript, ui framework, dom library, direct dom rendering" />
    <meta name="author" content="Danilo Castro (@dan2dev)" />
    <meta name="language" content="English" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://nuclo.dan2.dev/" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://nuclo.dan2.dev/" />
    <meta property="og:title" content="Nuclo - Imperative DOM Framework" />
    <meta property="og:description" content="A lightweight, imperative DOM framework with explicit update() calls and direct DOM rendering." />
    <meta property="og:image" content="https://nuclo.dan2.dev/nuclo.svg" />
    <meta property="og:site_name" content="Nuclo" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://nuclo.dan2.dev/" />
    <meta name="twitter:title" content="Nuclo - Imperative DOM Framework" />
    <meta name="twitter:description" content="A lightweight, imperative DOM framework with explicit update() calls and direct DOM rendering." />
    <meta name="twitter:image" content="https://nuclo.dan2.dev/nuclo.svg" />
    <meta name="twitter:creator" content="@dan2dev" />
    <meta name="twitter:site" content="@dan2dev" />

    <!-- Additional Meta Tags -->
    <meta name="theme-color" content="#646cff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Nuclo" />

    <!-- Global styles injected server-side -->
    <style id="nuclo-global">{{styles}}</style>

    <script type="module" src="/src/main.ts"></script>
  </head>
  <body>
    <div id="app">{{html}}</div>
  </body>
</html>`;

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

  const html = (await transformHtml(htmlTemplate, known ? pathname : '/'))
    .replace('{{html}}', ssrHtml)
    .replace('{{styles}}', globalCss);

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// --- Gzip compression ---

function shouldGzip(contentType: string): boolean {
  return /text\/|application\/(javascript|json|xml)|image\/svg/.test(contentType);
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
  const manifestFile = Bun.file('dist/.vite/manifest.json');

  if (!(await manifestFile.exists())) {
    console.error("dist/.vite/manifest.json not found. Run 'pnpm build' first.");
    process.exit(1);
  }

  const manifest: Record<string, { file: string; css?: string[] }> = JSON.parse(
    await manifestFile.text(),
  );
  const entry = manifest['src/main.ts'];
  const cssLinks = (entry.css ?? [])
    .map((f) => `<link rel="stylesheet" href="/${f}" />`)
    .join('\n    ');
  const prodAssets = `${cssLinks}\n    <script type="module" src="/${entry.file}"></script>`;

  const transformHtml = async (html: string) =>
    html.replace('<script type="module" src="/src/main.ts"></script>', prodAssets);

  Bun.serve({
    port,
    async fetch(req) {
      const { pathname } = new URL(req.url);

      // Serve static assets from dist/.
      if (pathname !== '/' && pathname !== '/index.html') {
        const file = Bun.file(`dist${pathname}`);
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
