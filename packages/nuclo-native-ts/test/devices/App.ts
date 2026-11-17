/**
 * The language corpus on a device (test/devices.test.ts): examples/language/App.ts's screen, and once every promise
 * log is done, every check printed with console.log (`## name`, its lines, then `## __done__`), which the test reads
 * from the simulator's stdout or the emulator's logcat and compares with bun.
 * The cards are built only once the promise checks are done: rendering ~2,000 rows first would hold the main thread
 * past the checks' timer deadlines (patterns-async/asyncQueue's order depends on 5-50 ms sleeps), as it would in a
 * browser, and bun runs them on an idle loop.
 */
import { type Style, console, div, h1, h2, list, p, render, setTimeout, update, when } from "../../src/index.ts";
import { type AsyncCheck, type Check, asyncChecks, checks } from "../../examples/language/all.ts";

const card: Style = { padding: 14, gap: 6, borderRadius: 10, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };
const line: Style = { fontSize: 13, color: "#334155" };

const App = () =>
  div(
    { style: { padding: 20, gap: 12, backgroundColor: "#f8fafc" } },
    h1("Language parity"),
    when(
      () => ready,
      list(() => checks, (c: Check) => div({ style: card }, h2(c.name), list(() => c.lines, (text: string) => p({ style: line }, text)))),
      list(() => asyncChecks, (c: AsyncCheck) => div({ style: card }, h2(c.name), list(() => c.log.lines, (text: string) => p({ style: line }, text)))),
    ).else(p("Running the promise checks…")),
  );

let ready = false;
render(App);

// Lines go out a few at a time (one console.log of at most 1,200 UTF-16 units, under logcat's ~4 KB message limit):
// thousands of single-line messages at once can lose some in Android's log buffer.
let chunk: string[] = [];
let size = 0;
function out(text: string): void {
  if (size + text.length > 1200 && chunk.length > 0) {
    console.log(chunk.join("\n"));
    chunk = [];
    size = 0;
  }
  chunk.push(text);
  size += text.length + 1;
}

function dump(): void {
  for (const c of checks) {
    out(`## ${c.name}`);
    for (const l of c.lines) out(l);
  }
  for (const c of asyncChecks) {
    out(`## ${c.name}`);
    for (const l of c.log.lines) out(l);
  }
  out("## __done__");
  console.log(chunk.join("\n"));
}

let waited = 0;
function refresh(): void {
  waited += 50;
  if (asyncChecks.every((c: AsyncCheck) => c.log.lines.at(-1) === "done") || waited >= 5000) {
    ready = true;
    update();
    dump();
  } else setTimeout(refresh, 50);
}
setTimeout(refresh, 50);
