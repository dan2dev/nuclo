// The editor: class sidebar | preview stage + grouped controls | live code.
//
// One plain model (`rules`) and two sync paths:
//   GUI change  → mutate the rule → serialize() → code text        (sync)
//   code typing → parse() → rules re-matched by selector → GUI    (applyCode)
// Nothing is reactive by itself: every path ends in update().
//
// Keyboard-first: two palettes (⌘J find/create a class, ⌘K add/edit a
// property), a roving-focus class list, global shortcuts (SHORTCUTS below)
// and undo/redo over code snapshots.
import { ALIASES, DEFS, GROUPS, GROUP_OF, PRESETS, control, defaultUnit, listAttr, valueOptions, view, type Bind } from "./controls.ts";
import { classesOf, fuzzyScore, getDecl, parse, serialize, setDecl, smartValue, toSelector, tokenize, type Decl, type Rule, type Token } from "./css.ts";
import { palette, type Item } from "./palette.ts";
import { cx, s } from "./theme.ts";

const STORAGE = "nuclo-css-editor";
const MAC = /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = MAC ? "⌘" : "Ctrl";

const SAMPLE = `.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
  padding: 24px;
  background-color: #ffffff;
  border-width: 1px;
  border-style: solid;
  border-color: #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

.title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #0f172a;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background-color: #6366f1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  border-width: 0;
  cursor: pointer;
  transition: background-color .15s ease, transform .1s ease;
}

.btn:hover {
  background-color: #4f46e5;
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}
`;

// ── state ────────────────────────────────────────────────────────────────────

let rules: Rule[] = [];
let selected: Rule | null = null;
let code = "";
let error: string | null = null;
let previewTag = "div";
let previewClasses = ""; // "" = follow the selected rule
let darkStage = false;
let copied = false;
let helpOpen = false;
const toasts: { text: string }[] = [];

function save() {
  try { localStorage.setItem(STORAGE, code); } catch { /* storage unavailable */ }
}

function toast(text: string) {
  const t = { text };
  toasts.push(t);
  update();
  setTimeout(() => { toasts.splice(toasts.indexOf(t), 1); update(); }, 2600);
}

// ── history: undo/redo over code snapshots ───────────────────────────────────

const hist = { stack: [] as string[], i: -1, at: 0 };

/** Remember the current code. Continuous edits (a slider drag, a typing burst) within 400ms share one entry;
 *  discrete actions (palette commits, create, delete, move) always get their own. */
function record(coalesce: boolean) {
  if (hist.stack[hist.i] === code) return;
  hist.stack.length = hist.i + 1;
  const now = Date.now();
  if (coalesce && hist.i > 0 && now - hist.at < 400) hist.stack[hist.i] = code;
  else { hist.stack.push(code); hist.i++; }
  hist.at = now;
}

function travel(d: 1 | -1) {
  const j = hist.i + d;
  if (j < 0 || j >= hist.stack.length) { toast(d < 0 ? "Nothing to undo" : "Nothing to redo"); return; }
  hist.i = j;
  hist.at = 0;
  applyCode(hist.stack[j], false);
}

/** GUI → model → code. `coalesce` for continuous edits (see record). */
function sync(coalesce = false) {
  code = serialize(rules);
  error = null;
  save();
  record(coalesce);
  update();
}

/** Code → model. Existing rule objects are kept (matched by selector) so list rows and the selection survive typing. */
function applyCode(text: string, remember = true) {
  code = text;
  save();
  const r = parse(text);
  error = r.error;
  if (!r.error) {
    const idx = selected ? rules.indexOf(selected) : 0;
    const prev = rules;
    rules = r.rules.map((p) => {
      const e = prev.find((x) => x.selector === p.selector);
      if (!e) return p;
      e.decls = p.decls;
      return e;
    });
    selected = rules.find((x) => x.selector === selected?.selector) ?? rules[Math.min(idx, rules.length - 1)] ?? null;
  }
  if (remember) record(true);
  update();
}

function bind(prop: string): Bind {
  return {
    get: () => (selected ? getDecl(selected, prop)?.value : undefined),
    set: (v) => { if (selected) { setDecl(selected, prop, v); sync(true); } },
  };
}

// ── focus helpers: ids/roles are the addressing scheme; update() is synchronous, so the DOM is current right after it ──

const focusEl = (sel: string) => document.querySelector<HTMLElement>(sel)?.focus();
const focusRow = () => focusEl('#classes [aria-selected="true"]');
const focusCode = () => focusEl("#code");
function focusSelector() {
  const el = document.querySelector<HTMLInputElement>("#selector");
  el?.focus();
  el?.select();
}

// ── rule operations ──────────────────────────────────────────────────────────

function pick(r: Rule) { selected = r; update(); }

function create(selector: string, decls: [string, string][] = []) {
  selector = selector.trim().replace(/\s+/g, " ");
  if (!selector) return;
  let r = rules.find((x) => x.selector === selector);
  if (!r) {
    r = { selector, decls: decls.map(([prop, value]) => ({ prop, value, important: false })) };
    rules.push(r);
    toast(`Created ${selector}`);
  }
  selected = r;
  sync();
}

function removeRule(r: Rule) {
  const i = rules.indexOf(r);
  rules.splice(i, 1);
  if (selected === r) selected = rules[Math.min(i, rules.length - 1)] ?? null;
  sync();
  toast(`Deleted ${r.selector} — ${MOD} Z to undo`);
}

function duplicateRule() {
  if (!selected) return;
  const m = /^([^\s:,]+)([\s\S]*)$/.exec(selected.selector);
  const [name, rest] = m ? [m[1], m[2]] : [selected.selector, ""];
  let n = 1, sel = `${name}-copy${rest}`;
  while (rules.some((r) => r.selector === sel)) sel = `${name}-copy${++n}${rest}`;
  const copy: Rule = { selector: sel, decls: selected.decls.map((d) => ({ ...d })) };
  rules.splice(rules.indexOf(selected) + 1, 0, copy);
  selected = copy;
  sync();
  focusSelector();
  toast(`Duplicated as ${sel} — type to rename`);
}

function moveRule(d: 1 | -1) {
  if (!selected) return;
  const i = rules.indexOf(selected), j = i + d;
  if (j < 0 || j >= rules.length) return;
  rules.splice(i, 1);
  rules.splice(j, 0, selected);
  sync();
  focusRow();
}

/** Select the previous/next rule and move focus to it. */
function step(d: 1 | -1) {
  if (!rules.length) return;
  const i = selected ? rules.indexOf(selected) : -1;
  selected = rules[Math.min(Math.max(i + d, 0), rules.length - 1)];
  update();
  focusRow();
}

/** Rename the selected rule; its state rules (".btn:hover") follow. */
function rename(next: string) {
  if (!selected) return;
  const old = selected.selector;
  for (const r of rules) if (r !== selected && r.selector.startsWith(`${old}:`)) r.selector = next + r.selector.slice(old.length);
  selected.selector = next;
  sync(true);
}

function copy() {
  navigator.clipboard.writeText(code).then(() => {
    copied = true;
    update();
    setTimeout(() => { copied = false; update(); }, 1200);
  }).catch(() => toast("Clipboard is not available here"));
}

function download() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([code], { type: "text/css" }));
  a.download = "styles.css";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Downloaded styles.css");
}

/** Open the group holding a property's control, scroll to it and flash it. */
function reveal(prop: string) {
  const row = document.querySelector<HTMLElement>(`[data-prop="${CSS.escape(prop)}"]`);
  if (!row) return;
  const group = row.closest("details");
  if (group) group.open = true;
  row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  const cls = s.flash.className.split(" ");
  row.classList.remove(...cls);
  void row.offsetWidth; // restart the animation
  row.classList.add(...cls);
}

/** Every CSS property the browser knows, in kebab-case. CSS.supports() drops the descriptors (`pad`, `src`, `syntax`…) Chrome lists alongside real properties. */
function cssProps() {
  const style = document.documentElement.style as unknown as Record<string, unknown>;
  const out = new Set<string>();
  for (const k in style) {
    if (typeof style[k] === "string" && /^[a-zA-Z]+$/.test(k)) out.add(k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
  }
  return [...out].filter((k) => !/^(webkit|moz|ms|css)-/.test(k) && CSS.supports(k, "inherit")).sort();
}
// Two tiers for the palette: the catalogue's everyday properties rank above the long tail of browser properties.
const COMMON = [...new Set(GROUPS.flatMap((g) => g.defs.map((d) => d.prop)))];
const REST = cssProps().filter((p) => !COMMON.includes(p));
const PROPS = [...COMMON, ...REST];

// Highlight tokens are memoised on the code string so untouched updates reuse the same spans.
let tokCode = "", toks: Token[] = [];
const tokens = () => {
  if (tokCode !== code) { tokCode = code; toks = tokenize(code); }
  return toks;
};
const TOK = { sel: s.tSel, prop: s.tProp, val: s.tVal, punct: s.tPunct, comment: s.tComment, ws: s.tVal };

// Initial state: whatever was left in the editor last time, else the sample.
{
  let stored: string | null = null;
  try { stored = localStorage.getItem(STORAGE); } catch { /* storage unavailable */ }
  code = stored ?? SAMPLE;
  const r = parse(code);
  error = r.error;
  rules = r.rules;
  selected = rules[0] ?? null;
  hist.stack = [code];
  hist.i = 0;
}

// ── property palette (⌘K): "pad ↵ 24 ↵", "bg ↵ #fff ↵", or "padding: 24px ↵" ─

let palProp: string | null = null; // null = choosing a property, otherwise choosing its value

const ranked = (q: string, xs: string[], limit = 8) =>
  xs.map((x) => [x, fuzzyScore(q, x)] as const).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([x]) => x);

const colorsInUse = () => [...new Set(rules.flatMap((r) => r.decls.filter((d) => /^(#|rgb|hsl)/i.test(d.value)).map((d) => d.value)))];

function propItems(q: string): Item[] {
  const rule = selected;
  if (!rule) return [];
  if (palProp) {
    const cur = getDecl(rule, palProp)?.value;
    const pool = [...new Set([...(cur ? [cur] : []), ...(DEFS.get(palProp)?.kind === "color" ? colorsInUse() : []), ...valueOptions(palProp)])];
    return ranked(q, pool).map((v) => ({ id: v, label: v, hint: v === cur ? "current" : undefined }));
  }
  if (!q) return rule.decls.filter((d) => d.prop).map((d) => ({ id: d.prop, label: d.prop, hint: d.value })); // edit what's there
  const alias = ALIASES[q.toLowerCase()];
  const props = [...new Set([...(alias ? [alias] : []), ...ranked(q, COMMON), ...ranked(q, REST)])].slice(0, 8);
  return props.map((p) => ({ id: p, label: p, hint: getDecl(rule, p)?.value ?? GROUP_OF.get(p) }));
}

function choose(prop: string) {
  palProp = prop;
  propPal.set("");
}

function commit(prop: string, raw: string) {
  if (!selected) return;
  setDecl(selected, prop, smartValue(prop, raw, defaultUnit(prop)));
  palProp = null;
  propPal.set("");
  sync();
  reveal(prop);
}

const propPal = palette({
  id: "palette", ariaLabel: "Add or edit a property", kbd: `${MOD}K`,
  placeholder: () => (palProp ? "value…  ↵ applies · Esc goes back" : "add property…  pad ↵ 24 ↵  ·  bg ↵ #fff ↵  ·  padding: 24px ↵"),
  items: propItems,
  key: () => `${palProp ?? ""}\0${selected?.selector ?? ""}\0${code}`,
  defaultIndex: () => (palProp ? -1 : 0),
  prefix: () => (palProp ? `${palProp}:` : ""),
  // Typing "pad:" jumps straight to the value of the best match.
  onChange: (q) => {
    if (palProp || !q.endsWith(":")) return;
    const name = q.slice(0, -1).trim();
    if (name) choose(ALIASES[name] ?? propItems(name)[0]?.id ?? name);
  },
  onPick: (item, q) => {
    if (!selected) return;
    const text = q.trim();
    if (palProp) {
      const v = item?.id ?? text;
      if (v) commit(palProp, v);
      else { palProp = null; propPal.set(""); }
      return;
    }
    const colon = text.indexOf(":");
    if (colon > 0) { // pasted "padding: 24px"
      const name = text.slice(0, colon).trim();
      commit(ALIASES[name] ?? name, text.slice(colon + 1));
      return;
    }
    const prop = item?.id ?? ALIASES[text] ?? text;
    if (prop) choose(prop);
  },
  onBack: (why) => {
    if (palProp) { palProp = null; propPal.set(""); }
    else if (why === "escape") focusRow();
  },
});

// ── class switcher (⌘J): find, or create with ↵ / ⇧↵, optionally from a preset ──

function classItems(q: string): Item[] {
  const sel = toSelector(q, selected?.selector);
  const matches = rules
    .map((r) => [r, r.selector === sel ? Infinity : fuzzyScore(q.replace(/^\./, ""), r.selector)] as const)
    .filter(([, sc]) => sc > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([r]) => ({ id: r.selector, label: r.selector, hint: `${r.decls.length} declarations`, action: () => pick(r) }));
  if (!sel || rules.some((r) => r.selector === sel)) return matches;
  const creates = [
    { id: `+${sel}`, label: `Create ${sel}`, hint: "empty", action: () => create(sel) },
    ...PRESETS.map((p) => ({ id: `+${sel}|${p.name}`, label: `Create ${sel}`, hint: `${p.name} preset`, action: () => create(sel, p.decls) })),
  ];
  // ":hover" means "a state of the current class" — creating it is the point, so it comes before look-alikes.
  return q.trim().startsWith(":") ? [...creates, ...matches] : [...matches, ...creates];
}

const classPal = palette({
  id: "switcher", ariaLabel: "Find or create a class", kbd: `${MOD}J`,
  placeholder: () => "find or create a class…",
  items: classItems,
  key: () => `${selected?.selector ?? ""}\0${code}`,
  defaultIndex: () => 0,
  onPick: (item, q, shift) => {
    const sel = toSelector(q, selected?.selector);
    if (shift && sel) create(sel);
    else if (item?.action) item.action();
    else return;
    classPal.set("");
    propPal.focus();
  },
  onBack: (why) => { if (why === "escape") focusRow(); },
});

// ── global shortcuts ─────────────────────────────────────────────────────────

const SHORTCUTS: [string[], string][] = [
  [[MOD, "K"], 'Add or edit a property: type a name (or an alias like bg, p, fs), ↵, a value, ↵. Bare numbers get a unit; "padding: 24px" applies in one go.'],
  [[MOD, "J"], 'Find a class, or create one when nothing matches — ⇧↵ always creates. ":hover" adds a state to the current class. New classes can start from a preset.'],
  [["↑", "↓"], "In the class list: switch class. ↵ jumps to properties, F2 renames, ⌫ deletes."],
  [["Alt", "↑/↓"], "Previous / next class from anywhere"],
  [["Alt", "⇧", "↑/↓"], "Move the class up or down in the cascade"],
  [[MOD, "⇧", "D"], "Duplicate the class"],
  [[MOD, "Z"], `Undo · ${MOD} ⇧ Z redo`],
  [[MOD, "E"], `Edit the CSS source · ${MOD} ↵ formats it`],
  [[MOD, "S"], "Download styles.css"],
  [["←", "→"], "In a segmented control: previous / next option"],
  [["↑", "↓"], "In any value field: nudge the number, ⇧ for ×10"],
  [["Esc"], "Back to the class list"],
  [[MOD, "/"], "Show this list"],
];

function onShortcut(e: KeyboardEvent) {
  const mod = MAC ? e.metaKey : e.ctrlKey;
  const target = e.target instanceof HTMLElement ? e.target : null;
  if (e.key === "Escape") {
    if (helpOpen) { e.preventDefault(); e.stopPropagation(); helpOpen = false; update(); }
    else if (target?.getAttribute("role") === "combobox") return; // the palette decides: clear its text, or hand focus back
    else if (target && target !== document.body) focusRow();
    return;
  }
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    e.preventDefault();
    const d = e.key === "ArrowDown" ? 1 : -1;
    if (e.shiftKey) moveRule(d);
    else step(d);
    return;
  }
  if (!mod) return;
  switch (e.key === "/" || e.key === "?" ? "Slash" : e.code) {
    case "KeyK": e.preventDefault(); propPal.focus(); break;
    case "KeyJ": e.preventDefault(); classPal.focus(); break;
    case "KeyE": e.preventDefault(); focusCode(); break;
    case "KeyS": e.preventDefault(); download(); break;
    case "Slash": e.preventDefault(); helpOpen = !helpOpen; update(); break;
    case "KeyD": if (e.shiftKey) { e.preventDefault(); duplicateRule(); } break;
    case "KeyZ": if (target?.id !== "code") { e.preventDefault(); travel(e.shiftKey ? 1 : -1); } break; // the textarea keeps its native undo
  }
}

// ── sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = () =>
  aside(
    s.side,
    div(s.brand, div(s.logo, "{}"), div(div(s.brandTitle, "CSS Class Editor"), div(s.brandSub, `keyboard first · ${MOD} / for shortcuts`))),
    div(s.newRow, classPal.el),
    div(
      s.ruleList,
      {
        id: "classes", role: "listbox", "aria-label": "Classes",
        onKeyDown: (e) => {
          if (!(e.target instanceof HTMLElement) || e.target.getAttribute("role") !== "option" || e.altKey || e.metaKey || e.ctrlKey) return;
          switch (e.key) {
            case "ArrowDown": e.preventDefault(); step(1); break;
            case "ArrowUp": e.preventDefault(); step(-1); break;
            case "Home": case "End": e.preventDefault(); selected = rules[e.key === "Home" ? 0 : rules.length - 1] ?? null; update(); focusRow(); break;
            case "Enter": e.preventDefault(); propPal.focus(); break;
            case "F2": e.preventDefault(); focusSelector(); break;
            case "Delete": case "Backspace": e.preventDefault(); if (selected) { removeRule(selected); focusRow(); } break;
          }
        },
      },
      list(() => rules, (r) =>
        div(
          () => cx(s.rule, r === selected && s.ruleOn),
          {
            role: "option", "aria-selected": () => String(r === selected), tabIndex: () => (r === selected ? 0 : -1),
            title: () => r.selector,
            onClick: () => pick(r),
          },
          span(s.ruleName, () => r.selector),
          span(s.badge, () => r.decls.length),
          button(cx(s.iconBtn, s.ruleDel), {
            type: "button", tabIndex: -1, title: "Delete rule (⌫ in the list)", "aria-label": "Delete rule",
            onClick: (e) => { e.stopPropagation(); removeRule(r); },
          }, "×"),
        ),
      ),
      when(() => rules.length === 0, div(s.empty, span("No classes yet."), span(`Press ${MOD} J, type a name and hit ↵.`))),
    ),
    div(
      s.sideFoot,
      button(s.btn, { type: "button", title: `New class (${MOD} J)`, onClick: () => classPal.focus() }, "+ New"),
      button(s.btn, { type: "button", onClick: () => applyCode(SAMPLE) }, "Sample"),
      button(s.btn, { type: "button", onClick: () => { rules = []; selected = null; sync(); } }, "Clear"),
      span(s.spacer),
      button(s.btn, { type: "button", title: `Keyboard shortcuts (${MOD} /)`, "aria-label": "Keyboard shortcuts", onClick: () => { helpOpen = !helpOpen; update(); } }, "?"),
    ),
  );

// ── preview stage ────────────────────────────────────────────────────────────

const TAGS = ["div", "button", "a", "p", "span", "input"];
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog.";
const autoClasses = () => (selected ? classesOf(selected.selector) : "");
const cls = () => previewClasses || autoClasses();
// User rules are scoped under #stage so they style the sample element and nothing else.
const previewCss = () =>
  serialize(rules.map((r) => ({ selector: r.selector.split(",").map((p) => `#stage ${p.trim()}`).join(", "), decls: r.decls })));

const Preview = () =>
  section(
    s.preview,
    div(
      s.toolbar,
      span(s.toolLabel, "Preview"),
      select(
        cx(s.field, s.select, s.toolSel),
        { "aria-label": "Preview element", onChange: (e) => { previewTag = e.currentTarget.value; update(); } },
        ...TAGS.map((t) => option({ value: t, selected: () => previewTag === t }, `<${t}>`)),
      ),
      input(cx(s.field, s.mono, s.toolInput), {
        type: "text", "aria-label": "Preview element classes",
        placeholder: () => `class="${autoClasses()}"`,
        value: () => previewClasses,
        onInput: (e) => { previewClasses = e.currentTarget.value; update(); },
      }),
      button(s.btn, { type: "button", onClick: () => { darkStage = !darkStage; update(); } }, () => (darkStage ? "Light stage" : "Dark stage")),
    ),
    div(
      { id: "stage" },
      () => cx(s.stage, darkStage ? s.stageDark : s.stageLight),
      style(() => previewCss()),
      when(() => previewTag === "button", button({ type: "button", className: cls }, "Button"))
        .when(() => previewTag === "a", a({ href: "#", className: cls, onClick: (e) => e.preventDefault() }, "Link text"))
        .when(() => previewTag === "p", p({ className: cls }, SAMPLE_TEXT))
        .when(() => previewTag === "span", span({ className: cls }, "Inline span"))
        .when(() => previewTag === "input", input({ type: "text", className: cls, placeholder: "Input field" }))
        .else(div({ className: cls }, SAMPLE_TEXT)),
    ),
  );

// ── grouped controls + raw declarations ──────────────────────────────────────

const STATES = [":hover", ":focus", ":focus-visible", ":active", ":disabled", ":first-child", ":last-child", "::placeholder", "::before", "::after"];
const groupCount = (defs: { prop: string }[]) => {
  const r = selected;
  return r ? defs.filter((d) => getDecl(r, d.prop)).length : 0;
};

const declRow = (d: Decl) =>
  div(
    s.declRow,
    input(cx(s.field, s.mono), {
      type: "text", "aria-label": "Property",
      value: () => d.prop,
      onInput: (e) => { d.prop = e.currentTarget.value.trim(); sync(true); },
    }, listAttr("css-props")),
    input(cx(s.field, s.mono), {
      type: "text", "aria-label": "Value",
      value: () => d.value,
      onInput: (e) => { d.value = e.currentTarget.value; sync(true); },
    }),
    button(
      { type: "button", title: "Toggle !important", "aria-pressed": () => String(d.important), onClick: () => { d.important = !d.important; sync(); } },
      () => cx(s.iconBtn, d.important && s.iconOn),
      "!",
    ),
    button(s.iconBtn, {
      type: "button", title: "Remove declaration", "aria-label": "Remove declaration",
      onClick: () => { if (selected) { selected.decls.splice(selected.decls.indexOf(d), 1); sync(); } },
    }, "×"),
  );

const AddDecl = () => {
  let prop = "", value = "";
  const add = () => {
    if (!selected || !prop.trim() || !value.trim()) return;
    setDecl(selected, prop.trim(), smartValue(prop.trim(), value, defaultUnit(prop.trim())));
    prop = value = "";
    sync();
  };
  return div(
    s.declRow,
    input(cx(s.field, s.mono), {
      type: "text", placeholder: "property", "aria-label": "New property",
      value: () => prop,
      onInput: (e) => { prop = e.currentTarget.value; },
      onKeyDown: (e) => { if (e.key === "Enter") add(); },
    }, listAttr("css-props")),
    input(cx(s.field, s.mono), {
      type: "text", placeholder: "value", "aria-label": "New value",
      value: () => value,
      onInput: (e) => { value = e.currentTarget.value; },
      onKeyDown: (e) => { if (e.key === "Enter") add(); },
    }),
    button(cx(s.btn, s.btnAccent), { type: "button", title: "Add declaration", onClick: add }, "+"),
  );
};

const Editor = () =>
  div(
    s.editor,
    when(
      () => selected !== null,
      div(
        s.editorHead,
        input(s.selInput, {
          id: "selector", type: "text", "aria-label": "Selector (F2)", spellcheck: false,
          value: () => selected?.selector ?? "",
          onInput: (e) => rename(e.currentTarget.value),
          onKeyDown: (e) => { if (e.key === "Enter") { e.preventDefault(); propPal.focus(); } },
        }),
        select(
          cx(s.field, s.select, s.toolSel),
          {
            "aria-label": "Add a state rule",
            onChange: (e) => {
              const st = e.currentTarget.value;
              e.currentTarget.value = "";
              if (selected && st) { create(selected.selector.split(",")[0].trim() + st); propPal.focus(); }
            },
          },
          option({ value: "" }, "+ state"),
          ...STATES.map((st) => option({ value: st }, st)),
        ),
        button(
          { type: "button", title: "Show only the properties that are set", "aria-pressed": () => String(view.onlySet), onClick: () => { view.onlySet = !view.onlySet; update(); } },
          () => cx(s.btn, view.onlySet && s.btnOn),
          "Set only",
        ),
        span(s.hint, () => `${selected?.decls.length ?? 0} declarations`),
      ),
      div(s.palBar, propPal.el),
      ...GROUPS.map((g) =>
        details(
          s.group,
          { open: g.open ?? false, hidden: () => view.onlySet && groupCount(g.defs) === 0 },
          summary(span(g.name), span(s.badge, { hidden: () => groupCount(g.defs) === 0 }, () => groupCount(g.defs))),
          div(s.groupBody, ...g.defs.map((d) => control(d, bind(d.prop)))),
        ),
      ),
      details(
        s.group,
        { open: true },
        summary(span("All declarations"), span(s.badge, () => selected?.decls.length ?? 0)),
        div(s.groupBody, list(() => selected?.decls ?? [], declRow), AddDecl()),
      ),
    ).else(
      div(
        s.emptyBig,
        h2("No class selected"),
        p(`Press ${MOD} J to find or create one, or start from a preset:`),
        div(s.presetRow, ...PRESETS.map((pr) =>
          button(s.btn, { type: "button", onClick: () => { create(`.${pr.name.replace(/\s+/g, "-")}`, pr.decls); propPal.focus(); } }, pr.name),
        )),
      ),
    ),
  );

// ── code pane ────────────────────────────────────────────────────────────────

const CodePane = () =>
  section(
    s.codePane,
    div(
      s.codeHead,
      span(s.codeTitle, "CSS"),
      span(() => cx(s.status, error ? s.statusErr : s.statusOk), () => (error ? "✕ syntax error" : "● live")),
      span(s.spacer),
      button(s.btn, { type: "button", title: `Rewrite the code from the editor model (${MOD} ↵ in the editor)`, disabled: () => error !== null, onClick: () => sync() }, "Format"),
      button(s.btn, { type: "button", onClick: copy }, () => (copied ? "Copied ✓" : "Copy")),
      button(s.btn, { type: "button", title: `Download styles.css (${MOD} S)`, onClick: download }, "Download"),
    ),
    div(
      s.codeWrap,
      pre(cx(s.codeLayer, s.codePre), { "aria-hidden": "true" }, list(tokens, (t) => span(TOK[t.kind], t.text)), "\n"),
      textarea(cx(s.codeLayer, s.codeTa), {
        id: "code", "aria-label": `CSS source (${MOD} E)`, spellcheck: false, autocapitalize: "off", autocomplete: "off", wrap: "soft",
        value: () => code,
        onInput: (e) => applyCode(e.currentTarget.value),
        onScroll: (e) => {
          const hl = e.currentTarget.previousElementSibling;
          if (hl) { hl.scrollTop = e.currentTarget.scrollTop; hl.scrollLeft = e.currentTarget.scrollLeft; }
        },
        onKeyDown: (e) => {
          if (e.key === "Enter" && (MAC ? e.metaKey : e.ctrlKey)) { e.preventDefault(); if (!error) sync(); return; }
          if (e.key !== "Tab") return;
          e.preventDefault();
          const t = e.currentTarget;
          t.setRangeText("  ", t.selectionStart, t.selectionEnd, "end");
          applyCode(t.value);
        },
      }),
    ),
    when(() => error !== null, div(s.errorBar, () => error ?? "")),
  );

// ── help, toasts, app ────────────────────────────────────────────────────────

const Help = () =>
  when(() => helpOpen,
    div(
      s.overlay,
      { onClick: () => { helpOpen = false; update(); } },
      div(
        s.dialog,
        { role: "dialog", "aria-modal": "true", "aria-label": "Keyboard shortcuts", onClick: (e) => e.stopPropagation() },
        h2(s.dialogTitle, "Keyboard shortcuts"),
        p(s.hint, "Everything works without a mouse. Esc closes this."),
        div(s.shortcuts, ...SHORTCUTS.flatMap(([keys, what]) => [span(s.keys, ...keys.map((k) => kbd(s.kbd, k))), span(what)])),
      ),
    ),
  );

export const App = () =>
  div(
    s.app,
    {
      onMount: () => {
        window.addEventListener("keydown", onShortcut, true);
        return () => window.removeEventListener("keydown", onShortcut, true);
      },
    },
    Sidebar(),
    main(s.main, Preview(), Editor()),
    CodePane(),
    datalist({ id: "css-props" }, ...PROPS.map((v) => option({ value: v }))),
    div(s.toasts, { role: "status", "aria-live": "polite" }, list(() => toasts, (t) => div(s.toast, t.text))),
    Help(),
  );
