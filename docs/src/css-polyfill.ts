/**
 * Minimal CSS API stubs for SSR environments where browser CSS globals are absent.
 * Must be imported before any module that uses CSS-in-JS utilities (styles.ts).
 * The mock rules created by the nuclo polyfill are plain objects, so all
 * instanceof checks return false — which is the correct no-op SSR behaviour.
 */

/* eslint-disable @typescript-eslint/no-extraneous-class */

const g = globalThis as Record<string, unknown>;

if (typeof g['CSSStyleRule'] === 'undefined') {
  g['CSSStyleRule'] = class CSSStyleRule {};
}
if (typeof g['CSSMediaRule'] === 'undefined') {
  g['CSSMediaRule'] = class CSSMediaRule {};
}
if (typeof g['CSSContainerRule'] === 'undefined') {
  g['CSSContainerRule'] = class CSSContainerRule {};
}
if (typeof g['CSSSupportsRule'] === 'undefined') {
  g['CSSSupportsRule'] = class CSSSupportsRule {};
}
