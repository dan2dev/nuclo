// A keyboard-first combobox: an input with a suggestion list under it. Used
// twice — to find/create classes and to add/edit properties. It owns only its
// own text and highlight; what the items are and what picking one does is the
// caller's business.
import "nuclo";
import { cx, s } from "./theme.ts";

export type Item = { id: string; label: string; hint?: string; action?: () => void };

export type PaletteOptions = {
  id: string;
  ariaLabel: string;
  placeholder: () => string;
  /** Suggestions for the current text. Recomputed when the text or `key()` changes. */
  items: (query: string) => Item[];
  /** Highlighted row after typing: 0 = best match, -1 = the typed text wins. */
  defaultIndex?: () => number;
  /** Extra memo key — change it when the items for the same text change (mode switch, model edits). */
  key?: () => string;
  /** Chip shown before the text, e.g. "padding:". */
  prefix?: () => string;
  /** Shortcut badge shown inside the field, e.g. "⌘K". */
  kbd?: string;
  /** Enter, Tab (with text) or click. `item` is null when nothing is highlighted — use `query`. */
  onPick: (item: Item | null, query: string, shift: boolean) => void;
  /** Escape or Backspace on an empty field. */
  onBack: (why: "escape" | "backspace") => void;
  onChange?: (query: string) => void;
};

export function palette(o: PaletteOptions) {
  let q = "", hi = o.defaultIndex?.() ?? 0, open = false;
  let memoKey = "\0", memo: Item[] = [];
  const items = () => {
    const k = `${q}\0${o.key?.() ?? ""}`;
    if (k !== memoKey) { memoKey = k; memo = o.items(q); }
    return memo;
  };
  const current = () => items()[hi] ?? null;
  const reset = (text: string) => { q = text; hi = o.defaultIndex?.() ?? 0; };

  const field = input(cx(s.field, s.mono, s.palInput, o.kbd && s.palInputKbd), {
    id: o.id, type: "text", autocomplete: "off", spellcheck: false, role: "combobox",
    "aria-label": o.ariaLabel, "aria-autocomplete": "list", "aria-controls": `${o.id}-list`,
    "aria-expanded": () => String(open && items().length > 0),
    "aria-activedescendant": () => (open && current() ? `${o.id}-${hi}` : ""),
    placeholder: () => o.placeholder(),
    value: () => q,
    onFocus: () => { open = true; update(); },
    onBlur: () => { open = false; update(); },
    onInput: (e) => { reset(e.currentTarget.value); open = true; o.onChange?.(q); update(); },
    onKeyDown: (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const n = items().length;
        if (!n) return;
        const d = e.key === "ArrowDown" ? 1 : -1;
        hi = ((hi + 1 + d) % (n + 1) + (n + 1)) % (n + 1) - 1; // cycles through -1 (typed text) and every row
        open = true;
        update();
        document.querySelector(`#${o.id}-list [aria-selected="true"]`)?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        o.onPick(current(), q, e.shiftKey);
      } else if (e.key === "Tab" && q && current()) {
        e.preventDefault();
        o.onPick(current(), q, false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (q) { reset(""); o.onChange?.(""); update(); }
        else o.onBack("escape");
      } else if (e.key === "Backspace" && !q) {
        o.onBack("backspace");
      }
    },
  });

  const el = div(
    s.pal,
    when(() => !!o.prefix?.(), span(s.palChip, () => o.prefix?.() ?? "")),
    field,
    ...(o.kbd ? [kbd(cx(s.kbd, s.kbdHint), o.kbd)] : []),
    div(
      s.palList,
      { id: `${o.id}-list`, role: "listbox", hidden: () => !(open && items().length > 0) },
      list(items, (it, i) =>
        div(
          {
            id: `${o.id}-${i}`, role: "option", "aria-selected": () => String(current() === it),
            onMouseDown: (e) => e.preventDefault(), // keep focus in the field
            onClick: () => o.onPick(it, q, false),
          },
          () => cx(s.palItem, current() === it && s.palItemOn),
          span(s.palLabel, it.label),
          ...(it.hint ? [span(s.palHint, it.hint)] : []),
        ),
      ),
    ),
  );

  return {
    el,
    focus: () => document.getElementById(o.id)?.focus(),
    /** Replace the text and reset the highlight. The field is written directly too: nuclo diffs against
     *  the value it last set, so a reset to "" right after the user typed would otherwise be skipped. */
    set: (text: string) => {
      reset(text);
      const el = document.getElementById(o.id);
      if (el instanceof HTMLInputElement) el.value = text;
      update();
    },
  };
}
