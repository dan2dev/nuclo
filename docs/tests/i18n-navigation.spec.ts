import { expect, test, type Page } from "@playwright/test";
import { LOCALES, LOCALE_CODES } from "../src/i18n/index.ts";
import { LOCALES as SHOP_LOCALES, localize, type Code } from "../src/demos/apps/i18n/messages.ts";

async function chooseLanguage(page: Page, locale: keyof typeof LOCALES) {
  await page.locator('header button[aria-haspopup="dialog"]').click();
  const dialog = page.locator('dialog[aria-labelledby="language-title"]');
  await expect(dialog).toBeVisible();
  await dialog.locator(`button[lang="${LOCALES[locale].lang}"]`).click();
  await expect(dialog).not.toBeVisible();
}

test.describe("localized navigation", () => {
  for (const suffix of ["", "/docs?check=locale#api-list", "/examples", "/examples/counter", "/docs/example-counter"]) {
    test(`language switching on ${suffix || "home"} updates the page and its metadata`, async ({ page }) => {
      test.setTimeout(60_000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/en${suffix}`);
      for (const locale of LOCALE_CODES) {
        // Close the full-screen example before reaching the site's language control.
        if (suffix.endsWith("counter")) {
          const current = new URL(page.url()).pathname.split("/")[1];
          const parent = suffix.startsWith("/docs") ? "/docs" : "/examples";
          await page.getByRole("dialog").locator(`a[href="/${current}${parent}"]`).click();
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
        await chooseLanguage(page, locale);
        if (suffix.endsWith("counter")) {
          await page.locator(`a[href="/${locale}${suffix}"]`).first().click();
          await expect(page.getByRole("dialog")).toBeVisible();
        }
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

test("the multilingual shop keeps the cart and coupon while switching languages", async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto("/en/examples/i18n");
  const shop = page.getByRole("dialog").locator("div[lang][dir]");
  await shop.getByRole("button", { name: "Add to cart", exact: true }).first().click();
  await shop.getByRole("textbox").fill("NUCLO");

  for (const code of Object.keys(SHOP_LOCALES) as Code[]) {
    const { t } = SHOP_LOCALES[code];
    await shop.locator(`nav button[lang="${code}"]`).click();
    await expect(shop).toHaveAttribute("lang", code);
    await expect(shop).toHaveAttribute("dir", SHOP_LOCALES[code].dir);
    await expect(shop.getByRole("textbox")).toHaveValue("NUCLO");
    await expect(shop.locator("aside ul > li")).toHaveCount(1);
    await expect(shop.locator("aside header")).toContainText(localize(code).items(1));
    await expect(shop.getByRole("button", { name: t.add, exact: true })).toHaveCount(6);
    await expect(shop.getByRole("button", { name: t.checkout, exact: true })).toBeEnabled();
  }
});

test.describe("mobile languages", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const [index, locale] of LOCALE_CODES.entries()) {
    test(`${locale}: pages fit the viewport and switch languages with the mobile menu open`, async ({ page }) => {
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
        const next = LOCALE_CODES[(index + 1) % LOCALE_CODES.length]!;
        await chooseLanguage(page, next);
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
