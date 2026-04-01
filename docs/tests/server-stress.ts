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
const CONCURRENCY     = parseInt(process.env.CONCURRENCY     ?? "100",     10);
const REPORT_INTERVAL = parseInt(process.env.REPORT_INTERVAL ?? "10000",   10); // print stats every N requests

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
const statusCounts: Record<number, number> = {};

function randomRoute(): string {
  return ROUTES[Math.floor(Math.random() * ROUTES.length)];
}

async function sendRequest(): Promise<void> {
  const url   = `${HOST}${randomRoute()}`;
  const start = performance.now();
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
    }
    // consume body to free socket
    await res.arrayBuffer();
  } catch {
    failed++;
    const elapsed = performance.now() - start;
    totalMs += elapsed;
  } finally {
    completed++;
  }
}

function printReport(final = false): void {
  const avg   = completed > 0 ? (totalMs / completed).toFixed(2) : "—";
  const minR  = minMs === Infinity ? "—" : minMs.toFixed(2);
  const rps   = completed > 0
    ? (completed / ((performance.now() - startTime) / 1000)).toFixed(0)
    : "—";

  const label = final ? "FINAL" : "progress";
  console.log(
    `[${label}] completed=${completed}/${TOTAL_REQUESTS}  ok=${succeeded}  err=${failed}  ` +
    `avg=${avg}ms  min=${minR}ms  max=${maxMs.toFixed(2)}ms  rps=${rps}`
  );
  if (final) {
    console.log("status breakdown:", statusCounts);
  }
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
console.log("──────────────────────────────────────────────────────────");
printReport(true);
console.log(`total time: ${totalSec.toFixed(2)}s`);
