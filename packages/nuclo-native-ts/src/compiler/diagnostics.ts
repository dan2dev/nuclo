/**
 * Diagnostic codes and the compiler-style report (`nuclo-native-ts check` / `build`).
 *
 * Every diagnostic has a stable code: TypeScript's own errors keep theirs (TS2322), the native compiler's get a
 * NUCLOxxxx code by kind, documented in README.md ("Diagnostic codes", anchor #nucloxxxx). The kind is read from the
 * message's wording (the front-end has hundreds of call sites; a message names its kind in its words), first match wins.
 */
import { readFileSync } from "node:fs";
import * as path from "node:path";

export interface Kind {
  code: string;
  title: string;
  test: RegExp;
}

/** In match order: a message about `any` in a union is an `any` diagnostic. Codes never change; add new ones at the end of their range. */
export const KINDS: Kind[] = [
  { code: "NUCLO1001", title: "`any` has no native type", test: /`any`|'any'/ },
  { code: "NUCLO2001", title: "possible reference cycle", test: /reference cycle|stores into (the|an array|a box)/ },
  { code: "NUCLO1003", title: "union has no native form here", test: /\bunions?\b|can't be told apart|either: natively/ },
  { code: "NUCLO1004", title: "null / undefined", test: /\bnull\b|\bundefined\b|[Nn]arrow (it|the|this)|\bnil\b|optional: natively/ },
  { code: "NUCLO1005", title: "different native classes", test: /is used (as|where)|different (native )?(classes|types)|conforms only|not be the same object|whose objects only/ },
  { code: "NUCLO2002", title: "error that can't be thrown or caught natively", test: /can throw|always throws|throwing anything|[A-Z][a-z]+Error\b/ },
  { code: "NUCLO3001", title: "number that may not fit its native type", test: /sized number|\b(U?Int(8|16|32|64)|Float32)\b|fround|range|whole number|may not fit/ },
  { code: "NUCLO3002", title: "result that depends on the platform", test: /locale|time zone|key order|keys are listed|ISO 8601|toString\(\)/ },
  { code: "NUCLO4002", title: "generic code that can't be instantiated", test: /[Gg]eneric|type parameter|instantiations/ },
  { code: "NUCLO4003", title: "name the native code can't use", test: /reserved|would shadow|rename|top level of another module/ },
  { code: "NUCLO1002", title: "type with no native equivalent", test: /no native (type|equivalent)|refers to itself|without a zero value|give it a type|its element type|tuple/ },
  { code: "NUCLO4001", title: "evaluation order natively differs", test: /variable first|more than once|statement of its own|inside an expression|as a statement|read (it|once)/ },
  { code: "NUCLO5001", title: "UI / style API misuse", test: /\bstyle\b|createCss|keyframes|variants?\b|globalStyle|region|route|select\(\)|native component|theme|animation|attribute|selector|pseudo|\btab\b|placeholder|\braw\b|on\(\) takes|percent width/ },
  { code: "NUCLO6001", title: "library API not available, or not in this form, natively", test: /not available natively|\(\) takes|callbacks? (take|must|return|can't)|takes (a|an|one|either|its|the) |JSON|json<T>|Give \w+\(\)|Array\.from|\(\) is supported|instanceof|sort\(\)|fetch\(\)|forEach|[Ss]pread|getTime|`in`|indexed|typed array method|entries\(\)/ },
  { code: "NUCLO4004", title: "class, interface or enum the native code can't declare", test: /\bclass(es)?\b|interfaces?\b|\benums?\b|getter|setter|super|\bmethod\b|constructor|static/ },
  { code: "NUCLO6002", title: "unsupported language construct", test: /[Uu]nsupported|not supported|cannot be compiled|can't|Cannot|Unknown|^Only|needs?\b|must\b|^Declare|`await`|reassigned|^Write/ },
];
/** Anything the table misses: still an error, with a code. */
export const OTHER: Kind = { code: "NUCLO6000", title: "not compilable natively", test: /$^/ };

/** By what the message says is wrong (before its fix: "…: write `x !== undefined`" is not about undefined), else by all of it. */
export function kindOf(message: string): Kind {
  const head = message.replace(/^Unsupported: /, "").split(/[:;]\s|\.\s|\s\(/)[0]!;
  return KINDS.find((k) => k.test.test(head)) ?? KINDS.find((k) => k.test.test(message)) ?? OTHER;
}

/** Where the codes are explained. */
export const README = path.resolve(import.meta.dirname, "../../README.md");
export const docsUrl = (code: string) => `${README}#${code.toLowerCase()}`;

interface Located {
  file: string;
  line: number;
  column: number;
  message: string;
  length?: number;
  id: string;
  fix?: string;
}

const COLORS = { red: 31, yellow: 33, cyan: 36, grey: 90, bold: 1 } as const;

/**
 * tsc's `--pretty` layout, so editors' problem matchers read the first line:
 *
 *   app/App.ts:4:27 - error NUCLO1001: …
 *
 *   4   const [a, b] = pairs[0]!;
 *                     ~~~~~~~~~
 */
export function formatPretty(d: Located, color: boolean): string {
  const c = (code: number, s: string) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
  const head = `${c(COLORS.cyan, d.file)}:${c(COLORS.yellow, String(d.line))}:${c(COLORS.yellow, String(d.column))} - ${c(COLORS.red, "error")} ${c(COLORS.grey, `${d.id}:`)} ${d.message}`;
  const text = sourceLine(d.file, d.line);
  if (text === undefined) return head;
  const gutter = String(d.line);
  const width = Math.max(1, Math.min(d.length ?? 1, text.length - (d.column - 1)));
  const frame = [
    `${c(7, gutter)} ${text}`,
    `${c(7, " ".repeat(gutter.length))} ${" ".repeat(d.column - 1)}${c(COLORS.red, "~".repeat(width))}`,
  ];
  const fix = d.fix === undefined ? "" : `\n  ${c(COLORS.cyan, "fix:")} write \`${d.fix}\``;
  const help = d.id.startsWith("NUCLO") ? `\n  ${c(COLORS.grey, `${d.id}: ${kindTitle(d.id)} — ${docsUrl(d.id)}`)}` : "";
  return `${head}\n\n${frame.join("\n")}${fix}${help}\n`;
}

const kindTitle = (id: string) => (KINDS.find((k) => k.code === id) ?? OTHER).title;

const sources = new Map<string, string[] | undefined>();
function sourceLine(file: string, line: number): string | undefined {
  if (!sources.has(file)) {
    try {
      sources.set(file, readFileSync(file, "utf8").split(/\r?\n/));
    } catch {
      sources.set(file, undefined);
    }
  }
  return sources.get(file)?.[line - 1]?.replace(/\t/g, " ");
}

/** "Found 3 errors in 2 files." as tsc says it. */
export function summary(diagnostics: { file: string }[], color: boolean): string {
  const n = diagnostics.length;
  const files = new Set(diagnostics.map((d) => d.file)).size;
  const text = `Found ${n} error${n === 1 ? "" : "s"}${files > 1 ? ` in ${files} files` : ""}.`;
  return color ? `\x1b[1m${text}\x1b[0m` : text;
}
