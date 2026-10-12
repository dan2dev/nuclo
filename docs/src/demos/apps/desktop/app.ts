// app.ts: the desktop. The windows are a list() over one array of plain
// objects, placed by a dynamic style. Raising a window only changes its
// z-index, so its element never moves and whatever is typed in it stays.
// The layout leaves two regions: the tray in the taskbar and a modal layer
// over everything. A window fills them with into() from inside itself, and
// what it puts there lives as long as the window does: close a running Timer
// and its tray icon goes with it. Close an unsaved note and the dialog that
// asks first is written in the window but drawn above the whole desktop.
import "nuclo";
import { appearance, files, notes, openFile, PROGRAMS, settings, terminal, type Program } from "./programs.ts";
import { active, close, focus, minimize, move, open, requestClose, resize, setDesk, toggleMaximize, windows, type Win } from "./windows.ts";
import { icon } from "./icons.ts";
import { getEntry, loadDisk } from "./filesystem.ts";
import { ContextMenu, contextMenuKey, contextMenuLifecycle, dismissContextMenu, showContextMenu } from "./context-menu.ts";
import { s } from "./styles.ts";

let menuOpen = false;
let search = "";
let clock = "--:--";
let date = "";
let booted = false;
let diskLoaded = false;
open(files);

type Press = PointerEvent & { currentTarget: HTMLElement };

// A drag handle. Pointer capture keeps the moves coming to the handle even
// outside the window, for a mouse, a pen or a finger (touch-action: none).
function drag(win: Win, from: () => [number, number], to: (a: number, b: number) => void) {
  let dx = 0;
  let dy = 0;
  return {
    onPointerDown: (e: Press) => {
      if (win.maximized || e.button !== 0) return;
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
      { onKeyDown: (e) => {
        if (e.key === "Escape") { e.stopPropagation(); win.confirming = false; update(); }
        if (e.key === "Tab") {
          const controls = e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
          if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls[1].focus(); }
          else if (!e.shiftKey && document.activeElement === controls[1]) { e.preventDefault(); controls[0].focus(); }
        }
      } },
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

function windowActions(win: Win) {
  return [
    { label: "Bring to front", icon: win.program.icon, run: () => focus(win) },
    { label: "Minimize", icon: "minimize", disabled: win.minimized, run: () => minimize(win) },
    { label: win.maximized ? "Restore size" : "Maximize", icon: win.maximized ? "restore" : "maximize", run: () => { focus(win); toggleMaximize(win); } },
    { label: "Close window", icon: "close", danger: true, run: () => requestClose(win) },
  ];
}
function desktopActions() {
  return [
    { label: "Open Files", icon: "files", run: () => { open(files); } },
    { label: "New note", icon: "notes", run: () => { open(notes); } },
    { label: "Open Terminal", icon: "terminal", run: () => { open(terminal); } },
    { label: "Change wallpaper", icon: "settings", run: () => { open(settings); } },
    { label: "Show desktop", icon: "minimize", disabled: !windows.some((win) => !win.minimized), run: () => { for (const win of windows) minimize(win); } },
  ];
}

function WindowView(win: Win) {
  return section(
    s.win,
    {
      "data-os-window": String(win.id),
      "aria-label": () => win.title,
      class: () => cx(s.win, win === active() ? s.active : null, win.minimized ? s.minimized : null, win.maximized ? s.maximized : null).className,
      style: () => {
        const [left, top, width, height] = win.maximized ? ["0", "0", "100%", "100%"] : [win.x, win.y, win.w, win.h].map((n) => `${n}px`);
        return { left, top, width, height, zIndex: String(win.z) };
      },
      onPointerDown: () => { focus(win); update(); },
    },
    header(
      s.bar,
      { tabIndex: 0, "aria-haspopup": "menu", "aria-label": () => `${win.title} window controls`, onContextMenu: (e) => { focus(win); showContextMenu(e, win.title, windowActions(win)); }, onKeyDown: (e) => { contextMenuKey(e, win.title, windowActions(win)); } },
      div(s.title, { onDblClick: () => { toggleMaximize(win); update(); } }, drag(win, () => [win.x, win.y], (x, y) => move(win, x, y)), icon(win.program.icon, 17), span(() => win.title), span(s.dirty, () => win.program.unsaved?.(win) ? "•" : "")),
      button(s.ctl, { title: "Minimize", "aria-label": "Minimize", onClick: () => { minimize(win); update(); } }, icon("minimize", 15)),
      button(s.ctl, { title: () => (win.maximized ? "Restore" : "Maximize"), "aria-label": "Maximize", "aria-pressed": () => String(win.maximized), onClick: () => { toggleMaximize(win); update(); } }, icon("maximize", 14)),
      button(s.ctl, s.close, { title: "Close", "aria-label": "Close", onClick: () => { requestClose(win); update(); } }, icon("close", 15)),
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
      "aria-haspopup": "menu",
      onContextMenu: (e) => showContextMenu(e, win.title, windowActions(win)),
      onKeyDown: (e) => { contextMenuKey(e, win.title, windowActions(win)); },
      title: () => win.title,
      "aria-pressed": () => String(win === active()),
      onClick: () => { if (win === active()) minimize(win); else focus(win); update(); },
    },
    icon(win.program.icon, 18),
    span(s.label, () => win.title),
  );
}

function Icon(program: Program) {
  return button(
    s.icon,
    {
      "aria-haspopup": "menu",
      onContextMenu: (e) => showContextMenu(e, program.name, [{ label: `Open ${program.name}`, icon: program.icon, run: () => { open(program); } }]),
      onKeyDown: (e) => { contextMenuKey(e, program.name, [{ label: `Open ${program.name}`, icon: program.icon, run: () => { open(program); } }]); },
      title: `Open ${program.name}`,
      onClick: () => { open(program); update(); },
    },
    span(s.glyph, { "data-app": program.icon }, icon(program.icon, 25)),
    program.name,
  );
}

function Clock() {
  return time(
    s.clock,
    on("mount", () => {
      const tick = () => { const now = new Date(); clock = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); date = now.toLocaleDateString([], { month: "short", day: "numeric" }); update(); };
      tick();
      const id = setInterval(tick, 30000);
      return () => clearInterval(id);
    }),
    span(() => clock), span(s.clockDate, () => date),
  );
}

export function Desktop() {
  return div(
    s.app,
    contextMenuLifecycle(),
    {
      tabIndex: -1,
      "data-wallpaper": () => appearance.wallpaper,
      onContextMenu: (e) => {
        if (e.defaultPrevented) return;
        if ((e.target as Element).closest(".os-backdrop")) { e.preventDefault(); return; }
        const id = (e.target as Element).closest("[data-os-window]")?.getAttribute("data-os-window");
        const win = windows.find((win) => String(win.id) === id);
        menuOpen = false;
        showContextMenu(e, win?.title ?? "Desktop", win ? windowActions(win) : desktopActions());
      },
      onKeyDown: (e) => {
        if (e.key === "Escape" && menuOpen) { e.stopPropagation(); menuOpen = false; update(); }
        if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
        if ((e.target as Element).closest(".os-backdrop")) { e.preventDefault(); return; }
        const id = (e.target as Element).closest("[data-os-window]")?.getAttribute("data-os-window");
        const win = windows.find((win) => String(win.id) === id);
        contextMenuKey(e, win?.title ?? "Desktop", win ? windowActions(win) : desktopActions());
      },
    },
    on("mount", () => {
      if (!diskLoaded) { loadDisk(); diskLoaded = true; }
      try { const saved = localStorage.getItem("nuclo-desktop-wallpaper"); if (saved && ["grove", "dusk", "slate"].includes(saved)) appearance.wallpaper = saved; } catch {}
      update();
    }),
    div(
      s.desk,
      on("mount", (el) => {
        const sizes = new ResizeObserver(() => {
          if (!el.clientWidth) return; // hidden while a source tab is showing: keep the windows as they are
          setDesk(el.clientWidth, el.clientHeight);
          if (!booted) {
            const welcome = getEntry("welcome");
            if (welcome) {
              openFile(welcome);
              const win = windows.at(-1)!;
              move(win, el.clientWidth - win.w - 24, 36);
            }
            booted = true;
          }
          update();
        });
        sizes.observe(el);
        return () => sizes.disconnect();
      }),
      { tabIndex: 0, "aria-haspopup": "menu", "aria-label": "Desktop workspace", onContextMenu: (e) => {
        if ((e.target as Element).closest("[data-os-window], .os-icon")) return;
        menuOpen = false; showContextMenu(e, "Desktop", desktopActions());
      }, onKeyDown: (e) => { if (e.target === e.currentTarget) contextMenuKey(e, "Desktop", desktopActions()); }, onPointerDown: () => { if (menuOpen) { menuOpen = false; update(); } } },
      div(s.wallpaper, { "aria-hidden": "true" }, div(s.orbit), div(s.orbit, s.orbitTwo)),
      div(s.desktopHeading, strong("A little room to work."), span("Your files. Your ideas. Your pace.")),
      div(s.icons, ...Object.values(PROGRAMS).slice(0, 5).map(Icon)),
      list(() => windows, WindowView),
    ),
    footer(
      s.taskbar,
      button(s.start, { "aria-expanded": () => String(menuOpen), onClick: () => { dismissContextMenu(); menuOpen = !menuOpen; update(); } }, icon("grid", 18), span("Apps")),
      when(() => menuOpen, nav(s.menu, { "aria-label": "Applications" },
        div(s.launcherHeading, strong("Your workspace"), span("Find something to open")),
        input(s.input, { type: "search", "aria-label": "Search apps", placeholder: "Search apps…", value: () => search, onMount: (el) => el.focus(), onInput: (e) => { search = e.currentTarget.value; update(); }, onKeyDown: (e) => { if (e.key === "Enter") { const program = Object.values(PROGRAMS).find((p) => p.name.toLowerCase().includes(search.toLowerCase())); if (program) { open(program); menuOpen = false; update(); } } } }),
        list(() => Object.values(PROGRAMS).filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), (p) => button(s.item, { onClick: () => { menuOpen = false; open(p); update(); } }, icon(p.icon), p.name)),
        when(() => !Object.values(PROGRAMS).some((p) => p.name.toLowerCase().includes(search.toLowerCase())), p(s.empty, "No matching apps")),
      )),
      div(s.tasks, list(() => windows, TaskButton)),
      button(s.showDesktop, { title: "Show desktop", "aria-label": "Show desktop", onClick: () => { for (const win of windows) minimize(win); update(); } }, icon("minimize", 18)),
      // The tray: programs put their own icons here with into("os-tray", ...).
      div(s.tray, region({ id: "os-tray", type: "stack" }), Clock()),
    ),
    // The modal layer, over the desktop and the taskbar.
    ContextMenu(),
    region({ id: "os-modal", type: "stack" }),
  );
}
