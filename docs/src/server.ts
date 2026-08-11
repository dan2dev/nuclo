import 'nuclo/polyfill';
import 'nuclo';
import { dirname, resolve } from 'node:path';
import { appFetch, buildProdTransform, type ViteManifest } from './app-handler.ts';
import { routeDefinitions } from './route-definitions.ts';
import { registerGlobalStyles } from './styles.ts';

const isProd = process.env.NODE_ENV === 'production';
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 5173);

registerGlobalStyles();

// Warm up: eagerly import all page modules so their module-level css() calls
// populate the style registry before the first request is served. After this
// completes the CSS set is stable and getCssText() returns the full sheet.
for (const def of routeDefinitions) {
  try { await def.loader(); } catch { /* skip broken routes */ }
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
    console.error("Could not find a built Vite manifest. Run 'bun run build' first.");
    process.exit(1);
  }

  const manifestFile = Bun.file(resolve(distDir, '.vite/manifest.json'));
  const manifest: ViteManifest = JSON.parse(await manifestFile.text());
  const transformHtml = buildProdTransform(manifest);

  Bun.serve({
    hostname: host,
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
    server: { host, port },
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
