// finance.ts: personal finance for the desktop — an editable ledger
// spreadsheet and a dashboard of charts over the same array. Every Tx is a
// plain object; the spreadsheet edits cells in place and the charts read the
// same array through function bindings, so editing a cell moves every chart.
// The ledger is saved to IndexedDB after every change and loaded on mount.
//
// Like the rest of the desktop, views are built once and update() re-runs
// the dynamic bindings — so the charts take their data as factories, and the
// two tabs stay mounted with their visibility toggled by a binding. Updates
// are scoped: keystrokes and edits refresh only this window, and the chart
// hover refreshes only the charts sub-scope, never the 63-row spreadsheet.
import "nuclo";
import type { Program } from "./programs.ts";
import { winScopeId } from "./windows.ts";
import { byCategory, byDate, CATEGORIES, CATEGORY_COLORS, fmtDate, money, monthly, monthTotals, seed, signed, totals, type Tx } from "./money.ts";
import { deleteTx, loadTxs, replaceAll, saveTx, supported } from "./db.ts";
import { BarChart, DonutChart, LineChart, type DonutSlice } from "./charts.ts";
import { s } from "./styles.ts";

interface FinState {
  txs: Tx[];
  loaded: boolean;
  tab: "charts" | "sheet";
  editing: { id: number; field: Field } | null;
  draft: string;
  error: string;
}
type Field = "date" | "description" | "category" | "amount";
type KeyEvent = KeyboardEvent & { currentTarget: HTMLElement };

let nextId = 1;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

function commit(state: FinState, scopeId: string) {
  const e = state.editing;
  if (!e) return;
  const t = state.txs.find((tx) => tx.id === e.id);
  if (t) {
    const v = state.draft.trim();
    if (e.field === "date") t.date = v || t.date;
    else if (e.field === "description") t.description = v;
    else if (e.field === "category") t.category = v || t.category;
    else if (e.field === "amount") { const n = Number(v); if (Number.isFinite(n)) t.amount = n; }
    saveTx(t);
  }
  state.editing = null;
  update(scopeId);
}

/** One cell of the spreadsheet: a button that shows the value, or the editor. */
function Cell(state: FinState, t: Tx, field: Field, scopeId: string) {
  const start = () => { state.editing = { id: t.id, field }; state.draft = String(t[field]); update(scopeId); };
  const display = () => {
    if (field === "amount") return signed(t.amount);
    if (field === "date") return fmtDate(t.date);
    if (field === "category") return t.category;
    return t.description || "—";
  };
  const keys = (e: KeyEvent) => {
    if (e.key === "Enter") commit(state, scopeId);
    else if (e.key === "Escape") { state.editing = null; update(scopeId); }
  };
  return when(() => state.editing?.id === t.id && state.editing.field === field,
    field === "category" ? select(s.finInput,
      { "aria-label": "Category", value: () => state.draft, onMount: (el) => el.focus(), onChange: (e) => { state.draft = e.currentTarget.value; }, onBlur: () => commit(state, scopeId), onKeyDown: keys },
      ...CATEGORIES.map((c) => option({ value: c }, c)))
    : input(s.finInput,
      { "aria-label": field, type: field === "date" ? "date" : field === "amount" ? "number" : "text", step: field === "amount" ? "0.01" : undefined, value: () => state.draft, onMount: (el) => { el.focus(); el.select(); }, onInput: (e) => { state.draft = e.currentTarget.value; }, onBlur: () => commit(state, scopeId), onKeyDown: keys }),
  ).else(button(s.finCell, { title: "Click to edit", class: () => cx(s.finCell, field === "description" && !t.description ? s.finPlaceholder : null).className, onClick: start }, () => display()));
}

function RowView(state: FinState, t: Tx, scopeId: string) {
  return tr(s.finRow,
    td(s.finTd, Cell(state, t, "date", scopeId)),
    td(s.finTd, Cell(state, t, "description", scopeId)),
    td(s.finTd, Cell(state, t, "category", scopeId)),
    td(s.finTd, s.finAmount, { class: () => cx(s.finTd, s.finAmount, t.amount < 0 ? s.finExpense : s.finIncome).className }, Cell(state, t, "amount", scopeId)),
    td(s.finTd, s.finDelete, button(s.finIcon, { title: "Delete", "aria-label": "Delete", onClick: () => { state.txs.splice(state.txs.indexOf(t), 1); state.editing = null; deleteTx(t.id); update(scopeId); } }, "×")),
  );
}

function SheetView(state: FinState, scopeId: string) {
  const rows = () => byDate(state.txs);
  return div(s.finSheet,
    div(s.finScroller,
      table(s.finTable,
        thead(tr(
          th(s.finTh, "Date"), th(s.finTh, "Description"), th(s.finTh, "Category"),
          th(s.finTh, s.finAmount, "Amount"), th(s.finTh, s.finDelete),
        )),
        tbody(
          list(() => rows(), (t) => RowView(state, t, scopeId)),
          when(() => !rows().length, tr(td(s.finEmpty, { colSpan: 5 }, "No transactions yet. Add one, or reset the demo data."))),
        ),
      ),
    ),
    div(s.finFoot,
      button(s.btn, s.primary, "＋ Add", { onClick: () => {
        const t: Tx = { id: nextId++, date: today(), description: "", category: "Other", amount: 0 };
        state.txs.push(t);
        state.editing = { id: t.id, field: "description" };
        state.draft = "";
        saveTx(t);
        update(scopeId);
      } }),
      span(() => `${rows().length} transactions`),
      span(s.finFootTotal, "Balance ", strong(() => signed(totals(state.txs).balance))),
    ),
  );
}

function StatCard(title: string, sub: string, value: () => string, positive: () => boolean) {
  return div(s.finCard, s.finStat,
    span(s.finStatTitle, title), span(s.finStatSub, sub),
    strong({ class: () => cx(s.finStatValue, positive() ? s.finPos : s.finNeg).className }, value),
  );
}

/** Every category, with its spending, in a fixed order: the donut keeps its segments. */
const donutSlices = (txs: Tx[]): DonutSlice[] => {
  const sums = new Map<string, number>();
  for (const t of txs) if (t.amount < 0) sums.set(t.category, (sums.get(t.category) ?? 0) + -t.amount);
  return CATEGORIES.map((category) => ({ label: category, value: sums.get(category) ?? 0, color: CATEGORY_COLORS[category] ?? "#8a93a0" }));
};

function ChartsView(state: FinState, scopeId: string) {
  const months = () => monthly(state.txs, 6);
  const top = () => byCategory(state.txs);
  // The legend is six fixed slots (no list() rebuilds on every update); each
  // slot reads the i-th biggest category, hiding itself when there is none.
  const Legend = () => div(s.finLegend, ...Array.from({ length: 6 }, (_, i) => div(s.finLegendItem,
    { class: () => cx(s.finLegendItem, top()[i] ? null : s.finHidden).className },
    span(s.finLegendDot, { style: () => ({ backgroundColor: top()[i] ? CATEGORY_COLORS[top()[i].category] ?? "#8a93a0" : "transparent" }) }),
    span(s.finLegendLabel, () => top()[i]?.category ?? ""),
    span(s.finLegendValue, () => top()[i] ? `${Math.round(top()[i].share * 100)}% · −${money(top()[i].value)}` : ""),
  )));
  return div(s.finCharts,
    div(s.finCards,
      StatCard("Balance", "all time", () => signed(totals(state.txs).balance), () => totals(state.txs).balance >= 0),
      StatCard("Income", "this month", () => `+${money(monthTotals(state.txs).income)}`, () => true),
      StatCard("Spending", "this month", () => `−${money(monthTotals(state.txs).expense)}`, () => false),
      StatCard("Saved", "this month", () => signed(monthTotals(state.txs).net), () => monthTotals(state.txs).net >= 0),
    ),
    div(s.finGrid,
      section(s.finCard, s.finWide,
        div(s.finCardHead, h3("Balance"), span(s.finCardSub, "running total · last 6 months · hover the line")),
        LineChart("balance", () => months().map((m) => ({ label: m.label, value: Math.round(m.balance) })), { height: 168, area: true, color: "#237556", format: (n) => money(n), scope: scopeId }),
      ),
      section(s.finCard,
        div(s.finCardHead, h3("Spending"), span(s.finCardSub, "by category · all time")),
        div(s.finDonutRow,
          DonutChart(() => donutSlices(state.txs), { value: () => `−${money(totals(state.txs).expense)}`, sub: "all time" }),
          Legend(),
        ),
      ),
      section(s.finCard, s.finWide,
        div(s.finCardHead, h3("Income and spending"), span(s.finCardSub, "per month · last 6 months")),
        BarChart(() => months().map((m) => ({ label: m.label, values: [{ value: m.income, color: "#237556" }, { value: m.expense, color: "#c25b4e" }] })), { format: (n) => money(n) }),
        div(s.finKey,
          span(s.finKeyItem, span(s.finLegendDot, { style: { backgroundColor: "#237556" } }), "Income"),
          span(s.finKeyItem, span(s.finLegendDot, { style: { backgroundColor: "#c25b4e" } }), "Spending"),
        ),
      ),
    ),
  );
}

export const finance: Program<FinState> = {
  name: "Finance", icon: "finance", size: [780, 500],
  init: () => ({ txs: [], loaded: false, tab: "charts", editing: null, draft: "", error: "" }),
  view: (win) => {
    const state = win.state;
    const scopeId = winScopeId(win);
    const chartsScope = `os-fin-charts-${win.id}`; // the hover refreshes the charts, not the spreadsheet
    return div(s.finance,
      // IndexedDB only exists in the browser, so the ledger loads on mount,
      // not at init: the server renders the window with its loading state.
      on("mount", async () => {
        if (state.loaded) return;
        if (!supported()) { state.error = "IndexedDB is not available here."; state.loaded = true; update(scopeId); return; }
        try {
          let rows = await loadTxs();
          if (!rows.length) { rows = seed(); await replaceAll(rows); }
          state.txs = rows;
          nextId = rows.reduce((m, t) => Math.max(m, t.id), 0) + 1;
        } catch (error) { state.error = (error as Error).message; }
        state.loaded = true;
        update(scopeId);
      }),
      div(s.toolbar,
        strong(s.financeHeading, "Finance"),
        div(s.finTabs, { role: "tablist", "aria-label": "Finance views" },
          button({ role: "tab", "aria-selected": () => String(state.tab === "charts"), class: () => cx(s.finTab, state.tab === "charts" ? s.finTabOn : null).className, onClick: () => { state.tab = "charts"; update(scopeId); } }, "Charts"),
          button({ role: "tab", "aria-selected": () => String(state.tab === "sheet"), class: () => cx(s.finTab, state.tab === "sheet" ? s.finTabOn : null).className, onClick: () => { state.tab = "sheet"; update(scopeId); } }, "Spreadsheet"),
        ),
        span(s.finHint, "Saved in this browser · IndexedDB"),
        button(s.btn, "Reset demo", { title: "Restore the sample ledger", disabled: () => !state.loaded, onClick: () => {
          const fresh = seed();
          state.txs = fresh;
          nextId = fresh.reduce((m, t) => Math.max(m, t.id), 0) + 1;
          replaceAll(fresh);
          update(scopeId);
        } }),
      ),
      when(() => !!state.error, p(s.error, { role: "alert" }, () => state.error)),
      // Both tabs stay mounted; a binding toggles the visible one. That way
      // the charts and the sheet are built once and update() keeps them live.
      p(s.finLoading, { class: () => cx(s.finLoading, state.loaded ? s.finHidden : null).className }, "Opening the ledger…"),
      div(s.finBody, scope(chartsScope), { class: () => cx(s.finBody, state.loaded && state.tab === "charts" ? null : s.finHidden).className }, ChartsView(state, chartsScope)),
      div(s.finBody, { class: () => cx(s.finBody, state.loaded && state.tab === "sheet" ? null : s.finHidden).className }, SheetView(state, scopeId)),
    );
  },
};
