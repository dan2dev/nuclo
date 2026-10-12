// app.ts: the player. The state is a handful of plain variables; the UI reads
// them through functions. next() is the only place the engine runs, and the
// one update() in it is what refreshes the bars, the counters and the status.
import "nuclo";
import { ALGORITHMS, type Item, type Step } from "./algorithms.ts";
import { s } from "./styles.ts";

const SIZE = 24;

let start: number[] = Array.from({ length: SIZE }, (_, i) => ((i * 7) % SIZE) + 1);
let items: Item[] = [];
let algorithm: keyof typeof ALGORITHMS = "Bubble";
let run: Generator<Step, void> | null = null;
let step: Step | null = null; // the last thing the algorithm did
let compares = 0;
let swaps = 0;
let playing = false;
let speed = 30; // steps per second
let timer: ReturnType<typeof setTimeout> | undefined;

function reset() {
  stop();
  items = start.map((value) => ({ value, sorted: false }));
  run = null;
  step = null;
  compares = swaps = 0;
  update();
}

function shuffle() {
  for (let i = start.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [start[i], start[j]] = [start[j], start[i]];
  }
  reset();
}

// One step: the generator mutates `items`, we note what it did, then update().
function next() {
  run ??= ALGORITHMS[algorithm](items);
  const result = run.next();
  if (result.done) {
    stop();
    step = null;
  } else {
    step = result.value;
    if (step.kind === "swap") swaps++;
    else compares++;
  }
  update();
}

function play() {
  playing = true;
  tick();
}

function tick() {
  next();
  if (playing) timer = setTimeout(tick, 1000 / speed);
}

function stop() {
  playing = false;
  clearTimeout(timer);
}

reset();

const isActive = (item: Item) => step !== null && (step.a === item || step.b === item);

const status = () => {
  if (!step) return items.every((item) => item.sorted) ? "Sorted." : "Press Play or Step.";
  return step.kind === "swap"
    ? `Swapped ${step.a.value} and ${step.b.value}`
    : `Compared ${step.a.value} with ${step.b.value}`;
};

export function SortingStepper() {
  return div(
    s.app,
    on("destroy", stop),
    div(
      s.toolbar,
      select(
        s.select,
        { value: () => algorithm, "aria-label": "Algorithm" },
        { onChange: (e) => { algorithm = e.currentTarget.value as keyof typeof ALGORITHMS; reset(); } },
        ...Object.keys(ALGORITHMS).map((name) => option({ value: name }, name)),
      ),
      button(s.btn, s.primary, () => (playing ? "Pause" : "Play"), { onClick: () => { if (playing) { stop(); update(); } else play(); } }),
      button(s.btn, "Step", { disabled: () => playing, onClick: next }),
      button(s.btn, "Reset", { onClick: reset }),
      button(s.btn, "Shuffle", { onClick: shuffle }),
      label(
        s.speed,
        "Speed",
        input({ type: "range", min: "1", max: "120", value: () => String(speed) }, { onInput: (e) => { speed = Number(e.currentTarget.value); update(); } }),
        span(() => `${speed}/s`),
      ),
    ),
    // Items are tracked by identity: a swap moves two existing bars, it never
    // rebuilds them. The height is static; only the class is read again.
    div(
      s.bars,
      list(
        () => items,
        (item) =>
          div(
            s.bar,
            { style: { height: `${(item.value / SIZE) * 100}%` } },
            { class: () => cx(s.bar, isActive(item) ? (step!.kind === "swap" ? s.swap : s.compare) : item.sorted ? s.sorted : null).className },
            span(s.value, String(item.value)),
          ),
      ),
    ),
    div(
      s.status,
      span(() => `${compares} comparisons · ${swaps} swaps`),
      span(status),
    ),
    div(
      s.legend,
      span(s.key, span(s.dot, s.compare), "Comparing"),
      span(s.key, span(s.dot, s.swap), "Swapping"),
      span(s.key, span(s.dot, s.sorted), "In place"),
    ),
  );
}
