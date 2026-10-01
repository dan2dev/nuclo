// Wraps API names in prose (update(), list(), onMount, onDestroy) in <code>.
export function withCode(text: string) {
  return text.split(/(\b\w+\(\)|\bon(?:Mount|Destroy)\b)/).map((part, i) => (i % 2 ? code(part) : part));
}
