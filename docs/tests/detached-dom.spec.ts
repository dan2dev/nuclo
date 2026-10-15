import { test, expect } from "@playwright/test";
import { APP_DEMO_SOURCES } from "../src/generated/app-demo-sources.ts";

// Closing an app example must free its DOM. One module-level reference to any
// of its elements, or a closure over one, keeps the whole closed page alive:
// the JS heap barely moves, so the stress test's heap threshold misses it.
test("closed app examples leave no DOM behind", async ({ page }) => {
  test.setTimeout(120_000);
  const cdp = await page.context().newCDPSession(page);
  const go = async (path: string) => {
    await page.evaluate((p) => { const a = document.createElement("a"); a.href = p; document.body.append(a); a.click(); a.remove(); }, path);
    await page.waitForURL((url) => url.pathname === path);
    await page.waitForTimeout(500);
  };
  const domNodes = async () => {
    await cdp.send("HeapProfiler.collectGarbage");
    return (await cdp.send("Memory.getDOMCounters")).nodes;
  };

  await page.goto("/", { waitUntil: "networkidle" });
  const baseline = await domNodes();
  for (const id of Object.keys(APP_DEMO_SOURCES)) {
    await go(`/examples/${id}`);
    await go("/");
    // Polled: an app may tear down after an async step (three.js arriving late).
    await expect.poll(domNodes, { message: `/examples/${id} left nodes behind`, timeout: 10_000 }).toBeLessThanOrEqual(baseline + 50);
  }
});
