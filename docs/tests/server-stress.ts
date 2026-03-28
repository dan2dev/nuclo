#!/usr/bin/env bun
/**
 * server-stress.ts
 *
 * Sends TOTAL_REQUESTS HTTP GET requests to the production server,
 * picking a random route on every request.
 *
 * Usage:
 *   bun tests/server-stress.ts
 *   TOTAL_REQUESTS=500000 CONCURRENCY=200 HOST=http://localhost:5173 bun tests/server-stress.ts
 */

const HOST            = process.env.HOST             ?? "http://localhost:5173";
const TOTAL_REQUESTS  = parseInt(process.env.TOTAL_REQUESTS  ?? "1000000", 10);
const CONCURRENCY     = parseInt(process.env.CONCURRENCY     ?? "1000",     10);
const REPORT_INTERVAL = parseInt(process.env.REPORT_INTERVAL ?? "1000",   10); // print stats every N requests
const LIVE_INTERVAL_MS = parseInt(process.env.LIVE_INTERVAL_MS ?? "1000", 10);

const ROUTES = [
  "/",
  "/home",
  "/getting-started",
  "/core-api",
  "/tag-builders",
  "/styling",
  "/pitfalls",
  "/examples",
  "/examples/counter",
  "/examples/todo",
  "/examples/subtasks",
  "/examples/search",
  "/examples/async",
  "/examples/forms",
  "/examples/nested",
  "/examples/animations",
  "/examples/routing",
  "/examples/styled-card",
];

// ── stats ──────────────────────────────────────────────────────────────────
let completed  = 0;
let succeeded  = 0;
let failed     = 0;
let totalMs    = 0;
let minMs      = Infinity;
let maxMs      = 0;
let inFlight   = 0;
const statusCounts: Record<number, number> = {};
const failureSamples: string[] = [];

function randomRoute(): string {
  return ROUTES[Math.floor(Math.random() * ROUTES.length)];
}

async function sendRequest(): Promise<void> {
  const route = randomRoute();
  const url   = `${HOST}${route}`;
  const start = performance.now();
  inFlight++;
  try {
    const res    = await fetch(url, { redirect: "follow" });
    const elapsed = performance.now() - start;

    totalMs += elapsed;
    if (elapsed < minMs) minMs = elapsed;
    if (elapsed > maxMs) maxMs = elapsed;

    statusCounts[res.status] = (statusCounts[res.status] ?? 0) + 1;

    if (res.status >= 200 && res.status < 400) {
      succeeded++;
    } else {
      failed++;
      if (failureSamples.length < 8) {
        failureSamples.push(`${route} => HTTP ${res.status}`);
      }
    }
    // consume body to free socket
    await res.arrayBuffer();
  } catch (error) {
    failed++;
    const elapsed = performance.now() - start;
    totalMs += elapsed;
    if (failureSamples.length < 8) {
      const message = error instanceof Error ? error.message : String(error);
      failureSamples.push(`${route} => network error: ${message}`);
    }
  } finally {
    completed++;
    inFlight--;
  }
}

function printReport(final = false): void {
  const avg   = completed > 0 ? (totalMs / completed).toFixed(2) : "—";
  const minR  = minMs === Infinity ? "—" : minMs.toFixed(2);
  const elapsedSec = (performance.now() - startTime) / 1000;
  const rps   = elapsedSec > 0
    ? (completed / elapsedSec).toFixed(0)
    : "—";
  const etaSec = completed > 0 && elapsedSec > 0
    ? Math.max(0, (TOTAL_REQUESTS - completed) / (completed / elapsedSec))
    : Infinity;
  const eta = Number.isFinite(etaSec) ? `${etaSec.toFixed(1)}s` : "—";

  const label = final ? "FINAL" : "progress";
  console.log(
    `[${label}] completed=${completed}/${TOTAL_REQUESTS}  inFlight=${inFlight}  ok=${succeeded}  err=${failed}  ` +
    `avg=${avg}ms  min=${minR}ms  max=${maxMs.toFixed(2)}ms  rps=${rps}  eta=${eta}`
  );
  if (final) {
    console.log("status breakdown:", statusCounts);
    if (failureSamples.length > 0) {
      console.log("failure samples:");
      for (const sample of failureSamples) {
        console.log(`  - ${sample}`);
      }
    }
  }
}

function printLiveLine(): void {
  const elapsedSec = (performance.now() - startTime) / 1000;
  const pct = ((completed / TOTAL_REQUESTS) * 100).toFixed(1);
  const rps = elapsedSec > 0 ? (completed / elapsedSec).toFixed(0) : "0";
  const avg = completed > 0 ? (totalMs / completed).toFixed(1) : "—";
  const etaSec = completed > 0 && elapsedSec > 0
    ? Math.max(0, (TOTAL_REQUESTS - completed) / (completed / elapsedSec))
    : Infinity;
  const eta = Number.isFinite(etaSec) ? `${etaSec.toFixed(1)}s` : "—";
  const line =
    `\r[live] ${pct}% ${completed}/${TOTAL_REQUESTS} | inFlight=${inFlight} | ok=${succeeded} err=${failed} ` +
    `| rps=${rps} | avg=${avg}ms | eta=${eta}`;
  process.stdout.write(line);
}

// ── main ───────────────────────────────────────────────────────────────────
console.log(`Stress-testing ${HOST}`);
console.log(`  routes      : ${ROUTES.length}`);
console.log(`  total req   : ${TOTAL_REQUESTS.toLocaleString()}`);
console.log(`  concurrency : ${CONCURRENCY}`);
console.log(`  report every: ${REPORT_INTERVAL.toLocaleString()} requests`);
console.log("──────────────────────────────────────────────────────────");

const startTime = performance.now();
let nextReport  = REPORT_INTERVAL;
let queued      = 0;
let liveTimer: ReturnType<typeof setInterval> | null = null;

if (LIVE_INTERVAL_MS > 0) {
  liveTimer = setInterval(() => {
    printLiveLine();
  }, LIVE_INTERVAL_MS);
}

// Pool-based concurrency: keep CONCURRENCY slots busy until all requests done.
await new Promise<void>((resolve) => {
  let settling = CONCURRENCY;

  function schedule(): void {
    while (queued < TOTAL_REQUESTS && (queued - completed) < CONCURRENCY) {
      queued++;
      sendRequest().then(() => {
        // progress report
        if (completed >= nextReport) {
          printReport();
          nextReport += REPORT_INTERVAL;
        }
        if (completed >= TOTAL_REQUESTS) {
          resolve();
        } else {
          schedule();
        }
      });
    }
  }

  schedule();
});

const totalSec = (performance.now() - startTime) / 1000;
if (liveTimer) {
  clearInterval(liveTimer);
  process.stdout.write("\n");
}
console.log("──────────────────────────────────────────────────────────");
printReport(true);
console.log(`total time: ${totalSec.toFixed(2)}s`);

export {};
