// app.ts: the dashboard. Every card is a scope() with its own timer: the timer
// moves the card's feed one step, then calls update() with the card's id, so a
// tick evaluates that card's dynamic values and nothing else. Every dynamic
// value goes through count(), which is how the page shows the cost. In
// "update() everything" mode each timer calls update() with no id: the page
// looks the same, but every tick of every timer evaluates every card.
import "nuclo";
import { HISTORY, SAMPLES, change, clock, load, orders, pushOrder, stepClock, stepLoad, stepTickers, tickers, type Ticker } from "./feeds.ts";
import { s } from "./styles.ts";

type Count = <T>(fn: () => T) => () => T;

let scoped = true; // false: every timer calls update() instead of update(id)
let paused = false;

// Evaluations per scope id: counted as they happen, turned into a rate once a second.
const meters = new Map<string, { count: number; rate: number }>();

function counter(id: string) {
  const meter = { count: 0, rate: 0 };
  meters.set(id, meter); // a card built again (the example reopened) starts from zero
  const count: Count = (fn) => () => { meter.count++; return fn(); };
  return { meter, count };
}

const refresh = (id: string) => (scoped ? update(id) : update());

// Runs step() after every delay(), then refreshes the card it feeds.
function every(delay: () => number, id: string, step: () => void) {
  let timer = setTimeout(function tick() {
    if (!paused) { step(); refresh(id); }
    timer = setTimeout(tick, delay());
  }, delay());
  return () => clearTimeout(timer);
}

// "x,y x,y …" for a polyline: x is the index, y puts min at the bottom of an
// h-tall box and max at the top.
function points(values: number[], h: number, min = Math.min(...values), max = Math.max(...values)) {
  return values.map((v, i) => `${i},${(h - ((v - min) / (max - min || 1)) * h).toFixed(1)}`).join(" ");
}

const percent = (values: number[]) => points(values, 100, 0, 100);
const latest = (values: number[]) => Math.round(values[SAMPLES - 1]);
const signed = (n: number) => `${n < 0 ? "" : "+"}${n.toFixed(2)}%`;
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// A card is one scope. Its head names the call its timer makes and how many
// of its dynamic values ran in the last second. That label also carries the
// shared "dash-meter" id: one update("dash-meter") refreshes it in every card.
function Card(id: string, title: string, rate: string, body: (count: Count) => NodeModLike<"section">[]) {
  const { meter, count } = counter(id);
  return section(
    s.card,
    scope(id),
    header(s.cardHead, h3(title), span(s.rate, rate), span(s.evals, scope("dash-meter"), count(() => `${meter.rate} evals/s`))),
    code(s.call, count(() => (scoped ? `update("${id}")` : "update()"))),
    ...body(count),
  );
}

function TickerRow(t: Ticker, count: Count) {
  return li(
    s.ticker,
    { class: count(() => cx(s.ticker, change(t) < 0 ? s.down : s.up).className) },
    strong(t.symbol),
    svgSvg(
      s.spark,
      { viewBox: `0 0 ${HISTORY - 1} 20`, preserveAspectRatio: "none", "aria-hidden": "true" },
      polylineSvg(s.line, { points: count(() => points(t.history, 20)) }),
    ),
    span(s.price, count(() => t.price.toFixed(2))),
    span(count(() => signed(change(t)))),
  );
}

const Tickers = () =>
  Card("dash-tickers", "Tickers", "20/s", (count) => [s.tall, ul(s.tickers, ...tickers.map((t) => TickerRow(t, count)))]);

const Load = () =>
  Card("dash-load", "Server load", "4/s", (count) => [
    s.wide,
    div(
      s.readings,
      span(s.cpu, count(() => `CPU ${latest(load.cpu)}%`)),
      span(s.memory, count(() => `Memory ${latest(load.memory)}%`)),
      span(count(() => `${load.rps} req/s`)),
    ),
    svgSvg(
      s.chart,
      { viewBox: `0 0 ${SAMPLES - 1} 100`, preserveAspectRatio: "none", role: "img", "aria-label": "CPU and memory, last 15 seconds" },
      ...[25, 50, 75].map((y) => lineSvg(s.rule, { x1: 0, y1: y, x2: SAMPLES - 1, y2: y })),
      polygonSvg(s.area, { points: count(() => `0,100 ${percent(load.cpu)} ${SAMPLES - 1},100`) }), // the CPU line, closed along the bottom
      polylineSvg(s.line, s.cpu, { points: count(() => percent(load.cpu)) }),
      polylineSvg(s.line, s.memory, { points: count(() => percent(load.memory)) }),
    ),
  ]);

const Clock = () =>
  Card("dash-clock", "Clock", "1/s", (count) => [
    div(
      s.clock,
      strong(count(() => clock.now?.toLocaleTimeString() ?? "--:--:--")),
      span(count(() => clock.now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) ?? "")),
    ),
  ]);

// A new order builds one row on top (it flashes) and the oldest row goes: the rest are kept.
const Orders = () =>
  Card("dash-log", "Orders", "~1/s", (count) => [
    ol(
      s.log,
      list(count(() => orders), (o) => li(s.order, span(s.id, `#${o.id}`), span(s.what, `${o.who} · ${o.qty} × ${o.item}`), span(money(o.cents)))),
    ),
  ]);

function Stats() {
  const { count } = counter("dash-stats");
  const total = () => [...meters.values()].reduce((sum, m) => sum + m.rate, 0);
  const mode = (value: boolean, text: string) =>
    button(
      s.mode,
      { class: count(() => cx(s.mode, scoped === value ? s.on : null).className), "aria-pressed": count(() => String(scoped === value)) },
      text,
      { onClick: () => { scoped = value; update(); } }, // every card's call label changes
    );
  return header(
    s.stats,
    scope("dash-stats"),
    p(s.total, scope("dash-meter"), strong(count(() => String(total()))), "dynamic values evaluated per second"),
    div(
      s.controls,
      div(s.modes, { role: "group", "aria-label": "Update mode" }, mode(true, "Scoped updates"), mode(false, "update() everything")),
      button(s.btn, count(() => (paused ? "Resume" : "Pause")), { onClick: () => { paused = !paused; update("dash-stats"); } }),
    ),
    p(
      s.hint,
      "Every card is a ", code("scope()"), ", and its timer calls ", code('update("its id")'),
      ": a tick evaluates that card and nothing else. Switch to ", code("update()"),
      " everything: the page looks the same, but every tick now evaluates every card. The clock still changes once a second; watch how often it is evaluated.",
    ),
  );
}

export function LiveDashboard() {
  return div(
    s.app,
    on("mount", () => {
      const stops = [
        every(() => 50, "dash-tickers", stepTickers),
        every(() => 250, "dash-load", stepLoad),
        every(() => 1000 - (Date.now() % 1000), "dash-clock", stepClock), // on the second, like a real clock
        every(() => 300 + Math.random() * 1700, "dash-log", pushOrder), // whenever an order comes in
      ];
      // The meter ignores Pause: it keeps showing what still runs.
      const meter = setInterval(() => {
        for (const m of meters.values()) { m.rate = m.count; m.count = 0; }
        refresh("dash-meter");
      }, 1000);
      return () => { stops.forEach((stop) => stop()); clearInterval(meter); };
    }),
    Stats(),
    div(s.grid, Tickers(), Load(), Clock(), Orders()),
  );
}
