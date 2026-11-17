// Date: UTC and local fields, Date.UTC / Date.parse (ISO), setters with overflow, Invalid Date, ranges, shared
// mutable objects. Local time is the machine's zone on every target (run with TZ=UTC or TZ=America/Sao_Paulo…).
// Nothing reads the clock. Top-level names start with `Dt`/`dt` (one native namespace).

function dtUtc(d: Date): string {
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCDay(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()].join(",");
}

function dtLocal(d: Date): string {
  return [d.getFullYear(), d.getMonth(), d.getDate(), d.getDay(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds(), d.getTimezoneOffset()].join(",");
}

function dtIso(d: Date): string {
  try {
    return d.toISOString();
  } catch (e) {
    return `caught ${String(e).split(":")[0] ?? ""}`;
  }
}

export function dateUtc(): string[] {
  const d = new Date(Date.UTC(2024, 1, 29, 12, 30, 45, 678));
  const times = [0, -1, 1.7, -1.7, -0.5, 8.64e15, -8.64e15, 8.64e15 + 1, 951782400000, -62198755200000, -62167219200000, 253402300800000, 1e12];
  const out = [dtUtc(d), `${d.getTime()} ${d.valueOf()} ${dtIso(d)} ${d.toUTCString()}`];
  for (const t of times) {
    const x = new Date(t);
    out.push(`${t} ${x.getTime()} ${dtIso(x)} ${x.toUTCString()} ${dtUtc(x)}`);
  }
  out.push(
    [Date.UTC(2024, 13, 35), Date.UTC(2024, -1, 1), Date.UTC(99, 0), Date.UTC(100, 0), Date.UTC(0, 0, 1), Date.UTC(-1, 0), Date.UTC(2024), Date.UTC(2024, 0, 1, 25, 61, 61, 1001)].join(" "),
    [Date.UTC(NaN, 0), Date.UTC(2024, Infinity), Date.UTC(275760, 8, 13), Date.UTC(275760, 8, 13, 0, 0, 0, 1), Date.UTC(1.9, 1.9, 1.9)].join(" "),
  );
  return out;
}

export function dateParse(): string[] {
  const texts = [
    "2024", "2024-02", "2024-02-29", "2023-02-29", "2024-02-30", "2024-04-31", "2024-01-15T10:30Z", "2024-01-15T10:30:15Z",
    "2024-01-15T10:30:15.1Z", "2024-01-15T10:30:15.12Z", "2024-01-15T10:30:15.123456Z", "2024-01-15T24:00Z", "2024-01-15T24:00:01Z",
    "2024-01-15t10:30z", "2024-01-15 10:30Z", "2024-01-15T10:30+05:30", "2024-01-15T10:30-0330", "+002024-01-15", "-000001-01-01T00:00Z",
    "2024-13-01", "2024-00-10", "2024-01-00", "2024-01-32", "2024-01-15T10:60Z", "2024-01-15T10:30:60Z", "2024-01-15T10Z",
    "2024-01-15T10:30:15.Z", "", "+275760-09-13T00:00:00.000Z", "+275760-09-13T00:00:00.001Z", "-271821-04-20T00:00Z", "-271821-04-19T23:59:59.999Z",
    "2024-01-15T10:30+24:00", "2024-01-15T10:30+23:59",
  ];
  const out = texts.map((t) => `${JSON.stringify(t)} ${Date.parse(t)}`);
  out.push(`${new Date("2024-03-10T08:00:00.000Z").getTime()} ${dtIso(new Date("2024-03-10"))}`);
  return out;
}

export function dateSetters(): string[] {
  const d = new Date(Date.UTC(2024, 0, 31, 10, 0, 0, 0));
  const out: string[] = [];
  const step = (label: string, v: number) => out.push(`${label} ${v} ${dtIso(d)}`);
  step("setUTCMonth(1)", d.setUTCMonth(1));
  step("setUTCDate(0)", d.setUTCDate(0));
  step("setUTCDate(400)", d.setUTCDate(400));
  step("setUTCMonth(-1, 15)", d.setUTCMonth(-1, 15));
  step("setUTCFullYear(2000, 1, 29)", d.setUTCFullYear(2000, 1, 29));
  step("setUTCFullYear(2001)", d.setUTCFullYear(2001));
  step("setUTCHours(25, 61)", d.setUTCHours(25, 61));
  step("setUTCMinutes(-1, 30, 5)", d.setUTCMinutes(-1, 30, 5));
  step("setUTCSeconds(3600.9)", d.setUTCSeconds(3600.9));
  step("setUTCMilliseconds(-1)", d.setUTCMilliseconds(-1));
  step("setTime(86400000.5)", d.setTime(86400000.5));
  step("setUTCHours(NaN)", d.setUTCHours(NaN));
  step("setUTCDate(5) on invalid", d.setUTCDate(5));
  step("setUTCFullYear(2020) on invalid", d.setUTCFullYear(2020));
  step("setTime(9e15)", d.setTime(9e15));
  step("setUTCMonth(3, 2) on invalid", d.setUTCMonth(3, 2));
  step("setTime(-1e15)", d.setTime(-1e15));
  step("setUTCFullYear(275760, 8, 14)", d.setUTCFullYear(275760, 8, 14));
  return out;
}

export function dateShared(): string[] {
  const a = new Date(0);
  const b = a;
  const copy = new Date(a);
  b.setUTCFullYear(2000);
  const dates = [new Date(5), a, new Date(-5)];
  dates.sort((x, y) => x.getTime() - y.getTime());
  const later = new Date(a.getTime() + 36 * 3600 * 1000);
  const days = (later.getTime() - a.getTime()) / 86400000;
  const invalid = new Date(NaN);
  return [
    `${a.getTime()} ${copy.getTime()} ${a === b} ${a === copy} ${a < later} ${later <= a} ${a >= b} ${days}`,
    dates.map((x) => x.getTime()).join(","),
    `${invalid.getTime()} ${invalid.getUTCFullYear()} ${invalid.getDay()} ${invalid.getTimezoneOffset()} ${dtIso(invalid)} ${invalid.toUTCString()} ${invalid.toDateString()} ${JSON.stringify([invalid, a])}`,
    `${typeof a} ${dtIso(new Date(a.getTime()))} ${new Date(new Date(1e12)).getTime()}`,
  ];
}

export function dateLocal(): string[] {
  const out: string[] = [];
  const parts = [
    new Date(2024, 0, 15, 10, 30),
    new Date(2024, 6, 1),
    new Date(2024, 0),
    new Date(99, 11, 31, 23, 59, 59, 999),
    new Date(2024, 13, 35, 25, 61, 61, 1001),
    new Date(1970, 0, 1),
    new Date(2018, 10, 4, 0, 30),
    new Date(2018, 1, 17, 23, 30),
    new Date(2016, 9, 16, 0, 0),
    new Date(2000, 1, 29, 12),
    new Date(2024, NaN),
  ];
  for (const d of parts) out.push(`${d.getTime()} ${dtLocal(d)} ${d.toDateString()}`);
  for (const t of [0, 1e12, 1541302200000, 1518917400000, 1476586800000, 1700000000000, 1720000000000, -1e10]) {
    const d = new Date(t);
    out.push(`${t} ${dtLocal(d)} ${d.toDateString()}`);
  }
  out.push(`${Date.parse("2024-01-15T10:30")} ${Date.parse("2024-07-15T10:30:00")} ${Date.parse("2024-01-15T10:30:00.5")} ${Date.parse("2018-11-04T00:30")}`);
  const d = new Date(2024, 0, 31, 10);
  const step = (label: string, v: number) => out.push(`${label} ${v} ${dtLocal(d)}`);
  step("setMonth(1)", d.setMonth(1));
  step("setDate(0)", d.setDate(0));
  step("setHours(-1)", d.setHours(-1));
  step("setMinutes(90, 5, 7)", d.setMinutes(90, 5, 7));
  step("setSeconds(-30)", d.setSeconds(-30));
  step("setMilliseconds(1500)", d.setMilliseconds(1500));
  step("setFullYear(2018, 10, 4)", d.setFullYear(2018, 10, 4));
  step("setHours(0, 30, 0, 0)", d.setHours(0, 30, 0, 0));
  step("setTime(NaN)", d.setTime(NaN));
  step("setFullYear(2021) on invalid", d.setFullYear(2021));
  step("setMonth(5) on invalid", new Date(NaN).setMonth(5));
  return out;
}
