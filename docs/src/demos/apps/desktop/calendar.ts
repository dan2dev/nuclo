// calendar.ts: a month calendar for the desktop. The grid is plain Date math
// over the window's state, and each day can carry a short note, kept in one
// small object saved to localStorage — like the wallpaper and the board.
import "nuclo";
import type { Program } from "./programs.ts";
import { winScopeId } from "./windows.ts";
import { icon } from "./icons.ts";
import { s } from "./styles.ts";

const KEY = "nuclo-desktop-calendar-v1";
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Hand-rolled (no Intl): the 42 day labels re-evaluate on every calendar update.
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const keyOf = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const labelOf = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${FULL_DAYS[date.getDay()]}, ${MONTHS[m - 1]} ${d}`;
};

let notes: Record<string, string> = {};
function loadNotes() {
  try { const saved = localStorage.getItem(KEY); if (saved) notes = JSON.parse(saved); } catch {}
}
const saveNotes = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch {} };

interface CalState { year: number; month: number; selected: string } // month: 0-11, selected: "YYYY-MM-DD"

export const calendar: Program<CalState> = {
  name: "Calendar", icon: "calendar", size: [360, 430],
  init: () => {
    loadNotes();
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), selected: keyOf(now.getFullYear(), now.getMonth(), now.getDate()) };
  },
  view: (win) => {
    const state = win.state;
    const refresh = () => update(winScopeId(win)); // the calendar updates only its window
    const now = new Date();
    const today = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
    const lead = (new Date(state.year, state.month, 1).getDay() + 6) % 7; // Monday-first
    const days = new Date(state.year, state.month + 1, 0).getDate();
    const cells: ({ day: number; key: string } | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => ({ day: i + 1, key: keyOf(state.year, state.month, i + 1) })),
    ];
    const moveMonth = (dir: number) => {
      const next = new Date(state.year, state.month + dir, 1);
      Object.assign(state, { year: next.getFullYear(), month: next.getMonth() });
      refresh();
    };
    const goToday = () => {
      Object.assign(state, { year: now.getFullYear(), month: now.getMonth(), selected: today });
      refresh();
    };
    return div(s.calendar,
      div(s.toolbar,
        button(s.btn, { "aria-label": "Previous month", onClick: () => moveMonth(-1) }, icon("back", 15)),
        strong(s.calMonth, () => `${MONTHS[state.month]} ${state.year}`),
        button(s.btn, { "aria-label": "Next month", onClick: () => moveMonth(1) }, icon("forward", 15)),
        button(s.btn, "Today", { onClick: goToday }),
      ),
      div(s.calGrid,
        ...WEEKDAYS.map((day) => span(s.calWeekday, day)),
        ...cells.map((cell) => cell ? button(s.calDay, {
          "aria-label": () => labelOf(cell.key),
          "aria-pressed": () => String(state.selected === cell.key),
          "aria-current": () => (cell.key === today ? "date" : "false"),
          class: () => cx(s.calDay, cell.key === today ? s.calToday : null).className,
          onClick: () => { state.selected = cell.key; refresh(); },
        }, String(cell.day), when(() => !!notes[cell.key], span(s.calDot))) : span(s.calGap)),
      ),
      div(s.calNote,
        div(s.calNoteHead,
          strong(() => labelOf(state.selected)),
          button(s.btn, "Clear", { disabled: () => !notes[state.selected], onClick: () => { delete notes[state.selected]; saveNotes(); refresh(); } }),
        ),
        textarea(s.calInput, { "aria-label": "Note for the selected day", placeholder: "A note for this day…", value: () => notes[state.selected] ?? "", onInput: (e) => { const value = e.currentTarget.value; if (value) notes[state.selected] = value; else delete notes[state.selected]; saveNotes(); refresh(); } }),
      ),
    );
  },
};
