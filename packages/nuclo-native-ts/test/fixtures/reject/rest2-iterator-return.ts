// expect: a member other than `next` in a hand-written iterator object
// code: NUCLO6002
export class Bag {
  items: string[] = ["a"];
  [Symbol.iterator](): Iterator<string> {
    let i = 0;
    const items = this.items;
    return {
      next: () => (i < items.length ? { value: items[i++]!, done: false } : { value: undefined, done: true }),
      return: () => ({ value: undefined, done: true }),
    };
  }
}
