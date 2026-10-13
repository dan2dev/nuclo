import "nuclo";
import { icon } from "./icons.ts";
import { s } from "./styles.ts";

interface Action { label: string; icon: string; run(): void; disabled?: boolean; danger?: boolean }
interface Menu { label: string; actions: Action[]; anchor: HTMLElement; x: number; y: number }
let menu: Menu | null = null;

export function dismissContextMenu(restoreFocus = false) {
  const anchor = menu?.anchor;
  menu = null;
  if (restoreFocus && anchor?.isConnected) anchor.focus();
  update("os-context-menu");
}
function show(anchor: HTMLElement, x: number, y: number, label: string, actions: Action[]) {
  menu = { anchor, x, y, label, actions };
  update("os-context-menu");
}
export function showContextMenu(event: MouseEvent & { currentTarget: HTMLElement }, label: string, actions: Action[]) {
  event.preventDefault(); event.stopPropagation();
  show(event.currentTarget, event.clientX, event.clientY, label, actions);
}
export function contextMenuKey(event: KeyboardEvent & { currentTarget: HTMLElement }, label: string, actions: Action[]) {
  if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return false;
  event.preventDefault(); event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  show(event.currentTarget, rect.left + 12, rect.top + Math.min(rect.height, 32), label, actions);
  return true;
}

export function ContextMenu() {
  return list(() => menu ? [menu] : [], (current) => div(s.contextMenu,
    { role: "menu", "aria-label": current.label, onContextMenu: (e) => e.preventDefault(), onKeyDown: (e) => {
      e.stopPropagation();
      const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      } else if (e.key === "Escape" || e.key === "Tab") {
        if (e.key === "Escape") e.preventDefault();
        dismissContextMenu(true);
      }
    }, onMount: (el) => {
      const app = el.closest<HTMLElement>(".os-app")!;
      const rect = app.getBoundingClientRect();
      // Measure the actual menu, including wrapped labels, before keeping it inside the desktop.
      el.style.left = `${Math.max(6, Math.min(current.x - rect.left, app.clientWidth - el.offsetWidth - 6))}px`;
      el.style.top = `${Math.max(6, Math.min(current.y - rect.top, app.clientHeight - el.offsetHeight - 6))}px`;
      el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    } },
    span(s.contextHeading, current.label),
    ...current.actions.map((action) => button(s.contextItem, action.danger ? s.contextDanger : null,
      { role: "menuitem", tabIndex: -1, disabled: action.disabled, onClick: () => { dismissContextMenu(true); action.run(); update(); } },
      icon(action.icon, 17), action.label,
    )),
  ));
}

export function contextMenuLifecycle() {
  return on("mount", () => {
    const outside = (event: Event) => { if (menu && !(event.target instanceof Element && event.target.closest('[role="menu"]'))) dismissContextMenu(); };
    const dismiss = () => { if (menu) dismissContextMenu(); };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
      menu = null;
    };
  });
}
