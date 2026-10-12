/**
 * Form examples: plain state, validation as functions over it, update() after
 * every change. The previews run here; the sources show the same code with
 * the site styling stripped.
 */
import { css, colors, cx } from "../../styles.ts";
import { es } from "./styles.ts";

export interface FormExample {
  id: string;
  docs: string;
  title: string;
  desc: string;
  code: string;
  preview: () => NodeModLike<"div">;
}

const fs = {
  form: css("pages-examples-form-demos-form", { display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "380px" }),
  field: css("pages-examples-form-demos-field", { display: "flex", flexDirection: "column", gap: "5px" }),
  label: css("pages-examples-form-demos-label", { fontSize: "0.8125rem", fontWeight: "500", color: colors.textDim, display: "flex", justifyContent: "space-between" }),
  input: css("pages-examples-form-demos-input", { width: "100%", height: "40px", padding: "0 12px", borderRadius: "8px", border: `1px solid ${colors.borderLight}`, backgroundColor: colors.bg, color: colors.text, fontFamily: "inherit", fontSize: "0.9375rem", outline: "none", focus: { borderColor: colors.primary }, "@media (max-width: 600px)": { fontSize: "16px" } }),
  invalid: css("pages-examples-form-demos-invalid", { borderColor: "#ef4444", focus: { borderColor: "#ef4444" } }),
  valid: css("pages-examples-form-demos-valid", { borderColor: "#22c55e" }),
  error: css("pages-examples-form-demos-error", { fontSize: "0.75rem", color: "#ef4444", minHeight: "1em" }),
  hint: css("pages-examples-form-demos-hint", { fontSize: "0.75rem", color: colors.textMuted }),
  actions: css("pages-examples-form-demos-actions", { display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }),
  done: css("pages-examples-form-demos-done", { padding: "12px 14px", borderRadius: "10px", border: "1px solid #22c55e", fontSize: "0.875rem", "& code": { fontFamily: "ui-monospace, monospace", fontSize: "0.8em" } }),
  steps: css("pages-examples-form-demos-steps", { display: "flex", gap: "6px", marginBottom: "4px" }),
  step: css("pages-examples-form-demos-step", { flex: "1", height: "4px", borderRadius: "2px", backgroundColor: colors.bgLight }),
  stepOn: css("pages-examples-form-demos-stepOn", { backgroundColor: colors.primary }),
  stepTitle: css("pages-examples-form-demos-stepTitle", { display: "flex", justifyContent: "space-between", fontSize: "0.875rem", fontWeight: "600", "& span": { fontWeight: "400", color: colors.textMuted, fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" } }),
  review: css("pages-examples-form-demos-review", { display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "6px 12px", fontSize: "0.875rem", alignItems: "baseline", "& dt": { color: colors.textMuted }, "& dd": { margin: "0", overflowWrap: "anywhere" }, "& button": { fontSize: "0.75rem", color: colors.primaryInk, fontWeight: "500" } }),
  row: css("pages-examples-form-demos-row", { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 64px 84px 36px", gap: "6px", alignItems: "start" }),
  rowHead: css("pages-examples-form-demos-rowHead", { fontSize: "0.75rem", color: colors.textMuted }),
  remove: css("pages-examples-form-demos-remove", { height: "40px", borderRadius: "8px", color: colors.textMuted, hover: { color: colors.text, backgroundColor: colors.bgSecondary } }),
  total: css("pages-examples-form-demos-total", { display: "flex", justifyContent: "space-between", fontSize: "0.9375rem", fontWeight: "600", paddingTop: "8px", borderTop: `1px solid ${colors.border}`, fontVariantNumeric: "tabular-nums" }),
  small: css("pages-examples-form-demos-small", { height: "36px", padding: "0 14px" }),
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A labeled input: its class, message and aria follow the error once touched. */
function Field(opts: { label: string; type?: string; placeholder?: string; value: () => string; error: () => string | null; touched: () => boolean; onInput: (v: string) => void; onBlur: () => void; hint?: string | (() => string) }) {
  const show = () => opts.touched() && opts.error();
  const id = `f-${opts.label.toLowerCase().replace(/\W+/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;
  return div(
    fs.field,
    label(fs.label, { for: id }, opts.label, opts.hint ? span(fs.hint, opts.hint) : null),
    input(
      fs.input,
      { id, type: opts.type ?? "text", placeholder: opts.placeholder ?? "", value: opts.value },
      { className: () => cx(fs.input, show() ? fs.invalid : opts.touched() && !opts.error() ? fs.valid : null).className },
      { "aria-invalid": () => String(!!show()) },
      { onInput: (e) => opts.onInput((e.target as HTMLInputElement).value), onBlur: opts.onBlur },
    ),
    div(fs.error, { role: "alert" }, () => show() || ""),
  );
}

// ── Field validation ─────────────────────────────────────────────────────

const TAKEN = ["ada", "grace", "linus"];

function ValidationForm() {
  const form = { username: "", email: "", password: "", confirm: "" };
  const touched = new Set<keyof typeof form>();
  let availability: "idle" | "checking" | "taken" | "free" = "idle";
  let submitted: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const errors = () => ({
    username: form.username.length < 3 ? "At least 3 characters" : availability === "taken" ? "Already taken" : null,
    email: EMAIL.test(form.email) ? null : "Enter a valid email",
    password: form.password.length < 8 ? "At least 8 characters" : !/\d/.test(form.password) ? "Include a number" : null,
    confirm: form.confirm === form.password ? null : "Passwords do not match",
  });
  const valid = () => Object.values(errors()).every((e) => e === null) && availability !== "checking";

  function checkUsername() {
    clearTimeout(timer);
    if (form.username.length < 3) { availability = "idle"; return; }
    availability = "checking";
    timer = setTimeout(() => { availability = TAKEN.includes(form.username.toLowerCase()) ? "taken" : "free"; update(); }, 500);
  }

  const field = (key: keyof typeof form, label: string, type: string, placeholder: string, hint?: string | (() => string)) =>
    Field({
      label, type, placeholder, hint,
      value: () => form[key],
      error: () => errors()[key],
      touched: () => touched.has(key),
      onInput: (v) => { form[key] = v; if (key === "username") checkUsername(); update(); },
      onBlur: () => { touched.add(key); update(); },
    });

  return div(
    fs.form,
    field("username", "Username", "text", "ada, grace and linus are taken", () => (availability === "checking" ? "checking…" : availability === "free" ? "available" : "")),
    field("email", "Email", "email", "you@example.com"),
    field("password", "Password", "password", "8+ characters, one number"),
    field("confirm", "Confirm password", "password", ""),
    div(
      fs.actions,
      button(es.button, es.buttonPrimary, "Create account", { disabled: () => !valid() }, {
        onClick: () => { submitted = JSON.stringify({ username: form.username, email: form.email }); update(); },
      }),
      span(fs.hint, () => (valid() ? "" : "Fix the fields above")),
    ),
    when(() => submitted !== null, div(fs.done, "Submitted ", code(() => submitted ?? ""))),
  );
}

const VALIDATION_CODE = `import 'nuclo'

const form = { username: '', email: '', password: '', confirm: '' }
const touched = new Set<keyof typeof form>()
let availability: 'idle' | 'checking' | 'taken' | 'free' = 'idle'

// Validation is a plain function over the state. It runs on every
// update(), so the messages are always current.
const errors = () => ({
  username:
    form.username.length < 3 ? 'At least 3 characters'
    : availability === 'taken' ? 'Already taken'
    : null,
  email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)
    ? null : 'Enter a valid email',
  password:
    form.password.length < 8 ? 'At least 8 characters'
    : !/\\d/.test(form.password) ? 'Include a number'
    : null,
  confirm: form.confirm === form.password ? null : 'Passwords do not match',
})
const valid = () =>
  Object.values(errors()).every((e) => e === null) &&
  availability !== 'checking'

// An async check: debounced, with a pending state the UI can show.
let timer: ReturnType<typeof setTimeout>
function checkUsername() {
  clearTimeout(timer)
  availability = 'checking'
  timer = setTimeout(async () => {
    availability = (await isTaken(form.username)) ? 'taken' : 'free'
    update()
  }, 500)
}

// A field shows its error only once it was touched (blurred).
function Field(key: keyof typeof form, label: string, type = 'text') {
  const show = () => touched.has(key) && errors()[key]
  return div(
    label(label),
    input({
      type,
      value: () => form[key],
      className: () => (show() ? 'invalid' : ''),
      'aria-invalid': () => String(!!show()),
      onInput: (e) => {
        form[key] = e.currentTarget.value
        if (key === 'username') checkUsername()
        update()
      },
      onBlur: () => { touched.add(key); update() },
    }),
    p({ role: 'alert' }, () => show() || ''),
  )
}

export const SignUp = () =>
  form(
    Field('username', 'Username'),
    Field('email', 'Email', 'email'),
    Field('password', 'Password', 'password'),
    Field('confirm', 'Confirm password', 'password'),
    // Disabled until every rule passes and the async check is done.
    button('Create account', { disabled: () => !valid() }),
  )`;

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
  const field = (key: Key, type = "text") =>
    Field({
      label: labels[key], type,
      value: () => data[key],
      error: () => errors()[key],
      touched: () => touched.has(key),
      onInput: (v) => { data[key] = v; update(); },
      onBlur: () => { touched.add(key); update(); },
    });

  return div(
    fs.form,
    div(fs.steps, ...steps.map((_, i) => div(fs.step, { className: () => cx(fs.step, i <= step ? fs.stepOn : null).className }))),
    div(fs.stepTitle, () => steps[step].title, span(() => `step ${step + 1} of ${steps.length}`)),
    when(() => step === 0 && !done, field("name"), field("email", "email"))
      .when(() => step === 1 && !done, field("street"), field("city"), field("zip"))
      .when(() => step === 2 && !done,
        dl(
          fs.review,
          ...(Object.keys(labels) as Key[]).flatMap((k) => [
            dt(labels[k]),
            dd(() => data[k]),
            button({ type: "button" }, "Edit", { onClick: () => { step = k === "name" || k === "email" ? 0 : 1; update(); } }),
          ]),
        ),
      )
      .else(div(fs.done, "Submitted. ", code(() => JSON.stringify(data)))),
    when(() => !done,
      div(
        fs.actions,
        button(es.button, fs.small, "Back", { disabled: () => step === 0 }, { onClick: () => { step--; update(); } }),
        when(() => step < 2, button(es.button, es.buttonPrimary, fs.small, "Next", { onClick: next }))
          .else(button(es.button, es.buttonPrimary, fs.small, "Submit", { onClick: () => { done = true; update(); } })),
      ),
    ),
  );
}

const WIZARD_CODE = `import 'nuclo'

const data = { name: '', email: '', street: '', city: '', zip: '' }
type Key = keyof typeof data
const touched = new Set<Key>()
let step = 0
let done = false

const errors = (): Record<Key, string | null> => ({
  name: data.name.trim() ? null : 'Required',
  email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)
    ? null : 'Enter a valid email',
  street: data.street.trim() ? null : 'Required',
  city: data.city.trim() ? null : 'Required',
  zip: /^\\d{5}(-\\d{4})?$/.test(data.zip) ? null : 'Five digits',
})

// Each step owns some fields. It is valid when they all are.
const steps: { title: string; fields: Key[] }[] = [
  { title: 'Account', fields: ['name', 'email'] },
  { title: 'Address', fields: ['street', 'city', 'zip'] },
  { title: 'Review', fields: [] },
]
const stepValid = (i: number) =>
  steps[i].fields.every((k) => errors()[k] === null)

function next() {
  // Touch the step's fields so every error shows, then advance if clean.
  steps[step].fields.forEach((k) => touched.add(k))
  if (stepValid(step)) step++
  update()
}

function Field(key: Key, label: string, type = 'text') {
  const show = () => touched.has(key) && errors()[key]
  return div(
    label(label),
    input({
      type,
      value: () => data[key],
      className: () => (show() ? 'invalid' : ''),
      onInput: (e) => { data[key] = e.currentTarget.value; update() },
      onBlur: () => { touched.add(key); update() },
    }),
    p(() => show() || ''),
  )
}

// A step is a when() branch, so moving on builds the next step fresh
// and keeps the data in the plain object above.
export const Wizard = () =>
  div(
    p(() => \`\${steps[step].title}, step \${step + 1} of \${steps.length}\`),
    when(() => step === 0,
      Field('name', 'Full name'),
      Field('email', 'Email', 'email'),
    )
      .when(() => step === 1,
        Field('street', 'Street'),
        Field('city', 'City'),
        Field('zip', 'ZIP'),
      )
      .when(() => step === 2 && !done,
        dl(...(Object.keys(data) as Key[]).flatMap((k) => [
          dt(k),
          dd(() => data[k]),
          button('Edit', {
            onClick: () => {
              step = steps.findIndex((s) => s.fields.includes(k))
              update()
            },
          }),
        ])),
      )
      .else(p('Submitted.')),
    button('Back', {
      disabled: () => step === 0,
      onClick: () => { step--; update() },
    }),
    when(() => step < 2, button('Next', { onClick: next }))
      .else(button('Submit', { onClick: () => { done = true; update() } })),
  )`;

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

  const cell = (l: Line, key: "item" | "qty" | "price", placeholder: string, type = "text") =>
    input(
      fs.input,
      { type, placeholder, value: () => l[key], "aria-label": `${key} of line ${l.id}` },
      { className: () => cx(fs.input, touched.has(l.id) && lineErrors(l)[key] ? fs.invalid : null).className },
      { onInput: (e) => { l[key] = (e.target as HTMLInputElement).value; update(); }, onBlur: () => { touched.add(l.id); update(); } },
    );

  return div(
    fs.form,
    div(fs.row, span(fs.rowHead, "Item"), span(fs.rowHead, "Qty"), span(fs.rowHead, "Price"), span()),
    list(() => lines, (l) =>
      div(
        div(
          fs.row,
          cell(l, "item", "Item"),
          cell(l, "qty", "1", "number"),
          cell(l, "price", "0.00", "number"),
          button(fs.remove, { type: "button", "aria-label": "Remove line", title: "Remove" }, "✕", { onClick: () => { lines = lines.filter((x) => x !== l); update(); } }),
        ),
        div(fs.error, () => (touched.has(l.id) ? firstError(l) : "")),
      ),
    ),
    div(fs.total, span("Total"), span(() => total().toFixed(2))),
    div(
      fs.actions,
      button(es.button, fs.small, "Add line", { onClick: () => { lines.push({ id: nextId++, item: "", qty: "1", price: "" }); update(); } }),
      button(es.button, es.buttonPrimary, fs.small, "Send invoice", { disabled: () => !valid() }, {
        onClick: () => { submitted = `${lines.length} lines, total ${total().toFixed(2)}`; update(); },
      }),
    ),
    when(() => submitted !== null, div(fs.done, () => submitted ?? "")),
  );
}

const INVOICE_CODE = `import 'nuclo'

interface Line { id: number; item: string; qty: string; price: string }

let nextId = 2
let lines: Line[] = [{ id: 1, item: '', qty: '1', price: '' }]
const touched = new Set<number>()   // line ids that were blurred

// Validation per row, and for the whole form.
const lineErrors = (l: Line) => ({
  item: l.item.trim() ? null : 'Name the item',
  qty: Number.isInteger(+l.qty) && +l.qty > 0 ? null : 'Whole number > 0',
  price: l.price !== '' && +l.price >= 0 ? null : 'A price',
})
const lineValid = (l: Line) =>
  Object.values(lineErrors(l)).every((e) => e === null)
const valid = () => lines.length > 0 && lines.every(lineValid)
const total = () =>
  lines.filter(lineValid).reduce((sum, l) => sum + +l.qty * +l.price, 0)

// One input per cell. The row object is the state, so an input writes
// straight into it and update() refreshes the errors and the total.
const cell = (l: Line, key: 'item' | 'qty' | 'price') =>
  input({
    value: () => l[key],
    className: () =>
      touched.has(l.id) && lineErrors(l)[key] ? 'invalid' : '',
    onInput: (e) => { l[key] = e.currentTarget.value; update() },
    onBlur: () => { touched.add(l.id); update() },
  })

// list() keeps a row's inputs while the row is in the array: adding or
// removing other rows does not touch them, and their focus survives.
export const Invoice = () =>
  form(
    list(() => lines, (l) =>
      div(
        cell(l, 'item'), cell(l, 'qty'), cell(l, 'price'),
        button('✕', {
          onClick: () => { lines = lines.filter((x) => x !== l); update() },
        }),
        p(() => Object.values(lineErrors(l)).find((e) => e) ?? ''),
      ),
    ),
    p(() => \`Total \${total().toFixed(2)}\`),
    button('Add line', {
      onClick: () => {
        lines.push({ id: nextId++, item: '', qty: '1', price: '' })
        update()
      },
    }),
    button('Send invoice', { disabled: () => !valid() }),
  )`;

export const FORM_EXAMPLES: FormExample[] = [
  { id: "form-validation", docs: "events", title: "Field Validation", desc: "Rules as a function over plain state, errors shown once a field was touched, a debounced async check with a pending state, and a submit that waits for all of it.", code: VALIDATION_CODE, preview: ValidationForm },
  { id: "form-wizard", docs: "api-when", title: "Multi-step Wizard", desc: "Three steps as when() branches over one data object. Next touches the step's fields and advances only when they pass. Review lists everything with Edit links.", code: WIZARD_CODE, preview: Wizard },
  { id: "form-rows", docs: "api-list", title: "Dynamic Rows", desc: "Invoice lines in an array rendered with list(). Each row validates itself, the total counts the valid ones, and rows keep their inputs when others are added or removed.", code: INVOICE_CODE, preview: Invoice },
];
