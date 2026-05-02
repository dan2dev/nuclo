export interface ExampleEntry {
  id: string;
  title: string;
  desc: string;
  code: string;
}

export const EXAMPLES: ExampleEntry[] = [
  {
    id: "counter",
    title: "Counter",
    desc: "Minimal counter demo: mutate state, call update(), and let dynamic text refresh.",
    code: `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    { class: "ex-counter" },
    div({ class: "ex-count-val" }, () => String(count)),
    div({ class: "ex-count-label" }, "COUNT"),
    div(
      { class: "ex-btns" },
      button(
        { class: "ex-btn" },
        "-",
        on("click", () => { count--; update() }),
      ),
      button(
        { class: "ex-btn primary" },
        "Reset",
        on("click", () => { count = 0; update() }),
      ),
      button(
        { class: "ex-btn" },
        "+",
        on("click", () => { count++; update() }),
      ),
    ),
  )
}`,
  },
  {
    id: "todo",
    title: "Todo List",
    desc: "Add, complete, and delete tasks. Filter by all / active / done. Classic todo with Nuclo state.",
    code: `import 'nuclo'

interface Todo {
  id: number
  text: string
  done: boolean
}

let todos: Todo[] = []
let filter: "all" | "active" | "done" = "all"
let nextId = 1
let inputValue = ""
let domInput: HTMLInputElement | null = null

export function TodoList() {
  const inputEl = input(
    { type: "text", placeholder: "Add a task...", class: "ex-input" },
    on("input", (e) => {
      inputValue = (e.target as HTMLInputElement).value
    }),
    on("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") addTodo()
    }),
    ((el: HTMLInputElement) => { domInput = el }) as any,
  )

  function visible() {
    if (filter === "active") return todos.filter(t => !t.done)
    if (filter === "done") return todos.filter(t => t.done)
    return todos
  }

  function addTodo() {
    const value = inputValue.trim()
    if (!value) return

    todos.push({ id: nextId++, text: value, done: false })
    inputValue = ""
    if (domInput) domInput.value = ""
    update()
  }

  function FilterButton(label: string, next: typeof filter) {
    return button(
      { class: () => \`ex-filter\${filter === next ? " active" : ""}\` },
      label,
      on("click", () => { filter = next; update() }),
    )
  }

  return div(
    { class: "ex-todo" },
    div(
      { class: "ex-row" },
      inputEl,
      button({ class: "ex-btn primary" }, "Add", on("click", addTodo)),
    ),
    div(
      { class: "ex-filters" },
      FilterButton("All", "all"),
      FilterButton("Active", "active"),
      FilterButton("Done", "done"),
    ),
    div(
      { class: "ex-list" },
      list(
        () => visible(),
        (todo) => div(
          { class: () => \`ex-item\${todo.done ? " done" : ""}\` },
          input(
            { type: "checkbox" },
            { checked: () => todo.done },
            on("change", () => { todo.done = !todo.done; update() }),
          ),
          span({ class: "ex-item-text" }, todo.text),
          button(
            { class: "ex-item-del" },
            "x",
            on("click", () => {
              todos = todos.filter(x => x.id !== todo.id)
              update()
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
        const remaining = todos.filter(t => !t.done).length
        return \`\${remaining} of \${todos.length} remaining\`
      },
    ),
  )
}`,
  },
  {
    id: "search",
    title: "Search Filter",
    desc: "Live search that filters a list of users as you type. Zero libraries, just state and update().",
    code: `import 'nuclo'

const USERS = [
  { name: "Alice Chen", email: "alice@example.com", initials: "AC" },
  { name: "Bob Smith", email: "bob@example.com", initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park", email: "diana@example.com", initials: "DP" },
  { name: "Ethan Moore", email: "ethan@example.com", initials: "EM" },
]

let query = ""

function results() {
  const q = query.toLowerCase()
  if (!q) return USERS

  return USERS.filter(user =>
    user.name.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  )
}

export function SearchFilter() {
  return div(
    { class: "ex-search" },
    input(
      {
        type: "text",
        placeholder: "Search users...",
        class: "ex-input ex-search-input",
      },
      on("input", (e) => {
        query = (e.target as HTMLInputElement).value
        update()
      }),
    ),
    div(
      list(
        () => results(),
        (user) => div(
          { class: "ex-user-card" },
          div({ class: "ex-avatar" }, user.initials),
          div(
            div({ class: "ex-user-name" }, user.name),
            div({ class: "ex-user-email" }, user.email),
          ),
        ),
      ),
      when(
        () => results().length === 0,
        div({ class: "ex-no-results" }, "No users found."),
      ),
    ),
  )
}`,
  },
  {
    id: "async",
    title: "Loading States",
    desc: "Async data fetching with idle / loading / success / error states. No special async API needed.",
    code: `import 'nuclo'

interface Product {
  id: number
  title: string
  category: string
}

type Status = "idle" | "loading" | "success" | "error"

let status: Status = "idle"
let products: Product[] = []
let errMsg = ""

async function loadData() {
  status = "loading"
  update()

  try {
    const res = await fetch(
      "https://dummyjson.com/products?limit=3&select=title,category"
    )
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`)

    const data = await res.json() as { products: Product[] }
    products = data.products
    status = "success"
  } catch (error) {
    errMsg = error instanceof Error ? error.message : "Unknown error"
    status = "error"
  }

  update()
}

export function AsyncExample() {
  return div(
    { class: "ex-async" },
    div(
      { class: "ex-status-bar" },
      div({ class: () => \`ex-status-dot \${status}\` }),
      span(() => {
        if (status === "idle") return "Ready to fetch"
        if (status === "loading") return "Fetching..."
        if (status === "success") return \`Loaded \${products.length} products\`
        return "Error occurred"
      }),
    ),
    button(
      {
        class: () => \`ex-btn primary\${status === "loading" ? " disabled" : ""}\`,
        disabled: () => status === "loading",
      },
      () => status === "loading" ? "Loading..." : "Fetch Data",
      on("click", loadData),
    ),
    when(
      () => status === "success",
      div(
        { style: { marginTop: "12px" } },
        list(
          () => products,
          (product) => div(
            { class: "ex-product-card" },
            div({ class: "ex-product-title" }, product.title),
            div({ class: "ex-product-cat" }, product.category),
          ),
        ),
      ),
    ),
    when(
      () => status === "error",
      div(
        { class: "ex-error-msg", style: { marginTop: "12px" } },
        () => \`Error: \${errMsg}\`,
      ),
    ),
  )
}`,
  },
];
