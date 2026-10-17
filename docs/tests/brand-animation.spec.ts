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


test("the docs mark replays only after leaving the viewport completely", async ({ page }) => {
  test.setTimeout(30_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/docs");
  const mark = page.locator('svg[aria-label="Nuclo mark"]');
  const ink = mark.locator("path").first();
  await expect(mark).toHaveAttribute("data-draw", "on");
  await expect.poll(() => ink.getAttribute("fill-opacity")).toBe("1");

  // Leave less than half visible, then return: the finished drawing must remain.
  await mark.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + el.getBoundingClientRect().height * 0.75));
  await expect.poll(() => mark.evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(0);
  await page.waitForTimeout(100);
  await expect(mark).toHaveAttribute("data-draw", "on");
  await expect(ink).toHaveAttribute("fill-opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await expect(ink).toHaveAttribute("fill-opacity", "1");

  for (let trip = 0; trip < 2; trip++) {
    await mark.evaluate(el => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().bottom + 20));
    await expect(mark).not.toHaveAttribute("data-draw");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(mark).toHaveAttribute("data-draw", "on");
    await expect.poll(() => ink.getAttribute("fill-opacity")).not.toBe("1");
    await expect.poll(() => ink.getAttribute("fill-opacity")).toBe("1");
  }
});
