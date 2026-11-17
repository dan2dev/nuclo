// expect: This WeakMap's values can hold its key
// code: NUCLO6000
class Item { name = "n"; }
interface Meta { owner: Item; hits: number }
export const meta = new WeakMap<Item, Meta>();
