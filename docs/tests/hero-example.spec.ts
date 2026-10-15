import { expect, test } from "@playwright/test";

test("hero playground: painting mutates state, update() patches the DOM", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const stateCell = demo.locator("[data-cell='state-0']");
  const domCell = demo.locator("[data-cell='dom-0']");

  await expect(stateCell).toHaveAttribute("data-on", "false");
  await stateCell.click();
  await expect(stateCell).toHaveAttribute("data-on", "true");
  await expect(domCell).toHaveAttribute("data-on", "false"); // mutated, not rendered

  await demo.getByRole("button", { name: /^update\(\)/ }).click();
  await expect(domCell).toHaveAttribute("data-on", "true");
  await expect(demo.locator("[data-demo-pending]")).toBeHidden();

  await expect(demo.locator("[data-demo-pane='preview']")).toBeVisible();
  await expect(demo.locator("[data-demo-pane='code']")).toBeVisible();
});

test("hero card: arrows move through the examples and keep their state", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const next = demo.getByRole("button", { name: "Next example" });
  const prev = demo.getByRole("button", { name: "Previous example" });

  // Paint a cell, leave, come back: the mutation is still pending
  await demo.locator("[data-cell='state-3']").click();
  await next.click();
  await expect(demo).toContainText("Drag the orb");
  await expect(demo.locator("[data-cell='state-3']")).toHaveCount(0);
  await prev.click();
  await expect(demo.locator("[data-cell='state-3']")).toHaveAttribute("data-on", "true");

  // Wrap around backwards to the last example and forwards to the first
  await prev.click();
  await expect(demo).toContainText("06 / 06");
  await expect(demo).toContainText("Mount, tick, clean up");
  await next.click();
  await expect(demo).toContainText("01 / 06");

  // list() example: shuffling never creates nodes
  await demo.getByRole("button", { name: "Example 3: Same object, same node" }).click();
  await expect(demo).toContainText("6 nodes ever created");
  await demo.getByRole("button", { name: "shuffle" }).click();
  await demo.getByRole("button", { name: "reverse" }).click();
  await expect(demo).toContainText("6 nodes ever created");
  await demo.getByRole("button", { name: "add an item" }).click();
  await expect(demo).toContainText("7 items · 7 nodes ever created");
});
