import { expect, test } from '@playwright/test';

const tokenClasses = ['kw', 'st', 'fn', 'cm', 'nm', 'ty', 'pt', 'pr'] as const;
const minContrast = 4.5;

type Rgb = [number, number, number];

function rgbTuple(value: string): Rgb {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    throw new Error(`Cannot parse color: ${value}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance(rgb: Rgb): number {
  return rgb
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLum = luminance(rgbTuple(foreground));
  const backgroundLum = luminance(rgbTuple(background));
  return (Math.max(foregroundLum, backgroundLum) + 0.05)
    / (Math.min(foregroundLum, backgroundLum) + 0.05);
}

async function codeContrastFailures(page: import('@playwright/test').Page) {
  const samples = await page.locator('pre').evaluateAll((pres, classes) => {
    function effectiveBackground(element: Element | null): string {
      for (let current = element; current; current = current.parentElement) {
        const background = getComputedStyle(current).backgroundColor;
        if (background !== 'rgba(0, 0, 0, 0)' && !background.endsWith(', 0)')) {
          return background;
        }
      }
      return getComputedStyle(document.body).backgroundColor;
    }

    return pres.flatMap((pre, index) => {
      const container = pre.parentElement;
      const background = effectiveBackground(container);
      const base = {
        index,
        token: 'base',
        color: getComputedStyle(container ?? pre).color,
        background,
        text: pre.textContent?.trim().slice(0, 80) ?? '',
      };
      const tokens = classes.flatMap((className) =>
        Array.from(pre.querySelectorAll(`.${className}`)).map((element) => ({
          index,
          token: className,
          color: getComputedStyle(element).color,
          background,
          text: element.textContent?.trim().slice(0, 80) ?? '',
        })),
      );
      return [base, ...tokens];
    });
  }, tokenClasses);

  return samples
    .map((sample) => ({
      ...sample,
      contrast: Number(contrastRatio(sample.color, sample.background).toFixed(2)),
    }))
    .filter((sample) => sample.contrast < minContrast);
}

for (const theme of ['light', 'dark'] as const) {
  test(`code colors remain readable in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem('nuclo-theme', selectedTheme);
    }, theme);

    const failures = [];

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Code' }).first().click();
    failures.push(...await codeContrastFailures(page));

    await page.goto('/docs', { waitUntil: 'networkidle' });
    failures.push(...await codeContrastFailures(page));

    expect(
      failures.slice(0, 10),
      `${failures.length} code color contrast sample(s) below ${minContrast}: ${JSON.stringify(failures.slice(0, 10))}`,
    ).toEqual([]);
  });
}
