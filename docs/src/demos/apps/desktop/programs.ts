// programs.ts: what runs in the windows. A program is a plain object: a name,
// an icon, a default size, init() for the state of a new window, and a view
// of that state. The state is kept on the window, so leaving the example and
// coming back builds the views again around the same note, sum, shell
// history and board. The Timer reaches outside its window: while it runs, it
// puts its countdown in the taskbar tray with into().
import "nuclo";
import { focus, open, windows, winScopeId, type Win } from "./windows.ts";
import { contextMenuKey, showContextMenu } from "./context-menu.ts";
import { icon } from "./icons.ts";
import { available, children, createEntry, entries, getEntry, moveEntry, pathOf, renameEntry, resolvePath, restoreEntry, storageStatus, trashEntry, writeEntry, type Entry } from "./filesystem.ts";
import { kanban } from "./kanban.ts";
import { calendar } from "./calendar.ts";
import { finance } from "./finance.ts";
import { s } from "./styles.ts";
export { kanban, calendar, finance };

export interface Program<S = unknown> {
  name: string;
  icon: string;
  size: [w: number, h: number];
  init(): S;
  view(win: Win<S>): NodeModLike<"div">;
  unsaved?(win: Win<S>): boolean; // while true, closing the window asks first
}

interface Note { text: string; saved: string; file: string; name: string; error: string }
const unsaved = (win: Win<Note>) => win.state.text !== win.state.saved;
function saveNote(win: Win<Note>, copy = false) {
  const note = win.state;
  try {
    if (!note.file || copy) {
      const file = createEntry(available("documents") ? "documents" : "root", note.name, "file");
      note.file = file.id;
      writeEntry(file.id, note.text);
    } else writeEntry(note.file, note.text, note.saved);
    note.saved = note.text; note.error = "";
    win.title = getEntry(note.file)!.name;
  } catch (error) { note.error = (error as Error).message; }
  update(); // rare, and cross-window: the new file shows in Files, the new title in the taskbar
}
export function openFile(entry: Entry) {
  if (entry.kind !== "file" || !available(entry.id)) return;
  const existing = windows.find((w) => w.program === notes && (w.state as Note).file === entry.id);
  if (existing) { focus(existing); return; }
  const win = open(notes);
  Object.assign(win.state, { file: entry.id, name: entry.name, text: entry.content, saved: entry.content });
  win.title = entry.name;
}
export const notes: Program<Note> = {
  name: "Notes", icon: "notes", size: [380, 360],
  init: () => ({ text: "", saved: "", file: "", name: "Untitled.txt", error: "" }), unsaved,
  view: (win) => div(s.notes,
    div(s.toolbar,
      input(s.input, { "aria-label": "File name for new note or copy", title: "Name for a new note or Save copy", value: win.state.name, onInput: (e) => { win.state.name = e.currentTarget.value; } }),
      button(s.btn, s.primary, "Save", { onClick: () => saveNote(win) }),
      button(s.btn, "Save copy", { onClick: () => saveNote(win, true) }),
    ),
    textarea(s.textarea, { "aria-label": "Note", placeholder: "A little room for your thoughts…", value: () => win.state.text, onInput: (e) => { win.state.text = e.currentTarget.value; update(winScopeId(win)); }, onKeyDown: (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNote(win); } } }),
    when(() => !!win.state.error, p(s.error, { role: "alert" }, () => win.state.error)),
    div(s.foot, span(() => unsaved(win) ? "Unsaved changes" : win.state.file ? "All changes saved" : "New note · save to Documents"), span(() => `${win.state.text.length} characters`)),
  ),
};

interface Explorer { folder: string; selected: string; search: string; action: string; name: string; destination: string; error: string; layout: string }
export const files: Program<Explorer> = {
  name: "Files", icon: "files", size: [620, 380],
  init: () => ({ folder: "documents", selected: "", search: "", action: "", name: "", destination: "root", error: "", layout: "list" }),
  view: (win) => {
    const state = win.state;
    const refresh = () => update(winScopeId(win)); // files updates stay in this window
    const navigate = (folder: string) => { Object.assign(state, { folder, selected: "", search: "", action: "", error: "" }); refresh(); };
    const selected = () => rows().find((entry) => entry.id === state.selected);
    const isTrash = () => state.folder === "trash";
    const rows = () => (isTrash() ? entries.filter((e) => e.trashed) : available(state.folder) ? children(state.folder) : []).filter((e) => e.name.toLowerCase().includes(state.search.toLowerCase()));
    const perform = (fn: () => void) => { try { fn(); state.error = ""; state.action = ""; } catch (e) { state.error = (e as Error).message; } refresh(); };
    const start = (action: string) => { state.action = action; state.name = action === "rename" ? selected()?.name ?? "" : action === "file" ? "Untitled.txt" : "New folder"; state.error = ""; refresh(); };
    // Opening a note (or another window) changes the window list: one global update.
    const activate = (entry: Entry) => { if (isTrash()) return; if (entry.kind === "folder") navigate(entry.id); else { openFile(entry); update(); } };
    const folderActions = () => [
      { label: "New folder", icon: "files", disabled: isTrash() || !available(state.folder), run: () => start("folder") },
      { label: "New note", icon: "notes", disabled: isTrash() || !available(state.folder), run: () => start("file") },
      { label: state.layout === "list" ? "View as grid" : "View as list", icon: "grid", run: () => { state.layout = state.layout === "list" ? "grid" : "list"; refresh(); } },
      { label: "Open in Terminal", icon: "terminal", disabled: isTrash() || !available(state.folder), run: () => { open(terminal).state.cwd = state.folder; update(); } },
    ];
    const entryActions = (entry: Entry) => {
      state.selected = entry.id;
      return isTrash() ? [
        { label: "Restore", icon: "restore", run: () => perform(() => { restoreEntry(entry.id); state.selected = ""; }) },
      ] : [
        { label: "Open", icon: entry.kind === "folder" ? "files" : "notes", run: () => activate(entry) },
        { label: "Rename", icon: "notes", run: () => start("rename") },
        { label: "Move to folder", icon: "files", run: () => start("move") },
        { label: "Move to Trash", icon: "trash", danger: true, run: () => perform(() => { trashEntry(entry.id); state.selected = ""; }) },
      ];
    };
    return div(s.explorer,
      aside(s.sidebar,
        span(s.sidebarTitle, "Workspace"),
        ...[["root", "Home", "grid"], ["documents", "Documents", "notes"], ["projects", "Projects", "files"], ["trash", "Trash", "trash"]].map(([id, label, glyph]) => button(s.sideItem, { "aria-label": label, title: label, "aria-current": () => state.folder === id ? "page" : "false", onClick: () => navigate(id) }, icon(glyph, 17), span(label))),
        p(s.diskHint, "Simulated disk", br(), "Private to this browser"),
      ),
      div(s.fileMain,
        div(s.toolbar,
          button(s.btn, { "aria-label": "Parent folder", disabled: () => state.folder === "root" || isTrash(), onClick: () => navigate(getEntry(state.folder)?.parent ?? "root") }, icon("up", 16)),
          span(s.breadcrumb, () => isTrash() ? "Trash" : pathOf(state.folder)),
          button(s.btn, { "aria-label": "Toggle file layout", onClick: () => { state.layout = state.layout === "list" ? "grid" : "list"; refresh(); } }, icon("grid", 16)),
        ),
        div(s.toolbar,
          input(s.input, { type: "search", "aria-label": "Search files", placeholder: "Search this folder", value: () => state.search, onInput: (e) => { state.search = e.currentTarget.value; refresh(); } }),
          button(s.btn, { disabled: isTrash, onClick: () => start("folder") }, "New folder"),
          button(s.btn, s.primary, { disabled: isTrash, onClick: () => start("file") }, "New note"),
        ),
        when(() => !!state.action, form(s.inlineForm, { onSubmit: (e) => { e.preventDefault(); perform(() => {
          if (state.action === "rename") renameEntry(state.selected, state.name);
          else if (state.action === "move") moveEntry(state.selected, state.destination);
          else { const entry = createEntry(state.folder, state.name, state.action === "folder" ? "folder" : "file"); state.selected = entry.id; }
        }); } },
          when(() => state.action === "move", select(s.input, { "aria-label": "Destination folder", value: () => state.destination, onChange: (e) => { state.destination = e.currentTarget.value; } }, option({ value: "root" }, "Home"), list(() => entries.filter((e) => e.kind === "folder" && available(e.id)), (e) => option({ value: e.id }, () => pathOf(e.id)))))
            .else(input(s.input, { "aria-label": "Item name", value: () => state.name, onMount: (el) => { el.focus(); el.select(); }, onInput: (e) => { state.name = e.currentTarget.value; } })),
          button(s.btn, s.primary, { type: "submit" }, () => state.action === "rename" ? "Rename" : state.action === "move" ? "Move" : "Create"),
          button(s.btn, { type: "button", onClick: () => { state.action = ""; state.error = ""; refresh(); } }, "Cancel"),
        )),
        when(() => !!state.error, p(s.error, { role: "alert" }, () => state.error)),
        div(s.fileList, { tabIndex: 0, "aria-haspopup": "menu", "aria-label": "Folder contents", onContextMenu: (e) => showContextMenu(e, isTrash() ? "Trash" : pathOf(state.folder), folderActions()), onKeyDown: (e) => { if (e.target === e.currentTarget) contextMenuKey(e, isTrash() ? "Trash" : pathOf(state.folder), folderActions()); }, class: () => cx(s.fileList, state.layout === "grid" ? s.fileGrid : null).className },
          list(rows, (entry) => button(s.fileRow, { "aria-haspopup": "menu", onContextMenu: (e) => showContextMenu(e, entry.name, entryActions(entry)), "aria-pressed": () => String(state.selected === entry.id), onClick: () => { state.selected = entry.id; refresh(); }, onDblClick: () => activate(entry), onKeyDown: (e) => { if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { contextMenuKey(e, entry.name, entryActions(entry)); return; } if (e.key === "Enter") { e.preventDefault(); activate(entry); } } },
            span(s.fileIcon, icon(entry.kind === "folder" ? "files" : "notes", 25)),
            span(s.fileName, () => entry.name), span(s.fileMeta, () => entry.kind === "folder" ? `${children(entry.id).length} items` : `${new TextEncoder().encode(entry.content).length} B`),
          )),
          when(() => !rows().length, div(s.empty, icon(isTrash() ? "trash" : "files", 32), strong(() => state.search ? "No matching files" : isTrash() ? "Trash is empty" : "This folder is empty"), p(() => state.search ? "Try another name." : isTrash() ? "Items you remove can be restored here." : "Create a folder or your first note."))),
          when(() => !isTrash() && !available(state.folder), button(s.btn, "Return home", { onClick: () => navigate("root") })),
        ),
        div(s.fileActions,
          span(s.selection, () => selected()?.name ?? `${rows().length} items`),
          when(() => !!selected() && !isTrash(),
            button(s.btn, "Open", { onClick: () => activate(selected()!) }),
            button(s.btn, "Rename", { onClick: () => start("rename") }),
            button(s.btn, "Move", { onClick: () => start("move") }),
            button(s.btn, { "aria-label": "Move to Trash", onClick: () => perform(() => { trashEntry(state.selected); state.selected = ""; }) }, icon("trash", 16)),
          ),
          when(() => !!selected() && isTrash(), button(s.btn, s.primary, "Restore", { onClick: () => perform(() => { restoreEntry(state.selected); state.selected = ""; }) })),
        ),
      ),
    );
  },
};

interface Calc { shown: string; acc: number; op: string; fresh: boolean } // fresh: the next digit starts a new number
const OPS: Record<string, (a: number, b: number) => number> = { "+": (a, b) => a + b, "−": (a, b) => a - b, "×": (a, b) => a * b, "÷": (a, b) => a / b };
const KEYS = [..."789÷456×123−C0.+="];
const cleared = (): Calc => ({ shown: "0", acc: 0, op: "", fresh: true });

// The keyboard reaches the same press() as the buttons: digits and "." type,
// + - * / are the operators, Enter (or =) equals, Escape (or Delete, c) clears.
function calcKey(key: string): string | null {
  if (/^[0-9.]$/.test(key)) return key;
  if (key === "+" || key === "-" || key === "*" || key === "/") return { "+": "+", "-": "−", "*": "×", "/": "÷" }[key]!;
  if (key === "Enter" || key === "=") return "=";
  if (key === "Escape" || key === "Delete" || key === "Backspace" || key === "c" || key === "C") return "C";
  return null;
}

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
  icon: "calculator",
  size: [250, 330],
  init: cleared,
  view: (win) =>
    div(s.calc,
      { tabIndex: 0, "aria-label": "Calculator. Type on your keyboard.", onKeyDown: (e) => {
        const key = calcKey(e.key);
        if (!key) return;
        e.preventDefault();
        press(win.state, key);
        update(winScopeId(win));
      }, onMount: (el) => el.focus() },
      output(s.display, () => win.state.shown),
      div(s.keys, ...KEYS.map((key) => button(cx(s.key, key === "=" ? s.primary : null), key, { onClick: () => { press(win.state, key); update(winScopeId(win)); } }))),
      p(s.calcHint, "Type with the keyboard · Enter = · Esc clears"),
    ),
};

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;

export const timer: Program<{ left: number; running: boolean }> = {
  name: "Timer",
  icon: "timer",
  size: [280, 210],
  init: () => ({ left: 60, running: false }),
  view: (win) => {
    const t = win.state;
    // The countdown is drawn twice: in the window and, while it runs, in the
    // taskbar tray — so a tick refreshes this window and the taskbar scope.
    const tick = () => update(winScopeId(win), "os-taskbar");
    return div(
      s.timer,
      // The window owns the interval: closing it, or leaving the example, stops it.
      on("mount", () => {
        const id = setInterval(() => {
          if (!t.running) return;
          t.running = --t.left > 0; // stops at zero
          tick();
        }, 1000);
        return () => clearInterval(id);
      }),
      output(s.countdown, () => mmss(t.left)),
      div(
        s.row,
        button(s.btn, s.primary, () => (t.running ? "Pause" : "Start"), { disabled: () => t.left === 0, onClick: () => { t.running = !t.running; tick(); } }),
        button(s.btn, "+1 min", { onClick: () => { t.left += 60; tick(); } }),
        button(s.btn, "Reset", { onClick: () => { Object.assign(t, timer.init()); tick(); } }),
      ),
      // Written here, drawn in the taskbar. It goes when the timer stops or this window closes.
      when(() => t.running, into("os-tray", button(s.trayItem, { title: "Show the timer", onClick: () => { focus(win); update(winScopeId(win), "os-taskbar"); } }, icon("timer", 15), () => mmss(t.left)))),
    );
  },
};

interface Shell { lines: string[]; cwd: string; history: string[]; cursor: number; opened: boolean }
const COMMANDS: Record<string, (args: string[], shell: Shell) => string | void> = {
  help: () => "Files: pwd · ls [path] · cd <folder> · cat <file>\nEdit: mkdir <name> · touch <name> · echo <text> > <file> · rm <path>\nApps: apps · open <app or file> · windows\nOther: date · clear · help\nUse quotes for names with spaces. rm moves items to Trash.",
  pwd: (_, shell) => pathOf(shell.cwd),
  ls: ([path = "."], shell) => {
    const id = resolvePath(path, shell.cwd);
    if (!id) throw new Error("Folder not found.");
    if (getEntry(id)?.kind === "file") return getEntry(id)!.name;
    return children(id).map((e) => e.name + (e.kind === "folder" ? "/" : "")).join("  ") || "(empty folder)";
  },
  cd: ([path = "/"], shell) => {
    const id = resolvePath(path, shell.cwd);
    if (!id || (id !== "root" && getEntry(id)?.kind !== "folder")) throw new Error("Folder not found.");
    shell.cwd = id;
  },
  cat: ([path = ""], shell) => {
    const file = getEntry(resolvePath(path, shell.cwd) ?? "");
    if (!file || file.kind !== "file") throw new Error("File not found.");
    return file.content || "(empty file)";
  },
  mkdir: ([name = ""], shell) => { createAtPath(name, shell.cwd, "folder"); },
  touch: ([name = ""], shell) => { if (!resolvePath(name, shell.cwd)) createAtPath(name, shell.cwd, "file"); },
  rm: ([path = ""], shell) => { const id = resolvePath(path, shell.cwd); if (!path || !id || id === "root") throw new Error("Choose a file or folder to move to Trash."); trashEntry(id); return "Moved to Trash. Restore it in Files."; },
  echo: (args, shell) => {
    const redirect = args.indexOf(">");
    if (redirect < 0) return args.join(" ");
    const path = args[redirect + 1];
    if (!path || args.length !== redirect + 2) throw new Error("Use echo <text> > <file>.");
    const id = resolvePath(path, shell.cwd) ?? createAtPath(path, shell.cwd, "file").id;
    writeEntry(id, args.slice(0, redirect).join(" ") + "\n");
  },
  apps: () => Object.keys(PROGRAMS).join("  "),
  date: () => new Date().toString(),
  clear: (_, shell) => { shell.lines.length = 0; },
  open: ([name = ""], shell) => {
    shell.opened = true; // a new window joins the desktop: the caller needs a global update
    if (PROGRAMS[name.toLowerCase()]) { open(PROGRAMS[name.toLowerCase()]); return; }
    const entry = getEntry(resolvePath(name, shell.cwd) ?? "");
    if (!entry) throw new Error('App or file not found. Try "apps" or "ls".');
    if (entry.kind === "file") openFile(entry);
    else open(files).state.folder = entry.id;
  },
  windows: () => windows.map((w) => `#${w.id}  ${w.title}${w.minimized ? "  minimized" : ""}`).join("\n"),
};
function createAtPath(path: string, cwd: string, kind: Entry["kind"]) {
  const slash = path.lastIndexOf("/");
  const parent = slash < 0 ? cwd : resolvePath(path.slice(0, slash) || "/", cwd);
  if (!parent) throw new Error("Parent folder not found.");
  return createEntry(parent, path.slice(slash + 1), kind);
}
/** Runs one command line. Returns true when it opened a window: then the caller needs a global update. */
function run(shell: Shell, line: string) {
  if (!available(shell.cwd)) shell.cwd = "root";
  shell.lines.push(`${pathOf(shell.cwd)} $ ${line}`);
  if (!line.trim()) return false;
  shell.history.push(line); shell.cursor = shell.history.length;
  shell.opened = false;
  try {
    const tokens = line.match(/"[^"\n]*"|'[^'\n]*'|[^\s]+/g) ?? [];
    const [name, ...args] = tokens.map((token) => token.replace(/^(["'])(.*)\1$/, "$2"));
    if (!COMMANDS[name]) throw new Error(`${name}: command not found. Try help.`);
    const out = COMMANDS[name](args, shell);
    if (out) shell.lines.push(out);
  } catch (e) { shell.lines.push((e as Error).message); }
  return shell.opened;
}
export const terminal: Program<Shell> = {
  name: "Terminal", icon: "terminal", size: [510, 340],
  init: () => ({ lines: ['Nuclo shell · your local workspace', 'Type "help" for commands.'], cwd: "documents", history: [], cursor: 0, opened: false }),
  view: (win) => div(s.term,
    // Click anywhere — on the output, the prompt, the blank space — and the
    // input line takes the keystrokes. Only a click on the input itself keeps
    // the caret where it is.
    { title: "Click anywhere to type", onClick: (e) => {
      const input = e.currentTarget.querySelector<HTMLInputElement>("input");
      if (!input || e.target === input) return;
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    } },
    div(pre(() => win.state.lines.join("\n")),
      div(s.prompt, span(() => `${pathOf(win.state.cwd)} $`), input({ "aria-label": "Command", autocomplete: "off", spellcheck: false, onMount: (el) => el.focus(), onKeyDown: (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault(); win.state.cursor = Math.max(0, Math.min(win.state.history.length, win.state.cursor + (e.key === "ArrowUp" ? -1 : 1)));
          e.currentTarget.value = win.state.history[win.state.cursor] ?? ""; return;
        }
        if (e.key !== "Enter") return;
        const opened = run(win.state, e.currentTarget.value); e.currentTarget.value = "";
        if (opened) update(); else update(winScopeId(win)); // opening an app changes the windows list
      } })),
    ),
  ),
};
export const appearance = { wallpaper: "grove" };
export const settings: Program<null> = {
  name: "Settings", icon: "settings", size: [360, 320], init: () => null,
  view: () => div(s.about,
    h3("Make it yours"), p("Choose a backdrop for your workspace."),
    // Global: the wallpaper attribute lives on the desktop root, outside this window.
    div(s.wallpapers, ...[["grove", "Grove"], ["dusk", "Dusk"], ["slate", "Slate"]].map(([value, label]) => button(s.swatch, { "aria-pressed": () => String(appearance.wallpaper === value), "data-wallpaper": value, onClick: () => { appearance.wallpaper = value; try { localStorage.setItem("nuclo-desktop-wallpaper", value); } catch {} update(); } }, label))),
    h3("Your local workspace"), p(() => storageStatus), p("This is a simulated file system. Files stay in this browser, and no real files on your device are changed."),
  ),
};
export const about: Program<null> = {
  name: "About", icon: "about", size: [360, 310], init: () => null,
  view: () => div(s.about,
    h3("Welcome to Nuclo OS"), p("A small desktop with room to work. Files, Notes and Terminal share one simulated disk; the Kanban board and the Calendar keep their own notes, and Finance keeps a ledger in IndexedDB."),
    p("Open an app with one click. Drag a title to move its window; double-click to maximize. Your open apps live in the taskbar."),
    button(s.btn, "Explore your files", { onClick: () => { open(files); update(); } }),
    h3("Running apps"), ol(list(() => [...windows].sort((a, b) => b.z - a.z), (w) => li(button(s.runningApp, { onClick: () => { focus(w); update(); } }, icon(w.program.icon, 16), () => w.title, span(() => w.minimized ? "Minimized" : "Open"))))),
  ),
};
export const PROGRAMS: Record<string, Program> = { files, notes, terminal, calculator, timer, kanban, finance, calendar, settings, about };
