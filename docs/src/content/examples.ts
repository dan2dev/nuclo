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
    button("-", on("click", () => { count--; update() })),
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
let text = ""
let nextId = 1

function addTodo() {
  if (!text.trim()) return

  todos.push({ id: nextId++, text, done: false })
  text = ""
  update()
}

export function TodoList() {
  return div(
    input(
      { placeholder: "Add a task" },
      on("input", (event) => {
        text = (event.target as HTMLInputElement).value
      }),
    ),
    button("Add", on("click", addTodo)),
    ul(
      list(
        () => todos,
        (todo) => li(
          input(
            { type: "checkbox", checked: () => todo.done },
            on("change", () => { todo.done = !todo.done; update() }),
          ),
          span(() => todo.done ? todo.text + " done" : todo.text),
        ),
      ),
    ),
  )
}`,
  },
  {
    id: "search",
    title: "Search Filter",
    desc: "Filter an array with plain JavaScript and render it with list().",
    code: `import 'nuclo'

const users = ["Alice", "Bob", "Charlie", "Diana"]
let query = ""

function visibleUsers() {
  return users.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
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
    ul(
      list(
        () => visibleUsers(),
        (name) => li(name),
      ),
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
  },
})

const baseButton = css({
  px: 12,
  py: 8,
  rounded: 6,
  border: "1px solid",
  borderColor: "border",
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
