// windows.ts: the window manager. A window is a plain object in one array,
// and every operation is a few assignments on it. Focus raises a window by
// handing it the next z-index, not by moving it to the end of the array: the
// list() that draws the windows never moves an element, so a textarea keeps
// its text, its caret and its focus. Nothing here knows about the UI.
import type { Program } from "./programs.ts";

export interface Win<S = unknown> {
  id: number;
  program: Program<S>;
  title: string;
  x: number; y: number; w: number; h: number; // px, inside the desktop
  z: number; // the highest is on top
  minimized: boolean;
  maximized: boolean;
  confirming: boolean; // asking whether to throw away unsaved work
  state: S; // the program's state lives on its window, so it outlives the view
}

const MIN = { w: 300, h: 220 };

export const windows: Win[] = [];
const desk = { w: 960, h: 520 }; // the desktop's size: a guess on the server, measured in the browser
let topZ = 0; // the highest z-index handed out so far
let nextId = 1;

const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));

/** The topmost window that is not minimized. */
export const active = () => windows.reduce<Win | null>((a, w) => (!w.minimized && (!a || w.z > a.z) ? w : a), null);

export function open<S>(program: Program<S>): Win<S> {
  const step = (windows.length % 6) * 28; // cascade: each new window a little lower and to the right
  const [w, h] = program.size;
  const win: Win<S> = {
    id: nextId++, program, title: program.name, x: 0, y: 0, w: Math.max(1, Math.min(w, desk.w - 16)), h: Math.max(1, Math.min(h, desk.h - 16)),
    z: ++topZ, minimized: false, maximized: false, confirming: false, state: program.init(),
  };
  move(win, 104 + step, 16 + step); // right of the desktop icons
  windows.push(win);
  return win;
}

export function close(win: Win) {
  const index = windows.indexOf(win);
  if (index !== -1) windows.splice(index, 1);
}

/** Closes it, unless its program has unsaved work: then it asks first. */
export function requestClose(win: Win) {
  if (win.program.unsaved?.(win)) win.confirming = true;
  else close(win);
}

/** Raises it, restoring it if it was minimized. The array order never changes. */
export function focus(win: Win) {
  win.minimized = false;
  if (win.z !== topZ) win.z = ++topZ;
}

export function minimize(win: Win) {
  win.minimized = true;
}

export function toggleMaximize(win: Win) {
  win.maximized = !win.maximized;
}

export function move(win: Win, x: number, y: number) {
  win.x = clamp(x, desk.w - win.w);
  win.y = clamp(y, desk.h - win.h);
}

export function resize(win: Win, w: number, h: number) {
  win.w = Math.min(desk.w - win.x, Math.max(MIN.w, w));
  win.h = Math.min(desk.h - win.y, Math.max(MIN.h, h));
}

/** The desktop changed size: every window shrinks and moves back inside it. */
export function setDesk(w: number, h: number) {
  desk.w = w;
  desk.h = h;
  for (const win of windows) {
    win.w = Math.min(win.w, w);
    win.h = Math.min(win.h, h);
    move(win, win.x, win.y);
  }
}
