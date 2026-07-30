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
    desc: "Mutate state, call update(), and dynamic text refreshes.",
    code: `import 'nuclo'

let count = 0

export function Counter() {
  return div(
    p(() => String(count)),
    p("COUNT"),
    button("-", on("click", () => { count--; update() })),
    button("Reset", on("click", () => { count = 0; update() })),
    button("+", on("click", () => { count++; update() })),
  )
}`,
  },
  {
    id: "todo",
    title: "Todo List",
    desc: "Use list() for repeated items and update() after each mutation.",
    code: `import 'nuclo'

interface Todo {
  id: number
  text: string
  done: boolean
}

let todos: Todo[] = []
let filter: "all" | "active" | "done" = "all"
let text = ""
let nextId = 1

function visible() {
  if (filter === "active") return todos.filter((t) => !t.done)
  if (filter === "done") return todos.filter((t) => t.done)
  return todos
}

function addTodo() {
  if (!text.trim()) return

  todos.push({ id: nextId++, text, done: false })
  text = ""
  update()
}

export function TodoList() {
  return div(
    input(
      { placeholder: "Add a task..." },
      on("input", (event) => {
        text = (event.target as HTMLInputElement).value
      }),
    ),
    button("Add", on("click", addTodo)),
    div(
      button("All", on("click", () => { filter = "all"; update() })),
      button("Active", on("click", () => { filter = "active"; update() })),
      button("Done", on("click", () => { filter = "done"; update() })),
    ),
    ul(
      list(
        () => visible(),
        (todo) => li(
          input(
            { type: "checkbox", checked: () => todo.done },
            on("change", () => { todo.done = !todo.done; update() }),
          ),
          span(() => todo.done ? todo.text + " done" : todo.text),
          button("x", on("click", () => {
            todos = todos.filter((item) => item.id !== todo.id)
            update()
          })),
        ),
      ),
      when(() => visible().length === 0, div("No tasks yet.")),
    ),
    p(() => \`\${todos.filter((t) => !t.done).length} of \${todos.length} remaining\`),
  )
}`,
  },
  {
    id: "search",
    title: "Search Filter",
    desc: "Filter an array with plain JavaScript and render it with list().",
    code: `import 'nuclo'

const users = [
  { name: "Alice Chen", email: "alice@example.com", initials: "AC" },
  { name: "Bob Smith", email: "bob@example.com", initials: "BS" },
  { name: "Charlie Davis", email: "charlie@example.com", initials: "CD" },
  { name: "Diana Park", email: "diana@example.com", initials: "DP" },
]
let query = ""

function results() {
  const q = query.toLowerCase()
  if (!q) return users
  return users.filter((user) =>
    user.name.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  )
}

export function SearchFilter() {
  return div(
    input(
      { placeholder: "Search users..." },
      on("input", (event) => {
        query = (event.target as HTMLInputElement).value
        update()
      }),
    ),
    div(
      list(
        () => results(),
        (user) => div(
          div(user.initials),
          div(user.name),
          div(user.email),
        ),
      ),
      when(() => results().length === 0, div("No users found.")),
    ),
  )
}`,
  },
  {
    id: "styling",
    title: "Styling",
    desc: "Use css() for classes and cx() for small conditional changes.",
    code: `import 'nuclo'

const { css, cx } = createCss({
  colors: {
    primary: "#ff3f00",
    border: "#e5e7eb",
    text: "#1f2937",
  },
})

const baseButton = css({
  px: 14,
  py: 9,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
  color: "text",
  cursor: "pointer",
})

const selectedButton = css({
  bg: "primary",
  color: "white",
  borderColor: "primary",
})

let selected = false

export function StyledButton() {
  return button(
    () => cx(baseButton, selected && selectedButton),
    () => selected ? "Selected" : "Select",
    on("click", () => { selected = !selected; update() }),
  )
}`,
  },
];
