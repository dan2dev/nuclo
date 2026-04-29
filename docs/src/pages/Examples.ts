import { cn, colors, s } from "../styles.ts";
import { EXAMPLES } from "../content/examples.ts";

function ExampleCard(ex: typeof EXAMPLES[number]) {
  let activeTab: "preview" | "code" = "preview";

  function Tab(label: string, tab: "preview" | "code") {
    return button(
      {
        class: () => `etab${activeTab === tab ? " on" : ""}`,
      },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    { class: "ecard" },
    div(
      { class: "ecard-top" },
      div({ class: "ecard-badge" }, "● Live"),
      div({ class: "ecard-title" }, ex.title),
      div({ class: "ecard-desc" }, ex.desc),
    ),
    div(
      { class: "etabs" },
      Tab("Preview", "preview"),
      Tab("Code", "code"),
    ),
    // Preview pane
    div(
      { class: () => `epane${activeTab === "preview" ? " on" : ""}` },
      div(
        { class: "epreview" },
        buildPreview(ex.id),
      ),
    ),
    // Code pane
    div(
      { class: () => `epane${activeTab === "code" ? " on" : ""}` },
      div(
        { class: "ecode" },
        { innerHTML: `<pre style="margin:0;white-space:pre-wrap">${ex.code}</pre>` },
      ),
    ),
  );
}

function buildPreview(id: string) {
  switch (id) {
    case "counter": return CounterDemo();
    case "todo":    return TodoDemo();
    case "search":  return SearchDemo();
    case "async":   return AsyncDemo();
    default:        return div();
  }
}

// ── Counter demo ──────────────────────────────────────────────────────────────
function CounterDemo() {
  let count = 0;
  return div(
    { class: "ex-counter" },
    div({ class: "ex-count-val" }, () => String(count)),
    div({ class: "ex-count-label" }, "COUNT"),
    div(
      { class: "ex-btns" },
      button(
        { class: "ex-btn" },
        "−",
        on("click", () => { count--; update(); }),
      ),
      button(
        { class: "ex-btn primary" },
        "Reset",
        on("click", () => { count = 0; update(); }),
      ),
      button(
        { class: "ex-btn" },
        "+",
        on("click", () => { count++; update(); }),
      ),
    ),
  );
}

// ── Todo demo ─────────────────────────────────────────────────────────────────
function TodoDemo() {
  let todos: { id: number; text: string; done: boolean }[] = [];
  let filter: "all" | "active" | "done" = "all";
  let nextId = 1;
  let inputValue = "";
  let domInput: HTMLInputElement | null = null;

  const inputEl = input(
    { type: "text", placeholder: "Add a task…", class: "ex-input" } as any,
    on("input", (e) => { inputValue = (e.target as HTMLInputElement).value; }),
    on("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); }),
    ((el: any) => { domInput = el; }) as any,
  );

  function visible() {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "done")   return todos.filter(t => t.done);
    return todos;
  }

  function addTodo() {
    const v = inputValue.trim();
    if (!v) return;
    todos.push({ id: nextId++, text: v, done: false });
    inputValue = "";
    if (domInput) domInput.value = "";
    update();
  }

  function FilterBtn(label: string, f: "all" | "active" | "done") {
    return button(
      { class: () => `ex-filter${filter === f ? " active" : ""}` },
      label,
      on("click", () => { filter = f; update(); }),
    );
  }

  return div(
    { class: "ex-todo" },
    div(
      { class: "ex-row" },
      inputEl,
      button(
        { class: "ex-btn primary" },
        "Add",
        on("click", addTodo),
      ),
    ),
    div(
      { class: "ex-filters" },
      FilterBtn("All", "all"),
      FilterBtn("Active", "active"),
      FilterBtn("Done", "done"),
    ),
    div(
      { class: "ex-list" },
      list(
        () => visible(),
        (t) => div(
          { class: () => `ex-item${t.done ? " done" : ""}` },
          input(
            { type: "checkbox" },
            { checked: () => t.done },
            on("change", () => { t.done = !t.done; update(); }),
          ),
          span({ class: "ex-item-text" }, t.text),
          button(
            { class: "ex-item-del" },
            "×",
            on("click", () => {
              todos = todos.filter(x => x.id !== t.id);
              update();
            }),
          ),
        ),
      ),
      when(
        () => visible().length === 0,
        div({ class: "ex-empty" }, "No tasks yet."),
      ),
    ),
    div(
      { class: "ex-count-summary" },
      () => {
        const remaining = todos.filter(t => !t.done).length;
        return `${remaining} of ${todos.length} remaining`;
      },
    ),
  );
}

// ── Search demo ───────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { name: "Alice Chen",    email: "alice@example.com",   initials: "AC" },
  { name: "Bob Smith",     email: "bob@example.com",     initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park",    email: "diana@example.com",   initials: "DP" },
  { name: "Ethan Moore",   email: "ethan@example.com",   initials: "EM" },
];

function SearchDemo() {
  let query = "";

  function results() {
    const q = query.toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  return div(
    { class: "ex-search" },
    input(
      {
        type: "text",
        placeholder: "Search users…",
        class: "ex-input ex-search-input",
      },
      on("input", (e) => {
        query = (e.target as HTMLInputElement).value;
        update();
      }),
    ),
    div(
      list(
        () => results(),
        (u) => div(
          { class: "ex-user-card" },
          div({ class: "ex-avatar" }, u.initials),
          div(
            div({ class: "ex-user-name" }, u.name),
            div({ class: "ex-user-email" }, u.email),
          ),
        ),
      ),
      when(
        () => results().length === 0,
        div({ class: "ex-no-results" }, "No users found."),
      ),
    ),
  );
}

// ── Async demo ────────────────────────────────────────────────────────────────
interface Product { id: number; title: string; category: string; }

function AsyncDemo() {
  type Status = "idle" | "loading" | "success" | "error";
  let status: Status = "idle";
  let products: Product[] = [];
  let errMsg = "";

  async function loadData() {
    status = "loading"; update();
    try {
      const res = await fetch("https://dummyjson.com/products?limit=3&select=title,category");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { products: Product[] };
      products = data.products;
      status = "success";
    } catch (e) {
      errMsg = e instanceof Error ? e.message : "Unknown error";
      status = "error";
    }
    update();
  }

  return div(
    { class: "ex-async" },
    div(
      { class: "ex-status-bar" },
      div({ class: () => `ex-status-dot ${status}` }),
      span(() => {
        if (status === "idle")    return "Ready to fetch";
        if (status === "loading") return "Fetching…";
        if (status === "success") return `Loaded ${products.length} products`;
        return "Error occurred";
      }),
    ),
    button(
      {
        class: () => `ex-btn primary${status === "loading" ? " disabled" : ""}`,
        disabled: () => status === "loading",
      },
      () => status === "loading" ? "Loading…" : "Fetch Data",
      on("click", loadData),
    ),
    when(
      () => status === "success",
      div(
        cn(marginTop("12px")),
        list(
          () => products,
          (p) => div(
            { class: "ex-product-card" },
            div({ class: "ex-product-title" }, p.title),
            div({ class: "ex-product-cat" }, p.category),
          ),
        ),
      ),
    ),
    when(
      () => status === "error",
      div(
        { class: "ex-error-msg" },
        cn(marginTop("12px")),
        () => `Error: ${errMsg}`,
      ),
    ),
  );
}

// ── Examples page ─────────────────────────────────────────────────────────────
export function ExamplesPage() {
  const pageHeader = div(
    cn(
      padding("56px 0 32px").borderBottom(`1px solid ${colors.border}`)
    ),
    div(
      s.container,
      div(s.sectionLabel, cn(marginBottom("12px")), "Examples"),
      h1(
        cn(
          fontSize("clamp(2rem, 4vw, 3rem)").fontWeight("700")
            .letterSpacing("-0.02em").lineHeight("1.15").marginBottom("16px")
        ),
        "Practical examples.",
        br(),
        "Live demos.",
      ),
      p(
        cn(fontSize("1.05rem").color(colors.textDim).maxWidth("500px").lineHeight("1.7")),
        "Click the tabs to switch between a live interactive demo and the source code.",
      ),
    ),
  );

  return div(
    { id: "examples-page" },
    pageHeader,
    div(
      s.container,
      div(
        { class: "examples-grid" },
        ...EXAMPLES.map(ex => ExampleCard(ex)),
      ),
    ),
  );
}
