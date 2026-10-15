// Writes every static logo asset from src/components/brand-geometry.ts: the SVGs, the PNGs
// (favicons, PWA icons, the OG image, the logo at 1x/2x/3x) and favicon.ico. Run after a
// change to the mark: `bun scripts/render-brand.ts`. The PNGs are chromium screenshots.
import { mkdirSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { brandBox, brandIcon, glyphs, icon, pathD, GRADIENT, INK, STROKE, type Icon } from "../src/components/brand-geometry.ts";

const pub = resolve(import.meta.dir, "../public");
const template = resolve(import.meta.dir, "../../packages/create-nuclo/templates/basic/public");

const grad = `<defs><linearGradient id="nuclo-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GRADIENT.from}"/><stop offset="1" stop-color="${GRADIENT.to}"/></linearGradient></defs>`;
const mark = (ic: Icon) => `<path d="${pathD([ic.shape])}" fill="url(#nuclo-fill)"/><path d="${pathD([ic.play])}" fill="${INK}"/>`;
const word = (fill: string) => glyphs.map((cs) => `<path d="${pathD(cs)}" fill="${fill}"/>`).join("");

/** The lockup; the wordmark in `fill` (currentColor for inline use, a color for <img>). */
const brandSvg = (fill: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="nuclo" viewBox="${brandBox.join(" ")}">${grad}${mark(brandIcon)}${word(fill)}</svg>`;
/** The icon in a square box; `inset` is the margin on each side as a fraction of the box. */
const iconSvg = (inset = 0.02) => {
  const m = 200 * inset - 4; // the icon's own 4px margin counts toward the inset
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="nuclo" viewBox="${-m} ${-m} ${200 + 2 * m} ${200 + 2 * m}">${grad}${mark(icon)}</svg>`;
};
/** The icon drawing itself: the outline runs around each shape, then the ink fills in. Loops forever. */
const animatedIconSvg = () => {
  const len = (pts: number[][]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0).toFixed(1);
  const outline = (pts: number[][]) =>
    `<path class="s" style="--l:${len(pts)}" d="${pathD([pts])}" fill="none" stroke="${STROKE}" stroke-width="2" stroke-linejoin="round" stroke-dasharray="${len(pts)}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="nuclo" viewBox="0 0 200 200">${grad}<style>
@keyframes nuclo-draw{0%{stroke-dashoffset:var(--l)}55%,100%{stroke-dashoffset:0}}
@keyframes nuclo-fill{0%,50%{opacity:0}65%,85%{opacity:1}100%{opacity:0}}
.s{stroke-dashoffset:var(--l);animation:nuclo-draw 4s ease-in-out infinite}.f{animation:nuclo-fill 4s linear infinite}
@media (prefers-reduced-motion:reduce){.s{display:none}.f{animation:none;opacity:1}}
</style><g class="f">${mark(icon)}</g>${outline(icon.shape)}${outline(icon.play)}</svg>`;
};

const files: Record<string, string> = {
  "nuclo-logo.svg": brandSvg(INK),
  "nuclo-logo-dark.svg": brandSvg("#fff"),
  "nuclo-brand.svg": brandSvg("currentColor"),
  "nuclo-icon.svg": iconSvg(),
  "nuclo-icon-animated.svg": animatedIconSvg(),
};
mkdirSync(pub, { recursive: true });
for (const [name, svg] of Object.entries(files)) writeFileSync(resolve(pub, name), svg + "\n");

// ── PNGs: each is one SVG centered in a box, screenshot by chromium ────────
type Png = { name: string; w: number; h: number; svg: string; scale?: number; bg?: string };
const sizes = (name: string, w: number, h: number, svg: string, bg?: string): Png[] => [
  { name: `${name}.png`, w, h, svg, bg },
  { name: `${name}@2x.png`, w: w * 2, h: h * 2, svg, bg },
  { name: `${name}@3x.png`, w: w * 3, h: h * 3, svg, bg },
];
const pngs: Png[] = [
  { name: "favicon-16x16.png", w: 16, h: 16, svg: iconSvg(0) },
  { name: "favicon-32x32.png", w: 32, h: 32, svg: iconSvg(0) },
  { name: "favicon-48x48.png", w: 48, h: 48, svg: iconSvg(0) },
  { name: "icon-192.png", w: 192, h: 192, svg: iconSvg() },
  { name: "icon-512.png", w: 512, h: 512, svg: iconSvg() },
  { name: "icon-maskable-512.png", w: 512, h: 512, svg: iconSvg(), scale: 0.6, bg: "#fff" },
  { name: "apple-touch-icon.png", w: 180, h: 180, svg: iconSvg(), scale: 0.72, bg: "#fff" },
  ...sizes("nuclo-icon", 64, 64, iconSvg()),
  ...sizes("nuclo-logo", 1168, 320, brandSvg(INK)),
  ...sizes("nuclo-logo-dark", 1168, 320, brandSvg("#fff")).slice(0, 2),
  { name: "og-image.png", w: 1200, h: 630, svg: brandSvg(INK), scale: 0.72, bg: "#fff" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { name, w, h, svg, scale = 1, bg } of pngs) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<body style="margin:0;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;background:${bg ?? "transparent"}">` +
      `<div style="width:${w * scale}px;height:${h * scale}px;display:flex;align-items:center;justify-content:center">${svg.replace("<svg ", '<svg style="max-width:100%;max-height:100%" ')}</div></body>`,
  );
  await page.locator("svg").evaluate((el) => el.getBoundingClientRect()); // laid out
  writeFileSync(resolve(pub, name), await page.screenshot({ omitBackground: !bg, type: "png" }));
}
await browser.close();

// ── favicon.ico: the 16, 32 and 48px PNGs in one ICO container ─────────────
const icoPngs = [16, 32, 48].map((s) => Bun.file(resolve(pub, s === 48 ? "favicon-48x48.png" : `favicon-${s}x${s}.png`)));
const bufs = await Promise.all(icoPngs.map((f) => f.arrayBuffer()));
const header = new DataView(new ArrayBuffer(6 + 16 * bufs.length));
header.setUint16(2, 1, true); // type: icon
header.setUint16(4, bufs.length, true);
let offset = header.byteLength;
bufs.forEach((buf, i) => {
  const s = [16, 32, 48][i];
  const at = 6 + 16 * i;
  header.setUint8(at, s); // width
  header.setUint8(at + 1, s); // height
  header.setUint16(at + 4, 1, true); // color planes
  header.setUint16(at + 6, 32, true); // bits per pixel
  header.setUint32(at + 8, buf.byteLength, true);
  header.setUint32(at + 12, offset, true);
  offset += buf.byteLength;
});
writeFileSync(resolve(pub, "favicon.ico"), Buffer.concat([Buffer.from(header.buffer), ...bufs.map((b) => Buffer.from(b))]));
unlinkSync(resolve(pub, "favicon-48x48.png"));

// The create-nuclo template ships the same favicons and logo
for (const name of ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "nuclo-logo.svg"]) {
  copyFileSync(resolve(pub, name), resolve(template, name));
}
console.log(`wrote ${Object.keys(files).length} SVGs, ${pngs.length} PNGs and favicon.ico to ${pub}`);
