// Algorithms corpus: backtracking, simulations (game of life, tokenizer/parser/interpreter, state machine), functional style.

// ───── Backtracking ─────

function nQueens(n: number): string[][] {
  const solutions: string[][] = [];
  const cols = new Set<number>();
  const diag1 = new Set<number>();
  const diag2 = new Set<number>();
  const placement: number[] = [];
  const place = (row: number): void => {
    if (row === n) {
      solutions.push(placement.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag1.has(row - c) || diag2.has(row + c)) continue;
      cols.add(c);
      diag1.add(row - c);
      diag2.add(row + c);
      placement.push(c);
      place(row + 1);
      placement.pop();
      cols.delete(c);
      diag1.delete(row - c);
      diag2.delete(row + c);
    }
  };
  place(0);
  return solutions;
}

function solveSudoku(board: number[][]): boolean {
  const canPlace = (r: number, c: number, v: number): boolean => {
    for (let i = 0; i < 9; i++) {
      if (board[r]![i] === v || board[i]![c] === v) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + (i % 3);
      if (board[br]![bc] === v) return false;
    }
    return true;
  };
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r]![c] !== 0) continue;
      for (let v = 1; v <= 9; v++) {
        if (canPlace(r, c, v)) {
          board[r]![c] = v;
          if (solveSudoku(board)) return true;
          board[r]![c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) out.push([item, ...p]);
  });
  return out;
}

function nextPermutation(a: number[]): boolean {
  let i = a.length - 2;
  while (i >= 0 && a[i]! >= a[i + 1]!) i--;
  if (i < 0) return false;
  let j = a.length - 1;
  while (a[j]! <= a[i]!) j--;
  [a[i], a[j]] = [a[j]!, a[i]!];
  for (let l = i + 1, r = a.length - 1; l < r; l++, r--) [a[l], a[r]] = [a[r]!, a[l]!];
  return true;
}

function subsets<T>(items: T[]): T[][] {
  const result: T[][] = [[]];
  for (const item of items) {
    const n = result.length;
    for (let i = 0; i < n; i++) result.push([...result[i]!, item]);
  }
  return result;
}

function combinationSum(candidates: number[], target: number): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const sorted = [...candidates].sort((a, b) => a - b);
  function go(start: number, remaining: number) {
    if (remaining === 0) {
      out.push([...path]);
      return;
    }
    for (let i = start; i < sorted.length && sorted[i]! <= remaining; i++) {
      path.push(sorted[i]!);
      go(i, remaining - sorted[i]!);
      path.pop();
    }
  }
  go(0, target);
  return out;
}

function generateParens(n: number): string[] {
  const res: string[] = [];
  const build = (s: string, open: number, close: number): void => {
    if (s.length === 2 * n) {
      res.push(s);
      return;
    }
    if (open < n) build(s + "(", open + 1, close);
    if (close < open) build(s + ")", open, close + 1);
  };
  build("", 0, 0);
  return res;
}

function wordSearch(grid: string[][], word: string): boolean {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const dfs = (r: number, c: number, k: number): boolean => {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r]![c] !== word.charAt(k)) return false;
    const saved = grid[r]![c]!;
    grid[r]![c] = "#";
    const found = dfs(r + 1, c, k + 1) || dfs(r - 1, c, k + 1) || dfs(r, c + 1, k + 1) || dfs(r, c - 1, k + 1);
    grid[r]![c] = saved;
    return found;
  };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true;
  return false;
}

export function backtracking(): string[] {
  const queens = nQueens(6);
  const counts = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => nQueens(n).length);
  const puzzle = [
    "530070000", "600195000", "098000060", "800060003", "400803001", "700020006", "060000280", "000419005", "000080079",
  ].map((row) => row.split("").map((d) => Number(d)));
  const solved = solveSudoku(puzzle);
  const perm = [1, 2, 3];
  const seq: string[] = [perm.join("")];
  while (nextPermutation(perm)) seq.push(perm.join(""));
  const board = [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]];
  return [
    `queens(6) ${queens.length}: ${queens[0]!.join("/")}`,
    `queens counts ${counts.join(",")}`,
    `sudoku ${solved} ${puzzle[0]!.join("")} ${puzzle[8]!.join("")} rowsum ${puzzle.map((r) => r.reduce((a, b) => a + b, 0)).every((s) => s === 45)}`,
    `perms ${permutations(["a", "b", "c"]).map((p) => p.join("")).join(" ")}`,
    `next perm ${seq.join(" ")}`,
    `subsets ${subsets([1, 2, 3]).map((s) => `{${s.join("")}}`).join("")}`,
    `combination sum ${combinationSum([2, 3, 6, 7], 7).map((c) => c.join("+")).join(" | ")} / ${combinationSum([2, 3, 5], 8).length}`,
    `parens ${generateParens(3).join(" ")}`,
    `word search ${wordSearch(board, "ABCCED")} ${wordSearch(board, "SEE")} ${wordSearch(board, "ABCB")}`,
  ];
}

// ───── Game of Life ─────

function lifeStep(cells: boolean[][]): boolean[][] {
  const h = cells.length;
  const w = cells[0]!.length;
  return cells.map((row, y) =>
    row.map((alive, x) => {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const yy = (y + dy + h) % h;
          const xx = (x + dx + w) % w;
          if (cells[yy]![xx]) n++;
        }
      return alive ? n === 2 || n === 3 : n === 3;
    }),
  );
}

const showLife = (cells: boolean[][]) => cells.map((r) => r.map((c) => (c ? "#" : ".")).join("")).join("/");

export function gameOfLife(): string[] {
  let grid = ["......", "..#...", "...#..", ".###..", "......", "......"].map((r) => r.split("").map((c) => c === "#"));
  const out = [`gen0 ${showLife(grid)}`];
  for (let g = 1; g <= 4; g++) {
    grid = lifeStep(grid);
    out.push(`gen${g} ${showLife(grid)}`);
  }
  let blinker = [".....", "..#..", "..#..", "..#..", "....."].map((r) => r.split("").map((c) => c === "#"));
  blinker = lifeStep(blinker);
  out.push(`blinker ${showLife(blinker)} pop ${blinker.flat().filter((c) => c).length}`);
  return out;
}

// ───── Tokenizer, recursive-descent parser and interpreter ─────

type TokenKind = "num" | "ident" | "op" | "lparen" | "rparen" | "eof";

interface Token {
  kind: TokenKind;
  text: string;
  pos: number;
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isAlpha = (c: string) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  while (i < src.length) {
    const c = src.charAt(i);
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    const start = i;
    if (isDigit(c) || c === ".") {
      while (i < src.length && (isDigit(src.charAt(i)) || src.charAt(i) === ".")) i++;
      tokens.push({ kind: "num", text: src.slice(start, i), pos: start });
    } else if (isAlpha(c)) {
      while (i < src.length && (isAlpha(src.charAt(i)) || isDigit(src.charAt(i)))) i++;
      tokens.push({ kind: "ident", text: src.slice(start, i), pos: start });
    } else if ("+-*/^%".includes(c)) {
      tokens.push({ kind: "op", text: c, pos: i++ });
    } else if (c === "(" || c === ")") {
      tokens.push({ kind: c === "(" ? "lparen" : "rparen", text: c, pos: i++ });
    } else if (c === ",") {
      tokens.push({ kind: "op", text: ",", pos: i++ });
    } else {
      throw new Error(`Unexpected '${c}' at ${i}`);
    }
  }
  tokens.push({ kind: "eof", text: "", pos: src.length });
  return tokens;
}

interface NumNode {
  type: "num";
  value: number;
}
interface VarNode {
  type: "var";
  name: string;
}
interface NegNode {
  type: "neg";
  arg: Ast;
}
interface BinNode {
  type: "bin";
  op: string;
  left: Ast;
  right: Ast;
}
interface CallNode {
  type: "call";
  fn: string;
  args: Ast[];
}
type Ast = NumNode | VarNode | NegNode | BinNode | CallNode;

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos]!;
  }

  private next(): Token {
    return this.tokens[this.pos++]!;
  }

  private expect(kind: TokenKind): Token {
    const t = this.next();
    if (t.kind !== kind) throw new Error(`Expected ${kind} at ${t.pos}, got '${t.text}'`);
    return t;
  }

  parse(): Ast {
    const e = this.expr();
    this.expect("eof");
    return e;
  }

  // expr := term (('+' | '-') term)*
  private expr(): Ast {
    let left = this.term();
    while (this.peek().text === "+" || this.peek().text === "-") {
      const op = this.next().text;
      left = { type: "bin", op, left, right: this.term() };
    }
    return left;
  }

  // term := power (('*' | '/' | '%') power)*
  private term(): Ast {
    let left = this.power();
    while (["*", "/", "%"].includes(this.peek().text)) {
      const op = this.next().text;
      left = { type: "bin", op, left, right: this.power() };
    }
    return left;
  }

  // power := unary ('^' power)?   (right associative)
  private power(): Ast {
    const base = this.unary();
    if (this.peek().text === "^") {
      this.next();
      return { type: "bin", op: "^", left: base, right: this.power() };
    }
    return base;
  }

  private unary(): Ast {
    if (this.peek().text === "-") {
      this.next();
      return { type: "neg", arg: this.unary() };
    }
    return this.primary();
  }

  private primary(): Ast {
    const t = this.next();
    switch (t.kind) {
      case "num":
        return { type: "num", value: parseFloat(t.text) };
      case "ident": {
        if (this.peek().kind !== "lparen") return { type: "var", name: t.text };
        this.next();
        const args: Ast[] = [];
        if (this.peek().kind !== "rparen") {
          args.push(this.expr());
          while (this.peek().text === ",") {
            this.next();
            args.push(this.expr());
          }
        }
        this.expect("rparen");
        return { type: "call", fn: t.text, args };
      }
      case "lparen": {
        const e = this.expr();
        this.expect("rparen");
        return e;
      }
      default:
        throw new Error(`Unexpected '${t.text || "end"}' at ${t.pos}`);
    }
  }
}

const FUNCS: Record<string, (args: number[]) => number> = {
  max: (args) => Math.max(...args),
  min: (args) => Math.min(...args),
  abs: (args) => Math.abs(args[0]!),
  sqrt: (args) => Math.sqrt(args[0]!),
  hyp: (args) => Math.hypot(args[0]!, args[1]!),
};

function evaluate(ast: Ast, env: Record<string, number>): number {
  switch (ast.type) {
    case "num":
      return ast.value;
    case "var": {
      const v = env[ast.name];
      if (v === undefined) throw new Error(`Unknown variable ${ast.name}`);
      return v;
    }
    case "neg":
      return -evaluate(ast.arg, env);
    case "call": {
      const f = FUNCS[ast.fn];
      if (!f) throw new Error(`Unknown function ${ast.fn}`);
      return f(ast.args.map((a) => evaluate(a, env)));
    }
    case "bin": {
      const l = evaluate(ast.left, env);
      const r = evaluate(ast.right, env);
      switch (ast.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return l / r;
        case "%":
          return l % r;
        case "^":
          return l ** r;
        default:
          throw new Error(`bad op ${ast.op}`);
      }
    }
  }
}

function show(ast: Ast): string {
  switch (ast.type) {
    case "num":
      return String(ast.value);
    case "var":
      return ast.name;
    case "neg":
      return `(-${show(ast.arg)})`;
    case "call":
      return `${ast.fn}(${ast.args.map(show).join(", ")})`;
    case "bin":
      return `(${show(ast.left)} ${ast.op} ${show(ast.right)})`;
  }
}

function calc(src: string, env: Record<string, number> = {}): string {
  try {
    const ast = new Parser(tokenize(src)).parse();
    return `${show(ast)} = ${evaluate(ast, env)}`;
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

function tokensOf(src: string): string {
  try {
    return tokenize(src).map((t) => `${t.kind}:${t.text}`).join(" ");
  } catch (e) {
    return `error: ${(e as Error).message}`;
  }
}

export function interpreter(): string[] {
  const env: Record<string, number> = { x: 3, y: 4, rate: 0.07 };
  return [
    calc("1 + 2 * 3"),
    calc("(1 + 2) * 3"),
    calc("2 ^ 3 ^ 2"),
    calc("-2 ^ 2"),
    calc("10 / 4 - 7 % 3"),
    calc("hyp(x, y) + max(1, x * y, 2) - abs(-0.5)", env),
    calc("1000 * (1 + rate) ^ 10", env),
    calc("sqrt(2) * sqrt(2)"),
    calc("1 / 0 - 1"),
    calc("min()"),
    calc("2 * (3 + 4"),
    calc("2 $ 3"),
    calc("foo(1)"),
    calc("z + 1", env),
    `tokens ${tokensOf("a1 + 2.5*(b)")}`,
    `tokens ${tokensOf("a ? b")}`,
  ];
}

// ───── State machines ─────

type LightState = "green" | "yellow" | "red" | "flashing";
type LightEvent = "timer" | "fault" | "reset";

const transitions: Record<string, Record<string, LightState>> = {
  green: { timer: "yellow", fault: "flashing" },
  yellow: { timer: "red", fault: "flashing" },
  red: { timer: "green", fault: "flashing" },
  flashing: { reset: "red" },
};

function runLight(events: LightEvent[]): string {
  let state: LightState = "red";
  const trace: string[] = [state];
  for (const e of events) {
    const next: LightState | undefined = transitions[state]?.[e];
    if (next) state = next;
    trace.push(next ? state : `${state}(ignored ${e})`);
  }
  return trace.join(" → ");
}

/** A vending machine as a class with an explicit enum state. */
enum Vend {
  Idle = "IDLE",
  HasMoney = "HAS_MONEY",
  Dispensing = "DISPENSING",
}

class VendingMachine {
  state = Vend.Idle;
  credit = 0;
  readonly log: string[] = [];

  insert(cents: number): void {
    if (this.state === Vend.Dispensing) {
      this.log.push("busy");
      return;
    }
    this.credit += cents;
    this.state = Vend.HasMoney;
    this.log.push(`credit ${this.credit}`);
  }

  select(price: number): void {
    if (this.state !== Vend.HasMoney) {
      this.log.push("insert money first");
      return;
    }
    if (this.credit < price) {
      this.log.push(`need ${price - this.credit} more`);
      return;
    }
    this.state = Vend.Dispensing;
    this.credit -= price;
    this.log.push(`dispense, change ${this.credit}`);
    this.credit = 0;
    this.state = Vend.Idle;
  }
}

/** Accepts numbers like -12.5e+3 with a table-driven DFA. */
function isNumberDfa(s: string): boolean {
  const table: Record<string, Record<string, string>> = {
    start: { sign: "signed", digit: "int", dot: "dotOnly" },
    signed: { digit: "int", dot: "dotOnly" },
    int: { digit: "int", dot: "frac", e: "exp" },
    dotOnly: { digit: "frac" },
    frac: { digit: "frac", e: "exp" },
    exp: { sign: "expSigned", digit: "expInt" },
    expSigned: { digit: "expInt" },
    expInt: { digit: "expInt" },
  };
  const classify = (c: string): string =>
    c >= "0" && c <= "9" ? "digit" : c === "+" || c === "-" ? "sign" : c === "." ? "dot" : c === "e" || c === "E" ? "e" : "other";
  let state = "start";
  for (let i = 0; i < s.length; i++) {
    const next = table[state]?.[classify(s.charAt(i))];
    if (next === undefined) return false;
    state = next;
  }
  return ["int", "frac", "expInt"].includes(state);
}

export function stateMachines(): string[] {
  const vm = new VendingMachine();
  vm.select(50);
  vm.insert(25);
  vm.select(60);
  vm.insert(50);
  vm.select(60);
  return [
    runLight(["timer", "timer", "reset", "timer", "fault", "timer", "reset", "timer"]),
    `vending ${vm.log.join("; ")} state ${vm.state}`,
    `dfa ${["0", "-12.5e+3", ".5", "5.", "e3", "1e", "+.e1", "12a", ""].map((s) => `${s || "''"}:${isNumberDfa(s) ? "y" : "n"}`).join(" ")}`,
  ];
}

// ───── Functional style ─────

const compose =
  <T>(...fns: ((x: T) => T)[]) =>
  (x: T): T =>
    fns.reduceRight((acc, f) => f(acc), x);

const pipe =
  <T>(...fns: ((x: T) => T)[]) =>
  (x: T): T =>
    fns.reduce((acc, f) => f(acc), x);

const curry3 =
  (f: (a: number, b: number, c: number) => number) =>
  (a: number) =>
  (b: number) =>
  (c: number) =>
    f(a, b, c);

function memo<R>(fn: (n: number) => R): { call: (n: number) => R; calls: () => number } {
  const cache = new Map<number, R>();
  let misses = 0;
  return {
    call: (n) => {
      if (!cache.has(n)) {
        misses++;
        cache.set(n, fn(n));
      }
      return cache.get(n)!;
    },
    calls: () => misses,
  };
}

function groupBy<T>(xs: T[], key: (x: T) => string): Record<string, T[]> {
  return xs.reduce<Record<string, T[]>>((acc, x) => {
    const k = key(x);
    if (!acc[k]) acc[k] = [];
    acc[k]!.push(x);
    return acc;
  }, {});
}

function zip<A, B>(as: A[], bs: B[]): [A, B][] {
  return as.slice(0, Math.min(as.length, bs.length)).map((a, i) => [a, bs[i]!]);
}

function chunk<T>(xs: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(xs.length / size) }, (_, i) => xs.slice(i * size, i * size + size));
}

function* naturals(): Generator<number> {
  let n = 1;
  while (true) yield n++;
}

function* take(source: Generator<number>, n: number): Generator<number> {
  if (n <= 0) return;
  for (const x of source) {
    yield x;
    if (--n <= 0) return;
  }
}

interface Order {
  id: number;
  customer: string;
  total: number;
  status: "paid" | "pending" | "refunded";
}

// A memoized recursive function: the memo lives at the top level (a closure capturing the variable that holds it would
// be a reference cycle natively).
const fibMemo = memo(fibSlow);
function fibSlow(n: number): number {
  return n < 2 ? n : fibMemo.call(n - 1) + fibMemo.call(n - 2);
}

export function functional(): string[] {
  const inc = (x: number) => x + 1;
  const dbl = (x: number) => x * 2;
  const sq = (x: number) => x * x;
  const volume = curry3((a, b, c) => a * b * c);
  const orders: Order[] = [
    { id: 1, customer: "ann", total: 30, status: "paid" },
    { id: 2, customer: "bob", total: 12.5, status: "pending" },
    { id: 3, customer: "ann", total: 7.25, status: "paid" },
    { id: 4, customer: "cid", total: 99, status: "refunded" },
    { id: 5, customer: "bob", total: 40, status: "paid" },
  ];
  const revenueByCustomer = orders
    .filter((o) => o.status === "paid")
    .reduce((acc, o) => acc.set(o.customer, (acc.get(o.customer) ?? 0) + o.total), new Map<string, number>());
  const grouped = groupBy(orders, (o) => o.status);
  const evensSquared = [...take(naturals(), 10)].filter((n) => n % 2 === 0).map(sq);
  return [
    `compose ${compose(inc, dbl, sq)(3)} pipe ${pipe(inc, dbl, sq)(3)} identity ${compose<number>()(7)}`,
    `curry ${volume(2)(3)(4)} partial ${[1, 2, 3].map(volume(2)(5)).join(",")}`,
    `memo fib(60) ${fibMemo.call(60)} computed ${fibMemo.calls()} again ${fibMemo.call(30)} computed ${fibMemo.calls()}`,
    `revenue ${[...revenueByCustomer].map(([c, t]) => `${c}=${t}`).join(" ")}`,
    `grouped ${Object.keys(grouped).map((k) => `${k}:${grouped[k]!.map((o) => o.id).join("")}`).join(" ")}`,
    `zip ${zip(["a", "b", "c"], [1, 2]).map(([s, n]) => s + n).join(" ")}`,
    `chunk ${chunk([1, 2, 3, 4, 5, 6, 7], 3).map((c) => `[${c.join(",")}]`).join("")}`,
    `lazy ${evensSquared.join(",")}`,
    `flatMap ${["a b", "c", "d e f"].flatMap((s) => s.split(" ")).join("")} some ${orders.some((o) => o.total > 50)} every ${orders.every((o) => o.total > 5)}`,
    `sum of squares of odds ${[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n % 2 === 1).map((n) => n * n).reduce((a, b) => a + b, 0)}`,
  ];
}
