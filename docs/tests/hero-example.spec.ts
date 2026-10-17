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
});

test("hero card: the code view opens the live example beside its source", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const dialog = demo.locator("dialog");

  await demo.locator("[data-cell='state-5']").click(); // a pending mutation
  await demo.getByRole("button", { name: "Code", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-demo-pane='code']")).toBeVisible();
  // The same example, state and all, and only in the dialog
  await expect(dialog.locator("[data-cell='state-5']")).toHaveAttribute("data-on", "true");
  await expect(demo.locator("[data-cell='state-5']")).toHaveCount(1);

  await dialog.getByRole("button", { name: "Next example" }).click();
  await expect(dialog).toContainText("Draw the mark");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(demo.locator("[data-demo-pane='preview']")).toBeVisible();
  await expect(demo).toContainText("02/09");
});

test("hero card: arrows move through the examples and keep their state", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const demo = page.locator("[data-hero-demo]");
  const next = demo.getByRole("button", { name: "Next example" });
  const prev = demo.getByRole("button", { name: "Previous example" });

  // Paint a cell, leave, come back: the mutation is still pending
  await demo.locator("[data-cell='state-3']").click();
  await next.click();
  await expect(demo).toContainText("Draw the mark");
  await expect(demo.locator("[data-cell='state-3']")).toHaveCount(0);
  await prev.click();
  await expect(demo.locator("[data-cell='state-3']")).toHaveAttribute("data-on", "true");

  // Wrap around backwards to the last example and forwards to the first
  await prev.click();
  await expect(demo).toContainText("09/09");
  await expect(demo).toContainText("Game of Life");
  await next.click();
  await expect(demo).toContainText("01/09");

  // list(): sorting moves the nodes, it never makes new ones
  await demo.getByRole("button", { name: "Example 5: Sorted, never rebuilt" }).click();
  await expect(demo).toContainText("18 nodes ever created");
  await demo.getByRole("button", { name: "shuffle", exact: true }).click();
  await demo.getByRole("button", { name: "reverse", exact: true }).click();
  await demo.getByRole("button", { name: "sort", exact: true }).click();
  await expect(demo).toContainText(/[1-9]\d* swaps/);
  await expect(demo).toContainText("18 nodes ever created");
});

test("hero card: code modal works after switching languages", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en", { waitUntil: "networkidle" });

  for (const [language, locale] of [["PT-BR Português", "pt-br"], ["ES Español", "es"], ["EN English", "en"]]) {
    await page.locator('header button[aria-haspopup="dialog"]').click();
    await page.getByRole("button", { name: language, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    const demo = page.locator("[data-hero-demo]");
    const dialog = demo.locator("dialog");
    await demo.locator('button[aria-haspopup="dialog"]').click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-demo-pane='code']")).toBeVisible();
    await dialog.locator(':scope > div').first().getByRole("button").last().click();
    await expect(dialog).toBeHidden();
    await expect(demo.locator("[data-demo-pane='preview']")).toBeVisible();
    await demo.locator('button[aria-haspopup="dialog"]').click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});
