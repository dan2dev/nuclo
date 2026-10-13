import { expect, test } from "bun:test";
import { byCategory, byDate, fmtDate, money, monthly, monthTotals, seed, signed, totals } from "../src/demos/apps/desktop/money.ts";

test("the demo ledger is seeded in date order with income and spending", () => {
  const txs = seed();
  expect(txs.length).toBeGreaterThan(30);
  const dates = txs.map((t) => t.date);
  expect(dates).toEqual([...dates].sort());
  expect(txs.some((t) => t.amount > 0)).toBe(true);
  expect(txs.some((t) => t.amount < 0)).toBe(true);
  expect(new Set(txs.map((t) => t.id)).size).toBe(txs.length); // unique ids
});

test("monthly() sums income, spending and a running balance over 6 months", () => {
  const months = monthly(seed(), 6);
  expect(months).toHaveLength(6);
  expect(new Set(months.map((m) => m.label)).size).toBe(6);
  const full = months.filter((m) => m.income > 0);
  expect(full.length).toBeGreaterThanOrEqual(5);
  expect(full[0].income).toBe(4200); // the salary is the same every month
  expect(full[0].expense).toBeGreaterThan(full[0].income - 4200); // spending > 0
  // every net is income minus spending, and balances accumulate
  for (const m of months) {
    expect(m.net).toBeCloseTo(m.income - m.expense);
    expect(m.balance).toBeGreaterThan(0);
  }
  expect(months[5].balance).toBeCloseTo(months[5].net + months[4].balance);
});

test("byCategory() groups spending biggest first and shares sum to one", () => {
  const slices = byCategory(seed());
  expect(slices.length).toBeGreaterThan(3);
  for (let i = 1; i < slices.length; i++) expect(slices[i - 1].value).toBeGreaterThanOrEqual(slices[i].value);
  expect(slices.reduce((a, s) => a + s.share, 0)).toBeCloseTo(1);
  expect(slices[0].category).toBe("Housing"); // the rent dominates
});

test("totals() and monthTotals() split income from spending", () => {
  const txs = seed();
  const all = totals(txs);
  expect(all.income).toBeGreaterThan(0);
  expect(all.expense).toBeGreaterThan(0);
  expect(all.balance).toBeCloseTo(all.income - all.expense);
  expect(all.count).toBe(txs.length);
  const month = monthTotals(txs);
  expect(month.income).toBeGreaterThanOrEqual(0);
  expect(month.expense).toBeGreaterThanOrEqual(0);
  expect(month.net).toBeCloseTo(month.income - month.expense);
});

test("byDate() sorts newest first without copying the objects", () => {
  const txs = seed();
  const sorted = byDate(txs);
  expect(txs.includes(sorted[0])).toBe(true); // the same objects, reordered
  const dates = sorted.map((t) => t.date);
  expect(dates).toEqual([...dates].sort((a, b) => (a < b ? 1 : -1)));
});

test("formatting helpers read like a ledger", () => {
  expect(money(4200)).toBe("4,200.00");
  expect(signed(-320)).toBe("−320.00");
  expect(signed(350)).toBe("+350.00");
  expect(signed(0)).toBe("0.00");
  expect(fmtDate("2026-10-12")).toBe("Oct 12");
  expect(fmtDate("2025-12-31")).toBe("Dec 31, 2025");
});
