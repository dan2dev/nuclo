/** What the Swift and Kotlin printers share: indentation, precedence, call layout. */
import type { BinOp, Expr, Op, Param, Program, Stmt, Ty } from "./ir.ts";

export const INDENT = "    ";
const MAX_LINE = 100;

const PRECEDENCE: Record<BinOp, number> = {
  "*": 6, "/": 6, "%": 6,
  "+": 5, "-": 5,
  "<": 4, "<=": 4, ">": 4, ">=": 4,
  "==": 3, "!=": 3, "===": 3, "!==": 3,
  "&&": 2,
  "||": 1,
};

export abstract class Printer {
  protected abstract readonly keywords: ReadonlySet<string>;
  protected abstract ty(t: Ty): string;
  protected abstract str(v: string): string;
  protected abstract op(op: Op, args: Expr[], ind: string, awaited: boolean): string;
  protected abstract lambda(x: Extract<Expr, { e: "lambda" }>, ind: string): string;
  protected abstract special(x: Expr, ind: string): string;
  protected abstract stmt(s: Stmt, ind: string): string[];
  abstract print(program: Program): string;

  protected name(n: string): string {
    return this.keywords.has(n) ? `\`${n}\`` : n;
  }

  protected expr(x: Expr, ind: string): string {
    switch (x.e) {
      case "int":
      case "double":
        return x.v;
      case "str":
        return this.str(x.v);
      case "bool":
        return String(x.v);
      case "bin": {
        const prec = PRECEDENCE[x.op];
        return `${this.operand(x.l, prec, false, ind)} ${this.binOp(x.op)} ${this.operand(x.r, prec, true, ind)}`;
      }
      case "not":
        return `!${this.postfixOperand(x.x, ind)}`;
      case "neg":
        return `-${this.postfixOperand(x.x, ind)}`;
      case "prop":
        return `${this.postfixOperand(x.obj, ind)}${x.optional ? "?." : "."}${this.name(x.name)}`;
      case "index":
        return `${this.postfixOperand(x.obj, ind)}[${this.expr(x.index, ind)}]`;
      case "op":
        return this.op(x.op, x.args, ind, !!x.await);
      case "lambda":
        return this.lambda(x, ind);
      default:
        return this.special(x, ind);
    }
  }

  protected binOp(op: BinOp): string {
    return op;
  }

  private operand(x: Expr, parent: number, right: boolean, ind: string): string {
    const s = this.expr(x, ind);
    if (x.e === "bin") {
      const prec = PRECEDENCE[x.op];
      return prec < parent || (right && prec === parent) ? `(${s})` : s;
    }
    return x.e === "cond" || x.e === "coalesce" ? `(${s})` : s;
  }

  /** An expression a `.`, `!` or `-` applies to. */
  protected postfixOperand(x: Expr, ind: string): string {
    const s = this.expr(x, ind);
    return ["bin", "cond", "coalesce", "not", "neg", "launch"].includes(x.e) ? `(${s})` : s;
  }

  /**
   * `name(a, b) { trailing }`, broken one argument per line when long. Labels: [label, value];
   * a trailing lambda is taken from the last positional argument when nothing labelled follows.
   */
  protected call(name: string, args: Expr[], labelled: [string, Expr][], ind: string, label: (l: string) => string, trailing = true): string {
    const inner = ind + INDENT;
    let last: Extract<Expr, { e: "lambda" }> | undefined;
    if (trailing && !labelled.length && args.at(-1)?.e === "lambda" && this.canTrail(args.at(-1) as Extract<Expr, { e: "lambda" }>)) {
      last = args.at(-1) as Extract<Expr, { e: "lambda" }>;
      args = args.slice(0, -1);
    }
    const parts = [...args.map((a) => this.expr(a, inner)), ...labelled.map(([l, v]) => `${label(l)}${this.expr(v, inner)}`)];
    let out: string;
    if (!parts.length) out = last ? name : `${name}()`;
    else if (parts.some((p) => p.includes("\n")) || name.length + parts.join(", ").length > MAX_LINE - ind.length) {
      out = `${name}(\n${parts.map((p) => inner + p).join(",\n")},\n${ind})`;
      if (this.noTrailingComma) out = out.replace(/,\n(\s*)\)$/, "\n$1)");
    } else out = `${name}(${parts.join(", ")})`;
    return last ? `${out} ${this.lambda(last, ind)}` : out;
  }

  /** Swift rejects a comma after the last argument before 5.9 only in some positions: printers opt out. */
  protected readonly noTrailingComma: boolean = false;

  protected canTrail(_x: Extract<Expr, { e: "lambda" }>): boolean {
    return true;
  }

  protected block(stmts: Stmt[], ind: string): string[] {
    return stmts.flatMap((s) => this.stmt(s, ind));
  }

  /** Whether a statement list returns a value anywhere outside nested lambdas. */
  protected returns(stmts: Stmt[]): boolean {
    return stmts.some((s) => {
      switch (s.s) {
        case "return":
          return true;
        case "if":
          return this.returns(s.then) || (!!s.else && this.returns(s.else));
        case "forOf":
        case "forRange":
        case "while":
          return this.returns(s.body);
        case "try":
          return this.returns(s.body) || this.returns(s.catchBody);
        case "switch":
          return s.cases.some((c) => this.returns(c.body)) || (!!s.default && this.returns(s.default));
        default:
          return false;
      }
    });
  }

  protected paramNames(params: Param[], unused: (i: number) => string): string[] {
    return params.map((p, i) => (p.unused ? unused(i) : this.name(p.name)));
  }

  protected header(program: Program, comment: string): string {
    return `${comment} Generated by nuclo-native-ts from ${program.source}. Do not edit: change the TypeScript and rebuild.\n`;
  }
}
