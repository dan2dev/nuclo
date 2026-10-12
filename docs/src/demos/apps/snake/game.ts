// game.ts: the rules, with no DOM. A snake is an array of { x, y } cells, head
// first. step() moves it one cell by turning the tail object into the new
// head: the same objects, in a new order. Only eating adds an object.

export const GRID = 20; // cells per side
const PER_LEVEL = 5; // foods per speed level

export type Dir = "up" | "down" | "left" | "right";

export interface Cell {
  x: number;
  y: number;
}

export interface Game {
  snake: Cell[]; // head first
  food: Cell;
  dir: Dir;
  turns: Dir[]; // pressed but not taken yet: one per step
  score: number;
}

const DELTA: Record<Dir, Cell> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

// Always the same start: the server and the browser render the same board.
export const newGame = (): Game => ({
  snake: [{ x: 6, y: 10 }, { x: 5, y: 10 }, { x: 4, y: 10 }],
  food: { x: 14, y: 10 },
  dir: "right",
  turns: [],
  score: 0,
});

export const level = (g: Game) => 1 + Math.floor(g.score / PER_LEVEL);
export const interval = (g: Game) => Math.max(60, 160 - (level(g) - 1) * 15); // ms per step

/**
 * Queues a turn. It is checked against the last queued one, so two quick
 * presses within one step both count, and a turn back into the neck is refused.
 */
export function turn(g: Game, dir: Dir) {
  const last = g.turns.at(-1) ?? g.dir;
  if (dir !== last && dir !== OPPOSITE[last] && g.turns.length < 3) g.turns.push(dir);
}

/** Moves one cell. Returns false when the game is over: a wall, the snake itself, or a full board. */
export function step(g: Game) {
  g.dir = g.turns.shift() ?? g.dir;
  const x = g.snake[0].x + DELTA[g.dir].x;
  const y = g.snake[0].y + DELTA[g.dir].y;
  const eats = x === g.food.x && y === g.food.y;
  const body = eats ? g.snake : g.snake.slice(0, -1); // the tail leaves its cell this step, unless the snake grows
  if (x < 0 || y < 0 || x >= GRID || y >= GRID || body.some((c) => c.x === x && c.y === y)) return false;
  if (eats) {
    g.snake.unshift({ x, y }); // the only new object
    g.score++;
    return placeFood(g);
  }
  const tail = g.snake.pop()!;
  tail.x = x;
  tail.y = y;
  g.snake.unshift(tail); // the tail object is the new head
  return true;
}

// Food goes on a random free cell. There is none left only when the snake fills the board.
function placeFood(g: Game) {
  const taken = new Set(g.snake.map((c) => c.y * GRID + c.x));
  const free = Array.from({ length: GRID * GRID }, (_, i) => i).filter((i) => !taken.has(i));
  if (free.length === 0) return false;
  const i = free[Math.floor(Math.random() * free.length)];
  g.food = { x: i % GRID, y: Math.floor(i / GRID) };
  return true;
}
