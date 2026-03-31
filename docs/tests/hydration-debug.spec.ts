import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:5173' });

test('investigate hydration duplicates', async ({ page }) => {
  // Navigate to the docs site
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for hydration to complete
  await page.waitForTimeout(2000);

  // Count root-level children in #app
  const appChildCount = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      childElementCount: app?.childElementCount ?? 0,
      childNodeCount: app?.childNodes.length ?? 0,
      childTags: Array.from(app?.children ?? []).map(el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`),
    };
  });
  console.log('=== #app children ===');
  console.log(JSON.stringify(appChildCount, null, 2));

  // Check how many headers, mains, footers exist
  const counts = await page.evaluate(() => {
    return {
      headers: document.querySelectorAll('header').length,
      mains: document.querySelectorAll('main').length,
      mainIds: Array.from(document.querySelectorAll('main')).map(m => m.id),
      footers: document.querySelectorAll('footer').length,
      navs: document.querySelectorAll('nav').length,
    };
  });
  console.log('\n=== Element counts ===');
  console.log(JSON.stringify(counts, null, 2));

  // Check the #page-container content
  const pageContainerInfo = await page.evaluate(() => {
    const container = document.getElementById('page-container');
    if (!container) return { found: false };
    return {
      found: true,
      childElementCount: container.childElementCount,
      childNodeCount: container.childNodes.length,
      childNodeTypes: Array.from(container.childNodes).map(n => {
        if (n.nodeType === 1) return `Element:${(n as Element).tagName.toLowerCase()}`;
        if (n.nodeType === 3) return `Text:"${n.textContent?.trim().slice(0, 30) ?? ''}"`;
        if (n.nodeType === 8) return `Comment:${(n as Comment).textContent?.trim().slice(0, 40) ?? ''}`;
        return `NodeType:${n.nodeType}`;
      }),
    };
  });
  console.log('\n=== #page-container content ===');
  console.log(JSON.stringify(pageContainerInfo, null, 2));

  // Check the overall DOM structure of #app → div (first child)
  const appDivStructure = await page.evaluate(() => {
    const app = document.getElementById('app');
    if (!app) return { found: false };
    const firstDiv = app.querySelector(':scope > div');
    if (!firstDiv) return { found: true, firstDiv: null };
    return {
      found: true,
      firstDivChildCount: firstDiv.childElementCount,
      firstDivChildNodeCount: firstDiv.childNodes.length,
      firstDivChildNodeTypes: Array.from(firstDiv.childNodes).map(n => {
        if (n.nodeType === 1) return `Element:${(n as Element).tagName.toLowerCase()}${(n as Element).id ? '#' + (n as Element).id : ''}`;
        if (n.nodeType === 3) return `Text:"${n.textContent?.trim().slice(0, 30) ?? ''}"`;
        if (n.nodeType === 8) return `Comment:${(n as Comment).textContent?.trim().slice(0, 40) ?? ''}`;
        return `NodeType:${n.nodeType}`;
      }),
    };
  });
  console.log('\n=== #app > div structure ===');
  console.log(JSON.stringify(appDivStructure, null, 2));

  // Take a screenshot
  await page.screenshot({ path: '/tmp/hydration-debug.png', fullPage: false });
  console.log('\nScreenshot saved to /tmp/hydration-debug.png');
});
