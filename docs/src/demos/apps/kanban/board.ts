// board.ts: the model. Columns hold cards in plain arrays, and every change is
// a plain array operation on the same card objects. Nothing is copied or
// re-keyed: a card that moves is the same object before and after.

export interface Card {
  id: number;
  title: string;
  priority: 1 | 2 | 3; // 3 is urgent
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

let nextId = 1;
const card = (title: string, priority: Card["priority"]): Card => ({ id: nextId++, title, priority });

export const columns: Column[] = [
  { id: "todo", title: "To do", cards: [card("Write the release notes", 2), card("Fix the flaky test", 3), card("Design the empty state", 1), card("Rotate the API keys", 3)] },
  { id: "doing", title: "In progress", cards: [card("Migrate the settings page", 2), card("Profile the list diff", 1)] },
  { id: "done", title: "Done", cards: [card("Set up CI", 2), card("Pick a logo", 1)] },
];

export const columnOf = (c: Card) => columns.find((col) => col.cards.includes(c))!;

/** Moves a card to `index` in `to`, from wherever it is now. */
export function move(c: Card, to: Column, index = to.cards.length) {
  const from = columnOf(c);
  const at = from.cards.indexOf(c);
  from.cards.splice(at, 1);
  if (from === to && at < index) index--;
  to.cards.splice(index, 0, c);
}

export function add(col: Column, title: string) {
  col.cards.unshift(card(title, 2));
}

export function remove(c: Card) {
  const cards = columnOf(c).cards;
  cards.splice(cards.indexOf(c), 1);
}

export function cyclePriority(c: Card) {
  c.priority = c.priority === 3 ? 1 : ((c.priority + 1) as Card["priority"]);
}

export function sortByPriority(col: Column) {
  col.cards.sort((a, b) => b.priority - a.priority);
}
