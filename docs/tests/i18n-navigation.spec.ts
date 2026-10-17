import { expect, test } from "@playwright/test";
import { LOCALES, LOCALE_CODES } from "../src/i18n/index.ts";

test.describe("localized navigation", () => {
  for (const suffix of ["", "/docs?check=locale#api-list", "/examples", "/examples/counter", "/docs/example-counter"]) {
    test(`language switching on ${suffix || "home"} updates the page and its metadata`, async ({ page }) => {
      test.setTimeout(60_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/en${suffix}`);
      for (const locale of LOCALE_CODES) {
        await page.getByRole("combobox").selectOption(locale);
        await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[locale].lang);
        await expect(page.locator("html")).toHaveAttribute("dir", LOCALES[locale].dir);
        await expect(page).toHaveURL(new RegExp(`/${locale}${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
        await expect(page.locator('meta[name="language"]')).toHaveAttribute("content", LOCALES[locale].lang);
        const schema = await page.locator('head script[type="application/ld+json"]').textContent();
        const metadata = JSON.parse(schema!).at(-1);
        expect(metadata.inLanguage).toBe(LOCALES[locale].lang);
        expect(metadata.url).toBe(await page.locator('link[rel="canonical"]').getAttribute("href"));
        await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(11);
        await expect(page.locator(`meta[property="og:locale:alternate"][content="${LOCALES[locale].og}"]`)).toHaveCount(0);
        await expect(page.locator("link[hreflang]")).toHaveCount(13);
        await expect(page.locator("#page-container")).toHaveCount(1);
        if (suffix.endsWith("counter")) {
          await expect(page.locator('[class*="codeBlockFilename"]')).toHaveText("Counter.ts");
          const preview = page.getByRole("dialog").locator('section').filter({ has: page.getByRole("button", { name: "+", exact: true }) });
          const before = await preview.innerText();
          await preview.getByRole("button", { name: "+", exact: true }).click();
          await expect(preview).not.toHaveText(before);
        }
      }
      expect(errors).toEqual([]);
    });
  }
});

test("localized 404 pages recover their indexing metadata after navigation", async ({ page }) => {
  test.setTimeout(60_000);
  for (const locale of LOCALE_CODES) {
    await page.goto(`/${locale}/not-a-page`);
    await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[locale].lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    await page.locator(`a[href="/${locale}"]`).first().click();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[locale].lang);
  }
});

test.describe("mobile languages", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const [index, locale] of LOCALE_CODES.entries()) {
    test(`${locale}: pages fit the viewport and switch through the mobile menu`, async ({ page }) => {
      test.setTimeout(45_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const suffix of ["", "/docs", "/examples", "/examples/counter"]) {
        await page.goto(`/${locale}${suffix}`);
        await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[locale].lang);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        expect(overflow, `${locale}${suffix} must fit a phone`).toBe(false);
        if (suffix.endsWith("counter")) {
          // Examples fill the phone screen; close the modal to reach site navigation.
          await page.getByRole("dialog").locator(`a[href="/${locale}/examples"]`).click();
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
        await page.locator("#site-menu-button").click();
        const select = page.locator("#site-menu").getByRole("combobox");
        await expect(select).toBeVisible();
        await expect(select).toHaveValue(locale);
        const next = LOCALE_CODES[(index + 1) % LOCALE_CODES.length]!;
        await select.selectOption(next);
        await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[next].lang);
        await expect(page.locator("html")).toHaveAttribute("dir", LOCALES[next].dir);
        await expect(page.locator("#site-menu")).toHaveCount(0);
        if (suffix.endsWith("counter")) {
          await page.locator(`a[href="/${next}/examples/counter"]`).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(page.locator("html")).toHaveAttribute("lang", LOCALES[next].lang);
        }
      }
      expect(errors).toEqual([]);
    });
  }
});
