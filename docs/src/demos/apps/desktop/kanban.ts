// kanban.ts: the Kanban window. The model lives in board.ts, shared by every
// window and saved after each change; this file is the view. Columns are a
// list() of columns, cards a list() of each column's cards. Rows are matched
// by identity, so dragging a card, sorting a column or renaming a card
// splices or patches the same objects and the elements just move.
import "nuclo";
import type { Program } from "./programs.ts";
import { addCard, columns, cyclePriority, loadBoard, moveCard, removeCard, resetBoard, saveBoard, sortByPriority, type Card, type Column } from "./board.ts";
import { winScopeId } from "./windows.ts";
import { s } from "./styles.ts";

const PRIORITY = { 1: "low", 2: "normal", 3: "urgent" };

let dragging: Card | null = null;
let over: { column: Column; index: number } | null = null; // where it would land
let adding: Column | null = null; // the column whose new-card form is open
let draft = ""; // the title being typed in that form
let editing: Card | null = null; // the card whose title is being typed
let editDraft = "";
let refresh = () => update(); // replaced by the window's scoped update when its view builds

function setOver(column: Column, index: number) {
  if (over?.column === column && over.index === index) return;
  over = { column, index };
  refresh();
}

function drop() {
  if (dragging && over) moveCard(dragging, over.column, over.index);
  dragging = over = null;
  refresh();
}

function startEdit(card: Card) {
  editing = card;
  editDraft = card.title;
  refresh();
}

function commitEdit(card: Card) {
  if (editing !== card) return;
  const title = editDraft.trim();
  if (title) card.title = title;
  editing = null;
  saveBoard();
  refresh();
}

function CardView(card: Card, column: Column) {
  return div(
    s.kanbanCard,
    { draggable: true, tabIndex: 0 },
    { class: () => cx(s.kanbanCard, card === dragging ? s.kanbanLifted : null, over?.column === column && over.index === column.cards.indexOf(card) ? s.kanbanBefore : null).className },
    {
      onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) startEdit(card); },
      onDragStart: (e) => { e.dataTransfer?.setData("text/plain", card.title); dragging = card; refresh(); },
      onDragEnd: () => { dragging = over = null; refresh(); },
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const below = e.offsetY > e.currentTarget.offsetHeight / 2;
        setOver(column, column.cards.indexOf(card) + (below ? 1 : 0));
      },
    },
    div(s.kanbanCardHead,
      button(s.kanbanPriority, { title: "Change priority", class: () => cx(s.kanbanPriority, s[`kanbanP${card.priority}`]).className, onClick: () => { cyclePriority(card); refresh(); } }, () => PRIORITY[card.priority]),
      span(s.kanbanId, `#${card.id}`),
      button(s.kanbanIcon, { title: "Move to top", "aria-label": "Move to top", onClick: () => { moveCard(card, column, 0); refresh(); } }, "↑"),
      button(s.kanbanIcon, { title: "Delete", "aria-label": "Delete", onClick: () => { removeCard(card); refresh(); } }, "×"),
    ),
    when(() => editing === card,
      input(s.kanbanEdit, { "aria-label": "Card title", value: () => editDraft, onMount: (el) => { el.focus(); el.select(); }, onInput: (e) => { editDraft = e.currentTarget.value; }, onKeyDown: (e) => { if (e.key === "Enter") commitEdit(card); else if (e.key === "Escape") { editing = null; refresh(); } }, onBlur: () => { if (editing === card) commitEdit(card); } }),
    ).else(div(s.kanbanTitle, { title: "Double-click to edit", onDblClick: () => startEdit(card) }, () => card.title)),
  );
}

function ColumnView(column: Column) {
  return section(
    s.kanbanColumn,
    { class: () => cx(s.kanbanColumn, over?.column === column && over.index === column.cards.length ? s.kanbanAfter : null).className },
    {
      onDragOver: (e) => { e.preventDefault(); setOver(column, column.cards.length); },
      onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { over = null; refresh(); } },
      onDrop: (e) => { e.preventDefault(); drop(); },
    },
    header(s.kanbanColumnHead,
      h3(column.title, span(s.kanbanCount, () => String(column.cards.length))),
      button(s.kanbanSmall, { title: "Sort by priority", onClick: () => { sortByPriority(column); refresh(); } }, "Sort"),
      button(s.kanbanSmall, { title: () => (adding === column ? "Close the form" : "Add a task"), "aria-pressed": () => String(adding === column), onClick: () => { adding = adding === column ? null : column; draft = ""; refresh(); } }, "+ Add"),
    ),
    when(() => adding === column, form(s.kanbanAdd, { onSubmit: (e) => { e.preventDefault(); if (draft.trim()) { addCard(column, draft.trim()); draft = ""; adding = null; } refresh(); } },
      input(s.input, { "aria-label": "New task title", placeholder: "What needs to be done?", value: () => draft, onMount: (el) => el.focus(), onInput: (e) => { draft = e.currentTarget.value; }, onKeyDown: (e) => { if (e.key === "Escape") { adding = null; refresh(); } } }),
      button(s.btn, s.primary, { type: "submit" }, "Add"),
    )),
    div(s.kanbanCards,
      list(() => column.cards, (card) => CardView(card, column)),
      when(() => !column.cards.length, p(s.kanbanEmpty, "Drop a task here.")),
    ),
  );
}

export const kanban: Program<null> = {
  name: "Kanban", icon: "kanban", size: [660, 400],
  init: () => { loadBoard(); return null; },
  view: (win) => {
    refresh = () => update(winScopeId(win)); // the board updates only this window
    return div(s.kanban,
      div(s.toolbar,
        strong(s.kanbanHeading, "Board"),
        span(s.kanbanHint, "Drag cards between columns · saved in this browser"),
        button(s.btn, "Reset", { title: "Start the board over", onClick: () => { resetBoard(); refresh(); } }),
      ),
      div(s.kanbanBoard, list(() => columns, ColumnView)),
    );
  },
};
