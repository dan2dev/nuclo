# nuclo css-editor — a keyboard-first, real-time CSS class editor

Design CSS classes visually and watch the stylesheet appear live, or type the
CSS and watch the controls follow. Built to be driven entirely from the
keyboard: two command palettes, a roving-focus class list and global
shortcuts. Everything is one plain mutable model plus `update()`.

```bash
bun install      # from the repo root (npm/pnpm also work — it's a workspace)
bun run dev      # in this folder, then open the printed URL
bun run check    # parser / matcher self-check
```

## Using it

| Keys | What happens |
|------|--------------|
| `⌘K` | Add or edit a property: `pad ↵ 24 ↵`. Names fuzzy-match every CSS property and Emmet-style aliases (`bg`, `p`, `fs`, `br`…). Bare numbers get a unit; `padding: 24px ↵` applies in one step. The matching control opens and flashes. |
| `⌘J` | Find a class, or create one when nothing matches (`⇧↵` always creates). `:hover` creates a state of the current class. New classes can start from a preset (button, card, badge, input…). |
| `↑ ↓` `↵` `F2` `⌫` | In the class list: switch, jump to properties, rename, delete. |
| `Alt ↑/↓` · `Alt ⇧ ↑/↓` | Previous / next class · move it in the cascade. |
| `⌘⇧D` · `⌘Z` · `⌘S` · `⌘E` | Duplicate · undo (redo with `⌘⇧Z`) · download `styles.css` · edit the source. |
| `Esc` · `⌘/` | Back to the class list · the full shortcut list. |

(`Ctrl` instead of `⌘` outside macOS.)

## What it shows

| File | Role |
|------|------|
| `src/css.ts` | DOM-free model: a tolerant parser for class rules, the serializer, a lossless tokenizer for highlighting, fuzzy matching and value helpers. |
| `src/css.check.ts` | The runnable check for the parser and helpers. |
| `src/palette.ts` | A reusable combobox: input + suggestion list, arrow/enter/tab/escape handling, memoised items. Used for both palettes. |
| `src/controls.ts` | GUI controls bound to one property each through a `{ get, set }` pair, the property catalogue (`GROUPS`), aliases and presets. |
| `src/theme.ts` | A `createCss()` theme and the editor's own chrome styles. |
| `src/app.ts` | Sidebar, preview stage, grouped controls, code pane, shortcuts, undo history and the two sync paths. |

**Two-way sync.** A control calls `setDecl()` on the selected rule and
re-serializes the code. Typing in the code pane re-parses on every keystroke;
parsed rules are matched to existing rule objects by selector, so `list()` rows
and the current selection survive. Syntax errors are shown inline (with a line
number) and the last good model stays on screen.

**Undo.** Every change records a code snapshot (bursts within 400ms share one
entry, so a slider drag is a single undo step). `⌘Z` replays snapshots through
the same `applyCode()` path the code pane uses.

**Any class, any property.** The grouped controls cover layout, size, spacing,
typography, background, border and effects; "Set only" hides everything that
isn't set. The "All declarations" table edits every declaration of a rule as
plain text with autocomplete over every CSS property the browser knows.
Selectors are free-form (`.btn`, `.btn:hover`, `.card .title`, `.a, .b`);
renaming a class renames its state rules with it.

**Scope.** Class rules only: at-rules (`@media`, `@keyframes`) and nested rules
are reported as errors rather than silently dropped. Preview rules are scoped
under `#stage` so user CSS never styles the editor itself.
