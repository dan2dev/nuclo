/**
 * A js-framework-benchmark style test, compiled like any other app.
 *
 * Each operation is timed from just before it runs until the first message after the frame
 * that shows it: the operation, update(), then the platform's measure, layout and draw.
 * Every operation runs RUNS times on fresh data; the mean and the fastest go to the screen
 * and to the log (`BENCH <op> mean=… min=…`). The run starts by itself after launch.
 */
import { button, console, div, h2, list, p, render, setTimeout, small, span, update } from "../../src/index.ts";

interface Row {
  id: number;
  label: string;
}

interface Score {
  name: string;
  mean: number;
  min: number;
}

const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful", "mushy", "odd", "unsightly", "adorable", "important", "inexpensive", "cheap", "expensive", "fancy"];
const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
const NOUNS = ["table", "chair", "house", "bbq", "desk", "car", "pony", "cookie", "sandwich", "burger", "pizza", "mouse", "keyboard"];

const STEPS = [
  "create 1,000 rows",
  "replace all 1,000 rows",
  "partial update (every 10th of 1,000)",
  "select row",
  "swap rows",
  "remove row",
  "create 10,000 rows",
  "append 1,000 to 1,000 rows",
  "clear 1,000 rows",
];
const RUNS = 5;

let rows: Row[] = [];
let selected = 0;
let nextId = 1;
let status = "Starting…";
let running = false;
const results: Score[] = [];

let stepIndex = 0;
let runIndex = 0;
let samples: number[] = [];

function pick(words: string[]): string {
  return words[Math.floor(Math.random() * words.length)] ?? "";
}

function build(count: number): Row[] {
  const out: Row[] = [];
  for (let i = 0; i < count; i++) {
    out.push({ id: nextId, label: `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}` });
    nextId += 1;
  }
  return out;
}

/** The state an operation starts from (not timed). */
function prepare(step: string) {
  selected = 0;
  switch (step) {
    case "create 1,000 rows":
    case "create 10,000 rows":
      rows = [];
      break;
    default:
      rows = build(1000);
  }
}

/** The operation itself (timed, with its update and frame). */
function act(step: string) {
  switch (step) {
    case "create 1,000 rows":
      rows = build(1000);
      break;
    case "replace all 1,000 rows":
      rows = build(1000);
      break;
    case "partial update (every 10th of 1,000)":
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row !== undefined && i % 10 === 0) row.label = row.label + " !!!";
      }
      break;
    case "select row":
      selected = rows[500]?.id ?? 0;
      break;
    case "swap rows": {
      const a = rows[1];
      const b = rows[998];
      if (a !== undefined && b !== undefined) {
        rows[1] = b;
        rows[998] = a;
      }
      break;
    }
    case "remove row":
      rows.splice(500, 1);
      break;
    case "create 10,000 rows":
      rows = build(10000);
      break;
    case "append 1,000 to 1,000 rows":
      for (const row of build(1000)) rows.push(row);
      break;
    case "clear 1,000 rows":
      rows = [];
      break;
  }
}

function start() {
  if (running) return;
  running = true;
  results.splice(0, results.length);
  stepIndex = 0;
  runIndex = 0;
  samples = [];
  next();
}

/** Prepares the next sample, lets it settle, then times it. */
function next() {
  if (stepIndex >= STEPS.length) {
    running = false;
    rows = [];
    status = "Done";
    console.log("BENCH done");
    update();
    return;
  }
  const step = STEPS[stepIndex] ?? "";
  status = `${step} · run ${runIndex + 1}/${RUNS}`;
  prepare(step);
  update();
  setTimeout(() => measure(step), 300);
}

function measure(step: string) {
  const started = Date.now();
  act(step);
  update();
  // Runs after the frame: Android and UIKit lay out and draw before the next queued message.
  setTimeout(() => {
    samples.push(Date.now() - started);
    runIndex += 1;
    if (runIndex === RUNS) record(step);
    next();
  }, 0);
}

function record(step: string) {
  let total = 0;
  let min = samples[0] ?? 0;
  for (const ms of samples) {
    total += ms;
    if (ms < min) min = ms;
  }
  const mean = total / samples.length;
  results.push({ name: step, mean, min });
  console.log("BENCH", step, `mean=${mean.toFixed(1)}`, `min=${min.toFixed(1)}`);
  samples = [];
  runIndex = 0;
  stepIndex += 1;
}

const RowView = (row: Row) =>
  div(
    {
      style: () => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 6,
        backgroundColor: selected === row.id ? "#fde68a" : "#ffffff",
      }),
      onClick: () => {
        selected = row.id;
        update();
      },
    },
    span(() => String(row.id), { style: { width: 56, color: "#64748b" } }),
    span(() => row.label, { style: { flex: 1 } }),
    button("×", {
      onClick: () => {
        rows.splice(rows.indexOf(row), 1);
        update();
      },
    }),
  );

const App = () =>
  div(
    {
      style: { padding: 12, gap: 8 },
      onMount: () => {
        setTimeout(start, 1500);
      },
    },
    h2("nuclo-native-ts benchmark"),
    p(() => status),
    button("Run again", { disabled: () => running, onClick: start }),
    button("Load 1,000 rows (scroll test)", {
      disabled: () => running,
      onClick: () => {
        rows = build(1000);
        update();
      },
    }),
    list(() => results, (r) => small(`${r.name}: ${r.mean.toFixed(1)} ms (min ${r.min.toFixed(1)})`)),
    div(list(() => rows, (row) => RowView(row))),
  );

render(App);
