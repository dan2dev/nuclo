/**
 * Language parity: every TypeScript feature the compiler translates, each card printing what its
 * check returned. Every target must show exactly what the TypeScript prints (`bun` on checks.ts).
 */
import { type Style, div, h1, h2, list, p, render } from "../../src/index.ts";
import {
  enums,
  namespaces,
  destructuring,
  spreadAndRest,
  operators,
  optionalCalls,
  loops,
  errors,
  arrays,
  strings,
  maps,
  numbers,
  classes,
  generics,
} from "./checks.ts";

interface Check {
  name: string;
  lines: string[];
}

const checks: Check[] = [
  { name: "enums", lines: enums() },
  { name: "namespaces", lines: namespaces() },
  { name: "destructuring", lines: destructuring() },
  { name: "spreadAndRest", lines: spreadAndRest() },
  { name: "operators", lines: operators() },
  { name: "optionalCalls", lines: optionalCalls() },
  { name: "loops", lines: loops() },
  { name: "errors", lines: errors() },
  { name: "arrays", lines: arrays() },
  { name: "strings", lines: strings() },
  { name: "maps", lines: maps() },
  { name: "numbers", lines: numbers() },
  { name: "classes", lines: classes() },
  { name: "generics", lines: generics() },
];

const card: Style = { padding: 14, gap: 6, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };
const line: Style = { fontSize: 13, color: "#334155" };

const App = () =>
  div(
    { style: { padding: 20, gap: 12, backgroundColor: "#f8fafc" } },
    h1("Language parity"),
    list(() => checks, (c: Check) => div({ style: card }, h2(c.name), list(() => c.lines, (text: string) => p({ style: line }, text)))),
  );

render(App);
