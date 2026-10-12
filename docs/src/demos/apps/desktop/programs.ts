// programs.ts: what runs in the windows. A program is a plain object: a name,
// an icon, a default size, init() for the state of a new window, and a view
// of that state. The state is kept on the window, so leaving the example and
// coming back builds the views again around the same note, sum and shell
// history. The Timer reaches outside its window: while it runs, it puts its
// countdown in the taskbar tray with into().
import "nuclo";
import { focus, open, windows, type Win } from "./windows.ts";
import { s } from "./styles.ts";

export interface Program<S = unknown> {
  name: string;
  icon: string;
  size: [w: number, h: number];
  init(): S;
  view(win: Win<S>): NodeModLike<"div">;
  unsaved?(win: Win<S>): boolean; // while true, closing the window asks first
}

interface Note { text: string; saved: string }
const unsaved = (win: Win<Note>) => win.state.text !== win.state.saved;

export const notes: Program<Note> = {
  name: "Notes",
  icon: "📝",
  size: [340, 270],
  init: () => ({ text: "", saved: "" }),
  unsaved,
  view: (win) =>
    div(
      s.notes,
      textarea(s.textarea, { "aria-label": "Note", placeholder: "Write something…", value: win.state.text }, { onInput: (e) => { win.state.text = e.currentTarget.value; update(); } }),
      div(
        s.foot,
        button(s.btn, "Save", { disabled: () => !unsaved(win), onClick: () => { win.state.saved = win.state.text; update(); } }),
        span(() => (unsaved(win) ? "Not saved" : "Saved")),
      ),
    ),
};

interface Calc { shown: string; acc: number; op: string; fresh: boolean } // fresh: the next digit starts a new number
const OPS: Record<string, (a: number, b: number) => number> = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => a / b };
const KEYS = [..."789÷456×123−C0.+="];
const cleared = (): Calc => ({ shown: "0", acc: 0, op: "", fresh: true });

function press(c: Calc, key: string) {
  if (key === "C") Object.assign(c, cleared());
  else if (key === "=" || key in OPS) {
    // Left to right, like a pocket calculator: 2 + 3 × 4 = 20.
    if (c.op && !c.fresh) c.shown = String(+OPS[c.op](c.acc, +c.shown).toPrecision(12));
    c.acc = +c.shown;
    c.op = key === "=" ? "" : key;
    c.fresh = true;
  } else if (key !== "." || c.fresh || !c.shown.includes(".")) {
    c.shown = c.fresh || c.shown === "0" ? (key === "." ? "0." : key) : c.shown + key;
    c.fresh = false;
  }
}

export const calculator: Program<Calc> = {
  name: "Calculator",
  icon: "🧮",
  size: [250, 320],
  init: cleared,
  view: (win) =>
    div(
      s.calc,
      output(s.display, () => win.state.shown),
      div(s.keys, ...KEYS.map((key) => button(cx(s.key, key === "=" ? s.primary : null), key, { onClick: () => { press(win.state, key); update(); } }))),
    ),
};

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export const timer: Program<{ left: number; running: boolean }> = {
  name: "Timer",
  icon: "⏱️",
  size: [280, 210],
  init: () => ({ left: 60, running: false }),
  view: (win) => {
    const t = win.state;
    return div(
      s.timer,
      // The window owns the interval: closing it, or leaving the example, stops it.
      on("mount", () => {
        const id = setInterval(() => {
          if (!t.running) return;
          t.running = --t.left > 0; // stops at zero
          update();
        }, 1000);
        return () => clearInterval(id);
      }),
      output(s.countdown, () => mmss(t.left)),
      div(
        s.row,
        button(s.btn, s.primary, () => (t.running ? "Pause" : "Start"), { disabled: () => t.left === 0, onClick: () => { t.running = !t.running; update(); } }),
        button(s.btn, "+1 min", { onClick: () => { t.left += 60; update(); } }),
        button(s.btn, "Reset", { onClick: () => { Object.assign(t, timer.init()); update(); } }),
      ),
      // Written here, drawn in the taskbar. It goes when the timer stops or this window closes.
      when(() => t.running, into("os-tray", button(s.trayItem, { title: "Show the timer", onClick: () => { focus(win); update(); } }, () => `${win.program.icon} ${mmss(t.left)}`))),
    );
  },
};

interface Shell { lines: string[] }

const COMMANDS: Record<string, (args: string[], shell: Shell) => string | void> = {
  help: () => "help  ls  echo <text>  date  clear  open <program>  windows",
  ls: () => Object.keys(PROGRAMS).join("  "),
  echo: (args) => args.join(" "),
  date: () => new Date().toString(),
  clear: (_, shell) => { shell.lines.length = 0; },
  open: ([name = ""]) => {
    if (!PROGRAMS[name]) return `open: no program "${name}". Try ls.`;
    open(PROGRAMS[name]);
  },
  windows: () => windows.map((w) => `#${w.id}  ${w.title}  z ${w.z}${w.minimized ? "  minimized" : ""}`).join("\n"),
};

function run(shell: Shell, line: string) {
  const [name, ...args] = line.trim().split(/\s+/);
  shell.lines.push(`$ ${line}`);
  if (!name) return;
  const out = COMMANDS[name] ? COMMANDS[name](args, shell) : `${name}: command not found. Try help.`;
  if (out) shell.lines.push(out);
}

export const terminal: Program<Shell> = {
  name: "Terminal",
  icon: "💻",
  size: [440, 280],
  init: () => ({ lines: ["Nuclo OS shell. Type help."] }),
  view: (win) =>
    // column-reverse keeps the scroll pinned to the newest line
    div(
      s.term,
      div(
        pre(() => win.state.lines.join("\n")),
        div(
          s.prompt,
          span("$"),
          input({ "aria-label": "Command", autocomplete: "off", spellcheck: false }, {
            onKeyDown: (e) => {
              if (e.key !== "Enter") return;
              run(win.state, e.currentTarget.value);
              e.currentTarget.value = "";
              update();
            },
          }),
        ),
      ),
    ),
};

export const about: Program<null> = {
  name: "About",
  icon: "ℹ️",
  size: [300, 280],
  init: () => null,
  view: () =>
    div(
      s.about,
      p(strong("Nuclo OS. "), "The windows are plain objects in one array, drawn by a list(). Raising one only changes its z-index."),
      p("Open windows, topmost first:"),
      ol(list(() => [...windows].sort((a, b) => b.z - a.z), (w) => li(span(`${w.program.icon} ${w.title}`), span(() => (w.minimized ? "minimized" : `z ${w.z}`))))),
    ),
};

export const PROGRAMS: Record<string, Program> = { notes, calculator, timer, terminal, about };
