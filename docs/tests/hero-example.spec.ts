import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://localhost:5173" });

test("hero example keeps its local state and tabs interactive", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const count = demo.locator("[data-demo-count]");

  await expect(count).toHaveText("0");
  await demo.getByRole("button", { name: "+", exact: true }).click();
  await expect(count).toHaveText("1");
  await demo.getByRole("button", { name: "−", exact: true }).click();
  await expect(count).toHaveText("0");

  await demo.getByRole("button", { name: "Code", exact: true }).click();
  await expect(demo.getByRole("button", { name: "Preview", exact: true })).toBeVisible();
  await expect(demo.locator("[data-demo-pane='code']")).toBeVisible();

  await demo.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(demo.locator("[data-demo-pane='preview']")).toBeVisible();
  await expect(demo.getByRole("button", { name: "+", exact: true })).toBeVisible();
});
