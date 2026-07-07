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
    id: "search",
    title: "Search Filter",
    desc: "Live search that filters a list of users as you type with state and update().",
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

  {
    id: "styling",
    title: "Atomic Styling",
    desc: "createCss() with theme tokens and screens. cx() composes styles with last-wins conflict resolution.",
    code: `import 'nuclo'

// Themed instance — tokens autocomplete, screens become variant keys
const { css, cx } = createCss({
  colors: {
    primary: "#ff3f00",
    primaryHover: "#d92d00",
    text: "#1f2937",
    muted: "#6b7280",
    surface: "#f8fafc",
    border: "#e2e8f0",
  },
  screens: {
    sm: "(min-width: 480px)",
  },
})

// Base chip style — shared across active and inactive states
const chip = css({
  display: "inline-flex",
  items: "center",
  px: 14,
  py: 6,
  rounded: 999,
  text: 13,
  weight: 600,
  cursor: "pointer",
  border: "2px solid transparent",
  transition: "all 0.15s",
  sm: { px: 18 },
})

// State variants — cx() picks the last one that defines each property
const chipDefault = css({
  bg: "surface",
  color: "muted",
  borderColor: "border",
  hover: { color: "text", borderColor: "primary" },
})

const chipActive = css({
  bg: "primary",
  color: "white",
  borderColor: "primaryHover",
  hover: { bg: "primaryHover" },
})

const TAGS = ["TypeScript", "Atomic CSS", "Tokens", "cx()", "Screens", "SSR"]

let selected = new Set<string>()

export function StyleDemo() {
  function toggle(tag: string) {
    if (selected.has(tag)) selected.delete(tag)
    else selected.add(tag)
    update()
  }

  return div(
    { class: "ex-style-demo" },
    p({ class: "ex-style-hint" },
      "Click tags to toggle them. Active tags use the ",
      code("primary"),
      " color token — cx() resolves conflicts per property."
    ),
    div(
      { class: "ex-style-chips" },
      ...TAGS.map(tag =>
        button(
          // cx merges chip + state variant; same property = last wins
          () => cx(chip, selected.has(tag) ? chipActive : chipDefault),
          tag,
          on("click", () => toggle(tag)),
        )
      ),
    ),
    p({ class: "ex-style-result" },
      () => selected.size > 0
        ? \`Selected: \${[...selected].join(", ")}\`
        : "Nothing selected yet."
    ),
  )
}`,
  },

  {
    id: "chart",
    title: "Interactive Chart",
    desc: "SVG chart with bar, line, and pie types. Switch views with a dropdown powered by Nuclo + SVG.",
    code: `import 'nuclo'

type ChartType = "bar" | "line" | "pie"

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
let data = [42, 78, 55, 91, 64, 83, 37]

const COLORS = [
  "#ff3f00", "#38bdf8", "#f59e0b",
  "#fb7185", "#a78bfa", "#34d399", "#f97316",
]

let chartType: ChartType = "bar"

const ANIM_MS = 420
let animId = 0

function chartValue(i: number) {
  return Math.round(data[i])
}

function randomize() {
  const from = [...data]
  const to = LABELS.map(() => 10 + Math.floor(Math.random() * 90))
  const start = performance.now()
  cancelAnimationFrame(animId)

  function tick(now: number) {
    const t = Math.min((now - start) / ANIM_MS, 1)
    const ease = 1 - Math.pow(1 - t, 3)
    for (let i = 0; i < from.length; i++)
      data[i] = t === 1 ? to[i] : from[i] + (to[i] - from[i]) * ease
    update()
    if (t < 1) animId = requestAnimationFrame(tick)
  }
  animId = requestAnimationFrame(tick)
}

function BarChart() {
  const W = 320, H = 180, PAD = 32, GAP = 8
  const barW = (W - PAD * 2 - GAP * (LABELS.length - 1)) / LABELS.length
  const chartH = H - PAD - 24

  return svgSvg(
    { viewBox: \`0 0 \${W} \${H}\`, width: "100%", height: "100%" },
    list(
      () => LABELS,
      (label, i) => {
        const x = PAD + i * (barW + GAP)
        return gSvg(
          rectSvg({
            x: String(x),
            y: () => { const m = Math.max(...data); return String(PAD + chartH - (data[i] / m) * chartH) },
            width: String(barW),
            height: () => { const m = Math.max(...data); return String((data[i] / m) * chartH) },
            rx: "3", fill: COLORS[i], opacity: "0.85",
          }),
          textSvg(
            { x: String(x + barW / 2), y: String(H - 4),
              "text-anchor": "middle", fill: "#607970", "font-size": "9" },
            label,
          ),
          textSvg(
            { x: String(x + barW / 2),
              y: () => { const m = Math.max(...data); return String(PAD + chartH - (data[i] / m) * chartH - 5) },
              "text-anchor": "middle", fill: "#9db6ad", "font-size": "9" },
            () => String(chartValue(i)),
          ),
        )
      },
    ),
  )
}

function points() {
  const W = 320, H = 180, PAD = 32
  const chartH = H - PAD - 24
  const stepX = (W - PAD * 2) / (LABELS.length - 1)
  const max = Math.max(...data)
  return LABELS.map((label, i) => ({
    label, value: data[i],
    x: PAD + i * stepX,
    y: PAD + chartH - (data[i] / max) * chartH,
  }))
}

function LineChart() {
  const W = 320, H = 180, PAD = 32
  const chartH = H - PAD - 24

  return svgSvg(
    { viewBox: \`0 0 \${W} \${H}\`, width: "100%", height: "100%" },
    pathSvg({
      d: () => {
        const pts = points()
        return \`M\${pts[0].x},\${PAD + chartH} \` +
          pts.map(p => \`L\${p.x},\${p.y}\`).join(" ") +
          \` L\${pts[pts.length - 1].x},\${PAD + chartH} Z\`
      },
      fill: "#ff3f00", opacity: "0.1",
    }),
    polylineSvg({
      points: () => points().map(p => \`\${p.x},\${p.y}\`).join(" "),
      fill: "none", stroke: "#ff3f00", "stroke-width": "2.5",
      "stroke-linejoin": "round", "stroke-linecap": "round",
    }),
    list(
      () => points(),
      (p, i) => gSvg(
        circleSvg({
          cx: String(p.x), cy: String(p.y), r: "4",
          fill: "#101817", stroke: "#ff3f00", "stroke-width": "2",
        }),
        textSvg(
          { x: String(p.x), y: String(H - 4),
            "text-anchor": "middle", fill: "#607970", "font-size": "9" },
          p.label,
        ),
        textSvg(
          { x: String(p.x), y: String(p.y - 9),
            "text-anchor": "middle", fill: "#9db6ad", "font-size": "9" },
          () => String(chartValue(i)),
        ),
      ),
    ),
  )
}

function slices() {
  const CX = 160, CY = 90, R = 70
  const total = data.reduce((s, v) => s + v, 0)
  let angle = -Math.PI / 2
  return data.map((v, i) => {
    const sweep = (v / total) * Math.PI * 2
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    const x2 = CX + R * Math.cos(angle + sweep)
    const y2 = CY + R * Math.sin(angle + sweep)
    const lg = sweep > Math.PI ? 1 : 0
    const mid = angle + sweep / 2
    const sl = {
      d: \`M\${CX},\${CY} L\${x1},\${y1} A\${R},\${R} 0 \${lg},1 \${x2},\${y2} Z\`,
      color: COLORS[i], value: v,
      mx: CX + R * 0.65 * Math.cos(mid),
      my: CY + R * 0.65 * Math.sin(mid),
    }
    angle += sweep
    return sl
  })
}

function PieChart() {
  return svgSvg(
    { viewBox: "0 0 320 180", width: "100%", height: "100%" },
    list(
      () => slices(),
      (sl, i) => gSvg(
        pathSvg({
          d: sl.d, fill: sl.color, opacity: "0.85",
          stroke: "#0b1211", "stroke-width": "1.5",
        }),
        textSvg(
          { x: String(sl.mx), y: String(sl.my + 3),
            "text-anchor": "middle", fill: "#fff",
            "font-size": "8", "font-weight": "600" },
          () => String(chartValue(i)),
        ),
      ),
    ),
  )
}

export function Chart() {
  return div(
    { class: "ex-chart" },
    div(
      { class: "ex-chart-controls" },
      label({ class: "ex-chart-label" }, "Chart Type"),
      select(
        { class: "ex-chart-select" },
        option({ value: "bar", selected: true }, "Bar"),
        option({ value: "line" }, "Line"),
        option({ value: "pie" }, "Pie"),
        on("change", (e) => {
          chartType = (e.target as HTMLSelectElement).value as ChartType
          update()
        }),
      ),
      button(
        { class: "ex-btn" },
        "Randomize",
        on("click", randomize),
      ),
    ),
    div(
      { class: "ex-chart-area" },
      when(() => chartType === "bar",  BarChart()),
      when(() => chartType === "line", LineChart()),
      when(() => chartType === "pie",  PieChart()),
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

];
