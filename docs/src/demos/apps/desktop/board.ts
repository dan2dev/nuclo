// board.ts: the Kanban model for the desktop. Columns hold cards in plain
// arrays, and every change is a few plain array operations on the same card
// objects. The board is one shared, saved board: each change is written to
// localStorage, and loadBoard() puts the saved board back on the next visit —
// like the files on the simulated disk.
export interface Card { id: number; title: string; priority: 1 | 2 | 3 } // 3 is urgent
export interface Column { id: string; title: string; cards: Card[] }

const KEY = "nuclo-desktop-board-v1";

let nextId = 1;
const card = (title: string, priority: Card["priority"]): Card => ({ id: nextId++, title, priority });

const seed = (): Column[] => [
  { id: "todo", title: "To do", cards: [card("Write the release notes", 3), card("Fix the flaky test", 2), card("Design the empty state", 1)] },
  { id: "doing", title: "In progress", cards: [card("Ship the desktop", 2), card("Profile the list diff", 1)] },
  { id: "done", title: "Done", cards: [card("Set up CI", 2), card("Pick a logo", 1)] },
];

/** The board every Kanban window reads. loadBoard() may replace it with the saved one. */
export const columns: Column[] = seed();

let booted = false;

/** Replaces the seed with the saved board, once, when the app starts in a browser. */
export function loadBoard() {
  if (booted) return;
  booted = true;
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved) as Column[];
    const valid = (c: Column) => c && typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.cards) && c.cards.every((k) => k && typeof k.id === "number" && typeof k.title === "string");
    if (!Array.isArray(parsed) || !parsed.every(valid)) return;
    nextId = parsed.flatMap((c) => c.cards).reduce((max, k) => Math.max(max, k.id), 0) + 1;
    columns.splice(0, columns.length, ...parsed);
  } catch {}
}

export function saveBoard() {
  try { localStorage.setItem(KEY, JSON.stringify(columns)); } catch {}
}

/** Starts the board over. */
export function resetBoard() {
  columns.splice(0, columns.length, ...seed());
  saveBoard();
}

export const columnOf = (c: Card) => columns.find((col) => col.cards.includes(c))!;

/** Moves a card to `index` in `to`, from wherever it is now. */
export function moveCard(c: Card, to: Column, index = to.cards.length) {
  const from = columnOf(c);
  const at = from.cards.indexOf(c);
  from.cards.splice(at, 1);
  if (from === to && at < index) index--;
  to.cards.splice(index, 0, c);
  saveBoard();
}

export function addCard(col: Column, title: string) {
  col.cards.unshift(card(title, 2));
  saveBoard();
}

export function removeCard(c: Card) {
  const cards = columnOf(c).cards;
  cards.splice(cards.indexOf(c), 1);
  saveBoard();
}

export function cyclePriority(c: Card) {
  c.priority = c.priority === 3 ? 1 : ((c.priority + 1) as Card["priority"]);
  saveBoard();
}

export function sortByPriority(col: Column) {
  col.cards.sort((a, b) => b.priority - a.priority);
  saveBoard();
}
