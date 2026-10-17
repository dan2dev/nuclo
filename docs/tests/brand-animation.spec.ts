import { expect, test } from "@playwright/test";

test("the docs mark resumes after leaving during its drawing", async ({ page }) => {
  test.setTimeout(30_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/docs");
  const mark = page.locator('main svg.nuclo-draw').first();
  for (let trip = 0; trip < 3; trip++) {
    await expect(mark).toHaveAttribute("data-draw", "on");
    await page.locator('header a[href="/en/examples"]').first().click();
    await page.locator('header a[href="/en/docs"]').first().click();
    await expect(mark).toHaveAttribute("data-draw", "on");
    await expect.poll(async () => mark.locator('path').first().getAttribute("fill-opacity")).toBe("1");
    if (trip < 2) {
      await page.locator('header a[href="/en/examples"]').first().click();
      await page.locator('header a[href="/en/docs"]').first().click();
    }
  }
});
