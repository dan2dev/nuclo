import { field, type Field } from "./form.ts";
import { cx, s } from "./styles.ts";

const username = field("", (v) => (/^[a-z0-9_]{3,16}$/.test(v) ? undefined : "3–16 characters: a–z, 0–9, _"));
const email = field("", (v) => (/^\S+@\S+\.\S+$/.test(v) ? undefined : "Enter a valid email address"));
const password = field("", (v) =>
  v.length < 8 ? "At least 8 characters" : /\d/.test(v) ? undefined : "Include at least one number",
);
// Depends on another field: re-validates when `password` changes, not on every update().
const confirmPassword = field(
  "",
  (v) => (v === password.value ? undefined : "Passwords do not match"),
  () => [password.value],
);

let submitted = false;
let result = "";

// Errors stay hidden until the field is touched or a submit was attempted. Because
// `&&` short-circuits, an untouched field's validator isn't even called.
const visibleError = (f: Field) => (f.touched || submitted ? f.error : undefined);

const TextField = (text: string, f: Field, type = "text") =>
  div(
    s.field,
    label(
      s.label,
      text,
      input(
        {
          type,
          value: () => f.value,
          className: () => cx(s.input, visibleError(f) ? s.invalid : null).className,
          "aria-invalid": () => String(!!visibleError(f)),
          onInput: (e) => {
            f.value = e.currentTarget.value;
            update();
          },
          onBlur: () => {
            f.touched = true;
            update();
          },
        },
      ),
    ),
    small(s.error, { role: "alert" }, () => visibleError(f) ?? ""),
    small(s.runs, () => `validator ran ${f.runs}×`),
  );

const submit = (e: SubmitEvent) => {
  e.preventDefault();
  submitted = true;
  result = [username, email, password, confirmPassword].every((f) => f.error === undefined)
    ? `Welcome, ${username.value}!`
    : "";
  update();
};

export const App = () =>
  main(
    s.page,
    h1("Sign up"),
    p(
      s.hint,
      "Every update() re-runs all bindings, but a field's validator only runs again when its own value changed. ",
      "Type in one field and watch the counters: only that one moves (and “confirm” when you edit “password”).",
    ),
    form(
      { noValidate: true, onSubmit: submit },
      TextField("Username", username),
      TextField("Email", email, "email"),
      TextField("Password", password, "password"),
      TextField("Confirm password", confirmPassword, "password"),
      button(s.button, "Create account", { type: "submit" }),
      p(s.success, { role: "status" }, () => result),
    ),
  );
