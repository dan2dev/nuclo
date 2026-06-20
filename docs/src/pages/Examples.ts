import { css, colors, s } from "../styles.ts";
import { EXAMPLES } from "../content/examples.ts";
import { CodeBlock } from "../components/CodeBlock.ts";

function ExampleCard(ex: typeof EXAMPLES[number], index: number) {
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
      div(
        { class: "ecard-meta-row" },
        div({ class: "ecard-badge" }, "● Live"),
        div({ class: "ecard-number" }, String(index + 1).padStart(2, "0")),
      ),
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
      { class: () => `epane epane-preview${activeTab === "preview" ? " on" : ""}` },
      div(
        { class: "epreview" },
        buildPreview(ex.id),
      ),
    ),
    // Code pane
    div(
      { class: () => `epane epane-code${activeTab === "code" ? " on" : ""}` },
      CodeBlock({ filename: `${ex.title.replace(/\s+/g, "")}.ts`, code: ex.code }),
    ),
  );
}

function buildPreview(id: string) {
  switch (id) {
    case "counter": return CounterDemo();
    case "todo":    return TodoDemo();
    case "search":  return SearchDemo();
    case "async":   return AsyncDemo();
    case "styling": return StyleDemo();
    case "chart":   return ChartDemo();
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
        css({ marginTop: "12px" }),
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
        css({ marginTop: "12px" }),
        () => `Error: ${errMsg}`,
      ),
    ),
  );
}

// ── Styling demo ──────────────────────────────────────────────────────────────
const { css: demoCSS, cx: demoCX } = createCss({
  colors: {
    primary: "#14b8a6",
    primaryHover: "#0f766e",
    text: "#1f2937",
    muted: "#6b7280",
    surface: "#f8fafc",
    border: "#e2e8f0",
  },
  screens: { sm: "(min-width: 480px)" },
});

const demoChip = demoCSS({
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  border: "2px solid transparent",
  transition: "all 0.15s",
  sm: { padding: "6px 18px" },
});
const demoChipDefault = demoCSS({
  backgroundColor: "#f8fafc",
  color: "#6b7280",
  borderColor: "#e2e8f0",
  hover: { color: "#1f2937", borderColor: "#14b8a6" },
});
const demoChipActive = demoCSS({
  backgroundColor: "#14b8a6",
  color: "white",
  borderColor: "#0f766e",
  hover: { backgroundColor: "#0f766e" },
});

function StyleDemo() {
  const TAGS = ["TypeScript", "Atomic CSS", "Tokens", "cx()", "Screens", "SSR"];
  let selected = new Set<string>();

  function toggle(tag: string) {
    if (selected.has(tag)) selected.delete(tag);
    else selected.add(tag);
    update();
  }

  return div(
    { class: "ex-style-demo" },
    p({ class: "ex-style-hint" },
      "Click tags to toggle them. Active tags use the ",
      code("primary"),
      " color token — ",
      code("cx()"),
      " resolves conflicts per property.",
    ),
    div(
      { class: "ex-style-chips" },
      ...TAGS.map(tag =>
        button(
          { class: () => demoCX(demoChip, selected.has(tag) ? demoChipActive : demoChipDefault).className },
          tag,
          on("click", () => toggle(tag)),
        ),
      ),
    ),
    p({ class: "ex-style-result" },
      () => selected.size > 0
        ? `Selected: ${[...selected].join(", ")}`
        : "Nothing selected yet.",
    ),
  );
}

// ── Chart demo ───────────────────────────────────────────────────────────────
const chartStyles = {
  root: css({ w: "100%", maxW: "380px" }),
  controls: css({ display: "flex", items: "center", gap: "10px", mb: "14px" }),
  label: css({ text: "0.82rem", weight: "600", color: colors.textDim }),
  select: css({
    flex: "1", p: "8px 12px", rounded: "6px",
    border: `1px solid ${colors.borderLight}`,
    bg: colors.bgSecondary, color: colors.text,
    fontFamily: "'Space Grotesk', system-ui, sans-serif", text: "0.85rem",
    outline: "none", cursor: "pointer", transition: "border-color 0.18s ease",
    raw: { appearance: "none" },
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23607970'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    pr: "30px",
    focus: { borderColor: colors.primary },
  }),
  area: css({
    bg: colors.bgSecondary, border: `1px solid ${colors.border}`,
    rounded: "8px", p: "20px 16px", minH: "200px",
    display: "flex", items: "center", justify: "center",
  }),
  svg: css({ display: "block", maxW: "100%" }),
};

const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let chartData = [42, 78, 55, 91, 64, 83, 37];

const CHART_COLORS = [
  "#14b8a6", "#38bdf8", "#f59e0b",
  "#fb7185", "#a78bfa", "#34d399", "#f97316",
];

const ANIM_MS = 350;
let animId = 0;

function randomizeChartData() {
  const from = [...chartData];
  const to = CHART_LABELS.map(() => 10 + Math.floor(Math.random() * 90));
  const start = performance.now();
  cancelAnimationFrame(animId);

  function tick() {
    const t = Math.min((performance.now() - start) / ANIM_MS, 1);
    const ease = 1 - (1 - t) * (1 - t);
    for (let i = 0; i < from.length; i++) {
      chartData[i] = Math.round(from[i] + (to[i] - from[i]) * ease);
    }
    update();
    if (t < 1) animId = requestAnimationFrame(tick);
  }
  animId = requestAnimationFrame(tick);
}

function BarChart() {
  const W = 320, H = 180, PAD = 32, BAR_GAP = 8;
  const barW = (W - PAD * 2 - BAR_GAP * (CHART_LABELS.length - 1)) / CHART_LABELS.length;
  const chartH = H - PAD - 24;

  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", class: chartStyles.svg.className },
    list(
      () => CHART_LABELS,
      (label, i) => {
        const x = PAD + i * (barW + BAR_GAP);
        return gSvg(
          rectSvg({
            x: String(x),
            y: () => { const max = Math.max(...chartData); return String(PAD + chartH - (chartData[i] / max) * chartH); },
            width: String(barW),
            height: () => { const max = Math.max(...chartData); return String((chartData[i] / max) * chartH); },
            rx: "3", fill: CHART_COLORS[i], opacity: "0.85",
          }),
          textSvg(
            {
              x: String(x + barW / 2), y: String(H - 4),
              "text-anchor": "middle",
              fill: "var(--c-text-muted)", "font-size": "9",
              "font-family": "'Space Grotesk', sans-serif",
            },
            label,
          ),
          textSvg(
            {
              x: String(x + barW / 2),
              y: () => { const max = Math.max(...chartData); return String(PAD + chartH - (chartData[i] / max) * chartH - 5); },
              "text-anchor": "middle",
              fill: "var(--c-text-dim)", "font-size": "9",
              "font-family": "'JetBrains Mono', monospace",
            },
            () => String(chartData[i]),
          ),
        );
      },
    ),
  );
}

function chartPoints() {
  const W = 320, H = 180, PAD = 32;
  const chartH = H - PAD - 24;
  const stepX = (W - PAD * 2) / (CHART_LABELS.length - 1);
  const max = Math.max(...chartData);
  return CHART_LABELS.map((label, i) => ({
    label,
    value: chartData[i],
    x: PAD + i * stepX,
    y: PAD + chartH - (chartData[i] / max) * chartH,
  }));
}

function LineChart() {
  const W = 320, H = 180, PAD = 32;
  const chartH = H - PAD - 24;

  return svgSvg(
    { viewBox: `0 0 ${W} ${H}`, width: "100%", height: "100%", class: chartStyles.svg.className },
    pathSvg({
      d: () => {
        const pts = chartPoints();
        return `M${pts[0].x},${PAD + chartH} ${pts.map(p => `L${p.x},${p.y}`).join(" ")} L${pts[pts.length - 1].x},${PAD + chartH} Z`;
      },
      fill: "var(--c-primary)", opacity: "0.1",
    }),
    polylineSvg({
      points: () => chartPoints().map(p => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: "var(--c-primary)", "stroke-width": "2.5",
      "stroke-linejoin": "round", "stroke-linecap": "round",
    }),
    list(
      () => chartPoints(),
      (p) => gSvg(
        circleSvg({
          cx: String(p.x), cy: String(p.y), r: "4",
          fill: "var(--c-bg-card)", stroke: "var(--c-primary)", "stroke-width": "2",
        }),
        textSvg(
          {
            x: String(p.x), y: String(H - 4),
            "text-anchor": "middle",
            fill: "var(--c-text-muted)", "font-size": "9",
            "font-family": "'Space Grotesk', sans-serif",
          },
          p.label,
        ),
        textSvg(
          {
            x: String(p.x), y: String(p.y - 9),
            "text-anchor": "middle",
            fill: "var(--c-text-dim)", "font-size": "9",
            "font-family": "'JetBrains Mono', monospace",
          },
          String(p.value),
        ),
      ),
    ),
  );
}

function pieSlices() {
  const CX = 160, CY = 90, R = 70;
  const total = chartData.reduce((s, v) => s + v, 0);
  let angle = -Math.PI / 2;
  return chartData.map((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(angle + sweep);
    const y2 = CY + R * Math.sin(angle + sweep);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const midAngle = angle + sweep / 2;
    const sl = {
      d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`,
      color: CHART_COLORS[i],
      value: v,
      midX: CX + (R * 0.65) * Math.cos(midAngle),
      midY: CY + (R * 0.65) * Math.sin(midAngle),
    };
    angle += sweep;
    return sl;
  });
}

function PieChart() {
  return svgSvg(
    { viewBox: "0 0 320 180", width: "100%", height: "100%", class: chartStyles.svg.className },
    list(
      () => pieSlices(),
      (sl) => gSvg(
        pathSvg({
          d: sl.d,
          fill: sl.color, opacity: "0.85",
          stroke: "var(--c-bg-code)", "stroke-width": "1.5",
        }),
        textSvg(
          {
            x: String(sl.midX), y: String(sl.midY + 3),
            "text-anchor": "middle",
            fill: "#fff", "font-size": "8", "font-weight": "600",
            "font-family": "'JetBrains Mono', monospace",
          },
          String(sl.value),
        ),
      ),
    ),
  );
}

function ChartDemo() {
  type ChartType = "bar" | "line" | "pie";
  let chartType: ChartType = "bar";

  return div(
    chartStyles.root,
    div(
      chartStyles.controls,
      label(chartStyles.label, "Chart Type"),
      select(
        chartStyles.select,
        option({ value: "bar" }, "Bar"),
        option({ value: "line" }, "Line"),
        option({ value: "pie" }, "Pie"),
        on("change", (e) => {
          chartType = (e.target as HTMLSelectElement).value as ChartType;
          update();
        }),
      ),
      button(
        { class: "ex-btn" },
        "Randomize",
        on("click", randomizeChartData),
      ),
    ),
    div(
      chartStyles.area,
      when(() => chartType === "bar", BarChart()),
      when(() => chartType === "line", LineChart()),
      when(() => chartType === "pie", PieChart()),
    ),
  );
}

// ── Examples page ─────────────────────────────────────────────────────────────
export function ExamplesPage() {
  const pageHeader = div(
    { class: "examples-hero" },
    div(
      s.container,
      div(
        { class: "examples-hero-inner" },
        div(
          div({ class: "examples-kicker" }, "Examples"),
          h1("Practical examples. Live demos."),
          p(
            { class: "examples-lead" },
            "Explore Nuclo patterns with interactive previews and the source code beside each behavior.",
          ),
        ),
        div(
          { class: "examples-facts" },
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
        { class: "examples-grid" },
        ...EXAMPLES.map((ex, index) => ExampleCard(ex, index)),
      ),
    ),
  );
}
