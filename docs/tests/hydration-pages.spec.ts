import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:5173' });

const routes = [
  '/',
  '/getting-started',
  '/core-api',
  '/tag-builders',
  '/styling',
  '/pitfalls',
  '/examples',
  '/examples/counter',
  '/examples/todo',
  '/examples/subtasks',
  '/examples/search',
  '/examples/async',
  '/examples/forms',
  '/examples/nested',
  '/examples/animations',
  '/examples/routing',
  '/examples/styled-card',
];

test.describe('Hydration — all docs pages', () => {
  for (const route of routes) {
    test(`page ${route} hydrates correctly`, async ({ page }) => {
      test.setTimeout(10_000);

      // Collect console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out known noise
          if (
            !text.includes('favicon') &&
            !text.includes('[vite]') &&
            !text.includes('Failed to load resource')
          ) {
            errors.push(text);
          }
        }
      });

      await page.goto(route, { waitUntil: 'networkidle' });

      // Structural checks
      const structure = await page.evaluate(() => {
        const app = document.getElementById('app');
        // Count direct children of the root div (should be 3: header-div, main, footer)
        const rootDiv = app?.firstElementChild;
        return {
          appChildren: app?.children.length ?? 0,
          rootDivChildren: rootDiv?.children.length ?? 0,
          headers: document.querySelectorAll('header').length,
          footers: document.querySelectorAll('footer').length,
          // Only check for duplicate page-container mains (not nested <main> from page content)
          pageContainers: document.querySelectorAll('main#page-container').length,
          navs: document.querySelectorAll('nav').length,
          pageContainer: !!document.getElementById('page-container'),
          // Verify the root structure: rootDiv > [header-div, main#page-container, footer]
          rootChildTags: rootDiv
            ? Array.from(rootDiv.children).map(c =>
                c.id ? `${c.tagName.toLowerCase()}#${c.id}` : c.tagName.toLowerCase()
              )
            : [],
        };
      });

      expect(structure.appChildren, `#app should have exactly 1 child on ${route}`).toBe(1);
      expect(structure.rootDivChildren, `root div should have 3 children on ${route}`).toBe(3);
      expect(structure.headers, `should have exactly 1 <header> on ${route}`).toBe(1);
      expect(structure.footers, `should have exactly 1 <footer> on ${route}`).toBe(1);
      expect(structure.pageContainers, `should have exactly 1 main#page-container on ${route}`).toBe(1);
      expect(structure.navs, `should have at least 1 <nav> on ${route}`).toBeGreaterThanOrEqual(1);
      expect(structure.pageContainer, `#page-container should exist on ${route}`).toBe(true);

      // Check for duplicate IDs that should be unique
      const duplicateIds = await page.evaluate(() => {
        const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        const seen = new Map<string, number>();
        for (const id of allIds) {
          seen.set(id, (seen.get(id) ?? 0) + 1);
        }
        const duplicates: string[] = [];
        for (const [id, count] of seen) {
          if (count > 1) {
            duplicates.push(`${id} (x${count})`);
          }
        }
        return duplicates;
      });

      expect(duplicateIds, `no duplicate IDs on ${route}`).toEqual([]);

      // No console errors
      expect(errors, `no console errors on ${route}`).toEqual([]);
    });
  }
});
