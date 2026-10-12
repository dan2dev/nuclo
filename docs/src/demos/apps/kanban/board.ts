// board.ts: the model. Columns hold cards in plain arrays, and every change is
// a plain array operation on the same card objects. Nothing is copied or
// re-keyed: a card that moves is the same object before and after.

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  priority: 1 | 2 | 3; // 3 is urgent
  assignee: User | null; // the same object as in `users`, never a copy
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
}

export const users: User[] = [
  { id: "ana", name: "Ana Souza", color: "#e0586f" },
  { id: "ben", name: "Ben Carter", color: "#3b82c4" },
  { id: "chen", name: "Chen Wei", color: "#2f9e72" },
  { id: "dia", name: "Dia Patel", color: "#d98a1f" },
];
const [ana, ben, chen, dia] = users;

let nextId = 1;
const card = (title: string, priority: Card["priority"], assignee: User | null, description = ""): Card => ({ id: nextId++, title, description, priority, assignee });

export const columns: Column[] = [
  { id: "todo", title: "To do", cards: [
    card("Write the release notes", 2, ana, "Summarize the changes since the last tag."),
    card("Fix the flaky test", 3, ben, "The list diff test fails about one run in twenty."),
    card("Design the empty state", 1, null),
    card("Rotate the API keys", 3, dia),
  ] },
  { id: "doing", title: "In progress", cards: [card("Migrate the settings page", 2, chen, "Move it to the new form components."), card("Profile the list diff", 1, ben)] },
  { id: "done", title: "Done", cards: [card("Set up CI", 2, dia), card("Pick a logo", 1, ana)] },
];

export const PRIORITIES = [
  { value: 1, label: "Low" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Urgent" },
] as const;

export const initials = (u: User) => u.name.split(" ").map((w) => w[0]).join("");

export const columnOf = (c: Card) => columns.find((col) => col.cards.includes(c))!;

/** Moves a card to `index` in `to`, from wherever it is now. */
export function move(c: Card, to: Column, index = to.cards.length) {
  const from = columnOf(c);
  const at = from.cards.indexOf(c);
  from.cards.splice(at, 1);
  if (from === to && at < index) index--;
  to.cards.splice(index, 0, c);
}

export interface Draft {
  title: string;
  description: string;
  priority: Card["priority"];
  assignee: User | null;
}

/** Puts a new card at the top of `col`. */
export function add(col: Column, draft: Draft): Card {
  const c = card(draft.title, draft.priority, draft.assignee, draft.description);
  col.cards.unshift(c);
  return c;
}

/** Edits a card in place, so its element is kept. */
export function edit(c: Card, draft: Draft) {
  Object.assign(c, draft);
}

/** Puts a deleted card back where it was. */
export function restore(c: Card, col: Column, index: number) {
  col.cards.splice(Math.min(index, col.cards.length), 0, c);
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
