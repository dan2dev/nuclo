// money.ts: the Finance model. Transactions are plain objects in one array,
// and every chart is a few reduce() calls over them. Pure: no DOM, no
// storage, so it can be unit-tested and reused by the spreadsheet and the
// charts alike. Amounts are plain numbers; a negative amount is spending.
export interface Tx { id: number; date: string; description: string; category: string; amount: number } // "YYYY-MM-DD"

export const CATEGORIES = ["Salary", "Freelance", "Housing", "Food", "Transport", "Utilities", "Health", "Fun", "Shopping", "Other"];

/** One fixed color per category, so the same slice is always the same color. */
export const CATEGORY_COLORS: Record<string, string> = {
  Salary: "#237556", Freelance: "#4a9d84", Housing: "#c25b4e", Food: "#d9a13b", Transport: "#4a7d9c",
  Utilities: "#6a4a94", Health: "#b0762f", Fun: "#d97b8f", Shopping: "#3b8a5e", Other: "#8a93a0",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Hand-rolled number and date formatting: these run inside chart bindings on
// every update, and Intl (toLocaleString / toLocaleDateString) builds a new
// formatter per call — far too slow there.
export const money = (n: number) => {
  const [whole, frac] = Math.abs(n).toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
};
export const signed = (n: number) => (n > 0 ? `+${money(n)}` : n < 0 ? `−${money(-n)}` : money(0));

/** "2026-10-12" → "Oct 12", with the year when it is not the current one. */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return y === new Date().getFullYear() ? `${MONTH_NAMES[m - 1]} ${d}` : `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// The demo ledger: six months of a small household, generated relative to
// today so the charts always cover the recent past. Nothing is written here.
let nextId = 1;
const tx = (date: string, description: string, category: string, amount: number): Tx => ({ id: nextId++, date, description, category, amount });

export function seed(): Tx[] {
  const now = new Date();
  const at = (monthsAgo: number, dayOfMonth: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.min(dayOfMonth, 28));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const txs: Tx[] = [];
  const add = (monthsAgo: number, dayOfMonth: number, description: string, category: string, amount: number) => {
    if (monthsAgo === 0 && dayOfMonth > now.getDate()) return; // no future rows in the current month
    txs.push(tx(at(monthsAgo, dayOfMonth), description, category, amount));
  };
  for (let m = 5; m >= 0; m--) {
    add(m, 1, "Salary", "Salary", 4200);
    add(m, 3, "Rent", "Housing", -1500);
    add(m, 6, "Electricity", "Utilities", -(104 + m * 3));
    add(m, 6, "Internet", "Utilities", -45);
    add(m, 9, "Groceries", "Food", -(290 + m * 9));
    add(m, 12, "Transit pass", "Transport", -60);
    add(m, 15, "Dinner out", "Food", -85);
    add(m, 18, "Cinema", "Fun", -50);
    add(m, 20, "Groceries", "Food", -170);
    add(m, 22, "Clothes", "Shopping", m % 3 === 0 ? -120 : -60);
    add(m, 24, "Gym", "Health", -40);
    if (m % 2 === 0) add(m, 26, "Freelance work", "Freelance", 350);
  }
  return txs;
}

/** Newest first; the same objects, so a list() over it moves rows, not mounts. */
export const byDate = (txs: Tx[]) => [...txs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));

export interface Month { key: string; label: string; income: number; expense: number; net: number; balance: number }

/** Income, spending and running balance for the last `count` months. */
export function monthly(txs: Tx[], count = 6): Month[] {
  const now = new Date();
  const months: Month[] = [];
  for (let m = count - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    months.push({ key: monthKey(d), label: MONTH_NAMES[d.getMonth()], income: 0, expense: 0, net: 0, balance: 0 });
  }
  const byKey = new Map(months.map((month) => [month.key, month]));
  let balance = 0;  for (const t of byDate(txs).reverse()) {
    const month = byKey.get(t.date.slice(0, 7));
    if (!month) { balance += t.amount; continue; } // older than the window: already earned
    if (t.amount >= 0) month.income += t.amount;
    else month.expense += -t.amount;
    month.net += t.amount;
  }
  for (const month of months) { balance += month.net; month.balance = balance; }
  return months;
}

export interface Slice { category: string; value: number; share: number }

/** Spending grouped by category, biggest first. */
export function byCategory(txs: Tx[]): Slice[] {
  const sums = new Map<string, number>();
  for (const t of txs) if (t.amount < 0) sums.set(t.category, (sums.get(t.category) ?? 0) + -t.amount);
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return [...sums.entries()].map(([category, value]) => ({ category, value, share: total ? value / total : 0 })).sort((a, b) => b.value - a.value);
}

/** The whole ledger in three numbers. */
export function totals(txs: Tx[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) t.amount >= 0 ? (income += t.amount) : (expense += -t.amount);
  return { income, expense, balance: income - expense, count: txs.length };
}

/** The current month in three numbers. */
export function monthTotals(txs: Tx[]) {
  const key = monthKey(new Date());
  let income = 0;
  let expense = 0;
  for (const t of txs) if (t.date.slice(0, 7) === key) t.amount >= 0 ? (income += t.amount) : (expense += -t.amount);
  return { income, expense, net: income - expense };
}
