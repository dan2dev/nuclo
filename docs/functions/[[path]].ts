/**
 * Cloudflare Pages Function - SSR catch-all.
 *
 * Cloudflare only invokes this for requests that don't match a static file
 * already present in the deployed output (`build/dist`), so every real
 * asset (JS bundles, favicons, ...) is served directly by Pages and never
 * reaches this handler. Everything else (page routes, unknown paths for the
 * 404 SSR fallback) is rendered here with the same `appFetch` used by the
 * Bun server in src/server.ts - see src/app-handler.ts for the shared logic.
 *
 * Deploy with: bun run build && wrangler pages deploy build/dist
 * (run from nuclo/docs - Wrangler picks up this functions/ directory from
 * the project root, separately from the --project-dir output path).
 */
import 'nuclo/polyfill';
import 'nuclo';
import { appFetch, buildProdTransform, type ViteManifest } from '../src/app-handler.ts';
import { routeDefinitions } from '../src/route-definitions.ts';
import { registerGlobalStyles } from '../src/styles.ts';

interface Env {
  ASSETS: { fetch(input: Request | string): Promise<Response> };
}

registerGlobalStyles();

// Warm up once per isolate: eagerly import all page modules so their
// module-level css() calls populate the style registry before the first
// request is served (mirrors the Bun server's startup warm-up).
let warmUp: Promise<void> | null = null;
function ensureWarm(): Promise<void> {
  if (!warmUp) {
    warmUp = (async () => {
      for (const def of routeDefinitions) {
        try { await def.loader(); } catch { /* skip broken routes */ }
      }
    })();
  }
  return warmUp;
}

// Cache the manifest (and derived transform) for the lifetime of the
// isolate - it's static per deployment.
let transformPromise: Promise<(html: string, url: string) => Promise<string>> | null = null;
function getTransform(env: Env, origin: string) {
  if (!transformPromise) {
    transformPromise = env.ASSETS.fetch(`${origin}/.vite/manifest.json`)
      .then((res) => res.json() as Promise<ViteManifest>)
      .then((manifest) => buildProdTransform(manifest));
  }
  return transformPromise;
}

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  await ensureWarm();
  const { request, env } = context;
  const transform = await getTransform(env, new URL(request.url).origin);
  return appFetch(request, transform);
};
