// app.ts: the desktop. The windows are a list() over one array of plain
// objects, placed by a dynamic style. Raising a window only changes its
// z-index, so its element never moves and whatever is typed in it stays.
// The layout leaves two regions: the tray in the taskbar and a modal layer
// over everything. A window fills them with into() from inside itself, and
// what it puts there lives as long as the window does: close a running Timer
// and its tray icon goes with it. Close an unsaved note and the dialog that
// asks first is written in the window but drawn above the whole desktop.
import "nuclo";
import { about, notes, PROGRAMS, type Program } from "./programs.ts";
import { active, close, focus, minimize, move, open, requestClose, resize, setDesk, toggleMaximize, windows, type Win } from "./windows.ts";
import { s } from "./styles.ts";

let menuOpen = false;
let clock = "--:--"; // the server cannot know the visitor's time: set on mount

// What it boots into: the same on the server and in the browser.
open(notes).state.text = "Drag a window by its title, resize it from the corner, double-click the title to maximize.\n\nThis note is not saved: close it to see the dialog.";
move(open(about), 480, 40);

type Press = PointerEvent & { currentTarget: HTMLElement };

// A drag handle. Pointer capture keeps the moves coming to the handle even
// outside the window, for a mouse, a pen or a finger (touch-action: none).
function drag(win: Win, from: () => [number, number], to: (a: number, b: number) => void) {
  let dx = 0;
  let dy = 0;
  return {
    onPointerDown: (e: Press) => {
      if (win.maximized) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const [a, b] = from();
      dx = a - e.clientX;
      dy = b - e.clientY;
    },
    onPointerMove: (e: Press) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      to(e.clientX + dx, e.clientY + dy);
      update();
    },
  };
}

function ConfirmDialog(win: Win) {
  return div(
    s.backdrop,
    div(
      s.dialog,
      { role: "alertdialog", "aria-modal": "true", "aria-label": "Discard changes?" },
      h3("Discard changes?"),
      p(`${win.title} has text that is not saved.`),
      div(
        s.actions,
        button(s.btn, "Keep editing", { onMount: (el) => el.focus(), onClick: () => { win.confirming = false; update(); } }),
        // Closing the window removes its list() row, and this dialog with it.
        button(s.btn, s.danger, "Discard", { onClick: () => { close(win); update(); } }),
      ),
    ),
  );
}

function WindowView(win: Win) {
  return section(
    s.win,
    {
      "aria-label": win.title,
      class: () => cx(s.win, win === active() ? s.active : null, win.minimized ? s.minimized : null, win.maximized ? s.maximized : null).className,
      style: () => {
        const [left, top, width, height] = win.maximized ? ["0", "0", "100%", "100%"] : [win.x, win.y, win.w, win.h].map((n) => `${n}px`);
        return { left, top, width, height, zIndex: String(win.z) };
      },
      onPointerDown: () => { focus(win); update(); },
    },
    header(
      s.bar,
      div(s.title, { onDblClick: () => { toggleMaximize(win); update(); } }, drag(win, () => [win.x, win.y], (x, y) => move(win, x, y)), `${win.program.icon} ${win.title}`),
      button(s.ctl, { title: "Minimize", "aria-label": "Minimize", onClick: () => { minimize(win); update(); } }, "–"),
      button(s.ctl, { title: () => (win.maximized ? "Restore" : "Maximize"), "aria-label": "Maximize", "aria-pressed": () => String(win.maximized), onClick: () => { toggleMaximize(win); update(); } }, "□"),
      button(s.ctl, s.close, { title: "Close", "aria-label": "Close", onClick: () => { requestClose(win); update(); } }, "×"),
    ),
    div(s.body, win.program.view(win)),
    div(s.grip, drag(win, () => [win.w, win.h], (w, h) => resize(win, w, h))),
    when(() => win.confirming, into("os-modal", ConfirmDialog(win))),
  );
}

function TaskButton(win: Win) {
  return button(
    s.task,
    {
      class: () => cx(s.task, win === active() ? s.current : null, win.minimized ? s.faded : null).className,
      title: win.title,
      "aria-pressed": () => String(win === active()),
      onClick: () => { if (win === active()) minimize(win); else focus(win); update(); },
    },
    win.program.icon,
    span(s.label, win.title),
  );
}

function Icon(program: Program) {
  return button(
    s.icon,
    {
      title: `Open ${program.name}`,
      // A mouse opens on double-click, as on a desktop. A tap, or Enter (detail 0), opens at once.
      onClick: (e) => {
        if (e.pointerType === "mouse" ? e.detail !== 2 : e.detail > 1) return;
        open(program);
        update();
      },
    },
    span(s.glyph, program.icon),
    program.name,
  );
}

function Clock() {
  return time(
    s.clock,
    on("mount", () => {
      const tick = () => { clock = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); update(); };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }),
    () => clock,
  );
}

export function Desktop() {
  return div(
    s.app,
    div(
      s.desk,
      on("mount", (el) => {
        const sizes = new ResizeObserver(() => {
          if (!el.clientWidth) return; // hidden while a source tab is showing: keep the windows as they are
          setDesk(el.clientWidth, el.clientHeight);
          update();
        });
        sizes.observe(el);
        return () => sizes.disconnect();
      }),
      { onPointerDown: () => { if (menuOpen) { menuOpen = false; update(); } } },
      div(s.icons, ...Object.values(PROGRAMS).map(Icon)),
      list(() => windows, WindowView),
    ),
    footer(
      s.taskbar,
      button(s.start, { "aria-expanded": () => String(menuOpen), onClick: () => { menuOpen = !menuOpen; update(); } }, "◆ Start"),
      when(() => menuOpen, nav(s.menu, ...Object.values(PROGRAMS).map((p) => button(s.item, { onClick: () => { menuOpen = false; open(p); update(); } }, span(p.icon), p.name)))),
      div(s.tasks, list(() => windows, TaskButton)),
      // The tray: programs put their own icons here with into("os-tray", ...).
      div(s.tray, region({ id: "os-tray", type: "stack" }), Clock()),
    ),
    // The modal layer, over the desktop and the taskbar.
    region({ id: "os-modal", type: "stack" }),
  );
}
