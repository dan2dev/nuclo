// Server-only state: only page loads and actions import this module, so it never reaches the browser.
let count = 0;

export const getCount = () => count;

export const increment = () => ++count;
