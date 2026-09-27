import { expect, test, type Page } from "@playwright/test";

/** Collects page errors and console errors (failed requests are expected in some tests). */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text());
  });
  return errors;
}

/** The router records its history index once hydration is done. */
const hydrated = (page: Page) => page.waitForFunction(() => (history.state as { nuclo?: number } | null)?.nuclo !== undefined);

test.describe("hydration", () => {
  for (const [path, status] of [["/", 200], ["/about", 200], ["/about/life", 200], ["/blog", 200], ["/blog/layouts", 200], ["/todos", 200], ["/missing", 404]] as const) {
    test(`${path} hydrates onto the server markup`, async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path);
      expect(response!.status()).toBe(status);
      const serverHeader = await page.evaluate(() => {
        (window as { __ssrHeader?: Element }).__ssrHeader = document.querySelector("header")!;
        return true;
      });
      expect(serverHeader).toBe(true);
      await hydrated(page);
      const structure = await page.evaluate(() => ({
        app: document.getElementById("app")!.children.length,
        headers: document.querySelectorAll("header").length,
        mains: document.querySelectorAll("main").length,
        // Hydration claims the server's nodes instead of replacing them.
        sameHeader: (window as { __ssrHeader?: Element }).__ssrHeader === document.querySelector("header"),
      }));
      expect(structure).toEqual({ app: 1, headers: 1, mains: 1, sameHeader: true });
      expect(errors).toEqual([]);
    });
  }
});

test("navigates client-side and keeps the layout", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await hydrated(page);
  await page.evaluate(() => ((window as { __marker?: number }).__marker = 1));
  // State inside the layout survives navigation.
  await page.locator("header + div input").fill("kept");

  await page.locator("nav").getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("main h1")).toHaveText("Blog");
  await expect(page).toHaveTitle("Blog · Nuclo Pages");
  await expect(page.locator("nav a[aria-current=page]")).toHaveText("Blog");

  await page.getByRole("link", { name: "Layouts that stay put" }).click();
  await expect(page.locator("main h1")).toHaveText("Layouts that stay put");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Layouts that stay put");

  await page.goBack();
  await expect(page.locator("main h1")).toHaveText("Blog");
  await page.goForward();
  await expect(page.locator("main h1")).toHaveText("Layouts that stay put");

  // Still the same document: no full page load happened.
  expect(await page.evaluate(() => (window as { __marker?: number }).__marker)).toBe(1);
  await expect(page.locator("header + div input")).toHaveValue("kept");
  expect(errors).toEqual([]);
});

test("restores the scroll position on back", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 300 });
  await page.goto("/blog");
  await hydrated(page);
  await page.evaluate(() => window.scrollTo(0, 120));
  // Click through the DOM: Playwright's click() would scroll the link into view first.
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('a[href="/blog/layouts"]')!.click());
  await expect(page.locator("main h1")).toHaveText("Layouts that stay put");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(page.locator("main h1")).toHaveText("Blog");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(120);
});

test("runs actions on the server and re-renders the page with fresh data", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/todos");
  await hydrated(page);
  const text = `e2e ${Date.now()}`;
  const input = page.locator("input[name=text]");
  await page.locator("header + div input").fill("kept");

  await input.fill(text);
  await input.press("Enter");
  const item = page.locator("main li", { hasText: text });
  await expect(item).toBeVisible();
  // The page re-rendered from the reloaded data; the layout's data didn't change, so it stayed.
  await expect(input).toHaveValue("");
  await expect(page.locator("header + div input")).toHaveValue("kept");

  // A validation error thrown on the server reaches the page.
  await input.press("Enter");
  await expect(page.locator("main form + p")).toHaveText("A todo needs some text");

  await item.getByRole("checkbox").click();
  await expect(item.getByRole("checkbox")).toBeChecked();
  await page.reload();
  await hydrated(page);
  // The server rendered the saved state.
  await expect(item.getByRole("checkbox")).toBeChecked();
  await item.getByRole("button", { name: "Remove" }).click();
  await expect(item).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("calls a $server() function from an event handler", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/about");
  await hydrated(page);
  await page.getByRole("button", { name: "Ask the server the time" }).click();
  await expect(page.locator("main p").last()).toHaveText(/^\d{4}-\d\d-\d\dT/);
  expect(errors).toEqual([]);
});

test("renders not-found errors from a server load during client navigation", async ({ page }) => {
  await page.goto("/blog");
  await hydrated(page);
  await page.evaluate(() => {
    const link = Object.assign(document.createElement("a"), { href: "/blog/nope", textContent: "missing" });
    document.querySelector("main")!.append(link);
    link.click();
  });
  await expect(page.locator("main h1")).toHaveText("404");
  await expect(page.locator("main")).toContainText('No post called "nope"');
  await expect(page).toHaveTitle("404 · Nuclo Pages");
  await expect(page.locator("header")).toHaveCount(1);
});

test("loads API routes as documents", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  await page.getByRole("link", { name: "An API route" }).click();
  await expect(page).toHaveURL(/\/api\/health$/);
  expect(JSON.parse(await page.locator("body").innerText())).toMatchObject({ ok: true });
});

test("serves prerendered pages and immutable assets", async ({ request }) => {
  const page = await request.get("/blog/layouts");
  expect(page.headers()["cache-control"]).toBe("public, max-age=0, must-revalidate");
  const html = await page.text();
  const asset = /src="(\/assets\/[^"]+\.js)"/.exec(html)![1];
  expect((await request.get(asset)).headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  // Not prerendered: rendered per request.
  expect((await request.get("/todos")).headers()["cache-control"]).toBeUndefined();
});
