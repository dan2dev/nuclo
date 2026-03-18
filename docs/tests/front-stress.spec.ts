/// <reference types="node" />

import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Sample = {
  round: number;
  route: string;
  navMs: number;
  clickOps: number;
  heapUsedMB: number | null;
  timestamp: string;
};

type RoundSummary = {
  round: number;
  navAvgMs: number;
  navP95Ms: number;
  heapAvgMB: number | null;
  heapMaxMB: number | null;
  clicks: number;
  failures: number;
};

type StressReport = {
  config: {
    rounds: number;
    clicksPerPage: number;
    strictMode: boolean;
    degradeThresholdPct: number;
    leakThresholdMB: number;
  };
  generatedAt: string;
  samples: Sample[];
  roundSummaries: RoundSummary[];
  aggregates: {
    totalNavigations: number;
    totalClicks: number;
    totalExampleInteractions: number;
    totalTodoItemsAdded: number;
    failures: number;
    firstHalfNavAvgMs: number;
    secondHalfNavAvgMs: number;
    navDegradationPct: number;
    firstHeapMB: number | null;
    lastHeapMB: number | null;
    heapGrowthMB: number | null;
  };
  errors: {
    pageErrors: string[];
    requestFailures: string[];
    navigationFailures: string[];
  };
};

type InteractionStats = {
  exampleInteractions: number;
  todoItemsAdded: number;
};

const rounds = readInt("STRESS_ROUNDS", 12);
const durationMs = readInt("STRESS_DURATION_MS", 0); // 0 = use rounds; >0 = run for this duration
const clicksPerPage = readInt("STRESS_CLICKS_PER_PAGE", 14);
const strictMode = (process.env.STRESS_STRICT ?? "false").toLowerCase() === "true";
const degradeThresholdPct = readFloat("STRESS_DEGRADE_THRESHOLD_PCT", 35);
const leakThresholdMB = readFloat("STRESS_LEAK_THRESHOLD_MB", 70);

const artifactsDir = join(process.cwd(), "test-results", "stress");

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asMB(value: number | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Number.parseFloat((value / 1024 / 1024).toFixed(2));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[idx] ?? 0;
}

async function waitForSPAContent(
  page: import("@playwright/test").Page,
  urlPath: string,
): Promise<void> {
  await page.waitForFunction(
    (args: { path: string; loadingText: string }) => {
      if (window.location.pathname !== args.path) return false;
      const container = document.querySelector("#page-container");
      if (!container || container.children.length === 0) return false;
      return !(container.textContent ?? "").includes(args.loadingText);
    },
    { path: urlPath, loadingText: "Loading..." },
    { timeout: 8000 },
  );
}

async function navigateViaClick(
  page: import("@playwright/test").Page,
  urlPath: string,
): Promise<void> {
  let link = page.locator(`a[href="${urlPath}"]`).first();

  if ((await link.count()) === 0 && urlPath.startsWith("/examples/")) {
    // Example sub-pages are only linked from /examples — navigate there first via click
    await page.locator('a[href="/examples"]').first().click({ timeout: 3000 });
    await waitForSPAContent(page, "/examples");
    link = page.locator(`a[href="${urlPath}"]`).first();
  }

  if ((await link.count()) === 0) {
    throw new Error(`No link found for path: ${urlPath}`);
  }

  await link.scrollIntoViewIfNeeded();
  await link.click({ timeout: 3000 });
  await waitForSPAContent(page, urlPath);
}

async function getInternalRoutes(baseURL: string, page: import("@playwright/test").Page): Promise<string[]> {
  const routes = await page.evaluate(() => {
    const out = new Set<string>();
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
    for (const link of links) {
      const href = link.href;
      if (!href) continue;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) continue;
        if (url.hash) continue;
        const clean = `${url.pathname}${url.search}`;
        out.add(clean);
      } catch {
        // ignore malformed href
      }
    }
    return Array.from(out);
  });

  const normalized = routes
    .map((route) => route.trim())
    .filter((route) => route.length > 0)
    .map((route) => {
      try {
        const absolute = new URL(route, baseURL);
        return `${absolute.pathname}${absolute.search}`;
      } catch {
        return route;
      }
    });

  const unique = Array.from(new Set(normalized));
  if (unique.length === 0) {
    throw new Error("Nenhum link interno foi encontrado para stress.");
  }
  return unique;
}

async function spamClicks(
  page: import("@playwright/test").Page,
  totalClicks: number,
  baseOrigin: string
): Promise<number> {
  let clickOps = 0;
  const clickSelector = [
    "button",
    "[role='button']",
    "input[type='checkbox']",
    "input[type='radio']",
    // Only internal same-origin links are eligible for stress clicks.
    `a[href^='/']`,
    `a[href^='./']`,
    `a[href^='../']`,
    `a[href^='?']`,
    `a[href^='${baseOrigin}']`,
  ].join(", ");

  for (let i = 0; i < totalClicks; i += 1) {
    const count = await page.locator(clickSelector).count();
    if (count === 0) return clickOps;
    const targetIndex = i % count;
    const target = page.locator(clickSelector).nth(targetIndex);
    try {
      await target.click({ timeout: 1500, force: true });
      clickOps += 1;
      await page.waitForTimeout(30);
    } catch {
      // Ignore interaction failures to keep pressure on the app.
    }
  }
  return clickOps;
}

async function runExampleScenario(
  page: import("@playwright/test").Page,
  route: string,
  round: number
): Promise<InteractionStats> {
  const stats: InteractionStats = { exampleInteractions: 0, todoItemsAdded: 0 };

  if (route.includes("/examples/todo")) {
    const todoInput = page.getByPlaceholder("Add a new task...").first();
    if (await todoInput.isVisible().catch(() => false)) {
      const taskText = `stress-task-r${round}-${Date.now()}`;
      await todoInput.fill(taskText);
      await page.getByRole("button", { name: "Add Task" }).first().click();
      await expect(page.getByText(taskText).first()).toBeVisible({ timeout: 3000 });
      stats.exampleInteractions += 1;
      stats.todoItemsAdded += 1;
    }
    return stats;
  }

  if (route.includes("/examples/counter")) {
    const plusButton = page.getByRole("button", { name: "+" }).first();
    if (await plusButton.isVisible().catch(() => false)) {
      await plusButton.click();
      await plusButton.click();
      await page.getByRole("button", { name: "Reset" }).first().click();
      stats.exampleInteractions += 1;
    }
    return stats;
  }

  if (route.includes("/examples/forms")) {
    const username = page.getByPlaceholder("Enter username").first();
    if (await username.isVisible().catch(() => false)) {
      await username.fill(`stress_user_${round}`);
      await page.getByPlaceholder("Enter email").first().fill(`stress_${round}@example.dev`);
      await page.getByPlaceholder("Enter password").first().fill("abc12345");
      await page.getByPlaceholder("Confirm password").first().fill("abc12345");
      await page.getByRole("button", { name: "Sign Up" }).first().click();
      await expect(page.getByText("Account created successfully!").first()).toBeVisible({ timeout: 4000 });
      stats.exampleInteractions += 1;
    }
    return stats;
  }

  if (route.includes("/examples/subtasks")) {
    const subtaskInput = page.getByPlaceholder("Add a new task...").first();
    if (await subtaskInput.isVisible().catch(() => false)) {
      const text = `parent-task-r${round}-${Date.now()}`;
      await subtaskInput.fill(text);
      await page.getByRole("button", { name: "Add Task" }).first().click();
      await expect(page.getByText(text).first()).toBeVisible({ timeout: 3000 });
      stats.exampleInteractions += 1;
    }
    return stats;
  }

  return stats;
}

test.describe("Front stress", () => {
  test("navega e interage em loop sob carga", async ({ page, baseURL, browserName }) => {
    test.skip(browserName !== "chromium", "Stress de memória depende do Chromium.");

    const errors = {
      pageErrors: [] as string[],
      requestFailures: [] as string[],
      navigationFailures: [] as string[],
    };

    page.on("pageerror", (error) => {
      errors.pageErrors.push(error.message);
    });

    page.on("requestfailed", (request) => {
      const failure = request.failure();
      errors.requestFailures.push(`${request.method()} ${request.url()} :: ${failure?.errorText ?? "unknown"}`);
    });

    const initialPath = "/";
    await page.goto(initialPath, { waitUntil: "domcontentloaded" });

    const base = baseURL ?? "http://127.0.0.1:4173";
    const baseOrigin = new URL(base).origin;
    const externalNavigations: string[] = [];

    page.on("framenavigated", (frame) => {
      if (frame !== page.mainFrame()) return;
      const url = frame.url();
      if (!url || url === "about:blank") return;
      try {
        if (new URL(url).origin !== baseOrigin) {
          externalNavigations.push(url);
        }
      } catch {
        // ignore malformed URL
      }
    });

    page.on("popup", async (popup) => {
      try {
        await popup.close();
      } catch {
        // ignore popup close failures
      }
    });

    const routes = await getInternalRoutes(base, page);
    const scenarioRoutes = [
      "/examples/todo",
      "/examples/counter",
      "/examples/forms",
      "/examples/subtasks",
    ];
    const mergedRoutes = Array.from(new Set([...routes, ...scenarioRoutes]));

    const samples: Sample[] = [];
    const roundSummaries: RoundSummary[] = [];
    let totalExampleInteractions = 0;
    let totalTodoItemsAdded = 0;

    const deadline = durationMs > 0 ? Date.now() + durationMs : null;
    const maxRounds = deadline !== null ? Number.MAX_SAFE_INTEGER : rounds;

    for (let round = 1; round <= maxRounds; round += 1) {
      if (deadline !== null && Date.now() >= deadline) break;
      const roundNavDurations: number[] = [];
      const roundHeap: number[] = [];
      let roundClicks = 0;
      let roundFailures = 0;

      for (const route of mergedRoutes) {
        const navStarted = performance.now();
        try {
          await navigateViaClick(page, route);
        } catch (error) {
          roundFailures += 1;
          errors.navigationFailures.push(`${route} :: ${(error as Error).message}`);
          continue;
        }
        const navMs = performance.now() - navStarted;
        roundNavDurations.push(navMs);

        const heapUsed = await page.evaluate(() => {
          const anyPerf = performance as typeof performance & {
            memory?: {
              usedJSHeapSize?: number;
            };
          };
          return anyPerf.memory?.usedJSHeapSize;
        });

        const heapUsedMB = asMB(heapUsed);
        if (typeof heapUsedMB === "number") {
          roundHeap.push(heapUsedMB);
        }

        try {
          const interactionStats = await runExampleScenario(page, route, round);
          totalExampleInteractions += interactionStats.exampleInteractions;
          totalTodoItemsAdded += interactionStats.todoItemsAdded;
        } catch {
          roundFailures += 1;
        }

        const clickOps = await spamClicks(page, clicksPerPage, baseOrigin);
        roundClicks += clickOps;

        samples.push({
          round,
          route,
          navMs: Number.parseFloat(navMs.toFixed(2)),
          clickOps,
          heapUsedMB,
          timestamp: new Date().toISOString(),
        });
      }

      roundSummaries.push({
        round,
        navAvgMs: Number.parseFloat(average(roundNavDurations).toFixed(2)),
        navP95Ms: Number.parseFloat(p95(roundNavDurations).toFixed(2)),
        heapAvgMB: roundHeap.length ? Number.parseFloat(average(roundHeap).toFixed(2)) : null,
        heapMaxMB: roundHeap.length ? Number.parseFloat(Math.max(...roundHeap).toFixed(2)) : null,
        clicks: roundClicks,
        failures: roundFailures,
      });
    }

    const navAll = samples.map((sample) => sample.navMs);
    const mid = Math.max(1, Math.floor(navAll.length / 2));
    const firstHalf = navAll.slice(0, mid);
    const secondHalf = navAll.slice(mid);

    const firstHalfNavAvgMs = Number.parseFloat(average(firstHalf).toFixed(2));
    const secondHalfNavAvgMs = Number.parseFloat(average(secondHalf).toFixed(2));

    const navDegradationPct =
      firstHalfNavAvgMs > 0
        ? Number.parseFloat((((secondHalfNavAvgMs - firstHalfNavAvgMs) / firstHalfNavAvgMs) * 100).toFixed(2))
        : 0;

    const heapSeries = roundSummaries.map((summary) => summary.heapAvgMB).filter((value): value is number => value != null);
    const firstHeapMB = heapSeries.length ? heapSeries[0] : null;
    const lastHeapMB = heapSeries.length ? heapSeries[heapSeries.length - 1] : null;
    const heapGrowthMB =
      firstHeapMB != null && lastHeapMB != null ? Number.parseFloat((lastHeapMB - firstHeapMB).toFixed(2)) : null;

    const totalClicks = roundSummaries.reduce((acc, summary) => acc + summary.clicks, 0);
    const failures =
      errors.pageErrors.length + errors.requestFailures.length + errors.navigationFailures.length;

    const report: StressReport = {
      config: {
        rounds,
        clicksPerPage,
        strictMode,
        degradeThresholdPct,
        leakThresholdMB,
      },
      generatedAt: new Date().toISOString(),
      samples,
      roundSummaries,
      aggregates: {
        totalNavigations: samples.length,
        totalClicks,
        totalExampleInteractions,
        totalTodoItemsAdded,
        failures,
        firstHalfNavAvgMs,
        secondHalfNavAvgMs,
        navDegradationPct,
        firstHeapMB,
        lastHeapMB,
        heapGrowthMB,
      },
      errors,
    };

    mkdirSync(artifactsDir, { recursive: true });
    const reportPath = join(artifactsDir, "front-stress-report.json");
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");

    console.log(`\n[stress] rounds=${rounds} routes=${mergedRoutes.length} samples=${samples.length}`);
    console.log(
      `[stress] nav avg first-half=${firstHalfNavAvgMs}ms second-half=${secondHalfNavAvgMs}ms degradation=${navDegradationPct}%`
    );
    console.log(
      `[stress] heap first=${firstHeapMB ?? "n/a"}MB last=${lastHeapMB ?? "n/a"}MB growth=${heapGrowthMB ?? "n/a"}MB`
    );
    console.log(`[stress] totalClicks=${totalClicks} failures=${failures}`);
    console.log(`[stress] exampleInteractions=${totalExampleInteractions} todoItemsAdded=${totalTodoItemsAdded}`);
    console.log(`[stress] report=${reportPath}`);

    expect(samples.length).toBeGreaterThan(0);
    expect(totalExampleInteractions).toBeGreaterThan(0);
    expect(totalTodoItemsAdded).toBeGreaterThan(0);
    expect(errors.pageErrors.length).toBe(0);
    expect(errors.navigationFailures.length).toBe(0);
    expect(externalNavigations.length).toBe(0);

    if (strictMode) {
      expect(navDegradationPct).toBeLessThanOrEqual(degradeThresholdPct);
      if (heapGrowthMB != null) {
        expect(heapGrowthMB).toBeLessThanOrEqual(leakThresholdMB);
      }
      expect(errors.requestFailures.length).toBe(0);
    }
  });
});
