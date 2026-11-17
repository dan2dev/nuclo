/** Adapters (src/adapters.ts): compareText / collator, formatNumber, formatDate. Top-level names start with `ad`. */
import { collator, compareText, formatDate, formatNumber } from "../../src/adapters.ts";

export function adCompare(): string[] {
  const words = ["résumé", "resume", "Resume", "RÉSUMÉ", "zebra", "Zebra", "äpfel", "apfel", "Apfel", "item 10", "item 2", "item 02", "item1", "", "a", "é", "é"];
  const out: string[] = [];
  for (const s of ["base", "accent", "case", "variant"] as const) {
    out.push(`${s}: ${words.slice().sort(collator({ sensitivity: s })).join("|")}`);
    out.push(`${s} numeric: ${words.slice().sort(collator({ sensitivity: s, numeric: true })).join("|")}`);
  }
  const pairs: [string, string][] = [["a", "A"], ["a", "á"], ["é", "é"], ["x2", "x10"], ["x02", "x2"], ["ab", "a"], ["", ""], ["😀", "a"]];
  for (const [a, b] of pairs) {
    out.push(`${a}/${b}: ${compareText(a, b)} ${compareText(a, b, { sensitivity: "base" })} ${compareText(a, b, { sensitivity: "accent" })} ${compareText(a, b, { sensitivity: "case" })} ${compareText(a, b, { numeric: true })}`);
  }
  return out;
}

export function adNumbers(): string[] {
  const values = [0, -0, 1, -1, 0.5, 1.5, 2.5, -2.5, 1.005, 1234.5, 1234567.891, -9876543.21, 0.000123, 1.5e-7, 9.9995, 999.9996, 1e21, 123456789012345680000, 1e-7, 0.1 + 0.2, NaN, Infinity, -Infinity, -0.0001];
  const out: string[] = [];
  for (const v of values) {
    out.push(
      [
        formatNumber(v),
        formatNumber(v, { minFractionDigits: 2 }),
        formatNumber(v, { maxFractionDigits: 0 }),
        formatNumber(v, { minFractionDigits: 1, maxFractionDigits: 4, grouping: false }),
        formatNumber(v, { minIntegerDigits: 3, maxFractionDigits: 1, groupSeparator: ".", decimalSeparator: "," }),
        formatNumber(v, { maxFractionDigits: 10, groupSeparator: " " }),
      ].join(" ; "),
    );
  }
  return out;
}

export function adDates(): string[] {
  const dates = [new Date(Date.UTC(2024, 0, 15, 10, 30, 5, 7)), new Date(Date.UTC(1999, 11, 31, 23, 59, 59, 999)), new Date(Date.UTC(2024, 1, 29, 0, 0, 0, 0)), new Date(Date.UTC(5, 6, 4, 12, 0)), new Date(NaN)];
  const patterns = ["yyyy-MM-dd HH:mm:ss.SSS XXX", "EEEE d MMMM y, h:mm a", "EEE dd MMM yy 'at' H'h' mm", "'It''s' M/d/yyyy", "SS S hh HH", "QQ yyyyy"];
  const out: string[] = [];
  for (const d of dates) {
    for (const p of patterns) out.push(`${formatDate(d, p, { timeZone: "UTC" })} | ${formatDate(d, p, { timeZone: 330 })} | ${formatDate(d, p, { timeZone: -210 })}`);
  }
  // The local zone: whatever the machine's is, every target reads the same offset.
  out.push(formatDate(dates[0]!, "yyyy-MM-dd HH:mm XXX") === formatDate(dates[0]!, "yyyy-MM-dd HH:mm XXX", { timeZone: -dates[0]!.getTimezoneOffset() }) ? "local ok" : "local differs");
  return out;
}
