// kanban.ts: the Kanban window. The model lives in board.ts, shared by every
// window and saved after each change; this file is the view. Columns are a
// list() of columns, cards a list() of each column's cards. Rows are matched
// by identity, so dragging a card, sorting a column or renaming a card
// splices or patches the same objects and the elements just move. Every
// Kanban window shows the same board, so a change refreshes all of them; the
// forms being typed in belong to their own window.
import "nuclo";
import type { Program } from "./programs.ts";
import { addCard, columns, cyclePriority, loadBoard, moveCard, removeCard, resetBoard, saveBoard, sortByPriority, type Card, type Column } from "./board.ts";
import { scopesOf, type Win } from "./windows.ts";
import { s } from "./styles.ts";

interface Forms {
  adding: Column | null; // the column whose new-card form is open
  draft: string; // the title being typed in that form
  editing: Card | null; // the card whose title is being typed
  editDraft: string;
}
type KanbanWin = Win<Forms>;

const PRIORITY = { 1: "low", 2: "normal", 3: "urgent" };

// One drag at a time, across every Kanban window: a card can be dropped into another one.
let dragging: Card | null = null;
let over: { win: KanbanWin; column: Column; index: number } | null = null; // where it would land

/** The board is shared, so every Kanban window updates, and nothing else. */
const refresh = () => update(...scopesOf(kanban));

const isOver = (win: KanbanWin, column: Column, index: number) => over?.win === win && over.column === column && over.index === index;

function setOver(win: KanbanWin, column: Column, index: number) {
  if (isOver(win, column, index)) return;
  over = { win, column, index };
  refresh();
}

function drop() {
  if (dragging && over) moveCard(dragging, over.column, over.index);
  dragging = over = null;
  refresh();
}

function startEdit(forms: Forms, card: Card) {
  forms.editing = card;
  forms.editDraft = card.title;
  refresh();
}

function commitEdit(forms: Forms, card: Card) {
  if (forms.editing !== card) return;
  const title = forms.editDraft.trim();
  if (title) card.title = title;
  forms.editing = null;
  saveBoard();
  refresh();
}

function CardView(win: KanbanWin, card: Card, column: Column) {
  const forms = win.state;
  return div(
    s.kanbanCard,
    { draggable: true, tabIndex: 0 },
    { class: () => cx(s.kanbanCard, card === dragging ? s.kanbanLifted : null, isOver(win, column, column.cards.indexOf(card)) ? s.kanbanBefore : null).className },
    {
      onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) startEdit(forms, card); },
      onDragStart: (e) => { e.dataTransfer?.setData("text/plain", card.title); dragging = card; refresh(); },
      onDragEnd: () => { dragging = over = null; refresh(); },
      onDragOver: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const below = e.offsetY > e.currentTarget.offsetHeight / 2;
        setOver(win, column, column.cards.indexOf(card) + (below ? 1 : 0));
      },
    },
    div(s.kanbanCardHead,
      button(s.kanbanPriority, { title: "Change priority", class: () => cx(s.kanbanPriority, s[`kanbanP${card.priority}`]).className, onClick: () => { cyclePriority(card); refresh(); } }, () => PRIORITY[card.priority]),
      span(s.kanbanId, `#${card.id}`),
      button(s.kanbanIcon, { title: "Move to top", "aria-label": "Move to top", onClick: () => { moveCard(card, column, 0); refresh(); } }, "↑"),
      button(s.kanbanIcon, { title: "Delete", "aria-label": "Delete", onClick: () => { removeCard(card); refresh(); } }, "×"),
    ),
    when(() => forms.editing === card,
      input(s.kanbanEdit, { "aria-label": "Card title", value: () => forms.editDraft, onMount: (el) => { el.focus(); el.select(); }, onInput: (e) => { forms.editDraft = e.currentTarget.value; }, onKeyDown: (e) => { if (e.key === "Enter") commitEdit(forms, card); else if (e.key === "Escape") { forms.editing = null; refresh(); } }, onBlur: () => { if (forms.editing === card) commitEdit(forms, card); } }),
    ).else(div(s.kanbanTitle, { title: "Double-click to edit", onDblClick: () => startEdit(forms, card) }, () => card.title)),
  );
}

function ColumnView(win: KanbanWin, column: Column) {
  const forms = win.state;
  return section(
    s.kanbanColumn,
    { class: () => cx(s.kanbanColumn, isOver(win, column, column.cards.length) ? s.kanbanAfter : null).className },
    {
      onDragOver: (e) => { e.preventDefault(); setOver(win, column, column.cards.length); },
      onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { over = null; refresh(); } },
      onDrop: (e) => { e.preventDefault(); drop(); },
    },
    header(s.kanbanColumnHead,
      h3(column.title, span(s.kanbanCount, () => String(column.cards.length))),
      button(s.kanbanSmall, { title: "Sort by priority", onClick: () => { sortByPriority(column); refresh(); } }, "Sort"),
      button(s.kanbanSmall, { title: () => (forms.adding === column ? "Close the form" : "Add a task"), "aria-pressed": () => String(forms.adding === column), onClick: () => { forms.adding = forms.adding === column ? null : column; forms.draft = ""; refresh(); } }, "+ Add"),
    ),
    when(() => forms.adding === column, form(s.kanbanAdd, { onSubmit: (e) => { e.preventDefault(); if (forms.draft.trim()) { addCard(column, forms.draft.trim()); forms.draft = ""; forms.adding = null; } refresh(); } },
      input(s.input, { "aria-label": "New task title", placeholder: "What needs to be done?", value: () => forms.draft, onMount: (el) => el.focus(), onInput: (e) => { forms.draft = e.currentTarget.value; }, onKeyDown: (e) => { if (e.key === "Escape") { forms.adding = null; refresh(); } } }),
      button(s.btn, s.primary, { type: "submit" }, "Add"),
    )),
    div(s.kanbanCards,
      list(() => column.cards, (card) => CardView(win, card, column)),
      when(() => !column.cards.length, p(s.kanbanEmpty, "Drop a task here.")),
    ),
  );
}

export const kanban: Program<Forms> = {
  name: "Kanban", icon: "kanban", size: [660, 400],
  init: () => { loadBoard(); return { adding: null, draft: "", editing: null, editDraft: "" }; },
  view: (win) => div(s.kanban,
    div(s.toolbar,
      strong(s.kanbanHeading, "Board"),
      span(s.kanbanHint, "Drag cards between columns · saved in this browser"),
      button(s.btn, "Reset", { title: "Start the board over", onClick: () => { resetBoard(); refresh(); } }),
    ),
    div(s.kanbanBoard, list(() => columns, (column) => ColumnView(win, column))),
  ),
};
