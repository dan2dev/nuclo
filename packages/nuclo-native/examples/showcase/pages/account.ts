import { action, body, card, chip, color, heading, muted, row } from "../../ui";

const plans = ["Free", "Pro", "Team"];

const form = { name: "", email: "", password: "", plan: "Pro", news: true, terms: false };
let tried = false;
let done = false;

const errors = {
  name: () => (form.name.trim().length < 2 ? "Enter your name." : ""),
  email: () => (/^\S+@\S+\.\S+$/.test(form.email) ? "" : "Enter a valid email address."),
  password: () => (form.password.length < 8 ? "Use at least 8 characters." : ""),
};
const valid = () => !errors.name() && !errors.email() && !errors.password();

type TextField = keyof typeof errors;

const field = (key: TextField, label: string, placeholder: string, type = "text") =>
  div(
    { style: { gap: 6 } },
    muted(label),
    input({
      type,
      "aria-label": label,
      placeholder,
      value: () => form[key],
      style: { backgroundColor: color.field, color: color.text, borderRadius: 10, padding: 10, fontSize: 15 },
      onInput: (e) => {
        form[key] = (e.target as HTMLInputElement).value;
        update();
      },
    }),
    when(() => tried && !!errors[key](), span(() => errors[key](), { style: { color: color.bad, fontSize: 12 } })),
  );

const toggle = (key: "news" | "terms", label: string) =>
  div(
    { style: row },
    input({
      type: "checkbox",
      "aria-label": label,
      checked: () => form[key],
      onChange: (e) => {
        form[key] = (e.target as HTMLInputElement).checked;
        update();
      },
    }),
    body(label),
  );

const summary = (label: string, value: () => string) =>
  div({ style: row }, span(label, { style: { color: color.muted, fontSize: 13, width: 80 } }), body(value));

export const Account = () =>
  div(
    { style: { gap: 14, padding: 16 } },
    when(
      () => done,
      card(
        heading("Welcome aboard 🎉", 20),
        summary("Name", () => form.name),
        summary("Email", () => form.email),
        summary("Plan", () => form.plan),
        summary("Newsletter", () => (form.news ? "Subscribed" : "No")),
        action("Edit details", () => {
          done = false;
          update();
        }),
      ),
    ).else(
      card(
        heading("Create your account"),
        field("name", "Name", "Ada Lovelace"),
        field("email", "Email", "ada@example.com"),
        field("password", "Password", "At least 8 characters", "password"),
        div(
          { style: { gap: 6 } },
          muted("Plan"),
          div(
            { style: { flexDirection: "row", gap: 8 } },
            ...plans.map((plan) =>
              chip(plan, () => form.plan === plan, () => {
                form.plan = plan;
                update();
              }),
            ),
          ),
        ),
        toggle("news", "Send me product news"),
        toggle("terms", "I accept the terms"),
        action(
          "Create account",
          () => {
            tried = true;
            done = valid();
            update();
          },
          () => form.terms,
        ),
      ),
    ),
  );
