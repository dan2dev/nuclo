// app.ts: the board. Columns are a list() of columns, cards a list() of each
// column's cards. Rows are matched by identity, so reordering inside a column
// (a drag, "Sort", "Top"), assigning a user or editing a card moves or patches
// the existing elements and mounts nothing. A card dropped into another column
// leaves one list and enters another (a filter does the same), so it is built
// again there: watch it flash, and the mount count go up.
import "nuclo";
import { add, columnOf, columns, cyclePriority, edit, initials, move, PRIORITIES, remove, restore, sortByPriority, users, type Card, type Column, type Draft, type User } from "./board.ts";
import { s } from "./styles.ts";

let dragging: Card | null = null;
let over: { column: Column; index: number } | null = null; // where it would land
let mounts = 0;

// Which cards are shown. A filtered-out card stays in its column, only hidden.
const filter = { search: "", user: null as User | "none" | null };

// The open task dialog: a new card for `column`, or `card` being edited.
let dialog: { card: Card | null; column: Column; draft: Draft } | null = null;
let undo: { card: Card; column: Column; index: number } | null = null;
let undoTimer = 0;

const PRIORITY = { 1: "low", 2: "normal", 3: "urgent" };

const matches = (c: Card) => {
  const q = filter.search.trim().toLowerCase();
  if (q && !`${c.title} ${c.description} ${c.assignee?.name ?? ""}`.toLowerCase().includes(q)) return false;
  if (filter.user === "none") return c.assignee === null;
  return !filter.user || c.assignee === filter.user;
};
const visible = (column: Column) => column.cards.filter(matches);
const filtering = () => filter.search.trim() !== "" || filter.user !== null;

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

function openNew(column: Column) {
  dialog = { card: null, column, draft: { title: "", description: "", priority: 2, assignee: filter.user && filter.user !== "none" ? filter.user : null } };
  update();
}

function openEdit(card: Card) {
  const { title, description, priority, assignee } = card;
  dialog = { card, column: columnOf(card), draft: { title, description, priority, assignee } };
  update();
}

const closeDialog = () => { dialog = null; update(); };

function save() {
  if (!dialog || !dialog.draft.title.trim()) return;
  const { card, column, draft } = dialog;
  const next = { ...draft, title: draft.title.trim(), description: draft.description.trim() };
  if (!card) add(column, next);
  else {
    edit(card, next);
    if (columnOf(card) !== column) move(card, column, 0);
  }
  closeDialog();
}

function deleteCard(card: Card) {
  const column = columnOf(card);
  undo = { card, column, index: column.cards.indexOf(card) };
  remove(card);
  clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => { undo = null; update(); }, 6000);
  dialog = null;
  update();
}

function undoDelete() {
  if (!undo) return;
  restore(undo.card, undo.column, undo.index);
  clearTimeout(undoTimer);
  undo = null;
  update();
}

function Avatar(user: () => User | null) {
  return span(
    { class: () => cx(s.avatar, user() ? null : s.nobody).className },
    { style: () => ({ backgroundColor: user()?.color ?? "" }), title: () => user()?.name ?? "Unassigned" },
    () => { const u = user(); return u ? initials(u) : "?"; },
  );
}

function Field(name: string, ...content: NodeModLike<"label">[]) {
  return label(s.field, span(name), ...content);
}

function CardView(card: Card, column: Column) {
  return div(
    s.card,
    { draggable: true, tabIndex: 0 },
    { class: () => cx(s.card, card === dragging ? s.lifted : null, over?.column === column && over.index === column.cards.indexOf(card) ? s.before : null).className },
    // The mount count is the proof: it only moves when a card is built.
    on("mount", () => { mounts++; queueMicrotask(update); }),
    {
      onClick: (e) => { if (!(e.target as HTMLElement).closest("button, select")) openEdit(card); },
      onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) openEdit(card); },
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
      button(s.priority, { type: "button", title: "Change priority", class: () => cx(s.priority, s[`p${card.priority}`]).className }, () => PRIORITY[card.priority], { onClick: () => { cyclePriority(card); update(); } }),
      span(s.id, `#${card.id}`),
      div(s.actions,
        button(s.icon, { type: "button", title: "Move to top", "aria-label": "Move to top" }, "↑", { onClick: () => { move(card, column, 0); update(); } }),
        button(s.icon, { type: "button", title: "Delete", "aria-label": "Delete" }, "×", { onClick: () => deleteCard(card) }),
      ),
    ),
    div(s.title, () => card.title),
    when(() => card.description !== "", p(s.desc, () => card.description)),
    div(s.cardFoot,
      Avatar(() => card.assignee),
      select(s.assign, {
        "aria-label": "Assignee",
        value: () => card.assignee?.id ?? "",
        onChange: (e) => { card.assignee = users.find((u) => u.id === e.currentTarget.value) ?? null; update(); },
      },
        option({ value: "" }, "Unassigned"),
        ...users.map((u) => option({ value: u.id }, u.name))),
    ),
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
      h3(column.title, span(s.count, () => (filtering() ? `${visible(column).length}/${column.cards.length}` : String(column.cards.length)))),
      button(s.small, { type: "button", title: "Sort by priority", onClick: () => { sortByPriority(column); update(); } }, "Sort"),
      button(s.small, { type: "button", title: `Add a task to ${column.title}`, "aria-label": `Add a task to ${column.title}`, onClick: () => openNew(column) }, "+"),
    ),
    div(s.cards,
      list(() => visible(column), (card) => CardView(card, column)),
      when(() => visible(column).length === 0, p(s.empty, () => (column.cards.length ? "No matching tasks" : "Drop a task here"))),
    ),
    button(s.addTask, { type: "button", onClick: () => openNew(column) }, "+ Add task"),
  );
}

function Toolbar() {
  const done = () => columns[columns.length - 1].cards.length;
  const total = () => columns.reduce((n, c) => n + c.cards.length, 0);
  const percent = () => (total() ? Math.round((done() / total()) * 100) : 0);
  const load = (u: User) => columns.slice(0, -1).reduce((n, c) => n + c.cards.filter((card) => card.assignee === u).length, 0);
  return header(
    s.bar,
    div(s.brand, div(s.logo, "▦"), div(h2("Product board"), p(s.sub, () => `${total()} tasks · ${done()} done`))),
    div(s.progress, { role: "progressbar", "aria-label": "Done", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": () => String(percent()) },
      div(s.fill, { style: () => ({ width: `${percent()}%` }) })),
    div(s.tools,
      input(s.search, { type: "search", placeholder: "Search tasks", "aria-label": "Search tasks", value: () => filter.search, onInput: (e) => { filter.search = e.currentTarget.value; update(); } }),
      div(s.team, { role: "group", "aria-label": "Filter by assignee" },
        ...users.map((u) =>
          button(
            { type: "button", class: () => cx(s.member, filter.user === u ? s.picked : null).className, title: () => `${u.name}: ${load(u)} open`, "aria-pressed": () => String(filter.user === u), onClick: () => { filter.user = filter.user === u ? null : u; update(); } },
            Avatar(() => u),
          )),
        button({ type: "button", class: () => cx(s.chip, filter.user === "none" ? s.picked : null).className, "aria-pressed": () => String(filter.user === "none"), onClick: () => { filter.user = filter.user === "none" ? null : "none"; update(); } }, "Unassigned"),
      ),
      button(s.primary, { type: "button", onClick: () => openNew(columns[0]) }, "+ New task"),
    ),
  );
}

function Dialog() {
  const draft = () => dialog?.draft;
  return div(
    s.overlay,
    { onMouseDown: (e) => { if (e.target === e.currentTarget) closeDialog(); }, onKeyDown: (e) => { if (e.key === "Escape") closeDialog(); } },
    form(
      s.dialog,
      { role: "dialog", "aria-modal": "true", "aria-label": () => (dialog?.card ? "Edit task" : "New task"), onSubmit: (e) => { e.preventDefault(); save(); } },
      div(s.dialogHead, h3(() => (dialog?.card ? `Edit task #${dialog.card.id}` : "New task")), button(s.icon, { type: "button", "aria-label": "Close", onClick: closeDialog }, "×")),
      Field("Title",
        input(s.input, { required: true, placeholder: "What needs to be done?", value: () => draft()?.title ?? "", onInput: (e) => { dialog!.draft.title = e.currentTarget.value; update(); } }, on("mount", (el) => el.focus()))),
      Field("Description",
        textarea(s.input, s.area, { rows: 3, placeholder: "Add some details (optional)", value: () => draft()?.description ?? "", onInput: (e) => { dialog!.draft.description = e.currentTarget.value; } })),
      div(s.row,
        Field("Assignee",
          select(s.input, { value: () => draft()?.assignee?.id ?? "", onChange: (e) => { dialog!.draft.assignee = users.find((u) => u.id === e.currentTarget.value) ?? null; update(); } },
            option({ value: "" }, "Unassigned"), ...users.map((u) => option({ value: u.id }, u.name)))),
        Field("Column",
          select(s.input, { value: () => dialog?.column.id ?? "", onChange: (e) => { dialog!.column = columns.find((c) => c.id === e.currentTarget.value)!; update(); } },
            ...columns.map((c) => option({ value: c.id }, c.title)))),
      ),
      div(s.field, span("Priority"),
        div(s.modes, { role: "radiogroup", "aria-label": "Priority" },
          ...PRIORITIES.map((p) =>
            button({ type: "button", role: "radio", class: () => cx(s.mode, draft()?.priority === p.value ? s.on : null).className, "aria-checked": () => String(draft()?.priority === p.value), onClick: () => { dialog!.draft.priority = p.value; update(); } }, p.label)))),
      div(s.dialogFoot,
        when(() => dialog?.card != null, button(s.danger, { type: "button", onClick: () => deleteCard(dialog!.card!) }, "Delete")),
        span(s.grow),
        button(s.btn, { type: "button", onClick: closeDialog }, "Cancel"),
        button(s.primary, { type: "submit", disabled: () => !draft()?.title.trim() }, () => (dialog?.card ? "Save" : "Add task")),
      ),
    ),
  );
}

export function KanbanBoard() {
  return div(
    s.app,
    Toolbar(),
    div(s.board, list(() => columns, ColumnView)),
    p(s.hint, "Drag cards within a column or across columns. ", strong(() => `${mounts} cards mounted`), ": reordering, assigning and editing never build a card. Moving it to another column, or filtering it back in, does."),
    when(() => undo !== null, div(s.toast, { role: "status" }, span(() => `Deleted “${undo?.card.title ?? ""}”`), button(s.link, { type: "button", onClick: undoDelete }, "Undo"))),
    when(() => dialog !== null, Dialog()),
  );
}
