// data.ts: the model. 10,000 rows of plain objects, each generated from its
// index, so the server and the browser build the same table. What the grid
// shows is plain functions over that array: filter, sort, then the page slice.
// An edit writes to the row object itself. Nothing here knows about the UI.

export type Status = "active" | "invited" | "suspended";
export const STATUSES: Status[] = ["active", "invited", "suspended"];

export interface Row {
  id: number;
  name: string;
  email: string;
  company: string;
  country: string;
  status: Status;
  amount: number;
  joined: string; // an ISO date, so it sorts as text
}

export interface Column {
  key: keyof Row;
  label: string;
  width: number; // px: resizing a column writes it here
  align?: "right";
  format?: (row: Row) => string;
  editable?: boolean;
}

// One fixed locale, so the server and the browser print the same text.
export const count = new Intl.NumberFormat("en-US");
export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const day = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export const columns: Column[] = [
  { key: "id", label: "ID", width: 64, align: "right" },
  { key: "name", label: "Name", width: 160, editable: true },
  { key: "email", label: "Email", width: 210 },
  { key: "company", label: "Company", width: 120 },
  { key: "country", label: "Country", width: 110 },
  { key: "status", label: "Status", width: 110, editable: true },
  { key: "amount", label: "Amount", width: 120, align: "right", format: (row) => money.format(row.amount), editable: true },
  { key: "joined", label: "Joined", width: 120, format: (row) => day.format(new Date(row.joined)) },
];

const FIRST = ["Ana", "Bruno", "Chen", "Dana", "Elif", "Farah", "Gabriel", "Hana", "Igor", "Julia", "Kofi", "Lena", "Marta", "Nikhil", "Olga", "Pedro"];
const LAST = ["Silva", "Okafor", "Tanaka", "Novak", "Haddad", "Larsen", "Moreau", "Kowalski", "Costa", "Nguyen", "Fischer", "Rossi"];
const COMPANIES = ["Acme", "Globex", "Initech", "Hooli", "Northwind", "Contoso", "Vandelay", "Umbrella"];
const COUNTRIES = ["Brazil", "Canada", "France", "Germany", "India", "Japan", "Kenya", "Mexico", "Portugal", "Sweden"];

// A small integer hash: every field of a row is a deterministic function of its index.
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
const pick = <T>(list: readonly T[], i: number, salt: number) => list[hash(i * 8 + salt) % list.length];

const rows: Row[] = Array.from({ length: 10_000 }, (_, i) => {
  const [first, last, company] = [pick(FIRST, i, 1), pick(LAST, i, 2), pick(COMPANIES, i, 3)];
  return {
    id: i + 1, name: `${first} ${last}`, email: `${first}.${last}@${company}.com`.toLowerCase(), company,
    country: pick(COUNTRIES, i, 4), status: pick(STATUSES, i, 5), amount: (hash(i * 8 + 6) % 1_000_000) / 100,
    joined: new Date(Date.UTC(2018, 0, 1 + (hash(i * 8 + 7) % 2900))).toISOString().slice(0, 10),
  };
});

// What the grid asks for; query() turns it into the rows on screen. A status of "" is every status.
export const view = { search: "", status: "" as Status | "", sort: null as keyof Row | null, desc: false, page: 0, size: 50 };

const SEARCHED = ["name", "email", "company", "country"] as const;

// A one-entry memo. Filtering and sorting 10,000 rows takes a few milliseconds:
// fine once per keystroke, wasteful on every update() (a column resize runs one
// per pointer move, and several parts of the grid read the result each time).
let memo: { key: string; rows: Row[] } | null = null;

/** Every row that passes the search and the status filter, in sort order. */
export function matches() {
  const key = JSON.stringify([view.search, view.status, view.sort, view.desc]);
  if (memo?.key === key) return memo.rows;
  const q = view.search.trim().toLowerCase();
  const found = rows.filter((row) => (!view.status || row.status === view.status) && (!q || SEARCHED.some((field) => row[field].toLowerCase().includes(q))));
  const by = view.sort;
  if (by) {
    const dir = view.desc ? -1 : 1;
    // sort() is stable: rows with equal values stay in id order.
    found.sort((a, b) => (a[by] < b[by] ? -dir : a[by] > b[by] ? dir : 0));
  }
  memo = { key, rows: found };
  return found;
}

export const pages = () => Math.max(1, Math.ceil(matches().length / view.size));
/** The page on screen, kept in range when the rows behind it shrink. */
export const page = () => Math.min(view.page, pages() - 1);
/** The rows of the current page. */
export const query = () => matches().slice(page() * view.size, (page() + 1) * view.size);

/** A header click: ascending, then descending, then back to id order. */
export function cycleSort(key: keyof Row) {
  if (view.sort !== key) [view.sort, view.desc] = [key, false];
  else if (!view.desc) view.desc = true;
  else view.sort = null;
}

/** Writes one field. The row stays the same object, wherever it is used. */
export function edit<K extends keyof Row>(row: Row, key: K, value: Row[K]) {
  row[key] = value;
  memo = null; // it may filter or sort differently now
}

/** Deletes rows in place: every other row keeps its object. */
export function remove(gone: Set<Row>) {
  let kept = 0;
  for (const row of rows) if (!gone.has(row)) rows[kept++] = row;
  rows.length = kept;
  memo = null;
}
