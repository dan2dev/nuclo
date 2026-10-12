// Wraps API names in prose (update(), list(), onMount, onDestroy) and
// `backticked` spans in <code>; the backticks themselves are dropped.
export function withCode(text: string) {
  return text
    .split(/(`[^`]+`|\b\w+\(\)|\bon(?:Mount|Destroy)\b)/)
    .map((part, i) => (i % 2 ? code(part.replace(/^`|`$/g, "")) : part));
}
