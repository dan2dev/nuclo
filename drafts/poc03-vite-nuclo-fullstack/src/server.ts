// SSR setup — polyfills before Nuclo runtime, Nuclo before page imports.
import '../../../packages/v0.1/src/polyfill/index.ts';
import '../../../packages/v0.1/src/core/runtimeBootstrap.ts';
import { renderToString } from '../../../packages/v0.1/src/ssr/renderToString.ts';
import { matchRoute } from './router.ts';

const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5173);

const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>poc03</title>
  </head>
  <body>
    <div id="app">{{html}}</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

// --- App handler (shared between dev and prod) ---

async function appFetch(
  req: Request,
  transformHtml: (template: string, url: string) => Promise<string>,
): Promise<Response> {
  const { pathname } = new URL(req.url);

  // Only handle page routes (assets/API handled elsewhere).
  const ssrHtml = renderToString(matchRoute(pathname));
  const html = (await transformHtml(htmlTemplate, pathname)).replace('{{html}}', ssrHtml);

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

// --- Production ---

if (isProd) {
  const manifestFile = Bun.file('dist/.vite/manifest.json');

  if (!(await manifestFile.exists())) {
    console.error("dist/.vite/manifest.json not found. Run 'bun run build' first.");
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
        if (await file.exists()) return new Response(file);
      }

      return appFetch(req, transformHtml);
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
