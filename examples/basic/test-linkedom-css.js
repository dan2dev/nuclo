import { parseHTML } from 'linkedom';

const { window, document } = parseHTML('<!DOCTYPE html><html><head></head><body></body></html>');

console.log('CSSStyleRule:', typeof window.CSSStyleRule);
console.log('CSSMediaRule:', typeof window.CSSMediaRule);
console.log('CSSStyleSheet:', typeof window.CSSStyleSheet);

console.log('\nAll CSS-related properties on window:');
Object.keys(window).filter(k => k.startsWith('CSS')).forEach(k => {
  console.log(`  ${k}:`, typeof window[k]);
});
