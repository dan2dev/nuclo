// The examples' live previews, ported to native widgets: the four basics (docs/src/pages/examples/demos.ts) and
// the API demos the docs embed (docs/src/components/api-demos.ts). Same state, same behaviour; only the
// primitives change (no hover, no SVG, no keyboard events). demos-more.ts holds components, forms and styling.
import { MORE_PREVIEWS } from "./demos-more";
import { btn, c, field, muted, panel, row, stack, txt } from "./ui";

// ── Basics ──

function Counter() {
  let count = 0;
  const step = (label: string, onClick: () => void, filled = false) =>
    div(
      {
        style: { height: 40, minWidth: 56, paddingLeft: 16, paddingRight: 16, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: filled ? c.primary : c.secondary },
        onClick: () => { onClick(); update(); },
      },
      txt(label, { fontWeight: "bold", color: filled ? "#ffffff" : c.text }),
    );
  return div(
    { style: { alignItems: "center", gap: 6, padding: 12 } },
    txt(() => String(count), { fontSize: 48, fontWeight: "bold" }),
    muted("COUNT", { fontSize: 12, fontWeight: "bold" }),
    div({ style: { flexDirection: "row", gap: 8, marginTop: 10 } }, step("-", () => count--), step("Reset", () => (count = 0), true), step("+", () => count++)),
  );
}

function Todo() {
  let todos: { id: number; text: string; done: boolean }[] = [];
  let filter: "all" | "active" | "done" = "all";
  let nextId = 1;
  let text = "";
  const visible = () => (filter === "active" ? todos.filter((t) => !t.done) : filter === "done" ? todos.filter((t) => t.done) : todos);
  const add = () => {
    if (!text.trim()) return;
    todos.push({ id: nextId++, text: text.trim(), done: false });
    text = "";
    update();
  };
  const filterBtn = (label: string, next: typeof filter) => btn(label, () => { filter = next; update(); }, () => filter === next);
  return div(
    { style: { gap: 12 } },
    div(
      { style: { flexDirection: "row", gap: 8 } },
      input({ placeholder: "Add a task...", value: () => text, style: { ...field, flex: 1, maxWidth: 10000 }, onInput: (e) => { text = (e.target as HTMLInputElement).value; }, onChange: add }),
      btn("Add", add, () => true),
    ),
    row(filterBtn("All", "all"), filterBtn("Active", "active"), filterBtn("Done", "done")),
    div(
      { style: { gap: 6 } },
      list(visible, (todo) =>
        div(
          { style: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, backgroundColor: c.secondary } },
          input({ type: "checkbox", checked: () => todo.done, onChange: () => { todo.done = !todo.done; update(); } }),
          txt(todo.text, { flex: 1 }),
          div({ style: { padding: 4 }, onClick: () => { todos = todos.filter((x) => x.id !== todo.id); update(); } }, muted("✕")),
        ),
      ),
      when(() => visible().length === 0, muted("No tasks yet.", { padding: 10 })),
    ),
    muted(() => `${todos.filter((t) => !t.done).length} of ${todos.length} remaining`, { fontSize: 13 }),
  );
}

const USERS = [
  { name: "Alice Chen", email: "alice@example.com", initials: "AC" },
  { name: "Bob Smith", email: "bob@example.com", initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park", email: "diana@example.com", initials: "DP" },
];

function Search() {
  let query = "";
  const results = () => USERS.filter((u) => !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));
  return div(
    { style: { gap: 12 } },
    input({ placeholder: "Search users...", style: { ...field, maxWidth: 10000 }, onInput: (e) => { query = (e.target as HTMLInputElement).value; update(); } }),
    div(
      { style: { gap: 6 } },
      list(results, (user) =>
        div(
          { style: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 10, backgroundColor: c.secondary } },
          div(
            { style: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.primarySoft, alignItems: "center", justifyContent: "center" } },
            txt(user.initials, { color: c.primaryInk, fontSize: 13, fontWeight: "bold" }),
          ),
          div({ style: { gap: 2 } }, txt(user.name, { fontWeight: "bold" }), muted(user.email, { fontSize: 13 })),
        ),
      ),
      when(() => results().length === 0, muted("No users found.", { padding: 10 })),
    ),
  );
}

// css() makes the base class; cx() adds the selected one while the state says so.
const demoButton = css({ paddingLeft: 14, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 6, border: `1px solid ${c.borderLight}`, color: c.text });
const demoButtonSelected = css({ backgroundColor: c.primary, color: "#ffffff", borderColor: c.primary });

function Styling() {
  let selected = false;
  return stack(
    muted("css() creates the base class. cx() adds the selected class only when state changes."),
    div(
      { className: () => cx(demoButton, selected ? demoButtonSelected : null).className, onClick: () => { selected = !selected; update(); } },
      span(() => (selected ? "Selected" : "Select")),
    ),
  );
}

// ── API (the docs' Live demos) ──

function TagBuilders() {
  let name = "Ada";
  return stack(
    txt("Profile", { fontSize: 18, fontWeight: "bold" }),
    txt(() => `Hello, ${name}`),
    btn("Rename", () => { name = name === "Ada" ? "Grace" : "Ada"; update(); }),
  );
}

function Components() {
  const Counter = (label: string) => {
    let count = 0; // one per call
    return btn(() => `${label}: ${count}`, () => { count++; update(); });
  };
  return row(Counter("A"), Counter("B"));
}

function Attributes() {
  let busy = false;
  return row(
    btn("Save", () => {}, () => false, () => busy),
    btn(() => `busy = ${busy}`, () => { busy = !busy; update(); }),
  );
}

function Events() {
  let query = "";
  return div(
    { style: { gap: 10 } },
    input({ placeholder: "Search", value: () => query, style: field, onInput: (e) => { query = (e.target as HTMLInputElement).value; update(); } }),
    muted(() => (query ? `query = "${query}"` : "Type something.")),
    row(btn("Clear", () => { query = ""; update(); })),
  );
}

function Lifecycle() {
  let seconds = 0;
  let shown = false;
  const Timer = () =>
    span(
      {
        style: { fontSize: 14, color: c.text },
        onMount: () => {
          if (typeof setInterval !== "function") return;
          const id = setInterval(() => { seconds++; update(); }, 1000);
          return () => clearInterval(id); // runs when the span is removed
        },
      },
      () => (typeof setInterval === "function" ? `${seconds}s` : "mounted (this engine has no timers)"),
    );
  return row(btn(() => (shown ? "Unmount timer" : "Mount timer"), () => { shown = !shown; update(); }), when(() => shown, Timer()));
}

function ExplicitUpdates() {
  let count = 0;
  return stack(txt(() => `Clicked ${count} times`), row(btn("count++", () => { count++; }), btn("update()", () => update())));
}

function DynamicValues() {
  let name = "Alice";
  let host: Element | undefined;
  const Greeting = () =>
    div(
      { style: { gap: 10 } },
      input({ value: () => name, style: field, onInput: (e) => { name = (e.target as HTMLInputElement).value; update(); } }),
      div({ style: { flexDirection: "row", gap: 4 } }, muted("static: "), txt(`Hello, ${name}`)),
      div({ style: { flexDirection: "row", gap: 4 } }, muted("dynamic: "), txt(() => `Hello, ${name}`)),
    );
  return stack(
    div({ style: { width: "100%" }, onMount: (el) => { host = el as unknown as Element; } }, Greeting()),
    // Rebuilds Greeting, so the static text catches up too.
    btn("forceUpdate()", () => { if (host) forceUpdate(Greeting(), host); }),
  );
}

function Update() {
  let runs = 0;
  return stack(txt(() => `This dynamic value has run ${++runs} times.`), btn("update()", () => update()));
}

function Scope() {
  const names = ["Ada", "Grace", "Alan", "Linus"];
  const cart: string[] = [];
  let user = "Ada";
  const change = () => { cart.push("apple"); user = names[cart.length % names.length]; };
  return div(
    { style: { gap: 10 } },
    div(
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 8 } },
      div({ style: panel }, txt(() => `Hi, ${user}`)),
      div({ style: panel }, scope("cart"), txt(() => `Items: ${cart.length}`)),
    ),
    row(btn("update('cart')", () => { change(); update("cart"); }), btn("update()", () => { change(); update(); })),
  );
}

function When() {
  type Status = "loading" | "error" | "ready";
  let status: Status = "loading";
  const pick = (next: Status) => btn(next, () => { status = next; update(); }, () => status === next);
  return stack(
    row(pick("loading"), pick("error"), pick("ready")),
    when(() => status === "loading", txt("Loading…"))
      .when(() => status === "error", txt("Something went wrong"))
      .else(txt("Ready")),
  );
}

function List() {
  const pool = ["Cherry", "Date", "Elderberry", "Fig", "Grape"];
  let next = 0;
  const fruits = [{ name: "Apple", done: false }, { name: "Banana", done: false }];
  return div(
    { style: { gap: 10 } },
    row(
      btn("Add", () => { fruits.push({ name: pool[next++ % pool.length], done: false }); update(); }),
      btn("Reverse", () => { fruits.reverse(); update(); }),
      btn("Remove first", () => { fruits.shift(); update(); }),
    ),
    div(
      { style: { maxWidth: 320, borderWidth: 1, borderColor: c.border, borderRadius: 8, overflow: "hidden" } },
      list(() => fruits, (fruit) =>
        div(
          { style: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, paddingLeft: 12, paddingRight: 12, borderTopWidth: fruits.indexOf(fruit) ? 1 : 0, borderColor: c.border } },
          input({ type: "checkbox", checked: () => fruit.done, onChange: () => { fruit.done = !fruit.done; update(); } }),
          txt(() => fruit.name, { color: fruit.done ? c.muted : c.text }),
        ),
      ),
    ),
  );
}

function Region() {
  let page: "home" | "article" | null = "home";
  let dialog = false;
  const go = (next: typeof page) => () => { page = next; dialog = false; update(); };
  const tab = (label: string, next: typeof page) => btn(label, go(next), () => page === next);
  const box = { gap: 10, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: c.borderLight };

  const Layout = () =>
    div(
      { style: { gap: 10 } },
      row(tab("Home", "home"), tab("Article", "article"), tab("Close page", null)),
      div(
        { style: { flexDirection: "row", flexWrap: "wrap", gap: 10 } },
        div({ style: { ...box, flexGrow: 1, flexBasis: 200, minHeight: 150, alignItems: "flex-start" } }, region({ id: "main", type: "stack", empty: muted("Nothing open.") })),
        div({ style: { ...box, flexGrow: 0, flexBasis: 140 } }, region({ id: "side", empty: muted("No related links.") })),
      ),
    );
  const Home = () =>
    into("main", input({ placeholder: "Type here, then open the dialog", style: field }), btn("Open dialog", () => { dialog = true; update(); }));
  const Article = () =>
    into({
      main: div({ style: { gap: 6 } }, txt("Article", { fontSize: 18, fontWeight: "bold" }), txt("One into() fills both regions.")),
      side: [txt("Related", { fontWeight: "bold" }), txt("• One"), txt("• Two")],
    });
  const Dialog = () =>
    into(
      "main",
      div(
        { style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 8, backgroundColor: c.card, borderWidth: 1, borderColor: c.border } },
        txt("On top of Home."),
        btn("Close", () => { dialog = false; update(); }),
      ),
    );
  return div({ style: { width: "100%" } }, Layout(), when(() => page === "home", Home()), when(() => page === "article", Article()), when(() => dialog, Dialog()));
}

function ForceUpdate() {
  const labels = {
    en: { title: "Hello", body: "Static text, fixed on build." },
    pt: { title: "Olá", body: "Texto estático, fixado na criação." },
  };
  let lang: keyof typeof labels = "en";
  let host: Element | undefined;
  const App = () => div(txt(labels[lang].title, { fontSize: 18, fontWeight: "bold" }), muted(labels[lang].body));
  return stack(
    txt(() => `lang = '${lang}'`, { fontSize: 14 }),
    div({ onMount: (el) => { host = el as unknown as Element; } }, App()),
    row(
      btn("Switch lang, update()", () => { lang = lang === "en" ? "pt" : "en"; update(); }),
      btn("forceUpdate(App(), host)", () => { if (host) forceUpdate(App(), host); }),
    ),
  );
}

/** Every example with a native preview, by id; the others show their source only. */
export const PREVIEWS: Record<string, () => NodeModLike<"div">> = {
  counter: Counter,
  todo: Todo,
  search: Search,
  styling: Styling,
  "tag-builders": TagBuilders,
  components: Components,
  attributes: Attributes,
  events: Events,
  lifecycle: Lifecycle,
  "explicit-updates": ExplicitUpdates,
  "dynamic-functions": DynamicValues,
  "api-update": Update,
  "api-scope": Scope,
  "api-when": When,
  "api-list": List,
  "api-region": Region,
  "api-force-update": ForceUpdate,
  ...MORE_PREVIEWS,
};
