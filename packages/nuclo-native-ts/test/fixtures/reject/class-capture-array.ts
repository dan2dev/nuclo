// expect: is used by a nested class and mutated
export function collect(words: string[]): string[] {
  const out: string[] = [];
  class Collector {
    add(word: string): void {
      out.push(word);
    }
  }
  const c = new Collector();
  for (const w of words) c.add(w);
  return out;
}
