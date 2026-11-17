/**
 * Language parity: every TypeScript feature the compiler translates, each card printing what its
 * check returned (all.ts). Every target must show exactly what `bun` prints for all.ts.
 */
import { type Style, div, h1, h2, list, p, render, setTimeout, update } from "../../src/index.ts";
import { type AsyncCheck, type Check, asyncChecks, checks } from "./all.ts";

const card: Style = { padding: 14, gap: 6, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };
const line: Style = { fontSize: 13, color: "#334155" };

const App = () =>
  div(
    { style: { padding: 20, gap: 12, backgroundColor: "#f8fafc" } },
    h1("Language parity"),
    list(() => checks, (c: Check) => div({ style: card }, h2(c.name), list(() => c.lines, (text: string) => p({ style: line }, text)))),
    list(() => asyncChecks, (c: AsyncCheck) => div({ style: card }, h2(c.name), list(() => c.log.lines, (text: string) => p({ style: line }, text)))),
  );

render(App);

// The promise checks finish within a few timer turns: show their lines as they arrive, until every log is done.
function refresh(): void {
  update();
  if (!asyncChecks.every((c: AsyncCheck) => c.log.lines.at(-1) === "done")) setTimeout(refresh, 50);
}
setTimeout(refresh, 50);
