import { expect, test } from "@playwright/test";

test("hero example keeps its local state with preview and code visible", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const count = demo.locator("[data-demo-count]");

  await expect(count).toHaveText("0");
  await demo.getByRole("button", { name: "+", exact: true }).click();
  await expect(count).toHaveText("1");
  await demo.getByRole("button", { name: "−", exact: true }).click();
  await expect(count).toHaveText("0");

  await expect(demo.locator("[data-demo-pane='preview']")).toBeVisible();
  await expect(demo.locator("[data-demo-pane='code']")).toBeVisible();
  await expect(demo.locator("[data-demo-label]")).toHaveCount(0);
  await expect(demo.locator("[data-demo-tab]")).toHaveCount(0);
});
