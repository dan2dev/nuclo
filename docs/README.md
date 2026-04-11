# nuclo docs

Documentation site for Nuclo, built with Vite and Nuclo itself.

## Scripts

Run these commands inside `nuclo/docs`:

```bash
bun dev
bun run build
bun run preview
bun run stress:front
```

## Front stress test (Playwright)

This project includes a browser stress scenario that rapidly navigates internal pages and clicks interactive elements repeatedly.

```bash
# one-time setup for browser binary
bunx playwright install chromium

# regular stress run
bun run stress:front

# visible browser window while stressing
make stress-ui

# strict assertions for degradation/leak thresholds
bun run stress:front:strict
```

Artifacts:

- JSON report: `test-results/stress/front-stress-report.json`
- HTML report: `playwright-report/stress/index.html`

Supported environment variables:

- `STRESS_ROUNDS` (default: `12`)
- `STRESS_CLICKS_PER_PAGE` (default: `14`)
- `STRESS_BASE_URL` (default: `http://127.0.0.1:4173`)
- `STRESS_STRICT` (`true` or `false`, default: `false`)
- `STRESS_DEGRADE_THRESHOLD_PCT` (default: `35`)
- `STRESS_LEAK_THRESHOLD_MB` (default: `70`)
- `STRESS_LIVE_LOG_EVERY_ROUTES` (default: `5`, front stress live progress frequency)

Server stress test env vars:

- `TOTAL_REQUESTS` (default: `10000`)
- `CONCURRENCY` (default: `100`)
- `REPORT_INTERVAL` (default: `1000`, prints full snapshot every N completed requests)
- `LIVE_INTERVAL_MS` (default: `1000`, updates live single-line terminal progress)

Example heavier run:

```bash
STRESS_ROUNDS=40 STRESS_CLICKS_PER_PAGE=30 bun run stress:front
```

## Notes

- This package depends on the local workspace package `../packages/nuclo-core`.
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
