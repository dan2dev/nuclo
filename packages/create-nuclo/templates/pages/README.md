# Nuclo Pages app

A full-stack [Nuclo](https://nuclo.dev) app: file-based routing, server rendering with hydration, and server functions.

```bash
npm install
npm run dev
```

## Structure

```
src/app.html            the HTML shell (<!--nuclo:head--> and <!--nuclo:body-->)
src/pages/_layout.ts    wraps every page; stays mounted while you navigate
src/pages/_error.ts     404s and errors thrown by load()
src/pages/index.ts      /        (load + a server function)
src/pages/about.ts      /about   (prerendered at build time)
src/pages/api/hello.ts  /api/hello (an API route)
src/server/counter.ts   $server() functions
```

- `src/pages/blog/[slug].ts` → `/blog/:slug`, `src/pages/docs/[...path].ts` → catch-all,
  `src/pages/(group)/x.ts` → `/x`. Files and folders starting with `_` are private.
- A page exports a view (`default`), and optionally `load`, `head` and `prerender`.
- `src/routes.gen.d.ts` is generated: it types route ids for `href()`, `LoadEvent` and `PageProps`.

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server with SSR |
| `npm run build` | Client + server build into `dist/`, prerendered pages included |
| `npm start` | Run the built server (`PORT`, `HOST`) |
| `npm run preview` | Preview the build through Vite |

## Deploying

The adapter is set in `vite.config.ts`:

- **Node** (default): `node dist/server/index.mjs`.
- **Bun**: `nucloPages({ adapter: "bun" })`, then `bun dist/server/index.mjs`.
- **Cloudflare Workers**: install `@cloudflare/vite-plugin` and `wrangler`, then:

  ```ts
  // vite.config.ts
  import { cloudflare } from "@cloudflare/vite-plugin";
  export default defineConfig({
    plugins: [nucloPages({ adapter: "cloudflare" }), cloudflare({ viteEnvironment: { name: "ssr" } })],
  });
  ```

  ```jsonc
  // wrangler.jsonc
  { "name": "my-app", "main": "./src/worker.ts", "compatibility_date": "2026-09-01", "compatibility_flags": ["nodejs_als"] }
  ```

  ```ts
  // src/worker.ts
  import handler from "virtual:nuclo-pages/handler";
  export default { fetch: (request: Request, env: unknown, ctx: unknown) => handler(request, { env, ctx }) };
  ```

  `vite dev` and `vite preview` then run in workerd; deploy with `wrangler deploy`.
