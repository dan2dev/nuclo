// app.ts: the grid. Everything on screen is derived from the 10,000 rows by
// plain functions in data.ts (filter, sort, page), called again on every
// update(). The <tbody> is a list() over the current page, and rows are
// matched by identity: sorting moves the <tr>s that stay on the page, and an
// edited row is the same object in the table, the selection and the totals.
// The "rows built" count proves it: it only grows when a row new to the page appears.
import "nuclo";
import { columns, count, cycleSort, edit, matches, money, page, pages, query, remove, STATUSES, view, type Column, type Row, type Status } from "./data.ts";
import { s } from "./styles.ts";

type Field = HTMLInputElement | HTMLSelectElement;

const CHECK = 40; // px: the checkbox column
const ARROW = { none: "↕", ascending: "↑", descending: "↓" };

const selected = new Set<Row>();
let editing: { row: Row; column: Column } | null = null;
let built = 0;
let counting = false;

// Each <tr> counts itself once, when it is built; one update() after the batch shows the total.
function counted() {
  built++;
  if (counting) return;
  counting = true;
  queueMicrotask(() => { counting = false; update(); });
}

const pick = (row: Row, yes: boolean) => (yes ? selected.add(row) : selected.delete(row));

// Puts the cell's text back in place of the editor. If the editor had the
// focus, the cell takes it, so the keyboard carries on from there.
function close(field: Field) {
  const cell = document.activeElement === field ? field.parentElement : null;
  editing = null;
  update();
  cell?.focus();
}

// Writes the field to its row, unless the browser finds it invalid (an empty
// name, an amount that is not a number): then the editor stays open, in red.
function save(field: Field) {
  if (!editing || !field.checkValidity()) return;
  const { row, column } = editing;
  if (column.key === "amount") edit(row, "amount", Number(field.value));
  else if (column.key === "status") edit(row, "status", field.value as Status);
  else edit(row, "name", field.value);
  close(field);
}

// Enter or leaving the field saves, Escape cancels.
const fieldEvents = {
  onBlur: (e: FocusEvent & { currentTarget: Field }) => save(e.currentTarget),
  onKeyDown: (e: KeyboardEvent & { currentTarget: Field }) => {
    if (e.key === "Enter") save(e.currentTarget);
    if (e.key === "Escape") {
      e.preventDefault(); // the docs modal closes on Escape: this one is ours
      close(e.currentTarget);
    }
  },
};

function Editor(row: Row, column: Column) {
  if (column.key === "status") {
    return select(s.editor, fieldEvents, { value: () => row.status, "aria-label": "Status", onChange: (e) => save(e.currentTarget) },
      on("mount", (el) => el.focus()),
      ...STATUSES.map((status) => option({ value: status }, status)));
  }
  const amount = column.key === "amount";
  return input(s.editor, fieldEvents, {
    value: () => String(row[column.key]), required: true, inputMode: amount ? "decimal" : "text", "aria-label": column.label,
    pattern: amount ? "\\d+(\\.\\d{1,2})?" : undefined, // a plain number, up to two decimals
  }, on("mount", (el) => { el.focus(); el.select(); }));
}

const text = (row: Row, column: Column) => column.format?.(row) ?? String(row[column.key]);

// A plain cell is static text: its field never changes. An editable one reads
// its row on every update(), and swaps in an editor on double-click or Enter.
function Cell(row: Row, column: Column) {
  const style = cx(s.td, column.align === "right" && s.right);
  if (!column.editable) return td(style, text(row, column));
  const startEdit = () => { editing = { row, column }; update(); };
  return td(
    style, s.editable,
    { tabIndex: 0, onDblClick: startEdit, onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) startEdit(); } },
    when(() => editing?.row === row && editing.column === column, Editor(row, column)).else(
      column.key === "status" ? span({ class: () => cx(s.pill, s[row.status]).className }, () => row.status) : span(() => text(row, column)),
    ),
  );
}

function RowView(row: Row) {
  return tr(
    { class: () => cx(s.tr, selected.has(row) && s.picked).className },
    on("mount", counted),
    td(s.td, s.check, input({ type: "checkbox", "aria-label": `Select row ${row.id}`, checked: () => selected.has(row), onChange: (e) => { pick(row, e.currentTarget.checked); update(); } })),
    ...columns.map((column) => Cell(row, column)),
  );
}

// Checked when the whole page is selected, a dash when part of it is.
function PageCheckbox() {
  const state = () => {
    const onPage = query();
    const n = onPage.filter((row) => selected.has(row)).length;
    return n === 0 ? "none" : n === onPage.length ? "all" : "some";
  };
  return input({
    type: "checkbox", "aria-label": "Select every row on this page", checked: () => state() === "all", indeterminate: () => state() === "some",
    onChange: (e) => { for (const row of query()) pick(row, e.currentTarget.checked); update(); },
  });
}

function HeaderCell(column: Column) {
  const sort = () => (view.sort !== column.key ? "none" : view.desc ? "descending" : "ascending");
  let from = { x: 0, width: 0 }; // where the resize drag started
  return th(
    s.th,
    { "aria-sort": sort },
    button(cx(s.sort, column.align === "right" && s.right), { onClick: () => { cycleSort(column.key); update(); } }, column.label, span(s.arrow, () => ARROW[sort()])),
    // Drag the edge to resize. The pointer is captured, so the drag goes on outside the header.
    span(s.resize, {
      title: `Resize ${column.label}`,
      onPointerDown: (e) => { e.currentTarget.setPointerCapture(e.pointerId); from = { x: e.clientX, width: column.width }; },
      onPointerMove: (e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        column.width = Math.max(56, from.width + e.clientX - from.x);
        update();
      },
    }),
  );
}

function Toolbar() {
  return div(
    s.toolbar,
    input(s.search, {
      type: "search", placeholder: "Search name, email, company, country", "aria-label": "Search", value: view.search,
      onInput: (e) => { view.search = e.currentTarget.value; view.page = 0; update(); },
    }),
    select(s.select, { value: view.status, "aria-label": "Status", onChange: (e) => { view.status = e.currentTarget.value as Status | ""; view.page = 0; update(); } },
      option({ value: "" }, "All statuses"),
      ...STATUSES.map((status) => option({ value: status }, status))),
    when(() => selected.size > 0, div(
      s.bulk,
      span(() => `${count.format(selected.size)} selected`),
      button(s.btn, s.danger, "Delete", { onClick: () => { remove(selected); selected.clear(); update(); } }),
      button(s.btn, "Clear selection", { onClick: () => { selected.clear(); update(); } }),
    )),
  );
}

function Table() {
  return div(
    s.scroller,
    table(
      s.table,
      { style: () => ({ width: `max(100%, ${columns.reduce((sum, column) => sum + column.width, CHECK)}px)` }) },
      colgroup(col({ style: { width: `${CHECK}px` } }), ...columns.map((column) => col({ style: () => ({ width: `${column.width}px` }) }))),
      thead(tr(th(s.th, s.check, PageCheckbox()), ...columns.map(HeaderCell))),
      tbody(
        list(query, RowView),
        when(() => matches().length === 0, tr(td(s.empty, { colSpan: columns.length + 1 }, "No rows match."))),
      ),
    ),
  );
}

function PageButton(icon: string, title: string, target: () => number) {
  const to = () => Math.max(0, Math.min(target(), pages() - 1));
  return button(s.btn, s.icon, { title, "aria-label": title, disabled: () => to() === page(), onClick: () => { view.page = to(); update(); } }, icon);
}

function Footer() {
  return footer(
    s.footer,
    span(() => {
      const total = matches().length;
      const first = page() * view.size;
      return total === 0 ? "No rows" : `Showing ${count.format(first + 1)}–${count.format(Math.min(first + view.size, total))} of ${count.format(total)}`;
    }),
    span(s.totals, () => {
      const sum = matches().reduce((total, row) => total + row.amount, 0);
      return `Total ${money.format(sum)} · avg ${money.format(sum / (matches().length || 1))}`;
    }),
    label(s.size, "Rows", select(s.select, { value: String(view.size), onChange: (e) => { view.size = Number(e.currentTarget.value); view.page = 0; update(); } },
      ...[25, 50, 100].map((n) => option({ value: String(n) }, String(n))))),
    div(
      s.pager,
      PageButton("«", "First page", () => 0),
      PageButton("‹", "Previous page", () => page() - 1),
      PageButton("›", "Next page", () => page() + 1),
      PageButton("»", "Last page", () => pages() - 1),
    ),
  );
}

export function DataGrid() {
  return div(
    s.app,
    p(s.hint, strong(() => `${count.format(built)} rows built`), ". Sorting moves the rows that stay on the page and builds only the new ones: search \"elif.novak\", then sort. Double-click a name, status or amount to edit it."),
    Toolbar(),
    Table(),
    Footer(),
  );
}
