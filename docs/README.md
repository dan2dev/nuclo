# nuclo docs

Documentation site for Nuclo, built with Vite and Nuclo itself.

## Scripts

Run these commands inside `nuclo/docs`:

```bash
pnpm dev
pnpm build
pnpm preview
```

## Notes

- This package depends on the local workspace package `../packages/v0.1`.
- Routing is handled in [`src/router.ts`](./src/router.ts) and [`src/routes.ts`](./src/routes.ts).
- Pages live in [`src/pages`](./src/pages) and shared UI lives in [`src/components`](./src/components).
- Static assets are served from [`public`](./public).

## Structure

```text
docs/
├── public/        # static assets
├── src/
│   ├── components/
│   ├── content/
│   ├── pages/
│   ├── main.ts
│   ├── router.ts
│   ├── routes.ts
│   └── styles.ts
├── index.html
├── package.json
└── vite.config.ts
```
