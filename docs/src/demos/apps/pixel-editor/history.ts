// history.ts: the picture and its past. The picture is a plain array of color
// strings, one per pixel ("" is transparent). A snapshot is pixels.slice(), and
// undo copies an older snapshot back. No store, no immutable data: old states
// are just old arrays. Nothing here knows about the UI.

export const SIZE = 32;
const LIMIT = 100; // snapshots kept; the oldest are dropped first

export interface Snapshot {
  label: string;
  pixels: string[];
}

// The starter picture: one string per row, one letter per pixel.
const INK: Record<string, string> = { k: "#1f2937", r: "#ef4444", w: "#ffffff", s: "#fde68a" };
const MUSHROOM = [
  ".....kkkkkk.....",
  "...kkrrrrrrkk...",
  "..krwwrrrrrrrk..",
  ".krwwwwrrrrwwrk.",
  ".krwwwwrrrwwwwk.",
  "krrrwwrrrrwwwwrk",
  "krrrrrrwwrrwwrrk",
  "krrrrrwwwwrrrrrk",
  "krrrrrwwwwrrrrrk",
  ".kkkkkkkkkkkkkk.",
  "...kssssssssk...",
  "...kssksskssk...",
  "...kssksskssk...",
  "...kssssssssk...",
  "....kssssssk....",
  ".....kkkkkk.....",
];

export const blank = () => Array<string>(SIZE * SIZE).fill("");

export function mushroom() {
  const px = blank();
  const edge = (SIZE - MUSHROOM.length) / 2; // the sprite is square: the same margin on every side
  MUSHROOM.forEach((row, y) => [...row].forEach((ch, x) => { px[(edge + y) * SIZE + edge + x] = INK[ch] ?? ""; }));
  return px;
}

export const pixels = mushroom();
export const history: Snapshot[] = [{ label: "Mushroom", pixels: pixels.slice() }];
export let at = 0; // the snapshot that `pixels` matches

/** Saves the picture as a new step. A step that changed nothing is not saved. */
export function commit(label: string) {
  if (pixels.every((c, i) => c === history[at].pixels[i])) return;
  history.splice(at + 1); // a new step drops the undone ones
  history.push({ label, pixels: pixels.slice() });
  if (history.length > LIMIT) history.shift();
  at = history.length - 1;
}

/** Overwrites the picture in place: the array the cells read stays the same one. */
export const load = (next: string[]) => { pixels.splice(0, SIZE * SIZE, ...next); };

export function jump(i: number) {
  at = i;
  load(history[i].pixels);
}
export const undo = () => { if (at > 0) jump(at - 1); };
export const redo = () => { if (at < history.length - 1) jump(at + 1); };

const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
export const get = (x: number, y: number) => (inside(x, y) ? pixels[y * SIZE + x] : "");

/** Paints every pixel from (x0, y0) to (x1, y1), so a fast stroke leaves no gaps. Returns how many changed. */
export function line(x0: number, y0: number, x1: number, y1: number, color: string) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  let changed = 0;
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
    if (inside(x, y) && pixels[y * SIZE + x] !== color) { pixels[y * SIZE + x] = color; changed++; }
  }
  return changed;
}

/** Flood fill, with a stack instead of recursion. Returns how many pixels changed. */
export function fill(x: number, y: number, color: string) {
  const from = get(x, y);
  if (!inside(x, y) || from === color) return 0;
  const stack = [[x, y]];
  let changed = 0;
  while (stack.length) {
    const [px, py] = stack.pop()!;
    if (!inside(px, py) || pixels[py * SIZE + px] !== from) continue;
    pixels[py * SIZE + px] = color;
    changed++;
    stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
  }
  return changed;
}
