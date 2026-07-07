import { cx, s } from "../styles.ts";
import { EXAMPLES } from "../content/examples.ts";
import { CodeBlock } from "../components/CodeBlock.ts";
import { cardDelay, es } from "./examples/styles.ts";
import { StylingGallery } from "./examples/styling-gallery.ts";

function ExampleCard(ex: typeof EXAMPLES[number], index: number) {
  let activeTab: "preview" | "code" = "preview";

  function Tab(label: string, tab: "preview" | "code") {
    return button(
      es.tab,
      {
        class: () => cx(es.tab, activeTab === tab ? es.tabActive : null).className,
      },
      label,
      on("click", () => { activeTab = tab; update(); }),
    );
  }

  return div(
    es.card,
    cardDelay(index),
    div(
      es.cardTop,
      div(
        es.cardMetaRow,
        div(es.cardBadge, "Live"),
        div(es.cardNumber, String(index + 1).padStart(2, "0")),
      ),
      div(es.cardTitle, ex.title),
      div(es.cardDesc, ex.desc),
    ),
    div(
      es.tabs,
      Tab("Preview", "preview"),
      Tab("Code", "code"),
    ),
    div(
      es.pane,
      { class: () => cx(es.pane, activeTab === "preview" ? es.paneActive : null).className },
      div(es.previewPane, buildPreview(ex.id)),
    ),
    div(
      es.pane,
      { class: () => cx(es.pane, activeTab === "code" ? es.codePaneActive : null).className },
      CodeBlock({ filename: `${ex.title.replace(/\s+/g, "")}.ts`, code: ex.code }),
    ),
  );
}

function buildPreview(id: string) {
  switch (id) {
    case "counter": return CounterDemo();
    case "todo": return TodoDemo();
    case "search": return SearchDemo();
    case "styling": return StyleDemo();
    default: return div();
  }
}

function CounterDemo() {
  let count = 0;

  return div(
    es.counter,
    div(es.countValue, () => String(count)),
    div(es.countLabel, "COUNT"),
    div(
      es.buttonRow,
      button(es.button, "-", on("click", () => { count--; update(); })),
      button(es.button, es.buttonPrimary, "Reset", on("click", () => { count = 0; update(); })),
      button(es.button, "+", on("click", () => { count++; update(); })),
    ),
  );
}

function TodoDemo() {
  let todos: { id: number; text: string; done: boolean }[] = [];
  let filter: "all" | "active" | "done" = "all";
  let nextId = 1;
  let inputValue = "";
  let domInput: HTMLInputElement | null = null;

  const inputEl = input(
    es.input,
    { type: "text", placeholder: "Add a task..." } as any,
    on("input", (e) => { inputValue = (e.target as HTMLInputElement).value; }),
    on("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); }),
    ((el: HTMLInputElement) => { domInput = el; }) as any,
  );

  function visible() {
    if (filter === "active") return todos.filter(t => !t.done);
    if (filter === "done") return todos.filter(t => t.done);
    return todos;
  }

  function addTodo() {
    const value = inputValue.trim();
    if (!value) return;
    todos.push({ id: nextId++, text: value, done: false });
    inputValue = "";
    if (domInput) domInput.value = "";
    update();
  }

  function FilterBtn(label: string, nextFilter: "all" | "active" | "done") {
    return button(
      es.filter,
      { class: () => cx(es.filter, filter === nextFilter ? es.filterActive : null).className },
      label,
      on("click", () => { filter = nextFilter; update(); }),
    );
  }

  return div(
    es.todo,
    div(
      es.row,
      inputEl,
      button(es.button, es.buttonPrimary, "Add", on("click", addTodo)),
    ),
    div(
      es.filters,
      FilterBtn("All", "all"),
      FilterBtn("Active", "active"),
      FilterBtn("Done", "done"),
    ),
    div(
      es.list,
      list(
        () => visible(),
        (todo) => div(
          es.item,
          input(
            { type: "checkbox" },
            { checked: () => todo.done },
            on("change", () => { todo.done = !todo.done; update(); }),
          ),
          span(es.itemText, { class: () => cx(es.itemText, todo.done ? es.itemDoneText : null).className }, todo.text),
          button(
            es.itemDelete,
            "x",
            on("click", () => {
              todos = todos.filter(x => x.id !== todo.id);
              update();
            }),
          ),
        ),
      ),
      when(() => visible().length === 0, div(es.empty, "No tasks yet.")),
    ),
    div(
      es.countSummary,
      () => {
        const remaining = todos.filter(t => !t.done).length;
        return `${remaining} of ${todos.length} remaining`;
      },
    ),
  );
}

const MOCK_USERS = [
  { name: "Alice Chen", email: "alice@example.com", initials: "AC" },
  { name: "Bob Smith", email: "bob@example.com", initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park", email: "diana@example.com", initials: "DP" },
];

function SearchDemo() {
  let query = "";

  function results() {
    const q = query.toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter(user =>
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q)
    );
  }

  return div(
    es.search,
    input(
      es.input,
      es.searchInput,
      { type: "text", placeholder: "Search users..." },
      on("input", (e) => {
        query = (e.target as HTMLInputElement).value;
        update();
      }),
    ),
    div(
      list(
        () => results(),
        (user) => div(
          es.userCard,
          div(es.avatar, user.initials),
          div(
            div(es.userName, user.name),
            div(es.userEmail, user.email),
          ),
        ),
      ),
      when(() => results().length === 0, div(es.noResults, "No users found.")),
    ),
  );
}

const { css: demoCss, cx: demoCx } = createCss({
  colors: {
    primary: "#ff3f00",
    border: "#e5e7eb",
    text: "#1f2937",
  },
});

const demoButton = demoCss({
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
  color: "text",
  cursor: "pointer",
});

const demoButtonSelected = demoCss({
  bg: "primary",
  color: "white",
  borderColor: "primary",
});

function StyleDemo() {
  let selected = false;

  return div(
    es.styleDemo,
    p(
      es.styleHint,
      code("css()"),
      " creates the base class. ",
      code("cx()"),
      " adds the selected class only when state changes.",
    ),
    button(
      { class: () => demoCx(demoButton, selected ? demoButtonSelected : null).className },
      () => selected ? "Selected" : "Select",
      on("click", () => { selected = !selected; update(); }),
    ),
  );
}

export function ExamplesPage() {
  const pageHeader = div(
    es.hero,
    div(
      s.container,
      div(
        es.heroInner,
        div(
          div(es.kicker, "Examples"),
          h1(es.title, "Practical examples. Live demos."),
          p(
            es.lead,
            "Explore small Nuclo patterns with interactive previews and source code beside each behavior.",
          ),
        ),
        div(
          es.heroMarkWrap,
          img(es.heroMark, { src: "/nuclo-icon@3x.png", alt: "", "aria-hidden": "true" }),
        ),
      ),
    ),
  );

  return div(
    { id: "examples-page" },
    pageHeader,
    div(
      s.container,
      div(
        es.grid,
        ...EXAMPLES.map((ex, index) => ExampleCard(ex, index)),
      ),
    ),
    StylingGallery(),
  );
}
