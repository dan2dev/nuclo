# poc02 — Full-Stack HTML Rendering POC

Proof of concept for server-side HTML rendering using Bun + Vite, with no `index.html` on disk. The HTML template lives in `src/server.ts` and is rendered dynamically on every request.

## How it works

- **Dev** — Bun runs `src/server.ts`, which starts a Vite dev server in middleware mode. Vite transforms the HTML template (injects HMR client, processes `src/main.ts` on the fly).
- **Prod** — Vite builds `src/main.ts` into hashed assets under `dist/`. Bun reads `dist/.vite/manifest.json` to resolve filenames and injects the correct `<script>` and `<link>` tags into the template at request time.

## Commands

```bash
bun dev      # dev server with HMR at http://localhost:5173
bun run build    # type-check + build assets into dist/
bun run preview  # build then serve production at http://localhost:5173
bun run start    # serve production (requires prior build)
```
