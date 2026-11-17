/** Adapters (src/adapters.ts): Json / parseJson, Utf16, Disposable / use / Disposer, bind / Emitter. Top-level names start with `ad`. */
import { Disposer, Emitter, Json, Utf16, bind, parseJson, use, type Disposable } from "../../src/adapters.ts";

function adDescribe(j: Json): string {
  switch (j.kind) {
    case "null":
      return "null";
    case "boolean":
      return `bool ${j.asBoolean()}`;
    case "number":
      return `num ${j.asNumber()}`;
    case "string":
      return `str ${JSON.stringify(j.asString() ?? "")}`;
    case "array":
      return `[${(j.asArray() ?? []).map(adDescribe).join(", ")}]`;
    case "object":
      return `{${j.keys().map((k) => `${k}: ${adDescribe(j.get(k) ?? Json.null())}`).join(", ")}}`;
  }
}

export function adJson(): string[] {
  const texts = [
    '{"name":"Ada","age":36,"tags":["x","y"],"nested":{"ok":true,"none":null}}',
    ' [1, -0, 2.5e3, 1E-7, -12.75, 1e400, 123456789012345678901234567890] ',
    '{"b":1,"a":2,"b":3,"10":4,"2":5}',
    '"\\u00e9\\ud83d\\ude00 tab\\t quote\\" slash\\/ nl\\n"',
    "[]",
    "{}",
    "true",
    "null",
    '[[[]],{"":{}}]',
  ];
  const out: string[] = [];
  try {
    adJsonValid(texts, out);
  } catch (e) {
    out.push(`unexpected ${e instanceof Error ? e.message : ""}`);
  }
  adJsonBad(out);
  return out;
}

function adJsonValid(texts: string[], out: string[]): void {
  for (const t of texts) {
    const j = parseJson(t);
    out.push(`${j.kind} ${j.size()} ${adDescribe(j)}`);
    out.push(j.stringify());
    out.push(j.stringify(2).split("\n").join("⏎"));
  }
  const doc = parseJson(texts[0]!);
  out.push(`${doc.get("name")?.asString()} ${doc.get("age")?.asNumber()} ${doc.get("tags")?.at(-1)?.asString()} ${doc.get("nested")?.get("ok")?.asBoolean()} ${doc.get("missing") === undefined} ${doc.get("age")?.asString() === undefined}`);
  const built = Json.object(new Map<string, Json>([["list", Json.array([Json.number(1), Json.string("two"), Json.null(), Json.boolean(false)])], ["n", Json.number(NaN)]]));
  out.push(built.stringify(), built.stringify(1).split("\n").join("⏎"));
}

function adJsonBad(out: string[]): void {
  const bad = ["", " ", "{", "[1,]", '{"a" 1}', "tru", "nul", "01", "1.", "-", "1e", '"abc', '"\\x"', '"\\u12g4"', "[1 2]", '{"a":1,}', "{a:1}", "1 2", '"tab\there"'];
  for (const t of bad) {
    try {
      out.push(`ok ${parseJson(t).stringify()}`);
    } catch (e) {
      out.push(`${JSON.stringify(t)} ${e instanceof Error ? e.name : "?"} ${e instanceof Error ? e.message : ""}`);
    }
  }
}

export function adUtf16(): string[] {
  const s = Utf16.from("a😀b");
  const lone = s.slice(0, 2);
  const out: string[] = [
    `${s.length} ${s.at(1)} ${s.at(-1)} ${s.at(9)} ${s.codePointAt(1)} ${s.codePointAt(2)} ${s.isWellFormed()}`,
    `${lone.length} ${lone.isWellFormed()} ${lone.toString()} ${lone.toJson()} ${lone.units().join(",")}`,
    `${s.slice(2).toString()} ${s.slice(-2, -1).toJson()} ${lone.concat(s.slice(2)).toString()} ${lone.concat(s.slice(2)).isWellFormed()}`,
  ];
  const u = Utf16.fromUnits([0x41, 0xdc00, 0xd800, 0x42, 0x1d83d, 0xde00, 0xd83d]);
  out.push(`${u.length} ${u.units().join(",")} ${u.toString()} ${u.toJson()} ${u.isWellFormed()}`);
  out.push(`${u.indexOf(Utf16.from("B"))} ${u.indexOf(Utf16.fromUnits([0xd800]))} ${s.indexOf(Utf16.from("b"), 4)} ${s.indexOf(Utf16.from(""))} ${s.indexOf(Utf16.from("z"))}`);
  out.push(`${Utf16.from("abc").compare(Utf16.from("abd"))} ${Utf16.from("b").compare(Utf16.from("abc"))} ${Utf16.from("x").equals(Utf16.from("x"))} ${Utf16.from("￿").compare(Utf16.from("😀"))}`);
  const big: number[] = [];
  for (let i = 0; i < 10000; i++) big.push(i % 3 === 0 ? 0xd83d : i % 3 === 1 ? 0xde00 : 0x61 + (i % 26));
  const text = Utf16.fromUnits(big).toString();
  out.push(`${text.length} ${Utf16.from(text).equals(Utf16.fromUnits(big))} ${text.slice(4094, 4101)}`);
  return out;
}

class AdFile implements Disposable {
  constructor(
    readonly name: string,
    readonly log: string[],
  ) {}
  dispose(): void {
    this.log.push(`close ${this.name}`);
  }
}

export function adDispose(): string[] {
  const log: string[] = [];
  try {
    adDisposeRun(log);
  } catch (e) {
    log.push(`unexpected ${e instanceof Error ? e.message : ""}`);
  }
  return log;
}

function adDisposeRun(log: string[]): void {
  const n = use(new AdFile("a", log), (f) => {
    log.push(`read ${f.name}`);
    return f.name.length + 1;
  });
  log.push(`got ${n}`);
  try {
    use(new AdFile("b", log), (f): void => {
      log.push(`read ${f.name}`);
      throw new Error("boom");
    });
  } catch (e) {
    log.push(`caught ${e instanceof Error ? e.message : ""}`);
  }
  const all = new Disposer();
  all.add(new AdFile("x", log));
  all.add(new AdFile("y", log));
  log.push(`disposed ${all.disposed}`);
  all.dispose();
  all.dispose();
  all.add(new AdFile("late", log));
  log.push(`disposed ${all.disposed}`);
}

class AdModel {
  readonly changed = new Emitter<number>();
  value = 0;
  set(v: number): void {
    this.value = v;
    this.changed.emit(v);
  }
}

/** A view that listens to its own model: a cycle through `bind`'s fields, which the collector frees. */
class AdView {
  seen: number[] = [];
  readonly model = new AdModel();
  readonly sub: Disposable;
  constructor(readonly name: string) {
    this.sub = this.model.changed.on(bind(this, (view: AdView, v: number) => view.seen.push(v * 10)));
  }
}

export function adListeners(): string[] {
  const out: string[] = [];
  const view = new AdView("v");
  view.model.set(1);
  const plain = new Emitter<string>();
  const heard: string[] = [];
  const a = plain.on(bind(heard, (h: string[], s: string) => h.push(`a:${s}`)));
  plain.on(bind(heard, (h: string[], s: string) => h.push(`b:${s}`)));
  plain.emit("1");
  a.dispose();
  plain.emit("2");
  view.model.set(2);
  view.sub.dispose();
  view.model.set(3);
  out.push(`${view.seen.join(",")} ${view.model.value} ${view.model.changed.size}`, `${heard.join(" ")} ${plain.size}`);
  for (let i = 0; i < 100; i++) new AdView(`tmp${i}`).model.set(i);
  out.push("done");
  return out;
}
