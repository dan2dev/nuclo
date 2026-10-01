import { cx, s } from "../styles.ts";
import { EXAMPLES } from "../content/examples.ts";
import { es } from "./examples/styles.ts";
import { ExampleCard } from "./examples/card.ts";
import { StylingGallery } from "./examples/styling-gallery.ts";

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
      button(es.button, "-", { onClick: () => { count--; update(); } }),
      button({ class: cx(es.button, es.buttonPrimary).className }, "Reset", { onClick: () => { count = 0; update(); } }),
      button(es.button, "+", { onClick: () => { count++; update(); } }),
    ),
  );
}

function CloseIcon() {
  return svgSvg(
    { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "aria-hidden": "true" },
    pathSvg({ d: "M6 6l12 12 M18 6L6 18" }),
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
    { type: "text", placeholder: "Add a task...", "aria-label": "New task" } as any,
    { onInput: (e) => { inputValue = (e.target as HTMLInputElement).value; } },
    { onKeyDown: (e) => { if ((e as KeyboardEvent).key === "Enter") addTodo(); } },
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
      {
        class: () => cx(es.filter, filter === nextFilter ? es.filterActive : null).className,
        "aria-pressed": () => String(filter === nextFilter),
      },
      label,
      { onClick: () => { filter = nextFilter; update(); } },
    );
  }

  return div(
    es.todo,
    div(
      es.row,
      inputEl,
      button(es.button, es.buttonPrimary, "Add", { onClick: addTodo }),
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
            { onChange: () => { todo.done = !todo.done; update(); } },
          ),
          span(es.itemText, { class: () => cx(es.itemText, todo.done ? es.itemDoneText : null).className }, todo.text),
          button(
            es.itemDelete,
            { "aria-label": `Delete "${todo.text}"` },
            CloseIcon(),
            {
              onClick: () => {
                todos = todos.filter(x => x.id !== todo.id);
                update();
              },
            },
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
      { type: "text", placeholder: "Search users...", "aria-label": "Search users" },
      {
        onInput: (e) => {
          query = (e.target as HTMLInputElement).value;
          update();
        },
      },
    ),
    div(
      es.list,
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
      when(() => results().length === 0, div(es.empty, "No users found.")),
    ),
  );
}

// Bound to the site's own theme custom properties (not fixed hex) so this button
// actually switches with light/dark mode instead of always rendering light-on-transparent.
const { css: demoCss, cx: demoCx } = createCss({
  colors: {
    primary: "var(--c-primary)",
    border: "var(--c-border-light)",
    text: "var(--c-text)",
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
      { onClick: () => { selected = !selected; update(); } },
    ),
  );
}

export function ExamplesPage() {
  const pageHeader = div(
    es.header,
    div(
      s.container,
      div(s.sectionLabel, "Examples"),
      h1(s.sectionTitle, "Practical examples. Live demos."),
      p(
        s.sectionSub,
        "Explore small Nuclo patterns with interactive previews and source code beside each behavior.",
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
        ...EXAMPLES.map((ex, index) => ExampleCard({ ...ex, preview: () => buildPreview(ex.id) }, index)),
      ),
    ),
    StylingGallery(),
  );
}
