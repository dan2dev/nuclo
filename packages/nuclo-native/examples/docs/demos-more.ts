// The site's component, form and styling example previews (docs/src/pages/examples/component-demos.ts,
// form-demos.ts, styling-demos.ts), with the same state and text, drawn in nuclo-native styles.
import { btn, c, field, later, muted, para, row, txt } from "./ui";

type Text = string | (() => string);

const ok = "#22c55e";
const bad = "#ef4444";

const wrap = (...children: NodeModLike<"div">[]) => div({ style: { gap: 12, width: "100%", maxWidth: 400 } }, ...children);
const hint = (text: Text) => para(text, { fontSize: 13 });
const tag = (text: Text) => muted(text, { fontSize: 11 });

/** "label value": the site's mono stat line, the value bold in the accent ink. */
const stat = (label: string, value: () => string) =>
  div({ style: { flexDirection: "row", gap: 4 } }, muted(label, { fontSize: 12 }), txt(value, { fontSize: 12, fontWeight: "bold", color: c.primaryInk }));
const stats = (...children: NodeModLike<"div">[]) => div({ style: { flexDirection: "row", flexWrap: "wrap", gap: 14 } }, ...children);

const cardStyle = { padding: 12, paddingLeft: 14, paddingRight: 14, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, gap: 6 };
const cardHead = (title: Text, note: Text) =>
  div(
    { style: { flexDirection: "row", alignItems: "center", gap: 8 } },
    txt(title, { fontSize: 15, fontWeight: "bold" }),
    muted(note, { fontSize: 11, marginLeft: "auto" }),
  );

const iconBtn = (onClick: () => void, size = 32) =>
  div(
    { style: { width: size, height: size, borderRadius: 8, alignItems: "center", justifyContent: "center" }, onClick },
    muted("✕", { fontSize: 14 }),
  );

/** The site's primary button: filled in the dark accent, dimmed and inert while disabled. */
const primary = (label: Text, onClick: () => void, disabled: () => boolean = () => false) =>
  div(
    {
      style: () => ({ height: 36, paddingLeft: 14, paddingRight: 14, justifyContent: "center", borderRadius: 8, backgroundColor: "#d92d00", opacity: disabled() ? 0.45 : 1 }),
      onClick: () => disabled() || onClick(),
    },
    txt(label, { fontSize: 14, fontWeight: "bold", color: "#ffffff" }),
  );

/** A checkbox and its text in a row; the text toggles it too (a label's click). */
const checkRow = (checked: () => boolean, toggle: () => void, text: Text, textStyle: () => Record<string, string | number> = () => ({})) =>
  div(
    { style: { flexDirection: "row", alignItems: "center", gap: 8 } },
    input({ type: "checkbox", checked, onChange: toggle }),
    span(text, { style: () => ({ fontSize: 14, color: c.text, ...textStyle() }), onClick: toggle }),
  );

/**
 * Counts mounts. onMount runs during a render, so the readout refreshes a tick later, and only its own
 * scope: a full update() would re-run the demo's list() and, with identity broken on purpose, mount again forever.
 */
function mountCounter() {
  let mounts = 0;
  let scheduled = false;
  const id = `mounts-${Math.random().toString(36).slice(2, 8)}`;
  const bump = () => {
    mounts++;
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(() => { scheduled = false; update(id); });
  };
  return { count: () => String(mounts), mark: () => on("mount", bump), scope: () => scope(id) };
}

// ── Static and dynamic params ────────────────────────────────────────────

function PropsDemo() {
  const m = mountCounter();
  let updates = 0;
  let cart = 2;
  let user = { name: "Ada", plan: "Pro" };
  const price = () => cart * 9;

  // A static param is read once, when the component is built.
  // A dynamic param is a function: it is read again on every update().
  function Stat(label: string, value: () => string | number) {
    return div(
      { style: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 3, paddingBottom: 3, paddingLeft: 9, paddingRight: 9, borderRadius: 999, borderWidth: 1, borderColor: c.borderLight } },
      m.mark(),
      txt(label, { fontSize: 13 }),
      txt(() => String(value()), { fontSize: 13, fontWeight: "bold", color: c.primaryInk }),
    );
  }
  function Profile(u: { name: string; plan: string }) {
    return div({ style: cardStyle }, m.mark(), cardHead(u.name, "static: built with its values"), tag(`plan ${u.plan}`));
  }
  function LiveProfile(u: () => { name: string; plan: string }) {
    return div({ style: cardStyle }, m.mark(), cardHead(() => u().name, "dynamic: reads a function"), tag(() => `plan ${u().plan}`));
  }

  const commit = () => { updates++; update(); };

  return wrap(
    stats(m.scope(), stat("mounts", m.count), stat("updates", () => String(updates))),
    row(Stat("items", () => cart), Stat("price", () => `$${price()}`), Stat("user", () => user.name)),
    Profile(user),
    LiveProfile(() => user),
    row(
      btn("Add item", () => { cart++; commit(); }),
      btn("Rename user", () => { user = { ...user, name: user.name === "Ada" ? "Grace" : "Ada" }; commit(); }),
      btn("Toggle plan", () => { user = { ...user, plan: user.plan === "Pro" ? "Free" : "Pro" }; commit(); }),
    ),
    hint("The mount count never moves: update() re-runs the functions and patches text. The static card keeps the values it was built with, by design."),
  );
}

// ── Children and modifiers ───────────────────────────────────────────────

function ChildrenDemo() {
  const m = mountCounter();
  let open = true;
  let saved = 0;

  // Children are anything a tag builder accepts: builders, text, attributes,
  // modifiers. The component passes them on with a spread.
  function Card(title: Text, ...children: NodeModLike<"div">[]) {
    return div({ style: cardStyle }, m.mark(), cardHead(title, "Card"), ...children);
  }
  // A modifier receives the element and runs once: here it sets a title.
  const tooltip = (text: string) => (el: ExpandedElement<"div">) => { el.title = text; };

  return wrap(
    stats(m.scope(), stat("mounts", m.count)),
    Card(
      "Settings",
      hint("Children, text, an attribute object and a modifier, all passed through."),
      { "data-section": "settings" },
      tooltip("Hover: a modifier set this title"),
      row(btn(() => `Saved ${saved}×`, () => { saved++; update(); })),
    ),
    Card(
      () => (open ? "Details (open)" : "Details (closed)"),
      when(() => open, hint("This paragraph is inside a when(): closing removes it, opening builds it again. The card around it stays.")),
      row(btn(() => (open ? "Close" : "Open"), () => { open = !open; update(); })),
    ),
  );
}

// ── List identity ────────────────────────────────────────────────────────

interface Person { id: number; name: string }

function ListDemo() {
  const m = mountCounter();
  let people: Person[] = [
    { id: 1, name: "Ada" }, { id: 2, name: "Grace" }, { id: 3, name: "Linus" },
  ];
  let nextId = 4;
  let clone = false;

  // With the switch on, every update() hands list() fresh copies of the
  // objects. They are not the same items any more, so every row is rebuilt.
  const items = () => (clone ? people.map((p) => ({ ...p })) : people);

  function Row(p: Person) {
    return div(
      { style: { flexDirection: "row", alignItems: "center", gap: 8 } },
      m.mark(),
      tag(`#${p.id}`),
      input({ placeholder: `Type here: ${p.name}`, style: { ...field, flex: 1, minWidth: 0, maxWidth: "none", fontSize: 14 } }),
      txt(() => p.name, { fontSize: 14 }),
      iconBtn(() => { people = people.filter((x) => x.id !== p.id); update(); }),
    );
  }

  return wrap(
    stats(m.scope(), stat("rows", () => String(people.length)), stat("mounts", m.count)),
    list(items, Row),
    row(
      btn("Reverse", () => { people = [...people].reverse(); update(); }),
      btn("Sort by name", () => { people = [...people].sort((a, b) => a.name.localeCompare(b.name)); update(); }),
      btn("Insert at top", () => { people = [{ id: nextId, name: `Person ${nextId++}` }, ...people]; update(); }),
      btn("Rename first", () => { people[0].name += "!"; update(); }),
    ),
    checkRow(() => clone, () => { clone = !clone; update(); }, "Clone the objects on every update (breaks identity)", () => ({ fontSize: 13, color: c.dim })),
    hint("Type into a row, then reorder or insert: the row keeps its input and its focus, and the mount count only grows by what was inserted. Flip the switch and every change rebuilds every row."),
  );
}

// ── Nested data ──────────────────────────────────────────────────────────

interface Task { id: number; title: string; done: boolean }
interface Member { id: number; name: string; tasks: Task[] }

function TreeDemo() {
  const m = mountCounter();
  let nextId = 100;
  const team: { name: string; members: Member[] } = {
    name: "Core",
    members: [
      { id: 1, name: "Ada", tasks: [{ id: 11, title: "Write the parser", done: true }, { id: 12, title: "Review PR 42", done: false }] },
      { id: 2, name: "Grace", tasks: [{ id: 21, title: "Ship 0.4", done: false }] },
    ],
  };

  // One component per level. Each reads its own object and renders the
  // next level with list(), so a change deep down patches only its node.
  function TaskRow(member: Member, task: Task) {
    return div(
      { style: { flexDirection: "row", alignItems: "center", gap: 8 } },
      m.mark(),
      checkRow(() => task.done, () => { task.done = !task.done; update(); }, () => task.title, () => ({ color: task.done ? c.muted : c.text, opacity: task.done ? 0.5 : 1 })),
      iconBtn(() => { member.tasks = member.tasks.filter((t) => t !== task); update(); }, 28),
    );
  }
  function MemberCard(member: Member) {
    const open = () => member.tasks.filter((t) => !t.done).length;
    return div(
      { style: cardStyle },
      m.mark(),
      cardHead(() => member.name, () => `${open()} open of ${member.tasks.length}`),
      div({ style: { gap: 4, paddingLeft: 10, borderLeftWidth: 2, borderColor: c.border } }, list(() => member.tasks, (t) => TaskRow(member, t))),
      row(
        btn("Add task", () => { member.tasks.push({ id: nextId, title: `Task ${nextId++}`, done: false }); update(); }),
        btn("Rename", () => { member.name = member.name.endsWith("!") ? member.name.slice(0, -1) : `${member.name}!`; update(); }),
      ),
    );
  }

  const allOpen = () => team.members.reduce((n, mem) => n + mem.tasks.filter((t) => !t.done).length, 0);

  return wrap(
    stats(m.scope(), stat("open tasks", () => String(allOpen())), stat("mounts", m.count)),
    list(() => team.members, MemberCard),
    row(
      btn("Swap members", () => { team.members.reverse(); update(); }),
      btn("Add member", () => { team.members.push({ id: nextId, name: `Member ${nextId++}`, tasks: [] }); update(); }),
    ),
    hint("Check a task, rename a member or swap the cards: the counts at every level follow, and the mount count only grows for what was actually added."),
  );
}

// ── Forms ────────────────────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = (...children: NodeModLike<"div">[]) => div({ style: { gap: 14, width: "100%", maxWidth: 380 } }, ...children);
const inputStyle = { ...field, height: 40, maxWidth: "none" };
const borderFor = (invalid: boolean, valid = false) => (invalid ? bad : valid ? ok : c.borderLight);
const actions = (...children: NodeModLike<"div">[]) => div({ style: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 } }, ...children);
const doneBox = (text: () => string) =>
  div({ style: { paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14, borderRadius: 10, borderWidth: 1, borderColor: ok } }, txt(text, { fontSize: 14 }));
const errorText = (text: () => string) => txt(text, { fontSize: 12, color: bad, minHeight: 16 });

/** A labeled input: its border and message follow the error once touched (on its first input: native has no blur). */
function Field(opts: { label: string; type?: string; placeholder?: string; value: () => string; error: () => string | null; touched: () => boolean; onInput: (v: string) => void; hint?: Text }) {
  const show = () => opts.touched() && opts.error();
  return div(
    { style: { gap: 5 } },
    div(
      { style: { flexDirection: "row", justifyContent: "space-between" } },
      txt(opts.label, { fontSize: 13, fontWeight: "bold", color: c.dim }),
      opts.hint ? muted(opts.hint, { fontSize: 12 }) : null,
    ),
    input({
      type: opts.type ?? "text",
      placeholder: opts.placeholder ?? "",
      value: opts.value,
      style: () => ({ ...inputStyle, borderColor: borderFor(!!show(), opts.touched() && !opts.error()) }),
      onInput: (e) => opts.onInput((e.target as HTMLInputElement).value),
    }),
    errorText(() => show() || ""),
  );
}

// ── Field validation ─────────────────────────────────────────────────────

const TAKEN = ["ada", "grace", "linus"];

function ValidationForm() {
  const values = { username: "", email: "", password: "", confirm: "" };
  const touched = new Set<keyof typeof values>();
  let availability: "idle" | "checking" | "taken" | "free" = "idle";
  let submitted: string | null = null;
  let check = 0; // the debounce: only the latest check may answer

  const errors = () => ({
    username: values.username.length < 3 ? "At least 3 characters" : availability === "taken" ? "Already taken" : null,
    email: EMAIL.test(values.email) ? null : "Enter a valid email",
    password: values.password.length < 8 ? "At least 8 characters" : !/\d/.test(values.password) ? "Include a number" : null,
    confirm: values.confirm === values.password ? null : "Passwords do not match",
  });
  const valid = () => Object.values(errors()).every((e) => e === null) && availability !== "checking";

  function checkUsername() {
    const mine = ++check;
    if (values.username.length < 3) { availability = "idle"; return; }
    availability = "checking";
    later(() => {
      if (mine !== check) return;
      availability = TAKEN.includes(values.username.toLowerCase()) ? "taken" : "free";
      update();
    }, 500);
  }

  const fieldFor = (key: keyof typeof values, label: string, type: string, placeholder: string, hint?: Text) =>
    Field({
      label, type, placeholder, hint,
      value: () => values[key],
      error: () => errors()[key],
      touched: () => touched.has(key),
      onInput: (v) => { values[key] = v; touched.add(key); if (key === "username") checkUsername(); update(); },
    });

  return form(
    fieldFor("username", "Username", "text", "ada, grace and linus are taken", () => (availability === "checking" ? "checking…" : availability === "free" ? "available" : "")),
    fieldFor("email", "Email", "text", "you@example.com"),
    fieldFor("password", "Password", "password", "8+ characters, one number"),
    fieldFor("confirm", "Confirm password", "password", ""),
    actions(
      primary("Create account", () => {
        Object.keys(values).forEach((k) => touched.add(k as keyof typeof values));
        submitted = JSON.stringify({ username: values.username, email: values.email });
        update();
      }, () => !valid()),
      muted(() => (valid() ? "" : "Fix the fields above"), { fontSize: 12 }),
    ),
    when(() => submitted !== null, doneBox(() => `Submitted ${submitted ?? ""}`)),
  );
}

// ── Multi-step wizard ────────────────────────────────────────────────────

function Wizard() {
  const data = { name: "", email: "", street: "", city: "", zip: "" };
  type Key = keyof typeof data;
  const touched = new Set<Key>();
  let step = 0;
  let done = false;

  const errors = (): Record<Key, string | null> => ({
    name: data.name.trim() ? null : "Required",
    email: EMAIL.test(data.email) ? null : "Enter a valid email",
    street: data.street.trim() ? null : "Required",
    city: data.city.trim() ? null : "Required",
    zip: /^\d{5}(-\d{4})?$/.test(data.zip) ? null : "Five digits, like 12345",
  });

  const steps: { title: string; fields: Key[] }[] = [
    { title: "Account", fields: ["name", "email"] },
    { title: "Address", fields: ["street", "city", "zip"] },
    { title: "Review", fields: [] },
  ];
  const stepValid = (i: number) => steps[i].fields.every((k) => errors()[k] === null);

  function next() {
    // Touch the step's fields so every error shows, then advance only if clean.
    steps[step].fields.forEach((k) => touched.add(k));
    if (stepValid(step)) step++;
    update();
  }

  const labels: Record<Key, string> = { name: "Full name", email: "Email", street: "Street", city: "City", zip: "ZIP" };
  const fieldFor = (key: Key) =>
    Field({
      label: labels[key],
      value: () => data[key],
      error: () => errors()[key],
      touched: () => touched.has(key),
      onInput: (v) => { data[key] = v; touched.add(key); update(); },
    });

  return form(
    div(
      { style: { flexDirection: "row", gap: 6, marginBottom: 4 } },
      ...steps.map((_, i) => div({ style: () => ({ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.primary : c.light }) })),
    ),
    div(
      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
      txt(() => steps[step].title, { fontSize: 14, fontWeight: "bold" }),
      muted(() => `step ${step + 1} of ${steps.length}`, { fontSize: 12 }),
    ),
    when(() => step === 0 && !done, fieldFor("name"), fieldFor("email"))
      .when(() => step === 1 && !done, fieldFor("street"), fieldFor("city"), fieldFor("zip"))
      .when(() => step === 2 && !done,
        div(
          { style: { gap: 6 } },
          ...(Object.keys(labels) as Key[]).map((k) =>
            div(
              { style: { flexDirection: "row", alignItems: "center", gap: 12 } },
              muted(labels[k], { fontSize: 14, width: 72 }),
              txt(() => data[k], { fontSize: 14, flex: 1, minWidth: 0 }),
              span("Edit", { style: { fontSize: 12, fontWeight: "bold", color: c.primaryInk }, onClick: () => { step = k === "name" || k === "email" ? 0 : 1; update(); } }),
            ),
          ),
        ),
      )
      .else(doneBox(() => `Submitted. ${JSON.stringify(data)}`)),
    when(() => !done,
      actions(
        btn("Back", () => { step--; update(); }, undefined, () => step === 0),
        when(() => step < 2, primary("Next", next))
          .else(primary("Submit", () => { done = true; update(); })),
      ),
    ),
  );
}

// ── Dynamic rows ─────────────────────────────────────────────────────────

interface Line { id: number; item: string; qty: string; price: string }

function Invoice() {
  let nextId = 3;
  let lines: Line[] = [
    { id: 1, item: "Design", qty: "2", price: "120" },
    { id: 2, item: "", qty: "1", price: "" },
  ];
  const touched = new Set<number>();
  let submitted: string | null = null;

  const lineErrors = (l: Line) => ({
    item: l.item.trim() ? null : "Name the item",
    qty: Number.isInteger(+l.qty) && +l.qty > 0 ? null : "Whole number above 0",
    price: l.price !== "" && +l.price >= 0 ? null : "A price",
  });
  const lineValid = (l: Line) => Object.values(lineErrors(l)).every((e) => e === null);
  const valid = () => lines.length > 0 && lines.every(lineValid);
  const total = () => lines.filter(lineValid).reduce((sum, l) => sum + +l.qty * +l.price, 0);
  const firstError = (l: Line) => Object.values(lineErrors(l)).find((e) => e !== null) ?? "";

  // The grid's columns: the item takes what is left, then 64, 84 and 36.
  const widths = { item: { flex: 1, minWidth: 0 }, qty: { width: 64 }, price: { width: 84 } };
  const gridRow = (...children: NodeModLike<"div">[]) => div({ style: { flexDirection: "row", alignItems: "flex-start", gap: 6 } }, ...children);

  const cell = (l: Line, key: "item" | "qty" | "price", placeholder: string) =>
    input({
      placeholder,
      value: () => l[key],
      style: () => ({ ...inputStyle, ...widths[key], borderColor: borderFor(touched.has(l.id) && !!lineErrors(l)[key]) }),
      onInput: (e) => { l[key] = (e.target as HTMLInputElement).value; touched.add(l.id); update(); },
    });
  const head = (text: string, key?: keyof typeof widths) => muted(text, { fontSize: 12, ...(key ? widths[key] : { width: 36 }) });

  return form(
    gridRow(head("Item", "item"), head("Qty", "qty"), head("Price", "price"), head("")),
    list(() => lines, (l) =>
      div(
        { style: { gap: 5 } },
        gridRow(
          cell(l, "item", "Item"),
          cell(l, "qty", "1"),
          cell(l, "price", "0.00"),
          iconBtn(() => { lines = lines.filter((x) => x !== l); update(); }, 36),
        ),
        errorText(() => (touched.has(l.id) ? firstError(l) : "")),
      ),
    ),
    div(
      { style: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderColor: c.border } },
      txt("Total", { fontWeight: "bold" }),
      txt(() => total().toFixed(2), { fontWeight: "bold" }),
    ),
    actions(
      btn("Add line", () => { lines.push({ id: nextId++, item: "", qty: "1", price: "" }); update(); }),
      primary("Send invoice", () => { submitted = `${lines.length} lines, total ${total().toFixed(2)}`; update(); }, () => !valid()),
    ),
    when(() => submitted !== null, doneBox(() => submitted ?? "")),
  );
}

// ── Styling: css(), cx() and a createCss() theme ─────────────────────────

// The site binds these tokens to its theme variables; native takes hex, so they are the light theme's values.
const demo = createCss({
  colors: { primary: "#ff3f00", surface: c.secondary, border: c.borderLight, text: c.text, muted: c.muted },
  screens: { sm: "(min-width: 520px)" },
});

const cardClass = demo.css({ p: 16, rounded: 8, border: "1px solid", borderColor: "border", bg: "surface", color: "text", w: "100%", maxW: 260 });
const quietText = demo.css({ color: "muted", text: 13, marginTop: 6 });

function CssPreview() {
  return div(cardClass, strong("Simple card"), p(quietText, "One style object returns one reusable class."));
}

const baseButton = demo.css({ px: 14, py: 9, rounded: 6, border: "1px solid", borderColor: "border", color: "text" });
const selectedButton = demo.css({ bg: "primary", color: "white", borderColor: "primary" });

function CxPreview() {
  let selected = false;
  return div(
    demo.css({ col: true, gap: 10, items: "center" }),
    // The button is a div: its text inherits the color the cx() classes give it.
    div(
      () => demo.cx(baseButton, selected ? selectedButton : null),
      { onClick: () => { selected = !selected; update(); } },
      span(() => (selected ? "Selected" : "Select")),
    ),
    span(demo.css({ color: "muted", text: 12 }), "cx() adds the selected class."),
  );
}

const responsiveCard = demo.css({
  p: 12, rounded: 8, border: "1px solid", borderColor: "border", bg: "surface", color: "text", w: "100%", maxW: 260,
  sm: { p: 20, borderColor: "primary" },
});

function ThemePreview() {
  return div(responsiveCard, strong("Theme tokens"), p(quietText, "Resize above 520px to use the sm screen rule."));
}

export const MORE_PREVIEWS: Record<string, () => NodeModLike<"div">> = {
  "component-props": PropsDemo,
  "component-children": ChildrenDemo,
  "component-list": ListDemo,
  "component-tree": TreeDemo,
  "form-validation": ValidationForm,
  "form-wizard": Wizard,
  "form-rows": Invoice,
  css: CssPreview,
  cx: CxPreview,
  "create-css": ThemePreview,
};
