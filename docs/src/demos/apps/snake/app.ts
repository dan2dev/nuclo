// app.ts: the game. The loop is a setTimeout: each tick calls step() on the
// plain game object, then update() once. The snake is a list() of its cell
// objects, and step() makes the tail object the new head, so a tick moves one
// existing element to the front and builds nothing. "Segments built" counts
// mounts to prove it: it only goes up when the snake eats.
import "nuclo";
import { interval, level, newGame, step, turn, type Cell, type Dir } from "./game.ts";
import { s } from "./styles.ts";

let game = newGame();
let state: "ready" | "playing" | "paused" | "over" = "ready";
let best = 0;
let built = 0; // segment elements built, counted by their mount
let timer: ReturnType<typeof setTimeout> | undefined;
let swipe = { x: 0, y: 0 }; // where the last press on the board started

function tick() {
  if (step(game)) timer = setTimeout(tick, interval(game));
  else state = "over";
  best = Math.max(best, game.score);
  update();
}

function play() {
  state = "playing";
  clearTimeout(timer);
  timer = setTimeout(tick, interval(game));
  update();
}

function pause() {
  clearTimeout(timer);
  state = "paused";
  update();
}

function restart() {
  game = newGame(); // new cell objects: the list builds three new segments
  built = 0;
  play();
}

// Space, P and the middle of the pad.
const toggle = () => (state === "playing" ? pause() : state === "over" ? restart() : play());

function steer(dir: Dir) {
  if (state === "over") return;
  turn(game, dir);
  if (state !== "playing") play();
}

const KEYS: Record<string, Dir> = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" };
const ARROWS: Record<Dir, string> = { up: "↑", left: "←", right: "→", down: "↓" };
const ANGLE: Record<Dir, string> = { right: "0deg", down: "90deg", left: "180deg", up: "-90deg" };

function onKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (KEYS[key]) steer(KEYS[key]);
  else if (key === " " || key === "p") toggle();
  else return; // Escape and the rest go on to the modal
  e.preventDefault(); // the modal steps examples on arrow keys, unless the event was handled
}

function Segment(cell: Cell) {
  const isHead = () => cell === game.snake[0];
  return div(
    s.segment,
    { class: () => cx(s.segment, isHead() ? s.head : null).className },
    // The position goes in `translate` and the heading in `rotate`, which
    // leaves `transform` free for the head's slide in from the neck.
    { style: () => ({ translate: `${cell.x * 100}% ${cell.y * 100}%`, rotate: isHead() ? ANGLE[game.dir] : "", animationDuration: `${interval(game)}ms` }) },
    on("mount", () => { built++; queueMicrotask(update); }),
    span(s.eye),
    span(s.eye),
  );
}

const Food = (food: Cell) => div(s.food, { style: { translate: `${food.x * 100}% ${food.y * 100}%` } });

const Overlay = (title: string, ...content: NodeModLike<"div">[]) => div(s.overlay, strong(title), ...content);

function Board() {
  return div(
    s.board,
    { tabIndex: 0, role: "application", "aria-label": "Snake: arrow keys or WASD steer, Space pauses" },
    on("mount", (el) => {
      el.focus({ preventScroll: true });
      // Leaving the example stops the loop. The game waits, paused, for the next visit.
      return () => { clearTimeout(timer); if (state === "playing") state = "paused"; built = 0; };
    }),
    {
      onKeyDown,
      onBlur: () => { if (state === "playing") pause(); },
      // Also runs after "Play again", whose button is gone by then: the focus comes back here.
      onClick: (e) => { e.currentTarget.focus(); if (state === "ready" || state === "paused") play(); },
      onPointerDown: (e) => { swipe = { x: e.clientX, y: e.clientY }; },
      onPointerMove: (e) => {
        if (e.pointerType !== "touch") return; // a mouse steers with the keyboard
        const dx = e.clientX - swipe.x;
        const dy = e.clientY - swipe.y;
        if (Math.hypot(dx, dy) < 24) return;
        steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        swipe = { x: e.clientX, y: e.clientY }; // keep swiping to keep turning
      },
    },
    // A new food object is a new item: its element is built, and pops in.
    list(() => [game.food], Food),
    list(() => game.snake, Segment),
    when(() => state === "ready", Overlay("Snake", p("Press an arrow key or Space"), p(s.small, "WASD works too. On a touch screen, swipe or use the pad.")))
      .when(() => state === "paused", Overlay("Paused", p("Click to continue")))
      .when(() => state === "over", Overlay("Game over", p(() => `Score ${game.score} · best ${best}`), button(s.again, "Play again", { onClick: restart }))),
  );
}

const keepFocus = (e: MouseEvent) => e.preventDefault(); // a press on the pad leaves the focus on the board

const PadButton = (area: string, label: string, glyph: NodeModLike<"button">, press: () => void) =>
  button(s.padBtn, { style: { gridArea: area }, title: label, "aria-label": label, onPointerDown: press, onMouseDown: keepFocus }, glyph);

const Stat = (label: string, value: NodeModLike<"dd">) => div(s.stat, dt(label), dd(value));

export function SnakeGame() {
  return div(
    s.app,
    div(s.stage, Board()),
    aside(
      s.panel,
      dl(
        s.stats,
        // A new score is a new item too, so its element is built again and the flash replays.
        Stat("Score", list(() => [game.score], (n) => span(n > 0 ? s.flash : null, String(n)))),
        Stat("Best", () => String(best)),
        Stat("Length", () => String(game.snake.length)),
        Stat("Segments built", () => String(built)),
        Stat("Speed", () => String(level(game))),
      ),
      p(s.note, "Each tick the tail element becomes the head: one element moves, none is built. ", strong("Segments built"), " only goes up when the snake eats."),
    ),
    div(
      s.pad,
      ...(Object.keys(ARROWS) as Dir[]).map((dir) => PadButton(dir, `Turn ${dir}`, ARROWS[dir], () => steer(dir))),
      PadButton("mid", "Pause or play", () => (state === "playing" ? "❚❚" : "►"), toggle),
    ),
  );
}
