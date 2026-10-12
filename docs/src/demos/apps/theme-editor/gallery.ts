// gallery.ts: the preview. A small product UI built from the recipes in
// theme.ts, plus a little layout written with the same tokens. Nothing here
// names a color, so the whole page follows the theme.
import "nuclo";
import { kit, sp, ui } from "./theme.ts";

const g = {
  root: ui.css("te-ui-root", { minHeight: "100%", p: sp(20), bg: "background", color: "text", font: "ui", text: 14, leading: 1.5 }),
  top: ui.css("te-ui-top", { row: true, flexWrap: "wrap", items: "center", gap: sp(8), mb: sp(16), "& h2": { text: 20, weight: 700, mr: "auto" } }),
  grid: ui.css("te-ui-grid", { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", alignItems: "start", gap: sp(16) }),
  title: ui.css("te-ui-title", { text: 15, weight: 600 }),
  between: ui.css("te-ui-between", { row: true, items: "center", justify: "space-between", gap: sp(8) }),
  muted: ui.css("te-ui-muted", { color: "muted", text: 13 }),
  field: ui.css("te-ui-field", { col: true, gap: sp(6), text: 13, weight: 500 }),
  error: ui.css("te-ui-error", { color: "danger", text: 12, weight: 400 }),
  row: ui.css("te-ui-row", { row: true, items: "center", justify: "space-between", gap: sp(10), pt: sp(10), borderTop: "1px solid", borderTopColor: "border", text: 13 }),
  actions: ui.css("te-ui-actions", { row: true, justify: "flex-end", gap: sp(8) }),
  price: ui.css("te-ui-price", { text: 32, weight: 700, leading: 1.1, "& span": { text: 13, weight: 400, color: "muted" } }),
  features: ui.css("te-ui-features", { col: true, gap: sp(6), listStyle: "none", text: 13, "& span": { color: "success", weight: 700, mr: sp(6) } }),
  buttons: ui.css("te-ui-buttons", { row: true, flexWrap: "wrap", items: "center", gap: sp(8) }),
  avatar: ui.css("te-ui-avatar", { size: 32, px: 0, justify: "center", flexShrink: 0 }),
  who: ui.css("te-ui-who", { col: true, flex: 1, minW: 0, leading: 1.3, "& span": { truncate: true, color: "muted", text: 12 } }),
};

const form = { email: "ada@acme", alerts: true, digest: false };
const emailOk = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

const INTENTS = [["primary", "Deploy"], ["secondary", "Preview"], ["ghost", "Details"], ["danger", "Delete"]] as const;
const SIZES = ["sm", "md", "lg"] as const;
const FEATURES = ["Unlimited projects", "Preview deployments", "SSO and audit log", "Priority support"];
const MEMBERS = [
  { name: "Ada Lovelace", email: "ada@acme.dev", role: "Owner", tone: "primary" },
  { name: "Grace Hopper", email: "grace@acme.dev", role: "Admin", tone: "accent" },
  { name: "Dennis Ritchie", email: "dennis@acme.dev", role: "Member", tone: "neutral" },
  { name: "Radia Perlman", email: "radia@acme.dev", role: "Invited", tone: "neutral" },
] as const;

function Setting(text: string, key: "alerts" | "digest") {
  return div(
    g.row,
    span(text),
    button(() => kit.switch({ on: form[key] }), { type: "button", role: "switch", "aria-label": text, "aria-checked": () => String(form[key]) }, {
      onClick: () => { form[key] = !form[key]; update(); },
    }),
  );
}

function Settings() {
  return section(
    kit.card(),
    h3(g.title, "Profile"),
    label(g.field, "Display name", input(kit.input(), { value: "Ada Lovelace" })),
    label(
      g.field,
      "Email",
      // The boolean variant is picked again on every update(); each of its two selections compiles once.
      input(() => kit.input({ invalid: !emailOk() }), { type: "email", value: form.email, "aria-invalid": () => String(!emailOk()) }, {
        onInput: (e) => { form.email = e.currentTarget.value; update(); },
      }),
      when(() => !emailOk(), span(g.error, "Add a domain, like ada@acme.dev.")),
    ),
    Setting("Deploy alerts", "alerts"),
    Setting("Weekly digest", "digest"),
    div(g.actions, button(kit.button({ intent: "ghost" }), "Cancel"), button(kit.button({ intent: "primary" }), { disabled: () => !emailOk() }, "Save")),
  );
}

function Pricing() {
  return section(
    kit.card({ featured: true }),
    div(g.between, h3(g.title, "Team"), span(kit.badge({ tone: "accent" }), "Most popular")),
    p(g.price, "$24", span(" per seat / month")),
    ul(g.features, ...FEATURES.map((feature) => li(span("✓"), feature))),
    button(kit.button({ intent: "primary", size: "lg", block: true }), "Upgrade to Team"),
    p(g.muted, "Billed yearly. Cancel any time."),
  );
}

function Buttons() {
  return section(
    kit.card(),
    h3(g.title, "Buttons"),
    p(g.muted, "Four intents, three sizes. The large primary also gets a shadow: a compound variant."),
    ...INTENTS.map(([intent, text]) => div(g.buttons, ...SIZES.map((size) => button(kit.button({ intent, size }), text)))),
  );
}

function Members() {
  return section(
    kit.card(),
    div(g.between, h3(g.title, "Members"), button(kit.button({ size: "sm" }), "Invite")),
    ...MEMBERS.map((m) =>
      div(
        g.row,
        // cx() composes a recipe with a local override: the badge's colors, the avatar's size.
        span(ui.cx(kit.badge({ tone: m.tone }), g.avatar), m.name.split(" ").map((w) => w[0]).join("")),
        div(g.who, strong(m.name), span(m.email)),
        span(kit.badge({ tone: m.tone }), m.role),
      ),
    ),
  );
}

function Activity() {
  return section(
    kit.card(),
    h3(g.title, "Activity"),
    div(kit.alert({ tone: "success" }), strong("Deployed. "), "main is live on production."),
    div(kit.alert({ tone: "info" }), strong("Heads up. "), "Builds move to the new runners on Monday."),
    div(kit.alert({ tone: "danger" }), strong("Check failed. "), "2 type errors in app.ts."),
  );
}

export function Gallery() {
  return div(
    g.root,
    header(g.top, h2("Acme Cloud"), span(kit.badge({ tone: "success" }), "Operational"), span(kit.badge({ tone: "danger" }), "1 failing check")),
    div(g.grid, Settings(), Pricing(), Buttons(), Members(), Activity()),
  );
}
