// JSON.stringify and JSON.parse: every kind of value, JavaScript's layout, escaping, number text, key order and
// SyntaxErrors. Top-level names start with `Js`/`js` (one native namespace). Caught errors print their kind only.

interface JsAddr {
  street: string;
  zip: number | null;
}

interface JsPerson {
  name: string;
  age: number;
  tags: string[];
  addr: JsAddr;
  nick?: string;
  scores: Record<string, number>;
  onTap: () => void;
  born: Date;
}

class JsBase {
  kind = "base";
  constructor(public id: number) {}
}

class JsPoint extends JsBase {
  label?: string;
  z = 0;
  #secret = 1;
  constructor(public x: number, public y: number) {
    super(7);
  }
  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y) + this.#secret;
  }
  move(): void {
    this.x++;
  }
}

function jsNothing(): string | null {
  return null;
}

function jsPerson(): JsPerson {
  return {
    name: 'Ann "Q"\n',
    age: 41.5,
    tags: ["a", "b"],
    addr: { street: "Main", zip: null },
    nick: undefined,
    scores: { b: 2, a: 1, "10": 3, "2": 4 },
    onTap: () => {},
    born: new Date(Date.UTC(1983, 4, 6, 7, 8, 9, 10)),
  };
}

export function jsonValues(): string[] {
  const nums = [0, -0, 1.5, 1e21, 1e-7, NaN, Infinity, -Infinity, 123456789012345680000, 0.1 + 0.2, 5e-324, -1e-7, 2 ** 53 + 2, 100];
  const texts = ["", "\u0000\u001f\u007f", "é", "😀", "  ", "\\/", "\b\f\r\t\n", '"q"', "\u{10FFFF}"];
  const holes: (string | null)[] = ["a", null, "b"];
  const maybe: (number | undefined)[] = [1, undefined, 3];
  const mixed: (string | number | boolean)[] = ["a", 1, true, 2.5];
  const nested: number[][][] = [[], [[]], [[1, 2], [3]]];
  return [
    JSON.stringify(nums),
    JSON.stringify(texts),
    JSON.stringify(holes),
    JSON.stringify(maybe),
    JSON.stringify(mixed),
    JSON.stringify(nested),
    JSON.stringify("x\ty"),
    JSON.stringify(-0),
    JSON.stringify(NaN),
    JSON.stringify(true),
    JSON.stringify(jsNothing()),
    JSON.stringify([true, false]),
    JSON.stringify({ a: 1, b: ["one", "two"], c: { d: jsNothing() } }),
  ];
}

export function jsonObjects(): string[] {
  const p = jsPerson();
  p.scores["1"] = 5;
  delete p.scores["b"];
  p.scores["b"] = 6;
  const q = jsPerson();
  q.nick = "Nan";
  const point = new JsPoint(3, 4);
  point.move();
  const labelled = new JsPoint(1, 2);
  labelled.label = "L";
  const people: JsPerson[] = [p, q];
  const byName: Record<string, JsAddr | null> = { home: { street: "Elm", zip: 12345 }, none: null };
  return [
    JSON.stringify(p),
    JSON.stringify(q),
    JSON.stringify(point),
    JSON.stringify(labelled),
    JSON.stringify(people.map((x) => x.addr)),
    JSON.stringify(byName),
    JSON.stringify({ when: new Date(0), never: new Date(NaN) }),
    JSON.stringify([new Date(-1), new Date(8.64e15)]),
  ];
}

export function jsonIndent(): string[] {
  const p = jsPerson();
  const spaces = [0, -1, 1, 3.7, 11];
  const out: string[] = [JSON.stringify(p, null, 2), JSON.stringify(p.addr, null, "\t"), JSON.stringify([[1, 2], [3], []], null, "abcdefghijklmnop")];
  const empty: Record<string, number> = {};
  for (const n of spaces) out.push(JSON.stringify({ a: [1, 2], b: empty }, null, n));
  for (const s of ["", "--", "😀😀😀😀😀😀"]) out.push(JSON.stringify({ k: "v", n: [1] }, null, s));
  const none: number[] = [];
  out.push(JSON.stringify(none, null, 4), JSON.stringify(empty, null, 4), JSON.stringify("s", null, 4), JSON.stringify([none], undefined, 1));
  return out.map((s) => s.split("\n").join("\\n"));
}

interface JsItem {
  id: number;
  title: string;
  done: boolean;
  note: string | null;
  extra?: number;
  parts: JsItem[];
}

function jsTry(text: string): string {
  try {
    const xs = JSON.parse(text) as number[];
    return `ok ${xs.length}`;
  } catch (e) {
    return `${text.length} ${String(e).split(":")[0] ?? ""}`;
  }
}

export function jsonParse(): string[] {
  try {
    return jsParsed();
  } catch (e) {
    return [`caught ${String(e).split(":")[0] ?? ""}`];
  }
}

function jsParsed(): string[] {
  const item = JSON.parse('{"title":"T","id":1.5,"done":true,"note":null,"parts":[{"id":2,"title":"c","done":false,"note":"n","extra":9,"parts":[]}]}') as JsItem;
  const child = item.parts[0]!;
  const map = JSON.parse('{"b":1,"2":2,"a":3,"1":4,"a":5}') as Record<string, number>;
  const nested: Record<string, number[]> = JSON.parse(' { "x" : [ 1 , 2.5e3 , -0.125 ] , "y" : [ ] } ');
  const s = JSON.parse('"\\u00e9\\ud83d\\ude00\\n\\t\\"\\\\\\/\\b\\f\\r"') as string;
  const big = JSON.parse("[1e400, -1e400, -0, 0.1, 12345678901234567890, 1E2, 5e-324, 2.2250738585072014e-308]") as number[];
  const maybe = JSON.parse("null") as string | null;
  const flags = JSON.parse("[true,false]") as boolean[];
  const back = JSON.parse(JSON.stringify([1.5, -2, 1e21])) as number[];
  return [
    `${item.id} ${item.title} ${item.done} ${item.note ?? "null"} ${item.extra ?? "none"} ${item.parts.length}`,
    `${child.id} ${child.title} ${child.done} ${child.note ?? "null"} ${child.extra ?? "none"}`,
    JSON.stringify(map),
    JSON.stringify(nested),
    `${s.length} ${JSON.stringify(s)}`,
    `${big.join(" ")} ${1 / big[2]!}`,
    `${maybe === null} ${flags.join(",")} ${back.join(",")}`,
    `${JSON.parse("3") as number} ${JSON.parse('"s"') as string} ${JSON.parse(" true ") as boolean}`,
  ];
}

export function jsonErrors(): string[] {
  const texts = ["[1]", " [1,2] ", "[1,]", "[,1]", "[01]", "[1.]", "[.5]", "[+1]", "[-]", "[NaN]", "[Infinity]", "['a']", '["\\x"]', '["a\tb"]', "[", "", "nul", "[1] [2]", "[1]x", "[ 1]", '["\\u12"]', "[1e]", "[-01]", "[0x1]", '{"a":1,}', "[1,2", "[1e5,-0.5E-3]", "\n\r\t [ ] "];
  return texts.map(jsTry);
}
