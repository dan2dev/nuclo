// app.ts: the board. Columns are a list() of columns, cards a list() of each
// column's cards. Rows are matched by identity, so reordering inside a column
// (a drag, "Sort", "Top") moves the existing elements and mounts nothing. A
// card dropped into another column leaves one list and enters another, so it
// is built again there: watch it flash, and the mount count go up by one.
import "nuclo";
import { add, columns, cyclePriority, move, remove, sortByPriority, type Card, type Column } from "./board.ts";
import { s } from "./styles.ts";

let dragging: Card | null = null;
let over: { column: Column; index: number } | null = null; // where it would land
let mounts = 0;

function setOver(column: Column, index: number) {
  if (over?.column === column && over.index === index) return;
  over = { column, index };
  update();
}

function drop() {
  if (dragging && over) move(dragging, over.column, over.index);
  dragging = over = null;
  update();
}

const PRIORITY = { 1: "low", 2: "normal", 3: "urgent" };

function CardView(card: Card, column: Column) {
  return div(
    s.card,
    { draggable: true },
    { class: () => cx(s.card, card === dragging ? s.lifted : null, over?.column === column && over.index === column.cards.indexOf(card) ? s.before : null).className },
    // The mount count is the proof: it only moves when a card is built.
    on("mount", () => { mounts++; queueMicrotask(update); }),
    {
      onDragStart: (e) => { e.dataTransfer?.setData("text/plain", card.title); dragging = card; update(); },
      onDragEnd: () => { dragging = over = null; update(); },
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const below = e.offsetY > e.currentTarget.offsetHeight / 2;
        setOver(column, column.cards.indexOf(card) + (below ? 1 : 0));
      },
    },
    div(s.cardHead,
      button(s.priority, { title: "Change priority", class: () => cx(s.priority, s[`p${card.priority}`]).className }, () => PRIORITY[card.priority], { onClick: () => { cyclePriority(card); update(); } }),
      span(s.id, `#${card.id}`),
      button(s.icon, { title: "Move to top", "aria-label": "Move to top" }, "↑", { onClick: () => { move(card, column, 0); update(); } }),
      button(s.icon, { title: "Delete", "aria-label": "Delete" }, "×", { onClick: () => { remove(card); update(); } }),
    ),
    div(s.title, card.title),
  );
}

function ColumnView(column: Column) {
  return section(
    s.column,
    { class: () => cx(s.column, over?.column === column && over.index === column.cards.length ? s.after : null).className },
    {
      onDragOver: (e) => { e.preventDefault(); setOver(column, column.cards.length); },
      onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { over = null; update(); } },
      onDrop: (e) => { e.preventDefault(); drop(); },
    },
    header(s.columnHead,
      h3(column.title, span(s.count, () => String(column.cards.length))),
      button(s.small, "Sort", { title: "Sort by priority", onClick: () => { sortByPriority(column); update(); } }),
      button(s.small, "+ Add", { onClick: () => { add(column, `Task ${Date.now() % 1000}`); update(); } }),
    ),
    div(s.cards, list(() => column.cards, (card) => CardView(card, column))),
  );
}

export function KanbanBoard() {
  return div(
    s.app,
    p(s.hint, "Drag cards within a column or across columns. ", strong(() => `${mounts} cards mounted`), " so far: reordering never builds a card, only a column change does."),
    div(s.board, list(() => columns, ColumnView)),
  );
}
